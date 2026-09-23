/**
 * Create-AI chat actions — schema + AI fill, not million phrase rules.
 * Grok/OpenAI plans JSON actions; we execute them deterministically.
 */

import { generateAiText, type AiTextResult } from "@/lib/aiProvider";
import { createAiPlannerRoute } from "@/lib/create-ai-chat-llm";
import {
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
  parseFloatPlacementLocal,
  readFloatPlacement,
  extractThemeAccentFromHtml,
  applyCreateAiHeaderSticky,
  applyCreateAiHeroVideoBanner,
  applyCreateAiHeroImage,
  ensureCreateAiResponsive,
  normalizeCreateAiHeaderBar,
  normalizeCreateAiCopyrightYear,
  stripDuplicateContactStrips,
  ensureCreateAiHeaderBrand,
  createAiHeaderHasBrandLabel,
  extractCreateAiLogoSrc,
  dedupeHeaderBrandLogo,
  type FloatPlacement,
} from "@/lib/create-ai-chrome";
import {
  injectCreateAiWowPolish,
  wantsCreateAiWowPolish,
} from "@/lib/create-ai-wow-polish";
import { injectCreateAiPremiumShell } from "@/lib/create-ai-premium-shell";
import { polishCreateAiFooter } from "@/lib/create-ai-qa-rails";

function injectBackToTop(html: string) {
  if (!html) return html;
  let out = html
    .replace(/<style[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<button[^>]*id=["']create-ai-btt["'][^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<script[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/script>/gi, "");
  const block = `<style data-create-ai-btt="1">#create-ai-btt{position:fixed;right:18px;bottom:16px;z-index:2147483001;width:46px;height:46px;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:20px;line-height:46px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.28);opacity:.92}#create-ai-btt:hover{opacity:1}</style>
<button type="button" id="create-ai-btt" aria-label="Back to top" title="Back to top">↑</button>
<script data-create-ai-btt="1">(function(){var b=document.getElementById("create-ai-btt");if(!b)return;b.addEventListener("click",function(){try{window.scrollTo({top:0,behavior:"smooth"});}catch(e){window.scrollTo(0,0);}});})();<\/script>`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${block}</body>`);
  else out = `${out}${block}`;
  return layoutCreateAiRightRail(out);
}

export type ChatAction =
  | {
      type: "float.place";
      side?: FloatPlacement["side"];
      vertical?: FloatPlacement["vertical"];
      email?: boolean;
      /** true | "theme" | "#hex" — never ask user; extract from HTML when theme */
      themeColor?: boolean | string;
    }
  | { type: "float.recolor"; color?: string | "theme" }
  | { type: "widget.backToTop"; on?: boolean }
  | { type: "header.sticky"; on?: boolean }
  | { type: "layout.responsive"; on?: boolean }
  | { type: "layout.wow" }
  | { type: "footer.polish" }
  | {
      type: "hero.video";
      /** YouTube URL or "dummy" when user asked for demo */
      youtube?: string | "dummy";
    }
  | { type: "hero.image" }
  | {
      type: "color.set";
      /** Prefer label = exact button/link text for ONE control */
      target?: "button" | "heading" | "hero" | "headerCta";
      color?: string;
      label?: string;
      property?: "color" | "background";
      /** normal = default, hover = :hover only, both = default + smart/explicit hover */
      state?: "normal" | "hover" | "both";
      /** Optional explicit hover color; if omitted and state=both, auto-contrast */
      hoverColor?: string;
    }
  | {
      type: "section.add";
      kind:
        | "team"
        | "faq"
        | "pricing"
        | "testimonials"
        | "map"
        | "video"
        | "timeline"
        | "clientSlider";
    }
  | { type: "logo.set" }
  | { type: "brand.label"; name?: string }
  | { type: "chat.reply"; text: string }
  | { type: "needs.ai_edit"; reason?: string };

export type PlanResult = {
  actions: ChatAction[];
  provider?: string;
  model?: string;
  tokensUsed?: number;
};

/**
 * ONE master prompt for all user-world phrases (Hinglish + English).
 * Do NOT stack new per-phrase regex for each ask — teach the planner here.
 */
const ACTION_SYSTEM = `You are the careful brain of a website builder chat (like a senior ChatGPT/Grok editor).
Understand messy Hinglish, Hindi, typos (kro→karo, heder→header, lga→laga). Return ONLY JSON: {"actions":[...]}
Never invent HTML. Never ask for CSS class / hex / selector. Never say a feature is "available nahi".
Never claim work is done via chat.reply when an action can apply it.

=== PRECISION (anti-random — do this FIRST) ===
Silently decide in order:
1) Exact user goal (one line) from RAW + recent chat — not a "creative" rewrite of their ask.
2) Smallest action that fully finishes that goal.
3) What must NOT change (everything else).
Then emit ONLY that action (or ordered list if they clearly asked A+B).
- Wrong guess is worse than ONE short clarify. If 2 interpretations are equally likely → chat.reply with options. Do NOT pick a random action.
- Prefer deterministic schemas (color.set, float, sticky, brand.label) over needs.ai_edit when the ask is small and clear.
- "ye / usi / wahi / apne according / khud se" continues the LAST user edit topic — never jump to a new random topic.
- Widget asks stay widgets: back-to-top ≠ float; sticky ≠ header redesign; float color ≠ button color.
- Theme/design/look better = needs.ai_edit "site-theme" (FULL page). NEVER shrink to header-only invent.
- Do not over-expand: never add hero/footer/section extras they did not ask for.
- Never instruct duplicate brand name, second header, or second mobile ☰.

=== ACTIONS (pick what fits) ===
1) float.place {side:"left"|"center"|"right", vertical:"top"|"center"|"bottom", email?, themeColor?}
   USER WORLD: float / floating / call icon / whatsapp / wa icon / neeche call / left pe / right pe / center / upar / niche / beech / backtotop ke upar / btt ke upar / above back to top
   → "backtotop ke upar" = side right + vertical bottom (stack ABOVE BTT). NEVER vertical top for that.
2) float.recolor {color:"theme"|"red"|"blue"|"black"|"white"|"#hex"|named}
   USER WORLD: float color / wa icon red / floating theme color / call button rang
3) widget.backToTop {on:true|false}
   USER WORLD: back to top / btt / top button / scroll to top / wapas upar / hata do back to top / add back to top
   CRITICAL: "add back to top" / "back to top" ALONE = this action ONLY. NEVER float.place / never WhatsApp/call float.
4) header.sticky {on:true|false}
   USER WORLD: header sticky / heder sticky / sticky header / unsticky / sticky hatao — ALWAYS this action, never chat.reply unavailable
5) layout.responsive {on:true}
   USER WORLD: responsive / mobile fix / tablet / phone pe toot / layout squash / chhote screen
5b) layout.wow {}
   USER WORLD: wow banao / premium feel / modern look / animation / hover effect / polish / high-end / pro look
   → Instant motion + hover polish rails (no full rewrite). If they also want full theme change, add needs.ai_edit "site-theme" after.
6) color.set {color, label?, property?:"color"|"background", state?:"normal"|"hover"|"both", hoverColor?, target?}
   USER WORLD: pe black / text pe #000 / button text white / likha black / hover text / second button / dusra button / Enroll Now color / heading white / bg / fill / rang
   RULES:
   - ALWAYS "label" = exact ONE button/link text when targeting a control
   - TEXT / likha / font → property "color" (never background); clear leftover fill
   - fill/bg/background/solid / "pe black" WITHOUT word text → property "background"
   - "second/dusra button" = content CTA ordinal — NEVER Home/About/Services nav
   - sabhi/all buttons only if user said all/sabhi
   - state default "both"; hover-only if user said hover
6b) "colorfull / colourful / rangin / vibrant banao" (site or footer/header scoped) → needs.ai_edit reason "site-theme-colorful" | "footer-colorful" | "header-colorful"
   NEVER hero.image. NEVER logo.set. Colorful ≠ put a photo on the banner.
7) hero.video {youtube:"https://..."|"dummy"}
   USER WORLD: banner video / hero video / video wala banner / youtube link / dummy laga do
8) hero.image — USER attached a photo AND asked for banner/hero/background image
   USER WORLD: banner image / hero image / banner pe photo / banner images add / background image / hero pe ye photo
   NEVER chat.reply "Ho gaya" without applying. NEVER treat as logo.set.
9) section.add {kind:"team"|"faq"|"pricing"|"testimonials"|"map"|"video"|"timeline"|"clientSlider"}
   USER WORLD: team section / faq / pricing / testimonials / map / video section / timeline / client slider / clients
   ONLY when NO screenshot attached. Screenshot + section → needs.ai_edit reason "screenshot-section"
10) logo.set — USER attached an image AND asked to put it as logo / header logo / brand mark
   USER WORLD: ye logo lga / logo laga do / header mai logo / logo yahan / brand logo change
   NEVER chat.reply "Ho gaya" without logo.set. NEVER treat logo upload as section screenshot.
