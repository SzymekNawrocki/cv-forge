"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import ForgeSpinner from "./ForgeSpinner";
import ScoreBadge from "./ScoreBadge";
import CVEditor from "./CVEditor";
import { downloadDocx } from "@/lib/api";
import type { MasterCV, TailoredCV } from "@/lib/api";
import type { CVData } from "@/components/CVDocument";

const CVViewer = dynamic(() => import("@/components/CVViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-forge-muted font-body text-[13px]">
      Loading preview...
    </div>
  ),
});

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

  async function handleDocxDownload() {
    await downloadDocx(result.master_cv_id, result.id);
  }

  return (
    <main className="h-[calc(100vh-52px)] flex flex-col p-4 px-6 gap-3 bg-forge-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="font-display text-[22px] font-extrabold tracking-[0.08em] uppercase text-forge-text m-0 leading-none">
          FORGE<span className="text-forge-orange"> /</span>
        </h1>
        <div className="flex items-center gap-2">
          <ScoreBadge label="Before" score={result.initial_match_score} />
          <span className="text-forge-muted text-sm">→</span>
          <ScoreBadge label="After" score={result.match_score} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-[5px] py-[5px] px-2.5 bg-[rgba(180,83,9,0.08)] border border-[rgba(180,83,9,0.20)] rounded-[5px]">
            <span className="font-body text-[10px] text-[#B45309] font-bold">AI</span>
            <span className="font-body text-[10px] text-forge-muted">&nbsp;= AI insertion — review &amp; delete if inaccurate</span>
          </div>

          <Link
            href={`/forge/history?cvId=${result.master_cv_id}`}
            className="py-[5px] px-3 font-display text-[10px] font-bold tracking-[0.12em] uppercase cursor-pointer rounded-[5px] border border-forge-border text-forge-muted no-underline hover:text-forge-text hover:border-forge-ghost transition-colors"
          >
            History
          </Link>

          {/* Aggressive toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <div
              onClick={() => onAggressiveToggle(!aggressive)}
              className="relative cursor-pointer w-[28px] h-[15px] rounded-lg border transition-[background,border-color] duration-[180ms]"
              style={{
                background: aggressive ? "#FF5722" : "#272729",
                borderColor: aggressive ? "#FF5722" : "#3A3A3E",
              }}
            >
              <div
                className="absolute top-[1px] w-[11px] h-[11px] rounded-full bg-forge-text transition-[left] duration-[180ms]"
                style={{ left: aggressive ? "13px" : "1px" }}
              />
            </div>
            <span
              className="font-body text-[10px]"
              style={{ color: aggressive ? "var(--color-forge-heat)" : "var(--color-forge-muted)", fontWeight: aggressive ? 700 : 400 }}
            >
              Aggressive
            </span>
          </label>

          <button
            onClick={onForge}
            disabled={isPending}
            className={`relative flex items-center gap-2 py-2 px-4 rounded-md font-display text-xs font-bold tracking-[0.12em] uppercase transition-all duration-200 border ${
              isPending
                ? "border-forge-border cursor-not-allowed text-forge-ghost"
                : "border-transparent cursor-pointer text-white shadow-[0_0_10px_rgba(255,87,34,0.18),0_2px_8px_rgba(0,0,0,0.40)]"
            }`}
            style={{ background: isPending ? "#1A1A1C" : "linear-gradient(135deg, #FF5722, #FF8C42)" }}
          >
            {isPending && <ForgeSpinner size={13} />}
            <span className="relative">{isPending ? "Forging..." : "⟳ Reforge"}</span>
          </button>
        </div>
      </div>

      {/* Failed sections banner */}
      {failedSections.length > 0 && (
        <div className="py-2 px-3.5 bg-[rgba(255,140,66,0.06)] border border-[rgba(255,140,66,0.20)] rounded-md font-body text-[11px] text-forge-heat">
          {failedSections.length} section{failedSections.length > 1 ? "s" : ""} couldn&apos;t be optimized — Reforge to retry.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-2.5 px-3.5 bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.20)] rounded-[7px] font-body text-xs text-[#F87171]">
          {error}
        </div>
      )}

      {/* Two-column body */}
      <div className="flex-1 grid gap-4 min-h-0" style={{ gridTemplateColumns: "200px 1fr" }}>
        {/* Left: JD + CV selector */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <label className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-forge-label shrink-0">
            Job Description
          </label>
          <textarea
            readOnly
            value={jdText}
            className="flex-1 bg-forge-card border border-forge-elevated rounded-md py-2.5 px-3 font-body text-[11px] text-forge-hint resize-none outline-none leading-[1.6] cursor-default"
          />
          <div className="relative shrink-0">
            <select
              className="w-full appearance-none bg-forge-card border border-forge-elevated rounded-md py-[7px] pl-2.5 pr-7 font-body text-[11px] text-forge-hint cursor-pointer outline-none"
              value={selectedId}
              onChange={(e) => onSelectId(Number(e.target.value))}
            >
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id} className="bg-forge-surface text-forge-text">{cv.title}</option>
              ))}
            </select>
            <span className="absolute right-[9px] top-1/2 -translate-y-1/2 pointer-events-none text-forge-muted text-[10px]">▾</span>
          </div>

          {/* DOCX download */}
          <button
            onClick={handleDocxDownload}
            className="w-full py-[7px] px-3 bg-transparent border border-forge-border rounded-[5px] font-display text-[10px] font-bold tracking-[0.1em] uppercase text-forge-label cursor-pointer hover:text-forge-text hover:border-forge-ghost transition-colors"
          >
            Download .docx
          </button>
        </div>

        {/* Center: Preview / Edit */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex gap-1 items-center shrink-0">
            {(["preview", "edit"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`py-[5px] px-3.5 font-display text-[10px] font-bold tracking-[0.12em] uppercase cursor-pointer rounded-[5px] border transition-colors ${
                  rightTab === tab
                    ? "bg-forge-elevated border-forge-line text-forge-text"
                    : "bg-transparent border-transparent text-forge-muted"
                }`}
              >
                {tab}
              </button>
            ))}
            <span className="font-display text-[10px] tracking-[0.16em] uppercase text-forge-muted ml-auto">
              CV #{result.id}
            </span>
          </div>
          {rightTab === "preview" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <CVViewer data={cvData} cvId={result.id} masterCvId={result.master_cv_id} cleanData={cleanData ?? undefined} />
            </div>
          )}
          {rightTab === "edit" && (
            <div className="flex-1 overflow-y-auto bg-forge-surface border border-forge-track rounded-[7px] p-4">
              <CVEditor data={cvData} onChange={onEditedData} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
