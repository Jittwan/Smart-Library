import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const MEMBER_COOKIE = "sl_member";
const ADMIN_COOKIE = "sl_admin";
const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fallback keeps local dev working; production must set SESSION_SECRET.
    return new TextEncoder().encode("dev-secret-change-me-in-production");
  }
  return new TextEncoder().encode(secret);
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function signToken(payload: {
  sub: string;
  role: "member" | "admin";
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

// ---------------------------------------------------------------------------
// Member sessions
// ---------------------------------------------------------------------------

export async function createMemberSession(memberId: string): Promise<void> {
  const token = await signToken({ sub: memberId, role: "member" });
  const store = await cookies();
  store.set(MEMBER_COOKIE, token, cookieOptions());
}

export async function getMemberSession(): Promise<{ memberId: string } | null> {
  const store = await cookies();
  const token = store.get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "member" || typeof payload.sub !== "string") {
      return null;
    }
    return { memberId: payload.sub };
  } catch {
    return null;
  }
}

export async function clearMemberSession(): Promise<void> {
  const store = await cookies();
  store.delete(MEMBER_COOKIE);
}

// ---------------------------------------------------------------------------
// Librarian (admin) sessions — credentials come from environment variables
// ---------------------------------------------------------------------------

export function verifyAdminCredentials(
  email: string,
  password: string,
): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  return (
    email.trim().toLowerCase() === adminEmail.trim().toLowerCase() &&
    password === adminPassword
  );
}

export async function createAdminSession(email: string): Promise<void> {
  const token = await signToken({ sub: email, role: "admin" });
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, cookieOptions());
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin" || typeof payload.sub !== "string") {
      return null;
    }
    return { email: payload.sub };
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
