/**
 * Format an epoch-ms timestamp as a film date stamp, e.g. `'26 08 18`
 * (dev-plan §4.2 — the mono label on each stamp).
 */
export function stampDate(epochMs: number): string {
  const d = new Date(epochMs);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `'${yy} ${mm} ${dd}`;
}
