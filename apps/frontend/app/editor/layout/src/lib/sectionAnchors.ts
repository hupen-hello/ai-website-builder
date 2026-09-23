import type { SectionItem } from "../types/section";

const anchorNames: Record<string, string> = {
  Topbar: "topbar",
  Header: "header",
  Banner: "home",
  About: "about",
  Service: "services",
  Product: "products",
  Gallery: "gallery",
  CountriesServe: "countries-we-serve",
  Testimonial: "testimonials",
  FAQ: "faq",
  FormDetail: "contact",
  Contact: "contact",
  Footer: "footer",
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getSectionVariantData = (
  section: SectionItem,
): Record<string, unknown> | undefined => {
  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[defaultVariant];
  return isRecord(variantData) ? variantData : undefined;
};

const getCustomSectionAnchorBase = (section: SectionItem) => {
  const data = getSectionVariantData(section);
  const htmlId =
    typeof data?.sectionHtmlId === "string" ? data.sectionHtmlId.trim() : "";
  if (htmlId) {
    return slugify(htmlId.replace(/^#/, ""));
  }

  const sectionName =
    typeof data?.sectionName === "string" ? data.sectionName.trim() : "";
  if (sectionName && sectionName.toLowerCase() !== "section") {
    return slugify(sectionName);
  }

  if (section.id) {
    return slugify(section.id);
  }

  return "custom-section";
};

export const getSectionAnchorBase = (section: SectionItem) => {
  if (section.type === "CustomSection") {
    return getCustomSectionAnchorBase(section);
  }

  return slugify(
    section.page || anchorNames[section.type] || section.type || "section",
  );
};

export const getSectionAnchorId = (
  sections: SectionItem[],
  index: number,
) => {
  const base = getSectionAnchorBase(sections[index]);
  const duplicateNumber =
    sections
      .slice(0, index)
      .filter((section) => getSectionAnchorBase(section) === base).length + 1;

  return duplicateNumber === 1 ? base : `${base}-${duplicateNumber}`;
};
