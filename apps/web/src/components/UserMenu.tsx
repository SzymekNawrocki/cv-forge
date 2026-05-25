"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, type CurrentUser } from "@/lib/api";

export default function UserMenu() {
  const router = useRouter();
  const { data: user } = useSWR<CurrentUser | null>("currentUser", getCurrentUser, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    onSuccess: (data) => {
      if (typeof document === "undefined") return;
      if (data) {
        const secure = window.location.protocol === "https:";
        document.cookie = `session=1; path=/; SameSite=Strict${secure ? "; Secure" : ""}; Max-Age=604800`;
      } else {
        document.cookie = "session=; path=/; Max-Age=0";
      }
    },
  });

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!user) return (
    <a
      href="/login"
      className="py-[5px] px-3 bg-transparent border border-forge-border rounded-[5px] text-[#999] text-xs no-underline hover:text-forge-text hover:border-[#3A3A3E] transition-colors"
    >
      Sign in
    </a>
  );

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-forge-muted">{user.email}</span>
      <button
        onClick={handleLogout}
        className="py-[5px] px-3 bg-transparent border border-forge-border rounded-[5px] text-[#999] text-xs cursor-pointer hover:text-forge-text hover:border-[#3A3A3E] transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
