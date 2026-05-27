import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateDueDate,
  calculateFine,
  evaluateBorrow,
  generateLoanCode,
  type BorrowDecision,
  type LoanCategory,
} from "@/lib/loans";

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
 * Whether a member may borrow a given book right now. Applies all three
 * borrowing limits: max active loans, no overdue active loan, and availability.
 */
export async function canBorrow(
  memberId: string,
  bookId: string,
): Promise<BorrowDecision> {
  const now = new Date();
  const [activeLoanCount, overdueLoanCount, book] = await Promise.all([
    prisma.loan.count({ where: { memberId, returnedAt: null } }),
    prisma.loan.count({
      where: { memberId, returnedAt: null, dueDate: { lt: now } },
    }),
    prisma.book.findUnique({ where: { id: bookId } }),
  ]);

  if (!book) {
    return { ok: false, reason: "Book not found" };
  }

  return evaluateBorrow({
    activeLoanCount,
    hasOverdueLoan: overdueLoanCount > 0,
    availableCopies: book.availableCopies,
  });
}

/**
 * Borrow a book for a member. Enforces the borrowing limits, atomically
 * reserves a copy, and creates a loan with a unique loan code and a due date
 * based on the book's category. Retries on the (rare) loan-code collision.
 */
export async function borrowBook(memberId: string, bookId: string) {
  const decision = await canBorrow(memberId, bookId);
  if (!decision.ok) {
    const status = decision.reason === "Book not found" ? 404 : 409;
    throw new LoanError(decision.reason, status);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const loanCode = generateLoanCode();
    try {
      return await prisma.$transaction(async (tx) => {
        // Atomically reserve a copy; guards against a concurrent last copy.
        const reserved = await tx.book.updateMany({
          where: { id: bookId, availableCopies: { gt: 0 } },
          data: { availableCopies: { decrement: 1 } },
        });
        if (reserved.count === 0) {
          throw new LoanError("No copies available to borrow", 409);
        }

        const book = await tx.book.findUniqueOrThrow({ where: { id: bookId } });
        const borrowedAt = new Date();
        const dueDate = calculateDueDate(
          borrowedAt,
          book.category as LoanCategory,
        );

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
 * Librarian testing helper: create a loan with explicit dates so fines can be
 * exercised without waiting real days. Bypasses the borrowing limits on
 * purpose. If `returnedAt` is given the loan is created already returned (with
 * the computed fine) and no copy is reserved.
 */
export async function createAdminLoan(input: {
  memberId: string;
  bookId: string;
  borrowedAt?: Date;
  dueDate?: Date;
  returnedAt?: Date;
}) {
  const [book, member] = await Promise.all([
    prisma.book.findUnique({ where: { id: input.bookId } }),
    prisma.member.findUnique({ where: { id: input.memberId } }),
  ]);
  if (!member) throw new LoanError("Member not found", 404);
  if (!book) throw new LoanError("Book not found", 404);

  const borrowedAt = input.borrowedAt ?? new Date();
  const dueDate =
    input.dueDate ?? calculateDueDate(borrowedAt, book.category as LoanCategory);
  const returnedAt = input.returnedAt ?? null;
  const status = returnedAt ? "returned" : "active";
  const fineAmount = returnedAt
    ? calculateFine(dueDate, returnedAt, borrowedAt)
    : 0;

  for (let attempt = 0; attempt < 5; attempt++) {
    const loanCode = generateLoanCode();
    try {
      return await prisma.$transaction(async (tx) => {
        if (!returnedAt) {
          const reserved = await tx.book.updateMany({
            where: { id: book.id, availableCopies: { gt: 0 } },
            data: { availableCopies: { decrement: 1 } },
          });
          if (reserved.count === 0) {
            throw new LoanError("No copies available to borrow", 409);
          }
        }
        return tx.loan.create({
          data: {
            loanCode,
            memberId: input.memberId,
            bookId: input.bookId,
            borrowedAt,
            dueDate,
            returnedAt,
            fineAmount,
            status,
          },
          include: { book: true, member: true },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new LoanError("Could not generate a unique loan code", 500);
}

/**
 * Mark a loan as returned: record the return date, compute the fine, and
 * release the copy back to the catalog. `returnedAt` defaults to now but may be
 * set to any date (for testing fine calculations).
 */
export async function returnLoan(loanId: string, returnedAt: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });

    if (!loan) throw new LoanError("Loan not found", 404);
    if (loan.returnedAt) {
      throw new LoanError("This loan was already returned", 409);
    }

    const fineAmount = calculateFine(loan.dueDate, returnedAt, loan.borrowedAt);

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
