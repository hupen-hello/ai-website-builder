/** Create-with-AI design preferences (onboarding → generate). */

export type CreateAiColorPaletteId =
  | "ocean"
  | "forest"
  | "ink-gold"
  | "coral"
  | "slate"
  | "plum"
  | "sand"
  | "midnight"
  | "mint"
  | "crimson"
  | "olive"
  | "sky"
  | "copper"
  | "charcoal-rose"
  | "arctic"
  | "auto";

export type CreateAiFontId =
  | "playfair-source"
  | "fraunces-dm"
  | "cormorant-outfit"
  | "syne-manrope"
  | "space-figtree"
  | "instrument-plex"
  | "libre-nunito"
  | "bebas-lato"
  | "dmserif-karla"
  | "sora-work"
  | "literata-intertight"
  | "archivo-black-plus"
  | "josefin-mulish"
  | "crimson-outfit"
  | "auto";

export type CreateAiHomeSectionId =
  | "hero"
  | "about"
  | "services"
  | "gallery"
  | "testimonials"
  | "pricing"
  | "faq"
  | "team"
  | "cta"
  | "contact"
  | "map";

export type CreateAiDesignPrefs = {
  colorPalette: CreateAiColorPaletteId;
  fontFamily: CreateAiFontId;
  homeSections: CreateAiHomeSectionId[];
  topBar: boolean;
  stickyHeader: boolean;
};

