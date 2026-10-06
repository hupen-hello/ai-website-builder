/**
 * Service category + AviCare template 1.
 * Run from apps/backend: node prisma/seed-service-template.js
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const jsonPath = path.resolve(
  __dirname,
  "../../frontend/app/editor/layout/src/data/categoryContent.json",
);
const KEY = "template-service-1";
const CATEGORY_SLUG = "service";

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const template = raw.templates.find((item) => item.id === KEY);
  const pack = raw.categories?.Service;
  if (!template || !pack) {
    throw new Error("template-service-1 is missing from categoryContent.json");
  }

  const category = await prisma.category.upsert({
    where: { slug: CATEGORY_SLUG },
    create: {
      order: 3,
      name: "Service",
      slug: CATEGORY_SLUG,
      icon: "lucide-wrench",
      description: "Build an appliance repair website",
      status: "Active",
    },
    update: {
      name: "Service",
      icon: "lucide-wrench",
      description: "Build an appliance repair website",
      status: "Active",
    },
  });

  const keys = Object.values(template.sectionVariants || {});
  for (const key of keys) {
    const sectionNumber = Number(String(key).split("-").pop()) || 10;
    const sectionType = String(key).replace(/-\d+$/, "");
    const isPage =
      /Page|Detail|Breadcrumb|Faq|FAQ|Enquiry|Error|Gallery|Team/i.test(
        sectionType,
      ) && !["Header", "Banner", "About", "Product", "Blog", "Testimonial", "Footer", "Stats"].includes(sectionType);
    await prisma.layout.upsert({
      where: { key },
      create: {
        key,
        name: key,
        sectionType,
        sectionNumber,
        categorySlug: CATEGORY_SLUG,
        scope: isPage ? "page" : "home",
        order: sectionNumber,
        status: "Active",
        description: "AviCare service template",
      },
      update: {
        name: key,
        sectionType,
        sectionNumber,
        categorySlug: CATEGORY_SLUG,
        scope: isPage ? "page" : "home",
        status: "Active",
      },
    });
  }

  const existing = await prisma.template.findUnique({ where: { key: KEY } });
  let numericId = existing?.numericId ?? template.numericId ?? 16;
  if (!existing) {
    const taken = await prisma.template.findUnique({ where: { numericId } });
    if (taken) {
      const maxNumeric = await prisma.template.aggregate({
        _max: { numericId: true },
      });
      numericId = (maxNumeric._max.numericId || 100) + 1;
    }
  }

  const data = {
    title: template.title,
    type: template.type,
    image: template.image || null,
    previewImage: template.previewimage || template.image || null,
    previewDescription: template.preview_description || "",
    prebuiltPages: template.prebuilt_pages || template.pages?.length || 1,
    pages: template.pages || [],
    homeSectionOrder: template.homeSectionOrder || [],
    sectionVariants: template.sectionVariants,
    variables: template.variables || {},
    status: "Active",
  };

  await prisma.template.upsert({
    where: { key: KEY },
    create: {
      key: KEY,
      numericId,
      order: numericId,
      ...data,
    },
    update: data,
  });

  await prisma.categoryContent.upsert({
    where: { categorySlug: CATEGORY_SLUG },
    create: {
      categorySlug: CATEGORY_SLUG,
      categoryName: "Service",
      templateKeys: [KEY],
      sections: pack.sections,
      status: "Active",
    },
    update: {
      categoryName: "Service",
      templateKeys: [KEY],
      sections: pack.sections,
      status: "Active",
    },
  });

  console.log(`Service category ready: ${category.name} / ${KEY} / layouts ${keys.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
