"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login, startGoogleOAuth, APIError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof APIError && err.status === 400) {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      const url = await startGoogleOAuth();
      window.location.href = url;
    } catch {
      setError("Could not start Google sign-in. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-base">
      <div className="w-full max-w-[400px] p-10 bg-[#111113] border border-forge-elevated rounded-xl text-center">
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
        <p className="text-[#888] text-sm mb-8">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#999] mb-1.5 uppercase tracking-[0.05em]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="forge-input w-full py-2.5 px-3.5 bg-[#1A1A1C] border border-[#2A2A2E] rounded-md text-forge-text text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[#999] mb-1.5 uppercase tracking-[0.05em]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="forge-input w-full py-2.5 px-3.5 bg-[#1A1A1C] border border-[#2A2A2E] rounded-md text-forge-text text-sm"
            />
          </div>

          {error && (
            <p className="text-forge-orange text-[13px] m-0">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-[11px] bg-forge-orange border-none rounded-md text-white text-sm font-semibold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="border-t border-[#2A2A2E] absolute top-1/2 left-0 right-0" />
          <span className="relative bg-[#111113] px-3 text-[#555] text-xs">or</span>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-[11px] bg-transparent border border-[#2A2A2E] rounded-md text-forge-text text-sm font-medium cursor-pointer flex items-center justify-center gap-[10px] hover:bg-forge-elevated transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-6 text-[13px] text-[#666]">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-forge-orange no-underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
