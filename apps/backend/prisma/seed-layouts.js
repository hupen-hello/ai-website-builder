/**
 * Step 2 seed: frontend sectionRegistry variants → PostgreSQL Layout table
 * Run: npm run db:seed:layouts -w backend
 *
 * Every section type has exactly 4 variants (1–4) for 4 templates / category.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const HOME_SECTIONS = [
  'Topbar',
  'Header',
  'Banner',
  'About',
  'Product',
  'WhyChooseUs',
  'Gallery',
  'FormDetail',
  'FAQ',
  'Testimonial',
  'Footer',
];

const PAGE_SECTIONS = [
  'AboutPage',
  'ServicePage',
  'GalleryPage',
  'ContactPage',
];

const INNER_PAGE_CHROME = ['Breadcrumb'];

const NAMES = {
  Banner: {
    1: 'Image Banner',
    2: 'Video Banner',
    3: 'Image Slider',
    4: 'Video Slider',
  },
  Product: {
    1: 'Service 1',
    2: 'Service 2',
    3: 'Service 3',
    4: 'Service 4',
  },
  FormDetail: {
    1: 'Form 1',
    2: 'Form 2',
    3: 'Form 3',
    4: 'Form 4',
  },
  FAQ: {
    1: 'FAQ 1',
    2: 'FAQ 2',
    3: 'FAQ 3',
    4: 'FAQ 4',
  },
  WhyChooseUs: {
    1: 'Why Choose Us 1',
    2: 'Why Choose Us 2',
    3: 'Why Choose Us 3',
    4: 'Why Choose Us 4',
  },
  Testimonial: {
    1: 'Our Clients 1',
    2: 'Our Clients 2',
    3: 'Our Clients 3',
    4: 'Our Clients 4',
  },
};

/** @type {Array<{ key: string; name: string; sectionType: string; sectionNumber: number; scope: string; order: number }>} */
const layouts = [];

const VARIANT_NUMBERS = [2, 4];

for (const sectionType of HOME_SECTIONS) {
  for (const n of VARIANT_NUMBERS) {
    layouts.push({
      key: `${sectionType}-${n}`,
      name: NAMES[sectionType]?.[n] || `${sectionType} ${n}`,
      sectionType,
      sectionNumber: n,
      categorySlug: 'realestate',
      scope: 'home',
      order: n,
    });
  }
}

for (const sectionType of PAGE_SECTIONS) {
  for (const n of VARIANT_NUMBERS) {
    layouts.push({
      key: `${sectionType}-${n}`,
      name: `${sectionType.replace('Page', ' Page')} ${n}`,
      sectionType,
      sectionNumber: n,
      categorySlug: 'realestate',
      scope: 'page',
      order: n,
    });
  }
}

for (const sectionType of INNER_PAGE_CHROME) {
  for (const n of VARIANT_NUMBERS) {
    layouts.push({
      key: `${sectionType}-${n}`,
      name: `Breadcrumb ${n}`,
      sectionType,
      sectionNumber: n,
      categorySlug: 'realestate',
      scope: 'page',
      order: n,
    });
  }
}

async function main() {
  for (const layout of layouts) {
    const row = await prisma.layout.upsert({
      where: { key: layout.key },
      create: { ...layout, status: 'Active' },
      update: {
        name: layout.name,
        sectionType: layout.sectionType,
        sectionNumber: layout.sectionNumber,
        categorySlug: layout.categorySlug,
        scope: layout.scope,
        order: layout.order,
        status: 'Active',
      },
    });
    console.log(`✓ ${row.key} (${row.sectionType} / ${row.scope})`);
  }
  console.log(`\nStep 2 done: ${layouts.length} layouts seeded (4 per section)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
