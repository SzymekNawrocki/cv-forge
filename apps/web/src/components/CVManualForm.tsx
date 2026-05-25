"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import useSWR from "swr";
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

const inputClass = "forge-input bg-forge-surface border border-[#222224] rounded-md py-[9px] px-3 font-body text-[13px] text-forge-text outline-none w-full box-border";
const labelClass = "font-display text-[10px] font-bold tracking-[0.14em] uppercase text-[#9A9AA4] block mb-[5px]";

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
    <div className="flex flex-col">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        {isLink && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forge-orange font-mono text-[11px] pointer-events-none">↗</span>
        )}
        <input
          className={`${inputClass} ${isLink ? 'pl-[26px]' : ''}`}
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
      className="py-1.5 px-3.5 bg-transparent border border-dashed border-forge-border rounded-[5px] font-display text-[11px] font-bold tracking-[0.12em] uppercase text-[#9A9AA4] cursor-pointer transition-all duration-[180ms] hover:border-forge-orange hover:text-forge-orange"
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
      className="py-1 px-2 bg-transparent border-none text-[#5C5C70] text-base cursor-pointer leading-none shrink-0 transition-colors duration-150 hover:text-[#F87171]"
    >
      ×
    </button>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-forge-elevated pt-6 font-display text-[11px] font-bold tracking-[0.18em] uppercase text-forge-orange mb-3.5">
      {children}
    </div>
  );
}

