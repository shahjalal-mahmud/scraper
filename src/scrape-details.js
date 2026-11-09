import { fetchWithCache } from "./fetcher.js";
import { extractRawRecord } from "./extract.js";

// .../catalogue/a-light-in-the-attic_1000/index.html  ->  books/a-light-in-the-attic_1000.html
export function cacheFileForBook(url) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const slug = (segments.at(-2) ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `books/${slug}.html`;
}

// Fetch (or read from cache) one book page and return its raw record.
export async function scrapeBook({ url, sourcePage }) {
  const { html, source, fetchedAt } = await fetchWithCache(url, cacheFileForBook(url));
  const raw = extractRawRecord(html, { productUrl: url, sourcePage, fetchedAt });
  return { raw, source };
}