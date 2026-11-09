const RATING_WORDS = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 };

// "£51.77" -> 51.77. Returns null if there is no number in the text.
export function parsePrice(text) {
  if (typeof text !== "string") return null;
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

// "Three" -> 3. Returns null for anything unknown.
export function parseRating(text) {
  return RATING_WORDS[text] ?? null;
}

// "In stock (22 available)" -> 22, "Out of stock" -> 0, anything else -> null.
export function parseStockCount(text) {
  if (typeof text !== "string") return null;
  const match = text.match(/\((\d+)\s+available\)/i);
  if (match) return Number(match[1]);
  if (/out of stock/i.test(text)) return 0;
  return null;
}

// Raw value and clean value live side by side. The raw record is not modified.
export function normalizeRecord(raw) {
  return {
    title: raw.title,
    product_url: raw.product_url,
    price_text: raw.price_text,
    price_gbp: parsePrice(raw.price_text),
    availability_text: raw.availability_text,
    stock_count: parseStockCount(raw.availability_text),
    rating_text: raw.rating_text,
    rating: parseRating(raw.rating_text),
    description: raw.description,
    source_page: raw.source_page,
    fetched_at: raw.fetched_at,
  };
}