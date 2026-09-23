/**
 * Section-targeted chat edits — send ONLY one section to the LLM, then splice back.
 * Prevents full-page hallucination on small layout/style asks.
 */

import { generateAiText } from "@/lib/aiProvider";
import { createAiEditRoute } from "@/lib/create-ai-chat-llm";

export type CreateAiSectionId =
  | "home"
  | "about"
  | "services"
  | "gallery"
  | "testimonials"
  | "pricing"
  | "contact"
  | "header"
  | "footer"
  | "global";

const SECTION_IDS: CreateAiSectionId[] = [
  "home",
  "about",
  "services",
  "gallery",
  "testimonials",
  "pricing",
  "contact",
  "header",
  "footer",
  "global",
];

/** Detect target section from user ask (Hinglish/English). */
export function detectCreateAiSectionId(message: string): CreateAiSectionId | null {
  const m = (message || "").toLowerCase();
  if (!m.trim()) return null;

  // Whole-page / theme — not a single-section surgical edit
  if (
    /\b(theme|theam|pura\s*(site|page|website|design)|whole\s*(site|page|design)|overall|sab\s*(badal|change)|site\s*look|colorfull|colorful|colourful|rangin|vibrant)\b/i.test(
      m,
    ) &&
    !/\b(footer|header|heder|hero|banner)\b/i.test(m)
  ) {
    return "global";
  }
  if (/\b(header|heder|nav\s*bar|navbar|top\s*menu)\b/i.test(m)) return "header";
  if (/\b(footer|copyright|niche\s*ka\s*bar)\b/i.test(m)) return "footer";
  if (/\b(hero|banner|home\s*section|#home|id=["']home)\b/i.test(m)) return "home";
  if (/\b(about|hamare\s*bare|our\s*story|#about)\b/i.test(m)) return "about";
  if (/\b(service|services|offerings|#services)\b/i.test(m)) return "services";
  if (/\b(galler(y|ies)|portfolio|photos?|#gallery)\b/i.test(m)) return "gallery";
  if (/\b(testimonial|reviews?|clients?\s*say|#testimonials)\b/i.test(m)) {
    return "testimonials";
  }
  if (/\b(pricing|price|plans?|#pricing)\b/i.test(m)) return "pricing";
  if (/\b(contact|get\s*in\s*touch|#contact)\b/i.test(m)) return "contact";
  return null;
}

/** True when ask is a scoped layout/style edit suitable for section-only AI. */
export function wantsSectionScopedEdit(message: string): boolean {
  const m = message || "";
  if (!m.trim()) return false;
  if (detectCreateAiSectionId(m) === "global") return false;
  // Widgets / schemas handled elsewhere
  if (
    /\b(back\s*to\s*top|btt|sticky|float|whatsapp|logo\s*ke\s*baad|brand\.label)\b/i.test(
      m,
    )
  ) {
    return false;
  }
  const section = detectCreateAiSectionId(m);
  if (!section || section === "global") return false;
  // Layout / style / content tweak verbs
  return /\b(grid|flex|column|layout|card|hover|round|radius|gap|spacing|align|center|left|right|dark|light|background|bg|color|rang|font|size|padding|margin|style|design|acha|achha|theek|fix|badal|change|update|bana|kro|karo)\b/i.test(
    m,
  );
}

export function extractCreateAiSectionHtml(
  html: string,
  sectionId: CreateAiSectionId,
): { html: string; index: number; length: number } | null {
  if (!html || !sectionId || sectionId === "global") return null;

  if (sectionId === "header") {
    const m = html.match(/<header\b[\s\S]*?<\/header>/i);
    if (!m || m.index == null) return null;
    return { html: m[0], index: m.index, length: m[0].length };
  }
  if (sectionId === "footer") {
    const m = html.match(/<footer\b[\s\S]*?<\/footer>/i);
    if (!m || m.index == null) return null;
    return { html: m[0], index: m.index, length: m[0].length };
  }

  const re = new RegExp(
    `<section\\b([^>]*\\bid=["']${sectionId}["'][^>]*)>[\\s\\S]*?<\\/section>`,
    "i",
  );
  let m = html.match(re);
  if (!m || m.index == null) {
    // Fallback: id on inner wrapper / common aliases
    const aliases: Record<string, string[]> = {
      home: ["hero", "banner"],
      services: ["service", "offerings"],
      gallery: ["portfolio", "photos"],
      testimonials: ["reviews", "clients"],
      contact: ["get-in-touch"],
    };
    for (const alt of aliases[sectionId] || []) {
      const re2 = new RegExp(
        `<section\\b([^>]*\\bid=["']${alt}["'][^>]*)>[\\s\\S]*?<\\/section>`,
        "i",
      );
      m = html.match(re2);
      if (m && m.index != null) break;
    }
  }
  if (!m || m.index == null) return null;
  return { html: m[0], index: m.index, length: m[0].length };
}

export function spliceCreateAiSectionHtml(
  pageHtml: string,
  sectionId: CreateAiSectionId,
  nextSectionHtml: string,
): string | null {
  const found = extractCreateAiSectionHtml(pageHtml, sectionId);
  if (!found) return null;
  const cleaned = (nextSectionHtml || "").trim();
  if (!cleaned) return null;
  // Reject if AI returned a whole document
  if (/<!DOCTYPE|<html\b/i.test(cleaned)) return null;
  return (
    pageHtml.slice(0, found.index) +
    cleaned +
    pageHtml.slice(found.index + found.length)
  );
}

function extractSectionFragment(text: string, sectionId: CreateAiSectionId) {
  const raw = (text || "").trim();
  if (!raw) return "";
  let t = raw.replace(/^```(?:html)?\s*/i, "").replace(/```$/i, "").trim();
  if (sectionId === "header") {
    return t.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  }
  if (sectionId === "footer") {
    return t.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || "";
  }
  const byId = t.match(
    new RegExp(
      `<section\\b[^>]*\\bid=["']${sectionId}["'][^>]*>[\\s\\S]*?<\\/section>`,
      "i",
    ),
  )?.[0];
  if (byId) return byId;
  return t.match(/<section\b[\s\S]*?<\/section>/i)?.[0] || "";
}

/**
 * Ensure common section ids exist (best-effort) so later chat can target them.
 */
export function ensureCreateAiSectionIds(html: string): string {
  if (!html) return html;
  let out = html;

  const tagIfMissing = (id: string, test: RegExp) => {
    if (new RegExp(`<(section|header|footer)\\b[^>]*\\bid=["']${id}["']`, "i").test(out)) {
      return;
    }
    // Find first untagged section whose text matches
    out = out.replace(
      /<section\b(?![^>]*\bid=)([^>]*)>([\s\S]*?)<\/section>/gi,
      (full, attrs: string, inner: string) => {
        if (new RegExp(`\\bid=["']${id}["']`, "i").test(out)) return full;
        const text = inner.replace(/<[^>]+>/g, " ").slice(0, 800);
        if (!test.test(text)) return full;
        // Only stamp once
        if (new RegExp(`id=["']${id}["']`, "i").test(out)) return full;
        return `<section id="${id}"${attrs}>${inner}</section>`;
      },
    );
  };

  if (!/<section\b[^>]*\bid=["']home["']/i.test(out)) {
    out = out.replace(
      /<section\b(?![^>]*\bid=)([^>]*)>/i,
      `<section id="home"$1>`,
    );
  }

  tagIfMissing("about", /\b(about|our\s*story|who\s*we|hamare|bare\s*mein)\b/i);
  tagIfMissing(
    "services",
    /\b(services?|what\s*we\s*do|offerings?|solutions?)\b/i,
  );
  tagIfMissing(
    "gallery",
    /\b(gallery|portfolio|our\s*work|photos?|moments)\b/i,
  );
  tagIfMissing(
    "testimonials",
    /\b(testimonial|reviews?|clients?\s*say|what\s*people)\b/i,
  );
  tagIfMissing("pricing", /\b(pricing|plans?|packages?|rates?)\b/i);
  tagIfMissing(
    "contact",
    /\b(contact|get\s*in\s*touch|reach\s*us|book\s*a)\b/i,
  );

  return out;
}

export async function rewriteCreateAiSection(params: {
  pageHtml: string;
  message: string;
  brandName: string;
  qualityMode?: "speed" | "quality";
  sectionId?: CreateAiSectionId | null;
}): Promise<{
  html: string;
  sectionId: CreateAiSectionId;
  ok: boolean;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  reason?: string;
}> {
  const sectionId =
    params.sectionId || detectCreateAiSectionId(params.message) || null;
  if (!sectionId || sectionId === "global") {
    return {
      html: params.pageHtml,
      sectionId: sectionId || "global",
      ok: false,
      reason: "not-section-scoped",
    };
  }

  const found = extractCreateAiSectionHtml(params.pageHtml, sectionId);
  if (!found) {
    return {
      html: params.pageHtml,
      sectionId,
      ok: false,
      reason: "section-missing",
    };
  }

  const mode = params.qualityMode === "quality" ? "quality" : "speed";
  const route = createAiEditRoute(mode);
  const system = `You are a Surgical HTML/CSS Layout Editor for "${params.brandName}".
You receive ONE existing section (or header/footer) and a modification request.
Rules:
1) Return ONLY the modified ${sectionId === "header" ? "<header>" : sectionId === "footer" ? "<footer>" : "<section>"} HTML — no markdown, no full document.
2) Keep the same tag and id="${sectionId === "header" || sectionId === "footer" ? sectionId : sectionId}" / data-* attributes. Do not rename ids.
3) Do NOT change text or images unless explicitly asked.
4) Keep existing image URLs and links.
5) Apply ONLY the requested layout/style change. Do not invent new sibling sections.
6) Prefer modern polished CSS (depth, hover, rounded cards) when the user asks for layout upgrades.
7) Never claim success without returning real updated HTML.`;

  const ai = await generateAiText({
    preferProvider: route.primary,
    modelTier: "fast",
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `TARGET: ${sectionId}

CURRENT HTML:
${found.html.slice(0, 28_000)}

USER REQUEST:
${params.message}

Return ONLY the updated ${sectionId} markup.`,
      },
    ],
    temperature: 0.12,
    maxTokens: 6000,
  });

  const nextFrag = extractSectionFragment(ai.text, sectionId);
  if (!nextFrag) {
    return {
      html: params.pageHtml,
      sectionId,
      ok: false,
      reason: "empty-ai",
      provider: ai.provider,
      model: ai.model,
      tokensUsed: ai.tokensUsed,
    };
  }

  // Must preserve id for sections
  if (
    sectionId !== "header" &&
    sectionId !== "footer" &&
    !new RegExp(`id=["']${sectionId}["']`, "i").test(nextFrag)
  ) {
    // Soft-fix: stamp id back
    const stamped = nextFrag.replace(
      /<section\b([^>]*)>/i,
      (_m, attrs: string) => {
        const cleaned = String(attrs || "").replace(
          /\s*id\s*=\s*(["'])[^"']*\1/gi,
          "",
        );
        return `<section id="${sectionId}"${cleaned}>`;
      },
    );
    const spliced = spliceCreateAiSectionHtml(
      params.pageHtml,
      sectionId,
      stamped,
    );
    if (!spliced) {
      return {
        html: params.pageHtml,
        sectionId,
        ok: false,
        reason: "splice-failed",
        provider: ai.provider,
      };
    }
    return {
      html: spliced,
      sectionId,
      ok: true,
      provider: ai.provider,
      model: ai.model,
      tokensUsed: ai.tokensUsed,
    };
  }

  const spliced = spliceCreateAiSectionHtml(
    params.pageHtml,
    sectionId,
    nextFrag,
  );
  if (!spliced) {
    return {
      html: params.pageHtml,
      sectionId,
      ok: false,
      reason: "splice-failed",
      provider: ai.provider,
    };
  }

  return {
    html: spliced,
    sectionId,
    ok: true,
    provider: ai.provider,
    model: ai.model,
    tokensUsed: ai.tokensUsed,
  };
}

export { SECTION_IDS };
