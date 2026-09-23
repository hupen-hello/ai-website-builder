import { promises as fs } from "fs";
import path from "path";
import type { PublishedSitePayload } from "@/lib/publishedSeo";
import { normalizePageSeoKey } from "@/lib/siteSeo";
import type { ZipFileEntry } from "@/lib/zipStore";

/** Variant key → relative path under editor/layout/src */
const VARIANT_FILE: Record<string, string> = {
  "CustomSection-1": "components/sections/custom/CustomSection.tsx",
  "BlogPage-1": "components/sections/blog/BlogPage.tsx",
  "BlogPage-2": "components/sections/blog/BlogPage.tsx",
  "BlogPage-3": "components/sections/blog/BlogPage.tsx",
  "BlogPage-4": "components/sections/blog/BlogPage.tsx",
  "BlogPage-5": "components/sections/blog/BlogPage.tsx",
  "Topbar-1": "components/sections/topbar/TopbarOne.tsx",
  "Topbar-2": "components/sections/topbar/TopbarTwo.tsx",
  "Topbar-3": "components/sections/topbar/TopbarOne.tsx",
  "Topbar-4": "components/sections/topbar/TopbarTwo.tsx",
  "Topbar-5": "components/sections/topbar/RealEstateTopbar1.tsx",
  "Topbar-6": "components/sections/topbar/RealEstateTopbar2.tsx",
  "Header-1": "components/sections/header/HeaderOne.tsx",
  "Header-2": "components/sections/header/HeaderTwo.tsx",
  "Header-3": "components/sections/header/HeaderOne.tsx",
  "Header-4": "components/sections/header/HeaderTwo.tsx",
  "Header-5": "components/sections/header/RealEstateHeader1.tsx",
  "Header-6": "components/sections/header/RealEstateHeader2.tsx",
  "Banner-1": "components/sections/banner/BannerOne.tsx",
  "Banner-2": "components/sections/banner/BannerTwo.tsx",
  "Banner-3": "components/sections/banner/BannerThree.tsx",
  "Banner-4": "components/sections/banner/BannerFour.tsx",
  "Banner-5": "components/sections/banner/RealEstateBanner1.tsx",
  "Banner-6": "components/sections/banner/RealEstateBanner2.tsx",
  "About-1": "components/sections/about/AboutOne.tsx",
  "About-2": "components/sections/about/AboutTwo.tsx",
  "About-3": "components/sections/about/AboutOne.tsx",
  "About-4": "components/sections/about/AboutTwo.tsx",
  "About-5": "components/sections/about/RealEstateAbout1.tsx",
  "About-6": "components/sections/about/RealEstateAbout2.tsx",
  "Product-1": "components/sections/product/ProductOne.tsx",
  "Product-2": "components/sections/product/ProductTwo.tsx",
  "Product-3": "components/sections/product/ProductThree.tsx",
  "Product-4": "components/sections/product/ProductOne.tsx",
  "Product-5": "components/sections/product/RealEstateProduct1.tsx",
  "Product-6": "components/sections/product/RealEstateProduct2.tsx",
  "WhyChooseUs-1": "components/sections/whychooseus/WhyChooseUsOne.tsx",
  "WhyChooseUs-2": "components/sections/whychooseus/WhyChooseUsTwo.tsx",
  "WhyChooseUs-3": "components/sections/whychooseus/WhyChooseUsThree.tsx",
  "WhyChooseUs-4": "components/sections/whychooseus/WhyChooseUsFour.tsx",
  "WhyChooseUs-5": "components/sections/whychooseus/RealEstateWhyChooseUs1.tsx",
  "WhyChooseUs-6": "components/sections/whychooseus/RealEstateWhyChooseUs2.tsx",
  "Gallery-1": "components/sections/gallery/GalleryOne.tsx",
  "Gallery-2": "components/sections/gallery/GalleryTwo.tsx",
  "Gallery-3": "components/sections/gallery/GalleryThree.tsx",
  "Gallery-4": "components/sections/gallery/GalleryFour.tsx",
  "Gallery-5": "components/sections/gallery/GalleryFive.tsx",
  "Gallery-6": "components/sections/gallery/GallerySix.tsx",
  "Gallery-7": "components/sections/gallery/RealEstateGallery1.tsx",
  "Gallery-8": "components/sections/gallery/RealEstateGallery2.tsx",
  "CountriesServe-1": "components/sections/countriesserve/CountriesServeOne.tsx",
  "CountriesServe-2": "components/sections/countriesserve/CountriesServeOne.tsx",
  "CountriesServe-3": "components/sections/countriesserve/CountriesServeOne.tsx",
  "CountriesServe-4": "components/sections/countriesserve/CountriesServeOne.tsx",
  "FormDetail-1": "components/sections/formdetail/FormDetailOne.tsx",
  "FormDetail-2": "components/sections/formdetail/FormDetailTwo.tsx",
  "FormDetail-3": "components/sections/formdetail/FormDetailThree.tsx",
  "FormDetail-4": "components/sections/formdetail/FormDetailFour.tsx",
  "FormDetail-5": "components/sections/formdetail/RealEstateFormDetail1.tsx",
  "FormDetail-6": "components/sections/formdetail/RealEstateFormDetail2.tsx",
  "FAQ-1": "components/sections/faq/FaqOne.tsx",
  "FAQ-2": "components/sections/faq/FaqTwo.tsx",
  "FAQ-3": "components/sections/faq/FaqThree.tsx",
  "FAQ-4": "components/sections/faq/FaqFour.tsx",
  "FAQ-5": "components/sections/faq/RealEstateFAQ1.tsx",
  "FAQ-6": "components/sections/faq/RealEstateFAQ2.tsx",
  "Testimonial-1": "components/sections/testimonial/TestimonialOne.tsx",
  "Testimonial-2": "components/sections/testimonial/TestimonialTwo.tsx",
  "Testimonial-3": "components/sections/testimonial/TestimonialThree.tsx",
  "Testimonial-4": "components/sections/testimonial/TestimonialOne.tsx",
  "Testimonial-5": "components/sections/testimonial/RealEstateTestimonial1.tsx",
  "Testimonial-6": "components/sections/testimonial/RealEstateTestimonial2.tsx",
  "Footer-1": "components/sections/footer/FooterOne.tsx",
  "Footer-2": "components/sections/footer/FooterOne.tsx",
  "Footer-3": "components/sections/footer/FooterOne.tsx",
  "Footer-4": "components/sections/footer/FooterOne.tsx",
  "Footer-5": "components/sections/footer/RealEstateFooter1.tsx",
  "Footer-6": "components/sections/footer/RealEstateFooter2.tsx",
  "Features-5": "components/sections/features/RealEstateFeatures1.tsx",
  "Highlight-5": "components/sections/highlight/RealEstateHighlight1.tsx",
  "Featured-5": "components/sections/featured/RealEstateFeatured1.tsx",
  "FeaturedDev-5": "components/sections/featured/RealEstateFeaturedDev1.tsx",
  "LatestProject-5": "components/sections/latest-project/RealEstateLatestProject1.tsx",
  "Cities-5": "components/sections/cities/RealEstateCities1.tsx",
  "Awards-5": "components/sections/awards/RealEstateAwards1.tsx",
  "Stats-5": "components/sections/stats/RealEstateStats1.tsx",
  "Process-5": "components/sections/process/RealEstateProcess1.tsx",
  "Blog-5": "components/sections/blog/RealEstateBlog1.tsx",
  "Contact-5": "components/sections/contact/RealEstateContact1.tsx",
  "Contact-6": "components/sections/contact/RealEstateContact1.tsx",
  "InvestmentOpportunities-5":
    "components/sections/investment/RealEstateInvestmentOpportunities1.tsx",
  "AboutPage-1": "components/sections/about/AboutPage.tsx",
  "AboutPage-2": "components/sections/about/AboutPageTwo.tsx",
  "AboutPage-3": "components/sections/about/AboutPageThree.tsx",
  "AboutPage-4": "components/sections/about/AboutPage.tsx",
  "AboutPage-5": "components/sections/about/RealEstateAboutPage1.tsx",
  "AboutPage-6": "components/sections/about/RealEstateAboutPage1.tsx",
  "ServicePage-1": "components/sections/service/ServicePage.tsx",
  "ServicePage-2": "components/sections/service/ServicePage.tsx",
  "ServicePage-3": "components/sections/service/ServicePage.tsx",
  "ServicePage-4": "components/sections/service/ServicePage.tsx",
  "ServicePage-5": "components/sections/service/RealEstateServicePage1.tsx",
  "ServicePage-6": "components/sections/service/RealEstateServicePage1.tsx",
  "EventPage-1": "components/sections/event/EventPage.tsx",
  "EventPage-2": "components/sections/event/EventPage.tsx",
  "EventPage-3": "components/sections/event/EventPage.tsx",
  "EventPage-4": "components/sections/event/EventPage.tsx",
  "PropertyPage-1": "components/sections/property/PropertyPage.tsx",
  "PropertyPage-2": "components/sections/property/PropertyPage.tsx",
  "PropertyPage-3": "components/sections/property/PropertyPage.tsx",
  "PropertyPage-4": "components/sections/property/PropertyPage.tsx",
  "PropertyPage-5": "components/sections/buy-a-property/RealEstateProperty1.tsx",
  "PropertyPage-6": "components/sections/buy-a-property/RealEstateProperty1.tsx",
  "PortfolioPage-1": "components/sections/portfolio/PortfolioPage.tsx",
  "PortfolioPage-2": "components/sections/portfolio/PortfolioPage.tsx",
  "PortfolioPage-3": "components/sections/portfolio/PortfolioPage.tsx",
  "PortfolioPage-4": "components/sections/portfolio/PortfolioPage.tsx",
  "PortfolioPage-5": "components/sections/projects/RealEstateProject1.tsx",
  "PortfolioPage-6": "components/sections/projects/RealEstateProject1.tsx",
  "TeamPage-1": "components/sections/team/TeamPage.tsx",
  "TeamPage-2": "components/sections/team/TeamPage.tsx",
  "TeamPage-3": "components/sections/team/TeamPage.tsx",
  "TeamPage-4": "components/sections/team/TeamPage.tsx",
  "GalleryPage-1": "components/sections/gallery/GalleryPage.tsx",
  "GalleryPage-2": "components/sections/gallery/GalleryPage.tsx",
  "GalleryPage-3": "components/sections/gallery/GalleryPage.tsx",
  "GalleryPage-4": "components/sections/gallery/GalleryPage.tsx",
  "GalleryPage-5": "components/sections/gallery/GalleryPage.tsx",
  "GalleryPage-6": "components/sections/gallery/RealEstateGalleryPage1.tsx",
  "ContactPage-1": "components/sections/contact/ContactPage.tsx",
  "ContactPage-2": "components/sections/contact/ContactPageTwo.tsx",
  "ContactPage-3": "components/sections/contact/ContactPage.tsx",
  "ContactPage-4": "components/sections/contact/ContactPageTwo.tsx",
  "ContactPage-5": "components/sections/contact/RealEstateContactPage1.tsx",
  "ContactPage-6": "components/sections/contact/RealEstateContactPage1.tsx",
  "AwardsPage-5": "components/sections/awards/RealEstateAwardsPage1.tsx",
  "AwardsPage-6": "components/sections/awards/RealEstateAwardsPage1.tsx",
  "MissionPage-5": "components/sections/mission-vision/RealEstateMissionVision1.tsx",
  "MissionPage-6": "components/sections/mission-vision/RealEstateMissionVision1.tsx",
  "MissionValues-5": "components/sections/mission-vision/RealEstateMissionValues1.tsx",
  "MissionValues-6": "components/sections/mission-vision/RealEstateMissionValues1.tsx",
  "CsrPage-5": "components/sections/csr/RealEstateCSRPage1.tsx",
  "CsrPage-6": "components/sections/csr/RealEstateCSRPage1.tsx",
  "CsrPrograms-5": "components/sections/csr/RealEstateCSRPrograms1.tsx",
  "CsrPrograms-6": "components/sections/csr/RealEstateCSRPrograms1.tsx",
  "CareerPage-5": "components/sections/career/RealEstateCareerPage1.tsx",
  "CareerPage-6": "components/sections/career/RealEstateCareerPage1.tsx",
  "CareerJobs-5": "components/sections/career/RealEstateCareerJobs1.tsx",
  "CareerJobs-6": "components/sections/career/RealEstateCareerJobs1.tsx",
  "RentPage-5": "components/sections/rent/RealEstateRent1.tsx",
  "RentPage-6": "components/sections/rent/RealEstateRent1.tsx",
  "BuyPropertyPage-5": "components/sections/buy-a-property/RealEstateProperty1.tsx",
  "BuyPropertyPage-6": "components/sections/buy-a-property/RealEstateProperty1.tsx",
  "SitemapPage-5": "components/sections/sitemap/RealEstateSitemap1.tsx",
  "SitemapPage-6": "components/sections/sitemap/RealEstateSitemap1.tsx",
  "PrivacyPage-5": "components/sections/privacy-policy/RealEstatePrivacyPolicy1.tsx",
  "PrivacyPage-6": "components/sections/privacy-policy/RealEstatePrivacyPolicy1.tsx",
  "TermsPage-5": "components/sections/terms-conditions/RealEstateTermsConditions1.tsx",
  "TermsPage-6": "components/sections/terms-conditions/RealEstateTermsConditions1.tsx",
  "DisclaimerPage-5": "components/sections/disclaimer/RealEstateDisclaimer1.tsx",
  "DisclaimerPage-6": "components/sections/disclaimer/RealEstateDisclaimer1.tsx",
  "CookiePolicyPage-5": "components/sections/cookie-policy/RealEstateCookiePolicy1.tsx",
  "CookiePolicyPage-6": "components/sections/cookie-policy/RealEstateCookiePolicy1.tsx",
  "RefundPolicyPage-5": "components/sections/refund-policy/RealEstateRefundPolicy1.tsx",
  "RefundPolicyPage-6": "components/sections/refund-policy/RealEstateRefundPolicy1.tsx",
  "CustomPage-1": "components/sections/custom/RealEstateCustomPage1.tsx",
  "CustomPage-2": "components/sections/custom/RealEstateCustomPage1.tsx",
  "CustomPage-3": "components/sections/custom/RealEstateCustomPage1.tsx",
  "CustomPage-4": "components/sections/custom/RealEstateCustomPage1.tsx",
  "CustomPage-5": "components/sections/custom/RealEstateCustomPage1.tsx",
  "CustomPage-6": "components/sections/custom/RealEstateCustomPage1.tsx",
  "Breadcrumb-1": "components/sections/breadcrumb/BreadcrumbOne.tsx",
  "Breadcrumb-2": "components/sections/breadcrumb/BreadcrumbTwo.tsx",
  "Breadcrumb-3": "components/sections/breadcrumb/BreadcrumbThree.tsx",
  "Breadcrumb-4": "components/sections/breadcrumb/BreadcrumbFour.tsx",
  "Breadcrumb-5": "components/sections/breadcrumb/RealEstateInnerBanner1.tsx",
  "Breadcrumb-6": "components/sections/breadcrumb/RealEstateInnerBanner1.tsx",
};

