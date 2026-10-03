const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const jsonPath = path.resolve(
  __dirname,
  "../../frontend/app/editor/layout/src/data/categoryContent.json",
);

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const template = raw.templates.find((item) => item.id === "template-evento-1");
  const keys = Object.values(template.sectionVariants || {});
  let count = 0;
  for (const key of keys) {
    const sectionNumber = Number(String(key).split("-").pop()) || 9;
    const sectionType = String(key).replace(/-\d+$/, "");
    const isPage =
      /Page|Detail|Breadcrumb|Map|Gallery|Faq|Quote|Legal|Error|Sitemap/i.test(
        sectionType,
      );
    await prisma.layout.upsert({
      where: { key },
      create: {
        key,
        name: key,
        sectionType,
        sectionNumber,
        categorySlug: "event-services",
        scope: isPage ? "page" : "home",
        order: sectionNumber,
        status: "Active",
      },
      update: {
        status: "Active",
        categorySlug: "event-services",
      },
    });
    count += 1;
  }
  console.log(`Evento layouts upserted: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
