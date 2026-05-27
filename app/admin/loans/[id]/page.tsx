import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ReturnForm } from "@/components/ReturnForm";
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
    {
      label: "Loan code",
      value: <span className="font-mono">{loan.loanCode}</span>,
    },
    { label: "Status", value: overdue ? "overdue" : loan.status },
    { label: "Member", value: loan.member.name },
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
        <h1 className="font-display text-3xl font-semibold">Loan detail</h1>
        <Link href="/admin/loans" className="text-sm text-[var(--accent)] underline">
          ← Back to loans
        </Link>
      </div>

      <dl className="card grid grid-cols-1 gap-x-8 gap-y-3 p-6 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between gap-4 border-b border-border pb-2"
          >
            <dt className="text-sm text-muted">{row.label}</dt>
            <dd className="text-right text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      {isActive && (
        <div className="card flex flex-wrap items-center justify-between gap-4 border-[var(--accent)] p-5">
          <div className="text-sm">
            <p className="font-medium">Confirm return</p>
            <p className="text-muted">
              Returning now would record a fine of {formatTHB(projectedFine)}.
              Set a return date to test other fines.
            </p>
          </div>
          <ReturnForm loanId={loan.id} />
        </div>
      )}
    </div>
  );
}
