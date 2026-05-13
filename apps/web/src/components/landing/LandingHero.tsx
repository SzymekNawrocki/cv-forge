export function LandingHero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 52px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '80px 24px',
      }}
    >
      {/* Radial orange halo at top */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(255,87,34,0.10) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />

      {/* Diagonal hatching texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: '920px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#FF5722',
            margin: '0 0 28px',
            animation: 'forge-fade-in 0.5s ease-out 0.1s both',
          }}
        >
          Free &nbsp;·&nbsp; AI-Powered &nbsp;·&nbsp; ATS-Optimized
        </p>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 'clamp(58px, 10.5vw, 104px)',
            fontWeight: 800,
            letterSpacing: '0.035em',
            textTransform: 'uppercase',
            lineHeight: 0.9,
            color: '#E2E2E4',
            margin: '0 0 40px',
            animation: 'forge-fade-in 0.55s ease-out 0.25s both',
          }}
        >
          Your CV.<br />
          <span style={{ color: '#FF5722' }}>Forged</span><br />
          For the Role.
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: 'clamp(15px, 2vw, 18px)',
            fontWeight: 300,
            color: '#7A7A84',
            lineHeight: 1.75,
            maxWidth: '560px',
            margin: '0 auto 52px',
            animation: 'forge-fade-in 0.5s ease-out 0.4s both',
          }}
        >
          Paste a job description. AI surgically rewrites your CV sections to
          match every keyword recruiter filters are scanning for.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            animation: 'forge-fade-in 0.5s ease-out 0.55s both',
          }}
        >
          <a
            href="/forge"
            className="landing-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 34px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #FF5722 0%, #FF8C42 100%)',
              color: '#fff',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 0 22px rgba(255,87,34,0.32)',
            }}
          >
            Start Forging →
          </a>
          <a
            href="/cv-manager"
            className="landing-btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 34px',
              borderRadius: '6px',
              border: '1px solid rgba(255,87,34,0.25)',
              background: 'transparent',
              color: '#C8C8D2',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Build Your CV
          </a>
        </div>

        {/* Bottom micro-text */}
        <p
          style={{
            marginTop: '56px',
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: '12px',
            color: '#3A3A3E',
            letterSpacing: '0.05em',
            animation: 'forge-fade-in 0.5s ease-out 0.7s both',
          }}
        >
          Gemini 2.5 Flash &nbsp;·&nbsp; Groq Llama 3.3 fallback &nbsp;·&nbsp; Entry-level focused
        </p>
      </div>
    </section>
  );
}
