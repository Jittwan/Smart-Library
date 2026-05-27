"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string; email: string };
type Book = { id: string; title: string };

// Librarian testing tool: create a loan with explicit dates so fines can be
// exercised immediately (bypasses borrowing limits on purpose).
export function AdminCreateLoanForm({
  members,
  books,
}: {
  members: Member[];
  books: Book[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    memberId: "",
    bookId: "",
    borrowedAt: "",
    dueDate: "",
    returnedAt: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const payload: Record<string, string> = {
      memberId: form.memberId,
      bookId: form.bookId,
    };
    if (form.borrowedAt) payload.borrowedAt = new Date(form.borrowedAt).toISOString();
    if (form.dueDate) payload.dueDate = new Date(form.dueDate).toISOString();
    if (form.returnedAt) payload.returnedAt = new Date(form.returnedAt).toISOString();

    const res = await fetch("/api/admin/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create loan");
      return;
    }
    setSuccess(
      `Created loan ${data.loan.loanCode} · due ${new Date(data.loan.dueDate).toISOString().slice(0, 10)}` +
        (data.loan.returnedAt ? ` · fine ${data.loan.fineAmount} THB` : ""),
    );
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-outline"
      >
        + Create test loan (set dates)
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Create test loan</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:underline"
        >
          Close
        </button>
      </div>
      <p className="text-xs text-muted">
        Set any loan/due/return date to test fines. Leave a date blank to use
        the default (borrowed = now, due = by category, not returned). Bypasses
        borrowing limits.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Member</span>
          <select required value={form.memberId} onChange={set("memberId")} className="input">
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Book</span>
          <select required value={form.bookId} onChange={set("bookId")} className="input">
            <option value="">Select book…</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Loan date (borrowed)
          </span>
          <input type="datetime-local" value={form.borrowedAt} onChange={set("borrowedAt")} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Due date (blank = by category)
          </span>
          <input type="datetime-local" value={form.dueDate} onChange={set("dueDate")} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Return date (blank = still active)
          </span>
          <input type="datetime-local" value={form.returnedAt} onChange={set("returnedAt")} className="input" />
        </label>
      </div>

      {error && <p className="text-sm text-[#dc2626]">{error}</p>}
      {success && <p className="text-sm text-[var(--accent)]">{success}</p>}

      <button type="submit" disabled={loading || pending} className="btn btn-primary">
        {loading ? "Creating…" : "Create loan"}
      </button>
    </form>
  );
}
