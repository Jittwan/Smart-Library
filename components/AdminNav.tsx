import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function AdminNav({ email }: { email: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      <nav className="flex gap-4 text-sm font-medium">
        <Link href="/admin" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/admin/books" className="hover:underline">
          Books
        </Link>
        <Link href="/admin/loans" className="hover:underline">
          Loans
        </Link>
        <Link href="/admin/overdue" className="hover:underline">
          Overdue
        </Link>
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-zinc-500">{email}</span>
        <LogoutButton endpoint="/api/admin/logout" redirectTo="/admin/login" />
      </div>
    </div>
  );
}
