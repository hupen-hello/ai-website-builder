import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(
  __dirname,
  "../app/editor/layout/src/data/categoryContent.json",
);
const oldPath =
  "C:/Users/TECH DOMINE IT SOLU/Desktop/ai-builder-main/ai-builder-main/app/editor/layout/src/data/categoryContent.json";

const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const old = fs.existsSync(oldPath)
  ? JSON.parse(fs.readFileSync(oldPath, "utf8"))
  : { common: {} };

const re = doc.categories.Realestate.sections;
const oldCommon = old.common || {};
const listings = structuredClone(re.Featured?.listings ?? []);

const copyPage = (fromKey, toKey) => {
  const src = structuredClone(oldCommon[fromKey] || re[toKey] || {});
  if (!src || typeof src !== "object") return;
  re[toKey] = src;
};

copyPage("AwardsPage", "AwardsPage");
copyPage("MissionPage", "MissionPage");
copyPage("CsrPage", "CsrPage");
copyPage("CareerPage", "CareerPage");
copyPage("SitemapPage", "SitemapPage");
copyPage("PrivacyPage", "PrivacyPage");
copyPage("TermsPage", "TermsPage");
copyPage("DisclaimerPage", "DisclaimerPage");
copyPage("CookiePolicyPage", "CookiePolicyPage");
copyPage("RefundPolicyPage", "RefundPolicyPage");

re.BlogPage = {
  pretitle: re.Blog?.pretitle || "Blog",
  title: re.Blog?.title || "Latest insights from the market.",
  desc: re.Blog?.desc || "",
  blogItems: structuredClone(re.Blog?.blogItems ?? []),
};

re.RentPage = {
  pretitle: "Explore",
  title: "Rent",
  desc: "Verified rentals across Delhi NCR with clear pricing and same-week visits.",
  listings,
};

re.BuyPropertyPage = structuredClone(re.PropertyPage || {
  pretitle: "Explore",
  title: "Buy a Property",
  desc: "Browse verified homes for sale across Delhi NCR with clear pricing and same-week site visits.",
  listings,
});

const headerMenu = [
  { label: "Home", href: "#" },
  {
    label: "About",
    href: "#page-about",
    children: [
      { label: "Awards", href: "#page-awards" },
      { label: "Mission & vision", href: "#page-mission" },
      { label: "CSR Initiatives", href: "#page-community" },
      { label: "Careers", href: "#page-careers" },
      { label: "Sitemap", href: "#page-sitemap" },
    ],
  },
  {
    label: "Properties",
    href: "#page-properties",
    children: [
      { label: "Buy a Property", href: "#page-buy-a-property" },
      { label: "Rent a Property", href: "#page-rent" },
      { label: "Sale a Property", href: "#page-properties" },
    ],
  },
  { label: "Projects", href: "#page-projects" },
  { label: "Services", href: "#page-services" },
  { label: "Blogs", href: "#page-blog" },
];

if (re.Header?.["Header-5"]) re.Header["Header-5"].menu = headerMenu;
if (re.Header?.["Header-6"]) re.Header["Header-6"].menu = headerMenu;

const extraVariants = {
  AwardsPage: "AwardsPage-5",
  MissionPage: "MissionPage-5",
  CsrPage: "CsrPage-5",
  CareerPage: "CareerPage-5",
  RentPage: "RentPage-5",
  BuyPropertyPage: "BuyPropertyPage-5",
  BlogPage: "BlogPage-6",
  SitemapPage: "SitemapPage-5",
  PrivacyPage: "PrivacyPage-5",
  TermsPage: "TermsPage-5",
  DisclaimerPage: "DisclaimerPage-5",
  CookiePolicyPage: "CookiePolicyPage-5",
  RefundPolicyPage: "RefundPolicyPage-5",
};

const extraPages = [
  { id: "about", label: "About", sectionType: "AboutPage" },
  { id: "awards", label: "Awards", sectionType: "AwardsPage" },
  { id: "mission", label: "Mission & vision", sectionType: "MissionPage" },
  { id: "community", label: "CSR Initiatives", sectionType: "CsrPage" },
  { id: "careers", label: "Careers", sectionType: "CareerPage" },
  { id: "sitemap", label: "Sitemap", sectionType: "SitemapPage" },
  { id: "properties", label: "Sale a Property", sectionType: "PropertyPage" },
  { id: "buy-a-property", label: "Buy a Property", sectionType: "BuyPropertyPage" },
  { id: "rent", label: "Rent a Property", sectionType: "RentPage" },
  { id: "projects", label: "Projects", sectionType: "PortfolioPage" },
  { id: "services", label: "Services", sectionType: "ServicePage" },
  { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
  { id: "blog", label: "Blogs", sectionType: "BlogPage" },
  { id: "contact", label: "Contact", sectionType: "ContactPage" },
  { id: "privacy", label: "Privacy Policy", sectionType: "PrivacyPage" },
  { id: "terms", label: "Terms & Conditions", sectionType: "TermsPage" },
  { id: "disclaimer", label: "Disclaimer", sectionType: "DisclaimerPage" },
  { id: "cookie-policy", label: "Cookie Policy", sectionType: "CookiePolicyPage" },
  { id: "refund-policy", label: "Refund Policy", sectionType: "RefundPolicyPage" },
];

const t5 = doc.templates.find((t) => t.id === "template-realestate-5");
if (t5) {
  Object.assign(t5.sectionVariants, extraVariants);
  t5.pages = extraPages;
  t5.prebuilt_pages = extraPages.length;
}

fs.writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`);
console.log(
  `Wired ${extraPages.length} Realestate pages + header dropdowns`,
);
