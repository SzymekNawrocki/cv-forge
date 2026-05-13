"use client";

import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";

const AUTH_PATHS = ["/login", "/register", "/verify-email"];

export default function Navbar() {
  const pathname = usePathname();
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      height: "52px",
      background: "rgba(13, 13, 14, 0.90)",
      backdropFilter: "blur(16px) saturate(1.2)",
      WebkitBackdropFilter: "blur(16px) saturate(1.2)",
      borderBottom: "1px solid #1E1E20",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
    }}>
      <a href="/" style={{ textDecoration: "none" }}>
        <span style={{
          fontFamily: '"Barlow Condensed", var(--font-barlow-condensed), sans-serif',
          fontSize: "19px",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#E2E2E4",
        }}>
          CV<span style={{ color: "#FF5722" }}>—</span>FORGE
        </span>
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <a href="/cv-manager" className="forge-nav-link">CV Manager</a>
        <a href="/forge" className="forge-nav-link">Forge</a>
        <div style={{ marginLeft: "16px" }}>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
