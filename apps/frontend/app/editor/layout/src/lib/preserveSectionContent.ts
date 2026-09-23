const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Layout-only controls that belong to the destination theme. */
const DESIGN_FIELD_PATTERN =
  /(color|gradient|height|width|layout|align|position|radius|padding|margin|gap|columns?|autoplay|interval|sticky|backgroundtype|backgroundmode|headertype|topbartype|bannerbackgroundmode|variant)$/i;

const MEDIA_FIELD_PATTERN =
  /(logo|image|img|photo|thumbnail|icon|video|poster|avatar|media|src)$/i;

const SEMANTIC_FIELD_GROUPS = [
  ["title", "heading", "headline", "productTitle", "productSectionTitle"],
  ["pretitle", "eyebrow", "kicker"],
  ["subtitle", "subheading", "productSubtitle"],
  ["desc", "description", "paragraph", "bodyText", "productInfoDesc"],
  ["desc2", "philosophyDesc", "paragraph-secondary"],
  ["logo", "logoText", "brandName"],
  ["logoImage", "logoSrc", "logoUrl"],
  ["logoImageTitle", "logoAlt", "logoTitle"],
  ["backgroundImage", "bgImage", "heroImage", "bannerImage", "mainImage"],
  ["sideImage", "image"],
  ["phone", "phoneNumber", "mobile"],
  ["email", "mail"],
  ["location", "address"],
  ["whatsappLink", "whatsapp", "whatsAppLink"],
  ["callLink", "callHref", "telLink"],
  ["floatingItems", "floatingButtons", "floatingLinks"],
] as const;

const MEDIA_COLLECTION_GROUPS = [
  [
    "slides",
    "carousel",
    "bannerSlides",
    "items",
    "images",
    "gallery",
    "galleryImages",
    "photos",
    "cards",
  ],
] as const;

const isMeaningfulValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
};

const isMediaishKey = (key: string) => MEDIA_FIELD_PATTERN.test(key);

const isDesignKey = (key: string) => {
  if (isMediaishKey(key)) return false;
  return DESIGN_FIELD_PATTERN.test(key);
};

const blockIdentity = (block: Record<string, unknown>) => {
  const id = typeof block.id === "string" ? block.id : "";
  const type = typeof block.type === "string" ? block.type : "";
  const role = typeof block.role === "string" ? block.role : "";
  if (id) return `id:${id}`;
  if (type && role) return `type-role:${type}:${role}`;
  if (type) return `type:${type}`;
  return "";
};

const mergeBlocks = (
  targetBlocks: unknown[],
  sourceBlocks: unknown[],
): unknown[] => {
  if (!sourceBlocks.length) return targetBlocks;
  if (!targetBlocks.length) return sourceBlocks;

  const unusedSource = [...sourceBlocks];
  const mergedTargets = targetBlocks.map((targetBlock) => {
    if (!isRecord(targetBlock)) return targetBlock;

    const targetKey = blockIdentity(targetBlock);
    const matchIndex = unusedSource.findIndex((sourceBlock) => {
      if (!isRecord(sourceBlock)) return false;
      const sourceKey = blockIdentity(sourceBlock);
      if (targetKey && sourceKey && targetKey === sourceKey) return true;
      if (
        targetBlock.type &&
        sourceBlock.type === targetBlock.type &&
        (!targetBlock.role || targetBlock.role === sourceBlock.role)
      ) {
        return true;
      }
      return false;
    });

    if (matchIndex < 0) return targetBlock;
    const [matched] = unusedSource.splice(matchIndex, 1);
    if (!isRecord(matched)) return targetBlock;
    return mergeSectionContent(targetBlock, matched);
  });

  // Keep unmatched user blocks (extra images/cards the new layout still needs).
  return [...mergedTargets, ...unusedSource];
};

const mergeValue = (target: unknown, source: unknown, key = ""): unknown => {
  if (Array.isArray(source)) {
    const targetItems = Array.isArray(target) ? target : [];
    if (key === "blocks" || key.toLowerCase().endsWith("blocks")) {
      return mergeBlocks(targetItems, source);
    }

    // Explicit empty array means the user cleared the list — never resurrect
    // old productItems / slides / galleryItems from another variant or server.
    if (!source.length) {
      return [];
    }

    // Prefer the user's collection when it carries real content/media.
    if (!targetItems.length || source.some(isMeaningfulValue)) {
      return source.map((item, index) =>
        mergeValue(targetItems[index], item, key),
      );
    }

    return targetItems.map((item, index) =>
      mergeValue(item, source[index], key),
    );
  }

  if (isRecord(source)) {
    return mergeSectionContent(isRecord(target) ? target : {}, source);
  }

  return isMeaningfulValue(source) ? source : target;
};

/**
 * Carries user-owned content between section variants while leaving the
 * destination layout's visual controls (colors, sizing, mode, spacing, etc.)
 * intact. Matching nested objects and collections are migrated recursively.
 */