/** Always required by PublishedSiteClient / shared published shell. */
const CORE_INCLUDE = [
  "types/section.ts",
  "components/context/PreviewContext.tsx",
  "components/builder/InlineFormattedSection.tsx",
  "components/builder/InlineRichText.tsx",
  "lib/inlineTextFormatting.ts",
  "lib/sectionAnchors.ts",
  "lib/sectionScroll.ts",
  "lib/themeTokens.ts",
  "lib/leadFormFields.ts",
  "lib/FloatingActionButtons.tsx",
  "lib/floatingItems.ts",
];

type SiteFeatures = {
  blog: boolean;
  service: boolean;
  event: boolean;
  property: boolean;
  portfolio: boolean;
  team: boolean;
  gallery: boolean;
  country: boolean;
  custom: boolean;
};

function detectSiteFeatures(payload: PublishedSitePayload): SiteFeatures {
  const variants = collectUsedVariants(payload);
  const pages = collectUsedPageKeys(payload);
  const types = new Set(
    (payload.sections || []).map((section) => (section.type || "").trim()),
  );

  const hasVariantPrefix = (prefix: string) =>
    Array.from(variants).some((variant) => variant.startsWith(prefix));

  const hasLinkKind = (kind: string) =>
    (payload.pageLinks || []).some((link) => link.kind === kind && !link.hidden);

  return {
    blog:
      hasVariantPrefix("BlogPage") ||
      pages.has("blogs") ||
      pages.has("blog") ||
      hasLinkKind("blog") ||
      hasLinkKind("blogIndex") ||
      types.has("BlogPage"),
    service:
      hasVariantPrefix("ServicePage") ||
      pages.has("services") ||
      pages.has("service") ||
      types.has("Service") ||
      types.has("ServicePage"),
    event:
      hasVariantPrefix("EventPage") ||
      pages.has("events") ||
      pages.has("event") ||
      types.has("Event") ||
      types.has("EventPage"),
    property:
      hasVariantPrefix("PropertyPage") ||
      pages.has("properties") ||
      pages.has("property") ||
      types.has("Property") ||
      types.has("PropertyPage"),
    portfolio:
      hasVariantPrefix("PortfolioPage") ||
      pages.has("portfolio") ||
      types.has("Portfolio") ||
      types.has("PortfolioPage"),
    team:
      hasVariantPrefix("TeamPage") ||
      pages.has("teams") ||
      pages.has("team") ||
      types.has("Team") ||
      types.has("TeamPage"),
    gallery:
      hasVariantPrefix("GalleryPage") ||
      hasVariantPrefix("Gallery-") ||
      pages.has("gallery") ||
      types.has("Gallery") ||
      types.has("GalleryPage"),
    country: types.has("CountriesServe"),
    custom: hasVariantPrefix("CustomSection") || types.has("CustomSection"),
  };
}

