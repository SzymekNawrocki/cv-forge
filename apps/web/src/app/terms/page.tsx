import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — CV Forge",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-forge-base text-forge-text py-12 px-8">
      <div className="max-w-[680px] mx-auto">
        <h1 className="font-display text-[32px] font-extrabold tracking-[0.06em] uppercase text-forge-text mb-2">
          Terms of Service
        </h1>
        <p className="font-body text-forge-muted text-[13px] mb-10">
          Last updated: May 2026. Contact:{" "}
          <a href="mailto:devnawrocki@gmail.com" className="text-forge-orange no-underline">
            devnawrocki@gmail.com
          </a>
        </p>

        {[
          {
            title: "Acceptance",
            body: `By creating an account and using CV Forge, you agree to these Terms. If you do not agree, do not use the service.`,
          },
          {
            title: "Service description",
            body: `CV Forge is an AI-assisted CV tailoring tool. It rewrites sections of your CV to include keywords from a job description you provide, aiming to improve ATS compatibility. This is a portfolio/demonstration project provided free of charge.`,
          },
          {
            title: "No employment guarantees",
            body: `CV Forge is a CV-assistance tool only. We do not guarantee any employment outcomes, interview invitations, or job offers as a result of using the service. The AI output is a suggestion — you are responsible for reviewing, verifying, and approving all changes before submitting your CV to employers.`,
          },
          {
            title: "AI-generated content",
            body: `The AI may insert keywords, skills, or experience language that does not accurately reflect your background. You must review all AI-generated content and remove any inaccurate claims before using the CV. CV Forge accepts no liability for misrepresentation on a submitted CV.`,
          },
          {
            title: "Acceptable use",
            body: `You may not use CV Forge to create CVs for others without their knowledge, to submit fraudulent applications, to reverse-engineer the service, or to violate any applicable law. We reserve the right to suspend accounts that violate these terms.`,
          },
          {
            title: "Fair use limits",
            body: `The free tier is limited to 20 forge operations per 24-hour period per account. We reserve the right to adjust limits without notice to ensure service availability.`,
          },
          {
            title: "Data ownership",
            body: `You retain full ownership of the CV content you enter. By using the service, you grant CV Forge a limited licence to process your content for the purpose of providing the service. We do not use your data to train AI models.`,
          },
          {
            title: "Liability limitation",
            body: `CV Forge is provided "as is" without warranty of any kind. To the fullest extent permitted by law, we disclaim all warranties and shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of the service.`,
          },
          {
            title: "Changes to terms",
            body: `We may update these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.`,
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
          <Link href="/privacy" className="font-body text-[13px] text-forge-muted no-underline hover:text-forge-text">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
