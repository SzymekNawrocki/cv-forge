'use client';

function heatColor(pct: number): string {
  if (pct >= 85) return '#FFC947';
  if (pct >= 60) return '#FF8C42';
  if (pct >= 30) return '#FF5722';
  if (pct >= 5)  return '#7B3010';
  return '#3A3A3E';
}

function heatBarGradient(pct: number): string {
  if (pct >= 85) return 'linear-gradient(90deg, #FF5722 0%, #FFC947 100%)';
  if (pct >= 60) return 'linear-gradient(90deg, #FF5722 0%, #FF8C42 100%)';
  if (pct >= 30) return 'linear-gradient(90deg, #9D2A0E 0%, #FF5722 100%)';
  if (pct >= 5)  return 'linear-gradient(90deg, #4A1205 0%, #7B2410 100%)';
  return '#1A1A1C';
}

function heatBarGlow(pct: number): string {
  if (pct >= 85) return '0 0 14px rgba(255,200,70,0.70), 0 0 5px rgba(255,140,66,0.90)';
  if (pct >= 60) return '0 0 10px rgba(255,87,34,0.55), 0 0 4px rgba(255,140,66,0.65)';
  if (pct >= 30) return '0 0 6px rgba(157,42,14,0.45)';
  return 'none';
}

function heatLabel(pct: number): string {
  if (pct >= 85) return 'FORGED';
  if (pct >= 60) return 'FORGING';
  if (pct >= 30) return 'HEATING';
  if (pct >= 1)  return 'WARMING';
  return 'COLD';
}

interface Props {
  icon: string;
  title: string;
  description: string;
  heatPercent: number;
  ctaLabel?: string;
  onAction?: () => void;
}

export default function ForgeFeatureCard({
  icon,
  title,
  description,
  heatPercent,
  ctaLabel = 'Ignite',
  onAction,
}: Props) {
  const color = heatColor(heatPercent);
  const isHot = heatPercent >= 30;

  return (
    <div className="group relative p-6 bg-forge-surface border border-forge-border rounded-[10px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.30)] hover:border-[rgba(255,87,34,0.38)] hover:shadow-[0_0_36px_rgba(255,87,34,0.09),0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-[250ms] animate-[forge-fade-in_0.4s_ease-out_both]"
      style={{
        background: undefined,
      }}
    >
      {/* Top edge glow line */}
      <div
        className="absolute top-0 left-[8%] right-[8%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,87,34,0.65), transparent)',
          boxShadow: '0 0 8px rgba(255,87,34,0.4)',
        }}
      />

      {/* Header row */}
      <div className="flex justify-between items-start mb-[18px]">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 border transition-all duration-[250ms] group-hover:shadow-[0_0_18px_rgba(255,87,34,0.22)]"
          style={{
            background: 'rgba(255,87,34,0.07)',
            borderColor: 'rgba(255,87,34,0.13)',
          }}
        >
          {icon}
        </div>

        {/* Heat badge */}
        <span
          className="py-1 px-2.5 rounded font-display text-[11px] font-bold tracking-widest transition-all duration-[250ms] border"
          style={{
            background: isHot ? 'rgba(255,87,34,0.10)' : 'rgba(255,255,255,0.03)',
            borderColor: isHot ? 'rgba(255,87,34,0.28)' : '#272729',
            color,
          }}
        >
          {heatLabel(heatPercent)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-[22px] font-extrabold tracking-[0.06em] uppercase text-forge-text mb-2 leading-[1.1]">
        {title}
      </h3>

      {/* Description */}
      <p className="font-body text-[13px] text-[#6E6E78] leading-[1.75] mb-[22px]">
        {description}
      </p>

      {/* Heat bar */}
      <div className="mb-[22px]">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-[#5C5C66]">
            Forge Heat
          </span>
          <span
            className="font-display text-sm font-bold transition-colors duration-300"
            style={{ color }}
          >
            {heatPercent}%
          </span>
        </div>
        <div className="h-[3px] bg-[#1A1A1C] rounded-[2px] overflow-hidden border border-[#222224]">
          <div
            className="h-full rounded-[2px] transition-[width] duration-[800ms]"
            style={{
              width: `${Math.max(0, Math.min(100, heatPercent))}%`,
              background: heatBarGradient(heatPercent),
              boxShadow: heatBarGlow(heatPercent),
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={onAction}
        className="relative py-2.5 px-[22px] border-none rounded-md cursor-pointer font-display text-[13px] font-bold tracking-[0.14em] uppercase text-white hover:text-forge-base active:scale-[0.97] shadow-[0_0_10px_rgba(255,87,34,0.18),0_2px_8px_rgba(0,0,0,0.40)] hover:shadow-[0_0_32px_rgba(255,200,70,0.32),0_0_14px_rgba(255,140,66,0.5),0_4px_16px_rgba(255,87,34,0.28)] transition-all duration-[200ms] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF8C42 100%)' }}
      >
        {/* Sheen sweep */}
        <span
          className="absolute inset-y-0 left-0 w-[45%] pointer-events-none animate-[forge-sheen_0.50s_ease-out_1] opacity-0 hover:opacity-100"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
          }}
        />
        <span className="relative">{ctaLabel} →</span>
      </button>
    </div>
  );
}
