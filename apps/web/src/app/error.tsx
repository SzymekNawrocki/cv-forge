"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-forge-text">
      <h2 className="text-2xl font-bold m-0">Something went wrong</h2>
      <p className="text-forge-hint m-0">An unexpected error occurred.</p>
      {error.digest && (
        <p className="text-xs text-forge-muted font-mono m-0">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="px-5 py-2 bg-forge-orange text-white border-none rounded-md cursor-pointer text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
