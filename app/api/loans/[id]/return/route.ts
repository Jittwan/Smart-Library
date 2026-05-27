import { getAdminSession } from "@/lib/auth";
import { returnLoan, LoanError } from "@/lib/loan-service";
import { returnLoanSchema } from "@/lib/validation";
import { jsonError, jsonOk, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Librarian only: confirm a return — records return date and computes the fine.
// Optional body { returnedAt } lets the return date be set to any value (for
// testing fines); defaults to now.
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) return jsonError("Unauthorized", 401);

  const { id } = await ctx.params;

  let returnedAt: Date | undefined;
  try {
    const body = await request.json();
    const parsed = returnLoanSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    returnedAt = parsed.data.returnedAt;
  } catch {
    // No/invalid JSON body → default to now.
  }

  try {
    const loan = await returnLoan(id, returnedAt);
    return jsonOk({ loan });
  } catch (error) {
    if (error instanceof LoanError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}
