import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { computeFine, daysLate } from "@/lib/loans";
import { jsonError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

// Librarian only: active loans past their due date, with projected fines.
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return jsonError("Unauthorized", 401);

  const now = new Date();

  const loans = await prisma.loan.findMany({
    where: { status: "active", dueDate: { lt: now } },
    include: { book: true, member: true },
    orderBy: { dueDate: "asc" },
  });

  const overdue = loans.map((loan) => ({
    ...loan,
    daysOverdue: daysLate(loan.dueDate, now),
    projectedFine: computeFine(loan.dueDate, now),
  }));

  return jsonOk({ overdue });
}
