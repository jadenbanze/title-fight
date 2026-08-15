import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getShareLabel, getSiteHost, getSiteUrl } from "../lib/site";

const KEYS = ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;
const ORIGINAL = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function setEnv(values: Partial<Record<(typeof KEYS)[number], string | undefined>>) {
  for (const key of KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const key of KEYS) {
    const value = ORIGINAL[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("site url", () => {
  it("prefers the configured domain", () => {
    setEnv({ NEXT_PUBLIC_SITE_URL: "https://title-fight.app", VERCEL_URL: "whatever.vercel.app" });
    assert.equal(getSiteUrl(), "https://title-fight.app");
    assert.equal(getSiteHost(), "title-fight.app");
  });

  it("tolerates a trailing slash and a missing protocol", () => {
    setEnv({ NEXT_PUBLIC_SITE_URL: "title-fight.app/" });
    assert.equal(getSiteUrl(), "https://title-fight.app");

    setEnv({ NEXT_PUBLIC_SITE_URL: "https://title-fight.app///" });
    assert.equal(getSiteUrl(), "https://title-fight.app");
  });

  it("falls back to the stable production domain, not the per-deploy one", () => {
    /* Preview builds must not brand shared images with a throwaway hostname. */
    setEnv({
      VERCEL_PROJECT_PRODUCTION_URL: "title-fight.vercel.app",
      VERCEL_URL: "title-fight-git-abc123.vercel.app",
    });
    assert.equal(getSiteHost(), "title-fight.vercel.app");
  });

  it("uses the deployment url when nothing better exists", () => {
    setEnv({ VERCEL_URL: "title-fight-git-abc123.vercel.app" });
    assert.equal(getSiteHost(), "title-fight-git-abc123.vercel.app");
  });

  it("builds a display label without the protocol", () => {
    setEnv({ NEXT_PUBLIC_SITE_URL: "https://title-fight.app" });
    assert.equal(getShareLabel("/t/money"), "title-fight.app/t/money");
    assert.equal(getShareLabel("t/money"), "title-fight.app/t/money");
    assert.equal(getShareLabel(), "title-fight.app");
  });

  it("only lands on localhost when nothing is configured", () => {
    setEnv({});
    assert.equal(getSiteHost(), "localhost:3000");
  });
});
