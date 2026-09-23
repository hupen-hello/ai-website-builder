import { NextResponse } from "next/server";
import {
  generateAiFromImages,
  generateAiText,
  hasAnyAiKey,
  primaryAiProviderLabel,
} from "@/lib/aiProvider";
import { captureReferenceSectionShots } from "@/lib/reference-screenshots";
import { resolveRedesignImages } from "@/lib/redesign-images";
import {
  buildPremiumAgencyHomepage,
  scoreHomepageQuality,
} from "@/lib/premium-agency-homepage";
import type {
  BuiltSiteSectionItem,
  BuiltSiteSectionPlan,
  BuiltSiteSectionsHtml,
  BuiltSiteTheme,
} from "@/lib/built-site-theme";
import {
  normalizeSectionPlanOrder,
  plansAlreadyInOrder,
  wireSinglePageSections,
} from "@/lib/redesign-single-page";
import {
  buildTailwindLayoutClone,
  sanitizeThemeDomainOnly,
  stripReferenceLeaksFromHtml,
  transformReferencePlanForLegalSafety,
} from "@/lib/tailwind-layout-clone";
import { cloneReferenceWithDomainSwap } from "@/lib/reference-clone-swap";

export const runtime = "nodejs";
export const maxDuration = 600;
export const dynamic = "force-dynamic";

type GenerateBody = {
  theme?: BuiltSiteTheme;
  vision?: string;
  /** NDJSON stream of partial Claude sections for live build preview. */
  stream?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function defaultPlan(theme: BuiltSiteTheme): BuiltSiteSectionPlan[] {
  if (Array.isArray(theme.sectionPlan) && theme.sectionPlan.length) {
    return theme.sectionPlan.slice(0, 15).map((item) => ({
      id: item.id,
      label: item.label,
      hint: item.hint,
      uiBlueprint: item.uiBlueprint || "",
      layout: item.layout || "content-section",
    }));
  }
  return [
    {
      id: "header",
      label: "Header",
      hint: "Navigation and brand",
      uiBlueprint: "",
      layout: "top-navigation-bar",
    },
    {
      id: "banner",
      label: "Banner",
      hint: "Hero / main offer",
      uiBlueprint: "",
      layout: "full-bleed-hero",
    },
    {
      id: "features",
      label: "Features",
      hint: "Services or highlights",
      uiBlueprint: "",
      layout: "multi-card-grid",
    },
    {
      id: "footer",
      label: "Footer",
      hint: "Footer links and copyright",
      uiBlueprint: "",
      layout: "site-footer",
    },
  ];
}

function fallbackItem(
  theme: BuiltSiteTheme,
  plan: BuiltSiteSectionPlan,
  vision = "",
): BuiltSiteSectionItem {
  const primary = escapeHtml(theme.primaryColor || "#f39200");
  const accent = escapeHtml(theme.accentColor || "#00d2ff");
  const font = escapeHtml(theme.fontFamily || "Georgia, 'Times New Roman', serif");
  const brand = escapeHtml(theme.brandName || "Your Brand");
  const headline = escapeHtml(
    theme.headline || theme.brandName || "Creating Website For Everyone",
  );
  const tagline = escapeHtml(
    theme.tagline ||
      theme.headings?.[0] ||
      "Custom & Affordable Website Designing Services",
  );
  const description = escapeHtml(
    theme.description ||
      theme.paragraphs?.[0] ||
      vision ||
      "Trusted website design and development for growing businesses.",
  );
  const nav = (theme.navItems || ["Home", "Services", "About", "Contact"])
    .slice(0, 10)
    .map(
      (item) =>
        `<a href="#" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px;opacity:.92">${escapeHtml(item)}</a>`,
    )
    .join("");
  const ctaPrimary = escapeHtml(theme.ctaButtons?.[0] || "Our Services");
  const ctaSecondary = escapeHtml(theme.ctaButtons?.[1] || "Talk To Experts");

  if (plan.id === "footer" || /footer/i.test(plan.label)) {
    return {
      id: plan.id,
      label: plan.label === "TopFold" ? "Footer" : plan.label,
      html: `<footer style="padding:28px 32px;background:#070b16;color:#fff;font-family:system-ui,sans-serif"><strong>${brand}</strong><p style="margin:8px 0 0;opacity:.8;max-width:36rem">${description}</p></footer>`,
    };
  }

  // Never render internal labels like "TopFold" as page copy.
  const isHeaderOnly =
    plan.id === "header" ||
    (/header|nav|top.?bar/i.test(plan.label) && !/hero|banner|topfold/i.test(plan.label));
  const isHero =
    /topfold|hero|banner|section 1/i.test(plan.label) ||
    /top-fold|hero|banner/i.test(plan.id);

  if (isHeaderOnly) {
    const logoImg = (theme.logoImage || "").trim();
    const brandMark = logoImg
      ? `<img src="${escapeHtml(logoImg)}" alt="${brand}" style="height:36px;width:auto;max-width:160px;object-fit:contain" />`
      : `<strong style="font-size:.95rem;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${brand}</strong>`;
    return {
      id: "header",
      label: "Header",
      html: `<header style="position:sticky;top:0;z-index:40;background:#070b16;color:#fff;font-family:system-ui,sans-serif;border-bottom:1px solid rgba(255,255,255,.1)">
  <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:8px 20px;background:rgba(0,0,0,.55);font-size:12px;border-bottom:1px solid rgba(255,255,255,.08)">
    <span style="opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${brand} worldwide</span>
    <span style="color:${accent};flex-shrink:0">Talk to sales</span>
  </div>
  <div style="display:flex;flex-wrap:nowrap;align-items:center;gap:12px;padding:12px 20px;max-width:1120px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:10px;min-width:0;max-width:220px;flex-shrink:0">${brandMark}</div>
    <nav style="display:flex;flex-wrap:nowrap;gap:14px;overflow-x:auto;min-width:0;flex:1;justify-content:flex-end;scrollbar-width:none">${nav}</nav>
    <a href="#" style="background:${accent};color:#04101a;padding:8px 14px;border-radius:999px;font-weight:700;text-decoration:none;font-size:12px;flex-shrink:0;white-space:nowrap;margin-left:auto">Contact Us</a>
  </div>
</header>`,
    };
  }

  if (isHero) {
    return {
      id: plan.id === "header" ? "hero" : plan.id,
      label: "Hero",
      html: `<section style="position:relative;overflow:hidden;background:radial-gradient(1200px 600px at 70% 20%,rgba(0,210,255,.18),transparent 55%),linear-gradient(160deg,#020617 0%,#0b1220 45%,#111827 100%);color:#fff;font-family:system-ui,sans-serif">
  <div style="padding:56px 28px 64px;max-width:920px">
    <p style="margin:0 0 12px;color:${primary};font-weight:700;letter-spacing:.14em;font-size:12px;text-transform:uppercase">${tagline}</p>
    <h1 style="margin:0;font-family:${font};font-size:clamp(2.4rem,5vw,3.6rem);line-height:1.12;font-weight:700">${headline}</h1>
    <p style="margin:18px 0 0;max-width:40rem;line-height:1.7;color:rgba(255,255,255,.86);font-size:1.05rem">${description}</p>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:28px">
      <a href="#" style="background:${primary};color:#fff;padding:14px 22px;border-radius:10px;font-weight:700;text-decoration:none">${ctaPrimary}</a>
      <a href="#" style="border:1px solid ${primary};color:#fff;padding:14px 22px;border-radius:10px;font-weight:700;text-decoration:none">${ctaSecondary}</a>
    </div>
  </div>
</section>`,
    };
  }

  const title = escapeHtml(
    theme.features?.[0]?.title ||
      theme.headings?.find((h) => h.length > 8) ||
      theme.sectionsTitle ||
      "What we offer",
  );
  const body = escapeHtml(
    theme.features?.[0]?.description ||
      theme.paragraphs?.[1] ||
      theme.description ||
      vision ||
      "",
  );

  return {
    id: plan.id,
    label: /section\s*\d+/i.test(plan.label) ? "Services" : plan.label,
    html: `<section style="padding:56px 28px;background:#0b1220;color:#fff;font-family:system-ui,sans-serif">
  <h2 style="margin:0 0 14px;font-size:2rem;font-family:${font}">${title}</h2>
  <p style="margin:0;max-width:42rem;line-height:1.75;color:rgba(255,255,255,.82)">${body}</p>
</section>`,
  };
}

function cleanJsonObject(raw: string) {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as {
      html?: string;
      sections?: Array<{ id?: string; label?: string; html?: string }>;
    };
  } catch {
    return null;
  }
}

