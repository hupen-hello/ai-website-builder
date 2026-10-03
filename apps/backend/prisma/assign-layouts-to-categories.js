const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const jsonPath = path.resolve(
  __dirname,
  "../../frontend/app/editor/layout/src/data/categoryContent.json",
);

const EXTRA_KEEP = [
  "AboutAchievements-5",
  "AboutHistory-5",
  "AboutTeam-5",
  "AboutProcess-5",
  "PackagePage-5",
  "ServiceDetail-5",
  "PropertyGrid-5",
  "PropertyDetail-5",
  "TeamPage-5",
  "TestimonialPage-5",
  "GalleryPage-5",
  "BlogPage-5",
  "BlogDetail-5",
  "BrochurePage-5",
  "FaqPage-5",
  "QuotePage-5",
  "AwardsPage-5",
  "PartnerPage-5",
  "CareerPage-5",
  "CareerJobs-5",
  "FormDetail-5",
  "Product-4",
  "Product-5",
  "FormDetail-4",
  "FAQ-4",
  "WhyChooseUs-4",
  "Gallery-4",
  "CustomPage-2",
  "CustomPage-4",
  "CustomPage-5",
];

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const keep = new Set(EXTRA_KEEP);
  for (const template of raw.templates || []) {
    Object.values(template.sectionVariants || {}).forEach((key) =>
      keep.add(key),
    );
  }

  const layouts = await prisma.layout.findMany({
    select: { id: true, key: true, categorySlug: true },
  });
  const dropIds = layouts
    .filter((row) => !keep.has(row.key))
    .map((row) => row.id);
  if (dropIds.length) {
    const removed = await prisma.layout.deleteMany({
      where: { id: { in: dropIds } },
    });
    console.log(`Deleted extra layouts: ${removed.count}`);
  }

  const assignedRe = await prisma.layout.updateMany({
    where: {
      OR: [{ categorySlug: null }, { categorySlug: "" }],
      NOT: { key: { endsWith: "-9" } },
    },
    data: { categorySlug: "realestate" },
  });
  const assignedEvent = await prisma.layout.updateMany({
    where: {
      OR: [{ categorySlug: null }, { categorySlug: "" }],
      key: { endsWith: "-9" },
    },
    data: { categorySlug: "event-services" },
  });
  console.log(`Moved to Realestate: ${assignedRe.count}`);
  console.log(`Moved to Event Services: ${assignedEvent.count}`);

  const leftover = await prisma.layout.count({
    where: { OR: [{ categorySlug: null }, { categorySlug: "" }] },
  });
  console.log(`Still All-categories: ${leftover}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