function featureEntries(features: SiteFeatures): string[] {
  const files: string[] = [];
  if (features.blog) {
    files.push(
      "lib/blogLayouts.ts",
      "components/sections/blog/BlogDetailArticle.tsx",
      "components/sections/blog/BlogIndexList.tsx",
    );
  }
  if (features.service) {
    files.push(
      "lib/serviceLayouts.ts",
      "components/sections/service/ServiceDetailArticle.tsx",
    );
  }
  if (features.country) {
    files.push(
      "components/sections/countriesserve/RelatedCountryListingsSlider.tsx",
    );
    // Country detail pages reuse ServiceDetailArticle.
    if (!features.service) {
      files.push(
        "lib/serviceLayouts.ts",
        "components/sections/service/ServiceDetailArticle.tsx",
      );
    }
  }
  if (features.event) {
    files.push(
      "lib/eventLayouts.ts",
      "components/sections/event/EventDetailArticle.tsx",
    );
  }
  if (features.property) {
    files.push(
      "lib/propertyLayouts.ts",
      "lib/propertyAmenities.ts",
      "components/sections/property/PropertyDetailArticle.tsx",
    );
  }
  if (features.portfolio) {
    files.push(
      "lib/portfolioLayouts.ts",
      "components/sections/portfolio/PortfolioDetailArticle.tsx",
    );
  }
  if (features.team) {
    files.push(
      "lib/teamLayouts.ts",
      "components/sections/team/TeamDetailArticle.tsx",
    );
  }
  if (features.gallery) {
    files.push("lib/galleryLayouts.ts");
  }
  if (features.custom) {
    files.push("data/customSectionLayouts.ts");
  }
  return files;
}