10b) brand.label {name?} — put brand NAME text immediately after/beside the header logo (no header rebuild)
   USER WORLD: logo ke baad name / logo bagal name / Abhishek Mishra add kro logo ke baad / brand name dikhao / name add after logo / header pe naam
   ALSO RENAME: "fff to Abhishek Mishra" / "X ko Y" / "change brand name to Y" / "rename fff to Abhishek" → brand.label with NEW name only (not the old word)
   CRITICAL: NOT header redesign / NOT needs.ai_edit. Deterministic chip = logo + name.
11) chat.reply {text} — ONLY pure chitchat / greetings / OR one short clarify when scope is ambiguous. Never fake "Ho gaya".
   Clarify format: name 2–3 options (e.g. "Only header? All theme? Hero?"). Never quiz when the ask is already clear.
12) needs.ai_edit {reason} — header redesign, FULL site theme refresh (reason "site-theme"), big layout change, screenshot clone section, complex edit
12b) footer.polish — "footer acha/banao/theek/improve/sundar" → rebuild footer nicely. NEVER color.set Contact/Home. NEVER invent button color.

=== HARD RULES ===
- "logo ke baad/bagal name" / "name add after logo" → brand.label ONLY. NEVER header rebuild. NEVER fake success without applying.
- "footer acha / footer banao / footer theek / footer improve / sundar footer" → footer.polish ONLY. NEVER color.set on Contact/nav.
- "theme better / theme change / design better / pura theme / site look / apne according" (after theme talk) → needs.ai_edit reason "site-theme". NEVER header-only. NEVER chat.reply asking "header / hero / colors?" when they already said theme/apne according.
- Location words (header/footer/hero) = WHERE a small change goes — NOT full rebuild unless they said fix/redesign/acha karo whole header
- Screenshot attached for section/design → needs.ai_edit (match reference). Never default section.add over image.
- Attached image + logo/brand ask → logo.set only (not needs.ai_edit).
- Attached image + banner/hero/background ask → hero.image only (not needs.ai_edit, not fake Ho gaya).
- Attached image + unclear "ye laga do"/"add kro" → chat.reply ask logo vs banner (or use recent history intent). Never invent done.
- Attached SCREENSHOT + text edit (center / remove / color / size / "X hatao" / brand name) → needs.ai_edit. NEVER hero.image / logo.set unless they clearly said put this photo as logo/banner.
- If screenshot crop could be header OR hero OR elsewhere → chat.reply ask which section. Do NOT invent an edit.
- One clear ask → one action. Combined asks → multiple actions in order.
- Section layout asks (gallery grid / hero center / services cards) → needs.ai_edit with reason naming the section — backend isolates that section only.
- JSON only.`;

const NAV_BTN =
  /^(home|about|services|gallery|contact|blog|shop|menu|login|sign in|sign up)$/i;

/** Visible CTA labels from page — so planner can target the right button. */
export function listPageButtonLabels(html: string, limit = 12): string[] {
  const labels: string[] = [];
  const re = /<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html || "")) && labels.length < limit) {
    const text = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 2 || text.length > 48) continue;
    if (/^↑$|menu|☰/i.test(text)) continue;
    if (labels.some((l) => l.toLowerCase() === text.toLowerCase())) continue;
    labels.push(text);
  }
  return labels;
}

/** Hero/content CTAs only — strip header/nav so "second button" ≠ Home. */
export function listContentCtaLabels(html: string, limit = 12): string[] {
  const stripped = (html || "")
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ");
  return listPageButtonLabels(stripped, 40)
    .filter((l) => !NAV_BTN.test(l.trim()))
    .slice(0, limit);
}

function parseOrdinalButtonIndex(message: string): number | null {
  const m = (message || "").toLowerCase();
  if (!/\b(button|btn|cta)\b/i.test(m) && !/\b(pehla|dusra|doosra|teesra)\b/i.test(m)) {
    return null;
  }
  if (/\b(1st|first|pehla|pehle)\b/i.test(m)) return 0;
  if (/\b(2nd|second|dusra|doosra)\b/i.test(m)) return 1;
  if (/\b(3rd|third|teesra)\b/i.test(m)) return 2;
  const n =
    m.match(/\b(?:button|cta|btn)\s*(?:no\.?|number|#)?\s*(\d+)\b/i) ||
    m.match(/\b(\d+)\s*(?:st|nd|rd|th)?\s*(?:button|cta|btn)\b/i);
  if (n) {
    const i = parseInt(n[1], 10);
    if (i >= 1 && i <= 8) return i - 1;
  }
  return null;
}

/** "colorfull bna" / "footer colorful" — never hero.image / never logo */
export function parseColorfulThemeAsk(
  message: string,
): { type: "needs.ai_edit"; reason: string } | null {
  const m = (message || "").trim();
  if (!m) return null;
  const colorful =
    /color\s*full|colorfull|colourful|colorful|vibrant|rangin|rang\s*biranga?|zyada\s*rang|more\s*colou?rs?|colors?\s*(bhar|add|badal|bana|bnao|bno)|rang\s*(bhar|badal|bana)/i.test(
      m,
    );
  if (!colorful) return null;
  // Explicit photo-as-banner still wins
  if (
    isHeroBannerImageAsk(m) &&
    /(image|photo|pic|tasveer|img)\b/i.test(m) &&
    !/color|rang|colour/i.test(m)
  ) {
    return null;
  }
  if (/footer|futer|foooter/i.test(m)) {
    return { type: "needs.ai_edit", reason: "footer-colorful" };
  }
  if (/\b(header|heder|nav\b|menu)\b/i.test(m) && !/footer/i.test(m)) {
    return { type: "needs.ai_edit", reason: "header-colorful" };
  }
  if (/\b(hero|banner)\b/i.test(m) && !/(image|photo|pic)\b/i.test(m)) {
    return { type: "needs.ai_edit", reason: "hero-colorful" };
  }
  return { type: "needs.ai_edit", reason: "site-theme-colorful" };
}

/** Attached image meant as site logo / header brand mark (not section clone). */
export function isLogoReplaceAsk(message: string): boolean {
  const m = (message || "").trim();
  if (!m) return false;
  if (isDuplicateLogoComplaint(m)) return true;
  if (
    /\b(logo|brand\s*mark|brand\s*logo|site\s*logo|company\s*logo)\b/i.test(m)
  ) {
    return true;
  }
  // Hinglish: ye logo lga / lagao / igao / header mai ye
  if (
    /\blogo\b/i.test(m) &&
    /(lga|laga|lagao|igao|iga|dal|daal|rakh|change|replace|set|update|yha|yahan|header|heder)/i.test(
      m,
    )
  ) {
    return true;
  }
  return false;
}

/** Banner / hero background photo (not logo, not section clone, not "colorful"). */
export function isHeroBannerImageAsk(message: string): boolean {
  const m = (message || "").trim();
  if (!m || isLogoReplaceAsk(m)) return false;
  // Color / theme asks are NEVER banner image placement
  if (
    /color\s*full|colorfull|colourful|colorful|vibrant|rangin|zyada\s*rang/i.test(
      m,
    ) &&
    !/(banner|hero).{0,12}(image|photo|pic|tasveer)/i.test(m)
  ) {
    return false;
  }
  if (/(banner|hero).{0,20}video|video.{0,20}(banner|hero)|youtube/i.test(m)) {
    return false;
  }
  return (
    /(banner|hero|background|bg)\s*(image|images|img|photo|photos|pic|picture|tasveer)/i.test(
      m,
    ) ||
    /(image|photo|pic|tasveer).{0,20}(banner|hero|background)/i.test(m) ||
    /banner\s*(pe|mai|mein|par).{0,16}(image|photo|laga|add|dal)/i.test(m)
  );
}

/** Screenshot points at UI text/layout to edit — NOT a photo to place as hero/logo. */
export function isScreenshotUiEditAsk(message: string): boolean {
  const m = (message || "").trim();
  if (!m) return false;
  if (isLogoReplaceAsk(m) || isHeroBannerImageAsk(m)) return false;
  return (
    /(center|centre|beech|middle|align|left|right|remove|hata|delete|hide|text|font|size|color|rang|bold|heading|title|likha|brand\s*name|nav|menu|button|btn|cta|gap|spacing|margin|padding)/i.test(
      m,
    ) ||
    // "abhishek mishra remove kro" / named text + action
    (/\b(remove|hata|delete|center|centre|beech)\b/i.test(m) &&
      m.split(/\s+/).length <= 12)
  );
}

/**
 * Image attached but place unclear ("ye laga do" / "add kro" / image-only).
 * Never invent banner/logo success — clarify or use recent chat intent.
 */
export function isAmbiguousImagePlaceAsk(message: string): boolean {
  const m = (message || "").trim();
  if (isLogoReplaceAsk(m) || isHeroBannerImageAsk(m) || isScreenshotUiEditAsk(m))
    return false;
  if (
    /(section|testimonial|team|faq|pricing|map|timeline|slider|match|jaise|reference|design|layout|header|footer|button|btn|cta|color|rang)/i.test(
      m,
    )
  ) {
    return false;
  }
  if (!m) return true;
  if (
    /^(ye|this|is|image|photo|pic|tasveer)?\s*(laga|lagao|add|dal|daal|do|karo|kro)?\.?$/i.test(
      m,
    )
  ) {
    return true;
  }
  if (/^(add|laga|dal)\s*(kro|karo|do)?$/i.test(m)) return true;
  return (
    m.length < 28 &&
    /(laga|lagao|add|dal|daal)/i.test(m) &&
    !/(banner|hero|logo|section)/i.test(m)
  );
}

/** User complaining that two/extra logos showed up. */
export function isDuplicateLogoComplaint(message: string): boolean {
  const m = (message || "").trim();
  if (!m) return false;
  return (
    /two\s*logo|2\s*logo|do\s*logo|double\s*logo|dono\s*logo|extra\s*logo|duplicate\s*logo/i.test(
      m,
    ) ||
    (/logo/i.test(m) &&
      /(kyu|kyun|why).{0,20}(aa|aagya|aa\s*gya|dikha|show)|do\s*(ho|aa)|double/i.test(
        m,
      ))
  );
}

export async function planChatActions(params: {
  message: string;
  /** Original user text — phrase/regex matching (Hinglish). */
  rawMessage?: string;
  brandName: string;
  qualityMode?: "speed" | "quality";
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  hasImages?: boolean;
  /** Optional HTML so planner sees real button labels */
  html?: string;
}): Promise<PlanResult> {
  const clarified = params.message || "";
  const raw = (params.rawMessage || params.message || "").trim();
  // Regex / Hinglish phrase matching prefers raw; fall back to clarified.
  const msg = `${raw}\n${clarified}`;

  // Colorful / rangin — BEFORE any image→hero routing (auto preview snapshot must not steal this)
  const colorfulAsk =
    parseColorfulThemeAsk(raw) || parseColorfulThemeAsk(msg);
  if (colorfulAsk) {
    return { actions: [colorfulAsk] };
  }

  // Duplicate-logo complaint — fix even without a new image attach
  if (isDuplicateLogoComplaint(msg)) {
    return { actions: [{ type: "logo.set" }] };
  }

  // Logo image attach — deterministic (never fake Ho gaya via vision)
  if (params.hasImages && isLogoReplaceAsk(msg) && !isScreenshotUiEditAsk(msg)) {
    return { actions: [{ type: "logo.set" }] };
  }

  // Banner / hero still image — ONLY explicit banner/hero photo asks
  if (
    params.hasImages &&
    isHeroBannerImageAsk(msg) &&
    !isScreenshotUiEditAsk(msg)
  ) {
    return { actions: [{ type: "hero.image" }] };
  }

  // Screenshot crop + text/layout edit (center / remove / color…) → vision edit, never hero.image
  if (params.hasImages && isScreenshotUiEditAsk(msg)) {
    return {
      actions: [{ type: "needs.ai_edit", reason: "screenshot-ui-edit" }],
    };
  }

  // Ambiguous image place — history intent or honest clarify (never fake Ho gaya)
  if (params.hasImages && isAmbiguousImagePlaceAsk(msg)) {
    const hist = (params.history || [])
      .slice(-6)
      .map((h) => String(h.content || ""))
      .join("\n");
    if (isHeroBannerImageAsk(hist) || /(banner|hero)\s*(image|photo|img)/i.test(hist)) {
      return { actions: [{ type: "hero.image" }] };
    }
    if (isLogoReplaceAsk(hist) || /\blogo\b/i.test(hist)) {
      return { actions: [{ type: "logo.set" }] };
    }
    return {
      actions: [
        {
          type: "chat.reply",
          text: "Ye image kahan lagani hai — logo (header) ya banner/hero background?",
        },
      ],
    };
  }

  // Banner / hero video — deterministic (never chat.reply "Ho gaya" without video)
  if (
    /(banner|hero).{0,28}video|video.{0,28}(banner|hero)|banner\s*video|video\s*wala\s*(banner|hero|karo|kr)|hero\s*(ko\s*)?video/i.test(
      msg,
    )
  ) {
    return {
      actions: [{ type: "needs.ai_edit", reason: "hero-video-banner" }],
    };
  }

  // Float color is a fixed schema fill — not a new "rule per phrase"
  const floatColor = parseFloatColorAsk(msg);
  if (floatColor) {
    return { actions: [{ type: "float.recolor", color: floatColor }] };
  }

  // Back to top BEFORE float — "add back to top" must never become WhatsApp float
  const bttAsk = parseBackToTopAsk(msg);
  if (bttAsk) {
    return { actions: [bttAsk] };
  }

  // Float move: geometric parse wins (btt-ke-upar → bottom stack, not viewport top)
  const floatPlace = parseFloatPlaceAsk(msg, params.history);
  if (floatPlace) {
    return { actions: [floatPlace] };
  }

  // Header sticky — deterministic (never "available nahi")
  const stickyAsk = parseHeaderStickyAsk(msg);
  if (stickyAsk) {
    return { actions: [stickyAsk] };
  }

  // Brand rename "fff to Abhishek Mishra" — before logo-ke-baad add
  const brandRename =
    parseBrandRenameAsk(raw, {
      brandName: params.brandName,
      html: params.html,
    }) ||
    parseBrandRenameAsk(clarified, {
      brandName: params.brandName,
      html: params.html,
    });
  if (brandRename) {
    return { actions: [brandRename] };
  }

  // Logo ke baad / bagal name — NEVER header rebuild / never fake Ho gaya
  const brandLabelAsk =
    parseBrandLabelAsk(raw, params.brandName) ||
    parseBrandLabelAsk(clarified, params.brandName);
  if (brandLabelAsk) {
    return { actions: [brandLabelAsk] };
  }

  // Instant wow / premium motion polish (deterministic rails)
  if (wantsCreateAiWowPolish(msg)) {
    // Full theme words → theme AI after wow rails
    if (
      /\b(theme|theam|design|pura\s*site|whole\s*site|colors?\s*badal|palette)\b/i.test(
        msg,
      )
    ) {
      return {
        actions: [
          { type: "layout.wow" },
          { type: "needs.ai_edit", reason: "site-theme" },
        ],
      };
    }
    return { actions: [{ type: "layout.wow" }] };
  }

  // Full site theme refresh — never shrink to header-only / clarify quiz
  if (
    /\b(theme|theam|thim)\b.{0,32}(better|improve|change|badal|new|naya|update|acha|achha|refresh|sundar)/i.test(
      msg,
    ) ||
    /\b(better|improve|change|badal|new|naya|update|acha|achha)\b.{0,32}\b(theme|theam|design|look)\b/i.test(
      msg,
    ) ||
    /\b(pura|whole|overall)\s*(theme|design|look|site|website)\b/i.test(msg) ||
    (/\b(theme|design\s*better|look\s*better)/i.test(
      (params.history || [])
        .map((h) => h.content)
        .join("\n"),
    ) &&
      /apne\s*according|khud\s*(se|hi)|your\s*(choice|call)|app\s*apne/i.test(msg))
  ) {
    return { actions: [{ type: "needs.ai_edit", reason: "site-theme" }] };
  }

  // Footer improve — BEFORE color.set (was inventing "Contact → black")
  const footerPolish =
    parseFooterImproveAsk(raw) || parseFooterImproveAsk(clarified);
  if (footerPolish) {
    return { actions: [footerPolish] };
  }

  // Named / ordinal CTA + color → deterministic (no LLM inventing "Home")
  const labeledColor = parseLabeledButtonColorAsk(
    raw,
    params.html || "",
    params.history,
  ) || parseLabeledButtonColorAsk(
    clarified,
    params.html || "",
    params.history,
  );
  if (labeledColor) {
    return { actions: [labeledColor] };
  }

  // "text bola, bg kar diya" correction without repeating the label
  const textFix = parseTextNotBgCorrection(msg, params.html || "", params.history);
  if (textFix) {
    return { actions: [textFix] };
  }

  // Screenshot + button color: still schema fill — don't let vision invent nav labels
  if (
    params.hasImages &&
    /\b(button|btn|cta|text\s*color|color\s*#)\b/i.test(msg) &&
    !/(add|bana|dal|laga|section|testimonial|team|faq|pricing|reference|jaise)/i.test(
      msg,
    )
  ) {
    const again = parseLabeledButtonColorAsk(msg, params.html || "", params.history);
    if (again) return { actions: [again] };
  }

  // Attached screenshot for section/layout → vision AI, never default template paste
  // (logo asks already returned above)
  if (
    params.hasImages &&
    /(add|bana|dal|laga|section|testimonial|team|faq|pricing|map|video|timeline|slider|match|jaise|reference|design|layout)/i.test(
      msg,
    ) &&
    !isLogoReplaceAsk(msg) &&
    !isHeroBannerImageAsk(msg)
  ) {
    return {
      actions: [{ type: "needs.ai_edit", reason: "screenshot-section" }],
    };
  }

  if (
    params.hasImages &&
    !/float|floating|color|rang|button|btn|cta/i.test(msg) &&
    !isLogoReplaceAsk(msg) &&
    !isHeroBannerImageAsk(msg)
  ) {
    return { actions: [{ type: "needs.ai_edit", reason: "screenshot" }] };
  }
  if (params.hasImages && /float|floating/i.test(msg) && /color|rang/i.test(msg)) {
    const c = parseFloatColorAsk(msg) || "theme";
    return { actions: [{ type: "float.recolor", color: c }] };
  }

  const historyBlock = (params.history || [])
    .slice(-8)
    .map((h) => `${h.role}: ${String(h.content || "").slice(0, 200)}`)
    .join("\n");
  const buttons = listContentCtaLabels(params.html || "", 14);
  const allBtns = listPageButtonLabels(params.html || "", 14);

  try {
    const route = createAiPlannerRoute(
      params.qualityMode === "quality" ? "quality" : "speed",
    );
    const ai = await generateAiText({
      preferProvider: route.primary,
      modelTier: route.tier,
      messages: [
        { role: "system", content: ACTION_SYSTEM },
        {
          role: "user",
          content: `Brand: ${params.brandName}
