/** Reuse Home header/footer chrome across Create-with-AI multi pages. */

import { injectCreateAiPremiumShell } from "@/lib/create-ai-premium-shell";
import { injectCreateAiWowPolish } from "@/lib/create-ai-wow-polish";
import { applyCreateAiQaRails } from "@/lib/create-ai-qa-rails";
import { injectCreateAiReferenceFinish } from "@/lib/create-ai-reference-finish";

function matchTag(html: string, tag: string) {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "i");
  return html.match(re)?.[0] || "";
}

export function extractCreateAiChrome(homeHtml: string) {
  const header = matchTag(homeHtml, "header");
  const footer = matchTag(homeHtml, "footer");
  const styles = (homeHtml.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []).join(
    "\n",
  );
  const headLinks = (
    homeHtml.match(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi) ||
    []
  ).join("\n");
  const title =
    homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  return { header, footer, styles, headLinks, title };
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip AI prompt leak like "CONTACT: email: … | phone: … | address: …" from page HTML. */
export function stripCreateAiContactPromptLeak(html: string) {
  if (!html) return html;
  let out = html;
  out = out.replace(
    /(?:<(?:p|div|span|li)\b[^>]*>)?\s*CONTACT\s*:\s*email\s*:[^<]*?(?:phone\s*:[^<]*?)?(?:address\s*:[^<]*?)?\s*(?:<\/(?:p|div|span|li)>)?/gi,
    "",
  );
  out = out.replace(
    /CONTACT\s*:\s*email\s*:\s*[^\n<|]+(?:\s*\|\s*phone\s*:\s*[^\n<|]+)?(?:\s*\|\s*address\s*:\s*[^\n<]+)?/gi,
    "",
  );
  // Leak without CONTACT: prefix — e.g. "amwdindia@gmail.com | phone: 123 | address: …"
  out = out.replace(
    /(?:<(?:p|div|span|li|footer)\b[^>]*>)?\s*[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\s*\|\s*phone\s*:\s*[^|<]+(?:\s*\|\s*address\s*:\s*[^<]+)?\s*(?:<\/(?:p|div|span|li)>)?/gi,
    "",
  );
  return out;
}

/** Force footer copyright to the current calendar year (models often stamp 2024/2025). */
export function normalizeCreateAiCopyrightYear(html: string) {
  if (!html) return html;
  const year = String(new Date().getFullYear());
  let out = html;
  out = out.replace(
    /((?:©|&copy;|&#169;|\(c\))\s*)(20(?:2[0-5]|1\d))(\b)/gi,
    `$1${year}$3`,
  );
  out = out.replace(
    /(copyright(?:\s*&copy;|\s*©)?\s*)(20(?:2[0-5]|1\d))(\b)/gi,
    `$1${year}$3`,
  );
  out = out.replace(
    /<(footer)\b([^>]*)>([\s\S]*?)<\/footer>/gi,
    (_block, tag: string, attrs: string, inner: string) => {
      const next = inner.replace(
        /\b(20(?:2[0-5]|1\d))\b(?=[^<]{0,40}(?:all\s+rights|reserved|copyright|©|&copy;))/gi,
        year,
      );
      return `<${tag}${attrs}>${next}</${tag}>`;
    },
  );
  return out;
}

function stripTags(s: string) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * After a clean <header>, AI pages often leave a second nav row (ABOUT/SERVICES…)
 * between header and hero. Remove those orphans — keep mobile panel/scripts.
 */
export function stripOrphanDuplicateNav(html: string) {
  if (!html || !/<header\b/i.test(html)) return html;
  const headerMatch = html.match(/<header\b[\s\S]*?<\/header>/i);
  if (!headerMatch || headerMatch.index == null) return html;
  let out = html;

  // Kill native <select> nav dumps inside header (yellow OS control, truncated labels)
  out = out.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) => {
      let next = inner.replace(/<select\b[\s\S]*?<\/select>/gi, "");
      // Bare text / span dumps of nav labels (no real <a> menu)
      next = next.replace(
        /<(div|span|p|aside)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
        (full, _tag: string, a: string, body: string) => {
          if (/data-cai-|data-create-ai-brand|data-create-ai-logo/i.test(a)) {
            return full;
          }
          if (/<a\b|<img\b|<button\b/i.test(body)) return full;
          const t = stripTags(body);
          if (t.length < 8 || t.length > 120) return full;
          const hits = (
            t.match(
              /\b(about|journeys?|gallery|contact|services|home|blog|pricing)\b/gi,
            ) || []
          ).length;
          return hits >= 3 ? "" : full;
        },
      );
      return `<header${attrs}>${next}</header>`;
    },
  );

  const headerMatch2 = out.match(/<header\b[\s\S]*?<\/header>/i);
  if (!headerMatch2 || headerMatch2.index == null) return out;
  const header = headerMatch2[0];
  const closeEnd = headerMatch2.index + header.length;

  const labels = [...header.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => stripTags(m[1]).toLowerCase())
    .filter(
      (l) =>
        l.length >= 2 &&
        l.length <= 32 &&
        !/book|write|menu|counsel|contact us|get in|begin|journey|plan/i.test(l),
    );
  const uniq = [...new Set(labels)];
  if (uniq.length < 2) {
    // Still strip post-header <select> menus
    const winLen0 = Math.min(2200, out.length - closeEnd);
    let window0 = out.slice(closeEnd, closeEnd + winLen0);
    window0 = window0.replace(/<select\b[\s\S]*?<\/select>/gi, (sel) => {
      const t = stripTags(sel);
      const hits = (
        t.match(
          /\b(about|journeys?|gallery|contact|services|home)\b/gi,
        ) || []
      ).length;
      return hits >= 2 ? "" : sel;
    });
    return out.slice(0, closeEnd) + window0 + out.slice(closeEnd + winLen0);
  }

  const isDupMenu = (block: string) => {
    if (/data-cai-mobile-panel/i.test(block)) return false;
    if (block.length > 2800) return false;
    const t = stripTags(block).toLowerCase();
    if (t.length > 160) return false;
    let hits = 0;
    for (const l of uniq) if (t.includes(l)) hits += 1;
    if (hits >= Math.min(2, uniq.length)) return true;
    const generic = (
      t.match(
        /\b(about|journeys?|gallery|contact|services|home|blog)\b/gi,
      ) || []
    ).length;
    return generic >= 3 && !/<img\b|<h1\b|<h2\b/i.test(block);
  };

  // Only inspect a short window after </header> (don't touch the rest of the page)
  const winLen = Math.min(2200, out.length - closeEnd);
  let window = out.slice(closeEnd, closeEnd + winLen);
  const keep: string[] = [];
  window = window.replace(
    /<nav\b[^>]*data-cai-mobile-panel=["']1["'][^>]*>[\s\S]*?<\/nav>/gi,
    (p) => {
      keep.push(p);
      return "\0KEEP\0";
    },
  );
  window = window.replace(/<select\b[\s\S]*?<\/select>/gi, (sel) =>
    isDupMenu(sel) ? "" : sel,
  );
  window = window.replace(/<(nav|ul)\b[^>]*>[\s\S]*?<\/\1>/gi, (block) =>
    isDupMenu(block) ? "" : block,
  );
  window = window.replace(/<(div|aside|span|p)\b[^>]*>[\s\S]*?<\/\1>/gi, (block) => {
    // only drop short menu-like blocks near the top of the window
    if (window.indexOf(block) > 900) return block;
    return isDupMenu(block) ? "" : block;
  });
  // restore mobile panels
  for (const p of keep) {
    window = window.replace("\0KEEP\0", p);
  }
  window = window.replace(/\0KEEP\0/g, "");

  return out.slice(0, closeEnd) + window + out.slice(closeEnd + winLen);
}

/** Read PNG IHDR width/height from a data:image/png;base64,… URI (first 24 bytes). */
function readPngDimsFromDataUri(
  src: string,
): { w: number; h: number } | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)/i.exec(
    (src || "").trim(),
  );
  if (!m) return null;
  const b64 = m[1].replace(/\s/g, "").slice(0, 48);
  try {
    let bytes: Uint8Array;
    if (typeof Buffer !== "undefined") {
      bytes = new Uint8Array(Buffer.from(b64, "base64"));
    } else if (typeof atob === "function") {
      const bin = atob(b64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      return null;
    }
    if (bytes.length < 24) return null;
    if (
      bytes[0] !== 0x89 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x4e ||
      bytes[3] !== 0x47
    ) {
      return null;
    }
    const w =
      ((bytes[16] << 24) >>> 0) +
      (bytes[17] << 16) +
      (bytes[18] << 8) +
      bytes[19];
    const h =
      ((bytes[20] << 24) >>> 0) +
      (bytes[21] << 16) +
      (bytes[22] << 8) +
      bytes[23];
    if (!w || !h) return null;
    return { w, h };
  } catch {
    return null;
  }
}

/**
 * AI often stamps a country flag (e.g. 100×60) as data-create-ai-logo.
 * Real logos are rarely wide ~3:2 flags at these pixel sizes.
 */
export function isCreateAiDecorativeFlagSrc(src: string): boolean {
  const s = (src || "").trim();
  if (!s) return false;
  if (/flagcdn\.com|flagpedia|\/flags\/|country[-_]?flag/i.test(s)) return true;
  const dim = readPngDimsFromDataUri(s);
  if (!dim) return false;
  const ratio = dim.w / dim.h;
  // Classic web flags: 100×60, 120×80, 64×42, …
  if (ratio < 1.3 || ratio > 2.1) return false;
  return dim.h <= 80 && dim.w <= 200;
}

/**
 * Remove decorative country flags AI invents next to brand (emoji, flagcdn, tiny flag imgs).
 * Safe to run on header inner HTML or full document.
 */
export function stripCreateAiDecorativeFlags(html: string): string {
  if (!html) return html;
  let out = html;
  // Emoji flags (🇮🇳 etc.) + HTML entities
  out = out.replace(/🇮🇳/g, "");
  out = out.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, "");
  out = out.replace(
    /&#x1[Ff]1[EeFf][0-9A-Fa-f];\s*&#x1[Ff]1[EeFf][0-9A-Fa-f];/gi,
    "",
  );
  out = out.replace(
    /&#1274(?:6[6-9]|7[0-9]|8[0-9]|9[0-1]);\s*&#1274(?:6[6-9]|7[0-9]|8[0-9]|9[0-1]);/g,
    "",
  );
  // Common flag image CDNs / filenames / alts
  out = out.replace(
    /<img\b[^>]*(?:flagcdn\.com|flagpedia|\/flags\/|country[-_]?flag|flag[-_]?(?:of|icon|img|svg|png)|\/w\d+\/[a-z]{2}\.png|alt\s*=\s*["'][^"']*(?:flag|india|🇮🇳)[^"']*["'])[^>]*>/gi,
    "",
  );
  // Wrapper spans that only contain a flag leftover
  out = out.replace(
    /<(span|i|em|b|strong)\b([^>]*)>\s*(?:🇮🇳|[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])\s*<\/\1>/gi,
    "",
  );
  // Tiny / CDN-flag imgs only when NOT a stamped user logo
  out = out.replace(
    /<img\b([^>]*)>/gi,
    (full, attrs: string) => {
      const a = attrs || "";
      const isLogo = /data-create-ai-logo|data-cai-logo/i.test(a);
      const src =
        a.match(/\bsrc\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] ||
        a.match(/\bsrc\s*=\s*([^\s>]+)/i)?.[1] ||
        "";
      // Never strip user/onboarding logo — even if PNG is flag-sized
      if (isLogo) return full;
      if (isCreateAiDecorativeFlagSrc(src)) return "";
      if (/flag|india|🇮🇳/i.test(a)) return "";
      const w =
        a.match(/\bwidth\s*=\s*["']?(\d+)/i)?.[1] ||
        a.match(/width\s*:\s*(\d+)px/i)?.[1];
      const h =
        a.match(/\bheight\s*=\s*["']?(\d+)/i)?.[1] ||
        a.match(/height\s*:\s*(\d+)px/i)?.[1];
      const wn = w ? Number(w) : 0;
      const hn = h ? Number(h) : 0;
      if (wn > 0 && wn <= 28 && hn > 0 && hn <= 28) return "";
      if (wn > 0 && wn <= 24 && !h) return "";
      return full;
    },
  );
  return out;
}

/**
 * Deterministic header bar CSS — kills gap / misalignment without fighting AI colors.
 * Safe on every polish. On mobile: hide link row, show ☰, compact padding (no big gap).
 * preserveDesign: light pass for AI-invented headers (keep colors/fonts/CTA shape).
 */
export function normalizeCreateAiHeaderBar(
  html: string,
  options?: { preserveDesign?: boolean; brandName?: string },
) {
  if (!html || !/<header\b/i.test(html)) return html;
  const preserveDesign = options?.preserveDesign === true;
  let out = html.replace(
    /<style[^>]*data-create-ai-header-fix=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  out = out.replace(
    /<script[^>]*data-create-ai-hdr-menu=["']1["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(/<header\b([^>]*)>/i, (_m, attrs: string) => {
    if (/data-create-ai-hdr=/i.test(attrs)) return `<header${attrs}>`;
    return `<header${attrs} data-create-ai-hdr="1">`;
  });

  // Strip decorative country flags AI keeps re-injecting next to brand (flagcdn / 🇮🇳)
  out = out.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) =>
      `<header${attrs}>${stripCreateAiDecorativeFlags(inner)}</header>`,
  );

  // Ensure mobile menu control exists (AI headers often leave desktop links → huge gap)
  out = ensureCreateAiMobileNav(out);
  out = collapseDuplicateHeaderNav(out);
  out = dedupeHeaderBrandText(out, options?.brandName);
  if (options?.brandName) {
    out = stripSecondaryHeaderBrands(out, options.brandName);
  }

  // Soft pass: keep AI invent look — only mobile hide + menu button, no layout flatten
  const css = preserveDesign
    ? `<style data-create-ai-header-fix="1">
header[data-create-ai-hdr="1"]{
  width:100%!important;
  max-width:100%!important;
  box-sizing:border-box!important;
  z-index:40;
}
@media (max-width:900px){
  header[data-create-ai-hdr="1"] nav:not([data-cai-mobile-panel]),
  header[data-create-ai-hdr="1"] > ul{
    display:none!important;
  }
  header[data-create-ai-hdr="1"] [data-cai-menu-btn]{
    display:inline-flex!important;
    width:40px!important;
    height:40px!important;
    align-items:center!important;
    justify-content:center!important;
  }
}
@media (min-width:901px){
  header[data-create-ai-hdr="1"] [data-cai-menu-btn],
  header[data-create-ai-hdr="1"] button[aria-label*="Menu"]{display:none!important}
  [data-cai-mobile-panel]{display:none!important}
}
@media (max-width:900px){
  header[data-create-ai-hdr="1"] button[aria-label*="Menu"]:not([data-cai-menu-btn]),
  header[data-create-ai-hdr="1"] button[aria-label*="menu"]:not([data-cai-menu-btn]),
  header[data-create-ai-hdr="1"] button[aria-label*="Navigation"]:not([data-cai-menu-btn]),
  header[data-create-ai-hdr="1"] [data-cai-menu-btn] ~ [data-cai-menu-btn]{
    display:none!important;
  }
}
[data-cai-mobile-panel][hidden]{display:none!important}
</style>`
    : `<style data-create-ai-header-fix="1">
header[data-create-ai-hdr="1"]{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  flex-wrap:nowrap!important;
  gap:10px 14px!important;
  width:100%!important;
  max-width:100%!important;
  box-sizing:border-box!important;
  padding:12px clamp(12px,3vw,28px)!important;
  margin:0!important;
  min-height:56px;
  max-height:none;
  z-index:40;
}
header[data-create-ai-hdr="1"]:not([data-create-ai-sticky="1"]){
  position:relative;
}
header[data-create-ai-hdr="1"] > hr{position:absolute;left:0;right:0;top:0;margin:0!important;height:1px;border:0;opacity:.55}
/* Brand LEFT; nav/CTA cluster flush RIGHT (handles wrapper divs AI often emits) */
header[data-create-ai-hdr="1"] > nav:not([data-cai-mobile-panel]),
header[data-create-ai-hdr="1"] > div:has(nav:not([data-cai-mobile-panel])),
header[data-create-ai-hdr="1"] > ul:has(a[href]){
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  flex-wrap:nowrap!important;
  gap:10px 18px!important;
  margin:0 0 0 auto!important;
  margin-right:0!important;
  flex:0 1 auto!important;
  min-width:0!important;
  justify-content:flex-end!important;
}
header[data-create-ai-hdr="1"] nav:not([data-cai-mobile-panel]) > a,
header[data-create-ai-hdr="1"] nav:not([data-cai-mobile-panel]) a{
  display:inline-flex!important;
  align-items:center!important;
  white-space:nowrap!important;
  padding:4px 2px!important;
  margin:0!important;
  letter-spacing:normal!important;
  text-decoration:none!important;
}
/* Drop orphan initials (AM) — keep tagged brand chip only */
header[data-create-ai-hdr="1"] [data-cai-brand] ~ [style*="border-radius:999"],
header[data-create-ai-hdr="1"] [data-create-ai-brand] ~ [style*="border-radius: 999"],
header[data-create-ai-hdr="1"] [data-create-ai-logo] ~ span[style*="border-radius:999"],
header[data-create-ai-hdr="1"] nav [style*="border-radius:999"],
header[data-create-ai-hdr="1"] nav [style*="border-radius: 999"],
header[data-create-ai-hdr="1"] > span:not([data-cai-brand]):not([data-create-ai-brand])[style*="border-radius"],
header[data-create-ai-hdr="1"] > div:not([data-cai-brand]):not([data-create-ai-brand]) > span:not([data-cai-brand]):not([data-create-ai-brand])[style*="border-radius"]{
  display:none!important;
}
/* CTA after nav stays on the right cluster */
header[data-create-ai-hdr="1"] > a:last-of-type:not([data-create-ai-brand]):not([data-cai-brand]),
header[data-create-ai-hdr="1"] > button:not([data-cai-menu-btn]):last-of-type{
  flex-shrink:0!important;
  margin-left:12px!important;
}
header[data-create-ai-hdr="1"] a,
header[data-create-ai-hdr="1"] button{
  align-self:center!important;
}
/* Brand cluster: full name on desktop — never "Abhishek M..." */
header[data-create-ai-hdr="1"] [data-cai-brand],
header[data-create-ai-hdr="1"] [data-create-ai-brand],
header[data-create-ai-hdr="1"] > div:first-child{
  display:inline-flex!important;
  align-items:center!important;
  gap:8px!important;
  min-width:0!important;
  flex:0 1 auto!important;
  max-width:min(42vw,420px)!important;
  visibility:visible!important;
  opacity:1!important;
  color:inherit!important;
  font-size:clamp(14px,2.2vw,18px)!important;
  font-weight:700!important;
}
header[data-create-ai-hdr="1"] [data-cai-brand-label]{
  display:inline-block!important;
  visibility:visible!important;
  opacity:1!important;
  color:inherit!important;
  font-size:inherit!important;
  font-weight:700!important;
  line-height:1.2!important;
  white-space:nowrap!important;
  max-width:none!important;
  overflow:visible!important;
  text-overflow:clip!important;
}
@media (min-width:901px){
  header[data-create-ai-hdr="1"] [data-cai-brand],
  header[data-create-ai-hdr="1"] [data-create-ai-brand]{
    max-width:min(38vw,480px)!important;
  }
  header[data-create-ai-hdr="1"] [data-cai-brand-label]{
    max-width:none!important;
    overflow:visible!important;
    text-overflow:clip!important;
  }
}
@media (max-width:900px){
  header[data-create-ai-hdr="1"]{
    padding:10px 12px!important;
    min-height:52px!important;
    gap:8px!important;
  }
  /* Hide desktop link rows only — NEVER hide brand/logo (often an <a> or first child) */
  header[data-create-ai-hdr="1"] nav:not([data-cai-mobile-panel]),
  header[data-create-ai-hdr="1"] > ul,
  header[data-create-ai-hdr="1"] [class*="nav-"]:not([data-cai-mobile-panel]),
  header[data-create-ai-hdr="1"] [class*="menu"]:not([data-cai-menu-btn]):not([data-cai-mobile-panel]):not([data-create-ai-brand]):not([data-cai-brand]){
    display:none!important;
  }
  header[data-create-ai-hdr="1"] [data-cai-menu-btn]{
    display:inline-flex!important;
    flex:0 0 auto!important;
    width:40px!important;
    height:40px!important;
    align-items:center!important;
    justify-content:center!important;
    margin-left:auto!important;
  }
  /* Hide ALL header CTAs on small screens (not only direct children) — frees space for brand name */
  header[data-create-ai-hdr="1"] a:not([data-create-ai-brand]):not([data-cai-brand]):not([data-cai-menu-btn]),
  header[data-create-ai-hdr="1"] button:not([data-cai-menu-btn]){
    display:none!important;
  }
  header[data-create-ai-hdr="1"] [data-cai-menu-btn]{
    display:inline-flex!important;
  }
  header[data-create-ai-hdr="1"] [data-cai-brand],
  header[data-create-ai-hdr="1"] [data-create-ai-brand]{
    max-width:calc(100% - 52px)!important;
  }
  header[data-create-ai-hdr="1"] [data-cai-brand-label]{
    max-width:min(58vw,200px)!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
  header[data-create-ai-hdr="1"] > div:first-child,
  header[data-create-ai-hdr="1"] [data-cai-brand],
  header[data-create-ai-hdr="1"] [data-create-ai-brand],
  header[data-create-ai-hdr="1"] a[data-create-ai-brand],
  header[data-create-ai-hdr="1"] a[data-cai-brand]{
    display:inline-flex!important;
    align-items:center!important;
    visibility:visible!important;
    opacity:1!important;
    max-width:calc(100% - 52px)!important;
    flex:1 1 auto!important;
    min-width:0!important;
  }
  header[data-create-ai-hdr="1"] img,
  header[data-create-ai-hdr="1"] [data-create-ai-logo]{
    height:36px!important;
    width:auto!important;
    max-width:140px!important;
  }
}
@media (min-width:901px){
  header[data-create-ai-hdr="1"] [data-cai-menu-btn],
  header[data-create-ai-hdr="1"] button[aria-label*="Menu"]{display:none!important}
  [data-cai-mobile-panel]{display:none!important}
}
@media (max-width:900px){
  header[data-create-ai-hdr="1"] button[aria-label*="Menu"]:not([data-cai-menu-btn]),
  header[data-create-ai-hdr="1"] button[aria-label*="menu"]:not([data-cai-menu-btn]),
  header[data-create-ai-hdr="1"] button[aria-label*="Navigation"]:not([data-cai-menu-btn]),
  header[data-create-ai-hdr="1"] [data-cai-menu-btn] ~ [data-cai-menu-btn]{
    display:none!important;
  }
}
[data-cai-mobile-panel][hidden]{display:none!important}
</style>`;

  const script = `<script data-create-ai-hdr-menu="1">(function(){var b=document.querySelector("[data-cai-menu-btn]");var p=document.querySelector("[data-cai-mobile-panel]");if(!b||!p)return;b.addEventListener("click",function(){var open=p.getAttribute("hidden")==null;if(open){p.setAttribute("hidden","");p.style.display="none";}else{p.removeAttribute("hidden");p.style.display="block";}});})();<\/script>`;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${css}</head>`);
  } else {
    out = css + out;
  }
  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${script}</body>`);
  } else {
    out += script;
  }
  return stripOrphanDuplicateNav(out);
}

/**
 * If <header> contains 2+ <nav> with the same link labels, keep the first.
 */
function collapseDuplicateHeaderNav(html: string) {
  return html.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (full, attrs: string, inner: string) => {
      const navs = [...inner.matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi)].map(
        (m) => m[0],
      );
      if (navs.length < 2) return full;
      let out = inner;
      const first = stripTags(navs[0]).toLowerCase();
      for (let i = 1; i < navs.length; i += 1) {
        if (/data-cai-mobile-panel/i.test(navs[i])) continue;
        const t = stripTags(navs[i]).toLowerCase();
        let shared = 0;
        for (const word of first.split(/\s+/)) {
          if (word.length > 2 && t.includes(word)) shared += 1;
        }
        if (shared >= 2) out = out.replace(navs[i], "");
      }
      return `<header${attrs}>${out}</header>`;
    },
  );
}

/** True when a header <button> is a hamburger / menu toggle (AI often invents extras). */
function isHeaderHamburgerButton(attrs: string, body: string) {
  const a = attrs || "";
  const t = stripTags(body || "").replace(/\s+/g, " ").trim();
  const blob = `${a}\n${body || ""}`;
  if (/data-cai-menu-btn/i.test(a)) return true;
  if (/aria-label\s*=\s*["'][^"']*(menu|navigation|nav\s*toggle)/i.test(a)) {
    return true;
  }
  if (
    /class\s*=\s*["'][^"']*(hamburger|menu-btn|menu-toggle|nav-toggle|navbar-toggler|md:hidden|lg:hidden)/i.test(
      a,
    )
  ) {
    return true;
  }
  if (/☰|≡|三/.test(body || "") && t.length <= 6) return true;
  if (/^menu$/i.test(t) && t.length <= 8) return true;
  // Lucide / SVG-only menu icons AI invents beside ours
  if (
    /<svg\b/i.test(body || "") &&
    t.length <= 4 &&
    /(menu|hamburger|bars|nav-toggle|lucide-menu|icon-menu)/i.test(blob)
  ) {
    return true;
  }
  if (
    /<svg\b/i.test(body || "") &&
    t.length <= 2 &&
    /(w-10|h-10|w-9|h-9|40px|44px)/i.test(a)
  ) {
    return true;
  }
  return false;
}

/**
 * Keep ONE brand chip; drop repeated brand-name text AI leaves before/beside nav.
 */
export function dedupeHeaderBrandText(html: string, brandName?: string) {
  if (!html || !/<header\b/i.test(html)) return html;
  return html.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) => {
      let h = inner;
      let keptBrand = false;
      h = h.replace(
        /<(span|div|a)\b([^>]*data-(?:create-ai|cai)-brand=["']1["'][^>]*)>([\s\S]*?)<\/\1>/gi,
        (full) => {
          if (keptBrand) return "";
          keptBrand = true;
          return full;
        },
      );
      // Orphan 1–3 letter initials pills (AM in middle) — keep tagged brand only
      h = h.replace(
        /<(span|div)\b([^>]*)>\s*([A-Z]{1,3})\s*<\/\1>/gi,
        (full, _tag: string, a: string, letters: string) => {
          if (
            /data-(?:create-ai|cai)-brand|data-create-ai-logo|data-cai-brand|href=/i.test(
              a,
            )
          ) {
            return full;
          }
          const looksPill =
            /border-radius\s*:\s*999|rounded-full|width\s*:\s*\d{2}px|height\s*:\s*\d{2}px/i.test(
              a,
            );
          if (!looksPill && letters.length > 2) return full;
          if (!looksPill) return full;
          return "";
        },
      );
      const fromChip =
        brandName ||
        stripTags(
          h.match(
            /<(?:span|div|a)\b[^>]*data-(?:create-ai|cai)-brand=["']1["'][^>]*>([\s\S]*?)<\/(?:span|div|a)>/i,
          )?.[1] || "",
        )
          .replace(/\s+/g, " ")
          .trim();
      // Mid-header slogan (e.g. "REPAIR & CARE MASTER") when brand chip already exists
      if (keptBrand && fromChip) {
        h = h.replace(
          /<(span|div|strong|p|a)\b([^>]*)>\s*([A-Z0-9][A-Z0-9\s&\-]{6,48})\s*<\/\1>/g,
          (full, _tag: string, a: string, text: string) => {
            if (
              /data-(?:create-ai|cai)-brand|data-cai-brand-label|href=.*#|nav|menu/i.test(
                a + full,
              )
            ) {
              return full;
            }
            const t = text.replace(/\s+/g, " ").trim();
            if (new RegExp(escapeRegExp(fromChip), "i").test(t)) {
              return full;
            }
            if (
              /^[A-Z0-9][A-Z0-9\s&\-]{6,}$/.test(t) &&
              t.split(/\s+/).length <= 8
            ) {
              return "";
            }
            return full;
          },
        );
      }
      if (keptBrand && fromChip && fromChip.length >= 2) {
        const esc = escapeRegExp(fromChip);
        h = h.replace(
          new RegExp(
            `<(span|div|a|p|strong|h[1-6])\\b([^>]*)>\\s*${esc}\\s*<\\/\\1>`,
            "gi",
          ),
          (full, _tag: string, a: string) => {
            // NEVER strip the label inside the brand chip (was deleting logo+name text)
            if (
              /data-(?:create-ai|cai)-brand|data-cai-brand-label/i.test(a)
            ) {
              return full;
            }
            if (/href=|button|cta|nav|menu|btn/i.test(a + full)) return full;
            return "";
          },
        );
      }
      return `<header${attrs}>${h}</header>`;
    },
  );
}

/**
 * If header has nav links but no mobile ☰, inject menu button + panel from those links.
 * Fixes mobile "big gap" (brand left, sparse About/Services right with empty middle).
 */
function ensureCreateAiMobileNav(html: string) {
  if (!html) return html;
  let out = html;
  // Fresh panel each time we normalize
  out = out.replace(
    /<nav\b[^>]*data-cai-mobile-panel=["']1["'][^>]*>[\s\S]*?<\/nav>/gi,
    "",
  );
  // Strip ALL hamburgers (ours + AI-invented) so tablet/mobile never get 2 ☰
  out = out.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) => {
      const next = inner.replace(
        /<button\b([^>]*)>([\s\S]*?)<\/button>/gi,
        (full, a: string, body: string) =>
          isHeaderHamburgerButton(a, body) ? "" : full,
      );
      return `<header${attrs}>${next}</header>`;
    },
  );

  const header = out.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  if (!header) return out;

  type Link = {
    href: string;
    label: string;
    pageId?: string;
    missing?: boolean;
  };
  const links: Link[] = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(header))) {
    const attrs = m[1] || "";
    const label = stripTags(m[2]);
    if (!label || label.length > 40) continue;
    if (/^book\b|^consult\b|^write\b|^plan\b/i.test(label)) continue;
    if (/mailto:|tel:|wa\.me/i.test(attrs)) continue;
    const href =
      attrs.match(/\bhref=(["'])([^"']*)\1/i)?.[2] || "javascript:void(0)";
    const pageId = attrs.match(
      /\bdata-create-ai-page=(["'])([^"']+)\1/i,
    )?.[2];
    const missing = /\bdata-create-ai-page-missing=(["'])1\1/i.test(attrs);
    if (links.some((l) => l.label.toLowerCase() === label.toLowerCase())) {
      continue;
    }
    links.push({ href, label, pageId, missing });
    if (links.length >= 10) break;
  }
  if (!links.length) {
    links.push(
      { href: "javascript:void(0)", label: "Home", pageId: "home" },
      { href: "javascript:void(0)", label: "About" },
      { href: "javascript:void(0)", label: "Services" },
      { href: "javascript:void(0)", label: "Contact" },
    );
  }

  const accent =
    header.match(/#([0-9a-f]{3,8})/i)?.[0] ||
    "currentColor";
  const btn = `<button type="button" data-cai-menu-btn="1" aria-label="Menu" aria-expanded="false" style="display:none;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid ${accent};background:transparent;color:inherit;cursor:pointer;border-radius:8px;flex-shrink:0;font-size:18px;line-height:1">☰</button>`;
  const panelLinks = links
    .map((l) => {
      const pageAttr = l.pageId
        ? ` data-create-ai-page="${escapeHtml(l.pageId)}"`
        : l.missing
          ? ` data-create-ai-page-missing="1"`
          : "";
      return `<a href="${escapeHtml(l.href)}"${pageAttr} style="display:block;padding:12px 4px;color:inherit;text-decoration:none;border-bottom:1px solid rgba(127,127,127,.2)">${escapeHtml(l.label)}</a>`;
    })
    .join("");
  const panel = `<nav data-cai-mobile-panel="1" hidden style="display:none;padding:8px 14px 16px;border-bottom:1px solid rgba(127,127,127,.2)">${panelLinks}</nav>`;

  // Insert menu button before </header>
  out = out.replace(/<\/header>/i, `${btn}</header>`);
  // Panel right after header
  out = out.replace(/<\/header>/i, `</header>\n${panel}`);
  return out;
}

/**
 * Last-resort clean header — always produces one flex bar with brand + nav + CTA + mobile menu.
 * Works even when <header> was deleted/corrupted by a bad sticky wrap.
 */
export function rebuildCreateAiHeaderBar(
  html: string,
  brandName: string,
  theme?: { bg?: string; fg?: string; accent?: string },
) {
  if (!html) return html;
  let out = html;
  // Clear sticky-chrome leftovers that ate the nav
  out = out.replace(
    /<div\b[^>]*data-create-ai-sticky-chrome=["']1["'][^>]*>\s*/gi,
    "",
  );
  out = out.replace(
    /(<\/header>)\s*<\/div>\s*(?:<!--\s*cai-sticky-end\s*-->)?/gi,
    "$1",
  );
  out = out.replace(/<!--\s*cai-sticky-end\s*-->/gi, "");
  // Logo must not live inside the contact topbar
  out = out.replace(
    /<(div|aside)\b([^>]*data-create-ai-topbar=["']1["'][^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag: string, attrs: string, inner: string) => {
      const cleaned = inner.replace(/<img\b[^>]*>/gi, "");
      return `<${tag}${attrs}>${cleaned}</${tag}>`;
    },
  );

  const prev = out.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  const brand = (brandName || "Brand").trim() || "Brand";

  const logoSrc = extractCreateAiLogoSrc(out);
  const logoImg = logoSrc
    ? `<img src="${logoSrc.replace(/"/g, "&quot;")}" alt="${escapeHtml(brand)}" data-create-ai-logo="1" style="height:40px;width:auto;max-width:160px;object-fit:contain;display:block;border-radius:999px" />`
    : prev.match(/<img\b[^>]*(?:logo|brand|create-ai-logo)[^>]*>/i)?.[0] ||
      prev.match(/<img\b[^>]*>/i)?.[0] ||
      "";

  type Link = { href: string; label: string };
  const links: Link[] = [];
  const collectLinks = (scope: string) => {
    const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(scope))) {
      const href = m[1];
      const label = stripTags(m[2]);
      if (!label || label.length > 40) continue;
      if (/^book\b|^plan\b|^reserve\b|^write\b|^begin\b/i.test(label)) continue;
      if (/mailto:|tel:|wa\.me/i.test(href)) continue;
      if (links.some((l) => l.label.toLowerCase() === label.toLowerCase())) {
        continue;
      }
      links.push({ href, label });
      if (links.length >= 8) break;
    }
  };
  if (prev) collectLinks(prev);
  // From page section ids when header is empty/corrupt
  if (links.length < 2) {
    const ids = [
      ...out.matchAll(
        /<(?:section|div|main)\b[^>]*(?:id|data-create-ai-page)=["']([^"']+)["'][^>]*>/gi,
      ),
    ].map((x) => x[1]);
    const seen = new Set<string>();
    for (const id of ids) {
      const key = id.replace(/^#/, "").toLowerCase();
      if (!key || seen.has(key)) continue;
      if (/^(home|hero|root|app)$/i.test(key)) continue;
      if (
        !/about|journey|service|galler|contact|blog|team|pricing|faq|process/i.test(
          key,
        )
      ) {
        continue;
      }
      seen.add(key);
      const label = key
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      links.push({ href: `#${key}`, label });
      if (links.length >= 6) break;
    }
  }
  if (!links.length) {
    links.push(
      { href: "#about", label: "About" },
      { href: "#journeys", label: "Journeys" },
      { href: "#gallery", label: "Gallery" },
      { href: "#contact", label: "Contact" },
    );
  }

  const ctaMatch = prev.match(
    /<(?:a|button)\b[^>]*(?:border-radius|padding\s*:\s*\d)[^>]*>[\s\S]*?<\/(?:a|button)>/i,
  )?.[0];
  const ctaHref =
    ctaMatch?.match(/href=["']([^"']+)["']/i)?.[1] ||
    links.find((l) => /contact/i.test(l.href) || /contact/i.test(l.label))
      ?.href ||
    "#contact";
  let ctaLabel = (ctaMatch ? stripTags(ctaMatch) : "").replace(/\s+/g, " ").trim();
  // Never keep mashed nav/brand text as CTA ("Abhishek Mishra About Servic")
  if (
    !ctaLabel ||
    ctaLabel.length > 28 ||
    (/about|service|galler|home|contact|abhishek|mishra/i.test(ctaLabel) &&
      ctaLabel.split(/\s+/).length >= 3)
  ) {
    ctaLabel = "Get in touch";
  }
  const navLinks = links.filter(
    (l) => !/book|write to|counsel|begin your|plan your|get in touch/i.test(l.label),
  );

  const bg =
    theme?.bg ||
    prev.match(/background(?:-color)?\s*:\s*([^;\"']+)/i)?.[1]?.trim() ||
    "#f7f4ef";
  const fg =
    theme?.fg ||
    prev.match(/(?:^|[;{\s])color\s*:\s*([^;\"']+)/i)?.[1]?.trim() ||
    "#111111";
  const accent =
    theme?.accent ||
    prev.match(
      /(?:#c9a227|#d4af37|#c4a35a|#16a34a|#22c55e|rgb\(\s*20[0-9].*?\)|gold)/i,
    )?.[0] ||
    "#16a34a";

  const navDesktop = navLinks
    .map(
      (l) =>
        `<a href="${escapeHtml(l.href)}" style="color:inherit;text-decoration:none;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap">${escapeHtml(l.label)}</a>`,
    )
    .join("");
  const navMobile = navLinks
    .map(
      (l) =>
        `<a href="${escapeHtml(l.href)}" style="display:block;padding:12px 4px;color:inherit;text-decoration:none;border-bottom:1px solid rgba(127,127,127,.2)">${escapeHtml(l.label)}</a>`,
    )
    .join("");

  const mark = logoImg
    ? logoImg.replace(/style=["'][^"']*["']/i, "").replace(
        /<img\b/i,
        `<img data-create-ai-logo="1" style="height:40px;width:auto;max-width:160px;object-fit:contain;display:block;border-radius:999px"`,
      )
    : `<span data-create-ai-brand="1" data-cai-brand="1" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;background:${accent};color:#fff;font:800 13px/1 Georgia,serif">${escapeHtml(
        brand
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "M",
      )}</span>`;

  const header = `<header data-create-ai-hdr="1" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 24px;background:${bg};color:${fg};border-bottom:1px solid rgba(127,127,127,.2)">
<div style="display:flex;align-items:center;gap:12px;min-width:0">
${mark}
<div style="font:700 15px/1.2 Georgia,serif;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(280px,36vw)">${escapeHtml(brand)}</div>
</div>
<nav style="display:flex;align-items:center;gap:18px">${navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:999px;background:${accent};color:#fff;text-decoration:none;font:700 12px/1 system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap">${escapeHtml(ctaLabel.slice(0, 22))}</a>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid ${accent};background:transparent;color:${fg};cursor:pointer;border-radius:8px">☰</button>
</div>
</header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:${bg};color:${fg};padding:8px 16px 16px;border-bottom:1px solid rgba(127,127,127,.2)">${navMobile}</nav>
<script data-create-ai-hdr-menu="1">(function(){var b=document.querySelector("[data-cai-menu-btn]");var p=document.querySelector("[data-cai-mobile-panel]");if(!b||!p)return;b.addEventListener("click",function(){var open=p.getAttribute("hidden")==null;if(open){p.setAttribute("hidden","");p.style.display="none";}else{p.removeAttribute("hidden");p.style.display="block";}});})();<\/script>`;

  if (/<header\b/i.test(out)) {
    out = out.replace(/<header\b[\s\S]*?<\/header>/i, header);
  } else if (/data-create-ai-topbar=["']1["']/i.test(out)) {
    out = out.replace(
      /(<(?:div|aside)\b[^>]*data-create-ai-topbar=["']1["'][^>]*>[\s\S]*?<\/(?:div|aside)>)/i,
      `$1\n${header}`,
    );
  } else if (/<body\b[^>]*>/i.test(out)) {
    out = out.replace(/<body\b[^>]*>/i, (open) => `${open}\n${header}`);
  } else {
    out = header + out;
  }

  // Drop old mobile panels / scripts then keep one from rebuild string
  out = out.replace(
    /<nav\b[^>]*data-cai-mobile-panel=["']1["'][^>]*>[\s\S]*?<\/nav>/gi,
    "",
  );
  // Re-insert panel that was part of header string — header replace already included it after </header>
  // but we just stripped all panels; re-add from the header block we built
  if (!/data-cai-mobile-panel=["']1["']/i.test(out)) {
    out = out.replace(
      /<\/header>/i,
      `</header>\n<nav data-cai-mobile-panel="1" hidden style="display:none;background:${bg};color:${fg};padding:8px 16px 16px;border-bottom:1px solid rgba(0,0,0,.08)">${navMobile}</nav>`,
    );
  }
  out = out.replace(
    /<script[^>]*data-create-ai-hdr-menu=["']1["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  const menuScript = `<script data-create-ai-hdr-menu="1">(function(){var b=document.querySelector("[data-cai-menu-btn]");var p=document.querySelector("[data-cai-mobile-panel]");if(!b||!p)return;b.addEventListener("click",function(){var open=p.getAttribute("hidden")==null;if(open){p.setAttribute("hidden","");p.style.display="none";}else{p.removeAttribute("hidden");p.style.display="block";}});})();<\/script>`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${menuScript}</body>`);
  else out += menuScript;

  out = stripOrphanDuplicateNav(out);
  return stripOrphanDuplicateNav(normalizeCreateAiHeaderBar(out));
}

type HeaderInventVariant = {
  id: string;
  label: string;
  cta: string;
  build: (p: {
    brand: string;
    mark: string;
    navDesktop: string;
    navMobile: string;
    ctaHref: string;
  }) => string;
};

const HEADER_INVENT_VARIANTS: HeaderInventVariant[] = [
  {
    id: "cream-editorial",
    label: "cream editorial",
    cta: "Book a viewing",
    build: ({ brand, mark, navDesktop, navMobile, ctaHref }) =>
      `<header data-create-ai-hdr="1" data-cai-hdr-style="cream-editorial" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 28px;background:#f7f1e8;color:#1c1917;border-bottom:1px solid #e7e0d5">
<div style="display:flex;align-items:center;gap:12px;min-width:0;flex:0 1 auto">${mark}<div style="font:700 18px/1.1 Georgia,'Times New Roman',serif;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(brand)}</div></div>
<nav style="display:flex;align-items:center;gap:22px;font:500 13px/1.2 Georgia,serif;flex:1 1 auto;justify-content:center">${navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;padding:11px 18px;border-radius:999px;background:#c2410c;color:#fff;text-decoration:none;font:700 12px/1 system-ui,sans-serif">Book a viewing</a>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;width:40px;height:40px;border:1px solid #c2410c;background:transparent;color:#1c1917;border-radius:8px;cursor:pointer">☰</button>
</div></header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:#f7f1e8;color:#1c1917;padding:8px 16px 16px">${navMobile}</nav>`,
  },
  {
    id: "centered-stack",
    label: "centered stack",
    cta: "Start consult",
    build: ({ brand, mark, navDesktop, navMobile, ctaHref }) =>
      `<header data-create-ai-hdr="1" data-cai-hdr-style="centered-stack" style="display:flex;flex-direction:column;align-items:stretch;gap:0;padding:0;background:#fffaf5;color:#1c1917;border-bottom:3px solid #9a3412">
<div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 24px 8px;position:relative">
${mark}<div style="font:700 20px/1.1 Georgia,serif;letter-spacing:.02em;text-align:center">${escapeHtml(brand)}</div>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;position:absolute;right:16px;top:50%;transform:translateY(-50%);width:40px;height:40px;border:1px solid #9a3412;background:transparent;color:#1c1917;border-radius:8px;cursor:pointer">☰</button>
</div>
<div style="display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;padding:8px 24px 16px">
<nav style="display:flex;align-items:center;justify-content:center;gap:20px;font:500 13px/1 Georgia,serif">${navDesktop}</nav>
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;padding:10px 18px;border-radius:4px;background:#9a3412;color:#fff7ed;text-decoration:none;font:700 12px/1 system-ui,sans-serif">Start consult</a>
</div></header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:#fffaf5;color:#1c1917;padding:8px 16px 16px">${navMobile}</nav>`,
  },
  {
    id: "navy-sky",
    label: "navy modern",
    cta: "Talk to us",
    build: ({ brand, mark, navDesktop, navMobile, ctaHref }) =>
      `<header data-create-ai-hdr="1" data-cai-hdr-style="navy-sky" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 24px;background:#0f172a;color:#f8fafc">
<div style="display:flex;align-items:center;gap:10px;min-width:0">${mark}<div style="font:800 14px/1.1 'Trebuchet MS',Segoe UI,sans-serif;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(brand)}</div></div>
<nav style="display:flex;align-items:center;gap:18px;font:600 11px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase">${navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;padding:10px 16px;border-radius:4px;background:#38bdf8;color:#0f172a;text-decoration:none;font:800 11px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase">Talk to us</a>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;width:40px;height:40px;border:1px solid #38bdf8;background:transparent;color:#f8fafc;border-radius:4px;cursor:pointer">☰</button>
</div></header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:#0f172a;color:#f8fafc;padding:8px 16px 16px">${navMobile}</nav>`,
  },
  {
    id: "pill-rail",
    label: "pill rail",
    cta: "Book now",
    build: ({ brand, mark, navDesktop, navMobile, ctaHref }) =>
      `<header data-create-ai-hdr="1" data-cai-hdr-style="pill-rail" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 22px;background:#f8fafc;color:#0f172a">
<div style="display:flex;align-items:center;gap:10px;min-width:0;flex-shrink:0">${mark}<div style="font:800 15px/1 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(brand)}</div></div>
<nav style="display:flex;align-items:center;gap:4px;padding:6px 8px;border-radius:999px;background:#e2e8f0;font:600 12px/1 system-ui,sans-serif">${navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;padding:11px 20px;border-radius:999px;background:#4f46e5;color:#fff;text-decoration:none;font:700 12px/1 system-ui,sans-serif">Book now</a>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;width:40px;height:40px;border:1px solid #4f46e5;background:transparent;color:#0f172a;border-radius:999px;cursor:pointer">☰</button>
</div></header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:#f8fafc;color:#0f172a;padding:8px 16px 16px">${navMobile}</nav>`,
  },
  {
    id: "charcoal-gold",
    label: "charcoal gold",
    cta: "Enquire",
    build: ({ brand, mark, navDesktop, navMobile, ctaHref }) =>
      `<header data-create-ai-hdr="1" data-cai-hdr-style="charcoal-gold" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 24px;background:#111111;color:#f5f5f4;border-bottom:2px solid #c9a227">
<div style="display:flex;align-items:center;gap:12px;min-width:0">${mark}<div style="font:600 15px/1.15 Palatino,Georgia,serif;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(brand)}</div></div>
<nav style="display:flex;align-items:center;gap:20px;font:500 12px/1 Georgia,serif;letter-spacing:.08em;text-transform:uppercase;opacity:.92">${navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;padding:10px 18px;border-radius:0;border:1px solid #c9a227;background:transparent;color:#c9a227;text-decoration:none;font:700 11px/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase">Enquire</a>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;width:40px;height:40px;border:1px solid #c9a227;background:transparent;color:#f5f5f4;border-radius:0;cursor:pointer">☰</button>
</div></header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:#111;color:#f5f5f4;padding:8px 16px 16px">${navMobile}</nav>`,
  },
  {
    id: "split-ink",
    label: "split ink",
    cta: "Connect",
    build: ({ brand, mark, navDesktop, navMobile, ctaHref }) =>
      `<header data-create-ai-hdr="1" data-cai-hdr-style="split-ink" style="display:flex;align-items:stretch;justify-content:space-between;gap:0;padding:0;background:#fff;color:#0f172a;border-bottom:1px solid #e2e8f0;overflow:hidden">
<div style="display:flex;align-items:center;gap:10px;padding:14px 20px;background:#020617;color:#f8fafc;min-width:0;flex:0 1 auto">${mark}<div style="font:800 13px/1.1 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(brand)}</div></div>
<div style="display:flex;align-items:center;justify-content:flex-end;gap:18px;padding:14px 20px;flex:1 1 auto;min-width:0">
<nav style="display:flex;align-items:center;gap:16px;font:600 12px/1 system-ui,sans-serif">${navDesktop}</nav>
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;padding:10px 16px;border-radius:6px;background:#0f172a;color:#fff;text-decoration:none;font:700 12px/1 system-ui,sans-serif">Connect</a>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;width:40px;height:40px;border:1px solid #0f172a;background:transparent;color:#0f172a;border-radius:6px;cursor:pointer">☰</button>
</div></header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:#fff;color:#0f172a;padding:8px 16px 16px">${navMobile}</nav>`,
  },
  {
    id: "minimal-line",
    label: "minimal line",
    cta: "Contact",
    build: ({ brand, mark, navDesktop, navMobile, ctaHref }) =>
      `<header data-create-ai-hdr="1" data-cai-hdr-style="minimal-line" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 28px;background:#ffffff;color:#171717;border-bottom:1px solid #171717">
<div style="display:flex;align-items:center;gap:10px;min-width:0">${mark}<div style="font:600 15px/1 'Trebuchet MS',sans-serif;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(brand)}</div></div>
<nav style="display:flex;align-items:center;gap:24px;font:500 12px/1 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;border-bottom:none">${navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
<a href="${escapeHtml(ctaHref)}" style="display:inline-flex;padding:0;border:0;background:transparent;color:#171717;text-decoration:underline;text-underline-offset:4px;font:700 12px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase">Contact</a>
<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;width:40px;height:40px;border:1px solid #171717;background:transparent;color:#171717;border-radius:0;cursor:pointer">☰</button>
</div></header>
<nav data-cai-mobile-panel="1" hidden style="display:none;background:#fff;color:#171717;padding:8px 16px 16px">${navMobile}</nav>`,
  },
];

/**
 * Instant "header new" — rotate handcrafted distinct headers (no slow AI look-alike).
 * Guarantees visible difference each time (colors + CTA + structure).
 */
export function rotateInventCreateAiHeader(
  html: string,
  brandName: string,
): { html: string; variantLabel: string; variantId: string } {
  if (!html) return { html, variantLabel: "", variantId: "" };
  let out = html;
  const prev = out.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  const brand = (brandName || "Brand").trim() || "Brand";
  const prevId =
    prev.match(/data-cai-hdr-style=["']([^"']+)["']/i)?.[1]?.trim() || "";
  // Sequential — never random-repeat the same look (charcoal → charcoal)
  const prevIdx = HEADER_INVENT_VARIANTS.findIndex((v) => v.id === prevId);
  const variant =
    HEADER_INVENT_VARIANTS[
      (prevIdx + 1 + HEADER_INVENT_VARIANTS.length) %
        HEADER_INVENT_VARIANTS.length
    ];

  const logoSrc = extractCreateAiLogoSrc(out);
  const initials =
    brand
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AM";
  const markTone: Record<string, { bg: string; fg: string; radius: string }> = {
    "cream-editorial": { bg: "#c2410c", fg: "#fff7ed", radius: "8px" },
    "centered-stack": { bg: "#9a3412", fg: "#fff7ed", radius: "4px" },
    "navy-sky": { bg: "#38bdf8", fg: "#0f172a", radius: "4px" },
    "pill-rail": { bg: "#4f46e5", fg: "#fff", radius: "999px" },
    "charcoal-gold": { bg: "#c9a227", fg: "#111", radius: "0" },
    "split-ink": { bg: "#f8fafc", fg: "#020617", radius: "6px" },
    "minimal-line": { bg: "#171717", fg: "#fff", radius: "0" },
  };
  const tone = markTone[variant.id] || {
    bg: "#c9a227",
    fg: "#111",
    radius: "8px",
  };
  const mark = logoSrc
    ? `<img src="${logoSrc.replace(/"/g, "&quot;")}" alt="${escapeHtml(brand)}" data-create-ai-logo="1" style="height:36px;width:auto;max-width:140px;object-fit:contain;display:block;border-radius:${tone.radius}" />`
    : `<span data-create-ai-brand="1" data-cai-brand="1" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:${tone.radius};background:${tone.bg};color:${tone.fg};font:800 12px/1 system-ui,sans-serif">${escapeHtml(initials)}</span>`;

  type Link = { href: string; label: string };
  const links: Link[] = [];
  const collectLinks = (scope: string) => {
    const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(scope))) {
      const href = m[1];
      const label = stripTags(m[2]).replace(/\s+/g, " ").trim();
      if (!label || label.length > 28) continue;
      if (/mailto:|tel:|wa\.me/i.test(href)) continue;
      if (
        /book|schedule|enquire|connect|talk|plan visit|get in touch|contact$/i.test(
          label,
        ) &&
        !/^contact$/i.test(label)
      ) {
        continue;
      }
      if (links.some((l) => l.label.toLowerCase() === label.toLowerCase())) {
        continue;
      }
      links.push({ href, label });
      if (links.length >= 6) break;
    }
  };
  if (prev) collectLinks(prev);
  if (links.length < 2) {
    links.push(
      { href: "#", label: "Home" },
      { href: "#about", label: "About" },
      { href: "#services", label: "Services" },
      { href: "#gallery", label: "Gallery" },
      { href: "#contact", label: "Contact" },
    );
  }
  const ctaHref =
    links.find((l) => /contact/i.test(l.label) || /contact/i.test(l.href))
      ?.href || "#contact";
  const navLinks = links.filter(
    (l) => !/book|schedule|enquire|connect|talk|plan visit|get in touch/i.test(l.label),
  );
  const navDesktop = navLinks
    .map(
      (l) =>
        `<a href="${escapeHtml(l.href)}" style="color:inherit;text-decoration:none;white-space:nowrap">${escapeHtml(l.label)}</a>`,
    )
    .join("");
  const navMobile = navLinks
    .map(
      (l) =>
        `<a href="${escapeHtml(l.href)}" style="display:block;padding:12px 4px;color:inherit;text-decoration:none;border-bottom:1px solid rgba(127,127,127,.2)">${escapeHtml(l.label)}</a>`,
    )
    .join("");

  const block = variant.build({
    brand,
    mark,
    navDesktop,
    navMobile,
    ctaHref,
  });
  const headerOnly = block.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  const panelOnly =
    block.match(
      /<nav\b[^>]*data-cai-mobile-panel=["']1["'][^>]*>[\s\S]*?<\/nav>/i,
    )?.[0] || "";

  out = out.replace(
    /<nav\b[^>]*data-cai-mobile-panel=["']1["'][^>]*>[\s\S]*?<\/nav>/gi,
    "",
  );
  out = out.replace(
    /<script[^>]*data-create-ai-hdr-menu=["']1["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  if (/<header\b/i.test(out)) {
    out = out.replace(/<header\b[\s\S]*?<\/header>/i, headerOnly);
  } else if (/<body\b[^>]*>/i.test(out)) {
    out = out.replace(/<body\b[^>]*>/i, (open) => `${open}\n${headerOnly}`);
  } else {
    out = headerOnly + out;
  }
  if (panelOnly) {
    out = out.replace(/<\/header>/i, `</header>\n${panelOnly}`);
  }
  const menuScript = `<script data-create-ai-hdr-menu="1">(function(){var b=document.querySelector("[data-cai-menu-btn]");var p=document.querySelector("[data-cai-mobile-panel]");if(!b||!p)return;b.addEventListener("click",function(){var open=p.getAttribute("hidden")==null;if(open){p.setAttribute("hidden","");p.style.display="none";}else{p.removeAttribute("hidden");p.style.display="block";}});})();<\/script>`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${menuScript}</body>`);
  else out += menuScript;

  out = normalizeCreateAiHeaderBar(stripOrphanDuplicateNav(out), {
    preserveDesign: true,
  });
  return {
    html: out,
    variantLabel: variant.label,
    variantId: variant.id,
  };
}

/** True when nav header is missing or too empty to use. */
export function isCreateAiHeaderBroken(html: string): boolean {
  if (!html) return true;
  const hdr = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  if (!hdr || hdr.length < 80) return true;
  const links = (hdr.match(/<a\b/gi) || []).length;
  if (links < 2) return true;
  // Logo stuck only in topbar + empty-ish header
  const topHasLogo =
    /data-create-ai-topbar=["']1["'][\s\S]{0,800}?<img\b/i.test(html);
  const hdrHasLogo = /<img\b/i.test(hdr) || /data-create-ai-logo/i.test(hdr);
  if (topHasLogo && !hdrHasLogo && links < 3) return true;
  return false;
}

/** Prefer existing stamped logo src from HTML. */
export function extractCreateAiLogoSrc(html: string): string {
  if (!html) return "";
  const a = html.match(
    /<img\b[^>]*data-create-ai-logo=["']1["'][^>]*src=["']([^"']+)["'][^>]*>/i,
  )?.[1];
  if (a) return a.trim();
  const b = html.match(
    /<img\b[^>]*src=["']([^"']+)["'][^>]*data-create-ai-logo=["']1["'][^>]*>/i,
  )?.[1];
  if (b) return b.trim();
  // Fallback: first header image that looks like a logo (not huge hero)
  const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i)?.[1] || "";
  const imgs = [...header.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  for (const m of imgs) {
    const src = (m[1] || "").trim();
    if (isCreateAiDecorativeFlagSrc(src)) continue;
    if (src.startsWith("data:image") || /\.(png|jpe?g|webp|svg)/i.test(src)) {
      return src;
    }
  }
  return "";
}

/** Put onboarding / chat logo into the site header — exactly ONE logo. */
export function injectBrandLogo(
  html: string,
  logoImage: string,
  brandName: string,
) {
  const logo = (logoImage || "").trim();
  if (!logo || !html) return html;
  const safeSrc = logo.replace(/"/g, "&quot;");
  const alt = escapeHtml(brandName || "Logo");
  const imgTag = `<img src="${safeSrc}" alt="${alt}" data-create-ai-logo="1" style="height:42px;width:auto;max-width:180px;object-fit:contain;display:block;flex-shrink:0" />`;
  const brandChip = `<span data-create-ai-brand="1" data-cai-brand="1" class="brand" style="display:inline-flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.02em;max-width:min(42vw,420px);z-index:5;position:relative;color:inherit;font-size:clamp(14px,2.2vw,18px);visibility:visible;opacity:1">${imgTag}<span data-cai-brand-label="1" style="white-space:nowrap;overflow:visible;text-overflow:clip;color:inherit;font-size:inherit;font-weight:700;line-height:1.2;visibility:visible;opacity:1;max-width:none">${escapeHtml(brandName || "Brand")}</span></span>`;

  if (!/<header\b/i.test(html)) {
    return html.replace(/<img\b[^>]*>/i, imgTag);
  }

  const next = html.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) => {
      let h = inner;

      // Remove prior brand chips / stamped logos
      h = h.replace(
        /<(span|div)\b[^>]*data-create-ai-brand=["']1["'][^>]*>[\s\S]*?<\/\1>/gi,
        "",
      );
      h = h.replace(
        /<(span|div|a)\b[^>]*data-cai-brand=["']1["'][^>]*>[\s\S]*?<\/\1>/gi,
        "",
      );
      h = h.replace(/<img\b[^>]*data-create-ai-logo=["']1["'][^>]*>/gi, "");

      // Drop circular/square letter marks (AM avatar — any radius)
      h = h.replace(
        /<(div|span)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
        (full, _t: string, a: string, body: string) => {
          if (/data-(?:create-ai|cai)-brand|data-create-ai-logo|href=/i.test(a)) {
            return full;
          }
          const text = stripTags(body).replace(/\s+/g, "");
          if (text.length >= 1 && text.length <= 3 && /^[A-Za-z]+$/.test(text)) {
            if (
              /background|border-radius|rounded|width\s*:\s*\d|height\s*:\s*\d/i.test(
                a + full,
              )
            ) {
              return "";
            }
          }
          return full;
        },
      );

      // Strip ALL remaining header <img> so we never keep old + new logo
      h = h.replace(/<img\b[^>]*>/gi, "");

      // Drop bare brand-name text that would duplicate the chip label
      if (brandName) {
        const brandEsc = escapeHtml(brandName).replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        h = h.replace(
          new RegExp(
            `<(span|div|a|p|strong|h[1-6])\\b([^>]*)>\\s*${brandEsc}\\s*<\\/\\1>`,
            "gi",
          ),
          (full, _tag: string, a: string) => {
            if (/href=|button|cta|nav|menu/i.test(a + full)) return full;
            return "";
          },
        );
      }

      return `<header${attrs}>${brandChip}${h}</header>`;
    },
  );
  return stripSecondaryHeaderBrands(next, brandName);
}

/**
 * When onboarding logo chip exists, drop AI's second brand (AM + "REPAIR & ASSET CARE").
 */
export function stripSecondaryHeaderBrands(html: string, brandName?: string) {
  if (!html || !/<header\b/i.test(html)) return html;
  const brand = (brandName || "").trim();
  return html.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) => {
      let h = inner;
      const hasOur =
        /data-(?:create-ai|cai)-brand=["']1["']/i.test(h) ||
        /data-create-ai-logo=["']1["']/i.test(h);
      if (!hasOur) return `<header${attrs}>${h}</header>`;

      // 1–3 letter marks (AM) not inside our chip
      h = h.replace(
        /<(span|div)\b([^>]*)>\s*([A-Za-z]{1,3})\s*<\/\1>/gi,
        (full, _tag: string, a: string) => {
          if (
            /data-(?:create-ai|cai)-brand|data-create-ai-logo|data-cai-brand-label|href=/i.test(
              a,
            )
          ) {
            return full;
          }
          return "";
        },
      );

      // All-caps slogans / taglines (REPAIR & ASSET CARE) — keep nav/CTA
      h = h.replace(
        /<(span|div|strong|p|a)\b([^>]*)>\s*([A-Z0-9][A-Z0-9\s&\/\-·|]{5,56})\s*<\/\1>/g,
        (full, _tag: string, a: string, text: string) => {
          if (
            /data-(?:create-ai|cai)-brand|data-cai-brand-label|href=.*#|nav|menu|btn|button/i.test(
              a + full,
            )
          ) {
            return full;
          }
          const t = text.replace(/\s+/g, " ").trim();
          if (brand && new RegExp(escapeRegExp(brand), "i").test(t)) {
            return full;
          }
          if (
            /^[A-Z0-9][A-Z0-9\s&\/\-·|]{5,}$/.test(t) &&
            t.split(/\s+/).length <= 8
          ) {
            return "";
          }
          return full;
        },
      );

      // Empty flex wrappers left after stripping AM + slogan
      h = h.replace(
        /<(div|span)\b([^>]*)>(\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi,
        (full, _t: string, a: string) =>
          /data-(?:create-ai|cai)-|nav|menu|btn/i.test(a) ? full : "",
      );

      // Keep only first tagged brand chip
      let kept = false;
      h = h.replace(
        /<(span|div|a)\b([^>]*data-(?:create-ai|cai)-brand=["']1["'][^>]*)>([\s\S]*?)<\/\1>/gi,
        (full) => {
          if (kept) return "";
          kept = true;
          return full;
        },
      );

      return `<header${attrs}>${h}</header>`;
    },
  );
}

export function dedupeHeaderBrandLogo(
  html: string,
  logoImage: string,
  brandName: string,
) {
  const src =
    (logoImage || "").trim() || extractCreateAiLogoSrc(html);
  if (!src) return html;
  return injectBrandLogo(html, src, brandName);
}

function imgTag(url: string, alt: string) {
  return `<img src="${url}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" style="width:100%;height:100%;max-height:560px;object-fit:cover;display:block;border-radius:16px" />`;
}

/**
 * Fix broken AI image syntax only — never inject stock/default photos.
 * - ![alt](https://...) → real <img>
 * - bare ![alt] / "Portrait of …" text removed (AI must supply real URLs on generate/chat)
 */
export function fixCreateAiImages(html: string, _category?: string) {
  if (!html) return html;
  let out = html;

  out = out.replace(
    /!\[([^\]]*)\]\(\s*(https?:[^)\s]+)\s*\)/gi,
    (_m, alt: string, url: string) => imgTag(url.trim(), alt || "Photo"),
  );

  out = out.replace(/!\[([^\]]*)\](?!\()/g, "");
  out = out.replace(
    /(?:Portrait|Photo|Image|Picture)\s+of\s+[A-Za-z][A-Za-z0-9 .,'’-]{1,60}/gi,
    "",
  );
  out = out.replace(/\[(?:insert\s+)?(?:image|photo|portrait|img)[^\]]*\]/gi, "");

  out = out.replace(
    /<div\b[^>]*data-create-ai-stock=["']1["'][^>]*>[\s\S]*?<\/div>/gi,
    "",
  );

  return out;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remove only spam stacks — do NOT wipe AI-designed contact UI. */
function stripContactDuplicates(
  html: string,
  contact: { email?: string; mobile?: string; address?: string },
) {
  let out = html;
  // Remove our injected cards only (may be duplicated)
  out = out.replace(
    /<div\b[^>]*data-create-ai-contact=["']1["'][^>]*>[\s\S]*?<\/div>/gi,
    "",
  );

  const mobile = (contact.mobile || "").trim();
  const address = (contact.address || "").trim();
  // Only strip 2+ repeated phone+address spam blocks
  if (mobile && address) {
    const pairRe = new RegExp(
      `(?:<(?:p|div|span|li)\\b[^>]*>\\s*)?(?:${escapeRegExp(mobile)}\\s*(?:<br\\s*\\/?>)?\\s*${escapeRegExp(address)}\\s*(?:<\\/(?:p|div|span|li)>)?\\s*){2,}`,
      "gi",
    );
    out = out.replace(pairRe, "");
  }

  out = out.replace(/<(p|div|span|li)\b[^>]*>\s*<\/\1>/gi, "");
  return out;
}

/** Inject onboarding contact card only if page has no real contact links yet. */
export function injectOnboardingContact(
  html: string,
  contact: { email?: string; mobile?: string; address?: string },
) {
  const email = (contact.email || "").trim();
  const mobile = (contact.mobile || "").trim();
  const address = (contact.address || "").trim();
  if (!html || (!email && !mobile && !address)) return html;

  // Clean spam stacks, keep AI contact design intact
  let out = stripContactDuplicates(html, { email, mobile, address });

  const hasEmailLink =
    email &&
    new RegExp(
      `mailto:${escapeRegExp(email).replace(/@/g, "(?:@|%40)")}`,
      "i",
    ).test(out);
  const hasPhoneLink =
    mobile &&
    new RegExp(`tel:${escapeRegExp(mobile.replace(/\D/g, ""))}`, "i").test(out);
  // Page already shows contact from AI redesign — don't force old box
  if (hasEmailLink || hasPhoneLink) {
    return out;
  }

  const rows: string[] = [];
  if (email) {
    rows.push(
      `<a href="mailto:${escapeHtml(email)}" style="color:inherit;text-decoration:none;font-weight:600">${escapeHtml(email)}</a>`,
    );
  }
  if (mobile) {
    rows.push(
      `<a href="tel:${escapeHtml(mobile.replace(/\s+/g, ""))}" style="color:inherit;text-decoration:none;font-weight:600">${escapeHtml(mobile)}</a>`,
    );
  }
  if (address) {
    rows.push(`<span style="opacity:.9">${escapeHtml(address)}</span>`);
  }

  const block = `<div data-create-ai-contact="1" style="display:grid;gap:8px;margin:18px 0 22px;padding:16px 18px;border:1px solid rgba(127,127,127,.28);border-radius:14px;font:500 14px/1.5 system-ui,sans-serif">
<p style="margin:0 0 4px;font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.65">Contact details</p>
${rows.map((r) => `<div>${r}</div>`).join("")}
</div>`;

  if (/<section\b[^>]*id=["']contact["'][^>]*>/i.test(out)) {
    return out.replace(
      /(<section\b[^>]*id=["']contact["'][^>]*>)/i,
      `$1${block}`,
    );
  }
  if (/id=["']contact["']/i.test(out)) {
    return out.replace(/(<[^>]+id=["']contact["'][^>]*>)/i, `$1${block}`);
  }
  if (/<footer\b[^>]*>/i.test(out)) {
    return out.replace(/(<footer\b[^>]*>)/i, `$1${block}`);
  }

  return `${out}${block}`;
}

/** Generic float placement — not phrase rules. Covers any left/center/right × top/middle/bottom. */
export type FloatPlacement = {
  side: "left" | "center" | "right";
  vertical: "top" | "center" | "bottom";
};

export function defaultFloatPlacement(): FloatPlacement {
  return { side: "right", vertical: "bottom" };
}

/** Read placement already stored on the page float stack. */
export function readFloatPlacement(html: string): FloatPlacement | null {
  if (!/data-create-ai-float=["']1["']/i.test(html || "")) return null;
  const sideRaw =
    html.match(/data-create-ai-float-side=["'](left|center|right)["']/i)?.[1] ||
    "right";
  const vertRaw =
    html.match(/data-create-ai-float-vertical=["'](top|center|bottom)["']/i)?.[1] ||
    "bottom";
  return {
    side: sideRaw.toLowerCase() as FloatPlacement["side"],
    vertical: vertRaw.toLowerCase() as FloatPlacement["vertical"],
  };
}

function floatPlacementCss(p: FloatPlacement): string {
  const parts: string[] = ["position:fixed", "z-index:2147483000"];
  if (p.side === "left") parts.push("left:16px", "right:auto");
  else if (p.side === "right") parts.push("right:16px", "left:auto");
  else parts.push("left:50%", "right:auto");

  if (p.vertical === "top") parts.push("top:16px", "bottom:auto");
  else if (p.vertical === "bottom") parts.push("bottom:16px", "top:auto");
  else parts.push("top:50%", "bottom:auto");

  if (p.side === "center" && p.vertical === "center") {
    parts.push("transform:translate(-50%,-50%)");
  } else if (p.side === "center") {
    parts.push("transform:translateX(-50%)");
  } else if (p.vertical === "center") {
    parts.push("transform:translateY(-50%)");
  } else {
    parts.push("transform:none");
  }
  return parts.join(";");
}

/**
 * Cheap geometric parse (axes only — not million phrase rules).
 * Returns null if message has no clear placement signal.
 */
export function parseFloatPlacementLocal(message: string): FloatPlacement | null {
  const m = (message || "").toLowerCase();
  if (
    !/(left|right|center|centre|middle|top|bottom|upar|neeche|bayi|baayi|baen|daayi|dahine|beech|mid|back\s*to\s*top|backtotop|\bbtt\b)/i.test(
      m,
    )
  ) {
    return null;
  }
  let side: FloatPlacement["side"] = "right";
  let vertical: FloatPlacement["vertical"] = "bottom";

  if (/(left|bayi|baayi|baen)\b/.test(m)) side = "left";
  else if (/(right|daayi|dahine)\b/.test(m)) side = "right";
  else if (/(center|centre|middle|beech|mid)\b/.test(m) && !/(left|right)\b/.test(m))
    side = "center";

  // "backtotop ke upar" = stack above BTT on bottom rail — NOT viewport top
  if (
    /(back\s*to\s*top|backtotop|\bbtt\b)/i.test(m) &&
    /(upar|above|up\s*par|ke\s*up)/i.test(m)
  ) {
    vertical = "bottom";
    if (!/(left|bayi|baayi|baen)\b/.test(m)) side = "right";
    return { side, vertical };
  }

  // "left center" / "right center" / "center left" → side + vertical middle
  if (
    /(left|right|bayi|daayi).{0,12}(center|centre|middle|beech)|(center|centre|middle|beech).{0,12}(left|right|bayi|daayi)/i.test(
      m,
    )
  ) {
    vertical = "center";
    if (/(left|bayi)/i.test(m)) side = "left";
    if (/(right|daayi)/i.test(m)) side = "right";
  } else if (/(top|upar)\b/.test(m) && !/(back\s*to\s*top|backtotop|\bbtt\b)/i.test(m)) {
    vertical = "top";
  } else if (/(bottom|neeche)\b/.test(m)) vertical = "bottom";
  else if (
    /(center|centre|middle|beech)\b/.test(m) &&
    !/(left|right|bayi|daayi)\b/.test(m)
  ) {
    // bare "center" for floats usually = horizontal center, keep bottom unless "middle of screen"
    side = "center";
    if (/(screen|page|beech\s*me|middle\s*of)/i.test(m)) vertical = "center";
  }

  return { side, vertical };
}

/** Sticky header — scroll pe chipka rahe (Create-AI chat schema). */
export function applyCreateAiHeaderSticky(html: string, on = true): string {
  if (!html || !/<header\b/i.test(html)) return html;
  let out = html.replace(
    /<style\b[^>]*data-create-ai-header-sticky=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  out = out.replace(/\s*data-create-ai-sticky=(["'])[^"']*\1/gi, "");
  out = out.replace(
    /<(div|aside)\b[^>]*data-create-ai-sticky-spacer=["']1["'][^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  // Remove any leaked sticky CSS text
  out = out.replace(
    /header\[data-create-ai-sticky=["']1["']\][\s\S]{0,280}?backdrop-filter:[^;{]+;?\s*\}/gi,
    "",
  );
  out = out.replace(
    /\[data-create-ai-sticky-chrome=["']1["']\][\s\S]{0,220}?z-index:[^;{]+;?\s*\}/gi,
    "",
  );
  // Unwrap ANY prior sticky-chrome wrapper safely (balanced-ish: chrome open → after </header>)
  out = out.replace(
    /<div\b[^>]*data-create-ai-sticky-chrome=["']1["'][^>]*>\s*/gi,
    "",
  );
  out = out.replace(
    /(<\/header>)\s*<\/div>\s*(?:<!--\s*cai-sticky-end\s*-->)?/gi,
    "$1",
  );
  out = out.replace(/<!--\s*cai-sticky-end\s*-->/gi, "");
  if (!on) return out;

  out = out.replace(/<header\b([^>]*)>/i, (_m, attrs: string) => {
    let next = attrs.replace(/\s*data-create-ai-sticky=(["'])[^"']*\1/gi, "");
    if (!/style=/i.test(next)) {
      next += ` style="position:sticky;top:0;z-index:1000"`;
    } else {
      next = next.replace(/style=(["'])([\s\S]*?)\1/i, (_s, q: string, st: string) => {
        let s = st
          .replace(/position\s*:\s*[^;]+;?/gi, "")
          .replace(/top\s*:\s*[^;]+;?/gi, "")
          .replace(/z-index\s*:\s*[^;]+;?/gi, "");
        return `style=${q}position:sticky;top:0;z-index:1000;${s}${q}`;
      });
    }
    return `<header${next} data-create-ai-sticky="1">`;
  });

  // Do NOT wrap topbar+header in a div (nested </div> unwrap was smashing the nav).
  // Header alone sticks; topbar may scroll away — correct & safe.

  const css = `<style data-create-ai-header-sticky="1">
html,body{overflow-x:clip!important}
header[data-create-ai-sticky="1"]{
  position:sticky!important;top:0!important;z-index:1000!important;
  -webkit-backdrop-filter:saturate(1.05) blur(8px);backdrop-filter:saturate(1.05) blur(8px);
}
@supports not (overflow:clip){
  html,body{overflow-x:hidden!important}
}
</style>`;
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${css}</head>`);
  else if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${css}</body>`);
  else out = `${out}${css}`;

  // Restore header shell if sticky pass left a broken/missing nav row
  out = normalizeCreateAiHeaderBar(out);
  out = stripOrphanDuplicateNav(out);
  return out;
}

/** Thin utility strip above header when user opted in during Create-AI prefs. */
export function applyCreateAiTopBar(
  html: string,
  on: boolean,
  contact?: { email?: string; mobile?: string; address?: string },
): string {
  if (!html) return html;
  let out = html.replace(
    /<(div|aside)\b[^>]*data-create-ai-topbar=["']1["'][^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  out = out.replace(
    /<style\b[^>]*data-create-ai-topbar=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  // Critical: strip leaked CSS text if a prior <style> was broken/stripped
  out = out.replace(
    /\[data-create-ai-topbar=["']1["']\]\s*\{[^}]+\}(\s*@media\s*\([^)]+\)\s*\{\s*\[data-create-ai-topbar=["']1["']\]\s*\{[^}]*\}\s*\})?/gi,
    "",
  );
  // Remove AI/onboarding contact rows above header so we never stack two bars.
  // Nested divs break non-greedy strip — when topbar is ON, wipe mid entirely
  // (keep only head assets that sometimes land in body).
  out = out.replace(
    /(<body\b[^>]*>)([\s\S]*?)(<header\b)/i,
    (_m, bodyOpen: string, mid: string, headerOpen: string) => {
      if (on) {
        const keep =
          mid.match(
            /<(?:script|style|link)\b[^>]*(?:\/>|>[\s\S]*?<\/(?:script|style)>)/gi,
          ) || [];
        return `${bodyOpen}${keep.join("\n")}\n${headerOpen}`;
      }
      const cleaned = mid.replace(
        /<(div|aside|section|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
        (full, _tag: string, attrs: string, inner: string) => {
          if (
            /data-create-ai-hero|data-create-ai-breadcrumb|data-cai-/i.test(
              attrs,
            )
          ) {
            return full;
          }
          const text = stripTags(inner);
          if (text.length > 220 || text.length < 6) return full;
          const contactStrip =
            /\d{7,}/.test(text) &&
            (/@/.test(text) ||
              /block|street|address|york|delhi|mumbai|phone|email/i.test(text));
          if (contactStrip || /data-create-ai-topbar=["']1["']/i.test(attrs)) {
            return "";
          }
          return full;
        },
      );
      const mid2 = cleaned
        .replace(
          /\s*\+?\d[\d\s().-]{7,}\s*[·•\-|]+\s*[^\s<]+@[^\s<]+\s*[·•\-|]+[^\n<]{0,90}\s*/gi,
          " ",
        )
        .replace(
          /(?:^|>)\s*\+?\d[\d\s().-]{6,}\s*[-–—·•|]\s*[^\s<>]+@[^\s<>]+(?:\s*[-–—·•|]\s*[^<>]{0,80})?(?=<)/gi,
          (m) => (m.startsWith(">") ? ">" : ""),
        )
        .replace(
          /\[data-create-ai-topbar[^\]]*\]\s*\{[^}]+\}(?:\s*@media\s*\([^)]+\)\s*\{\s*\[data-create-ai-topbar[^\]]*\]\s*\{[^}]*\}\s*\})?/gi,
          "",
        );
      return `${bodyOpen}${mid2}${headerOpen}`;
    },
  );
  // Also drop contact utility rows that AI stuffed as first children of <header>
  out = out.replace(
    /(<header\b[^>]*>)([\s\S]*?)(<\/header>)/i,
    (_m, open: string, inner: string, close: string) => {
      let next = inner;
      for (let pass = 0; pass < 3; pass += 1) {
        const before = next;
        next = next.replace(
          /<(div|aside|section|p|ul)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
          (full, _tag: string, attrs: string, body: string) => {
            if (
              /data-cai-|data-create-ai-brand|data-create-ai-logo|menu-btn/i.test(
                attrs,
              )
            ) {
              return full;
            }
            const text = stripTags(body);
            if (text.length > 200 || text.length < 6) return full;
            if (
              /\d{7,}/.test(text) &&
              (/@/.test(text) ||
                /block|street|address|york|delhi|mumbai/i.test(text))
            ) {
              return "";
            }
            return full;
          },
        );
        if (next === before) break;
      }
      return `${open}${next}${close}`;
    },
  );
  if (!on) return out;

  const left: string[] = [];
  if (contact?.mobile?.trim()) {
    const t = contact.mobile.trim();
    left.push(
      `<a href="tel:${t.replace(/\s+/g, "")}" style="color:inherit;text-decoration:none">${escapeHtml(t)}</a>`,
    );
  }
  if (contact?.email?.trim()) {
    const e = contact.email.trim();
    left.push(
      `<a href="mailto:${escapeHtml(e)}" style="color:inherit;text-decoration:none">${escapeHtml(e)}</a>`,
    );
  }
  const addr = contact?.address?.trim()
    ? `<span>${escapeHtml(contact.address.trim().slice(0, 80))}</span>`
    : "";
  if (!left.length && !addr) {
    left.push("<span>Welcome</span>");
  }

  const bar = `<div data-create-ai-topbar="1" role="note" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;padding:6px 20px;font-size:12px;letter-spacing:.02em;background:#0f172a;color:#e2e8f0"><span style="display:inline-flex;flex-wrap:wrap;gap:8px 12px;align-items:center">${left.join('<span aria-hidden="true" style="opacity:.45">·</span>')}</span>${addr}</div>`;

  // Never leave orphan logos in the contact strip (sticky corruption leftover)
  out = out.replace(
    /<(div|aside)\b([^>]*data-create-ai-topbar=["']1["'][^>]*)>([\s\S]*?)<\/\1>/gi,
    "",
  );

  if (/<header\b/i.test(out)) {
    return out.replace(/<header\b/i, `${bar}\n<header`);
  }
  if (/<body\b[^>]*>/i.test(out)) {
    return out.replace(/<body\b[^>]*>/i, (open) => `${open}\n${bar}`);
  }
  return `${bar}${out}`;
}

/** Force user-selected palette + fonts into the page (prompt alone is not enough). */
export function applyCreateAiDesignTheme(
  html: string,
  prefs: {
    colorPalette?: string;
    fontFamily?: string;
  },
): string {
  if (!html) return html;
  let out = html.replace(
    /<style\b[^>]*data-create-ai-design-theme=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  out = out.replace(
    /<link\b[^>]*data-create-ai-design-font=["']1["'][^>]*>/gi,
    "",
  );

  const palettes: Record<string, [string, string, string]> = {
    ocean: ["#0B3D91", "#1D9BBF", "#E8F4FC"],
    forest: ["#1B4332", "#40916C", "#F3F6F1"],
    "ink-gold": ["#111111", "#C6A75E", "#F7F4EC"],
    coral: ["#C2410C", "#FB923C", "#FFF7ED"],
    slate: ["#1E293B", "#64748B", "#F8FAFC"],
    plum: ["#4A1942", "#9B5DE5", "#F8F1F7"],
    sand: ["#5C4A3A", "#A68A6D", "#FAF6F1"],
    midnight: ["#0A1628", "#3B82F6", "#EEF3FA"],
    mint: ["#0F766E", "#5EEAD4", "#F0FDFA"],
    crimson: ["#9F1239", "#E11D48", "#FFF1F2"],
    olive: ["#3F4A2E", "#8B9A6D", "#F5F3EB"],
    sky: ["#0369A1", "#38BDF8", "#F0F9FF"],
    copper: ["#115E59", "#B45309", "#F8FAF9"],
    "charcoal-rose": ["#292524", "#BE123C", "#FAF7F5"],
    arctic: ["#334155", "#94A3B8", "#F1F5F9"],
  };
  const fonts: Record<string, { link: string; heading: string; body: string }> = {
    "playfair-source": {
      link: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Sans+3:wght@400;600&display=swap",
      heading: '"Playfair Display",Georgia,serif',
      body: '"Source Sans 3",system-ui,sans-serif',
    },
    "fraunces-dm": {
      link: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;700&family=DM+Sans:wght@400;600&display=swap",
      heading: '"Fraunces",Georgia,serif',
      body: '"DM Sans",system-ui,sans-serif',
    },
    "cormorant-outfit": {
      link: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Outfit:wght@400;600&display=swap",
      heading: '"Cormorant Garamond",Georgia,serif',
      body: '"Outfit",system-ui,sans-serif',
    },
    "syne-manrope": {
      link: "https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=Manrope:wght@400;600&display=swap",
      heading: '"Syne",system-ui,sans-serif',
      body: '"Manrope",system-ui,sans-serif',
    },
    "space-figtree": {
      link: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Figtree:wght@400;600&display=swap",
      heading: '"Space Grotesk",system-ui,sans-serif',
      body: '"Figtree",system-ui,sans-serif',
    },
    "instrument-plex": {
      link: "https://fonts.googleapis.com/css2?family=Instrument+Serif&family=IBM+Plex+Sans:wght@400;600&display=swap",
      heading: '"Instrument Serif",Georgia,serif',
      body: '"IBM Plex Sans",system-ui,sans-serif',
    },
    "libre-nunito": {
      link: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Nunito:wght@400;600&display=swap",
      heading: '"Libre Baskerville",Georgia,serif',
      body: '"Nunito",system-ui,sans-serif',
    },
    "bebas-lato": {
      link: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lato:wght@400;700&display=swap",
      heading: '"Bebas Neue",Impact,sans-serif',
      body: '"Lato",system-ui,sans-serif',
    },
    "dmserif-karla": {
      link: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Karla:wght@400;600&display=swap",
      heading: '"DM Serif Display",Georgia,serif',
      body: '"Karla",system-ui,sans-serif',
    },
    "sora-work": {
      link: "https://fonts.googleapis.com/css2?family=Sora:wght@500;700&family=Work+Sans:wght@400;600&display=swap",
      heading: '"Sora",system-ui,sans-serif',
      body: '"Work Sans",system-ui,sans-serif',
    },
    "literata-intertight": {
      link: "https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;700&family=Inter+Tight:wght@400;600&display=swap",
      heading: '"Literata",Georgia,serif',
      body: '"Inter Tight",system-ui,sans-serif',
    },
    "archivo-black-plus": {
      link: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Plus+Jakarta+Sans:wght@400;600&display=swap",
      heading: '"Archivo Black",Impact,sans-serif',
      body: '"Plus Jakarta Sans",system-ui,sans-serif',
    },
    "josefin-mulish": {
      link: "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@500;700&family=Mulish:wght@400;600&display=swap",
      heading: '"Josefin Sans",system-ui,sans-serif',
      body: '"Mulish",system-ui,sans-serif',
    },
    "crimson-outfit": {
      link: "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@500;700&family=Outfit:wght@400;600&display=swap",
      heading: '"Crimson Pro",Georgia,serif',
      body: '"Outfit",system-ui,sans-serif',
    },
  };

  const pid = prefs.colorPalette || "auto";
  const fid = prefs.fontFamily || "auto";
  const sw = palettes[pid];
  const font = fonts[fid];

  if (font?.link && /<\/head>/i.test(out)) {
    out = out.replace(
      /<\/head>/i,
      `<link data-create-ai-design-font="1" rel="stylesheet" href="${font.link}"/>\n</head>`,
    );
  } else if (font?.link) {
    out = `<link data-create-ai-design-font="1" rel="stylesheet" href="${font.link}"/>\n${out}`;
  }

  const primary = sw?.[0] || "";
  const accent = sw?.[1] || "";
  const surface = sw?.[2] || "";

  const css = `<style data-create-ai-design-theme="1">
:root{
${primary ? `--cai-primary:${primary};--cai-accent:${accent};--cai-surface:${surface};` : ""}
${font ? `--cai-font-heading:${font.heading};--cai-font-body:${font.body};` : ""}
}
${font ? `body,button,input,textarea,select{font-family:var(--cai-font-body)!important}h1,h2,h3,h4,h5,h6{font-family:var(--cai-font-heading)!important}` : ""}
${
  primary
    ? `body{background:var(--cai-surface)}
header a[href][style*="border-radius"],header a[href][style*="padding"][style*="background"],
header button,[data-create-ai-cta],a[data-create-ai-cta],
.btn,.button,.cta,a.btn,a.button,a.cta,
section a[href][style*="border-radius"][style*="padding"]{
  background:var(--cai-primary)!important;
  border-color:var(--cai-primary)!important;
  color:#fff!important;
}`
    : ""
}
</style>`;

  if (/<\/head>/i.test(out)) return out.replace(/<\/head>/i, `${css}</head>`);
  if (/<\/body>/i.test(out)) return out.replace(/<\/body>/i, `${css}</body>`);
  return `${css}${out}`;
}

/** Remove third-party chat/messenger widgets AI sometimes injects (opens "second chat"). */
export function stripCreateAiChatWidgets(html: string): string {
  if (!html) return html;
  let out = html;
  out = out.replace(
    /<script\b[^>]*(?:tawk|crisp|intercom|tidio|zendesk|hubspot|drift|facebook\.net\/.*customerchat|chatbot|chat-widget|wchat|smartsupp|livechat|jivosite)[^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(
    /<script\b[^>]*>[\s\S]*?(?:tawk\.to|crisp\.chat|intercom\.io|tidio\.co|zendesk|drift\.com|facebook\.com\/.*customer_chat|chatwoot)[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(
    /<(div|aside|iframe|button)\b[^>]*(?:tawk|crisp|intercom|tidio|chat-widget|fb-customerchat|jivo)[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  // Neutralize CTA hrefs that would navigate the preview iframe into the host app
  out = out.replace(/<a\b([^>]*?)>/gi, (full, attrs: string) => {
    const href = attrs.match(/\bhref\s*=\s*(["'])([^"']*)\1/i)?.[2] || "";
    if (!href || /^(#|tel:|mailto:|javascript:)/i.test(href)) return full;
    // Keep http(s) to real external sites as javascript:void in preview — click handler also blocks
    if (/^(https?:|\/\/|\/|\.\/|\.\.\/)/i.test(href)) {
      const scrub = attrs.replace(/\bhref\s*=\s*(["'])[\s\S]*?\1/i, "");
      return `<a${scrub} href="javascript:void(0)" data-create-ai-cta="1">`;
    }
    return full;
  });
  return out;
}

/** Pull primary/accent from page HTML — never ask user for hex. */
export function extractThemeAccentFromHtml(html: string): string {
  if (!html) return "#0f172a";
  const boring = (hex: string) => {
    const h = hex.toLowerCase();
    return (
      /#(fff|ffffff|fafafa|f5f5f5|f8fafc|f4f1ea|eee|eee{3}|000|000000|111|222|333|444|555|666|777|888|999|aaa|ccc|ddd|e5e5e5|e2e8f0|cbd5e1)/i.test(
        h,
      )
    );
  };
  const expand = (hex: string) => {
    let h = hex.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(h)) {
      h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    }
    return h;
  };
  const scored: Array<{ hex: string; score: number }> = [];

  const push = (raw: string, score: number) => {
    const m = raw.match(/#([0-9a-f]{3,8})\b/i);
    if (!m) return;
    const hex = expand(`#${m[1]}`);
    if (boring(hex)) return;
    scored.push({ hex, score });
  };

  for (const m of html.matchAll(
    /--(?:primary|accent|brand|theme|main|cta)[^:;{]*:\s*(#[0-9a-f]{3,8})/gi,
  )) {
    push(m[1], 100);
  }
  // Header / CTA-ish solid backgrounds
  const head = html.match(/<header\b[\s\S]{0,8000}/i)?.[0] || "";
  for (const m of head.matchAll(
    /background(?:-color)?\s*:\s*(#[0-9a-f]{3,8})/gi,
  )) {
    push(m[1], 80);
  }
  for (const m of html.matchAll(
    /<(?:a|button)\b[^>]*style=["'][^"']*background(?:-color)?\s*:\s*(#[0-9a-f]{3,8})/gi,
  )) {
    push(m[1], 70);
  }
  for (const m of html.matchAll(
    /border(?:-bottom|-color)?\s*:\s*[^;]*?(#[0-9a-f]{3,8})/gi,
  )) {
    push(m[1], 40);
  }
  // Accent-ish pinks/golds often in headings
  for (const m of html.matchAll(
    /color\s*:\s*(#[c-f][0-9a-f]{5}|#[89a-f][0-9a-f]{2}[0-9a-f]{3})/gi,
  )) {
    push(m[1], 35);
  }

  scored.sort((a, b) => b.score - a.score);
  if (scored[0]) return scored[0].hex;

  // Dark CTA fallback (common on these pages)
  if (/#0f172a|#111|#0b1220|background:\s*#0/i.test(html)) return "#0f172a";
  return "#0f172a";
}

/** Fixed phone + WhatsApp (+ optional email) — SVG icons only. */
export function injectFloatingContact(
  html: string,
  contact: { mobile?: string; email?: string },
  opts?: {
    includeEmail?: boolean;
    includeCall?: boolean;
    includeWhatsapp?: boolean;
    /** @deprecated use placement.side */
    side?: "left" | "right" | "center";
    placement?: FloatPlacement;
    /** Use page theme (or explicit hex) for float button backgrounds */
    themeColor?: string | true;
  },
) {
  if (!html) return html;
  const mobile = (contact.mobile || "").trim();
  const email = (contact.email || "").trim();
  const digits = mobile.replace(/\D/g, "");
  const includeCall = opts?.includeCall !== false && digits.length >= 8;
  const includeWa = opts?.includeWhatsapp !== false && digits.length >= 8;
  const includeEmail = Boolean(opts?.includeEmail && email.includes("@"));
  if (!includeCall && !includeWa && !includeEmail) return html;

  const placement: FloatPlacement = opts?.placement || {
    side:
      opts?.side === "left"
        ? "left"
        : opts?.side === "center"
          ? "center"
          : "right",
    vertical: "bottom",
  };
  const placeCss = floatPlacementCss(placement);

  const theme =
    opts?.themeColor === true
      ? extractThemeAccentFromHtml(html)
      : typeof opts?.themeColor === "string" && opts.themeColor.trim()
        ? opts.themeColor.trim()
        : "";
  const callBg = theme || "#0f766e";
  const waBg = theme || "#25D366";
  const mailBg = theme || "#2563eb";

  const wa = digits.length === 10 ? `91${digits}` : digits;
  const telHref = escapeHtml(digits);
  const mailHref = escapeHtml(email);
  const phoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg>`;
  const waSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.89.49 3.73 1.42 5.36L2 22l4.89-1.51a9.84 9.84 0 0 0 5.15 1.42h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.76 14.16c-.24.68-1.4 1.25-1.93 1.33-.5.08-1.13.11-1.82-.11-.42-.14-.96-.31-1.66-.61-2.92-1.26-4.82-4.2-4.97-4.39-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.89 1.05.93 1.94 1.22 2.22 1.36.28.14.44.12.6-.07.17-.19.7-.81.89-1.09.19-.28.38-.23.64-.14.26.1 1.66.78 1.95.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z"/></svg>`;
  const mailSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/></svg>`;

  const btn = (href: string, title: string, bg: string, svg: string, extra = "") =>
    `<a href="${href}" ${extra} title="${title}" aria-label="${title}" data-create-ai-float-btn="${title.toLowerCase()}" style="width:54px;height:54px;border-radius:999px;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.28)">${svg}</a>`;

  const parts: string[] = [];
  if (includeCall) parts.push(btn(`tel:${telHref}`, "Call", callBg, phoneSvg));
  if (includeWa)
    parts.push(
      btn(
        `https://wa.me/${wa}`,
        "WhatsApp",
        waBg,
        waSvg,
        'target="_blank" rel="noopener noreferrer"',
      ),
    );
  if (includeEmail)
    parts.push(btn(`mailto:${mailHref}`, "Email", mailBg, mailSvg));

  const themeAttr = theme ? ` data-create-ai-float-theme="${escapeHtml(theme)}"` : "";
  const float = `<div data-create-ai-float="1" data-create-ai-float-side="${placement.side}" data-create-ai-float-vertical="${placement.vertical}" data-create-ai-float-email="${includeEmail ? "1" : "0"}"${themeAttr} style="${placeCss};display:flex;flex-direction:column;gap:12px;align-items:center">${parts.join("\n")}</div>`;

  let out = stripCreateAiFloatingWidgets(html);
  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${float}</body>`);
  } else {
    out = `${out}${float}`;
  }
  return layoutCreateAiRightRail(out);
}

/**
 * Avoid overlap: if floats + BTT share the same corner, raise floats.
 * If floats are left/center, keep BTT on bottom-right.
 */
export function layoutCreateAiRightRail(html: string) {
  if (!html) return html;
  const hasBtt = /id=["']create-ai-btt["']/i.test(html);
  const hasFloat = /data-create-ai-float=["']1["']/i.test(html);
  if (!hasFloat) return html;

  const placement = readFloatPlacement(html) || defaultFloatPlacement();
  let out = html;

  // Re-apply float CSS from data attrs (source of truth)
  out = out.replace(
    /(<div\b[^>]*data-create-ai-float=["']1["'][^>]*style=")([^"]*)(")/i,
    (_m, open: string, _style: string, close: string) => {
      let css = floatPlacementCss(placement);
      // Same corner as BTT (right+bottom) → lift floats
      if (
        hasBtt &&
        placement.side === "right" &&
        placement.vertical === "bottom"
      ) {
        css = css.replace(/bottom:\s*16px/i, "bottom:78px");
      }
      return `${open}${css};display:flex;flex-direction:column;gap:12px;align-items:center${close}`;
    },
  );

  if (hasBtt) {
    out = out.replace(
      /(<style[^>]*data-create-ai-btt=["']1["'][^>]*>)([\s\S]*?)(<\/style>)/i,
      (_m, open: string, css: string, close: string) => {
        const next = css.replace(/#create-ai-btt\{[^}]*\}/i, (block) =>
          block
            .replace(/bottom\s*:\s*[^;]+/gi, "bottom:16px")
            .replace(/left\s*:\s*[^;]+/gi, "")
            .replace(/right\s*:\s*[^;]+/gi, "right:18px")
            .replace(/z-index\s*:\s*[^;]+/gi, "z-index:2147483001"),
        );
        return `${open}${next}${close}`;
      },
    );
  }
  return out;
}

/** Remove our float + common broken AI float buttons (all corners). */
export function stripCreateAiFloatingWidgets(html: string) {
  let out = html || "";
  out = out.replace(
    /<div\b[^>]*data-create-ai-float=["']1["'][^>]*>[\s\S]*?<\/div>\s*(?:<!--\s*tel:[^>]*-->)?/gi,
    "",
  );
  out = out.replace(
    /<(?:a|div|button|aside)\b[^>]*(?:whatsapp|wa\.me|wa-float|float-btn|floating|call-btn|phone-float)[^>]*>[\s\S]*?<\/(?:a|div|button|aside)>/gi,
    "",
  );
  // Fixed tel/mailto/wa links (any attribute order)
  out = out.replace(
    /<a\b(?=[^>]*href=["'](?:tel:|mailto:|https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/)[^"']*["'])(?=[^>]*position\s*:\s*fixed)[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
  out = out.replace(
    /<a\b(?=[^>]*position\s*:\s*fixed)(?=[^>]*href=["'](?:tel:|mailto:|https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/)[^"']*["'])[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
  // Fixed stacks that contain wa.me somewhere inside
  out = out.replace(
    /<(?:div|aside|section)\b(?=[^>]*position\s*:\s*fixed)[^>]*>[\s\S]*?(?:wa\.me|whatsapp|api\.whatsapp)[\s\S]*?<\/(?:div|aside|section)>/gi,
    "",
  );
  out = out.replace(
    /<a\b[^>]*data-create-ai-float-btn=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
  return out;
}

/** Client / logo slider section — guaranteed visible add (chat was failing this). */
export function injectClientSlider(html: string, brandName: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-client-slider=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );

  const brand = escapeHtml((brandName || "Client").trim() || "Client");
  const names = [
    "Meridian Trust",
    "Northgate Capital",
    "Apex Holdings",
    "Silverline Partners",
    "Oakridge Family Office",
    "Crestwell Advisory",
  ];
  const pills = names
    .map(
      (n) =>
        `<div style="flex:0 0 auto;min-width:160px;padding:18px 22px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04);text-align:center;font:600 14px/1.3 Georgia,serif;letter-spacing:.04em;color:inherit;opacity:.92">${escapeHtml(n)}</div>`,
    )
    .join("");

  const section = `<section id="clients" data-create-ai-client-slider="1" style="padding:56px 24px;max-width:1100px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Trusted by families &amp; founders</p>
<h2 style="margin:0 0 28px;font-size:clamp(1.5rem,3vw,2rem);line-height:1.2">Clients who chose ${brand}</h2>
<div style="overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)">
<div data-create-ai-marquee="1" style="display:flex;gap:14px;width:max-content;animation:createAiClientSlide 28s linear infinite">
${pills}${pills}
</div>
</div>
<style>@keyframes createAiClientSlide{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>
</section>`;

  if (/id=["']contact["']/i.test(out)) {
    return out.replace(/(<[^>]+id=["']contact["'][^>]*>)/i, `${section}$1`);
  }
  if (/<footer\b/i.test(out)) {
    return out.replace(/<footer\b/i, `${section}<footer`);
  }
  return injectBeforeBodyCloseLocal(out, section);
}

function insertBeforeContactOrFooter(html: string, section: string) {
  let out = html;
  if (/id=["']contact["']/i.test(out)) {
    return out.replace(/(<[^>]+id=["']contact["'][^>]*>)/i, `${section}$1`);
  }
  if (/<footer\b/i.test(out)) {
    return out.replace(/<footer\b/i, `${section}<footer`);
  }
  return injectBeforeBodyCloseLocal(out, section);
}

function hasCreateAiSectionSignal(html: string, id: string): boolean {
  const h = html || "";
  // Strong signals only — never treat bare nav "About" text as a real section
  if (new RegExp(`<(?:section|div|main)\\b[^>]*\\bid=["']${id}["']`, "i").test(h)) {
    return true;
  }
  if (new RegExp(`data-create-ai-${id}=["']1["']`, "i").test(h)) return true;
  const inSection = (word: string) =>
    new RegExp(
      `<section\\b[^>]*>[\\s\\S]{0,1600}<h[1-3][^>]*>[^<]*${word}`,
      "i",
    ).test(h);
  const labelMap: Record<string, () => boolean> = {
    hero: () =>
      /<(?:section|header|div)\b[^>]*(?:hero|banner)[^>]*>/i.test(h) ||
      /id=["']hero["']/i.test(h),
    about: () => inSection("about"),
    services: () => inSection("(?:service|offering)"),
    gallery: () => inSection("gallery"),
    testimonials: () => inSection("testimonial"),
    pricing: () => inSection("pricing"),
    faq: () => inSection("(?:faq|frequently asked)"),
    team: () => inSection("team"),
    cta: () =>
      /data-create-ai-cta=["']1["']/i.test(h) ||
      inSection("(?:get started|ready to|let'?s talk)"),
    contact: () =>
      /<(?:section|div|main)\b[^>]*\bid=["']contact["']/i.test(h) ||
      /data-create-ai-contact=["']1["']/i.test(h) ||
      inSection("contact"),
    map: () =>
      /maps\.google|google\.com\/maps|data-create-ai-map=["']1["']/i.test(h),
  };
  return Boolean(labelMap[id]?.());
}

function injectSimpleCreateAiSection(
  html: string,
  id: string,
  title: string,
  body: string,
  attr: string,
) {
  if (!html || hasCreateAiSectionSignal(html, id)) return html;
  let out = html.replace(
    new RegExp(
      `<section\\b[^>]*${attr}=["']1["'][^>]*>[\\s\\S]*?<\\/section>`,
      "gi",
    ),
    "",
  );
  const section = `<section id="${id}" ${attr}="1" style="padding:56px 24px;max-width:1100px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">${escapeHtml(id)}</p>
<h2 style="margin:0 0 14px;font-size:clamp(1.5rem,3vw,2rem)">${escapeHtml(title)}</h2>
<p style="margin:0;max-width:62ch;opacity:.88;font-size:15px;line-height:1.6">${escapeHtml(body)}</p>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** About — reference-level split: copy + values + media. */
export function injectCreateAiAboutSection(
  html: string,
  brandName: string,
  imageUrls?: string[],
): string {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*(?:id=["']about["']|data-create-ai-about=["']1["'])[^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "Brand").trim());
  const img =
    (imageUrls || []).find((u) => /^https?:\/\//i.test(u)) ||
    createAiStockImagePool(imageUrls)[1] ||
    createAiStockImagePool()[0];
  const section = `<section id="about" data-create-ai-about="1" style="padding:72px 24px;background:var(--cai-surface,#fff)">
<div style="max-width:1240px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;align-items:center">
  <div>
    <p style="margin:0 0 12px;display:inline-flex;padding:6px 14px;border-radius:999px;background:#FFEDD5;color:#C2410C;font:700 12px/1 Manrope,system-ui;letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(194,65,12,.2)">About ${brand}</p>
    <h2 style="margin:0 0 18px;font:400 clamp(1.75rem,3.5vw,2.6rem)/1.15 Instrument Serif,Georgia,serif;color:#1C1917">Architecting clear outcomes with craft and care.</h2>
    <p style="margin:0 0 14px;color:#6B615B;font-size:1.05rem;line-height:1.65">${brand} partners with clients to navigate complexity, deliver reliable work, and unlock results that last.</p>
    <p style="margin:0 0 22px;color:#6B615B;font-size:1.05rem;line-height:1.65">Hands-on direction, transparent communication, and a standard of finish you can feel in every detail.</p>
    <ul style="list-style:none;margin:0;padding:0;display:grid;gap:14px">
      <li style="display:flex;gap:12px;align-items:flex-start"><i data-lucide="circle-check" style="width:20px;height:20px;color:#C2410C;flex-shrink:0;margin-top:2px"></i><div><strong style="display:block;color:#1C1917">Strategic precision</strong><span style="font-size:14px;color:#6B615B">Clear plans, measurable steps</span></div></li>
      <li style="display:flex;gap:12px;align-items:flex-start"><i data-lucide="circle-check" style="width:20px;height:20px;color:#C2410C;flex-shrink:0;margin-top:2px"></i><div><strong style="display:block;color:#1C1917">Operational quality</strong><span style="font-size:14px;color:#6B615B">Reliable delivery, every time</span></div></li>
      <li style="display:flex;gap:12px;align-items:flex-start"><i data-lucide="circle-check" style="width:20px;height:20px;color:#C2410C;flex-shrink:0;margin-top:2px"></i><div><strong style="display:block;color:#1C1917">Client partnership</strong><span style="font-size:14px;color:#6B615B">Listen first, then execute</span></div></li>
    </ul>
  </div>
  <div style="position:relative">
    <div style="border-radius:24px;overflow:hidden;box-shadow:0 24px 48px rgba(28,25,23,.12);aspect-ratio:4/5;background:#E7DBCE">
      <img src="${escapeHtml(img)}" alt="${brand}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"/>
    </div>
    <div style="position:absolute;left:16px;bottom:16px;padding:16px 18px;border-radius:16px;background:#1C1917;color:#FFF7ED;box-shadow:0 12px 32px rgba(28,25,23,.2);max-width:200px">
      <div style="font:400 1.75rem/1 Instrument Serif,Georgia,serif;margin-bottom:4px">10+</div>
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.85">Years of trusted work</div>
    </div>
  </div>
</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** Services — 3 rich cards with icons + bullets (reference anatomy). */
/** Arrow slider shell — used when services/testimonials lack a real multi-col grid. */
function buildArrowSlider(itemsHtml: string[], sliderId: string): string {
  const track = itemsHtml
    .map(
      (item) =>
        `<div data-cai-slide-item="1" style="flex:0 0 min(100%,min(340px,85vw));scroll-snap-align:start;min-width:260px">${item}</div>`,
    )
    .join("");
  const btn =
    "width:42px;height:42px;border-radius:999px;border:1px solid #E7DBCE;background:#fff;color:#1C1917;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:22px;line-height:1;box-shadow:0 8px 20px rgba(28,25,23,.08)";
  return `<div data-cai-arrow-slider="1" data-cai-slider-id="${escapeHtml(sliderId)}" style="position:relative">
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:14px">
    <button type="button" data-cai-slide-prev="${escapeHtml(sliderId)}" aria-label="Previous" style="${btn}">‹</button>
    <button type="button" data-cai-slide-next="${escapeHtml(sliderId)}" aria-label="Next" style="${btn}">›</button>
  </div>
  <div data-cai-slide-track="${escapeHtml(sliderId)}" style="display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;padding-bottom:8px;scrollbar-width:none">${track}</div>
</div>
<style data-cai-slider-css="${escapeHtml(sliderId)}">[data-cai-slide-track="${escapeHtml(sliderId)}"]::-webkit-scrollbar{display:none}</style>
<script data-cai-slider-js="${escapeHtml(sliderId)}">(function(){var id=${JSON.stringify(sliderId)};var t=document.querySelector('[data-cai-slide-track="'+id+'"]');if(!t)return;var step=function(){var item=t.querySelector('[data-cai-slide-item]');return item?item.getBoundingClientRect().width+16:300;};var prev=document.querySelector('[data-cai-slide-prev="'+id+'"]');var next=document.querySelector('[data-cai-slide-next="'+id+'"]');if(prev)prev.addEventListener('click',function(){t.scrollBy({left:-step(),behavior:'smooth'});});if(next)next.addEventListener('click',function(){t.scrollBy({left:step(),behavior:'smooth'});});})();<\/script>`;
}

function sectionHasRealGrid(inner: string): boolean {
  return (
    /grid-template-columns\s*:\s*repeat\s*\(/i.test(inner) ||
    /grid-template-columns\s*:\s*[^;]*(1fr|auto-fit|auto-fill)/i.test(inner)
  );
}

/**
 * If services/testimonials are stacked (no grid), wrap cards in arrow slider.
 */
export function ensureCreateAiCardSliders(html: string): string {
  if (!html) return html;
  let out = html;
  for (const id of ["services", "testimonials"] as const) {
    out = out.replace(
      new RegExp(
        `<section\\b([^>]*(?:id=["']${id}["']|data-create-ai-${id}=["']1["'])[^>]*)>([\\s\\S]*?)<\\/section>`,
        "i",
      ),
      (full, attrs: string, inner: string) => {
        if (/data-cai-arrow-slider=["']1["']/i.test(inner)) return full;
        if (sectionHasRealGrid(inner) && (inner.match(/<article\b/gi) || []).length >= 2) {
          return full;
        }
        const cards = [
          ...inner.matchAll(/<article\b[\s\S]*?<\/article>/gi),
        ].map((m) => m[0]);
        if (cards.length < 2) return full;
        // Strip old card wrappers / grids, keep headings
        let head = inner
          .replace(/<article\b[\s\S]*?<\/article>/gi, "")
          .replace(
            /<div\b[^>]*(?:display\s*:\s*grid|grid-template)[^>]*>\s*<\/div>/gi,
            "",
          )
          .trim();
        // Clean empty grid shells
        head = head.replace(
          /<div\b([^>]*)>(\s*)<\/div>/gi,
          (m, a: string) => (/grid/i.test(a) ? "" : m),
        );
        const slider = buildArrowSlider(cards, `cai-${id}`);
        return `<section${attrs}>${head}${slider}</section>`;
      },
    );
  }
  return out;
}

export function injectCreateAiServicesSection(
  html: string,
  brandName: string,
): string {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*(?:id=["']services["']|data-create-ai-services=["']1["'])[^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "Brand").trim());
  const cards = [
    {
      icon: "wrench",
      title: "Core Service",
      body: `Practical, high-quality work from ${brand} — scoped clearly and finished with care.`,
      feats: ["Clear scope & timeline", "Quality materials", "On-site / remote ready"],
    },
    {
      icon: "shield-check",
      title: "Protected Delivery",
      body: "Process you can trust — updates, accountability, and results you can measure.",
      feats: ["Progress updates", "Warranty mindset", "Clean handoff"],
    },
    {
      icon: "sparkles",
      title: "Premium Finish",
      body: "Details that elevate the outcome — presentation, polish, and lasting impression.",
      feats: ["Attention to detail", "Modern standards", "Follow-up support"],
    },
  ].map(
    (c) => `<article style="padding:28px;border-radius:24px;background:#fff;border:1px solid #E7DBCE;box-shadow:0 12px 32px rgba(28,25,23,.08);display:flex;flex-direction:column;gap:14px;height:100%;box-sizing:border-box">
<div style="width:48px;height:48px;border-radius:14px;background:#FFEDD5;color:#C2410C;display:grid;place-items:center"><i data-lucide="${c.icon}" style="width:22px;height:22px"></i></div>
<h3 style="margin:0;font:400 1.45rem/1.2 Instrument Serif,Georgia,serif;color:#1C1917">${escapeHtml(c.title)}</h3>
<p style="margin:0;color:#6B615B;font-size:15px;line-height:1.55">${escapeHtml(c.body)}</p>
<ul style="list-style:none;margin:0;padding:0;display:grid;gap:8px;flex:1">
${c.feats.map((f) => `<li style="display:flex;gap:8px;align-items:center;font-size:14px;color:#1C1917"><i data-lucide="check" style="width:16px;height:16px;color:#C2410C;flex-shrink:0"></i>${escapeHtml(f)}</li>`).join("")}
</ul>
<a href="#contact" style="margin-top:8px;color:#C2410C;font-weight:700;text-decoration:none;font-size:14px">Schedule consultation →</a>
</article>`,
  );
  // Desktop: real CSS grid; narrow: arrow slider via ensureCreateAiCardSliders fallback
  const section = `<section id="services" data-create-ai-services="1" style="padding:72px 24px;background:#FFF7ED">
<div style="max-width:1240px;margin:0 auto">
  <p style="margin:0 0 12px;display:inline-flex;padding:6px 14px;border-radius:999px;background:#FFEDD5;color:#C2410C;font:700 12px/1 Manrope,system-ui;letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(194,65,12,.2)">Core offerings</p>
  <h2 style="margin:0 0 10px;font:400 clamp(1.75rem,3.5vw,2.6rem)/1.15 Instrument Serif,Georgia,serif;color:#1C1917">Specialized solutions</h2>
  <p style="margin:0 0 32px;max-width:62ch;color:#6B615B;font-size:1.05rem;line-height:1.6">Targeted services designed to elevate quality and deliver clear value.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px">${cards.join("")}</div>
</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/**
 * Rails: user-picked home sections must exist after generate (AI prompt alone ≠ 100%).
 */
export function enforceCreateAiHomeSections(
  html: string,
  prefs: {
    homeSections?: string[];
  },
  brandName?: string,
  address?: string,
  contact?: { email?: string; mobile?: string; address?: string },
  imageUrls?: string[],
): string {
  if (!html) return html;
  const brand = (brandName || "Brand").trim() || "Brand";
  const fromPrefs = Array.isArray(prefs.homeSections) ? prefs.homeSections : [];
  // Always ensure core story sections exist (onboarding toggles + contact)
  const wanted = Array.from(
    new Set([
      "about",
      "services",
      "gallery",
      "testimonials",
      "contact",
      ...fromPrefs,
    ]),
  );
  let out = html;
  const contactInfo = {
    email: contact?.email || "",
    mobile: contact?.mobile || "",
    address: contact?.address || address || "",
  };

  for (const id of wanted) {
    switch (id) {
      case "hero":
        break;
      case "about":
        if (!hasCreateAiSectionSignal(out, "about")) {
          out = injectCreateAiAboutSection(out, brand, imageUrls);
        }
        break;
      case "services":
        if (!hasCreateAiSectionSignal(out, "services")) {
          out = injectCreateAiServicesSection(out, brand);
        }
        break;
      case "gallery":
        if (!hasCreateAiSectionSignal(out, "gallery")) {
          out = injectCreateAiGallerySection(out, brand, imageUrls);
        } else {
          out = fillCreateAiGalleryImages(out, imageUrls);
        }
        break;
      case "cta":
        if (!hasCreateAiSectionSignal(out, "cta")) {
          out = injectSimpleCreateAiSection(
            out,
            "cta",
            "Ready when you are",
            `Talk to ${brand} — we’ll map the next step with clarity.`,
            "data-create-ai-cta-band",
          );
        }
        break;
      case "testimonials":
        if (!hasCreateAiSectionSignal(out, "testimonials")) {
          out = injectTestimonialsSection(out, brand);
        }
        break;
      case "pricing":
        if (!hasCreateAiSectionSignal(out, "pricing")) {
          out = injectPricingSection(out, brand);
        }
        break;
      case "faq":
        if (!hasCreateAiSectionSignal(out, "faq")) {
          out = injectFaqSection(out, brand);
        }
        break;
      case "team":
        if (!hasCreateAiSectionSignal(out, "team")) {
          out = injectTeamSection(out, brand);
        }
        break;
      case "map":
        if (!hasCreateAiSectionSignal(out, "map")) {
          out = injectMapSection(out, contactInfo.address);
        }
        break;
      case "contact":
        out = ensureCreateAiContactWithForm(out, brand, contactInfo);
        break;
      default:
        break;
    }
  }
  // Always finish contact with form (even if AI left a thin stub)
  out = ensureCreateAiContactWithForm(out, brand, contactInfo);
  out = fillBrokenCreateAiImages(out, imageUrls);
  out = ensureCreateAiCardSliders(out);
  // Menu = Home + every real section on the page (no phantom / missing links)
  out = syncCreateAiSinglePageNav(out);
  return out;
}

const CREATE_AI_SECTION_NAV: Array<{ id: string; label: string; aliases?: string[] }> = [
  { id: "home", label: "Home", aliases: ["hero"] },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "gallery", label: "Gallery" },
  { id: "testimonials", label: "Testimonials", aliases: ["reviews"] },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "team", label: "Team" },
  { id: "timeline", label: "Timeline" },
  { id: "video", label: "Video" },
  { id: "map", label: "Map" },
  { id: "contact", label: "Contact" },
];

/** Detect which story sections exist in the HTML (body order). */
export function listCreateAiPageSections(
  html: string,
): Array<{ id: string; label: string }> {
  if (!html) return [{ id: "home", label: "Home" }];
  const body =
    html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ||
    html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ");
  const found: Array<{ id: string; label: string; pos: number }> = [];
  for (const spec of CREATE_AI_SECTION_NAV) {
    const ids = [spec.id, ...(spec.aliases || [])];
    let pos = -1;
    let useId = spec.id;
    for (const id of ids) {
      const re = new RegExp(
        `<(?:section|div|main|article)\\b[^>]*(?:\\bid=["']${id}["']|data-section-id=["']${id}["']|data-create-ai-${id}=["']1["'])`,
        "i",
      );
      const m = body.match(re);
      if (m && typeof m.index === "number") {
        pos = m.index;
        useId = id === "hero" ? "home" : spec.id;
        break;
      }
    }
    if (pos < 0 && spec.id === "contact") {
      const m = body.match(
        /<(?:section|div)\b[^>]*data-create-ai-contact=["']1["']/i,
      );
      if (m && typeof m.index === "number") pos = m.index;
    }
    if (pos < 0 && spec.id === "home") {
      // Always include Home even if hero id missing
      found.push({ id: "home", label: "Home", pos: 0 });
      continue;
    }
    if (pos >= 0) {
      found.push({ id: useId, label: spec.label, pos });
    }
  }
  // Dedupe by id, keep earliest
  const seen = new Set<string>();
  const ordered = found
    .sort((a, b) => a.pos - b.pos)
    .filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    })
    .map(({ id, label }) => ({ id, label }));
  if (!ordered.some((s) => s.id === "home")) {
    ordered.unshift({ id: "home", label: "Home" });
  } else {
    const home = ordered.find((s) => s.id === "home")!;
    const rest = ordered.filter((s) => s.id !== "home");
    return [home, ...rest];
  }
  return ordered;
}

/**
 * Single-page: header + mobile menu = Home + every section that exists on the page.
 * Fixes mismatch (nav missing Contact / phantom Reviews) that broke scroll-spy.
 */
export function syncCreateAiSinglePageNav(html: string): string {
  if (!html) return html;
  // Multi-page studio: page switches via data-create-ai-page + javascript:void
  if (
    /data-create-ai-page=["']/i.test(html) &&
    /href=["']javascript:void\(0\)["']/i.test(html)
  ) {
    return html;
  }
  const sections = listCreateAiPageSections(html);
  if (sections.length < 1) return html;

  const desktopLis = sections
    .map(
      (s) =>
        `<li><a href="#${escapeHtml(s.id)}" style="color:inherit">${escapeHtml(s.label)}</a></li>`,
    )
    .join("");
  const desktopAnchors = sections
    .map(
      (s) =>
        `<a href="#${escapeHtml(s.id)}" style="color:inherit;text-decoration:none;white-space:nowrap">${escapeHtml(s.label)}</a>`,
    )
    .join("");
  const mobileAnchors = sections
    .map(
      (s) =>
        `<a href="#${escapeHtml(s.id)}" style="display:block;padding:12px 4px;color:inherit;text-decoration:none;border-bottom:1px solid rgba(127,127,127,.2)">${escapeHtml(s.label)}</a>`,
    )
    .join("");

  let out = html;
  // ul.nav-links (reference / Gemini layouts)
  if (/<ul\b[^>]*\bclass=["'][^"']*nav-links[^"']*["'][^>]*>/i.test(out)) {
    out = out.replace(
      /(<ul\b[^>]*\bclass=["'][^"']*nav-links[^"']*["'][^>]*>)([\s\S]*?)(<\/ul>)/i,
      `$1${desktopLis}$3`,
    );
  } else if (
    /<header\b[^>]*>[\s\S]*?<nav\b(?![^>]*data-cai-mobile-panel)[^>]*>/i.test(out)
  ) {
    out = out.replace(
      /(<header\b[\s\S]*?<nav\b(?![^>]*data-cai-mobile-panel)[^>]*>)([\s\S]*?)(<\/nav>)/i,
      `$1${desktopAnchors}$3`,
    );
  }

  if (/data-cai-mobile-panel=["']1["']/i.test(out)) {
    out = out.replace(
      /(<nav\b[^>]*data-cai-mobile-panel=["']1["'][^>]*>)([\s\S]*?)(<\/nav>)/i,
      `$1${mobileAnchors}$3`,
    );
  }

  return out;
}

/** Reliable Pexels URLs when AI leaves empty/broken gallery tiles. */
function createAiStockImagePool(extra?: string[]): string[] {
  const pool = [
    ...(extra || []).filter((u) => /^https?:\/\//i.test(u)),
    "https://images.pexels.com/photos/3807329/pexels-photo-3807329.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/4489702/pexels-photo-4489702.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/4489733/pexels-photo-4489733.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/1090680/pexels-photo-1090680.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=900",
  ];
  return Array.from(new Set(pool));
}

/** Replace empty / invalid img src; never leave broken icons. */
export function fillBrokenCreateAiImages(
  html: string,
  imageUrls?: string[],
): string {
  if (!html) return html;
  const pool = createAiStockImagePool(imageUrls);
  let i = 0;
  const nextUrl = () => pool[i++ % pool.length];
  return html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    if (/data-create-ai-logo=["']1["']/i.test(attrs)) return full;
    const src = attrs.match(/\bsrc=(["'])([^"']*)\1/i)?.[2]?.trim() || "";
    const bad =
      !src ||
      src === "#" ||
      /^(about:blank|null|undefined)$/i.test(src) ||
      /\{\{|\}\}|placeholder|example\.com|via\.placeholder|placehold\.it/i.test(
        src,
      );
    if (!bad) return full;
    const url = nextUrl();
    let a = attrs.replace(/\bsrc=(["'])[^"']*\1/i, "").trim();
    a = `${a} src="${url.replace(/"/g, "&quot;")}"`.trim();
    if (!/alt=/i.test(a)) a += ` alt="Gallery"`;
    if (!/onerror=/i.test(a)) {
      a += ` onerror="this.onerror=null;this.src='${pool[(i + 1) % pool.length].replace(/'/g, "%27")}'"`;
    }
    return `<img ${a}>`;
  });
}

export function injectCreateAiGallerySection(
  html: string,
  brandName: string,
  imageUrls?: string[],
): string {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*(?:id=["']gallery["']|data-create-ai-gallery=["']1["'])[^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "Brand").trim());
  const pool = createAiStockImagePool(imageUrls).slice(0, 6);
  while (pool.length < 6) pool.push(pool[pool.length % Math.max(pool.length, 1)] || createAiStockImagePool()[0]);
  const tiles = pool
    .slice(0, 6)
    .map(
      (src, idx) => `<figure style="margin:0;border-radius:14px;overflow:hidden;aspect-ratio:4/3;background:#e2e8f0">
<img src="${escapeHtml(src)}" alt="${brand} work ${idx + 1}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.onerror=null;this.src='${escapeHtml(createAiStockImagePool()[0])}'"/>
</figure>`,
    )
    .join("");
  const section = `<section id="gallery" data-create-ai-gallery="1" style="padding:56px 24px;max-width:1100px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Gallery</p>
<h2 style="margin:0 0 10px;font-size:clamp(1.5rem,3vw,2rem)">Work &amp; moments</h2>
<p style="margin:0 0 28px;max-width:62ch;opacity:.85;font-size:15px;line-height:1.55">A clear look at the quality ${brand} brings to every job.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">${tiles}</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

function fillCreateAiGalleryImages(html: string, imageUrls?: string[]): string {
  if (!html || !/<section\b[^>]*(?:id=["']gallery["']|data-create-ai-gallery)/i.test(html)) {
    return html;
  }
  const pool = createAiStockImagePool(imageUrls);
  return html.replace(
    /<section\b([^>]*(?:id=["']gallery["']|data-create-ai-gallery=["']1["'])[^>]*)>([\s\S]*?)<\/section>/i,
    (full, attrs: string, inner: string) => {
      let next = fillBrokenCreateAiImages(`<section${attrs}>${inner}</section>`, imageUrls);
      const body = next.match(/<section\b[^>]*>([\s\S]*?)<\/section>/i)?.[1] || inner;
      const imgCount = (body.match(/<img\b/gi) || []).length;
      if (imgCount >= 4) return `<section${attrs}>${body}</section>`;
      const need = 6 - imgCount;
      const extras = pool
        .slice(imgCount, imgCount + Math.max(need, 0))
        .map(
          (src, idx) => `<figure style="margin:0;border-radius:14px;overflow:hidden;aspect-ratio:4/3;background:#e2e8f0">
<img src="${escapeHtml(src)}" alt="Gallery ${imgCount + idx + 1}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"/>
</figure>`,
        )
        .join("");
      if (!extras) return `<section${attrs}>${body}</section>`;
      if (/display\s*:\s*grid/i.test(body)) {
        return `<section${attrs}>${body.replace(
          /(<\/div>\s*)$/i,
          `${extras}$1`,
        )}</section>`;
      }
      return `<section${attrs}>${body}<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:16px">${extras}</div></section>`;
    },
  );
}

/**
 * Contact like morning reference: details card + Name/Email/Message form.
 * Upgrades thin AI stubs that say "form below" but have no <form>.
 */
export function ensureCreateAiContactWithForm(
  html: string,
  brandName: string,
  contact?: { email?: string; mobile?: string; address?: string },
): string {
  if (!html) return html;
  const brand = (brandName || "Brand").trim() || "Brand";
  const email =
    (contact?.email || "").trim() ||
    html.match(/mailto:([^"'?\s]+)/i)?.[1] ||
    "";
  const mobile =
    (contact?.mobile || "").trim() ||
    html.match(/tel:([^"'?\s]+)/i)?.[1] ||
    "";
  const address = (contact?.address || "").trim();

  const hasFormInContact =
    /<section\b[^>]*id=["']contact["'][^>]*>[\s\S]*?<form\b/i.test(html) ||
    /<section\b[^>]*data-create-ai-contact=["']1["'][^>]*>[\s\S]*?<form\b/i.test(
      html,
    );
  if (hasFormInContact) {
    // Form exists — still ensure mailto/tel visible if we have values
    return html;
  }

  const detailRows: string[] = [];
  if (email) {
    detailRows.push(`<div style="display:flex;gap:12px;align-items:flex-start;margin:0 0 14px">
<span style="width:36px;height:36px;border-radius:10px;background:rgba(15,23,42,.06);display:grid;place-items:center;flex-shrink:0">✉</span>
<div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:4px">Email</div>
<a href="mailto:${escapeHtml(email)}" style="color:inherit;font-weight:600;text-decoration:none">${escapeHtml(email)}</a></div></div>`);
  }
  if (mobile) {
    detailRows.push(`<div style="display:flex;gap:12px;align-items:flex-start;margin:0 0 14px">
<span style="width:36px;height:36px;border-radius:10px;background:rgba(15,23,42,.06);display:grid;place-items:center;flex-shrink:0">☎</span>
<div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:4px">Phone</div>
<a href="tel:${escapeHtml(mobile.replace(/\s+/g, ""))}" style="color:inherit;font-weight:600;text-decoration:none">${escapeHtml(mobile)}</a></div></div>`);
  }
  if (address) {
    detailRows.push(`<div style="display:flex;gap:12px;align-items:flex-start;margin:0 0 14px">
<span style="width:36px;height:36px;border-radius:10px;background:rgba(15,23,42,.06);display:grid;place-items:center;flex-shrink:0">⌖</span>
<div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:4px">Address</div>
<span style="font-weight:600">${escapeHtml(address)}</span></div></div>`);
  }
  if (!detailRows.length) {
    detailRows.push(
      `<p style="margin:0;opacity:.75;font-size:14px">Add email / phone in chat to show them here.</p>`,
    );
  }

  const section = `<section id="contact" data-create-ai-contact="1" style="padding:64px 24px;background:#f8f5fb">
<div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;align-items:stretch">
  <div style="padding:28px;border-radius:18px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 10px 30px rgba(15,23,42,.04)">
    <h3 style="margin:0 0 10px;font:700 1.35rem/1.25 Georgia,serif">Let's Connect</h3>
    <p style="margin:0 0 22px;opacity:.8;font-size:15px;line-height:1.55">Schedule a consultation or ask ${escapeHtml(brand)} anything — we reply promptly.</p>
    ${detailRows.join("")}
  </div>
  <div style="padding:28px;border-radius:18px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 10px 30px rgba(15,23,42,.04)">
    <h3 style="margin:0 0 8px;font:700 1.35rem/1.25 Georgia,serif">Contact Form</h3>
    <p style="margin:0 0 18px;opacity:.8;font-size:14px">Fill the form below to get in touch.</p>
    <form data-create-ai-contact-form="1" onsubmit="event.preventDefault();alert('Thanks — we will get back to you shortly.');this.reset();return false;" style="display:grid;gap:14px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
        <label style="display:grid;gap:6px;font-size:13px;font-weight:600">Name
          <input name="name" required placeholder="Your name" style="padding:12px 14px;border-radius:10px;border:1px solid rgba(15,23,42,.15);font:inherit"/>
        </label>
        <label style="display:grid;gap:6px;font-size:13px;font-weight:600">Email
          <input type="email" name="email" required placeholder="Your email" style="padding:12px 14px;border-radius:10px;border:1px solid rgba(15,23,42,.15);font:inherit"/>
        </label>
      </div>
      <label style="display:grid;gap:6px;font-size:13px;font-weight:600">Message
        <textarea name="message" required rows="5" placeholder="Your message" style="padding:12px 14px;border-radius:10px;border:1px solid rgba(15,23,42,.15);font:inherit;resize:vertical"></textarea>
      </label>
      <button type="submit" style="justify-self:start;padding:12px 22px;border:0;border-radius:999px;background:#0f172a;color:#fff;font:700 14px/1 system-ui,sans-serif;cursor:pointer">Send Message</button>
    </form>
  </div>
</div>
</section>`;

  let out = html.replace(
    /<section\b[^>]*(?:id=["']contact["']|data-create-ai-contact=["']1["'])[^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  // Drop orphan contact-details-only boxes that duplicate the new section
  out = out.replace(
    /<div\b[^>]*data-create-ai-contact=["']1["'][^>]*>[\s\S]*?<\/div>/gi,
    "",
  );
  if (/<footer\b/i.test(out)) {
    return out.replace(/<footer\b/i, `${section}<footer`);
  }
  return insertBeforeContactOrFooter(out, section);
}

/** Team section — deterministic library (chat reliability). */
export function injectTeamSection(html: string, brandName: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-team=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "Our").trim() || "Our");
  const people = [
    { role: "Principal", name: brand, blurb: "Strategy & stewardship" },
    { role: "Advisor", name: "Priya Shah", blurb: "Portfolios & protection" },
    { role: "Associate", name: "Rohan Mehta", blurb: "Research & planning" },
  ];
  const cards = people
    .map(
      (p) => `<article style="padding:22px;border:1px solid rgba(127,127,127,.28);border-radius:16px;background:rgba(255,255,255,.03)">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.65">${escapeHtml(p.role)}</p>
<h3 style="margin:0 0 8px;font:700 1.15rem/1.25 Georgia,serif">${escapeHtml(p.name)}</h3>
<p style="margin:0;opacity:.85;font-size:14px;line-height:1.5">${escapeHtml(p.blurb)}</p>
</article>`,
    )
    .join("");
  const section = `<section id="team" data-create-ai-team="1" style="padding:56px 24px;max-width:1100px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">People</p>
<h2 style="margin:0 0 28px;font-size:clamp(1.5rem,3vw,2rem)">The team behind ${brand}</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">${cards}</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** FAQ accordion-style section. */
export function injectFaqSection(html: string, brandName: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-faq=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "we").trim() || "we");
  const faqs = [
    {
      q: "Who is this practice for?",
      a: `${brand} works with individuals and families who want calm, structured financial counsel — not product noise.`,
    },
    {
      q: "How do engagements start?",
      a: "A private consultation to map goals, constraints, and the decisions that matter next.",
    },
    {
      q: "Are fees transparent?",
      a: "Yes. Scope and fees are agreed before work begins — no surprise product pushes.",
    },
  ];
  const items = faqs
    .map(
      (f) => `<details style="border:1px solid rgba(127,127,127,.28);border-radius:12px;padding:14px 16px;background:rgba(255,255,255,.03)">
<summary style="cursor:pointer;font:700 15px/1.35 system-ui,sans-serif">${escapeHtml(f.q)}</summary>
<p style="margin:12px 0 0;opacity:.88;font-size:14px;line-height:1.55">${escapeHtml(f.a)}</p>
</details>`,
    )
    .join("");
  const section = `<section id="faq" data-create-ai-faq="1" style="padding:56px 24px;max-width:800px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">FAQ</p>
<h2 style="margin:0 0 24px;font-size:clamp(1.5rem,3vw,2rem)">Questions, answered plainly</h2>
<div style="display:grid;gap:10px">${items}</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** Simple 3-tier pricing. */
export function injectPricingSection(html: string, brandName: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-pricing=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "Counsel").trim() || "Counsel");
  const tiers = [
    {
      name: "Clarity",
      price: "Consult",
      points: ["Single-session map", "Written next steps", "No retainers"],
    },
    {
      name: "Steward",
      price: "Retainer",
      points: ["Ongoing counsel", "Portfolio reviews", "Priority access"],
    },
    {
      name: "Legacy",
      price: "Custom",
      points: ["Family architecture", "Succession planning", "Dedicated cadence"],
    },
  ];
  const cards = tiers
    .map(
      (t) => `<article style="padding:24px;border:1px solid rgba(127,127,127,.28);border-radius:16px;background:rgba(255,255,255,.03)">
<h3 style="margin:0 0 8px;font:700 1.2rem/1.2 Georgia,serif">${escapeHtml(t.name)}</h3>
<p style="margin:0 0 16px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.75">${escapeHtml(t.price)}</p>
<ul style="margin:0;padding-left:18px;display:grid;gap:8px;font-size:14px;line-height:1.45;opacity:.9">${t.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
</article>`,
    )
    .join("");
  const section = `<section id="pricing" data-create-ai-pricing="1" style="padding:56px 24px;max-width:1100px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Engagements</p>
<h2 style="margin:0 0 28px;font-size:clamp(1.5rem,3vw,2rem)">How ${brand} works with you</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">${cards}</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** Testimonials strip. */
export function injectTestimonialsSection(html: string, brandName: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*(?:id=["']testimonials["']|data-create-ai-testimonials=["']1["'])[^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "the team").trim());
  const quotes = [
    {
      q: `${brand} brought complete clarity and finished the work on time — highly recommend.`,
      a: "Rajesh Kapoor",
      r: "Client",
    },
    {
      q: "Professional, careful, and easy to work with. Quality that shows in every detail.",
      a: "Priya Nair",
      r: "Founder",
    },
    {
      q: "Clear communication and dependable results. We trust them for ongoing work.",
      a: "Vikram Malhotra",
      r: "Managing Director",
    },
  ];
  const cards = quotes.map((t) => {
      const initials = t.a
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return `<article style="padding:24px;border:1px solid rgba(15,23,42,.1);border-radius:16px;background:#fff;display:flex;flex-direction:column;justify-content:space-between;gap:18px;box-shadow:0 8px 24px rgba(15,23,42,.04);height:100%;box-sizing:border-box">
<div>
  <div style="color:#ca8a04;letter-spacing:2px;margin-bottom:10px;font-size:14px">★★★★★</div>
  <p style="margin:0;font:italic 1.05rem/1.5 Georgia,serif;color:#1e293b">“${escapeHtml(t.q)}”</p>
</div>
<div style="display:flex;gap:12px;align-items:center">
  <span style="width:44px;height:44px;border-radius:999px;background:#0f172a;color:#fff;display:grid;place-items:center;font:700 13px/1 system-ui,sans-serif">${escapeHtml(initials)}</span>
  <div>
    <strong style="display:block;font-size:15px">${escapeHtml(t.a)}</strong>
    <span style="font-size:12px;opacity:.65">${escapeHtml(t.r)}</span>
  </div>
</div>
</article>`;
    });
  const section = `<section id="testimonials" data-create-ai-testimonials="1" style="padding:64px 24px;background:#f8fafc">
<div style="max-width:1100px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.65">Client endorsements</p>
<h2 style="margin:0 0 10px;font-size:clamp(1.5rem,3vw,2rem)">What clients say</h2>
<p style="margin:0 0 28px;max-width:62ch;opacity:.8;font-size:15px;line-height:1.55">Trusted feedback from people who worked with ${brand}.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">${cards.join("")}</div>
</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** Google Maps embed (address optional). */
export function injectMapSection(html: string, address?: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-map=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const q = encodeURIComponent((address || "New Delhi").trim() || "New Delhi");
  const section = `<section id="map" data-create-ai-map="1" style="padding:56px 24px;max-width:1100px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Visit</p>
<h2 style="margin:0 0 20px;font-size:clamp(1.5rem,3vw,2rem)">Studio location</h2>
${address ? `<p style="margin:0 0 16px;opacity:.85">${escapeHtml(address)}</p>` : ""}
<div style="border-radius:16px;overflow:hidden;border:1px solid rgba(127,127,127,.28);aspect-ratio:16/9;background:#0b1220">
<iframe title="Map" src="https://maps.google.com/maps?q=${q}&output=embed" style="width:100%;height:100%;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** Video band — YouTube-friendly placeholder + optional link area. */
export function injectVideoSection(html: string, brandName: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-video=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "Practice").trim());
  const section = `<section id="video" data-create-ai-video="1" style="padding:56px 24px;max-width:900px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Watch</p>
<h2 style="margin:0 0 16px;font-size:clamp(1.5rem,3vw,2rem)">A quiet introduction to ${brand}</h2>
<p style="margin:0 0 20px;opacity:.85;line-height:1.55">Chat: “youtube https://… video laga do” — final film URL set ho jayega.</p>
<div style="display:grid;place-items:center;min-height:280px;border-radius:16px;border:1px dashed rgba(127,127,127,.4);background:rgba(255,255,255,.03);color:inherit;opacity:.8;font:600 14px/1.4 system-ui,sans-serif">Video placeholder — YouTube URL add via chat</div>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/**
 * Convert Home hero/banner into a YouTube video banner (muted autoplay loop).
 * Needs YouTube URL — OR explicit "dummy" request (user-approved demo only).
 */
export function extractYoutubeVideoId(text: string): string | null {
  const s = String(text || "");
  // User explicitly asked for dummy/sample after we refused predefined
  if (/\b(dummy|demo|sample|test)\b/i.test(s) && /video|banner|hero|laga|lga|dal|karo|kr/i.test(s)) {
    // Public domain-ish short demo on YouTube (Big Buck Bunny trailer clip commonly used for demos)
    return "aqz-KE-bpKQ";
  }
  if (/^\s*(dummy|demo|sample)\s*(lga|laga|dal|video)?/i.test(s.trim())) {
    return "aqz-KE-bpKQ";
  }
  const m =
    s.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    ) || s.match(/\bv=([A-Za-z0-9_-]{6,})\b/i);
  return m?.[1] || null;
}

export function applyCreateAiHeroVideoBanner(
  html: string,
  brandName = "Brand",
  youtubeUrlOrMessage = "",
): { html: string; ok: boolean; needsUrl?: boolean } {
  if (!html) return { html, ok: false };
  let out = html.replace(
    /<style\b[^>]*data-create-ai-hero-video=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  // Remove any previous stock/sample hero video layers
  out = out.replace(
    /<div\b[^>]*data-create-ai-hero-video=["']1["'][^>]*>[\s\S]*?<\/div>/gi,
    "",
  );

  const ytId = extractYoutubeVideoId(youtubeUrlOrMessage);
  if (!ytId) {
    return { html: out, ok: false, needsUrl: true };
  }

  const brand = escapeHtml((brandName || "Brand").trim());
  const embed = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1`;

  const videoLayer = `<div data-create-ai-hero-video="1" style="position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none">
<iframe title="Hero video" src="${embed}" style="position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100%;min-width:177.78vh;transform:translate(-50%,-50%);border:0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.5),rgba(15,23,42,.7))"></div>
</div>`;

  const css = `<style data-create-ai-hero-video="1">
[data-create-ai-hero-banner="1"]{position:relative!important;min-height:min(78vh,720px)!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:72px 24px!important;background:#0f172a!important}
[data-create-ai-hero-banner="1"] > *:not([data-create-ai-hero-video]){position:relative;z-index:1;color:#fff!important}
[data-create-ai-hero-banner="1"] h1,[data-create-ai-hero-banner="1"] h2,[data-create-ai-hero-banner="1"] p{color:#fff!important}
@media (max-width:900px){[data-create-ai-hero-banner="1"]{min-height:70vh!important;padding:56px 16px!important}}
</style>`;

  const heroRe =
    /(<section\b[^>]*(?:id=["']home["']|id=["']hero["']|class=["'][^"']*\bhero\b[^"']*["']|data-create-ai-hero-banner=["']1["'])[^>]*>)([\s\S]*?)(<\/section>)/i;
  if (heroRe.test(out)) {
    out = out.replace(heroRe, (_m, open: string, inner: string, close: string) => {
      let o = open;
      if (!/data-create-ai-hero-banner=/i.test(o)) {
        o = o.replace(/<section\b/i, '<section data-create-ai-hero-banner="1"');
      }
      if (!/style=/i.test(o)) {
        o = o.replace(/<section\b/i, '<section style="position:relative"');
      } else if (!/position\s*:\s*relative/i.test(o)) {
        o = o.replace(/style=(["'])([\s\S]*?)\1/i, (_s, q: string, st: string) => {
          return `style=${q}position:relative;${st}${q}`;
        });
      }
      return `${o}${videoLayer}${inner}${close}`;
    });
  } else {
    const rebuilt = out.replace(
      /(<\/header>)([\s\S]*?)(<section\b[^>]*>)([\s\S]*?)(<\/section>)/i,
      (
        _m,
        headerClose: string,
        mid: string,
        open: string,
        inner: string,
        close: string,
      ) => {
        let o = open;
        if (!/data-create-ai-hero-banner=/i.test(o)) {
          o = o.replace(/<section\b/i, '<section data-create-ai-hero-banner="1"');
        }
        return `${headerClose}${mid}${o}${videoLayer}${inner}${close}`;
      },
    );
    if (rebuilt === out) {
      const block = `<section id="home" data-create-ai-hero-banner="1" style="position:relative;min-height:72vh;display:flex;align-items:center;justify-content:center;padding:72px 24px;color:#fff">
${videoLayer}
<div style="position:relative;z-index:1;max-width:720px;text-align:center">
<h1 style="margin:0 0 12px;font-size:clamp(2rem,5vw,3.2rem)">${brand}</h1>
</div>
</section>`;
      if (/<\/header>/i.test(out)) {
        out = out.replace(/<\/header>/i, `</header>\n${block}`);
      } else if (/<main\b[^>]*>/i.test(out)) {
        out = out.replace(/<main\b[^>]*>/i, (m) => `${m}\n${block}`);
      } else {
        return { html: out, ok: false, needsUrl: false };
      }
    } else {
      out = rebuilt;
    }
  }

  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${css}</head>`);
  else if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${css}</body>`);
  else out = `${css}${out}`;

  const ok =
    /data-create-ai-hero-video=["']1["']/i.test(out) && /youtube\.com\/embed\//i.test(out);
  return { html: out, ok };
}

/** Set hero/banner background from an attached image (deterministic — never fake Ho gaya). */
export function applyCreateAiHeroImage(
  html: string,
  imageSrc: string,
): { html: string; ok: boolean } {
  const src = (imageSrc || "").trim();
  if (!html || (!src.startsWith("data:image") && !/^https?:\/\//i.test(src))) {
    return { html, ok: false };
  }
  if (src.startsWith("data:image") && src.length > 350_000) {
    return { html, ok: false };
  }
  const safe = src.replace(/"/g, "&quot;").replace(/'/g, "%27");

  let out = html.replace(
    /<div\b[^>]*data-create-ai-hero-image=["']1["'][^>]*>[\s\S]*?<\/div>/gi,
    "",
  );
  // Drop stock video layer if replacing with still image
  out = out.replace(
    /<div\b[^>]*data-create-ai-hero-video=["']1["'][^>]*>[\s\S]*?<\/div>/gi,
    "",
  );

  const layer = `<div data-create-ai-hero-image="1" style="position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#0f172a">
<img src="${safe}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;object-position:center"/>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.42),rgba(15,23,42,.72))"></div>
</div>`;

  const css = `<style data-create-ai-hero-image="1">
[data-create-ai-hero-banner="1"]{position:relative!important;min-height:min(78vh,720px)!important;overflow:hidden!important;display:flex!important;align-items:center!important;padding:72px 24px!important}
[data-create-ai-hero-banner="1"] > *:not([data-create-ai-hero-image]):not([data-create-ai-hero-video]){position:relative;z-index:1}
[data-create-ai-hero-banner="1"] h1,[data-create-ai-hero-banner="1"] h2,[data-create-ai-hero-banner="1"] p{color:#fff!important}
@media (max-width:900px){[data-create-ai-hero-banner="1"]{min-height:70vh!important;padding:56px 16px!important}}
</style>`;

  const heroRe =
    /(<section\b[^>]*(?:id=["']home["']|id=["']hero["']|class=["'][^"']*\bhero\b[^"']*["']|data-create-ai-hero-banner=["']1["'])[^>]*>)([\s\S]*?)(<\/section>)/i;

  const paintSectionOpen = (open: string) => {
    let o = open;
    if (!/data-create-ai-hero-banner=/i.test(o)) {
      o = o.replace(/<section\b/i, '<section data-create-ai-hero-banner="1"');
    }
    if (!/style=/i.test(o)) {
      o = o.replace(
        /<section\b/i,
        '<section style="position:relative;min-height:72vh"',
      );
    } else if (!/position\s*:\s*relative/i.test(o)) {
      o = o.replace(/style=(["'])([\s\S]*?)\1/i, (_s, q: string, st: string) => {
        return `style=${q}position:relative;${st}${q}`;
      });
    }
    o = o.replace(/style=(["'])([\s\S]*?)\1/i, (_s, q: string, st: string) => {
      const next = st
        .replace(/background(?:-color|-image)?\s*:\s*[^;]+;?/gi, "")
        .trim();
      return `style=${q}${next};background:transparent${q}`;
    });
    return o;
  };

  if (heroRe.test(out)) {
    out = out.replace(heroRe, (_m, open: string, inner: string, close: string) => {
      return `${paintSectionOpen(open)}${layer}${inner}${close}`;
    });
  } else if (/<\/header>\s*<section\b/i.test(out)) {
    // First <section> after header = hero when markers missing
    out = out.replace(
      /(<\/header>\s*)(<section\b)([^>]*>)/i,
      (_m, after: string, openTag: string, rest: string) => {
        return `${after}${paintSectionOpen(`${openTag}${rest}`)}${layer}`;
      },
    );
  } else if (
    /<(?:div|main)\b[^>]*(?:id=["'](?:home|hero)["']|class=["'][^"']*\bhero\b[^"']*["'])[^>]*>/i.test(
      out,
    )
  ) {
    // Inject after opening tag only (avoids nested </div> mismatch)
    out = out.replace(
      /(<(div|main)\b)([^>]*(?:id=["'](?:home|hero)["']|class=["'][^"']*\bhero\b[^"']*["'])[^>]*>)/i,
      (_m, openTag: string, tag: string, rest: string) => {
        const t = tag.toLowerCase() === "main" ? "main" : "div";
        let o = `${openTag}${rest}`;
        if (!/data-create-ai-hero-banner=/i.test(o)) {
          o = o.replace(
            new RegExp(`<${t}\\b`, "i"),
            `<${t} data-create-ai-hero-banner="1"`,
          );
        }
        if (!/style=/i.test(o)) {
          o = o.replace(
            new RegExp(`<${t}\\b`, "i"),
            `<${t} style="position:relative;min-height:72vh"`,
          );
        } else {
          o = o.replace(/style=(["'])([\s\S]*?)\1/i, (_s, q: string, st: string) => {
            let next = st;
            if (!/position\s*:\s*relative/i.test(next)) {
              next = `position:relative;${next}`;
            }
            next = next
              .replace(/background(?:-color|-image)?\s*:\s*[^;]+;?/gi, "")
              .trim();
            return `style=${q}${next};background:transparent${q}`;
          });
        }
        return `${o}${layer}`;
      },
    );
  } else if (/<header\b[\s\S]*?<\/header>/i.test(out)) {
    const block = `<section id="home" data-create-ai-hero-banner="1" style="position:relative;min-height:72vh;display:flex;align-items:center;padding:72px 24px;color:#fff">${layer}<div style="position:relative;z-index:1;max-width:720px"><h1 style="margin:0 0 12px;font-size:clamp(2rem,5vw,3.4rem)">Your next chapter</h1></div></section>`;
    out = out.replace(/<\/header>/i, `</header>${block}`);
  } else {
    return { html, ok: false };
  }

  out = out.replace(/<style\b[^>]*data-create-ai-hero-image=["']1["'][^>]*>[\s\S]*?<\/style>/gi, "");
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${css}</head>`);
  else if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${css}</body>`);
  else out = `${css}${out}`;

  const ok = /data-create-ai-hero-image=["']1["']/i.test(out);
  return { html: out, ok };
}

/**
 * Remove extra contact-only bars under the header when a topbar already shows contact.
 */
export function stripDuplicateContactStrips(html: string): string {
  if (!html || !/<\/header>/i.test(html)) return html;

  // Keep at most one data-create-ai-topbar (first wins)
  let seenTop = false;
  let out = html.replace(
    /<(div|aside)\b([^>]*data-create-ai-topbar=["']1["'][^>]*)>([\s\S]*?)<\/\1>/gi,
    (full) => {
      if (seenTop) return "";
      seenTop = true;
      return full;
    },
  );

  const hasTopbar = /data-create-ai-topbar=["']1["']/i.test(out);

  // Collapse stacked contact bars above <header> (AI strip + onboarding strip).
  // Prefer labeled create-ai topbar; never keep an unlabeled strip beside it.
  out = out.replace(
    /(<body\b[^>]*>)([\s\S]*?)(<header\b)/i,
    (_m, bodyOpen: string, mid: string, headerOpen: string) => {
      const midHasLabeled = /data-create-ai-topbar=["']1["']/i.test(mid);
      let keptLabeled = false;
      let keptUnlabeled = false;
      const cleaned = mid.replace(
        /<(div|aside|section|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
        (full, _tag: string, attrs: string, inner: string) => {
          if (/data-create-ai-hero|data-create-ai-breadcrumb/i.test(attrs)) {
            return full;
          }
          const isLabeled = /data-create-ai-topbar=["']1["']/i.test(attrs);
          const text = stripTags(inner);
          const contactStrip =
            /\d{7,}/.test(text) &&
            (/@/.test(text) ||
              /block|street|address|york|delhi|mumbai/i.test(text));
          if (!isLabeled && !contactStrip) return full;
          if (isLabeled) {
            if (keptLabeled) return "";
            keptLabeled = true;
            return full;
          }
          // Unlabeled contact: drop entirely when a labeled topbar exists
          if (midHasLabeled || hasTopbar) return "";
          if (keptUnlabeled) return "";
          keptUnlabeled = true;
          return full;
        },
      );
      const mid2 = cleaned
        .replace(
          /\[data-create-ai-topbar[^\]]*\]\s*\{[^}]+\}(?:\s*@media\s*\([^)]+\)\s*\{\s*\[data-create-ai-topbar[^\]]*\]\s*\{[^}]*\}\s*\})?/gi,
          "",
        )
        .replace(
          /(?:^|>)\s*\+?\d[\d\s().-]{6,}\s*[-–—·•|]\s*[^\s<>]+@[^\s<>]+(?:\s*[-–—·•|]\s*[^<>]{0,80})?(?=<)/gi,
          (m) => (m.startsWith(">") ? ">" : ""),
        );
      return `${bodyOpen}${mid2}${headerOpen}`;
    },
  );

  // Always strip contact-only ROWS inside <header> (AI doubles phone/email under nav)
  out = out.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) => {
      let next = inner;
      for (let pass = 0; pass < 3; pass += 1) {
        const before = next;
        next = next.replace(
          /<(div|aside|ul|p|nav)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
          (full, tag: string, a: string, body: string) => {
            if (/data-cai-|data-create-ai-brand|menu-btn|mobile-panel/i.test(a)) {
              return full;
            }
            if (
              tag === "nav" &&
              /home|about|services|gallery|contact/i.test(stripTags(body)) &&
              !/tel:|mailto:/i.test(body)
            ) {
              return full;
            }
            const text = stripTags(body);
            if (text.length > 280 || text.length < 6) return full;
            if (
              /Enroll|Book|Get started|Journey/i.test(body) &&
              !/tel:|mailto:/i.test(body)
            ) {
              return full;
            }
            const looksContact =
              (/(tel:|mailto:)/i.test(body) ||
                /\+?\d[\d\s\-()]{8,}/.test(text) ||
                /@/.test(text)) &&
              (/@|phone|email|address|\+91|gmail|block|street|road|avenue/i.test(
                text + body,
              ) ||
                (/@/.test(text) && /\d{7,}/.test(text)) ||
                (/\d{7,}/.test(text) && /@/.test(text)));
            // Phone + email (or phone + address) under header = duplicate strip
            if (
              /\d{7,}/.test(text) &&
              (/@/.test(text) || /block|street|road|avenue|delhi|york|mumbai/i.test(text))
            ) {
              return "";
            }
            if (looksContact) return "";
            return full;
          },
        );
        if (next === before) break;
      }
      return `<header${attrs}>${next}</header>`;
    },
  );

  // Nuke contact-looking blocks between </header> and first <section>/<main>
  out = out.replace(
    /(<\/header>)([\s\S]{0,4500}?)(?=<section\b|<main\b|$)/i,
    (_m, close: string, between: string) => {
      let mid = between;
      // Repeated passes to catch nested wrappers
      for (let pass = 0; pass < 4; pass += 1) {
        const before = mid;
        mid = mid.replace(
          /<(div|aside|section|nav|ul|p|header)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
          (full, _tag: string, attrs: string, inner: string) => {
            if (
              /data-create-ai-hero|data-cai-mobile|data-create-ai-breadcrumb|data-create-ai-hero-banner/i.test(
                attrs,
              )
            ) {
              return full;
            }
            if (/data-create-ai-topbar=["']1["']/i.test(attrs)) return "";
            const text = stripTags(inner);
            if (!text || text.length > 320) return full;
            if (/<h1\b|<h2\b|Enroll|Journey|Mastery|Discipline|Begin Your|Hero/i.test(inner)) {
              return full;
            }
            const hasTelMail =
              /(tel:|mailto:)/i.test(inner) ||
              /\+?\d[\d\s\-()]{8,}/.test(text) ||
              /@/.test(text);
            const looksContact =
              hasTelMail &&
              (/phone|email|address|call|\+91|gmail|contact|📍|📞|✉/i.test(
                text + inner,
              ) ||
                (/@/.test(text) && /\d{7,}/.test(text)));
            // Always drop contact strips under header (nav row should not repeat phone/email)
            if (looksContact) return "";
            return full;
          },
        );
        if (mid === before) break;
      }
      // Also strip bare text contact lines + leaked CSS selectors
      mid = mid.replace(
        /(?:<br\s*\/?>|\s)*\+?\d[\d\s\-()]{8,}[\s\S]{0,80}@[^\s<]+[\s\S]{0,120}(?=<section|<main|$)/gi,
        "",
      );
      mid = mid.replace(
        /\[data-create-ai-topbar[^\]]*\]\s*\{[^}]+\}(?:\s*@media\s*\([^)]+\)\s*\{\s*\[data-create-ai-topbar[^\]]*\]\s*\{[^}]*\}\s*\})?/gi,
        "",
      );
      mid = mid.replace(
        /(?:^|>)\s*\+?\d[\d\s().-]{6,}\s*[-–—·•|]\s*[^\s<>]+@[^\s<>]+(?:\s*[-–—·•|]\s*[^<>]{0,80})?(?=<)/gi,
        (m) => (m.startsWith(">") ? ">" : ""),
      );
      return `${close}${mid}`;
    },
  );
  return out;
}

/** Timeline / process steps. */
export function injectTimelineSection(html: string, brandName: string) {
  if (!html) return html;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-timeline=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  const brand = escapeHtml((brandName || "We").trim());
  const steps = [
    { n: "01", t: "Listen", d: "Goals, constraints, and the decisions that matter." },
    { n: "02", t: "Structure", d: "A coherent plan across portfolios, protection, and succession." },
    { n: "03", t: "Steward", d: "Ongoing counsel with calm reviews — not noise." },
  ];
  const items = steps
    .map(
      (s) => `<li style="display:grid;grid-template-columns:64px 1fr;gap:14px;padding:16px 0;border-bottom:1px solid rgba(127,127,127,.22)">
<span style="font:700 1.1rem/1 Georgia,serif;opacity:.75">${s.n}</span>
<div><h3 style="margin:0 0 6px;font:700 1.05rem/1.25 Georgia,serif">${escapeHtml(s.t)}</h3>
<p style="margin:0;opacity:.85;font-size:14px;line-height:1.5">${escapeHtml(s.d)}</p></div>
</li>`,
    )
    .join("");
  const section = `<section id="process" data-create-ai-timeline="1" style="padding:56px 24px;max-width:800px;margin:0 auto">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.7">Process</p>
<h2 style="margin:0 0 24px;font-size:clamp(1.5rem,3vw,2rem)">How ${brand} work with you</h2>
<ol style="list-style:none;margin:0;padding:0">${items}</ol>
</section>`;
  return insertBeforeContactOrFooter(out, section);
}

/** Export-ready HTML: full doc + soft responsive/header normalize for publish parity. */
export function polishCreateAiExportHtml(
  html: string,
  brandName?: string,
  opts?: {
    homeSections?: string[];
    address?: string;
    email?: string;
    mobile?: string;
    imageUrls?: string[];
  },
) {
  if (!html) return html;
  let out = html.trim();
  if (!/^<!DOCTYPE/i.test(out) && /<html\b/i.test(out)) {
    out = `<!DOCTYPE html>\n${out}`;
  }
  out = stripCreateAiContactPromptLeak(out);
  out = normalizeCreateAiCopyrightYear(out);
  out = ensureCreateAiResponsive(out);
  // Keep data-create-ai-hdr — header-fix CSS targets it (strip = brand/nav misalign)
  out = normalizeCreateAiHeaderBar(out);
  // Soften AI diagonal clip-path hacks that slice hero on mobile
  out = out.replace(
    /clip-path\s*:\s*polygon\([^)]+\)\s*;?/gi,
    "/* clip-path removed — mobile safe */",
  );
  out = injectCreateAiPremiumShell(out);
  out = injectCreateAiWowPolish(out);
  out = injectCreateAiReferenceFinish(out);
  // Core sections + footer must exist even when Flash truncates
  out = enforceCreateAiHomeSections(
    out,
    { homeSections: opts?.homeSections },
    brandName,
    opts?.address || "",
    {
      email: opts?.email,
      mobile: opts?.mobile,
      address: opts?.address,
    },
    opts?.imageUrls,
  );
  out = applyCreateAiQaRails(out, brandName, {
    email: opts?.email,
    mobile: opts?.mobile,
    address: opts?.address,
  });
  // Footer/header may have been re-stamped — keep menu = sections
  out = syncCreateAiSinglePageNav(out);
  // Broken img → swap stock, never blank white tile
  out = fillBrokenCreateAiImages(out, opts?.imageUrls);
  return out;
}

/** ZIP export: turn studio page links into relative HTML files (index.html, about.html, …). */
export function rewriteCreateAiZipPageLinks(
  html: string,
  pages: Array<{ id: string; label: string }>,
): string {
  if (!html || !pages?.length) return html;
  const fileFor = (id: string) =>
    id === "home" ? "index.html" : `${id.replace(/[^a-z0-9_-]/gi, "") || "page"}.html`;

  let out = html.replace(
    /<a\b([^>]*?)>/gi,
    (full, attrs: string) => {
      const pageAttr = attrs.match(
        /\bdata-create-ai-page=(["'])([^"']+)\1/i,
      );
      if (pageAttr) {
        const id = pageAttr[2];
        const file = fileFor(id);
        let next = attrs
          .replace(/\bhref\s*=\s*(["'])[\s\S]*?\1/i, "")
          .replace(/\bdata-create-ai-page-missing\s*=\s*(["'])[^"']*\1/gi, "");
        next = `${next} href="${file}"`;
        return `<a${next}>`;
      }
      if (/\bdata-create-ai-page-missing=(["'])1\1/i.test(attrs)) {
        let next = attrs.replace(/\bhref\s*=\s*(["'])[\s\S]*?\1/i, "");
        next = `${next} href="javascript:void(0)"`;
        return `<a${next}>`;
      }
      return full;
    },
  );

  // Label-based fallback for nav that was never studio-normalized
  out = out.replace(
    /<(header|nav)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (block, tag: string, tagAttrs: string, inner: string) => {
      const nextInner = inner.replace(
        /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
        (aFull, aAttrs: string, aInner: string) => {
          if (/data-create-ai-page=/i.test(aAttrs)) return aFull;
          if (/mailto:|tel:|wa\.me/i.test(aAttrs)) return aFull;
          const text = aInner
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const id = matchCreateAiPageId(text, pages);
          if (!id) {
            if (STUDIO_NAV_LABELS.test(text)) {
              const scrub = aAttrs.replace(/\bhref\s*=\s*(["'])[\s\S]*?\1/i, "");
              return `<a${scrub} href="javascript:void(0)">${aInner}</a>`;
            }
            return aFull;
          }
          const file = fileFor(id);
          const scrub = aAttrs.replace(/\bhref\s*=\s*(["'])[\s\S]*?\1/i, "");
          return `<a${scrub} href="${file}">${aInner}</a>`;
        },
      );
      return `<${tag}${tagAttrs}>${nextInner}</${tag}>`;
    },
  );

  return out;
}

function injectBeforeBodyCloseLocal(html: string, snippet: string) {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${snippet}</body>`);
  return `${html}\n${snippet}`;
}

/** If page already has floating actions, keep/normalize SVG stack (preserve email if present). */
export function normalizeCreateAiFloatingIfPresent(
  html: string,
  mobile: string,
  email?: string,
) {
  if (!html) return html;
  const hasFloat =
    /data-create-ai-float=["']1["']/i.test(html) ||
    /data-create-ai-float-btn=/i.test(html) ||
    /position\s*:\s*fixed[^"']*(?:wa\.me|tel:|mailto:)/i.test(html) ||
    /href=["'](?:tel:|mailto:)[^"']+["'][^>]*(?:fixed|float)|href=["']https?:\/\/wa\.me\//i.test(
      html,
    );
  if (!hasFloat) return html;
  const keepEmail =
    /data-create-ai-float-email=["']1["']/i.test(html) ||
    /data-create-ai-float=["']1["'][\s\S]*?mailto:/i.test(html);
  const placement = readFloatPlacement(html) || defaultFloatPlacement();
  const savedTheme =
    html.match(/data-create-ai-float-theme=["']([^"']+)["']/i)?.[1] || "";
  return injectFloatingContact(
    html,
    { mobile, email },
    {
      includeEmail: keepEmail && Boolean((email || "").includes("@")),
      placement,
      themeColor: savedTheme || undefined,
    },
  );
}

/**
 * Ensure brand/logo stays visible on mobile/tablet (outside collapsed nav).
 * Always keep brand NAME next to logo when user/onboarding has a brandName.
 */
export function ensureCreateAiHeaderBrand(
  html: string,
  brandName: string,
  logoImage?: string,
) {
  if (!html || !/<header\b/i.test(html)) return html;
  const brand = (brandName || "Brand").trim();
  if (!brand) return html;

  // Desktop: never clip brand to "Abhishek M..."
  html = html.replace(
    /(data-cai-brand-label=["']1["'][^>]*\bstyle=["'])([^"']*)(["'])/gi,
    (_m, pre: string, style: string, q: string) => {
      let s = style
        .replace(/max-width\s*:\s*[^;]+;?/gi, "")
        .replace(/overflow\s*:\s*[^;]+;?/gi, "")
        .replace(/text-overflow\s*:\s*[^;]+;?/gi, "")
        .replace(/;{2,}/g, ";")
        .replace(/^;|;$/g, "");
      s = s
        ? `${s};max-width:none;overflow:visible;text-overflow:clip`
        : `max-width:none;overflow:visible;text-overflow:clip`;
      return `${pre}${s}${q}`;
    },
  );

  const logo = (logoImage || "").trim() || extractCreateAiLogoSrc(html);

  // With a logo file — always ONE chip = logo + name (never logo-only / never 2nd AI brand)
  if (logo) {
    if (
      headerBrandChipHasName(html, brand) &&
      /data-create-ai-logo=["']1["']/i.test(html)
    ) {
      return stripSecondaryHeaderBrands(html, brand);
    }
    // Rename: replace existing label text in-place when chip already has logo
    if (
      /data-create-ai-logo=["']1["']/i.test(html) &&
      /data-cai-brand-label=["']1["']/i.test(html)
    ) {
      const renamed = html.replace(
        /(<span\b[^>]*data-cai-brand-label=["']1["'][^>]*>)([\s\S]*?)(<\/span>)/i,
        `$1${escapeHtml(brand)}$3`,
      );
      if (headerBrandChipHasName(renamed, brand)) {
        return stripSecondaryHeaderBrands(renamed, brand);
      }
    }
    return injectBrandLogo(html, logo, brand);
  }

  // No logo file — ensure text label exists in header brand chip
  if (/data-create-ai-brand=["']1["']/i.test(html)) {
    let out = html.replace(
      /(<(?:a|div|span|strong|p|h[1-6])\b[^>]*data-create-ai-brand=["']1["'][^>]*)>/gi,
      (open) =>
        /data-cai-brand=/i.test(open)
          ? open
          : open.replace(/>$/, ' data-cai-brand="1">'),
    );
    if (!headerBrandChipHasName(out, brand)) {
      if (/data-cai-brand-label=["']1["']/i.test(out)) {
        out = out.replace(
          /(<span\b[^>]*data-cai-brand-label=["']1["'][^>]*>)([\s\S]*?)(<\/span>)/i,
          `$1${escapeHtml(brand)}$3`,
        );
      } else {
        out = appendNameToBrandChip(out, brand);
      }
    }
    return out;
  }

  const brandLower = brand.toLowerCase();
  let marked = false;
  const tagged = html.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (full, attrs: string, inner: string) => {
      const next = inner.replace(
        /<(a|div|span|strong|p|h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/i,
        (el: string, tag: string, a: string, content: string) => {
          if (marked) return el;
          if (/data-cai-menu|data-cai-mobile|nav\b/i.test(a + tag)) return el;
          const text = content
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
          if (!text) return el;
          const hit =
            text === brandLower ||
            text.includes(brandLower) ||
            brandLower.includes(text);
          if (!hit || text.length > brand.length + 24) return el;
          marked = true;
          const attrsClean = a
            .replace(/\s*data-create-ai-brand\s*=\s*(["'])[^"']*\1/gi, "")
            .replace(/\s*data-cai-brand\s*=\s*(["'])[^"']*\1/gi, "");
          return `<${tag}${attrsClean} data-create-ai-brand="1" data-cai-brand="1">${content}</${tag}>`;
        },
      );
      if (marked) return `<header${attrs}>${next}</header>`;
      const chip = `<span data-create-ai-brand="1" data-cai-brand="1" class="brand" style="display:inline-flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.02em;max-width:min(42vw,420px);z-index:5;position:relative;white-space:nowrap">${escapeHtml(brand)}</span>`;
      return `<header${attrs}>${chip}${inner}</header>`;
    },
  );
  return tagged;
}

function headerBrandChipHasName(html: string, brandName: string) {
  const brand = (brandName || "").trim();
  if (!brand) return false;
  const chip =
    html.match(
      /<(?:span|div|a)\b[^>]*data-(?:create-ai|cai)-brand=["']1["'][^>]*>([\s\S]*?)<\/(?:span|div|a)>/i,
    )?.[1] || "";
  // Visible text only — ignore img alt (was false-positive "name added")
  const text = stripTags(chip).replace(/\s+/g, " ").trim().toLowerCase();
  return text.includes(brand.toLowerCase());
}

/** Exported for chat success checks — visible brand text next to logo. */
export function createAiHeaderHasBrandLabel(html: string, brandName: string) {
  return headerBrandChipHasName(html, brandName);
}

function appendNameToBrandChip(html: string, brandName: string) {
  const brand = (brandName || "").trim();
  if (!brand || !html) return html;
  const label = `<span data-cai-brand-label="1" style="white-space:nowrap;overflow:visible;text-overflow:clip;font-weight:700;letter-spacing:.02em;max-width:none">${escapeHtml(brand)}</span>`;
  return html.replace(
    /<(span|div|a)\b([^>]*data-(?:create-ai|cai)-brand=["']1["'][^>]*)>([\s\S]*?)<\/\1>/i,
    (_m, tag: string, attrs: string, inner: string) => {
      let a = attrs;
      if (!/display\s*:\s*inline-flex|display\s*:\s*flex/i.test(a + inner)) {
        if (/style="/i.test(a)) {
          a = a.replace(
            /style="/i,
            'style="display:inline-flex;align-items:center;gap:8px;',
          );
        } else {
          a += ` style="display:inline-flex;align-items:center;gap:8px"`;
        }
      }
      return `<${tag}${a}>${inner}${label}</${tag}>`;
    },
  );
}

/** Build a shared nav that lists all site pages (studio swaps page on click). */
export function buildSharedNavHtml(
  pages: Array<{ id: string; label: string }>,
  activeId: string,
) {
  const links = pages
    .map((p) => {
      const active = p.id === activeId;
      return `<a href="javascript:void(0)" data-create-ai-page="${escapeHtml(p.id)}" style="margin-left:14px;text-decoration:${active ? "underline" : "none"};font-weight:${active ? "700" : "600"};opacity:${active ? "1" : ".85"};cursor:pointer">${escapeHtml(p.label)}</a>`;
    })
    .join("");
  return links;
}

/** Map nav label → existing page id (Home/About/…). */
export function matchCreateAiPageId(
  label: string,
  pages: Array<{ id: string; label: string }>,
): string | null {
  const t = (label || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!t) return null;
  const hit = pages.find(
    (p) =>
      p.id.toLowerCase() === t ||
      p.label.toLowerCase() === t ||
      p.label.toLowerCase().replace(/\s+/g, "-") === t,
  );
  if (hit) return hit.id;
  // common aliases
  if (/^home$|^main$|^index$/i.test(t)) {
    return pages.find((p) => p.id === "home")?.id || null;
  }
  if (/^about(\s+us)?$|^our\s+story$|^who\s+we\s+are$/i.test(t)) {
    return (
      pages.find((p) => /about/i.test(p.id) || /about/i.test(p.label))?.id ||
      null
    );
  }
  if (/^services?$|^what\s+we\s+do$/i.test(t)) {
    return (
      pages.find((p) => /service/i.test(p.id) || /service/i.test(p.label))
        ?.id || null
    );
  }
  if (/^galler(y|ies)$|^portfolio$|^work$/i.test(t)) {
    return (
      pages.find((p) => /galler|portfolio|work/i.test(p.id + p.label))?.id ||
      null
    );
  }
  if (/^contact(\s+us)?$|^get\s+in\s+touch$/i.test(t)) {
    return (
      pages.find((p) => /contact/i.test(p.id) || /contact/i.test(p.label))
        ?.id || null
    );
  }
  return null;
}

const STUDIO_NAV_LABELS =
  /^(home|about(\s+us)?|services?|galler(y|ies)|contact(\s+us)?|blog|pricing|team|faq|our\s+story|portfolio)$/i;

/**
 * Multi-page studio preview: existing pages → data-create-ai-page + void(0);
 * missing menu items → void(0) (no navigation / no chat hijack).
 */
export function normalizeCreateAiStudioNav(
  html: string,
  pages: Array<{ id: string; label: string }>,
  activeId?: string,
): string {
  if (!html || !pages?.length) return html;

  const scrub = (attrs: string) =>
    attrs
      .replace(/\s*href\s*=\s*(["'])[\s\S]*?\1/i, "")
      .replace(/\s*data-create-ai-page\s*=\s*(["'])[^"']*\1/gi, "")
      .replace(/\s*data-create-ai-page-missing\s*=\s*(["'])[^"']*\1/gi, "")
      .replace(/\s*target\s*=\s*(["'])[^"']*\1/gi, "")
      .replace(/\s*aria-current\s*=\s*(["'])[^"']*\1/gi, "");

  const rewriteChunk = (chunk: string) =>
    chunk.replace(
      /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
      (full, attrs: string, inner: string) => {
        if (
          /data-create-ai-float|mailto:|tel:|wa\.me|api\.whatsapp/i.test(
            `${attrs}${full}`,
          )
        ) {
          return full;
        }
        const text = inner
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!text || text.length > 42) return full;

        const pageId = matchCreateAiPageId(text, pages);
        const base = scrub(attrs);

        if (pageId) {
          const active = Boolean(activeId && pageId === activeId);
          return `<a${base} href="javascript:void(0)" data-create-ai-page="${escapeHtml(pageId)}"${active ? ' aria-current="page"' : ""}>${inner}</a>`;
        }

        if (STUDIO_NAV_LABELS.test(text)) {
          return `<a${base} href="javascript:void(0)" data-create-ai-page-missing="1">${inner}</a>`;
        }
        return full;
      },
    );

  let out = html;
  out = out.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, (h) =>
    rewriteChunk(h),
  );
  out = out.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, (n) => rewriteChunk(n));
  return out;
}

/**
 * Prefer keeping home header shell (logo/brand area) but refresh its <nav> links.
 * Falls back to a simple header if home has no <header>.
 */
/**
 * Prefer keeping home header shell + AI nav labels.
 * Existing pages get data-create-ai-page; missing menu labels → javascript:void(0).
 */
export function refreshHeaderNav(
  headerHtml: string,
  pages: Array<{ id: string; label: string }>,
  activeId: string,
  brandName: string,
) {
  if (headerHtml && /<header\b|<nav\b/i.test(headerHtml)) {
    return normalizeCreateAiStudioNav(headerHtml, pages, activeId);
  }
  const navInner = buildSharedNavHtml(pages, activeId);
  return `<header style="display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 24px;background:#0f172a;color:#fff"><strong>${escapeHtml(brandName)}</strong><nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end">${navInner}</nav></header>`;
}

/** Pull main page body (without home chrome) from an AI-generated full document. */
export function extractMainContent(html: string) {
  let body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] || html;
  body = body
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .trim();
  if (!body) {
    body = `<main style="padding:48px 24px"><h1>New page</h1></main>`;
  }
  if (!/^<main\b/i.test(body)) {
    body = `<main>${body}</main>`;
  }
  return body;
}

/**
 * Stitch home header/footer (+ shared styles) around a page's main content.
 */
export function stitchPageWithHomeChrome(params: {
  homeHtml: string;
  pageHtml: string;
  pageLabel: string;
  pageId: string;
  brandName: string;
  pages: Array<{ id: string; label: string }>;
}) {
  const chrome = extractCreateAiChrome(params.homeHtml);
  const main = extractMainContent(params.pageHtml);
  const header = refreshHeaderNav(
    chrome.header,
    params.pages,
    params.pageId,
    params.brandName,
  );
  const footer =
    chrome.footer ||
    `<footer style="padding:28px 24px;background:#0f172a;color:#fff"><strong>${escapeHtml(params.brandName)}</strong></footer>`;

  const title = escapeHtml(
    `${params.pageLabel} · ${params.brandName || chrome.title || "Site"}`,
  );

  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
${chrome.headLinks || ""}
${chrome.styles || ""}
<style>
/* create-ai shared chrome */
header a{color:inherit}
main{min-height:50vh}
</style>
</head>
<body>
${header}
${main}
${footer}
</body>
</html>`;
  // Same soft responsive + mobile ☰ as single-page (stitch used to drop them)
  let out = normalizeCreateAiStudioNav(doc, params.pages, params.pageId);
  out = ensureCreateAiInnerPageLayout(out, {
    brandName: params.brandName,
    pageLabel: params.pageLabel,
    pageId: params.pageId,
  });
  out = ensureCreateAiResponsive(out);
  out = normalizeCreateAiHeaderBar(out);
  return out;
}

/**
 * Inner pages: guarantee breadcrumb + shared content-column alignment
 * (AI often ships stub pages with no crumb / drifting sections).
 */
export function ensureCreateAiInnerPageLayout(
  html: string,
  opts: { brandName: string; pageLabel: string; pageId: string },
): string {
  if (!html) return html;
  const pageId = (opts.pageId || "").toLowerCase();
  const label = (opts.pageLabel || "").trim() || "Page";
  if (!pageId || pageId === "home" || /^home$/i.test(label)) return html;

  let out = html.replace(
    /<nav\b[^>]*data-create-ai-breadcrumb=["']1["'][^>]*>[\s\S]*?<\/nav>/gi,
    "",
  );
  out = out.replace(
    /<style\b[^>]*data-create-ai-inner-align=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );

  const crumb = `<nav data-create-ai-breadcrumb="1" aria-label="Breadcrumb"><a href="javascript:void(0)" data-create-ai-page="home">Home</a><span aria-hidden="true"> / </span><span>${escapeHtml(label)}</span></nav>`;

  if (/<\/header>/i.test(out)) {
    out = out.replace(/<\/header>/i, `</header>\n${crumb}`);
  } else if (/<main\b[^>]*>/i.test(out)) {
    out = out.replace(/<main\b[^>]*>/i, (open) => `${open}\n${crumb}`);
  } else if (/<body\b[^>]*>/i.test(out)) {
    out = out.replace(/<body\b[^>]*>/i, (open) => `${open}\n${crumb}`);
  } else {
    out = `${crumb}${out}`;
  }

  // Tag first section in main as inner hero for align CSS
  out = out.replace(
    /(<main\b[^>]*>)([\s\S]*?)(<section\b)(?![^>]*data-create-ai-inner-hero)/i,
    (_m, mainOpen: string, mid: string, sec: string) => {
      if (/data-create-ai-inner-hero/i.test(mid)) {
        return `${mainOpen}${mid}${sec}`;
      }
      return `${mainOpen}${mid}${sec} data-create-ai-inner-hero="1"`;
    },
  );

  const css = `<style data-create-ai-inner-align="1">
[data-create-ai-breadcrumb="1"]{
  display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;
  width:100%;max-width:1120px;margin:0 auto;
  padding:16px clamp(16px,4vw,28px) 8px;
  box-sizing:border-box;
  font:600 13px/1.4 system-ui,Segoe UI,sans-serif;
  letter-spacing:.03em;opacity:.88;
}
[data-create-ai-breadcrumb="1"] a{color:inherit;text-decoration:none}
[data-create-ai-breadcrumb="1"] a:hover{text-decoration:underline}
main{
  width:100%!important;max-width:1120px!important;
  margin-left:auto!important;margin-right:auto!important;
  padding-left:clamp(16px,4vw,28px)!important;
  padding-right:clamp(16px,4vw,28px)!important;
  box-sizing:border-box!important;
}
main > section,
main > div,
[data-create-ai-inner-hero="1"]{
  width:100%!important;max-width:100%!important;
  margin-left:auto!important;margin-right:auto!important;
  box-sizing:border-box!important;
}
main > section[style*="max-width:480"],
main > section[style*="max-width:420"],
main > section[style*="max-width:360"]{
  max-width:100%!important;
}
@media (max-width:900px){
  main{padding-left:14px!important;padding-right:14px!important}
  [data-create-ai-breadcrumb="1"]{padding-left:14px;padding-right:14px}
  main > section [style*="grid-template-columns"],
  main > section [style*="display:grid"]{grid-template-columns:1fr!important}
  main > section [style*="display:flex"]{flex-wrap:wrap!important}
}
</style>`;

  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${css}</head>`);
  else out = `${css}${out}`;
  return out;
}

/**
 * Light responsive safety only — NO default hamburger/menu inject.
 * Mobile/tablet nav must come from the AI design itself (unique per site).
 */
export function ensureCreateAiResponsive(html: string) {
  if (!html) return html;
  let out = html;

  if (!/<meta[^>]+name=["']viewport["']/i.test(out)) {
    const viewport =
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>';
    out = /<\/head>/i.test(out)
      ? out.replace(/<\/head>/i, `${viewport}</head>`)
      : viewport + out;
  }

  // Strip legacy system menu inject (was fighting AI headers)
  out = out.replace(
    /<style[^>]*data-create-ai-responsive=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  out = out.replace(
    /<script[^>]*data-create-ai-responsive=["']1["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(
    /<button[^>]*id=["']create-ai-nav-toggle["'][^>]*>[\s\S]*?<\/button>/gi,
    "",
  );
  out = out.replace(/\s*create-ai-nav-open\s*/g, " ");

  // Soften AI "tiny centered page" shells that break tablet/desktop fill
  out = out.replace(
    /(body\s*\{)([^}]*)\}/gi,
    (_m, open: string, body: string) => {
      let b = body.replace(
        /max-width\s*:\s*(\d{2,3})px/gi,
        (mm: string, n: string) =>
          parseInt(n, 10) > 0 && parseInt(n, 10) < 960 ? "max-width:100%" : mm,
      );
      b = b.replace(
        /width\s*:\s*(\d{2,3})px/gi,
        (mm: string, n: string) =>
          parseInt(n, 10) > 0 && parseInt(n, 10) < 960 ? "width:100%" : mm,
      );
      if (!/width\s*:/i.test(b)) b += ";width:100%";
      return `${open}${b}}`;
    },
  );

  const css = `<style data-create-ai-responsive="1">
/* fluid shell — fill viewport; NEVER smash header/nav layout */
*{box-sizing:border-box}
html,body{width:100%!important;max-width:100%!important;margin:0!important;overflow-x:clip!important}
body{min-height:100%}
@supports not (overflow:clip){
  html,body{overflow-x:hidden!important}
}
img,video,iframe,svg,canvas,table{max-width:100%;height:auto}
body>div,body>main,.wrap,.wrapper,.container,.page,.site,.shell,.inner{max-width:100%}
/* header/nav are sacred — system CSS must not reflow them */
header,header *,nav,nav *,[role="banner"],[role="banner"] *{
  max-width:none;
}
header [style*="grid-template-columns"],
header [style*="display:grid"],
header [style*="display: grid"],
nav [style*="grid-template-columns"]{
  grid-template-columns:unset;
}
header [style*="display:flex"],
header [style*="display: flex"],
nav [style*="display:flex"],
nav [style*="display: flex"]{
  flex-wrap:nowrap;
}
@media (max-width:1100px){
  /* sections only — not header */
  footer,section,main,article,.hero,[class*="hero"]{
    width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;
    padding-left:max(12px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right));
  }
  section [style*="grid-template-columns"],
  main [style*="grid-template-columns"],
  .hero [style*="grid-template-columns"],
  section [style*="display:grid"],
  section [style*="display: grid"],
  main [style*="display:grid"],
  .hero [style*="display:grid"]{
    grid-template-columns:1fr!important;
  }
  h1{font-size:clamp(1.55rem,5vw,2.4rem)!important;line-height:1.2;word-break:break-word}
  h2{font-size:clamp(1.2rem,3.5vw,1.85rem)!important;line-height:1.25}
}
@media (max-width:820px){
  section [style*="display:flex"],
  section [style*="display: flex"],
  main [style*="display:flex"],
  .hero [style*="display:flex"],
  footer [style*="display:flex"]{
    flex-wrap:wrap!important;
  }
  section [style*="width:"][style*="px"],
  main [style*="width:"][style*="px"],
  .hero [style*="width:"][style*="px"]{
    max-width:100%!important;
  }
  section [style*="min-width:"],
  main [style*="min-width:"],
  .hero [style*="min-width:"]{
    min-width:0!important;
  }
}
@media (max-width:640px){
  h1{font-size:clamp(1.45rem,7vw,2.1rem)!important}
  h2{font-size:clamp(1.15rem,5vw,1.6rem)!important}
  section [style*="grid-template-columns"],
  main [style*="grid-template-columns"],
  .hero [style*="grid-template-columns"],
  section [style*="display:grid"],
  main [style*="display:grid"],
  .hero [style*="display:grid"]{
    grid-template-columns:1fr!important;
  }
  /* forms / stats strips */
  form,fieldset{max-width:100%!important}
  input,textarea,select,button{max-width:100%}
}
/* tablet recipe: comfortable 1–2 col sections */
@media (min-width:641px) and (max-width:1024px){
  section .stats,section [class*="stat"]{
    flex-wrap:wrap!important;
  }
}
</style>`;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${css}</head>`);
  } else {
    out = css + out;
  }
  return out;
}

/** Inject smooth in-page scroll for single-page menu (#section) clicks. */
export function ensureSinglePageSectionScroll(html: string) {
  if (!html) return html;
  // Re-stamp so older previews also get reference-style active nav
  let out = html
    .replace(
      /<script\b[^>]*data-create-ai-scroll=["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
      "",
    )
    .replace(
      /<style\b[^>]*data-create-ai-nav-active=["'][^"']*["'][^>]*>[\s\S]*?<\/style>/gi,
      "",
    );

  const style = `<style data-create-ai-nav-active="2">
header[data-create-ai-hdr="1"],
header[data-create-ai-hdr="1"] .nav-container,
header[data-create-ai-hdr="1"] .nav-links,
header[data-create-ai-hdr="1"] ul,
header[data-create-ai-hdr="1"] nav{
  overflow:visible!important;
}
header .nav-links a[href^="#"],
header ul.nav-links a[href^="#"],
header[data-create-ai-hdr="1"] a[href^="#"]:not([data-cai-btn]):not([data-cai-brand]):not([data-create-ai-brand]):not(.brand-logo):not(.btn):not(.btn-primary),
header nav a[href^="#"]:not([data-cai-btn]),
[data-cai-mobile-panel] a[href^="#"]{
  position:relative!important;
  transition:color .2s ease, border-color .2s ease!important;
  text-decoration:none!important;
  border-bottom:2px solid transparent!important;
  padding-bottom:6px!important;
  margin-bottom:-2px!important;
}
header .nav-links a[href^="#"].active,
header .nav-links a[href^="#"][aria-current="true"],
header .nav-links a[href^="#"][aria-current="page"],
header ul.nav-links a[href^="#"].active,
header[data-create-ai-hdr="1"] a[href^="#"].active:not([data-cai-btn]):not(.brand-logo):not(.btn):not(.btn-primary),
header[data-create-ai-hdr="1"] a[href^="#"][aria-current="true"]:not([data-cai-btn]):not(.brand-logo):not(.btn):not(.btn-primary),
header[data-create-ai-hdr="1"] a[href^="#"][aria-current="page"]:not([data-cai-btn]):not(.brand-logo):not(.btn):not(.btn-primary),
header nav a[href^="#"].active,
[data-cai-mobile-panel] a[href^="#"].active,
[data-cai-mobile-panel] a[href^="#"][aria-current="true"]{
  color:var(--cai-primary,#C2410C)!important;
  font-weight:700!important;
  border-bottom-color:var(--cai-primary,#C2410C)!important;
}
header .nav-links a[href^="#"]:hover,
header[data-create-ai-hdr="1"] a[href^="#"]:not([data-cai-btn]):not(.brand-logo):not(.btn):not(.btn-primary):hover{
  color:var(--cai-primary,#C2410C)!important;
  border-bottom-color:var(--cai-primary,#C2410C)!important;
}
header .header-actions a,
header a[data-cai-btn],
header a.btn,
header a.btn-primary,
header a.brand-logo,
header a[style*="border-radius:999"],
header a[style*="border-radius: 999"]{
  border-bottom:none!important;
  margin-bottom:0!important;
  font-weight:inherit;
}
header .header-actions a:hover,
header a[data-cai-btn]:hover,
header a.btn:hover,
header a.btn-primary:hover{
  border-bottom:none!important;
}
header a[data-cai-btn]::after,
header a.btn::after,
header a.btn-primary::after,
header a.brand-logo::after{display:none!important;content:none!important}
</style>`;

  const script = `<script data-create-ai-scroll="2">
(function(){
  if(window.__caiNavScrollV2) return;
  window.__caiNavScrollV2 = true;
  function isNavLink(a){
    if(!a) return false;
    if(a.getAttribute("data-cai-btn") || a.getAttribute("data-cai-brand") || a.getAttribute("data-create-ai-brand")) return false;
    if(a.classList && (a.classList.contains("brand-logo") || a.classList.contains("btn") || a.classList.contains("btn-primary"))) return false;
    if(a.closest && a.closest("[data-cai-brand],[data-create-ai-brand],.header-actions")) return false;
    var st = a.getAttribute("style") || "";
    if(/border-radius\\s*:\\s*999/i.test(st) && /background/i.test(st)) return false;
    if(/padding\\s*:\\s*[^;]*(1[2-9]|2\\d)px/i.test(st) && /background/i.test(st)) return false;
    var txt = (a.textContent || "").replace(/\\s+/g," ").trim();
    if(!txt || txt.length > 40) return false;
    return true;
  }
  function navLinks(){
    var sel = "header .nav-links a[href^='#'], header ul.nav-links a[href^='#'], header nav a[href^='#'], [data-cai-mobile-panel] a[href^='#']";
    var list = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(isNavLink);
    if(list.length) return list;
    return Array.prototype.slice.call(
      document.querySelectorAll("header a[href^='#'], [data-cai-mobile-panel] a[href^='#']")
    ).filter(isNavLink);
  }
  var pinnedId = null;
  var pinnedUntil = 0;
  function setActive(id, fromUser){
    var target = (id || "home").toLowerCase();
    if(target === "hero") target = "home";
    if(fromUser){
      pinnedId = target;
      pinnedUntil = Date.now() + 1200;
    }
    navLinks().forEach(function(a){
      var href = (a.getAttribute("href") || "").replace(/^#/, "").toLowerCase();
      var on = href === target || (target === "home" && (href === "home" || href === "hero"));
      a.classList.toggle("active", on);
      if(on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  function resolveSection(id){
    if(!id) return null;
    return document.getElementById(id)
      || document.querySelector("[data-section-id='"+id+"']")
      || (id === "contact" ? document.querySelector("[data-create-ai-contact='1'],section.contact,#contact") : null)
      || document.querySelector("[name='"+id+"']");
  }
  function headerOffset(){
    var h = document.querySelector("header[data-create-ai-hdr],header");
    var topBar = document.querySelector("[data-create-ai-topbar]");
    return (h ? h.getBoundingClientRect().height : 72) + (topBar ? topBar.getBoundingClientRect().height : 0) + 12;
  }
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest && e.target.closest("a[href^='#']");
    if(!a || !isNavLink(a)) return;
    var href = a.getAttribute("href") || "";
    if(href.length < 2 || href === "#") return;
    var id = href.slice(1);
    var el = resolveSection(id);
    if(!el) return;
    e.preventDefault();
    e.stopPropagation();
    setActive(id, true);
    var y = el.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop || 0);
    var top = Math.max(0, y - headerOffset());
    try { window.scrollTo({ top: top, behavior: "smooth" }); }
    catch(_){ window.scrollTo(0, top); }
    setTimeout(function(){ setActive(id, true); }, 450);
  }, true);

  function navSectionsSorted(){
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var list = navLinks().map(function(a){
      var id = (a.getAttribute("href") || "").replace(/^#/, "");
      if(!id) return null;
      var el = resolveSection(id);
      return el ? { id: id, el: el } : null;
    }).filter(Boolean);
    list.sort(function(a, b){
      var ta = a.el.getBoundingClientRect().top + y;
      var tb = b.el.getBoundingClientRect().top + y;
      return ta - tb;
    });
    return list;
  }
  function onScroll(){
    if(pinnedId && Date.now() < pinnedUntil){
      setActive(pinnedId, false);
      return;
    }
    var list = navSectionsSorted();
    if(!list.length) return;
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var docH = Math.max(
      document.body.scrollHeight || 0,
      document.documentElement.scrollHeight || 0
    );
    /* Footer / page end → last menu item (Contact) */
    if(y + vh >= docH - 160){
      setActive(list[list.length - 1].id);
      return;
    }
    var mark = y + headerOffset();
    var current = list[0];
    for(var i = 0; i < list.length; i++){
      var top = list[i].el.getBoundingClientRect().top + y;
      if(top <= mark + 8) current = list[i];
    }
    /* Contact visible in viewport → prefer Contact over previous section */
    var contactEntry = null;
    for(var j = 0; j < list.length; j++){
      if((list[j].id || "").toLowerCase() === "contact") contactEntry = list[j];
    }
    if(contactEntry){
      var cr = contactEntry.el.getBoundingClientRect();
      if(cr.top < vh * 0.55 && cr.bottom > headerOffset()){
        setActive("contact");
        return;
      }
    }
    setActive(current.id);
  }
  var ticking = false;
  function requestScroll(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ ticking = false; onScroll(); });
  }
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
  window.addEventListener("load", onScroll);
  if(document.readyState === "complete" || document.readyState === "interactive") onScroll();
  else document.addEventListener("DOMContentLoaded", onScroll);
  setTimeout(onScroll, 50);
  setTimeout(onScroll, 300);
  setActive("home");
})();
<\/script>`;

  const inject = `${style}\n${script}`;
  if (/<\/body>/i.test(out)) {
    return out.replace(/<\/body>/i, `${inject}</body>`);
  }
  return out + inject;
}
export function restitchAllPagesWithHomeChrome(params: {
  pages: Array<{ id: string; label: string; html: string }>;
  brandName: string;
}) {
  const home = params.pages.find((p) => p.id === "home") || params.pages[0];
  if (!home?.html) return params.pages;

  const navPages = params.pages.map((p) => ({ id: p.id, label: p.label }));
  // First normalize home header/footer with full nav
  const homeStitched = stitchPageWithHomeChrome({
    homeHtml: home.html,
    pageHtml: home.html,
    pageLabel: home.label,
    pageId: home.id,
    brandName: params.brandName,
    pages: navPages,
  });

  return params.pages.map((p) => {
    if (p.id === home.id) {
      return { ...p, html: homeStitched };
    }
    return {
      ...p,
      html: stitchPageWithHomeChrome({
        homeHtml: homeStitched,
        pageHtml: p.html,
        pageLabel: p.label,
        pageId: p.id,
        brandName: params.brandName,
        pages: navPages,
      }),
    };
  });
}
