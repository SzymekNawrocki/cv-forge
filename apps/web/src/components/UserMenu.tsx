"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, type CurrentUser } from "@/lib/api";

export default function UserMenu() {
  const router = useRouter();
  const { data: user } = useSWR<CurrentUser | null>("currentUser", getCurrentUser, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!user) return (
    <a
      href="/login"
      style={{
        padding: "5px 12px",
        background: "transparent",
        border: "1px solid #2A2A2E",
        borderRadius: "5px",
        color: "#999",
        fontSize: "12px",
        textDecoration: "none",
      }}
    >
      Sign in
    </a>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "12px", color: "#888" }}>{user.email}</span>
      <button
        onClick={handleLogout}
        style={{
          padding: "5px 12px",
          background: "transparent",
          border: "1px solid #2A2A2E",
          borderRadius: "5px",
          color: "#999",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
