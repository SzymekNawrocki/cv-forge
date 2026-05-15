'use client';

import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Heat helpers ─────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionRow({
  section,
  isActive,
  onClick,
}: {
  section: CVSection;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const emphasized = isActive || hovered;
  const color = heatColor(section.heatPercent);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: isActive
          ? 'linear-gradient(135deg, rgba(255,87,34,0.08) 0%, rgba(22,22,24,0.9) 100%)'
          : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(255,87,34,0.35)' : hovered ? '#323236' : 'transparent'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.20s ease',
        marginBottom: '2px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
        <span style={{
          fontFamily: '"IBM Plex Sans", var(--font-ibm-plex-sans), sans-serif',
          fontSize: '12px',
          fontWeight: 500,
          color: emphasized ? '#E2E2E4' : '#9A9AA4',
          letterSpacing: '0.01em',
          transition: 'color 0.2s ease',
        }}>
          {section.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!section.forgeable && (
            <span style={{
              fontFamily: '"IBM Plex Sans", var(--font-ibm-plex-sans), sans-serif',
              fontSize: '9px',
              color: '#5C5C66',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              locked
            </span>
          )}
          <span style={{
            fontFamily: '"Barlow Condensed", var(--font-barlow-condensed), sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color,
            transition: 'color 0.3s ease',
          }}>
            {heatLabel(section.heatPercent)}
          </span>
        </div>
      </div>

      {/* Mini heat bar */}
      <div style={{ height: '2px', background: '#1A1A1C', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, section.heatPercent))}%`,
          background: heatBarGradient(section.heatPercent),
          borderRadius: '1px',
          boxShadow: isActive ? heatBarGlow(section.heatPercent) : 'none',
          transition: 'width 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
        }} />
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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

  return (
    <aside
      className="forge-scroll"
      style={{
        width: '260px',
        flexShrink: 0,
        background: '#0D0D0E',
        borderRight: '1px solid #272729',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '20px 12px',
      }}
    >
      {/* Active CV chip */}
      <div style={{ marginBottom: '18px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", var(--font-barlow-condensed), sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#5C5C66',
          marginBottom: '8px',
          paddingLeft: '2px',
        }}>
          Active CV
        </p>
        <div style={{
          padding: '10px 12px',
          background: '#161618',
          border: '1px solid #272729',
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              fontFamily: '"IBM Plex Sans", var(--font-ibm-plex-sans), sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#E2E2E4',
              marginBottom: '2px',
            }}>
              {cvName}
            </p>
            <p style={{
              fontFamily: '"IBM Plex Sans", var(--font-ibm-plex-sans), sans-serif',
              fontSize: '11px',
              color: '#7A7A84',
            }}>
              {sections.length} sections
            </p>
          </div>
          {/* Active pulse dot */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#FF5722',
            boxShadow: '0 0 10px rgba(255,87,34,0.55)',
            animation: 'forge-pulse 2.2s ease-in-out infinite',
          }} />
        </div>
      </div>

      {/* Overall forge heat */}
      <div style={{
        padding: '14px 12px',
        background: '#161618',
        border: '1px solid #272729',
        borderRadius: '7px',
        marginBottom: '18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{
            fontFamily: '"Barlow Condensed", var(--font-barlow-condensed), sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5C5C66',
          }}>
            Forge Heat
          </span>
          <span style={{
            fontFamily: '"Barlow Condensed", var(--font-barlow-condensed), sans-serif',
            fontSize: '24px',
            fontWeight: 800,
            color: heatColor(overallHeat),
            lineHeight: 1,
          }}>
            {overallHeat}%
          </span>
        </div>
        {/* Master heat bar */}
        <div style={{ height: '4px', background: '#1A1A1C', borderRadius: '2px', overflow: 'hidden', border: '1px solid #222224' }}>
          <div style={{
            height: '100%',
            width: `${overallHeat}%`,
            background: heatBarGradient(overallHeat),
            borderRadius: '2px',
            boxShadow: heatBarGlow(overallHeat),
            transition: 'width 0.9s cubic-bezier(0.25,0.46,0.45,0.94)',
          }} />
        </div>
      </div>

      {/* Sections list */}
      <div>
        <p style={{
          fontFamily: '"Barlow Condensed", var(--font-barlow-condensed), sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#5C5C66',
          marginBottom: '8px',
          paddingLeft: '2px',
        }}>
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
