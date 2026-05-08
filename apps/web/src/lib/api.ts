const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface MasterCV {
  id: number;
  title: string;
  content_markdown: string;
  github_url: string | null;
  portfolio_url: string | null;
  created_at: string;
}

export interface TailoredCV {
  id: number;
  master_cv_id: number;
  job_desc_id: number;
  content_json: string;
  initial_match_score: number | null;
  match_score: number | null;
}

export interface UserProfile {
  id: number;
  name: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  updated_at: string;
}

export interface SkillCategoryEntry {
  category: string;
  items: string[];
}

export interface WorkExperienceEntry {
  company: string;
  role: string;
  date_range: string;
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  url: string;
  date_range: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  years: string;
}

export interface LanguageEntry {
  language: string;
  level: string;
}

export interface CertificationEntry {
  name: string;
  url: string;
  year: string;
}

export interface CVFormData {
  title: string;
  github_url: string;
  portfolio_url: string;
  name: string;
  job_title: string;
  email: string;
  phone: string;
  location: string;
  about_me: string;
  skills: SkillCategoryEntry[];
  projects: ProjectEntry[];
  work_experience: WorkExperienceEntry[];
  education: EducationEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
}

export async function fetchMasterCVs(): Promise<MasterCV[]> {
  const res = await fetch(`${API_BASE}/cv/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch CVs");
  return res.json();
}

export async function importCV(
  title: string,
  raw_text: string,
  github_url?: string,
  portfolio_url?: string,
): Promise<MasterCV> {
  const res = await fetch(`${API_BASE}/cv/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, raw_text, github_url: github_url || null, portfolio_url: portfolio_url || null }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCV(data: CVFormData): Promise<MasterCV> {
  const res = await fetch(`${API_BASE}/cv/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCVLinks(
  id: number,
  github_url: string | null,
  portfolio_url: string | null,
): Promise<MasterCV> {
  const res = await fetch(`${API_BASE}/cv/${id}/links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url, portfolio_url }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCV(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/cv/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function forgeCV(
  master_cv_id: number,
  job_description_text: string,
): Promise<TailoredCV> {
  const res = await fetch(`${API_BASE}/cv/forge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ master_cv_id, job_description_text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface Job {
  id: number;
  title: string | null;
  company: string | null;
  tech_stack: string[];
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  contact_email: string | null;
  source_url: string | null;
  status: string;
  created_at: string;
}

export async function fetchJobs(limit = 50): Promise<Job[]> {
  const res = await fetch(`${API_BASE}/jobs/?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const data = await res.json();
  return data.jobs as Job[];
}

export interface Skill {
  id: number;
  category: string;
  items: string[];
  created_at: string;
}

export async function fetchSkills(): Promise<Skill[]> {
  const res = await fetch(`${API_BASE}/skills/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch skills");
  return res.json();
}

export async function createSkill(category: string, items: string[]): Promise<Skill> {
  const res = await fetch(`${API_BASE}/skills/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSkill(id: number, category: string, items: string[]): Promise<Skill> {
  const res = await fetch(`${API_BASE}/skills/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSkill(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/skills/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchJob(id: number): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Job ${id} not found`);
  return res.json() as Promise<Job>;
}
