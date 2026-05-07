"use client";

import { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import { fetchMasterCVs, forgeCV, type MasterCV, type TailoredCV } from "@/lib/api";
import type { CVData } from "@/components/CVDocument";

const CVViewer = dynamic(() => import("@/components/CVViewer"), { ssr: false });

function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 75 ? "bg-green-100 text-green-800 border-green-200" :
    score >= 50 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                 "bg-red-100 text-red-800 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${color}`}>
      {label}: {Math.round(score)}%
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function parseCVData(result: TailoredCV): CVData | null {
  try {
    return JSON.parse(result.content_json) as CVData;
  } catch {
    return null;
  }
}

export default function ForgePage() {
  const [cvs, setCVs] = useState<MasterCV[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<TailoredCV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchMasterCVs().then((data) => {
      setCVs(data);
      if (data.length > 0) setSelectedId(data[0].id);
    }).catch(() => {});
  }, []);

  function handleForge() {
    if (!selectedId || !jdText.trim()) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const tailored = await forgeCV(Number(selectedId), jdText.trim());
        setResult(tailored);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Forge failed");
      }
    });
  }

  const cvData = result ? parseCVData(result) : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CV Forge</h1>
        <div className="flex items-center gap-3">
          {result && (
            <div className="flex items-center gap-2">
              <ScoreBadge label="Before" score={result.initial_match_score} />
              <span className="text-gray-400 text-xs">→</span>
              <ScoreBadge label="After" score={result.match_score} />
            </div>
          )}
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {cvs.length === 0 && <option value="">No CVs — import one first</option>}
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>{cv.title}</option>
            ))}
          </select>
          <button
            onClick={handleForge}
            disabled={isPending || !selectedId || !jdText.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? <><Spinner /> Forging…</> : "⚡ Forge"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6" style={{ minHeight: "75vh" }}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Job Description
          </label>
          <textarea
            className="flex-1 border border-gray-300 rounded px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Paste the full job description here…"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2" style={{ minHeight: 0 }}>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tailored CV {result ? `(#${result.id})` : ""}
          </label>
          {isPending ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-gray-200 rounded bg-gray-50">
              <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm text-gray-400">AI is forging your CV…</span>
            </div>
          ) : cvData ? (
            <CVViewer data={cvData} cvId={result!.id} />
          ) : result ? (
            <div className="flex-1 flex items-center justify-center border border-red-200 rounded bg-red-50">
              <span className="text-sm text-red-500">Failed to parse CV data</span>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-gray-300 rounded bg-gray-50">
              <span className="text-sm text-gray-400">Result appears here after forging</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
