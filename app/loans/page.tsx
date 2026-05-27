import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { formatDate, formatTHB } from "@/lib/format";
import { isOverdue } from "@/lib/loans";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/loans");

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
  });
  if (!member) redirect("/login");

  const loans = await prisma.loan.findMany({
    where: { memberId: member.id },
    include: { book: true },
    orderBy: { borrowedAt: "desc" },
  });

  const active = loans.filter((loan) => loan.status === "active");
  const history = loans.filter((loan) => loan.status !== "active");
  const now = new Date();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My loans</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {member.name} · {member.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Active loans</h2>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No active loans.{" "}
            <Link href="/" className="underline">
              Browse the catalog
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {active.map((loan) => {
              const overdue = isOverdue(loan.dueDate, now);
              return (
                <li key={loan.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{loan.book.title}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {loan.book.author}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        overdue
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {overdue ? "Overdue" : "Active"}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 sm:grid-cols-3">
                    <div>
                      <dt className="font-medium text-zinc-500">Loan code</dt>
                      <dd className="font-mono">{loan.loanCode}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500">Borrowed</dt>
                      <dd>{formatDate(loan.borrowedAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-zinc-500">Due</dt>
                      <dd>{formatDate(loan.dueDate)}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">No returned loans yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-2">Book</th>
                  <th className="px-4 py-2">Loan code</th>
                  <th className="px-4 py-2">Returned</th>
                  <th className="px-4 py-2 text-right">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                {history.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-4 py-2">{loan.book.title}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {loan.loanCode}
                    </td>
                    <td className="px-4 py-2">
                      {loan.returnedAt ? formatDate(loan.returnedAt) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatTHB(loan.fineAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
