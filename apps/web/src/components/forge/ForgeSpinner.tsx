export default function ForgeSpinner({ size = 16 }: { size?: number }) {
  const thick = size > 20;
  return (
    <div
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        border: `${thick ? 3 : 2}px solid rgba(255,87,34,0.25)`,
        borderTopColor: "#FF5722",
        animation: "forge-spin 0.75s linear infinite",
        boxShadow: thick ? "0 0 16px rgba(255,87,34,0.28)" : "none",
      }}
    />
  );
}
