import fs from "fs";

const path =
  "C:/css-ai-builder-monorepo/apps/frontend/app/editor/layout/src/data/categoryContent.json";
const j = JSON.parse(fs.readFileSync(path, "utf8"));
const s = JSON.stringify(j.categories.Realestate.sections);
const hosts = new Set();
for (const m of s.matchAll(/https?:\/\/([^/"']+)/g)) hosts.add(m[1]);
console.log([...hosts].sort().join("\n"));
