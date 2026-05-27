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
      <h1 className="text-2xl font-semibold">Librarian dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-3xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/books"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add a book
        </Link>
        <Link
          href="/admin/overdue"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Overdue report
        </Link>
      </div>
    </div>
  );
}
