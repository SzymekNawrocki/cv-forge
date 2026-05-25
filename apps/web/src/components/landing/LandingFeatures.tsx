import type { ReactNode } from 'react';

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: 'ATS Keyword Injection',
    description:
      "Analyzes every job description for the keywords recruiter filters actually scan. Rewrites your CV to match — precisely, not generically.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="7.5" />
        <circle cx="10" cy="10" r="3.5" />
        <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
        <line x1="10" y1="2.5" x2="10" y2="0.5" />
        <line x1="10" y1="19.5" x2="10" y2="17.5" />
        <line x1="2.5" y1="10" x2="0.5" y2="10" />
        <line x1="19.5" y1="10" x2="17.5" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Heat Score Matching',
    description:
      "Before-and-after match scores on every forge. See exactly how much better your tailored CV performs against the role.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="12" width="4" height="7" rx="1" />
        <rect x="8" y="7" width="4" height="12" rx="1" />
        <rect x="14.5" y="3" width="4" height="16" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Skills Intelligence',
    description:
      "Build a personal skills database once. Every forge automatically pulls the right categories for the role — no manual cherry-picking.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="10" cy="5" rx="7" ry="2.5" />
        <path d="M3 5v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5" />
        <path d="M3 9v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V9" />
      </svg>
    ),
  },
  {
    title: 'PDF Ready to Submit',
    description:
      "Two-column professional layout with full Polish / Latin Extended character support. Download. Submit. Done.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h9l4 4v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
        <polyline points="13,2 13,6 17,6" />
        <line x1="7" y1="9" x2="13" y2="9" />
        <line x1="7" y1="12" x2="13" y2="12" />
        <line x1="7" y1="15" x2="10" y2="15" />
      </svg>
    ),
  },
  {
    title: 'Multiple Master CVs',
    description:
      "Maintain separate base CVs for different career directions. Switch freely and forge each one independently.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 5h9l3 3v9a1 1 0 01-1 1H7a1 1 0 01-1-1V6a1 1 0 011-1z" />
        <polyline points="16,5 16,2 2,2 2,15 6,15" />
      </svg>
    ),
  },
  {
    title: 'Dual-Model AI Cascade',
    description:
      "Gemini 2.5 Flash as primary, Groq Llama 3.3 as automatic fallback. Rate limits never block your application.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13,2 10,8 14,8 7,18 10,12 6,12 13,2" />
      </svg>
    ),
  },
];

export function LandingFeatures() {
  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1120px] mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-14">
          <div
            className="w-[3px] h-[34px] rounded-[2px] shrink-0"
            style={{ background: 'linear-gradient(180deg, #FF5722 0%, #FFC947 100%)' }}
          />
          <h2
            className="font-display font-extrabold tracking-[0.06em] uppercase text-forge-text m-0"
            style={{ fontSize: 'clamp(28px, 4vw, 38px)' }}
          >
            What It Does
          </h2>
        </div>

        {/* Feature grid */}
        <div
          className="grid gap-px bg-forge-elevated border border-forge-elevated rounded-[10px] overflow-hidden"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="landing-feature-card bg-[#161618] border border-transparent p-8"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[rgba(255,87,34,0.08)] border border-[rgba(255,87,34,0.15)] flex items-center justify-center text-forge-orange mb-5 shrink-0">
                {feature.icon}
              </div>

              {/* Title */}
              <p className="font-display text-[13px] font-bold tracking-[0.16em] uppercase text-forge-text mb-3">
                {feature.title}
              </p>

              {/* Description */}
              <p className="font-body font-light text-[13px] text-forge-muted leading-[1.75] m-0">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
