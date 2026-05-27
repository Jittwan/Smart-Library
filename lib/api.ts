import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Flatten a ZodError into a `{ field: message }` map (first message per field). */
export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function validationError(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: "Validation failed", fields: fieldErrors(error) },
    { status: 422 },
  );
}
