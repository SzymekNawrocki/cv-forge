import { fetchJob } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let job;
  try {
    job = await fetchJob(Number(id));
  } catch {
    notFound();
  }

  const salaryText =
    job.salary_min && job.salary_max
      ? `${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} ${job.currency ?? ""}`
      : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.title ?? "Untitled"}</h1>
          <p className="text-gray-500">{job.company ?? "Unknown"}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {salaryText && (
        <p className="mt-4 text-lg font-medium text-emerald-700">{salaryText}</p>
      )}

      {job.tech_stack.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase text-gray-400 tracking-wide mb-2">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {job.tech_stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {job.contact_email && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase text-gray-400 tracking-wide mb-1">
            Contact
          </h2>
          <a
            href={`mailto:${job.contact_email}`}
            className="text-blue-600 hover:underline"
          >
            {job.contact_email}
          </a>
        </section>
      )}

      {job.source_url && (
        <section className="mt-6">
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            View original posting →
          </a>
        </section>
      )}
    </main>
  );
}
