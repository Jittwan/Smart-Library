import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addBookSchema, BOOK_CATEGORIES } from "@/lib/validation";
import { getAdminSession } from "@/lib/auth";
import { jsonError, jsonOk, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Public: browse the catalog (optional search + category filter).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  const where: Prisma.BookWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }
  if (
    category &&
    (BOOK_CATEGORIES as readonly string[]).includes(category)
  ) {
    where.category = category as (typeof BOOK_CATEGORIES)[number];
  }

  const books = await prisma.book.findMany({
    where,
    orderBy: { title: "asc" },
  });

  return jsonOk({ books });
}

// Librarian only: add a book to the catalog.
export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return jsonError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = addBookSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { title, author, category, copies } = parsed.data;

  const book = await prisma.book.create({
    data: {
      title,
      author,
      category,
      copies,
      availableCopies: copies,
    },
  });

  return jsonOk({ book }, 201);
}
