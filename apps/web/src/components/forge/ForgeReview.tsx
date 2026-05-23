"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { F } from "@/lib/theme";
import type { MasterCV, TailoredCV } from "@/lib/api";
import type { CVData, CVSection } from "@/components/CVDocument";

const CVViewer = dynamic(() => import("@/components/CVViewer"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#5C5C70", fontFamily: F.body, fontSize: "13px" }}>
      Loading preview...
    </div>
  ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number)  { return s >= 75 ? "#4ADE80" : s >= 50 ? "#FF8C42" : "#F87171"; }
function scoreBg(s: number)     { return s >= 75 ? "rgba(74,222,128,0.08)" : s >= 50 ? "rgba(255,140,66,0.08)" : "rgba(248,113,113,0.08)"; }
function scoreBorder(s: number) { return s >= 75 ? "rgba(74,222,128,0.22)" : s >= 50 ? "rgba(255,140,66,0.22)" : "rgba(248,113,113,0.22)"; }

function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 14px", background: scoreBg(score), border: `1px solid ${scoreBorder(score)}`, borderRadius: "8px", minWidth: "64px" }}>
      <span style={{ fontFamily: F.display, fontSize: "24px", fontWeight: 800, letterSpacing: "0.04em", color: scoreColor(score), lineHeight: 1 }}>
        {Math.round(score)}
      </span>
      <span style={{ fontFamily: F.body, fontSize: "9px", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: "#7A7A84", marginTop: "2px" }}>
        {label}
      </span>
    </div>
  );
}

function ForgeSpinner({ size = 16 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `${size <= 20 ? 2 : 3}px solid rgba(255,87,34,0.25)`,
      borderTopColor: "#FF5722",
      animation: "forge-spin 0.75s linear infinite",
      boxShadow: size > 20 ? "0 0 16px rgba(255,87,34,0.28)" : "none",
      flexShrink: 0,
    }} />
  );
}

// ── Section Editor ────────────────────────────────────────────────────────────

