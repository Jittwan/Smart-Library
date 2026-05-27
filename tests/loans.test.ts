import { describe, it, expect } from "vitest";
import {
  getLoanPeriodByCategory,
  calculateDueDate,
  calculateFine,
  countOverdueWeekdays,
  evaluateBorrow,
  generateLoanCode,
  FINE_PER_WEEKDAY,
} from "../lib/loans";

// Reference weekdays in Jan 2026 (Jan 1 2026 is a Thursday):
//   Mon Jan 5, Tue Jan 6, ... Fri Jan 9, Sat Jan 10, Sun Jan 11, Mon Jan 12
const MON = new Date(2026, 0, 5);
const TUE = new Date(2026, 0, 6);
const FRI = new Date(2026, 0, 9);
const SAT = new Date(2026, 0, 10);
const SUN = new Date(2026, 0, 11);
const NEXT_MON = new Date(2026, 0, 12);

describe("getLoanPeriodByCategory", () => {
  it("returns the period for each category", () => {
    expect(getLoanPeriodByCategory("textbook")).toBe(3);
    expect(getLoanPeriodByCategory("general")).toBe(7);
    expect(getLoanPeriodByCategory("novel")).toBe(14);
  });
});

describe("calculateDueDate", () => {
  const loanDate = new Date(2026, 0, 5); // Monday
  it("adds 3 days for a textbook", () => {
    expect(calculateDueDate(loanDate, "textbook")).toEqual(new Date(2026, 0, 8));
  });
  it("adds 7 days for a general book", () => {
    expect(calculateDueDate(loanDate, "general")).toEqual(new Date(2026, 0, 12));
  });
  it("adds 14 days for a novel", () => {
    expect(calculateDueDate(loanDate, "novel")).toEqual(new Date(2026, 0, 19));
  });
});

describe("calculateFine — examples from the spec", () => {
  it("due Monday, return Monday → 0", () => {
    expect(calculateFine(MON, MON)).toBe(0);
  });

  it("due Monday, return Tuesday → 1 weekday → 20", () => {
    expect(calculateFine(MON, TUE)).toBe(FINE_PER_WEEKDAY);
  });

  it("due Friday, return Monday → count Monday only → 20", () => {
    expect(calculateFine(FRI, NEXT_MON)).toBe(FINE_PER_WEEKDAY);
  });

  it("due Friday, return Sunday → 0 weekdays → 0", () => {
    expect(calculateFine(FRI, SUN)).toBe(0);
  });

  it("return on the loan date → 0 regardless of category", () => {
    const loanDate = MON;
    for (const category of ["textbook", "general", "novel"] as const) {
      const dueDate = calculateDueDate(loanDate, category);
      expect(calculateFine(dueDate, loanDate, loanDate)).toBe(0);
    }
  });

  it("no fine when return is on or before the due date", () => {
    expect(calculateFine(FRI, FRI)).toBe(0); // on due date
    expect(calculateFine(FRI, MON)).toBe(0); // before due date
  });
});

describe("calculateFine — more cases", () => {
  it("does not charge for an early return", () => {
    expect(calculateFine(FRI, MON)).toBe(0);
  });

  it("counts a full week of overdue weekdays", () => {
    // due Mon Jan 5, return Mon Jan 12: Tue–Fri (4) + Mon (1) = 5 weekdays
    expect(calculateFine(MON, NEXT_MON)).toBe(5 * FINE_PER_WEEKDAY);
  });

  it("overdue only across the weekend is free", () => {
    expect(calculateFine(FRI, SAT)).toBe(0);
  });
});

describe("countOverdueWeekdays", () => {
  it("excludes Saturday and Sunday", () => {
    expect(countOverdueWeekdays(FRI, NEXT_MON)).toBe(1); // only Monday
    expect(countOverdueWeekdays(MON, NEXT_MON)).toBe(5);
    expect(countOverdueWeekdays(MON, MON)).toBe(0);
  });
});

describe("evaluateBorrow", () => {
  it("allows when within limits", () => {
    expect(
      evaluateBorrow({
        activeLoanCount: 2,
        hasOverdueLoan: false,
        availableCopies: 1,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects when the member already has 3 active loans", () => {
    const result = evaluateBorrow({
      activeLoanCount: 3,
      hasOverdueLoan: false,
      availableCopies: 5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/3 active/);
  });

  it("rejects when the member has an overdue active loan", () => {
    const result = evaluateBorrow({
      activeLoanCount: 1,
      hasOverdueLoan: true,
      availableCopies: 5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/overdue/i);
  });

  it("rejects when no copies are available", () => {
    const result = evaluateBorrow({
      activeLoanCount: 0,
      hasOverdueLoan: false,
      availableCopies: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/no copies/i);
  });

  it("checks the active-loan limit before availability", () => {
    const result = evaluateBorrow({
      activeLoanCount: 3,
      hasOverdueLoan: false,
      availableCopies: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/3 active/);
  });
});

describe("generateLoanCode", () => {
  it("has the SL- prefix and expected length", () => {
    expect(generateLoanCode()).toMatch(/^SL-[A-Z2-9]{8}$/);
  });

  it("excludes ambiguous characters (0,1,I,O)", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateLoanCode().slice(3)).not.toMatch(/[01IO]/);
    }
  });

  it("is unique across many generations", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 5000; i++) codes.add(generateLoanCode());
    expect(codes.size).toBe(5000);
  });
});