export const CREATE_AI_COLOR_PALETTES: Array<{
  id: CreateAiColorPaletteId;
  label: string;
  hint: string;
  swatches: [string, string, string];
  prompt: string;
}> = [
  {
    id: "ocean",
    label: "Ocean",
    hint: "Deep blue + teal",
    swatches: ["#0B3D91", "#1D9BBF", "#E8F4FC"],
    prompt:
      "Palette Ocean: primary #0B3D91, accent #1D9BBF, soft surface #E8F4FC, text #0F172A, white cards. Premium cool corporate look.",
  },
  {
    id: "forest",
    label: "Forest",
    hint: "Green + cream",
    swatches: ["#1B4332", "#40916C", "#F3F6F1"],
    prompt:
      "Palette Forest: primary #1B4332, accent #40916C, surface #F3F6F1, text #14231A. Calm premium nature / wellness feel.",
  },
  {
    id: "ink-gold",
    label: "Ink & Gold",
    hint: "Black + gold",
    swatches: ["#111111", "#C6A75E", "#F7F4EC"],
    prompt:
      "Palette Ink & Gold: near-black #111, gold accent #C6A75E, warm paper #F7F4EC. Luxury editorial — no purple gradients.",
  },
  {
    id: "coral",
    label: "Coral",
    hint: "Warm coral",
    swatches: ["#C2410C", "#FB923C", "#FFF7ED"],
    prompt:
      "Palette Coral: primary #C2410C, soft accent #FB923C, surface #FFF7ED, text #1C1917. Energetic premium hospitality feel.",
  },
  {
    id: "slate",
    label: "Slate",
    hint: "Modern gray",
    swatches: ["#1E293B", "#64748B", "#F8FAFC"],
    prompt:
      "Palette Slate: primary #1E293B, muted accent #64748B, surface #F8FAFC. Clean SaaS / tech premium.",
  },
  {
    id: "plum",
    label: "Plum",
    hint: "Deep plum",
    swatches: ["#4A1942", "#9B5DE5", "#F8F1F7"],
    prompt:
      "Palette Plum: primary #4A1942, accent #9B5DE5 used sparingly, surface #F8F1F7. Soft luxury — avoid loud neon purple washes.",
  },
  {
    id: "sand",
    label: "Sand",
    hint: "Warm neutral",
    swatches: ["#5C4A3A", "#A68A6D", "#FAF6F1"],
    prompt:
      "Palette Sand: primary #5C4A3A, accent #A68A6D, surface #FAF6F1. Boutique warm premium — not generic cream+terracotta AI cliché.",
  },
  {
    id: "midnight",
    label: "Midnight",
    hint: "Navy + ice",
    swatches: ["#0A1628", "#3B82F6", "#EEF3FA"],
    prompt:
      "Palette Midnight: deep navy #0A1628, crisp blue accent #3B82F6, ice surface #EEF3FA, text #0B1220. Executive dark-header / light-body premium.",
  },
  {
    id: "mint",
    label: "Mint",
    hint: "Fresh clinic",
    swatches: ["#0F766E", "#5EEAD4", "#F0FDFA"],
    prompt:
      "Palette Mint: teal primary #0F766E, soft mint accent #5EEAD4, surface #F0FDFA, text #134E4A. Clean health / wellness / modern clinic feel.",
  },
  {
    id: "crimson",
    label: "Crimson",
    hint: "Bold red",
    swatches: ["#9F1239", "#E11D48", "#FFF1F2"],
    prompt:
      "Palette Crimson: deep rose-red #9F1239, vivid accent #E11D48, surface #FFF1F2, text #1F1215. Confident brand energy — not cheap loud red.",
  },
  {
    id: "olive",
    label: "Olive",
    hint: "Muted green",
    swatches: ["#3F4A2E", "#8B9A6D", "#F5F3EB"],
    prompt:
      "Palette Olive: olive primary #3F4A2E, soft leaf accent #8B9A6D, linen surface #F5F3EB. Quiet organic / craft premium.",
  },
  {
    id: "sky",
    label: "Sky",
    hint: "Light airy",
    swatches: ["#0369A1", "#38BDF8", "#F0F9FF"],
    prompt:
      "Palette Sky: sky primary #0369A1, bright accent #38BDF8, airy surface #F0F9FF. Fresh travel / lifestyle / open brand feel.",
  },
  {
    id: "copper",
    label: "Copper",
    hint: "Teal + copper",
    swatches: ["#115E59", "#B45309", "#F8FAF9"],
    prompt:
      "Palette Copper: teal primary #115E59, copper accent #B45309, clean surface #F8FAF9. Distinctive industrial-premium — not orange cliché.",
  },
  {
    id: "charcoal-rose",
    label: "Charcoal Rose",
    hint: "Charcoal + rose",
    swatches: ["#292524", "#BE123C", "#FAF7F5"],
    prompt:
      "Palette Charcoal Rose: charcoal #292524, dusty rose accent #BE123C, soft surface #FAF7F5. Fashion / beauty editorial premium.",
  },
  {
    id: "arctic",
    label: "Arctic",
    hint: "Cool steel",
    swatches: ["#334155", "#94A3B8", "#F1F5F9"],
    prompt:
      "Palette Arctic: steel primary #334155, cool accent #94A3B8, frost surface #F1F5F9. Minimal Nordic / architecture premium.",
  },
  {
    id: "auto",
    label: "Surprise me",
    hint: "AI picks",
    swatches: ["#315FF4", "#08132F", "#F8FAFC"],
    prompt:
      "Invent an original premium palette that fits the brand niche. Avoid purple-on-white cliché and flat single-color pages.",
  },
];

