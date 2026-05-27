# Smart Library

A lending system for a small private library, built as a single Next.js app.
Members browse the catalog, sign up, borrow books and track their loans. A
librarian manages the catalog, confirms returns (which computes fines), and
downloads an overdue report PDF.

## Features

**Members**

- Browse the catalog (search by title/author, filter by category).
- Sign up with name, email, phone and password.
- Borrow a book and receive a **loan code** and a **due date**.
- Log in to see active loans and history (with fines).

**Librarian** (credentials from environment variables)

- Add books to the catalog (title, author, category, copies).
- See all loans and filter by member and status.
- Open a loan detail page and **mark a loan as returned** — the system records
  the return date and computes the fine.
- See overdue loans.
- Download an **overdue report PDF** (members + overdue books + fines). A copy
  is also stored in Supabase Storage.

## Domain rules

- Loan period: **14 days** (`LOAN_PERIOD_DAYS`).
- Late fine: **5 THB per day**, any partial day counts as a full day
  (`FINE_PER_DAY`). See `lib/loans.ts`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM (v7, `pg` driver adapter)
- Supabase PostgreSQL + Supabase Storage
- Deployed on Vercel · package manager: pnpm

## Data model

`Member`, `Book` and `Loan` — see `prisma/schema.prisma`.

- `Book.category`: `textbook | general | novel`
- `Loan.status`: `active | returned | overdue`
- A loan holds a unique `loanCode`, `dueDate`, nullable `returnedAt` and
  `fineAmount`.

## Getting started

1. Install dependencies (also runs `prisma generate`):

   ```bash
   pnpm install
   ```

2. Configure the environment:

   ```bash
   cp .env.example .env
   # fill in DATABASE_URL, DIRECT_URL, SUPABASE_*, SESSION_SECRET, ADMIN_*
   ```

3. Create the database schema in Supabase PostgreSQL:

   ```bash
   pnpm db:push        # or: pnpm db:migrate
   ```

4. In the Supabase dashboard, create a **Storage bucket named `reports`**
   (used for the generated overdue PDFs).

5. (Optional) Seed the catalog with sample books:

   ```bash
   pnpm db:seed
   ```

6. Run the dev server:

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000. The librarian area is at `/admin`.

## Environment variables

| Variable                    | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`      | App name shown in the UI and PDF (default `Smart Library`)|
| `DATABASE_URL`              | Supabase PostgreSQL pooled connection (runtime)           |
| `DIRECT_URL`                | Direct connection for `prisma migrate` / `db push`        |
| `SUPABASE_URL`              | Supabase project URL (Storage)                            |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **server only**               |
| `SESSION_SECRET`            | Secret for signing session cookies (JWT)                  |
| `ADMIN_EMAIL`               | Librarian login email                                     |
| `ADMIN_PASSWORD`            | Librarian login password                                  |

## Testing

Unit tests cover the highest-risk logic: fine calculation, overdue detection,
unique loan-code generation, input validation and PDF generation.

```bash
pnpm test
```

## Build & deploy

```bash
pnpm build
```

Deploy to Vercel and set the environment variables above in the project
settings. `prisma generate` runs automatically on install via `postinstall`.

## Project structure

```
app/
  page.tsx                     Catalog (browse + borrow)
  signup/ login/ loans/        Member auth and loans
  admin/                       Librarian dashboard, books, loans, overdue
  api/                         Route handlers (auth, books, loans, admin)
components/                    Client components (forms, buttons, nav)
lib/                           prisma, supabase, auth, validation, fines, pdf
prisma/schema.prisma           Member / Book / Loan models
tests/                         Vitest unit tests
```
