import { Job } from "@/lib/api";
import { JobCard } from "./JobCard";

export function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
        gap: '10px',
      }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: '#5C5C66',
        }}>
          No jobs found
        </p>
        <p style={{
          fontFamily: '"IBM Plex Sans", sans-serif',
          fontSize: '13px',
          color: '#3A3A3E',
        }}>
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
