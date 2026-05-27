import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeDueDate, computeFine, generateLoanCode } from "@/lib/loans";

/** Domain error that carries an HTTP status for the API layer. */
export class LoanError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "LoanError";
    this.status = status;
  }
}

/**
 * Borrow a book for a member. Atomically reserves a copy and creates a loan
 * with a unique loan code and a due date. Retries on the (rare) loan-code
 * collision.
 */
export async function borrowBook(memberId: string, bookId: string) {
  const duplicate = await prisma.loan.findFirst({
    where: { memberId, bookId, status: "active" },
  });
  if (duplicate) {
    throw new LoanError("You already have an active loan for this book", 409);
  }

  const borrowedAt = new Date();
  const dueDate = computeDueDate(borrowedAt);

  for (let attempt = 0; attempt < 5; attempt++) {
    const loanCode = generateLoanCode();
    try {
      return await prisma.$transaction(async (tx) => {
        const reserved = await tx.book.updateMany({
          where: { id: bookId, availableCopies: { gt: 0 } },
          data: { availableCopies: { decrement: 1 } },
        });

        if (reserved.count === 0) {
          const book = await tx.book.findUnique({ where: { id: bookId } });
          if (!book) throw new LoanError("Book not found", 404);
          throw new LoanError("No copies available to borrow", 409);
        }

        return tx.loan.create({
          data: {
            loanCode,
            memberId,
            bookId,
            borrowedAt,
            dueDate,
            status: "active",
          },
          include: { book: true },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue; // loanCode collided — try a new one
      }
      throw error;
    }
  }

  throw new LoanError(
    "Could not generate a unique loan code, please try again",
    500,
  );
}

/**
 * Mark a loan as returned: record the return date, compute the fine, and
 * release the copy back to the catalog.
 */
export async function returnLoan(loanId: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) throw new LoanError("Loan not found", 404);
    if (loan.returnedAt) {
      throw new LoanError("This loan was already returned", 409);
    }

    const returnedAt = new Date();
    const fineAmount = computeFine(loan.dueDate, returnedAt);

    await tx.book.update({
      where: { id: loan.bookId },
      data: {
        availableCopies: Math.min(
          loan.book.copies,
          loan.book.availableCopies + 1,
        ),
      },
    });

    return tx.loan.update({
      where: { id: loan.id },
      data: { returnedAt, fineAmount, status: "returned" },
      include: { book: true, member: true },
    });
  });
}
