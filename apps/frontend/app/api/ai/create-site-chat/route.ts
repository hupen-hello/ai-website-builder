import { NextResponse } from "next/server";
import {
  generateAiFromImages,
  generateAiText,
  hasAnyAiKey,
  type AiImagePart,
  type AiTextResult,
} from "@/lib/aiProvider";
import { fetchCreateAiImageUrls } from "@/lib/create-ai-images";
import {
  createAiPlannerRoute,
  createAiEditRoute,
  createAiHeaderRoute,
} from "@/lib/create-ai-chat-llm";
import {
  wantsSectionScopedEdit,
  rewriteCreateAiSection,
  detectCreateAiSectionId,
} from "@/lib/create-ai-section-edit";
import {
  planChatActions,
  executeChatActions,
  isLogoReplaceAsk,
  isDuplicateLogoComplaint,
  isHeroBannerImageAsk,
  isScreenshotUiEditAsk,
  parseBrandLabelAsk,
  parseBrandRenameAsk,
  parseFooterImproveAsk,
} from "@/lib/create-ai-chat-actions";
import {
  applyCreateAiHeroVideoBanner,
  applyCreateAiHeroImage,
  applyCreateAiTopBar,
  applyCreateAiHeaderSticky,
  ensureCreateAiResponsive,
  ensureCreateAiHeaderBrand,
  createAiHeaderHasBrandLabel,
  injectFloatingContact,
  injectClientSlider,
  injectTeamSection,
  injectFaqSection,
  injectPricingSection,
  injectTestimonialsSection,
  injectMapSection,
  injectVideoSection,
  injectTimelineSection,
  layoutCreateAiRightRail,
  normalizeCreateAiHeaderBar,
  parseFloatPlacementLocal,
  readFloatPlacement,
  defaultFloatPlacement,
  extractCreateAiLogoSrc,
  dedupeHeaderBrandLogo,
  rebuildCreateAiHeaderBar,
  rotateInventCreateAiHeader,
  isCreateAiHeaderBroken,
  stripCreateAiContactPromptLeak,
  stripCreateAiFloatingWidgets,
  stripDuplicateContactStrips,
  stripOrphanDuplicateNav,
  type FloatPlacement,
} from "@/lib/create-ai-chrome";
import { polishCreateAiFooter } from "@/lib/create-ai-qa-rails";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

type ChatBody = {
  html?: string;
  message?: string;
  brandName?: string;
  category?: string;
  email?: string;
  mobile?: string;
  address?: string;
  qualityMode?: "speed" | "quality"; // speed = Gemini fast; quality = OpenAI strong
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  images?: Array<{ mimeType?: string; base64?: string }>;
  /** From onboarding design prefs — do NOT force-inject top bar every chat. */
  topBar?: boolean;
};

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

