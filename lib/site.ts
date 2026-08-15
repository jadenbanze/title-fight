function normalise(raw: string): string {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

/**
 * Canonical origin for share links, OG metadata and the branding printed on
 * result cards. Set NEXT_PUBLIC_SITE_URL to the domain you want people to see.
 *
 * The Vercel fallbacks are here because this string ends up baked into shared
 * images: a forgotten env var would send screenshots into the world reading
 * "localhost:3000", which no redeploy can take back.
 * VERCEL_PROJECT_PRODUCTION_URL is the stable production domain and is
 * preferred over the per-deployment VERCEL_URL, so preview builds don't brand
 * cards with a throwaway hostname.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return normalise(configured);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return normalise(vercel);

  return "http://localhost:3000";
}

/** Bare hostname for display, e.g. "title-fight.app". */
export function getSiteHost(): string {
  const url = getSiteUrl();
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
}

/**
 * Human-readable URL for printing on a card: "title-fight.app/t/money".
 * Protocol omitted deliberately — it's noise on an image, and every browser
 * resolves the bare host.
 */
export function getShareLabel(path = ""): string {
  if (!path) return getSiteHost();
  return `${getSiteHost()}${path.startsWith("/") ? path : `/${path}`}`;
}
