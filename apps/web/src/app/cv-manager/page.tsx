"use client";

import { useState, useEffect, useTransition } from "react";
import { fetchMasterCVs, importCV, type MasterCV } from "@/lib/api";

export default function CVManagerPage() {
  const [cvs, setCVs] = useState<MasterCV[]>([]);
  const [selected, setSelected] = useState<MasterCV | null>(null);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchMasterCVs().then(setCVs).catch(() => setCVs([]));
  }, []);

  function handleImport() {
    if (!title.trim() || !rawText.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const cv = await importCV(title.trim(), rawText.trim());
        setCVs((prev) => [cv, ...prev]);
        setTitle("");
        setRawText("");
        setSelected(cv);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 flex gap-6">
      <section className="w-64 shrink-0 flex flex-col gap-3">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Saved CVs</h2>
        {cvs.length === 0 && (
          <p className="text-sm text-gray-400">No CVs yet.</p>
        )}
        {cvs.map((cv) => (
          <button
            key={cv.id}
            onClick={() => setSelected(cv)}
            className={`text-left px-3 py-2 rounded text-sm truncate border transition-colors ${
              selected?.id === cv.id
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            {cv.title}
          </button>
        ))}
      </section>

      <div className="flex-1 flex flex-col gap-6">
        {selected ? (
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-gray-900">{selected.title}</h1>
            <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-auto max-h-[60vh]">
              {selected.content_markdown}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-bold text-gray-900">Import CV</h1>
            <input
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="CV title (e.g. My Master CV)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Paste raw CV text here — AI will clean and format it into Markdown"
              rows={16}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleImport}
              disabled={isPending || !title.trim() || !rawText.trim()}
              className="self-start px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Importing…" : "Import & Clean"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
