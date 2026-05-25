"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import UserMenu from "./UserMenu";

const AUTH_PATHS = ["/login", "/register", "/verify-email"];

export default function Navbar() {
  const pathname = usePathname();
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="sticky top-0 z-50 h-[52px] bg-[rgba(13,13,14,0.90)] backdrop-blur-[16px] saturate-120 border-b border-forge-elevated flex items-center justify-between px-7">
      <a href="/" className="no-underline flex items-center">
        <Image
          src="/cv-forge-logo.png"
          alt="CV Forge"
          height={32}
          width={120}
          className="object-contain"
          priority
        />
      </a>

      <div className="flex items-center gap-0.5">
        <a href="/cv-manager" className="forge-nav-link">CV Manager</a>
        <a href="/forge" className="forge-nav-link">Forge</a>
        <a href="/settings" className="forge-nav-link">Settings</a>
        <div className="ml-4">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
