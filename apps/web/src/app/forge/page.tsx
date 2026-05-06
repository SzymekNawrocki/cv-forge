"use client";

import { useState, useEffect, useTransition } from "react";
import { fetchMasterCVs, forgeCV, type MasterCV, type TailoredCV } from "@/lib/api";

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CV Forge</h1>
        <div className="flex items-center gap-3">
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
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Forging…" : "⚡ Forge"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 min-h-[70vh]">
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

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tailored CV {result ? `(#${result.id})` : ""}
          </label>
          {isPending ? (
            <div className="flex-1 flex items-center justify-center border border-gray-200 rounded bg-gray-50">
              <span className="text-sm text-gray-400 animate-pulse">AI is forging your CV…</span>
            </div>
          ) : result ? (
            <pre className="flex-1 border border-gray-200 rounded bg-gray-50 px-4 py-3 text-sm font-mono whitespace-pre-wrap overflow-auto">
              {result.content_markdown}
            </pre>
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