function Card({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="bg-forge-surface border border-forge-elevated rounded-lg py-3.5 px-4 flex flex-col gap-2.5 relative">
      <div className="absolute top-2.5 right-2.5">
        <RemoveBtn onClick={onRemove} />
      </div>
      {children}
    </div>
  );
}

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
    <div className="bg-forge-surface border border-forge-elevated rounded-lg py-3 px-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <input
          className={`${inputClass} font-semibold text-xs text-forge-steel w-auto flex-1 mr-2`}
          value={cat.category}
          onChange={(e) => onChange({ ...cat, category: e.target.value })}
          placeholder="Category name"
        />
        <RemoveBtn onClick={onRemove} />
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {cat.items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 bg-forge-elevated border border-forge-border rounded py-[3px] px-2 font-body text-xs text-forge-text"
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="bg-none border-none text-[#9A9AA4] cursor-pointer leading-none px-0.5 text-[13px] hover:text-[#F87171] transition-colors"
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className={`${inputClass} w-[120px] text-xs py-[3px] px-2`}
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

function BulletListEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (updated: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>Bullets</label>
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <span className="text-[#9A9AA4] font-mono text-[11px] shrink-0">–</span>
          <input
            className={`${inputClass} flex-1`}
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

  const { data: dbSkills = [] } = useSWR("skills", fetchSkills);
  useEffect(() => {
    if (dbSkills.length > 0) {
      setSkills(dbSkills.map((s) => ({ category: s.category, items: [...s.items] })));
    }
  }, [dbSkills]);

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
    <div className="flex flex-col gap-0">

      {/* CV Title */}
      <div className="mb-5">
        <LabeledInput label="CV Title" value={title} onChange={setTitle} placeholder="e.g. My Master CV" />
      </div>

      {/* Header */}
      <SectionHeader>Identity &amp; Contact</SectionHeader>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <LabeledInput label="Full Name *" value={header.name} onChange={setH("name")} placeholder="Szymon Nawrocki" />
        <LabeledInput label="Job Title *" value={header.job_title} onChange={setH("job_title")} placeholder="Web Developer" />
        <LabeledInput label="Email" value={header.email} onChange={setH("email")} placeholder="you@example.com" />
        <LabeledInput label="Phone" value={header.phone} onChange={setH("phone")} placeholder="+48 727 932 054" />
        <LabeledInput label="Location" value={header.location} onChange={setH("location")} placeholder="Warsaw" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <LabeledInput label="Portfolio URL" value={header.portfolio_url} onChange={setH("portfolio_url")} placeholder="https://yoursite.com" isLink />
        <LabeledInput label="GitHub URL" value={header.github_url} onChange={setH("github_url")} placeholder="https://github.com/username" isLink />
      </div>

      {/* About Me */}
      <SectionHeader>About Me</SectionHeader>
      <div className="mb-5">
        <textarea
          className={`${inputClass} resize-y min-h-[100px] leading-[1.65]`}
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="Brief professional summary..."
          rows={4}
        />
      </div>

      {/* Skills */}
      <SectionHeader>Skills</SectionHeader>
      <div className="flex flex-col gap-2 mb-3">
        {skills.map((cat, i) => (
          <SkillCategoryRow
            key={i}
            cat={cat}
            onChange={(updated) => updateSkill(i, updated)}
            onRemove={() => setSkills((prev) => prev.filter((_, j) => j !== i))}
          />
        ))}
      </div>
      <div className="mb-5">
        <AddBtn onClick={() => setSkills((prev) => [...prev, { category: "", items: [] }])} label="Add Category" />
      </div>

      {/* Projects */}
      <SectionHeader>Projects</SectionHeader>
      <div className="flex flex-col gap-2.5 mb-3">
        {projects.map((p, i) => (
          <Card key={i} onRemove={() => setProjects((prev) => prev.filter((_, j) => j !== i))}>
            <div className="grid grid-cols-2 gap-2.5 pr-7">
              <LabeledInput label="Project Name" value={p.name} onChange={(v) => updateProject(i, "name", v)} placeholder="Hustle App" />
              <LabeledInput label="Date Range" value={p.date_range} onChange={(v) => updateProject(i, "date_range", v)} placeholder="Jan 2025 – present" />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} resize-y min-h-[70px] leading-[1.55] text-xs`}
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
      <div className="mb-5">
        <AddBtn onClick={() => setProjects((prev) => [...prev, { name: "", description: "", url: "", date_range: "" }])} label="Add Project" />
      </div>

      {/* Work Experience */}
      <SectionHeader>Work Experience</SectionHeader>
      <div className="flex flex-col gap-2.5 mb-3">
        {workExp.map((exp, i) => (
          <Card key={i} onRemove={() => setWorkExp((prev) => prev.filter((_, j) => j !== i))}>
            <div className="grid grid-cols-2 gap-2.5 pr-7">
              <LabeledInput label="Company" value={exp.company} onChange={(v) => updateExp(i, "company", v)} placeholder="Citi Handlowy" />
              <LabeledInput label="Date Range" value={exp.date_range} onChange={(v) => updateExp(i, "date_range", v)} placeholder="Jan 2025 – Aug 2025" />
            </div>
            <LabeledInput label="Role" value={exp.role} onChange={(v) => updateExp(i, "role", v)} placeholder="Helpdesk Analyst | Internship (full-time)" />
            <BulletListEditor bullets={exp.bullets} onChange={(updated) => updateExp(i, "bullets", updated)} />
          </Card>
        ))}
      </div>
      <div className="mb-5">
        <AddBtn onClick={() => setWorkExp((prev) => [...prev, { company: "", role: "", date_range: "", bullets: [""] }])} label="Add Experience" />
      </div>

      {/* Education */}
      <SectionHeader>Education</SectionHeader>
      <div className="flex flex-col gap-2.5 mb-3">
        {education.map((edu, i) => (
          <Card key={i} onRemove={() => setEducation((prev) => prev.filter((_, j) => j !== i))}>
            <div className="grid grid-cols-2 gap-2.5 pr-7">
              <LabeledInput label="Institution" value={edu.institution} onChange={(v) => updateEdu(i, "institution", v)} placeholder="Collegium Da Vinci Poznań" />
              <LabeledInput label="Years" value={edu.years} onChange={(v) => updateEdu(i, "years", v)} placeholder="2023 – present" />
            </div>
            <LabeledInput label="Degree / Field" value={edu.degree} onChange={(v) => updateEdu(i, "degree", v)} placeholder="Computer Science | part-time online studies" />
          </Card>
        ))}
      </div>
      <div className="mb-5">
        <AddBtn onClick={() => setEducation((prev) => [...prev, { institution: "", degree: "", years: "" }])} label="Add Education" />
      </div>

      {/* Languages */}
      <SectionHeader>Languages</SectionHeader>
      <div className="flex flex-col gap-2 mb-3">
        {languages.map((lang, i) => (
          <div key={i} className="flex gap-2.5 items-end">
            <div className="flex-[2]">
              <LabeledInput label="Language" value={lang.language} onChange={(v) => updateLang(i, "language", v)} placeholder="English" />
            </div>
            <div className="flex-1">
              <LabeledInput label="Level" value={lang.level} onChange={(v) => updateLang(i, "level", v)} placeholder="C1" />
            </div>
            <RemoveBtn onClick={() => setLanguages((prev) => prev.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <div className="mb-5">
        <AddBtn onClick={() => setLanguages((prev) => [...prev, { language: "", level: "" }])} label="Add Language" />
      </div>

      {/* Certifications */}
      <SectionHeader>Certifications</SectionHeader>
      <div className="flex flex-col gap-2 mb-3">
        {certifications.map((cert, i) => (
          <div key={i} className="flex gap-2.5 items-end">
            <div className="flex-[3]">
              <LabeledInput label="Name" value={cert.name} onChange={(v) => updateCert(i, "name", v)} placeholder="AWS Academy Graduate - Data Engineering" />
            </div>
            <div className="flex-1">
              <LabeledInput label="Year" value={cert.year} onChange={(v) => updateCert(i, "year", v)} placeholder="2025" />
            </div>
            <RemoveBtn onClick={() => setCertifications((prev) => prev.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <div className="mb-8">
        <AddBtn onClick={() => setCertifications((prev) => [...prev, { name: "", url: "", year: "" }])} label="Add Certification" />
      </div>

      {/* Submit */}
      {error && (
        <p className="font-body text-[13px] text-[#F87171] mb-3">{error}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="self-start py-[11px] px-7 rounded-md font-display text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer disabled:cursor-not-allowed border transition-all duration-200"
        style={{
          background: isPending ? '#1E1E20' : 'linear-gradient(135deg, #FF5722, #FF8C42)',
          border: isPending ? '1px solid #272729' : '1px solid transparent',
          color: isPending ? '#3A3A3E' : '#fff',
          boxShadow: isPending ? 'none' : '0 0 10px rgba(255,87,34,0.18)',
        }}
      >
        {isPending ? 'Creating...' : 'Create CV'}
      </button>
    </div>
  );
}
