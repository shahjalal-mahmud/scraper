import { discoverBookUrls } from "./discover.js";
import { scrapeBook } from "./scrape-details.js";
import { FetchError } from "./fetcher.js";

async function main() {
  try {
    const { cataloguePages, discovered, books } = await discoverBookUrls();
    console.log(
      `catalogue_pages=${cataloguePages} discovered=${discovered} unique_urls=${books.length}`
    );

    const rawRecords = [];
    for (const [index, book] of books.entries()) {
      const { raw, source } = await scrapeBook(book);
      rawRecords.push(raw);
      console.log(`[${index + 1}/${books.length}] ${source} ${raw.title}`);
    }

    console.log("--- first raw record ---");
    console.log(JSON.stringify(rawRecords[0], null, 2));
    console.log(`detail_pages=${rawRecords.length}`);
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