// One-off import. Do not run again.
// Service components live in the existing section folders
// (header/ServiceHeader1.tsx, about/ServiceAboutPage.tsx, blog/ServiceBlogSection.tsx, …).
// See docs/any-template-playbook.md. Do not recreate sections/appliance.
import fs from "fs";
import path from "path";

const repo = "E:/lestow/appliance-repair";
const frontend = path.resolve("apps/frontend");
const dest = path.join(
  frontend,
  "app/editor/layout/src/components/sections/appliance",
);
const raw = JSON.parse(
  fs.readFileSync(path.join(repo, "data/templates.json"), "utf8"),
);
const sections = raw.categories.HVAC.sections;
const common = raw.common;

const variant = (section, key) => sections[section].variants[key];

function copyTree(src, destDir) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

const assetDirs = [
  "about",
  "award",
  "banner",
  "blog",
  "case",
  "certificate",
  "choose",
  "gallery",
  "main logo",
  "mission",
  "other",
  "partner",
  "project",
  "service",
  "team",
];
const publicRoot = path.join(frontend, "public");
for (const dir of assetDirs) {
  copyTree(path.join(repo, "public", dir), path.join(publicRoot, dir));
}

fs.mkdirSync(dest, { recursive: true });
fs.copyFileSync(
  path.join(repo, "types/templates.types.ts"),
  path.join(dest, "applianceTypes.ts"),
);

const sources = [
  ...fs
    .readdirSync(path.join(repo, "components/common"))
    .map((name) => path.join(repo, "components/common", name)),
  ...fs
    .readdirSync(path.join(repo, "components/sections"))
    .map((name) => path.join(repo, "components/sections", name)),
];

for (const file of sources) {
  let text = fs.readFileSync(file, "utf8");
  text = text.replaceAll(
    "@/types/templates.types",
    "./applianceTypes",
  );
  text = text.replaceAll(
    'import Link from "next/link";',
    'import { ApplianceLink as Link } from "./ApplianceLink";',
  );
  text = text.replaceAll(
    "import Link from 'next/link';",
    'import { ApplianceLink as Link } from "./ApplianceLink";',
  );
  text = text.replaceAll(
    'import { usePathname } from "next/navigation";',
    'import { useAppliancePathname as usePathname } from "./ApplianceLink";',
  );
  text = text.replaceAll(
    "import { usePathname } from 'next/navigation';",
    'import { useAppliancePathname as usePathname } from "./ApplianceLink";',
  );
  if (!text.startsWith("'use client'") && !text.startsWith('"use client"')) {
    text = `"use client";\n${text}`;
  }
  fs.writeFileSync(path.join(dest, path.basename(file)), text);
}

const header = variant("Header", "HVACHeader1");
const topbar = variant("TopBar", "HVACTopBar1");
const footer = common.Footer;
const hero = variant("Hero", "HVACHero1");
const about = variant("AboutUs", "HVACAboutUs1");
const services = variant("Services", "HVACServices1");
const achievement = variant("Achievement", "HVACAchievement1");
const blogs = variant("Blogs", "HVACBlogs1");
const testimonials = variant("Testimonials", "HVACTestimonials1");
const aboutFirm = { ...variant("AboutFirm", "HVACAboutFirm1"), hideButton: true };
const team = variant("Team", "HVACTeam1");
const faq = variant("Faq", "HVACFaq1");
const gallery = variant("Gallery", "HVACGallery1");
const contact = variant("Contact", "HVACContact1");
const enquiry = variant("Enquiry", "HVACEnquiry1");
const serviceDetail =
  sections.ServiceDetail.variants["HVAC & AC-installation"];
const blogDetail = blogs.blogs?.[0] || {};
const crumb = (data) => ({
  title: data?.title || "",
  bgImage: data?.bgImage || "/main logo/breadcrumb.jpg",
  paths: data?.paths || [],
});

const sectionVariants = {
  Header: "Header-10",
  Banner: "Banner-10",
  About: "About-10",
  Product: "Product-10",
  Stats: "Stats-10",
  Blog: "Blog-10",
  Testimonial: "Testimonial-10",
  Footer: "Footer-10",
  Breadcrumb: "Breadcrumb-10",
  AboutPage: "AboutPage-10",
  Team: "Team-10",
  FAQ: "FAQ-10",
  ServicePage: "ServicePage-10",
  ServiceDetail: "ServiceDetail-10",
  GalleryPage: "GalleryPage-10",
  BlogPage: "BlogPage-10",
  BlogDetail: "BlogDetail-10",
  ContactPage: "ContactPage-10",
  EnquiryPage: "EnquiryPage-10",
  ErrorPage: "ErrorPage-10",
};

