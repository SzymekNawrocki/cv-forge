"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "16px",
      color: "#E2E2E4",
    }}>
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Something went wrong</h2>
      <p style={{ color: "#9CA3AF", margin: 0 }}>An unexpected error occurred.</p>
      {error.digest && (
        <p style={{ fontSize: "12px", color: "#6B7280", fontFamily: "monospace", margin: 0 }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: "8px 20px",
          background: "#FF5722",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        Try again
      </button>
    </div>
  );
}
