import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(
  __dirname,
  "../app/editor/layout/src/data/categoryContent.json",
);

const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const reSections = doc.categories.Realestate.sections;
const listings = structuredClone(reSections.Featured?.listings ?? []);
const projectItems = structuredClone(reSections.LatestProject?.projectItems ?? []);

reSections.PropertyPage = {
  "PropertyPage-5": {
    pretitle: "Explore",
    title: "Properties",
    desc: "Browse verified homes for sale across Delhi NCR with clear pricing and same-week site visits.",
    listings,
  },
  "PropertyPage-6": {
    pretitle: "Explore",
    title: "Properties",
    desc: "Browse verified homes for sale across Delhi NCR with clear pricing and same-week site visits.",
    listings,
  },
};

reSections.PortfolioPage = {
  "PortfolioPage-5": {
    pretitle: "Explore",
    title: "Projects",
    desc: "Discover residential and commercial projects we represent across the NCR corridor.",
    projectItems,
  },
  "PortfolioPage-6": {
    pretitle: "Explore",
    title: "Projects",
    desc: "Discover residential and commercial projects we represent across the NCR corridor.",
    projectItems,
  },
};

const t5 = doc.templates.find((t) => t.id === "template-realestate-5");
if (t5?.sectionVariants) {
  t5.sectionVariants.PropertyPage = "PropertyPage-5";
  t5.sectionVariants.PortfolioPage = "PortfolioPage-5";
}

fs.writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`);
console.log(
  `Patched PropertyPage (${listings.length} listings) and PortfolioPage (${projectItems.length} projects)`,
);
