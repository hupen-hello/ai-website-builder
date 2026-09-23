/**
 * One-shot helper: extract old ai-builder Realestate template-1 section
 * content into a JSON fragment for categoryContent merge.
 */
import fs from "fs";

const OLD =
  "C:/Users/TECH DOMINE IT SOLU/Desktop/ai-builder-main/ai-builder-main/app/editor/layout/src/data/categoryContent.json";
const OUT =
  "C:/css-ai-builder-monorepo/apps/frontend/scripts/realestate-template1-sections.json";

const old = JSON.parse(fs.readFileSync(OLD, "utf8"));
const secs = old.categories.Realestate.sections;

const pickVariant = (sectionKey, variantKey) =>
  secs[sectionKey]?.variants?.[variantKey] ?? null;

const props = pickVariant("Properties", "RealEstateProperties1") || {};

const highlight = {
  categoriesPretitle: props.categoriesPretitle || "Explore properties",
  categoriesTitle:
    props.categoriesTitle || "Find the right property for your next move.",
  categoriesDesc:
    props.categoriesDesc ||
    "Browse verified homes by intent and property type across Delhi NCR.",
  categories: (Array.isArray(props.listings) ? props.listings : [])
    .slice(0, 8)
    .map((l) => ({
      title: l.title || l.name || "Property",
      category: l.category || "Property",
      desc: l.desc || l.description || "",
      image: l.image,
      alt: l.alt || l.title || "Property",
      href: l.href || "/properties",
    }))
    .filter((c) => c.image),
};

const featured = {
  subtitle: props.subtitle || "Ready for site visits this week",
  sectionTitle: props.sectionTitle || "Featured Properties",
  title: props.title || "Signature Residences",
  description:
    props.description ||
    "Handpicked residences with strong amenities and verified documents.",
  listings: Array.isArray(props.listings) ? props.listings.slice(0, 8) : [],
};

const investment = {
  pretitle: "Invest",
  title: "Investment opportunities across Delhi NCR.",
  desc: "Yield-focused projects and ready inventory for long-term buyers.",
  items: (Array.isArray(props.listings) ? props.listings : [])
    .slice(0, 4)
    .map((l) => ({
      title: l.title || "Investment listing",
      desc: l.desc || l.description || "Strong rental and resale potential.",
      image: l.image,
      alt: l.alt || l.title || "Investment",
      yieldLabel: l.price || "Enquire",
      href: l.href || "/contact",
    })),
};

const out = {
  Features: pickVariant("Features", "RealEstateFeatures1"),
  Highlight: highlight,
  Featured: featured,
  LatestProject: pickVariant("LatestProjects", "RealEstateLatestProjects1"),
  Cities: pickVariant("CitiesWeServe", "RealEstateCitiesWeServe1"),
  WhyChooseUs: pickVariant("WhyChooseUs", "RealEstateWhyChooseUs1"),
  FeaturedDev: pickVariant(
    "FeaturedDevelopers",
    "RealEstateFeaturedDevelopers1",
  ),
  Process: pickVariant("PropertyProcess", "RealEstatePropertyProcess1"),
  Testimonial: pickVariant("Testimonial", "RealEstateTestimonial1"),
  Awards: pickVariant("Awards", "RealEstateAwards1"),
  Stats: pickVariant("CompanyStatistics", "RealEstateCompanyStatistics1"),
  Blog: pickVariant("Blog", "RealEstateBlog1"),
  FAQ: pickVariant("FAQ", "RealEstateFAQ1"),
  Contact: pickVariant("Contact", "RealEstateContact1"),
  InvestmentOpportunities: investment,
  Banner: pickVariant("Banner", "RealEstateBanner1"),
};

for (const [k, v] of Object.entries(out)) {
  console.log(k, v ? `ok keys=${Object.keys(v).join(",")}` : "MISSING");
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log("wrote", OUT);
