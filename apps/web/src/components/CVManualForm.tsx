"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  fetchSkills,
  createCV,
  type MasterCV,
  type CVFormData,
  type SkillCategoryEntry,
  type WorkExperienceEntry,
  type ProjectEntry,
  type EducationEntry,
  type LanguageEntry,
  type CertificationEntry,
  type UserProfile,
} from "@/lib/api";

const F = {
  display: '"Barlow Condensed", sans-serif',
  body: '"IBM Plex Sans", sans-serif',
  mono: '"IBM Plex Mono", "Courier New", monospace',
};

const inputStyle: React.CSSProperties = {
  background: '#161618',
  border: '1px solid #222224',
  borderRadius: '6px',
  padding: '9px 12px',
  fontFamily: F.body,
  fontSize: '13px',
  color: '#E2E2E4',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontFamily: F.display,
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#5C5C66',
  display: 'block',
  marginBottom: '5px',
};

function LabeledInput({
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        {isLink && (
          <span style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: '#FF5722', fontFamily: F.mono, fontSize: '11px', pointerEvents: 'none',
          }}>↗</span>
        )}
        <input
          className="forge-input"
          style={{ ...inputStyle, paddingLeft: isLink ? '26px' : '12px' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        background: 'transparent',
        border: '1px dashed #272729',
        borderRadius: '5px',
        fontFamily: F.display,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#5C5C66',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF5722'; e.currentTarget.style.color = '#FF5722'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#272729'; e.currentTarget.style.color = '#5C5C66'; }}
    >
      + {label}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 8px',
        background: 'transparent',
        border: 'none',
        color: '#3A3A3E',
        fontSize: '16px',
        cursor: 'pointer',
        lineHeight: 1,
        flexShrink: 0,
        transition: 'color 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#3A3A3E'; }}
    >
      ×
    </button>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderTop: '1px solid #1E1E20',
      paddingTop: '24px',
      fontFamily: F.display,
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#FF5722',
      marginBottom: '14px',
    }}>
      {children}
    </div>
  );
}

