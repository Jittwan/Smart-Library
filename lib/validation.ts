import { z } from "zod";

export const BOOK_CATEGORIES = ["textbook", "general", "novel"] as const;

const emailField = z.string().trim().toLowerCase().pipe(z.email("Invalid email"));

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailField,
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is required")
    .max(30, "Phone number is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const addBookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: z.string().trim().min(1, "Author is required").max(120),
  category: z.enum(BOOK_CATEGORIES),
  copies: z.coerce
    .number()
    .int("Copies must be a whole number")
    .min(1, "There must be at least 1 copy")
    .max(10000),
});

export const borrowSchema = z.object({
  bookId: z.string().min(1, "A book must be selected"),
});

// Testing helpers (librarian only): let the dates be set to any value so fines
// can be exercised without waiting real days.
export const returnLoanSchema = z.object({
  returnedAt: z.coerce.date().optional(),
});

export const adminCreateLoanSchema = z.object({
  memberId: z.string().min(1, "A member must be selected"),
  bookId: z.string().min(1, "A book must be selected"),
  borrowedAt: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  returnedAt: z.coerce.date().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AddBookInput = z.infer<typeof addBookSchema>;
export type BorrowInput = z.infer<typeof borrowSchema>;
export type AdminCreateLoanInput = z.infer<typeof adminCreateLoanSchema>;
