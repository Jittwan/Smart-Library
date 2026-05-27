"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";

export function BorrowButton({
  bookId,
  available,
}: {
  bookId: string;
  available: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBorrow() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push("/login?next=/");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not borrow this book");
        return;
      }

      setMessage(
        `Borrowed! Loan code ${data.loanCode} · due ${formatDate(data.dueDate)}`,
      );
      startTransition(() => router.refresh());
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleBorrow}
        disabled={!available || loading || pending}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading || pending ? "Borrowing…" : available ? "Borrow" : "Unavailable"}
      </button>
      {message && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
