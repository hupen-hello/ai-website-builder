import fs from "fs";

const path =
  "C:/css-ai-builder-monorepo/apps/frontend/app/editor/layout/src/data/categoryContent.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const t5 = doc.templates.find((t) => t.id === "template-realestate-5");

t5.type = "Multiple Pages Website";
t5.title = "Realestate · Template 1 Premium";
t5.preview_description =
  "Vercel template-1 parity — multi-page Haus Group RealEstate with full home sections.";
t5.prebuilt_pages = 6;
t5.pages = [
  { id: "about", label: "About", sectionType: "AboutPage" },
  { id: "properties", label: "Properties", sectionType: "PropertyPage" },
  { id: "projects", label: "Projects", sectionType: "PortfolioPage" },
  { id: "services", label: "Services", sectionType: "ServicePage" },
  { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
  { id: "contact", label: "Contact", sectionType: "ContactPage" },
];
t5.sectionVariants = {
  ...t5.sectionVariants,
  Breadcrumb: "Breadcrumb-5",
  AboutPage: "AboutPage-5",
  PropertyPage: "PropertyPage-1",
  PortfolioPage: "PortfolioPage-1",
  ServicePage: "ServicePage-5",
  GalleryPage: "GalleryPage-6",
  ContactPage: "ContactPage-5",
};

const mapHref = (href) => {
  if (!href || href === "#" || href === "/") return "#";
  const cleaned = String(href).replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const slug = cleaned.replace(/^\/+/, "").split("/")[0];
  if (!slug) return "#";
  const known = {
    about: "about",
    awards: "about",
    mission: "about",
    community: "about",
    careers: "about",
    properties: "properties",
    "buy-a-property": "properties",
    rent: "properties",
    projects: "projects",
    services: "services",
    blog: "blogs",
    blogs: "blogs",
    gallery: "gallery",
    contact: "contact",
  };
  const id = known[slug] || slug;
  if (id === "blogs") return "#page-blogs";
  return `#page-${id}`;
};

const mapItems = (items) =>
  (items || []).map((item) => ({
    ...item,
    href: mapHref(item.href),
    children: Array.isArray(item.children)
      ? mapItems(item.children)
      : undefined,
  }));

const header = doc.categories.Realestate.sections.Header;
if (header?.["Header-5"]?.menu) {
  header["Header-5"].menu = mapItems(header["Header-5"].menu);
  header["Header-6"] = {
    ...header["Header-5"],
    menu: mapItems(JSON.parse(JSON.stringify(header["Header-5"].menu))),
  };
}

fs.writeFileSync(path, JSON.stringify(doc, null, 2) + "\n");
console.log("type", t5.type);
console.log("pages", t5.pages.map((p) => p.id).join(", "));
console.log(
  "menu",
  header["Header-5"].menu.map((m) => `${m.label}:${m.href}`).join(" | "),
);
