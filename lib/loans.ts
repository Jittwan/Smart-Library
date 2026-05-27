// Domain rules for lending: per-category loan periods, weekday-based fines,
// overdue detection, borrowing limits and loan codes.

export type LoanCategory = "textbook" | "general" | "novel";

/** Loan period in days, by book category. */
export const LOAN_PERIODS: Record<LoanCategory, number> = {
  textbook: 3,
  general: 7,
  novel: 14,
};

/** Fine charged per overdue weekday, in THB. */
export const FINE_PER_WEEKDAY = 20;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getLoanPeriodByCategory(category: LoanCategory): number {
  return LOAN_PERIODS[category];
}

/** Return a new Date `days` calendar days after `date`. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/** Due date = loan date + the category's loan period. */
export function calculateDueDate(loanDate: Date, category: LoanCategory): Date {
  return addDays(loanDate, getLoanPeriodByCategory(category));
}

function startOfDay(date: Date): Date {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

/**
 * Number of weekdays (Mon–Fri) strictly after `dueDate`, up to and including
 * `returnDate`. Saturdays and Sundays are not counted.
 */
export function countOverdueWeekdays(dueDate: Date, returnDate: Date): number {
  const end = startOfDay(returnDate);
  const cursor = startOfDay(dueDate);
  cursor.setDate(cursor.getDate() + 1); // start the day after the due date

  let count = 0;
  while (cursor.getTime() <= end.getTime()) {
    if (!isWeekend(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/**
 * Fine for returning a book at `returnDate` that was due on `dueDate`.
 * Fine applies only when the return is after the due date, and is charged per
 * overdue weekday. A return on the loan date is always free.
 */
export function calculateFine(
  dueDate: Date,
  returnDate: Date,
  loanDate?: Date,
): number {
  if (loanDate && startOfDay(returnDate).getTime() === startOfDay(loanDate).getTime()) {
    return 0;
  }
  if (startOfDay(returnDate).getTime() <= startOfDay(dueDate).getTime()) {
    return 0;
  }
  return countOverdueWeekdays(dueDate, returnDate) * FINE_PER_WEEKDAY;
}

/** Whether an active loan is overdue as of `now`. */
export function isOverdue(dueDate: Date, now: Date = new Date()): boolean {
  return now.getTime() > dueDate.getTime();
}

// ---------------------------------------------------------------------------
// Borrowing limits (pure decision logic; DB lookups live in lib/loan-service)
// ---------------------------------------------------------------------------

export const MAX_ACTIVE_LOANS = 3;

export type BorrowDecision =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Decide whether a member may borrow, given their current borrowing state.
 * A loan is "active" when its return date is null.
 */
export function evaluateBorrow(input: {
  activeLoanCount: number;
  hasOverdueLoan: boolean;
  availableCopies: number;
}): BorrowDecision {
  if (input.activeLoanCount >= MAX_ACTIVE_LOANS) {
    return {
      ok: false,
      reason: `You already have ${MAX_ACTIVE_LOANS} active loans`,
    };
  }
  if (input.hasOverdueLoan) {
    return {
      ok: false,
      reason: "You have an overdue loan; please return it first",
    };
  }
  if (input.availableCopies <= 0) {
    return { ok: false, reason: "No copies available to borrow" };
  }
  return { ok: true };
}

// Unambiguous alphabet (no 0/O, 1/I) for human-readable loan codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate a loan code like `SL-7K2M9QXP`. Uniqueness is ultimately enforced
 * by the unique constraint on Loan.loanCode; callers should retry on collision.
 */
export function generateLoanCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `SL-${code}`;
}
