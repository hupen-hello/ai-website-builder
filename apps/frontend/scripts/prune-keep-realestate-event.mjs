/**
 * Keep only Realestate templates 2/4/5 + Evento, and Realestate + Event Services categories.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(
  root,
  "app/editor/layout/src/data/categoryContent.json",
);

const KEEP_TEMPLATE_IDS = new Set([
  "template-realestate-2",
  "template-realestate-4",
  "template-realestate-5",
  "template-evento-1",
]);
const KEEP_CATEGORIES = new Set(["Realestate", "Event Services"]);

const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
raw.templates = (raw.templates || []).filter((t) =>
  KEEP_TEMPLATE_IDS.has(t.id),
);

const nextCategories = {};
for (const [name, pack] of Object.entries(raw.categories || {})) {
  if (!KEEP_CATEGORIES.has(name)) continue;
  const templates = (pack.templates || []).filter((id) =>
    KEEP_TEMPLATE_IDS.has(id),
  );
  nextCategories[name] = { ...pack, templates };
}
raw.categories = nextCategories;

fs.writeFileSync(jsonPath, `${JSON.stringify(raw, null, 2)}\n`);
console.log(
  `Kept templates: ${raw.templates.map((t) => t.id).join(", ")}`,
);
console.log(`Kept categories: ${Object.keys(raw.categories).join(", ")}`);
