/**
 * Seed Realestate layout variants 5–6 (Gallery 7–8) for custom-layouts admin.
 * Run: node prisma/seed-realestate-layouts.js  (from apps/backend)
 *   or: npm run db:seed:realestate-layouts -w backend
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORY_SLUG = 'realestate';

/** @type {Array<{ key: string; name: string; sectionType: string; sectionNumber: number; scope: string; order: number; categorySlug: string; description: string }>} */
const layouts = [];

const HOME = [
  ['Topbar', 5, 'Realestate Topbar 1'],
  ['Topbar', 6, 'Realestate Topbar 2'],
  ['Header', 5, 'Realestate Header 1'],
  ['Header', 6, 'Realestate Header 2'],
  ['Banner', 5, 'Realestate Banner 1'],
  ['Banner', 6, 'Realestate Banner 2'],
  ['Features', 5, 'Realestate Features 1'],
  ['Highlight', 5, 'Realestate Highlight 1'],
  ['Featured', 5, 'Realestate Featured 1'],
  ['LatestProject', 5, 'Realestate Latest Projects'],
  ['Cities', 5, 'Realestate Cities / Portfolio'],
  ['About', 5, 'Realestate About 1'],
  ['About', 6, 'Realestate About 2'],
  ['Product', 5, 'Realestate Service 1'],
  ['Product', 6, 'Realestate Service 2'],
  ['WhyChooseUs', 5, 'Realestate Why Choose Us 1'],
  ['WhyChooseUs', 6, 'Realestate Why Choose Us 2'],
  ['FeaturedDev', 5, 'Realestate Featured Developers'],
  ['Process', 5, 'Realestate Property Process'],
  ['Gallery', 7, 'Realestate Gallery 1'],
  ['Gallery', 8, 'Realestate Gallery 2'],
  ['FormDetail', 5, 'Realestate Form 1'],
  ['FormDetail', 6, 'Realestate Form 2'],
  ['Awards', 5, 'Realestate Awards'],
  ['Stats', 5, 'Realestate Company Stats'],
  ['Blog', 5, 'Realestate Blog'],
  ['FAQ', 5, 'Realestate FAQ 1'],
  ['FAQ', 6, 'Realestate FAQ 2'],
  ['Testimonial', 5, 'Realestate Clients 1'],
  ['Testimonial', 6, 'Realestate Clients 2'],
  ['Contact', 5, 'Realestate Contact'],
  ['Contact', 6, 'Realestate Contact 2'],
  ['InvestmentOpportunities', 5, 'Realestate Investment Opportunities'],
  ['Footer', 5, 'Realestate Footer 1'],
  ['Footer', 6, 'Realestate Footer 2'],
];