/** Minimal stubs so PublishedSiteClient still compiles without unused features. */
function featureStubFiles(
  folderName: string,
  features: SiteFeatures,
): ZipFileEntry[] {
  const stubs: ZipFileEntry[] = [];
  const pushComponent = (name: string) => {
    stubs.push({
      path: `${folderName}/renderer/stubs/${name}.tsx`,
      content: `"use client";

/** Unused on this exported site — stub only. */
export default function ${name}(_props: Record<string, unknown>) {
  return null;
}
`,
    });
  };

  if (!features.blog) {
    pushComponent("BlogDetailArticle");
    pushComponent("BlogIndexList");
    stubs.push({
      path: `${folderName}/renderer/lib/blogLayouts.ts`,
      content: `export function normalizeBlogDetailLayout(value?: string) {
  return value || "blog-detail-1";
}
export function normalizeBlogIndexLayout(value?: string) {
  return value || "blog-index-1";
}
`,
    });
  }
  if (!features.service && !features.country) {
    pushComponent("ServiceDetailArticle");
    stubs.push({
      path: `${folderName}/renderer/lib/serviceLayouts.ts`,
      content: `export const DEFAULT_SERVICE_DETAIL_LAYOUT = "service-detail-1";
export function normalizeServiceDetailLayout(value?: string) {
  return value || DEFAULT_SERVICE_DETAIL_LAYOUT;
}
`,
    });
  }
  if (!features.country) {
    pushComponent("RelatedCountryListingsSlider");
  }
  if (!features.event) {
    pushComponent("EventDetailArticle");
    stubs.push({
      path: `${folderName}/renderer/lib/eventLayouts.ts`,
      content: `export const DEFAULT_EVENT_DETAIL_LAYOUT = "event-detail-1";
export function normalizeEventDetailLayout(value?: string) {
  return value || DEFAULT_EVENT_DETAIL_LAYOUT;
}
`,
    });
  }
  if (!features.property) {
    pushComponent("PropertyDetailArticle");
    stubs.push({
      path: `${folderName}/renderer/lib/propertyLayouts.ts`,
      content: `export const DEFAULT_PROPERTY_DETAIL_LAYOUT = "property-detail-1";
export function normalizePropertyDetailLayout(value?: string) {
  return value || DEFAULT_PROPERTY_DETAIL_LAYOUT;
}
`,
    });
    stubs.push({
      path: `${folderName}/renderer/lib/propertyAmenities.ts`,
      content: `export function parsePropertyAmenities(_value?: unknown) {
  return [] as string[];
}
`,
    });
  }
  if (!features.portfolio) {
    pushComponent("PortfolioDetailArticle");
    stubs.push({
      path: `${folderName}/renderer/lib/portfolioLayouts.ts`,
      content: `export const DEFAULT_PORTFOLIO_DETAIL_LAYOUT = "portfolio-detail-1";
export function normalizePortfolioDetailLayout(value?: string) {
  return value || DEFAULT_PORTFOLIO_DETAIL_LAYOUT;
}
`,
    });
  }
  if (!features.team) {
    pushComponent("TeamDetailArticle");
    stubs.push({
      path: `${folderName}/renderer/lib/teamLayouts.ts`,
      content: `export const DEFAULT_TEAM_DETAIL_LAYOUT = "team-detail-1";
export function normalizeTeamDetailLayout(value?: string) {
  return value || DEFAULT_TEAM_DETAIL_LAYOUT;
}
`,
    });
  }
  if (!features.gallery) {
    stubs.push({
      path: `${folderName}/renderer/lib/galleryLayouts.ts`,
      content: `export function normalizeGalleryIndexLayout(value?: string) {
  return value || "gallery-index-1";
}
`,
    });
  }

  return stubs;
}

