"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTHB } from "@/lib/format";

// Return a loan with an optional, explicit return date (for testing fines).
export function ReturnForm({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const body = date ? { returnedAt: new Date(date).toISOString() } : {};
      const res = await fetch(`/api/loans/${loanId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not mark as returned");
        return;
      }
      window.alert(`Returned. Fine: ${formatTHB(data.loan?.fineAmount ?? 0)}`);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs">
        <span className="mb-1 block text-muted">Return date (blank = now)</span>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-auto"
        />
      </label>
      <button
        type="button"
        onClick={submit}
        disabled={loading || pending}
        className="btn btn-primary"
      >
        {loading || pending ? "Saving…" : "Mark returned"}
      </button>
      {error && <p className="w-full text-xs text-[#dc2626]">{error}</p>}
    </div>
  );
}