const PAGE = [
  ['AboutPage', 5, 'Realestate About Page'],
  ['AboutPage', 6, 'Realestate About Page 2'],
  ['ServicePage', 5, 'Realestate Service Page'],
  ['ServicePage', 6, 'Realestate Service Page 2'],
  ['GalleryPage', 6, 'Realestate Gallery Page'],
  ['ContactPage', 5, 'Realestate Contact Page'],
  ['ContactPage', 6, 'Realestate Contact Page 2'],
  ['AwardsPage', 5, 'Realestate Awards Page'],
  ['AwardsPage', 6, 'Realestate Awards Page 2'],
  ['MissionPage', 5, 'Realestate Mission Page'],
  ['MissionPage', 6, 'Realestate Mission Page 2'],
  ['CsrPage', 5, 'Realestate CSR Page'],
  ['CsrPage', 6, 'Realestate CSR Page 2'],
  ['CareerPage', 5, 'Realestate Career Page'],
  ['CareerPage', 6, 'Realestate Career Page 2'],
  ['RentPage', 5, 'Realestate Rent Page'],
  ['RentPage', 6, 'Realestate Rent Page 2'],
  ['BuyPropertyPage', 5, 'Realestate Buy Property Page'],
  ['BuyPropertyPage', 6, 'Realestate Buy Property Page 2'],
  ['PropertyPage', 5, 'Realestate Sale Property Page'],
  ['PropertyPage', 6, 'Realestate Sale Property Page 2'],
  ['BlogPage', 6, 'Realestate Blog Page'],
  ['SitemapPage', 5, 'Realestate Sitemap'],
  ['SitemapPage', 6, 'Realestate Sitemap 2'],
  ['PrivacyPage', 5, 'Realestate Privacy Policy'],
  ['PrivacyPage', 6, 'Realestate Privacy Policy 2'],
  ['TermsPage', 5, 'Realestate Terms'],
  ['TermsPage', 6, 'Realestate Terms 2'],
  ['DisclaimerPage', 5, 'Realestate Disclaimer'],
  ['DisclaimerPage', 6, 'Realestate Disclaimer 2'],
  ['CookiePolicyPage', 5, 'Realestate Cookie Policy'],
  ['CookiePolicyPage', 6, 'Realestate Cookie Policy 2'],
  ['RefundPolicyPage', 5, 'Realestate Refund Policy'],
  ['RefundPolicyPage', 6, 'Realestate Refund Policy 2'],
  ['CustomPage', 1, 'Custom Page 1'],
  ['CustomPage', 2, 'Custom Page 2'],
  ['CustomPage', 3, 'Custom Page 3'],
  ['CustomPage', 4, 'Custom Page 4'],
  ['CustomPage', 5, 'Custom Page 5'],
  ['Breadcrumb', 5, 'Realestate Inner Banner'],
  ['Breadcrumb', 6, 'Realestate Inner Banner 2'],
];

for (const [sectionType, sectionNumber, name] of HOME) {
  layouts.push({
    key: `${sectionType}-${sectionNumber}`,
    name,
    sectionType,
    sectionNumber,
    scope: 'home',
    order: sectionNumber,
    categorySlug: CATEGORY_SLUG,
    description: `Imported RealEstate layout (${sectionType}-${sectionNumber})`,
  });
}

for (const [sectionType, sectionNumber, name] of PAGE) {
  layouts.push({
    key: `${sectionType}-${sectionNumber}`,
    name,
    sectionType,
    sectionNumber,
    scope: 'page',
    order: sectionNumber,
    categorySlug: CATEGORY_SLUG,
    description: `Imported RealEstate page layout (${sectionType}-${sectionNumber})`,
  });
}

async function main() {
  // Ensure category exists with matching slug if Category table is used
  try {
    const cat = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: CATEGORY_SLUG },
          { slug: 'Realestate' },
          { name: { equals: 'Realestate', mode: 'insensitive' } },
        ],
      },
    });
    if (cat && cat.slug !== CATEGORY_SLUG) {
      console.log(`Note: category found as slug="${cat.slug}" — seeding with that slug`);
      for (const layout of layouts) layout.categorySlug = cat.slug;
    } else if (!cat) {
      console.log(
        `Warning: no Category row for realestate — layouts still seeded with slug "${CATEGORY_SLUG}"`,
      );
    }
  } catch (e) {
    console.log('Category lookup skipped:', e.message);
  }

  let created = 0;
  let updated = 0;
  for (const layout of layouts) {
    const existing = await prisma.layout.findUnique({ where: { key: layout.key } });
    const row = await prisma.layout.upsert({
      where: { key: layout.key },
      create: { ...layout, status: 'Active' },
      update: {
        name: layout.name,
        sectionType: layout.sectionType,
        sectionNumber: layout.sectionNumber,
        scope: layout.scope,
        order: layout.order,
        categorySlug: layout.categorySlug,
        description: layout.description,
        status: 'Active',
      },
    });
    if (existing) updated += 1;
    else created += 1;
    console.log(`✓ ${row.key} [${row.categorySlug || 'global'}] ${row.scope}`);
  }
  console.log(
    `\nDone: ${layouts.length} Realestate layouts (created ${created}, updated ${updated})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
