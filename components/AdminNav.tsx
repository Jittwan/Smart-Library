import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function AdminNav({ email }: { email: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <nav className="flex gap-1 text-sm font-medium">
        <Link href="/admin" className="rounded-md px-3 py-1.5 hover:bg-surface-2">
          Dashboard
        </Link>
        <Link
          href="/admin/books"
          className="rounded-md px-3 py-1.5 hover:bg-surface-2"
        >
          Books
        </Link>
        <Link
          href="/admin/loans"
          className="rounded-md px-3 py-1.5 hover:bg-surface-2"
        >
          Loans
        </Link>
        <Link
          href="/admin/overdue"
          className="rounded-md px-3 py-1.5 hover:bg-surface-2"
        >
          Overdue
        </Link>
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">{email}</span>
        <LogoutButton endpoint="/api/admin/logout" redirectTo="/admin/login" />
      </div>
    </div>
  );
}
