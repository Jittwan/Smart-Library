import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { calculateFine, countOverdueWeekdays } from "@/lib/loans";
import { buildOverdueReportPdf, type OverdueRow } from "@/lib/pdf";
import { uploadOverdueReport } from "@/lib/supabase";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Librarian only: download a PDF of overdue members, books and fines.
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return jsonError("Unauthorized", 401);

  const now = new Date();

  const loans = await prisma.loan.findMany({
    where: { status: "active", dueDate: { lt: now } },
    include: { book: true, member: true },
    orderBy: [{ member: { name: "asc" } }, { dueDate: "asc" }],
  });

  const rows: OverdueRow[] = loans.map((loan) => ({
    memberName: loan.member.name,
    memberEmail: loan.member.email,
    bookTitle: loan.book.title,
    author: loan.book.author,
    dueDate: loan.dueDate,
    daysOverdue: countOverdueWeekdays(loan.dueDate, now),
    fine: calculateFine(loan.dueDate, now, loan.borrowedAt),
  }));

  const pdfBytes = await buildOverdueReportPdf(rows, now);
  const fileName = `overdue-report-${now.toISOString().slice(0, 10)}-${Date.now()}.pdf`;

  // Keep a copy in Supabase Storage. Best-effort: never block the download if
  // Storage is unavailable or not configured.
  try {
    await uploadOverdueReport(fileName, pdfBytes);
  } catch (error) {
    console.error("Overdue report storage upload failed:", error);
  }

  return new Response(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