export const CREATE_AI_FONTS: Array<{
  id: CreateAiFontId;
  label: string;
  sample: string;
  prompt: string;
  google: string;
}> = [
  {
    id: "playfair-source",
    label: "Playfair + Source Sans",
    sample: "Aa Elegant",
    google: "Playfair+Display:wght@500;700|Source+Sans+3:wght@400;600",
    prompt:
      "Typography: headings Playfair Display, body Source Sans 3. Load via Google Fonts.",
  },
  {
    id: "fraunces-dm",
    label: "Fraunces + DM Sans",
    sample: "Aa Soft",
    google: "Fraunces:opsz,wght@9..144,500;700|DM+Sans:wght@400;600",
    prompt:
      "Typography: headings Fraunces, body DM Sans. Load via Google Fonts.",
  },
  {
    id: "cormorant-outfit",
    label: "Cormorant + Outfit",
    sample: "Aa Classic",
    google: "Cormorant+Garamond:wght@500;700|Outfit:wght@400;600",
    prompt:
      "Typography: headings Cormorant Garamond, body Outfit. Load via Google Fonts.",
  },
  {
    id: "syne-manrope",
    label: "Syne + Manrope",
    sample: "Aa Bold",
    google: "Syne:wght@600;700|Manrope:wght@400;600",
    prompt:
      "Typography: headings Syne, body Manrope. Modern brand feel. Load via Google Fonts.",
  },
  {
    id: "space-figtree",
    label: "Space Grotesk + Figtree",
    sample: "Aa Tech",
    google: "Space+Grotesk:wght@500;700|Figtree:wght@400;600",
    prompt:
      "Typography: headings Space Grotesk, body Figtree. Load via Google Fonts.",
  },
  {
    id: "instrument-plex",
    label: "Instrument + Plex",
    sample: "Aa Sharp",
    google: "Instrument+Serif|IBM+Plex+Sans:wght@400;600",
    prompt:
      "Typography: headings Instrument Serif, body IBM Plex Sans. Load via Google Fonts.",
  },
  {
    id: "libre-nunito",
    label: "Libre Baskerville + Nunito",
    sample: "Aa Literary",
    google: "Libre+Baskerville:wght@400;700|Nunito:wght@400;600",
    prompt:
      "Typography: headings Libre Baskerville, body Nunito. Warm readable editorial. Load via Google Fonts.",
  },
  {
    id: "bebas-lato",
    label: "Bebas Neue + Lato",
    sample: "Aa Poster",
    google: "Bebas+Neue|Lato:wght@400;700",
    prompt:
      "Typography: headings Bebas Neue (display), body Lato. Strong campaign / sports feel. Load via Google Fonts.",
  },
  {
    id: "dmserif-karla",
    label: "DM Serif + Karla",
    sample: "Aa Refined",
    google: "DM+Serif+Display|Karla:wght@400;600",
    prompt:
      "Typography: headings DM Serif Display, body Karla. Clean boutique premium. Load via Google Fonts.",
  },
  {
    id: "sora-work",
    label: "Sora + Work Sans",
    sample: "Aa Modern",
    google: "Sora:wght@500;700|Work+Sans:wght@400;600",
    prompt:
      "Typography: headings Sora, body Work Sans. Contemporary product / studio feel. Load via Google Fonts.",
  },
  {
    id: "literata-intertight",
    label: "Literata + Inter Tight",
    sample: "Aa Editorial",
    google: "Literata:opsz,wght@7..72,500;700|Inter+Tight:wght@400;600",
    prompt:
      "Typography: headings Literata, body Inter Tight. Magazine / long-form premium. Load via Google Fonts.",
  },
  {
    id: "archivo-black-plus",
    label: "Archivo Black + Plus Jakarta",
    sample: "Aa Impact",
    google: "Archivo+Black|Plus+Jakarta+Sans:wght@400;600",
    prompt:
      "Typography: headings Archivo Black, body Plus Jakarta Sans. Bold brand impact. Load via Google Fonts.",
  },
  {
    id: "josefin-mulish",
    label: "Josefin + Mulish",
    sample: "Aa Airy",
    google: "Josefin+Sans:wght@500;700|Mulish:wght@400;600",
    prompt:
      "Typography: headings Josefin Sans, body Mulish. Light lifestyle / wellness feel. Load via Google Fonts.",
  },
  {
    id: "crimson-outfit",
    label: "Crimson Pro + Outfit",
    sample: "Aa Warm",
    google: "Crimson+Pro:wght@500;700|Outfit:wght@400;600",
    prompt:
      "Typography: headings Crimson Pro, body Outfit. Warm approachable premium. Load via Google Fonts.",
  },
  {
    id: "auto",
    label: "Surprise me",
    sample: "Aa Auto",
    google: "",
    prompt:
      "Pick an expressive Google Font pairing (not Inter/Roboto/Arial). Headings distinctive, body readable.",
  },
];