const template = {
  id: "template-service-1",
  numericId: 16,
  title: "Service · AviCare",
  type: "Multiple Pages Website",
  image: "/banner/banner.webp",
  previewimage: "/banner/banner.webp",
  preview_description: "AviCare appliance repair multi-page theme.",
  prebuilt_pages: 10,
  sectionVariants,
  variables: {
    "--color-bg-main": "#ffffff",
    "--color-bg-card": "#ffffff",
    "--color-bg-alt": "#f0f7ff",
    "--color-primary": "#051c4a",
    "--color-accent": "#007bff",
    "--color-accent-light": "#66b0ff",
    "--color-text": "#1a202c",
    "--color-text-light": "#4a5568",
    "--color-border": "#e2e8f0",
    "--font-heading": "Poppins, sans-serif",
    "--font-body": "Poppins, sans-serif",
    "--font-poppins": "Poppins, sans-serif",
    "--primary-bg": "#007bff",
    "--primary-text": "#ffffff",
    "--secondary-bg": "#ffffff",
    "--secondary-text": "#051c4a",
    "--header-bg": "#ffffff",
    "--header-text": "#051c4a",
    "--hero-bg": "#051c4a",
    "--hero-title": "#ffffff",
  },
  homeSectionOrder: [
    "Header",
    "Banner",
    "About",
    "Product",
    "Stats",
    "Blog",
    "Testimonial",
    "Footer",
  ],
  pages: [
    { id: "about", label: "About Us", sectionType: "AboutPage" },
    { id: "services", label: "Services", sectionType: "ServicePage" },
    { id: "service-detail", label: "Service Detail", sectionType: "ServiceDetail" },
    { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
    { id: "blog", label: "Blog", sectionType: "BlogPage" },
    { id: "blog-detail", label: "Blog Detail", sectionType: "BlogDetail" },
    { id: "contact", label: "Contact", sectionType: "ContactPage" },
    { id: "enquiry", label: "Enquiry", sectionType: "EnquiryPage" },
    { id: "404", label: "404", sectionType: "ErrorPage" },
  ],
  pageCompanions: {
    about: ["Breadcrumb", "Stats", "Team", "FAQ"],
    services: ["Breadcrumb"],
    "service-detail": ["Breadcrumb"],
    gallery: ["Breadcrumb"],
    blog: ["Breadcrumb"],
    "blog-detail": ["Breadcrumb"],
    contact: ["Breadcrumb"],
    enquiry: ["Breadcrumb"],
    "404": ["Breadcrumb"],
  },
};

const pack = {
  Header: { "Header-10": header },
  Banner: { "Banner-10": hero },
  About: { "About-10": about },
  Product: { "Product-10": services },
  Stats: { "Stats-10": achievement },
  Blog: { "Blog-10": blogs },
  Testimonial: { "Testimonial-10": testimonials },
  Footer: { "Footer-10": { ...footer, logo: header.logo, logoAlt: header.logoAlt } },
  Breadcrumb: { "Breadcrumb-10": crumb(common.aboutBreadcrumb) },
  AboutPage: { "AboutPage-10": aboutFirm },
  Team: { "Team-10": team },
  FAQ: { "FAQ-10": faq },
  ServicePage: { "ServicePage-10": { ...services, hideButton: true } },
  ServiceDetail: { "ServiceDetail-10": serviceDetail },
  GalleryPage: { "GalleryPage-10": gallery },
  BlogPage: { "BlogPage-10": { ...blogs, isListingPage: true } },
  BlogDetail: { "BlogDetail-10": { blog: blogDetail } },
  ContactPage: { "ContactPage-10": contact },
  EnquiryPage: { "EnquiryPage-10": enquiry },
  ErrorPage: {
    "ErrorPage-10": {
      title: common.globalUI?.notFoundText || "Oops! Page Not Found",
      description:
        "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
    },
  },
};

const categoryPath = path.join(
  frontend,
  "app/editor/layout/src/data/categoryContent.json",
);
const category = JSON.parse(fs.readFileSync(categoryPath, "utf8"));
const index = category.templates.findIndex((item) => item.id === template.id);
if (index === -1) category.templates.push(template);
else category.templates[index] = template;

category.categories.Service = {
  slug: "service",
  icon: "wrench",
  description: "Build an appliance repair website",
  templates: ["template-service-1"],
  sections: pack,
};

fs.writeFileSync(categoryPath, JSON.stringify(category, null, 2) + "\n");
console.log("ported appliance components and merged Service category");
