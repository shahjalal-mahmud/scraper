import { ROBOTS_URL, USER_AGENT, REQUEST_TIMEOUT_MS } from "./config.js";

// Requests robots.txt exactly once and reports what happened.
async function main() {
  console.log(`Requesting ${ROBOTS_URL} once...`);

  let response;
  try {
    response = await fetch(ROBOTS_URL, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.log(`Request failed: ${error.message}`);
    console.log("Result: could not reach robots.txt (record this in the README).");
    return;
  }

  console.log(`HTTP status: ${response.status}`);

  if (response.status === 200) {
    const text = await response.text();
    console.log("--- robots.txt (first 20 lines) ---");
    console.log(text.split("\n").slice(0, 20).join("\n"));
    console.log("--- end ---");
    console.log("Result: robots file found. Read it and summarise it in the README.");
  } else if (response.status === 404) {
    console.log('Result: "no robots file found" (a missing file is not permission, just a missing file).');
  } else {
    console.log(`Result: unexpected status ${response.status} (record this in the README).`);
  }
}

main();