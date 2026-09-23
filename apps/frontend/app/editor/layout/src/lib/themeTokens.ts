/** Shared theme CSS variable helpers for sections. */

export const THEME_PRIMARY_BG = "var(--primary-bg)";
export const THEME_PRIMARY_TEXT = "var(--primary-text)";
export const THEME_SECONDARY_BG = "var(--secondary-bg)";
export const THEME_SECONDARY_TEXT = "var(--secondary-text)";
export const THEME_HEADER_BG = "var(--header-bg)";
export const THEME_HEADER_TEXT = "var(--header-text)";
export const THEME_HERO_BG = "var(--hero-bg)";
export const THEME_ACCENT = "var(--blue-bg)";
export const THEME_BUTTON_BG = "var(--primary-bg)";
export const THEME_BUTTON_TEXT = "var(--primary-text)";
export const THEME_FONT_HEADING = "var(--font-heading)";
export const THEME_FONT_BODY = "var(--font-body)";
export const THEME_FONT_BUTTON = "var(--font-button, var(--font-body))";

const THEME_LOCKED_COLORS = [
  "#00cadd",
  "#0f766e",
  "#245c6e",
  "#17241f",
  "#0d1f2a",
  "#0f172a",
  "#141414",
  "#ffffff",
  "#fff",
];

/** Use the live theme token when the stored color is empty or a template default. */
export function resolveThemeColor(
  value: string | undefined,
  cssVar: string,
  extraLocked: string[] = [],
) {
  const raw = (value || "").trim();
  if (!raw || raw.startsWith("var(")) return cssVar;
  const locked = new Set(
    [...THEME_LOCKED_COLORS, ...extraLocked].map((color) => color.toLowerCase()),
  );
  return locked.has(raw.toLowerCase()) ? cssVar : raw;
}

export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Inter:wght@400;600;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Nunito:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&family=Source+Sans+3:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap";

export function ensureThemeGoogleFontsLoaded() {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("ai-builder-theme-google-fonts");
  if (existing) return;
  const link = document.createElement("link");
  link.id = "ai-builder-theme-google-fonts";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}

