"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import {
  fetchMasterCVs,
  importCV,
  deleteCV,
  updateCVLinks,
  getProfile,
  updateProfile,
  type MasterCV,
  type UserProfile,
} from "@/lib/api";

const CVManualForm = dynamic(() => import("@/components/CVManualForm"), {
  ssr: false,
  loading: () => (
    <p style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "13px", color: "#5C5C70", padding: "32px 0" }}>
      Loading form...
    </p>
  ),
});

const F = {
  display: '"Barlow Condensed", sans-serif',
  body: '"IBM Plex Sans", sans-serif',
  mono: '"IBM Plex Mono", "Courier New", monospace',
};

const inputStyle: React.CSSProperties = {
  background: '#161618',
  border: '1px solid #222224',
  borderRadius: '6px',
  padding: '10px 14px',
  fontFamily: F.body,
  fontSize: '13px',
  color: '#E2E2E4',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

type Tab = "import" | "manual";
type Section = "cvs" | "profile";

// ── Profile helpers ───────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, isLink }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; isLink?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <label style={{ fontFamily: F.display, fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#9A9AA4', marginBottom: '6px', display: 'block' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {isLink && <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#FF5722', fontFamily: F.mono, fontSize: '12px', pointerEvents: 'none' }}>↗</span>}
        <input className="forge-input" style={{ ...inputStyle, paddingLeft: isLink ? '30px' : '14px' }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
      {isLink && value && (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F.body, fontSize: '11px', color: '#FF5722', marginTop: '4px', paddingLeft: '2px', textDecoration: 'none', opacity: 0.8 }}>{value}</a>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid #1E1E20', paddingTop: '20px', fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#5C5C70' }}>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CVManagerPage() {
  const [section, setSection] = useState<Section>("cvs");

  // Remote data via SWR
  const { data: cvs = [], mutate: mutateCVs } = useSWR<MasterCV[]>("masterCVs", fetchMasterCVs);
  const { data: profile, mutate: mutateProfile } = useSWR<UserProfile>("profile", getProfile, { revalidateOnFocus: false });
  const profileLoaded = profile !== undefined;

  // Local CV state
  const [selected, setSelected] = useState<MasterCV | null>(null);
  const [tab, setTab] = useState<Tab>("import");
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [importGithub, setImportGithub] = useState("");
  const [importPortfolio, setImportPortfolio] = useState("");
  const [editLinks, setEditLinks] = useState(false);
  const [linkGithub, setLinkGithub] = useState("");
  const [linkPortfolio, setLinkPortfolio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importBtnHovered, setImportBtnHovered] = useState(false);

  // Local profile form state
  const [profileForm, setProfileForm] = useState({ name: "", job_title: "", email: "", phone: "", location: "", github_url: "", portfolio_url: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePending, startProfileTransition] = useTransition();

  // Sync local form state from profile on first load (one-time)
  const profileSynced = useRef(false);
  useEffect(() => {
    if (!profile || profileSynced.current) return;
    profileSynced.current = true;
    setImportGithub(profile.github_url ?? "");
    setImportPortfolio(profile.portfolio_url ?? "");
    setProfileForm({
      name: profile.name ?? "",
      job_title: profile.job_title ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      github_url: profile.github_url ?? "",
      portfolio_url: profile.portfolio_url ?? "",
    });
  }, [profile]);

  useEffect(() => {
    if (selected) {
      setLinkGithub(selected.github_url ?? "");
      setLinkPortfolio(selected.portfolio_url ?? "");
      setEditLinks(false);
    }
  }, [selected?.id]);

  // ── CV handlers ──

  function handleDelete(cv: MasterCV) {
    if (!confirm(`Delete "${cv.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCV(cv.id);
        mutateCVs(cvs.filter((c) => c.id !== cv.id), { revalidate: false });
        if (selected?.id === cv.id) setSelected(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  function handleImport() {
    if (!title.trim() || !rawText.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const cv = await importCV(title.trim(), rawText.trim(), importGithub.trim() || undefined, importPortfolio.trim() || undefined);
        mutateCVs([cv, ...cvs], { revalidate: false });
        setTitle(""); setRawText("");
        setSelected(cv);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    });
  }

  function handleManualSuccess(cv: MasterCV) {
    mutateCVs([cv, ...cvs], { revalidate: false });
    setSelected(cv);
  }

  function handleSaveLinks() {
    if (!selected) return;
    startTransition(async () => {
      try {
        const updated = await updateCVLinks(selected.id, linkGithub.trim() || null, linkPortfolio.trim() || null);
        mutateCVs(cvs.map((c) => (c.id === updated.id ? updated : c)), { revalidate: false });
        setSelected(updated);
        setEditLinks(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  // ── Profile handlers ──

  function setProfileField(field: keyof typeof profileForm) {
    return (v: string) => setProfileForm((prev) => ({ ...prev, [field]: v }));
  }

  function handleSaveProfile() {
    setProfileError(null);
    setProfileSaved(false);
    startProfileTransition(async () => {
      try {
        await updateProfile({
          name: profileForm.name || null,
          job_title: profileForm.job_title || null,
          email: profileForm.email || null,
          phone: profileForm.phone || null,
          location: profileForm.location || null,
          github_url: profileForm.github_url || null,
          portfolio_url: profileForm.portfolio_url || null,
        } as Partial<UserProfile>);
        mutateProfile();
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
      } catch (e) {
        setProfileError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  const importDisabled = isPending || !title.trim() || !rawText.trim();

  return (
    <main style={{ flex: 1, display: 'flex', minHeight: 0, background: '#0D0D0E' }}>

      {/* ── Left sidebar ── */}
      <aside
        className="forge-scroll"
        style={{ width: '240px', flexShrink: 0, borderRight: '1px solid #1E1E20', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}
      >
        {/* Section nav */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
          {(['cvs', 'profile'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              style={{
                flex: 1,
                padding: '6px 4px',
                background: section === s ? '#1E1E20' : 'transparent',
                border: `1px solid ${section === s ? '#2A2A2C' : 'transparent'}`,
                borderRadius: '5px',
                fontFamily: F.display,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase' as const,
                color: section === s ? '#E2E2E4' : '#5C5C66',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {s === 'cvs' ? 'CVs' : 'Profile'}
            </button>
          ))}
        </div>

        {section === 'cvs' && (
          <>
            <p style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C4C4CC', marginBottom: '6px', paddingLeft: '2px' }}>
              Saved CVs
            </p>
            {cvs.length === 0 && (
              <p style={{ fontFamily: F.body, fontSize: '13px', color: '#5C5C70', paddingLeft: '2px' }}>No CVs yet.</p>
            )}
            {cvs.map((cv) => (
              <CVListRow key={cv.id} cv={cv} isSelected={selected?.id === cv.id} onSelect={() => setSelected(cv)} onDelete={() => handleDelete(cv)} disabled={isPending} />
            ))}
          </>
        )}
      </aside>

      {/* ── Main content ── */}
      <div
        className="forge-scroll"
        style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}
      >

        {/* ── Profile panel ── */}
        {section === 'profile' && (
          <>
            <div>
              <h1 style={{ fontFamily: F.display, fontSize: '26px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E2E2E4', margin: 0, lineHeight: 1 }}>
                PROFILE<span style={{ color: '#FF5722' }}> /</span> SETTINGS
              </h1>
              <p style={{ fontFamily: F.body, fontSize: '13px', color: '#A8A8B4', marginTop: '6px' }}>
                Global defaults auto-filled when creating a new CV. Links appear in every tailored PDF.
              </p>
            </div>
            {!profileLoaded ? (
              <p style={{ fontFamily: F.body, fontSize: '13px', color: '#9A9AA4' }}>Loading...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>
                <SectionLabel>Identity</SectionLabel>
                <Field label="Full Name" value={profileForm.name} onChange={setProfileField("name")} placeholder="Szymon Nawrocki" />
                <Field label="Job Title" value={profileForm.job_title} onChange={setProfileField("job_title")} placeholder="Web Developer" />
                <SectionLabel>Contact</SectionLabel>
                <Field label="Email" value={profileForm.email} onChange={setProfileField("email")} placeholder="you@example.com" />
                <Field label="Phone" value={profileForm.phone} onChange={setProfileField("phone")} placeholder="+48 000 000 000" />
                <Field label="Location" value={profileForm.location} onChange={setProfileField("location")} placeholder="Warsaw" />
                <SectionLabel>Links</SectionLabel>
                <Field label="Portfolio URL" value={profileForm.portfolio_url} onChange={setProfileField("portfolio_url")} placeholder="https://yoursite.com" isLink />
                <Field label="GitHub URL" value={profileForm.github_url} onChange={setProfileField("github_url")} placeholder="https://github.com/username" isLink />
                {profileError && <p style={{ fontFamily: F.body, fontSize: '13px', color: '#F87171', margin: 0 }}>{profileError}</p>}
                <button
                  onClick={handleSaveProfile}
                  disabled={profilePending}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 28px',
                    background: profileSaved ? 'linear-gradient(135deg, #22c55e, #16a34a)' : profilePending ? '#1E1E20' : 'linear-gradient(135deg, #FF5722, #FF8C42)',
                    border: profilePending ? '1px solid #272729' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: profilePending ? 'not-allowed' : 'pointer',
                    fontFamily: F.display,
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: profilePending ? '#3A3A3E' : '#fff',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {profilePending ? 'Saving...' : profileSaved ? 'Saved' : 'Save Profile'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CVs panel ── */}
        {section === 'cvs' && (
          selected ? (
            /* ── Detail view ── */
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <h1 style={{ fontFamily: F.display, fontSize: '26px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#E2E2E4', margin: 0 }}>
                  {selected.title}
                </h1>
                <button
                  onClick={() => setSelected(null)}
                  style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #272729', borderRadius: '5px', fontFamily: F.display, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4C4CC', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#E2E2E4'; e.currentTarget.style.borderColor = '#3A3A3E'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#5C5C66'; e.currentTarget.style.borderColor = '#272729'; }}
                >
                  + New CV
                </button>
              </div>

              {/* Link editor */}
              <div style={{ background: '#161618', border: '1px solid #1E1E20', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editLinks ? '12px' : '0' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {selected.portfolio_url ? (
                      <a href={selected.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F.body, fontSize: '12px', color: '#FF5722', textDecoration: 'none' }}>↗ Portfolio</a>
                    ) : (
                      <span style={{ fontFamily: F.body, fontSize: '12px', color: '#5C5C70' }}>No portfolio</span>
                    )}
                    {selected.github_url ? (
                      <a href={selected.github_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F.body, fontSize: '12px', color: '#FF5722', textDecoration: 'none' }}>↗ GitHub</a>
                    ) : (
                      <span style={{ fontFamily: F.body, fontSize: '12px', color: '#5C5C70' }}>No GitHub</span>
                    )}
                  </div>
                  <button onClick={() => setEditLinks(!editLinks)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #272729', borderRadius: '4px', fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4C4CC', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#E2E2E4'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#5C5C66'; }}
                  >
                    {editLinks ? 'Cancel' : 'Edit Links'}
                  </button>
                </div>
                {editLinks && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4C4CC', display: 'block', marginBottom: '5px' }}>Portfolio URL</label>
                        <input className="forge-input" style={inputStyle} value={linkPortfolio} onChange={(e) => setLinkPortfolio(e.target.value)} placeholder="https://yoursite.com" />
                      </div>
                      <div>
                        <label style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4C4CC', display: 'block', marginBottom: '5px' }}>GitHub URL</label>
                        <input className="forge-input" style={inputStyle} value={linkGithub} onChange={(e) => setLinkGithub(e.target.value)} placeholder="https://github.com/username" />
                      </div>
                    </div>
                    {error && <p style={{ fontFamily: F.body, fontSize: '12px', color: '#F87171', margin: 0 }}>{error}</p>}
                    <button
                      onClick={handleSaveLinks}
                      disabled={isPending}
                      style={{ alignSelf: 'flex-start', padding: '7px 18px', background: isPending ? '#1E1E20' : 'linear-gradient(135deg, #FF5722, #FF8C42)', border: isPending ? '1px solid #272729' : '1px solid transparent', borderRadius: '5px', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: F.display, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isPending ? '#3A3A3E' : '#fff' }}
                    >
                      {isPending ? 'Saving...' : 'Save Links'}
                    </button>
                  </div>
                )}
              </div>

              <pre style={{ background: '#161618', border: '1px solid #222224', borderRadius: '8px', padding: '18px 20px', fontFamily: F.mono, fontSize: '12px', color: '#C4C4CC', whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: '55vh', lineHeight: 1.75, margin: 0 }}>
                {selected.content_markdown}
              </pre>
            </>
          ) : (
            /* ── Create / Import form ── */
            <>
              <div>
                <h1 style={{ fontFamily: F.display, fontSize: '26px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E2E2E4', margin: 0 }}>
                  NEW<span style={{ color: '#FF5722' }}> /</span> CV
                </h1>
              </div>

              {/* Tab bar */}
              <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #1E1E20', marginBottom: '4px' }}>
                {(['import', 'manual'] as Tab[]).map((t) => (
                  <button key={t} onClick={() => { setTab(t); setError(null); }} style={{ padding: '8px 20px', background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #FF5722' : '2px solid transparent', marginBottom: '-1px', fontFamily: F.display, fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tab === t ? '#E2E2E4' : '#5C5C66', cursor: 'pointer', transition: 'color 0.18s ease' }}>
                    {t === 'import' ? 'Import Text' : 'Fill In Manually'}
                  </button>
                ))}
              </div>

              {tab === 'import' ? (
                <>
                  <p style={{ fontFamily: F.body, fontSize: '13px', color: '#A8A8B4', margin: 0 }}>
                    Paste raw CV text — AI will clean and structure it into Markdown.
                  </p>
                  <input className="forge-input" style={inputStyle} placeholder="CV title (e.g. My Master CV)" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <textarea className="forge-input" style={{ ...inputStyle, fontFamily: F.mono, fontSize: '12px', color: '#C4C4CC', resize: 'vertical', lineHeight: 1.75, minHeight: '280px' }} placeholder="Paste raw CV text here..." rows={14} value={rawText} onChange={(e) => setRawText(e.target.value)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4C4CC', display: 'block', marginBottom: '5px' }}>Portfolio URL</label>
                      <input className="forge-input" style={inputStyle} value={importPortfolio} onChange={(e) => setImportPortfolio(e.target.value)} placeholder="https://yoursite.com" />
                    </div>
                    <div>
                      <label style={{ fontFamily: F.display, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4C4CC', display: 'block', marginBottom: '5px' }}>GitHub URL</label>
                      <input className="forge-input" style={inputStyle} value={importGithub} onChange={(e) => setImportGithub(e.target.value)} placeholder="https://github.com/username" />
                    </div>
                  </div>
                  {error && <p style={{ fontFamily: F.body, fontSize: '13px', color: '#F87171', margin: 0 }}>{error}</p>}
                  <button
                    onClick={handleImport}
                    disabled={importDisabled}
                    onMouseEnter={() => setImportBtnHovered(true)}
                    onMouseLeave={() => setImportBtnHovered(false)}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '10px 24px',
                      background: importDisabled ? '#1E1E20' : importBtnHovered ? 'linear-gradient(135deg, #FF8C42, #FFC947)' : 'linear-gradient(135deg, #FF5722, #FF8C42)',
                      border: `1px solid ${importDisabled ? '#272729' : 'transparent'}`,
                      borderRadius: '6px',
                      cursor: importDisabled ? 'not-allowed' : 'pointer',
                      fontFamily: F.display,
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: importDisabled ? '#3A3A3E' : importBtnHovered ? '#0D0D0E' : '#fff',
                      boxShadow: (!importDisabled && importBtnHovered) ? '0 0 28px rgba(255,200,70,0.28), 0 0 12px rgba(255,140,66,0.40)' : (!importDisabled) ? '0 0 10px rgba(255,87,34,0.18)' : 'none',
                      transition: 'all 0.20s cubic-bezier(0.25,0.46,0.45,0.94)',
                    }}
                  >
                    {isPending ? 'Importing...' : 'Import & Clean'}
                  </button>
                </>
              ) : (
                <CVManualForm profile={profile ?? null} onSuccess={handleManualSuccess} />
              )}
            </>
          )
        )}
      </div>
    </main>
  );
}

// ── CV list row ───────────────────────────────────────────────────────────────

function CVListRow({ cv, isSelected, onSelect, onDelete, disabled }: { cv: MasterCV; isSelected: boolean; onSelect: () => void; onDelete: () => void; disabled: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [delHovered, setDelHovered] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      <button
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          flex: 1, textAlign: 'left', padding: '9px 12px',
          background: isSelected ? 'linear-gradient(135deg, rgba(255,87,34,0.08), rgba(22,22,24,0.95))' : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
          border: `1px solid ${isSelected ? 'rgba(255,87,34,0.32)' : hovered ? '#2A2A2C' : 'transparent'}`,
          borderRadius: '6px', fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '13px', fontWeight: isSelected ? 500 : 400,
          color: isSelected ? '#E2E2E4' : '#9A9AA4', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all 0.18s ease', minWidth: 0,
        }}
      >
        {cv.title}
      </button>
      <button
        onClick={onDelete}
        disabled={disabled}
        onMouseEnter={() => setDelHovered(true)}
        onMouseLeave={() => setDelHovered(false)}
        style={{ padding: '8px 9px', background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: delHovered ? '#F87171' : '#5C5C66', fontSize: '17px', lineHeight: 1, flexShrink: 0, opacity: disabled ? 0.4 : 1, transition: 'color 0.18s ease' }}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}