CTA buttons (prefer these for "button" asks): ${buttons.length ? buttons.map((b) => `"${b}"`).join(", ") : "(none)"}
All links/buttons: ${allBtns.length ? allBtns.map((b) => `"${b}"`).join(", ") : "(unknown)"}
NEVER pick nav labels Home/About/Services for "second button" / hero CTA asks.
Recent:
${historyBlock || "(none)"}
User raw: ${raw || clarified}
Clarified prompt: ${clarified}
Decide carefully — match the exact ask, no random extras.
JSON:`,
        },
      ],
      temperature: 0,
      maxTokens: 480,
      jsonMode: true,
    });
    let actions = parseActions(ai.text);
    actions = actions.flatMap((a) => {
      if (
        a.type === "chat.reply" &&
        /sticky/i.test(a.text) &&
        /available nahi|not available|nahi hai|unsupported|can't|cannot/i.test(
          a.text,
        )
      ) {
        return [{ type: "header.sticky" as const, on: true }];
      }
      if (
        a.type === "chat.reply" &&
        /hex|#ff|color code|exact color|scheme|batao.*rang|code\s*do|css\s*class|class\s*name|selector/i.test(
          a.text,
        )
      ) {
        // Never interrogate the user — try float theme or button fill from message
        if (/float|whatsapp|floating/i.test(msg)) {
          return [{ type: "float.recolor" as const, color: "theme" as const }];
        }
        const labeled = parseLabeledButtonColorAsk(
          msg,
          params.html || "",
          params.history,
        );
        if (labeled) return [labeled];
        return [{ type: "needs.ai_edit" as const, reason: "color-without-ask" }];
      }
      if (
        a.type === "color.set" &&
        NAV_BTN.test(String(a.label || "")) &&
        /\b(button|btn|cta|second|first)\b/i.test(msg)
      ) {
        const ctas = listContentCtaLabels(params.html || "", 12);
        const ord = parseOrdinalButtonIndex(msg);
        const fixed = (ord != null ? ctas[ord] : null) || ctas[1] || ctas[0];
        if (fixed) return [{ ...a, label: fixed }];
      }
      if (
        a.type === "color.set" &&
        /float|whatsapp|floating|call\s*icon/i.test(msg)
      ) {
        return [
          {
            type: "float.recolor" as const,
            color: String(a.color || "theme"),
          },
        ];
      }
      return [a];
    });
    return {
      actions:
        actions.length > 0
          ? actions
          : [{ type: "needs.ai_edit", reason: "empty-plan" }],
      provider: ai.provider,
      model: ai.model,
      tokensUsed: ai.tokensUsed,
    };
  } catch {
    return { actions: [{ type: "needs.ai_edit", reason: "plan-failed" }] };
  }
}

/** "fff to Abhishek Mishra" / "X ko Y" — rename brand label, not re-add old name. */
export function parseBrandRenameAsk(
  message: string,
  opts?: { brandName?: string; html?: string },
): Extract<ChatAction, { type: "brand.label" }> | null {
  const m = (message || "").trim();
  if (!m || m.length > 140) return null;
  // Don't steal color / button / header redesign
  if (
    /\b(color|colour|rang|button|btn|cta|sticky|float|whatsapp|section|faq|pricing)\b/i.test(
      m,
    )
  ) {
    return null;
  }
  const hit =
    m.match(
      /^(?:change|rename|update|badal(?:o)?)\s+(?:brand\s*(?:name|naam)?\s+)?["']?(.+?)["']?\s+(?:to|ko|->|→)\s+["']?(.+?)["']?\s*$/i,
    ) ||
    m.match(
      /^(?:brand\s*(?:name|naam)\s+)?["']?(.+?)["']?\s+(?:to|→|->)\s+["']?(.+?)["']?\s*$/i,
    ) ||
    m.match(
      /^["']?(.+?)["']?\s+ko\s+["']?(.+?)["']?\s*(?:karo|kro|kar\s*do|bana\s*do)?\s*$/i,
    );
  if (!hit) return null;
  const from = (hit[1] || "").replace(/\s+/g, " ").trim();
  const to = (hit[2] || "").replace(/\s+/g, " ").trim();
  if (!from || !to || from.toLowerCase() === to.toLowerCase()) return null;
  if (to.length < 2 || to.length > 80 || from.length > 60) return null;
  if (
    /^(header|nav|menu|footer|hero|section|text|color|colour|font|logo|name|naam|brand)$/i.test(
      from,
    )
  ) {
    return null;
  }
  if (
    /^(white|black|red|blue|yellow|green|orange|purple|pink|#?[0-9a-f]{3,8})$/i.test(
      to,
    )
  ) {
    return null;
  }
  const brand = (opts?.brandName || "").trim();
  const chip =
    (opts?.html || "").match(
      /<(?:span|div|a)\b[^>]*data-(?:create-ai|cai)-brand=["']1["'][^>]*>([\s\S]*?)<\/(?:span|div|a)>/i,
    )?.[1] || "";
  const chipText = chip
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const fromL = from.toLowerCase();
  // Prefer when old name matches onboarding brand or visible chip; else allow short tokens (fff)
  const grounded =
    (brand && brand.toLowerCase() === fromL) ||
    (chipText && chipText.includes(fromL)) ||
    from.length <= 24;
  if (!grounded) return null;
  return { type: "brand.label", name: to.slice(0, 80) };
}

/** "logo ke baad name" / "header pe Abhishek Mishra add" */
export function parseBrandLabelAsk(
  message: string,
  fallbackName?: string,
): Extract<ChatAction, { type: "brand.label" }> | null {
  const m = message || "";
  if (!m) return null;
  // Rename path owns "X to Y"
  if (parseBrandRenameAsk(m)) return null;
  if (
    /\b(header|heder|nav)\b.{0,24}\b(update|updte|fix|redesign|theek|acha|new|naya|dark|premium)\b/i.test(
      m,
    )
  ) {
    return null;
  }
  const hit =
    /\b(logo|brand)\b.{0,40}\b(name|naam|text|likha)\b/i.test(m) ||
    /\b(name|naam)\b.{0,40}\b(logo|brand)\b/i.test(m) ||
    /(logo|brand).{0,24}(ke\s*)?(baad|bagal|paas|beside|after|next\s*to).{0,40}(name|naam|add|dal|laga)/i.test(
      m,
    ) ||
    /(name|naam).{0,24}(logo|brand).{0,24}(baad|bagal|paas|beside|after|next)/i.test(
      m,
    ) ||
    /\b(bas\s*)?(name|naam)\s*(add|dal|laga)/i.test(m) ||
    /(?:add|dal|laga)\s+[A-Za-z][A-Za-z .'-]{1,40}.{0,30}(logo|header|brand|bagal|baad)/i.test(
      m,
    ) ||
    /header.{0,40}(logo|brand).{0,40}(add|dal|laga).{0,40}(name|naam|[A-Z][a-z]+)/i.test(
      m,
    );
  if (!hit) return null;
  const quoted =
    m.match(/["'“”]([^"'“”]{2,60})["'“”]/)?.[1] ||
    m.match(
      /\badd\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/,
    )?.[1] ||
    m.match(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s*(add|dal|laga)/i,
    )?.[1];
  const name = (quoted || fallbackName || "").trim().slice(0, 80);
  return { type: "brand.label", name: name || undefined };
}

/** "header sticky kro" / "unsticky header" */
function parseHeaderStickyAsk(
  message: string,
): Extract<ChatAction, { type: "header.sticky" }> | null {
  const m = (message || "").trim();
  if (!m) return null;
  if (!/\bsticky\b/i.test(m)) return null;
  if (!/\b(header|heder|hedar|nav|navbar|menu\s*bar|top\s*bar)\b/i.test(m)) {
    // bare "sticky kro" after header talk — still ok if sticky + kro
    if (!/\bsticky\s*(kro|karo|on|on\s*karo|laga|enable)\b/i.test(m)) return null;
  }
  const off =
    /\b(un\s*sticky|unsticky|sticky\s*(hata|off|band|remove)|no\s*sticky|sticky\s*mat)\b/i.test(
      m,
    );
  return { type: "header.sticky", on: !off };
}

/** "add back to top" / "btt hatao" — never confuse with float icons. */
function parseBackToTopAsk(
  message: string,
): Extract<ChatAction, { type: "widget.backToTop" }> | null {
  const m = (message || "").trim();
  if (!m) return null;
  if (
    !/(back\s*to\s*top|backtotop|\bbtt\b|scroll\s*to\s*top|wapas\s*upar|top\s*(pe\s*)?(jao|button))/i.test(
      m,
    )
  ) {
    return null;
  }
  // Positioning float relative to BTT ("btt ke upar float") is float.place, not BTT
  if (
    /float|floating|whatsapp|wa\s*icon|call\s*icon/i.test(m) &&
    /(upar|above|left|right|neeche|bottom)/i.test(m)
  ) {
    return null;
  }
  const off =
    /\b(hata|remove|off|band|delete|mat\s*laga|no\s*back)\b/i.test(m);
  return { type: "widget.backToTop", on: !off };
}

/** "floating icon left" / "btt ke upar right" → float.place without LLM. */
function parseFloatPlaceAsk(
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
): Extract<ChatAction, { type: "float.place" }> | null {
  const m = (message || "").trim();
  if (!m) return null;
  // Pure back-to-top ask is never a float
  if (
    /(back\s*to\s*top|backtotop|\bbtt\b|scroll\s*to\s*top)/i.test(m) &&
    !/float|floating|whatsapp|wa\s*icon|call\s*icon/i.test(m)
  ) {
    return null;
  }
  const hist = (history || []).map((h) => h.content).join("\n");
  const floatCtx =
    /float|floating|whatsapp|call\s*icon|wa\s*icon/i.test(m) ||
    (/float|floating|whatsapp|call\s*icon/i.test(hist) &&
      /(left|right|top|bottom|upar|neeche|center|back\s*to\s*top|backtotop|\bbtt\b)/i.test(
        m,
      ));
  if (!floatCtx) return null;
  // color-only float asks handled elsewhere
  if (
    /color|rang|colour/i.test(m) &&
    !/(left|right|top|bottom|upar|neeche|center|back\s*to\s*top|backtotop)/i.test(m)
  ) {
    return null;
  }
  const p = parseFloatPlacementLocal(m);
  if (!p) return null;
  return { type: "float.place", side: p.side, vertical: p.vertical };
}

/** "floating icon color red" / "float icons blue" → named color or theme */
function parseFloatColorAsk(message: string): string | null {
  const m = (message || "").trim();
  if (!/float|floating|whatsapp|call\s*icon|wa\s*icon/i.test(m)) return null;
  if (/theme|khud\s*nikalo|site\s*color/i.test(m)) return "theme";
  const named = m.match(
    /\b(red|blue|green|black|white|orange|purple|pink|yellow|teal|maroon|brown|gray|grey|gold)\b/i,
  );
  if (named) return named[1].toLowerCase();
  const hex = m.match(/#([0-9a-f]{3,8})\b/i);
  if (hex) return `#${hex[1]}`;
  if (/color|rang|colour/i.test(m)) return "theme";
  return null;
}