/** Parse Claude/OpenAI homepage output: prefer XML+CDATA, then JSON, then loose html fields. */
function parseAiHomepageSections(raw: string): BuiltSiteSectionItem[] {
  const text = (raw || "").trim();
  if (!text) return [];

  const fromXml: BuiltSiteSectionItem[] = [];
  const xmlRe =
    /<section\b([^>]*)>(?:\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*|([\s\S]*?))<\/section>/gi;
  let match: RegExpExecArray | null;
  while ((match = xmlRe.exec(text)) && fromXml.length < 15) {
    const attrs = match[1] || "";
    const html = (match[2] || match[3] || "").trim();
    if (html.length < 80) continue;
    const id =
      attrs.match(/\bid=["']([^"']+)["']/i)?.[1] ||
      `section-${fromXml.length + 1}`;
    const label =
      attrs.match(/\blabel=["']([^"']+)["']/i)?.[1] ||
      id;
    if (/>\s*TopFold\s*</i.test(html)) continue;
    fromXml.push({
      id,
      label: /topfold/i.test(label) ? "Hero" : label,
      html,
    });
  }
  if (fromXml.length >= 3) return fromXml;

  const fromJson = toItemsFromParsed(cleanJsonObject(text));
  if (fromJson.length >= 3) return fromJson;

  const loose: BuiltSiteSectionItem[] = [];
  let searchFrom = 0;
  while (loose.length < 15) {
    const htmlKey = text.indexOf('"html"', searchFrom);
    if (htmlKey < 0) break;
    const colon = text.indexOf(":", htmlKey);
    let q1 = -1;
    for (let i = colon + 1; i < text.length; i += 1) {
      if (text[i] === '"') {
        q1 = i;
        break;
      }
      if (text[i] !== " " && text[i] !== "\n" && text[i] !== "\r" && text[i] !== "\t") break;
    }
    if (q1 < 0) {
      searchFrom = htmlKey + 5;
      continue;
    }
    let i = q1 + 1;
    let html = "";
    let ok = false;
    while (i < text.length) {
      const c = text[i];
      if (c === "\\" && i + 1 < text.length) {
        const n = text[i + 1];
        if (n === "n") html += "\n";
        else if (n === "t") html += "\t";
        else if (n === "r") html += "\r";
        else if (n === '"') html += '"';
        else if (n === "\\") html += "\\";
        else if (n === "u" && i + 5 < text.length) {
          const hex = text.slice(i + 2, i + 6);
          html += String.fromCharCode(parseInt(hex, 16) || 32);
          i += 6;
          continue;
        } else html += n;
        i += 2;
        continue;
      }
      if (c === '"') {
        ok = true;
        break;
      }
      html += c;
      i += 1;
    }
    const window = text.slice(Math.max(0, htmlKey - 900), htmlKey);
    const idMatches = [...window.matchAll(/"id"\s*:\s*"([^"]+)"/g)];
    const labelMatches = [...window.matchAll(/"label"\s*:\s*"([^"]*)"/g)];
    const id = idMatches[idMatches.length - 1]?.[1];
    const label = labelMatches[labelMatches.length - 1]?.[1] || id;
    if (ok && id && html.trim().length >= 80 && !/>\s*TopFold\s*</i.test(html)) {
      loose.push({
        id,
        label: label && !/topfold/i.test(label) ? label : id === "hero" ? "Hero" : id,
        html: html.trim(),
      });
    }
    searchFrom = i + 1;
  }
  if (loose.length) return loose.slice(0, 15);
  return fromJson.length ? fromJson : fromXml;
}

function toItemsFromParsed(
  raw: {
    html?: string;
    sections?: Array<{ id?: string; label?: string; html?: string }>;
  } | null,
): BuiltSiteSectionItem[] {
  const out: BuiltSiteSectionItem[] = [];
  for (const row of raw?.sections || []) {
    if (!row || typeof row.id !== "string" || typeof row.html !== "string") continue;
    const html = row.html.trim();
    if (html.length < 80) continue;
    if (/>\s*TopFold\s*</i.test(html)) continue;
    out.push({
      id: row.id,
      label:
        typeof row.label === "string" && row.label.trim() && !/topfold/i.test(row.label)
          ? row.label.trim()
          : row.id === "hero" || /hero/i.test(row.id)
            ? "Hero"
            : row.id,
      html,
    });
  }
  return out.slice(0, 15);
}

function toSectionsHtml(items: BuiltSiteSectionItem[]): BuiltSiteSectionsHtml {
  return {
    items,
    header: items.find((item) => item.id === "header" || /header/i.test(item.label))?.html,
    banner: items.find(
      (item) => /banner|hero/i.test(item.id) || /banner|hero/i.test(item.label),
    )?.html,
    features: items.find(
      (item) => /feature|service/i.test(item.id) || /feature|service/i.test(item.label),
    )?.html,
    footer: items.find((item) => item.id === "footer" || /footer/i.test(item.label))?.html,
  };
}

function domainDataPayload(
  theme: BuiltSiteTheme,
  vision: string,
  imageUrls: string[] = [],
) {
  // Keep payload small — big JSON burns input tokens every AI call.
  const categories = (
    theme.categories?.length ? theme.categories : theme.navItems || []
  ).slice(0, 10);
  return {
    brandName: theme.brandName,
    headline: theme.headline,
    tagline: theme.tagline,
    description: (theme.description || "").slice(0, 220),
    features: theme.features?.slice(0, 4),
    categories,
    navItems: categories.length ? categories : (theme.navItems || []).slice(0, 10),
    ctaButtons: (theme.ctaButtons || []).slice(0, 2),
    headings: theme.headings?.slice(0, 6),
    paragraphs: theme.paragraphs?.slice(0, 4),
    vision: (vision || "").slice(0, 100),
    imageUrls: imageUrls.slice(0, 6),
    logoImage: theme.logoImage || "",
    contactPhone: theme.contactPhone || "",
    contactEmail: theme.contactEmail || "",
    contactAddress: (theme.contactAddress || "").slice(0, 120),
  };
}

function scoreItemToPlan(item: BuiltSiteSectionItem, planLabel: string): number {
  const a = `${item.id} ${item.label}`.toLowerCase();
  const b = planLabel.toLowerCase();
  if (!b) return 0;
  let score = 0;
  if (a.includes(b) || b.includes(a)) score = 8;
  else {
    const aWords = a.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    const bWords = b.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    for (const w of bWords) if (aWords.includes(w)) score += 1;
  }
  const html = (item.html || "").slice(0, 2400).toLowerCase();
  if (/hero|banner|slider|top-fold|topfold/.test(b)) {
    if (/hero-slide|hero-slider|swiper|carousel|building tomorrow/.test(html)) score += 6;
    if (/<h1\b/.test(html) && /min-h-\[(?:60|70|80|90|100)vh\]|min-h-screen/.test(html)) score += 4;
  }
  if (/footer/.test(b)) {
    if (/<footer\b/.test(html)) score += 8;
  }
  if (/header|nav/.test(b) && !/hero|banner/.test(b)) {
    if (/<header\b/.test(html) && /<nav\b/.test(html)) score += 5;
  }
  return score;
}

