"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTHB } from "@/lib/format";

export function ReturnButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReturn() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}/return`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not mark as returned");
        return;
      }

      const fine = data.loan?.fineAmount ?? 0;
      if (fine > 0) {
        window.alert(`Returned. Fine due: ${formatTHB(fine)}`);
      }
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
        onClick={handleReturn}
        disabled={loading || pending}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading || pending ? "Saving…" : "Mark returned"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
