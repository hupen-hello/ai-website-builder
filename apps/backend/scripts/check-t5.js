const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const t = await p.template.findUnique({
    where: { key: "template-realestate-5" },
  });
  console.log({
    type: t.type,
    prebuiltPages: t.prebuiltPages,
    pages: t.pages,
    hasBreadcrumb: Boolean(t.sectionVariants?.Breadcrumb),
    hasAboutPage: Boolean(t.sectionVariants?.AboutPage),
  });
  await p.$disconnect();
})();
