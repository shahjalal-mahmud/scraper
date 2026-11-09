import { fetchWithCache, FetchError } from "./fetcher.js";

const CATALOGUE_PAGE_1 = "https://books.toscrape.com/catalogue/page-1.html";
const CACHE_FILE = "catalogue-page-1.html";

async function main() {
  try {
    const { source, bytes } = await fetchWithCache(CATALOGUE_PAGE_1, CACHE_FILE);
    // Print only a short summary, never the whole HTML.
    console.log(`${source} ${CACHE_FILE} ${bytes} bytes`);
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