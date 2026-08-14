import assert from "node:assert/strict";
import type { TestContext } from "node:test";
import { beforeEach, describe, it } from "node:test";
import { PlaybackError, createAudioEngine } from "../lib/audio";

/**
 * Guards the browser-autoplay contract. Playback is only permitted while the
 * user gesture that triggered it is still active, and awaiting even a single
 * animation frame before calling play() is enough for Safari to reject with
 * NotAllowedError — on desktop as well as mobile. These tests fail if anything
 * ever gets awaited ahead of the play() call again.
 */

let rafTicks = 0;

type PlayBehaviour = "ok" | "blocked" | "aborted";

class FakeAudio {
  src = "";
  volume = 1;
  paused = true;
  currentTime = 0;
  error: { code: number } | null = null;
  preload = "";
  /** How many animation frames had run when play() was invoked. */
  rafTicksAtPlay = -1;
  playCalls = 0;
  behaviour: PlayBehaviour = "ok";

  play(): Promise<void> {
    this.playCalls += 1;
    this.rafTicksAtPlay = rafTicks;
    if (this.behaviour === "blocked") {
      return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    }
    if (this.behaviour === "aborted") {
      return Promise.reject(new DOMException("interrupted", "AbortError"));
    }
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {}
  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }
  addEventListener() {}
  removeEventListener() {}
}

let current: FakeAudio;

function installBrowserGlobals() {
  rafTicks = 0;
  const g = globalThis as unknown as Record<string, unknown>;

  g.Audio = class {
    constructor() {
      current = new FakeAudio();
      return current as unknown as HTMLAudioElement;
    }
  };
  g.DOMException =
    g.DOMException ??
    class extends Error {
      constructor(message: string, name: string) {
        super(message);
        this.name = name;
      }
    };
  g.requestAnimationFrame = (cb: (t: number) => void) => {
    rafTicks += 1;
    return setTimeout(() => cb(Date.now()), 0) as unknown as number;
  };
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  g.performance = g.performance ?? { now: () => Date.now() };
  g.window = {
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (id: number) => clearInterval(id),
  };
}

/** The clip watcher is an interval, so teardown has to happen even on failure. */
function engineFor(t: TestContext) {
  const engine = createAudioEngine();
  t.after(() => engine.destroy());
  return engine;
}

const noop = () => {};

describe("audio engine", () => {
  beforeEach(installBrowserGlobals);

  it("calls play() synchronously on a cold start", (t) => {
    const engine = engineFor(t);
    // Deliberately not awaited: the call must already have happened.
    void engine.play("https://cdn.example/preview.mp3", noop, noop);

    assert.equal(current.playCalls, 1, "play() was not called synchronously");
    assert.equal(current.rafTicksAtPlay, 0, "an animation frame ran before play() — gesture lost");
  });

  it("calls play() synchronously while another track is already playing", async (t) => {
    const engine = engineFor(t);
    await engine.play("https://cdn.example/a.mp3", noop, noop);
    assert.equal(current.paused, false, "expected the first track to be playing");

    /* Switching sides is the path that actually regressed. A fade-out awaited
       here consumes the click, and the browser then refuses the new track —
       which is why the bug only showed up on the second press, not the first. */
    void engine.play("https://cdn.example/b.mp3", noop, noop);

    assert.equal(
      current.playCalls,
      2,
      "play() was deferred behind an await while switching tracks — the gesture is gone by then",
    );
    assert.equal(current.src, "https://cdn.example/b.mp3");
  });

  it("assigns the source before playing so the previous track stops", (t) => {
    const engine = engineFor(t);
    void engine.play("https://cdn.example/a.mp3", noop, noop);
    assert.equal(current.src, "https://cdn.example/a.mp3");
  });

  it("reports a blocked autoplay as PlaybackError('blocked')", async (t) => {
    const engine = engineFor(t);
    current.behaviour = "blocked";
    await assert.rejects(
      () => engine.play("https://cdn.example/a.mp3", noop, noop),
      (error: unknown) => error instanceof PlaybackError && error.kind === "blocked",
    );
  });

  it("stays quiet when a play is merely interrupted by the next one", async (t) => {
    const engine = engineFor(t);
    current.behaviour = "aborted";
    // An AbortError just means the user switched sides — never user-facing.
    await assert.doesNotReject(() => engine.play("https://cdn.example/c.mp3", noop, noop));
  });

  it("starts muted so the fade-in has somewhere to go", (t) => {
    const engine = engineFor(t);
    void engine.play("https://cdn.example/a.mp3", noop, noop);
    assert.equal(current.volume, 0);
  });
});
