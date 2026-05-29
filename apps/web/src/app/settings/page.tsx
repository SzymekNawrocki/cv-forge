"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { getProfile, updateProfile, getMyData, deleteMe, fetchUsage, type UsageStats } from "@/lib/api";

const FREE_MODELS: { id: string; label: string }[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B — Groq (recommended)" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B — Groq" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B — Groq" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant — Groq (fastest)" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B — OpenRouter (fallback)" },
];

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-forge-surface border border-forge-elevated rounded-lg px-7 py-6 mb-6">
      <h2 className="font-display font-bold text-sm tracking-[0.1em] uppercase text-forge-muted mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: profile, mutate, error: loadError } = useSWR("profile", getProfile);
  const { data: usage } = useSWR<UsageStats>("usage", fetchUsage, { revalidateOnFocus: false });

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDownload() {
    setDownloading(true);
    try { await getMyData(); } finally { setDownloading(false); }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMe();
      document.cookie = "session=; path=/; Max-Age=0";
      router.push("/");
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <main className="min-h-screen bg-forge-base text-forge-text font-body py-12 px-7">
      <div className="max-w-[560px] mx-auto">
        <h1 className="font-display font-extrabold text-3xl tracking-[0.06em] uppercase text-forge-text mb-2">
          Settings
        </h1>
        <p className="text-forge-muted text-sm mb-10">Global preferences for CV Forge.</p>

        {/* AI Model */}
        <SectionCard title="AI Model">
          <p className="text-[13px] text-forge-muted mb-4 leading-[1.6]">
            Primary model for CV forging. Falls back automatically if rate-limited.
          </p>

          {!profile && !loadError && <p className="text-forge-hint text-[13px]">Loading…</p>}
          {loadError && <p className="text-forge-orange text-[13px]">Failed to load settings.</p>}

          {profile && (
            <>
              <select
                value={activeModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="forge-input w-full bg-forge-base border border-forge-track rounded-md text-forge-text text-[13px] py-2.5 px-3 mb-4 outline-none cursor-pointer"
              >
                {FREE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-forge-orange text-white border-none rounded-md py-[9px] px-5 text-[13px] font-semibold cursor-pointer disabled:opacity-70 transition-opacity"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {saved && <span className="text-[#4caf50] text-[13px]">Saved</span>}
                {saveError && <span className="text-forge-orange text-[13px]">{saveError}</span>}
              </div>
            </>
          )}
        </SectionCard>

        {/* Usage */}
        {usage && (
          <SectionCard title="Today's Usage">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-display text-[10px] tracking-[0.1em] uppercase text-forge-hint mb-1">Forge calls</p>
                <p className="font-display text-[22px] font-bold text-forge-text">{usage.call_count_today}</p>
              </div>
              <div>
                <p className="font-display text-[10px] tracking-[0.1em] uppercase text-forge-hint mb-1">Tokens used</p>
                <p className="font-display text-[22px] font-bold text-forge-text">
                  {(usage.total_tokens_today / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
            <p className="text-forge-hint text-[11px] mt-3">Daily limit: 20 forges.</p>
          </SectionCard>
        )}

        {/* Account */}
        <SectionCard title="Account">
          {profile?.email && (
            <p className="text-[13px] text-forge-muted mb-5">
              Signed in as <span className="text-forge-text">{profile.email}</span>
            </p>
          )}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="self-start py-[9px] px-5 text-[13px] font-semibold border border-forge-border rounded-md text-forge-text cursor-pointer disabled:opacity-50 hover:border-forge-ghost transition-colors bg-transparent"
            >
              {downloading ? "Preparing…" : "Download my data"}
            </button>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="self-start py-[9px] px-5 text-[13px] font-semibold border border-[rgba(248,113,113,0.30)] rounded-md text-[#F87171] cursor-pointer hover:border-[rgba(248,113,113,0.60)] transition-colors bg-transparent"
              >
                Delete account
              </button>
            ) : (
              <div className="py-4 px-4 bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.20)] rounded-md">
                <p className="font-body text-[13px] text-[#F87171] mb-3">
                  This will permanently delete all your CVs, skills, and forge history. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="py-[7px] px-4 text-[12px] font-bold border-none rounded-md text-white cursor-pointer disabled:opacity-50"
                    style={{ background: "#dc2626" }}
                  >
                    {deleting ? "Deleting…" : "Yes, delete my account"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="py-[7px] px-4 text-[12px] font-bold border border-forge-border rounded-md text-forge-muted cursor-pointer hover:text-forge-text transition-colors bg-transparent"
                  >
                    Cancel
                  </button>
                </div>
                {deleteError && <p className="font-body text-[12px] text-[#F87171] mt-2 mb-0">{deleteError}</p>}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
