import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/* ----------------------------------------------------------------------------
   SECURITY HEADERS
   The non-CSP headers are enforced. The CSP ships report-only first because
   Next injects inline hydration scripts and Serwist registers a worker — check
   the console for violations, then rename the header to enforce it.
   ---------------------------------------------------------------------------- */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js needs inline/eval for hydration and dev refresh.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://cdn-images.dzcdn.net",
  "media-src 'self' https://cdnt-preview.dzcdn.net https://cdns-preview-*.dzcdn.net",
  "connect-src 'self' https://api.deezer.com https://*.upstash.io",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  turbopack: {},
  /* The Instrument Serif TTF is read at request time with fs, which the
     bundler's static analysis can't see — force it into the deployment trace. */
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/**"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Vote and lookup responses are per-visitor; never let a CDN hold them.
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

/* ----------------------------------------------------------------------------
   PWA / SERVICE WORKER
   `withSerwist` bundles app/sw.ts into public/sw.js via webpack, so the
   production build must run `next build --webpack`. Dev stays on Turbopack with
   the worker disabled so it never serves stale assets while developing.
   ---------------------------------------------------------------------------- */
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
});

export default withSerwist(nextConfig);
