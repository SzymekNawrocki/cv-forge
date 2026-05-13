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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0D0D0E",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
        background: "#111113",
        border: "1px solid #1E1E20",
        borderRadius: "12px",
        textAlign: "center",
      }}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
            <h2 style={{ color: "#E2E2E4", fontSize: "20px" }}>Verifying your email…</h2>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ color: "#E2E2E4", fontSize: "20px", marginBottom: "12px" }}>Email verified!</h2>
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>
              Your account is active. You can now sign in.
            </p>
            <a
              href="/login"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "#FF5722",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>❌</div>
            <h2 style={{ color: "#E2E2E4", fontSize: "20px", marginBottom: "12px" }}>Verification failed</h2>
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>{errorMsg}</p>
            <a href="/login" style={{ color: "#FF5722", fontSize: "13px", textDecoration: "none" }}>
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
