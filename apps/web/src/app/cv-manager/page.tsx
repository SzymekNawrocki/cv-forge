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
  getCurrentUser,
  type MasterCV,
  type UserProfile,
} from "@/lib/api";
import CVListRow from "@/components/CVListRow";

const CVManualForm = dynamic(() => import("@/components/CVManualForm"), {
  ssr: false,
  loading: () => (
    <p className="font-body text-[13px] text-forge-muted py-8">
      Loading form...
    </p>
  ),
});

type Tab = "import" | "manual";
type Section = "cvs" | "profile";

const inputClass = "forge-input bg-forge-surface border border-forge-track rounded-md py-2.5 px-3.5 font-body text-[13px] text-forge-text outline-none w-full box-border";
const labelClass = "font-display text-[11px] font-bold tracking-[0.14em] uppercase text-forge-hint mb-1.5 block";

function Field({
  label,
  value,
  onChange,
  placeholder,
  isLink,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isLink?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        {isLink && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-orange font-mono text-xs pointer-events-none">↗</span>
        )}
        <input
          className={`${inputClass} ${isLink ? 'pl-[30px]' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {isLink && value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[11px] text-forge-orange mt-1 pl-0.5 no-underline opacity-80"
        >
          {value}
        </a>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-forge-elevated pt-5 font-display text-[10px] font-bold tracking-[0.18em] uppercase text-forge-hint">
      {children}
    </div>
  );
}

export default function CVManagerPage() {
  const [section, setSection] = useState<Section>("cvs");

  const { data: cvs = [], mutate: mutateCVs } = useSWR<MasterCV[]>("masterCVs", fetchMasterCVs);
  const { data: profile, mutate: mutateProfile } = useSWR<UserProfile>("profile", getProfile, { revalidateOnFocus: false });
  const { data: currentUser } = useSWR("currentUser", getCurrentUser, { revalidateOnFocus: false });
  const isDemo = currentUser?.is_demo ?? false;
  const profileLoaded = profile !== undefined;

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

  const [profileForm, setProfileForm] = useState({ name: "", job_title: "", email: "", phone: "", location: "", github_url: "", portfolio_url: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePending, startProfileTransition] = useTransition();

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

  const importDisabled = isPending || !title.trim() || !rawText.trim() || isDemo;

  return (
    <main className="flex-1 flex min-h-0 bg-forge-base">

      {/* Left sidebar */}
      <aside className="forge-scroll w-[240px] shrink-0 border-r border-forge-elevated py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {/* Section nav */}
        <div className="flex gap-0.5 mb-3">
          {(['cvs', 'profile'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`flex-1 py-1.5 px-1 rounded-[5px] font-display text-[10px] font-bold tracking-[0.10em] uppercase cursor-pointer transition-all duration-[180ms] border ${
                section === s
                  ? 'bg-forge-elevated border-forge-line text-forge-text'
                  : 'bg-transparent border-transparent text-forge-hint'
              }`}
            >
              {s === 'cvs' ? 'CVs' : 'Profile'}
            </button>
          ))}
        </div>

        {section === 'cvs' && (
          <>
            <p className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-forge-label mb-1.5 pl-0.5">
              Saved CVs
            </p>
            {cvs.length === 0 && (
              <p className="font-body text-[13px] text-forge-muted pl-0.5">No CVs yet.</p>
            )}
            {cvs.map((cv) => (
              <CVListRow
                key={cv.id}
                cv={cv}
                isSelected={selected?.id === cv.id}
                onSelect={() => setSelected(cv)}
                onDelete={() => handleDelete(cv)}
                disabled={isPending}
              />
            ))}
          </>
        )}
      </aside>

      {/* Main content */}
      <div className="forge-scroll flex-1 py-7 px-9 flex flex-col gap-4 overflow-y-auto">

        {/* Profile panel */}
        {section === 'profile' && (
          <>
            <div>
              <h1 className="font-display text-[26px] font-extrabold tracking-[0.08em] uppercase text-forge-text m-0 leading-none">
                PROFILE<span className="text-forge-orange"> /</span> SETTINGS
              </h1>
              <p className="font-body text-[13px] text-forge-hint mt-1.5">
                Global defaults auto-filled when creating a new CV. Links appear in every tailored PDF.
              </p>
            </div>
            {!profileLoaded ? (
              <p className="font-body text-[13px] text-forge-hint">Loading...</p>
            ) : (
              <div className="flex flex-col gap-5 max-w-[520px]">
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
                {profileError && <p className="font-body text-[13px] text-[#F87171] m-0">{profileError}</p>}
                <button
                  onClick={handleSaveProfile}
                  disabled={profilePending}
                  className="self-start py-2.5 px-7 rounded-md font-display text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer disabled:cursor-not-allowed border transition-all duration-200"
                  style={{
                    background: profileSaved
                      ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                      : profilePending ? '#1E1E20'
                      : 'linear-gradient(135deg, #FF5722, #FF8C42)',
                    border: profilePending ? '1px solid #272729' : '1px solid transparent',
                    color: profilePending ? '#3A3A3E' : '#fff',
                  }}
                >
                  {profilePending ? 'Saving...' : profileSaved ? 'Saved' : 'Save Profile'}
                </button>
              </div>
            )}
          </>
        )}

        {/* CVs panel */}
        {section === 'cvs' && (
          selected ? (
            /* Detail view */
            <>
              <div className="flex items-center justify-between gap-3">
                <h1 className="font-display text-[26px] font-extrabold tracking-[0.06em] uppercase text-forge-text m-0">
                  {selected.title}
                </h1>
                <button
                  onClick={() => setSelected(null)}
                  className="py-[7px] px-3.5 bg-transparent border border-forge-border rounded-[5px] font-display text-xs font-bold tracking-[0.1em] uppercase text-forge-label cursor-pointer transition-all duration-200 hover:text-forge-text hover:border-forge-ghost"
                >
                  + New CV
                </button>
              </div>

              {/* Link editor */}
              <div className="bg-forge-surface border border-forge-elevated rounded-lg py-3.5 px-4">
                <div className={`flex items-center justify-between ${editLinks ? 'mb-3' : ''}`}>
                  <div className="flex gap-4 items-center">
                    {selected.portfolio_url ? (
                      <a href={selected.portfolio_url} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-forge-orange no-underline">↗ Portfolio</a>
                    ) : (
                      <span className="font-body text-xs text-forge-muted">No portfolio</span>
                    )}
                    {selected.github_url ? (
                      <a href={selected.github_url} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-forge-orange no-underline">↗ GitHub</a>
                    ) : (
                      <span className="font-body text-xs text-forge-muted">No GitHub</span>
                    )}
                  </div>
                  <button
                    onClick={() => setEditLinks(!editLinks)}
                    className="py-1 px-2.5 bg-transparent border border-forge-border rounded rounded-[4px] font-display text-[10px] font-bold tracking-[0.1em] uppercase text-forge-label cursor-pointer hover:text-forge-text transition-colors"
                  >
                    {editLinks ? 'Cancel' : 'Edit Links'}
                  </button>
                </div>
                {editLinks && (
                  <div className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-forge-label block mb-[5px]">Portfolio URL</label>
                        <input className={inputClass} value={linkPortfolio} onChange={(e) => setLinkPortfolio(e.target.value)} placeholder="https://yoursite.com" />
                      </div>
                      <div>
                        <label className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-forge-label block mb-[5px]">GitHub URL</label>
                        <input className={inputClass} value={linkGithub} onChange={(e) => setLinkGithub(e.target.value)} placeholder="https://github.com/username" />
                      </div>
                    </div>
                    {error && <p className="font-body text-xs text-[#F87171] m-0">{error}</p>}
                    <button
                      onClick={handleSaveLinks}
                      disabled={isPending}
                      className="self-start py-[7px] px-[18px] rounded-[5px] font-display text-[11px] font-bold tracking-[0.1em] uppercase border transition-colors disabled:cursor-not-allowed"
                      style={{
                        background: isPending ? '#1E1E20' : 'linear-gradient(135deg, #FF5722, #FF8C42)',
                        border: isPending ? '1px solid #272729' : '1px solid transparent',
                        color: isPending ? '#3A3A3E' : '#fff',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isPending ? 'Saving...' : 'Save Links'}
                    </button>
                  </div>
                )}
              </div>

              <pre className="bg-forge-surface border border-forge-track rounded-lg py-[18px] px-5 font-mono text-xs text-forge-label whitespace-pre-wrap overflow-y-auto max-h-[55vh] leading-[1.75] m-0">
                {selected.content_markdown}
              </pre>
            </>
          ) : (
            /* Create / Import form */
            <>
              <div>
                <h1 className="font-display text-[26px] font-extrabold tracking-[0.08em] uppercase text-forge-text m-0">
                  NEW<span className="text-forge-orange"> /</span> CV
                </h1>
              </div>

              {/* Tab bar */}
              <div className="flex gap-0.5 border-b border-forge-elevated mb-1">
                {(['import', 'manual'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(null); }}
                    className={`py-2 px-5 bg-transparent border-none font-display text-xs font-bold tracking-[0.12em] uppercase cursor-pointer transition-colors duration-[180ms] -mb-px ${
                      tab === t
                        ? 'text-forge-text border-b-2 border-b-forge-orange'
                        : 'text-forge-hint border-b-2 border-b-transparent'
                    }`}
                  >
                    {t === 'import' ? 'Import Text' : 'Fill In Manually'}
                  </button>
                ))}
              </div>

              {tab === 'import' ? (
                <>
                  <p className="font-body text-[13px] text-forge-hint m-0">
                    Paste raw CV text — AI will clean and structure it into Markdown.
                  </p>
                  {isDemo && (
                    <p className="font-body text-[12px] text-forge-orange m-0">
                      AI import is disabled in demo mode — use &quot;Fill In Manually&quot; instead.
                    </p>
                  )}
                  <input
                    className={inputClass}
                    placeholder="CV title (e.g. My Master CV)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    className={`${inputClass} font-mono text-xs text-forge-label resize-y leading-[1.75] min-h-[280px]`}
                    placeholder="Paste raw CV text here..."
                    rows={14}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-forge-label block mb-[5px]">Portfolio URL</label>
                      <input className={inputClass} value={importPortfolio} onChange={(e) => setImportPortfolio(e.target.value)} placeholder="https://yoursite.com" />
                    </div>
                    <div>
                      <label className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-forge-label block mb-[5px]">GitHub URL</label>
                      <input className={inputClass} value={importGithub} onChange={(e) => setImportGithub(e.target.value)} placeholder="https://github.com/username" />
                    </div>
                  </div>
                  {error && <p className="font-body text-[13px] text-[#F87171] m-0">{error}</p>}
                  <button
                    onClick={handleImport}
                    disabled={importDisabled}
                    onMouseEnter={() => setImportBtnHovered(true)}
                    onMouseLeave={() => setImportBtnHovered(false)}
                    className="self-start py-2.5 px-6 rounded-md font-display text-[13px] font-bold tracking-[0.12em] uppercase border transition-all duration-200 disabled:cursor-not-allowed"
                    style={{
                      background: importDisabled ? '#1E1E20'
                        : importBtnHovered ? 'linear-gradient(135deg, #FF8C42, #FFC947)'
                        : 'linear-gradient(135deg, #FF5722, #FF8C42)',
                      border: importDisabled ? '1px solid #272729' : '1px solid transparent',
                      color: importDisabled ? '#3A3A3E' : importBtnHovered ? '#0D0D0E' : '#fff',
                      cursor: importDisabled ? 'not-allowed' : 'pointer',
                      boxShadow: (!importDisabled && importBtnHovered)
                        ? '0 0 28px rgba(255,200,70,0.28), 0 0 12px rgba(255,140,66,0.40)'
                        : !importDisabled ? '0 0 10px rgba(255,87,34,0.18)' : 'none',
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
