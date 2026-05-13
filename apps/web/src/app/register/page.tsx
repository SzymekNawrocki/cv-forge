"use client";

import { useState } from "react";
import { register, APIError } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      setDone(true);
    } catch (err) {
      if (err instanceof APIError && err.status === 400) {
        setError("This email is already registered or the password is too short (min 8 characters).");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
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
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📬</div>
          <h2 style={{ color: "#E2E2E4", fontSize: "20px", marginBottom: "12px" }}>Check your email</h2>
          <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.6 }}>
            We sent a verification link to <strong style={{ color: "#E2E2E4" }}>{email}</strong>.
            Click the link to activate your account.
          </p>
          <a href="/login" style={{ display: "inline-block", marginTop: "24px", color: "#FF5722", fontSize: "13px", textDecoration: "none" }}>
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

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
      }}>
        <h1 style={{
          fontFamily: "var(--font-barlow-condensed), sans-serif",
          fontSize: "28px",
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#E2E2E4",
          marginBottom: "8px",
        }}>
          CV<span style={{ color: "#FF5722" }}>—</span>FORGE
        </h1>
        <p style={{ color: "#888", fontSize: "14px", marginBottom: "32px" }}>Create your account</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#999", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#1A1A1C",
                border: "1px solid #2A2A2E",
                borderRadius: "6px",
                color: "#E2E2E4",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#999", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#1A1A1C",
                border: "1px solid #2A2A2E",
                borderRadius: "6px",
                color: "#E2E2E4",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>Minimum 8 characters</p>
          </div>

          {error && (
            <p style={{ color: "#FF5722", fontSize: "13px", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "11px",
              background: "#FF5722",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#666" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#FF5722", textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