/** Global stylesheet applied on editor + published site roots. */
export const SITE_THEME_GLOBAL_CSS = `
[data-site-theme-root] {
  font-family: var(--font-body);
  color: var(--secondary-text);
}
[data-site-theme-root] h1,
[data-site-theme-root] h2,
[data-site-theme-root] h3,
[data-site-theme-root] h4,
[data-site-theme-root] h5,
[data-site-theme-root] h6 {
  font-family: var(--font-heading);
}
[data-site-theme-root] a[class*="rounded-"][class*="px-"],
[data-site-theme-root] a[class*="rounded-"][class*="font-"],
[data-site-theme-root] button:not([data-editor-toolbar]):not([aria-label="Close"]):not([aria-label="Close panel"]) {
  font-family: var(--font-button, var(--font-body));
}
[data-site-theme-root] .theme-accent {
  color: var(--blue-bg);
}
[data-site-theme-root] .theme-accent-soft {
  background-color: color-mix(in srgb, var(--primary-bg) 12%, white);
  color: var(--primary-bg);
}
[data-site-theme-root] .hover\\:theme-soft:hover {
  background-color: color-mix(in srgb, var(--primary-bg) 8%, #f8fafc);
}
[data-site-theme-root] .theme-accent-border,
[data-site-theme-root] .theme-accent-border-l {
  border-color: var(--primary-bg);
}
[data-site-theme-root] .theme-btn {
  background-color: var(--primary-bg);
  color: var(--primary-text);
}
[data-site-theme-root] .theme-btn:hover {
  filter: brightness(0.92);
}
[data-site-theme-root] .hover\\:theme-btn:hover {
  background-color: var(--primary-bg);
}
[data-site-theme-root] .theme-surface-accent {
  background-color: var(--primary-bg);
  color: var(--primary-text);
}
[data-site-theme-root] .theme-dot-active {
  background-color: var(--primary-bg);
}
[data-site-theme-root] .theme-prose a {
  color: var(--blue-bg);
}
/* RealEstate template: remap hardcoded palette so every section/page follows Theme Color */
[data-site-theme-root] [class~="text-[#c44536]"],
[data-site-theme-root] [class*="text-[#c44536]/"],
[data-site-theme-root] [class~="text-[#a4472f]"],
[data-site-theme-root] [class*="text-[#a4472f]/"],
[data-site-theme-root] [class~="text-[#a45b42]"],
[data-site-theme-root] [class*="text-[#a45b42]/"],
[data-site-theme-root] [class~="text-[#b44e32]"],
[data-site-theme-root] [class*="text-[#b44e32]/"],
[data-site-theme-root] [class~="text-[#00cadd]"],
[data-site-theme-root] [class~="text-[#0f766e]"],
[data-site-theme-root] [class~="text-[#e9ad91]"] {
  color: var(--primary-bg);
}
[data-site-theme-root] [class~="hover:text-[#c44536]"]:hover,
[data-site-theme-root] [class~="hover:text-[#a4472f]"]:hover,
[data-site-theme-root] [class~="hover:text-[#a45b42]"]:hover,
[data-site-theme-root] [class~="hover:text-[#b44e32]"]:hover,
[data-site-theme-root] [class~="hover:bg-[#b44e32]"]:hover {
  color: var(--primary-bg);
}
[data-site-theme-root] [class*="group"]:hover [class*="group-hover:text-[#c44536]"],
[data-site-theme-root] [class*="group"]:hover [class*="group-hover:text-[#a4472f]"],
[data-site-theme-root] [class*="group"]:hover [class*="group-hover:text-[#a45b42]"],
[data-site-theme-root] [class*="group"]:hover [class*="group-hover:text-[#b44e32]"],
[data-site-theme-root] [class*="group"]:hover [class*="group-hover/"][class*="text-[#c44536]"] {
  color: var(--primary-bg);
}
[data-site-theme-root] [class~="text-[#141414]"],
[data-site-theme-root] [class*="text-[#141414]/"],
[data-site-theme-root] [class~="text-[#17241f]"],
[data-site-theme-root] [class*="text-[#17241f]/"] {
  color: var(--secondary-text);
}
[data-site-theme-root] [class~="bg-[#c44536]"],
[data-site-theme-root] [class*="bg-[#c44536]/"],
[data-site-theme-root] [class~="bg-[#141414]"],
[data-site-theme-root] [class*="bg-[#141414]/"],
[data-site-theme-root] [class~="bg-[#17241f]"],
[data-site-theme-root] [class*="bg-[#17241f]/"],
[data-site-theme-root] [class~="bg-[#00cadd]"],
[data-site-theme-root] [class~="bg-[#0f766e]"],
[data-site-theme-root] [class~="bg-[#a45b42]"],
[data-site-theme-root] [class~="bg-[#b44e32]"] {
  background-color: var(--primary-bg);
  color: var(--primary-text);
}
[data-site-theme-root] [class~="hover:bg-[#c44536]"]:hover,
[data-site-theme-root] [class~="hover:bg-[#141414]"]:hover,
[data-site-theme-root] [class~="hover:bg-[#17241f]"]:hover,
[data-site-theme-root] [class*="hover:bg-[#141414]/"]:hover,
[data-site-theme-root] [class*="hover:bg-[#c44536]/"]:hover {
  background-color: var(--primary-bg);
  color: var(--primary-text);
}
[data-site-theme-root] [class~="border-[#c44536]"],
[data-site-theme-root] [class*="border-[#c44536]/"],
[data-site-theme-root] [class~="hover:border-[#c44536]"]:hover,
[data-site-theme-root] [class*="hover:border-[#c44536]/"]:hover,
[data-site-theme-root] [class~="hover:border-[#141414]"]:hover,
[data-site-theme-root] [class*="decoration-[#c44536]"] {
  border-color: var(--primary-bg);
  text-decoration-color: var(--primary-bg);
}
[data-site-theme-root] [class~="border-[#141414]"],
[data-site-theme-root] [class*="border-[#141414]/"],
[data-site-theme-root] [class~="border-[#17241f]"],
[data-site-theme-root] [class*="border-[#17241f]/"] {
  border-color: color-mix(in srgb, var(--secondary-text) 18%, transparent);
}
[data-site-theme-root] [class~="bg-[#f8f6f1]"],
[data-site-theme-root] [class~="bg-[#faf8f4]"],
[data-site-theme-root] [class~="bg-[#f3efe8]"],
[data-site-theme-root] [class~="bg-[#eee9df]"],
[data-site-theme-root] [class~="bg-[#eee9e2]"],
[data-site-theme-root] [class~="bg-[#f7f4ee]"],
[data-site-theme-root] [class~="bg-[#ece8df]"],
[data-site-theme-root] [class~="bg-[#f2e3dc]"] {
  background-color: color-mix(in srgb, var(--primary-bg) 7%, var(--secondary-bg));
}
[data-site-theme-root] [class~="ring-[#a45b42]"],
[data-site-theme-root] [class*="ring-[#a45b42]/"],
[data-site-theme-root] [class*="focus-within:ring-[#a45b42]"] {
  --tw-ring-color: color-mix(in srgb, var(--primary-bg) 55%, transparent);
}
[data-site-theme-root] a[class*="rounded-full"][class*="bg-[#141414]"],
[data-site-theme-root] button[class*="rounded-full"][class*="bg-[#141414]"] {
  background-color: var(--primary-bg);
  color: var(--primary-text);
}
/* Manager detail bodies (blog/service/event/…): restore heading hierarchy */
[data-site-theme-root] .manager-detail-prose h1 {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--secondary-text);
  margin: 1.6em 0 0.55em;
}
[data-site-theme-root] .manager-detail-prose h2 {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--secondary-text);
  margin: 1.7em 0 0.55em;
}
[data-site-theme-root] .manager-detail-prose h3 {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: var(--secondary-text);
  margin: 1.45em 0 0.45em;
}
[data-site-theme-root] .manager-detail-prose h4,
[data-site-theme-root] .manager-detail-prose h5,
[data-site-theme-root] .manager-detail-prose h6 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--secondary-text);
  margin: 1.25em 0 0.4em;
}
[data-site-theme-root] .manager-detail-prose p {
  font-size: 1.125rem;
  line-height: 1.8;
  margin: 0.75em 0;
}
[data-site-theme-root] .manager-detail-prose > :first-child {
  margin-top: 0;
}
[data-site-theme-root] .manager-detail-prose ul,
[data-site-theme-root] .manager-detail-prose ol {
  margin: 0.85em 0;
  padding-left: 1.25em;
}
[data-site-theme-root] .manager-detail-prose li {
  margin: 0.35em 0;
}
[data-site-theme-root]:has([data-section-type="Breadcrumb"]) [data-section-type]:not([data-section-type="Breadcrumb"]) [data-embedded-page-banner] {
  display: none !important;
}
`.trim();
