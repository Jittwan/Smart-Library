import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { borrowSchema } from "@/lib/validation";
import { getMemberSession } from "@/lib/auth";
import { borrowBook, LoanError } from "@/lib/loan-service";
import { jsonError, jsonOk, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Member: list own loans (active + history).
export async function GET() {
  const session = await getMemberSession();
  if (!session) return jsonError("Unauthorized", 401);

  const loans = await prisma.loan.findMany({
    where: { memberId: session.memberId },
    include: { book: true },
    orderBy: { borrowedAt: "desc" },
  });

  return jsonOk({ loans });
}

// Member: borrow a book → returns loan code and due date.
export async function POST(request: NextRequest) {
  const session = await getMemberSession();
  if (!session) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = borrowSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const loan = await borrowBook(session.memberId, parsed.data.bookId);
    return jsonOk(
      {
        loanCode: loan.loanCode,
        dueDate: loan.dueDate,
        book: loan.book,
      },
      201,
    );
  } catch (error) {
    if (error instanceof LoanError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}