/** Keep every reference plan section; reuse AI HTML when labels match. */
function alignItemsToReferencePlan(
  plan: BuiltSiteSectionPlan[],
  items: BuiltSiteSectionItem[],
  theme: BuiltSiteTheme,
): BuiltSiteSectionItem[] {
  if (!plan.length) {
    return wireSinglePageSections(items.slice(0, 15), plan, theme.categories || theme.navItems, {
      brandName: theme.brandName,
      description: theme.description,
      logoImage: theme.logoImage,
      contentImages: theme.contentImages,
      preserveHeroSlider: Boolean(theme.referenceMotion?.hasHeroSlider),
      contactPhone: theme.contactPhone,
      contactEmail: theme.contactEmail,
      contactAddress: theme.contactAddress,
      referenceSiteName: theme.referenceSiteName,
      referenceUrl: theme.referenceUrl,
    });
  }

  const categories = theme.categories?.length ? theme.categories : theme.navItems || [];

  // Preserve Claude order when it already follows the reference plan (avoid fuzzy reshuffle).
  if (plansAlreadyInOrder(plan, items)) {
    const ordered = plan.slice(0, 15).map((planItem, i) => {
      const item = items[i];
      const id =
        (planItem.id || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40) || `section-${i + 1}`;
      return {
        ...item,
        id,
        label: (planItem.label || item.label || "").trim() || item.label,
      };
    });
    return wireSinglePageSections(ordered, plan, categories, {
      brandName: theme.brandName,
      description: theme.description,
      logoImage: theme.logoImage,
      contentImages: theme.contentImages,
      preserveHeroSlider: Boolean(theme.referenceMotion?.hasHeroSlider),
      contactPhone: theme.contactPhone,
      contactEmail: theme.contactEmail,
      contactAddress: theme.contactAddress,
      referenceSiteName: theme.referenceSiteName,
      referenceUrl: theme.referenceUrl,
    });
  }

  const pool = [...items];
  const out: BuiltSiteSectionItem[] = [];
  const used = new Set<number>();
  const usedFp = new Set<string>();

  for (let i = 0; i < Math.min(plan.length, 15); i += 1) {
    const label = (plan[i].label || "").replace(/\s+/g, " ").trim().slice(0, 72);
    const id =
      (plan[i].id || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || `section-${i + 1}`;
    let bestIdx = -1;
    let bestScore = 0;
    // Prefer same-index Claude section when labels roughly match (keeps hero/banner order).
    if (i < pool.length && !used.has(i)) {
      const seqScore = scoreItemToPlan(pool[i], label || id);
      if (seqScore >= 1) {
        bestIdx = i;
        bestScore = seqScore + 2;
      }
    }
    for (let j = 0; j < pool.length; j += 1) {
      if (used.has(j)) continue;
      const fp = (pool[j].html || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .slice(0, 220);
      if (fp.length > 60 && usedFp.has(fp)) continue;
      const score = scoreItemToPlan(pool[j], label || id);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0 && bestScore >= 1) {
      const fp = (pool[bestIdx].html || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .slice(0, 220);
      if (fp.length > 60 && usedFp.has(fp)) {
        out.push(fallbackItem(theme, plan[i], ""));
        continue;
      }
      used.add(bestIdx);
      if (fp.length > 60) usedFp.add(fp);
      out.push({
        ...pool[bestIdx],
        id,
        label: label || pool[bestIdx].label,
      });
    } else {
      let fallbackIdx = -1;
      let fallbackScore = 0;
      for (let j = 0; j < pool.length; j += 1) {
        if (used.has(j)) continue;
        const fp = (pool[j].html || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
          .slice(0, 220);
        if (fp.length > 60 && usedFp.has(fp)) continue;
        const score = scoreItemToPlan(pool[j], label || id);
        if (score > fallbackScore) {
          fallbackScore = score;
          fallbackIdx = j;
        }
      }
      if (fallbackIdx >= 0 && fallbackScore >= 1) {
        const fp = (pool[fallbackIdx].html || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
          .slice(0, 220);
        used.add(fallbackIdx);
        if (fp.length > 60) usedFp.add(fp);
        out.push({
          ...pool[fallbackIdx],
          id,
          label: label || pool[fallbackIdx].label,
        });
      } else {
        out.push(fallbackItem(theme, plan[i], ""));
      }
    }
  }
  return wireSinglePageSections(out, plan, categories, {
    brandName: theme.brandName,
    description: theme.description,
    logoImage: theme.logoImage,
    contentImages: theme.contentImages,
    preserveHeroSlider: Boolean(theme.referenceMotion?.hasHeroSlider),
    contactPhone: theme.contactPhone,
    contactEmail: theme.contactEmail,
    contactAddress: theme.contactAddress,
    referenceSiteName: theme.referenceSiteName,
    referenceUrl: theme.referenceUrl,
  });
}

const VISION_SYSTEM = `You are a senior product designer rebuilding a website section from a REFERENCE SCREENSHOT at ~80–90% visual fidelity (agency / Shuffle quality).

SOURCE OF TRUTH:
- The SCREENSHOT decides: layout, structure, spacing, dark/light mood, colors, button styles, typography scale, chrome (top bar, nav, hero, logo strip, cards, footer), and whether a slider/ticker/tabs appear.
- DOMAIN DATA JSON decides: every readable word (brand, headline, nav labels, CTAs, body).

CRITICAL:
- Read colors FROM THE IMAGE. Do not invent a cream/beige corporate theme if the screenshot is dark navy/tech.
- NEVER recreate the customer DOMAIN site’s old look — only its words/logo go into the reference structure.
- If the screenshot is a dark hero with motion headlines / logo marquee / creative energy, output that same cinematic section (CSS gradients + overlays + marquee). No stock-photo brochure hero.
- Match structure: lang/utility chrome + main nav + hero copy + dual CTAs + partner/logo strip when visible.
- Put customer text into that structure.
- FORBIDDEN: "Logo 1", placeholders, lorem, empty inputs, Bootstrap "Toggle navigation", sparse white pages, flat blue rectangles pretending to be a hero, copying dated domain banners.
- Logo strip: monogram circles or text marks from domain feature/client titles — never "Logo N".
- INLINE CSS only. Dense, production HTML. Return ONLY JSON: { "html": "..." }`;

function isLowQualityHtml(html: string, label = "") {
  if (!html || html.length < 120) return true;
  if (/logo\s*[1-9]|lorem ipsum|toggle navigation|>\s*TopFold\s*</i.test(html)) {
    return true;
  }
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const textCore = text.replace(/[‹«←›»→\s.|…·•]/g, "");
  // Thin carousel shells: only ‹ › / arrows with almost no copy.
  if (
    (/[‹«←]\s*[›»→]/.test(text) || /data-hero-prev|data-carousel-prev|data-hero-slider/i.test(html)) &&
    textCore.length < 80 &&
    !/<h1\b/i.test(html)
  ) {
    return true;
  }
  // Social icons / tiny assets pretending to be a full-bleed hero.
  if (
    /data-hero-slider|min-h-\[(?:60|70|80|90|100)vh\]/i.test(html) &&
    /sol-cion|facebook|twitter|linkedin|instagram/i.test(html) &&
    !/<h1\b/i.test(html)
  ) {
    return true;
  }
  const isTop = /topfold|top-fold|hero|banner|header/i.test(label);
  if (isTop) {
    if (html.length < 900) return true;
    // Hero/header must have real copy — empty slider shells (even 2kb) are garbage.
    if (/hero|banner|topfold|top-fold/i.test(label)) {
      if (!/<h1\b/i.test(html)) return true;
      if (textCore.length < 100) return true;
    }
    if (!/<h1\b/i.test(html) && html.length < 1400) return true;
  }
  return false;
}

async function buildSectionFromScreenshot(params: {
  theme: BuiltSiteTheme;
  vision: string;
  id: string;
  label: string;
  imageBase64: string;
  mimeType: string;
}): Promise<{ item: BuiltSiteSectionItem; tokens: number; provider: string; error?: string }> {
  const isTop = /topfold|hero|banner/i.test(params.label) || params.id.includes("top-fold");
  const prompt = `HIGH-QUALITY AI REDESIGN — section "${params.label}".
Take as long as needed mentally: match the REFERENCE SCREENSHOT pixel-intent (layout + UI + mood).

CUSTOMER TEXT ONLY (replace all visible copy with this):
${JSON.stringify(domainDataPayload(params.theme, params.vision), null, 2)}

Section id: ${params.id}
Reference URL (UI inspiration / screenshot source): ${params.theme.referenceUrl}
Customer domain (TEXT only): ${params.theme.domainUrl}

${
  isTop
    ? `TOP-OF-SITE REQUIREMENTS:
- Recreate the full first viewport from the screenshot (utility bar + logo/nav/CTA + hero + dual buttons + logo/partners strip if shown).
- Colors and darkness MUST come from the screenshot (Invoidea-like dark tech heroes stay dark — never cream header + flat blue box).
- Serif or display headline if screenshot uses one; orange/cyan accents if screenshot has them.
- Rich CSS background (gradients + faint circuit/grid), not a plain colored rectangle.`
    : `Below-fold section: match the screenshot band's layout (cards, columns, headings). Do not repeat the site header/nav.`
}

Return JSON { "html": "..." } with polished INLINE CSS.`;

  const run = (preferProvider: "xai" | "claude" | "openai" | "gemini") =>
    generateAiFromImages({
      system: VISION_SYSTEM,
      temperature: 0.15,
      maxTokens: isTop ? 8000 : 6500,
      jsonMode: true,
      preferProvider,
      images: [{ mimeType: params.mimeType, base64: params.imageBase64 }],
      prompt,
    });

  let ai = await run("xai");
  let parsed = cleanJsonObject(ai.text);
  let html = typeof parsed?.html === "string" ? parsed.html.trim() : "";
  let tokens = ai.tokensUsed;
  let provider = ai.provider;

  if (!html || isLowQualityHtml(html, params.label)) {
    const retry = await run("claude");
    tokens += retry.tokensUsed;
    const retryParsed = cleanJsonObject(retry.text);
    const retryHtml =
      typeof retryParsed?.html === "string" ? retryParsed.html.trim() : "";
    if (retryHtml && !isLowQualityHtml(retryHtml, params.label)) {
      html = retryHtml;
      provider = retry.provider;
    } else if (retryHtml && (!html || retryHtml.length > html.length)) {
      html = retryHtml;
      provider = retry.provider;
    }
  }

  if ((!html || isLowQualityHtml(html, params.label)) && provider !== "openai") {
    const retry = await run("openai");
    tokens += retry.tokensUsed;
    const retryParsed = cleanJsonObject(retry.text);
    const retryHtml =
      typeof retryParsed?.html === "string" ? retryParsed.html.trim() : "";
    if (
      retryHtml &&
      (!html ||
        (!isLowQualityHtml(retryHtml, params.label) &&
          isLowQualityHtml(html, params.label)))
    ) {
      html = retryHtml;
      provider = retry.provider;
    }
  }

  if (html.length >= 120 && !isLowQualityHtml(html, params.label)) {
    return {
      item: {
        id: params.id,
        label: /topfold/i.test(params.label) ? "Hero" : params.label,
        html,
      },
      tokens,
      provider,
    };
  }

  // Prefer imperfect AI HTML over empty "TopFold" placeholders.
  if (html.length >= 350 && !/>\s*TopFold\s*</i.test(html)) {
    return {
      item: {
        id: params.id,
        label: /topfold/i.test(params.label) ? "Hero" : params.label,
        html,
      },
      tokens,
      provider,
      error: ai.fallbackReason || "Quality gate soft-pass",
    };
  }

  return {
    item: fallbackItem(
      params.theme,
      { id: params.id, label: params.label, hint: themeHint(params.theme, params.vision) },
      params.vision,
    ),
    tokens,
    provider,
    error: ai.fallbackReason || "Vision empty — used styled theme fallback",
  };
}

function themeHint(theme: BuiltSiteTheme, vision: string) {
  return theme.description || theme.paragraphs?.[0] || vision || theme.headline || "";
}

/** Legacy text-only path if screenshots fail. */
async function buildFromTextBlueprints(
  theme: BuiltSiteTheme,
  vision: string,
  plan: BuiltSiteSectionPlan[],
) {
  const ai = await generateAiText({
    temperature: 0.45,
    maxTokens: 7000,
    jsonMode: true,
    messages: [
      {
        role: "system",
        content: `Recreate homepage sections as an AI REDESIGN (Shuffle-style).
Reference UI blueprints = design/layout/UI only.
Domain JSON = text content only.
NEVER recreate the customer domain website look. No image URLs.
Return JSON { "sections": [{ "id", "label", "html" }] }. INLINE CSS only.`,
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            referencePlan: plan.map((item) => ({
              id: item.id,
              label: item.label,
              layout: item.layout,
              uiBlueprint: (item.uiBlueprint || "").slice(0, 1800),
            })),
            customerContent: domainDataPayload(theme, vision),
            referenceTokens: {
              primaryColor: theme.primaryColor,
              accentColor: theme.accentColor,
              backgroundColor: theme.backgroundColor,
              textColor: theme.textColor,
              fontFamily: theme.fontFamily,
              headerStyle: theme.headerStyle,
            },
            referenceMotion: theme.referenceMotion || null,
            referenceUrl: theme.referenceUrl,
            customerDomainContentOnly: theme.domainUrl,
          },
          null,
          2,
        ),
      },
    ],
  });

  const parsed = cleanJsonObject(ai.text);
  const byId = new Map<string, BuiltSiteSectionItem>();
  for (const row of parsed?.sections || []) {
    if (!row || typeof row.id !== "string" || typeof row.html !== "string") continue;
    if (row.html.trim().length < 20) continue;
    byId.set(row.id, {
      id: row.id,
      label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : row.id,
      html: row.html.trim(),
    });
  }

  return {
    items: plan.map((item) => byId.get(item.id) || fallbackItem(theme, item, vision)),
    tokensUsed: ai.tokensUsed,
    provider: ai.provider,
    fallback: !parsed?.sections?.length || Boolean(ai.fallbackReason),
    message: ai.fallbackReason,
  };
}

async function buildCohesiveHomepage(params: {
  theme: BuiltSiteTheme;
  vision: string;
  shots: Array<{
    id: string;
    label: string;
    mimeType: string;
    imageBase64: string;
  }>;
  plan: BuiltSiteSectionPlan[];
  imageUrls?: string[];
  onPartial?: (
    items: BuiltSiteSectionItem[],
    meta: { phase: string; tokens: number; provider: string },
  ) => void;
}): Promise<{
  items: BuiltSiteSectionItem[];
  tokens: number;
  provider: string;
  error?: string;
}> {
  const { theme, vision, shots, plan, imageUrls = [] } = params;
  // Grok-style: multiple section shots so the model can recreate visual density per band.
  const images = shots.slice(0, 6).map((shot) => ({
    mimeType: shot.mimeType,
    base64: shot.imageBase64,
  }));

  const shotIndexHint = shots
    .slice(0, 6)
    .map((shot, i) => `Image ${i + 1} = ${shot.id} | ${shot.label}`)
    .join("; ");

  const blueprints = plan.slice(0, 12).map((item) => {
    return {
      id: item.id,
      label: item.label,
      layout: item.layout,
      hint: (item.hint || "").slice(0, 160),
      uiBlueprint: "",
    };
  });
  const requiredIds = blueprints.map((b) => `${b.id}|${b.label}`).join(", ");
  const needCount = Math.min(Math.max(blueprints.length, 5), 12);

  const motion = theme.referenceMotion;
  const motionRules = [
    motion?.hasHeroSlider ? "Hero: data-hero-slider + 2+ .hero-slide + prev/next." : null,
    motion?.hasTicker ? "Ticker: .ticker-track with DOMAIN headlines only." : null,
    motion?.hasTabs ? "Tabs: data-tab-group hooks if reference has tabs." : null,
    motion?.hasScrollAnimations ? "Light fade/slide-up on cards." : null,
  ]
    .filter(Boolean)
    .join(" ");

  const system = `You are a senior redesign engineer (Grok-quality visual recreation).

MISSION: Recreate the REFERENCE LAYOUT look in OUR Tailwind HTML so the page feels as polished as a handcrafted redesign — NOT a thin template.

HOW (same approach as a strong vision redesign chat):
1) Study each reference screenshot: columns, spacing, card density, hero height, nav pattern, footer columns.
2) Recreate that STRUCTURE in pure Tailwind utilities (same visual weight / rhythm).
3) Fill EVERY word, logo, phone, email, and image from DOMAIN JSON + imageUrls only.
4) Never copy reference HTML/CSS/JS, brand names, logos, photos, contact, WhatsApp, or slogans.

LEGAL HARD RULES:
- Reference = layout inspiration only. Domain = all content/media/contact.
- Section ids/labels MUST match the required list exactly.
- Footer last with DOMAIN contact only (omit fake addresses).
- One mobile hamburger only (data-mobile-menu-toggle + data-mobile-menu).

QUALITY BAR (reject thin output):
- Header: sticky/relative bar, domain logo, 8–10 real nav links matching reference menu count, CTA, mobile menu.
- Hero: min-h-[70vh] or richer, dual CTAs, overlays, domain H1 — not a flat stub.
- Mid sections: dense cards/grids, real paragraphs from domain, imageUrls used liberally.
- Gallery ≠ testimonials. Stories/testimonials are separate if both exist.
- Output EVERY required section id (usually 10–12 bands including header/hero/footer) — do not collapse the plan.
- Each mid section HTML usually 3500–7000+ chars of useful markup (not empty wrappers).
- Theme colors/fonts from DOMAIN theme — no purple/cream AI defaults.
${motionRules ? `Motion: ${motionRules}` : ""}

XML only:
<sections><section id="..." label="..."><![CDATA[html]]></section></sections>`;

  const prompt = `Recreate these sections to MATCH the reference screenshots' visual density (Grok-style), with DOMAIN content only.

SECTIONS (ids/labels exact): ${requiredIds}

DOMAIN (ONLY content): ${JSON.stringify(domainDataPayload(theme, vision, imageUrls))}
THEME: ${theme.primaryColor}/${theme.accentColor} bg=${theme.backgroundColor} font=${theme.fontFamily}
REFERENCE SHOTS (layout mood — ignore readable reference brand/contact text in images): ${shotIndexHint || "none"}
PLAN:
${blueprints
  .map((b) => `- ${b.id}|${b.label}|${b.layout || "auto"} :: ${(b.hint || "").slice(0, 140)}`)
  .join("\n")}

Output dense Tailwind HTML for every section. Match screenshot structure closely. Domain words + imageUrls only. No reference leaks.`;

  const run = (
    preferProvider: "xai" | "claude" | "openai" | "gemini",
    strictProvider = false,
  ) =>
    generateAiFromImages({
      system,
      prompt,
      images,
      temperature: 0.35,
      // Higher budget = denser Grok-like sections (still one pass).
      maxTokens:
        preferProvider === "xai" || preferProvider === "claude" ? 18000 : 14000,
      jsonMode: false,
      preferProvider,
      strictProvider,
    });

  // 1) xAI first, Claude second (non-strict so auto-fallback works).
  let ai = await run("xai", false);
  let tokens = ai.tokensUsed;
  let provider = ai.provider;
  let lastError = ai.fallbackReason;
  console.log("[cohesive] vision", {
    ok: Boolean(ai.text),
    tokens: ai.tokensUsed,
    error: ai.fallbackReason,
    model: ai.model,
    shots: images.length,
    mode: "grok-visual",
  });

  let items = parseAiHomepageSections(ai.text || "");
  console.log("[cohesive] vision-parse", {
    rawLen: ai.text?.length || 0,
    items: items.length,
  });

  if (items.length >= 1) {
    params.onPartial?.(items, { phase: "vision", tokens, provider });
  }

  const isTopFoldItem = (item: BuiltSiteSectionItem) =>
    /topfold|top-fold|hero|banner|header|topbar/i.test(`${item.id} ${item.label}`) ||
    /<header\b/i.test(item.html || "");

  const thinSection = (item: BuiltSiteSectionItem) => {
    const html = item.html || "";
    const minLen = isTopFoldItem(item) ? 1200 : 500;
    if (/hero|banner|topfold/i.test(`${item.id} ${item.label}`) && !/<h1\b/i.test(html)) {
      return true;
    }
    return isLowQualityHtml(html, item.label) || html.length < minLen;
  };

  const coverageOk = () => {
    // Soft gate: header + hero present, most slots dense — avoid 2–3 full retries.
    if (items.length < Math.min(needCount, 4)) return false;
    const dense = items.filter((item) => !thinSection(item));
    const hasHeader = dense.some(
      (item) =>
        scoreItemToPlan(item, "header nav") >= 2 || /<header\b/i.test(item.html || ""),
    );
    const hasHero = dense.some(
      (item) =>
        scoreItemToPlan(item, "hero banner topfold") >= 2 ||
        /<h1\b/i.test(item.html || ""),
    );
    if (!hasHeader || !hasHero) return false;
    return dense.length >= Math.max(4, Math.ceil(needCount * 0.65));
  };

  const mergeToPlan = (pool: BuiltSiteSectionItem[]) => {
    const merged: BuiltSiteSectionItem[] = [];
    const used = new Set<string>();
    for (const b of blueprints) {
      let best: BuiltSiteSectionItem | null = null;
      let bestScore = -1;
      for (const cand of pool) {
        const key = `${cand.id}|${(cand.html || "").slice(0, 80)}`;
        if (used.has(key)) continue;
        const s =
          scoreItemToPlan(cand, `${b.label} ${b.id}`) * 10 +
          Math.min(40, Math.floor((cand.html || "").length / 200));
        if (s > bestScore) {
          bestScore = s;
          best = cand;
        }
      }
      if (best && bestScore >= 10) {
        used.add(`${best.id}|${(best.html || "").slice(0, 80)}`);
        merged.push({ ...best, id: b.id, label: b.label });
      } else {
        merged.push({ id: b.id, label: b.label, html: "" });
      }
    }
    return merged;
  };

  // One gap-fill only (no full-page text retry) — big time/token save.
  if (!coverageOk()) {
    const missing = blueprints
      .filter((b) => {
        const hit = items.find(
          (item) => scoreItemToPlan(item, `${b.label} ${b.id}`) >= 2 && !thinSection(item),
        );
        return !hit;
      })
      .slice(0, 4);
    if (missing.length) {
      const gap = await generateAiText({
        temperature: 0.28,
        maxTokens: 7000,
        jsonMode: false,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Fill ONLY missing sections (domain copy, reference layout). Keep HTML dense and polished.

MISSING:
${missing
  .map(
    (b) =>
      `- ${b.id}|${b.label}|${b.layout || "auto"} :: ${(b.uiBlueprint || b.hint || "").slice(0, 240)}`,
  )
  .join("\n")}

DOMAIN: ${JSON.stringify(domainDataPayload(theme, vision, imageUrls))}

XML+CDATA for these ids only. Header/hero ≥800 chars; others ≥500. No stubs.`,
          },
        ],
      });
      tokens += gap.tokensUsed;
      lastError = gap.fallbackReason || lastError;
      const gapItems = parseAiHomepageSections(gap.text || "");
      console.log("[cohesive] gap-fill", {
        missing: missing.length,
        got: gapItems.length,
        tokens: gap.tokensUsed,
      });
      items = mergeToPlan([...gapItems, ...items]);
      if (gapItems.length) provider = gap.provider || provider;
      params.onPartial?.(items, { phase: "gap-fill", tokens, provider });
    }
  }

  // OpenAI only if xAI+Claude returned almost nothing.
  if (items.length < 3) {
    const retry = await run("openai", false);
    tokens += retry.tokensUsed;
    lastError = retry.fallbackReason || lastError;
    console.log("[cohesive] openai-vision-fallback", {
      ok: Boolean(retry.text),
      tokens: retry.tokensUsed,
      error: retry.fallbackReason,
    });
    const retryItems = parseAiHomepageSections(retry.text || "");
    if (retryItems.length > items.length) {
      items = mergeToPlan([...retryItems, ...items]);
      provider = retry.provider;
    }
  }

  // Final: align length to plan so editor never ships a half page.
  if (blueprints.length && items.length < blueprints.length) {
    items = mergeToPlan(items);
    for (const b of blueprints) {
      if (items.some((item) => item.id === b.id)) continue;
      items.push(
        fallbackItem(
          theme,
          {
            id: b.id,
            label: b.label,
            hint: b.hint || theme.description,
            layout: b.layout,
            uiBlueprint: b.uiBlueprint,
          },
          vision,
        ),
      );
    }
  }

  return {
    items,
    tokens,
    provider,
    error:
      items.length < Math.min(needCount, 6)
        ? lastError || ai.fallbackReason || "Cohesive homepage returned too few sections"
        : lastError && provider !== "xai" && provider !== "claude"
          ? `Primary vision issue: ${lastError}; used ${provider}`
          : undefined,
  };
}

