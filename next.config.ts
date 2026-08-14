import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";

/* ----------------------------------------------------------------------------
   CONTENT SECURITY POLICY
   Enforced (not report-only). Two things to know before editing:

   1. CSP host wildcards only replace a whole leftmost label. `*.dzcdn.net` is
      valid; `cdns-preview-*.dzcdn.net` is not and would be silently dropped.
      Deezer serves art from cdn-images.dzcdn.net and previews from
      cdnt-preview.dzcdn.net, and has used other subdomains historically, so
      the wildcard is deliberate.
   2. Next.js inlines its hydration bootstrap, which needs 'unsafe-inline' as
      long as we aren't threading a nonce through. `'unsafe-eval'` and the
      websocket origins are only needed by the dev server's fast refresh, so
      production does without them.
   ---------------------------------------------------------------------------- */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.dzcdn.net",
  "media-src 'self' https://*.dzcdn.net",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // Everything server-side (Deezer, Upstash) is proxied through our own routes,
  // so the browser only ever talks to this origin. ws: is dev fast refresh.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {},
  poweredByHeader: false,
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
  disable: isDev,
  reloadOnOnline: false,
});

export default withSerwist(nextConfig);
