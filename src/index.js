import { discoverBookUrls } from "./discover.js";
import { scrapeBook } from "./scrape-details.js";
import { validateRecord } from "./schema.js";
import { dedupeByUrl, writeJson } from "./store.js";
import { FetchError } from "./fetcher.js";

async function main() {
  try {
    const { cataloguePages, discovered, books } = await discoverBookUrls();
    console.log(
      `catalogue_pages=${cataloguePages} discovered=${discovered} unique_urls=${books.length}`
    );

    const valid = [];
    const invalid = [];

    for (const [index, book] of books.entries()) {
      const { raw, source } = await scrapeBook(book);
      console.log(`[${index + 1}/${books.length}] ${source} ${raw.title}`);

      const result = validateRecord(raw);
      if (result.ok) {
        valid.push(result.record);
      } else {
        // A failing record never reaches books.json; it goes to errors.json with the reasons.
        invalid.push({
          product_url: raw.product_url,
          reasons: result.reasons,
          record: result.record,
        });
      }
    }

    const unique = dedupeByUrl(valid);
    await writeJson("books.json", unique);
    await writeJson("errors.json", invalid);

    console.log(`valid_records=${unique.length} invalid_records=${invalid.length}`);
    console.log("wrote output/books.json and output/errors.json");
  } catch (error) {
    if (error instanceof FetchError) {
      console.error(`FETCH FAILED ${error.url}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

main();