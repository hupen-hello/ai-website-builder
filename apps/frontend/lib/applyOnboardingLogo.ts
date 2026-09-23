import { readEditorScopedOnboardingDraft } from "@/lib/onboardingDraft";

type SectionLike = {
  type: string;
  variant: string;
  data: Record<string, Record<string, unknown>>;
};

/**
 * Apply the onboarding-uploaded logo onto every Header + Footer layout
 * variant so theme/layout switches keep the same brand mark.
 */
export function applyBrandLogoToSections<T extends SectionLike>(
  sections: T[],
  options?: {
    logoImage?: string | null;
    logoName?: string | null;
    brandName?: string | null;
    /** When false, only fill empty logo slots (do not replace existing). */
    overwrite?: boolean;
  },
): T[] {
  const logoImage = options?.logoImage?.trim() || "";
  if (!logoImage) return sections;

  const logoName = options?.logoName?.trim() || "Logo";
  const brandName = options?.brandName?.trim() || "";
  const overwrite = options?.overwrite !== false;

  return sections.map((section) => {
    if (section.type !== "Header" && section.type !== "Footer") {
      return section;
    }

    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        const current = (variantData || {}) as Record<string, unknown>;
        const existingLogo =
          typeof current.logoImage === "string" ? current.logoImage.trim() : "";
        const shouldWrite = overwrite || !existingLogo;
        if (!shouldWrite) {
          return [variant, current];
        }

        return [
          variant,
          {
            ...current,
            logoImage,
            logoImageTitle: logoName,
            ...(brandName &&
            (typeof current.logo !== "string" || !String(current.logo).trim())
              ? { logo: brandName }
              : brandName
                ? { logo: brandName }
                : {}),
          },
        ];
      }),
    );

    return {
      ...section,
      data: nextData,
    };
  });
}

/** Read onboarding draft logo and stamp it onto sections. */
export function applyOnboardingLogoToSections<T extends SectionLike>(
  sections: T[],
  options?: { overwrite?: boolean },
): T[] {
  const draft = readEditorScopedOnboardingDraft();
  const info = draft?.businessInfo;
  if (!info || info.hasLogo !== "yes") return sections;
  const logoImage = typeof info.logoImage === "string" ? info.logoImage : "";
  if (!logoImage.trim()) return sections;

  return applyBrandLogoToSections(sections, {
    logoImage,
    logoName: info.logoName || "Logo",
    brandName: info.name || "",
    overwrite: options?.overwrite,
  });
}

/** Compress uploaded logo for localStorage-friendly data URLs. */
export function compressLogoFile(
  file: File,
  maxWidth = 480,
  quality = 0.86,
): Promise<{ dataUrl: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read logo file"));
    reader.onload = () => {
      const src = String(reader.result || "");
      if (!src) {
        reject(new Error("Unable to read logo file"));
        return;
      }

      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(1, image.width));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: src, fileName: file.name });
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        const mime = file.type.includes("png") ? "image/png" : "image/jpeg";
        const dataUrl =
          mime === "image/png"
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl, fileName: file.name });
      };
      image.onerror = () => resolve({ dataUrl: src, fileName: file.name });
      // SVG / exotic formats: keep original data URL without canvas re-encode.
      if (file.type.includes("svg") || src.startsWith("data:image/svg")) {
        resolve({ dataUrl: src, fileName: file.name });
        return;
      }
      image.src = src;
    };
    reader.readAsDataURL(file);
  });
}
