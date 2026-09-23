/**
 * Simulate buildSelectedConfig home order + category merge for template-realestate-5.
 */
import fs from "fs";

const doc = JSON.parse(
  fs.readFileSync(
    "C:/css-ai-builder-monorepo/apps/frontend/app/editor/layout/src/data/categoryContent.json",
    "utf8",
  ),
);
const t = doc.templates.find((x) => x.id === "template-realestate-5");
const secs = doc.categories.Realestate.sections;
const VARIANT_KEY_RE = /^[A-Za-z][A-Za-z0-9]*-\d+$/;

function resolve(pack, variant) {
  if (!pack || typeof pack !== "object") return {};
  const keys = Object.keys(pack);
  const isKeyed = keys.some((k) => VARIANT_KEY_RE.test(k));
  if (!isKeyed) return { ...pack };
  const shared = Object.fromEntries(
    Object.entries(pack).filter(([k]) => !VARIANT_KEY_RE.test(k)),
  );
  const specific =
    pack[variant] && typeof pack[variant] === "object" ? pack[variant] : {};
  return { ...shared, ...specific };
}

const order = t.homeSectionOrder.filter((type) => t.sectionVariants[type]);
console.log("HOME ORDER:");
for (const type of order) {
  const variant = t.sectionVariants[type];
  const data = resolve(secs[type], variant);
  const keys = Object.keys(data);
  const nonempty = keys.filter((k) => {
    const v = data[k];
    return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
  });
  console.log(
    `${type.padEnd(24)} ${variant.padEnd(28)} contentKeys=${nonempty.length}`,
  );
}
