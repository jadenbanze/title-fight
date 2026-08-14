export const CLIP_SECONDS = 15;

const FADE_OUT_MS = 130;
const FADE_IN_MS = 200;

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

export function createAudioEngine() {
  const audio = new Audio();
  audio.preload = "auto";
  let clipTimer: number | null = null;
  const warmed = new Map<string, HTMLAudioElement>();

  const stopClipWatch = () => {
    if (clipTimer != null) {
      window.clearInterval(clipTimer);
      clipTimer = null;
    }
  };

  const watchClip = (onTick: (t: number) => void, onEnd: () => void) => {
    stopClipWatch();
    clipTimer = window.setInterval(() => {
      onTick(audio.currentTime);
      if (audio.currentTime >= CLIP_SECONDS) {
        void ramp(audio, 0, 220).then(() => audio.pause());
        onEnd();
        stopClipWatch();
      }
    }, 80);
  };

  return {
    element: audio,

    /** Swaps tracks with a short cross-fade so switching sides isn't a hard cut. */
    async play(src: string, onTick: (t: number) => void, onEnd: () => void) {
      if (!audio.paused) await ramp(audio, 0, FADE_OUT_MS);
      if (audio.src !== src) audio.src = src;
      audio.currentTime = 0;
      audio.volume = 0;
      await audio.play();
      void ramp(audio, 1, FADE_IN_MS);
      watchClip(onTick, onEnd);
    },

    async pause() {
      if (audio.paused) return;
      stopClipWatch();
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

    destroy() {
      stopClipWatch();
      audio.pause();
      audio.src = "";
      warmed.clear();
    },
  };
}
