const USERS = [
  { id: "u1", name: "Petr Augustin", email: "petr.augustin@2fresh.cz", color: "#6366f1" },
  { id: "u2", name: "Lena Novak", email: "lena.novak@2fresh.cz", color: "#ec4899" },
  { id: "u3", name: "Marek Dvorak", email: "marek.dvorak@2fresh.cz", color: "#10b981" },
  { id: "u4", name: "Sofia Kral", email: "sofia.kral@2fresh.cz", color: "#f59e0b" },
];

const CONTENT_TYPES = [
  { id: "ct1", name: "Page — Landing", icon: "file-text", color: "#3b82f6" },
  { id: "ct2", name: "Page — Product", icon: "file-text", color: "#3b82f6" },
  { id: "ct3", name: "Component — SEO", icon: "gem", color: "#8b5cf6" },
  { id: "ct4", name: "Component — Hero", icon: "gem", color: "#8b5cf6" },
  { id: "ct5", name: "Article", icon: "newspaper", color: "#0ea5e9" },
];

const STATUSES = ["Published", "Draft", "Changed", "Archived"];
const LOCALES = ["en", "cs", "de"];

const WORKFLOW_COLORS = [
  "#9ca3af", // gray
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#10b981", // emerald
  "#14b8a6", // teal
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

const WORKFLOW_STEPS = [
  { id: "wf1", name: "Draft", color: WORKFLOW_COLORS[0] },
  { id: "wf2", name: "Copywriting", color: WORKFLOW_COLORS[3] },
  { id: "wf3", name: "Media", color: WORKFLOW_COLORS[6] },
  { id: "wf4", name: "Review 1", color: WORKFLOW_COLORS[8] },
  { id: "wf5", name: "Review 2", color: WORKFLOW_COLORS[9] },
  { id: "wf6", name: "Ready", color: WORKFLOW_COLORS[7] },
  { id: "wf7", name: "Published", color: WORKFLOW_COLORS[4] },
];

export function normalizeWorkflowSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return WORKFLOW_STEPS;
  return steps.map((s, i) =>
    typeof s === "string"
      ? { id: `step-${i}`, name: s, color: WORKFLOW_COLORS[i % WORKFLOW_COLORS.length] }
      : { id: s.id ?? `step-${i}`, name: s.name, color: s.color ?? WORKFLOW_COLORS[i % WORKFLOW_COLORS.length] }
  );
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function daysAgo(n) {
  const day = String(Math.max(1, 12 - n)).padStart(2, "0");
  const hour = String(9 + (n % 8)).padStart(2, "0");
  const minute = String((n * 7) % 60).padStart(2, "0");
  return `2026-08-${day}T${hour}:${minute}:00`;
}

const ENTRY_NAMES = [
  "Homepage", "About us", "Contact", "Pricing", "SEO, homepage", "SEO, about page",
  "Hero, homepage", "Hero, pricing", "Wireless headphones", "SEO, wireless headphones",
  "Running shoes — trail", "SEO, running shoes", "Canvas backpack", "SEO, canvas backpack",
  "Ceramic mug set", "SEO, ceramic mug set", "How we source materials", "Behind the scenes: warehouse",
  "Sustainability report 2026", "Product care guide", "Winter jacket — men", "SEO, winter jacket",
  "Desk lamp, oak", "SEO, desk lamp", "Hero, product listing", "Loyalty program", "Gift cards",
  "Return policy", "Shipping & delivery", "Store locator", "Careers", "Press kit",
  "SEO, careers", "Hero, careers", "Notebook, dotted", "SEO, notebook", "Water bottle, steel",
  "SEO, water bottle", "New arrivals — autumn", "Customer stories", "Size guide",
];

function pickEntryStatus(i) {
  const last = WORKFLOW_STEPS.length - 1;
  if (i % 17 === 0) return WORKFLOW_STEPS[1]?.name ?? WORKFLOW_STEPS[0].name;
  if (i % 13 === 0) return WORKFLOW_STEPS[2]?.name ?? WORKFLOW_STEPS[0].name;
  if (i % 11 === 0) return WORKFLOW_STEPS[Math.min(3, last)].name;
  if (i % 9 === 0) return WORKFLOW_STEPS[Math.min(4, last)].name;
  if (i % 7 === 0) return WORKFLOW_STEPS[Math.min(5, last)].name;
  if (i % 5 === 0) return WORKFLOW_STEPS[0].name;
  return WORKFLOW_STEPS[last].name;
}

export function seedEntries() {
  return ENTRY_NAMES.map((name, i) => {
    const typeIdx = name.startsWith("SEO") ? 2 : name.startsWith("Hero") ? 3
      : ["How we source", "Behind the scenes", "Sustainability", "Customer stories"].some(p => name.startsWith(p)) ? 4
      : i % 5;
    return {
      id: `e${i + 1}`,
      title: name,
      contentTypeId: CONTENT_TYPES[typeIdx % CONTENT_TYPES.length].id,
      status: pickEntryStatus(i),
      locale: pick(LOCALES, i),
      updatedAt: daysAgo(i % 10),
      updatedBy: pick(USERS, i).id,
    };
  });
}

const CATALOGUE_CATEGORIES = [
  { id: "cat1", name: "Featured", count: 12 },
  { id: "cat2", name: "Locations", count: 34 },
  { id: "cat3", name: "Events", count: 58 },
  { id: "cat4", name: "Products", count: 91 },
  { id: "cat5", name: "Guides", count: 17 },
];

const EVENT_NAMES = [
  "Summer music festival", "Night food market", "Rooftop cinema series", "Craft beer weekend",
  "Farmers market — Saturday", "Live jazz sessions", "Vintage flea market", "Charity fun run",
  "Art walk — downtown", "Kids workshop: pottery", "Street food carnival", "Open-air theatre",
  "Photography exhibition", "New Year fireworks", "Wine tasting evening", "Bike tour — old town",
];

export function seedCatalogueCategories() {
  return CATALOGUE_CATEGORIES;
}

export function seedCatalogueItems() {
  const items = [];
  let idx = 0;
  for (const cat of CATALOGUE_CATEGORIES) {
    const count = cat.count;
    for (let i = 0; i < count; i++) {
      const name = cat.id === "cat3"
        ? i < EVENT_NAMES.length ? EVENT_NAMES[i] : `${EVENT_NAMES[i % EVENT_NAMES.length]} (${Math.floor(i / EVENT_NAMES.length) + 1})`
        : `${cat.name} item ${i + 1}`;
      items.push({
        id: `ci${idx + 1}`,
        categoryId: cat.id,
        name,
        status: pick(STATUSES, idx % 8 === 0 ? 1 : 0),
        url: `/en/${cat.name.toLowerCase()}/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}/`,
        locale: pick(LOCALES, idx),
        updatedAt: daysAgo(idx % 10),
        lastReviewedAt: idx % 3 === 0 ? "" : daysAgo((idx % 10) + 1),
        authorId: pick(USERS, idx).id,
      });
      idx++;
    }
  }
  return items;
}

const MEDIA_NAMES = [
  "hero-banner-autumn.jpg", "product-headphones-front.png", "product-headphones-side.png",
  "warehouse-team.jpg", "backpack-lifestyle.jpg", "mug-set-flatlay.jpg", "jacket-model-01.jpg",
  "jacket-model-02.jpg", "desk-lamp-oak.png", "notebook-cover.jpg", "bottle-steel-blue.png",
  "store-front-prague.jpg", "careers-team-photo.jpg", "press-kit-logo.svg", "size-guide-chart.png",
  "sustainability-cover.jpg",
];

export function seedMedia() {
  return MEDIA_NAMES.map((name, i) => ({
    id: `m${i + 1}`,
    name,
    kind: name.endsWith(".svg") ? "vector" : name.endsWith(".png") ? "image/png" : "image/jpeg",
    sizeKb: 80 + ((i * 37) % 900),
    updatedAt: daysAgo(i % 10),
    uploadedBy: pick(USERS, i + 2).id,
    color: pick(["#fca5a5", "#93c5fd", "#a7f3d0", "#fcd34d", "#c4b5fd", "#fda4af"], i),
  }));
}

const CONTENT_TYPE_DEFS = CONTENT_TYPES.map((ct, i) => ({
  ...ct,
  fields: i < 2
    ? [{ name: "title", type: "Text" }, { name: "slug", type: "Text" }, { name: "body", type: "Rich text" }, { name: "seo", type: "Reference" }]
    : i === 2
      ? [{ name: "metaTitle", type: "Text" }, { name: "metaDescription", type: "Text" }, { name: "ogImage", type: "Media" }]
      : i === 3
        ? [{ name: "headline", type: "Text" }, { name: "image", type: "Media" }, { name: "cta", type: "Text" }]
        : [{ name: "title", type: "Text" }, { name: "author", type: "Text" }, { name: "body", type: "Rich text" }],
  entryCount: 0,
}));

export function seedContentTypes() {
  const entries = seedEntries();
  return CONTENT_TYPE_DEFS.map(ct => ({
    ...ct,
    entryCount: entries.filter(e => e.contentTypeId === ct.id).length,
  }));
}

export function seedUsers() {
  return USERS;
}

export function getUser(id) {
  return USERS.find(u => u.id === id) || USERS[0];
}

export const STATUS_LIST = STATUSES;
export const LOCALE_LIST = LOCALES;
export const FIELD_TYPE_LIST = ["Text", "Rich text", "Number", "Media", "Reference", "Boolean"];
export const DEFAULT_WORKFLOW_STEPS = WORKFLOW_STEPS;
export const WORKFLOW_COLOR_PALETTE = WORKFLOW_COLORS;
