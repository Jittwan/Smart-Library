import Link from "next/link";
import { APP_NAME } from "@/lib/app";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          📚 {APP_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Catalog
          </Link>
          <Link href="/loans" className="hover:underline">
            My Loans
          </Link>
          <Link href="/login" className="hover:underline">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sign up
          </Link>
          <Link
            href="/admin"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Librarian
          </Link>
        </nav>
      </div>
    </header>
  );
}
