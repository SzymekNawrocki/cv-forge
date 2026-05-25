export function LandingHero() {
  return (
    <section className="relative min-h-[calc(100vh-52px)] flex items-center justify-center overflow-hidden py-20 px-6">
      {/* Radial orange halo at top */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(255,87,34,0.10) 0%, transparent 68%)',
        }}
      />

      {/* Diagonal hatching texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 40px)',
        }}
      />

      <div className="relative max-w-[920px] w-full text-center">
        {/* Eyebrow */}
        <p
          className="font-display text-[11px] font-bold tracking-[0.24em] uppercase text-forge-orange mb-7 animate-[forge-fade-in_0.5s_ease-out_0.1s_both]"
        >
          Free &nbsp;·&nbsp; AI-Powered &nbsp;·&nbsp; ATS-Optimized
        </p>

        {/* Main headline */}
        <h1
          className="font-display font-extrabold tracking-[0.035em] uppercase leading-[0.9] text-forge-text mb-10 animate-[forge-fade-in_0.55s_ease-out_0.25s_both]"
          style={{ fontSize: 'clamp(58px, 10.5vw, 104px)' }}
        >
          Your CV.<br />
          <span className="text-forge-orange">Forged</span><br />
          For the Role.
        </h1>

        {/* Tagline */}
        <p
          className="font-body font-light text-forge-muted leading-[1.75] max-w-[560px] mx-auto mb-[52px] animate-[forge-fade-in_0.5s_ease-out_0.4s_both]"
          style={{ fontSize: 'clamp(15px, 2vw, 18px)' }}
        >
          Paste a job description. AI surgically rewrites your CV sections to
          match every keyword recruiter filters are scanning for.
        </p>

        {/* CTAs */}
        <div className="flex gap-3.5 justify-center flex-wrap animate-[forge-fade-in_0.5s_ease-out_0.55s_both]">
          <a
            href="/forge"
            className="landing-btn-primary inline-flex items-center gap-2 py-3.5 px-[34px] rounded-md text-white font-display text-[15px] font-bold tracking-[0.13em] uppercase no-underline shadow-[0_0_22px_rgba(255,87,34,0.32)]"
            style={{ background: 'linear-gradient(90deg, #FF5722 0%, #FF8C42 100%)' }}
          >
            Start Forging →
          </a>
          <a
            href="/cv-manager"
            className="landing-btn-secondary inline-flex items-center gap-2 py-3.5 px-[34px] rounded-md bg-transparent text-forge-label font-display text-[15px] font-bold tracking-[0.13em] uppercase no-underline border border-[rgba(255,87,34,0.25)]"
          >
            Build Your CV
          </a>
        </div>

        {/* Bottom micro-text */}
        <p
          className="mt-14 font-body text-xs text-forge-ghost tracking-[0.05em] animate-[forge-fade-in_0.5s_ease-out_0.7s_both]"
        >
          Gemini 2.5 Flash &nbsp;·&nbsp; Groq Llama 3.3 fallback &nbsp;·&nbsp; Entry-level focused
        </p>
      </div>
    </section>
  );
}
