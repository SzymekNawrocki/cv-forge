"use client";

import { useState } from "react";
import useSWR from "swr";
import { getProfile, updateProfile } from "@/lib/api";

const FREE_MODELS: { id: string; label: string }[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B — Groq (recommended)" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B — Groq" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B — Groq" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant — Groq (fastest)" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B — OpenRouter (fallback)" },
];

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export default function SettingsPage() {
  const { data: profile, mutate, error: loadError } = useSWR("profile", getProfile);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeModel = selectedModel ?? profile?.preferred_model ?? DEFAULT_MODEL;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const updated = await updateProfile({ preferred_model: activeModel });
      await mutate(updated, false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-forge-base text-forge-text font-body py-12 px-7">
      <div className="max-w-[560px] mx-auto">
        <h1 className="font-display font-extrabold text-3xl tracking-[0.06em] uppercase text-forge-text mb-2">
          Settings
        </h1>
        <p className="text-forge-muted text-sm mb-10">
          Global preferences for CV Forge.
        </p>

        <section className="bg-forge-surface border border-forge-elevated rounded-lg px-7 py-6 mb-6">
          <h2 className="font-display font-bold text-sm tracking-[0.1em] uppercase text-forge-muted mb-4">
            AI Model
          </h2>
          <p className="text-[13px] text-forge-muted mb-4 leading-[1.6]">
            Primary model used for CV forging. If it hits a rate limit, the app
            automatically falls back through the remaining free models.
          </p>

          {!profile && !loadError && (
            <p className="text-forge-hint text-[13px]">Loading…</p>
          )}

          {loadError && (
            <p className="text-forge-orange text-[13px]">Failed to load settings.</p>
          )}

          {profile && (
            <>
              <select
                value={activeModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="forge-input w-full bg-forge-base border border-forge-track rounded-md text-forge-text text-[13px] py-2.5 px-3 mb-4 outline-none cursor-pointer"
              >
                {FREE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-forge-orange text-white border-none rounded-md py-[9px] px-5 text-[13px] font-semibold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {saved && (
                  <span className="text-[#4caf50] text-[13px]">Saved</span>
                )}
                {saveError && (
                  <span className="text-forge-orange text-[13px]">{saveError}</span>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
