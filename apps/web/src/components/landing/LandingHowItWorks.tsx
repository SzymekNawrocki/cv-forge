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
    <section className="py-[100px] px-6 border-t border-forge-elevated border-b border-b-forge-elevated">
      <div className="max-w-[1120px] mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-[72px]">
          <div
            className="w-[3px] h-[34px] rounded-[2px] shrink-0"
            style={{ background: 'linear-gradient(180deg, #FF5722 0%, #FFC947 100%)' }}
          />
          <h2
            className="font-display font-extrabold tracking-[0.06em] uppercase text-forge-text m-0"
            style={{ fontSize: 'clamp(28px, 4vw, 38px)' }}
          >
            How It Works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {steps.map((step) => (
            <div
              key={step.number}
              className="landing-step relative py-12 px-11 overflow-hidden"
            >
              {/* Ghost number background */}
              <div
                aria-hidden="true"
                className="absolute top-[-16px] right-[-4px] font-display font-extrabold text-white/[0.028] leading-none select-none pointer-events-none tracking-[-0.02em]"
                style={{ fontSize: 'clamp(110px, 14vw, 180px)' }}
              >
                {step.number}
              </div>

              {/* Step label */}
              <p className="font-display text-[10px] font-bold tracking-[0.24em] uppercase text-forge-orange mb-5">
                {step.label}
              </p>

              {/* Title */}
              <h3
                className="font-display font-extrabold tracking-[0.04em] uppercase text-forge-text leading-[1.08] mb-[22px] whitespace-pre-line"
                style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}
              >
                {step.title}
              </h3>

              {/* Body */}
              <p className="font-body font-light text-forge-muted text-sm leading-[1.8] m-0">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
