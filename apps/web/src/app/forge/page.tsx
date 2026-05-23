"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import useSWR from "swr";
import { fetchMasterCVs, forgeCV, type MasterCV, type TailoredCV } from "@/lib/api";
import type { CVData } from "@/components/CVDocument";
import ForgeSetup from "@/components/forge/ForgeSetup";
import ForgeReview from "@/components/forge/ForgeReview";

function stripAIMarkers(data: CVData): CVData {
  const strip = (s: string) => s.replace(/\[AI:\s*([^\]]+)\]/gi, "$1");
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

export default function ForgePage() {
  const { data: cvs = [] } = useSWR<MasterCV[]>("masterCVs", fetchMasterCVs);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<TailoredCV | null>(null);
  const [editedData, setEditedData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rightTab, setRightTab] = useState<"preview" | "edit">("preview");
  const [dismissedGaps, setDismissedGaps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (cvs.length > 0 && selectedId === "") setSelectedId(cvs[0].id);
  }, [cvs, selectedId]);

  function handleForge() {
    if (!selectedId || !jdText.trim()) return;
    setError(null);
    setResult(null);
    setEditedData(null);
    setDismissedGaps(new Set());
    startTransition(async () => {
      try {
        const tailored = await forgeCV(Number(selectedId), jdText.trim());
        setResult(tailored);
        setRightTab("preview");
        const parsed = parseCVData(tailored);
        if (parsed) setEditedData(parsed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Forge failed");
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

  function dismissGap(gap: string) {
    setDismissedGaps(prev => new Set([...prev, gap]));
  }

  if (!hasResult) {
    return (
      <ForgeSetup
        cvs={cvs}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        jdText={jdText}
        onJdChange={setJdText}
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
      error={error}
      isPending={isPending}
      rightTab={rightTab}
      onTabChange={setRightTab}
      dismissedGaps={dismissedGaps}
      onDismissGap={dismissGap}
      onEditedData={setEditedData}
      onForge={handleForge}
    />
  );
}
