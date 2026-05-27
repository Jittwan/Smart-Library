import Link from "next/link";
import { APP_NAME } from "@/lib/app";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden>
            📖
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight">
              {APP_NAME}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Lending Library
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 hover:bg-surface-2"
          >
            Catalog
          </Link>
          <Link
            href="/loans"
            className="rounded-md px-3 py-1.5 hover:bg-surface-2"
          >
            My Loans
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 hover:bg-surface-2"
          >
            Log in
          </Link>
          <Link href="/admin" className="btn btn-primary ml-1">
            Librarian
          </Link>
        </nav>
      </div>
    </header>
  );
}