/** Rewrite PublishedSiteClient imports for features this site does not use. */
export function rewriteUnusedFeatureImports(
  clientSource: string,
  payload: PublishedSitePayload,
): string {
  const features = detectSiteFeatures(payload);
  let next = clientSource;

  const remap = (from: string, stubName: string) => {
    next = next.replaceAll(from, `@/renderer/stubs/${stubName}`);
  };

  if (!features.blog) {
    remap("@/renderer/components/sections/blog/BlogDetailArticle", "BlogDetailArticle");
    remap("@/renderer/components/sections/blog/BlogIndexList", "BlogIndexList");
  }
  if (!features.service && !features.country) {
    remap(
      "@/renderer/components/sections/service/ServiceDetailArticle",
      "ServiceDetailArticle",
    );
  }
  if (!features.country) {
    remap(
      "@/renderer/components/sections/countriesserve/RelatedCountryListingsSlider",
      "RelatedCountryListingsSlider",
    );
  }
  if (!features.event) {
    remap(
      "@/renderer/components/sections/event/EventDetailArticle",
      "EventDetailArticle",
    );
  }
  if (!features.property) {
    remap(
      "@/renderer/components/sections/property/PropertyDetailArticle",
      "PropertyDetailArticle",
    );
  }
  if (!features.portfolio) {
    remap(
      "@/renderer/components/sections/portfolio/PortfolioDetailArticle",
      "PortfolioDetailArticle",
    );
  }
  if (!features.team) {
    remap(
      "@/renderer/components/sections/team/TeamDetailArticle",
      "TeamDetailArticle",
    );
  }

  return next;
}

