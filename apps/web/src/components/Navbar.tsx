"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
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
      <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
        <Image
          src="/cv-forge-logo.png"
          alt="CV Forge"
          height={32}
          width={120}
          style={{ objectFit: "contain" }}
          priority
        />
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <a href="/cv-manager" className="forge-nav-link">CV Manager</a>
        <a href="/forge" className="forge-nav-link">Forge</a>
        <a href="/settings" className="forge-nav-link">Settings</a>
        <div style={{ marginLeft: "16px" }}>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
