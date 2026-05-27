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
          <h1 className="font-display text-3xl font-semibold">Overdue loans</h1>
          <p className="text-sm text-muted">
            {loans.length} overdue · {formatTHB(totalFine)} in projected fines
          </p>
        </div>
        <a href="/api/admin/overdue/report" className="btn btn-primary">
          Download PDF report
        </a>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Book</th>
              <th className="px-4 py-2.5">Due</th>
              <th className="px-4 py-2.5 text-right">Weekdays late</th>
              <th className="px-4 py-2.5 text-right">Fine</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loans.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  No overdue loans. 🎉
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-4 py-2.5 font-medium">{loan.member.name}</td>
                  <td className="px-4 py-2.5">{loan.member.email}</td>
                  <td className="px-4 py-2.5">{loan.book.title}</td>
                  <td className="px-4 py-2.5">{formatDate(loan.dueDate)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {countOverdueWeekdays(loan.dueDate, now)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatTHB(calculateFine(loan.dueDate, now, loan.borrowedAt))}
                  </td>
                  <td className="px-4 py-2.5 text-right">
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
