import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ReturnButton } from "@/components/ReturnButton";
import { formatDate, formatTHB } from "@/lib/format";
import { calculateFine, countOverdueWeekdays } from "@/lib/loans";

export const dynamic = "force-dynamic";

export default async function AdminOverduePage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const now = new Date();

  const loans = await prisma.loan.findMany({
    where: { status: "active", dueDate: { lt: now } },
    include: { book: true, member: true },
    orderBy: [{ member: { name: "asc" } }, { dueDate: "asc" }],
  });

  const totalFine = loans.reduce(
    (sum, loan) => sum + calculateFine(loan.dueDate, now, loan.borrowedAt),
    0,
  );

  return (
    <div className="space-y-6">
      <AdminNav email={admin.email} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Overdue loans</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {loans.length} overdue · {formatTHB(totalFine)} in projected fines
          </p>
        </div>
        <a
          href="/api/admin/overdue/report"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Download PDF report
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-2">Member</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Book</th>
              <th className="px-4 py-2">Due</th>
              <th className="px-4 py-2 text-right">Weekdays late</th>
              <th className="px-4 py-2 text-right">Fine</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {loans.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  No overdue loans. 🎉
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-4 py-2 font-medium">{loan.member.name}</td>
                  <td className="px-4 py-2">{loan.member.email}</td>
                  <td className="px-4 py-2">{loan.book.title}</td>
                  <td className="px-4 py-2">{formatDate(loan.dueDate)}</td>
                  <td className="px-4 py-2 text-right">
                    {countOverdueWeekdays(loan.dueDate, now)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatTHB(calculateFine(loan.dueDate, now, loan.borrowedAt))}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <ReturnButton loanId={loan.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
