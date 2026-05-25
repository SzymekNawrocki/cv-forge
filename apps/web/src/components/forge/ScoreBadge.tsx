function scoreClass(s: number) {
  if (s >= 75) return "text-[#4ADE80] bg-[rgba(74,222,128,0.08)] border-[rgba(74,222,128,0.22)]";
  if (s >= 50) return "text-forge-heat bg-[rgba(255,140,66,0.08)] border-[rgba(255,140,66,0.22)]";
  return "text-[#F87171] bg-[rgba(248,113,113,0.08)] border-[rgba(248,113,113,0.22)]";
}

export default function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  return (
    <div className={`flex flex-col items-center py-1.5 px-3.5 rounded-lg border min-w-16 ${scoreClass(score)}`}>
      <span className="font-display text-2xl font-extrabold tracking-[0.04em] leading-none">
        {Math.round(score)}
      </span>
      <span className="font-body text-[9px] font-medium tracking-[0.10em] uppercase text-forge-muted mt-0.5">
        {label}
      </span>
    </div>
  );
}
