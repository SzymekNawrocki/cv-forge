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
  content_markdown: string;
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

export async function fetchJob(id: number): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Job ${id} not found`);
  return res.json() as Promise<Job>;
}