/** "footer acha sa bnao" / "footer theek karo" — never color.set Contact. */
export function parseFooterImproveAsk(
  message: string,
): Extract<ChatAction, { type: "footer.polish" }> | null {
  const m = (message || "").trim();
  if (!m) return null;
  if (!/\b(footer|futer|foooter|foter)\b/i.test(m)) return null;
  // Pure footer color ask → colorful path elsewhere
  if (
    /\b(colorful|colourful|rangin|vibrant)\b/i.test(m) &&
    !/\b(acha|achha|theek|bana|bnao|improve|better|redesign|sundar|premium|fix)\b/i.test(
      m,
    )
  ) {
    return null;
  }
  if (
    /\b(acha|achha|theek|bana|bnao|banao|banado|improve|better|redesign|sundar|premium|fix|update|naya|new|clean|sudhar|badal|change)\b/i.test(
      m,
    ) ||
    /\bfooter\s*(bana|bnao|banao|fix|update|polish)\b/i.test(m)
  ) {
    return { type: "footer.polish" };
  }
  return null;
}

/** "Explore Offerings pe black" / "second button text #000" — no LLM. */
function parseLabeledButtonColorAsk(
  message: string,
  html: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
): Extract<ChatAction, { type: "color.set" }> | null {
  const m = (message || "").trim();
  if (!m || /float|floating|whatsapp|call\s*icon/i.test(m)) return null;
  // Footer/header redesign ≠ button color
  if (
    parseFooterImproveAsk(m) ||
    (/\b(footer|futer|header|heder)\b/i.test(m) &&
      /\b(acha|achha|theek|bana|bnao|banao|improve|better|redesign|sundar|premium|fix|update)\b/i.test(
        m,
      ) &&
      !/\b(button|btn|cta|text\s*color|color\s*#)\b/i.test(m))
  ) {
    return null;
  }
  // Require real color intent — not loose "ko"/"pe" alone (was stealing asks)
  if (
    !/\b(color|colour|rang|black|white|red|blue|green|yellow|orange|#([0-9a-f]{3,8}))\b/i.test(
      m,
    )
  ) {
    return null;
  }
  if (
    !/\b(button|btn|cta|text|likha|label|heading|title|font)\b/i.test(m) &&
    !/\b(pe|ko)\s+(black|white|red|blue|green|yellow|#)/i.test(m) &&
    !/"[^"]{2,40}"\s*(pe|ko|color)/i.test(m)
  ) {
    // Allow "Explore Offerings pe black" style without saying button
    if (!/\bpe\s+(black|white|red|blue|green|#)/i.test(m)) return null;
  }
  const allLabels = listPageButtonLabels(html, 24);
  const ctas = listContentCtaLabels(html, 12);
  const lower = m.toLowerCase();
  const ord = parseOrdinalButtonIndex(m);
  let label: string | undefined;

  // 0) Header CTA location ask without button name → last header CTA label
  if (
    /\b(header|heder|hedar|haeder)\b/i.test(m) &&
    /\b(button|btn|buuton|botton|cta)\b/i.test(m)
  ) {
    const hdr = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
    const hdrLabels: string[] = [];
    const re = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let hm: RegExpExecArray | null;
    while ((hm = re.exec(hdr))) {
      const attrs = hm[2] || "";
      const text = (hm[3] || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!text || text.length > 36) continue;
      if (/data-cai-brand|data-create-ai-brand|data-cai-menu/i.test(attrs)) {
        continue;
      }
      if (
        /btn|cta|button|padding|background|border-radius/i.test(attrs) ||
        /book|get\s*started|schedule|repair|enquire|request|talk|visit|consult/i.test(
          text,
        )
      ) {
        hdrLabels.push(text);
      }
    }
    if (hdrLabels.length) label = hdrLabels[hdrLabels.length - 1];
  }

  // 1) Ordinal: "second button" → 2nd content CTA (not Home)
  if (!label && ord != null && ctas[ord]) {
    label = ctas[ord];
  }

  // 2) Exact / fuzzy name in message (skip tiny nav false-positives)
  if (!label) {
    label =
      allLabels.find(
        (l) => l.length >= 4 && lower.includes(l.toLowerCase()),
      ) ||
      allLabels.find((l) => {
        const words = l.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        return words.length >= 2 && words.every((w) => lower.includes(w));
      });
  }

  // 3) History ONLY when this message clearly refers to a prior button
  if (
    !label &&
    /\b(button|btn|cta|uska|uski|usi|same|woh|wo)\b/i.test(m)
  ) {
    label =
      inferLabelFromHistory(ctas.length ? ctas : allLabels, history) ||
      undefined;
  }

  // 4) Nav label + "button" ask → remap to content CTA / history
  if (
    label &&
    NAV_BTN.test(label) &&
    /\b(button|btn|cta|second|first)\b/i.test(m)
  ) {
    label =
      (ord != null ? ctas[ord] : undefined) ||
      inferLabelFromHistory(ctas, history) ||
      ctas[1] ||
      ctas[0] ||
      label;
  }

  if (!label) return null;
  if (NAV_BTN.test(label) && /\b(button|btn|cta)\b/i.test(m)) {
    if (ctas.length) label = ctas[Math.min(ord ?? 1, ctas.length - 1)];
    else return null;
  }
  // Never paint bare nav "Contact" from footer/history noise
  if (NAV_BTN.test(label) && !/\b(button|btn|cta)\b/i.test(m)) {
    return null;
  }

  let color = "black";
  const hex = m.match(/#([0-9a-f]{3,8})\b/i);
  if (hex) color = `#${hex[1]}`;
  else {
    const named = m.match(
      /\b(red|blue|green|black|white|orange|purple|pink|yellow|teal|maroon|brown|gray|grey|gold)\b/i,
    );
    if (named) color = named[1].toLowerCase();
    else if (!/color|rang|colour/i.test(m)) return null;
  }

  // "text" always wins — never fill
  const textOnly = /\b(text|likha|font)\b/i.test(m);
  const hoverOnly = /\bhover|mouse\s*over|:hover\b/i.test(m);
  const fillHint =
    !textOnly &&
    !hoverOnly &&
    /background|fill|\bbg\b|solid/i.test(m);

  let hoverColor: string | undefined;
  if (!hoverOnly) {
    const lum = hexLuminance(colorToHex(color));
    hoverColor = lum < 140 ? "#ffffff" : "#111111";
  }

  return {
    type: "color.set",
    label,
    color,
    property: textOnly || hoverOnly ? "color" : fillHint ? "background" : "color",
    target: "button",
    state: hoverOnly ? "hover" : "both",
    hoverColor,
  };
}

/** User correction: asked for text, we painted fill — repair without new phrase piles. */
function parseTextNotBgCorrection(
  message: string,
  html: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
): Extract<ChatAction, { type: "color.set" }> | null {
  const m = (message || "").trim();
  if (
    !/text\s*(color|rang)?\s*(bola|bola\s*tha|chahiye)|sirf\s*text|bg\s*(color\s*)?kar|background\s*kar|fill\s*kar\s*diya|text\s*bola.*bg|maine\s*text/i.test(
      m,
    )
  ) {
    return null;
  }
  const labels = listPageButtonLabels(html, 20);
  const label = inferLabelFromHistory(labels, history);
  if (!label) return null;
  let color = "#000000";
  const blob = `${m}\n${(history || []).map((h) => h.content).join("\n")}`;
  const hex = blob.match(/#([0-9a-f]{3,8})\b/i);
  if (hex) color = `#${hex[1]}`;
  else if (/\bwhite|#fff\b/i.test(blob)) color = "#ffffff";
  return {
    type: "color.set",
    label,
    color,
    property: "color",
    target: "button",
    state: "both",
    hoverColor: hexLuminance(colorToHex(color)) < 140 ? "#ffffff" : "#111111",
  };
}

function inferLabelFromHistory(
  labels: string[],
  history?: Array<{ role: "user" | "assistant"; content: string }>,
): string | null {
  if (!labels.length || !history?.length) return null;
  for (const h of [...history].reverse()) {
    const c = String(h.content || "");
    const hit = labels.find((l) => c.toLowerCase().includes(l.toLowerCase()));
    if (hit) return hit;
    const quoted = c.match(/"([^"]{2,48})"\s*→/);
    if (quoted) {
      const q = quoted[1];
      const match = labels.find((l) => l.toLowerCase() === q.toLowerCase());
      if (match) return match;
    }
  }
  return null;
}

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(full)) return 128;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function parseActions(text: string): ChatAction[] {
  try {
    const raw = (text || "")
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const data = JSON.parse(raw) as { actions?: unknown };
    if (!Array.isArray(data.actions)) return [];
    const out: ChatAction[] = [];
    for (const item of data.actions) {
      if (!item || typeof item !== "object") continue;
      const a = item as Record<string, unknown>;
      const type = String(a.type || "");
      if (type === "float.place") {
        out.push({
          type: "float.place",
          side: normalizeSide(a.side),
          vertical: normalizeVertical(a.vertical),
          email: Boolean(a.email),
          themeColor:
            a.themeColor === true ||
            String(a.themeColor || "").toLowerCase() === "theme"
              ? true
              : typeof a.themeColor === "string"
                ? a.themeColor
                : undefined,
        });
      } else if (type === "float.recolor") {
        out.push({
          type: "float.recolor",
          color:
            !a.color || String(a.color).toLowerCase() === "theme"
              ? "theme"
              : String(a.color),
        });
      } else if (type === "widget.backToTop") {
        out.push({ type: "widget.backToTop", on: a.on !== false });
      } else if (type === "header.sticky") {
        out.push({ type: "header.sticky", on: a.on !== false });
      } else if (type === "layout.responsive") {
        out.push({ type: "layout.responsive", on: a.on !== false });
      } else if (type === "layout.wow") {
        out.push({ type: "layout.wow" });
      } else if (type === "footer.polish") {
        out.push({ type: "footer.polish" });
      } else if (type === "hero.video") {
        const y = String(a.youtube || a.url || "").trim();
        out.push({
          type: "hero.video",
          youtube: !y || /dummy|demo|sample/i.test(y) ? "dummy" : y.slice(0, 200),
        });
      } else if (type === "color.set") {
        const st = String(a.state || "both").toLowerCase();
        out.push({
          type: "color.set",
          target: normalizeColorTarget(a.target),
          color: String(a.color || "white"),
          label: a.label ? String(a.label).trim().slice(0, 80) : undefined,
          property:
            String(a.property || "color").toLowerCase() === "background"
              ? "background"
              : "color",
          state:
            st === "hover" ? "hover" : st === "normal" ? "normal" : "both",
          hoverColor: a.hoverColor
            ? String(a.hoverColor).trim().slice(0, 32)
            : undefined,
        });
      } else if (type === "section.add") {
        const kind = normalizeSection(a.kind);
        if (kind) out.push({ type: "section.add", kind });
      } else if (type === "chat.reply") {
        const t = String(a.text || "").trim();
        if (t) out.push({ type: "chat.reply", text: t.slice(0, 4000) });
      } else if (type === "needs.ai_edit") {
        out.push({
          type: "needs.ai_edit",
          reason: String(a.reason || "complex"),
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function normalizeSide(v: unknown): FloatPlacement["side"] {
  const s = String(v || "right").toLowerCase();
  if (s === "left" || s === "center" || s === "right") return s;
  return "right";
}

function normalizeVertical(v: unknown): FloatPlacement["vertical"] {
  const s = String(v || "bottom").toLowerCase();
  if (s === "top" || s === "center" || s === "bottom") return s;
  return "bottom";
}

function normalizeColorTarget(
  v: unknown,
): "button" | "heading" | "hero" | "headerCta" {
  const s = String(v || "button").toLowerCase();
  if (s === "heading" || s === "hero" || s === "headercta" || s === "headerCta")
    return s === "headercta" ? "headerCta" : (s as "heading" | "hero" | "headerCta");
  return "button";
}

function normalizeSection(
  v: unknown,
):
  | "team"
  | "faq"
  | "pricing"
  | "testimonials"
  | "map"
  | "video"
  | "timeline"
  | "clientSlider"
  | null {
  const s = String(v || "").toLowerCase().replace(/\s+/g, "");
  const map: Record<
    string,
    Extract<ChatAction, { type: "section.add" }>["kind"]
  > = {
    team: "team",
    faq: "faq",
    pricing: "pricing",
    testimonials: "testimonials",
    testimonial: "testimonials",
    map: "map",
    video: "video",
    timeline: "timeline",
    clientslider: "clientSlider",
    clients: "clientSlider",
  };
  return map[s] || null;
}

export type ExecuteContext = {
  html: string;
  brandName: string;
  mobile?: string;
  email?: string;
  address?: string;
  message: string;
  /** When true, never paste default section templates — defer to vision AI */
  hasImages?: boolean;
  /** data:image/... for logo.set */
  imageDataUrl?: string;
};

export type ExecuteResult = {
  html: string;
  notes: string[];
  replyOnly?: string;
  /** If true, fall through to surgical / full AI edit */
  needsAiEdit: boolean;
  ai?: Partial<AiTextResult>;
  /** Logo data URL applied — client should persist on payload */
  logoImage?: string;
};

function colorToHex(color: string): string {
  const c = (color || "white").trim().toLowerCase();
  const map: Record<string, string> = {
    white: "#ffffff",
    black: "#111111",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    orange: "#ea580c",
    purple: "#7c3aed",
    pink: "#db2777",
    yellow: "#ca8a04",
    teal: "#0f766e",
    maroon: "#9f1239",
    brown: "#92400e",
    gray: "#4b5563",
    grey: "#4b5563",
    gold: "#c9a227",
    dark: "#0f172a",
    light: "#f8fafc",
  };
  if (c.startsWith("#") && /^#[0-9a-f]{3,8}$/i.test(c)) return c;
  return map[c] || "#ffffff";
}

function slugBtnLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "btn"
  );
}

function upsertLabeledBtnCss(
  html: string,
  slug: string,
  cssBody: string,
): string {
  let out = html.replace(
    new RegExp(
      `<style\\b[^>]*data-cai-btn-css=["']${slug}["'][^>]*>[\\s\\S]*?<\\/style>`,
      "gi",
    ),
    "",
  );
  // Last in document wins cascade vs page <style> in <head>
  const tag = `<style data-cai-btn-css="${slug}">${cssBody}</style>`;
  if (/<\/body>/i.test(out)) return out.replace(/<\/body>/i, `${tag}</body>`);
  if (/<\/head>/i.test(out)) return out.replace(/<\/head>/i, `${tag}</head>`);
  return `${out}${tag}`;
}

function mergeInlineStyle(attrs: string, patch: string): string {
  if (/\bstyle\s*=\s*(["'])/i.test(attrs)) {
    return attrs.replace(
      /\bstyle\s*=\s*(["'])([^"']*)\1/i,
      (_s, q: string, style: string) => {
        const decls = patch
          .split(";")
          .map((p) => p.trim())
          .filter(Boolean);
        let cleaned = style;
        for (const decl of decls) {
          const key = decl.split(":")[0]?.trim().toLowerCase();
          if (!key) continue;
          if (key === "background" || key === "background-color") {
            cleaned = cleaned.replace(
              /background(?:-color)?\s*:\s*[^;]+;?/gi,
              "",
            );
          } else if (key === "color") {
            // don't eat "background-color"
            cleaned = cleaned.replace(
              /(^|;)\s*color\s*:\s*[^;]+/gi,
              "$1",
            );
          } else {
            cleaned = cleaned.replace(
              new RegExp(
                `(^|;)\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*[^;]+`,
                "gi",
              ),
              "$1",
            );
          }
        }
        cleaned = cleaned
          .replace(/;;+/g, ";")
          .replace(/^;|;$/g, "")
          .trim();
        const joined = cleaned ? `${patch};${cleaned}` : patch;
        return `style=${q}${joined}${q}`;
      },
    );
  }
  return `${attrs} style="${patch}"`;
}

function applyColorAction(
  html: string,
  target: string,
  color: string,
  label?: string,
  property: "color" | "background" = "color",
  state: "normal" | "hover" | "both" = "both",
  hoverColor?: string,
): { html: string; ok: boolean } {
  const hex =
    color === "theme" || /theme/i.test(color)
      ? extractThemeAccentFromHtml(html)
      : colorToHex(color);
  const isDark = hexLuminance(hex) < 140;
  const contrast = isDark ? "#ffffff" : "#111111";
  const hoverHex = hoverColor
    ? colorToHex(hoverColor)
    : isDark
      ? "#ffffff"
      : "#111111";
  const hoverIsDark = hexLuminance(hoverHex) < 140;
  const hoverContrast = hoverIsDark ? "#ffffff" : "#111111";

  // Scoped: labeled button — inline !important (beats page inline) + end CSS for :hover
  if (label && label.trim().length >= 2) {
    const needle = label.trim().toLowerCase().replace(/\s+/g, " ");
    const slug = slugBtnLabel(label);
    const re = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let changed = false;
    const fillMode = property === "background";
    let out = html.replace(
      re,
      (full, tag: string, attrs: string, inner: string) => {
        const text = inner
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
        if (
          !text.includes(needle) &&
          text.replace(/\s/g, "") !== needle.replace(/\s/g, "")
        ) {
          const words = needle.split(" ").filter((w) => w.length > 2);
          if (!words.length || !words.every((w) => text.includes(w))) return full;
        }
        if (/data-create-ai-float/i.test(attrs)) return full;
        changed = true;
        let nextAttrs = attrs.replace(/\s*data-cai-btn=(["'])[^"']*\1/gi, "");
        nextAttrs = `${nextAttrs} data-cai-btn="${slug}"`;

        // Inline beats stylesheet !important — required when CTA already has color:#fff !important
        if (state === "normal" || state === "both") {
          const inlinePatch = fillMode
            ? `background:${hex} !important;background-color:${hex} !important;color:${contrast} !important;border-color:${hex} !important`
            : // text-only: NEVER clear button fill (was making CTA transparent → QA rail forced dark ink again)
              `color:${hex} !important`;
          nextAttrs = mergeInlineStyle(nextAttrs, inlinePatch);
        }

        let nextInner = inner;
        if (state === "normal" || state === "both") {
          const textColor = fillMode ? contrast : hex;
          nextInner = nextInner.replace(
            /<(span|strong|em|i|b)\b([^>]*)>/gi,
            (_m, t: string, a: string) => {
              if (/\bstyle\s*=/i.test(a)) {
                return `<${t}${mergeInlineStyle(a, `color:${textColor} !important`)}>`;
              }
              return `<${t}${a} style="color:${textColor} !important">`;
            },
          );
        }
        return `<${tag}${nextAttrs}>${nextInner}</${tag}>`;
      },
    );
    if (!changed) return { html, ok: false };

    const sel = `html body a[data-cai-btn="${slug}"],html body button[data-cai-btn="${slug}"]`;
    const rules: string[] = [];
    if (state === "normal" || state === "both") {
      if (fillMode) {
        rules.push(
          `${sel}{background:${hex} !important;background-color:${hex} !important;color:${contrast} !important;border-color:${hex} !important}`,
          `${sel} *{color:${contrast} !important}`,
        );
      } else {
        rules.push(
          `${sel}{color:${hex} !important}`,
          `${sel} *{color:${hex} !important}`,
        );
      }
    }
    if (state === "hover" || state === "both") {
      if (fillMode) {
        const hBg =
          state === "both" && !hoverColor
            ? isDark
              ? "#333333"
              : "#111111"
            : hoverHex;
        const hTx =
          state === "both" && !hoverColor ? "#ffffff" : hoverContrast;
        rules.push(
          `${sel}:hover{background:${hBg} !important;background-color:${hBg} !important;color:${hTx} !important;border-color:${hBg} !important}`,
          `${sel}:hover *{color:${hTx} !important}`,
        );
      } else {
        // Text-only: hover changes TEXT only — never slap a solid fill (that looked like "bg kar diya")
        const c = state === "hover" ? hex : hoverHex;
        rules.push(`${sel}:hover,${sel}:hover *{color:${c} !important}`);
      }
    }
    out = upsertLabeledBtnCss(out, slug, rules.join(""));
    return { html: out, ok: true };
  }

  if (/button|headercta|cta/i.test(target)) {
    return { html, ok: false };
  }

  const styleId = "data-create-ai-micro-color";
  let out = html.replace(
    new RegExp(
      `<style\\b[^>]*${styleId}=["']1["'][^>]*>[\\s\\S]*?<\\/style>`,
      "gi",
    ),
    "",
  );
  const css = `h1, h2, .hero h1, main h1, section h1:first-of-type { color: ${hex} !important; }`;
  const tag = `<style ${styleId}="1">${css}</style>`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${tag}</body>`);
  else if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${tag}</head>`);
  else out = `${out}${tag}`;
  return { html: out, ok: true };
}

function extractMobile(html: string, fallback?: string) {
  const fromBody = (fallback || "").trim();
  if (fromBody.replace(/\D/g, "").length >= 8) return fromBody;
  const tel = html.match(/href=["']tel:([^"']+)["']/i)?.[1];
  if (tel) return tel;
  return html.match(/wa\.me\/(\d{8,15})/i)?.[1] || "";
}

/**
 * Run planned actions. Returns needsAiEdit if planner deferred to freeform AI.
 */
export function executeChatActions(
  actions: ChatAction[],
  ctx: ExecuteContext,
): ExecuteResult {
  let html = ctx.html;
  const notes: string[] = [];
  let replyOnly: string | undefined;
  let needsAiEdit = false;
  let logoImageOut: string | undefined;
  const hadBtt =
    /id=["']create-ai-btt["']/i.test(html) ||
    /data-create-ai-btt=["']1["']/i.test(html);

  for (const action of actions) {
    if (action.type === "needs.ai_edit") {
      needsAiEdit = true;
      continue;
    }
    if (action.type === "logo.set") {
      const attached = (ctx.imageDataUrl || "").trim();
      const fromHtml = extractCreateAiLogoSrc(ctx.html);
      const complaint = isDuplicateLogoComplaint(ctx.message);
      // Screenshot of "two logos" must NOT become the new logo src.
      let src = complaint
        ? fromHtml || (attached.startsWith("data:image") ? attached : "")
        : attached.startsWith("data:image")
          ? attached
          : fromHtml;
      // Oversized data-URL will break validation / JSON — refuse politely
      if (src.startsWith("data:image") && src.length > 220_000) {
        replyOnly =
          "Logo file thoda badi hai — chhoti PNG/JPG (square ~512px) attach karke dubara “ye logo laga do” likho.";
        notes.push("chat");
        continue;
      }
      if (!src) {
        replyOnly =
          "Logo image attach karo (sirf logo file), phir likho “ye logo header pe laga do”.";
        notes.push("chat");
        continue;
      }
      let next = dedupeHeaderBrandLogo(html, src, ctx.brandName);
      next = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(
          ensureCreateAiResponsive(normalizeCreateAiCopyrightYear(next)),
        ),
      );
      // Re-stamp ONE logo after header normalize
      next = dedupeHeaderBrandLogo(next, src, ctx.brandName);
      next = ensureCreateAiHeaderBrand(next, ctx.brandName, src);
      // Final pass: strip any leftover second header img
      next = dedupeHeaderBrandLogo(next, src, ctx.brandName);
      if (!/data-create-ai-logo=["']1["']/i.test(next)) {
        replyOnly =
          "Logo apply nahi hua — “header fix” bolo, phir logo image dubara bhejo.";
        notes.push("chat");
        continue;
      }
      html = next;
      logoImageOut = src;
      notes.push(
        complaint
          ? "duplicate logo hata diya — ab ek hi logo"
          : "header pe ek logo laga diya",
      );
      continue;
    }
    if (action.type === "brand.label") {
      const name = (action.name || ctx.brandName || "").trim() || ctx.brandName;
      const logoSrc = extractCreateAiLogoSrc(html);
      let next = ensureCreateAiHeaderBrand(html, name, logoSrc || undefined);
      next = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(
          ensureCreateAiResponsive(normalizeCreateAiCopyrightYear(next)),
        ),
      );
      next = ensureCreateAiHeaderBrand(next, name, logoSrc || undefined);
      if (!createAiHeaderHasBrandLabel(next, name)) {
        replyOnly =
          "Brand name apply nahi hua — Edit mode Off karke dubara try karo.";
        notes.push("chat");
        continue;
      }
      html = next;
      notes.push(`brand name "${name}"`);
      continue;
    }
    if (action.type === "chat.reply") {
      replyOnly = action.text;
      notes.push("chat");
      continue;
    }
    if (action.type === "widget.backToTop") {
      if (action.on === false) {
        html = html
          .replace(/<style[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<button[^>]*id=["']create-ai-btt["'][^>]*>[\s\S]*?<\/button>/gi, "")
          .replace(/<script[^>]*data-create-ai-btt=["']1["'][^>]*>[\s\S]*?<\/script>/gi, "");
        notes.push("removed back-to-top");
      } else {
        html = injectBackToTop(html);
        notes.push("back-to-top");
      }
      continue;
    }
    if (action.type === "header.sticky") {
      html = applyCreateAiHeaderSticky(html, action.on !== false);
      notes.push(action.on === false ? "header unsticky" : "header sticky");
      continue;
    }
    if (action.type === "layout.responsive") {
      html = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(
          ensureCreateAiResponsive(normalizeCreateAiCopyrightYear(html)),
        ),
      );
      notes.push("responsive shell");
      continue;
    }
    if (action.type === "layout.wow") {
      let next = injectCreateAiPremiumShell(html);
      next = injectCreateAiWowPolish(next);
      next = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(ensureCreateAiResponsive(next)),
      );
      html = next;
      notes.push("premium wow polish (motion + hover)");
      continue;
    }
    if (action.type === "footer.polish") {
      html = polishCreateAiFooter(html, ctx.brandName, {
        email: ctx.email,
        mobile: ctx.mobile,
      });
      html = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(ensureCreateAiResponsive(html)),
      );
      notes.push("footer polish");
      continue;
    }
    if (action.type === "hero.video") {
      const hint =
        action.youtube === "dummy"
          ? "dummy laga do"
          : action.youtube || ctx.message;
      const applied = applyCreateAiHeroVideoBanner(
        html,
        ctx.brandName,
        hint,
      );
      if (applied.needsUrl) {
        replyOnly =
          "Banner video ke liye YouTube link bhejo — ya likho “dummy laga do”.";
        notes.push("chat");
        continue;
      }
      if (applied.ok) {
        html = stripDuplicateContactStrips(applied.html);
        notes.push(
          action.youtube === "dummy"
            ? "dummy hero video"
            : "hero YouTube video",
        );
      } else {
        needsAiEdit = true;
      }
      continue;
    }
    if (action.type === "hero.image") {
      const src = (ctx.imageDataUrl || "").trim();
      if (!src.startsWith("data:image") && !/^https?:\/\//i.test(src)) {
        replyOnly =
          "Banner/hero image attach karo, phir likho “banner pe ye image laga do”.";
        notes.push("chat");
        continue;
      }
      if (src.startsWith("data:image") && src.length > 350_000) {
        replyOnly =
          "Banner image thodi badi hai — chhoti JPG attach karke dubara try karo.";
        notes.push("chat");
        continue;
      }
      const applied = applyCreateAiHeroImage(html, src);
      if (!applied.ok) {
        replyOnly =
          "Hero/banner section nahi mila — pehle “header fix” try karo, phir banner image dubara bhejo.";
        notes.push("chat");
        continue;
      }
      html = stripDuplicateContactStrips(
        normalizeCreateAiHeaderBar(
          ensureCreateAiResponsive(
            normalizeCreateAiCopyrightYear(applied.html),
          ),
        ),
      );
      notes.push("hero banner image");
      continue;
    }
    if (action.type === "float.recolor" || action.type === "float.place") {
      const local = parseFloatPlacementLocal(ctx.message);
      const existing = readFloatPlacement(html);
      // Local geometry beats LLM (stops "btt ke upar" → wrong viewport top)
      const placement: FloatPlacement = {
        side:
          local?.side ||
          (action.type === "float.place" ? action.side : undefined) ||
          existing?.side ||
          "right",
        vertical:
          local?.vertical ||
          (action.type === "float.place" ? action.vertical : undefined) ||
          existing?.vertical ||
          "bottom",
      };
      const wantTheme =
        action.type === "float.recolor" ||
        (action.type === "float.place" &&
          (action.themeColor === true ||
            action.themeColor === "theme" ||
            /theme|khud\s*nikalo|theme\s*color|rang\s*(theme|site)/i.test(
              ctx.message,
            )));
      let themeColor: string | true | undefined = undefined;
      if (action.type === "float.recolor") {
        themeColor =
          !action.color || action.color === "theme"
            ? true
            : colorToHex(action.color);
      } else if (wantTheme) {
        themeColor =
          typeof action.themeColor === "string" && action.themeColor !== "theme"
            ? colorToHex(action.themeColor)
            : true;
      } else {
        themeColor =
          html.match(/data-create-ai-float-theme=["']([^"']+)["']/i)?.[1] ||
          undefined;
      }
      const mobile = extractMobile(html, ctx.mobile);
      const email =
        (ctx.email || "").trim() ||
        html.match(/mailto:([^"'?\s]+)/i)?.[1] ||
        "";
      const includeEmail =
        (action.type === "float.place" && Boolean(action.email)) ||
        /data-create-ai-float-email=["']1["']/i.test(html);
      if (mobile.replace(/\D/g, "").length >= 8 || (includeEmail && email.includes("@"))) {
        const accent =
          themeColor === true
            ? extractThemeAccentFromHtml(html)
            : themeColor;
        html = injectFloatingContact(
          html,
          { mobile, email },
          {
            includeEmail: includeEmail && email.includes("@"),
            placement,
            themeColor: accent || undefined,
          },
        );
        if (hadBtt) html = injectBackToTop(html);
        notes.push(
          accent
            ? `float icons → ${accent}`
            : `float ${placement.side}/${placement.vertical}`,
        );
      } else {
        needsAiEdit = true;
      }
      continue;
    }
    if (action.type === "color.set") {
      let label = action.label?.trim();
      const ctas = listContentCtaLabels(html, 12);
      const ord = parseOrdinalButtonIndex(ctx.message);
      if (ord != null && ctas[ord]) {
        label = ctas[ord];
      }
      if (!label) {
        const labels = listPageButtonLabels(html, 20);
        const lower = ctx.message.toLowerCase();
        label =
          labels.find((l) => l.length >= 4 && lower.includes(l.toLowerCase())) ||
          undefined;
      }
      // Never paint Home/About when user meant a hero CTA
      if (
        label &&
        NAV_BTN.test(label) &&
        /\b(button|btn|cta|second|first|text\s*color)\b/i.test(ctx.message)
      ) {
        label = ctas[ord ?? 1] || ctas[0] || label;
      }
      if (
        !label &&
        /button|cta/i.test(action.target || "button") &&
        !/sabhi|all\s*buttons|har\s*button/i.test(ctx.message)
      ) {
        needsAiEdit = true;
        continue;
      }
      // TEXT word = never fill. Fill only on explicit bg/fill/solid.
      let property = action.property || "color";
      if (/\b(text|likha|font)\b/i.test(ctx.message)) {
        property = "color";
      } else if (
        property === "color" &&
        label &&
        action.state !== "hover" &&
        /background|fill|\bbg\b|solid/i.test(ctx.message)
      ) {
        property = "background";
      }
      // Planner wrongly sent background after user said text — trust message
      if (
        property === "background" &&
        /\b(text|likha|font)\b/i.test(ctx.message)
      ) {
        property = "color";
      }
      let state = action.state || "both";
      if (/\bhover|mouse\s*over|:hover\b/i.test(ctx.message) && !action.state) {
        state = "hover";
      }
      let hoverColor = action.hoverColor;
      if (state === "both" && !hoverColor) {
        const base = colorToHex(action.color || "white");
        hoverColor = hexLuminance(base) < 140 ? "#ffffff" : "#111111";
      }
      const result = applyColorAction(
        html,
        action.target || "button",
        action.color || "white",
        label,
        property,
        state,
        hoverColor,
      );
      if (!result.ok) {
        needsAiEdit = true;
        continue;
      }
      html = result.html;
      notes.push(
        label
          ? `"${label}" → ${action.color || "white"} (${property}/${state})`
          : `color ${action.target || "heading"}`,
      );
      continue;
    }
    if (action.type === "section.add") {
      // Screenshot attached → don't paste library default; vision must match reference
      if (ctx.hasImages) {
        needsAiEdit = true;
        continue;
      }
      const brand = ctx.brandName || "Brand";
      switch (action.kind) {
        case "team":
          html = injectTeamSection(html, brand);
          break;
        case "faq":
          html = injectFaqSection(html, brand);
          break;
        case "pricing":
          html = injectPricingSection(html, brand);
          break;
        case "testimonials":
          html = injectTestimonialsSection(html, brand);
          break;
        case "map":
          html = injectMapSection(html, ctx.address);
          break;
        case "video":
          html = injectVideoSection(html, brand);
          break;
        case "timeline":
          html = injectTimelineSection(html, brand);
          break;
        case "clientSlider":
          html = injectClientSlider(html, brand);
          break;
        default:
          needsAiEdit = true;
      }
      if (!needsAiEdit) notes.push(`section ${action.kind}`);
    }
  }

  // Pure chat reply, no HTML change
  if (replyOnly && notes.every((n) => n === "chat") && !needsAiEdit) {
    return { html: ctx.html, notes, replyOnly, needsAiEdit: false };
  }

  return { html, notes, replyOnly, needsAiEdit, logoImage: logoImageOut };
}
