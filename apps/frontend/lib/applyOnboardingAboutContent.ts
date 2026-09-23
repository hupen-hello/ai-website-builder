import { readEditorScopedOnboardingDraft } from "@/lib/onboardingDraft";

type SectionLike = {
  type: string;
  id?: string;
  page?: string;
  variant: string;
  data: Record<string, Record<string, unknown>>;
};

function shouldWriteString(current: unknown, overwrite: boolean): boolean {
  if (overwrite) return true;
  return typeof current !== "string" || !current.trim();
}

function patchAboutBlocks(
  blocks: unknown,
  description: string,
  overwrite: boolean,
): unknown {
  if (!Array.isArray(blocks)) return blocks;

  return blocks.map((entry) => {
    if (!entry || typeof entry !== "object") return entry;
    const block = entry as Record<string, unknown>;
    if (block.type !== "text" || block.role !== "paragraph") return block;
    if (!shouldWriteString(block.content, overwrite)) return block;
    return { ...block, content: description };
  });
}

function patchAboutVariant(
  current: Record<string, unknown>,
  description: string,
  isPageBody: boolean,
  overwrite: boolean,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current };

  if (isPageBody) {
    if (shouldWriteString(current.desc1, overwrite)) {
      next.desc1 = description;
    }
    if (shouldWriteString(current.desc, overwrite)) {
      next.desc = description;
    }
    return next;
  }

  if (shouldWriteString(current.desc, overwrite)) {
    next.desc = description;
  }
  if (Array.isArray(current.blocks)) {
    next.blocks = patchAboutBlocks(current.blocks, description, overwrite);
  }

  return next;
}

function isAboutPageSection(section: SectionLike) {
  if (section.type === "AboutPage") return true;
  if (section.id === "AboutPage") return true;
  if (section.type === "About" && section.page) return true;
  return false;
}

/** Stamp onboarding business description onto home About + About page sections. */
export function applyBrandAboutContentToSections<T extends SectionLike>(
  sections: T[],
  options?: { description?: string | null; overwrite?: boolean },
): T[] {
  const description = options?.description?.trim() || "";
  if (!description) return sections;

  const overwrite = options?.overwrite !== false;

  return sections.map((section) => {
    const isPageBody = isAboutPageSection(section);
    const isHomeAbout = section.type === "About" && !section.page;
    if (!isPageBody && !isHomeAbout) return section;

    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => [
        variant,
        patchAboutVariant(
          (variantData || {}) as Record<string, unknown>,
          description,
          isPageBody,
          overwrite,
        ),
      ]),
    );

    return { ...section, data: nextData };
  });
}

export function applyOnboardingAboutContentToSections<T extends SectionLike>(
  sections: T[],
  options?: { overwrite?: boolean },
): T[] {
  const draft = readEditorScopedOnboardingDraft();
  const description =
    typeof draft?.businessInfo.description === "string"
      ? draft.businessInfo.description.trim()
      : "";
  if (!description) return sections;

  return applyBrandAboutContentToSections(sections, {
    description,
    overwrite: options?.overwrite,
  });
}
