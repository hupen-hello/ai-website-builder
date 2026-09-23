import {
  getBuiltSiteSections,
  getBuiltSiteTheme,
} from "@/lib/built-site-theme";
import {
  getRedesignExportScriptTag,
  REDESIGN_EXPORT_EXTRA_CSS,
  REDESIGN_PREVIEW_BASE_CSS,
} from "@/lib/redesign-preview-runtime";
import { REDESIGN_SEAMLESS_LAYOUT_CSS } from "@/lib/redesign-section-layout";
import { finalizeRedesignSections } from "@/lib/redesign-single-page";
import {
  REDESIGN_CALL_HREF,
  REDESIGN_WHATSAPP_HREF,
} from "@/lib/redesign-floating-contact";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRedesignFloatingChromeHtml(): string {
  return `<div data-redesign-float="left" class="pointer-events-none fixed bottom-5 left-4 z-[9990] flex flex-col gap-3 md:bottom-6 md:left-6">
  <a href="${REDESIGN_WHATSAPP_HREF}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_12px_32px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 hover:bg-emerald-600">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>
  <a href="${REDESIGN_CALL_HREF}" aria-label="Call" class="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-700">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  </a>
</div>
<div data-redesign-float="right" class="pointer-events-none fixed bottom-5 right-4 z-[9990] flex flex-col items-end gap-3 md:bottom-6 md:right-6">
  <button type="button" data-redesign-scroll-top aria-label="Back to top" class="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white opacity-0 shadow-[0_12px_32px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5 hover:bg-orange-600">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
  </button>
</div>`;
}

export function buildRedesignExportHtml(designId?: string): string | null {
  const sections = getBuiltSiteSections(designId);
  const theme = getBuiltSiteTheme(designId);
  if (!sections?.items?.length) return null;

  const items = finalizeRedesignSections(sections.items, theme?.sectionPlan, {
    brandName: theme?.brandName,
    description: theme?.description,
    logoImage: theme?.logoImage,
    contentImages: theme?.contentImages,
    navItems: theme?.categories?.length ? theme.categories : theme?.navItems,
    contactPhone: theme?.contactPhone,
    contactEmail: theme?.contactEmail,
    contactAddress: theme?.contactAddress,
    referenceSiteName: theme?.referenceSiteName,
    referenceUrl: theme?.referenceUrl,
  });

  const body = items.map((item) => item.html).join("\n");
  const title = theme?.brandName || "Website";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>${REDESIGN_PREVIEW_BASE_CSS}\n${REDESIGN_SEAMLESS_LAYOUT_CSS}\n${REDESIGN_EXPORT_EXTRA_CSS}</style>
</head>
<body class="bg-white text-slate-950">
${body}
${getRedesignFloatingChromeHtml()}
${getRedesignExportScriptTag()}
</body>
</html>`;
}

export function downloadRedesignHtml(designId?: string) {
  const html = buildRedesignExportHtml(designId);
  if (!html) {
    throw new Error("No sections to export. Complete the redesign build first.");
  }

  const theme = getBuiltSiteTheme(designId);
  const slug =
    (theme?.brandName || "website")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "website";

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slug}-index.html`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