export const mergeSectionContent = <T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T => {
  const merged: Record<string, unknown> = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined) return;
    if (isDesignKey(key) && !isMediaishKey(key)) return;
    merged[key] = mergeValue(target[key], value, key);
  });

  SEMANTIC_FIELD_GROUPS.forEach((fieldGroup) => {
    const sourceValue = fieldGroup
      .map((key) => source[key])
      .find(isMeaningfulValue);
    if (sourceValue === undefined) return;

    fieldGroup.forEach((key) => {
      if (key in target || key in source) merged[key] = sourceValue;
    });
  });

  MEDIA_COLLECTION_GROUPS.forEach((fieldGroup) => {
    const sourceValue = fieldGroup
      .map((key) => source[key])
      .find((value) => Array.isArray(value) && value.length > 0);
    if (!Array.isArray(sourceValue) || !sourceValue.length) return;

    const targetKey =
      fieldGroup.find((key) => key in target) ||
      fieldGroup.find((key) => key in source);
    if (!targetKey) return;

    const targetValue = target[targetKey];
    merged[targetKey] = mergeValue(targetValue, sourceValue, targetKey);

    fieldGroup.forEach((key) => {
      if (key !== targetKey && key in target) {
        merged[key] = merged[targetKey];
      }
    });
  });

  return merged as T;
};

/**
 * Build the richest user content bag from every stored variant so a theme
 * switch does not depend on only the currently active layout key.
 */
export const collectBestSectionContent = (
  section: {
    variant: string;
    data?: Record<string, Record<string, unknown> | undefined>;
  },
): Record<string, unknown> => {
  const data = section.data || {};
  const active = data[section.variant];
  let best: Record<string, unknown> = isRecord(active) ? { ...active } : {};

  Object.entries(data).forEach(([variant, variantData]) => {
    if (variant === section.variant || !isRecord(variantData)) return;
    // Only borrow keys the active layout does not define. Empty strings on the
    // active variant mean the user cleared them — do not resurrect old media.
    const filler: Record<string, unknown> = {};
    Object.entries(variantData).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(best, key)) return;
      if (!isMeaningfulValue(value)) return;
      filler[key] = value;
    });
    if (Object.keys(filler).length) {
      best = mergeSectionContent(best, filler);
    }
  });

  return best;
};

/**
 * Remap one section onto a destination theme variant while preserving the
 * user's logos, images, text, and media collections.
 */
export const applyThemeVariantToSection = <
  T extends {
    type: string;
    variant: string;
    data: Record<string, Record<string, unknown>>;
    page?: string;
  },
>(
  section: T,
  targetSection: {
    variant: string;
    data: Record<string, Record<string, unknown>>;
  },
  extras?: Record<string, unknown>,
): T => {
  const targetVariant = targetSection.variant;
  const targetData = targetSection.data[targetVariant] || {};
  const currentData = collectBestSectionContent(section);
  const mergedActive = {
    ...mergeSectionContent(targetData, currentData),
    ...extras,
  };

  const nextSection = {
    ...section,
    variant: targetVariant,
    data: {
      ...targetSection.data,
      ...section.data,
      [targetVariant]: mergedActive,
    },
  } as T;

  // Mirror preserved content onto every stored variant so later switches still
  // find logos/images even if a stale default layout key is opened.
  const syncedData = Object.fromEntries(
    Object.entries(nextSection.data).map(([variant, variantData]) => [
      variant,
      mergeSectionContent(
        (variantData || {}) as Record<string, unknown>,
        mergedActive,
      ),
    ]),
  );

  return {
    ...nextSection,
    data: syncedData,
  };
};

/**
 * When a local draft wins on timestamp but accidentally blanked fields that the
 * database still has (logo, banner text, media), fill those holes from server
 * without overwriting real local edits.
 */
export const reconcileSectionsWithServer = <
  T extends {
    id?: string;
    type: string;
    variant: string;
    page?: string;
    data: Record<string, Record<string, unknown>>;
  },
>(
  draftSections: T[],
  serverSections: T[],
): T[] => {
  const serverByKey = new Map(
    serverSections.map((section) => [
      `${section.type}::${section.page || ""}::${section.id || section.type}`,
      section,
    ]),
  );

  return draftSections.map((draftSection) => {
    const serverSection =
      serverByKey.get(
        `${draftSection.type}::${draftSection.page || ""}::${draftSection.id || draftSection.type}`,
      ) ||
      serverSections.find(
        (section) =>
          section.type === draftSection.type &&
          (section.page || "") === (draftSection.page || ""),
      );

    if (!serverSection) return draftSection;

    const nextData = { ...draftSection.data };
    const variantKeys = new Set([
      ...Object.keys(draftSection.data || {}),
      ...Object.keys(serverSection.data || {}),
    ]);

    variantKeys.forEach((variant) => {
      const draftData = draftSection.data[variant] || {};
      const serverData = serverSection.data[variant] || {};
      // Server is the base; draft meaningful values win; empty draft keeps server.
      nextData[variant] = mergeSectionContent(serverData, draftData);
    });

    return {
      ...draftSection,
      data: nextData,
    };
  });
};
