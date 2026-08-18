/**
 * SQLite schema (dev-plan §7.2, extended for customizable stamps).
 * `uri` = rendered composite; `source_uri` = original photo; `design` = JSON StampDesign.
 * `params` is kept nullable for backward compatibility with pre-feature rows.
 */
export const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS photos (
  id          TEXT PRIMARY KEY NOT NULL,
  uri         TEXT NOT NULL,
  source_uri  TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER,
  params      TEXT,
  design      TEXT
);
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at DESC);
`;
