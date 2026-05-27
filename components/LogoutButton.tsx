"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({
  endpoint = "/api/auth/logout",
  redirectTo = "/login",
  label = "Log out",
}: {
  endpoint?: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch(endpoint, { method: "POST" });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="btn btn-outline"
    >
      {loading ? "…" : label}
    </button>
  );
}