function SectionEditor({ section, onChange }: { section: CVSection; onChange: (updated: CVSection) => void }) {
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
    section.type === "paragraph" ? (section.content ?? "").slice(0, 80) + "..."
    : section.type === "bullets" ? `${section.items?.length ?? 0} items`
    : `${section.entries?.length ?? 0} entries`;

  return (
    <div style={{ borderBottom: "1px solid #1E1E20" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontFamily: F.display, fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#B0BEC5" }}>
          {section.heading}
        </span>
        <span style={{ fontFamily: F.body, fontSize: "10px", color: "#5C5C66" }}>
          {open ? "▲" : "▼"} {!open && preview}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: "12px" }}>
          {section.type === "paragraph" && (
            <textarea value={section.content ?? ""} onChange={(e) => updateParagraph(e.target.value)} rows={5}
              style={{ width: "100%", boxSizing: "border-box", background: "#0D0D0E", border: "1px solid #222224", borderRadius: "5px", padding: "8px 10px", fontFamily: F.body, fontSize: "12px", color: "#B0BEC5", resize: "vertical", outline: "none", lineHeight: 1.6 }} />
          )}
          {section.type === "bullets" && (
            <textarea value={(section.items ?? []).join("\n")} onChange={(e) => updateBullets(e.target.value)} rows={Math.max(4, (section.items ?? []).length + 1)}
              style={{ width: "100%", boxSizing: "border-box", background: "#0D0D0E", border: "1px solid #222224", borderRadius: "5px", padding: "8px 10px", fontFamily: F.body, fontSize: "12px", color: "#B0BEC5", resize: "vertical", outline: "none", lineHeight: 1.6 }} />
          )}
          {section.type === "entries" && section.entries?.map((entry, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ fontFamily: F.body, fontSize: "11px", color: "#7A7A84", marginBottom: "4px" }}>
                <strong style={{ color: "#B0BEC5" }}>{entry.org}</strong> — {entry.role} — {entry.date}
              </div>
              <textarea value={entry.bullets.join("\n")} onChange={(e) => updateEntryBullets(i, e.target.value)} rows={Math.max(2, entry.bullets.length + 1)}
                style={{ width: "100%", boxSizing: "border-box", background: "#0D0D0E", border: "1px solid #222224", borderRadius: "5px", padding: "8px 10px", fontFamily: F.body, fontSize: "12px", color: "#B0BEC5", resize: "vertical", outline: "none", lineHeight: 1.6 }} />
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
  function updateContact(field: keyof CVData["contact"], value: string) {
    onChange({ ...data, contact: { ...data.contact, [field]: value } });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      <div style={{ borderBottom: "1px solid #1E1E20", paddingBottom: "12px", marginBottom: "4px" }}>
        <div style={{ fontFamily: F.display, fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#5C5C66", marginBottom: "8px" }}>Header</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {([
            { label: "Name", field: "name" as keyof CVData, val: data.name },
            { label: "Title", field: "title" as keyof CVData, val: data.title },
          ]).map(({ label, field, val }) => (
            <div key={field}>
              <div style={{ fontFamily: F.body, fontSize: "10px", color: "#5C5C66", marginBottom: "3px" }}>{label}</div>
              <input value={val as string} onChange={(e) => updateField(field, e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", background: "#0D0D0E", border: "1px solid #222224", borderRadius: "4px", padding: "5px 8px", fontFamily: F.body, fontSize: "12px", color: "#E2E2E4", outline: "none" }} />
            </div>
          ))}
          {(["email", "phone", "portfolio", "github", "location"] as const).map((f) => (
            <div key={f}>
              <div style={{ fontFamily: F.body, fontSize: "10px", color: "#5C5C66", marginBottom: "3px", textTransform: "capitalize" as const }}>{f}</div>
              <input value={data.contact[f] ?? ""} onChange={(e) => updateContact(f, e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", background: "#0D0D0E", border: "1px solid #222224", borderRadius: "4px", padding: "5px 8px", fontFamily: F.body, fontSize: "12px", color: "#E2E2E4", outline: "none" }} />
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

// ── Review Phase ──────────────────────────────────────────────────────────────

interface Props {
  result: TailoredCV;
  cvData: CVData;
  cleanData: CVData | null;
  jdText: string;
  cvs: MasterCV[];
  selectedId: number | "";
  onSelectId: (id: number) => void;
  aggressive: boolean;
  onAggressiveToggle: (v: boolean) => void;
  error: string | null;
  isPending: boolean;
  rightTab: "preview" | "edit";
  onTabChange: (tab: "preview" | "edit") => void;
  onEditedData: (data: CVData) => void;
  onForge: () => void;
}

export default function ForgeReview({
  result, cvData, cleanData, jdText, cvs, selectedId, onSelectId,
  aggressive, onAggressiveToggle,
  error, isPending, rightTab, onTabChange,
  onEditedData, onForge,
}: Props) {
  const failedSections = result.failed_sections ?? [];

  const forgeBtn = {
    position: "relative" as const, display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 16px",
    background: isPending ? "#1A1A1C" : "linear-gradient(135deg, #FF5722, #FF8C42)",
    border: `1px solid ${isPending ? "#272729" : "transparent"}`,
    borderRadius: "6px", cursor: isPending ? "not-allowed" : "pointer",
    fontFamily: F.display, fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: isPending ? "#3A3A3E" : "#fff",
    boxShadow: !isPending ? "0 0 10px rgba(255,87,34,0.18), 0 2px 8px rgba(0,0,0,0.40)" : "none",
    transition: "all 0.20s cubic-bezier(0.25,0.46,0.45,0.94)",
  };

  return (
    <main style={{ height: "calc(100vh - 52px)", display: "flex", flexDirection: "column", padding: "16px 24px", gap: "12px", background: "#0D0D0E", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" as const }}>
        <h1 style={{ fontFamily: F.display, fontSize: "22px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#E2E2E4", margin: 0, lineHeight: 1 }}>
          FORGE<span style={{ color: "#FF5722" }}> /</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ScoreBadge label="Before" score={result.initial_match_score} />
          <span style={{ color: "#3A3A3E", fontSize: "14px" }}>→</span>
          <ScoreBadge label="After" score={result.match_score} />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.20)", borderRadius: "5px" }}>
            <span style={{ fontFamily: F.body, fontSize: "10px", color: "#B45309", fontWeight: 700 }}>AI</span>
            <span style={{ fontFamily: F.body, fontSize: "10px", color: "#7A7A84" }}>&nbsp;= AI insertion — review &amp; delete if inaccurate</span>
          </div>

          {/* Aggressive toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" as const }}>
            <div
              onClick={() => onAggressiveToggle(!aggressive)}
              style={{
                width: "28px", height: "15px", borderRadius: "8px",
                background: aggressive ? "#FF5722" : "#272729",
                border: `1px solid ${aggressive ? "#FF5722" : "#3A3A3E"}`,
                position: "relative", cursor: "pointer",
                transition: "background 0.18s, border-color 0.18s",
              }}
            >
              <div style={{
                position: "absolute", top: "1px",
                left: aggressive ? "13px" : "1px",
                width: "11px", height: "11px", borderRadius: "50%",
                background: "#E2E2E4",
                transition: "left 0.18s",
              }} />
            </div>
            <span style={{ fontFamily: F.body, fontSize: "10px", color: aggressive ? "#FF8C42" : "#5C5C66", fontWeight: aggressive ? 700 : 400 }}>
              Aggressive
            </span>
          </label>

          <button onClick={onForge} disabled={isPending} style={forgeBtn}>
            {isPending && <ForgeSpinner size={13} />}
            <span style={{ position: "relative" }}>{isPending ? "Forging..." : "⟳ Reforge"}</span>
          </button>
        </div>
      </div>

      {/* Failed sections banner */}
      {failedSections.length > 0 && (
        <div style={{ padding: "8px 14px", background: "rgba(255,140,66,0.06)", border: "1px solid rgba(255,140,66,0.20)", borderRadius: "6px", fontFamily: F.body, fontSize: "11px", color: "#FF8C42" }}>
          {failedSections.length} section{failedSections.length > 1 ? "s" : ""} couldn&apos;t be optimized — Reforge to retry.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 14px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.20)", borderRadius: "7px", fontFamily: F.body, fontSize: "12px", color: "#F87171" }}>
          {error}
        </div>
      )}

      {/* Two-column body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px", minHeight: 0 }}>
        {/* Left: JD + CV selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minHeight: 0 }}>
          <label style={{ fontFamily: F.display, fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "#5C5C66", flexShrink: 0 }}>Job Description</label>
          <textarea readOnly value={jdText}
            style={{ flex: 1, background: "#111113", border: "1px solid #1A1A1C", borderRadius: "6px", padding: "10px 12px", fontFamily: F.body, fontSize: "11px", color: "#5C5C66", resize: "none", outline: "none", lineHeight: 1.6, cursor: "default" }} />
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              style={{ width: "100%", appearance: "none", WebkitAppearance: "none", background: "#111113", border: "1px solid #1A1A1C", borderRadius: "6px", padding: "7px 28px 7px 10px", fontFamily: F.body, fontSize: "11px", color: "#7A7A84", cursor: "pointer", outline: "none" }}
              value={selectedId}
              onChange={(e) => onSelectId(Number(e.target.value))}
            >
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id} style={{ background: "#161618", color: "#E2E2E4" }}>{cv.title}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#5C5C66", fontSize: "10px" }}>▾</span>
          </div>
        </div>

        {/* Center: Preview / Edit */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: 0 }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
            {(["preview", "edit"] as const).map((tab) => (
              <button key={tab} onClick={() => onTabChange(tab)}
                style={{ padding: "5px 14px", background: rightTab === tab ? "#1E1E20" : "none", border: `1px solid ${rightTab === tab ? "#2A2A2C" : "transparent"}`, borderRadius: "5px", fontFamily: F.display, fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: rightTab === tab ? "#E2E2E4" : "#5C5C66", cursor: "pointer" }}>
                {tab}
              </button>
            ))}
            <span style={{ fontFamily: F.display, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "#3A3A3E", marginLeft: "auto" }}>
              CV #{result.id}
            </span>
          </div>
          {rightTab === "preview" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <CVViewer data={cvData} cvId={result.id} cleanData={cleanData ?? undefined} />
            </div>
          )}
          {rightTab === "edit" && (
            <div style={{ flex: 1, overflowY: "auto", background: "#161618", border: "1px solid #222224", borderRadius: "7px", padding: "16px" }}>
              <CVEditor data={cvData} onChange={onEditedData} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
