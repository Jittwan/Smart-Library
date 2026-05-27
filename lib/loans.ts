// Domain rules for lending: loan period, fines, overdue detection, loan codes.

/** Number of days a member may keep a borrowed book. */
export const LOAN_PERIOD_DAYS = 14;

/** Fine charged per day a book is returned late, in THB. */
export const FINE_PER_DAY = 5;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Return a new Date `days` calendar days after `date`. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/** Due date for a loan that started at `borrowedAt`. */
export function computeDueDate(
  borrowedAt: Date,
  days: number = LOAN_PERIOD_DAYS,
): Date {
  return addDays(borrowedAt, days);
}

/**
 * Whole days a book is late. A book returned on or before the due date is 0.
 * Any part of a day past the due date counts as a full day.
 */
export function daysLate(dueDate: Date, returnedAt: Date): number {
  const diff = returnedAt.getTime() - dueDate.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / MS_PER_DAY);
}

/** Fine owed for returning a book at `returnedAt` when it was due `dueDate`. */
export function computeFine(
  dueDate: Date,
  returnedAt: Date,
  finePerDay: number = FINE_PER_DAY,
): number {
  return daysLate(dueDate, returnedAt) * finePerDay;
}

/** Whether an active loan is overdue as of `now`. */
export function isOverdue(dueDate: Date, now: Date = new Date()): boolean {
  return now.getTime() > dueDate.getTime();
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
