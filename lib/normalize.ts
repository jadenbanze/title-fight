const VERSION_RE =
  /\b(remix|acoustic|live|karaoke|slowed|sped|instrumental|cover|radio\s*edit|bonus|version|re-?master(?:ed)?|deluxe|edit|mix|demo|session|unplugged|stripped)\b/i;

const FEAT_RE = /\s*(?:feat\.?|ft\.?|featuring)\s+.+$/i;
const FEAT_GROUP_RE = /^(?:feat\.?|ft\.?|featuring)\b/i;

export function stripParenGroups(value: string): string {
  return value.replace(/\([^)]*\)|\[[^\]]*\]/g, " ");
}

export function extraTitleGroups(value: string): string[] {
  return [...value.matchAll(/\(([^)]*)\)|\[([^\]]*)\]/g)]
    .map((match) => (match[1] ?? match[2] ?? "").trim())
    .filter(Boolean);
}

export function hasNonFeatQualifier(rawTitle: string): boolean {
  return extraTitleGroups(rawTitle).some((group) => !FEAT_GROUP_RE.test(group));
}

export function normalizeTitle(value: string): string {
  return stripParenGroups(value)
    .replace(FEAT_RE, " ")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function slugifyTitle(value: string): string {
  return normalizeTitle(value).replace(/\s+/g, "-");
}

export function looksLikeVariant(rawTitle: string): boolean {
  return VERSION_RE.test(rawTitle);
}

export function isExactTitleMatch(rawTitle: string, seed: string): boolean {
  if (looksLikeVariant(rawTitle)) return false;
  if (hasNonFeatQualifier(rawTitle)) return false;
  return normalizeTitle(rawTitle) === normalizeTitle(seed);
}

export function displayTitle(seed: string): string {
  return seed
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function unslugify(slug: string): string {
  return displayTitle(slug.replace(/-/g, " "));
}
