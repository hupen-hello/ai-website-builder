/**
 * Merge Realestate template-1 home composition + section content into categoryContent.json
 */
import fs from "fs";

const CAT =
  "C:/css-ai-builder-monorepo/apps/frontend/app/editor/layout/src/data/categoryContent.json";
const SECTIONS =
  "C:/css-ai-builder-monorepo/apps/frontend/scripts/realestate-template1-sections.json";

const doc = JSON.parse(fs.readFileSync(CAT, "utf8"));
const extracted = JSON.parse(fs.readFileSync(SECTIONS, "utf8"));

const HOME_ORDER = [
  "Topbar",
  "Header",
  "Banner",
  "Features",
  "Highlight",
  "Featured",
  "LatestProject",
  "Cities",
  "WhyChooseUs",
  "FeaturedDev",
  "Process",
  "Testimonial",
  "Awards",
  "Stats",
  "Blog",
  "FAQ",
  "Contact",
  "InvestmentOpportunities",
  "Footer",
];

const variants5 = {
  Topbar: "Topbar-5",
  Header: "Header-5",
  Banner: "Banner-5",
  Features: "Features-5",
  Highlight: "Highlight-5",
  Featured: "Featured-5",
  LatestProject: "LatestProject-5",
  Cities: "Cities-5",
  WhyChooseUs: "WhyChooseUs-5",
  FeaturedDev: "FeaturedDev-5",
  Process: "Process-5",
  Testimonial: "Testimonial-5",
  Awards: "Awards-5",
  Stats: "Stats-5",
  Blog: "Blog-5",
  FAQ: "FAQ-5",
  Contact: "Contact-5",
  InvestmentOpportunities: "InvestmentOpportunities-5",
  Footer: "Footer-5",
};

const variants6 = {
  Topbar: "Topbar-6",
  Header: "Header-6",
  Banner: "Banner-6",
  Features: "Features-5",
  Highlight: "Highlight-5",
  Featured: "Featured-5",
  LatestProject: "LatestProject-5",
  Cities: "Cities-5",
  WhyChooseUs: "WhyChooseUs-6",
  FeaturedDev: "FeaturedDev-5",
  Process: "Process-5",
  Testimonial: "Testimonial-6",
  Awards: "Awards-5",
  Stats: "Stats-5",
  Blog: "Blog-5",
  FAQ: "FAQ-6",
  Contact: "Contact-6",
  InvestmentOpportunities: "InvestmentOpportunities-5",
  Footer: "Footer-6",
  Breadcrumb: "Breadcrumb-5",
  AboutPage: "AboutPage-6",
  ServicePage: "ServicePage-6",
  GalleryPage: "GalleryPage-6",
  ContactPage: "ContactPage-6",
};

for (const t of doc.templates) {
  if (t.id === "template-realestate-5") {
    t.title = "Realestate · Template 1 Premium";
    t.preview_description =
      "Full RealEstate template-1 home: Features, Highlight, Cities, Awards, Blog, Contact, and more.";
    t.sectionVariants = variants5;
    t.homeSectionOrder = HOME_ORDER;
  }
  if (t.id === "template-realestate-6") {
    t.title = "Realestate · Template 1 Multi-page";
    t.preview_description =
      "Multi-page RealEstate template with full template-1 home section composition.";
    t.sectionVariants = variants6;
    t.homeSectionOrder = HOME_ORDER;
  }
}

const re = doc.categories.Realestate.sections;
for (const [type, data] of Object.entries(extracted)) {
  if (!data || typeof data !== "object") continue;
  if (type === "Banner") {
    // Keep existing flat Banner for templates 1–4; add premium variants.
    re.Banner = {
      ...(re.Banner || {}),
      "Banner-5": data,
      "Banner-6": data,
    };
    continue;
  }
  if (type === "WhyChooseUs" || type === "FAQ" || type === "Testimonial") {
    // Prefer template-1 copy on *-5/*-6 without wiping shared flat content.
    const existing = re[type] && typeof re[type] === "object" ? re[type] : {};
    re[type] = {
      ...existing,
      [`${type}-5`]: data,
      [`${type}-6`]: data,
    };
    continue;
  }
  re[type] = data;
}

fs.writeFileSync(CAT, JSON.stringify(doc, null, 2) + "\n");
console.log("Updated categoryContent.json");
console.log(
  "template-5 variants",
  Object.keys(
    doc.templates.find((t) => t.id === "template-realestate-5").sectionVariants,
  ),
);
console.log(
  "Realestate section keys sample",
  Object.keys(doc.categories.Realestate.sections).filter((k) =>
    /Features|Highlight|Cities|Awards|Investment|Contact|Stats|Process|Blog|Featured/.test(
      k,
    ),
  ),
);
