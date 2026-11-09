// ISO timestamp without milliseconds, e.g. 2026-08-06T10:00:00Z
export function toIso(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}