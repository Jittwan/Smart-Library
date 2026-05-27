import type { NextRequest } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import { verifyAdminCredentials, createAdminSession } from "@/lib/auth";
import { jsonError, jsonOk, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { email, password } = parsed.data;

  if (!verifyAdminCredentials(email, password)) {
    return jsonError("Invalid librarian credentials", 401);
  }

  await createAdminSession(email);
  return jsonOk({ email });
}
