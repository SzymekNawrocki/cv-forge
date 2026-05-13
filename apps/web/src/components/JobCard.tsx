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
      className="block rounded-xl border border-[#222224] bg-[#161618] p-5 no-underline transition-all duration-[250ms] hover:border-[rgba(255,87,34,0.35)] hover:shadow-[0_0_28px_rgba(255,87,34,0.08),0_4px_20px_rgba(0,0,0,0.4)] hover:bg-[#191919]"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <h2
            className="font-semibold truncate"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#E2E2E4',
            }}
          >
            {job.title ?? "Untitled"}
          </h2>
          <p
            className="mt-0.5 truncate"
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '12px',
              color: '#7A7A84',
            }}
          >
            {job.company ?? "Unknown company"}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {salaryText && (
        <p
          className="mt-2"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#4ADE80',
          }}
        >
          {salaryText}
        </p>
      )}

      {job.tech_stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.tech_stack.slice(0, 6).map((tech) => (
            <span
              key={tech}
              style={{
                padding: '3px 8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #2A2A2C',
                borderRadius: '3px',
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '11px',
                color: '#9A9AA4',
              }}
            >
              {tech}
            </span>
          ))}
          {job.tech_stack.length > 6 && (
            <span style={{ fontSize: '11px', color: '#5C5C66', alignSelf: 'center' }}>
              +{job.tech_stack.length - 6}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
