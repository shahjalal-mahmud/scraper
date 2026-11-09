# The polite scraper

A small scraping pipeline for the FlyRank Internship, Backend Track, Week 5 (Assignment A9).
It will fetch -> extract -> normalize -> validate -> store -> report.

## Target classification

- **Site:** Books to Scrape, `https://books.toscrape.com/`
- **Why this site:** it is part of toscrape.com, a set of sandboxes that describe themselves as sites built so people can practise web scraping. That statement on their own page is the permission, and a sandbox like this is the only kind of target this project touches.
- **How much:** the first 3 catalogue pages only, which link to 60 book pages. No other pages.
- **What data I collect:** for each book, the title, product URL, price text, availability text, rating text and description, plus where and when I fetched it. Nothing personal, nothing behind a login.
- **Why this is appropriate:** the site exists for scraping practice, the scope is tiny, and the scraper identifies itself, waits between requests and caches pages.

## robots.txt check

I requested `https://books.toscrape.com/robots.txt` once (`npm run robots`).
Result: HTTP 404, so no robots file found. A missing file is not permission, it is just a missing file. My permission comes from the sandbox statement above.

## Rule for the future

I will not reuse this code on another site without checking its rules and terms first.