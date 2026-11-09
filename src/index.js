import { discoverBookUrls, CATALOGUE_START_URL } from "./discover.js";
import { scrapeBook } from "./scrape-details.js";
import { validateRecord } from "./schema.js";
import { dedupeByUrl, writeJson } from "./store.js";
import { stats } from "./fetcher.js";
import { toIso } from "./time.js";

// For proving that a bad page cannot kill the run: node src/index.js --with-broken-url
// This adds ONE made-up URL to our own list. It costs the real site a single 404 request.
const BROKEN_URL = "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html";

function describeFailure(url, error) {
  return {
    url,
    status: error.status ?? null,
    message: error.message,
  };
}

async function main() {
  const startedAt = new Date();
  const startedClock = performance.now();

  const failures = [];
  const valid = [];
  const invalid = [];
  let discovery = { cataloguePages: 0, discovered: 0, books: [] };

  // Discovery problems are reported too, instead of crashing before the report is written.
  try {
    discovery = await discoverBookUrls();
  } catch (error) {
    console.error(`DISCOVERY FAILED ${error.url ?? ""} ${error.message}`);
    failures.push(describeFailure(error.url ?? "catalogue", error));
  }

  console.log(
    `catalogue_pages=${discovery.cataloguePages} discovered=${discovery.discovered} ` +
      `unique_urls=${discovery.books.length}`
  );

  const books = [...discovery.books];
  if (process.argv.includes("--with-broken-url")) {
    books.push({ url: BROKEN_URL, sourcePage: CATALOGUE_START_URL });
  }

  // Each page is handled on its own: one broken page is logged and skipped.
  for (const [index, book] of books.entries()) {
    try {
      const { raw, source } = await scrapeBook(book);
      console.log(`[${index + 1}/${books.length}] ${source} ${raw.title}`);

      const result = validateRecord(raw);
      if (result.ok) {
        valid.push(result.record);
      } else {
        invalid.push({
          product_url: raw.product_url,
          reasons: result.reasons,
          record: result.record,
        });
      }
    } catch (error) {
      console.error(`[${index + 1}/${books.length}] FAILED ${book.url}: ${error.message}`);
      failures.push(describeFailure(book.url, error));
    }
  }

  const unique = dedupeByUrl(valid);

  // If we found nothing at all, leave the previous books.json alone instead of emptying it.
  if (books.length > 0) {
    await writeJson("books.json", unique);
    await writeJson("errors.json", invalid);
  }

  const finishedAt = new Date();
  const report = {
    started_at: toIso(startedAt),
    finished_at: toIso(finishedAt),
    duration_ms: Math.round(performance.now() - startedClock),
    catalogue_pages: discovery.cataloguePages,
    discovered_urls: discovery.discovered,
    unique_urls: discovery.books.length,
    pages_fetched: stats.pagesFetched,
    cache_hits: stats.cacheHits,
    retries: stats.retries,
    valid_records: unique.length,
    invalid_records: invalid.length,
    failed_pages: failures.length,
    failures,
  };
  await writeJson("run-report.json", report);

  console.log(
    `valid_records=${report.valid_records} invalid_records=${report.invalid_records} ` +
      `failed_pages=${report.failed_pages} pages_fetched=${report.pages_fetched} ` +
      `cache_hits=${report.cache_hits} duration_ms=${report.duration_ms}`
  );
  console.log("wrote output/run-report.json");

  // Only a failed discovery (nothing to work on) is a failed run. One bad book page is not.
  if (books.length === 0) {
    process.exitCode = 1;
  }
}

main();