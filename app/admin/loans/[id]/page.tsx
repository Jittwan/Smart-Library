import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ReturnButton } from "@/components/ReturnButton";
import { formatDate, formatTHB, categoryLabel } from "@/lib/format";
import { calculateFine, countOverdueWeekdays, isOverdue } from "@/lib/loans";

export const dynamic = "force-dynamic";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { book: true, member: true },
  });
  if (!loan) notFound();

  const now = new Date();
  const isActive = loan.status === "active";
  const overdue = isActive && isOverdue(loan.dueDate, now);
  const projectedFine = isActive
    ? calculateFine(loan.dueDate, now, loan.borrowedAt)
    : loan.fineAmount;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Loan code", value: <span className="font-mono">{loan.loanCode}</span> },
    {
      label: "Status",
      value: overdue ? "overdue" : loan.status,
    },
    { label: "Member", value: `${loan.member.name}` },
    { label: "Email", value: loan.member.email },
    { label: "Phone", value: loan.member.phone },
    { label: "Book", value: loan.book.title },
    { label: "Author", value: loan.book.author },
    { label: "Category", value: categoryLabel(loan.book.category) },
    { label: "Borrowed", value: formatDate(loan.borrowedAt) },
    { label: "Due date", value: formatDate(loan.dueDate) },
    {
      label: "Returned",
      value: loan.returnedAt ? formatDate(loan.returnedAt) : "—",
    },
    {
      label: isActive ? "Weekdays overdue" : "Fine",
      value: isActive
        ? String(countOverdueWeekdays(loan.dueDate, now))
        : formatTHB(loan.fineAmount),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminNav email={admin.email} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Loan detail</h1>
        <Link href="/admin/loans" className="text-sm underline">
          ← Back to loans
        </Link>
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-lg border border-zinc-200 bg-white p-5 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <dt className="text-sm text-zinc-500">{row.label}</dt>
            <dd className="text-sm font-medium text-right">{row.value}</dd>
          </div>
        ))}
      </dl>

      {isActive && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="text-sm">
            <p className="font-medium">Confirm return</p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Returning now would record a fine of {formatTHB(projectedFine)}.
            </p>
          </div>
          <ReturnButton loanId={loan.id} />
        </div>
      )}
    </div>
  );
}
