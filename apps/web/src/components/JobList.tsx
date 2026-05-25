import { Job } from "@/lib/api";
import { JobCard } from "./JobCard";

export function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2.5">
        <p className="font-display text-base font-bold tracking-[0.10em] uppercase text-forge-label">
          No jobs found
        </p>
        <p className="font-body text-[13px] text-forge-muted">
          Trigger a scrape to populate the board
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
