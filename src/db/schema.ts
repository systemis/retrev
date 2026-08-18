/** SQLite schema — source of truth for photo ordering & filter params (dev-plan §7.2). */
export const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS photos (
  id          TEXT PRIMARY KEY NOT NULL,
  uri         TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  params      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at DESC);
`;
