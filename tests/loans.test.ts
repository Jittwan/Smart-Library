import { describe, it, expect } from "vitest";
import {
  addDays,
  computeDueDate,
  daysLate,
  computeFine,
  isOverdue,
  generateLoanCode,
  LOAN_PERIOD_DAYS,
  FINE_PER_DAY,
} from "../lib/loans";

describe("computeDueDate", () => {
  it("adds the loan period by default", () => {
    const borrowed = new Date("2026-01-01T10:00:00Z");
    const due = computeDueDate(borrowed);
    expect(due).toEqual(addDays(borrowed, LOAN_PERIOD_DAYS));
  });

  it("does not mutate the input date", () => {
    const borrowed = new Date("2026-01-01T10:00:00Z");
    const snapshot = borrowed.getTime();
    computeDueDate(borrowed);
    expect(borrowed.getTime()).toBe(snapshot);
  });
});

describe("daysLate", () => {
  const due = new Date("2026-01-15T00:00:00Z");

  it("is 0 when returned on the due date", () => {
    expect(daysLate(due, new Date("2026-01-15T00:00:00Z"))).toBe(0);
  });

  it("is 0 when returned early", () => {
    expect(daysLate(due, new Date("2026-01-10T00:00:00Z"))).toBe(0);
  });

  it("counts any part of a day late as a full day", () => {
    expect(daysLate(due, new Date("2026-01-15T00:00:01Z"))).toBe(1);
    expect(daysLate(due, new Date("2026-01-16T00:00:00Z"))).toBe(1);
  });

  it("counts multiple whole days", () => {
    expect(daysLate(due, new Date("2026-01-18T00:00:00Z"))).toBe(3);
  });
});

describe("computeFine", () => {
  const due = new Date("2026-01-15T00:00:00Z");

  it("is 0 when not late", () => {
    expect(computeFine(due, new Date("2026-01-15T00:00:00Z"))).toBe(0);
  });

  it("charges the per-day rate for each late day", () => {
    expect(computeFine(due, new Date("2026-01-18T00:00:00Z"))).toBe(
      3 * FINE_PER_DAY,
    );
  });

  it("respects a custom fine rate", () => {
    expect(computeFine(due, new Date("2026-01-20T00:00:00Z"), 10)).toBe(50);
  });
});

describe("isOverdue", () => {
  const due = new Date("2026-01-15T00:00:00Z");
  it("is false before the due date", () => {
    expect(isOverdue(due, new Date("2026-01-14T23:59:59Z"))).toBe(false);
  });
  it("is true after the due date", () => {
    expect(isOverdue(due, new Date("2026-01-15T00:00:01Z"))).toBe(true);
  });
});

describe("generateLoanCode", () => {
  it("has the SL- prefix and expected length", () => {
    const code = generateLoanCode();
    expect(code).toMatch(/^SL-[A-Z2-9]{8}$/);
  });

  it("excludes ambiguous characters (0,1,I,O)", () => {
    for (let i = 0; i < 200; i++) {
      const body = generateLoanCode().slice(3);
      expect(body).not.toMatch(/[01IO]/);
    }
  });

  it("is unique across many generations", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 5000; i++) codes.add(generateLoanCode());
    // Collisions across 5000 of 32^8 codes should be effectively impossible.
    expect(codes.size).toBe(5000);
  });
});