function normalizeAiHtmlCandidate(raw: string) {
  let t = (raw || "").trim().replace(/^\uFEFF/, "");
  // Junk prefixes Gemini sometimes emits: "html  or `html  or 'html
  t = t.replace(/^["'`]{1,3}\s*html\b\s*/i, "");
  t = t.replace(/^["'`]+/, "");
  // JSON wrapper { "html": "..." }
  if (/^\s*\{[\s\S]*"html"\s*:/.test(t)) {
    try {
      const parsed = JSON.parse(t) as { html?: unknown };
      if (typeof parsed.html === "string" && parsed.html.length > 200) {
        t = parsed.html;
      }
    } catch {
      const loose = t.match(/"html"\s*:\s*"((?:\\.|[^"\\])*)"/i);
      if (loose?.[1]) {
        try {
          t = JSON.parse(`"${loose[1]}"`);
        } catch {
          /* keep t */
        }
      }
    }
  }
  return t.trim();
}

function extractHtml(text: string) {
  const raw = (text || "").trim();
  if (!raw) return "";

  let candidate = "";
  const fencedClosed = raw.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  if (fencedClosed) {
    candidate = fencedClosed;
  } else {
    const fencedOpen = raw.match(/```(?:html)?\s*([\s\S]+)/i)?.[1];
    candidate = (fencedOpen || raw).replace(/```\s*$/i, "");
  }
  candidate = normalizeAiHtmlCandidate(candidate);

  const full =
    candidate.match(/<!DOCTYPE html[\s\S]*<\/html>/i)?.[0] ||
    candidate.match(/<html\b[\s\S]*<\/html>/i)?.[0];
  if (full) return full.trim();

  const body = candidate.match(/<body\b[\s\S]*<\/body>/i)?.[0];
  if (body && body.length > 200) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Site</title></head>${body}</html>`;
  }

  // Incomplete html — only accept if it actually has structure, not junk like `"html`
  if (
    /<html\b/i.test(candidate) &&
    /<body\b/i.test(candidate) &&
    candidate.length > 800 &&
    !/^["'`]/.test(candidate)
  ) {
    let doc = candidate;
    if (!/<\/body>/i.test(doc)) doc += "</body>";
    if (!/<\/html>/i.test(doc)) doc += "</html>";
    return doc;
  }

  return "";
}

/** Reject broken AI output so we never blank the preview. */
function isValidSiteHtml(doc: string, previous?: string) {
  const t = (doc || "").trim();
  if (t.length < 400) return false;
  if (/^["'`]/.test(t)) return false;
  if (/^html\b/i.test(t)) return false;
  if (!/<html\b/i.test(t)) return false;
  if (!/<body\b/i.test(t)) return false;
  if (!/<\/html>/i.test(t) && t.length < 2500) return false;
  // Must not be drastically smaller than previous (corruption)
  if (previous && previous.length > 2000 && t.length < previous.length * 0.25) {
    return false;
  }
  return true;
}

function extractSnippet(text: string) {
  const raw = normalizeAiHtmlCandidate(text || "");
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced || raw).trim();
  if (!candidate || candidate.length < 40) return "";
  if (/<!DOCTYPE|<html\b/i.test(candidate)) return "";
  if (/^["'`]/.test(candidate)) return "";
  const block = candidate.match(
    /<(?:div|section|aside|nav|style|header|footer)\b[\s\S]{20,8000}/i,
  )?.[0];
  return (block || candidate).slice(0, 12000);
}

function isUsableHtml(next: string, previous: string) {
  if (!isValidSiteHtml(next, previous)) return false;
  if (next.length >= Math.min(previous.length * 0.35, 4500)) return true;
  if (next.length >= 1500 && /<\/html>/i.test(next)) return true;
  return false;
}

function countTag(html: string, tag: string) {
  return (html.match(new RegExp(`<${tag}\\b`, "gi")) || []).length;
}

function wantsWholePageRedesign(message: string) {
  return /redesign|rebuild|entire|whole\s*page|poora\s*(page|site|design)|sara\s*design|from\s*scratch|layout\s*overhaul|sab\s*badal|naya\s*design\s*(bana|kro)/i.test(
    message || "",
  );
}

/**
 * Reject AI output that wiped unrelated sections (over-redesign).
 * Allows targeted remove of named sections only.
 */
function isSurgicalEdit(previous: string, next: string, message: string) {
  if (!previous || !next) return false;
  if (wantsWholePageRedesign(message)) return true;

  const prevSections = countTag(previous, "section");
  const nextSections = countTag(next, "section");
  const m = message || "";
  const addingSection =
    wantsAdd(m) &&
    /section|team|testimonial|faq|pricing|gallery|about|services|contact|hero/i.test(
      m,
    );

  // Losing 2+ sections without an explicit remove of a section = over-redesign
  if (prevSections >= 3 && nextSections <= prevSections - 2) {
    const removingSection =
      wantsRemove(m) &&
      /section|about|services|gallery|contact|hero|home|footer|header|faq|pricing|testimonial|team/i.test(
        m,
      );
    if (!removingSection) return false;
  }

  // Adding a section: allow +1/+2 sections, still block wiping others
  if (addingSection && nextSections >= prevSections && nextSections <= prevSections + 2) {
    const anchors = ["home", "about", "services", "gallery", "contact"];
    for (const id of anchors) {
      const had = new RegExp(`id=["']${id}["']`, "i").test(previous);
      const has = new RegExp(`id=["']${id}["']`, "i").test(next);
      if (had && !has && !new RegExp(id, "i").test(m)) return false;
    }
    return true;
  }

  const anchors = ["home", "about", "services", "gallery", "contact"];
  for (const id of anchors) {
    const had = new RegExp(`id=["']${id}["']`, "i").test(previous);
    const has = new RegExp(`id=["']${id}["']`, "i").test(next);
    if (!had || has) continue;
    const allowed =
      wantsRemove(m) &&
      new RegExp(id, "i").test(m) &&
      /remove|delete|hata|hatado|hatao|nikal|hide/i.test(m);
    if (!allowed) return false;
  }

  // Huge shrink without remove intent
  if (
    previous.length > 8000 &&
    next.length < previous.length * 0.55 &&
    !wantsRemove(m)
  ) {
    return false;
  }

  return true;
}

function isQuickEdit(message: string, hasImages: boolean) {
  if (hasImages) return false;
  const m = (message || "").trim();
  if (m.length > 280) return false;
  // UI redesigns need full/snippet HTML — patches look like "applied" but preview same
  if (
    /redesign|rebuild|entire|whole page|poora|sara design|naya design|from scratch|layout overhaul|sab badal|ui change|section.*(change|new|naya)|new kro|naya kro|visit section|contact section/i.test(
      m,
    )
  ) {
    return false;
  }
  return /color|colour|font|button|header|footer|float|whatsapp|phone|call|remove|delete|hide|text|heading|title|margin|padding|size|dark|light|background|cta|nav|logo|spacing|radius|border|shadow|back\s*to\s*top|scroll\s*to\s*top/i.test(
    m,
  );
}

function htmlLooksSame(a: string, b: string) {
  const norm = (s: string) =>
    s.replace(/\s+/g, " ").replace(/__CAI_IMG_\d+__/g, "").trim();
  return norm(a) === norm(b);
}

/** Fix common Hinglish/typo chat so intent regex + AI both understand. */
function normalizeChatLanguage(raw: string) {
  let s = String(raw || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const pairs: Array<[RegExp, string]> = [
    [/\bkro\b/gi, "karo"],
    [/\bkr\s*do\b/gi, "kar do"],
    [/\bkrdo\b/gi, "kar do"],
    [/\bhta\b/gi, "hata"],
    [/\bhatado\b/gi, "hata do"],
    [/\bhatao\b/gi, "hata do"],
    [/\bacha\b/gi, "achha"],
    [/\bachha\s*sa\b/gi, "improve"],
    [/\bthik\b/gi, "theek"],
    [/\bsudhar\b/gi, "improve"],
    [/\bsahi\s*kro\b/gi, "fix karo"],
    [/\bresponcive\b/gi, "responsive"],
    [/\bresponsiv\b/gi, "responsive"],
    [/\bheder\b/gi, "header"],
    [/\bhedar\b/gi, "header"],
    [/\bhedr\b/gi, "header"],
    [/\bfuter\b/gi, "footer"],
    [/\bfoter\b/gi, "footer"],
    [/\bcolur\b/gi, "color"],
    [/\bcolour\b/gi, "color"],
    [/\bbna\s*do\b/gi, "bana do"],
    [/\bbanado\b/gi, "bana do"],
    [/\bbanado\b/gi, "bana do"],
    [/\bdaldo\b/gi, "dal do"],
    [/\bdal\s*do\b/gi, "dal do"],
    [/\blgado\b/gi, "laga do"],
    [/\blaga\s*do\b/gi, "laga do"],
    [/\bnikal\s*do\b/gi, "hata do"],
    [/\bhtado\b/gi, "hata do"],
    [/\bmenue\b/gi, "menu"],
    [/\bnavbr\b/gi, "navbar"],
    [/\bmbl\b/gi, "mobile"],
    [/\bmob\b/gi, "mobile"],
    [/\btab\s*pe\b/gi, "tablet pe"],
    [/\bpura\s*site\b/gi, "whole website"],
    [/\bpoora\b/gi, "whole"],
    [/\bye\s+change\b/gi, "this change"],
    [/\bisko\b/gi, "this"],
    [/\busko\b/gi, "that"],
    [/\bwapas\s*lao\b/gi, "restore"],
    [/\bwapas\s*dal\b/gi, "put back"],
  ];
  for (const [re, to] of pairs) s = s.replace(re, to);
  return s;
}

/** "header ke right side button" = location, NOT header redesign. */
function isHeaderButtonLocationAsk(message: string) {
  const m = message || "";
  // Typos: haeder / heder / buuton
  if (
    !/\b(header|heder|hedar|haeder|nav|upar|top\s*side|right\s*side)\b/i.test(m)
  ) {
    return false;
  }
  // Whole-header restyle / update — never treat as CTA-only
  if (
    /\b(header|nav|menu)\s*(update|updte|acha|achha|theek|fix|clean|sahi|sudhar|improve|redesign|change|badal|toot|kharab|gap|overlap|double|duplicate|new|naya|bana|bnao|banao)\b/i.test(
      m,
    ) ||
    /\b(update|updte|fix|clean|redesign|improve|theek|acha|achha|sudhar|overlap|gap|dark|premium)\b.{0,40}\b(header|nav|menu)\b/i.test(
      m,
    ) ||
    /\b(header|nav|menu)\b.{0,24}\b(update|updte|fix|theek|acha|achha|dark|premium|feel)\b/i.test(
      m,
    )
  ) {
    return false;
  }
  if (
    !/\b(button|btn|buuton|botton|cta|text|color|colour|rang|white|black|likha|baat)\b/i.test(
      m,
    )
  ) {
    return false;
  }
  return true;
}

/** "logo ke baad name" / "brand name add" — NOT a header rebuild. */
function isBrandLabelAsk(message: string) {
  const m = message || "";
  if (!m) return false;
  // Must be about adding/showing name next to logo/brand — not full header redesign
  if (
    /\b(header|heder|nav)\b.{0,24}\b(update|updte|fix|redesign|theek|acha|achha|new|naya|banao|dark|premium)\b/i.test(
      m,
    ) ||
    /\b(update|fix|redesign|theek|dark|premium)\b.{0,24}\b(header|nav)\b/i.test(m)
  ) {
    return false;
  }
  return (
    /\b(logo|brand)\b.{0,40}\b(name|naam|text|likha)\b/i.test(m) ||
    /\b(name|naam)\b.{0,40}\b(logo|brand)\b/i.test(m) ||
    /(logo|brand).{0,20}(ke\s*)?(baad|bagal|paas|beside|after|next\s*to).{0,40}(name|naam|add|dal|laga)/i.test(
      m,
    ) ||
    /(name|naam).{0,20}(logo|brand).{0,20}(baad|bagal|paas|beside|after|next)/i.test(
      m,
    ) ||
    /\b(bas\s*)?(name|naam)\s*(add|dal|laga)/i.test(m) ||
    /add\s+[A-Za-z][A-Za-z .'-]{1,40}.{0,20}(logo|header|brand)/i.test(m)
  );
}

/** User wants header / top nav cleaned or redesigned. */
function wantsHeaderFix(message: string) {
  if (isHeaderButtonLocationAsk(message)) return false;
  if (isBrandLabelAsk(message)) return false;
  // sticky is a schema action — not header rebuild
  if (
    /\bsticky\b/i.test(message || "") &&
    /\b(header|heder|nav|navbar|menu)\b/i.test(message || "")
  ) {
    return false;
  }
  // "mai top bar bola" = contact topbar only — not full header redesign
  if (wantsTopBarOnlyFix(message)) return false;
  const m = message || "";
  // CRITICAL: bare "header" as LOCATION is NOT a redesign (was causing 0% trust)
  return (
    /\b(header|heder|hedar|navbar|nav\s*bar|top\s*(bar|menu)|menu\s*bar)\b.{0,48}\b(update|updte|acha|achha|theek|fix|clean|sahi|sudhar|improve|redesign|change|badal|new|naya|bana|bnao|banao|kharab|toot|overlap|gap|double|duplicate|broken|premium|dark)\b/i.test(
      m,
    ) ||
    /\b(update|updte|fix|clean|theek|acha|achha|sudhar|improve|redesign|change|badal|new|naya|kharab|toot|overlap|gap|dark|premium|bana|bnao|banao)\b.{0,48}\b(header|heder|hedar|navbar|nav\s*bar|menu\s*bar)\b/i.test(
      m,
    ) ||
    /\b(pura|whole)\s*header\b/i.test(m)
  );
}

function wantsDarkPremiumHeader(message: string) {
  return /dark|premium|black\s*(header|nav|bg|theme)|gold|luxury|feel|mood|elegant/i.test(
    message || "",
  );
}

/**
 * Full site theme / look refresh — NOT header-only.
 * "theme better", "design change", "apne according" after a theme ask.
 */
function wantsSiteThemeRefresh(message: string) {
  const m = message || "";
  if (!m) return false;
  // Pure header ask without site/theme words → header path owns it
  if (
    /\b(header|heder|nav|navbar)\b/i.test(m) &&
    !/\b(theme|theam|thim|site|website|pura|whole|overall|page|design)\b/i.test(m)
  ) {
    return false;
  }
  return (
    /\b(theme|theam|thim)\b.{0,32}(better|improve|change|badal|new|naya|update|acha|achha|refresh|sundar|premium)/i.test(
      m,
    ) ||
    /\b(better|improve|change|badal|new|naya|update|acha|achha|refresh)\b.{0,32}\b(theme|theam|design|look)\b/i.test(
      m,
    ) ||
    /\b(pura|whole|overall)\s*(theme|design|look|site|website|page)\b/i.test(m) ||
    /\b(site|website|page)\s*(theme|design|look)\b/i.test(m) ||
    /\b(design|look)\s*(better|improve|change|badal|acha|achha)\b/i.test(m)
  );
}

/** User said "apne according" continuing a prior theme ask — still full theme, not header. */
function isSiteThemeContinueAsk(message: string, historyBlob: string) {
  if (!wantsSiteThemeRefresh(historyBlob) && !/\btheme|design\s*better|look\s*better/i.test(historyBlob || "")) {
    return false;
  }
  return /apne\s*according|khud\s*(se|hi)|your\s*(choice|call)|jo\s*acha|jo\s*sahi|decide\s*(karo|kro)|jaise\s*chahe|app\s*apne/i.test(
    message || "",
  );
}

/** User wants a brand-new header look (not the same theme again). */
function wantsNewHeader(message: string) {
  return /header\s*(new|naya|bana|bnao|banao|badal|change)|naya\s*header|new\s*header|different\s*header|header\s*(ko\s*)?(change|badal)|kuch\s*(aur|naya|new).{0,12}header/i.test(
    message || "",
  );
}

function headerLooksDark(headerHtml: string) {
  const h = headerHtml || "";
  return /background(?:-color)?\s*:\s*(#0a0a0a|#0f172a|#111111|#020617|#000|#111|rgb\(\s*0\s*,\s*0\s*,\s*0|rgba\(\s*0\s*,\s*0\s*,\s*0)/i.test(
    h,
  );
}

/** Rotate to a visibly different header palette than the current one. */
function pickAlternateHeaderTheme(prevHeader: string): {
  bg: string;
  fg: string;
  accent: string;
  label: string;
} {
  if (headerLooksDark(prevHeader)) {
    // Currently dark → fresh light / warm editorial
    return {
      bg: "#ffffff",
      fg: "#0f172a",
      accent: "#ea580c",
      label: "clean-light",
    };
  }
  // Currently light → modern navy (not the same black+gold if they just had that)
  if (/#c9a227|#d4af37|gold/i.test(prevHeader)) {
    return {
      bg: "#0f172a",
      fg: "#f8fafc",
      accent: "#38bdf8",
      label: "navy-sky",
    };
  }
  return {
    bg: "#0a0a0a",
    fg: "#f5f5f4",
    accent: "#c9a227",
    label: "dark-premium",
  };
}

/** User means the dark contact strip (topbar), not the white nav header. */
function wantsTopBarOnlyFix(message: string) {
  const m = message || "";
  if (!/(top\s*bar|topbar|utility\s*bar|contact\s*bar)/i.test(m)) return false;
  if (
    /pura\s*header|whole\s*header|header\s*design|header\s*(redesign|rebuild|change|badal)|nav\s*(design|change)/i.test(
      m,
    )
  ) {
    return false;
  }
  return true;
}

/** Count nav labels only in header + mobile panel — never page sections / footer. */
function navHitsInChrome(doc: string) {
  const header = doc.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  const mobile =
    doc.match(
      /<nav\b[^>]*data-cai-mobile-panel[^>]*>[\s\S]*?<\/nav>/i,
    )?.[0] || "";
  const scope = `${header}\n${mobile}`;
  return (scope.match(/\b(ABOUT|SERVICES|GALLERY|CONTACT|JOURNEYS|HOME)\b/gi) || [])
    .length;
}

function wantsResponsiveFix(message: string) {
  return /responsive|responcive|mobile\s*(view|fix|layout|pe|wala)|tablet|tab\s*pe|break\s*point|screen|overflow|horizontal|squash|layout\s*(toot|kharab|fix|acha|achha)|pura\s*(site|page|website)|whole\s*website.*(mobile|tab|responsive)|mobile.*(kharab|toot|fix|theek)|chhote\s*screen|phone\s*(pe|par)|sab\s*device/i.test(
    message || "",
  );
}

function wantsSurgicalPatch(message: string) {
  const m = message || "";
  if (wantsHeaderFix(m) || wantsResponsiveFix(m)) return false;
  if (
    /(add|bana|dal|laga).{0,40}(team|faq|pricing|section|slider|testimonial|map|video|timeline)/i.test(
      m,
    )
  ) {
    return false;
  }
  if (isMicroColorTextAsk(m) || isHeaderButtonLocationAsk(m)) return true;
  return (
    /^(change|update|set|replace|fix|edit|badal)\b.{0,60}(color|colour|font|text|title|heading|button|label|copy)/i.test(
      m,
    ) ||
    /\b(sirf|only)\s+(color|colour|font|text|heading|title)\b/i.test(m) ||
    /\b(color|colour|font-size|background)\s*(change|badal|karo|kar do)\b/i.test(
      m,
    ) ||
    /\b(heading|title|button text|cta text|likha|writing)\s*(change|badal|update|karo|kar do)\b/i.test(
      m,
    ) ||
    /\b(rang|colour|color)\s*(badal|change)\b/i.test(m) ||
    /\b(text|heading|title|headline)\s+(white|black|red|blue|green|dark|light|#?[0-9a-f]{3,8})\b/i.test(
      m,
    ) ||
    /\b(white|black|red|blue)\s+(text|heading|title|color|colour)\b/i.test(m)
  );
}

/** Tiny color/text asks — no intent AI, no vision full rewrite. */
function isMicroColorTextAsk(message: string) {
  const m = (message || "").trim();
  if (!m || m.length > 120) return false;
  if (wantsResponsiveFix(m)) return false;
  if (wantsHeaderFix(m)) return false;
  if (
    /(add|bana|dal|laga|section|slider|team|faq|whatsapp|float|footer|page)\b/i.test(
      m,
    )
  ) {
    return false;
  }
  if (isHeaderButtonLocationAsk(m)) return true;
  return (
    /^(text|heading|title|headline|font|color|colour|rang|button)\s*(text\s*)?(ko\s*)?(white|black|red|blue|green|yellow|orange|dark|light|#?[0-9a-f]{3,8})\b/i.test(
      m,
    ) ||
    /^(white|black|red|blue|yellow|orange)\s*(text|heading|title|color|colour|button)\b/i.test(m) ||
    /\b(button|btn|buuton|botton|cta)\s*(ka\s*)?(text|likha|label)?\s*(color|colour|rang)?\s*(white|black|red|blue|yellow|orange|green|#)/i.test(
      m,
    ) ||
    /\b(second|first|2nd|1st|dusra|pehla)\s*(button|btn|cta)\b/i.test(m) ||
    /\b(text|heading|title|button)\s*(color|colour|rang)?\s*(white|black|red|blue|yellow|orange|green|#)/i.test(
      m,
    ) ||
    /\bmake\s+(the\s+)?(text|heading|title|button).{0,20}(white|black|yellow|red)/i.test(m)
  );
}

/** Named / hex color from a chat string. Prefer current ask over history. */
function extractNamedOrHexColor(text: string): string | null {
  const m = (text || "").toLowerCase();
  const hex = m.match(/#([0-9a-f]{3,8})\b/i);
  if (hex) return `#${hex[1]}`;
  const named = m.match(
    /\b(white|black|red|blue|green|yellow|orange|purple|pink|teal|maroon|brown|gray|grey|gold|dark|light)\b/i,
  );
  if (!named) return null;
  const map: Record<string, string> = {
    white: "#ffffff",
    black: "#111111",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#eab308",
    orange: "#ea580c",
    purple: "#7c3aed",
    pink: "#db2777",
    teal: "#0d9488",
    maroon: "#9f1239",
    brown: "#92400e",
    gray: "#6b7280",
    grey: "#6b7280",
    gold: "#ca8a04",
    dark: "#0f172a",
    light: "#f8fafc",
  };
  return map[named[1].toLowerCase()] || null;
}

function localClarifyMicroAsk(message: string): string | null {
  if (!isMicroColorTextAsk(message) && !isHeaderButtonLocationAsk(message)) {
    return null;
  }
  const m = message.trim().toLowerCase();
  const hex = extractNamedOrHexColor(m) || "#ffffff";
  if (isHeaderButtonLocationAsk(m) || /\b(button|cta|btn|buuton|botton)\b/i.test(m)) {
    return `Change ONLY the header right-side CTA/button label text color to ${hex}. Do not rebuild or redesign the header/nav.`;
  }
  const target = /\b(heading|title|headline|h1)\b/i.test(m)
    ? "main hero headline/title"
    : "main hero headline and primary visible text in that section";
  return `Change the ${target} color to ${hex}. Keep layout, fonts, and all other colors unless needed for contrast. Do not redesign the page.`;
}

/** Instant CSS for button/text color — no AI wait, no fake "updated". */
function applyDeterministicTextColor(html: string, message: string): string | null {
  if (
    !html ||
    (!isMicroColorTextAsk(message) && !isHeaderButtonLocationAsk(message))
  ) {
    return null;
  }
  const m = message.toLowerCase();
  const hex = extractNamedOrHexColor(m) || "#ffffff";
  const wantButton =
    /\b(button|cta|btn|buuton|botton)\b/i.test(m) || isHeaderButtonLocationAsk(m);
  const headerOnly =
    isHeaderButtonLocationAsk(m) ||
    /\b(header|haeder|heder|hedar)\b.{0,40}\b(button|buuton|botton|btn|cta)\b|\b(button|buuton|botton|btn|cta)\b.{0,40}\b(header|haeder|heder|hedar)\b/i.test(
      m,
    );

  const styleId = "data-create-ai-micro-color";
  let out = html.replace(
    new RegExp(
      `<style\\b[^>]*${styleId}=["']1["'][^>]*>[\\s\\S]*?<\\/style>`,
      "gi",
    ),
    "",
  );

  const css = !wantButton
    ? `h1, h2, .hero h1, .hero h2, main h1, section h1:first-of-type { color: ${hex} !important; }`
    : headerOnly
      ? `header button, header .btn, header [role="button"],
header a[style*="padding"], header a[class*="btn"], header a[class*="cta"], header a[class*="button"] { color: ${hex} !important; }`
      : `button, .btn, [role="button"], input[type="submit"], input[type="button"],
a[style*="padding"][style*="background"], a[style*="padding"][style*="border-radius"],
a[class*="btn"], a[class*="cta"], a[class*="button"] { color: ${hex} !important; }`;

  const tag = `<style ${styleId}="1">${css}</style>`;
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${tag}</head>`);
  } else if (/<body\b/i.test(out)) {
    out = out.replace(/<body\b[^>]*>/i, (open) => `${open}${tag}`);
  } else {
    out = `${tag}${out}`;
  }

  // Inline force on header CTA when scoped — keep fill, force label #fff with !important
  if (wantButton && headerOnly) {
    let touched = false;
    out = out.replace(
      /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
      (headerBlock, hAttrs: string, inner: string) => {
        let nextInner = inner.replace(
          /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
          (full, tagName: string, attrs: string, body: string) => {
            const lower = `${attrs} ${body}`.toLowerCase();
            const text = body
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            if (!text || text.length > 40) return full;
            if (/data-cai-menu|data-cai-brand|data-create-ai-brand|home|about|services|gallery|contact|nav/i.test(lower) &&
              !/btn|cta|button|padding|background|border-radius|book|get\s*started|schedule|repair|enquire|contact\s*us/i.test(lower)) {
              // skip plain nav links
              if (/^#|^\/|javascript:/i.test(attrs.match(/href=["']([^"']+)/i)?.[1] || "") &&
                !/padding|background|border-radius|btn|cta/i.test(attrs)) {
                return full;
              }
            }
            const looksCta =
              tagName.toLowerCase() === "button" ||
              /btn|cta|button/i.test(attrs) ||
              (/padding/i.test(attrs) &&
                (/background/i.test(attrs) || /border-radius/i.test(attrs))) ||
              /book|get\s*started|schedule|repair|enquire|request|talk|call|visit|consult/i.test(
                text,
              );
            if (!looksCta) return full;
            touched = true;
            let next = attrs.replace(/\s*data-cai-btn=(["'])[^"']*\1/gi, "");
            next = `${next} data-cai-btn="hdr-cta"`;
            if (/\bstyle\s*=\s*(["'])/i.test(next)) {
              next = next.replace(
                /\bstyle\s*=\s*(["'])([^"']*)\1/i,
                (_s, q: string, style: string) => {
                  const cleaned = style
                    .replace(/color\s*:\s*[^;]+;?/gi, "")
                    .trim()
                    .replace(/;+\s*$/g, "");
                  const joined = cleaned
                    ? `${cleaned};color:${hex} !important`
                    : `color:${hex} !important`;
                  return `style=${q}${joined}${q}`;
                },
              );
            } else {
              next = `${next} style="color:${hex} !important"`;
            }
            let nextBody = body.replace(
              /<(span|strong|em|i|b)\b([^>]*)>/gi,
              (_m, t: string, a: string) => {
                if (/\bstyle\s*=/i.test(a)) {
                  return `<${t}${a.replace(
                    /\bstyle\s*=\s*(["'])([^"']*)\1/i,
                    (_s, q: string, st: string) => {
                      const cleaned = st
                        .replace(/color\s*:\s*[^;]+;?/gi, "")
                        .trim();
                      return `style=${q}${cleaned ? `${cleaned};` : ""}color:${hex} !important${q}`;
                    },
                  )}>`;
                }
                return `<${t}${a} style="color:${hex} !important">`;
              },
            );
            return `<${tagName}${next}>${nextBody}</${tagName}>`;
          },
        );
        // If no CTA matched, force last padded/background link in header
        if (!touched) {
          const candidates = [
            ...inner.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi),
          ];
          for (let i = candidates.length - 1; i >= 0; i -= 1) {
            const c = candidates[i];
            const attrs = c[2] || "";
            const body = c[3] || "";
            const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (!text || /data-cai-brand|data-create-ai-brand|data-cai-menu/i.test(attrs)) {
              continue;
            }
            if (
              /padding|background|border-radius|btn|cta/i.test(attrs) ||
              text.length <= 28
            ) {
              const rebuilt = `<${c[1]}${attrs} data-cai-btn="hdr-cta" style="color:${hex} !important">${body}</${c[1]}>`;
              // merge if style exists - simpler replace once
              nextInner = inner.replace(c[0], () => {
                let next = attrs.replace(/\s*data-cai-btn=(["'])[^"']*\1/gi, "");
                next = `${next} data-cai-btn="hdr-cta"`;
                if (/\bstyle\s*=/i.test(next)) {
                  next = next.replace(
                    /\bstyle\s*=\s*(["'])([^"']*)\1/i,
                    (_s, q: string, style: string) => {
                      const cleaned = style
                        .replace(/color\s*:\s*[^;]+;?/gi, "")
                        .trim();
                      return `style=${q}${cleaned ? `${cleaned};` : ""}color:${hex} !important${q}`;
                    },
                  );
                } else {
                  next += ` style="color:${hex} !important"`;
                }
                return `<${c[1]}${next}>${body}</${c[1]}>`;
              });
              touched = true;
              break;
            }
          }
        }
        return `<header${hAttrs}>${nextInner}</header>`;
      },
    );
    // CSS that beats QA dark-ink rails on header CTA
    const force = `<style data-create-ai-micro-color="1">header a[data-cai-btn="hdr-cta"],header button[data-cai-btn="hdr-cta"],header a[data-cai-btn="hdr-cta"] *,header button[data-cai-btn="hdr-cta"] *{color:${hex} !important}</style>`;
    out = out.replace(
      /<style\b[^>]*data-create-ai-micro-color=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
      "",
    );
    if (/<\/head>/i.test(out)) {
      out = out.replace(/<\/head>/i, `${force}</head>`);
    } else {
      out = force + out;
    }
    // Always return — CSS force + any inline touch; never null (planner crash path)
  } else if (wantButton) {
    out = out.replace(
      /<(button)\b([^>]*?)>/gi,
      (_full, tagName: string, attrs: string) => {
        let next = attrs;
        if (/\bstyle\s*=\s*(["'])/i.test(next)) {
          next = next.replace(
            /\bstyle\s*=\s*(["'])([^"']*)\1/i,
            (_s, q: string, style: string) => {
              const cleaned = style.replace(/color\s*:\s*[^;]+;?/gi, "").trim();
              const joined = cleaned
                ? `color:${hex};${cleaned}`
                : `color:${hex}`;
              return `style=${q}${joined}${q}`;
            },
          );
        } else {
          next = `${next} style="color:${hex}"`;
        }
        return `<${tagName}${next}>`;
      },
    );
    out = out.replace(
      /<(a)\b([^>]*?)>/gi,
      (full, tagName: string, attrs: string) => {
        const lower = attrs.toLowerCase();
        const looksCta =
          (/padding/i.test(lower) &&
            (/background/i.test(lower) || /border-radius/i.test(lower))) ||
          /class\s*=\s*["'][^"']*(btn|cta|button)/i.test(attrs);
        if (!looksCta) return full;
        let next = attrs;
        if (/\bstyle\s*=\s*(["'])/i.test(next)) {
          next = next.replace(
            /\bstyle\s*=\s*(["'])([^"']*)\1/i,
            (_s, q: string, style: string) => {
              const cleaned = style.replace(/color\s*:\s*[^;]+;?/gi, "").trim();
              const joined = cleaned
                ? `color:${hex};${cleaned}`
                : `color:${hex}`;
              return `style=${q}${joined}${q}`;
            },
          );
        } else {
          next = `${next} style="color:${hex}"`;
        }
        return `<${tagName}${next}>`;
      },
    );
  }

  return out;
}

function messageNeedsIntentAI(message: string) {
  const m = (message || "").trim();
  if (m.length < 2) return false;
  if (isMicroColorTextAsk(m)) return false;
  // Long clear English edit commands can skip
  if (
    m.length > 120 &&
    /\b(add|remove|change|update|delete|fix|improve|redesign)\b/i.test(m) &&
    !/(karo|kro|hata|dal|laga|achha|theek|as\s*rha|sk\s*kro)/i.test(m)
  ) {
    return false;
  }
  // Almost everything short / Hinglish / typo-heavy → ChatGPT-style clarify
  if (/[\u0900-\u097F]/.test(m)) return true;
  if (m.split(/\s+/).length <= 14) return true;
  if (
    /(karo|kar do|kro|bana|hata|achha|acha|theek|sahi|dal|laga|fix|sudhar|badal|ye |isko|usko|thoda|zyada|upar|niche|wala|as\s*rha|ho\s*rha|sk\s*kro|sur\b)/i.test(
      m,
    )
  ) {
    return true;
  }
  if (!/\b(add|remove|change|update|delete|fix|improve|redesign)\b/i.test(m)) {
    return true;
  }
  return false;
}

/**
 * Turn messy Hinglish/typo chat into one clear English website-edit instruction.
 * Like ChatGPT: understand meaning, not exact wording — this runs BEFORE the editor AI.
 */
async function interpretUserIntent(params: {
  message: string;
  brandName: string;
  qualityMode?: "speed" | "quality";
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Vision already read the attached screenshot */
  screenshotBrief?: string;
  hasImages?: boolean;
}): Promise<{ clarified: string; provider?: string; clarify?: string }> {
  const normalized = normalizeChatLanguage(params.message);

  const historyBlock = (params.history || [])
    .slice(-8)
    .map((h) => `${h.role}: ${String(h.content || "").slice(0, 220)}`)
    .join("\n");

  try {
    const preferOpenAi = params.qualityMode === "quality";
    const route = createAiPlannerRoute(preferOpenAi ? "quality" : "speed");
    const ai = await generateAiText({
      preferProvider: route.primary,
      modelTier: route.tier,
      messages: [
        {
          role: "system",
          content: `You convert messy user chat into a precise website-edit PROMPT for another AI.

User may write broken English / Hindi / Hinglish / typos. Infer MEANING from message + recent chat. Never refuse.

Output ONLY one clear English website-edit instruction (1–4 short sentences). No HTML, no markdown, no quotes, no preamble.

OR if you truly cannot tell which section/element (even with screenshot brief), output exactly:
ASK_CLARIFY: <one short Hinglish+English question naming 2–3 likely options>

PROMPT SHAPE (fill what applies, skip empty):
- What to change (specific element: header brand text, hero title, FAQ, whole site theme, etc.)
- How to change it (color, text, layout, add/remove/center, theme refresh)
- Exact values if given (brand names, colors, URLs, phones — keep verbatim)
- Explicit DO NOT over-expand

ANTI-RANDOM (critical — never invent a different ask):
- Stay faithful to the user's words. Do NOT "upgrade" a small ask into a redesign.
- "theme better / design better / pura theme / site look" → FULL site theme refresh (colors, fonts, hero, sections, buttons, footer). NEVER rewrite as "make header dark premium" unless they said header/dark.
- "apne according / khud se / your choice" continues the LAST user topic from recent chat (theme stays theme; sticky stays sticky). Do not invent a new topic.
- Widget-only asks (back to top, sticky, float place/color) stay as that widget — never expand to header/theme rewrite.
- "colorfull / colourful / rangin / vibrant banao" (with or without footer/header) = make the site (or that part) MORE COLORFUL — richer palette, accents, buttons. NEVER "replace hero banner image". NEVER treat as photo upload.
- If two readings are equally likely → ASK_CLARIFY. A wrong guess is worse than one question.
- Never add "also improve hero/footer/sections" extras they did not mention.
- Never instruct duplicate brand name, second header, or second mobile menu button.

SCOPE RULES (critical):
1) LOCATION ≠ REDESIGN: "header ke right button" = change ONLY that button — do NOT rebuild the whole header.
2) REDESIGN only when they clearly ask to fix/improve/clean/redesign that section ("header theek kro", "nav achha banao").
3) HISTORY: Resolve "ye/usi/usko/baat" from recent chat; keep the same scoped change.
4) MULTI: If they ask A + B, include BOTH — no unrelated extras.
5) PRESERVE: Never invent brand names, phone numbers, or new sections they did not ask for.
6) SCREENSHOT: If a screenshot brief is provided, the crop shows the TARGET UI. Edit THAT. Never invent "replace hero banner image" unless they clearly asked to put a photo on the banner.
7) "center X remove" / "X remove kro" with a text crop → prefer remove/center that visible text — NOT hero.image.

HEADER RULES:
- "header update / theek / fix / acha / redesign / dark / premium" = restyle the WHOLE header bar (bg, nav, CTA look). NEVER shrink this to "CTA text color only" unless the user explicitly said button/CTA/text color.
- "header new / naya header / header banao" = invent a DIFFERENT visual design from the current one (flip light↔dark or change accent). Do NOT reuse the previous dark+gold look if that is already on screen.
- Button/CTA color only when they clearly name button/CTA/text + a color.
- Do NOT treat a site-theme ask as a header-only ask.`,
        },
        {
          role: "user",
          content: `Brand: ${params.brandName}
Mode: ${params.qualityMode || "speed"}
Has screenshot: ${params.hasImages ? "yes" : "no"}
Screenshot brief: ${params.screenshotBrief || "(none)"}
Recent chat:
${historyBlock || "(none)"}
User raw: ${params.message}
Normalized: ${normalized}
Website-edit prompt:`,
        },
      ],
      temperature: 0.05,
      maxTokens: 420,
    });
    let clarified = (ai.text || "")
      .trim()
      .replace(/^```[\s\S]*?```$/g, "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^(instruction|output|result|prompt)\s*:\s*/i, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ");
    clarified = clarified.slice(0, 900);
    const ask = clarified.match(/^ASK_CLARIFY:\s*(.+)$/i);
    if (ask?.[1]) {
      return {
        clarified: normalized,
        clarify: ask[1].trim().slice(0, 400),
        provider: ai.provider,
      };
    }
    if (clarified.length < 8) {
      return { clarified: normalized, provider: ai.provider };
    }
    return { clarified, provider: ai.provider };
  } catch {
    return { clarified: normalized };
  }
}

/** Read user-attached screenshot crop → edit target or clarify question. */
async function readUserScreenshotForEdit(params: {
  message: string;
  brandName: string;
  images: AiImagePart[];
  html: string;
}): Promise<{
  brief: string;
  editPrompt?: string;
  clarify?: string;
  tokensUsed: number;
  provider?: string;
}> {
  const pageText = (params.html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);

  try {
    const ai = await generateAiFromImages({
      preferProvider: "openai",
      temperature: 0.1,
      maxTokens: 450,
      jsonMode: true,
      system: `You help a website builder understand a USER SCREENSHOT CROP.
The image is usually a crop of the live site preview pointing at the thing they want changed — NOT a stock photo to upload onto the site.

Return JSON only:
{
  "visibleText": ["words you can read in the crop"],
  "sectionHint": "header|hero|footer|about|team|services|gallery|contact|unknown",
  "confidence": "high"|"low",
  "editPrompt": "one clear English edit instruction combining user ask + what is in the crop",
  "clarifyQuestion": "if confidence is low OR center+remove conflict OR section unclear, ask which section in short Hinglish+English; else empty string"
}

Rules:
- Match visibleText to page text when possible.
- "center X" / "beech" = center that text/element. "remove/hata/delete X" = remove that text/element.
- If user said BOTH center and remove without clear priority → clarifyQuestion (do not guess).
- NEVER suggest replacing hero/banner with the screenshot image unless user clearly asked banner/hero photo/logo.
- If sectionHint is unknown and confidence low → clarifyQuestion like "Ye kaunsa section hai — header brand name, hero title, ya kuch aur?"`,
      prompt: `Brand: ${params.brandName}
User ask: ${params.message}
Page text (excerpt): ${pageText || "(empty)"}
Analyze the screenshot and return JSON.`,
      images: params.images,
    });

    const raw = (ai.text || "").trim();
    let parsed: {
      visibleText?: string[];
      sectionHint?: string;
      confidence?: string;
      editPrompt?: string;
      clarifyQuestion?: string;
    } = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || raw);
    } catch {
      parsed = {};
    }

    const visible = Array.isArray(parsed.visibleText)
      ? parsed.visibleText.filter(Boolean).slice(0, 8).join(" | ")
      : "";
    const section = String(parsed.sectionHint || "unknown");
    const confidence = String(parsed.confidence || "low").toLowerCase();
    const editPrompt = String(parsed.editPrompt || "").trim().slice(0, 700);
    const clarify = String(parsed.clarifyQuestion || "").trim().slice(0, 400);
    const brief = `section=${section}; confidence=${confidence}; visible=${visible || "(none)"}`;

    const userHasConflict =
      /\b(center|centre|beech)\b/i.test(params.message) &&
      /\b(remove|hata|delete|hide)\b/i.test(params.message);

    if (
      clarify ||
      confidence === "low" ||
      (userHasConflict && !/^(remove|hata|delete)\b/i.test(params.message.trim()))
    ) {
      return {
        brief,
        clarify:
          clarify ||
          (userHasConflict
            ? `"${visible || "Ye text"}" — center karna hai ya remove/hataana? Kaunsa section (header / hero / aur)?`
            : `Screenshot kaunse section ka hai — header, hero, footer, ya aur? Thoda clear batao.`),
        tokensUsed: ai.tokensUsed || 0,
        provider: ai.provider,
      };
    }

    return {
      brief,
      editPrompt: editPrompt || undefined,
      tokensUsed: ai.tokensUsed || 0,
      provider: ai.provider,
    };
  } catch {
    return { brief: "", tokensUsed: 0 };
  }
}

function collectQaIssues(html: string, message: string, previous: string) {
  const issues: string[] = [];
  if (!html || html.length < 400) issues.push("too-short");
  if (/CONTACT\s*:\s*email\s*:/i.test(html)) issues.push("contact-leak");
  if (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\s*\|\s*phone\s*:/i.test(html)
  ) {
    issues.push("contact-leak-pipe");
  }
  if (wantsHeaderFix(message) && headerLooksBroken(extractHeaderBlock(html))) {
    issues.push("header-broken");
  }
  if (
    previous.length > 8000 &&
    html.length < previous.length * 0.3
  ) {
    issues.push("catastrophic-shrink");
  }
  if (htmlLooksSame(html, previous)) issues.push("unchanged");
  // Banner/hero video ask must actually contain a video in hero — no fake "Ho gaya"
  if (
    /(banner|hero).{0,24}video|video.{0,24}(banner|hero)|banner\s*video|video\s*wala\s*(banner|hero)/i.test(
      message || "",
    )
  ) {
    const hasHeroVid =
      (/data-create-ai-hero-video=["']1["']/i.test(html) &&
        /youtube\.com\/embed\//i.test(html)) ||
      (/data-create-ai-hero-banner=["']1["']/i.test(html) &&
        /youtube\.com\/embed\//i.test(html));
    // Stock sample mp4 without YouTube = still treat as missing
    if (!hasHeroVid) {
      issues.push("missing-hero-video");
    }
  }
  // Banner/hero still-image ask — must contain injected hero image layer
  if (
    isHeroBannerImageAsk(message || "") &&
    !/data-create-ai-hero-image=["']1["']/i.test(html)
  ) {
    issues.push("missing-hero-image");
  }
  return issues;
}

function extractHeaderBlock(html: string) {
  const m = (html || "").match(/<header\b[\s\S]*?<\/header>/i);
  return m?.[0] || "";
}

function extractFooterBlock(html: string) {
  const m = (html || "").match(/<footer\b[\s\S]*?<\/footer>/i);
  return m?.[0] || "";
}

/** AI often pastes our prompt line "CONTACT: email: … | phone: …" into the page — strip it. */
function stripContactPromptLeak(html: string) {
  return stripCreateAiContactPromptLeak(html);
}

function wantsFooterChange(message: string) {
  return /footer|copyright|©|copy\s*right|niche|bottom\s*(text|bar|strip)/i.test(
    message || "",
  );
}

/** If user did not ask to touch footer, keep previous footer (+ copyright) intact. */
function preserveFooterUnlessAsked(
  previous: string,
  next: string,
  message: string,
) {
  if (!previous || !next || wantsFooterChange(message)) return next;
  const prevFooter = extractFooterBlock(previous);
  if (!prevFooter) return next;
  if (/<footer\b[\s\S]*?<\/footer>/i.test(next)) {
    return next.replace(/<footer\b[\s\S]*?<\/footer>/i, prevFooter);
  }
  return injectBeforeBodyClose(next, prevFooter);
}

function isSafeHeaderOnly(header: string) {
  if (!header || header.length < 80) return false;
  // AI sometimes wraps whole page in <header> — reject
  if (header.length > 14_000) return false;
  if (/<footer\b|<main\b|<section\b/i.test(header)) return false;
  if (/CONTACT\s*:\s*email\s*:/i.test(header)) return false;
  if (/id=["'](?:home|about|services|gallery|contact)["']/i.test(header)) {
    return false;
  }
  return true;
}

function extractHeaderFragment(text: string) {
  const raw = (text || "").trim();
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced || raw).trim();
  const header = candidate.match(/<header\b[\s\S]*?<\/header>/i)?.[0];
  if (header && isSafeHeaderOnly(header)) return header;
  const fromDoc = extractHtml(candidate);
  const fromHeader = extractHeaderBlock(fromDoc);
  return isSafeHeaderOnly(fromHeader) ? fromHeader : "";
}

function headerLooksBroken(header: string) {
  if (!header) return true;
  const bookCtas = (
    header.match(/book\s+(a\s+)?(private\s+)?(consultation|counsel)/gi) || []
  ).length;
  if (bookCtas >= 2) return true;
  const abs = (header.match(/position\s*:\s*absolute/gi) || []).length;
  if (abs >= 3) return true;
  const buttons = (header.match(/<(?:a|button)\b[^>]*(?:btn|button|cta)/gi) || [])
    .length;
  if (buttons >= 4) return true;
  // Bare "NAVIGATION" + numbered 01/02 stack without real link labels
  if (
    /\bnavigation\b/i.test(header) &&
    /(?:^|>)\s*0[1-9]\s*(?:<|$)/m.test(header) &&
    !/<a\b[^>]*>[^<]{2,40}<\/a>/i.test(header)
  ) {
    return true;
  }
  return false;
}

function spliceHeader(html: string, newHeader: string) {
  if (!html || !newHeader || !/<header\b/i.test(newHeader)) return html;
  if (/<header\b[\s\S]*?<\/header>/i.test(html)) {
    return html.replace(/<header\b[\s\S]*?<\/header>/i, newHeader);
  }
  if (/<body\b[^>]*>/i.test(html)) {
    return html.replace(/<body\b[^>]*>/i, (open) => `${open}\n${newHeader}`);
  }
  return newHeader + html;
}

/** Permanent Create-AI product rules (as of 2026-09-10) — inject into every edit. */
const CREATE_AI_LAWS = `CREATE-AI LAWS (always obey — user must never re-ask):
SCOPE
1) Change ONLY what the user asked. Header ask = header only. Do not touch footer, copyright, hero, or other sections.
2) Never invent a raw dump line like "CONTACT: email:…|phone:…|address:…" or "email@x | phone: … | address: …" in footer/header.
3) Never remove copyright / © unless user explicitly asked. Copyright year must be ${new Date().getFullYear()} (never 2024/2025).
4) Never blank the page or return truncated/unclosed HTML.
5) Preserve real contact values inside the designed Contact section UI only.

HEADER (desktop + tablet + mobile)
6) One bar only: logo/brand left, nav, ONE primary CTA. Optional menu toggle on small screens.
7) align-items:center; justify-content:space-between; gap; flex-wrap:nowrap on the top bar. Solid header background. No empty gap under a floating gold line. Logo/nav/CTA same vertical center.
8) ZERO overlap, ZERO absolute-stack fighting, ZERO duplicate Book/CTA buttons.
9) No email/phone/address clutter in the header.
10) Desktop: horizontal text nav links (Home About Services…). Never a lone "NAVIGATION" label with 01 02 03 04 numbers stacked.
11) Tablet (~820px): same single bar; if links won't fit, hide link row and show ONE design-native menu control that opens a clean panel. Brand + CTA stay on one row, vertically centered with each other.
12) Mobile (~390px): brand + menu (and/or one short CTA). Nothing clipped off the right edge. No horizontal scroll from header.
13) Mobile/tablet menu must be UNIQUE to this design (colors/fonts) — not a bolted-on generic black system hamburger.
14) Keep existing hrefs/#ids when possible.