const EXCLUDE_BASENAMES = new Set([
  "EditableSection.tsx",
  "EditSectionModal.tsx",
  "CustomSectionRichTextEditor.tsx",
  "ImageLibraryPicker.tsx",
  "categoryContent.json",
  "selectedConfig.ts",
  "templateFlow.ts",
]);

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^"'();]+?\s+from\s+)?["'](\.[^"']+)["']/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveModule(absFromFile: string, spec: string) {
  const base = path.resolve(path.dirname(absFromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return candidate;
    }
  }
  return null;
}

async function collectImportClosure(
  srcRoot: string,
  entryRelPaths: string[],
): Promise<Set<string>> {
  const needed = new Set<string>();
  const queue = [...entryRelPaths];

  while (queue.length) {
    const rel = queue.pop()!.replace(/\\/g, "/");
    if (needed.has(rel)) continue;
    const abs = path.join(srcRoot, rel);
    if (!(await fileExists(abs))) continue;
    if (EXCLUDE_BASENAMES.has(path.basename(abs))) continue;
    needed.add(rel);

    if (!/\.(tsx?|jsx?)$/i.test(abs)) continue;
    const source = await fs.readFile(abs, "utf8");
    IMPORT_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = IMPORT_RE.exec(source))) {
      const resolved = await resolveModule(abs, match[1]);
      if (!resolved) continue;
      const resolvedRel = path.relative(srcRoot, resolved).replace(/\\/g, "/");
      if (resolvedRel.startsWith("..")) continue;
      if (EXCLUDE_BASENAMES.has(path.basename(resolved))) continue;
      if (!needed.has(resolvedRel)) queue.push(resolvedRel);
    }
  }

  return needed;
}

