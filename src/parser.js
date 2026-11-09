import * as cheerio from "cheerio";

// Every book link on one catalogue page, turned into an absolute URL.
// new URL(href, pageUrl) resolves relative links safely; no string gluing.
export function extractBookLinks(html, pageUrl) {
  const $ = cheerio.load(html);
  const links = [];

  $("article.product_pod h3 a").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      links.push(new URL(href, pageUrl).href);
    }
  });

  return links;
}

// The catalogue's own "next" link, as an absolute URL, or null on the last page.
export function findNextPageUrl(html, pageUrl) {
  const $ = cheerio.load(html);
  const href = $("li.next a").first().attr("href");
  return href ? new URL(href, pageUrl).href : null;
}