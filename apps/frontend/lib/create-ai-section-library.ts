/**
 * Create-with-AI Phase-1 section library — handcrafted rotate variants.
 * Header ×20 · Banner/Hero ×20 · Top bar ×10 · Copyright ×10 · Back-to-top ×8
 */

function esc(v: string) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(s: string) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickNext<T extends { id: string }>(
  list: T[],
  prevId: string,
): T {
  const i = list.findIndex((x) => x.id === prevId);
  return list[(i + 1 + list.length) % list.length];
}

function extractLinks(scope: string): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(scope))) {
    const href = m[1];
    const label = stripTags(m[2]).replace(/\s+/g, " ").trim();
    if (!label || label.length > 28) continue;
    if (/mailto:|tel:|wa\.me/i.test(href)) continue;
    if (
      /book|schedule|enquire|connect|talk|plan visit|get in touch|start|consult/i.test(
        label,
      ) &&
      !/^contact$/i.test(label)
    ) {
      continue;
    }
    if (links.some((l) => l.label.toLowerCase() === label.toLowerCase())) continue;
    links.push({ href, label });
    if (links.length >= 6) break;
  }
  if (links.length < 2) {
    return [
      { href: "#", label: "Home" },
      { href: "#about", label: "About" },
      { href: "#services", label: "Services" },
      { href: "#gallery", label: "Gallery" },
      { href: "#contact", label: "Contact" },
    ];
  }
  return links;
}

/* ─── Header (20) ─── */

type HLayout =
  | "row"
  | "stack"
  | "split"
  | "pill"
  | "minimal"
  | "dual"
  | "rail"
  | "band";

type HeaderTheme = {
  id: string;
  label: string;
  layout: HLayout;
  bg: string;
  fg: string;
  accent: string;
  cta: string;
  ctaBg: string;
  ctaFg: string;
  ctaRadius: string;
  ctaBorder?: string;
  brandWeight: string;
  brandTrack?: string;
  upperNav?: boolean;
  markBg: string;
  markFg: string;
  markRadius: string;
};

const HEADER_THEMES: HeaderTheme[] = [
  { id: "h01-cream", label: "cream editorial", layout: "row", bg: "#f7f1e8", fg: "#1c1917", accent: "#c2410c", cta: "Book a viewing", ctaBg: "#c2410c", ctaFg: "#fff", ctaRadius: "999px", brandWeight: "700", markBg: "#c2410c", markFg: "#fff7ed", markRadius: "8px" },
  { id: "h02-center", label: "centered stack", layout: "stack", bg: "#fffaf5", fg: "#1c1917", accent: "#9a3412", cta: "Start consult", ctaBg: "#9a3412", ctaFg: "#fff7ed", ctaRadius: "4px", brandWeight: "700", markBg: "#9a3412", markFg: "#fff7ed", markRadius: "4px" },
  { id: "h03-navy", label: "navy modern", layout: "row", bg: "#0f172a", fg: "#f8fafc", accent: "#38bdf8", cta: "Talk to us", ctaBg: "#38bdf8", ctaFg: "#0f172a", ctaRadius: "4px", brandWeight: "800", brandTrack: ".12em", upperNav: true, markBg: "#38bdf8", markFg: "#0f172a", markRadius: "4px" },
  { id: "h04-pill", label: "pill rail", layout: "pill", bg: "#f8fafc", fg: "#0f172a", accent: "#4f46e5", cta: "Book now", ctaBg: "#4f46e5", ctaFg: "#fff", ctaRadius: "999px", brandWeight: "800", markBg: "#4f46e5", markFg: "#fff", markRadius: "999px" },
  { id: "h05-gold", label: "charcoal gold", layout: "row", bg: "#111111", fg: "#f5f5f4", accent: "#c9a227", cta: "Enquire", ctaBg: "transparent", ctaFg: "#c9a227", ctaRadius: "0", ctaBorder: "1px solid #c9a227", brandWeight: "600", brandTrack: ".04em", upperNav: true, markBg: "#c9a227", markFg: "#111", markRadius: "0" },
  { id: "h06-split", label: "split ink", layout: "split", bg: "#ffffff", fg: "#0f172a", accent: "#020617", cta: "Connect", ctaBg: "#0f172a", ctaFg: "#fff", ctaRadius: "6px", brandWeight: "800", brandTrack: ".1em", upperNav: true, markBg: "#f8fafc", markFg: "#020617", markRadius: "6px" },
  { id: "h07-line", label: "minimal line", layout: "minimal", bg: "#ffffff", fg: "#171717", accent: "#171717", cta: "Contact", ctaBg: "transparent", ctaFg: "#171717", ctaRadius: "0", brandWeight: "600", brandTrack: ".18em", upperNav: true, markBg: "#171717", markFg: "#fff", markRadius: "0" },
  { id: "h08-forest", label: "forest rail", layout: "rail", bg: "#f3f6f1", fg: "#14532d", accent: "#166534", cta: "Plan visit", ctaBg: "#166534", ctaFg: "#ecfdf5", ctaRadius: "999px", brandWeight: "700", markBg: "#166534", markFg: "#ecfdf5", markRadius: "8px" },
  { id: "h09-coral", label: "coral soft", layout: "row", bg: "#fff7ed", fg: "#7c2d12", accent: "#ea580c", cta: "Schedule", ctaBg: "#ea580c", ctaFg: "#fff", ctaRadius: "999px", brandWeight: "800", markBg: "#ea580c", markFg: "#fff", markRadius: "10px" },
  { id: "h10-slate", label: "slate compact", layout: "row", bg: "#1e293b", fg: "#f8fafc", accent: "#94a3b8", cta: "Get in touch", ctaBg: "#f8fafc", ctaFg: "#0f172a", ctaRadius: "6px", brandWeight: "700", upperNav: true, markBg: "#64748b", markFg: "#fff", markRadius: "6px" },
  { id: "h11-serif", label: "serif rule", layout: "band", bg: "#fafaf9", fg: "#1c1917", accent: "#44403c", cta: "View homes", ctaBg: "#1c1917", ctaFg: "#fafaf9", ctaRadius: "2px", brandWeight: "600", markBg: "#1c1917", markFg: "#fafaf9", markRadius: "2px" },
  { id: "h12-outline", label: "ink outline", layout: "row", bg: "#ffffff", fg: "#0a0a0a", accent: "#0a0a0a", cta: "Enquire", ctaBg: "transparent", ctaFg: "#0a0a0a", ctaRadius: "0", ctaBorder: "2px solid #0a0a0a", brandWeight: "800", upperNav: true, markBg: "#0a0a0a", markFg: "#fff", markRadius: "0" },
  { id: "h13-sky", label: "sky soft", layout: "pill", bg: "#e0f2fe", fg: "#0c4a6e", accent: "#0284c7", cta: "Talk now", ctaBg: "#0284c7", ctaFg: "#fff", ctaRadius: "999px", brandWeight: "700", markBg: "#0284c7", markFg: "#fff", markRadius: "999px" },
  { id: "h14-dual", label: "dual tone", layout: "dual", bg: "#ffffff", fg: "#111827", accent: "#b91c1c", cta: "Book visit", ctaBg: "#b91c1c", ctaFg: "#fff", ctaRadius: "8px", brandWeight: "800", markBg: "#b91c1c", markFg: "#fff", markRadius: "8px" },
  { id: "h15-mega", label: "mega space", layout: "row", bg: "#ffffff", fg: "#111827", accent: "#4b5563", cta: "Discover", ctaBg: "#111827", ctaFg: "#fff", ctaRadius: "999px", brandWeight: "500", brandTrack: ".08em", markBg: "#111827", markFg: "#fff", markRadius: "12px" },
  { id: "h16-rose", label: "rose luxury", layout: "row", bg: "#4c0519", fg: "#ffe4e6", accent: "#fb7185", cta: "Private tour", ctaBg: "#fb7185", ctaFg: "#4c0519", ctaRadius: "4px", brandWeight: "600", brandTrack: ".06em", upperNav: true, markBg: "#fb7185", markFg: "#4c0519", markRadius: "4px" },
  { id: "h17-brutal", label: "mono brutal", layout: "minimal", bg: "#000000", fg: "#ffffff", accent: "#ffffff", cta: "GO", ctaBg: "#ffffff", ctaFg: "#000", ctaRadius: "0", brandWeight: "900", brandTrack: ".2em", upperNav: true, markBg: "#fff", markFg: "#000", markRadius: "0" },
  { id: "h18-sand", label: "sand bar", layout: "band", bg: "#faf6f1", fg: "#5c4a3a", accent: "#a68a6d", cta: "Meet us", ctaBg: "#5c4a3a", ctaFg: "#faf6f1", ctaRadius: "999px", brandWeight: "700", markBg: "#a68a6d", markFg: "#fff", markRadius: "999px" },
  { id: "h19-glass", label: "glass dark", layout: "row", bg: "#0b1220", fg: "#e2e8f0", accent: "#67e8f9", cta: "Explore", ctaBg: "rgba(103,232,249,.15)", ctaFg: "#67e8f9", ctaRadius: "10px", ctaBorder: "1px solid #67e8f9", brandWeight: "700", markBg: "#67e8f9", markFg: "#0b1220", markRadius: "10px" },
  { id: "h20-plum", label: "plum night", layout: "stack", bg: "#2e1065", fg: "#f5f3ff", accent: "#c4b5fd", cta: "Request call", ctaBg: "#c4b5fd", ctaFg: "#2e1065", ctaRadius: "8px", brandWeight: "700", markBg: "#c4b5fd", markFg: "#2e1065", markRadius: "8px" },
];

