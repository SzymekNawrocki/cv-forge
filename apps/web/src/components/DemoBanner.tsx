"use client";

import useSWR from "swr";
import { getCurrentUser } from "@/lib/api";

export function DemoBanner() {
  const { data: user } = useSWR("currentUser", getCurrentUser, { revalidateOnFocus: false });

  if (!user?.is_demo) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-[rgba(255,87,34,0.12)] border-b border-[rgba(255,87,34,0.25)] px-4 py-2 text-center">
      <p className="font-body text-[12px] text-forge-muted">
        You&apos;re in demo mode — sample data, resets periodically.{" "}
        <a
          href="/register"
          className="text-forge-orange font-semibold no-underline hover:underline"
        >
          Sign up to save your work
        </a>
      </p>
    </div>
  );
}
