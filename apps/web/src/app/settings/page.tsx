"use client";

import { useEffect, useState } from "react";
import { getProfile, updateProfile, type UserProfile } from "@/lib/api";

const FREE_MODELS: { id: string; label: string }[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B — Groq (recommended)" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B — Groq" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B — Groq" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant — Groq (fastest)" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B — OpenRouter (fallback)" },
];

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setSelectedModel(p.preferred_model ?? DEFAULT_MODEL);
      })
      .catch(() => setError("Failed to load settings."));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await updateProfile({ preferred_model: selectedModel });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0D0D0E",
      color: "#E2E2E4",
      fontFamily: '"IBM Plex Sans", sans-serif',
      padding: "48px 28px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#E2E2E4",
          marginBottom: 8,
        }}>
          Settings
        </h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 40 }}>
          Global preferences for CV Forge.
        </p>

        <section style={{
          background: "#141416",
          border: "1px solid #1E1E20",
          borderRadius: 8,
          padding: "24px 28px",
          marginBottom: 24,
        }}>
          <h2 style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#888",
            marginBottom: 16,
          }}>
            AI Model
          </h2>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
            Primary model used for CV forging. If it hits a rate limit, the app
            automatically falls back through the remaining free models.
          </p>

          {profile === null && !error && (
            <p style={{ color: "#666", fontSize: 13 }}>Loading…</p>
          )}

          {error && (
            <p style={{ color: "#ff5722", fontSize: 13 }}>{error}</p>
          )}

          {profile !== null && (
            <>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0D0D0E",
                  border: "1px solid #2a2a2d",
                  borderRadius: 6,
                  color: "#E2E2E4",
                  fontSize: 13,
                  padding: "10px 12px",
                  marginBottom: 16,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {FREE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: "#FF5722",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "9px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {saved && (
                  <span style={{ color: "#4caf50", fontSize: 13 }}>Saved</span>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
