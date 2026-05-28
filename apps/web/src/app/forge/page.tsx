"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import useSWR from "swr";
import { fetchMasterCVs, forgeCV, APIError, type MasterCV, type TailoredCV } from "@/lib/api";
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
  const [isPending, startTransition] = useTransition();
  const [rightTab, setRightTab] = useState<"preview" | "edit">("preview");

  useEffect(() => {
    if (cvs.length > 0 && selectedId === "") setSelectedId(cvs[0].id);
  }, [cvs, selectedId]);

  function handleForge() {
    if (!selectedId || !jdText.trim()) return;
    setError(null);
    setResult(null);
    setEditedData(null);
    startTransition(async () => {
      try {
        const tailored = await forgeCV(Number(selectedId), jdText.trim(), aggressive);
        setResult(tailored);
        setRightTab("preview");
        const parsed = parseCVData(tailored);
        if (parsed) setEditedData(parsed);
      } catch (e) {
        setError(extractErrorMessage(e));
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
