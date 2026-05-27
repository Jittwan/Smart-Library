import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Bucket that holds generated overdue report PDFs.
export const REPORTS_BUCKET = "reports";

/**
 * Server-side Supabase client using the service role key.
 * Never import this into a Client Component — the key must stay on the server.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Upload a generated PDF to Supabase Storage and return a signed download URL.
 * Uploaded files are kept in Supabase Storage (no local persistent storage).
 */
export async function uploadOverdueReport(
  fileName: string,
  bytes: Uint8Array,
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(fileName, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload report: ${uploadError.message}`);
  }

  const { data, error: signError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(fileName, 60 * 60); // valid for 1 hour

  if (signError || !data) {
    throw new Error(
      `Failed to create download link: ${signError?.message ?? "unknown error"}`,
    );
  }

  return data.signedUrl;
}
