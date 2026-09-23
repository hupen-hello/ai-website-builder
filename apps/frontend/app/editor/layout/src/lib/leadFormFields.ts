export function leadFieldName(label: string) {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "field";
}

function stripHtml(value?: string) {
  return value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
}

function isMarketingFormLabel(value: string) {
  const name = value.trim();
  if (!name) return true;
  if (name.length > 40) return true;
  return /conversation|our team|get in touch|contact us|reach out|let'?s talk|clear conversation/i.test(
    name,
  );
}

/** Short label for lead inbox — never use long marketing headlines. */
export function getLeadFormName(
  sectionData: { title?: string; pretitle?: string } | undefined,
  sectionType: string,
  sectionVariant: string,
) {
  const candidates = [
    stripHtml(sectionData?.pretitle),
    stripHtml(sectionData?.title),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!isMarketingFormLabel(candidate)) return candidate;
  }

  if (sectionType === "Contact" || sectionVariant.startsWith("ContactPage")) {
    return "Contact form";
  }
  if (sectionType === "CareerJobs" || sectionVariant.startsWith("CareerJobs")) {
    return "Career application";
  }
  if (sectionType === "FormDetail") return "Form";
  return sectionVariant || sectionType;
}
