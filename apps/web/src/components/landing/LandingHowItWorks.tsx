const steps = [
  {
    number: '01',
    label: 'Step One',
    title: 'Build Your\nMaster CV',
    body: 'Import your existing CV as raw text — AI cleans and structures it into a consistent format. Or fill in the guided form. One-time setup, reused for every application you send.',
  },
  {
    number: '02',
    label: 'Step Two',
    title: 'Paste the Job\nListing',
    body: "Drop in any job description. We extract the ATS keywords, required skills, and the exact job title the recruiter's filter is tuned to.",
  },
  {
    number: '03',
    label: 'Step Three',
    title: 'Download\nYour PDF',
    body: 'AI rewrites each CV section for the role — surgically, not generically. Before-and-after match scores confirm the improvement. Download the PDF. Apply.',
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section
      style={{
        padding: '100px 24px',
        borderTop: '1px solid #1E1E20',
        borderBottom: '1px solid #1E1E20',
      }}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '72px' }}>
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
            How It Works
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {steps.map((step) => (
            <div
              key={step.number}
              className="landing-step"
              style={{
                position: 'relative',
                padding: '48px 44px',
                overflow: 'hidden',
              }}
            >
              {/* Ghost number background */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '-16px',
                  right: '-4px',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: 'clamp(110px, 14vw, 180px)',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.028)',
                  lineHeight: 1,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  letterSpacing: '-0.02em',
                }}
              >
                {step.number}
              </div>

              {/* Step label */}
              <p
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: '#FF5722',
                  margin: '0 0 20px',
                }}
              >
                {step.label}
              </p>

              {/* Title */}
              <h3
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#E2E2E4',
                  lineHeight: 1.08,
                  margin: '0 0 22px',
                  whiteSpace: 'pre-line',
                }}
              >
                {step.title}
              </h3>

              {/* Body */}
              <p
                style={{
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#7A7A84',
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