function buildHeaderBlock(
  t: HeaderTheme,
  p: {
    brand: string;
    mark: string;
    navDesktop: string;
    navMobile: string;
    ctaHref: string;
  },
): string {
  const ctaStyle = `display:inline-flex;padding:10px 18px;border-radius:${t.ctaRadius};background:${t.ctaBg};color:${t.ctaFg};text-decoration:none;font:700 12px/1 system-ui,sans-serif;${t.ctaBorder ? `border:${t.ctaBorder};` : "border:0;"}${t.id === "h07-line" ? "text-decoration:underline;text-underline-offset:4px;padding:0;background:transparent;" : ""}`;
  const brandStyle = `font:${t.brandWeight} ${t.layout === "stack" ? "20" : "15"}px/1.1 Georgia,system-ui,sans-serif;letter-spacing:${t.brandTrack || "0"};${t.upperNav ? "text-transform:uppercase;" : ""}white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
  const navStyle = `display:flex;align-items:center;gap:18px;font:${t.upperNav ? "600 11px/1" : "500 13px/1"} system-ui,sans-serif;${t.upperNav ? "letter-spacing:.1em;text-transform:uppercase;" : ""}`;
  const menuBtn = `<button type="button" data-cai-menu-btn="1" aria-label="Menu" style="display:none;width:40px;height:40px;border:1px solid ${t.accent};background:transparent;color:inherit;border-radius:${t.markRadius};cursor:pointer">☰</button>`;
  const cta = `<a href="${esc(p.ctaHref)}" style="${ctaStyle}">${esc(t.cta)}</a>`;
  const panel = `<nav data-cai-mobile-panel="1" hidden style="display:none;background:${t.bg};color:${t.fg};padding:8px 16px 16px">${p.navMobile}</nav>`;

  if (t.layout === "stack") {
    return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:flex;flex-direction:column;align-items:stretch;padding:0;background:${t.bg};color:${t.fg};border-bottom:3px solid ${t.accent}">
<div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 24px 8px;position:relative">${p.mark}<div style="${brandStyle}">${esc(p.brand)}</div>${menuBtn.replace("display:none", "display:none;position:absolute;right:16px;top:50%;transform:translateY(-50%)")}</div>
<div style="display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;padding:8px 24px 16px"><nav style="${navStyle}">${p.navDesktop}</nav>${cta}</div></header>${panel}`;
  }
  if (t.layout === "split") {
    return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:flex;align-items:stretch;padding:0;background:${t.bg};color:${t.fg};border-bottom:1px solid #e2e8f0;overflow:hidden">
<div style="display:flex;align-items:center;gap:10px;padding:14px 20px;background:#020617;color:#f8fafc;min-width:0">${p.mark}<div style="${brandStyle};color:#f8fafc">${esc(p.brand)}</div></div>
<div style="display:flex;align-items:center;justify-content:flex-end;gap:16px;padding:14px 20px;flex:1;min-width:0"><nav style="${navStyle}">${p.navDesktop}</nav>${cta}${menuBtn}</div></header>${panel}`;
  }
  if (t.layout === "pill") {
    return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 22px;background:${t.bg};color:${t.fg}">
<div style="display:flex;align-items:center;gap:10px;min-width:0;flex-shrink:0">${p.mark}<div style="${brandStyle}">${esc(p.brand)}</div></div>
<nav style="${navStyle};padding:6px 10px;border-radius:999px;background:rgba(15,23,42,.08)">${p.navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">${cta}${menuBtn}</div></header>${panel}`;
  }
  if (t.layout === "minimal") {
    return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 28px;background:${t.bg};color:${t.fg};border-bottom:1px solid ${t.fg}">
<div style="display:flex;align-items:center;gap:10px;min-width:0">${p.mark}<div style="${brandStyle}">${esc(p.brand)}</div></div>
<nav style="${navStyle}">${p.navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">${cta}${menuBtn}</div></header>${panel}`;
  }
  if (t.layout === "rail") {
    return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 24px 16px 20px;background:${t.bg};color:${t.fg};border-left:6px solid ${t.accent}">
<div style="display:flex;align-items:center;gap:12px;min-width:0">${p.mark}<div style="${brandStyle}">${esc(p.brand)}</div></div>
<nav style="${navStyle}">${p.navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">${cta}${menuBtn}</div></header>${panel}`;
  }
  if (t.layout === "dual") {
    return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:0;background:${t.bg};color:${t.fg};border-bottom:1px solid #e5e7eb">
<div style="display:flex;align-items:center;gap:12px;padding:16px 24px;background:#111827;color:#f9fafb">${p.mark}<div style="${brandStyle};color:#f9fafb">${esc(p.brand)}</div></div>
<div style="display:flex;align-items:center;justify-content:flex-end;gap:16px;padding:16px 24px"><nav style="${navStyle}">${p.navDesktop}</nav>${cta}${menuBtn}</div></header>${panel}`;
  }
  if (t.layout === "band") {
    return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:flex;flex-direction:column;padding:0;background:${t.bg};color:${t.fg}">
<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 28px 12px">
<div style="display:flex;align-items:center;gap:12px;min-width:0">${p.mark}<div style="${brandStyle}">${esc(p.brand)}</div></div>
<div style="display:flex;align-items:center;gap:10px">${cta}${menuBtn}</div></div>
<div style="border-top:1px solid ${t.accent};padding:10px 28px"><nav style="${navStyle};justify-content:flex-start">${p.navDesktop}</nav></div></header>${panel}`;
  }
  // row (+ mega padding for h15)
  const pad = t.id === "h15-mega" ? "28px 36px" : "16px 24px";
  return `<header data-create-ai-hdr="1" data-cai-hdr-style="${t.id}" style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:${pad};background:${t.bg};color:${t.fg}">
<div style="display:flex;align-items:center;gap:12px;min-width:0;flex:0 1 auto">${p.mark}<div style="${brandStyle}">${esc(p.brand)}</div></div>
<nav style="${navStyle};flex:1 1 auto;justify-content:center">${p.navDesktop}</nav>
<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">${cta}${menuBtn}</div></header>${panel}`;
}

export function applyHeaderLibraryVariant(
  html: string,
  brandName: string,
  logoSrc?: string,
): { html: string; variantLabel: string; variantId: string } {
  if (!html) return { html, variantLabel: "", variantId: "" };
  let out = html;
  const prev = out.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  const brand = (brandName || "Brand").trim() || "Brand";
  const prevId =
    prev.match(/data-cai-hdr-style=["']([^"']+)["']/i)?.[1]?.trim() || "";
  const theme = pickNext(HEADER_THEMES, prevId);

  const initials =
    brand
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AM";
  const mark = logoSrc
    ? `<img src="${logoSrc.replace(/"/g, "&quot;")}" alt="${esc(brand)}" data-create-ai-logo="1" style="height:36px;width:auto;max-width:140px;object-fit:contain;display:block;border-radius:${theme.markRadius}" />`
    : `<span data-create-ai-brand="1" data-cai-brand="1" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:${theme.markRadius};background:${theme.markBg};color:${theme.markFg};font:800 12px/1 system-ui,sans-serif">${esc(initials)}</span>`;

  const links = extractLinks(prev);
  const ctaHref =
    links.find((l) => /contact/i.test(l.label) || /contact/i.test(l.href))
      ?.href || "#contact";
  const navLinks = links.filter(
    (l) =>
      !/book|schedule|enquire|connect|talk|plan visit|get in touch|discover|explore|private|request|meet|view homes|go\b/i.test(
        l.label,
      ),
  );
  const navDesktop = navLinks
    .map(
      (l) =>
        `<a href="${esc(l.href)}" style="color:inherit;text-decoration:none;white-space:nowrap;padding:0 4px">${esc(l.label)}</a>`,
    )
    .join("");
  const navMobile = navLinks
    .map(
      (l) =>
        `<a href="${esc(l.href)}" style="display:block;padding:12px 4px;color:inherit;text-decoration:none;border-bottom:1px solid rgba(127,127,127,.2)">${esc(l.label)}</a>`,
    )
    .join("");

  const block = buildHeaderBlock(theme, {
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

  return {
    html: out,
    variantLabel: theme.label,
    variantId: theme.id,
  };
}

export const CAI_HEADER_VARIANT_COUNT = HEADER_THEMES.length;

/* ─── Banner / Hero (20) ─── */

type HeroLayout =
  | "left"
  | "center"
  | "bottom"
  | "right"
  | "split"
  | "eyebrow"
  | "dualCta"
  | "band"
  | "tall"
  | "compact";

type HeroTheme = {
  id: string;
  label: string;
  layout: HeroLayout;
  overlay: string;
  align: string;
  minH: string;
  titleSize: string;
  ctaBg: string;
  ctaFg: string;
  ctaRadius: string;
  secondCta?: boolean;
};

const HERO_THEMES: HeroTheme[] = [
  { id: "b01-left", label: "left overlay", layout: "left", overlay: "linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.25))", align: "flex-start", minH: "78vh", titleSize: "clamp(2.2rem,5vw,3.6rem)", ctaBg: "#fff", ctaFg: "#111", ctaRadius: "999px" },
  { id: "b02-center", label: "center stage", layout: "center", overlay: "linear-gradient(180deg,rgba(15,23,42,.55),rgba(15,23,42,.75))", align: "center", minH: "82vh", titleSize: "clamp(2.4rem,6vw,4rem)", ctaBg: "#38bdf8", ctaFg: "#0f172a", ctaRadius: "4px" },
  { id: "b03-bottom", label: "bottom left", layout: "bottom", overlay: "linear-gradient(0deg,rgba(0,0,0,.8),transparent 55%)", align: "flex-start", minH: "75vh", titleSize: "clamp(2rem,4.5vw,3.2rem)", ctaBg: "#c2410c", ctaFg: "#fff", ctaRadius: "8px" },
  { id: "b04-right", label: "right stack", layout: "right", overlay: "linear-gradient(270deg,rgba(0,0,0,.7),rgba(0,0,0,.15))", align: "flex-end", minH: "78vh", titleSize: "clamp(2.1rem,5vw,3.4rem)", ctaBg: "#fff", ctaFg: "#111", ctaRadius: "0" },
  { id: "b05-split", label: "split panel", layout: "split", overlay: "rgba(15,23,42,.92)", align: "flex-start", minH: "70vh", titleSize: "clamp(2rem,4vw,3rem)", ctaBg: "#c9a227", ctaFg: "#111", ctaRadius: "4px" },
  { id: "b06-eyebrow", label: "eyebrow hero", layout: "eyebrow", overlay: "linear-gradient(120deg,rgba(76,5,25,.75),rgba(0,0,0,.45))", align: "flex-start", minH: "76vh", titleSize: "clamp(2.3rem,5vw,3.8rem)", ctaBg: "#fb7185", ctaFg: "#4c0519", ctaRadius: "999px" },
  { id: "b07-dual", label: "dual CTA", layout: "dualCta", overlay: "linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,.7))", align: "center", minH: "80vh", titleSize: "clamp(2.2rem,5vw,3.5rem)", ctaBg: "#fff", ctaFg: "#111", ctaRadius: "999px", secondCta: true },
  { id: "b08-band", label: "content band", layout: "band", overlay: "rgba(0,0,0,.35)", align: "flex-start", minH: "68vh", titleSize: "clamp(1.9rem,4vw,2.8rem)", ctaBg: "#166534", ctaFg: "#ecfdf5", ctaRadius: "999px" },
  { id: "b09-tall", label: "tall cinematic", layout: "tall", overlay: "linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.75))", align: "center", minH: "92vh", titleSize: "clamp(2.6rem,6vw,4.2rem)", ctaBg: "transparent", ctaFg: "#fff", ctaRadius: "0" },
  { id: "b10-compact", label: "compact strip", layout: "compact", overlay: "linear-gradient(90deg,#0f172a,#1e293b)", align: "flex-start", minH: "52vh", titleSize: "clamp(1.8rem,3.5vw,2.6rem)", ctaBg: "#38bdf8", ctaFg: "#0f172a", ctaRadius: "6px" },
  { id: "b11-ink", label: "ink wash", layout: "left", overlay: "linear-gradient(90deg,#000 0%,rgba(0,0,0,.4) 70%)", align: "flex-start", minH: "78vh", titleSize: "clamp(2.2rem,5vw,3.5rem)", ctaBg: "#fff", ctaFg: "#000", ctaRadius: "0" },
  { id: "b12-warm", label: "warm glow", layout: "center", overlay: "linear-gradient(180deg,rgba(194,65,12,.45),rgba(0,0,0,.65))", align: "center", minH: "80vh", titleSize: "clamp(2.3rem,5vw,3.7rem)", ctaBg: "#fff7ed", ctaFg: "#9a3412", ctaRadius: "999px" },
  { id: "b13-forest", label: "forest veil", layout: "left", overlay: "linear-gradient(90deg,rgba(20,83,45,.85),rgba(20,83,45,.2))", align: "flex-start", minH: "76vh", titleSize: "clamp(2.1rem,4.5vw,3.3rem)", ctaBg: "#ecfdf5", ctaFg: "#14532d", ctaRadius: "8px" },
  { id: "b14-sky", label: "sky fade", layout: "bottom", overlay: "linear-gradient(0deg,rgba(3,105,161,.9),transparent 60%)", align: "flex-start", minH: "74vh", titleSize: "clamp(2rem,4.5vw,3.2rem)", ctaBg: "#fff", ctaFg: "#0c4a6e", ctaRadius: "999px" },
  { id: "b15-split-light", label: "light split", layout: "split", overlay: "#f8fafc", align: "flex-start", minH: "68vh", titleSize: "clamp(2rem,4vw,3rem)", ctaBg: "#4f46e5", ctaFg: "#fff", ctaRadius: "999px" },
  { id: "b16-editorial", label: "editorial type", layout: "eyebrow", overlay: "linear-gradient(105deg,rgba(28,25,23,.88),rgba(28,25,23,.35))", align: "flex-start", minH: "78vh", titleSize: "clamp(2.4rem,5.5vw,3.9rem)", ctaBg: "#c2410c", ctaFg: "#fff", ctaRadius: "2px" },
  { id: "b17-brutal", label: "brutal block", layout: "dualCta", overlay: "rgba(0,0,0,.7)", align: "flex-start", minH: "72vh", titleSize: "clamp(2.5rem,6vw,4rem)", ctaBg: "#fff", ctaFg: "#000", ctaRadius: "0", secondCta: true },
  { id: "b18-soft", label: "soft mist", layout: "center", overlay: "linear-gradient(180deg,rgba(255,255,255,.15),rgba(15,23,42,.7))", align: "center", minH: "78vh", titleSize: "clamp(2.2rem,5vw,3.5rem)", ctaBg: "#e2e8f0", ctaFg: "#0f172a", ctaRadius: "12px" },
  { id: "b19-narrow", label: "narrow column", layout: "left", overlay: "linear-gradient(90deg,rgba(2,6,23,.85),transparent)", align: "flex-start", minH: "76vh", titleSize: "clamp(2rem,4vw,3rem)", ctaBg: "#67e8f9", ctaFg: "#0b1220", ctaRadius: "10px" },
  { id: "b20-plaza", label: "plaza band", layout: "band", overlay: "rgba(17,24,39,.45)", align: "center", minH: "70vh", titleSize: "clamp(2rem,4.5vw,3.2rem)", ctaBg: "#111827", ctaFg: "#fff", ctaRadius: "8px" },
];

function findHeroSection(html: string): { full: string; open: string; inner: string } | null {
  const re =
    /(<section\b[^>]*(?:id=["']home["']|id=["']hero["']|class=["'][^"']*\bhero\b[^"']*["']|data-create-ai-hero-banner=["']1["'])[^>]*>)([\s\S]*?)(<\/section>)/i;
  const m = html.match(re);
  if (!m) return null;
  return { full: m[0], open: m[1], inner: m[2] };
}

function extractHeroBits(inner: string) {
  const title =
    stripTags(inner.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "") ||
    stripTags(inner.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "") ||
    "Curated real estate experiences.";
  const paras = [...inner.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((x) => stripTags(x[1]))
    .filter((t) => t.length > 20 && t.length < 220);
  const sub =
    paras[0] ||
    "Personalized guidance for discerning buyers and sellers.";
  const ctaLabel =
    stripTags(
      inner.match(
        /<a\b[^>]*(?:button|cta|btn)[^>]*>([\s\S]*?)<\/a>|<a\b[^>]*style=["'][^"']*padding[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
      )?.[1] ||
        inner.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1] ||
        "",
    ) || "Start a conversation";
  const ctaHref =
    inner.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1] || "#contact";
  const bg =
    inner.match(
      /url\(["']?(https?:\/\/[^"')]+|data:image[^"')]+)["']?\)/i,
    )?.[1] ||
    inner.match(/<img\b[^>]*src=["']([^"']+)["']/i)?.[1] ||
    "";
  return { title, sub, ctaLabel, ctaHref, bg };
}

function buildHeroBlock(
  t: HeroTheme,
  bits: {
    title: string;
    sub: string;
    ctaLabel: string;
    ctaHref: string;
    bg: string;
  },
): string {
  const bgLayer = bits.bg
    ? `<div data-create-ai-hero-image="1" style="position:absolute;inset:0;z-index:0;background:#0f172a url('${bits.bg.replace(/'/g, "%27")}') center/cover no-repeat"></div>`
    : `<div data-create-ai-hero-image="1" style="position:absolute;inset:0;z-index:0;background:#0f172a"></div>`;
  const overlay = `<div style="position:absolute;inset:0;z-index:1;background:${t.overlay};pointer-events:none"></div>`;
  const ctaBorder =
    t.ctaBg === "transparent" ? "border-bottom:2px solid #fff;border-radius:0;padding:6px 0" : "";
  const cta = `<a href="${esc(bits.ctaHref)}" style="display:inline-flex;padding:12px 22px;border-radius:${t.ctaRadius};background:${t.ctaBg};color:${t.ctaFg};text-decoration:none;font:700 13px/1 system-ui,sans-serif;${ctaBorder}">${esc(bits.ctaLabel)}</a>`;
  const cta2 = t.secondCta
    ? `<a href="#about" style="display:inline-flex;padding:12px 22px;border-radius:${t.ctaRadius};background:transparent;color:#fff;border:1px solid rgba(255,255,255,.7);text-decoration:none;font:600 13px/1 system-ui,sans-serif">Learn more</a>`
    : "";
  const titleColor =
    t.id === "b15-split-light" ? "#0f172a" : "#fff";
  const subColor =
    t.id === "b15-split-light" ? "#334155" : "rgba(255,255,255,.9)";
  const eyebrow = `<div style="font:700 11px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;opacity:.85;margin:0 0 12px;color:${titleColor}">Featured</div>`;
  const title = `<h1 style="margin:0 0 14px;font-size:${t.titleSize};line-height:1.08;font-weight:700;color:${titleColor};max-width:18ch">${esc(bits.title)}</h1>`;
  const sub = `<p style="margin:0 0 22px;font-size:clamp(1rem,2vw,1.15rem);line-height:1.55;color:${subColor};max-width:42ch">${esc(bits.sub)}</p>`;
  const ctas = `<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">${cta}${cta2}</div>`;

  let content = "";
  let sectionStyle = `position:relative;min-height:${t.minH};display:flex;align-items:center;justify-content:${t.align};padding:72px 24px;overflow:hidden;color:#fff`;

  if (t.layout === "split") {
    const textBg = t.id === "b15-split-light" ? "#f8fafc" : "rgba(15,23,42,.92)";
    return `<section id="home" data-create-ai-hero-banner="1" data-cai-banner-style="${t.id}" style="position:relative;min-height:${t.minH};display:grid;grid-template-columns:minmax(280px,1fr) minmax(280px,1.1fr);overflow:hidden;color:#fff">
<div style="position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;padding:56px 40px;background:${textBg};color:${titleColor}">${t.layout === "eyebrow" || t.id.includes("eyebrow") || t.id === "b16-editorial" ? eyebrow : ""}${title}${sub}${ctas}</div>
<div style="position:relative;min-height:320px">${bgLayer}<div style="position:absolute;inset:0;background:rgba(0,0,0,.15)"></div></div>
</section>`;
  }
  if (t.layout === "band") {
    content = `<div style="position:relative;z-index:2;width:min(920px,100%);margin:${t.align === "center" ? "0 auto" : "0"};padding:28px 32px;background:rgba(15,23,42,.82);border-radius:12px;backdrop-filter:blur(6px)">${title}${sub}${ctas}</div>`;
  } else if (t.layout === "bottom") {
    sectionStyle = `position:relative;min-height:${t.minH};display:flex;align-items:flex-end;justify-content:flex-start;padding:48px 28px 56px;overflow:hidden;color:#fff`;
    content = `<div style="position:relative;z-index:2;max-width:640px">${title}${sub}${ctas}</div>`;
  } else if (t.layout === "eyebrow" || t.layout === "dualCta" || t.layout === "tall" || t.layout === "compact" || t.layout === "left" || t.layout === "center" || t.layout === "right") {
    const maxW = t.layout === "center" ? "720px" : "640px";
    const textAlign = t.layout === "center" ? "center" : "left";
    content = `<div style="position:relative;z-index:2;max-width:${maxW};text-align:${textAlign};margin:${t.layout === "center" ? "0 auto" : "0"}">${t.layout === "eyebrow" ? eyebrow : ""}${title}${sub}${ctas}</div>`;
  }

  return `<section id="home" data-create-ai-hero-banner="1" data-cai-banner-style="${t.id}" style="${sectionStyle}">${bgLayer}${overlay}${content}</section>`;
}

export function applyBannerLibraryVariant(
  html: string,
): { html: string; variantLabel: string; variantId: string } {
  if (!html) return { html, variantLabel: "", variantId: "" };
  const found = findHeroSection(html);
  const prevId =
    (found?.open || found?.full || html).match(
      /data-cai-banner-style=["']([^"']+)["']/i,
    )?.[1] || "";
  const theme = pickNext(HERO_THEMES, prevId);
  const bits = extractHeroBits(found?.inner || "");
  const block = buildHeroBlock(theme, bits);

  let out = html;
  if (found) {
    out = out.replace(found.full, block);
  } else if (/<\/header>/i.test(out)) {
    out = out.replace(/<\/header>/i, `</header>\n${block}`);
  } else if (/<body\b[^>]*>/i.test(out)) {
    out = out.replace(/<body\b[^>]*>/i, (o) => `${o}\n${block}`);
  } else {
    out = block + out;
  }
  // Drop competing hero CSS that forces one layout
  out = out.replace(
    /<style\b[^>]*data-create-ai-hero-image=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  return { html: out, variantLabel: theme.label, variantId: theme.id };
}

export const CAI_BANNER_VARIANT_COUNT = HERO_THEMES.length;

/* ─── Top bar (10) ─── */

type TopBarTheme = {
  id: string;
  label: string;
  bg: string;
  fg: string;
  pad: string;
  upper?: boolean;
  border?: string;
  center?: boolean;
};

const TOPBAR_THEMES: TopBarTheme[] = [
  { id: "t01-navy", label: "navy slim", bg: "#0f172a", fg: "#e2e8f0", pad: "6px 20px" },
  { id: "t02-ink", label: "ink bar", bg: "#111111", fg: "#f5f5f4", pad: "8px 22px", upper: true },
  { id: "t03-cream", label: "cream utility", bg: "#f7f1e8", fg: "#44403c", pad: "7px 20px", border: "1px solid #e7e0d5" },
  { id: "t04-accent", label: "coral accent", bg: "#c2410c", fg: "#fff7ed", pad: "7px 20px" },
  { id: "t05-center", label: "centered", bg: "#1e293b", fg: "#cbd5e1", pad: "8px 16px", center: true },
  { id: "t06-line", label: "hairline", bg: "#ffffff", fg: "#334155", pad: "8px 24px", border: "0 0 1px 0 solid #e2e8f0" },
  { id: "t07-forest", label: "forest tip", bg: "#14532d", fg: "#dcfce7", pad: "6px 20px" },
  { id: "t08-gold", label: "gold rim", bg: "#0a0a0a", fg: "#e7e5e4", pad: "7px 20px", border: "0 0 2px 0 solid #c9a227" },
  { id: "t09-sky", label: "sky soft", bg: "#e0f2fe", fg: "#0c4a6e", pad: "7px 20px" },
  { id: "t10-plum", label: "plum night", bg: "#2e1065", fg: "#ede9fe", pad: "7px 20px", upper: true },
];

export function applyTopBarLibraryVariant(
  html: string,
  contact?: { email?: string; mobile?: string; address?: string },
): { html: string; variantLabel: string; variantId: string } {
  if (!html) return { html, variantLabel: "", variantId: "" };
  let out = html;
  const prev =
    out.match(
      /<(?:div|aside)\b[^>]*data-create-ai-topbar=["']1["'][^>]*>/i,
    )?.[0] || "";
  const prevId =
    prev.match(/data-cai-topbar-style=["']([^"']+)["']/i)?.[1] || "";
  const t = pickNext(TOPBAR_THEMES, prevId);

  out = out.replace(
    /<(div|aside)\b[^>]*data-create-ai-topbar=["']1["'][^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );

  const left: string[] = [];
  if (contact?.mobile?.trim()) {
    const m = contact.mobile.trim();
    left.push(
      `<a href="tel:${m.replace(/\s+/g, "")}" style="color:inherit;text-decoration:none">${esc(m)}</a>`,
    );
  }
  if (contact?.email?.trim()) {
    const e = contact.email.trim();
    left.push(
      `<a href="mailto:${esc(e)}" style="color:inherit;text-decoration:none">${esc(e)}</a>`,
    );
  }
  const addr = contact?.address?.trim()
    ? `<span>${esc(contact.address.trim().slice(0, 80))}</span>`
    : "";
  if (!left.length && !addr) left.push("<span>Welcome</span>");

  const borderCss = t.border
    ? t.border.includes("solid") && !t.border.startsWith("1px")
      ? `border-style:solid;border-width:${t.border.split(" solid")[0]};border-color:${t.border.split("solid ")[1] || "#e2e8f0"};`
      : `border:${t.border};`
    : "";
  const justify = t.center ? "center" : "space-between";
  const upper = t.upper ? "text-transform:uppercase;letter-spacing:.08em;" : "";
  const bar = `<div data-create-ai-topbar="1" data-cai-topbar-style="${t.id}" role="note" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:${justify};gap:10px 16px;padding:${t.pad};font-size:12px;${upper}background:${t.bg};color:${t.fg};${borderCss}"><span style="display:inline-flex;flex-wrap:wrap;gap:8px 12px;align-items:center">${left.join('<span aria-hidden="true" style="opacity:.45">·</span>')}</span>${addr}</div>`;

  if (/<header\b/i.test(out)) {
    out = out.replace(/<header\b/i, `${bar}\n<header`);
  } else if (/<body\b[^>]*>/i.test(out)) {
    out = out.replace(/<body\b[^>]*>/i, (o) => `${o}\n${bar}`);
  } else {
    out = bar + out;
  }
  return { html: out, variantLabel: t.label, variantId: t.id };
}

export const CAI_TOPBAR_VARIANT_COUNT = TOPBAR_THEMES.length;

/* ─── Footer (10) — full chrome, not just copyright strip ─── */

type FooterLayout = "cols3" | "cols4" | "stack" | "split" | "minimal" | "mega" | "band";

type FooterTheme = {
  id: string;
  label: string;
  layout: FooterLayout;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  copyBg?: string;
};

const FOOTER_THEMES: FooterTheme[] = [
  { id: "f01-cols3", label: "three columns", layout: "cols3", bg: "#0f172a", fg: "#f8fafc", muted: "#94a3b8", accent: "#38bdf8" },
  { id: "f02-cols4", label: "four columns", layout: "cols4", bg: "#111827", fg: "#f9fafb", muted: "#9ca3af", accent: "#c9a227" },
  { id: "f03-stack", label: "centered stack", layout: "stack", bg: "#fafaf9", fg: "#1c1917", muted: "#78716c", accent: "#c2410c" },
  { id: "f04-split", label: "brand split", layout: "split", bg: "#020617", fg: "#e2e8f0", muted: "#64748b", accent: "#67e8f9" },
  { id: "f05-minimal", label: "minimal line", layout: "minimal", bg: "#ffffff", fg: "#171717", muted: "#737373", accent: "#171717" },
  { id: "f06-mega", label: "mega dark", layout: "mega", bg: "#0a0a0a", fg: "#f5f5f4", muted: "#a3a3a3", accent: "#c9a227" },
  { id: "f07-cream", label: "cream editorial", layout: "cols3", bg: "#f7f1e8", fg: "#1c1917", muted: "#78716c", accent: "#9a3412" },
  { id: "f08-forest", label: "forest grid", layout: "cols3", bg: "#14532d", fg: "#ecfdf5", muted: "#86efac", accent: "#bbf7d0" },
  { id: "f09-band", label: "cta band", layout: "band", bg: "#1e293b", fg: "#f8fafc", muted: "#94a3b8", accent: "#f97316", copyBg: "#0f172a" },
  { id: "f10-plum", label: "plum night", layout: "split", bg: "#2e1065", fg: "#f5f3ff", muted: "#c4b5fd", accent: "#a78bfa" },
];

function extractFooterContact(
  html: string,
  contact?: { email?: string; mobile?: string; address?: string },
) {
  const email =
    contact?.email?.trim() ||
    html.match(/mailto:([^"'>\s]+)/i)?.[1] ||
    "";
  const mobile =
    contact?.mobile?.trim() ||
    html.match(/tel:([^"'>\s]+)/i)?.[1] ||
    "";
  const address = contact?.address?.trim() || "";
  return { email, mobile, address };
}

function buildFooterBlock(
  t: FooterTheme,
  p: {
    brand: string;
    year: number;
    email: string;
    mobile: string;
    address: string;
    links: { href: string; label: string }[];
  },
): string {
  const linkStyle = `color:${t.muted};text-decoration:none;font:500 13px/1.6 system-ui,sans-serif`;
  const nav = (p.links.length ? p.links : [
    { href: "#", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#services", label: "Services" },
    { href: "#contact", label: "Contact" },
  ])
    .slice(0, 6)
    .map(
      (l) =>
        `<a href="${esc(l.href)}" style="${linkStyle}">${esc(l.label)}</a>`,
    )
    .join("");
  const contactBits = [
    p.mobile
      ? `<a href="tel:${esc(p.mobile.replace(/\s+/g, ""))}" style="${linkStyle}">${esc(p.mobile)}</a>`
      : "",
    p.email
      ? `<a href="mailto:${esc(p.email)}" style="${linkStyle}">${esc(p.email)}</a>`
      : "",
    p.address
      ? `<span style="color:${t.muted};font:500 13px/1.5 system-ui,sans-serif">${esc(p.address.slice(0, 90))}</span>`
      : "",
  ]
    .filter(Boolean)
    .join("");
  const copy = `<div data-create-ai-copyright="1" data-cai-copy-style="footer-inline" style="margin-top:28px;padding-top:16px;border-top:1px solid rgba(127,127,127,.25);font:500 12px/1.4 system-ui,sans-serif;color:${t.muted}">© ${p.year} ${esc(p.brand)}. All rights reserved.</div>`;
  const brandBlock = `<div style="font:700 18px/1.2 Georgia,system-ui,sans-serif;color:${t.fg};margin:0 0 10px">${esc(p.brand)}</div><p style="margin:0;max-width:280px;color:${t.muted};font:400 13px/1.5 system-ui,sans-serif">Trusted guidance for buyers and sellers.</p>`;

  let inner = "";
  if (t.layout === "cols3" || t.layout === "cols4") {
    const cols = t.layout === "cols4" ? 4 : 3;
    inner = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:28px;max-width:1100px;margin:0 auto">
<div>${brandBlock}</div>
<div><div style="font:700 12px/1 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:${t.fg};margin:0 0 12px">Explore</div><div style="display:flex;flex-direction:column;gap:6px">${nav}</div></div>
<div><div style="font:700 12px/1 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:${t.fg};margin:0 0 12px">Contact</div><div style="display:flex;flex-direction:column;gap:8px">${contactBits || `<span style="color:${t.muted}">Get in touch</span>`}</div></div>
${cols === 4 ? `<div><div style="font:700 12px/1 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:${t.fg};margin:0 0 12px">Visit</div><p style="margin:0;color:${t.muted};font:400 13px/1.5 system-ui,sans-serif">Book a private viewing today.</p><a href="#contact" style="display:inline-flex;margin-top:12px;padding:10px 16px;border-radius:6px;background:${t.accent};color:#0f172a;text-decoration:none;font:700 12px/1 system-ui,sans-serif">Enquire</a></div>` : ""}
</div>${copy}`;
  } else if (t.layout === "stack") {
    inner = `<div style="max-width:640px;margin:0 auto;text-align:center">
${brandBlock}
<nav style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px 20px;margin:22px 0">${nav}</nav>
<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px 18px">${contactBits}</div>
${copy}
</div>`;
  } else if (t.layout === "split") {
    inner = `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:28px;max-width:1100px;margin:0 auto;align-items:flex-start">
<div style="flex:1 1 240px">${brandBlock}<div style="margin-top:16px;display:flex;flex-direction:column;gap:6px">${contactBits}</div></div>
<nav style="display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center">${nav}</nav>
</div>${copy}`;
  } else if (t.layout === "minimal") {
    inner = `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:center;max-width:1100px;margin:0 auto;border-top:1px solid ${t.accent};padding-top:20px">
<div style="font:600 14px/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase">${esc(p.brand)}</div>
<nav style="display:flex;flex-wrap:wrap;gap:16px">${nav}</nav>
<div style="font:500 12px/1 system-ui,sans-serif;color:${t.muted}">© ${p.year}</div>
</div>`;
  } else if (t.layout === "mega") {
    inner = `<div style="max-width:1100px;margin:0 auto">
<div style="font:700 28px/1.1 Georgia,serif;color:${t.fg};margin:0 0 8px">${esc(p.brand)}</div>
<p style="margin:0 0 28px;color:${t.muted};max-width:420px">Exclusive properties. Personal service.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:24px">
<div><div style="color:${t.accent};font:700 11px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:0 0 10px">Menu</div><div style="display:flex;flex-direction:column;gap:6px">${nav}</div></div>
<div><div style="color:${t.accent};font:700 11px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:0 0 10px">Contact</div><div style="display:flex;flex-direction:column;gap:8px">${contactBits}</div></div>
</div>${copy}
</div>`;
  } else {
    // band
    inner = `<div style="max-width:1100px;margin:0 auto">
<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:20px;align-items:center;padding:8px 0 28px;border-bottom:1px solid rgba(255,255,255,.12)">
<div><div style="font:700 20px/1.2 system-ui,sans-serif;color:${t.fg}">Ready to talk?</div><p style="margin:6px 0 0;color:${t.muted};font:400 14px/1.4 system-ui,sans-serif">Tell us what you’re looking for.</p></div>
<a href="#contact" style="display:inline-flex;padding:12px 20px;border-radius:999px;background:${t.accent};color:#fff;text-decoration:none;font:700 13px/1 system-ui,sans-serif">Contact us</a>
</div>
<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;padding-top:22px;align-items:center">
<div style="font:700 14px/1 system-ui,sans-serif">${esc(p.brand)}</div>
<nav style="display:flex;flex-wrap:wrap;gap:14px">${nav}</nav>
</div>
<div style="margin-top:22px;padding:14px 0 0;border-top:1px solid rgba(127,127,127,.25);font:500 12px/1.4 system-ui,sans-serif;color:${t.muted};background:${t.copyBg || "transparent"}">© ${p.year} ${esc(p.brand)}. All rights reserved.</div>
</div>`;
  }

  return `<footer data-create-ai-footer="1" data-cai-footer-style="${t.id}" style="background:${t.bg};color:${t.fg};padding:48px 24px 28px">${inner}</footer>`;
}

/**
 * Instant "footer new" — rotate full footer layouts (keeps brand + contact + nav).
 */
export function applyFooterLibraryVariant(
  html: string,
  brandName: string,
  contact?: { email?: string; mobile?: string; address?: string },
): { html: string; variantLabel: string; variantId: string } {
  if (!html) return { html, variantLabel: "", variantId: "" };
  const brand = (brandName || "Brand").trim() || "Brand";
  const year = new Date().getFullYear();
  const prevId =
    html.match(/data-cai-footer-style=["']([^"']+)["']/i)?.[1] ||
    html.match(/<footer\b[^>]*data-cai-footer-style=["']([^"']+)["']/i)?.[1] ||
    "";
  const t = pickNext(FOOTER_THEMES, prevId);
  const { email, mobile, address } = extractFooterContact(html, contact);

  const hdr = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  const links = extractLinks(hdr);

  const block = buildFooterBlock(t, {
    brand,
    year,
    email,
    mobile,
    address,
    links,
  });

  let out = html;
  // Drop orphan copyright strips outside footer (footer embeds its own)
  out = out.replace(
    /<(div|p|section)\b[^>]*data-create-ai-copyright=["']1["'][^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  if (/<footer\b/i.test(out)) {
    out = out.replace(/<footer\b[\s\S]*?<\/footer>/i, block);
  } else if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${block}</body>`);
  } else {
    out += block;
  }
  return { html: out, variantLabel: t.label, variantId: t.id };
}

export const CAI_FOOTER_VARIANT_COUNT = FOOTER_THEMES.length;

/* ─── Copyright (10) ─── */

type CopyTheme = {
  id: string;
  label: string;
  bg: string;
  fg: string;
  pad: string;
  align: string;
  upper?: boolean;
  borderTop?: string;
};

const COPY_THEMES: CopyTheme[] = [
  { id: "c01-center", label: "center quiet", bg: "#0f172a", fg: "#94a3b8", pad: "18px 24px", align: "center" },
  { id: "c02-split", label: "brand split", bg: "#111827", fg: "#d1d5db", pad: "20px 28px", align: "space-between" },
  { id: "c03-light", label: "light thin", bg: "#f8fafc", fg: "#64748b", pad: "16px 24px", align: "center", borderTop: "1px solid #e2e8f0" },
  { id: "c04-ink", label: "ink bar", bg: "#000", fg: "#a3a3a3", pad: "14px 24px", align: "center", upper: true },
  { id: "c05-cream", label: "cream foot", bg: "#f7f1e8", fg: "#57534e", pad: "18px 24px", align: "center", borderTop: "1px solid #e7e0d5" },
  { id: "c06-accent", label: "coral tip", bg: "#1c1917", fg: "#fecaca", pad: "16px 24px", align: "center", borderTop: "3px solid #c2410c" },
  { id: "c07-forest", label: "forest foot", bg: "#14532d", fg: "#bbf7d0", pad: "16px 24px", align: "center" },
  { id: "c08-gold", label: "gold rim", bg: "#0a0a0a", fg: "#e7e5e4", pad: "18px 24px", align: "space-between", borderTop: "2px solid #c9a227" },
  { id: "c09-stack", label: "stacked", bg: "#1e293b", fg: "#cbd5e1", pad: "22px 24px", align: "center" },
  { id: "c10-plum", label: "plum quiet", bg: "#2e1065", fg: "#ddd6fe", pad: "16px 24px", align: "center", upper: true },
];

export function applyCopyrightLibraryVariant(
  html: string,
  brandName: string,
): { html: string; variantLabel: string; variantId: string } {
  if (!html) return { html, variantLabel: "", variantId: "" };
  const year = new Date().getFullYear();
  const brand = (brandName || "Brand").trim() || "Brand";
  const prevId =
    html.match(/data-cai-copy-style=["']([^"']+)["']/i)?.[1] || "";
  const t = pickNext(COPY_THEMES, prevId);
  const upper = t.upper ? "text-transform:uppercase;letter-spacing:.1em;" : "";
  const border = t.borderTop ? `border-top:${t.borderTop};` : "";
  const left = `<span>© ${year} ${esc(brand)}</span>`;
  const right = `<span>All rights reserved</span>`;
  const inner =
    t.id === "c09-stack"
      ? `<div style="display:flex;flex-direction:column;gap:6px;align-items:center">${left}${right}</div>`
      : t.align === "space-between"
        ? `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;width:100%;max-width:1100px;margin:0 auto">${left}${right}</div>`
        : `<div>${left} · ${right}</div>`;

  const block = `<div data-create-ai-copyright="1" data-cai-copy-style="${t.id}" style="display:flex;justify-content:center;${upper}padding:${t.pad};background:${t.bg};color:${t.fg};font:500 12px/1.4 system-ui,sans-serif;${border}">${inner}</div>`;

  let out = html.replace(
    /<(div|p|section)\b[^>]*data-create-ai-copyright=["']1["'][^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  // Prefer inside footer; else before </body>
  if (/<footer\b/i.test(out)) {
    out = out.replace(
      /(<footer\b[^>]*>)([\s\S]*?)(<\/footer>)/i,
      (_m, open: string, mid: string, close: string) => {
        const cleaned = mid.replace(
          /©\s*20\d{2}[\s\S]{0,80}?rights\s*reserved/gi,
          "",
        );
        return `${open}${cleaned}\n${block}${close}`;
      },
    );
  } else if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${block}</body>`);
  } else {
    out += block;
  }
  return { html: out, variantLabel: t.label, variantId: t.id };
}

export const CAI_COPYRIGHT_VARIANT_COUNT = COPY_THEMES.length;

/* ─── Back to top (8) ─── */

type BttTheme = {
  id: string;
  label: string;
  bg: string;
  fg: string;
  radius: string;
  size: string;
  labelText?: string;
  right?: string;
  bottom?: string;
};

const BTT_THEMES: BttTheme[] = [
  { id: "bt01-circle", label: "navy circle", bg: "#0f172a", fg: "#fff", radius: "999px", size: "46px" },
  { id: "bt02-square", label: "ink square", bg: "#111", fg: "#fff", radius: "4px", size: "44px" },
  { id: "bt03-coral", label: "coral pill", bg: "#c2410c", fg: "#fff", radius: "999px", size: "48px" },
  { id: "bt04-gold", label: "gold outline", bg: "transparent", fg: "#c9a227", radius: "0", size: "44px" },
  { id: "bt05-text", label: "text chip", bg: "#1e293b", fg: "#e2e8f0", radius: "8px", size: "auto", labelText: "TOP" },
  { id: "bt06-forest", label: "forest round", bg: "#166534", fg: "#ecfdf5", radius: "999px", size: "46px" },
  { id: "bt07-sky", label: "sky soft", bg: "#0284c7", fg: "#fff", radius: "12px", size: "46px" },
  { id: "bt08-plum", label: "plum float", bg: "#6d28d9", fg: "#fff", radius: "999px", size: "48px", right: "22px", bottom: "22px" },
];

export function applyBackToTopLibraryVariant(
  html: string,
): { html: string; variantLabel: string; variantId: string } {
  if (!html) return { html, variantLabel: "", variantId: "" };
  const prevId =
    html.match(/data-cai-btt-style=["']([^"']+)["']/i)?.[1] || "";
  const t = pickNext(BTT_THEMES, prevId);
  let out = html
    .replace(/<style[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<button[^>]*id=["']create-ai-btt["'][^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<script[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/script>/gi, "");

  const border =
    t.id === "bt04-gold" ? "border:2px solid #c9a227;" : "border:0;";
  const wh =
    t.size === "auto"
      ? "width:auto;height:auto;padding:10px 14px;font-size:11px;letter-spacing:.12em;"
      : `width:${t.size};height:${t.size};font-size:20px;line-height:${t.size};`;
  const css = `<style data-create-ai-btt="1">#create-ai-btt{position:fixed;right:${t.right || "18px"};bottom:${t.bottom || "16px"};z-index:2147483001;${wh}border-radius:${t.radius};background:${t.bg};color:${t.fg};${border}cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.28);opacity:.92}#create-ai-btt:hover{opacity:1}</style>`;
  const btn = `<button type="button" id="create-ai-btt" data-cai-btt-style="${t.id}" aria-label="Back to top" title="Back to top">${t.labelText || "↑"}</button>`;
  const script = `<script data-create-ai-btt="1">(function(){var b=document.getElementById("create-ai-btt");if(!b)return;b.addEventListener("click",function(){try{window.scrollTo({top:0,behavior:"smooth"});}catch(e){window.scrollTo(0,0);}});})();<\/script>`;
  const block = `${css}${btn}${script}`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${block}</body>`);
  else out += block;
  return { html: out, variantLabel: t.label, variantId: t.id };
}

export const CAI_BTT_VARIANT_COUNT = BTT_THEMES.length;
