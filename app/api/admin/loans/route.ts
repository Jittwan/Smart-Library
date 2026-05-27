import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { createAdminLoan, LoanError } from "@/lib/loan-service";
import { adminCreateLoanSchema } from "@/lib/validation";
import { jsonError, jsonOk, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

const STATUSES = ["active", "returned", "overdue"] as const;

// Librarian only: all loans, filter by member and/or status.
export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId")?.trim();
  const status = searchParams.get("status")?.trim();

  const where: Prisma.LoanWhereInput = {};
  if (memberId) where.memberId = memberId;
  if (status && (STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof STATUSES)[number];
  }

  const loans = await prisma.loan.findMany({
    where,
    include: { book: true, member: true },
    orderBy: { borrowedAt: "desc" },
  });

  return jsonOk({ loans });
}

// Librarian testing helper: create a loan with explicit loan/due/return dates
// so fines can be tested instantly. Bypasses borrowing limits on purpose.
export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = adminCreateLoanSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const loan = await createAdminLoan(parsed.data);
    return jsonOk({ loan }, 201);
  } catch (error) {
    if (error instanceof LoanError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}
