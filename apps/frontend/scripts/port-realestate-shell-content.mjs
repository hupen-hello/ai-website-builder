/**
 * Port old RealEstate Topbar/Header/Footer into *-5/*-6 keys
 * and ensure Realestate content matches Vercel template-1.
 */
import fs from "fs";

const MONO =
  "C:/css-ai-builder-monorepo/apps/frontend/app/editor/layout/src/data/categoryContent.json";
const OLD =
  "C:/Users/TECH DOMINE IT SOLU/Desktop/ai-builder-main/ai-builder-main/app/editor/layout/src/data/categoryContent.json";

const mono = JSON.parse(fs.readFileSync(MONO, "utf8"));
const old = JSON.parse(fs.readFileSync(OLD, "utf8"));
const oldSecs = old.categories.Realestate.sections;
const re = mono.categories.Realestate.sections;

const pick = (section, variant) => oldSecs[section]?.variants?.[variant];

const topbar = pick("Topbar", "RealEstateTopbar1");
const header = pick("Header", "RealEstateHeader1");
const footer = pick("Footer", "RealEstateFooter1");

re.Topbar = {
  ...(typeof re.Topbar === "object" && re.Topbar ? re.Topbar : {}),
  "Topbar-5": topbar,
  "Topbar-6": topbar,
};
re.Header = {
  ...(typeof re.Header === "object" && re.Header ? re.Header : {}),
  "Header-5": header,
  "Header-6": header,
};
re.Footer = {
  ...(typeof re.Footer === "object" && re.Footer ? re.Footer : {}),
  "Footer-5": footer,
  "Footer-6": footer,
};

// Ensure Banner-5 keeps old RealEstate banner copy (including pinimg if present)
const banner1 = pick("Banner", "RealEstateBanner1");
if (banner1) {
  re.Banner = {
    ...(re.Banner || {}),
    "Banner-5": {
      ...banner1,
      // Prefer local hero images so Next Image never crashes on card preview
      backgroundImage: "/categories/realestate/bg1.jpg",
      backgroundImageTitle:
        banner1.backgroundImageTitle || "Premium Delhi NCR residence",
    },
    "Banner-6": {
      ...banner1,
      backgroundImage: "/categories/realestate/bg2.jpg",
      backgroundImageTitle:
        banner1.backgroundImageTitle || "Luxury residential exterior",
    },
  };
}

fs.writeFileSync(MONO, JSON.stringify(mono, null, 2) + "\n");
console.log("Topbar-5 phone", re.Topbar["Topbar-5"]?.phone);
console.log("Header-5 logo", re.Header["Header-5"]?.logo);
console.log("Footer-5 logo", re.Footer["Footer-5"]?.logo);
console.log("Banner-5 title", re.Banner["Banner-5"]?.title);
