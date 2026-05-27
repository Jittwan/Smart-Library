import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/auth";
import { BorrowButton } from "@/components/BorrowButton";
import { BOOK_CATEGORIES } from "@/lib/validation";
import { categoryLabel } from "@/lib/format";
import { LOAN_PERIOD_DAYS } from "@/lib/loans";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const session = await getMemberSession();

  const where: Prisma.BookWhereInput = {};
  const query = q?.trim();
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
    ];
  }
  if (category && (BOOK_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category as (typeof BOOK_CATEGORIES)[number];
  }

  const books = await prisma.book.findMany({
    where,
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Browse books and borrow for {LOAN_PERIOD_DAYS} days.
          {!session && (
            <>
              {" "}
              <Link href="/login" className="underline">
                Log in
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="underline">
                sign up
              </Link>{" "}
              to borrow.
            </>
          )}
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search title or author"
          className="flex-1 min-w-50 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All categories</option>
          {BOOK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search
        </button>
      </form>

      {books.length === 0 ? (
        <p className="text-sm text-zinc-500">No books match your search.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {books.map((book) => (
            <li
              key={book.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{book.title}</p>
                <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                  {book.author}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                    {categoryLabel(book.category)}
                  </span>
                  <span
                    className={
                      book.availableCopies > 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {book.availableCopies} / {book.copies} available
                  </span>
                </div>
              </div>
              {session ? (
                <BorrowButton
                  bookId={book.id}
                  available={book.availableCopies > 0}
                />
              ) : (
                <Link
                  href="/login?next=/"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Log in to borrow
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
