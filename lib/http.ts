import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 8000;

function isCorpTlsFailure(error: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = error;
  for (let i = 0; i < 5 && current; i += 1) {
    if (current instanceof Error) {
      parts.push(current.message, current.name);
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  const blob = parts.join(" ");
  return /UNABLE_TO_GET_ISSUER_CERT|CERT_HAS_EXPIRED|self[- ]signed|certificate|fetch failed/i.test(blob);
}

/**
 * Escape hatch for TLS-inspecting corporate networks, where Node's fetch can't
 * verify the intercepted certificate but curl (using the system trust store)
 * can. `execFile` takes an argv array so there's no shell involved, and `--`
 * stops curl from ever reading the URL as a flag.
 */
async function curlJson<T>(url: string): Promise<T> {
  const { stdout } = await execFileAsync(
    "curl",
    [
      "-sS",
      "--max-time",
      "15",
      "-H",
      "Accept: application/json",
      "-H",
      "User-Agent: TitleFight/1.0",
      "--",
      url,
    ],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  return JSON.parse(stdout) as T;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "TitleFight/1.0" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    if (isCorpTlsFailure(error)) {
      try {
        return await curlJson<T>(url);
      } catch {
        // curl may not exist (e.g. a serverless runtime) — surface the real cause.
        throw error;
      }
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
