import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { USER_AGENT, REQUEST_TIMEOUT_MS, MIN_DELAY_MS } from "./config.js";

export const CACHE_DIR = path.resolve("cache");

// Wait a moment before the single retry.
const RETRY_DELAY_MS = 2000;

// Counters for the run report.
export const stats = { pagesFetched: 0, cacheHits: 0, retries: 0 };

// Thrown for any fetch that did not end in a 200 page.
// retryable is true only for timeouts/network errors and 5xx server errors.
export class FetchError extends Error {
  constructor(message, { url, status = null, retryable = false } = {}) {
    super(message);
    this.name = "FetchError";
    this.url = url;
    this.status = status;
    this.retryable = retryable;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Politeness: remember when we last hit the real site and wait if we are too early.
// Cached reads never touch this, because they never leave the computer.
let lastRequestAt = 0;

async function waitYourTurn() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await sleep(MIN_DELAY_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

// Returns { html, fetchedAt } from the saved copy, or null if there is none.
async function readCache(cacheFile) {
  const fullPath = path.join(CACHE_DIR, cacheFile);
  try {
    const [html, info] = await Promise.all([readFile(fullPath, "utf8"), stat(fullPath)]);
    return { html, fetchedAt: info.mtime };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeCache(cacheFile, html) {
  const fullPath = path.join(CACHE_DIR, cacheFile);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, html, "utf8");
}

// One real attempt: identifying user-agent, timeout, status check.
async function attemptFetch(url) {
  await waitYourTurn();

  let response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // Timeout or network problem: worth one more try.
    throw new FetchError(`Request failed: ${error.message}`, { url, retryable: true });
  }

  // Only 200 means "here is your page". Anything else is a failed fetch, not HTML to parse.
  if (response.status !== 200) {
    throw new FetchError(`Unexpected HTTP status ${response.status}`, {
      url,
      status: response.status,
      // 5xx: the server had a problem, try once more.
      // 404 (does not exist) and 403 (the site said no) are never retried.
      retryable: response.status >= 500,
    });
  }

  return await response.text();
}

// Retry exactly once, and only when retrying makes sense.
async function fetchFromSite(url) {
  try {
    return await attemptFetch(url);
  } catch (error) {
    if (error instanceof FetchError && error.retryable) {
      stats.retries += 1;
      await sleep(RETRY_DELAY_MS);
      return await attemptFetch(url);
    }
    throw error;
  }
}

// Main entry point: read the saved copy if we have one, otherwise fetch and save it.
export async function fetchWithCache(url, cacheFile) {
  const cached = await readCache(cacheFile);
  if (cached !== null) {
    stats.cacheHits += 1;
    return {
      html: cached.html,
      source: "CACHE HIT",
      bytes: Buffer.byteLength(cached.html, "utf8"),
      fetchedAt: cached.fetchedAt,
    };
  }

  const html = await fetchFromSite(url);
  await writeCache(cacheFile, html);
  stats.pagesFetched += 1;
  return {
    html,
    source: "FETCH",
    bytes: Buffer.byteLength(html, "utf8"),
    fetchedAt: new Date(),
  };
}