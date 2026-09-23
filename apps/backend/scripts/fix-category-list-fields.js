/**
 * Fix bad list fields (" ") left by older home-template seed in CategoryContent.
 * Run: node scripts/fix-category-list-fields.js  (from apps/backend)
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const LIST_KEYS = [
  "formFields",
  "productItems",
  "galleryItems",
  "faqItems",
  "whyChooseUsItems",
  "testimonialItems",
  "bannerSlides",
  "menu",
  "buttons",
];

const DEFAULT_FORM = [
  { label: "Full Name", type: "text", placeholder: "Your name" },
  { label: "Email", type: "email", placeholder: "you@example.com" },
  { label: "Message", type: "textarea", placeholder: "How can we help?" },
];

function fixSection(sec) {
  if (!sec || typeof sec !== "object" || Array.isArray(sec)) return sec;
  const out = { ...sec };
  for (const key of LIST_KEYS) {
    if (!(key in out)) continue;
    if (!Array.isArray(out[key])) {
      out[key] = key === "formFields" ? DEFAULT_FORM : [];
    }
  }
  return out;
}

async function main() {
  const rows = await p.categoryContent.findMany();
  let changed = 0;
  for (const row of rows) {
    const sections = row.sections;
    if (!sections || typeof sections !== "object") continue;
    let dirty = false;
    const next = {};
    for (const [type, pack] of Object.entries(sections)) {
      const fixed = fixSection(pack);
      next[type] = fixed;
      if (JSON.stringify(fixed) !== JSON.stringify(pack)) dirty = true;
    }
    if (!dirty) continue;
    await p.categoryContent.update({
      where: { id: row.id },
      data: { sections: next },
    });
    changed += 1;
    console.log("fixed", row.categorySlug);
  }
  console.log("done,", changed, "categories updated");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
