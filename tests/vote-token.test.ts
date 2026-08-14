import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { issueVoteToken, verifyVoteToken } from "../lib/vote-token";

describe("vote token", () => {
  it("round-trips a valid token", () => {
    const token = issueVoteToken({
      pairId: "baby:1-2",
      a: 1,
      b: 2,
      slug: "baby",
      boutId: "qf-1",
    });
    const payload = verifyVoteToken(token);
    assert.ok(payload);
    assert.equal(payload.pairId, "baby:1-2");
    assert.equal(payload.a, 1);
    assert.equal(payload.b, 2);
  });

  it("rejects tampering and expiry", () => {
    const token = issueVoteToken({
      pairId: "baby:1-2",
      a: 1,
      b: 2,
      slug: "baby",
      boutId: "qf-1",
    });
    assert.equal(verifyVoteToken(`${token}x`), null);
    const expired = issueVoteToken(
      { pairId: "baby:1-2", a: 1, b: 2, slug: "baby", boutId: "qf-1" },
      -1000,
    );
    assert.equal(verifyVoteToken(expired), null);
  });
});
