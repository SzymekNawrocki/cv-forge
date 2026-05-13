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
    <section style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '56px' }}>
          <div
            style={{
              width: '3px',
              height: '34px',
              background: 'linear-gradient(180deg, #FF5722 0%, #FFC947 100%)',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#E2E2E4',
              margin: 0,
            }}
          >
            What It Does
          </h2>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1px',
            background: '#1E1E20',
            border: '1px solid #1E1E20',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="landing-feature-card"
              style={{
                background: '#161618',
                border: '1px solid transparent',
                padding: '32px 28px',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'rgba(255,87,34,0.08)',
                  border: '1px solid rgba(255,87,34,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF5722',
                  marginBottom: '20px',
                  flexShrink: 0,
                }}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <p
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#E2E2E4',
                  margin: '0 0 12px',
                }}
              >
                {feature.title}
              </p>

              {/* Description */}
              <p
                style={{
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: '#7A7A84',
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
