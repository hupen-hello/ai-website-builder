/**
 * Merge css-ai-builder-main1 Realestate template-5 into categoryContent.json.
 * Remaps template-realestate-6 colliding *-5 keys to *-6 so Haus T6 stays intact.
 */
import fs from "fs";

const destPath =
  "E:/lestow/css-ai-builder-monorepo/apps/frontend/app/editor/layout/src/data/categoryContent.json";
const srcPath =
  "E:/css-ai-builder-main1/app/editor/layout/src/data/categoryContent.json";

const dest = JSON.parse(fs.readFileSync(destPath, "utf8"));
const src = JSON.parse(fs.readFileSync(srcPath, "utf8"));
const srcSections = src.categories.Realestate.sections;
const destSections = dest.categories.Realestate.sections;

function clone(v) {
  return structuredClone(v);
}

const T6_REMAP = [
  "Features",
  "Highlight",
  "Featured",
  "LatestProject",
  "Cities",
  "FeaturedDev",
  "Process",
  "Awards",
  "Stats",
  "Blog",
  "InvestmentOpportunities",
  "Breadcrumb",
];

const t6 = dest.templates.find((t) => t.id === "template-realestate-6");
for (const type of T6_REMAP) {
  const fromKey = `${type}-5`;
  const toKey = `${type}-6`;
  const pack = destSections[type];
  if (pack && pack[fromKey] && !pack[toKey]) {
    pack[toKey] = clone(pack[fromKey]);
  }
  if (t6?.sectionVariants?.[type] === fromKey) {
    t6.sectionVariants[type] = toKey;
  }
}

const VARIANT_MAP = [
  ["Header", "RealEstateHeader5", "Header-5"],
  ["Footer", "RealEstateFooter5", "Footer-5"],
  ["Banner", "RealEstateBanner5", "Banner-5"],
  ["Features", "RealEstateFeatures5", "Features-5"],
  ["Product", "RealEstateProduct5", "Product-5"],
  ["Highlight", "RealEstateHighlight5", "Highlight-5"],
  ["LatestProjects", "RealEstateLatestProjects5", "LatestProject-5"],
  ["Testimonial", "RealEstateTestimonial5", "Testimonial-5"],
  ["Blog", "RealEstateBlog5", "Blog-5"],
  ["About", "RealEstateAboutPage5", "AboutPage-5"],
  ["Team", "RealEstateTeamPage5", "TeamPage-5"],
  ["Career", "RealEstateCareerPage5", "CareerPage-5"],
  ["Career", "RealEstateCareerJobs5", "CareerJobs-5"],
  ["Testimonial", "RealEstateTestimonialPage5", "TestimonialPage-5"],
  ["Awards", "RealEstateAwardPage5", "AwardsPage-5"],
  ["Partners", "RealEstatePartnerPage5", "PartnerPage-5"],
  ["Services", "RealEstateServicePage5", "ServicePage-5"],
  ["ServiceDetail", "RealEstateServiceDetailPage5", "ServiceDetail-5"],
  ["PropertyGrid", "RealEstatePropertyGrid5", "PropertyGrid-5"],
  ["PropertyDetail", "RealEstatePropertyDetailPage5", "PropertyDetail-5"],
  ["Gallery", "RealEstateGalleryPage5", "GalleryPage-5"],
  ["Blog", "RealEstateBlogPage5", "BlogPage-5"],
  ["BlogDetail", "RealEstateBlogDetailPage5", "BlogDetail-5"],
  ["Brochure", "RealEstateBrochurePage5", "BrochurePage-5"],
  ["Package", "RealEstatePackagePage5", "PackagePage-5"],
  ["Faq", "RealEstateFaqPage5", "FaqPage-5"],
  ["Contact", "RealEstateContactPage5", "ContactPage-5"],
  ["Quote", "RealEstateQuotePage5", "QuotePage-5"],
  ["Terms", "RealEstateTermsPage5", "TermsPage-5"],
  ["Privacy", "RealEstatePrivacyPage5", "PrivacyPage-5"],
  ["CookiePolicy", "RealEstateCookiePage5", "CookiePolicyPage-5"],
  ["Sitemap", "RealEstateSitemapPage5", "SitemapPage-5"],
  ["PropertyGrid", "RealEstateBreadCrumb5", "Breadcrumb-5"],
];

const DEST_TYPE = {
  "Header-5": "Header",
  "Footer-5": "Footer",
  "Banner-5": "Banner",
  "Features-5": "Features",
  "Product-5": "Product",
  "Highlight-5": "Highlight",
  "LatestProject-5": "LatestProject",
  "Testimonial-5": "Testimonial",
  "Blog-5": "Blog",
  "AboutPage-5": "AboutPage",
  "TeamPage-5": "TeamPage",
  "CareerPage-5": "CareerPage",
  "CareerJobs-5": "CareerJobs",
  "TestimonialPage-5": "TestimonialPage",
  "AwardsPage-5": "AwardsPage",
  "PartnerPage-5": "PartnerPage",
  "ServicePage-5": "ServicePage",
  "ServiceDetail-5": "ServiceDetail",
  "PropertyGrid-5": "PropertyGrid",
  "PropertyDetail-5": "PropertyDetail",
  "GalleryPage-5": "GalleryPage",
  "BlogPage-5": "BlogPage",
  "BlogDetail-5": "BlogDetail",
  "BrochurePage-5": "BrochurePage",
  "PackagePage-5": "PackagePage",
  "FaqPage-5": "FaqPage",
  "ContactPage-5": "ContactPage",
  "QuotePage-5": "QuotePage",
  "TermsPage-5": "TermsPage",
  "PrivacyPage-5": "PrivacyPage",
  "CookiePolicyPage-5": "CookiePolicyPage",
  "SitemapPage-5": "SitemapPage",
  "Breadcrumb-5": "Breadcrumb",
};

