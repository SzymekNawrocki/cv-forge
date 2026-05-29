"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import { getTailoredHistory, type TailoredCVListItem } from "@/lib/api";

function ScorePill({ score, label }: { score: number | null; label: string }) {
  if (score == null) return <span className="font-body text-[11px] text-forge-muted">—</span>;
  const color = score >= 80 ? "#4caf50" : score >= 60 ? "#FF8C42" : "#F87171";
  return (
    <span className="font-body text-[11px] font-bold" style={{ color }}>
      {label}: {Math.round(score)}
    </span>
  );
}

function HistoryContent() {
  const params = useSearchParams();
  const cvId = params.get("cvId");

  const { data: history, error, isLoading } = useSWR<TailoredCVListItem[]>(
    cvId ? ["tailored-history", cvId] : null,
    () => getTailoredHistory(Number(cvId)),
    { revalidateOnFocus: false },
  );

  if (!cvId) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-forge-muted text-[13px]">No CV selected.</p>
        <Link href="/forge" className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-forge-orange no-underline mt-3 inline-block">
          Go to Forge
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="font-body text-forge-muted text-[13px] py-8">Loading history...</p>;
  if (error) return <p className="font-body text-[#F87171] text-[13px] py-8">Failed to load history.</p>;
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-forge-muted text-sm tracking-[0.08em] uppercase">No forge history yet</p>
        <p className="font-body text-forge-hint text-[13px] mt-2">Run a forge on this CV to see results here.</p>
        <Link href="/forge" className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-forge-orange no-underline mt-3 inline-block">
          Go to Forge
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_100px_100px_80px] gap-4 py-2 px-3 border-b border-forge-elevated mb-1">
        <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint">Date</span>
        <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint">Before</span>
        <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint">After</span>
        <span className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint">Mode</span>
      </div>
      {history.map((item) => {
        const date = item.created_at
          ? new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "Unknown";
        return (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_100px_100px_80px] gap-4 items-center py-3 px-3 rounded-[6px] hover:bg-forge-surface transition-colors"
          >
            <span className="font-body text-[13px] text-forge-text">{date}</span>
            <ScorePill score={item.initial_match_score} label="Before" />
            <ScorePill score={item.match_score} label="After" />
            <span className="font-body text-[11px] text-forge-muted capitalize">{item.strategy ?? "anchored"}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-forge-base text-forge-text font-body py-12 px-8">
      <div className="max-w-[680px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-extrabold text-3xl tracking-[0.06em] uppercase text-forge-text m-0">
              FORGE<span className="text-forge-orange"> /</span> HISTORY
            </h1>
            <p className="text-forge-muted text-[13px] mt-1.5">All tailored CVs for this master CV.</p>
          </div>
          <Link
            href="/forge"
            className="py-2 px-5 font-display text-[11px] font-bold tracking-[0.12em] uppercase text-white no-underline rounded-md"
            style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
          >
            New Forge
          </Link>
        </div>
        <Suspense fallback={<p className="font-body text-forge-muted text-[13px]">Loading...</p>}>
          <HistoryContent />
        </Suspense>
      </div>
    </main>
  );
}
