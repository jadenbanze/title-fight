import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { requireSecret } from "../lib/secrets";

const ORIGINAL_ENV = process.env.NODE_ENV;
const ORIGINAL_SECRET = process.env.VOTE_SECRET;

function setNodeEnv(value: string | undefined) {
  // NODE_ENV is readonly in the Next types; tests need to flip it.
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(ORIGINAL_ENV);
  if (ORIGINAL_SECRET === undefined) delete process.env.VOTE_SECRET;
  else process.env.VOTE_SECRET = ORIGINAL_SECRET;
});

describe("requireSecret", () => {
  it("falls back to a development value outside production", () => {
    setNodeEnv("development");
    delete process.env.VOTE_SECRET;
    assert.equal(requireSecret("VOTE_SECRET"), "dev-only-vote-secret-change-me");
  });

  it("refuses to run in production without a real secret", () => {
    setNodeEnv("production");
    delete process.env.VOTE_SECRET;
    assert.throws(() => requireSecret("VOTE_SECRET"), /VOTE_SECRET is not set/);

    process.env.VOTE_SECRET = "dev-only-vote-secret-change-me";
    assert.throws(() => requireSecret("VOTE_SECRET"), /VOTE_SECRET is not set/);
  });

  it("uses a configured secret in production", () => {
    setNodeEnv("production");
    process.env.VOTE_SECRET = "a-real-generated-secret";
    assert.equal(requireSecret("VOTE_SECRET"), "a-real-generated-secret");
  });
});
