"use client";

import { F } from "@/lib/theme";
import type { MasterCV } from "@/lib/api";

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

interface Props {
  cvs: MasterCV[];
  selectedId: number | "";
  onSelectId: (id: number) => void;
  jdText: string;
  onJdChange: (text: string) => void;
  aggressive: boolean;
  onAggressiveToggle: (v: boolean) => void;
  error: string | null;
  isPending: boolean;
  onForge: () => void;
}

export default function ForgeSetup({
  cvs, selectedId, onSelectId, jdText, onJdChange,
  aggressive, onAggressiveToggle,
  error, isPending, onForge,
}: Props) {
  const disabled = isPending || !selectedId || !jdText.trim();

  const forgeBtn = {
    position: "relative" as const, display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 22px",
    background: disabled ? "#1A1A1C" : "linear-gradient(135deg, #FF5722, #FF8C42)",
    border: `1px solid ${disabled ? "#272729" : "transparent"}`,
    borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: F.display, fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: disabled ? "#3A3A3E" : "#fff",
    boxShadow: !disabled ? "0 0 10px rgba(255,87,34,0.18), 0 2px 8px rgba(0,0,0,0.40)" : "none",
    transition: "all 0.20s cubic-bezier(0.25,0.46,0.45,0.94)", overflow: "hidden" as const,
  };

  return (
    <main style={{
      height: "calc(100vh - 52px)", display: "flex", flexDirection: "column",
      padding: "24px 32px", gap: "16px",
      background: "#0D0D0E", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" as const }}>
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: "28px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#E2E2E4", margin: 0, lineHeight: 1 }}>
            FORGE<span style={{ color: "#FF5722" }}> /</span>
          </h1>
          <p style={{ fontFamily: F.body, fontSize: "12px", color: "#7A7A84", margin: "5px 0 0 0" }}>
            Paste a job description — the AI rewrites your CV sections with keyword insertions
          </p>
        </div>

        {/* CV selector + Aggressive toggle + Forge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <select
              style={{ appearance: "none", WebkitAppearance: "none", background: "#161618", border: "1px solid #272729", borderRadius: "6px", padding: "9px 36px 9px 12px", fontFamily: F.body, fontSize: "13px", color: "#E2E2E4", cursor: "pointer", outline: "none", minWidth: "200px" }}
              value={selectedId}
              onChange={(e) => onSelectId(Number(e.target.value))}
            >
              {cvs.length === 0 && <option value="">No CVs — import first</option>}
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id} style={{ background: "#161618", color: "#E2E2E4" }}>{cv.title}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#7A7A84", fontSize: "11px" }}>▾</span>
          </div>

          {/* Aggressive toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", userSelect: "none" as const }}>
            <div
              onClick={() => onAggressiveToggle(!aggressive)}
              style={{
                width: "34px", height: "18px", borderRadius: "9px",
                background: aggressive ? "#FF5722" : "#272729",
                border: `1px solid ${aggressive ? "#FF5722" : "#3A3A3E"}`,
                position: "relative", cursor: "pointer",
                transition: "background 0.18s, border-color 0.18s",
              }}
            >
              <div style={{
                position: "absolute", top: "2px",
                left: aggressive ? "16px" : "2px",
                width: "12px", height: "12px", borderRadius: "50%",
                background: "#E2E2E4",
                transition: "left 0.18s",
              }} />
            </div>
            <span style={{ fontFamily: F.body, fontSize: "11px", color: aggressive ? "#FF8C42" : "#5C5C66", fontWeight: aggressive ? 700 : 400 }}>
              Aggressive
            </span>
          </label>

          <button onClick={onForge} disabled={disabled} style={forgeBtn}>
            {isPending && <ForgeSpinner size={15} />}
            <span style={{ position: "relative" }}>{isPending ? "Forging..." : "⚡ Forge"}</span>
          </button>
        </div>
      </div>

      {/* Aggressive caption */}
      {aggressive && (
        <div style={{ padding: "8px 14px", background: "rgba(255,87,34,0.06)", border: "1px solid rgba(255,87,34,0.18)", borderRadius: "6px", fontFamily: F.body, fontSize: "11px", color: "#FF8C42" }}>
          Insert every JD keyword even without matching experience — review &amp; delete inaccurate claims after
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.20)", borderRadius: "7px", fontFamily: F.body, fontSize: "13px", color: "#F87171" }}>
          {error}
        </div>
      )}

      {/* JD textarea */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minHeight: 0 }}>
        <label style={{ fontFamily: F.display, fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "#5C5C66" }}>
          Job Description
        </label>
        {isPending ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "#161618", border: "1px solid rgba(255,87,34,0.18)", borderRadius: "7px" }}>
            <ForgeSpinner size={36} />
            <span style={{ fontFamily: F.body, fontSize: "13px", color: "#7A7A84" }}>AI is forging your CV...</span>
          </div>
        ) : (
          <textarea
            style={{ flex: 1, background: "#161618", border: "1px solid #222224", borderRadius: "7px", padding: "16px 18px", fontFamily: F.body, fontSize: "13px", color: "#B0BEC5", resize: "none", outline: "none", lineHeight: 1.75 }}
            placeholder="Paste the full job description here..."
            value={jdText}
            onChange={(e) => onJdChange(e.target.value)}
          />
        )}
      </div>
    </main>
  );
}
