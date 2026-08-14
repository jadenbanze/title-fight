export const CLIP_SECONDS = 15;

const FADE_IN_MS = 180;
const FADE_OUT_MS = 130;

export type PlaybackFailure = "blocked" | "unavailable";

export class PlaybackError extends Error {
  readonly kind: PlaybackFailure;
  constructor(kind: PlaybackFailure, message: string) {
    super(message);
    this.name = "PlaybackError";
    this.kind = kind;
  }
}

function ramp(audio: HTMLAudioElement, to: number, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const from = audio.volume;
    if (ms <= 0 || from === to) {
      audio.volume = to;
      resolve();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/** True for "you interrupted me", which is routine when switching sides. */
function isInterruption(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** True when the browser refused to start audio without a fresh user gesture. */
function isBlocked(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

/* MediaError.MEDIA_ERR_ABORTED — the load we cancelled ourselves by swapping src. */
const MEDIA_ERR_ABORTED = 1;

export function createAudioEngine() {
  const audio = new Audio();
  audio.preload = "auto";
  let clipTimer: number | null = null;
  let destroyed = false;
  /* Bumped on every play() so a superseded call can bail instead of fighting
     the newer one for the single element. */
  let generation = 0;
  const warmed = new Map<string, HTMLAudioElement>();

  const stopClipWatch = () => {
    if (clipTimer != null) {
      window.clearInterval(clipTimer);
      clipTimer = null;
    }
  };

  const watchClip = (gen: number, onTick: (t: number) => void, onEnd: () => void) => {
    stopClipWatch();
    clipTimer = window.setInterval(() => {
      if (gen !== generation) {
        stopClipWatch();
        return;
      }
      onTick(audio.currentTime);
      if (audio.currentTime >= CLIP_SECONDS) {
        stopClipWatch();
        void ramp(audio, 0, 220).then(() => {
          if (gen === generation) audio.pause();
        });
        onEnd();
      }
    }, 80);
  };

  return {
    element: audio,

    /**
     * Starts a preview.
     *
     * `audio.play()` is called with nothing awaited before it, which is the whole
     * point: browsers only honour playback while the user gesture that triggered
     * it is still active, and awaiting even one animation frame first is enough
     * for Safari to reject with NotAllowedError. So there's no fade-out here —
     * assigning `src` stops whatever was playing, and the new track fades in.
     *
     * Resolves quietly if a newer call supersedes this one. Throws PlaybackError
     * only for failures worth telling the user about.
     */
    async play(src: string, onTick: (t: number) => void, onEnd: () => void) {
      const gen = ++generation;
      stopClipWatch();

      if (audio.src !== src) {
        audio.src = src;
      } else {
        // Same track again: rewind. Safari throws if no metadata has loaded yet.
        try {
          audio.currentTime = 0;
        } catch {
          /* the seek lands once the media is ready */
        }
      }
      audio.volume = 0;

      try {
        await audio.play();
      } catch (error) {
        if (gen !== generation || isInterruption(error)) return;
        if (isBlocked(error)) {
          throw new PlaybackError("blocked", "The browser blocked playback.");
        }
        throw new PlaybackError("unavailable", "That preview could not be played.");
      }

      if (gen !== generation) {
        audio.pause();
        return;
      }

      /* A fresh src starts at 0, so only rewind once playback is actually going
         (and only if something left the playhead mid-clip). */
      if (audio.currentTime > 0.5) {
        try {
          audio.currentTime = 0;
        } catch {
          /* not fatal */
        }
      }

      void ramp(audio, 1, FADE_IN_MS);
      watchClip(gen, onTick, onEnd);
    },

    async pause() {
      generation += 1;
      stopClipWatch();
      if (audio.paused) return;
      // Not gesture-sensitive, so a fade-out here is safe.
      await ramp(audio, 0, FADE_OUT_MS);
      audio.pause();
    },

    /** Warms the browser cache for previews the user is about to need. */
    prefetch(...srcs: string[]) {
      for (const src of srcs) {
        if (!src || warmed.has(src) || src === audio.src) continue;
        const el = new Audio();
        el.preload = "auto";
        el.src = src;
        warmed.set(src, el);
        // Keep the pool small — a bout only ever needs two.
        if (warmed.size > 4) {
          const oldest = warmed.keys().next().value;
          if (oldest) warmed.delete(oldest);
        }
      }
    },

    /**
     * Fires when the media itself fails — most likely an expired signed preview
     * URL, which rejects on load rather than on play(). Ignores the aborts we
     * cause ourselves by swapping src, and anything after teardown.
     */
    onError(handler: () => void): () => void {
      const listener = () => {
        if (destroyed || !audio.src) return;
        if (audio.error?.code === MEDIA_ERR_ABORTED) return;
        stopClipWatch();
        handler();
      };
      audio.addEventListener("error", listener);
      return () => audio.removeEventListener("error", listener);
    },

    destroy() {
      destroyed = true;
      generation += 1;
      stopClipWatch();
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      warmed.clear();
    },
  };
}
