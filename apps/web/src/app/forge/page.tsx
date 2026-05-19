"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { fetchMasterCVs, forgeCV, type MasterCV, type TailoredCV } from "@/lib/api";
import type { CVData, CVSection } from "@/components/CVDocument";

const CVViewer = dynamic(() => import("@/components/CVViewer"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#5C5C70", fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "13px" }}>
      Loading preview...
    </div>
  ),
});

const F = {
  display: '"Barlow Condensed", sans-serif',
  body:    '"IBM Plex Sans", sans-serif',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number)  { return s >= 75 ? '#4ADE80' : s >= 50 ? '#FF8C42' : '#F87171'; }
function scoreBg(s: number)     { return s >= 75 ? 'rgba(74,222,128,0.08)' : s >= 50 ? 'rgba(255,140,66,0.08)' : 'rgba(248,113,113,0.08)'; }
function scoreBorder(s: number) { return s >= 75 ? 'rgba(74,222,128,0.22)' : s >= 50 ? 'rgba(255,140,66,0.22)' : 'rgba(248,113,113,0.22)'; }

function stripAIMarkers(data: CVData): CVData {
  const strip = (s: string) => s.replace(/\[AI:\s*([^\]]+)\]/gi, '$1');
  return {
    ...data,
    sections: data.sections.map((section) => ({
      ...section,
      content: section.content != null ? strip(section.content) : undefined,
      items: section.items?.map(strip),
      entries: section.entries?.map((entry) => ({
        ...entry,
        bullets: entry.bullets.map(strip),
      })),
    })),
  };
}

function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 14px',
      background: scoreBg(score), border: `1px solid ${scoreBorder(score)}`,
      borderRadius: '8px', minWidth: '64px',
    }}>
      <span style={{ fontFamily: F.display, fontSize: '24px', fontWeight: 800, letterSpacing: '0.04em', color: scoreColor(score), lineHeight: 1 }}>
        {Math.round(score)}
      </span>
      <span style={{ fontFamily: F.body, fontSize: '9px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: '#7A7A84', marginTop: '2px' }}>
        {label}
      </span>
    </div>
  );
}

function ForgeSpinner({ size = 16 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `${size <= 20 ? 2 : 3}px solid rgba(255,87,34,0.25)`,
      borderTopColor: '#FF5722',
      animation: 'forge-spin 0.75s linear infinite',
      boxShadow: size > 20 ? '0 0 16px rgba(255,87,34,0.28)' : 'none',
      flexShrink: 0,
    }} />
  );
}

function parseCVData(result: TailoredCV): CVData | null {
  try { return JSON.parse(result.content_json) as CVData; }
  catch { return null; }
}

// ── Section Editor ────────────────────────────────────────────────────────────

