import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ReturnButton } from "@/components/ReturnButton";
import { AdminCreateLoanForm } from "@/components/AdminCreateLoanForm";
import { formatDate, formatTHB } from "@/lib/format";
import { isOverdue } from "@/lib/loans";

export const dynamic = "force-dynamic";

const STATUSES = ["active", "returned", "overdue"] as const;

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string; status?: string }>;
}) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const { memberId, status } = await searchParams;

  const [members, books] = await Promise.all([
    prisma.member.findMany({ orderBy: { name: "asc" } }),
    prisma.book.findMany({ orderBy: { title: "asc" } }),
  ]);

  const where: Prisma.LoanWhereInput = {};
  if (memberId) where.memberId = memberId;
  if (status && (STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof STATUSES)[number];
  }

  const loans = await prisma.loan.findMany({
    where,
    include: { book: true, member: true },
    orderBy: { borrowedAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <AdminNav email={admin.email} />
      <h1 className="font-display text-3xl font-semibold">Loans</h1>

      <AdminCreateLoanForm members={members} books={books} />

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Member
          </span>
          <select name="memberId" defaultValue={memberId ?? ""} className="input w-auto">
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Status
          </span>
          <select name="status" defaultValue={status ?? ""} className="input w-auto">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          Filter
        </button>
        <Link href="/admin/loans" className="btn btn-outline">
          Reset
        </Link>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5">Loan code</th>
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5">Book</th>
              <th className="px-4 py-2.5">Borrowed</th>
              <th className="px-4 py-2.5">Due</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Fine</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loans.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted">
                  No loans found.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const overdue =
                  loan.status === "active" && isOverdue(loan.dueDate, now);
                const badgeClass = overdue
                  ? "badge-warn"
                  : loan.status === "returned"
                    ? "badge-muted"
                    : "badge-ok";
                return (
                  <tr key={loan.id}>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <Link
                        href={`/admin/loans/${loan.id}`}
                        className="hover:underline"
                      >
                        {loan.loanCode}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{loan.member.name}</td>
                    <td className="px-4 py-2.5">{loan.book.title}</td>
                    <td className="px-4 py-2.5">{formatDate(loan.borrowedAt)}</td>
                    <td className="px-4 py-2.5">{formatDate(loan.dueDate)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`badge ${badgeClass}`}>
                        {overdue ? "overdue" : loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatTHB(loan.fineAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {loan.status === "active" ? (
                        <ReturnButton loanId={loan.id} />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