for (const [srcType, variantName, destKey] of VARIANT_MAP) {
  const bag = srcSections[srcType]?.variants?.[variantName];
  if (!bag) {
    console.log("skip missing", srcType, variantName);
    continue;
  }
  const destType = DEST_TYPE[destKey];
  if (!destSections[destType] || typeof destSections[destType] !== "object") {
    destSections[destType] = {};
  }
  destSections[destType][destKey] = clone(bag);
  console.log("wrote", destType, destKey);
}

const t5 = dest.templates.find((t) => t.id === "template-realestate-5");
if (!t5) throw new Error("template-realestate-5 missing");

t5.title = "Realestate · Template 5";
t5.type = "Multiple Pages Website";
t5.preview_description =
  "Multi-page RealEstate template 5 from css-ai-builder-main1 (original component names).";
t5.prebuilt_pages = 22;
t5.sectionVariants = {
  Header: "Header-5",
  Banner: "Banner-5",
  Features: "Features-5",
  Product: "Product-5",
  Highlight: "Highlight-5",
  LatestProject: "LatestProject-5",
  Testimonial: "Testimonial-5",
  Blog: "Blog-5",
  Footer: "Footer-5",
  Breadcrumb: "Breadcrumb-5",
  AboutPage: "AboutPage-5",
  TeamPage: "TeamPage-5",
  CareerPage: "CareerPage-5",
  CareerJobs: "CareerJobs-5",
  TestimonialPage: "TestimonialPage-5",
  AwardsPage: "AwardsPage-5",
  PartnerPage: "PartnerPage-5",
  ServicePage: "ServicePage-5",
  ServiceDetail: "ServiceDetail-5",
  PropertyGrid: "PropertyGrid-5",
  PropertyDetail: "PropertyDetail-5",
  GalleryPage: "GalleryPage-5",
  BlogPage: "BlogPage-5",
  BlogDetail: "BlogDetail-5",
  BrochurePage: "BrochurePage-5",
  PackagePage: "PackagePage-5",
  FaqPage: "FaqPage-5",
  ContactPage: "ContactPage-5",
  QuotePage: "QuotePage-5",
  TermsPage: "TermsPage-5",
  PrivacyPage: "PrivacyPage-5",
  CookiePolicyPage: "CookiePolicyPage-5",
  SitemapPage: "SitemapPage-5",
};
t5.homeSectionOrder = [
  "Header",
  "Banner",
  "Features",
  "Product",
  "Highlight",
  "LatestProject",
  "Testimonial",
  "Blog",
  "Footer",
];
t5.variables = {
  ...(t5.variables || {}),
  "--accent": "#ff6b00",
  "--primary-bg": "#ff6b00",
  "--primary-text": "#ffffff",
  "--secondary-link-bg": "#ff6b00",
  "--secondary-link-color": "#ffffff",
};
t5.pages = [
  { id: "about", label: "About", sectionType: "AboutPage" },
  { id: "teams", label: "Team", sectionType: "TeamPage" },
  { id: "career", label: "Career", sectionType: "CareerPage" },
  { id: "testimonial", label: "Testimonials", sectionType: "TestimonialPage" },
  { id: "awards", label: "Awards", sectionType: "AwardsPage" },
  { id: "partners", label: "Partners", sectionType: "PartnerPage" },
  { id: "services", label: "Services", sectionType: "ServicePage" },
  { id: "service-detail", label: "Service Detail", sectionType: "ServiceDetail" },
  { id: "properties", label: "Properties", sectionType: "PropertyGrid" },
  { id: "property-detail", label: "Property Detail", sectionType: "PropertyDetail" },
  { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
  { id: "blogs", label: "Blog", sectionType: "BlogPage" },
  { id: "blog-detail", label: "Blog Detail", sectionType: "BlogDetail" },
  { id: "brochure", label: "Brochure", sectionType: "BrochurePage" },
  { id: "package", label: "Package", sectionType: "PackagePage" },
  { id: "faq", label: "FAQ", sectionType: "FaqPage" },
  { id: "contact", label: "Contact", sectionType: "ContactPage" },
  { id: "quote", label: "Quote", sectionType: "QuotePage" },
  { id: "terms", label: "Terms", sectionType: "TermsPage" },
  { id: "privacy-policy", label: "Privacy Policy", sectionType: "PrivacyPage" },
  { id: "cookies-policy", label: "Cookie Policy", sectionType: "CookiePolicyPage" },
  { id: "sitemap", label: "Sitemap", sectionType: "SitemapPage" },
];
t5.pageCompanions = {
  about: ["Breadcrumb"],
  teams: ["Breadcrumb"],
  career: ["Breadcrumb", "CareerJobs"],
  testimonial: ["Breadcrumb"],
  awards: ["Breadcrumb"],
  partners: ["Breadcrumb"],
  services: ["Breadcrumb"],
  "service-detail": ["Breadcrumb"],
  properties: ["Breadcrumb"],
  "property-detail": ["Breadcrumb"],
  gallery: ["Breadcrumb"],
  blogs: ["Breadcrumb"],
  "blog-detail": ["Breadcrumb"],
  brochure: ["Breadcrumb"],
  package: ["Breadcrumb"],
  faq: ["Breadcrumb"],
  contact: ["Breadcrumb"],
  quote: ["Breadcrumb"],
  terms: ["Breadcrumb"],
  "privacy-policy": ["Breadcrumb"],
  "cookies-policy": ["Breadcrumb"],
  sitemap: ["Breadcrumb"],
};

fs.writeFileSync(destPath, JSON.stringify(dest, null, 2) + "\n");
console.log("merged template 5 + remapped T6 colliding keys");
