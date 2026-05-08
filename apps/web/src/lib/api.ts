const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface MasterCV {
  id: number;
  title: string;
  content_markdown: string;
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

export async function fetchMasterCVs(): Promise<MasterCV[]> {
  const res = await fetch(`${API_BASE}/cv/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch CVs");
  return res.json();
}

export async function importCV(title: string, raw_text: string): Promise<MasterCV> {
  const res = await fetch(`${API_BASE}/cv/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, raw_text }),
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
