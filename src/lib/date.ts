export type DateFormat = "dotted" | "slash";

/**
 * Format an epoch-ms timestamp as a film date stamp.
 * `dotted` → `'26 08 18` · `slash` → `26/08/18` (dev-plan §4.2).
 */
export function stampDate(epochMs: number, format: DateFormat = "dotted"): string {
  const d = new Date(epochMs);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return format === "slash" ? `${yy}/${mm}/${dd}` : `'${yy} ${mm} ${dd}`;
}
