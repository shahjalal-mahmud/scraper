import { z } from "zod";
import { normalizeRecord } from "./normalize.js";

const httpsUrl = z.string().url().startsWith("https://");

// The shape of a finished record. Description is optional (null when the page has none).
export const BookSchema = z
  .object({
    title: z.string().min(1),
    product_url: httpsUrl,
    price_text: z.string().min(1),
    price_gbp: z.number().nonnegative(),
    availability_text: z.string().min(1),
    stock_count: z.number().int().nonnegative().nullable(),
    rating_text: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    description: z.string().min(1).nullable(),
    source_page: httpsUrl,
    fetched_at: z.string().datetime(),
  })
  .strict();

// Normalize one raw record, then check it against the schema.
// Returns { ok: true, record } or { ok: false, reasons, record }.
export function validateRecord(raw) {
  const candidate = normalizeRecord(raw);
  const result = BookSchema.safeParse(candidate);

  if (result.success) {
    return { ok: true, record: result.data };
  }

  const reasons = result.error.issues.map(
    (issue) => `${issue.path.join(".") || "(record)"}: ${issue.message}`
  );
  return { ok: false, reasons, record: candidate };
}