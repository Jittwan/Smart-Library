import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

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
