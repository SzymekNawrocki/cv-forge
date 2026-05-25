'use client';

import { useMemo } from 'react';

export interface CVSection {
  id: string;
  label: string;
  heatPercent: number;
  forgeable: boolean;
}

interface Props {
  sections: CVSection[];
  activeId: string;
  onSelect: (id: string) => void;
  cvName?: string;
}

function heatColor(pct: number): string {
  if (pct >= 85) return '#FFC947';
  if (pct >= 60) return '#FF8C42';
  if (pct >= 30) return '#FF5722';
  if (pct >= 5)  return '#7B3010';
  return '#5C5C66';
}

function heatBarGradient(pct: number): string {
  if (pct >= 85) return 'linear-gradient(90deg, #FF5722, #FFC947)';
  if (pct >= 60) return 'linear-gradient(90deg, #FF5722, #FF8C42)';
  if (pct >= 30) return 'linear-gradient(90deg, #9D2A0E, #FF5722)';
  if (pct >= 5)  return 'linear-gradient(90deg, #4A1205, #7B2410)';
  return '#1A1A1C';
}

function heatBarGlow(pct: number): string {
  if (pct >= 85) return '0 0 10px rgba(255,200,70,0.65), 0 0 4px rgba(255,140,66,0.8)';
  if (pct >= 60) return '0 0 8px rgba(255,87,34,0.50)';
  if (pct >= 30) return '0 0 5px rgba(157,42,14,0.40)';
  return 'none';
}

function heatLabel(pct: number): string {
  if (pct >= 85) return 'FORGED';
  if (pct >= 60) return 'FORGING';
  if (pct >= 30) return 'HEATING';
  if (pct >= 1)  return 'WARMING';
  return 'COLD';
}

function SectionRow({
  section,
  isActive,
  onClick,
}: {
  section: CVSection;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = heatColor(section.heatPercent);

  return (
    <button
      onClick={onClick}
      className={`w-full py-2.5 px-3 rounded-md cursor-pointer text-left transition-all duration-200 mb-0.5 border ${
        isActive
          ? 'border-[rgba(255,87,34,0.35)]'
          : 'border-transparent hover:border-[#323236] hover:bg-white/[0.025]'
      }`}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(255,87,34,0.08) 0%, rgba(22,22,24,0.9) 100%)'
          : undefined,
      }}
    >
      <div className="flex justify-between items-center mb-[7px]">
        <span className={`font-body text-xs font-medium tracking-[0.01em] transition-colors duration-200 ${
          isActive ? 'text-forge-text' : 'text-forge-hint hover:text-forge-text'
        }`}>
          {section.label}
        </span>
        <div className="flex items-center gap-1.5">
          {!section.forgeable && (
            <span className="font-body text-[9px] text-forge-hint tracking-[0.06em] uppercase">
              locked
            </span>
          )}
          <span
            className="font-display text-[10px] font-bold tracking-[0.1em] transition-colors duration-300"
            style={{ color }}
          >
            {heatLabel(section.heatPercent)}
          </span>
        </div>
      </div>

      {/* Mini heat bar */}
      <div className="h-[2px] bg-forge-input rounded-[1px] overflow-hidden">
        <div
          className="h-full rounded-[1px] transition-[width] duration-700"
          style={{
            width: `${Math.max(0, Math.min(100, section.heatPercent))}%`,
            background: heatBarGradient(section.heatPercent),
            boxShadow: isActive ? heatBarGlow(section.heatPercent) : 'none',
            transitionTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />
      </div>
    </button>
  );
}

export default function CVEditorSidebar({ sections, activeId, onSelect, cvName = 'Master CV' }: Props) {
  const { forgeableSections, overallHeat } = useMemo(() => {
    const fs = sections.filter(s => s.forgeable);
    return {
      forgeableSections: fs,
      overallHeat: fs.length > 0
        ? Math.round(fs.reduce((sum, s) => sum + s.heatPercent, 0) / fs.length)
        : 0,
    };
  }, [sections]);

  void forgeableSections;

  return (
    <aside
      className="forge-scroll w-[260px] shrink-0 bg-forge-base border-r border-forge-border flex flex-col overflow-y-auto py-5 px-3"
    >
      {/* Active CV chip */}
      <div className="mb-[18px]">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint mb-2 pl-0.5">
          Active CV
        </p>
        <div className="py-2.5 px-3 bg-forge-surface border border-forge-border rounded-[7px] flex items-center justify-between">
          <div>
            <p className="font-body text-[13px] font-medium text-forge-text mb-0.5">
              {cvName}
            </p>
            <p className="font-body text-[11px] text-forge-muted">
              {sections.length} sections
            </p>
          </div>
          {/* Active pulse dot */}
          <div
            className="w-2 h-2 rounded-full bg-forge-orange animate-[forge-pulse_2.2s_ease-in-out_infinite]"
            style={{ boxShadow: '0 0 10px rgba(255,87,34,0.55)' }}
          />
        </div>
      </div>

      {/* Overall forge heat */}
      <div className="py-3.5 px-3 bg-forge-surface border border-forge-border rounded-[7px] mb-[18px]">
        <div className="flex justify-between items-center mb-2">
          <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint">
            Forge Heat
          </span>
          <span
            className="font-display text-2xl font-extrabold leading-none"
            style={{ color: heatColor(overallHeat) }}
          >
            {overallHeat}%
          </span>
        </div>
        {/* Master heat bar */}
        <div className="h-1 bg-forge-input rounded-[2px] overflow-hidden border border-forge-track">
          <div
            className="h-full rounded-[2px] transition-[width] duration-900"
            style={{
              width: `${overallHeat}%`,
              background: heatBarGradient(overallHeat),
              boxShadow: heatBarGlow(overallHeat),
              transitionTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          />
        </div>
      </div>

      {/* Sections list */}
      <div>
        <p className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint mb-2 pl-0.5">
          CV Sections
        </p>
        {sections.map(section => (
          <SectionRow
            key={section.id}
            section={section}
            isActive={activeId === section.id}
            onClick={() => onSelect(section.id)}
          />
        ))}
      </div>
    </aside>
  );
}
