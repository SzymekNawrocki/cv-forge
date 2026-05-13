export function LandingCta() {
  return (
    <section
      style={{
        padding: '100px 24px',
        borderTop: '1px solid #1E1E20',
        background: '#161618',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Accent line */}
        <div
          aria-hidden="true"
          style={{
            width: '48px',
            height: '3px',
            background: 'linear-gradient(90deg, #FF5722, #FFC947)',
            borderRadius: '2px',
            margin: '0 auto 36px',
          }}
        />

        <h2
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 'clamp(42px, 7vw, 68px)',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#E2E2E4',
            lineHeight: 0.95,
            margin: '0 0 24px',
          }}
        >
          Ready to<br />
          <span style={{ color: '#FF5722' }}>Forge?</span>
        </h2>

        <p
          style={{
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: '16px',
            fontWeight: 300,
            color: '#7A7A84',
            lineHeight: 1.7,
            margin: '0 0 48px',
          }}
        >
          Your next application could be your best one.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          <a
            href="/forge"
            className="landing-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '15px 40px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #FF5722 0%, #FF8C42 100%)',
              color: '#fff',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 0 24px rgba(255,87,34,0.32)',
            }}
          >
            Open CV Forge →
          </a>
          <a
            href="/cv-manager"
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#FF8C42',
              textDecoration: 'none',
              letterSpacing: '0.02em',
              transition: 'color 0.2s ease',
            }}
          >
            Set up your profile first →
          </a>
        </div>
      </div>
    </section>
  );
}