function collectUsedVariants(payload: PublishedSitePayload) {
  const variants = new Set<string>();
  for (const section of payload.sections || []) {
    if (section.variant?.trim()) variants.add(section.variant.trim());
  }
  return variants;
}

function pageKeyFromHref(href: string, label: string) {
  const raw = href.trim();
  const lower = raw.toLowerCase();
  if (!raw || raw === "#" || lower === "#home") return "home";
  if (lower.startsWith("#page-")) {
    return normalizePageSeoKey(raw.slice("#page-".length));
  }
  if (lower.startsWith("#")) return "";
  return normalizePageSeoKey(label || raw);
}

function expandPageAliases(key: string) {
  const normalized = normalizePageSeoKey(key);
  const keys = new Set<string>([normalized]);
  const pairs: Array<[string, string]> = [
    ["services", "service"],
    ["events", "event"],
    ["properties", "property"],
    ["teams", "team"],
    ["blogs", "blog"],
  ];
  for (const [a, b] of pairs) {
    if (normalized === a || normalized === b) {
      keys.add(a);
      keys.add(b);
    }
  }
  return keys;
}

function collectUsedPageKeys(payload: PublishedSitePayload) {
  const keys = new Set<string>(["home"]);

  const addKey = (value: string) => {
    for (const key of expandPageAliases(value)) keys.add(key);
  };

  const walk = (links: PublishedSitePayload["pageLinks"] | undefined) => {
    for (const link of links || []) {
      if (link.hidden) continue;
      const key = pageKeyFromHref(link.href || "", link.label || "");
      if (key) addKey(key);
      if (link.kind === "blogIndex") {
        addKey("blogs");
        addKey("blog");
      }
      if (link.children?.length) walk(link.children);
    }
  };
  walk(payload.pageLinks);

  return keys;
}

function slimSectionData(section: PublishedSitePayload["sections"][number]) {
  if (!section.data || !isRecord(section.data)) return section;
  const variant = section.variant?.trim();
  if (variant && isRecord(section.data[variant])) {
    return {
      ...section,
      data: { [variant]: section.data[variant] },
    };
  }
  // Keep only first data key if variant missing
  const firstKey = Object.keys(section.data)[0];
  if (!firstKey) return { ...section, data: {} };
  return {
    ...section,
    data: { [firstKey]: section.data[firstKey] },
  };
}

