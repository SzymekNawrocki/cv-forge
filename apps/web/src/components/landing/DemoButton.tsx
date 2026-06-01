"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startDemo, APIError } from "@/lib/api";

export function DemoButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hidden) return null;

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      await startDemo();
      router.push("/forge");
    } catch (e) {
      if (e instanceof APIError && e.status === 404) {
        setHidden(true);
      } else {
        setError("Demo unavailable — try again later.");
        setPending(false);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 py-3.5 px-[34px] rounded-md font-display text-[15px] font-bold tracking-[0.13em] uppercase border border-[rgba(255,255,255,0.12)] bg-transparent text-forge-muted cursor-pointer disabled:cursor-not-allowed transition-all duration-200 hover:border-[rgba(255,255,255,0.28)] hover:text-forge-label"
      >
        {pending ? "Starting Demo…" : "Try the Demo — no signup"}
      </button>
      {error && (
        <p className="font-body text-[11px] text-forge-orange">{error}</p>
      )}
    </div>
  );
}
