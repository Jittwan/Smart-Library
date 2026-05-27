import { getAdminSession } from "@/lib/auth";
import { returnLoan, LoanError } from "@/lib/loan-service";
import { jsonError, jsonOk } from "@/lib/api";

export const dynamic = "force-dynamic";

// Librarian only: confirm a return — records return date and computes the fine.
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) return jsonError("Unauthorized", 401);

  const { id } = await ctx.params;

  try {
    const loan = await returnLoan(id);
    return jsonOk({ loan });
  } catch (error) {
    if (error instanceof LoanError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}
