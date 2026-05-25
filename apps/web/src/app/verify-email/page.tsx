"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail, APIError } from "@/lib/api";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the URL.");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        if (err instanceof APIError && err.status === 400) {
          setErrorMsg("This verification link is invalid or has already been used.");
        } else {
          setErrorMsg("Verification failed. Please try again or request a new link.");
        }
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-base">
      <div className="w-full max-w-[400px] p-10 bg-[#111113] border border-forge-elevated rounded-xl text-center">
        {status === "loading" && (
          <>
            <div className="text-[40px] mb-4">⏳</div>
            <h2 className="text-forge-text text-xl">Verifying your email…</h2>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-[40px] mb-4">✅</div>
            <h2 className="text-forge-text text-xl mb-3">Email verified!</h2>
            <p className="text-[#888] text-sm mb-6">
              Your account is active. You can now sign in.
            </p>
            <a
              href="/login"
              className="inline-block py-2.5 px-6 bg-forge-orange rounded-md text-white text-sm font-semibold no-underline"
            >
              Sign in
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-[40px] mb-4">❌</div>
            <h2 className="text-forge-text text-xl mb-3">Verification failed</h2>
            <p className="text-[#888] text-sm mb-6">{errorMsg}</p>
            <a href="/login" className="text-forge-orange text-[13px] no-underline">
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
