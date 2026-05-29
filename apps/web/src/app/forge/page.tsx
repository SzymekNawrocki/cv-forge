"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import {
  fetchMasterCVs,
  forgeCVAsync,
  pollForgeJob,
  APIError,
  type MasterCV,
  type TailoredCV,
  type ForgeJobState,
} from "@/lib/api";
import { stripMarkers } from "@/lib/aiMarker";
import type { CVData } from "@/components/CVDocument";
import ForgeSetup from "@/components/forge/ForgeSetup";
import ForgeReview from "@/components/forge/ForgeReview";

function stripAIMarkers(data: CVData): CVData {
  const strip = (s: string) => stripMarkers(s);
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

function parseCVData(result: TailoredCV): CVData | null {
  try { return JSON.parse(result.content_json) as CVData; }
  catch { return null; }
}

function extractErrorMessage(e: unknown): string {
  if (e instanceof APIError) {
    try {
      const parsed = JSON.parse(e.message) as { detail?: string };
      if (typeof parsed.detail === "string") return `[${e.status}] ${parsed.detail}`;
    } catch { /* raw body */ }
    return `[${e.status}] ${e.message}`;
  }
  return e instanceof Error ? e.message : "Forge failed";
}

export default function ForgePage() {
  const { data: cvs = [] } = useSWR<MasterCV[]>("masterCVs", fetchMasterCVs);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [jdText, setJdText] = useState("");
  const [aggressive, setAggressive] = useState(false);
  const [result, setResult] = useState<TailoredCV | null>(null);
  const [editedData, setEditedData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [rightTab, setRightTab] = useState<"preview" | "edit">("preview");

  // Polling state for async forge job
  const [jobId, setJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cvs.length > 0 && selectedId === "") setSelectedId(cvs[0].id);
  }, [cvs, selectedId]);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(jid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const state: ForgeJobState = await pollForgeJob(jid);
        if (state.status === "done" && state.result) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setJobId(null);
          setIsPending(false);
          setResult(state.result);
          setRightTab("preview");
          const parsed = parseCVData(state.result);
          if (parsed) setEditedData(parsed);
        } else if (state.status === "failed") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setJobId(null);
          setIsPending(false);
          setError(state.error ?? "Forge failed");
        }
      } catch (e) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setJobId(null);
        setIsPending(false);
        setError(extractErrorMessage(e));
      }
    }, 800);
  }

  async function handleForge() {
    if (!selectedId || !jdText.trim()) return;
    setError(null);
    setResult(null);
    setEditedData(null);
    setIsPending(true);
    try {
      const { job_id } = await forgeCVAsync(Number(selectedId), jdText.trim(), aggressive);
      setJobId(job_id);
      startPolling(job_id);
    } catch (e) {
      setIsPending(false);
      setError(extractErrorMessage(e));
    }
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

  if (cvs.length === 0 && !isPending) {
    return (
      <main className="flex-1 flex items-center justify-center bg-forge-base">
        <div className="text-center max-w-[360px] px-6">
          <p className="font-display text-forge-muted text-sm tracking-[0.08em] uppercase mb-2">No CV Selected</p>
          <p className="font-body text-forge-hint text-[13px] mb-6">
            Import your CV or fill it in manually to start forging tailored applications.
          </p>
          <a
            href="/cv-manager"
            className="inline-block py-2.5 px-6 rounded-md font-display text-[12px] font-bold tracking-[0.12em] uppercase text-white no-underline"
            style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
          >
            Go to CV Manager
          </a>
        </div>
      </main>
    );
  }

  if (!hasResult) {
    return (
      <ForgeSetup
        cvs={cvs}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        jdText={jdText}
        onJdChange={setJdText}
        aggressive={aggressive}
        onAggressiveToggle={setAggressive}
        error={error}
        isPending={isPending}
        onForge={handleForge}
      />
    );
  }

  return (
    <ForgeReview
      result={result!}
      cvData={cvData!}
      cleanData={cleanData}
      jdText={jdText}
      cvs={cvs}
      selectedId={selectedId}
      onSelectId={setSelectedId}
      aggressive={aggressive}
      onAggressiveToggle={setAggressive}
      error={error}
      isPending={isPending}
      rightTab={rightTab}
      onTabChange={setRightTab}
      onEditedData={setEditedData}
      onForge={handleForge}
    />
  );
}
