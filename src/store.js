import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const OUTPUT_DIR = path.resolve("output");

// Pretty JSON with a trailing newline, so reruns produce byte-identical files.
export async function writeJson(fileName, data) {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const fullPath = path.join(OUTPUT_DIR, fileName);
  await writeFile(fullPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  return fullPath;
}

// product_url is the identity of a record: the same book twice counts once.
// Sorted by URL so the output order never changes between runs.
export function dedupeByUrl(records) {
  const byUrl = new Map();
  for (const record of records) {
    if (!byUrl.has(record.product_url)) {
      byUrl.set(record.product_url, record);
    }
  }
  return [...byUrl.values()].sort((a, b) => a.product_url.localeCompare(b.product_url));
}