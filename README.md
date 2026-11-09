# The polite scraper

A small, polite scraping pipeline for the FlyRank Internship, Backend Track, Week 5 (Assignment A9).
It downloads the first three catalogue pages of Books to Scrape, visits all 60 book pages, turns messy
HTML into clean, schema-checked JSON, survives a broken page, and ends every run with a report.

Pipeline: classify -> fetch (cached) -> extract -> normalize -> validate -> store -> report.

## Target classification

- **Site:** Books to Scrape, `https://books.toscrape.com/`
- **Why this site:** it is part of toscrape.com, a set of sandboxes that describe themselves as sites built so people can practise web scraping. That statement on their own page is the permission, and a sandbox like this is the only kind of target this project touches.
- **How much:** the first 3 catalogue pages only, which link to 60 book pages. No other pages.
- **What data I collect:** for each book, the title, product URL, price text, availability text, rating text and description, plus where and when I fetched it. Nothing personal, nothing behind a login.
- **Why this is appropriate:** the site exists for scraping practice, the scope is tiny, and the scraper identifies itself, waits between requests and caches pages.

## robots.txt check

I requested `https://books.toscrape.com/robots.txt` once (`npm run robots`).
Result: HTTP 404, so no robots file found. A missing file is not permission, it is just a missing file. My permission comes from the sandbox statement above.

## Lane and install

JavaScript lane: Node.js 20+, built-in `fetch`, [Cheerio](https://cheerio.js.org/) for HTML parsing, [Zod](https://zod.dev/) for schema validation.

```bash
git clone <this repository>
cd <repository>/scraper
npm install
```

## Run

One command processes exactly the first 3 catalogue pages and discovers 60 unique book URLs:

```bash
npm start
```

The first run makes about 63 real requests with a delay between each (roughly 40 seconds). Later runs read from the local cache.

Other commands:

```bash
npm run check          # verifies output/books.json: 60 records, unique URLs, numeric prices, https URLs
npm run start:broken   # adds one made-up URL to prove a bad page cannot kill the run
npm run robots         # requests robots.txt once and reports the result
npm run embed-report   # pastes output/run-report.json into this README
```

## Output

| File                     | Contents                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| `output/books.json`      | the 60 valid, unique, validated records                                   |
| `output/errors.json`     | records that failed validation, with the reasons (empty when all is well) |
| `output/run-report.json` | an honest summary of the run                                              |
| `cache/`                 | saved HTML pages (git-ignored)                                            |

## Record schema

Raw text and clean values are kept side by side. `product_url` is the identity of a record.

| Field               | Type                         | Notes                                            |
| ------------------- | ---------------------------- | ------------------------------------------------ |
| `title`             | string, required             |                                                  |
| `product_url`       | absolute https URL, required | canonical identity; duplicates count once        |
| `price_text`        | string, required             | raw, e.g. `"£51.77"`                             |
| `price_gbp`         | number, required             | clean value, e.g. `51.77`                        |
| `availability_text` | string, required             | raw, e.g. `"In stock (22 available)"`            |
| `stock_count`       | integer or null              | parsed from the availability text                |
| `rating_text`       | string, required             | raw, e.g. `"Three"`                              |
| `rating`            | integer 1 to 5, required     | parsed from the rating text                      |
| `description`       | string or null               | `null` when the page has none; never invented    |
| `source_page`       | absolute https URL, required | provenance: catalogue page the book was found on |
| `fetched_at`        | ISO datetime, required       | provenance: when the page was downloaded         |

Records that fail the schema go to `errors.json` with the reason and never reach `books.json`.
Reruns write the same 60 records (idempotent): records are de-duplicated by `product_url` and sorted.

## Politeness rules

- **User-agent:** every real request sends `FlyRankInternshipA9/1.0 (+link to this repo)`, so a site owner can find out who I am.
- **Delay:** at least 600 ms between real requests (the assignment minimum is 500 ms). Cached reads need no delay.
- **Timeout:** every request gives up after 10 seconds.
- **Status check:** only HTTP 200 counts as a page. Anything else is a failed fetch.
- **Cache:** every downloaded page is saved to `cache/` and reused, so development does not ask the site twice.
- **Retries:** one retry after a timeout or a 5xx error. Never for 404 (it does not exist) or 403 (the site said no).
- **Scope:** 3 catalogue pages and the 60 books they link to. Nothing else.

## Sample run report

A real `output/run-report.json` from this project:

<!-- RUN_REPORT_START -->
```json
{
  "started_at": "2026-11-09T14:30:42Z",
  "finished_at": "2026-11-09T14:30:43Z",
  "duration_ms": 457,
  "catalogue_pages": 3,
  "discovered_urls": 60,
  "unique_urls": 60,
  "pages_fetched": 0,
  "cache_hits": 63,
  "retries": 0,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failures": []
}
```
<!-- RUN_REPORT_END -->

## Why this needed no browser

The data is already in the HTML the server sends, so a browser would only add cost.

## One honest limitation

The CSS selectors are written for this site's current HTML. If Books to Scrape changes its layout, fields will come back missing, validation will fail, and records will land in `errors.json` instead of `books.json`. The scraper also fetches one page at a time with a single simple retry, so it is deliberately slow and not built for large sites.

## Ethics note

I use an official API when one exists instead of scraping. I never bypass logins, paywalls or blocks: if a site says no, I stop. I only collect the data I actually need, I go slowly, and I say who I am.

## Rule for the future

I will not reuse this code on another site without checking its rules and terms first.
