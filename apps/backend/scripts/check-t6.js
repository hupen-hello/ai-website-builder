const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const t = await p.template.findUnique({
    where: { key: "template-realestate-6" },
  });
  console.log("variants", Object.keys(t.sectionVariants || {}));
  console.log("homeOrder", t.homeSectionOrder);
  await p.$disconnect();
})();
