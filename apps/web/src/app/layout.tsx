import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Job Hunter",
  description: "Automated job board scraper and dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '52px',
          background: 'rgba(13, 13, 14, 0.90)',
          backdropFilter: 'blur(16px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
          borderBottom: '1px solid #1E1E20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
        }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #FF5722 0%, #FFC947 100%)',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255,87,34,0.40)',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '15px', fontWeight: 800, color: '#fff' }}>C</span>
            </div>
            <span style={{
              fontFamily: '"Barlow Condensed", var(--font-barlow-condensed), sans-serif',
              fontSize: '19px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#E2E2E4',
            }}>
              CV<span style={{ color: '#FF5722' }}>—</span>FORGE
            </span>
          </a>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '2px' }}>
            <a href="/jobs" className="forge-nav-link">Jobs</a>
            <a href="/cv-manager" className="forge-nav-link">CV Manager</a>
            <a href="/skills" className="forge-nav-link">Skills</a>
            <a href="/forge" className="forge-nav-link">Forge</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
