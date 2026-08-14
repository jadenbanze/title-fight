/**
 * Title slugs come from the URL, get turned into a Deezer search term, and get
 * used as Redis cache keys. Both of those need a hard bound: an unvalidated
 * slug means arbitrary-length upstream queries and unbounded key growth.
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_SLUG_LENGTH = 40;

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_RE.test(slug);
}

/** Returns the slug if it's safe to use, otherwise null. */
export function safeSlug(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const slug = raw.trim().toLowerCase();
  return isValidSlug(slug) ? slug : null;
}
