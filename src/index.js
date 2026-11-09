import { discoverBookUrls } from "./discover.js";
import { FetchError } from "./fetcher.js";

async function main() {
  try {
    const { cataloguePages, discovered, books } = await discoverBookUrls();
    console.log(
      `catalogue_pages=${cataloguePages} discovered=${discovered} unique_urls=${books.length}`
    );
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