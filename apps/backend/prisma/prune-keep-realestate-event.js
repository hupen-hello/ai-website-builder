/**
 * Fresh DB: only Realestate + Event Services, and the 4 kept templates.
 * Run from apps/backend: node prisma/prune-keep-realestate-event.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const KEEP_TEMPLATE_KEYS = [
  "template-realestate-2",
  "template-realestate-4",
  "template-realestate-5",
  "template-evento-1",
];
const KEEP_CATEGORY_SLUGS = ["realestate", "event-services"];

const KEEP_LAYOUT_NUMBERS = new Set([2, 4, 5, 7, 8, 9]);
const KEEP_LAYOUT_KEYS = new Set([
  "PropertyPage-1",
  "PortfolioPage-1",
  "GalleryPage-6",
  "CustomPage-1",
  "CustomPage-2",
  "CustomPage-4",
  "CustomPage-5",
  "BlogPage-5",
  "Breadcrumb-5",
]);

function keepLayout(key, sectionNumber) {
  if (KEEP_LAYOUT_KEYS.has(key)) return true;
  if (/-9$/.test(key) || key.includes("-9")) return true;
  if (KEEP_LAYOUT_NUMBERS.has(sectionNumber)) return true;
  return false;
}

async function main() {
  const extraTemplates = await prisma.template.deleteMany({
    where: { key: { notIn: KEEP_TEMPLATE_KEYS } },
  });
  console.log(`Deleted templates: ${extraTemplates.count}`);

  const extraCats = await prisma.category.deleteMany({
    where: { slug: { notIn: KEEP_CATEGORY_SLUGS } },
  });
  console.log(`Deleted categories: ${extraCats.count}`);

  const extraContent = await prisma.categoryContent.deleteMany({
    where: { categorySlug: { notIn: KEEP_CATEGORY_SLUGS } },
  });
  console.log(`Deleted categoryContent: ${extraContent.count}`);

  const layouts = await prisma.layout.findMany({
    select: { id: true, key: true, sectionNumber: true },
  });
  const dropIds = layouts
    .filter((row) => !keepLayout(row.key, row.sectionNumber))
    .map((row) => row.id);
  if (dropIds.length) {
    const removed = await prisma.layout.deleteMany({
      where: { id: { in: dropIds } },
    });
    console.log(`Deleted layouts: ${removed.count}`);
  } else {
    console.log("Deleted layouts: 0");
  }

  const remainingTemplates = await prisma.template.findMany({
    select: { key: true, title: true },
    orderBy: { numericId: "asc" },
  });
  const remainingCats = await prisma.category.findMany({
    select: { slug: true, name: true },
    orderBy: { order: "asc" },
  });
  console.log("Templates left:", remainingTemplates);
  console.log("Categories left:", remainingCats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