function SectionEditor({
  section,
  onChange,
}: {
  section: CVSection;
  onChange: (updated: CVSection) => void;
}) {
  const [open, setOpen] = useState(false);

  function updateParagraph(content: string) { onChange({ ...section, content }); }

  function updateBullets(raw: string) {
    const items = raw.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    onChange({ ...section, items });
  }

  function updateEntryBullets(entryIdx: number, raw: string) {
    const bullets = raw.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    const entries = section.entries!.map((e, i) => i === entryIdx ? { ...e, bullets } : e);
    onChange({ ...section, entries });
  }

  const preview =
    section.type === "paragraph"
      ? (section.content ?? "").slice(0, 80) + "..."
      : section.type === "bullets"
      ? `${section.items?.length ?? 0} items`
      : `${section.entries?.length ?? 0} entries`;

  return (
    <div style={{ borderBottom: '1px solid #1E1E20' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontFamily: F.display, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#B0BEC5' }}>
          {section.heading}
        </span>
        <span style={{ fontFamily: F.body, fontSize: '10px', color: '#5C5C66' }}>
          {open ? '▲' : '▼'} {!open && preview}
        </span>
      </button>

      {open && (
        <div style={{ paddingBottom: '12px' }}>
          {section.type === 'paragraph' && (
            <textarea
              value={section.content ?? ''}
              onChange={(e) => updateParagraph(e.target.value)}
              rows={5}
              style={{ width: '100%', boxSizing: 'border-box', background: '#0D0D0E', border: '1px solid #222224', borderRadius: '5px', padding: '8px 10px', fontFamily: F.body, fontSize: '12px', color: '#B0BEC5', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
            />
          )}
          {section.type === 'bullets' && (
            <textarea
              value={(section.items ?? []).join('\n')}
              onChange={(e) => updateBullets(e.target.value)}
              rows={Math.max(4, (section.items ?? []).length + 1)}
              style={{ width: '100%', boxSizing: 'border-box', background: '#0D0D0E', border: '1px solid #222224', borderRadius: '5px', padding: '8px 10px', fontFamily: F.body, fontSize: '12px', color: '#B0BEC5', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
            />
          )}
          {section.type === 'entries' && section.entries?.map((entry, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ fontFamily: F.body, fontSize: '11px', color: '#7A7A84', marginBottom: '4px' }}>
                <strong style={{ color: '#B0BEC5' }}>{entry.org}</strong> — {entry.role} — {entry.date}
              </div>
              <textarea
                value={entry.bullets.join('\n')}
                onChange={(e) => updateEntryBullets(i, e.target.value)}
                rows={Math.max(2, entry.bullets.length + 1)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0D0D0E', border: '1px solid #222224', borderRadius: '5px', padding: '8px 10px', fontFamily: F.body, fontSize: '12px', color: '#B0BEC5', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CVEditor({ data, onChange }: { data: CVData; onChange: (d: CVData) => void }) {
  function updateSection(idx: number, updated: CVSection) {
    const sections = data.sections.map((s, i) => i === idx ? updated : s);
    onChange({ ...data, sections });
  }
  function updateField(field: keyof CVData, value: string) { onChange({ ...data, [field]: value }); }
  function updateContact(field: keyof CVData['contact'], value: string) {
    onChange({ ...data, contact: { ...data.contact, [field]: value } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ borderBottom: '1px solid #1E1E20', paddingBottom: '12px', marginBottom: '4px' }}>
        <div style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#5C5C66', marginBottom: '8px' }}>Header</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {[
            { label: 'Name', field: 'name' as keyof CVData, val: data.name },
            { label: 'Title', field: 'title' as keyof CVData, val: data.title },
          ].map(({ label, field, val }) => (
            <div key={field}>
              <div style={{ fontFamily: F.body, fontSize: '10px', color: '#5C5C66', marginBottom: '3px' }}>{label}</div>
              <input value={val as string} onChange={(e) => updateField(field, e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0D0D0E', border: '1px solid #222224', borderRadius: '4px', padding: '5px 8px', fontFamily: F.body, fontSize: '12px', color: '#E2E2E4', outline: 'none' }} />
            </div>
          ))}
          {(['email', 'phone', 'portfolio', 'github', 'location'] as const).map((f) => (
            <div key={f}>
              <div style={{ fontFamily: F.body, fontSize: '10px', color: '#5C5C66', marginBottom: '3px', textTransform: 'capitalize' as const }}>{f}</div>
              <input value={data.contact[f] ?? ''} onChange={(e) => updateContact(f, e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0D0D0E', border: '1px solid #222224', borderRadius: '4px', padding: '5px 8px', fontFamily: F.body, fontSize: '12px', color: '#E2E2E4', outline: 'none' }} />
            </div>
          ))}
        </div>
      </div>
      {data.sections.map((section, i) => (
        <SectionEditor key={i} section={section} onChange={(u) => updateSection(i, u)} />
      ))}
    </div>
  );
}

// ── Gap Panel ─────────────────────────────────────────────────────────────────

function GapPanel({ gaps, dismissed, onDismiss }: {
  gaps: string[];
  dismissed: Set<string>;
  onDismiss: (gap: string) => void;
}) {
  const visible = gaps.filter(g => !dismissed.has(g));
  const hiddenCount = gaps.length - visible.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#5C5C66' }}>
          Unmet Gaps
        </span>
        {visible.length > 0 && (
          <span style={{ fontFamily: F.body, fontSize: '10px', color: '#7A7A84' }}>
            {visible.length}
          </span>
        )}
      </div>

      {gaps.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ fontSize: '20px' }}>✓</span>
          <span style={{ fontFamily: F.body, fontSize: '11px', color: '#4ADE80', textAlign: 'center' }}>
            All JD keywords anchored
          </span>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ fontFamily: F.body, fontSize: '11px', color: '#4ADE80', textAlign: 'center' }}>
            All gaps reviewed
          </span>
          {hiddenCount > 0 && (
            <span style={{ fontFamily: F.body, fontSize: '10px', color: '#5C5C66' }}>
              ({hiddenCount} dismissed)
            </span>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontFamily: F.body, fontSize: '10px', color: '#5C5C66', lineHeight: 1.5, marginBottom: '2px' }}>
            Keywords the AI couldn't anchor to your experience. Add them manually or leave them out.
          </div>
          {visible.map((gap) => (
            <div key={gap} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px',
              background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.16)',
              borderRadius: '6px', gap: '8px',
            }}>
              <span style={{ fontFamily: F.body, fontSize: '11px', color: '#F87171', flex: 1, wordBreak: 'break-word' as const }}>
                {gap}
              </span>
              <button
                onClick={() => onDismiss(gap)}
                title="Dismiss"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#5C5C66', fontSize: '14px', lineHeight: 1, padding: '0 2px',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div style={{ fontFamily: F.body, fontSize: '10px', color: '#3A3A3E', textAlign: 'center', paddingTop: '4px' }}>
              {hiddenCount} dismissed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ForgePage() {
  const { data: cvs = [] } = useSWR<MasterCV[]>("masterCVs", fetchMasterCVs);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<TailoredCV | null>(null);
  const [editedData, setEditedData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [btnHovered, setBtnHovered] = useState(false);
  const [rightTab, setRightTab] = useState<'preview' | 'edit'>('preview');
  const [dismissedGaps, setDismissedGaps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (cvs.length > 0 && selectedId === "") setSelectedId(cvs[0].id);
  }, [cvs, selectedId]);

  function handleForge() {
    if (!selectedId || !jdText.trim()) return;
    setError(null);
    setResult(null);
    setEditedData(null);
    setDismissedGaps(new Set());
    startTransition(async () => {
      try {
        const tailored = await forgeCV(Number(selectedId), jdText.trim());
        setResult(tailored);
        setRightTab('preview');
        const parsed = parseCVData(tailored);
        if (parsed) setEditedData(parsed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Forge failed");
      }
    });
  }

  const cvData = useMemo(
    () => editedData ?? (result ? parseCVData(result) : null),
    [editedData, result],
  );

  const cleanData = useMemo(
    () => cvData ? stripAIMarkers(cvData) : null,
    [cvData],
  );

  const hasResult = Boolean(cvData && result && !isPending);
  const disabled = isPending || !selectedId || !jdText.trim();

  function dismissGap(gap: string) {
    setDismissedGaps(prev => new Set([...prev, gap]));
  }

  // ── Shared button styles ──
  const forgeBtn = {
    position: 'relative' as const, display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 22px',
    background: disabled ? '#1A1A1C' : btnHovered ? 'linear-gradient(135deg, #FF8C42, #FFC947)' : 'linear-gradient(135deg, #FF5722, #FF8C42)',
    border: `1px solid ${disabled ? '#272729' : 'transparent'}`,
    borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: F.display, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    color: disabled ? '#3A3A3E' : btnHovered ? '#0D0D0E' : '#fff',
    boxShadow: !disabled && btnHovered ? '0 0 28px rgba(255,200,70,0.30), 0 0 12px rgba(255,140,66,0.45), 0 4px 14px rgba(255,87,34,0.25)' : !disabled ? '0 0 10px rgba(255,87,34,0.18), 0 2px 8px rgba(0,0,0,0.40)' : 'none',
    transition: 'all 0.20s cubic-bezier(0.25,0.46,0.45,0.94)', overflow: 'hidden' as const,
  };

  // ── SETUP PHASE ──────────────────────────────────────────────────────────────
  if (!hasResult) {
    return (
      <main style={{
        height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column',
        padding: '24px 32px', gap: '16px',
        background: '#0D0D0E', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ fontFamily: F.display, fontSize: '28px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#E2E2E4', margin: 0, lineHeight: 1 }}>
              FORGE<span style={{ color: '#FF5722' }}> /</span>
            </h1>
            <p style={{ fontFamily: F.body, fontSize: '12px', color: '#7A7A84', margin: '5px 0 0 0' }}>
              Paste a job description — the AI rewrites your CV sections with anchored keyword insertions
            </p>
          </div>

          {/* CV selector + Forge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <select
                style={{ appearance: 'none', WebkitAppearance: 'none', background: '#161618', border: '1px solid #272729', borderRadius: '6px', padding: '9px 36px 9px 12px', fontFamily: F.body, fontSize: '13px', color: '#E2E2E4', cursor: 'pointer', outline: 'none', minWidth: '200px' }}
                value={selectedId}
                onChange={(e) => setSelectedId(Number(e.target.value))}
              >
                {cvs.length === 0 && <option value="">No CVs — import first</option>}
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id} style={{ background: '#161618', color: '#E2E2E4' }}>{cv.title}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7A7A84', fontSize: '11px' }}>▾</span>
            </div>
            <button
              onClick={handleForge}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              disabled={disabled}
              style={forgeBtn}
            >
              {!disabled && btnHovered && (
                <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '45%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)', animation: 'forge-sheen 0.50s ease-out 1', pointerEvents: 'none' }} />
              )}
              {isPending && <ForgeSpinner size={15} />}
              <span style={{ position: 'relative' }}>{isPending ? 'Forging...' : '⚡ Forge'}</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.20)', borderRadius: '7px', fontFamily: F.body, fontSize: '13px', color: '#F87171' }}>
            {error}
          </div>
        )}

        {/* JD textarea — full height */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
          <label style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#5C5C66' }}>
            Job Description
          </label>
          {isPending ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#161618', border: '1px solid rgba(255,87,34,0.18)', borderRadius: '7px' }}>
              <ForgeSpinner size={36} />
              <span style={{ fontFamily: F.body, fontSize: '13px', color: '#7A7A84' }}>AI is forging your CV...</span>
            </div>
          ) : (
            <textarea
              style={{ flex: 1, background: '#161618', border: '1px solid #222224', borderRadius: '7px', padding: '16px 18px', fontFamily: F.body, fontSize: '13px', color: '#B0BEC5', resize: 'none', outline: 'none', lineHeight: 1.75 }}
              placeholder="Paste the full job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          )}
        </div>
      </main>
    );
  }

  // ── REVIEW PHASE ─────────────────────────────────────────────────────────────
  const gaps = result?.gaps ?? [];

  return (
    <main style={{
      height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column',
      padding: '16px 24px', gap: '12px',
      background: '#0D0D0E', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
        <h1 style={{ fontFamily: F.display, fontSize: '22px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#E2E2E4', margin: 0, lineHeight: 1 }}>
          FORGE<span style={{ color: '#FF5722' }}> /</span>
        </h1>

        {/* Scores */}
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScoreBadge label="Before" score={result.initial_match_score} />
            <span style={{ color: '#3A3A3E', fontSize: '14px' }}>→</span>
            <ScoreBadge label="After" score={result.match_score} />
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* AI marker legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(180,83,9,0.20)', borderRadius: '5px' }}>
            <span style={{ fontFamily: F.body, fontSize: '10px', color: '#B45309', fontWeight: 700 }}>AI</span>
            <span style={{ fontFamily: F.body, fontSize: '10px', color: '#7A7A84' }}>= anchored insertion — review & remove if inaccurate</span>
          </div>

          {/* Reforge */}
          <button
            onClick={handleForge}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            disabled={isPending}
            style={{ ...forgeBtn, padding: '8px 16px', fontSize: '12px' }}
          >
            {isPending && <ForgeSpinner size={13} />}
            <span style={{ position: 'relative' }}>{isPending ? 'Forging...' : '⟳ Reforge'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.20)', borderRadius: '7px', fontFamily: F.body, fontSize: '12px', color: '#F87171' }}>
          {error}
        </div>
      )}

      {/* Three-column body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: '16px', minHeight: 0 }}>

        {/* Left: JD collapsed strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
          <label style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#5C5C66', flexShrink: 0 }}>
            Job Description
          </label>
          <textarea
            readOnly
            value={jdText}
            style={{ flex: 1, background: '#111113', border: '1px solid #1A1A1C', borderRadius: '6px', padding: '10px 12px', fontFamily: F.body, fontSize: '11px', color: '#5C5C66', resize: 'none', outline: 'none', lineHeight: 1.6, cursor: 'default' }}
          />
          {/* CV selector + Reforge inline */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', background: '#111113', border: '1px solid #1A1A1C', borderRadius: '6px', padding: '7px 28px 7px 10px', fontFamily: F.body, fontSize: '11px', color: '#7A7A84', cursor: 'pointer', outline: 'none' }}
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id} style={{ background: '#161618', color: '#E2E2E4' }}>{cv.title}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5C5C66', fontSize: '10px' }}>▾</span>
          </div>
        </div>

        {/* Center: Preview / Edit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
            {(['preview', 'edit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                style={{
                  padding: '5px 14px',
                  background: rightTab === tab ? '#1E1E20' : 'none',
                  border: `1px solid ${rightTab === tab ? '#2A2A2C' : 'transparent'}`,
                  borderRadius: '5px',
                  fontFamily: F.display,
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: rightTab === tab ? '#E2E2E4' : '#5C5C66',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
            <span style={{ fontFamily: F.display, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#3A3A3E', marginLeft: 'auto' }}>
              CV #{result.id}
            </span>
          </div>

          {rightTab === 'preview' && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <CVViewer data={cvData!} cvId={result.id} cleanData={cleanData ?? undefined} />
            </div>
          )}
          {rightTab === 'edit' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#161618', border: '1px solid #222224', borderRadius: '7px', padding: '16px' }}>
              <CVEditor data={cvData!} onChange={setEditedData} />
            </div>
          )}
        </div>

        {/* Right: Gap Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: '#111113', border: '1px solid #1A1A1C', borderRadius: '7px', padding: '14px 12px' }}>
          <GapPanel gaps={gaps} dismissed={dismissedGaps} onDismiss={dismissGap} />
        </div>
      </div>
    </main>
  );
}
