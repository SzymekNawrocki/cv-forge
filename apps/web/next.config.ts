import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

// Same-origin proxy to the FastAPI backend. The browser calls "/api/*" on the
// frontend's own origin; Next.js forwards to the backend. This keeps the `auth`
// cookie first-party so it survives third-party-cookie blocking. NEXT_PUBLIC_API_URL
// is the backend origin (e.g. https://cv-forge-fove.onrender.com).
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

// withSentryConfig instruments Next.js server components and API routes.
// Source-map upload is skipped automatically when SENTRY_AUTH_TOKEN is not set.
export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
});
