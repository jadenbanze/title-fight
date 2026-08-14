/**
 * Checks that seed words actually produce a full bracket.
 *
 * A seed is only useful if Deezer returns eight *different* artists with that
 * exact title — anything less and `/t/<slug>` 404s, which would show up as a
 * dead link on /hot or a dud from the random picker. This runs the real
 * `loadLiveTitle` so the matching rules are identical to production.
 *
 *   pnpm verify:seeds              # check the shipped list
 *   pnpm verify:seeds Rain Fever   # check candidates before adding them
 */
import { BRACKET_SIZE } from "../lib/bracket";
import { loadLiveTitle } from "../lib/live-title";
import { slugifyTitle } from "../lib/normalize";
import { TITLE_SEEDS } from "../lib/seeds";

const SLEEP_MS = 180; // stay well inside Deezer's ~50 req / 5s budget

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const args = process.argv.slice(2);
  const words = args.length > 0 ? args : TITLE_SEEDS;
  const label = args.length > 0 ? "candidates" : "shipped seeds";

  console.log(`Checking ${words.length} ${label} — need ${BRACKET_SIZE} unique artists each.\n`);

  const passed: string[] = [];
  const failed: { word: string; reason: string }[] = [];

  for (const word of words) {
    try {
      const title = await loadLiveTitle(slugifyTitle(word));
      if (title && title.tracks.length >= BRACKET_SIZE) {
        passed.push(word);
        const top = title.tracks
          .slice(0, 3)
          .map((t) => t.artist)
          .join(", ");
        console.log(`  PASS  ${word.padEnd(20)} ${top}`);
      } else {
        const reason = title ? `only ${title.tracks.length} artists` : "no bracket";
        failed.push({ word, reason });
        console.log(`  FAIL  ${word.padEnd(20)} ${reason}`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "lookup error";
      failed.push({ word, reason });
      console.log(`  ERR   ${word.padEnd(20)} ${reason}`);
    }
    await sleep(SLEEP_MS);
  }

  console.log(`\n${passed.length} passed, ${failed.length} failed.`);
  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.map((f) => f.word).join(", ")}`);
  }
  if (passed.length > 0 && args.length > 0) {
    console.log("\nReady to paste into lib/seeds.ts:");
    console.log(passed.map((w) => `  "${w}",`).join("\n"));
  }
  // Only fail the process when auditing the shipped list.
  if (args.length === 0 && failed.length > 0) process.exitCode = 1;
}

main();
