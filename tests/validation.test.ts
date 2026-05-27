import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  addBookSchema,
  borrowSchema,
} from "../lib/validation";

describe("signupSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "0812345678",
    password: "supersecret",
  };

  it("accepts a valid member", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("normalises the email (trim + lowercase)", () => {
    const parsed = signupSchema.parse({ ...valid, email: "  ADA@Example.COM " });
    expect(parsed.email).toBe("ada@example.com");
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("rejects a short password", () => {
    expect(signupSchema.safeParse({ ...valid, password: "short" }).success).toBe(
      false,
    );
  });

  it("rejects an empty name", () => {
    expect(signupSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("addBookSchema", () => {
  const valid = {
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "textbook",
    copies: 3,
  };

  it("accepts a valid book", () => {
    expect(addBookSchema.safeParse(valid).success).toBe(true);
  });

  it("coerces a numeric string for copies", () => {
    const parsed = addBookSchema.parse({ ...valid, copies: "5" });
    expect(parsed.copies).toBe(5);
  });

  it("rejects an unknown category", () => {
    expect(addBookSchema.safeParse({ ...valid, category: "magazine" }).success).toBe(
      false,
    );
  });

  it("rejects zero or negative copies", () => {
    expect(addBookSchema.safeParse({ ...valid, copies: 0 }).success).toBe(false);
    expect(addBookSchema.safeParse({ ...valid, copies: -2 }).success).toBe(false);
  });

  it("rejects fractional copies", () => {
    expect(addBookSchema.safeParse({ ...valid, copies: 2.5 }).success).toBe(false);
  });
});

describe("borrowSchema", () => {
  it("requires a bookId", () => {
    expect(borrowSchema.safeParse({ bookId: "" }).success).toBe(false);
    expect(borrowSchema.safeParse({ bookId: "abc123" }).success).toBe(true);
  });
});