RESPONSIVE (rest of page)
15) html/body width 100% — not a tiny centered card with huge empty side margins.
16) Under ~900px: section grids stack; images max-width 100%; no horizontal overflow; content not stuck left with empty right.
17) Do not fight header layout with global grid/flex resets.

CHAT QUALITY
18) Actually apply the request so the preview visibly changes — no fake "done".
19) Footer/copyright stay intact on unrelated edits.
20) Floating Call/WA/Email and client slider only when user asks (or already present).
21) Understand Hinglish/Hindi/English/typos — follow the clarified meaning of the ask.`;

async function rewriteHeaderOnly(params: {
  html: string;
  brandName: string;
  message: string;
  contactHint: string;
  /** Invent a creative new look (not the fixed template rebuild). */
  inventNew?: boolean;
  styleSeed?: string;
  /** Speed = Gemini one-shot; Quality = OpenAI one-shot. */
  qualityMode?: "speed" | "quality";
}): Promise<{ html: string; ai?: AiTextResult } | null> {
  const prevHeader = extractHeaderBlock(params.html);
  if (!prevHeader || prevHeader.length < 40) return null;

  const invent = params.inventNew === true;
  const styles = [
    { id: "editorial-cream", seed: "Editorial cream/off-white bar, charcoal serif brand, terracotta PILL CTA labeled 'Book a viewing', thin bottom border" },
    { id: "navy-sky", seed: "Deep navy (#0f172a) bar, white uppercase tracked nav, sky-blue SHARP rectangle CTA 'Talk to us', monogram square mark" },
    { id: "sand-forest", seed: "Warm sand (#f5f0e8) bar, forest-green accents, rounded soft CTA 'Plan visit', elegant Georgia brand, no hard borders" },
    { id: "charcoal-gold", seed: "Charcoal (#111) bar, ivory text, thin gold bottom rule, OUTLINE gold CTA 'Enquire', small gold circle mark" },
    { id: "white-coral", seed: "Bright white bar with soft shadow, black nav, bold coral (#f43f5e) wide pill CTA 'Schedule', heavy letter-spacing" },
    { id: "slate-mint", seed: "Slate-800 bar, mint (#34d399) accent underline on brand, white links, compact mint-filled CTA 'Connect'" },
    { id: "ink-paper", seed: "Near-black ink bar, paper-white text, left vertical accent stripe in amber, minimal text CTA underline style 'Contact'" },
    { id: "blush-navy", seed: "Blush/rose (#fff1f2) bar, navy text, navy outlined CTA 'Get started', rounded brand chip" },
  ];
  const prevStyleId =
    prevHeader.match(/data-cai-hdr-style=["']([^"']+)["']/i)?.[1]?.trim() || "";
  const unused = styles.filter((s) => s.id !== prevStyleId);
  const picked =
    params.styleSeed
      ? { id: "custom", seed: params.styleSeed }
      : unused[Math.floor(Math.random() * unused.length)] ||
        styles[Math.floor(Math.random() * styles.length)];
  const styleSeed = picked.seed;
  const styleId = picked.id;

  const system = invent
    ? `You are a senior brand designer inventing a NEW website header for "${params.brandName}".