function Card({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div style={{
      background: '#161618',
      border: '1px solid #1E1E20',
      borderRadius: '8px',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
        <RemoveBtn onClick={onRemove} />
      </div>
      {children}
    </div>
  );
}

// ── Skill chips ─────────────────────────────────────────────────────────────

function SkillCategoryRow({
  cat,
  onChange,
  onRemove,
}: {
  cat: SkillCategoryEntry;
  onChange: (updated: SkillCategoryEntry) => void;
  onRemove: () => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addItem(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "").trim();
    if (!trimmed || cat.items.includes(trimmed)) return;
    onChange({ ...cat, items: [...cat.items, trimmed] });
  }

  function removeItem(item: string) {
    onChange({ ...cat, items: cat.items.filter((i) => i !== item) });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addItem(inputVal);
      setInputVal("");
    } else if (e.key === "Backspace" && !inputVal && cat.items.length > 0) {
      onChange({ ...cat, items: cat.items.slice(0, -1) });
    }
  }

  return (
    <div style={{ background: '#161618', border: '1px solid #1E1E20', borderRadius: '8px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <input
          className="forge-input"
          style={{ ...inputStyle, fontWeight: 600, fontSize: '12px', color: '#B0BEC5', width: 'auto', flex: 1, marginRight: '8px' }}
          value={cat.category}
          onChange={(e) => onChange({ ...cat, category: e.target.value })}
          placeholder="Category name"
        />
        <RemoveBtn onClick={onRemove} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {cat.items.map((item) => (
          <span key={item} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: '#1E1E20', border: '1px solid #272729', borderRadius: '4px',
            padding: '3px 8px', fontFamily: F.body, fontSize: '12px', color: '#E2E2E4',
          }}>
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              style={{ background: 'none', border: 'none', color: '#5C5C66', cursor: 'pointer', lineHeight: 1, padding: '0 2px', fontSize: '13px' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#5C5C66'; }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="forge-input"
          style={{ ...inputStyle, width: '120px', fontSize: '12px', padding: '3px 8px' }}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputVal.trim()) { addItem(inputVal); setInputVal(""); } }}
          placeholder="Add skill..."
        />
      </div>
    </div>
  );
}

// ── Bullet list editor ───────────────────────────────────────────────────────

function BulletListEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (updated: string[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>Bullets</label>
      {bullets.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#5C5C66', fontFamily: F.mono, fontSize: '11px', flexShrink: 0 }}>–</span>
          <input
            className="forge-input"
            style={{ ...inputStyle, flex: 1 }}
            value={b}
            onChange={(e) => {
              const next = [...bullets];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder="Bullet point..."
          />
          <RemoveBtn onClick={() => onChange(bullets.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn onClick={() => onChange([...bullets, ""])} label="Add bullet" />
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile | null;
  onSuccess: (cv: MasterCV) => void;
}

export default function CVManualForm({ profile, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [header, setHeader] = useState({
    name: profile?.name ?? "",
    job_title: profile?.job_title ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    github_url: profile?.github_url ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
  });
  const [aboutMe, setAboutMe] = useState("");
  const [skills, setSkills] = useState<SkillCategoryEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [workExp, setWorkExp] = useState<WorkExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pre-populate skills from DB
  useEffect(() => {
    fetchSkills().then((dbSkills) => {
      if (dbSkills.length > 0) {
        setSkills(dbSkills.map((s) => ({ category: s.category, items: [...s.items] })));
      }
    }).catch(() => {});
  }, []);

  // Sync header from profile if profile loads after mount
  useEffect(() => {
    if (!profile) return;
    setHeader((prev) => ({
      name: prev.name || profile.name || "",
      job_title: prev.job_title || profile.job_title || "",
      email: prev.email || profile.email || "",
      phone: prev.phone || profile.phone || "",
      location: prev.location || profile.location || "",
      github_url: prev.github_url || profile.github_url || "",
      portfolio_url: prev.portfolio_url || profile.portfolio_url || "",
    }));
  }, [profile]);

  function setH(field: keyof typeof header) {
    return (v: string) => setHeader((p) => ({ ...p, [field]: v }));
  }

  function updateSkill(i: number, updated: SkillCategoryEntry) {
    setSkills((prev) => prev.map((s, j) => (j === i ? updated : s)));
  }

  function updateExp(i: number, field: keyof WorkExperienceEntry, value: string | string[]) {
    setWorkExp((prev) => prev.map((e, j) => (j === i ? { ...e, [field]: value } : e)));
  }

  function updateProject(i: number, field: keyof ProjectEntry, value: string) {
    setProjects((prev) => prev.map((p, j) => (j === i ? { ...p, [field]: value } : p)));
  }

  function updateEdu(i: number, field: keyof EducationEntry, value: string) {
    setEducation((prev) => prev.map((e, j) => (j === i ? { ...e, [field]: value } : e)));
  }

  function updateLang(i: number, field: keyof LanguageEntry, value: string) {
    setLanguages((prev) => prev.map((l, j) => (j === i ? { ...l, [field]: value } : l)));
  }

  function updateCert(i: number, field: keyof CertificationEntry, value: string) {
    setCertifications((prev) => prev.map((c, j) => (j === i ? { ...c, [field]: value } : c)));
  }

  function handleSubmit() {
    if (!title.trim() || !header.name.trim() || !header.job_title.trim()) {
      setError("CV title, full name, and job title are required.");
      return;
    }
    setError(null);
    const payload: CVFormData = {
      title: title.trim(),
      name: header.name.trim(),
      job_title: header.job_title.trim(),
      email: header.email.trim(),
      phone: header.phone.trim(),
      location: header.location.trim(),
      github_url: header.github_url.trim(),
      portfolio_url: header.portfolio_url.trim(),
      about_me: aboutMe.trim(),
      skills: skills.filter((s) => s.category.trim() && s.items.length > 0),
      projects,
      work_experience: workExp,
      education,
      languages,
      certifications,
    };
    startTransition(async () => {
      try {
        const cv = await createCV(payload);
        onSuccess(cv);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Create failed");
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* CV Title */}
      <div style={{ marginBottom: '20px' }}>
        <LabeledInput
          label="CV Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. My Master CV"
        />
      </div>

      {/* Header */}
      <SectionHeader>Identity & Contact</SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <LabeledInput label="Full Name *" value={header.name} onChange={setH("name")} placeholder="Szymon Nawrocki" />
        <LabeledInput label="Job Title *" value={header.job_title} onChange={setH("job_title")} placeholder="Web Developer" />
        <LabeledInput label="Email" value={header.email} onChange={setH("email")} placeholder="you@example.com" />
        <LabeledInput label="Phone" value={header.phone} onChange={setH("phone")} placeholder="+48 727 932 054" />
        <LabeledInput label="Location" value={header.location} onChange={setH("location")} placeholder="Warsaw" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <LabeledInput label="Portfolio URL" value={header.portfolio_url} onChange={setH("portfolio_url")} placeholder="https://yoursite.com" isLink />
        <LabeledInput label="GitHub URL" value={header.github_url} onChange={setH("github_url")} placeholder="https://github.com/username" isLink />
      </div>

      {/* About Me */}
      <SectionHeader>About Me</SectionHeader>
      <div style={{ marginBottom: '20px' }}>
        <textarea
          className="forge-input"
          style={{
            ...inputStyle,
            fontFamily: F.body,
            resize: 'vertical',
            minHeight: '100px',
            lineHeight: 1.65,
          }}
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="Brief professional summary..."
          rows={4}
        />
      </div>

      {/* Skills */}
      <SectionHeader>Skills</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {skills.map((cat, i) => (
          <SkillCategoryRow
            key={i}
            cat={cat}
            onChange={(updated) => updateSkill(i, updated)}
            onRemove={() => setSkills((prev) => prev.filter((_, j) => j !== i))}
          />
        ))}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <AddBtn
          onClick={() => setSkills((prev) => [...prev, { category: "", items: [] }])}
          label="Add Category"
        />
      </div>

      {/* Projects */}
      <SectionHeader>Projects</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {projects.map((p, i) => (
          <Card key={i} onRemove={() => setProjects((prev) => prev.filter((_, j) => j !== i))}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingRight: '28px' }}>
              <LabeledInput label="Project Name" value={p.name} onChange={(v) => updateProject(i, "name", v)} placeholder="Hustle App" />
              <LabeledInput label="Date Range" value={p.date_range} onChange={(v) => updateProject(i, "date_range", v)} placeholder="Jan 2025 – present" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                className="forge-input"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '70px', lineHeight: 1.55, fontSize: '12px', fontFamily: F.body }}
                value={p.description}
                onChange={(e) => updateProject(i, "description", e.target.value)}
                placeholder="What did you build and what tech did you use?"
                rows={3}
              />
            </div>
            <LabeledInput label="URL (optional)" value={p.url} onChange={(v) => updateProject(i, "url", v)} placeholder="https://github.com/..." isLink />
          </Card>
        ))}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <AddBtn
          onClick={() => setProjects((prev) => [...prev, { name: "", description: "", url: "", date_range: "" }])}
          label="Add Project"
        />
      </div>

      {/* Work Experience */}
      <SectionHeader>Work Experience</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {workExp.map((exp, i) => (
          <Card key={i} onRemove={() => setWorkExp((prev) => prev.filter((_, j) => j !== i))}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingRight: '28px' }}>
              <LabeledInput label="Company" value={exp.company} onChange={(v) => updateExp(i, "company", v)} placeholder="Citi Handlowy" />
              <LabeledInput label="Date Range" value={exp.date_range} onChange={(v) => updateExp(i, "date_range", v)} placeholder="Jan 2025 – Aug 2025" />
            </div>
            <LabeledInput label="Role" value={exp.role} onChange={(v) => updateExp(i, "role", v)} placeholder="Helpdesk Analyst | Internship (full-time)" />
            <BulletListEditor bullets={exp.bullets} onChange={(updated) => updateExp(i, "bullets", updated)} />
          </Card>
        ))}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <AddBtn
          onClick={() => setWorkExp((prev) => [...prev, { company: "", role: "", date_range: "", bullets: [""] }])}
          label="Add Experience"
        />
      </div>

      {/* Education */}
      <SectionHeader>Education</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {education.map((edu, i) => (
          <Card key={i} onRemove={() => setEducation((prev) => prev.filter((_, j) => j !== i))}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingRight: '28px' }}>
              <LabeledInput label="Institution" value={edu.institution} onChange={(v) => updateEdu(i, "institution", v)} placeholder="Collegium Da Vinci Poznań" />
              <LabeledInput label="Years" value={edu.years} onChange={(v) => updateEdu(i, "years", v)} placeholder="2023 – present" />
            </div>
            <LabeledInput label="Degree / Field" value={edu.degree} onChange={(v) => updateEdu(i, "degree", v)} placeholder="Computer Science | part-time online studies" />
          </Card>
        ))}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <AddBtn
          onClick={() => setEducation((prev) => [...prev, { institution: "", degree: "", years: "" }])}
          label="Add Education"
        />
      </div>

      {/* Languages */}
      <SectionHeader>Languages</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {languages.map((lang, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <LabeledInput label="Language" value={lang.language} onChange={(v) => updateLang(i, "language", v)} placeholder="English" />
            </div>
            <div style={{ flex: 1 }}>
              <LabeledInput label="Level" value={lang.level} onChange={(v) => updateLang(i, "level", v)} placeholder="C1" />
            </div>
            <RemoveBtn onClick={() => setLanguages((prev) => prev.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <AddBtn
          onClick={() => setLanguages((prev) => [...prev, { language: "", level: "" }])}
          label="Add Language"
        />
      </div>

      {/* Certifications */}
      <SectionHeader>Certifications</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {certifications.map((cert, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 3 }}>
              <LabeledInput label="Name" value={cert.name} onChange={(v) => updateCert(i, "name", v)} placeholder="AWS Academy Graduate - Data Engineering" />
            </div>
            <div style={{ flex: 1 }}>
              <LabeledInput label="Year" value={cert.year} onChange={(v) => updateCert(i, "year", v)} placeholder="2025" />
            </div>
            <RemoveBtn onClick={() => setCertifications((prev) => prev.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '32px' }}>
        <AddBtn
          onClick={() => setCertifications((prev) => [...prev, { name: "", url: "", year: "" }])}
          label="Add Certification"
        />
      </div>

      {/* Submit */}
      {error && (
        <p style={{ fontFamily: F.body, fontSize: '13px', color: '#F87171', margin: '0 0 12px' }}>{error}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        style={{
          alignSelf: 'flex-start',
          padding: '11px 28px',
          background: isPending ? '#1E1E20' : 'linear-gradient(135deg, #FF5722, #FF8C42)',
          border: isPending ? '1px solid #272729' : '1px solid transparent',
          borderRadius: '6px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: F.display,
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isPending ? '#3A3A3E' : '#fff',
          boxShadow: isPending ? 'none' : '0 0 10px rgba(255,87,34,0.18)',
          transition: 'all 0.2s ease',
        }}
      >
        {isPending ? 'Creating...' : 'Create CV'}
      </button>
    </div>
  );
}
