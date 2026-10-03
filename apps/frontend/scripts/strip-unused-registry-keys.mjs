import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../app/editor/layout/src/lib/sectionRegistry.ts",
);
const keep = new Set([
  "CustomSection-1",
  "PropertyPage-1",
  "PortfolioPage-1",
  "CustomPage-1",
  "GalleryPage-6",
]);
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const out = lines.filter((line) => {
  const m = line.match(/"([^"]+-(?:1|3|6))"\s*:/);
  if (!m) return true;
  return keep.has(m[1]);
});
fs.writeFileSync(p, `${out.join("\n")}\n`);
console.log(`sectionRegistry lines ${lines.length} -> ${out.length}`);
