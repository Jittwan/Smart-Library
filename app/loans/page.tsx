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
          <h1 className="font-display text-3xl font-semibold">My loans</h1>
          <p className="text-sm text-muted">
            {member.name} · {member.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Active loans</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted">
            No active loans.{" "}
            <Link href="/" className="text-[var(--accent)] underline">
              Browse the catalog
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((loan) => {
              const overdue = isOverdue(loan.dueDate, now);
              return (
                <article key={loan.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold leading-snug">
                        {loan.book.title}
                      </h3>
                      <p className="text-sm text-muted">{loan.book.author}</p>
                    </div>
                    <span
                      className={`badge ${overdue ? "badge-warn" : "badge-ok"}`}
                    >
                      {overdue ? "Overdue" : "Active"}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted">Loan code</dt>
                      <dd className="font-mono">{loan.loanCode}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Borrowed</dt>
                      <dd>{formatDate(loan.borrowedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Due</dt>
                      <dd>{formatDate(loan.dueDate)}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No returned loans yet.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2.5">Book</th>
                  <th className="px-4 py-2.5">Loan code</th>
                  <th className="px-4 py-2.5">Returned</th>
                  <th className="px-4 py-2.5 text-right">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-4 py-2.5">{loan.book.title}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {loan.loanCode}
                    </td>
                    <td className="px-4 py-2.5">
                      {loan.returnedAt ? formatDate(loan.returnedAt) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
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
