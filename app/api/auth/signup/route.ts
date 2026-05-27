import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { hashPassword, createMemberSession } from "@/lib/auth";
import { jsonError, jsonOk, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    return jsonError("An account with this email already exists", 409);
  }

  const member = await prisma.member.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
    },
  });

  await createMemberSession(member.id);

  return jsonOk(
    { id: member.id, name: member.name, email: member.email },
    201,
  );
}
