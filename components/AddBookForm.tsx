"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BOOK_CATEGORIES } from "@/lib/validation";
import { categoryLabel } from "@/lib/format";

const empty = {
  title: "",
  author: "",
  category: "general",
  copies: "1",
};

export function AddBookForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        author: form.author,
        category: form.category,
        copies: Number(form.copies),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      if (data.fields) setFieldErrors(data.fields);
      setError(data.error ?? "Could not add book");
      return;
    }

    setSuccess(`Added “${data.book.title}”`);
    setForm(empty);
    startTransition(() => router.refresh());
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Title</span>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input"
          />
          {fieldErrors.title && (
            <span className="mt-1 block text-xs text-red-600">
              {fieldErrors.title}
            </span>
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Author</span>
          <input
            type="text"
            required
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            className="input"
          />
          {fieldErrors.author && (
            <span className="mt-1 block text-xs text-red-600">
              {fieldErrors.author}
            </span>
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Category</span>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
            className="input"
          >
            {BOOK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Copies</span>
          <input
            type="number"
            min={1}
            required
            value={form.copies}
            onChange={(e) => setForm((f) => ({ ...f, copies: e.target.value }))}
            className="input"
          />
          {fieldErrors.copies && (
            <span className="mt-1 block text-xs text-red-600">
              {fieldErrors.copies}
            </span>
          )}
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <button
        type="submit"
        disabled={loading || pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? "Adding…" : "Add book"}
      </button>
    </form>
  );
}
