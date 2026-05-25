"use client";

import { useState } from "react";
import Image from "next/image";
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
      <div className="min-h-screen flex items-center justify-center bg-forge-base">
        <div className="w-full max-w-[400px] p-10 bg-forge-card border border-forge-elevated rounded-xl text-center">
          <div className="text-[40px] mb-4">📬</div>
          <h2 className="text-forge-text text-xl mb-3">Check your email</h2>
          <p className="text-forge-hint text-sm leading-[1.6]">
            We sent a verification link to <strong className="text-forge-text">{email}</strong>.
            Click the link to activate your account.
          </p>
          <a href="/login" className="inline-block mt-6 text-forge-orange text-[13px] no-underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-base">
      <div className="w-full max-w-[400px] p-10 bg-forge-card border border-forge-elevated rounded-xl text-center">
        <div className="flex justify-center -mt-10 -mb-[60px]">
          <Image
            src="/cv-forge-logo.png"
            alt="CV Forge"
            height={52}
            width={200}
            className="object-contain block"
            priority
          />
        </div>
        <p className="text-forge-hint text-sm mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-forge-label mb-1.5 uppercase tracking-[0.05em]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="forge-input w-full py-2.5 px-3.5 bg-forge-input border border-forge-line rounded-md text-forge-text text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-forge-label mb-1.5 uppercase tracking-[0.05em]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="forge-input w-full py-2.5 px-3.5 bg-forge-input border border-forge-line rounded-md text-forge-text text-sm"
            />
            <p className="text-[11px] text-forge-hint mt-1">Minimum 8 characters</p>
          </div>

          {error && (
            <p className="text-forge-orange text-[13px] m-0">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-[11px] bg-forge-orange border-none rounded-md text-white text-sm font-semibold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center mt-6 text-[13px] text-forge-hint">
          Already have an account?{" "}
          <a href="/login" className="text-forge-orange no-underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
