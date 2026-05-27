import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const now = new Date();
  const [bookCount, memberCount, activeCount, overdueCount] = await Promise.all(
    [
      prisma.book.count(),
      prisma.member.count(),
      prisma.loan.count({ where: { status: "active" } }),
      prisma.loan.count({ where: { status: "active", dueDate: { lt: now } } }),
    ],
  );

  const stats = [
    { label: "Books in catalog", value: bookCount, href: "/admin/books" },
    { label: "Members", value: memberCount, href: "/admin/loans" },
    { label: "Active loans", value: activeCount, href: "/admin/loans" },
    { label: "Overdue loans", value: overdueCount, href: "/admin/overdue" },
  ];

  return (
    <div className="space-y-6">
      <AdminNav email={admin.email} />
      <h1 className="font-display text-3xl font-semibold">
        Librarian dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card p-5 transition hover:border-[var(--accent)]"
          >
            <p className="font-display text-3xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/books" className="btn btn-primary">
          Add a book
        </Link>
        <Link href="/admin/overdue" className="btn btn-outline">
          Overdue report
        </Link>
      </div>
    </div>
  );
}
