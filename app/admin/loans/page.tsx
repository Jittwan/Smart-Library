import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ReturnButton } from "@/components/ReturnButton";
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

  const members = await prisma.member.findMany({ orderBy: { name: "asc" } });

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
      <h1 className="text-2xl font-semibold">Loans</h1>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500">
            Member
          </span>
          <select name="memberId" defaultValue={memberId ?? ""} className="input">
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500">
            Status
          </span>
          <select name="status" defaultValue={status ?? ""} className="input">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Filter
        </button>
        <Link
          href="/admin/loans"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Reset
        </Link>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-2">Loan code</th>
              <th className="px-4 py-2">Member</th>
              <th className="px-4 py-2">Book</th>
              <th className="px-4 py-2">Borrowed</th>
              <th className="px-4 py-2">Due</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Fine</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {loans.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                  No loans found.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const overdue =
                  loan.status === "active" && isOverdue(loan.dueDate, now);
                return (
                  <tr key={loan.id}>
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link
                        href={`/admin/loans/${loan.id}`}
                        className="hover:underline"
                      >
                        {loan.loanCode}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{loan.member.name}</td>
                    <td className="px-4 py-2">{loan.book.title}</td>
                    <td className="px-4 py-2">{formatDate(loan.borrowedAt)}</td>
                    <td className="px-4 py-2">{formatDate(loan.dueDate)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          overdue
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : loan.status === "returned"
                              ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {overdue ? "overdue" : loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatTHB(loan.fineAmount)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {loan.status === "active" ? (
                        <ReturnButton loanId={loan.id} />
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
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
