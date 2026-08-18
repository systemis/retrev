/**
 * RFC-4122 v4-shaped id. Used only for local filenames and SQLite primary keys,
 * so `Math.random` uniqueness is sufficient and we avoid a native crypto module.
 */
export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
