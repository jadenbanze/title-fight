const DEV_FALLBACKS = {
  VOTE_SECRET: "dev-only-vote-secret-change-me",
  IP_HASH_SALT: "dev-only-ip-salt-change-me",
} as const;

/**
 * Reads a signing secret. In development it falls back to a fixed string so the
 * app runs with no setup; in production a missing or fallback value throws,
 * because the fallback is public (it's in this repo) and anyone could use it to
 * forge vote tokens.
 */
export function requireSecret(name: keyof typeof DEV_FALLBACKS): string {
  const value = process.env[name];
  const isProd = process.env.NODE_ENV === "production";

  if (!value || value === DEV_FALLBACKS[name]) {
    if (isProd) {
      throw new Error(
        `${name} is not set. Generate one with: openssl rand -base64 32 — never deploy with the development fallback.`,
      );
    }
    return DEV_FALLBACKS[name];
  }
  return value;
}
