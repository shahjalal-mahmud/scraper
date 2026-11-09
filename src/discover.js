import { fetchWithCache } from "./fetcher.js";
import { extractBookLinks, findNextPageUrl } from "./parser.js";

export const CATALOGUE_START_URL = "https://books.toscrape.com/catalogue/page-1.html";
export const MAX_CATALOGUE_PAGES = 3;

// Walks the catalogue by following the site's own "next" link, stops after 3 pages,
// and returns every book URL exactly once (with the catalogue page it was found on).
export async function discoverBookUrls() {
  const allLinks = [];
  let cataloguePages = 0;
  let pageUrl = CATALOGUE_START_URL;

  while (pageUrl && cataloguePages < MAX_CATALOGUE_PAGES) {
    cataloguePages += 1;
    const cacheFile = `catalogue-page-${cataloguePages}.html`;

    const { html, source, bytes } = await fetchWithCache(pageUrl, cacheFile);
    const links = extractBookLinks(html, pageUrl);
    console.log(`${source} ${cacheFile} ${bytes} bytes, ${links.length} book links`);

    for (const url of links) {
      allLinks.push({ url, sourcePage: pageUrl });
    }

    pageUrl = findNextPageUrl(html, pageUrl);
  }

  // Remove duplicate links; the first catalogue page that mentioned a book wins.
  const unique = new Map();
  for (const link of allLinks) {
    if (!unique.has(link.url)) {
      unique.set(link.url, link);
    }
  }

  return {
    cataloguePages,
    discovered: allLinks.length,
    books: [...unique.values()],
  };
}