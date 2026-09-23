/**
 * Redesign onboarding prefs: category + page type + color/font theme.
 * Reuses Create-AI palette/font catalogs for a consistent product feel.
 */

import {
  CREATE_AI_COLOR_PALETTES,
  CREATE_AI_FONTS,
  type CreateAiColorPaletteId,
  type CreateAiFontId,
} from "@/lib/create-ai-design-prefs";

export type RedesignPageType = "single-page" | "multi-page";

export type RedesignDesignPrefs = {
  category: string;
  pageType: RedesignPageType;
  colorPalette: CreateAiColorPaletteId;
  fontFamily: CreateAiFontId;
};

export const defaultRedesignDesignPrefs = (): RedesignDesignPrefs => ({
  category: "Business",
  pageType: "single-page",
  colorPalette: "ocean",
  fontFamily: "syne-manrope",
});

export function isRedesignDesignPrefsComplete(prefs: RedesignDesignPrefs) {
  return Boolean(prefs.category?.trim()) && Boolean(prefs.pageType);
}

/** Map palette + font into editor CSS variables. */
export function redesignPrefsToTemplateVariables(
  prefs: RedesignDesignPrefs,
): Record<string, string> {
  const palette =
    CREATE_AI_COLOR_PALETTES.find((p) => p.id === prefs.colorPalette) ||
    CREATE_AI_COLOR_PALETTES.find((p) => p.id === "ocean")!;
  const font =
    CREATE_AI_FONTS.find((f) => f.id === prefs.fontFamily) ||
    CREATE_AI_FONTS.find((f) => f.id === "syne-manrope")!;

  const [primary, accent, surface] = palette.swatches;
  const headingName = font.google.split("|")[0]?.split(":")[0]?.replace(/\+/g, " ") || "Syne";
  const bodyName =
    font.google.split("|")[1]?.split(":")[0]?.replace(/\+/g, " ") || "Manrope";
  const heading = `"${headingName}", system-ui, sans-serif`;
  const body = `"${bodyName}", system-ui, sans-serif`;

  return {
    "--primary-bg": primary,
    "--secondary-bg": surface,
    "--primary-text": "#ffffff",
    "--secondary-text": "#0f172a",
    "--header-bg": primary,
    "--header-text": "#ffffff",
    "--hero-bg": primary,
    "--hero-title": "#ffffff",
    "--lightcream-bg": surface,
    "--primary-title-text": "#0f172a",
    "--secondary-title-text": "#0f172a",
    "--primary-pretitle-text": accent,
    "--secondary-pretitle-text": accent,
    "--primary-subtitle-text": "#475569",
    "--secondary-subtitle-text": "#475569",
    "--primary-link-bg": primary,
    "--primary-link-color": "#ffffff",
    "--secondary-link-bg": accent,
    "--secondary-link-color": "#ffffff",
    "--font-heading": heading,
    "--font-body": body,
    "--blue-bg": primary,
    // Flow badge marker (My Websites) — survives when createPath was lost on save.
    "--lestow-create-path": "redesign",
  };
}
