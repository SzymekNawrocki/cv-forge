export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "12px",
      color: "#E2E2E4",
    }}>
      <div style={{ fontSize: "72px", fontWeight: 800, color: "#FF5722", lineHeight: 1 }}>404</div>
      <p style={{ color: "#9CA3AF", margin: 0 }}>Page not found.</p>
      <a
        href="/"
        style={{
          color: "#FF5722",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
          marginTop: "4px",
        }}
      >
        Go home
      </a>
    </div>
  );
}
