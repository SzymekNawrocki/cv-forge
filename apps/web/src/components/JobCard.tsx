import Link from "next/link";
import { Job } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

export function JobCard({ job }: { job: Job }) {
  const salaryText =
    job.salary_min && job.salary_max
      ? `${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} ${job.currency ?? ""}`
      : null;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">{job.title ?? "Untitled"}</h2>
          <p className="text-sm text-gray-500">{job.company ?? "Unknown company"}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {salaryText && (
        <p className="mt-2 text-sm font-medium text-emerald-700">{salaryText}</p>
      )}

      {job.tech_stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {job.tech_stack.slice(0, 6).map((tech) => (
            <span
              key={tech}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tech}
            </span>
          ))}
          {job.tech_stack.length > 6 && (
            <span className="text-xs text-gray-400">+{job.tech_stack.length - 6}</span>
          )}
        </div>
      )}
    </Link>
  );
}