export const CREATE_AI_HOME_SECTIONS: Array<{
  id: CreateAiHomeSectionId;
  label: string;
  required?: boolean;
}> = [
  { id: "hero", label: "Hero", required: true },
  { id: "about", label: "About" },
  { id: "services", label: "Services / Offerings" },
  { id: "gallery", label: "Gallery" },
  { id: "testimonials", label: "Testimonials" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "team", label: "Team" },
  { id: "cta", label: "CTA band" },
  { id: "contact", label: "Contact", required: true },
  { id: "map", label: "Map" },
];

export function defaultCreateAiDesignPrefs(): CreateAiDesignPrefs {
  return {
    colorPalette: "auto",
    fontFamily: "auto",
    homeSections: ["hero", "about", "services", "gallery", "testimonials", "contact"],
    topBar: false,
    stickyHeader: true,
  };
}

export function normalizeCreateAiDesignPrefs(
  raw: unknown,
): CreateAiDesignPrefs {
  const d = defaultCreateAiDesignPrefs();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Partial<CreateAiDesignPrefs>;
  const paletteOk = CREATE_AI_COLOR_PALETTES.some((p) => p.id === o.colorPalette);
  const fontOk = CREATE_AI_FONTS.some((f) => f.id === o.fontFamily);
  const sections = Array.isArray(o.homeSections)
    ? o.homeSections.filter((id): id is CreateAiHomeSectionId =>
        CREATE_AI_HOME_SECTIONS.some((s) => s.id === id),
      )
    : d.homeSections;
  const ensured = new Set(sections);
  ensured.add("hero");
  ensured.add("contact");
  return {
    colorPalette: paletteOk ? (o.colorPalette as CreateAiColorPaletteId) : d.colorPalette,
    fontFamily: fontOk ? (o.fontFamily as CreateAiFontId) : d.fontFamily,
    homeSections: CREATE_AI_HOME_SECTIONS.map((s) => s.id).filter((id) =>
      ensured.has(id),
    ),
    topBar: typeof o.topBar === "boolean" ? o.topBar : d.topBar,
    stickyHeader:
      typeof o.stickyHeader === "boolean" ? o.stickyHeader : d.stickyHeader,
  };
}

/** Prompt block for create-site AI. */
export function formatCreateAiDesignPrefsPrompt(
  prefs: CreateAiDesignPrefs,
): string {
  const p =
    CREATE_AI_COLOR_PALETTES.find((x) => x.id === prefs.colorPalette) ||
    CREATE_AI_COLOR_PALETTES.find((x) => x.id === "auto")!;
  const f =
    CREATE_AI_FONTS.find((x) => x.id === prefs.fontFamily) ||
    CREATE_AI_FONTS.find((x) => x.id === "auto")!;
  const sectionLabels = prefs.homeSections
    .map(
      (id) =>
        CREATE_AI_HOME_SECTIONS.find((s) => s.id === id)?.label || id,
    )
    .join(", ");

  return `USER DESIGN PREFERENCES (must follow — premium polish; rails also enforce color/font/header/sections):
- ${p.prompt}
- ${f.prompt}
- Home page MUST include ALL of these sections (do not skip any): ${sectionLabels}.
  Prefer this order. Do not replace listed sections with unrelated filler. Extra tiny bands only if they help quality without dropping a listed section.
- Top utility bar above header: ${prefs.topBar ? "YES — thin bar with phone/email/address when available; keep it tasteful" : "NO — do not add a top utility bar"}.
- Sticky header: ${prefs.stickyHeader ? "YES — header sticks on scroll (position:sticky; top:0; z-index high; solid background)" : "NO — normal static header"}.
- Overall: polished premium composition — strong brand in hero, one job per section, no cluttered pill clusters, no fake placeholder copy.`;
}
