import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — CV Forge",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-forge-base text-forge-text py-12 px-8">
      <div className="max-w-[680px] mx-auto">
        <h1 className="font-display text-[32px] font-extrabold tracking-[0.06em] uppercase text-forge-text mb-2">
          Privacy Policy
        </h1>
        <p className="font-body text-forge-muted text-[13px] mb-10">
          Last updated: May 2026. Contact:{" "}
          <a href="mailto:devnawrocki@gmail.com" className="text-forge-orange no-underline">
            devnawrocki@gmail.com
          </a>
        </p>

        {[
          {
            title: "What we collect",
            body: `We collect your email and name via Google OAuth. We also store the CV content you enter (master CVs, skills, job descriptions) and AI-generated tailored CVs. We log AI API call metadata (token counts, latency) for cost tracking — never the content of those calls.`,
          },
          {
            title: "How we use your data",
            body: `Your data is used solely to provide the CV tailoring service. We do not sell, share, or use your data for advertising. AI requests are forwarded to Groq (primary) and OpenRouter (fallback) — see their respective privacy policies for how they handle request content.`,
          },
          {
            title: "Where data is stored",
            body: `Your data is stored in a Neon PostgreSQL database located in an EU region (eu-central-1, Frankfurt). The API runs on Render (EU region). The frontend is hosted on Vercel. Error monitoring uses Sentry — error payloads are anonymised where possible.`,
          },
          {
            title: "Data processors",
            body: `Google (OAuth login), Vercel (frontend hosting), Render (API hosting), Neon (database), Groq (AI inference), OpenRouter (AI inference fallback), Sentry (error monitoring).`,
          },
          {
            title: "Your rights (GDPR)",
            body: `You have the right to access, export, and delete your data at any time. Use the "Download my data" and "Delete account" buttons in Settings. Account deletion permanently removes all your CVs, skills, job descriptions, and tailored outputs.`,
          },
          {
            title: "Cookies",
            body: `We use a single session cookie ("auth") to keep you logged in for 7 days. We do not use tracking cookies, analytics cookies, or any third-party advertising cookies.`,
          },
          {
            title: "Retention",
            body: `We retain your data until you delete your account. AI call logs are retained for 90 days for billing and abuse-prevention purposes.`,
          },
          {
            title: "Contact",
            body: `For any privacy questions or erasure requests, email devnawrocki@gmail.com. We aim to respond within 72 hours.`,
          },
        ].map(({ title, body }) => (
          <section key={title} className="mb-8">
            <h2 className="font-display text-[14px] font-bold tracking-[0.1em] uppercase text-forge-text mb-3">
              {title}
            </h2>
            <p className="font-body text-[14px] text-forge-muted leading-relaxed">{body}</p>
          </section>
        ))}

        <div className="mt-12 pt-6 border-t border-forge-elevated">
          <Link href="/" className="font-body text-[13px] text-forge-orange no-underline">
            ← Back to CV Forge
          </Link>
          {" · "}
          <Link href="/terms" className="font-body text-[13px] text-forge-muted no-underline hover:text-forge-text">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
