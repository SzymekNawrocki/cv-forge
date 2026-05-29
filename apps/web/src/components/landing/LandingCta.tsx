export function LandingCta() {
  return (
    <section className="py-[100px] px-6 border-t border-forge-elevated bg-forge-surface text-center">
      <div className="max-w-[640px] mx-auto">
        {/* Accent line */}
        <div
          aria-hidden="true"
          className="w-12 h-[3px] rounded-[2px] mx-auto mb-9"
          style={{ background: 'linear-gradient(90deg, #FF5722, #FFC947)' }}
        />

        <h2
          className="font-display font-extrabold tracking-[0.05em] uppercase text-forge-text leading-[0.95] mb-6"
          style={{ fontSize: 'clamp(42px, 7vw, 68px)' }}
        >
          Ready to<br />
          <span className="text-forge-orange">Forge?</span>
        </h2>

        <p className="font-body font-light text-base text-forge-muted leading-[1.7] mb-12">
          Your next application could be your best one.
        </p>

        <div className="flex flex-col items-center gap-[18px]">
          <a
            href="/forge"
            className="landing-btn-primary inline-flex items-center gap-2 py-[15px] px-10 rounded-md text-white font-display text-base font-bold tracking-[0.13em] uppercase no-underline shadow-[0_0_24px_rgba(255,87,34,0.32)]"
            style={{ background: 'linear-gradient(90deg, #FF5722 0%, #FF8C42 100%)' }}
          >
            Open CV Forge →
          </a>
          <a
            href="/cv-manager"
            className="font-body text-[13px] font-medium text-forge-heat no-underline tracking-[0.02em] transition-colors hover:text-forge-ember"
          >
            Set up your profile first →
          </a>
        </div>

        <div className="mt-16 pt-8 border-t border-forge-elevated flex justify-center gap-6 flex-wrap">
          <a href="/privacy" className="font-body text-[12px] text-forge-ghost no-underline hover:text-forge-muted transition-colors">Privacy Policy</a>
          <a href="/terms" className="font-body text-[12px] text-forge-ghost no-underline hover:text-forge-muted transition-colors">Terms of Service</a>
          <a href="https://github.com/SzymekNawrocki" target="_blank" rel="noopener noreferrer" className="font-body text-[12px] text-forge-ghost no-underline hover:text-forge-muted transition-colors">GitHub</a>
        </div>
      </div>
    </section>
  );
}
