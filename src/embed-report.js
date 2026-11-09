import { readFile, writeFile } from "node:fs/promises";

const START = "<!-- RUN_REPORT_START -->";
const END = "<!-- RUN_REPORT_END -->";

const report = await readFile("output/run-report.json", "utf8");
const readme = await readFile("README.md", "utf8");

const startIndex = readme.indexOf(START);
const endIndex = readme.indexOf(END);
if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  console.error("README.md is missing the RUN_REPORT_START / RUN_REPORT_END markers.");
  process.exit(1);
}

const block = `${START}\n\`\`\`json\n${report.trim()}\n\`\`\`\n${END}`;
const updated = readme.slice(0, startIndex) + block + readme.slice(endIndex + END.length);

await writeFile("README.md", updated, "utf8");
console.log("Embedded output/run-report.json into README.md");