function completeHomepageSections(
  theme: BuiltSiteTheme,
  vision: string,
  existing: BuiltSiteSectionItem[],
): BuiltSiteSectionItem[] {
  const items = [...existing];
  const has = (re: RegExp) =>
    items.some((item) => re.test(item.id) || re.test(item.label));

  const ensure = (item: BuiltSiteSectionItem, re: RegExp) => {
    if (!has(re)) items.push(item);
  };

  // Always ship a dedicated Header section (logo + nav), separate from Hero.
  if (!has(/^header$/i) && !items.some((item) => item.id === "header")) {
    items.unshift(
      fallbackItem(
        theme,
        { id: "header", label: "Header", hint: "Navigation and brand" },
        vision,
      ),
    );
  }

  // If first item is a weak/empty hero label, replace with proper hero fallback.
  if (
    items.length === 0 ||
    (items.length === 1 && /topfold/i.test(items[0].label) && items[0].html.length < 400)
  ) {
    const hero = fallbackItem(
      theme,
      { id: "hero", label: "Hero", hint: theme.headline },
      vision,
    );
    if (items.length === 0) items.push(hero);
    else if (items[0].id === "header") items.splice(1, 0, hero);
    else items[0] = { ...hero, id: items[0].id || "hero" };
  } else if (!has(/hero|topfold|banner/i)) {
    const hero = fallbackItem(theme, { id: "hero", label: "Hero", hint: theme.headline }, vision);
    const headerIndex = items.findIndex((item) => item.id === "header");
    if (headerIndex >= 0) items.splice(headerIndex + 1, 0, hero);
    else items.unshift(hero);
  }

  const brand = escapeHtml(theme.brandName || "Your Brand");
  const primary = escapeHtml(theme.primaryColor || "#f39200");
  const accent = escapeHtml(theme.accentColor || "#00d2ff");
  const features = (theme.features?.length
    ? theme.features
    : (theme.headings || []).slice(0, 6).map((title) => ({
        title,
        description: theme.description || vision || "",
      }))
  ).slice(0, 6);

  ensure(
    {
      id: "services",
      label: "Services",
      html: `<section style="padding:72px 28px;background:#070b16;color:#fff;font-family:system-ui,sans-serif">
  <div style="max-width:1120px;margin:0 auto">
    <p style="margin:0;color:${primary};font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">Services</p>
    <h2 style="margin:10px 0 12px;font-size:clamp(1.8rem,3vw,2.4rem);font-family:Georgia,serif">${escapeHtml(theme.sectionsTitle || "What we offer")}</h2>
    <p style="margin:0 0 36px;max-width:40rem;color:rgba(255,255,255,.78);line-height:1.7">${escapeHtml(theme.description || vision || "")}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px">
      ${features
        .map(
          (feature, index) => `<article style="padding:22px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.03)">
        <div style="width:36px;height:36px;border-radius:10px;background:${index % 2 ? accent : primary};margin-bottom:14px"></div>
        <h3 style="margin:0 0 8px;font-size:1.1rem">${escapeHtml(feature.title)}</h3>
        <p style="margin:0;color:rgba(255,255,255,.72);line-height:1.65;font-size:.95rem">${escapeHtml(feature.description || theme.tagline || "")}</p>
      </article>`,
        )
        .join("")}
    </div>
  </div>
</section>`,
    },
    /service|feature/i,
  );

  ensure(
    {
      id: "about",
      label: "About",
      html: `<section style="padding:72px 28px;background:linear-gradient(180deg,#0b1220,#070b16);color:#fff;font-family:system-ui,sans-serif">
  <div style="max-width:1120px;margin:0 auto;display:grid;gap:28px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));align-items:center">
    <div>
      <p style="margin:0;color:${accent};font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">About</p>
      <h2 style="margin:10px 0 14px;font-size:clamp(1.8rem,3vw,2.5rem);font-family:Georgia,serif">${escapeHtml(theme.headings?.[1] || `Why choose ${theme.brandName}`)}</h2>
      <p style="margin:0;line-height:1.75;color:rgba(255,255,255,.8)">${escapeHtml(theme.paragraphs?.[1] || theme.description || vision || "")}</p>
    </div>
    <div style="display:grid;gap:14px">
      ${(theme.listItems?.length ? theme.listItems : ["Custom design", "Fast delivery", "Dedicated support", "Global clients"])
        .slice(0, 4)
        .map(
          (item) =>
            `<div style="padding:16px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(0,210,255,.06)">${escapeHtml(item)}</div>`,
        )
        .join("")}
    </div>
  </div>
</section>`,
    },
    /about|why|innovation/i,
  );

  const clientMarks = (
    theme.features?.map((f) => f.title) ||
    theme.headings ||
    ["Partner", "Client", "Brand", "Studio"]
  ).slice(0, 8);

  ensure(
    {
      id: "clients",
      label: "Clients",
      html: `<section style="padding:40px 28px;background:#050814;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06)">
  <div style="max-width:1120px;margin:0 auto">
    <p style="margin:0 0 18px;text-align:center;color:rgba(255,255,255,.55);font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:system-ui,sans-serif">Trusted by teams worldwide</p>
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
      ${clientMarks
        .map((name) => {
          const label = escapeHtml(String(name).slice(0, 18));
          const mono = escapeHtml(String(name).slice(0, 1).toUpperCase());
          return `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);color:#fff;font-family:system-ui,sans-serif;font-size:13px"><span style="width:28px;height:28px;border-radius:999px;display:grid;place-items:center;background:${primary};font-weight:700">${mono}</span>${label}</div>`;
        })
        .join("")}
    </div>
  </div>
