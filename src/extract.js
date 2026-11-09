import * as cheerio from "cheerio";
import { toIso } from "./time.js";

// Collapse runs of whitespace/newlines into single spaces.
const squash = (text) => text.replace(/\s+/g, " ").trim();

// Text of the first match, or null if the element is missing or empty. Never invent text.
function textOrNull(selection) {
  if (selection.length === 0) return null;
  const text = squash(selection.first().text());
  return text === "" ? null : text;
}

// Builds the raw record: strings exactly as found on the page, plus provenance.
export function extractRawRecord(html, { productUrl, sourcePage, fetchedAt }) {
  const $ = cheerio.load(html);

  // Aim at the product area only, not the whole document.
  const product = $("article.product_page");
  const main = product.find(".product_main");

  // The rating is a CSS class: <p class="star-rating Three">
  const ratingClasses = (main.find("p.star-rating").first().attr("class") ?? "").split(/\s+/);
  const ratingText = ratingClasses.find((name) => name && name !== "star-rating") ?? null;

  return {
    title: textOrNull(main.find("h1")),
    product_url: productUrl,
    price_text: textOrNull(main.find(".price_color")),
    availability_text: textOrNull(main.find(".availability")),
    rating_text: ratingText,
    // The description is the paragraph right after the "Product Description" heading.
    description: textOrNull(product.find("#product_description + p")),
    source_page: sourcePage,
    fetched_at: toIso(fetchedAt),
  };
}