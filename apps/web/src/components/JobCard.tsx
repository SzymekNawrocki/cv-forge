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
      className="block rounded-xl border border-forge-track bg-forge-surface p-5 no-underline transition-all duration-[250ms] hover:border-[rgba(255,87,34,0.35)] hover:shadow-[0_0_28px_rgba(255,87,34,0.08),0_4px_20px_rgba(0,0,0,0.4)] hover:bg-[#191919]"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold tracking-[0.04em] text-forge-text truncate">
            {job.title ?? "Untitled"}
          </h2>
          <p className="font-body text-xs text-forge-muted mt-0.5 truncate">
            {job.company ?? "Unknown company"}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {salaryText && (
        <p className="font-display text-sm font-bold tracking-[0.04em] text-[#4ADE80] mt-2">
          {salaryText}
        </p>
      )}

      {job.tech_stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.tech_stack.slice(0, 6).map((tech) => (
            <span
              key={tech}
              className="px-2 py-[3px] bg-white/[0.04] border border-forge-line rounded-[3px] font-body text-[11px] text-forge-hint"
            >
              {tech}
            </span>
          ))}
          {job.tech_stack.length > 6 && (
            <span className="text-[11px] text-forge-hint self-center">
              +{job.tech_stack.length - 6}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
