import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Barlow_Condensed, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CookieBanner from "@/components/CookieBanner";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D0D0E",
};

export const metadata: Metadata = {
  title: "CV Forge — AI CV Tailoring",
  description: "Tailor your CV to any job in 30 seconds. AI-powered keyword insertion for ATS compatibility.",
  openGraph: {
    title: "CV Forge — AI CV Tailoring",
    description: "Tailor your CV to any job in 30 seconds. AI-powered keyword insertion for ATS compatibility.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CV Forge — AI CV Tailoring",
    description: "Tailor your CV to any job in 30 seconds.",
    images: ["/og.png"],
  },
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
        <Navbar />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
