import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createMemberSession } from "@/lib/auth";
import { jsonError, jsonOk, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { email, password } = parsed.data;

  const member = await prisma.member.findUnique({ where: { email } });
  // Always run the hash comparison to avoid leaking whether the email exists.
  const ok = member
    ? await verifyPassword(password, member.passwordHash)
    : await verifyPassword(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidina");

  if (!member || !ok) {
    return jsonError("Invalid email or password", 401);
  }

  await createMemberSession(member.id);

  return jsonOk({ id: member.id, name: member.name, email: member.email });
}
