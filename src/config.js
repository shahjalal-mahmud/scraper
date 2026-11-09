// Central place for every politeness setting, so the rules are easy to find and audit.

export const BASE_URL = "https://books.toscrape.com/";
export const ROBOTS_URL = "https://books.toscrape.com/robots.txt";

// EDIT THIS ONE LINE: put your real GitHub repo URL after the "+".
// It is how a site owner who sees us in their logs can find out who we are.
export const REPO_URL = "https://github.com/appriyo/flyrank-internship";
export const USER_AGENT = `FlyRankInternshipA9/1.0 (+${REPO_URL})`;

// Politeness rules
export const REQUEST_TIMEOUT_MS = 10_000; // give up after 10 seconds
export const MIN_DELAY_MS = 600; // at least 500 ms between real requests (we use 600)