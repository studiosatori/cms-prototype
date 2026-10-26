import { POI_TYPE, POI_TAXONOMIES, POI_MEDIA, POI_ENTRIES } from "./poi";

// Seed data only reaches localStorage on first load, so people who already
// have a prototype in their browser would never see content added to the seed
// later. Each migration runs once and merges its new items in by id, leaving
// anything already there (including edits and deletions of earlier items) alone.
const MIGRATIONS_KEY = "cms.migrations";

const MIGRATIONS = {
  "poi-content-type": () => {
    mergeById("cms.contentTypes", [POI_TYPE]);
    mergeById("cms.taxonomies", POI_TAXONOMIES);
    mergeById("cms.media", POI_MEDIA);
    mergeById("cms.entries", POI_ENTRIES);
  },
};

function mergeById(key, items) {
  const raw = localStorage.getItem(key);
  if (!raw) return; // not seeded yet: the seed already includes these items
  const stored = JSON.parse(raw);
  if (!Array.isArray(stored)) return;
  const have = new Set(stored.map((x) => x.id));
  const missing = items.filter((x) => !have.has(x.id));
  if (missing.length > 0) localStorage.setItem(key, JSON.stringify([...stored, ...missing]));
}

export function runMigrations() {
  try {
    const done = new Set(JSON.parse(localStorage.getItem(MIGRATIONS_KEY) ?? "[]"));
    for (const [name, run] of Object.entries(MIGRATIONS)) {
      if (done.has(name)) continue;
      run();
      done.add(name);
    }
    localStorage.setItem(MIGRATIONS_KEY, JSON.stringify([...done]));
  } catch {
    /* storage unavailable or corrupt: the app falls back to seed data */
  }
}
