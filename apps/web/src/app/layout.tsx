import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-gray-200 bg-white px-6 py-3 flex gap-6 text-sm font-medium">
          <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors">Jobs</a>
          <a href="/cv-manager" className="text-gray-700 hover:text-blue-600 transition-colors">CV Manager</a>
          <a href="/forge" className="text-gray-700 hover:text-blue-600 transition-colors">Forge</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
