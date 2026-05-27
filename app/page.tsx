import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/auth";
import { BorrowButton } from "@/components/BorrowButton";
import { BOOK_CATEGORIES } from "@/lib/validation";
import { categoryLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/");

  const { q, category } = await searchParams;

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
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface-2 px-6 py-8">
        <h1 className="font-display text-3xl font-semibold">Browse the catalog</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Borrow a book and we will give you a loan code and a due date. Loan
          period by category — textbook 3 days, general 7 days, novel 14 days.
        </p>

        <form className="mt-5 flex flex-wrap gap-2" method="get">
          <input
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search by title or author…"
            className="input flex-1 min-w-56"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="input w-auto"
          >
            <option value="">All categories</option>
            {BOOK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </section>

      {books.length === 0 ? (
        <p className="text-sm text-muted">No books match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => {
            const available = book.availableCopies > 0;
            return (
              <article
                key={book.id}
                className="card flex flex-col gap-3 p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`badge badge-${book.category}`}>
                    {categoryLabel(book.category)}
                  </span>
                  <span
                    className={`badge ${available ? "badge-ok" : "badge-warn"}`}
                  >
                    {available
                      ? `${book.availableCopies} available`
                      : "Unavailable"}
                  </span>
                </div>

                <div className="flex-1">
                  <h2 className="font-display text-lg font-semibold leading-snug">
                    {book.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{book.author}</p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted">
                    {book.availableCopies} / {book.copies} copies
                  </span>
                  <BorrowButton bookId={book.id} available={available} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
