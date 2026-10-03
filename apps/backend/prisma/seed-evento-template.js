/**
 * Add the Evento multi-page theme to Event Services.
 * Run from apps/backend: node prisma/seed-evento-template.js
 */
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const eventCategory = JSON.parse(
  fs.readFileSync(
    "E:/css-ai-builder-main1/app/editor/layout/src/data/eventCategory.json",
    "utf8",
  ),
);
const eventSections = eventCategory.sections;

function variant(section, key) {
  return eventSections[section].variants[key];
}

const KEY = "evento";
const CATEGORY_SLUG = "event-services";

const HOME_SECTION_ORDER = [
  "Header",
  "Banner",
  "About",
  "Product",
  "Testimonial",
  "Blog",
  "Footer",
];

const SECTION_VARIANTS = {
  Header: "Header-9",
  Banner: "Banner-9",
  About: "About-9",
  Product: "Product-9",
  Testimonial: "Testimonial-9",
  Blog: "Blog-9",
  Footer: "Footer-9",
  AboutPage: "AboutPage-9",
  ServicePage: "ServicePage-9",
  EventPage: "EventPage-9",
  GalleryPage: "GalleryPage-9",
  BlogPage: "BlogPage-9",
  FaqPage: "FaqPage-9",
  ContactPage: "ContactPage-9",
};

const PAGES = [
  { id: "about-us", label: "About Us", sectionType: "AboutPage" },
  { id: "services", label: "Services", sectionType: "ServicePage" },
  { id: "event", label: "Events", sectionType: "EventPage" },
  { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
  { id: "blog", label: "Blog", sectionType: "BlogPage" },
  { id: "faqs", label: "FAQs", sectionType: "FaqPage" },
  { id: "contact", label: "Contact", sectionType: "ContactPage" },
];

function withVariant(existing, variantKey, value) {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...existing }
      : {};
  base[variantKey] = value;
  return base;
}

const VARIABLES = {
  "--primary-bg": "#2b1049",
  "--secondary-bg": "#ffffff",
  "--primary-text": "#ffffff",
  "--secondary-text": "#15072b",
  "--header-bg": "#ffffff",
  "--header-text": "#15072b",
  "--hero-bg": "#1a052b",
  "--hero-title": "#ffffff",
  "--lightcream-bg": "#f7f5f9",
  "--primary-title-text": "#15072b",
  "--secondary-title-text": "#15072b",
  "--primary-pretitle-text": "#6b3c9b",
  "--secondary-pretitle-text": "#6b3c9b",
  "--primary-subtitle-text": "#475569",
  "--secondary-subtitle-text": "#475569",
  "--primary-link-bg": "#6b3c9b",
  "--primary-link-color": "#ffffff",
  "--secondary-link-bg": "#f3e8ff",
  "--secondary-link-color": "#2b1049",
};

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: CATEGORY_SLUG },
  });
  if (!category) {
    throw new Error(`Category ${CATEGORY_SLUG} not found`);
  }

  const maxNumeric = await prisma.template.aggregate({
    _max: { numericId: true },
  });
  const existing = await prisma.template.findUnique({ where: { key: KEY } });
  const numericId = existing?.numericId ?? (maxNumeric._max.numericId || 100) + 1;

  await prisma.template.upsert({
    where: { key: KEY },
    create: {
      key: KEY,
      numericId,
      title: "Evento",
      type: "Multiple Pages Website",
      image: null,
      previewImage: null,
      previewDescription: "Evento multi-page theme for Event Services.",
      prebuiltPages: 1 + PAGES.length,
      pages: PAGES,
      homeSectionOrder: HOME_SECTION_ORDER,
      sectionVariants: SECTION_VARIANTS,
      variables: VARIABLES,
      order: numericId,
      status: "Active",
    },
    update: {
      title: "Evento",
      type: "Multiple Pages Website",
      previewDescription: "Evento multi-page theme for Event Services.",
      prebuiltPages: 1 + PAGES.length,
      pages: PAGES,
      homeSectionOrder: HOME_SECTION_ORDER,
      sectionVariants: SECTION_VARIANTS,
      variables: VARIABLES,
      status: "Active",
    },
  });

  const content = await prisma.categoryContent.findUnique({
    where: { categorySlug: CATEGORY_SLUG },
  });
  const templateKeys = Array.isArray(content?.templateKeys)
    ? [...content.templateKeys]
    : [];
  if (!templateKeys.includes(KEY)) templateKeys.push(KEY);

  const previousSections =
    content?.sections && typeof content.sections === "object"
      ? content.sections
      : {};
  const sections = {
    ...previousSections,
    Header: withVariant(previousSections.Header, "Header-9", variant("Header", "HeaderEvent1")),
    Banner: withVariant(previousSections.Banner, "Banner-9", variant("Hero", "HeroEvent1")),
    About: withVariant(previousSections.About, "About-9", variant("About", "AboutEvent1")),
    Product: withVariant(previousSections.Product, "Product-9", variant("Services", "ServicesEvent1")),
    Testimonial: withVariant(
      previousSections.Testimonial,
      "Testimonial-9",
      variant("Testimonials", "TestimonialsEvent1"),
    ),
    Blog: withVariant(previousSections.Blog, "Blog-9", variant("Blog", "BlogEvent1")),
    Footer: withVariant(previousSections.Footer, "Footer-9", variant("Footer", "FooterEvent1")),
    AboutPage: withVariant(previousSections.AboutPage, "AboutPage-9", {
      banner: variant("PageBanner", "PageBannerEvent1"),
      about: variant("About", "AboutEvent1"),
      missionVision: variant("MissionVision", "MissionVisionEvent1"),
      coreValues: variant("CoreValues", "CoreValuesEvent1"),
      stats: { items: variant("Stats", "StatsAltEvent1") },
    }),
    ServicePage: withVariant(previousSections.ServicePage, "ServicePage-9", {
      banner: variant("PageBanner", "ServicesPageBanner"),
      services: variant("Services", "ServicesEvent1"),
    }),
    EventPage: withVariant(previousSections.EventPage, "EventPage-9", {
      banner: variant("PageBanner", "EventsPageBanner"),
      events: variant("EventsList", "EventsListEvent1"),
    }),
    GalleryPage: withVariant(previousSections.GalleryPage, "GalleryPage-9", {
      banner: variant("PageBanner", "GalleryPageBanner"),
      images: variant("ImageGallery", "ImageGallery1"),
      videos: variant("VideoGallery", "VideoGallery1"),
    }),
    BlogPage: withVariant(previousSections.BlogPage, "BlogPage-9", {
      banner: variant("PageBanner", "BlogPageBanner"),
      blog: variant("Blog", "BlogEvent1"),
    }),
    FaqPage: withVariant(previousSections.FaqPage, "FaqPage-9", {
      banner: variant("PageBanner", "FaqsPageBanner"),
      faqs: variant("Faqs", "FaqsEvent1"),
    }),
    ContactPage: withVariant(previousSections.ContactPage, "ContactPage-9", {
      banner: variant("PageBanner", "ContactPageBanner"),
      form: variant("ContactForm", "ContactFormEvent1"),
      map: variant("ContactMap", "ContactMapEvent1"),
    }),
  };

  await prisma.categoryContent.upsert({
    where: { categorySlug: CATEGORY_SLUG },
    create: {
      categorySlug: CATEGORY_SLUG,
      categoryName: category.name,
      templateKeys,
      sections,
      status: "Active",
    },
    update: {
      categoryName: category.name,
      templateKeys,
      sections,
      status: "Active",
    },
  });

  console.log(`Evento linked to ${category.name}: ${templateKeys.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
