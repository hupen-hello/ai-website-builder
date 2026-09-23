/**
 * Step 3 seed: categoryContent.json → Template + SharedContent + CategoryContent
 * Run: npm run db:seed:templates -w backend
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const jsonPath = path.resolve(
  __dirname,
  '../../frontend/app/editor/layout/src/data/categoryContent.json',
);

function slugifyName(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
}

async function main() {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Missing content file: ${jsonPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const templates = raw.templates || [];
  const common = raw.common || {};
  const categories = raw.categories || {};

  console.log(`Seeding ${templates.length} templates...`);

  // Drop templates not in this seed so unique numericId / key stay clean
  const keepKeys = templates.map((t) => t.id).filter(Boolean);
  if (keepKeys.length) {
    const removed = await prisma.template.deleteMany({
      where: { key: { notIn: keepKeys } },
    });
    if (removed.count) {
      console.log(`Removed ${removed.count} stale template(s)`);
    }
  }

  // Clear numericId collisions before upsert (same id, different key)
  const existing = await prisma.template.findMany({
    select: { id: true, key: true, numericId: true },
  });
  const keepSet = new Set(keepKeys);
  for (const row of existing) {
    if (keepSet.has(row.key)) continue;
  }
  // Temporarily shift numericIds of rows we're about to replace by key
  for (const t of templates) {
    const clash = await prisma.template.findFirst({
      where: {
        numericId: t.numericId,
        NOT: { key: t.id },
      },
    });
    if (clash) {
      await prisma.template.update({
        where: { id: clash.id },
        data: { numericId: t.numericId + 100000 },
      });
    }
  }

  for (const t of templates) {
    const row = await prisma.template.upsert({
      where: { key: t.id },
      create: {
        key: t.id,
        numericId: t.numericId,
        title: t.title,
        type: t.type,
        image: t.image || null,
        previewImage: t.previewimage || null,
        previewDescription: t.preview_description || null,
        prebuiltPages: t.prebuilt_pages ?? 0,
        pages: t.pages || null,
        homeSectionOrder: t.homeSectionOrder || null,
        sectionVariants: t.sectionVariants || {},
        variables: t.variables || {},
        order: t.numericId,
        status: 'Active',
      },
      update: {
        numericId: t.numericId,
        title: t.title,
        type: t.type,
        image: t.image || null,
        previewImage: t.previewimage || null,
        previewDescription: t.preview_description || null,
        prebuiltPages: t.prebuilt_pages ?? 0,
        pages: t.pages || null,
        homeSectionOrder: t.homeSectionOrder || null,
        sectionVariants: t.sectionVariants || {},
        variables: t.variables || {},
        order: t.numericId,
        status: 'Active',
      },
    });
    console.log(`✓ Template ${row.key} — ${row.title}`);
  }

  await prisma.sharedContent.upsert({
    where: { key: 'common' },
    create: { key: 'common', sections: common },
    update: { sections: common },
  });
  console.log('✓ SharedContent (common)');

  for (const [categoryName, pack] of Object.entries(categories)) {
    const categorySlug = slugifyName(categoryName);
    const row = await prisma.categoryContent.upsert({
      where: { categorySlug },
      create: {
        categorySlug,
        categoryName,
        templateKeys: pack.templates || [],
        sections: pack.sections || {},
        status: 'Active',
      },
      update: {
        categoryName,
        templateKeys: pack.templates || [],
        sections: pack.sections || {},
        status: 'Active',
      },
    });
    console.log(`✓ CategoryContent ${row.categoryName} (${row.categorySlug})`);
  }

  console.log('\nStep 3 done: Templates + content seeded in PostgreSQL');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
