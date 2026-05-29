"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem("cookie_consent", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 py-4 bg-forge-surface border-t border-forge-elevated shadow-lg">
      <p className="font-body text-[13px] text-forge-muted m-0">
        We use a session cookie for authentication only. No tracking cookies.{" "}
        <a href="/privacy" className="text-forge-orange no-underline hover:underline">Privacy policy</a>
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 py-1.5 px-4 bg-forge-elevated border border-forge-border rounded-md font-display text-[11px] font-bold tracking-[0.1em] uppercase text-forge-text cursor-pointer hover:border-forge-ghost transition-colors"
      >
        OK
      </button>
    </div>
  );
}