</section>`,
    },
    /client|partner|logo/i,
  );

  ensure(
    {
      id: "cta",
      label: "CTA",
      html: `<section style="padding:64px 28px;background:radial-gradient(700px 280px at 50% 0%,rgba(243,146,0,.25),transparent 60%),#0b1220;color:#fff;text-align:center;font-family:system-ui,sans-serif">
  <h2 style="margin:0;font-size:clamp(1.8rem,3vw,2.4rem);font-family:Georgia,serif">Ready to grow with ${brand}?</h2>
  <p style="margin:14px auto 0;max-width:34rem;color:rgba(255,255,255,.78);line-height:1.7">${escapeHtml(theme.tagline || "Get a free proposal with transparent pricing.")}</p>
  <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
    <a href="#" style="background:${primary};color:#fff;padding:14px 22px;border-radius:10px;font-weight:700;text-decoration:none">${escapeHtml(theme.ctaButtons?.[0] || "Our Services")}</a>
    <a href="#" style="border:1px solid ${primary};color:#fff;padding:14px 22px;border-radius:10px;font-weight:700;text-decoration:none">${escapeHtml(theme.ctaButtons?.[1] || "Talk To Experts")}</a>
  </div>
</section>`,
    },
    /cta|contact|consult/i,
  );

  ensure(
    fallbackItem(theme, { id: "footer", label: "Footer", hint: theme.description }, vision),
    /footer/i,
  );

  // Fill remaining planned sections from reference/domain (up to 15) when data exists.
  const planned = (theme.sectionPlan || []).slice(0, 15);
  for (const planItem of planned) {
    if (items.length >= 15) break;
    const id = (planItem.id || "").trim();
    const label = (planItem.label || "").trim();
    if (!id && !label) continue;
    if (/header|nav|top.?bar|hero|banner|topfold|footer/i.test(`${id} ${label}`)) continue;
    const already = items.some(
      (item) =>
        item.id === id ||
        item.label.toLowerCase() === label.toLowerCase() ||
        (id && new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(item.id)),
    );
    if (already) continue;
    items.push(
      fallbackItem(
        theme,
        {
          id: id || `section-${items.length + 1}`,
          label: label || `Section ${items.length + 1}`,
          hint: planItem.hint || theme.description,
        },
        vision,
      ),
    );
  }

  // Normalize labels so editor never shows "TopFold"
  return items.slice(0, 15).map((item) => ({
    ...item,
    label: /topfold/i.test(item.label) ? "Hero" : item.label,
  }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateBody;
  const wantStream = Boolean(body.stream);

  const run = async (send?: (data: Record<string, unknown>) => void) => {
    let theme = body.theme;
    const vision = typeof body.vision === "string" ? body.vision.trim() : "";
    let plan: BuiltSiteSectionPlan[] = [];

    if (!theme || typeof theme !== "object") {
      return { message: "Theme payload is required.", _status: 400 as const };
    }

    if (Array.isArray(theme.categories) && theme.categories.length) {
      theme.navItems = theme.categories.slice(0, 16);
    } else if (!theme.categories?.length && theme.navItems?.length) {
      theme.categories = theme.navItems.slice(0, 20);
    }

    plan = defaultPlan(theme);
    const fallbackItems = completeHomepageSections(theme, vision, []);

    if (!hasAnyAiKey()) {
      const imagePack = await resolveRedesignImages({
        domainImages: theme.contentImages || [],
        logoImage: theme.logoImage || "",
        brandName: theme.brandName,
        vision,
        need: 8,
      });
      const themed = {
        ...theme,
        contentImages: imagePack.urls,
        heroImage: imagePack.urls[0] || "",
        logoImage: imagePack.logoImage || theme.logoImage || "",
      };
      const items = buildPremiumAgencyHomepage(themed, vision, imagePack.urls);
      const payload = {
        sections: toSectionsHtml(items),
        theme: themed,
        fallback: true,
        mode: "premium-agency",
        tokensUsed: 0,
        message: `No AI key configured — shipped premium agency pack. Add keys for vision upgrade (provider: ${primaryAiProviderLabel()}).`,
      };
      send?.({ type: "partial", ...payload, sectionCount: items.length });
      return payload;
    }

    const referenceUrl = (theme.referenceUrl || "").trim();
    const domainUrl = (theme.domainUrl || "").trim();

    const sameHost = (() => {
      try {
        if (!domainUrl || !referenceUrl) return false;
        const host = (raw: string) => {
          const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
          return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
        };
        return host(domainUrl) === host(referenceUrl);
      } catch {
        return false;
      }
    })();

    if (sameHost) {
      return {
        sections: toSectionsHtml(fallbackItems),
        theme,
        fallback: true,
        mode: "invalid-urls",
        message:
          "Reference and existing site are the same. Use a different reference site for redesign (Shuffle-style).",
        _status: 400 as const,
      };
    }

    // --- Primary: reference HTML/CSS clone + domain content/brand swap (modified, not raw copy) ---
    const imagePackEarly = await resolveRedesignImages({
      domainImages: [
        ...(Array.isArray(theme.contentImages) ? theme.contentImages : []),
        theme.heroImage || "",
      ].filter(Boolean),
      logoImage: theme.logoImage || "",
      brandName: theme.brandName,
      vision,
      need: 10,
      referenceUrl,
      domainUrl,
    });

    // No reference URL: domain data → system Lestow components → fill (primary Continue path).
    if (!referenceUrl) {
      const themeCompose = sanitizeThemeDomainOnly({
        ...theme,
        contentImages: imagePackEarly.urls,
        heroImage: imagePackEarly.urls[0] || theme.heroImage || "",
        logoImage: imagePackEarly.logoImage || theme.logoImage || "",
        sectionPlan: normalizeSectionPlanOrder(plan).slice(0, 12),
        buildMode: "domain-theme-compose",
        referenceUrl: "",
      });
      send?.({
        type: "status",
        message:
          "Loading system theme components — filling with your domain content & images…",
        theme: themeCompose,
      });
      let composeItems = buildTailwindLayoutClone(
        themeCompose,
        vision,
        imagePackEarly.urls,
      );
      if (composeItems.length < 4) {
        composeItems = buildPremiumAgencyHomepage(
          themeCompose,
          vision,
          imagePackEarly.urls,
        );
      }
      const scrubbed = composeItems.map((item) => ({
        ...item,
        html: stripReferenceLeaksFromHtml(item.html || "", themeCompose),
      }));
      const payload = {
        sections: toSectionsHtml(scrubbed),
        theme: themeCompose,
        fallback: false,
        mode: "domain-theme-compose",
        sectionCount: scrubbed.length,
        imageCount: imagePackEarly.urls.length,
        imageSources: imagePackEarly.sources,
        message: `Domain + system theme compose (${scrubbed.length} sections) — content & images from your site.`,
      };
      console.log("[generate-homepage] domain-theme-compose", {
        sections: scrubbed.length,
        images: imagePackEarly.urls.length,
      });
      send?.({
        type: "partial",
        ...payload,
        phase: "domain-theme-compose",
        sections: payload.sections,
      });
      return payload;
    }

    const themeForClone = sanitizeThemeDomainOnly({
      ...theme,
      contentImages: imagePackEarly.urls,
      heroImage: imagePackEarly.urls[0] || theme.heroImage || "",
      logoImage: imagePackEarly.logoImage || theme.logoImage || "",
      sectionPlan: transformReferencePlanForLegalSafety(
        normalizeSectionPlanOrder(plan).slice(0, 12),
        `${theme.brandName}|${theme.domainUrl}|${theme.referenceUrl}`,
      ),
      buildMode: "clone-swap",
    });

    send?.({
      type: "status",
      message:
        "Cloning reference → swapping your content → redesign finishing (menu, responsive, sections, images)…",
      theme: themeForClone,
    });

    if (referenceUrl) {
      try {
        const cloned = await cloneReferenceWithDomainSwap({
          referenceUrl,
          theme: themeForClone,
        });
        const cloneHtml = cloned.items[0]?.html || "";
        const cloneOk =
          !cloned.error &&
          cloned.items.length >= 1 &&
          (cloned.items.length >= 3 ||
            cloned.htmlBytes > 40_000 ||
            /data-lestow-clone-doc/i.test(cloneHtml));

        if (cloneOk) {
          const scrubbed = cloned.items.map((item) => ({
            ...item,
            html: stripReferenceLeaksFromHtml(item.html || "", themeForClone),
          }));
          const cloneTheme: BuiltSiteTheme = {
            ...themeForClone,
            buildMode: `${cloned.mode}-redesign`,
          };
          const payload = {
            sections: toSectionsHtml(scrubbed),
            theme: cloneTheme,
            fallback: false,
            mode: `${cloned.mode}-redesign`,
            sectionCount: scrubbed.length,
            imageCount: imagePackEarly.urls.length,
            imageSources: imagePackEarly.sources,
            message: `Clone + redesign finish (${cloned.mode}, ${Math.round(cloned.htmlBytes / 1024)}KB) — menu/responsive/content polished.`,
          };
          console.log("[generate-homepage] clone-swap", {
            mode: cloned.mode,
            bytes: cloned.htmlBytes,
            items: scrubbed.length,
          });
          send?.({
            type: "partial",
            ...payload,
            phase: "clone-swap",
            sections: payload.sections,
          });
          return payload;
        }

        console.warn("[generate-homepage] clone-swap skipped", {
          error: cloned.error,
          bytes: cloned.htmlBytes,
          items: cloned.items.length,
        });
        send?.({
          type: "status",
          message: `Clone thin/failed (${cloned.error || "unknown"}) — falling back to Lestow layout…`,
          theme: themeForClone,
        });
      } catch (err) {
        console.warn("[generate-homepage] clone-swap error", err);
        send?.({
          type: "status",
          message: "Clone failed — falling back to Lestow layout…",
          theme: themeForClone,
        });
      }
    }

    // --- Fallback: inspired Tailwind when clone cannot fetch/render ---
    const themeDomainOnly = sanitizeThemeDomainOnly({
      ...themeForClone,
      buildMode: "inspired-tailwind",
    });

    const layoutItems = buildTailwindLayoutClone(
      themeDomainOnly,
      vision,
      imagePackEarly.urls,
    );

    if (layoutItems.length >= 4) {
      send?.({
        type: "status",
        message: "Polishing layout with Lestow (domain content only, no reference assets)…",
        theme: themeDomainOnly,
      });
    }

    send?.({
      type: "status",
      message: "Capturing reference section screenshots (Grok-style visual recreation)…",
      theme: themeDomainOnly,
    });

    theme = themeDomainOnly;
    plan = themeDomainOnly.sectionPlan || plan;

    let captureError: string | undefined;
    let shots: Awaited<ReturnType<typeof captureReferenceSectionShots>>["shots"] = [];

    if (referenceUrl) {
      const captured = await captureReferenceSectionShots(referenceUrl, {
        maxSections: 8,
        mode: "full",
      });
      shots = captured.shots;
      captureError = captured.error;
      console.log("[generate-homepage] reference-capture", {
        mode: "full",
        count: shots.length,
        labels: shots.map((s) => `${s.id}:${s.label}`),
        error: captureError,
      });
    } else {
      captureError = "Missing reference URL for screenshots.";
    }

    // Keep cleaned reference plan order (do not collapse to topfold-only).
    plan = normalizeSectionPlanOrder(plan).slice(0, 12);

    send?.({
      type: "status",
      message: `Captured ${shots.length} reference shot(s) — rebuilding dense Tailwind sections…`,
      theme: {
        ...theme,
        sectionPlan: plan.slice(0, 12),
      },
      sectionsCaptured: shots.length,
    });

    const imagePack = imagePackEarly;
    const imageUrls = imagePack.urls;
    const themeWithImages: BuiltSiteTheme = sanitizeThemeDomainOnly({
      ...theme,
      sectionPlan: plan.slice(0, 12),
      contentImages: imageUrls,
      heroImage: imageUrls[0] || theme.heroImage || "",
      logoImage: imagePack.logoImage || theme.logoImage || "",
      buildMode: "inspired-tailwind",
    });

    send?.({ type: "status", message: "Resolving images — starting Lestow vision…", theme: themeWithImages });

    const premiumItems = layoutItems.length >= 4
      ? layoutItems
      : buildPremiumAgencyHomepage(themeWithImages, vision, imageUrls);

    const scrubItems = (list: BuiltSiteSectionItem[]) =>
      list.map((item) => ({
        ...item,
        html: stripReferenceLeaksFromHtml(item.html || "", themeWithImages),
      }));

    /** Replace empty/thin AI shells with premium slots — never ship blank hero/services. */
    const repairThinSlots = (aiItems: BuiltSiteSectionItem[]) => {
      const pool = [...premiumItems];
      const usedPrem = new Set<number>();
      const pickPremium = (label: string, id: string) => {
        let bestIdx = -1;
        let best = -1;
        for (let i = 0; i < pool.length; i += 1) {
          if (usedPrem.has(i)) continue;
          const s = scoreItemToPlan(pool[i], `${label} ${id}`);
          if (s > best) {
            best = s;
            bestIdx = i;
          }
        }
        if (bestIdx < 0) return null;
        usedPrem.add(bestIdx);
        return pool[bestIdx];
      };

      const out: BuiltSiteSectionItem[] = [];
      let repaired = 0;
      for (const item of aiItems) {
        const html = item.html || "";
        const thin =
          !html.trim() ||
          isLowQualityHtml(html, item.label || item.id) ||
          (/hero|banner/i.test(`${item.id} ${item.label}`) && !/<h1\b/i.test(html));
        if (thin) {
          const prem = pickPremium(item.label || "", item.id || "");
          if (prem?.html) {
            repaired += 1;
            out.push({
              ...prem,
              id: item.id,
              label: item.label,
              html: stripReferenceLeaksFromHtml(prem.html, themeWithImages),
            });
            continue;
          }
          // Drop empty slots entirely rather than shipping blanks.
          if (!html.trim()) continue;
        }
        out.push(item);
      }

      // One hero only
      let sawHero = false;
      const deduped: BuiltSiteSectionItem[] = [];
      for (const item of out) {
        const isHero = /hero|banner|topfold/i.test(`${item.id} ${item.label}`);
        if (isHero) {
          if (sawHero) continue;
          sawHero = true;
        }
        deduped.push(item);
      }
      return { items: deduped, repaired };
    };

    const chooseItems = (
      aiRaw: BuiltSiteSectionItem[],
      meta?: { error?: string; provider?: string },
    ) => {
      if (aiRaw.length >= 3) {
        const aligned = scrubItems(
          alignItemsToReferencePlan(plan, aiRaw, themeWithImages),
        );
        const { items: repaired, repaired: repairCount } = repairThinSlots(aligned);
        const aiScore = scoreHomepageQuality(repaired);
        const premiumScore = scoreHomepageQuality(premiumItems);
        const stillBroken = repaired.filter(
          (i) =>
            !i.html?.trim() ||
            isLowQualityHtml(i.html || "", i.label || i.id) ||
            (/hero/i.test(`${i.id} ${i.label}`) && !/<h1\b/i.test(i.html || "")),
        ).length;

        // Prefer full premium when AI page is still junk after repair.
        if (stillBroken >= 2 || (aiScore + 25 < premiumScore && repairCount >= 2)) {
          return {
            items: scrubItems(
              alignItemsToReferencePlan(plan, premiumItems, themeWithImages),
            ),
            usedPremium: true as const,
            aiScore,
            premiumScore,
            note: meta?.error || "AI quality too low — premium pack",
          };
        }

        return {
          items: repaired.slice(0, 15),
          usedPremium: repairCount > 0,
          aiScore,
          premiumScore,
          note: meta?.error,
        };
      }
      return {
        items: scrubItems(
          alignItemsToReferencePlan(plan, premiumItems, themeWithImages),
        ),
        usedPremium: true as const,
        aiScore: scoreHomepageQuality(aiRaw),
        premiumScore: scoreHomepageQuality(premiumItems),
        note: meta?.error || "AI returned <3 sections",
      };
    };

    const emitPartial = (
      aiRaw: BuiltSiteSectionItem[],
      meta: { phase: string; tokens: number; provider: string },
    ) => {
      if (!send) return;
      const picked = chooseItems(aiRaw, { provider: meta.provider });
      send({
        type: "partial",
        phase: meta.phase,
        sections: toSectionsHtml(picked.items),
        theme: {
          ...themeWithImages,
          sectionPlan: (theme.sectionPlan?.length ? theme.sectionPlan : plan).slice(0, 15),
        },
        sectionCount: picked.items.length,
        tokensUsed: meta.tokens,
        provider: meta.provider,
        fallback: picked.usedPremium,
        mode: picked.usedPremium ? "premium-agency" : "cohesive-vision",
        message: `Live Lestow HTML — ${picked.items.length} sections (${meta.phase})`,
      });
    };

    if (shots.length > 0) {
      const cohesive = await buildCohesiveHomepage({
        theme: themeWithImages,
        vision,
        shots,
        plan,
        imageUrls,
        onPartial: emitPartial,
      });

      const picked = chooseItems(cohesive.items, {
        error: cohesive.error,
        provider: cohesive.provider,
      });

      const visionPayload = {
        fallback: picked.usedPremium,
        mode: picked.usedPremium ? "premium-agency" : "cohesive-vision",
        sectionsCaptured: shots.length,
        sectionCount: picked.items.length,
        imageCount: imageUrls.length,
        imageSources: imagePack.sources,
        qualityScore: picked.usedPremium ? picked.premiumScore : picked.aiScore,
        tokensUsed: cohesive.tokens,
        provider: cohesive.provider,
        message: picked.usedPremium
          ? `Lestow used a temporary pack (${picked.note || "unknown"}).`
          : `Lestow rebuild (${picked.items.length} sections)${cohesive.error ? ` — polishing` : ""}`,
      };
      console.log("[generate-homepage]", visionPayload);

      return {
        sections: toSectionsHtml(picked.items),
        theme: {
          ...themeWithImages,
          sectionPlan: (theme.sectionPlan?.length ? theme.sectionPlan : plan).slice(0, 15),
        },
        ...visionPayload,
      };
    }

    const cohesiveText = await buildCohesiveHomepage({
      theme: themeWithImages,
      vision,
      shots: [],
      plan,
      imageUrls,
      onPartial: emitPartial,
    });
    const picked = chooseItems(cohesiveText.items, {
      error: cohesiveText.error,
      provider: cohesiveText.provider,
    });

    return {
      sections: toSectionsHtml(picked.items),
      theme: themeWithImages,
      fallback: picked.usedPremium,
      mode: picked.usedPremium ? "premium-agency" : "cohesive-text",
      sectionsCaptured: 0,
      sectionCount: picked.items.length,
      imageCount: imageUrls.length,
      imageSources: imagePack.sources,
      qualityScore: picked.usedPremium ? picked.premiumScore : picked.aiScore,
      tokensUsed: cohesiveText.tokens,
      provider: cohesiveText.provider,
      message: picked.usedPremium
        ? `Lestow rebuild failed without shots (${picked.note || captureError || "unknown"}) — temporary pack.`
        : `Lestow free rebuild (${picked.items.length} sections).`,
    };
  };

  if (wantStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
        };
        try {
          const result = await run(send);
          if (result && "_status" in result && result._status) {
            send({ type: "error", ...result });
          } else {
            send({ type: "done", ...result });
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to generate homepage sections right now.";
          console.error("[generate-homepage] fatal", message);
          send({ type: "error", message, fallback: true, mode: "error-fallback" });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  try {
    const result = await run();
    if (result && "_status" in result && result._status) {
      const status = result._status;
      const { _status: _, ...rest } = result as Record<string, unknown> & { _status: number };
      return NextResponse.json(rest, { status });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate homepage sections right now.";
    console.error("[generate-homepage] fatal", message);
    const theme = body.theme;
    if (theme) {
      const plan = defaultPlan(theme);
      const fallbackItems = alignItemsToReferencePlan(
        plan,
        completeHomepageSections(theme, typeof body.vision === "string" ? body.vision : "", []),
        theme,
      );
      return NextResponse.json({
        sections: toSectionsHtml(fallbackItems),
        theme,
        fallback: true,
        mode: "error-fallback",
        sectionCount: fallbackItems.length,
        tokensUsed: 0,
        message: `Build timed out or failed (${message}) — shipped structured fallback sections. Retry for full Lestow rebuild.`,
      });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
