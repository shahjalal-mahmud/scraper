import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { USER_AGENT, REQUEST_TIMEOUT_MS, MIN_DELAY_MS } from "./config.js";

export const CACHE_DIR = path.resolve("cache");

// Thrown for any fetch that did not end in a 200 page.
export class FetchError extends Error {
  constructor(message, { url, status = null } = {}) {
    super(message);
    this.name = "FetchError";
    this.url = url;
    this.status = status;
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

// One real request: identifying user-agent, timeout, status check.
async function fetchFromSite(url) {
  await waitYourTurn();

  let response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new FetchError(`Request failed: ${error.message}`, { url });
  }

  // Only 200 means "here is your page". Anything else is a failed fetch, not HTML to parse.
  if (response.status !== 200) {
    throw new FetchError(`Unexpected HTTP status ${response.status}`, {
      url,
      status: response.status,
    });
  }

  return await response.text();
}

// Main entry point: read the saved copy if we have one, otherwise fetch and save it.
export async function fetchWithCache(url, cacheFile) {
  const cached = await readCache(cacheFile);
  if (cached !== null) {
    return {
      html: cached.html,
      source: "CACHE HIT",
      bytes: Buffer.byteLength(cached.html, "utf8"),
      fetchedAt: cached.fetchedAt,
    };
  }

  const html = await fetchFromSite(url);
  await writeCache(cacheFile, html);
  return {
    html,
    source: "FETCH",
    bytes: Buffer.byteLength(html, "utf8"),
    fetchedAt: new Date(),
  };
}