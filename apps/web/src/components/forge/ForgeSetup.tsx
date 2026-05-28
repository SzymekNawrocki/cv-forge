"use client";

import ForgeSpinner from "./ForgeSpinner";
import ForgeProgress from "./ForgeProgress";
import type { MasterCV } from "@/lib/api";

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

  return (
    <main className="h-[calc(100vh-52px)] flex flex-col p-6 px-8 gap-4 bg-forge-base overflow-hidden">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-[0.08em] uppercase text-forge-text m-0 leading-none">
            FORGE<span className="text-forge-orange"> /</span>
          </h1>
          <p className="font-body text-xs text-forge-muted mt-[5px] mb-0">
            Paste a job description — the AI rewrites your CV sections with keyword insertions
          </p>
        </div>

        {/* Aggressive toggle + CV selector + Forge */}
        <div className="flex items-center gap-2.5">
          {/* Aggressive toggle */}
          <label className="flex items-center gap-[7px] cursor-pointer select-none">
            <div
              onClick={() => onAggressiveToggle(!aggressive)}
              className="relative cursor-pointer w-[34px] h-[18px] rounded-[9px] border transition-[background,border-color] duration-[180ms]"
              style={{
                background: aggressive ? "#FF5722" : "#272729",
                borderColor: aggressive ? "#FF5722" : "#3A3A3E",
              }}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full bg-forge-text transition-[left] duration-[180ms]"
                style={{ left: aggressive ? "16px" : "2px" }}
              />
            </div>
            <span
              className="font-body text-[11px]"
              style={{ color: aggressive ? "var(--color-forge-heat)" : "var(--color-forge-muted)", fontWeight: aggressive ? 700 : 400 }}
            >
              Aggressive
            </span>
          </label>

          <div className="relative">
            <select
              className="appearance-none bg-forge-surface border border-forge-border rounded-md py-[9px] pl-3 pr-9 font-body text-[13px] text-forge-text cursor-pointer outline-none min-w-[200px]"
              value={selectedId}
              onChange={(e) => onSelectId(Number(e.target.value))}
            >
              {cvs.length === 0 && <option value="">No CVs — import first</option>}
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id} className="bg-forge-surface text-forge-text">{cv.title}</option>
              ))}
            </select>
            <span className="absolute right-[11px] top-1/2 -translate-y-1/2 pointer-events-none text-forge-muted text-[11px]">▾</span>
          </div>

          <button
            onClick={onForge}
            disabled={disabled}
            className={`relative flex items-center gap-2 py-2.5 px-[22px] rounded-md font-display text-sm font-bold tracking-[0.12em] uppercase transition-all duration-200 overflow-hidden border ${
              disabled
                ? "border-forge-border cursor-not-allowed text-forge-ghost"
                : "border-transparent cursor-pointer text-white shadow-[0_0_10px_rgba(255,87,34,0.18),0_2px_8px_rgba(0,0,0,0.40)]"
            }`}
            style={{ background: disabled ? "#1A1A1C" : "linear-gradient(135deg, #FF5722, #FF8C42)" }}
          >
            {isPending && <ForgeSpinner size={15} />}
            <span className="relative">{isPending ? "Forging..." : "⚡ Forge"}</span>
          </button>
        </div>
      </div>

      {/* Aggressive caption */}
      {aggressive && (
        <div className="py-2 px-3.5 bg-[rgba(255,87,34,0.06)] border border-[rgba(255,87,34,0.18)] rounded-md font-body text-[11px] text-forge-heat">
          Insert every JD keyword even without matching experience — review &amp; delete inaccurate claims after
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 py-3 px-4 bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.20)] rounded-[7px]">
          <span className="font-body text-[13px] text-[#F87171] flex-1">{error}</span>
          <button
            onClick={onForge}
            disabled={isPending || !selectedId || !jdText.trim()}
            className="shrink-0 py-1 px-3 font-display text-[10px] font-bold tracking-[0.12em] uppercase border border-[rgba(248,113,113,0.35)] rounded text-[#F87171] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(248,113,113,0.08)] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* JD textarea */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <label className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-forge-label">
          Job Description
        </label>
        {isPending ? (
          <div className="flex-1 flex items-center justify-center">
            <ForgeProgress />
          </div>
        ) : (
          <textarea
            className="forge-input flex-1 bg-forge-surface border border-forge-track rounded-[7px] py-4 px-[18px] font-body text-[13px] text-forge-steel resize-none outline-none leading-[1.75]"
            placeholder="Paste the full job description here..."
            value={jdText}
            onChange={(e) => onJdChange(e.target.value)}
          />
        )}
      </div>
    </main>
  );
}