Return ONLY one clean <header data-cai-hdr-style="${styleId}" ...>...</header> (optional <style> inside header). No full document. No markdown. No footer.

${CREATE_AI_LAWS}

INVENT RULES (be creative — user wants a real new design, not a color twin):
- Style direction (follow as inspiration, not a rigid template): ${styleSeed}
- MUST change at least FOUR of: background, CTA fill/shape/label, brand mark, typography, border/shadow, OR overall layout (1-row / 2-row centered / split brand panel / pill nav rail). Background-only change = FAIL.
- You MAY invent layout: classic row, centered stack (brand then nav), split ink panel, pill-wrapped nav — still usable, not chaotic.
- Keep: ONE CTA, working nav hrefs/#ids, mobile ☰ (icon only, hide desktop links ≤900px). No second orphan menu under the bar.
- Include data-cai-hdr-style="${styleId}" on <header>.
- Solid or subtle gradient OK; no transparent floating mess over the hero.
- Never show raw "Menu" / "Close" / "Menu Close" as visible page text.`
    : `You fix website headers ONLY for "${params.brandName}".
Return ONLY one clean <header>...</header> (optional <style> inside header). No full document. No markdown. No footer. No contact dump.

${CREATE_AI_LAWS}

HEADER BUILD RECIPE (mandatory):
- Outer header: width 100%; display:flex; align-items:center; justify-content:space-between; gap:12px 20px; flex-wrap:nowrap; padding:16px 24px; box-sizing:border-box; solid background matching the site (not transparent floating over hero).
- NO orphan decorative top/bottom line that leaves empty vertical gap above the logo/nav. If a gold rule is used, it must sit flush as border-top/border-bottom on the header bar itself (0 extra spacer).
- Left cluster: logo/mark + brand text in ONE flex row (align-items:center; gap:10px). Brand text compact — prefer one line; if two lines, line-height:1.15 and still vertically centered with nav/CTA.
- Right cluster: desktop nav links in one horizontal flex row + ONE CTA button, all align-items:center; same vertical center as logo (no CTA higher/lower than brand).
- ONLY one nav row inside header. Never output a second menu under the header. Nav labels once only.
- Even spacing: logo→brand→nav→CTA must look balanced; avoid huge empty middle OR cramped pile against the top edge.
- @media (max-width:900px): hide the desktop link row; show one menu button; keep left brand + right (CTA and/or menu) on ONE row with align-items:center — no staggered heights, no huge empty gap under the bar.
- Menu panel: full-width under header OR design-native drawer; links as real text (Home, About…), not "01","02".
- CTA text must not clip on 390px width — shorten label if needed (e.g. "Book").
- Match colors/fonts from the broken header UNLESS the user asks dark/premium/black/gold — then use deep black (#0a0a0a) header bg, light text, gold/amber CTA accents. The preview MUST visibly change.
- CTA label: short (<=22 chars). Never mash brand+nav into the button.`;

  const user = invent
    ? `USER REQUEST: ${params.message}
CURRENT HEADER (FORBIDDEN to copy look — previous style id: ${prevStyleId || "none"}):
${prevHeader.slice(0, 10_000)}

Invent a completely new <header data-cai-hdr-style="${styleId}"> for this brand.
Style contract: ${styleSeed}
Change CTA label + mark + fonts + bg — not background alone.
Return <header> only.`
    : `USER REQUEST: ${params.message}
BROKEN HEADER TO REPLACE:
${prevHeader.slice(0, 12_000)}

Return the fixed <header> only. Do not change footer/copyright/contact dump. The visual style MUST clearly change if the user asked update/dark/premium/fix.`;

  // Invent/fix: Quality→OpenAI, Speed→Gemini (OpenAI↔Gemini fallback via provider order)
  const quality = params.qualityMode === "quality" ? "quality" : "speed";
  const hdrRoute = createAiHeaderRoute(quality, invent);
  const temperature = invent ? (quality === "quality" ? 0.75 : 0.65) : 0.3;
  const maxTokens = invent ? 3200 : 7000;

  let lastAi = await generateAiText({
    preferProvider: hdrRoute.primary,
    modelTier: hdrRoute.tier,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    maxTokens,
  });

  let nextHeader = extractHeaderFragment(lastAi.text);
  const good = (h: string) =>
    Boolean(h) &&
    isSafeHeaderOnly(h) &&
    !htmlLooksSame(h, prevHeader) &&
    !headerLooksBroken(h);

  // One fast fallback only (keeps latency down)
  if (!good(nextHeader)) {
    const alt =
      unused.filter((s) => s.id !== styleId)[0] ||
      styles[(styles.findIndex((s) => s.id === styleId) + 2) % styles.length];
    lastAi = await generateAiText({
      preferProvider: hdrRoute.fallback,
      modelTier: hdrRoute.tier,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: invent
            ? `${user}\n\nRetry — style: ${alt.seed}. data-cai-hdr-style="${alt.id}". Clean one-row header. No "Menu Close" text visible. Change CTA label + colors.`
            : `${user}\n\nPrevious attempt failed QA. Rebuild a SIMPLE flex header: one row, brand left, nav+one CTA right, proper @media menu, no NAVIGATION/01 stack, no gap, nothing clipped.`,
        },
      ],
      temperature: invent ? 0.7 : 0.25,
      maxTokens: invent ? 2800 : 7000,
    });
    nextHeader = extractHeaderFragment(lastAi.text);
  }

  if (!good(nextHeader) && !invent) {
    lastAi = await generateAiText({
      preferProvider: "openai",
      modelTier: "quality",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${user}\n\nRebuild SIMPLE flex header. One row. One CTA. Header only.`,
        },
      ],
      temperature: 0.25,
      maxTokens: 7000,
    });
    nextHeader = extractHeaderFragment(lastAi.text);
  }

  if (!good(nextHeader)) return null;

  // Stamp style id for next rotation
  if (invent && nextHeader && !/data-cai-hdr-style=/i.test(nextHeader)) {
    nextHeader = nextHeader.replace(
      /<header\b/i,
      `<header data-cai-hdr-style="${styleId}"`,
    );
  }
  // Strip leaked mobile-menu chrome text
  nextHeader = nextHeader
    .replace(/>\s*Menu\s*Close\s*</gi, "><")
    .replace(/>\s*Close\s*Menu\s*</gi, "><")
    .replace(/\bMenu\s*Close\b/gi, "");

  let spliced = spliceHeader(params.html, nextHeader);
  spliced = stripContactPromptLeak(spliced);
  spliced = preserveFooterUnlessAsked(params.html, spliced, params.message);
  // Invent: soft normalize — do NOT flatten AI design to fixed flex template
  spliced = normalizeCreateAiHeaderBar(spliced, {
    preserveDesign: invent,
  });
  if (!spliced || htmlLooksSame(spliced, params.html)) return null;
  return { html: spliced, ai: lastAi };
}

function extractPatches(text: string): Array<{ old: string; new: string }> {
  const raw = (text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced || raw).trim();
  try {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end <= start) return [];
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as {
      patches?: Array<{ old?: string; new?: string }>;
    };
    if (!Array.isArray(parsed.patches)) return [];
    return parsed.patches
      .map((p) => ({
        old: String(p.old || ""),
        new: String(p.new ?? ""),
      }))
      .filter((p) => p.old.length >= 6 && p.old.length <= 5000);
  } catch {
    return [];
  }
}

function applyPatches(html: string, patches: Array<{ old: string; new: string }>) {
  let out = html;
  let applied = 0;
  for (const p of patches.slice(0, 12)) {
    if (!out.includes(p.old)) continue;
    out = out.replace(p.old, p.new);
    applied += 1;
  }
  return { html: out, applied };
}

