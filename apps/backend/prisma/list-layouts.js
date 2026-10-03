const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.layout.findMany({
    select: {
      key: true,
      categorySlug: true,
      sectionType: true,
      sectionNumber: true,
    },
    orderBy: [{ categorySlug: "asc" }, { key: "asc" }],
  });
  const byCat = {};
  for (const row of all) {
    const cat = row.categorySlug || "(all)";
    byCat[cat] = byCat[cat] || [];
    byCat[cat].push(row.key);
  }
  for (const [cat, keys] of Object.entries(byCat)) {
    console.log(`\n=== ${cat} (${keys.length}) ===`);
    console.log(keys.join("\n"));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