/** Keep only pages linked in nav + home; drop unused draft pages/sections. */
export function slimPublishedPayloadForExport(
  payload: PublishedSitePayload,
): PublishedSitePayload {
  const usedPages = collectUsedPageKeys(payload);
  const sections = (payload.sections || [])
    .filter((section) => {
      const page = section.page?.trim();
      if (!page) return true;
      return usedPages.has(normalizePageSeoKey(page));
    })
    .map(slimSectionData);

  const pageLinks = (payload.pageLinks || []).filter((link) => !link.hidden);

  return {
    ...payload,
    sections,
    pageLinks,
  };
}

function buildSlimSectionRegistry(usedVariants: Set<string>) {
  const imports = new Map<string, string>();
  const entries: string[] = [];

  for (const variant of Array.from(usedVariants).sort()) {
    const file = VARIANT_FILE[variant];
    if (!file) continue;
    const importName =
      "Cmp_" +
      variant.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const importPath = "@/renderer/" + file.replace(/\.tsx?$/, "");
    imports.set(importName, importPath);
    entries.push(`  ${JSON.stringify(variant)}: ${importName},`);
  }

  const importLines = Array.from(imports.entries())
    .map(
      ([name, from]) =>
        `import ${name} from ${JSON.stringify(from)};`,
    )
    .join("\n");

  return `import { ComponentType } from "react";
import { SectionProps } from "@/renderer/types/section";
${importLines}

/** Only section variants used by this exported website. */
export const sectionRegistry: Record<string, ComponentType<SectionProps>> = {
${entries.join("\n")}
};

export function resolveSectionComponent(
  variantKey: string,
): ComponentType<SectionProps> | undefined {
  if (sectionRegistry[variantKey]) return sectionRegistry[variantKey];
  const lower = variantKey.toLowerCase();
  const matchKey = Object.keys(sectionRegistry).find(
    (key) => key.toLowerCase() === lower,
  );
  return matchKey ? sectionRegistry[matchKey] : undefined;
}
`;
}

function editorUiStub(name: string) {
  return `"use client";

/** Export stub — editor UI is not shipped. */
export default function ${name}() {
  return null;
}
`;
}

/**
 * Pack only the renderer files required by this site's used section variants.
 */
export async function collectUsedRendererFiles(options: {
  srcRoot: string;
  folderName: string;
  payload: PublishedSitePayload;
  templateFlowContent: string;
}): Promise<ZipFileEntry[]> {
  const usedVariants = collectUsedVariants(options.payload);
  const features = detectSiteFeatures(options.payload);
  const entryRels = new Set<string>([
    ...CORE_INCLUDE,
    ...featureEntries(features),
  ]);

  for (const variant of usedVariants) {
    const file = VARIANT_FILE[variant];
    if (file) entryRels.add(file);
  }

  const needed = await collectImportClosure(
    options.srcRoot,
    Array.from(entryRels),
  );

  const files: ZipFileEntry[] = [];
  for (const rel of Array.from(needed).sort()) {
    const abs = path.join(options.srcRoot, rel);
    files.push({
      path: `${options.folderName}/renderer/${rel}`.replace(/\\/g, "/"),
      content: await fs.readFile(abs),
    });
  }

  files.push(
    {
      path: `${options.folderName}/renderer/lib/sectionRegistry.ts`,
      content: buildSlimSectionRegistry(usedVariants),
    },
    {
      path: `${options.folderName}/renderer/data/templateFlow.ts`,
      content: options.templateFlowContent,
    },
    ...featureStubFiles(options.folderName, features),
  );

  if (features.custom) {
    files.push(
      {
        path: `${options.folderName}/renderer/components/builder/ImageLibraryPicker.tsx`,
        content: editorUiStub("ImageLibraryPicker"),
      },
      {
        path: `${options.folderName}/renderer/components/sections/custom/CustomSectionRichTextEditor.tsx`,
        content: editorUiStub("CustomSectionRichTextEditor"),
      },
    );
  }

  return files;
}