function injectBeforeBodyClose(html: string, snippet: string) {
  if (!snippet.trim()) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${snippet}\n</body>`);
  }
  return `${html}\n${snippet}`;
}

function wantsBackToTop(message: string) {
  return /back\s*to\s*top|scroll\s*to\s*top|top\s*(pe|par)?\s*(jao|jaaye|button|karo)|upar\s*(jao|button|karo|scroll)|btt\b|top\s*button/i.test(
    message || "",
  );
}

/** User complaining about a mistake — NOT an instruction to delete. */
function isUserComplaint(message: string) {
  const m = message || "";
  return (
    /aisi\s*galti|mat\s*kr|galti\s*mat|galat\s*(hai|kar|kiya)|check\s*kr|missing|bhool|wapis|vapas|restore|lauta|don't\s*(do|remove)|shouldn'?t/i.test(
      m,
    ) ||
    /\b(tune|tumne|you)\b.{0,60}\b(hta|hata|remove|delete|nikal)/i.test(m) ||
    /\b(hta|hata)\s*diya\b/i.test(m)
  );
}

/** Explicit "please remove X" — never treat "tune hata diya" as remove. */
function wantsRemove(message: string) {
  const m = message || "";
  if (isUserComplaint(m)) return false;
  if (/\b(tune|tumne|you)\b.{0,40}\b(hta|hata|remove|delete)/i.test(m)) {
    return false;
  }
  return /\b(remove|delete|hatado|hata\s*do|hatao|hatana|mat\s*dikha|without|hide|nikal\s*do|delete\s*karo|hata\s*karo)\b/i.test(
    m,
  );
}

/** Complaint: AI deleted BTT → restore it. */
function wantsRestoreBackToTop(message: string) {
  const m = message || "";
  if (!wantsBackToTop(m)) return false;
  return (
    isUserComplaint(m) ||
    /\b(tune|tumne|you)\b.{0,50}\b(back\s*to\s*top|btt|top\s*button)/i.test(m) ||
    /back\s*to\s*top.{0,30}(hta|hata|missing|wapis)/i.test(m)
  );
}

function wantsAdd(message: string) {
  return /\badd\b|banao|bana\b|bana\s*do|banado|create|insert|dal\s*do|laga|laga\s*do|naya\b|new\s+(button|section|form|card|footer|header|menu|banner|hero|gallery|faq|map|video|slider)/i.test(
    message || "",
  );
}

/** True chat (any topic) — not a website edit. Reply like Grok, don't touch HTML. */
function isGeneralConversation(message: string) {
  const m = (message || "").trim();
  if (!m) return false;
  if (
    isMicroColorTextAsk(m) ||
    isHeaderButtonLocationAsk(m) ||
    wantsHeaderFix(m) ||
    wantsResponsiveFix(m) ||
    wantsBackToTop(m) ||
    wantsSurgicalPatch(m)
  ) {
    return false;
  }
  // Never treat video/dummy banner asks as chitchat (was inventing "Dummy laga diya")
  if (
    /\b(dummy|demo|sample)\b/i.test(m) ||
    /(banner|hero).{0,28}video|video.{0,28}(banner|hero)|youtube/i.test(m)
  ) {
    return false;
  }
  if (
    /(header|footer|hero|navbar|nav\s*bar|section|button|cta|color|colour|font|image|photo|gallery|whatsapp|float|responsive|mobile\s*view|tablet|layout|design|website|web\s*site|\bsite\b|page\s*(bana|change|fix)|html|css)/i.test(
      m,
    )
  ) {
    return false;
  }
  if (
    /(add|remove|hata|dal|laga|badal|change|update|fix|redesign|banao|banado)\b/i.test(
      m,
    ) &&
    /(button|text|heading|title|menu|footer|header|section|color|image)/i.test(m)
  ) {
    return false;
  }
  // greetings / chitchat / any-topic Q&A
  if (
    /^(hi|hello|hey|namaste|yo|thanks|thank|ok|okay|bye|good\s*morning|good\s*evening|kaise|kya\s*haal|how\s*are)/i.test(
      m,
    )
  ) {
    return true;
  }
  if (m.length <= 240 && !/\b(karo|kro|kardo|kar\s*do|bana\s*do)\b/i.test(m)) {
    return true;
  }
  if (/\?/.test(m) && m.length < 400) return true;
  return false;
}

/** Grok fills placement schema — no million phrase rules. */
async function resolveFloatPlacement(
  message: string,
  html: string,
): Promise<FloatPlacement> {
  const existing = readFloatPlacement(html) || defaultFloatPlacement();
  const local = parseFloatPlacementLocal(message);
  if (local) return local;

  // No position words → keep existing / default
  if (
    !/(left|right|center|centre|middle|top|bottom|upar|neeche|bayi|daayi|beech|side|taraf|jagah|position)/i.test(
      message || "",
    )
  ) {
    return existing;
  }

  try {
    const ai = await generateAiText({
      preferProvider: "gemini",
      modelTier: "fast",
      messages: [
        {
          role: "system",
          content: `User wants to place floating Call/WhatsApp icons on a website.
Return ONLY JSON: {"side":"left"|"center"|"right","vertical":"top"|"center"|"bottom"}
Infer from any language/typos. No markdown.`,
        },
        {
          role: "user",
          content: `Current: ${JSON.stringify(existing)}
User: ${message}
JSON:`,
        },
      ],
      temperature: 0,
      maxTokens: 60,
      jsonMode: true,
    });
    const raw = (ai.text || "").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw) as Partial<FloatPlacement>;
    const side = ["left", "center", "right"].includes(String(parsed.side))
      ? (parsed.side as FloatPlacement["side"])
      : existing.side;
    const vertical = ["top", "center", "bottom"].includes(String(parsed.vertical))
      ? (parsed.vertical as FloatPlacement["vertical"])
      : existing.vertical;
    return { side, vertical };
  } catch {
    return existing;
  }
}

async function replyGeneralChat(params: {
  message: string;
  brandName: string;
  qualityMode: "speed" | "quality";
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AiTextResult> {
  const historyBlock = (params.history || [])
    .slice(-10)
    .map((h) => `${h.role}: ${String(h.content || "").slice(0, 400)}`)
    .join("\n");
  const chatRoute = createAiPlannerRoute(
    params.qualityMode === "quality" ? "quality" : "speed",
  );
  return generateAiText({
    preferProvider: chatRoute.primary,
    modelTier: chatRoute.tier,
    messages: [
      {
        role: "system",
        content: `You are a friendly advanced assistant inside a website builder for "${params.brandName}".
User can talk about ANY topic (not only the website) — answer helpfully, clearly, in their language (Hinglish/Hindi/English OK).
If they later want website changes, briefly say they can ask (e.g. "header fix" / "button white").
Keep replies short-to-medium unless they ask for depth. No HTML unless they ask for code.`,
      },
      {
        role: "user",
        content: `Recent chat:
${historyBlock || "(none)"}

User: ${params.message}`,
      },
    ],
    temperature: 0.7,
    maxTokens: 900,
  });
}

/** Deterministic widget — never full-page rewrite for this. */
function injectBackToTop(html: string) {
  if (!html) return html;
  let out = html
    .replace(/<style[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<button[^>]*id=["']create-ai-btt["'][^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<script[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/script>/gi, "");

  const block = `<style data-create-ai-btt="1">#create-ai-btt{position:fixed;right:18px;bottom:16px;z-index:2147483001;width:46px;height:46px;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:20px;line-height:46px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.28);opacity:.92}#create-ai-btt:hover{opacity:1}</style>
<button type="button" id="create-ai-btt" aria-label="Back to top" title="Back to top">↑</button>
<script data-create-ai-btt="1">(function(){var b=document.getElementById("create-ai-btt");if(!b)return;b.addEventListener("click",function(){try{window.scrollTo({top:0,behavior:"smooth"});}catch(e){window.scrollTo(0,0);}});})();<\/script>`;
  out = injectBeforeBodyClose(out, block);
  return layoutCreateAiRightRail(out);
}

function stripBackToTop(html: string) {
  return (html || "")
    .replace(/<style[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<button[^>]*id=["']create-ai-btt["'][^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<script[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/script>/gi, "");
}

/** Best-effort strip of common floating call/WA widgets. */
function stripFloatingContactWidgets(html: string) {
  return stripCreateAiFloatingWidgets(html);
}

function extractMobileFromHtml(html: string) {
  const tel = html.match(/href=["']tel:([^"']+)["']/i)?.[1];
  if (tel) return tel.replace(/\D/g, "");
  const wa = html.match(/wa\.me\/(\d{8,15})/i)?.[1];
  if (wa) return wa;
  return "";
}

/**
 * Apply obvious remove requests without AI when we can — then fall through if more needed.
 */
function applyDeterministicRemoves(html: string, message: string) {
  if (!wantsRemove(message)) return { html, changed: false, note: "" };
  let out = html;
  const notes: string[] = [];
  if (wantsBackToTop(message)) {
    const next = stripBackToTop(out);
    if (next !== out) {
      out = next;
      notes.push("back-to-top");
    }
  }
  if (/float|whatsapp|whats\s*app|\bwa\b|call button|phone button|floating/i.test(message)) {
    const next = stripFloatingContactWidgets(out);
    if (next !== out) {
      out = next;
      notes.push("floating contact");
    }
  }
  return {
    html: out,
    changed: notes.length > 0 && out !== html,
    note: notes.join(", "),
  };
}

/** If AI dropped header/footer/BTT/floats without being asked, restore from previous HTML. */
function preserveStructuralChrome(
  previous: string,
  next: string,
  message: string,
) {
  if (!previous || !next) return next;
  const m = message || "";
  const mayDropFooter =
    wantsRemove(m) &&
    /footer/i.test(m) &&
    !isUserComplaint(m);
  const mayDropHeader =
    wantsRemove(m) &&
    /header/i.test(m) &&
    !isUserComplaint(m);
  const mayDropBtt =
    wantsRemove(m) && wantsBackToTop(m) && !isUserComplaint(m);

  let out = next;
  if (!mayDropFooter) {
    const prevFooter = previous.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0];
    if (prevFooter && !/<footer\b/i.test(out)) {
      out = injectBeforeBodyClose(out, prevFooter);
    }
  }
  if (!mayDropHeader) {
    const prevHeader = previous.match(/<header\b[\s\S]*?<\/header>/i)?.[0];
    if (prevHeader && !/<header\b/i.test(out)) {
      out = /<body\b[^>]*>/i.test(out)
        ? out.replace(/<body\b[^>]*>/i, (open) => `${open}\n${prevHeader}`)
        : `${prevHeader}\n${out}`;
    }
  }
  // Never silently kill back-to-top when adding floats / other edits
  const hadBtt =
    /id=["']create-ai-btt["']/i.test(previous) ||
    /data-create-ai-btt=["']1["']/i.test(previous);
  if (hadBtt && !mayDropBtt && !/id=["']create-ai-btt["']/i.test(out)) {
    out = injectBackToTop(out);
  }
  return out;
}

function injectApprovedImages(html: string, urls: string[]) {
  if (!urls.length) return html;
  const imgs = urls
    .slice(0, 4)
    .map(
      (u, i) =>
        `<img src="${u}" alt="Gallery ${i + 1}" loading="lazy" style="width:100%;height:220px;object-fit:cover;border-radius:14px;display:block" />`,
    )
    .join("");
  const band = `<section data-create-ai-api-images="1" style="padding:40px 24px;max-width:1100px;margin:0 auto"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">${imgs}</div></section>`;
  let out = html.replace(
    /<section\b[^>]*data-create-ai-api-images=["']1["'][^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  if (/id=["']gallery["']/i.test(out)) {
    return out.replace(
      /(<[^>]+id=["']gallery["'][^>]*>)/i,
      `$1${band}`,
    );
  }
  return injectBeforeBodyClose(out, band);
}

function stashInlineImages(html: string) {
  const stash: string[] = [];
  const push = (dataUrl: string) => {
    const i = stash.length;
    stash.push(dataUrl);
    return `__CAI_IMG_${i}__`;
  };

  let out = html.replace(
    /src\s*=\s*(["'])(data:image\/[^"']+)\1/gi,
    (_m, q: string, dataUrl: string) => `src=${q}${push(dataUrl)}${q}`,
  );
  out = out.replace(
    /url\(\s*(['"]?)(data:image\/[^)"']+)\1\s*\)/gi,
    (_m, q: string, dataUrl: string) => `url(${q}${push(dataUrl)}${q})`,
  );
  return { html: out, stash };
}

function restoreInlineImages(html: string, stash: string[]) {
  let out = html;
  for (let i = 0; i < stash.length; i += 1) {
    const token = `__CAI_IMG_${i}__`;
    if (out.includes(token)) out = out.split(token).join(stash[i]);
  }
  return out;
}

function normalizeImages(raw: ChatBody["images"]): AiImagePart[] {
  if (!Array.isArray(raw)) return [];
  const out: AiImagePart[] = [];
  for (const item of raw.slice(0, 2)) {
    const mimeType = (item?.mimeType || "image/jpeg").trim().toLowerCase();
    let base64 = (item?.base64 || "").trim();
    if (!base64) continue;
    const dataMatch = base64.match(/^data:([^;]+);base64,(.+)$/i);
    if (dataMatch) base64 = dataMatch[2];
    if (!base64 || base64.length < 32) continue;
    if (!mimeType.startsWith("image/")) continue;
    if (base64.length > 1_200_000) continue;
    out.push({ mimeType, base64 });
  }
  return out;
}

function ok(
  next: string,
  reply: string,
  ai?: Partial<AiTextResult>,
  mode?: string,
  previousHtml?: string,
  extra?: { logoImage?: string },
) {
  // Stash data: URLs so contact-leak regex cannot chew through base64 logos.
  const { html: lean, stash } = stashInlineImages(next || "");
  let clean = restoreInlineImages(stripContactPromptLeak(lean), stash);

  const logoDeterministicOk =
    mode === "logo-set" &&
    /data-create-ai-logo=["']1["']/i.test(next || "") &&
    /<html\b/i.test(next || "") &&
    /<body\b/i.test(next || "") &&
    (next || "").length >= 400;

  const heroImageDeterministicOk =
    mode === "hero-image" &&
    /data-create-ai-hero-image=["']1["']/i.test(next || "") &&
    /<html\b/i.test(next || "") &&
    /<body\b/i.test(next || "") &&
    (next || "").length >= 400;

  // Never ship broken docs that blank the iframe (e.g. `"html`)
  if (previousHtml && !isValidSiteHtml(clean, previousHtml)) {
    if (logoDeterministicOk || heroImageDeterministicOk) {
      // Prefer raw deterministic patch over a strip pass that corrupted attrs
      clean = next || clean;
    } else {
      return NextResponse.json({
        html: previousHtml,
        reply:
          "AI ne broken HTML bheja — pehla preview safe rakha. Phir se short request try karo.",
        provider: ai?.provider || "xai",
        model: ai?.model || "",
        tokensUsed: ai?.tokensUsed || 0,
        applied: false,
        mode: "rejected-invalid",
      });
    }
  }
  const changed =
    !previousHtml || !htmlLooksSame(clean, previousHtml);
  const applied =
    mode !== "unchanged" &&
    mode !== "recover" &&
    mode !== "rejected-invalid" &&
    mode !== "general-chat" &&
    (mode === "logo-set" || mode === "hero-image" || changed);
  return NextResponse.json({
    html: clean,
    reply,
    provider: ai?.provider || "xai",
    model: ai?.model || "",
    tokensUsed: ai?.tokensUsed || 0,
    applied,
    mode: mode || "ok",
    ...(extra?.logoImage ? { logoImage: extra.logoImage } : {}),
  });
}

export async function POST(req: Request) {
  let html = "";
  try {
    const body = (await req.json()) as ChatBody;
    html = (body.html || "").trim();
    const message = (body.message || "").trim();
    const brandName = (body.brandName || "Brand").trim();
    let images = normalizeImages(body.images);
    // Respect onboarding top-bar pref — never re-inject contact strip every chat
    const wantTopBar =
      body.topBar === true ||
      wantsTopBarOnlyFix((body.message || "").trim());

    if (!message && images.length === 0) {
      return NextResponse.json(
        { error: "Message or screenshot required" },
        { status: 400 },
      );
    }
    if (!html) {
      return NextResponse.json({ error: "Current HTML required" }, { status: 400 });
    }
    if (!hasAnyAiKey()) {
      return NextResponse.json(
        { error: "No AI API key configured in .env.local" },
        { status: 503 },
      );
    }

    const contactHint = [
      body.email ? `email: ${body.email}` : "",
      body.mobile ? `phone: ${body.mobile}` : "",
      body.address ? `address: ${body.address}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const rawMessage =
      message ||
      "Use the attached screenshot(s) as visual reference and apply the change.";
    const normalizedMessage = normalizeChatLanguage(rawMessage);
    const qualityModeEarly =
      body.qualityMode === "quality" ? "quality" : "speed";

    // Always convert user chat → clear English edit PROMPT before planner/editor AI.
    // Quality: every ask. Speed: Hinglish/short/messy only (keeps Speed fast on clean English).
    let effectiveMessage = normalizedMessage;
    let screenshotBrief = "";
    const historyBlob = (body.history || [])
      .slice(-8)
      .map((h) => String(h.content || ""))
      .join("\n");
    const colorFromHistory =
      extractNamedOrHexColor(historyBlob) || "white";
    // ALWAYS prefer color named in THIS message (yellow/red/#hex) over chat history white/etc.
    const colorFromAsk =
      extractNamedOrHexColor(rawMessage) ||
      extractNamedOrHexColor(normalizedMessage) ||
      colorFromHistory;

    // User screenshot: vision-read first — never guess hero banner from a text crop
    if (
      images.length > 0 &&
      !isLogoReplaceAsk(rawMessage) &&
      !isLogoReplaceAsk(normalizedMessage) &&
      !(
        isHeroBannerImageAsk(rawMessage) ||
        isHeroBannerImageAsk(normalizedMessage)
      )
    ) {
      const shot = await readUserScreenshotForEdit({
        message: rawMessage,
        brandName,
        images,
        html,
      });
      screenshotBrief = shot.brief;
      if (shot.clarify) {
        return ok(
          html,
          shot.clarify,
          {
            provider: (shot.provider || "none") as AiTextResult["provider"],
            model: "",
            tokensUsed: shot.tokensUsed || 0,
          },
          "screenshot-clarify",
          html,
        );
      }
      if (shot.editPrompt && shot.editPrompt.length > 8) {
        effectiveMessage = shot.editPrompt;
      }
    }

    if (
      isHeaderButtonLocationAsk(rawMessage) ||
      isHeaderButtonLocationAsk(normalizedMessage)
    ) {
      effectiveMessage =
        localClarifyMicroAsk(
          `header right side button text ${colorFromAsk}`,
        ) ||
        `Change ONLY the header right-side CTA button text color to ${colorFromAsk}. Do not rebuild the header.`;
    } else if (!(screenshotBrief && effectiveMessage !== normalizedMessage)) {
      const microLocal =
        localClarifyMicroAsk(rawMessage) ||
        localClarifyMicroAsk(normalizedMessage);
      if (microLocal) {
        effectiveMessage = microLocal;
      } else if (
        qualityModeEarly === "quality" ||
        messageNeedsIntentAI(rawMessage) ||
        messageNeedsIntentAI(normalizedMessage) ||
        images.length > 0
      ) {
        const interpreted = await interpretUserIntent({
          message: rawMessage,
          brandName,
          history: body.history,
          qualityMode: qualityModeEarly,
          hasImages: images.length > 0,
          screenshotBrief: screenshotBrief || undefined,
        });
        if (interpreted.clarify) {
          return ok(
            html,
            interpreted.clarify,
            {
              provider: (interpreted.provider ||
                "none") as AiTextResult["provider"],
              model: "",
              tokensUsed: 0,
            },
            "intent-clarify",
            html,
          );
        }
        effectiveMessage = interpreted.clarified || normalizedMessage;
        // Anti-random: never let intent invent header-only when user meant site theme
        if (
          (wantsSiteThemeRefresh(rawMessage) ||
            wantsSiteThemeRefresh(normalizedMessage) ||
            isSiteThemeContinueAsk(rawMessage, historyBlob) ||
            isSiteThemeContinueAsk(normalizedMessage, historyBlob)) &&
          /header/i.test(effectiveMessage) &&
          !/\b(header|heder|nav)\b/i.test(`${rawMessage}\n${normalizedMessage}`) &&
          !/full\s*site|whole\s*site|site\s*theme|theme\s*refresh|entire\s*(site|page|theme)/i.test(
            effectiveMessage,
          )
        ) {
          effectiveMessage =
            "Refresh the FULL site theme (colors, typography, hero, sections, buttons, footer) so the page looks clearly better. Do NOT only restyle the header. Keep one brand name and one mobile menu button.";
        }
      } else {
        effectiveMessage = normalizedMessage || rawMessage;
      }
    }
    // Never let intent invent hero banner when user sent a UI screenshot edit
    if (
      images.length > 0 &&
      isScreenshotUiEditAsk(`${rawMessage}\n${normalizedMessage}`) &&
      isHeroBannerImageAsk(effectiveMessage) &&
      !isHeroBannerImageAsk(rawMessage) &&
      !isHeroBannerImageAsk(normalizedMessage)
    ) {
      effectiveMessage =
        `Using the attached screenshot crop as the target: ${normalizedMessage}. ` +
        `Edit that visible text/UI only. Do NOT replace the hero banner image.`;
    }
    const matchBlob = `${normalizedMessage}\n${effectiveMessage}\n${rawMessage}`;
    const matchEarly = matchBlob;

    // Speed + button/float color: ignore screenshot BEFORE planner (was inventing "Home")
    const qualityModeGuess =
      body.qualityMode === "quality" ? "quality" : "speed";
    if (
      qualityModeGuess === "speed" &&
      (isMicroColorTextAsk(rawMessage) ||
        isMicroColorTextAsk(normalizedMessage) ||
        isMicroColorTextAsk(effectiveMessage) ||
        (/\b(button|btn|cta)\b/i.test(rawMessage) &&
          /color|rang|#|black|white|text/i.test(rawMessage)) ||
        (/float|floating|whatsapp/i.test(rawMessage) &&
          /color|rang|red|blue|theme/i.test(rawMessage)))
    ) {
      images = [];
    }

    // Footer polish BEFORE planner — never invent Contact→black
    {
      const foot =
        parseFooterImproveAsk(rawMessage) ||
        parseFooterImproveAsk(normalizedMessage);
      if (foot) {
        const next = stripDuplicateContactStrips(
          normalizeCreateAiHeaderBar(
            ensureCreateAiResponsive(
              polishCreateAiFooter(html, brandName, {
                email: body.email,
                mobile: body.mobile,
                address: body.address,
              }),
            ),
          ),
        );
        return ok(
          next,
          "Footer polish — preview check karo.",
          undefined,
          "footer-polish",
          html,
        );
      }
    }

    // === Action planner (schema + AI) — uses clarified prompt, keeps raw for Hinglish matches ===
    {
      const imageDataUrl =
        images[0] && images[0].base64
          ? `data:${images[0].mimeType || "image/png"};base64,${images[0].base64}`
          : "";
      const plan = await planChatActions({
        message: effectiveMessage,
        rawMessage,
        brandName,
        qualityMode: qualityModeEarly,
        history: body.history,
        hasImages: images.length > 0,
        html,
      });
      const executed = executeChatActions(plan.actions, {
        html,
        brandName,
        mobile: body.mobile,
        email: body.email,
        address: body.address,
        message: matchBlob,
        hasImages: images.length > 0,
        imageDataUrl,
      });
      if (executed.replyOnly && !executed.needsAiEdit && executed.html === html) {
        return ok(
          html,
          executed.replyOnly,
          {
            provider: plan.provider as AiTextResult["provider"],
            model: plan.model,
            tokensUsed: plan.tokensUsed,
          },
          "general-chat",
          html,
        );
      }
      if (
        !executed.needsAiEdit &&
        executed.notes.length > 0 &&
        !htmlLooksSame(executed.html, html)
      ) {
        return ok(
          executed.html,
          `${executed.notes.join(" + ")}. Preview check karo.`,
          {
            provider: plan.provider as AiTextResult["provider"],
            model: plan.model,
            tokensUsed: plan.tokensUsed,
          },
          executed.logoImage ? "logo-set" : "action-plan",
          html,
          executed.logoImage ? { logoImage: executed.logoImage } : undefined,
        );
      }
      // Sticky / schema already applied (idempotent) — never fall to free AI rewrite
      if (
        !executed.needsAiEdit &&
        executed.notes.some((n) => /sticky|unsticky|back-to-top|float/i.test(n))
      ) {
        return ok(
          executed.html,
          `${executed.notes.join(" + ")}. Preview check karo.`,
          {
            provider: plan.provider as AiTextResult["provider"],
            model: plan.model,
            tokensUsed: plan.tokensUsed,
          },
          "action-plan",
          html,
        );
      }
      // else fall through to legacy / full AI paths
    }

    // Hard fallback: rename "fff to Abhishek" OR logo ke baad name (never history-polluted matchBlob)
    {
      const brandAsk =
        parseBrandRenameAsk(rawMessage, { brandName, html }) ||
        parseBrandRenameAsk(normalizedMessage, { brandName, html }) ||
        parseBrandLabelAsk(rawMessage, brandName) ||
        parseBrandLabelAsk(normalizedMessage, brandName) ||
        (isBrandLabelAsk(rawMessage) || isBrandLabelAsk(normalizedMessage)
          ? { type: "brand.label" as const, name: brandName }
          : null);
      if (brandAsk) {
        const name = (brandAsk.name || brandName).trim();
        const logoSrc = extractCreateAiLogoSrc(html);
        let next = ensureCreateAiHeaderBrand(html, name, logoSrc || undefined);
        next = stripDuplicateContactStrips(
          normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next)),
        );
        next = ensureCreateAiHeaderBrand(next, name, logoSrc || undefined);
        if (createAiHeaderHasBrandLabel(next, name)) {
          return ok(
            next,
            name.toLowerCase() !== (brandName || "").toLowerCase()
              ? `Brand name "${name}" update — preview check karo.`
              : `"${name}" logo ke baad add ho gaya. Preview check karo.`,
            undefined,
            "brand-label",
            html,
          );
        }
        return ok(
          html,
          "Name apply nahi dikha — Edit mode band karke dubara try karo.",
          undefined,
          "unchanged",
          html,
        );
      }
    }

    // Hard fallback: logo image + ask even if planner missed
    if (
      (images.length > 0 && isLogoReplaceAsk(matchBlob)) ||
      isDuplicateLogoComplaint(matchBlob)
    ) {
      const attached =
        images[0] && images[0].base64
          ? `data:${images[0].mimeType || "image/png"};base64,${images[0].base64}`
          : "";
      const fromHtml = extractCreateAiLogoSrc(html);
      const complaint = isDuplicateLogoComplaint(matchBlob);
      const src = complaint
        ? fromHtml || attached
        : attached || fromHtml;
      if (!src) {
        return ok(
          html,
          "Logo image attach karo (sirf logo), phir “ye logo laga do” likho.",
          undefined,
          "unchanged",
          html,
        );
      }
      let next = dedupeHeaderBrandLogo(html, src, brandName);
      next = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next)),
      );
      next = dedupeHeaderBrandLogo(next, src, brandName);
      if (/data-create-ai-logo=["']1["']/i.test(next)) {
        return ok(
          next,
          complaint
            ? "Duplicate logo hata diya — ab header pe ek hi logo hai. Preview check karo."
            : "Header pe aapka logo laga diya (ek hi). Preview check karo.",
          undefined,
          "logo-set",
          html,
          { logoImage: src },
        );
      }
      return ok(
        html,
        "Logo apply nahi hua — pehle “header fix” bolo, phir logo image dubara bhejo.",
        undefined,
        "unchanged",
        html,
      );
    }

    // Hard fallback: banner/hero still image even if planner missed
    if (images.length > 0 && isHeroBannerImageAsk(matchBlob)) {
      const src = images[0]?.base64
        ? `data:${images[0].mimeType || "image/jpeg"};base64,${images[0].base64}`
        : "";
      if (!src) {
        return ok(
          html,
          "Banner/hero image attach karo, phir likho “banner pe ye image laga do”.",
          undefined,
          "unchanged",
          html,
        );
      }
      if (src.length > 350_000) {
        return ok(
          html,
          "Banner image thodi badi hai — chhoti JPG attach karke dubara try karo.",
          undefined,
          "unchanged",
          html,
        );
      }
      const applied = applyCreateAiHeroImage(html, src);
      if (applied.ok && !htmlLooksSame(applied.html, html)) {
        let next = stripDuplicateContactStrips(applied.html);
        next = normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next));
        return ok(
          next,
          "Hero/banner pe aapki image laga di — preview check karo.",
          undefined,
          "hero-image",
          html,
        );
      }
      return ok(
        html,
        "Hero/banner section nahi mila — pehle “header fix” try karo, phir banner image dubara bhejo.",
        undefined,
        "unchanged",
        html,
      );
    }

    // Hero / banner video — YouTube URL, OR explicit "dummy lga do"
    if (
      !images.length &&
      (/(banner|hero).{0,28}video|video.{0,28}(banner|hero)|banner\s*video|video\s*wala\s*(banner|hero|karo|kr)|hero\s*(ko\s*)?video|video\s*banner|youtube/i.test(
        matchBlob,
      ) ||
        /^\s*(dummy|demo|sample)\s*(lga|laga|dal|do|karo|video)?/i.test(
          rawMessage.trim(),
        ))
    ) {
      const applied = applyCreateAiHeroVideoBanner(
        html,
        brandName,
        matchBlob,
      );
      if (applied.needsUrl) {
        const cleaned = applyCreateAiHeroVideoBanner(html, brandName, "").html;
        return ok(
          stripDuplicateContactStrips(cleaned),
          "Banner video ke liye YouTube link bhejo — ya likho “dummy laga do” (sirf tab demo video chalega).",
          undefined,
          "hero-video-need-url",
          html,
        );
      }
      if (applied.ok && !htmlLooksSame(applied.html, html)) {
        let next = stripDuplicateContactStrips(applied.html);
        next = normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next));
        const isDummy = /\b(dummy|demo|sample)\b/i.test(matchBlob);
        return ok(
          next,
          isDummy
            ? "Dummy YouTube video hero pe laga diya (muted autoplay). Preview check karo — apna link bhejo to replace ho jayega."
            : "Hero banner pe aapka YouTube video laga diya (muted autoplay). Preview check karo.",
          undefined,
          "hero-video-banner",
          html,
        );
      }
      if (applied.ok) {
        return ok(
          stripDuplicateContactStrips(applied.html),
          "Video pehle se hero pe hai. Naya YouTube link bhejo to replace hoga.",
          undefined,
          "hero-video-already",
          html,
        );
      }
    }

    // Any-topic chat (Grok.com style) — don't rewrite the site
    if (
      !images.length &&
      isGeneralConversation(rawMessage) &&
      isGeneralConversation(normalizedMessage)
    ) {
      const talk = await replyGeneralChat({
        message: rawMessage,
        brandName,
        qualityMode: qualityModeEarly,
        history: body.history,
      });
      return ok(
        html,
        (talk.text || "Haan bolo — website edit chahiye to seedha likho.").slice(
          0,
          4000,
        ),
        talk,
        "general-chat",
        html,
      );
    }

    // Speed + float color / micro: images already cleared above before planner
    if (
      qualityModeGuess === "speed" &&
      (isMicroColorTextAsk(rawMessage) ||
        isMicroColorTextAsk(normalizedMessage) ||
        isMicroColorTextAsk(effectiveMessage) ||
        (/float|floating|whatsapp/i.test(rawMessage) &&
          /color|rang|red|blue|theme/i.test(rawMessage)))
    ) {
      images = [];
    }

    const wantsPhotoFill =
      /image|images|img|photo|photos|portrait|tasveer|pic\b|picture|gallery|tasveeren|images?\s*(add|laga|dal)/i.test(
        matchBlob,
      );
    const wantsFloatUi =
      /float|whatsapp|whats\s*app|\bwa\b|call button|phone button|floating|neeche\s*(call|phone|whatsapp)|call\s*(icon|button)|whatsapp\s*(icon|button|laga)|duplicate\s*(whatsapp|wa|float)|two\s*(whatsapp|wa|float)|do\s*(whatsapp|wa)|double\s*(whatsapp|wa)|float.{0,40}(left|right|center|side)/i.test(
        matchBlob,
      );
    const wantsEmailFloat =
      /(?:email|mail|gmail|mailto).*(?:icon|button|float|add|laga|dal)|(?:icon|button|float|add|laga|dal|ek\s*aur|one\s*more).*(?:email|mail|gmail)|email\s*icon|mail\s*icon/i.test(
        matchBlob,
      ) ||
      (/email|mail|gmail/i.test(matchBlob) &&
        (/data-create-ai-float=["']1["']/i.test(html) || wantsFloatUi));
    const removeIntent = wantsRemove(matchBlob);

    // Complaint "tune back to top hata diya" → RESTORE, never delete again
    if (!images.length && wantsRestoreBackToTop(matchBlob)) {
      return ok(
        injectBackToTop(html),
        "Sorry — galti thi. Back-to-top wapas laga diya. Aage add karte waqt existing buttons nahi hataunga.",
        undefined,
        "restore-btt",
        html,
      );
    }

    // Instant color/text (e.g. "button text white kro") — before slow AI
    // NEVER steal "header update / dark premium / header theek" into CTA-only color.
    if (
      !images.length &&
      !removeIntent &&
      !wantsHeaderFix(rawMessage) &&
      !wantsHeaderFix(normalizedMessage) &&
      !wantsDarkPremiumHeader(matchBlob)
    ) {
      const microSeed =
        isHeaderButtonLocationAsk(rawMessage) ||
        isHeaderButtonLocationAsk(normalizedMessage)
          ? `header right side button text ${colorFromAsk}`
          : matchBlob;
      const microHtml =
        applyDeterministicTextColor(html, microSeed) ||
        applyDeterministicTextColor(html, rawMessage) ||
        applyDeterministicTextColor(html, effectiveMessage);
      if (microHtml && !htmlLooksSame(microHtml, html)) {
        return ok(
          microHtml,
          /\bbutton|cta|btn|header\b/i.test(microSeed)
            ? "Header CTA button text color update — sirf button, header rebuild nahi. Preview check karo."
            : "Text color update — preview check karo.",
          undefined,
          "micro-color",
          html,
        );
      }
    }

    // Multi-intent quick fixes (e.g. "two whatsapp + back to top")
    {
      let working = html;
      const notes: string[] = [];
      const hadBtt =
        /id=["']create-ai-btt["']/i.test(html) ||
        /data-create-ai-btt=["']1["']/i.test(html);
      if (wantsBackToTop(matchBlob) && !images.length && !removeIntent) {
        working = injectBackToTop(working);
        notes.push("Back to top (right side, above Call/WA stack)");
      }
      if (
        (wantsFloatUi || wantsEmailFloat) &&
        !removeIntent &&
        !images.length &&
        !/section|team|hero|footer|header|gallery|about|slider|carousel/i.test(
          matchBlob,
        )
      ) {
        const mobile =
          (body.mobile || "").trim() || extractMobileFromHtml(working) || "";
        const email =
          (body.email || "").trim() ||
          working.match(/mailto:([^"'?\s]+)/i)?.[1] ||
          "";
        const alreadyEmail =
          /data-create-ai-float-email=["']1["']/i.test(working) ||
          /data-create-ai-float=["']1["'][\s\S]*?mailto:/i.test(working);
        const includeEmail = wantsEmailFloat || alreadyEmail;
        if (
          mobile.replace(/\D/g, "").length >= 8 ||
          (includeEmail && email.includes("@"))
        ) {
          const placement = await resolveFloatPlacement(matchBlob, working);
          working = injectFloatingContact(
            working,
            { mobile, email },
            {
              includeEmail: includeEmail && email.includes("@"),
              placement,
            },
          );
          // Float inject must NOT wipe existing back-to-top
          if (hadBtt || wantsBackToTop(matchBlob)) {
            working = injectBackToTop(working);
          }
          notes.push(
            `Call + WhatsApp → ${placement.side}/${placement.vertical} (BTT safe)`,
          );
        }
      }
      if (
        notes.length > 0 &&
        !wantsHeaderFix(matchBlob) &&
        !/add .{0,20}(team|faq|pricing|testimonial|map|video|timeline|slider)/i.test(
          matchBlob,
        )
      ) {
        return ok(
          working,
          `${notes.join(" + ")}. Preview check karo.`,
          undefined,
          "multi-quick",
          html,
        );
      }
      if (notes.length) html = working;
    }

    // Reliable widgets — client slider + sections (float/BTT already multi-quick above)
    if (
      /client\s*slider|logo\s*slider|brand\s*slider|client\s*logo|clients?\s*carousel|logo\s*carousel|testimonial\s*slider|client\s*(dal|laga|add|bana)|clients?\s*(add|dal)/i.test(
        matchEarly,
      ) &&
      !removeIntent &&
      !images.length
    ) {
      const out = injectClientSlider(html, brandName);
      return ok(
        out,
        "Client slider add ho gaya — Contact se pehle scroll karke dekho (moving client names).",
        undefined,
        "client-slider",
        html,
      );
    }

    if (
      /\b(add|banao|bana do|banado|dal|dal do|laga|laga do|karo|kar do|insert)\b.{0,50}\bteam\b|\bteam\s*section\b|\blog(on)?\s*(add|dal)|members?\s*(add|dal)/i.test(
        matchEarly,
      ) &&
      !removeIntent &&
      !images.length
    ) {
      return ok(
        injectTeamSection(html, brandName),
        "Team section add ho gaya — Contact se pehle scroll karke dekho.",
        undefined,
        "section-team",
        html,
      );
    }

    if (
      /\b(add|banao|bana do|banado|dal|dal do|laga|laga do|karo|insert)\b.{0,50}\bfaq\b|\bfaq\s*section\b|questions?\s*section|sawal\s*(jawab|section)/i.test(
        matchEarly,
      ) &&
      !removeIntent &&
      !images.length
    ) {
      return ok(
        injectFaqSection(html, brandName),
        "FAQ section add ho gaya — preview mein scroll karke dekho.",
        undefined,
        "section-faq",
        html,
      );
    }

    if (
      /\b(add|banao|bana do|banado|dal|dal do|laga|laga do|karo|insert)\b.{0,50}\bpric(e|ing)\b|\bpricing\s*section\b|\bplans?\s*section\b|price\s*(list|dal|add)/i.test(
        matchEarly,
      ) &&
      !removeIntent &&
      !images.length
    ) {
      return ok(
        injectPricingSection(html, brandName),
        "Pricing section add ho gaya — preview mein scroll karke dekho.",
        undefined,
        "section-pricing",
        html,
      );
    }

    if (
      /\b(add|banao|bana do|banado|dal|dal do|laga|laga do|karo|insert)\b.{0,50}\b(testimonial|review|client\s*voice)\b|\btestimonials?\s*section\b|reviews?\s*(add|dal)|client\s*kahte/i.test(
        matchEarly,
      ) &&
      !removeIntent &&
      !images.length
    ) {
      return ok(
        injectTestimonialsSection(html, brandName),
        "Testimonials section add ho gaya.",
        undefined,
        "section-testimonials",
        html,
      );
    }

    if (
      /\b(add|banao|bana do|banado|dal|dal do|laga|laga do|karo|insert)\b.{0,50}\b(map|location|google\s*map)\b|\bmap\s*section\b|location\s*(dal|add)|map\s*(dal|laga)/i.test(
        matchEarly,
      ) &&
      !removeIntent &&
      !images.length
    ) {
      return ok(
        injectMapSection(html, body.address),
        "Map section add ho gaya.",
        undefined,
        "section-map",
        html,
      );
    }

    if (
      /\b(add|banao|bana do|banado|dal|dal do|laga|laga do|karo|insert)\b.{0,50}\b(video|youtube|film)\b|\bvideo\s*section\b|youtube\s*(dal|laga)|video\s*(dal|laga)/i.test(
        matchEarly,
      ) &&
      !/(banner|hero).{0,20}video|video.{0,20}(banner|hero)/i.test(matchEarly) &&
      !removeIntent &&
      !images.length
    ) {
      return ok(
        injectVideoSection(html, brandName),
        "Video section add ho gaya — YouTube URL change chat se kar sakte ho.",
        undefined,
        "section-video",
        html,
      );
    }



    if (
      /\b(add|banao|bana do|banado|dal|dal do|laga|laga do|karo|insert)\b.{0,50}\b(timeline|process|steps?)\b|\b(timeline|process)\s*section\b|kaise\s*kaam|process\s*(dal|add)/i.test(
        matchEarly,
      ) &&
      !removeIntent &&
      !images.length
    ) {
      return ok(
        injectTimelineSection(html, brandName),
        "Process / timeline section add ho gaya.",
        undefined,
        "section-timeline",
        html,
      );
    }

    if (removeIntent && !images.length) {
      const det = applyDeterministicRemoves(html, matchEarly);
      if (det.changed && !/section|team|hero|gallery|about|footer|header/i.test(matchEarly)) {
        return ok(
          det.html,
          `Hata diya: ${det.note}.`,
          undefined,
          "deterministic-remove",
          html,
        );
      }
      if (det.changed) html = det.html;
    }

    if (
      wantsResponsiveFix(matchEarly) &&
      !wantsHeaderFix(matchEarly) &&
      !images.length
    ) {
      const patched = normalizeCreateAiHeaderBar(ensureCreateAiResponsive(html));
      return ok(
        patched,
        "Responsive shell fix laga diya — Desktop full width, Tablet/Mobile pe grids stack + no side empty strip. Preview check karo.",
        undefined,
        "responsive-shell",
        html,
      );
    }

    // effectiveMessage / matchBlob already set (ChatGPT-style clarify ran when needed)

    const approvedImageUrls = wantsPhotoFill
      ? await withTimeout(
          fetchCreateAiImageUrls({
            category: (body.category || "Business").trim(),
            brandName,
            need: 6,
          }),
          4500,
          [] as string[],
        )
      : [];

    const { html: leanHtml, stash } = stashInlineImages(html);
    const clippedHtml =
      leanHtml.length > 90_000
        ? `${leanHtml.slice(0, 90_000)}\n<!-- truncated -->`
        : leanHtml;

    let lastAi: AiTextResult | undefined;

    // Header sticky — hard fallback (never free-AI rewrite that orphans nav)
    if (
      !images.length &&
      /\bsticky\b/i.test(matchBlob) &&
      (/\b(header|heder|hedar|nav|navbar|menu\s*bar)\b/i.test(matchBlob) ||
        /\bsticky\s*(kro|karo|on|laga|enable)\b/i.test(matchBlob))
    ) {
      const off =
        /\b(un\s*sticky|unsticky|sticky\s*(hata|off|band|remove)|no\s*sticky|sticky\s*mat)\b/i.test(
          matchBlob,
        );
      let next = applyCreateAiHeaderSticky(html, !off);
      // If sticky chrome corruption ate the nav, rebuild once
      const hdr = next.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
      if ((hdr.match(/<a\b/gi) || []).length < 2) {
        next = rebuildCreateAiHeaderBar(next, brandName);
        next = applyCreateAiHeaderSticky(next, !off);
      }
      next = stripOrphanDuplicateNav(next);
      next = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next)),
      );
      return ok(
        next,
        off
          ? "Header sticky hata diya. Preview check karo."
          : "Header sticky on — scroll pe chipka rahega. Preview check karo.",
        undefined,
        "header-sticky",
        html,
      );
    }

    // Contact topbar only (dark strip) — not full header rebuild
    if (wantsTopBarOnlyFix(matchBlob) && !images.length) {
      let next = applyCreateAiTopBar(html, true, {
        email: body.email,
        mobile: body.mobile,
        address: body.address,
      });
      next = stripDuplicateContactStrips(next);
      next = normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next));
      if (!htmlLooksSame(next, html)) {
        return ok(
          next,
          "Top bar clean — ab ek hi contact strip. Preview check karo.",
          undefined,
          "topbar-fix",
          html,
        );
      }
      return ok(
        next,
        "Top bar already ek hai. Agar duplicate dikhe to Undo karke dubara “top bar fix” bolo.",
        undefined,
        "topbar-ok",
        html,
      );
    }

    // Full site theme refresh — never shrink to header-only invent
    const themeAsk =
      wantsSiteThemeRefresh(matchBlob) ||
      wantsSiteThemeRefresh(rawMessage) ||
      wantsSiteThemeRefresh(normalizedMessage) ||
      isSiteThemeContinueAsk(rawMessage, historyBlob) ||
      isSiteThemeContinueAsk(normalizedMessage, historyBlob);

    // Header/nav: surgical AI → else deterministic rebuild (never full-page spoil)
    // "Dark + premium" ONLY from current ask — history must not lock every header to same look.
    const headerAsk =
      !themeAsk &&
      (wantsHeaderFix(matchBlob) ||
        wantsHeaderFix(rawMessage) ||
        wantsHeaderFix(normalizedMessage) ||
        (wantsDarkPremiumHeader(rawMessage) &&
          /header|nav|heder/i.test(historyBlob)));
    if (headerAsk && !images.length) {
      const prevHdrForTheme = extractHeaderBlock(html) || "";
      const askNew = wantsNewHeader(rawMessage) || wantsNewHeader(normalizedMessage);
      const darkPremiumNow =
        wantsDarkPremiumHeader(rawMessage) ||
        wantsDarkPremiumHeader(normalizedMessage) ||
        wantsDarkPremiumHeader(effectiveMessage);
      // History "dark premium" only if user is continuing that ask — not on "header new"
      const darkPremium =
        darkPremiumNow ||
        (!askNew &&
          wantsDarkPremiumHeader(historyBlob) &&
          /^(ok|okay|yes|haan|ha|wahi|same|continue|aur\s*karo|theek)\b/i.test(
            rawMessage.trim(),
          ));
      const altTheme = askNew
        ? pickAlternateHeaderTheme(prevHdrForTheme)
        : darkPremium
          ? { bg: "#0a0a0a", fg: "#f5f5f4", accent: "#c9a227", label: "dark-premium" }
          : null;
      const headerPrompt = askNew
        ? `${effectiveMessage}\nBuild a BRAND NEW header look. Current header colors must NOT be reused. Use this palette: bg ${altTheme!.bg}, text ${altTheme!.fg}, accent ${altTheme!.accent}. Different CTA label style. Preview must look clearly new.`
        : darkPremium
          ? `${effectiveMessage}\nApply a dark premium header: deep black background (#0a0a0a), light/white nav text, subtle gold/amber accents on CTA and brand mark. Must be visibly different from a light/white header.`
          : `${effectiveMessage}\nRestyle the whole header bar so the preview visibly changes (layout clean + clearer CTA). Do not only tweak one text color.`;
      const forceNew =
        isCreateAiHeaderBroken(html) ||
        askNew ||
        darkPremium ||
        /header\s*(new|naya|bana|bnao|banao|update|updte)|naya\s*header|new\s*header|kharab|toot|pura\s*header|whole\s*header/i.test(
          matchBlob,
        );
      const beforeNav = navHitsInChrome(html);

      // Broken / "header new" / dark premium → skip weak surgical, prefer strong rewrite then themed rebuild
      if (!forceNew) {
        const surgical = await rewriteHeaderOnly({
          html,
          brandName,
          message: headerPrompt,
          contactHint,
          qualityMode: qualityModeEarly,
        });
        if (surgical?.html) {
          const qa = collectQaIssues(surgical.html, matchBlob, html).filter(
            (i) => i !== "unchanged",
          );
          const topAbout = (doc: string) => {
            const hdr = doc.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
            return (hdr.match(/\bABOUT\b/gi) || []).length;
          };
          const dupNav =
            navHitsInChrome(surgical.html) > beforeNav + 4 ||
            topAbout(surgical.html) > 2;
          const prevHdr = extractHeaderBlock(html);
          const nextHdr = extractHeaderBlock(surgical.html);
          const visiblyChanged =
            Boolean(nextHdr) &&
            !htmlLooksSame(nextHdr || "", prevHdr || "");
          if (
            visiblyChanged &&
            (!qa.length || !qa.includes("header-broken")) &&
            !dupNav &&
            !isCreateAiHeaderBroken(surgical.html)
          ) {
            let next = stripOrphanDuplicateNav(surgical.html);
            next = stripDuplicateContactStrips(next);
            next = normalizeCreateAiHeaderBar(next);
            next = applyCreateAiTopBar(next, wantTopBar, {
              email: body.email,
              mobile: body.mobile,
              address: body.address,
            });
            next = stripDuplicateContactStrips(next);
            return ok(
              next,
              "Header clean kar diya — preview check karo (ek bar, ek CTA, no overlap).",
              surgical.ai,
              "header-surgical",
              html,
            );
          }
        }
      } else {
        // askNew / dark / forced — AI invents freely; soft normalize keeps the look
        const surgical = await rewriteHeaderOnly({
          html,
          brandName,
          message: headerPrompt,
          contactHint,
          inventNew: askNew || darkPremium,
          qualityMode: qualityModeEarly,
        });
        if (surgical?.html && !isCreateAiHeaderBroken(surgical.html)) {
          const prevHdr = extractHeaderBlock(html);
          const nextHdr = extractHeaderBlock(surgical.html);
          const visiblyChanged =
            Boolean(nextHdr) &&
            !htmlLooksSame(nextHdr || "", prevHdr || "");
          if (visiblyChanged) {
            let next = stripOrphanDuplicateNav(surgical.html);
            next = stripDuplicateContactStrips(next);
            next = normalizeCreateAiHeaderBar(next, {
              preserveDesign: true,
            });
            next = applyCreateAiTopBar(next, wantTopBar, {
              email: body.email,
              mobile: body.mobile,
              address: body.address,
            });
            next = stripDuplicateContactStrips(next);
            return ok(
              next,
              askNew
                ? "AI ne naya header invent kiya — preview check karo."
                : darkPremium
                  ? "Header dark + premium laga diya — preview check karo."
                  : "Header update apply ho gaya — preview check karo.",
              surgical.ai,
              askNew ? "header-invent-ai" : "header-surgical-forced",
              html,
            );
          }
        }
        // AI fail only → preset rotate as safety net
        if (askNew) {
          const invented = rotateInventCreateAiHeader(html, brandName);
          if (
            invented.html &&
            !htmlLooksSame(invented.html, html) &&
            !isCreateAiHeaderBroken(invented.html)
          ) {
            let next = stripOrphanDuplicateNav(invented.html);
            next = stripDuplicateContactStrips(next);
            next = normalizeCreateAiHeaderBar(next, {
              preserveDesign: true,
            });
            next = applyCreateAiTopBar(next, wantTopBar, {
              email: body.email,
              mobile: body.mobile,
              address: body.address,
            });
            next = stripDuplicateContactStrips(next);
            return ok(
              next,
              `Naya header (${invented.variantLabel}) — fallback. Preview check karo.`,
              undefined,
              "header-invent-rotate",
              html,
            );
          }
        }
      }

      const theme = altTheme
        ? { bg: altTheme.bg, fg: altTheme.fg, accent: altTheme.accent }
        : undefined;
      let rebuilt = rebuildCreateAiHeaderBar(html, brandName, theme);
      // Always re-stamp contact topbar under a fresh header (logo stripped from topbar)
      rebuilt = applyCreateAiTopBar(rebuilt, wantTopBar, {
        email: body.email,
        mobile: body.mobile,
        address: body.address,
      });
      rebuilt = stripOrphanDuplicateNav(rebuilt);
      rebuilt = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(ensureCreateAiResponsive(rebuilt)),
      );
      // If still broken, rebuild once more after topbar
      if (isCreateAiHeaderBroken(rebuilt)) {
        rebuilt = rebuildCreateAiHeaderBar(rebuilt, brandName, theme);
        rebuilt = applyCreateAiTopBar(rebuilt, wantTopBar, {
          email: body.email,
          mobile: body.mobile,
          address: body.address,
        });
        rebuilt = stripDuplicateContactStrips(
          normalizeCreateAiHeaderBar(ensureCreateAiResponsive(rebuilt)),
        );
      }
      return ok(
        rebuilt,
        askNew
          ? `Naya header (${altTheme?.label || "fresh"}) — colors/layout change. Preview check karo.`
          : darkPremium
            ? "Dark premium header laga diya (black + gold). Preview check karo."
            : forceNew
              ? "Naya header laga diya — logo, nav links, CTA. Preview check karo."
              : "Header update laga diya — ek bar, gap fix, clear CTA. Preview check karo.",
        undefined,
        "header-rebuild",
        html,
      );
    }

    const qualityMode =
      body.qualityMode === "quality" ? "quality" : "speed";

    // Section-scoped surgical edit (gallery/hero/…) — NEVER send full page for small layout asks
    if (
      !images.length &&
      !themeAsk &&
      wantsSectionScopedEdit(matchBlob) &&
      detectCreateAiSectionId(matchBlob) !== "global"
    ) {
      const sectioned = await rewriteCreateAiSection({
        pageHtml: html,
        message: effectiveMessage || matchBlob,
        brandName,
        qualityMode,
      });
      if (
        sectioned.ok &&
        sectioned.html &&
        !htmlLooksSame(sectioned.html, html)
      ) {
        let next = stripContactPromptLeak(sectioned.html);
        next = preserveFooterUnlessAsked(html, next, matchBlob);
        next = preserveStructuralChrome(html, next, matchBlob);
        next = normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next));
        return ok(
          next,
          `${sectioned.sectionId} section update (${qualityMode}${sectioned.provider ? ` · ${sectioned.provider}` : ""}) — preview check karo.`,
          {
            provider: (sectioned.provider ||
              "none") as AiTextResult["provider"],
            model: sectioned.model || "",
            tokensUsed: sectioned.tokensUsed || 0,
          },
          `section-edit-${sectioned.sectionId}`,
          html,
        );
      }
    }

    const isScreenshotUi =
      images.length > 0 && isScreenshotUiEditAsk(matchBlob);
    // Screenshot + add/rebuild section → Gemini vision. Else OpenAI↔Gemini stack.
    const isScreenshotSection =
      images.length > 0 &&
      !isScreenshotUi &&
      !isLogoReplaceAsk(matchBlob) &&
      !isHeroBannerImageAsk(matchBlob) &&
      /(add|bana|dal|laga|section|testimonial|team|faq|pricing|map|video|timeline|slider|match|jaise|reference|design|layout|bn[aā]|jaisa|same)/i.test(
        matchBlob,
      );
    const editRoute = createAiEditRoute(qualityMode, {
      screenshotSection: isScreenshotSection,
      screenshotUi: isScreenshotUi,
    });
    const primaryProvider = editRoute.primary;
    const fallbackProvider = editRoute.fallback;

    const historyForEdit = (body.history || [])
      .slice(-6)
      .map((h) => `${h.role}: ${String(h.content || "").slice(0, 180)}`)
      .join("\n");

    // Speed: surgical patches for MOST asks (Gemini fast + accurate scope)
    // Never surgical when cloning a section from a screenshot — need full vision.
    const trySurgical =
      !images.length &&
      !themeAsk &&
      !wantsHeaderFix(matchBlob) &&
      (qualityMode === "speed" || wantsSurgicalPatch(matchBlob));

    if (trySurgical) {
      const patchAi = await generateAiText({
        preferProvider: primaryProvider,
        modelTier: editRoute.tier,
        messages: [
          {
            role: "system",
            content: `You are a precise website editor. Infer messy Hinglish/typos from user + recent chat.

Return ONLY JSON (no markdown):
{"patches":[{"old":"...","new":"..."}]}

Rules:
- 1–12 exact substring replacements. "old" must exist verbatim in the HTML.
- Change ONLY what was asked. Location words (header/footer/hero) mean WHERE — do not rebuild that whole section unless they asked to fix/redesign it.
- If request cannot be done with patches, return {"patches":[]}.
- Keep layout/structure intact for color/text/button label edits.`,
          },
          {
            role: "user",
            content: `Recent chat:
${historyForEdit || "(none)"}

User raw: ${rawMessage}
Intent: ${effectiveMessage}

HTML (edit with patches only):
${html.slice(0, qualityMode === "speed" ? 45_000 : 55_000)}`,
          },
        ],
        temperature: 0.15,
        maxTokens: qualityMode === "speed" ? 2500 : 4000,
      });
      const patches = extractPatches(patchAi.text);
      const applied = applyPatches(html, patches);
      if (applied.applied > 0 && !htmlLooksSame(applied.html, html)) {
        let next = stripContactPromptLeak(applied.html);
        next = preserveFooterUnlessAsked(html, next, matchBlob);
        next = preserveStructuralChrome(html, next, matchBlob);
        next = normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next));
        return ok(
          next,
          `Done · ${applied.applied} edit${applied.applied > 1 ? "s" : ""} (${qualityMode}${patchAi.provider ? ` · ${patchAi.provider}` : ""}) — preview check karo.`,
          patchAi,
          "surgical-patches",
          html,
        );
      }
    }

    // === Full page edit (Quality, or Speed when patches can't do it) ===
    const systemFull = isScreenshotSection
      ? `You are Gemini-level visual HTML builder for "${brandName}".
Return ONLY a complete <!DOCTYPE html>…</html> document.

SCREENSHOT-SECTION CLONE (critical):
- The attached image is the DESIGN SPEC for the section the user wants (e.g. testimonials).
- Recreate that SECTION as closely as possible: layout, colors, card shape, borders (sketchy/hand-drawn if shown), typography hierarchy, arrows/carousel, trust badges (Google reviews), decorative accents.
- Use pure HTML+CSS (SVG for sketchy borders/quotes OK). Google Fonts OK if needed.
- Adapt copy to "${brandName}" / site context when reference names are from another brand — keep STRUCTURE identical.
- Insert/replace this section into the CURRENT PAGE; do NOT rebuild header/nav/footer/floats unless the screenshot shows them.
- Do NOT invent a generic default testimonials card if the reference looks different.
- One header, one nav — preserve existing chrome.

${CREATE_AI_LAWS}

- Preserve __CAI_IMG_N__ tokens. Contact values stay in Contact UI only (${contactHint || "from page"}).
- No markdown, no JSON wrapper, no commentary outside HTML.`
      : isScreenshotUi
        ? `You are a precise website editor for "${brandName}".
Return ONLY a complete <!DOCTYPE html>…</html> document.

SCREENSHOT UI TARGET (critical):
- The attached image is a CROP of the live preview pointing at the element to change — NOT a photo to place as hero/banner/logo.
- Find the matching text/UI on the page (header brand, hero title, button, etc.) and apply ONLY the user intent (center / remove / recolor / resize / …).
- Do NOT replace hero background images with the screenshot.
- Do NOT invent new sections. Keep header/nav/footer/floats unless the ask is about them.
- If INTENT is clear, do that exact change. Prefer surgical scope.

${CREATE_AI_LAWS}

- Preserve __CAI_IMG_N__ tokens. Contact values stay in Contact UI only (${contactHint || "from page"}).
- No markdown, no JSON wrapper, no commentary outside HTML.`
      : themeAsk
        ? `You are an advanced website designer-editor for "${brandName}".
Return ONLY a complete <!DOCTYPE html>…</html> document.

SITE THEME REFRESH (critical):
- User asked to improve / refresh the WHOLE site look (theme/design) — NOT header-only.
- Change colors, fonts, hero atmosphere, section backgrounds, buttons, and footer together so the page feels visibly new.
- Keep content/copy and section order unless a tiny tweak helps cohesion.
- ONE header, ONE brand name, ONE mobile ☰ (data-cai-menu-btn), ONE nav — never duplicate brand text or double hamburgers.
- Do not invent extra sections. Preserve floats / back-to-top / contact values.

${CREATE_AI_LAWS}

- Preserve __CAI_IMG_N__ tokens. Contact values stay in Contact UI only (${contactHint || "from page"}).
- No markdown, no JSON wrapper, no commentary outside HTML.`
      : `You are an advanced website designer-editor for "${brandName}".
Return ONLY a complete <!DOCTYPE html>…</html> document.

Understand messy Hinglish/Hindi/English/typos from USER RAW + recent chat. Do exactly what they meant — no more, no less.

SCOPE (critical):
- Location ≠ redesign: "header ka button white" = that button color only. "header theek kro" = fix header.
- "theme better / design change / apne according" (theme context) = WHOLE site look, not header-only.
- Do not invent extra sections, duplicate navs, or second headers.
- One header, one brand name, one nav row, one mobile ☰, one CTA unless asked otherwise.

${CREATE_AI_LAWS}

- Preserve __CAI_IMG_N__ tokens. Use approved image URLs when provided.
- Contact values stay in Contact UI only (${contactHint || "from page"}).
- No markdown, no JSON wrapper, no commentary outside HTML.
${images.length ? `- Attached screenshot(s) are a DESIGN REFERENCE. If user asked to add/rebuild a section, MATCH the reference — do NOT paste a generic default template.` : ""}
${qualityMode === "speed" ? "- Speed mode: minimal diff — change only the ask." : ""}`;

    const userFull = `Recent chat:
${historyForEdit || "(none)"}
${screenshotBrief ? `Screenshot brief: ${screenshotBrief}\n` : ""}
CURRENT PAGE HTML:
${clippedHtml}

USER RAW: ${rawMessage}
INTENT: ${effectiveMessage}
${
      isScreenshotSection
        ? `TASK: Clone the attached reference screenshot into a matching section on this page (same visual language). Keep rest of site.\n`
        : isScreenshotUi
          ? `TASK: Use the attached screenshot crop to locate the target element, then apply INTENT only. Do NOT treat the crop as a new hero/banner image.\n`
          : themeAsk
            ? `TASK: Refresh the FULL site theme (colors, typography, hero, sections, buttons, footer). Do NOT only restyle the header. One brand name, one mobile menu button.\n`
            : ""
    }${
      contactHint
        ? `Keep these values inside existing Contact/footer UI (do not print as a raw CONTACT: line): ${contactHint}\n`
        : ""
    }${
      approvedImageUrls.length
        ? `APPROVED_IMAGES:\n${approvedImageUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n`
        : ""
    }
Return the full updated HTML now with ONLY the request finished.`;

    lastAi =
      images.length > 0
        ? await generateAiFromImages({
            system: systemFull,
            prompt: userFull,
            images,
            temperature: isScreenshotSection ? 0.2 : 0.45,
            maxTokens: 16000,
            preferProvider: primaryProvider,
          })
        : await generateAiText({
            preferProvider: primaryProvider,
            modelTier: editRoute.tier,
            messages: [
              { role: "system", content: systemFull },
              { role: "user", content: userFull },
            ],
            temperature: 0.45,
            maxTokens: qualityMode === "speed" ? 12000 : 16000,
          });

    let nextHtml = extractHtml(lastAi.text);
    if (nextHtml) nextHtml = restoreInlineImages(nextHtml, stash);

    const accept = (doc: string) =>
      Boolean(doc) &&
      isUsableHtml(doc, html) &&
      !htmlLooksSame(doc, html) &&
      !(html.length > 8000 && doc.length < html.length * 0.3);

    let qa = nextHtml
      ? collectQaIssues(nextHtml, matchBlob, html)
      : ["empty"];

    if (!accept(nextHtml) || qa.includes("header-broken") || qa.includes("contact-leak") || qa.includes("contact-leak-pipe") || qa.includes("catastrophic-shrink") || qa.includes("missing-hero-video") || qa.includes("missing-hero-image") || qa.includes("unchanged")) {
      lastAi = await generateAiText({
        preferProvider: fallbackProvider,
        messages: [
          {
            role: "system",
            content: `Complete the user's website edit. Return ONLY full HTML for "${brandName}".
Request: ${effectiveMessage}
QA failed on: ${qa.join(", ") || "invalid"}. Fix those issues. Keep header/footer unless removal was asked. Contact: ${contactHint || "keep"}.`,
          },
          {
            role: "user",
            content: `BASE HTML:\n${clippedHtml.slice(0, 70_000)}\n\nDo the request now.`,
          },
        ],
        temperature: 0.45,
        maxTokens: 16000,
      });
      nextHtml = extractHtml(lastAi.text);
      if (nextHtml) nextHtml = restoreInlineImages(nextHtml, stash);
      qa = nextHtml
        ? collectQaIssues(nextHtml, matchBlob, html)
        : ["empty"];
    }

    // Speed: skip 3rd full rewrite (too slow for small asks)
    if (
      qualityMode === "quality" &&
      (!accept(nextHtml) || qa.includes("catastrophic-shrink"))
    ) {
      lastAi = await generateAiText({
        preferProvider: "gemini",
        modelTier: "quality",
        messages: [
          {
            role: "system",
            content: `You MUST change the page to satisfy: "${effectiveMessage}". Return complete HTML only. No CONTACT: dump lines. Scope only the ask.`,
          },
          {
            role: "user",
            content: clippedHtml.slice(0, 55_000),
          },
        ],
        temperature: 0.5,
        maxTokens: 14000,
      });
      nextHtml = extractHtml(lastAi.text);
      if (nextHtml) nextHtml = restoreInlineImages(nextHtml, stash);
      qa = nextHtml
        ? collectQaIssues(nextHtml, matchBlob, html)
        : ["empty"];
    }

    if (accept(nextHtml) && !qa.includes("catastrophic-shrink") && !qa.includes("missing-hero-video")) {
      if (wantsPhotoFill && approvedImageUrls.length) {
        nextHtml = injectApprovedImages(nextHtml, approvedImageUrls);
      }
      nextHtml = stripContactPromptLeak(nextHtml);
      nextHtml = preserveFooterUnlessAsked(html, nextHtml, matchBlob);
      nextHtml = preserveStructuralChrome(html, nextHtml, matchBlob);
      nextHtml = stripDuplicateContactStrips(nextHtml);
      nextHtml = normalizeCreateAiHeaderBar(ensureCreateAiResponsive(nextHtml));
      // Always leave a "wow" feel after successful AI edits
      try {
        const { injectCreateAiPremiumShell } = await import(
          "@/lib/create-ai-premium-shell"
        );
        const { injectCreateAiWowPolish } = await import(
          "@/lib/create-ai-wow-polish"
        );
        nextHtml = injectCreateAiWowPolish(injectCreateAiPremiumShell(nextHtml));
      } catch {
        /* optional */
      }
      // Silent QA normalize if leak/header still noisy
      const qa2 = collectQaIssues(nextHtml, matchBlob, html).filter(
        (i) => i !== "unchanged",
      );
      if (qa2.includes("contact-leak") || qa2.includes("contact-leak-pipe")) {
        nextHtml = stripContactPromptLeak(nextHtml);
      }
      if (qa2.includes("missing-hero-video")) {
        const forced = applyCreateAiHeroVideoBanner(
          nextHtml,
          brandName,
          matchBlob,
        );
        if (forced.ok) nextHtml = forced.html;
        else {
          return ok(
            html,
            "Banner video ke liye YouTube link bhejo (https://youtu.be/…). Predefined sample nahi lagate.",
            lastAi,
            "missing-hero-video",
            html,
          );
        }
      }
      if (qa2.includes("missing-hero-image") || isHeroBannerImageAsk(matchBlob)) {
        const src = images[0]?.base64
          ? `data:${images[0].mimeType || "image/jpeg"};base64,${images[0].base64}`
          : "";
        if (src && src.length <= 350_000) {
          const forcedImg = applyCreateAiHeroImage(nextHtml, src);
          if (forcedImg.ok) nextHtml = forcedImg.html;
        }
        if (
          isHeroBannerImageAsk(matchBlob) &&
          !/data-create-ai-hero-image=["']1["']/i.test(nextHtml)
        ) {
          return ok(
            html,
            "Banner/hero image apply nahi hui — chhoti JPG attach karke “banner pe ye image” likho.",
            lastAi,
            "unchanged",
            html,
          );
        }
      }
      return ok(
        nextHtml,
        themeAsk
          ? `Pura theme refresh lagaya (${qualityMode}${lastAi?.provider ? ` · ${lastAi.provider}` : ""}) — preview check karo.`
          : `Edit lag gayi (${qualityMode}${lastAi?.provider ? ` · ${lastAi.provider}` : ""}) — preview check karo.`,
        lastAi,
        themeAsk
          ? "site-theme"
          : isHeroBannerImageAsk(matchBlob) &&
              /data-create-ai-hero-image=["']1["']/i.test(nextHtml)
            ? "hero-image"
            : `ai-free-${qualityMode}`,
        html,
      );
    }

    // Last resort for banner-video — only with real YouTube URL (no stock sample)
    if (
      /(banner|hero).{0,28}video|video.{0,28}(banner|hero)|banner\s*video|video\s*wala|youtube/i.test(
        matchBlob,
      )
    ) {
      const forced = applyCreateAiHeroVideoBanner(html, brandName, matchBlob);
      if (forced.needsUrl) {
        return ok(
          stripDuplicateContactStrips(
            applyCreateAiHeroVideoBanner(html, brandName, "").html,
          ),
          "Banner video ke liye apna YouTube link bhejo. Sample/predefined video nahi lagate.",
          lastAi,
          "hero-video-need-url",
          html,
        );
      }
      if (forced.ok && !htmlLooksSame(forced.html, html)) {
        return ok(
          stripDuplicateContactStrips(forced.html),
          "Hero banner pe aapka YouTube video laga diya. Preview check karo.",
          lastAi,
          "hero-video-fallback",
          html,
        );
      }
    }

    // Last resort for banner still-image
    if (images.length > 0 && isHeroBannerImageAsk(matchBlob)) {
      const src = images[0]?.base64
        ? `data:${images[0].mimeType || "image/jpeg"};base64,${images[0].base64}`
        : "";
      if (src && src.length <= 350_000) {
        const forcedImg = applyCreateAiHeroImage(html, src);
        if (forcedImg.ok && !htmlLooksSame(forcedImg.html, html)) {
          return ok(
            stripDuplicateContactStrips(
              normalizeCreateAiHeaderBar(ensureCreateAiResponsive(forcedImg.html)),
            ),
            "Hero/banner pe aapki image laga di — preview check karo.",
            lastAi,
            "hero-image",
            html,
          );
        }
      }
    }

    return ok(
      html,
      "Is baar change apply nahi hua — thoda clear likho (kya add/remove/change). Phir try.",
      lastAi,
      "unchanged",
      html,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat refine failed";
    const safe =
      /is not defined|Cannot access|ReferenceError|TypeError/i.test(message)
        ? "Temporary chat bug — ek aur short ask try karo."
        : message;
    if (html) {
      return ok(html, `Recovered — ${safe}`, undefined, "recover", html);
    }
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
