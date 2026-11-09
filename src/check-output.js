import { readFile } from "node:fs/promises";

const books = JSON.parse(await readFile("output/books.json", "utf8"));

const uniqueUrls = new Set(books.map((book) => book.product_url));
const pricesAreNumbers = books.every(
  (book) => typeof book.price_gbp === "number" && Number.isFinite(book.price_gbp)
);
const urlsAreHttps = books.every((book) => book.product_url.startsWith("https://"));

console.log(
  `records=${books.length} unique_urls=${uniqueUrls.size} ` +
    `prices_are_numbers=${pricesAreNumbers} urls_are_https=${urlsAreHttps}`
);

const passed =
  books.length === 60 && uniqueUrls.size === 60 && pricesAreNumbers && urlsAreHttps;
console.log(passed ? "CHECK PASSED" : "CHECK FAILED");
process.exitCode = passed ? 0 : 1;