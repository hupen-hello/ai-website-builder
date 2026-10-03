/**
 * Seed a HOME-ONLY Single Page template for every Category row,
 * and link it in CategoryContent.templateKeys.
 *
 * Does NOT delete existing templates (keeps Realestate multi-page).
 *
 * Run: node prisma/seed-home-templates-for-categories.js
 * from apps/backend
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const HOME_SECTION_ORDER = [
  'Topbar',
  'Header',
  'Banner',
  'Product',
  'WhyChooseUs',
  'Gallery',
  'Testimonial',
  'FAQ',
  'FormDetail',
  'Contact',
  'Footer',
];

/** Prefer non-Realestate *-5 keys so agency/school sites don't look like Haus Group. */
const VARIANT_POOL = {
  Topbar: ['Topbar-1', 'Topbar-2', 'Topbar-3', 'Topbar-4', 'Topbar-6'],
  Header: ['Header-1', 'Header-2', 'Header-3', 'Header-4', 'Header-6'],
  Banner: ['Banner-2', 'Banner-2', 'Banner-2', 'Banner-2', 'Banner-2'],
  Product: ['Product-1', 'Product-2', 'Product-3', 'Product-4', 'Product-6'],
  WhyChooseUs: [
    'WhyChooseUs-1',
    'WhyChooseUs-2',
    'WhyChooseUs-3',
    'WhyChooseUs-4',
    'WhyChooseUs-6',
  ],
  Gallery: ['Gallery-1', 'Gallery-2', 'Gallery-3', 'Gallery-4', 'Gallery-6'],
  Testimonial: [
    'Testimonial-1',
    'Testimonial-2',
    'Testimonial-3',
    'Testimonial-4',
    'Testimonial-6',
  ],
  FAQ: ['FAQ-2', 'FAQ-4', 'FAQ-6', 'FAQ-2', 'FAQ-4'],
  FormDetail: [
    'FormDetail-1',
    'FormDetail-2',
    'FormDetail-3',
    'FormDetail-4',
    'FormDetail-6',
  ],
  Contact: ['Contact-2', 'Contact-2', 'Contact-2', 'Contact-2', 'Contact-2'],
  Footer: ['Footer-1', 'Footer-2', 'Footer-3', 'Footer-4', 'Footer-6'],
};

const DEFAULT_VARIABLES = {
  '--primary-bg': '#0f172a',
  '--secondary-bg': '#ffffff',
  '--primary-text': '#ffffff',
  '--secondary-text': '#0f172a',
  '--header-bg': '#0f172a',
  '--header-text': '#ffffff',
  '--hero-bg': '#0f172a',
  '--hero-title': '#ffffff',
  '--lightcream-bg': '#f8fafc',
  '--primary-title-text': '#0f172a',
  '--secondary-title-text': '#0f172a',
  '--primary-pretitle-text': '#64748b',
  '--secondary-pretitle-text': '#64748b',
  '--primary-subtitle-text': '#475569',
  '--secondary-subtitle-text': '#475569',
  '--primary-link-bg': '#0f172a',
  '--primary-link-color': '#ffffff',
  '--secondary-link-bg': '#e2e8f0',
  '--secondary-link-color': '#0f172a',
};

function pickVariants(index) {
  const out = {};
  for (const [type, pool] of Object.entries(VARIANT_POOL)) {
    out[type] = pool[index % pool.length];
  }
  return out;
}

function minimalSections(categoryName) {
  const brand = categoryName || 'Business';
  return {
    Header: { logo: brand, menu: [], buttons: [] },
    Banner: {
      pretitle: brand,
      title: `Welcome to ${brand}`,
      desc: `Professional ${brand.toLowerCase()} website — edit every section in the builder.`,
      backgroundImage: '/categories/business/blackbay.png',
      backgroundImageTitle: brand,
      bannerHeight: 70,
    },
    Product: {
      productSectionTitle: "What we offer",
      productInfoTitle: `Services for ${brand}`,
      productInfoDesc: "Add your offers, packages, and proof points here.",
      productItems: [],
    },
    WhyChooseUs: {
      pretitle: "Why us",
      title: `Why choose ${brand}`,
      desc: "Clear messaging and fast lead capture.",
      whyChooseUsItems: [],
    },
    Gallery: {
      pretitle: "Gallery",
      title: "Our work",
      desc: "Swap these images with your brand photos.",
      galleryItems: [],
    },
    Testimonial: {
      pretitle: "Reviews",
      title: "What clients say",
      desc: "Social proof builds trust.",
      testimonialItems: [],
    },
    FAQ: {
      pretitle: "FAQ",
      title: "Common questions",
      faqItems: [],
    },
    FormDetail: {
      pretitle: "Contact",
      title: "Tell us about your project",
      desc: "We will get back within one business day.",
      formSubmitLabel: "Send message",
      formFields: [
        { label: "Full Name", type: "text", placeholder: "Your name" },
        { label: "Email", type: "email", placeholder: "you@example.com" },
        { label: "Message", type: "textarea", placeholder: "How can we help?" },
      ],
    },
    Footer: {},
  };
}

async function main() {
  console.log(
    "Skipped: extra per-category home templates are not used (Realestate 2/4/5 + Evento only).",
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
