import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { fetchMagnificStockImage } from "@/lib/magnificStock";
import { fetchPixabayStockImage } from "@/lib/pixabayStock";
import { fetchPexelsStockImage } from "@/lib/pexelsStock";
import { buildLocalizedStockTerms } from "@/lib/aiImageContext";

type SectionSnapshot = {
  id: string;
  type: string;
  variant: string;
  /** Inner-page slug; empty/null = home page section. */
  page?: string | null;
  data?: Record<string, unknown>;
  /** Auto-fetched from live section data keys (includes new fields). */
  editableFields?: string[];
  /** For array fields: keys of first item, e.g. faqItems → ["question","answer"]. */
  itemShapes?: Record<string, string[]>;
};

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type AiChoice = {
  id: string;
  label: string;
};

type AiAction =
  | {
      type: "patch";
      sectionHint: string;
      fields: Record<string, unknown>;
    }
  | {
      type: "addSection";
      sectionType: string;
      variant?: string;
      afterSectionHint?: string;
    }
  | {
      type: "addCustomSection";
      layoutId?: string;
      afterSectionHint?: string;
      sectionFields?: Record<string, unknown>;
      elements?: Array<{
        columnIndex?: number;
        type: "text" | "image" | "button" | "table" | "slider" | "faq" | "heading" | "testimonial";
        value?: string;
        src?: string;
        href?: string;
        textColor?: string;
        buttonBackgroundColor?: string;
        buttonTextColor?: string;
        slides?: Array<{ id?: string; src: string; alt?: string }>;
        sliderCardsPerView?: 1 | 2 | 3 | 4;
        faqItems?: Array<{ id?: string; question: string; answer: string }>;
        testimonialItems?: Array<{
          id?: string;
          name: string;
          role?: string;
          quote: string;
          image?: string;
          rating?: number;
        }>;
      }>;
    }
  | {
      type: "deleteSection";
      sectionHint: string;
    }
  | {
      type: "moveSection";
      sectionHint: string;
      direction: "up" | "down";
    }
  | {
      type: "ask";
      options: AiChoice[];
    }
  | {
      type: "addMasterItems";
      master:
        | "blog"
        | "service"
        | "gallery"
        | "team"
        | "portfolio"
        | "event"
        | "property"
        | "country";
      items: Array<{
        title: string;
        desc?: string;
        content?: string;
        author?: string;
        category?: string;
        image?: string;
        seoTitle?: string;
        seoDescription?: string;
        seoKeywords?: string;
      }>;
      /** When true, also build a header dropdown submenu. */
      headerSubmenu?: boolean;
      /** name = item short labels → detail; category/type = group labels → listing. */
      headerSubmenuMode?: "name" | "category" | "type";
      /** How to place new submenu links when a dropdown already exists. */
      headerSubmenuMerge?: "new" | "before" | "after" | "skip";
    }
  | {
      type: "renameCountry";
      from: string;
      to: string;
    }
  | {
      type: "renameMasterItem";
      master:
        | "blog"
        | "service"
        | "gallery"
        | "team"
        | "portfolio"
        | "event"
        | "property"
        | "country";
      from: string;
      to: string;
    }
  | {
      type: "setSiteSeo";
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string;
      /** When set, updates that page's SEO instead of global/home. */
      pageLabel?: string;
      /** Update every page key in SEO config (+ home/global). */
      allPages?: boolean;
    }
  | {
      type: "publishSite";
    }
  | {
      type: "setThemeColors";
      values: Record<string, string>;
      label?: string;
    }
  | {
      type: "deleteMasterItem";
      master:
        | "blog"
        | "service"
        | "gallery"
        | "team"
        | "portfolio"
        | "event"
        | "property"
        | "country";
      title: string;
    }
  | {
      type: "renamePage";
      from: string;
      to: string;
    }
  | {
      type: "duplicateSection";
      sectionHint: string;
    }
  | {
      type: "refreshHomeContent";
      audience: string;
    }
  | {
      type: "addPage";
      /** Nav / inner page label, e.g. "Vastu". */
      pageLabel: string;
    }
  | {
      type: "placePageInNav";
      /** Page to place; "current" = currently open editor page. */
      pageLabel?: string;
      /** Insert after this nav item label (e.g. About). */
      afterLabel: string;
    }
  | {
      type: "addBreadcrumb";
      /** Page that should get a breadcrumb (e.g. Vastu). */
      pageLabel?: string;
    }
  | {
      type: "deletePage";
      /** Inner page to remove (e.g. Gaurav). */
      pageLabel: string;
    };

type AiAssistResponse = {
  reply: string;
  actions: AiAction[];
  choices?: AiChoice[];
};

type ContentGenerateIntent = {
  __generate: true;
  sectionType: string;
  field: "title" | "desc" | "button" | "pretitle";
};

type ImageGenerateIntent = {
  __generateImage: true;
  sectionType: string;
};

type ResolveResult =
  | AiAssistResponse
  | ContentGenerateIntent
  | ImageGenerateIntent;

const READY_SECTIONS = [
  { type: "Banner", label: "Banner" },
  { type: "About", label: "About" },
  { type: "Product", label: "Services" },
  { type: "WhyChooseUs", label: "Why choose us" },
  { type: "Gallery", label: "Gallery" },
  { type: "CountriesServe", label: "Countries We Serve" },
  { type: "FormDetail", label: "Form" },
  { type: "FAQ", label: "FAQ" },
  { type: "Testimonial", label: "Testimonials / Our Clients" },
] as const;

const CUSTOM_LAYOUTS = [
  "single",
  "two-columns",
  "two-rows",
  "three-columns",
  "three-rows",
  "left-wide-right-stack",
  "top-wide-bottom-split",
  "top-split-bottom-wide",
  "four-columns",
  "four-grid",
  "five-columns",
  "six-columns",
  "left-stack-right-wide",
] as const;

const CUSTOM_WIDGETS = ["text", "image", "button", "table", "slider", "faq", "heading", "testimonial"] as const;

const READY_OR_CUSTOM_CHOICES: AiChoice[] = [
  { id: "ready", label: "Ready Section" },
  { id: "custom", label: "Custom Section" },
];

const READY_CATALOG_CHOICES: AiChoice[] = READY_SECTIONS.map((item) => ({
  id: item.type,
  label: item.label,
}));

const SYSTEM_PROMPT = `You are AI Assist inside CSS Founder website editor.
Return ONLY valid JSON. No markdown. No vendor names.

Rules:
1) Ready sections: ONLY patch content/images. NEVER change layout.
1b) New NAV / INNER PAGE (CRITICAL — not a home section):
   - Multi-page websites: "create Vastu page", "add Privacy page", "naya About page"
     → emit ONE addPage action with pageLabel. Do NOT ask Ready vs Custom. Do NOT ask section placement.
     Editor auto-creates: Breadcrumb (page name) + page hero titled for that page + a detail CustomSection (~500 words with h2 headings, same style as manager item pages) + Pages list entry.
   - "create Loan page and add menu after About" → emit addPage THEN placePageInNav (same pageLabel, afterLabel About).
   - Single-page websites: ONLY legal/document pages are allowed (Privacy Policy, Terms & Conditions, Cookie Policy, Disclaimer, Refund Policy).
     If user asks for a non-legal page (e.g. Vastu), ask them to pick a legal page — do NOT create it as a section.
     Legal pages also get breadcrumb + named content automatically.
   - "add this page in nav menu after About" / "add menu after About" → placePageInNav (do NOT create a page named "This"). Use pageLabel "current" when user says this/current page.
   - "add breadcrumb in Vastu page" / "bredcrum vastu pe add" → addBreadcrumb for that page. Do NOT create a new page named "Bredcrum…".
   - "delete Gaurav page" / "remove Loan page" / "Gaurav page hatao" → FIRST ask confirmation with choices Yes / No (reply like: Sure? "Gaurav" page delete karun?). Only after Yes → emit deletePage. After No → cancel. NEVER delete without Yes. NEVER claim deleted without emitting deletePage. Do NOT delete Home.
   - Master list managers (Blogs / Services / Gallery / Teams / Portfolio / Events / Properties) still use addMasterItems — not addPage.
2) Add section flow (STRICT order) — only when user wants a SECTION / card / block on the CURRENT page (not a new nav page):
   - If unclear Ready vs Custom → ask Ready Section / Custom Section
   - If Ready chosen → ask which Ready type from catalog
   - BEFORE addSection or addCustomSection → ALWAYS ask after which existing section to place it (choices from current page sections + "At the end")
   - Only then emit addSection / addCustomSection with afterSectionHint set to that section id (or "end")
3) Field names are AUTO-FETCHED per section from live data: use section.editableFields and section.itemShapes (and keys already in section.data). Common aliases still work: heading→title, paragraph→desc, tagline→pretitle, buttonLabel→first CTA. Images: backgroundImage, sideImage. Any NEW field that appears in editableFields is a valid patch target — do NOT require a hardcoded rule per field/variant. Prefer exact keys from editableFields over inventing names.
4) When user names a section (About, Gallery, FAQ…), patch THAT section — never default to Banner.
5) Image change ("about image change", "change banner image") → patch backgroundImage/sideImage on that section. NEVER treat image change as add-section.
5b) "add slider after Banner" → FIRST ask Ready Image Slider vs Custom Slider (choices). Only after user picks, add: Ready → Banner-3; Custom → CustomSection with slider widget. Do NOT auto-pick without asking.
5c) Custom Slider supports cards-per-view 1–4 and click-popup settings. If user says "4 card", set sliderCardsPerView to 4 on the custom slider.
6) Button text change ("banner button text change") → patch buttonLabel only. NEVER change heading/title for button requests. Adding a "CTA Card" / card after a section is NOT a button change — add a Custom Section instead.
6b) "Banner ke baad CTA Card add" / "add CTA card after Banner" → addCustomSection after Banner with title + short copy + button. Do NOT rewrite the Banner CTA label.
6c) Improving CTA/card "look" / "design" / "achha banao" → restyle the Custom CTA section (background, centered copy, stronger button). NEVER change Banner button text for look/design requests.
6d) "best design" / "another option" on Custom/About → cycle UNIQUE layouts (split, stacked, feature trio, image band, CTA band, dual image, stats row) — not the same two-column look. Category copy+images must match (realestate ≠ school).
6d2) Typed design brief ("3 column features dark", "stats row", "wide image with CTA") → addCustomSection or patch with matching layout. Do NOT ask Ready vs Custom for clear design briefs.
6e) "CTA mai Apply Now ko Call Now kro" → patch the CustomSection CTA button label only (columns elements value / buttonLabel on that CustomSection). NEVER claim success without patching the CTA custom section. NEVER change Header "Apply Now" unless user says header/nav.
7) Adding FAQ *questions* into an existing FAQ ("faq mein 5 questions", "add more faq items") → patch fields.faqItems. APPEND. NEVER addCustomSection for this.
7c) Bare "add faq" / "faq banao" / "custom faq" → add a FAQ *section* (ask Ready vs Custom, then placement). Custom FAQ uses CustomSection with the FAQ accordion widget. Do NOT invent Q&A rows on the Ready FAQ for that.
7b) Removing FAQs ("remove", "hatao", "jo add kiya remove") → patch faqItems by removing the last N items. NEVER add more FAQs for remove requests.
8) Short replies like "yes", "ok", "custom", "ready", "Gallery", "After About" must continue the previous question from history.
9) If user asks content/description/heading change without giving exact new text, GENERATE fresh unique copy via the model and APPLY immediately. Do NOT reuse canned phrases. Do NOT ask again and again. NEVER paste the user's instruction into the site.
10) Only use user text as title/body when quoted, or labeled like "About description: ...", or a clear long paragraph after you asked for exact text.
11) Always emit real actions when applying changes. Never claim success without actions.
11b) Whole home language change ("home content hindi mein", "pure home page content ko hindi kro") → emit REAL patch actions for EVERY home content section (Banner, About, WhyChooseUs, Gallery, Product, FAQ, CustomSection, etc.) including titles, descriptions, AND button labels. NEVER only describe titles in the reply without patches. Skip only Header/Topbar/Footer/Breadcrumb.
12) Every content rewrite must be clearly different from the current on-page text.
13) When listing or counting page sections, ALWAYS use the exact order of the payload sections array (top → bottom as on the canvas). Never invent a fixed catalog order. If the user reordered sections, the array order is the source of truth.
14) Match the user's language in EVERY reply (STRICT): if the latest user message is English, reply ONLY in clear English (no Hindi/Hinglish). If Hindi/Hinglish, reply in Hindi/Hinglish. Never answer an English message in Hindi.
15) Master pages (Blogs / Services / Gallery / Teams / Portfolio / Events / Property / Country listings managers — NOT home Ready sections):
   - "add 3 blogs", "2 services add", "gallery mai 4 items", "team members add", "portfolio projects banao", "3 events add", "2 properties add", "add 5 country listings in india"
   → emit ONE addMasterItems action with master + items[{title, desc?, content?, author?, category?, image?}].
   - This creates real master-list entries (blog posts / service items / gallery items / team members / portfolio items / events / properties / country listings), same as the sidebar managers.
   - Do NOT use addSection/addCustomSection for these. Do NOT ask Ready vs Custom.
   - Invent sensible unique titles when the user only gives a count. Cap at 50 items per request.
   - Country listing titles MUST match the website category (school → Admissions/Campus Tour; business → Consulting; realestate → Property Consultation). NEVER use logo design / website design titles on a school site.
   - For blog / service / portfolio / team / event / property / country: each item content MUST be topic-wise HTML body of about 550 words (minimum 500). Include 3–5 short section headings as <h2>…</h2> (each heading 3–5 words). Use <p> paragraphs between headings. Plain wall-of-text without headings is forbidden. Short placeholder copy is forbidden.
   - Each item MUST include seoTitle, seoDescription, and seoKeywords (unique per item, search-friendly).
   - Each item MUST use a different image URL (never reuse the same image across items in one batch).

JSON shape:
{"reply":"string","actions":[...],"choices":[{"id":"...","label":"..."}]}`;

const SECTION_FOCUS_SYSTEM_PROMPT = `You are section-scoped AI Assist inside CSS Founder website editor.
Return ONLY valid JSON. No markdown.

You are locked to ONE focused section from the payload (focusedSection).
Behave like ChatGPT/Gemini for that section: understand natural language (English or Hinglish) and apply changes immediately.

Hard rules:
1) ONLY edit the focused section. Never add/delete/move OTHER sections. Never ask Ready vs Custom.
1b) Structure of THIS focused section is allowed when the user asks:
   - move up/down → {"type":"moveSection","sectionHint":"<focusedSection.id>","direction":"up"|"down"}
   - duplicate → {"type":"duplicateSection","sectionHint":"<focusedSection.id>"}
   - delete → first ask Yes/No; after Yes → {"type":"deleteSection","sectionHint":"<focusedSection.id>"}
   Header/Topbar/Footer/Breadcrumb: never delete/move/duplicate (say briefly not allowed).
2) Always emit real actions when the user wants a change. Never claim success without actions.
3) Ready sections content: patch title, desc, pretitle, subtitle, buttonLabel, backgroundImage, sideImage, faqItems, blocks. Never change layout/variant.
4) CustomSection: patch section fields and/or columns[].elements (heading/text/button/image values, colors, spacing). Keep structure sensible.
   - NEVER remove/drop existing image elements unless the user clearly asks to remove/delete the image.
   - When rewriting text or word-count content, keep the same columns[] and image widgets; only update heading/text/button values (and image size style if asked).
   - Prefer patching individual element values over replacing the whole columns array.
   - Button icons: set element fields icon + iconPosition on the button widget. Allowed icon values ONLY: "arrow-right","arrow-left","plus","phone","mail","external-link" (or "none" to remove). Never put emoji characters into button text for icons.
5) Text/heading/button without exact new wording → invent fresh unique copy and APPLY now. Do not ask again and again. Never paste the instruction itself as on-page text.
6) Image SUBJECT change ("school building", "campus photo", "change banner image to kids"):
   emit patch fields: {"__generateImage":true,"__imagePrompt":"<short visual prompt>"}.
   Do NOT invent http/https image URLs.
6b) Size/layout image requests are NOT new photos:
   - "full image" / "image size full" / "full width" → keep CURRENT image.
     Banner → bannerBackgroundMode/bannerHeight. CustomSection → set imageStyle:"full", imageFullWidth:true on the image element (do NOT talk about Banner).
   - "big image" / "size bada" → keep CURRENT image; enlarge height / cover. Do NOT generate a new photo. Do NOT remove the image. Do NOT change text unless also asked.
   - Never say "Banner image" when the focused section is CustomSection / About / Product / etc.
7) Theme colors are in themeVariables — use them for backgrounds/buttons/text when restyling.
8) Short confirms (yes/ok/kro/karo/ha/ji) continue the previous request from history and APPLY it.
9) Match user language in EVERY chat reply (STRICT):
   - User message mostly English → reply ONLY in clear English (no Hindi/Hinglish words).
   - User message Hindi (Devanagari) or Hinglish → reply in Hindi/Hinglish.
   Never answer an English request in Hindi.
10) If the user asks something impossible for this section, briefly say so — no fake success. Do NOT say duplicate/move/delete is impossible for Ready sections like Product/About/Banner — those ARE allowed for the focused section (except Header/Topbar/Footer/Breadcrumb).
11) Never silently rewrite heading/description when the user only asked about image size/layout.
12) "all content update" / "content update kro" / "sab text badlo" → read focusedSection.editableFields, itemShapes, and data. Patch ALL text using EXACT storage keys from the live section — never invent parallel field names. If itemShapes lists arrays (bannerSlides, faqItems, productItems, serviceSlides, columns, blocks, footerColumns, etc.), update the nested text fields inside those arrays too. Each array item must get its own unique copy (do NOT paste the same paragraph into every item). Keep images unchanged unless asked.
13) "sabse upar wali line" / "top line" / "tagline" / "pretitle" → update only the small top line (pretitle), not the main heading.
14) Footer naming (IMPORTANT — avoid confusing users):
   - There is NO single "footer heading".
   - "menu heading" / "column title" / "Best School" / "Sections" → patch footerColumns[n].title (menu column title).
   - About blurb under logo → desc / paragraph text (not a menu title).
   - Brand/logo text → logo.
   - Contact → footerContact email/phone/location.
   - If you asked for a menu column title and the user replies with a short name like "Best School", APPLY it immediately to footerColumns[0].title (or the named column). Do not ask again.

JSON shape:
{"reply":"string","actions":[{"type":"patch","sectionHint":"<focusedSection.id>","fields":{...}}],"choices":[]}`;

function focusChatReply(
  userMessage: string,
  english: string,
  hindi: string,
): string {
  return isMostlyEnglish(userMessage) ? english : hindi;
}

function wantsFocusContentRefresh(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  // Pure image requests stay on image path
  if (
    /\b(image|photo|picture|img|background)\b/.test(q) &&
    !/\b(content|text|heading|title|description|desc|copy|button|pretitle|tagline|line|word|words|shabd)\b/.test(
      q,
    )
  ) {
    return false;
  }
  return (
    /\b(all|sab|saara|saari|sari|poora|poori|sara|pure)\s+(content|text|copy)\b/.test(
      q,
    ) ||
    /\b(content|text|copy)\s+(all|sab|update|change|badlo|refresh|kro|karo)\b/.test(
      q,
    ) ||
    /\b(content|text|copy)\s+(ko|ka|ki)?\s*(hindi|english|angrezi)\b/.test(q) ||
    /\b(hindi|english|angrezi)\s*(mai|mein|me|m)\s*(kro|karo|kar\s*do)?\b/.test(
      q,
    ) ||
    /\b(update|change|rewrite|refresh|badlo|badal|improve)\s+(all\s+)?(content|text|copy|heading|title|description|desc|pretitle|tagline)\b/.test(
      q,
    ) ||
    /\b(content|heading|title|description|desc|pretitle|tagline)\s+(update|change|badlo|badal|kro|karo|rewrite)\b/.test(
      q,
    ) ||
    /\b(sabse\s+upar|upar\s+wali|top\s+line|top\s+text|small\s+heading|tagline|pretitle|eyebrow)\b/.test(
      q,
    ) ||
    // "content 250 word dalo" / "350 words" / "500 shabd"
    (/\b\d{2,4}\s*(words?|shabd|shabdon)\b/.test(q) &&
      /\b(content|text|desc|description|copy|dalo|dal|likho|write|add|update|kro|karo)\b/.test(
        q,
      )) ||
    /^(content|all content|sab content|update content|content update|text update)$/.test(
      q,
    )
  );
}

/** Broad content intent — defer to LLM with full section schema instead of regex single-field patches. */
function shouldDeferContentToFocusLlm(text: string): boolean {
  if (wantsFocusContentRefresh(text)) return true;
  const q = text.toLowerCase().trim();
  if (!q) return false;
  if (wantsFullOrBigImageLayout(text)) return false;
  if (
    /\b(image|photo|picture|img|background)\b/.test(q) &&
    !/\b(content|text|heading|title|description|desc|copy|button)\b/.test(q)
  ) {
    return false;
  }
  return (
    /\b(change|update|rewrite|refresh|badlo|badal|improve|kro|karo|krdo)\b/.test(
      q,
    ) &&
    /\b(content|text|copy|heading|title|desc|description|button|pretitle|tagline|sab|all|poora|saara|banner|hero)\b/.test(
      q,
    )
  );
}

function wantsFocusPretitleOnly(text: string): boolean {
  const q = text.toLowerCase().trim();
  return (
    /\b(sabse\s+upar|upar\s+wali\s+line|top\s+line|top\s+text|small\s+heading|tagline|pretitle|eyebrow)\b/.test(
      q,
    ) &&
    !/\b(all|sab)\s+(content|text)\b/.test(q) &&
    !/\b(heading|title|description|desc|button)\b/.test(q)
  );
}

function getSectionPretitle(
  sections: SectionSnapshot[],
  sectionType: string,
): string {
  const needle = sectionType.toLowerCase();
  const section = sections.find(
    (item) =>
      item.type?.toLowerCase() === needle ||
      item.id?.toLowerCase() === needle ||
      item.id?.toLowerCase().includes(needle),
  );
  const data = section?.data || {};
  if (typeof data.pretitle === "string" && data.pretitle.trim()) {
    return data.pretitle.trim();
  }
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const row = block as Record<string, unknown>;
    if (
      row.role === "pretitle" &&
      typeof row.content === "string" &&
      row.content.trim()
    ) {
      return row.content.trim();
    }
  }
  return "";
}

const PRETITLE_SAMPLES: Record<string, string[]> = {
  Banner: [
    "Future-ready learning",
    "Welcome to excellence",
    "Learn. Grow. Lead.",
    "A brighter path ahead",
    "Where curiosity thrives",
  ],
  About: [
    "Our story",
    "Who we are",
    "Built for every learner",
    "Care meets excellence",
  ],
  Product: [
    "Our programs",
    "What we offer",
    "Pathways that fit",
  ],
};

function inventSectionPretitle(
  sectionType: string,
  sections: SectionSnapshot[],
): string {
  const pool = PRETITLE_SAMPLES[sectionType] || PRETITLE_SAMPLES.Banner;
  const current = getSectionPretitle(sections, sectionType).toLowerCase();
  const options = pool.filter((text) => text.toLowerCase() !== current);
  return options[Math.floor(Math.random() * options.length)] || pool[0];
}

function wantsFocusButtonIcon(text: string, prevAssistant = ""): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  // Remove icon
  if (
    /\b(icon|icons)\b/.test(q) &&
    /\b(remove|delete|hata|hatado|hatao|no\s*icon|without\s*icon|mat\s*laga)\b/.test(
      q,
    )
  ) {
    return true;
  }
  // Bare / short: "phone icon", "mail", "arrow right", "plus icon"
  if (
    /^(phone|call|mail|email|plus|arrow[\s-]?right|arrow[\s-]?left|external([\s-]?link)?|right\s*arrow|left\s*arrow)(\s+icon)?$/.test(
      q,
    )
  ) {
    return true;
  }
  // Follow-up after we just changed a button icon
  if (
    /\b(button|icon)\b/i.test(prevAssistant) &&
    /^(phone|call|mail|email|plus|arrow[\s-]?right|arrow[\s-]?left|external|before|after|pehle|baad)$/.test(
      q,
    )
  ) {
    return true;
  }
  return (
    (/\b(button|cta|btn)\b/.test(q) &&
      /\b(icon|icons)\b/.test(q) &&
      /\b(laga|lagao|lagado|add|with|dal|dalo|show|set|put|include|change|badlo)\b/.test(
        q,
      )) ||
    /\b(add|laga|lagao|lagado|change|badlo)\s+(an?\s+)?icon\b/.test(q) ||
    /\bicon\s+(laga|lagao|lagado|add|dal|dalo|change|badlo)\b/.test(q) ||
    /\b(phone|mail|plus|arrow)\s+icon\b/.test(q) ||
    /^(button\s*)?icon(\s*lagao|\s*add)?$/.test(q)
  );
}

const CUSTOM_BUTTON_ICON_VALUES = [
  "arrow-right",
  "arrow-left",
  "plus",
  "phone",
  "mail",
  "external-link",
] as const;

type CustomButtonIcon = (typeof CUSTOM_BUTTON_ICON_VALUES)[number] | "none";

function resolveButtonIconFromMessage(text: string): {
  icon: CustomButtonIcon;
  iconPosition: "before" | "after";
} {
  const q = text.toLowerCase().trim();
  if (
    /\b(remove|delete|hata|hatado|hatao|no\s*icon|without\s*icon)\b/.test(q)
  ) {
    return { icon: "none", iconPosition: "after" };
  }
  let icon: CustomButtonIcon = "arrow-right";
  if (/\b(arrow\s*left|left\s*arrow|peeche|back)\b/.test(q)) icon = "arrow-left";
  else if (/\b(phone|call|mobile|telephone)\b/.test(q)) icon = "phone";
  else if (/\b(mail|email|envelope)\b/.test(q)) icon = "mail";
  else if (/\b(external|open\s*link|link\s*out|new\s*tab)\b/.test(q))
    icon = "external-link";
  else if (/\bplus\b/.test(q)) icon = "plus";
  else if (/\b(arrow\s*right|right\s*arrow|forward|next)\b/.test(q))
    icon = "arrow-right";

  const iconPosition: "before" | "after" = /\b(before|pehle|left\s*side|start)\b/.test(
    q,
  )
    ? "before"
    : "after";
  return { icon, iconPosition };
}

function patchCustomSectionButtonIcon(
  data: Record<string, unknown>,
  icon: CustomButtonIcon,
  iconPosition: "before" | "after",
): Record<string, unknown> | null {
  if (!Array.isArray(data.columns)) return null;
  let touched = false;
  const columns = (data.columns as Array<Record<string, unknown>>).map(
    (column) => {
      if (!column || typeof column !== "object") return column;
      const elements = Array.isArray(column.elements)
        ? (column.elements as Array<Record<string, unknown>>)
        : [];
      if (!elements.length) return column;
      return {
        ...column,
        elements: elements.map((el) => {
          if (!el || typeof el !== "object" || el.type !== "button") return el;
          if (touched) return el;
          touched = true;
          // Strip emoji / unicode-arrow leftovers AI may have shoved into label
          const rawValue =
            typeof el.value === "string" ? el.value : "";
          const cleaned = rawValue
            .replace(
              /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
              "",
            )
            .replace(/[→←➜➔➢➣➤⟶⟵≫≪»«]/gu, "")
            .replace(/\s{2,}/g, " ")
            .trim();
          return {
            ...el,
            ...(cleaned !== rawValue ? { value: cleaned || rawValue } : {}),
            icon,
            iconPosition,
          };
        }),
      };
    },
  );
  if (!touched) return null;
  return { columns };
}

function wantsFullOrBigImageLayout(text: string): "full" | "big" | null {
  const q = text.toLowerCase().trim();
  if (!q) return null;
  // Explicit new-photo requests should NOT hit this path
  if (
    /\b(new|change|replace|generate|different|dusri|nayi|naya)\b/.test(q) &&
    /\b(image|photo|picture|img)\b/.test(q) &&
    !/\b(full|big|large|badi|bara|width|bleed|size)\b/.test(q)
  ) {
    return null;
  }
  // "image size full kro" / "size full" / "full image"
  if (
    /\b(full\s*(width|bleed)?\s*(image|img|photo|picture)?|image\s*full|full\s*screen\s*image|poori\s*image|image\s*poori)\b/.test(
      q,
    ) ||
    /\b(image|img|photo|picture)\s*(size\s*)?(full|poori)\b/.test(q) ||
    /\b(size\s*)?(full|poori)\s*(image|img|photo|picture)\b/.test(q) ||
    /\bsize\s*(full|poori)\b/.test(q) ||
    /^(full|full\s*image|image\s*full|image\s*size\s*full)$/.test(q)
  ) {
    return "full";
  }
  if (
    /\b(big|large|badi|bara|bigger)\s*(image|img|photo|picture)?\b/.test(q) ||
    /\b(image|img|photo)\s*(badi|bara|big|large)\b/.test(q) ||
    /\b(image|img|photo|picture)\s*size\s*(bada|badi|big|large)\b/.test(q) ||
    /\bsize\s*(bada|badi|big|large)\b/.test(q) ||
    /^(big|big\s*image|image\s*big)$/.test(q)
  ) {
    return "big";
  }
  return null;
}

function patchCustomSectionImageSize(
  data: Record<string, unknown>,
  kind: "full" | "big",
): Record<string, unknown> | null {
  if (!Array.isArray(data.columns)) return null;
  let touched = false;
  const columns = (data.columns as Array<Record<string, unknown>>).map(
    (column) => {
      if (!column || typeof column !== "object") return column;
      const elements = Array.isArray(column.elements)
        ? (column.elements as Array<Record<string, unknown>>)
        : [];
      if (!elements.length) return column;
      return {
        ...column,
        elements: elements.map((el) => {
          if (!el || typeof el !== "object" || el.type !== "image") return el;
          touched = true;
          if (kind === "full") {
            return {
              ...el,
              imageStyle: "full",
              imageFullWidth: true,
              imageWidth: null,
              imageHeight:
                typeof el.imageHeight === "number" && el.imageHeight > 480
                  ? el.imageHeight
                  : 520,
            };
          }
          return {
            ...el,
            imageStyle: "cover",
            imageFullWidth: true,
            imageWidth: null,
            imageHeight:
              typeof el.imageHeight === "number" && el.imageHeight > 360
                ? el.imageHeight
                : 420,
          };
        }),
      };
    },
  );
  if (!touched) return null;
  return { columns };
}

function buildFocusImageLayoutPatch(
  kind: "full" | "big",
  focusId: string,
  section: SectionSnapshot,
  userMessage = "",
): AiAssistResponse {
  const sectionType = section.type;
  const label = sectionDisplayLabel(section);
  const data =
    section.data && typeof section.data === "object" ? section.data : {};

  // CustomSection → resize image widget in columns (NOT banner fields)
  if (sectionType === "CustomSection") {
    const customFields = patchCustomSectionImageSize(data, kind);
    if (!customFields) {
      return {
        reply: focusChatReply(
          userMessage,
          `No image found in ${label}. Add an image first, then ask for full/big size.`,
          `${label} me image nahi mili. Pehle image add karo, phir full/big size bolo.`,
        ),
        actions: [],
        choices: [],
      };
    }
    return {
      reply: focusChatReply(
        userMessage,
        kind === "full"
          ? `${label} image is now full-width in its column (same photo). Text unchanged.`
          : `${label} image is now larger / taller (same photo). Text unchanged.`,
        kind === "full"
          ? `${label} ki image ab column me full-width hai — same photo, text same.`
          : `${label} ki image ab badi / taller hai — same photo, text same.`,
      ),
      actions: [
        {
          type: "patch",
          sectionHint: focusId,
          fields: customFields,
        },
      ],
      choices: [],
    };
  }

  // Banner / hero-style sections
  const fields: Record<string, unknown> = {
    bannerBackgroundMode: "image",
  };
  if (kind === "big") {
    fields.bannerHeight = 95;
  } else {
    fields.bannerHeight = 80;
  }
  return {
    reply: focusChatReply(
      userMessage,
      kind === "big"
        ? `${label} image is taller now (same photo — text unchanged).`
        : `${label} image is full-bleed cover now (same photo — text unchanged).`,
      kind === "big"
        ? `${label} image ko bada / taller kiya — same photo, text same.`
        : `${label} image ab full-bleed cover mode me hai — same photo, text same.`,
    ),
    actions: [
      {
        type: "patch",
        sectionHint: focusId,
        fields,
      },
    ],
    choices: [],
  };
}

function listFocusImageItems(
  section: SectionSnapshot,
): Array<{ index: number; label: string; image: string }> {
  const data =
    section.data && typeof section.data === "object" ? section.data : {};
  const items: Array<{ index: number; label: string; image: string }> = [];

  const pushItem = (label: string, image: string) => {
    const img = (image || "").trim();
    if (!img) return;
    const title = (label || "").trim() || `Item ${items.length + 1}`;
    items.push({ index: items.length, label: title, image: img });
  };

  if (Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      if (!block || typeof block !== "object") continue;
      const row = block as Record<string, unknown>;
      if (row.type === "card") {
        pushItem(
          String(row.title || row.category || row.alt || ""),
          typeof row.image === "string" ? row.image : "",
        );
      }
    }
  }

  if (!items.length) {
    for (const key of ["serviceSlides", "productSlides", "productItems"] as const) {
      const list = data[key];
      if (!Array.isArray(list)) continue;
      for (const slide of list) {
        if (!slide || typeof slide !== "object") continue;
        const row = slide as Record<string, unknown>;
        pushItem(
          String(
            row.productTitle ||
              row.title ||
              row.productSubtitle ||
              row.category ||
              row.alt ||
              "",
          ),
          typeof row.image === "string" ? row.image : "",
        );
      }
      if (items.length) break;
    }
  }

  if (!items.length && Array.isArray(data.columns)) {
    for (const column of data.columns) {
      if (!column || typeof column !== "object") continue;
      const elements = (column as { elements?: unknown }).elements;
      if (!Array.isArray(elements)) continue;
      for (const el of elements) {
        if (
          el &&
          typeof el === "object" &&
          (el as { type?: string }).type === "image" &&
          typeof (el as { src?: string }).src === "string"
        ) {
          pushItem(
            String((el as { alt?: string }).alt || ""),
            (el as { src: string }).src,
          );
        }
      }
    }
  }

  if (!items.length) {
    const bg =
      typeof data.backgroundImage === "string" ? data.backgroundImage : "";
    const side = typeof data.sideImage === "string" ? data.sideImage : "";
    if (bg.trim()) pushItem("Background image", bg);
    if (side.trim() && side.trim() !== bg.trim()) pushItem("Side image", side);
  }

  return items;
}

function resolveFocusImageItemIndex(
  message: string,
  pendingChoices: AiChoice[],
  prevAssistant: string,
  itemCount: number,
): number | null {
  if (itemCount <= 0) return null;
  const q = message.trim().toLowerCase();

  const fromId = q.match(/^img-item:(\d+)$/i);
  if (fromId) {
    const n = Number(fromId[1]);
    if (Number.isFinite(n) && n >= 0 && n < itemCount) return n;
  }

  // Choice chip may send label like "1. Primary School"
  const fromLabel = q.match(/^(\d+)\s*[.)\-:]/);
  if (fromLabel) {
    const n = Number(fromLabel[1]) - 1;
    if (Number.isFinite(n) && n >= 0 && n < itemCount) return n;
  }

  if (/^(first|pehli|pehla|1st)$/i.test(q)) return 0;
  if (/^(second|dusri|dusra|2nd)$/i.test(q) && itemCount > 1) return 1;
  if (/^(third|teesri|teesra|3rd)$/i.test(q) && itemCount > 2) return 2;
  if (/^(last|last\s*wali|akhiri)$/i.test(q)) return itemCount - 1;

  const bareNum = q.match(/^(\d+)$/);
  if (bareNum) {
    const n = Number(bareNum[1]) - 1;
    if (Number.isFinite(n) && n >= 0 && n < itemCount) return n;
  }

  // Pending choice ids while assistant asked which image
  if (
    /\b(kaunsi|which|konsi|image|photo|card|slide|item)\b/i.test(prevAssistant)
  ) {
    for (const choice of pendingChoices) {
      if (!choice?.id?.startsWith("img-item:")) continue;
      if (
        q === choice.id.toLowerCase() ||
        q === choice.label.toLowerCase() ||
        choice.label.toLowerCase().includes(q)
      ) {
        const n = Number(choice.id.replace("img-item:", ""));
        if (Number.isFinite(n) && n >= 0 && n < itemCount) return n;
      }
    }
  }

  return null;
}

function wantsFocusImageRefresh(
  text: string,
  prevAssistant = "",
): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  if (wantsFullOrBigImageLayout(text)) return false;
  if (wantsFocusContentRefresh(text)) return false;

  // Follow-up: user insists they meant images
  if (
    /\b(images?\s*bola|image\s*bola|maine\s*images?|i\s*said\s*images?|photo\s*bola)\b/.test(
      q,
    ) ||
    (/^(images?|photo|picture|img)$/.test(q) &&
      /\b(image|photo|content updated|update ho)\b/.test(prevAssistant))
  ) {
    return true;
  }

  return (
    /\b(images?|photos?|pictures?|imgs?|background)\b/.test(q) &&
    /\b(update|change|replace|badlo|badal|new|nayi|naya|refresh|generate|lagao|dal|daalo|kro|karo|fix|swap)\b/.test(
      q,
    )
  );
}

function sectionDisplayLabel(section: SectionSnapshot): string {
  if (section.type === "CustomSection") {
    const name = section.data?.sectionName;
    if (typeof name === "string" && name.trim()) return name.trim();
    return "Custom";
  }
  return (
    READY_SECTIONS.find((item) => item.type === section.type)?.label ||
    section.type
  );
}

function getFocusSectionCurrentImage(section: SectionSnapshot): string {
  const data =
    section.data && typeof section.data === "object" ? section.data : {};
  if (typeof data.backgroundImage === "string" && data.backgroundImage.trim()) {
    return data.backgroundImage.trim();
  }
  if (typeof data.sideImage === "string" && data.sideImage.trim()) {
    return data.sideImage.trim();
  }
  if (Array.isArray(data.serviceSlides)) {
    for (const slide of data.serviceSlides) {
      if (
        slide &&
        typeof slide === "object" &&
        typeof (slide as { image?: string }).image === "string" &&
        (slide as { image: string }).image.trim()
      ) {
        return (slide as { image: string }).image.trim();
      }
    }
  }
  if (Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      if (!block || typeof block !== "object") continue;
      const row = block as Record<string, unknown>;
      if (row.type === "card" && typeof row.image === "string" && row.image.trim()) {
        return row.image.trim();
      }
      if (row.type === "image" && typeof row.src === "string" && row.src.trim()) {
        return row.src.trim();
      }
    }
  }
  if (Array.isArray(data.columns)) {
    for (const column of data.columns) {
      if (!column || typeof column !== "object") continue;
      const elements = (column as { elements?: unknown }).elements;
      if (!Array.isArray(elements)) continue;
      for (const el of elements) {
        if (
          el &&
          typeof el === "object" &&
          (el as { type?: string }).type === "image" &&
          typeof (el as { src?: string }).src === "string" &&
          (el as { src: string }).src.trim()
        ) {
          return (el as { src: string }).src.trim();
        }
      }
    }
  }
  return "";
}

/** Build image patch fields that match how each section actually stores photos. */
function buildFocusSectionImageFields(
  section: SectionSnapshot,
  imageSrc: string,
  imageItemIndex = 0,
): Record<string, unknown> {
  const data =
    section.data && typeof section.data === "object" ? section.data : {};
  const type = section.type;
  const src = imageSrc.trim();
  if (!src) return {};
  const targetIndex = Math.max(0, imageItemIndex);

  if (type === "Banner") {
    const slides = Array.isArray(data.bannerSlides) ? data.bannerSlides : [];
    if (slides.length) {
      const nextSlides = slides.map((slide, index) => {
        if (!slide || typeof slide !== "object") return slide;
        if (targetIndex > 0 && index !== targetIndex) return slide;
        return { ...(slide as Record<string, unknown>), image: src };
      });
      return {
        backgroundImage: src,
        bannerBackgroundMode: "image",
        bannerSlides: nextSlides,
      };
    }
    return {
      backgroundImage: src,
      bannerBackgroundMode: "image",
    };
  }

  if (type === "About") {
    // index 0 = side (main about photo), 1 = background if both exist
    if (targetIndex >= 1) {
      return { backgroundImage: src };
    }
    return {
      sideImage: src,
      backgroundImage: typeof data.backgroundImage === "string" ? data.backgroundImage : src,
    };
  }

  if (type === "CustomSection" && Array.isArray(data.columns)) {
    let imageOrdinal = -1;
    const columns = (data.columns as Array<Record<string, unknown>>).map(
      (column) => {
        if (!column || typeof column !== "object") return column;
        const elements = Array.isArray(column.elements)
          ? (column.elements as Array<Record<string, unknown>>)
          : [];
        if (!elements.length) return column;
        return {
          ...column,
          elements: elements.map((element) => {
            if (
              !element ||
              typeof element !== "object" ||
              element.type !== "image"
            ) {
              return element;
            }
            imageOrdinal += 1;
            if (imageOrdinal !== targetIndex) return element;
            return { ...element, src };
          }),
        };
      },
    );
    return { columns };
  }

  // Product / Services — editor merges by imageItemIndex onto live cards
  if (
    type === "Product" ||
    type === "Service" ||
    Array.isArray(data.serviceSlides) ||
    Array.isArray(data.productSlides) ||
    Array.isArray(data.productItems) ||
    (Array.isArray(data.blocks) &&
      data.blocks.some(
        (block) =>
          block &&
          typeof block === "object" &&
          (block as { type?: string }).type === "card",
      ))
  ) {
    return { backgroundImage: src, imageItemIndex: targetIndex };
  }

  // Gallery-style item arrays
  for (const key of ["galleryItems", "items", "cards", "images"] as const) {
    const list = data[key];
    if (!Array.isArray(list) || !list.length) continue;
    const next = (list as Array<Record<string, unknown>>).map((item, index) => {
      if (index !== targetIndex || !item || typeof item !== "object") return item;
      if ("image" in item || typeof item.image === "string") {
        return { ...item, image: src };
      }
      if ("src" in item || typeof item.src === "string") {
        return { ...item, src };
      }
      return { ...item, image: src };
    });
    return { [key]: next, backgroundImage: src, imageItemIndex: targetIndex };
  }

  return { backgroundImage: src, imageItemIndex: targetIndex };
}

function findFocusedSection(
  sections: SectionSnapshot[],
  focusId?: string | null,
): SectionSnapshot | null {
  const id = typeof focusId === "string" ? focusId.trim() : "";
  if (!id) return null;
  const lower = id.toLowerCase();
  return (
    sections.find((item) => item.id === id) ||
    sections.find((item) => (item.id || "").toLowerCase() === lower) ||
    sections.find((item) => item.type.toLowerCase() === lower) ||
    null
  );
}

function constrainFocusActions(
  actions: AiAction[],
  focusId: string,
): AiAction[] {
  const focus = focusId.trim();
  if (!focus) return [];
  const out: AiAction[] = [];
  for (const action of actions) {
    if (action.type === "patch") {
      out.push({
        ...action,
        type: "patch",
        sectionHint: focus,
        fields:
          action.fields && typeof action.fields === "object"
            ? (action.fields as Record<string, unknown>)
            : {},
      });
      continue;
    }
    // Allow structure ops on the focused section only.
    if (
      action.type === "deleteSection" ||
      action.type === "moveSection" ||
      action.type === "duplicateSection"
    ) {
      if (action.type === "moveSection") {
        out.push({
          type: "moveSection",
          sectionHint: focus,
          direction: action.direction === "down" ? "down" : "up",
        });
      } else if (action.type === "deleteSection") {
        out.push({ type: "deleteSection", sectionHint: focus });
      } else {
        out.push({ type: "duplicateSection", sectionHint: focus });
      }
    }
  }
  return out;
}

async function expandFocusImageActions(params: {
  actions: AiAction[];
  focusId: string;
  focusType: string;
  sections: SectionSnapshot[];
  apiKey?: string;
  userMessage: string;
  siteContext: string;
  country: ReturnType<typeof resolveCountryHint>;
  category: ReturnType<typeof resolveCategoryHint>;
}): Promise<AiAction[]> {
  const out: AiAction[] = [];
  for (const action of params.actions) {
    if (action.type !== "patch") continue;
    const fields: Record<string, unknown> = {
      ...(action.fields && typeof action.fields === "object"
        ? action.fields
        : {}),
    };
    const promptRaw = fields.__imagePrompt;
    const wantsGenerate =
      fields.__generateImage === true ||
      fields.backgroundImage === "__GENERATE_IMAGE__" ||
      fields.sideImage === "__GENERATE_IMAGE__" ||
      (typeof promptRaw === "string" && promptRaw.trim().length > 0);

    if (wantsGenerate) {
      const imagePrompt =
        typeof promptRaw === "string" && promptRaw.trim()
          ? promptRaw.trim()
          : params.userMessage;
      const { fields: imageFields, source } = await buildOnlineImageFields({
        apiKey: params.apiKey,
        sectionType: params.focusType,
        sections: params.sections,
        siteContext: params.siteContext,
        userMessage: imagePrompt,
        country: params.country,
        category: params.category,
      });
      delete fields.__generateImage;
      delete fields.__imagePrompt;
      if (fields.backgroundImage === "__GENERATE_IMAGE__") {
        delete fields.backgroundImage;
      }
      if (fields.sideImage === "__GENERATE_IMAGE__") {
        delete fields.sideImage;
      }
      Object.assign(fields, imageFields);
      void source;
    }

    out.push({
      type: "patch",
      sectionHint: params.focusId,
      fields,
    });
  }
  return out;
}

function extractJson(text: string): AiAssistResponse | null {
  const trimmed = text.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.unshift(fenced[1].trim());
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    candidates.push(trimmed.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as AiAssistResponse;
      if (parsed && typeof parsed.reply === "string") return parsed;
    } catch {
      // try next
    }
  }
  return null;
}

function normalizeActions(actions: unknown): AiAction[] {
  if (!Array.isArray(actions)) return [];
  const out: AiAction[] = [];
  for (const raw of actions) {
    if (!raw || typeof raw !== "object") continue;
    const action = raw as Record<string, unknown>;
    const type = typeof action.type === "string" ? action.type : "";
    if (type === "changeLayout") continue;

    if (type === "patch") {
      out.push({
        type: "patch",
        sectionHint:
          typeof action.sectionHint === "string" ? action.sectionHint : "",
        fields:
          action.fields && typeof action.fields === "object"
            ? (action.fields as Record<string, unknown>)
            : {},
      });
      continue;
    }

    if (type === "addSection") {
      const sectionType =
        typeof action.sectionType === "string" ? action.sectionType.trim() : "";
      if (!READY_SECTIONS.some((item) => item.type === sectionType)) continue;
      out.push({
        type: "addSection",
        sectionType,
        variant:
          typeof action.variant === "string" ? action.variant : undefined,
        afterSectionHint:
          typeof action.afterSectionHint === "string"
            ? action.afterSectionHint.trim()
            : undefined,
      });
      continue;
    }

    if (type === "addCustomSection") {
      const layoutId =
        typeof action.layoutId === "string" &&
        (CUSTOM_LAYOUTS as readonly string[]).includes(action.layoutId)
          ? action.layoutId
          : "two-columns";
      const elements = Array.isArray(action.elements)
        ? action.elements
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const row = item as Record<string, unknown>;
              const widget = typeof row.type === "string" ? row.type : "text";
              if (!(CUSTOM_WIDGETS as readonly string[]).includes(widget)) {
                return null;
              }
              return {
                columnIndex:
                  typeof row.columnIndex === "number" ? row.columnIndex : 0,
                type: widget as
                  | "text"
                  | "image"
                  | "button"
                  | "table"
                  | "slider"
                  | "faq"
                  | "heading"
                  | "testimonial",
                value: typeof row.value === "string" ? row.value : undefined,
                src: typeof row.src === "string" ? row.src : undefined,
                href: typeof row.href === "string" ? row.href : undefined,
                sliderCardsPerView:
                  row.sliderCardsPerView === 1 ||
                  row.sliderCardsPerView === 2 ||
                  row.sliderCardsPerView === 3 ||
                  row.sliderCardsPerView === 4
                    ? row.sliderCardsPerView
                    : undefined,
                faqItems: Array.isArray(row.faqItems)
                  ? row.faqItems
                      .map((faq) => {
                        if (!faq || typeof faq !== "object") return null;
                        const item = faq as Record<string, unknown>;
                        const question =
                          typeof item.question === "string"
                            ? item.question.trim()
                            : "";
                        const answer =
                          typeof item.answer === "string"
                            ? item.answer.trim()
                            : "";
                        if (!question) return null;
                        return {
                          id:
                            typeof item.id === "string"
                              ? item.id
                              : undefined,
                          question,
                          answer: answer || "Add an answer here.",
                        };
                      })
                      .filter(Boolean)
                  : undefined,
                testimonialItems: Array.isArray(row.testimonialItems)
                  ? row.testimonialItems
                      .map((item) => {
                        if (!item || typeof item !== "object") return null;
                        const rowItem = item as Record<string, unknown>;
                        const name =
                          typeof rowItem.name === "string"
                            ? rowItem.name.trim()
                            : "";
                        const quote =
                          typeof rowItem.quote === "string"
                            ? rowItem.quote.trim()
                            : "";
                        if (!name && !quote) return null;
                        return {
                          id:
                            typeof rowItem.id === "string"
                              ? rowItem.id
                              : undefined,
                          name: name || "Customer",
                          role:
                            typeof rowItem.role === "string"
                              ? rowItem.role
                              : undefined,
                          quote: quote || "Add a short testimonial quote here.",
                          image:
                            typeof rowItem.image === "string"
                              ? rowItem.image
                              : undefined,
                          rating:
                            typeof rowItem.rating === "number"
                              ? rowItem.rating
                              : undefined,
                        };
                      })
                      .filter(Boolean)
                  : undefined,
              };
            })
            .filter(Boolean)
        : [];
      out.push({
        type: "addCustomSection",
        layoutId,
        afterSectionHint:
          typeof action.afterSectionHint === "string"
            ? action.afterSectionHint.trim()
            : undefined,
        sectionFields:
          action.sectionFields && typeof action.sectionFields === "object"
            ? (action.sectionFields as Record<string, unknown>)
            : undefined,
        elements: elements as Array<{
          columnIndex?: number;
          type: "text" | "image" | "button" | "table" | "slider" | "faq" | "heading" | "testimonial";
          value?: string;
          src?: string;
          href?: string;
          sliderCardsPerView?: 1 | 2 | 3 | 4;
          faqItems?: Array<{ id?: string; question: string; answer: string }>;
          testimonialItems?: Array<{
            id?: string;
            name: string;
            role?: string;
            quote: string;
            image?: string;
            rating?: number;
          }>;
        }>,
      });
      continue;
    }

    if (type === "deleteSection") {
      out.push({
        type: "deleteSection",
        sectionHint:
          typeof action.sectionHint === "string" ? action.sectionHint : "",
      });
      continue;
    }

    if (type === "moveSection") {
      out.push({
        type: "moveSection",
        sectionHint:
          typeof action.sectionHint === "string" ? action.sectionHint : "",
        direction: action.direction === "down" ? "down" : "up",
      });
      continue;
    }

    if (type === "ask") {
      const options = Array.isArray(action.options)
        ? action.options
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const row = item as Record<string, unknown>;
              const id = typeof row.id === "string" ? row.id : "";
              const label = typeof row.label === "string" ? row.label : id;
              if (!id) return null;
              return { id, label };
            })
            .filter(Boolean)
        : [];
      if (options.length) out.push({ type: "ask", options: options as AiChoice[] });
      continue;
    }

    if (type === "addMasterItems") {
      const masterRaw =
        typeof action.master === "string" ? action.master.trim().toLowerCase() : "";
      const master =
        masterRaw === "blog" ||
        masterRaw === "service" ||
        masterRaw === "gallery" ||
        masterRaw === "team" ||
        masterRaw === "portfolio" ||
        masterRaw === "event" ||
        masterRaw === "property" ||
        masterRaw === "country"
          ? masterRaw
          : null;
      if (!master) continue;
      const items = Array.isArray(action.items)
        ? action.items
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const row = item as Record<string, unknown>;
              const title =
                typeof row.title === "string" ? row.title.trim() : "";
              if (!title) return null;
              return {
                title,
                desc: typeof row.desc === "string" ? row.desc : undefined,
                content:
                  typeof row.content === "string" ? row.content : undefined,
                author:
                  typeof row.author === "string" ? row.author : undefined,
                category:
                  typeof row.category === "string" ? row.category : undefined,
                image: typeof row.image === "string" ? row.image : undefined,
                seoTitle:
                  typeof row.seoTitle === "string" ? row.seoTitle : undefined,
                seoDescription:
                  typeof row.seoDescription === "string"
                    ? row.seoDescription
                    : undefined,
                seoKeywords:
                  typeof row.seoKeywords === "string"
                    ? row.seoKeywords
                    : undefined,
              };
            })
            .filter(Boolean)
            .slice(0, MASTER_MAX_ITEMS)
        : [];
      if (!items.length) continue;
      const modeRaw =
        typeof action.headerSubmenuMode === "string"
          ? action.headerSubmenuMode.trim().toLowerCase()
          : "";
      const mergeRaw =
        typeof action.headerSubmenuMerge === "string"
          ? action.headerSubmenuMerge.trim().toLowerCase()
          : "";
      out.push({
        type: "addMasterItems",
        master,
        items: items as Array<{
          title: string;
          desc?: string;
          content?: string;
          author?: string;
          category?: string;
          image?: string;
          seoTitle?: string;
          seoDescription?: string;
          seoKeywords?: string;
        }>,
        headerSubmenu: action.headerSubmenu === true,
        headerSubmenuMode:
          modeRaw === "category" || modeRaw === "type" || modeRaw === "name"
            ? modeRaw
            : undefined,
        headerSubmenuMerge:
          mergeRaw === "new" ||
          mergeRaw === "before" ||
          mergeRaw === "after" ||
          mergeRaw === "skip" ||
          mergeRaw === "mix" ||
          mergeRaw === "replace"
            ? mergeRaw === "mix"
              ? "after"
              : mergeRaw === "replace"
                ? "new"
                : (mergeRaw as "new" | "before" | "after" | "skip")
            : undefined,
      });
      continue;
    }

    if (type === "renameCountry") {
      const from =
        typeof action.from === "string" ? action.from.trim() : "";
      const to = typeof action.to === "string" ? action.to.trim() : "";
      if (from && to && from.toLowerCase() !== to.toLowerCase()) {
        out.push({ type: "renameCountry", from, to });
      }
      continue;
    }

    if (type === "renameMasterItem") {
      const masterRaw =
        typeof action.master === "string" ? action.master.trim().toLowerCase() : "";
      const master =
        masterRaw === "blog" ||
        masterRaw === "service" ||
        masterRaw === "gallery" ||
        masterRaw === "team" ||
        masterRaw === "portfolio" ||
        masterRaw === "event" ||
        masterRaw === "property" ||
        masterRaw === "country"
          ? masterRaw
          : null;
      const from =
        typeof action.from === "string" ? action.from.trim() : "";
      const to = typeof action.to === "string" ? action.to.trim() : "";
      if (
        master &&
        from &&
        to &&
        from.toLowerCase() !== to.toLowerCase()
      ) {
        out.push({ type: "renameMasterItem", master, from, to });
      }
      continue;
    }

    if (type === "setSiteSeo") {
      const metaTitle =
        typeof action.metaTitle === "string" ? action.metaTitle.trim() : "";
      const metaDescription =
        typeof action.metaDescription === "string"
          ? action.metaDescription.trim()
          : "";
      const metaKeywords =
        typeof action.metaKeywords === "string"
          ? action.metaKeywords.trim()
          : "";
      const pageLabel =
        typeof action.pageLabel === "string" ? action.pageLabel.trim() : "";
      const allPages = action.allPages === true;
      if (metaTitle || metaDescription || metaKeywords) {
        out.push({
          type: "setSiteSeo",
          ...(metaTitle ? { metaTitle: metaTitle.slice(0, 70) } : {}),
          ...(metaDescription
            ? { metaDescription: metaDescription.slice(0, 160) }
            : {}),
          ...(metaKeywords ? { metaKeywords: metaKeywords.slice(0, 200) } : {}),
          ...(allPages ? { allPages: true } : {}),
          ...(!allPages && pageLabel
            ? { pageLabel: pageLabel.slice(0, 48) }
            : {}),
        });
      }
      continue;
    }

    if (type === "publishSite") {
      out.push({ type: "publishSite" });
      continue;
    }

    if (type === "setThemeColors") {
      const raw =
        action.values && typeof action.values === "object"
          ? (action.values as Record<string, unknown>)
          : {};
      const values: Record<string, string> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string" && value.trim()) {
          values[key] = value.trim();
        }
      }
      if (Object.keys(values).length) {
        out.push({
          type: "setThemeColors",
          values,
          label:
            typeof action.label === "string" && action.label.trim()
              ? action.label.trim().slice(0, 40)
              : undefined,
        });
      }
      continue;
    }

    if (type === "deleteMasterItem") {
      const masterRaw =
        typeof action.master === "string" ? action.master.trim().toLowerCase() : "";
      const master =
        masterRaw === "blog" ||
        masterRaw === "service" ||
        masterRaw === "gallery" ||
        masterRaw === "team" ||
        masterRaw === "portfolio" ||
        masterRaw === "event" ||
        masterRaw === "property" ||
        masterRaw === "country"
          ? masterRaw
          : null;
      const title =
        typeof action.title === "string" ? action.title.trim() : "";
      if (master && title) {
        out.push({
          type: "deleteMasterItem",
          master,
          title: title.slice(0, 80),
        });
      }
      continue;
    }

    if (type === "renamePage") {
      const from = typeof action.from === "string" ? action.from.trim() : "";
      const to = typeof action.to === "string" ? action.to.trim() : "";
      if (
        from &&
        to &&
        from.toLowerCase() !== to.toLowerCase() &&
        !/^home$/i.test(from) &&
        !/^home$/i.test(to)
      ) {
        out.push({
          type: "renamePage",
          from: from.slice(0, 48),
          to: to.slice(0, 48),
        });
      }
      continue;
    }

    if (type === "duplicateSection") {
      const sectionHint =
        typeof action.sectionHint === "string"
          ? action.sectionHint.trim()
          : "";
      if (sectionHint) {
        out.push({ type: "duplicateSection", sectionHint });
      }
      continue;
    }

    if (type === "refreshHomeContent") {
      const audience =
        typeof action.audience === "string" && action.audience.trim()
          ? action.audience.trim().slice(0, 40)
          : "general";
      out.push({ type: "refreshHomeContent", audience });
      continue;
    }

    if (type === "addPage") {
      const pageLabel =
        typeof action.pageLabel === "string" ? action.pageLabel.trim() : "";
      if (!pageLabel) continue;
      if (RESERVED_NAV_PAGE_LABELS.has(pageLabel.toLowerCase())) continue;
      if (/^(this|that|current|ye|is)$/i.test(pageLabel)) continue;
      out.push({ type: "addPage", pageLabel: pageLabel.slice(0, 48) });
      continue;
    }

    if (type === "placePageInNav") {
      const afterLabel =
        typeof action.afterLabel === "string" ? action.afterLabel.trim() : "";
      if (!afterLabel) continue;
      const pageLabel =
        typeof action.pageLabel === "string" && action.pageLabel.trim()
          ? action.pageLabel.trim().slice(0, 48)
          : "current";
      out.push({ type: "placePageInNav", pageLabel, afterLabel });
      continue;
    }

    if (type === "addBreadcrumb") {
      const pageLabel =
        typeof action.pageLabel === "string" && action.pageLabel.trim()
          ? action.pageLabel.trim().slice(0, 48)
          : "current";
      out.push({ type: "addBreadcrumb", pageLabel });
      continue;
    }

    if (type === "deletePage") {
      const pageLabel =
        typeof action.pageLabel === "string" ? action.pageLabel.trim() : "";
      if (!pageLabel) continue;
      if (/^(this|that|current|ye|is|home)$/i.test(pageLabel)) continue;
      out.push({ type: "deletePage", pageLabel: pageLabel.slice(0, 48) });
      continue;
    }
  }
  return out;
}

function collectChoices(
  parsed: AiAssistResponse,
  actions: AiAction[],
): AiChoice[] {
  const fromTop = Array.isArray(parsed.choices)
    ? parsed.choices.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.label === "string",
      )
    : [];
  if (fromTop.length) return fromTop;
  for (const action of actions) {
    if (action.type === "ask" && Array.isArray(action.options)) {
      return action.options;
    }
  }
  return [];
}

function lastAssistantText(history: ChatTurn[]) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i]?.role === "assistant") return history[i].content || "";
  }
  return "";
}

const BANNER_TITLE_SAMPLES = [
  "Where curiosity becomes confidence",
  "Learning that sparks lifelong ambition",
  "A school built for bright futures",
  "Grow with purpose. Lead with heart.",
  "Education that feels personal and powerful",
  "Inspiring minds. Building character.",
  "Your child's next chapter starts here",
  "Curiosity today. Confidence tomorrow.",
];

const SECTION_TITLE_SAMPLES: Record<string, string[]> = {
  Banner: BANNER_TITLE_SAMPLES,
  About: [
    "About our school community",
    "Who we are and what we believe",
    "A legacy of learning and care",
    "Built on trust, driven by curiosity",
  ],
  Product: [
    "Programs that shape tomorrow",
    "Services designed for every learner",
    "What we offer families",
  ],
  WhyChooseUs: [
    "Why families choose us",
    "The difference you can feel",
    "Reasons parents trust our campus",
  ],
  Gallery: [
    "Moments from campus life",
    "A glimpse into our world",
    "Life at our school",
  ],
  CountriesServe: [
    "Countries We Serve",
    "Where families find us worldwide",
    "Campuses and cities we support",
  ],
  FAQ: [
    "Questions parents ask most",
    "Answers for curious families",
    "Helpful FAQs",
  ],
  Testimonial: [
    "What families say about us",
    "Stories from our community",
    "Trusted by parents like you",
  ],
  FormDetail: [
    "Get in touch with us",
    "Start the conversation",
    "We would love to hear from you",
  ],
};

function detectMentionedSection(text: string): string | null {
  const q = text.toLowerCase();
  // Non-banner first so "About heading" never becomes Banner.
  const catalog: Array<{ type: string; keys: string[] }> = [
    { type: "About", keys: ["about us", "about section", "about"] },
    {
      type: "Product",
      keys: ["services section", "service section", "services", "service", "product"],
    },
    {
      type: "WhyChooseUs",
      keys: ["why choose us", "why choose", "why us"],
    },
    { type: "Gallery", keys: ["gallery section", "gallery"] },
    {
      type: "CountriesServe",
      keys: [
        "countries we serve",
        "countries section",
        "countries",
        "country listing",
        "countries serve",
      ],
    },
    { type: "FAQ", keys: ["faq section", "faqs", "faq"] },
    {
      type: "Testimonial",
      keys: [
        "testimonial",
        "testimonials",
        "our clients",
        "reviews",
        "clients",
      ],
    },
    {
      type: "FormDetail",
      keys: ["form section", "contact form", "lead form", "form"],
    },
    { type: "Banner", keys: ["banner section", "banner", "hero"] },
  ];

  for (const entry of catalog) {
    for (const key of entry.keys) {
      if (q.includes(key)) return entry.type;
    }
  }
  return null;
}

function getSectionTitle(
  sections: SectionSnapshot[],
  sectionType: string,
): string {
  const needle = sectionType.toLowerCase();
  const section = sections.find(
    (item) =>
      item.type?.toLowerCase() === needle ||
      item.id?.toLowerCase() === needle ||
      item.id?.toLowerCase().includes(needle),
  );
  const data = section?.data || {};
  if (typeof data.title === "string" && data.title.trim()) return data.title.trim();
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const row = block as Record<string, unknown>;
    if (row.role === "heading" && typeof row.content === "string" && row.content.trim()) {
      return row.content.trim();
    }
  }
  // CustomSection heading widgets
  if (Array.isArray(data.columns)) {
    for (const column of data.columns) {
      if (!column || typeof column !== "object") continue;
      const elements = (column as { elements?: unknown }).elements;
      if (!Array.isArray(elements)) continue;
      for (const el of elements) {
        if (
          el &&
          typeof el === "object" &&
          (el as { type?: string }).type === "heading" &&
          typeof (el as { value?: string }).value === "string" &&
          (el as { value: string }).value.trim()
        ) {
          return (el as { value: string }).value.trim();
        }
      }
    }
  }
  return "";
}

function inventSectionTitle(
  sectionType: string,
  sections: SectionSnapshot[],
): string {
  const pool =
    SECTION_TITLE_SAMPLES[sectionType] || SECTION_TITLE_SAMPLES.About;
  const current = getSectionTitle(sections, sectionType).toLowerCase();
  const options = pool.filter((title) => title.toLowerCase() !== current);
  // Fallback only — prefer OpenAI fresh copy in POST.
  const pick = options[Math.floor(Math.random() * options.length)] || pool[0];
  return `${pick}`;
}

const SECTION_DESC_SAMPLES: Record<string, string[]> = {
  About: [
    "Strong academics with thoughtful student care. We help students build strong fundamentals, creative confidence, and real-world curiosity through guided learning.",
    "Our school blends caring teachers, focused academics, and a welcoming campus so every child can grow with confidence.",
    "From classroom to playground, we nurture curious minds with personal attention, modern learning, and values that last a lifetime.",
  ],
  Banner: [
    "Admissions, academics, activities, and parent trust — all in one place your team can edit anytime.",
    "Discover a campus where learning feels personal, joyful, and built for every child's next step.",
  ],
  Product: [
    "Explore programs crafted for different ages and goals — practical skills, creative growth, and confident communication.",
  ],
  WhyChooseUs: [
    "Families choose us for trusted teachers, safe campuses, and learning that balances academics with character.",
  ],
  Gallery: [
    "A look at classroom moments, celebrations, sports, and the everyday joy of learning together.",
  ],
  FAQ: [
    "Find clear answers about admissions, timings, curriculum, and how we support every learner.",
  ],
  Testimonial: [
    "Parents and students share how our community helps children grow with confidence and care.",
  ],
  FormDetail: [
    "Share your details and our team will guide you through the next step for your child.",
  ],
};

function getSectionDesc(
  sections: SectionSnapshot[],
  sectionType: string,
): string {
  const needle = sectionType.toLowerCase();
  const section = sections.find(
    (item) =>
      item.type?.toLowerCase() === needle ||
      item.id?.toLowerCase() === needle ||
      item.id?.toLowerCase().includes(needle),
  );
  const data = section?.data || {};
  if (typeof data.desc === "string" && data.desc.trim()) return data.desc.trim();
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const row = block as Record<string, unknown>;
    if (
      (row.role === "paragraph" || row.role === "subheading") &&
      typeof row.content === "string" &&
      row.content.trim()
    ) {
      return row.content.trim();
    }
  }
  if (Array.isArray(data.columns)) {
    for (const column of data.columns) {
      if (!column || typeof column !== "object") continue;
      const elements = (column as { elements?: unknown }).elements;
      if (!Array.isArray(elements)) continue;
      for (const el of elements) {
        if (
          el &&
          typeof el === "object" &&
          (el as { type?: string }).type === "text" &&
          typeof (el as { value?: string }).value === "string" &&
          (el as { value: string }).value.trim()
        ) {
          return (el as { value: string }).value
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      }
    }
  }
  return "";
}

function inventSectionDesc(
  sectionType: string,
  sections: SectionSnapshot[],
): string {
  const pool = SECTION_DESC_SAMPLES[sectionType] || SECTION_DESC_SAMPLES.About;
  const current = getSectionDesc(sections, sectionType).toLowerCase();
  const options = pool.filter((text) => text.toLowerCase() !== current);
  return options[Math.floor(Math.random() * options.length)] || pool[0];
}

function needFreshCopy(
  sectionType: string,
  field: "title" | "desc" | "button" | "pretitle",
): ContentGenerateIntent {
  return { __generate: true, sectionType, field };
}

function isGenerateIntent(
  value: ResolveResult | null,
): value is ContentGenerateIntent {
  return Boolean(value && "__generate" in value && value.__generate);
}

function needFreshImage(sectionType: string): ImageGenerateIntent {
  return { __generateImage: true, sectionType };
}

function isImageGenerateIntent(
  value: ResolveResult | null,
): value is ImageGenerateIntent {
  return Boolean(
    value && "__generateImage" in value && value.__generateImage,
  );
}

function patchSectionTitle(
  sectionType: string,
  title: string,
): AiAssistResponse {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  return {
    reply: `Updated ${label} heading to:\n"${title}"`,
    actions: [
      {
        type: "patch",
        sectionHint: sectionType.toLowerCase(),
        fields: { title },
      },
    ],
    choices: [],
  };
}

function patchSectionDesc(sectionType: string, desc: string): AiAssistResponse {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  const words = desc.trim().split(/\s+/).filter(Boolean).length;
  return {
    reply: `Updated ${label} description (${words} words):\n\n${desc}`,
    actions: [
      {
        type: "patch",
        sectionHint: sectionType.toLowerCase(),
        fields: { desc },
      },
    ],
    choices: [],
  };
}

const BUTTON_LABEL_SAMPLES: Record<string, string[]> = {
  Banner: [
    "Explore admissions",
    "Apply Now",
    "Visit Campus",
    "Get Started",
    "Book a tour",
    "Learn more",
  ],
  About: [
    "Meet our teachers",
    "Our story",
    "Discover more",
    "Join our community",
  ],
  Product: ["View programs", "Explore services", "See details"],
  WhyChooseUs: ["Why choose us", "See the difference"],
  Gallery: ["View gallery", "See moments"],
  FAQ: ["Ask a question", "Read FAQs"],
  Testimonial: ["Read stories", "See reviews"],
  FormDetail: ["Contact us", "Send enquiry", "Get in touch"],
};

function getSectionButtonLabel(
  sections: SectionSnapshot[],
  sectionType: string,
): string {
  const section = sections.find(
    (item) =>
      item.type?.toLowerCase() === sectionType.toLowerCase() ||
      item.id?.toLowerCase() === sectionType.toLowerCase() ||
      item.id?.toLowerCase().includes(sectionType.toLowerCase()),
  );
  const data = section?.data || {};
  if (typeof data.buttonLabel === "string" && data.buttonLabel.trim()) {
    return data.buttonLabel.trim();
  }
  if (Array.isArray(data.buttons)) {
    for (const button of data.buttons) {
      if (!button || typeof button !== "object") continue;
      const label = (button as Record<string, unknown>).label;
      if (typeof label === "string" && label.trim()) return label.trim();
    }
  }
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const row = block as Record<string, unknown>;
    if (row.type === "button" && typeof row.label === "string" && row.label.trim()) {
      return row.label.trim();
    }
  }
  const slides = Array.isArray(data.bannerSlides) ? data.bannerSlides : [];
  const first = slides[0];
  if (first && typeof first === "object") {
    const button = (first as Record<string, unknown>).button;
    if (button && typeof button === "object") {
      const label = (button as Record<string, unknown>).label;
      if (typeof label === "string" && label.trim()) return label.trim();
    }
  }
  if (section?.type === "CustomSection") {
    const custom = readCustomSectionCopy(data);
    if (custom.buttonLabel) return custom.buttonLabel;
  }
  return "";
}

function inventButtonLabel(
  sectionType: string,
  sections: SectionSnapshot[],
): string {
  const pool = BUTTON_LABEL_SAMPLES[sectionType] || BUTTON_LABEL_SAMPLES.Banner;
  const current = getSectionButtonLabel(sections, sectionType).toLowerCase();
  const options = pool.filter((label) => label.toLowerCase() !== current);
  return options[Math.floor(Math.random() * options.length)] || pool[0];
}

function patchSectionButton(
  sectionType: string,
  buttonLabel: string,
): AiAssistResponse {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  return {
    reply: `Updated ${label} button text to: "${buttonLabel}"`,
    actions: [
      {
        type: "patch",
        sectionHint: sectionType.toLowerCase(),
        fields: { buttonLabel },
      },
    ],
    choices: [],
  };
}

function patchBannerTitle(title: string): AiAssistResponse {
  return patchSectionTitle("Banner", title);
}

/** True when message is a command/request, not the actual headline text. */
function looksLikeInstruction(text: string): boolean {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  if (/^[“"'].+[”"']$/.test(text.trim())) return false;

  if (/\b(please|plz|pls|karo|kro|banao)\b/.test(q)) return true;
  if (/\b(change|update|edit|modify|rewrite|improve|replace|fix|changes)\b/.test(q)) {
    return true;
  }
  if (/\b(add|set)\b.+\b(heading|title|content|banner|section|description|desc)\b/.test(q)) {
    return true;
  }
  if (
    /\b(heading|title|content|banner|description|desc)\b.+\b(add|set|change|update|new)\b/.test(
      q,
    )
  ) {
    return true;
  }
  if (
    /\bsomething\s+new\b|\bsometing\s+new\b|\bgood\s+con\w*\b|\bnew\s+conte?\w*\b|\bbetter\s+conte?\w*\b|\brelated\b|\brealated\b/.test(
      q,
    )
  ) {
    return true;
  }
  if (/^(banner\s+)?(title|heading|description|desc)\s*[:=]/i.test(text.trim())) {
    return true;
  }
  return false;
}

function extractExplicitTitle(text: string): string | null {
  const trimmed = text.trim();
  const quotedOnly = trimmed.match(/^[“"'](.+?)[”"']$/);
  if (quotedOnly?.[1]?.trim()) return quotedOnly[1].trim();

  const labeled = trimmed.match(
    /^(?:banner\s+)?(?:title|heading)\s*[:=-]\s*[“"']?(.+?)[”"']?\s*$/i,
  );
  if (labeled?.[1]?.trim()) {
    const value = labeled[1].trim();
    if (!looksLikeInstruction(value)) return value;
  }

  const setTo = trimmed.match(
    /(?:set|change|update)\s+(?:the\s+)?(?:banner\s+)?(?:title|heading)\s+(?:to|as)\s+[“"']?(.+?)[”"']?\s*$/i,
  );
  if (setTo?.[1]?.trim()) {
    const value = setTo[1].trim();
    // "change banner heading to something new" → value is instruction, reject
    if (!looksLikeInstruction(value) && value.split(/\s+/).length <= 14) {
      return value;
    }
  }

  const quotedIn = trimmed.match(/[“"'](.+?)[”"']/);
  if (
    quotedIn?.[1]?.trim() &&
    /(banner|title|heading)/i.test(trimmed) &&
    !looksLikeInstruction(quotedIn[1])
  ) {
    return quotedIn[1].trim();
  }

  return null;
}

function extractExplicitDesc(text: string): string | null {
  const trimmed = text.trim();
  const quotedOnly = trimmed.match(/^[“"'](.+?)[”"']$/);
  if (quotedOnly?.[1]?.trim() && quotedOnly[1].trim().length > 20) {
    return quotedOnly[1].trim();
  }

  const labeled = trimmed.match(
    /^(?:(?:about|banner)\s+)?(?:description|desc|paragraph)\s*[:=-]\s*[“"']?(.+?)[”"']?\s*$/i,
  );
  if (labeled?.[1]?.trim() && !looksLikeInstruction(labeled[1])) {
    return labeled[1].trim();
  }

  const quotedIn = trimmed.match(/[“"'](.+?)[”"']/);
  if (
    quotedIn?.[1]?.trim() &&
    /(description|desc|paragraph)/i.test(trimmed) &&
    !looksLikeInstruction(quotedIn[1])
  ) {
    return quotedIn[1].trim();
  }

  return null;
}

function wantsButtonTextChange(text: string): boolean {
  const q = text.toLowerCase();
  // Adding a section/card/CTA block is NOT a button-label edit
  if (
    /\b(add|naya|new|daalo|daldo|jod|jodo|banao|lagao)\b/.test(q) &&
    /\b(section|card|block|widget)\b/.test(q)
  ) {
    return false;
  }
  if (/\bcta\s*card\b/.test(q)) return false;
  if (
    /\b(ke\s+baad|after)\b/.test(q) &&
    /\b(add|naya|new|daalo|banao|lagao)\b/.test(q)
  ) {
    return false;
  }
  // Visual redesign of CTA/card — not Banner button text
  if (
    /\b(look|design|style|ui|layout|achha|accha|sundar)\b/.test(q) &&
    /\b(cta|card|custom|bnaya|bnaye|banya|uska|usko)\b/.test(q)
  ) {
    return false;
  }
  if (
    /\b(look|design|style)\b/.test(q) &&
    !/\b(button|btn)\s*(text|label)\b/.test(q)
  ) {
    return false;
  }
  const mentionsControl =
    /\b(button|btn)\b/.test(q) ||
    (/\bcta\b/.test(q) && !/\b(card|section|block|look|design)\b/.test(q));
  if (!mentionsControl) return false;
  return /\b(change|changes|update|edit|rewrite|improve|fix|text|label|badal|badlo)\b/.test(
    q,
  );
}


/** Remove FAQ items (undo last N adds) — must win over add detection. */
function wantsRemoveFaqItems(text: string): boolean {
  const q = text.toLowerCase();
  // Whole FAQ section delete is handled by wantsDeleteSection
  if (/\bsection\b/.test(q)) return false;
  if (
    /\bfaqs?\s+(hatao|hata\s*do|hata\s*kro|delete|remove)\b/.test(q) &&
    !/\b(questions?|items?|jo\s*(add\s*)?kiya|last\s+\d+|naye)\b/.test(q)
  ) {
    return false;
  }
  const mentionsFaq =
    /\bfaqs?\b/.test(q) || /\b(questions?|prashn|uttar)\b/.test(q);
  const wantsRemove =
    /\b(remove|delete|undo|revert|hatao|hata\s*do|hata\s*kro|nikalo|nikal|clear|wapas|hatana)\b/.test(
      q,
    );
  // "jo add kiya remove kro" / "jo kiya remove"
  const undoAdded =
    wantsRemove &&
    /\b(jo\s*(add\s*)?kiya|added|naye|new\s+faq)\b/.test(q);
  return mentionsFaq && (wantsRemove || undoAdded);
}

/** Add Q&A items into existing FAQ section — not a new Ready/Custom section. */
function wantsAddFaqItems(text: string): boolean {
  // Never steal whole-page language rewrite into FAQ append.
  if (wantsHomeLanguageContent(text) || extractHomeContentLanguage(text)) {
    return false;
  }
  const q = text.toLowerCase();
  if (wantsRemoveFaqItems(text)) return false;
  if (/\b(ready section|custom section)\b/.test(q)) return false;
  // Bare "add faq" / "faq banao" / "custom faq" = new section, not items
  if (
    /\badd\b.*\bfaq\s+section\b/.test(q) &&
    !/\b(item|items|question|questions)\b/.test(q)
  ) {
    return false;
  }
  const mentionsFaq =
    /\bfaqs?\b/.test(q) || /\b(questions?|prashn|uttar)\b/.test(q);
  const wantsAdd =
    /\b(add|append|jod|jodo|daalo|daldo|dal|insert|naye|naya|new|extra|more)\b/.test(
      q,
    );
  if (!mentionsFaq || !wantsAdd) return false;

  // Must clearly mean Q&A rows inside FAQ — not "add faq" section
  const wantsItems =
    /\b(questions?|items?|sawal|prashn|q\s*&\s*a|answers?|jawab)\b/.test(q) ||
    /\bfaqs?\s*(mein|mai|me|m)\b/.test(q) ||
    /\b(more|extra|naye|naya)\s+faqs?\b/.test(q) ||
    /\b\d+\s*(?:new\s+)?faqs?\b/.test(q) ||
    /\bfaqs?\s*(?:me|mein|mai)\s*\d+\b/.test(q);
  return wantsItems;
}

/** "add faq" / "faq banao" → add FAQ section (Ready vs Custom), not Q&A rows. */
function wantsAddFaqSection(text: string): boolean {
  if (wantsHomeLanguageContent(text) || extractHomeContentLanguage(text)) {
    return false;
  }
  const q = text.toLowerCase().trim();
  if (wantsAddFaqItems(text) || wantsRemoveFaqItems(text)) return false;
  if (!/\bfaqs?\b/.test(q)) return false;
  return (
    /\b(add|create|naya|new|banao|bnao|kro|karo|daalo|lagao|dal)\b/.test(q) ||
    /\bfaq\s*(section|card|block)\b/.test(q)
  );
}

function resolveAddFaqSection(
  userMessage: string,
  sections: SectionSnapshot[],
): AiAssistResponse {
  const q = userMessage.toLowerCase();
  const english = isMostlyEnglish(userMessage);
  if (/\bcustom\b/.test(q)) {
    return askPlacement("Custom FAQ", sections);
  }
  if (/\bready\b/.test(q)) {
    return askPlacement("FAQ", sections);
  }
  return {
    reply: english
      ? "Add FAQ as Ready Section or Custom Section?"
      : "FAQ Ready Section add karun ya Custom Section?",
    actions: [{ type: "ask", options: READY_OR_CUSTOM_CHOICES }],
    choices: READY_OR_CUSTOM_CHOICES,
  };
}

function extractFaqCount(text: string): number {
  const match = text.match(
    /(\d{1,2})\s*(?:new\s+)?(?:faqs?|questions?|prashn|items?)/i,
  );
  if (match) {
    return Math.min(15, Math.max(1, Number(match[1]) || 5));
  }
  const bare = text.match(/\b(\d{1,2})\b/);
  if (
    bare &&
    (wantsAddFaqItems(text) || wantsRemoveFaqItems(text))
  ) {
    return Math.min(15, Math.max(1, Number(bare[1]) || 5));
  }
  return 5;
}

function prevAskedForFaqItems(prev: string): boolean {
  const p = prev.toLowerCase();
  return (
    /\bfaq\b/.test(p) &&
    (/\b(question|questions|prashn|jawab|answer|answers)\b/.test(p) ||
      /\b(add|adding|jod)\b/.test(p))
  );
}

const FAQ_ITEM_SAMPLES: Array<{ question: string; answer: string }> = [
  {
    question: 'What documents are needed for admission?',
    answer:
      'Typically a birth certificate, previous school records, address proof, and passport-size photos. Our admissions desk shares the full checklist for each class.',
  },
  {
    question: 'Is transport available for students?',
    answer:
      'Yes, safe GPS-enabled school transport covers major nearby routes. Seat availability and route details are confirmed at the time of enrolment.',
  },
  {
    question: 'What are the school timings?',
    answer:
      'Regular classes usually run in morning hours with age-appropriate schedules for junior and senior wings. Exact timings are shared in the parent handbook.',
  },
  {
    question: 'Do you offer scholarships or fee concessions?',
    answer:
      'Merit and need-based support may be available for eligible families. Please speak with admissions for current criteria and application windows.',
  },
  {
    question: 'How do you support students with learning differences?',
    answer:
      'We provide guided support, smaller attention where needed, and regular parent updates so every learner can progress with confidence.',
  },
  {
    question: 'Is there a daycare or after-school programme?',
    answer:
      'Extended care and activity clubs are offered on selected weekdays. Registration is open each term based on capacity.',
  },
  {
    question: 'Which curriculum board do you follow?',
    answer:
      'Our academic plan follows a recognised board framework with strong focus on concepts, communication, and practical application.',
  },
  {
    question: 'How often are parent-teacher meetings held?',
    answer:
      'Formal PTMs are scheduled each term, with additional check-ins whenever teachers or parents request a conversation.',
  },
  {
    question: 'Are extracurricular activities included?',
    answer:
      'Sports, arts, music, and clubs are part of the weekly timetable so students grow beyond classroom learning.',
  },
  {
    question: 'What is the teacher-to-student ratio?',
    answer:
      'We keep class sizes balanced so teachers can give personal attention while still encouraging peer learning.',
  },
  {
    question: 'How is student safety managed on campus?',
    answer:
      'Entry checks, trained staff, CCTV in common areas, and clear pickup protocols help keep the campus secure throughout the day.',
  },
  {
    question: 'Can I apply for mid-year admission?',
    answer:
      'Mid-year seats depend on vacancy in the requested class. Share your child details and we will confirm availability quickly.',
  },
  {
    question: 'Do you provide meals or a cafeteria?',
    answer:
      'Nutritious meal options are available through the campus cafeteria with hygiene checks and age-suitable menus.',
  },
  {
    question: 'How are assessments and report cards shared?',
    answer:
      'Continuous assessment is paired with term reports shared digitally with parents, plus clear next-step guidance for improvement.',
  },
  {
    question: 'Is uniform mandatory?',
    answer:
      'Yes, the prescribed uniform builds identity and equality. Seasonal and sports dress guidelines are listed in the parent kit.',
  },
];

function getExistingFaqItems(
  sections: SectionSnapshot[],
): Array<{ question: string; answer: string }> {
  const section = sections.find(
    (item) =>
      item.type?.toLowerCase() === 'faq' ||
      item.id?.toLowerCase().includes('faq'),
  );
  const raw = section?.data?.faqItems;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const question =
        typeof row.question === 'string' ? row.question.trim() : '';
      const answer = typeof row.answer === 'string' ? row.answer.trim() : '';
      if (!question) return null;
      return {
        question,
        answer: answer || 'Details will be shared by our team.',
      };
    })
    .filter(
      (item): item is { question: string; answer: string } => Boolean(item),
    );
}

function inventFaqItems(
  count: number,
  sections: SectionSnapshot[],
): Array<{ question: string; answer: string }> {
  const existing = getExistingFaqItems(sections);
  const existingQ = new Set(
    existing.map((item) => item.question.toLowerCase()),
  );
  const pool = FAQ_ITEM_SAMPLES.filter(
    (item) => !existingQ.has(item.question.toLowerCase()),
  );
  const source = pool.length ? pool : FAQ_ITEM_SAMPLES;
  const picked: Array<{ question: string; answer: string }> = [];
  const used = new Set<string>(existingQ);

  for (let i = 0; i < count; i += 1) {
    const base = source[i % source.length];
    let question = base.question;
    let n = 2;
    while (used.has(question.toLowerCase())) {
      question = `${base.question} (${n})`;
      n += 1;
    }
    used.add(question.toLowerCase());
    picked.push({ question, answer: base.answer });
  }
  return picked;
}

function patchFaqItemsAppend(
  sections: SectionSnapshot[],
  count: number,
): AiAssistResponse {
  const existing = getExistingFaqItems(sections);
  const added = inventFaqItems(count, sections);
  const faqItems = [...existing, ...added];
  return {
    reply: `FAQ section mein ${added.length} naye sawal-jawab add kar diye. Page pe FAQ cards refresh karke dekh lo.`,
    actions: [
      {
        type: "patch",
        sectionHint: "FAQ",
        fields: { faqItems },
      },
    ],
    choices: [],
  };
}

function patchFaqItemsRemove(
  sections: SectionSnapshot[],
  count: number,
): AiAssistResponse {
  const existing = getExistingFaqItems(sections);
  if (!existing.length) {
    return {
      reply: "FAQ section khali hai — remove karne ke liye koi item nahi mila.",
      actions: [],
      choices: [],
    };
  }

  const removeCount = Math.min(Math.max(1, count), existing.length);
  const faqItems = existing.slice(0, existing.length - removeCount);

  return {
    reply: `FAQ se last ${removeCount} items hata diye. Ab ${faqItems.length} questions bachi hain.`,
    actions: [
      {
        type: "patch",
        sectionHint: "FAQ",
        fields: { faqItems },
      },
    ],
    choices: [],
  };
}

function wantsDescContentChange(text: string): boolean {
  if (wantsFocusContentRefresh(text)) return false;
  const q = text.toLowerCase();
  if (/\b(section)\b/.test(q) && /\b(add|ready|custom)\b/.test(q)) return false;
  if (wantsButtonTextChange(text)) return false;

  const mentionsDesc = /\b(desc|description|paragraph|body\s*text|write-?up)\b/i.test(
    q,
  );
  const mentionsSection =
    /\b(about|banner|gallery|faq|service|testimonial|form|why choose)\b/.test(q) ||
    /\bsection\b/.test(q);
  const hasEditVerb =
    /\b(change|changes|update|edit|improve|rewrite|fix|new|add|plz|please|pls|good|better|set|likho|likh|banao|karo|kro)\b/i.test(
      q,
    );
  const hasWordTarget = /\b\d{2,4}\s*(?:words?|word)\b/i.test(q);

  // "about section description 50 word mai"
  if (mentionsDesc && (mentionsSection || hasEditVerb || hasWordTarget)) {
    return true;
  }

  // "add new content about ..." without saying heading
  if (
    /\b(content)\b/.test(q) &&
    /\b(about|banner|gallery|faq|service|testimonial)\b/.test(q) &&
    !/\b(heading|title|button|btn)\b/.test(q)
  ) {
    return true;
  }
  return false;
}

function extractWordTarget(text: string): number | null {
  const match = text.match(/(\d{2,4})\s*(?:words?|word)/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  return Math.min(600, Math.max(20, Math.round(n)));
}

const STOCK_IMAGES = [
  "/categories/school/bg11.jpg",
  "/categories/school/bg22.jpg",
  "/categories/school/bg33.png",
  "/bg1.jpg",
];

function wantsImageChange(text: string): boolean {
  const q = text.toLowerCase();
  if (/\b(add|naya|new)\b/.test(q) && /\b(section)\b/.test(q)) return false;
  // Adding slider/gallery/carousel is NOT an image replace on Banner/About
  if (
    /\b(add|naya|new|daalo|daldo|lagao|banao)\b/.test(q) &&
    /\b(slider|carousel|gallery|slideshow)\b/.test(q)
  ) {
    return false;
  }
  if (
    /\b(ke\s+baad|after)\b/.test(q) &&
    /\b(add|naya|new|daalo|lagao)\b/.test(q)
  ) {
    return false;
  }
  // CTA/custom card image belongs to CTA restyle — not About/Banner image swap
  if (
    /\b(cta|custom\s*section|cta\s*card)\b/.test(q) ||
    (/\b(jo\s*bn[aiy]+|usmai|usme|uska|usko)\b/.test(q) &&
      /\b(cta|card|look)\b/.test(q))
  ) {
    return false;
  }
  return (
    (/\b(image|img|photo|picture|pic|background)\b/.test(q) &&
      /\b(change|changes|update|replace|edit|new|badlo|badal|kro|karo|fix|swap|add|daalo|dal)\b/.test(
        q,
      )) ||
    /\b(image|photo|picture|img).*(change|update|replace|badal|add)/.test(q) ||
    /\b(change|update|replace|badal|add).*(image|photo|picture|img)/.test(q)
  );
}

function wantsAddImageSlider(text: string): boolean {
  const q = text.toLowerCase();
  if (!/\bslider\b/.test(q) && !/\b(carousel|slideshow)\b/.test(q)) {
    return false;
  }
  const wantsAdd =
    /\b(add|naya|new|daalo|daldo|lagao|banao|bnao|jod)\b/.test(q) ||
    /\badd\s*kro\b/.test(q) ||
    /\b(ke\s+baad|after)\b/.test(q);
  return wantsAdd || /\b(images?\s*slider|image\s*slider)\b/.test(q);
}

function historyHasImageSliderIntent(history: ChatTurn[]): boolean {
  return history.some((turn) => {
    if (!turn?.content) return false;
    const t = turn.content.toLowerCase();
    return (
      /\b(images?\s*slider|image\s*slider|photo\s*slider|custom image slider|custom slider|ready image slider)\b/.test(
        t,
      ) ||
      (/\bslider\b/.test(t) &&
        /\b(add|baad|variant|custom|banner|ready|card)\b/.test(t))
    );
  });
}

function isMostlyEnglish(text: string): boolean {
  const q = text.toLowerCase();
  // Hinglish / Hindi cues
  if (
    /\b(kro|karo|chahiye|bnao|banao|baad|mai|mein|mujhe|kya|nahi|nhi|achha|accha|diya|sakte|bolo|dekh|lo|hai|hain|ka|ki|ke|se|pe|par|usme|uska|usko|naye|naya|kaise|theek|aap|tum|ho|app)\b/.test(
      q,
    )
  ) {
    return false;
  }
  // Devanagari
  if (/[\u0900-\u097F]/.test(text)) return false;
  return /[a-z]/i.test(text);
}

function wantsCasualGreeting(text: string): boolean {
  const q = text.trim().toLowerCase();
  if (!q || q.length > 60) return false;
  // Don't treat "hi what is your name?" as a bare greeting
  if (
    /\b(name|kaun|kon|who are you|what can you|help me|add|change|update|slider|banner|section)\b/.test(
      q,
    )
  ) {
    return false;
  }
  if (/^(hi|hello|hey|hola|namaste|yo)[\s!.?]*$/i.test(q)) return true;
  if (
    /^(hi|hello|hey)\b/.test(q) &&
    /\b(how are you|how's it going|how r you|how do you do)\b/.test(q) &&
    q.split(/\s+/).length <= 8
  ) {
    return true;
  }
  return /\b(kaise ho|kese ho|kaisa hai|kya haal|kaise hai)\b/.test(q);
}

function wantsAssistIdentity(text: string): boolean {
  const q = text.trim().toLowerCase();
  return (
    /\b(what('?s| is) your name|who are you|your name|tumhara naam|aapka naam|kaun ho)\b/.test(
      q,
    ) || /^(hi|hello|hey)[,!.\s]+what('?s| is) your name\??$/i.test(q.trim())
  );
}

function replyCasualGreeting(text: string): AiAssistResponse {
  const english = isMostlyEnglish(text);
  return {
    reply: english
      ? "I'm good, thanks! How can I help with your page today?"
      : "Main theek hoon — aap kaise hain? Batayein page pe kya change karna hai.",
    actions: [],
    choices: [],
  };
}

function replyAssistIdentity(text: string): AiAssistResponse {
  const english = isMostlyEnglish(text);
  return {
    reply: english
      ? "I'm AI Assist for CSS Founder — I help edit your website sections, content, images, and layout from this chat."
      : "Main CSS Founder ka AI Assist hoon — is chat se aap sections, content, images aur layout edit kar sakte ho.",
    actions: [],
    choices: [],
  };
}

function prevAskedSliderReadyOrCustom(prev: string): boolean {
  const p = prev.toLowerCase();
  return (
    (/\bslider\b/.test(p) &&
      /\bready\b/.test(p) &&
      /\bcustom\b/.test(p)) ||
    /\bready image slider\b/.test(p) ||
    /\bcustom slider\b/.test(p) ||
    /\bslider ready chahiye ya custom\b/.test(p) ||
    /\bdo you want a ready or custom slider\b/.test(p) ||
    /\bready or custom\b/.test(p)
  );
}

function extractSliderCardsPerView(text: string): 1 | 2 | 3 | 4 | null {
  const match = text.match(/\b([1-4])\s*(?:cards?|images?|slides?)\b/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return null;
}

function extractSliderAfterHint(
  message: string,
  history: ChatTurn[],
  pendingChoices: AiChoice[],
  sections: SectionSnapshot[],
): string {
  return (
    resolvePlacementHint(message, pendingChoices, sections) ||
    resolvePlacementHint(
      history.map((turn) => turn.content).join(" "),
      [],
      sections,
    ) ||
    "Banner"
  );
}

const SLIDER_TYPE_CHOICES: AiChoice[] = [
  { id: "slider-ready", label: "Ready Image Slider" },
  { id: "slider-custom", label: "Custom Slider (1–4 cards)" },
];

function askSliderReadyOrCustom(userMessage = ""): AiAssistResponse {
  const english = isMostlyEnglish(userMessage);
  return {
    reply: english
      ? "Do you want a Ready or Custom slider?\n• Ready = Banner Image Slider (full slider section)\n• Custom = cards per view (1/2/3/4) + click-to-open popup settings"
      : "Slider Ready chahiye ya Custom?\n• Ready = Banner Image Slider (full slider section)\n• Custom = cards per view (1/2/3/4) + click popup settings",
    actions: [{ type: "ask", options: SLIDER_TYPE_CHOICES }],
    choices: SLIDER_TYPE_CHOICES,
  };
}

function buildImageSliderAdd(
  afterSectionHint?: string,
  userMessage = "",
): AiAssistResponse {
  const english = isMostlyEnglish(userMessage);
  return {
    reply: english
      ? "Added a Ready Image Slider (Banner-3) after the Banner. Check it on the page."
      : "Banner ke baad Ready Image Slider (Banner-3) add kar diya. Page pe check kar lo.",
    actions: [
      {
        type: "addSection",
        sectionType: "Banner",
        variant: "Banner-3",
        afterSectionHint: afterSectionHint || "Banner",
      },
    ],
    choices: [],
  };
}

function buildCustomImageSliderAdd(
  afterSectionHint?: string,
  cardsPerView: 1 | 2 | 3 | 4 = 1,
  userMessage = "",
): AiAssistResponse {
  const english = isMostlyEnglish(userMessage);
  const cardLabel =
    cardsPerView > 1 ? `${cardsPerView} cards` : "1 card";
  return {
    reply: english
      ? `Added a Custom Slider (${cardLabel} per view). You can change cards/popup in Edit.`
      : `Custom Slider add kar diya (${cardsPerView} card${cardsPerView > 1 ? "s" : ""} per view). Edit se cards/popup change kar sakte ho.`,
    actions: [
      {
        type: "addCustomSection",
        layoutId: "single",
        afterSectionHint: afterSectionHint || "Banner",
        elements: [
          {
            columnIndex: 0,
            type: "slider",
            sliderCardsPerView: cardsPerView,
          },
        ],
      },
    ],
    choices: [],
  };
}

function getSectionImageFields(
  sections: SectionSnapshot[],
  sectionType: string,
): { backgroundImage: string; sideImage: string } {
  const section = sections.find(
    (item) =>
      item.type?.toLowerCase() === sectionType.toLowerCase() ||
      item.id?.toLowerCase().includes(sectionType.toLowerCase()),
  );
  const data = section?.data || {};
  let backgroundImage =
    typeof data.backgroundImage === "string" ? data.backgroundImage : "";
  let sideImage = typeof data.sideImage === "string" ? data.sideImage : "";

  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const row = block as Record<string, unknown>;
    if (row.type !== "image" || typeof row.src !== "string") continue;
    if ((row.role === "background" || !row.role) && !backgroundImage) {
      backgroundImage = row.src;
    }
    if (row.role === "side" && !sideImage) {
      sideImage = row.src;
    }
  }

  return { backgroundImage, sideImage };
}

function pickDifferentImage(current: string, alsoAvoid: string[] = []): string {
  const avoid = new Set(
    [current, ...alsoAvoid]
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
  const options = STOCK_IMAGES.filter(
    (src, index, arr) =>
      arr.indexOf(src) === index && !avoid.has(src.toLowerCase()),
  );
  if (options.length) {
    return options[Math.floor(Math.random() * options.length)];
  }
  // Cycle if all collide
  const idx = Math.max(
    0,
    STOCK_IMAGES.findIndex((src) => src.toLowerCase() === current.toLowerCase()),
  );
  return STOCK_IMAGES[(idx + 1) % STOCK_IMAGES.length];
}

function patchSectionImages(
  sectionType: string,
  fields: Record<string, unknown>,
  source: "ai" | "online" | "local",
  meta?: { countryName?: string; categoryLabel?: string },
): AiAssistResponse {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  const sourceNote =
    source === "ai"
      ? "Generated online with AI"
      : source === "online"
        ? "Fetched from online photo library"
        : "Local category template fallback";
  const bits = [
    meta?.categoryLabel ? `${meta.categoryLabel} category` : null,
    meta?.countryName ? `${meta.countryName} style` : null,
  ].filter(Boolean);
  const metaNote = bits.length ? ` · ${bits.join(" · ")}` : "";
  return {
    reply: `Updated ${label} image(s). ${sourceNote}${metaNote}. Scroll to ${label} to preview.`,
    actions: [
      {
        type: "patch",
        sectionHint: sectionType.toLowerCase(),
        fields,
      },
    ],
    choices: [],
  };
}

function wantsHeadingContentChange(text: string): boolean {
  if (wantsFocusContentRefresh(text)) return false;
  const q = text.toLowerCase();
  if (/\b(section)\b/.test(q) && /\b(add|ready|custom)\b/.test(q)) return false;
  if (wantsButtonTextChange(text)) return false;
  if (wantsDescContentChange(text)) return false;
  return (
    (/(title|heading|content|text)/i.test(q) &&
      /\b(change|changes|update|edit|improve|rewrite|fix|new|add|plz|please|pls|good|better)\b/i.test(
        q,
      )) ||
    /\b(good|better|new)\s+con\w*\b/i.test(q)
  );
}

/** Banner-only when Banner is named, or vague request with no other section. */
function wantsBannerContentChange(text: string): boolean {
  if (!wantsHeadingContentChange(text)) return false;
  const mentioned = detectMentionedSection(text);
  if (mentioned && mentioned !== "Banner") return false;
  if (mentioned === "Banner") return true;
  const q = text.toLowerCase();
  return (
    /\bbanner\b|\bhero\b/i.test(q) ||
    /\b(good|better|new)\s+con\w*\b/i.test(q) ||
    (!(
      /\b(about|gallery|faq|service|testimonial|form|why choose)\b/i.test(q)
    ) &&
      (/\b(heading|title)\b/i.test(q) || /\bbanner\b/i.test(q)))
  );
}

function prevAskedForDescription(prev: string): boolean {
  const p = prev.toLowerCase();
  return (
    /\b(description|desc|paragraph)\b/.test(p) &&
    /\b(what|which|would you like|type the|set for|new description)\b/.test(p)
  );
}

function sectionFromAssistantPrompt(prev: string): string {
  return detectMentionedSection(prev) || "About";
}

const PLACEMENT_SKIP_TYPES = new Set([
  "Header",
  "Topbar",
  "Footer",
  "Breadcrumb",
]);

function sectionChoiceLabel(section: SectionSnapshot): string {
  const ready = READY_SECTIONS.find((item) => item.type === section.type);
  if (ready) return ready.label;
  if (section.type === "CustomSection") return "Custom Section";
  return section.type;
}

/** User asks how many / which sections — answer from live page order. */
function wantsListPageSections(text: string): boolean {
  const q = text.toLowerCase();
  const mentionsSections = /\bsections?\b/.test(q);
  const asksCountOrList =
    /\b(kitne|kitna|how many|count|list|sequence|order|kram|batao|btao|dikhao)\b/.test(
      q,
    ) ||
    /\b(kaun\s*se|konsi|kya\s*kya)\b/.test(q) ||
    /\b(home\s*)?page\s*(pe|par|mai|mein)\b/.test(q);
  return mentionsSections && asksCountOrList;
}

function listPageSectionsInOrder(
  sections: SectionSnapshot[],
): AiAssistResponse {
  // Home = sections without page slug. Inner pages (About/Contact/…) stay out.
  const homeSections = sections.filter((section) => !section.page);
  const scoped = homeSections.length ? homeSections : sections;

  if (!scoped.length) {
    return {
      reply: "Is page pe abhi koi section nahi mila.",
      actions: [],
      choices: [],
    };
  }

  const lines = scoped.map((section, index) => {
    const label = sectionChoiceLabel(section);
    const variant = section.variant ? ` — ${section.variant}` : "";
    return `${index + 1}. ${label}${variant}`;
  });

  return {
    reply: `Home page pe abhi ${scoped.length} sections hain — current sequence (upar se neeche):\n${lines.join("\n")}`,
    actions: [],
    choices: [],
  };
}

function buildPlacementChoices(sections: SectionSnapshot[]): AiChoice[] {
  const choices: AiChoice[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    if (PLACEMENT_SKIP_TYPES.has(section.type)) continue;
    const id = section.id || section.type;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    choices.push({
      id: `after:${id}`,
      label: `After ${sectionChoiceLabel(section)}`,
    });
  }
  choices.push({
    id: "after:end",
    label: "At the end (before Footer)",
  });
  return choices;
}

function askPlacement(
  label: string,
  sections: SectionSnapshot[],
): AiAssistResponse {
  const choices = buildPlacementChoices(sections);
  return {
    reply: `Where should I place the new ${label} section? Choose after which section.`,
    actions: [{ type: "ask", options: choices }],
    choices,
  };
}

function pendingAddFromHistory(
  history: ChatTurn[],
):
  | { kind: "ready"; sectionType: string; label: string }
  | { kind: "custom" }
  | { kind: "customAbout" }
  | { kind: "customFaq" }
  | null {
  const prev = lastAssistantText(history);
  const match = prev.match(
    /place the new (.+?) section\??\s*(?:choose after|$)/i,
  );
  if (!match?.[1]) return null;
  const name = match[1].trim().toLowerCase();
  if (name.includes("custom faq") || name === "faq custom") {
    return { kind: "customFaq" };
  }
  if (name.includes("custom about") || name === "about custom") {
    return { kind: "customAbout" };
  }
  if (name === "custom" || name.includes("custom")) {
    const userBlob = history
      .filter((turn) => turn.role === "user")
      .map((turn) => turn.content)
      .join(" ")
      .toLowerCase();
    if (/\babout\b/.test(userBlob)) {
      return { kind: "customAbout" };
    }
    return { kind: "custom" };
  }
  const ready = READY_SECTIONS.find(
    (item) =>
      item.label.toLowerCase() === name ||
      item.type.toLowerCase() === name ||
      name.includes(item.label.toLowerCase()),
  );
  if (ready) {
    return { kind: "ready", sectionType: ready.type, label: ready.label };
  }
  return null;
}

function resolvePlacementHint(
  message: string,
  pendingChoices: AiChoice[],
  sections: SectionSnapshot[],
): string | null {
  const q = message.trim().toLowerCase();
  const pendingIds = pendingChoices.map((item) => item.id);

  for (const choice of pendingChoices) {
    if (!choice.id.startsWith("after:")) continue;
    const hint = choice.id.slice("after:".length);
    if (
      q === choice.id.toLowerCase() ||
      q === choice.label.toLowerCase() ||
      q === `after ${hint}`.toLowerCase()
    ) {
      return hint;
    }
  }

  if (
    /^(end|last|footer|at the end|end pe|last me|akhir)/i.test(q) ||
    /\b(at the end|before footer|end pe|last me)\b/i.test(q)
  ) {
    return "end";
  }

  // Hindi order: "Banner ke baad ..." / "App Banner ke baad CTA Card"
  const hindiOrder = q.match(
    /(?:app\s+)?(banner|about|gallery|faq|services?|product|form|testimonial|testimonials|why\s*choose(?:\s*us)?|header|footer|topbar)\s+ke\s+baad\b/i,
  );
  if (hindiOrder?.[1]) {
    const name = hindiOrder[1].replace(/\s+/g, " ").trim().toLowerCase();
    if (/^(end|footer|last)/i.test(name)) return "end";
    const ready = READY_SECTIONS.find(
      (item) =>
        item.label.toLowerCase() === name ||
        item.type.toLowerCase() === name ||
        name.includes(item.type.toLowerCase()) ||
        item.label.toLowerCase().includes(name),
    );
    if (ready) return ready.type;
    if (name.startsWith("service") || name === "product") return "Product";
    if (name.startsWith("testimonial")) return "Testimonial";
    if (name.startsWith("why")) return "WhyChooseUs";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  const afterMatch = q.match(
    /(?:after|baad(?:\s+me)?|ke baad)\s+(?:the\s+)?(.+?)$/i,
  );
  if (afterMatch?.[1]) {
    const name = afterMatch[1].replace(/[?.!]+$/, "").trim();
    if (/^(end|footer|last)/i.test(name)) return "end";
    const ready = READY_SECTIONS.find(
      (item) =>
        item.label.toLowerCase() === name ||
        item.type.toLowerCase() === name ||
        name.includes(item.label.toLowerCase()),
    );
    if (ready) return ready.type;
    const byType = sections.find(
      (item) =>
        item.type.toLowerCase() === name ||
        (item.id || "").toLowerCase() === name ||
        sectionChoiceLabel(item).toLowerCase() === name,
    );
    if (byType) return byType.id || byType.type;
    return name;
  }

  // Bare section name while placement choices are showing
  if (pendingIds.some((id) => id.startsWith("after:"))) {
    const ready = READY_SECTIONS.find(
      (item) =>
        item.label.toLowerCase() === q ||
        item.type.toLowerCase() === q,
    );
    if (ready) return ready.type;
    if (q.includes("custom")) {
      const custom = sections.find((item) => item.type === "CustomSection");
      if (custom) return custom.id || custom.type;
    }
  }

  return null;
}

function buildCustomAdd(afterSectionHint?: string): AiAssistResponse {
  return {
    reply: "Adding a Custom Section with heading, text, and image.",
    actions: [
      {
        type: "addCustomSection",
        layoutId: "two-columns",
        afterSectionHint,
        sectionFields: {
          sectionName: "Custom",
          contentWidth: "container",
          columnGap: 3,
          sectionPadding: {
            desktop: { top: 56, right: 24, bottom: 56, left: 24 },
            tablet: { top: 44, right: 20, bottom: 44, left: 20 },
            mobile: { top: 36, right: 16, bottom: 36, left: 16 },
          },
        },
        elements: [
          {
            columnIndex: 0,
            type: "heading",
            value: "New section heading",
          },
          {
            columnIndex: 0,
            type: "text",
            value:
              "Add your story, offer, or key message here. Click any text to edit.",
          },
          {
            columnIndex: 1,
            type: "image",
            src: "/bg1.jpg",
          },
        ],
      },
    ],
    choices: [],
  };
}

/** Expert Custom About: category-aware look (layout + widgets), themed. */
function buildCustomAboutAdd(
  afterSectionHint?: string,
  themeVars?: Record<string, string> | null,
  categoryHint?: CategoryHint | null,
  lookIndex = 0,
): AiAssistResponse {
  const category = categoryHint || CATEGORY_HINTS.school;
  const theme = parseThemePalette(themeVars);
  const looks = buildThemeAboutLooks(theme, category);
  const look = looks[Math.abs(lookIndex) % looks.length] || looks[0];
  const fields = polishedAboutFields(null, look, category);
  return {
    reply: `Theme-based Custom About (${category.label}) — ${look.label}. Next unique look ke liye bolo "best design" ya "another option".`,
    actions: [
      {
        type: "addCustomSection",
        layoutId: look.layout,
        afterSectionHint: afterSectionHint || "Banner",
        sectionFields: fields,
        elements: [],
      },
    ],
    choices: [],
  };
}

type AboutLookPattern =
  | "split"
  | "stacked"
  | "feature-trio"
  | "image-band"
  | "cta-band"
  | "dual-image"
  | "stats-row"
  | "copy-over-image";

type AboutLookVariant = {
  id: string;
  label: string;
  pattern: AboutLookPattern;
  layout: (typeof CUSTOM_LAYOUTS)[number];
  bg: string;
  title: string;
  desc: string;
  titleColor: string;
  descColor: string;
  buttonLabel: string;
  buttonBg: string;
  buttonText: string;
  imageLeft: boolean;
  featureTitles?: [string, string, string];
  featureDescs?: [string, string, string];
  statValues?: [string, string, string];
  statLabels?: [string, string, string];
};

type ThemePalette = {
  primaryBg: string;
  primaryText: string;
  secondaryBg: string;
  secondaryText: string;
  accent: string;
};

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function parseThemePalette(
  vars?: Record<string, string> | null,
): ThemePalette {
  const source = vars && typeof vars === "object" ? vars : {};
  return {
    primaryBg: normalizeHexColor(
      source["--primary-bg"] || source.primaryBg,
      "#0f766e",
    ),
    primaryText: normalizeHexColor(
      source["--primary-text"] || source.primaryText,
      "#ffffff",
    ),
    secondaryBg: normalizeHexColor(
      source["--secondary-bg"] || source.secondaryBg,
      "#ffffff",
    ),
    secondaryText: normalizeHexColor(
      source["--secondary-text"] || source.secondaryText,
      "#0f172a",
    ),
    accent: normalizeHexColor(
      source["--blue-bg"] || source["--primary-bg"] || source.accent,
      "#0f766e",
    ),
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(hex, "");
  if (!normalized) return null;
  const n = Number.parseInt(normalized.slice(1), 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixHex(a: string, b: string, amountB: number): string {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  if (!left || !right) return normalizeHexColor(a, "#ffffff");
  const t = Math.min(1, Math.max(0, amountB));
  const r = Math.round(left.r * (1 - t) + right.r * t);
  const g = Math.round(left.g * (1 - t) + right.g * t);
  const bCh = Math.round(left.b * (1 - t) + right.b * t);
  return `#${[r, g, bCh].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Build About looks from the site's live theme colors (not hardcoded teal). */
function buildThemeAboutLooks(
  theme: ThemePalette,
  categoryHint?: CategoryHint | null,
): AboutLookVariant[] {
  const softPanel = mixHex(theme.primaryBg, "#ffffff", 0.9);
  const softTitle = mixHex(theme.primaryBg, "#0f172a", 0.55);
  const softDesc = mixHex(theme.secondaryText, "#64748b", 0.35);
  const category = categoryHint || CATEGORY_HINTS.school;
  const copy =
    category.id === "realestate"
      ? {
          a: {
            title: "Homes matched to how you live",
            desc: "From first shortlist to final paperwork, we guide buyers and sellers with clear pricing, verified listings, and local market insight.",
            button: "Explore Properties",
          },
          b: {
            title: "Property decisions made simple",
            desc: "Prime locations, transparent deals, and end-to-end support — so every visit moves you closer to the right home or investment.",
            button: "Talk to an Advisor",
          },
          c: {
            title: "Find space that feels like yours",
            desc: "Whether you want a family home, rental income, or a commercial space, our team keeps the process calm, clear, and on track.",
            button: "Book a Site Visit",
          },
          features: [
            ["Prime Locations", "Handpicked neighbourhoods with strong demand and daily convenience."],
            ["Verified Listings", "Photos, paperwork, and pricing checked before you visit."],
            ["End-to-End Help", "Negotiation, legal checks, and closing support in one place."],
          ] as [string, string][],
          stats: [
            ["500+", "Homes closed"],
            ["40+", "Cities covered"],
            ["98%", "Client satisfaction"],
          ] as [string, string][],
        }
      : category.id === "business"
        ? {
            a: {
              title: "A partner built for growing brands",
              desc: "We help teams move faster with clear strategy, dependable delivery, and communication that keeps stakeholders aligned.",
              button: "See How We Work",
            },
            b: {
              title: "Clarity that compounds",
              desc: "Practical plans, measurable outcomes, and a team that stays close from kickoff through launch — not just the pitch deck.",
              button: "Start a Project",
            },
            c: {
              title: "Where ambition meets execution",
              desc: "From first brief to shipped results, we keep scope honest, timelines visible, and quality non-negotiable.",
              button: "Book a Call",
            },
            features: [
              ["Strategy First", "Clear goals and priorities before any build starts."],
              ["Fast Delivery", "Tight loops, visible progress, and launch-ready quality."],
              ["Ongoing Care", "Support after go-live so momentum does not stall."],
            ] as [string, string][],
            stats: [
              ["120+", "Projects shipped"],
              ["15+", "Industries served"],
              ["4.9★", "Average rating"],
            ] as [string, string][],
          }
        : {
            a: {
              title: "A school built around every learner",
              desc: "We combine strong academics with care that feels personal — so students grow confident, curious, and ready for what comes next.",
              button: "Discover Our Story",
            },
            b: {
              title: "Learning that feels calm and clear",
              desc: "Small classes, visible progress, and teachers who know every student — not just their scores.",
              button: "Meet Our Campus",
            },
            c: {
              title: "Where curiosity becomes confidence",
              desc: "From first inquiry to first day, families get clarity — and students get a place they are excited to return to.",
              button: "Start a Conversation",
            },
            features: [
              ["Caring Teachers", "Mentors who notice every child, not only exam scores."],
              ["Balanced Growth", "Academics, sports, and values in one calm rhythm."],
              ["Open Campus", "Parents stay informed with clear updates and visits."],
            ] as [string, string][],
            stats: [
              ["25+", "Years of care"],
              ["40:1", "Student support"],
              ["100%", "Safety focus"],
            ] as [string, string][],
          };

  const feat = copy.features;
  const stats = copy.stats;

  return [
    {
      id: "split-image-left",
      label: "split: image left + story",
      pattern: "split",
      layout: "two-columns",
      bg: theme.secondaryBg,
      title: copy.a.title,
      desc: copy.a.desc,
      titleColor: theme.secondaryText,
      descColor: softDesc,
      buttonLabel: copy.a.button,
      buttonBg: theme.primaryBg,
      buttonText: theme.primaryText,
      imageLeft: true,
    },
    {
      id: "soft-panel-right",
      label: "soft panel: story left + image",
      pattern: "split",
      layout: "two-columns",
      bg: softPanel,
      title: copy.b.title,
      desc: copy.b.desc,
      titleColor: softTitle,
      descColor: softDesc,
      buttonLabel: copy.b.button,
      buttonBg: theme.primaryBg,
      buttonText: theme.primaryText,
      imageLeft: false,
    },
    {
      id: "bold-band-split",
      label: "bold band: primary split",
      pattern: "split",
      layout: "two-columns",
      bg: theme.primaryBg,
      title: copy.c.title,
      desc: copy.c.desc,
      titleColor: theme.primaryText,
      descColor: mixHex(theme.primaryText, theme.primaryBg, 0.25),
      buttonLabel: copy.c.button,
      buttonBg: theme.secondaryBg,
      buttonText: theme.primaryBg,
      imageLeft: true,
    },
    {
      id: "stacked-story",
      label: "stacked: centered story + image",
      pattern: "stacked",
      layout: "single",
      bg: theme.secondaryBg,
      title: copy.a.title,
      desc: copy.a.desc,
      titleColor: theme.secondaryText,
      descColor: softDesc,
      buttonLabel: copy.a.button,
      buttonBg: theme.primaryBg,
      buttonText: theme.primaryText,
      imageLeft: true,
    },
    {
      id: "feature-trio",
      label: "feature trio: 3 highlight cards",
      pattern: "feature-trio",
      layout: "three-columns",
      bg: softPanel,
      title: copy.b.title,
      desc: copy.b.desc,
      titleColor: softTitle,
      descColor: softDesc,
      buttonLabel: copy.b.button,
      buttonBg: theme.primaryBg,
      buttonText: theme.primaryText,
      imageLeft: true,
      featureTitles: [feat[0][0], feat[1][0], feat[2][0]],
      featureDescs: [feat[0][1], feat[1][1], feat[2][1]],
    },
    {
      id: "image-band",
      label: "image band: wide photo + split CTA",
      pattern: "image-band",
      layout: "top-wide-bottom-split",
      bg: theme.secondaryBg,
      title: copy.c.title,
      desc: copy.c.desc,
      titleColor: theme.secondaryText,
      descColor: softDesc,
      buttonLabel: copy.c.button,
      buttonBg: theme.primaryBg,
      buttonText: theme.primaryText,
      imageLeft: true,
    },
    {
      id: "cta-band",
      label: "CTA band: bold centered callout",
      pattern: "cta-band",
      layout: "single",
      bg: theme.primaryBg,
      title: copy.b.title,
      desc: copy.b.desc,
      titleColor: theme.primaryText,
      descColor: mixHex(theme.primaryText, theme.primaryBg, 0.28),
      buttonLabel: copy.b.button,
      buttonBg: theme.secondaryBg,
      buttonText: theme.primaryBg,
      imageLeft: true,
    },
    {
      id: "dual-image",
      label: "dual image: two photos + story",
      pattern: "dual-image",
      layout: "left-wide-right-stack",
      bg: softPanel,
      title: copy.a.title,
      desc: copy.a.desc,
      titleColor: softTitle,
      descColor: softDesc,
      buttonLabel: copy.a.button,
      buttonBg: theme.primaryBg,
      buttonText: theme.primaryText,
      imageLeft: true,
    },
    {
      id: "stats-row",
      label: "stats row: numbers + proof",
      pattern: "stats-row",
      layout: "three-columns",
      bg: theme.secondaryBg,
      title: copy.c.title,
      desc: copy.c.desc,
      titleColor: theme.secondaryText,
      descColor: softDesc,
      buttonLabel: copy.c.button,
      buttonBg: theme.primaryBg,
      buttonText: theme.primaryText,
      imageLeft: true,
      statValues: [stats[0][0], stats[1][0], stats[2][0]],
      statLabels: [stats[0][1], stats[1][1], stats[2][1]],
    },
  ];
}

function detectAboutLookIndex(
  looks: AboutLookVariant[],
  existing?: SectionSnapshot | null,
): number {
  const lookId = String(existing?.data?.designLookId || "").trim();
  if (lookId) {
    const byId = looks.findIndex((item) => item.id === lookId);
    if (byId >= 0) return byId;
  }
  const title = String(
    (() => {
      const columns = existing?.data?.columns;
      if (!Array.isArray(columns)) return "";
      for (const column of columns) {
        if (!column || typeof column !== "object") continue;
        const elements = (column as { elements?: unknown }).elements;
        if (!Array.isArray(elements)) continue;
        for (const el of elements) {
          if (
            el &&
            typeof el === "object" &&
            (el as { type?: string }).type === "heading" &&
            typeof (el as { value?: string }).value === "string"
          ) {
            return (el as { value: string }).value;
          }
        }
      }
      return "";
    })(),
  )
    .trim()
    .toLowerCase();
  if (title) {
    const byTitle = looks.findIndex(
      (item) => item.title.trim().toLowerCase() === title,
    );
    if (byTitle >= 0) return byTitle;
  }
  const layout = String(existing?.data?.layout || "").trim();
  if (layout) {
    const byLayout = looks.findIndex((item) => item.layout === layout);
    if (byLayout >= 0) return byLayout;
  }
  const bg = String(existing?.data?.sectionBackgroundColor || "")
    .trim()
    .toLowerCase();
  return looks.findIndex((item) => item.bg.toLowerCase() === bg);
}

function pickCategoryImage(
  pool: string[],
  index = 0,
  fallback = "/bg1.jpg",
): string {
  if (!pool.length) return fallback;
  return pool[Math.abs(index) % pool.length] || fallback;
}

function polishedAboutFields(
  existing: SectionSnapshot | null | undefined,
  look: AboutLookVariant,
  categoryHint?: CategoryHint | null,
): Record<string, unknown> {
  const variant = look;
  const pool =
    categoryHint?.stockImages?.length
      ? categoryHint.stockImages
      : STOCK_IMAGES;
  const columnsRaw = existing?.data?.columns;
  let imageSrc = pickCategoryImage(pool, 0);
  if (Array.isArray(columnsRaw)) {
    for (const column of columnsRaw) {
      if (!column || typeof column !== "object") continue;
      const elements = (column as { elements?: unknown }).elements;
      if (!Array.isArray(elements)) continue;
      for (const el of elements) {
        if (
          el &&
          typeof el === "object" &&
          (el as { type?: string }).type === "image" &&
          typeof (el as { src?: string }).src === "string"
        ) {
          imageSrc = (el as { src: string }).src;
          break;
        }
      }
    }
  }
  if (
    imageSrc === "/bg1.jpg" ||
    (/\/categories\/school\//i.test(imageSrc) &&
      categoryHint &&
      categoryHint.id !== "school")
  ) {
    imageSrc = pickCategoryImage(pool, 1, imageSrc);
  }
  const imageSrc2 = pickCategoryImage(pool, 2, imageSrc);

  const heading = (value: string, opts?: { align?: string; size?: number }) => ({
    id: `about-heading-${Math.random().toString(36).slice(2, 7)}`,
    type: "heading",
    value,
    headingLevel: 2,
    fontSize: opts?.size || 40,
    textColor: variant.titleColor,
    align: opts?.align || "left",
  });
  const textBlock = (value: string, opts?: { align?: string }) => ({
    id: `about-text-${Math.random().toString(36).slice(2, 7)}`,
    type: "text",
    align: opts?.align || "left",
    value: `<p style="margin:0;font-size:1.05rem;line-height:1.7;color:${variant.descColor};">${value}</p>`,
  });
  const button = (opts?: { align?: string }) => ({
    id: `about-btn-${Math.random().toString(36).slice(2, 7)}`,
    type: "button",
    align: opts?.align || "left",
    value: variant.buttonLabel,
    href: "#about",
    buttonVariant: "primary",
    buttonBackgroundColor: variant.buttonBg,
    buttonTextColor: variant.buttonText,
    buttonBorderRadius: 10,
  });
  const image = (src: string, height = 420) => ({
    id: `about-image-${Math.random().toString(36).slice(2, 7)}`,
    type: "image",
    src,
    imageStyle: "cover",
    imageHeight: height,
  });

  let columns: Array<Record<string, unknown>> = [];

  if (variant.pattern === "stacked" || variant.pattern === "cta-band") {
    columns = [
      {
        id: "about-col-stack",
        contentAlignH: "center",
        contentAlignV: "center",
        elementGap: 18,
        elements: [
          heading(variant.title, {
            align: "center",
            size: variant.pattern === "cta-band" ? 44 : 40,
          }),
          textBlock(variant.desc, { align: "center" }),
          button({ align: "center" }),
          ...(variant.pattern === "stacked" ? [image(imageSrc, 380)] : []),
        ],
      },
    ];
  } else if (variant.pattern === "feature-trio") {
    const titles = variant.featureTitles || [
      "Highlight one",
      "Highlight two",
      "Highlight three",
    ];
    const descs = variant.featureDescs || [
      variant.desc,
      variant.desc,
      variant.desc,
    ];
    columns = titles.map((title, index) => ({
      id: `about-feature-${index + 1}`,
      contentAlignV: "top",
      elementGap: 12,
      elements: [
        heading(title, { size: 26 }),
        textBlock(descs[index] || variant.desc),
      ],
    }));
  } else if (variant.pattern === "stats-row") {
    const values = variant.statValues || ["100+", "50+", "10+"];
    const labels = variant.statLabels || ["Clients", "Projects", "Cities"];
    columns = values.map((value, index) => ({
      id: `about-stat-${index + 1}`,
      contentAlignH: "center",
      contentAlignV: "center",
      elementGap: 8,
      elements: [
        heading(value, { align: "center", size: 48 }),
        textBlock(labels[index] || "", { align: "center" }),
      ],
    }));
  } else if (variant.pattern === "image-band") {
    columns = [
      {
        id: "about-band-image",
        elements: [image(imageSrc, 360)],
      },
      {
        id: "about-band-copy",
        contentAlignV: "center",
        elementGap: 14,
        elements: [heading(variant.title), textBlock(variant.desc)],
      },
      {
        id: "about-band-cta",
        contentAlignV: "center",
        elementGap: 12,
        elements: [button()],
      },
    ];
  } else if (variant.pattern === "dual-image") {
    columns = [
      {
        id: "about-dual-main",
        elements: [image(imageSrc, 480)],
      },
      {
        id: "about-dual-copy",
        contentAlignV: "center",
        elementGap: 14,
        elements: [heading(variant.title), textBlock(variant.desc), button()],
      },
      {
        id: "about-dual-side",
        elements: [image(imageSrc2, 220)],
      },
    ];
  } else {
    const mediaColumn = {
      id: "about-col-media",
      elements: [image(imageSrc)],
    };
    const copyColumn = {
      id: "about-col-copy",
      contentAlignV: "center",
      elementGap: 16,
      elements: [heading(variant.title), textBlock(variant.desc), button()],
    };
    columns = variant.imageLeft
      ? [mediaColumn, copyColumn]
      : [copyColumn, mediaColumn];
  }

  return {
    layout: variant.layout,
    designLookId: variant.id,
    sectionName: "About",
    sectionBackgroundColor: variant.bg,
    sectionBackgroundImage: "",
    contentWidth: "container",
    columnGap:
      variant.pattern === "feature-trio" || variant.pattern === "stats-row"
        ? 2.5
        : 3.5,
    sectionPadding: {
      desktop: { top: 72, right: 24, bottom: 72, left: 24 },
      tablet: { top: 56, right: 20, bottom: 56, left: 20 },
      mobile: { top: 44, right: 16, bottom: 44, left: 16 },
    },
    columns,
  };
}

function wantsBestDesign(text: string): boolean {
  const q = text.toLowerCase().trim();
  return (
    /\bbest\s*design\b/.test(q) ||
    /\b(our|do)\s+best\b/.test(q) ||
    /^(best|better)$/.test(q) ||
    /\b(plz|please)\s+(do\s+)?best\b/.test(q) ||
    /\b(expert|premium|pro)\s*(design|look|layout)?\b/.test(q) ||
    /\b(design|look|layout)\s*(best|better|achha|accha|sundar|premium)\b/.test(
      q,
    ) ||
    /\b(achha|accha|sundar)\s*(se\s*)?(banao|bnao|design|look)\b/.test(q) ||
    /\b(another|next|more|alag|dusra|naya)\s*(option|design|look|style|variant)?\b/.test(
      q,
    ) ||
    /^(another|next|alag|dusra)$/.test(q)
  );
}

/** Free-text custom design brief (not bare "add section"). */
function wantsTypedCustomDesign(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (wantsBestDesign(q)) return false;
  if (q.length < 12) return false;
  const asksDesign =
    /\b(design|layout|look|style|section)\b/.test(q) ||
    /\b(banao|bnao|bana|create|make|add)\b/.test(q);
  const hasShape =
    /\b(3|three|teen)\s*(column|col|card|feature)/.test(q) ||
    /\b(2|two|do)\s*(column|col|image)/.test(q) ||
    /\b(4|four)\s*(column|grid|card)/.test(q) ||
    /\b(feature|features|highlight|stats?|numbers?|cta\s*band|stack(?:ed)?|centered|dark\s*band|bold\s*band)\b/.test(
      q,
    ) ||
    /\b(image\s*left|image\s*right|full\s*width|wide\s*image|dual\s*image|two\s*image)\b/.test(
      q,
    ) ||
    /\b(design|layout|look)\s+(banao|bnao|bana|create|make|add)\b/.test(q) ||
    /\b(banao|bnao|create|make)\s+(design|layout|look)\b/.test(q);
  return asksDesign && hasShape;
}

function pickLookFromTypedBrief(
  message: string,
  looks: AboutLookVariant[],
): AboutLookVariant {
  const q = message.toLowerCase();
  const byId = (id: string) => looks.find((item) => item.id === id);
  if (/\b(3|three|teen)\s*(column|feature|card)/.test(q) || /\bfeatures?\b/.test(q)) {
    return byId("feature-trio") || looks[0];
  }
  if (/\bstats?|numbers?|proof\b/.test(q)) {
    return byId("stats-row") || looks[0];
  }
  if (/\b(cta|call\s*to\s*action|band|bold\s*center)/.test(q) && /\bdark|bold|primary\b/.test(q)) {
    return byId("cta-band") || looks[0];
  }
  if (/\b(cta|callout|band)\b/.test(q)) {
    return byId("cta-band") || looks[0];
  }
  if (/\b(wide\s*image|image\s*band|photo\s*top|banner\s*image)\b/.test(q)) {
    return byId("image-band") || looks[0];
  }
  if (/\b(two\s*image|dual\s*image|2\s*photo)/.test(q)) {
    return byId("dual-image") || looks[0];
  }
  if (/\b(stack|centered|single\s*column|full\s*width\s*story)\b/.test(q)) {
    return byId("stacked-story") || looks[0];
  }
  if (/\bimage\s*right\b/.test(q)) {
    return byId("soft-panel-right") || looks[0];
  }
  if (/\bimage\s*left\b/.test(q) || /\bsplit\b/.test(q)) {
    return byId("split-image-left") || looks[0];
  }
  if (/\bdark|bold\s*band|primary\b/.test(q)) {
    return byId("bold-band-split") || looks[0];
  }
  // Default: next non-split look for variety
  return byId("feature-trio") || looks[Math.min(3, looks.length - 1)] || looks[0];
}

function buildTypedCustomDesign(
  message: string,
  sections: SectionSnapshot[],
  themeVars?: Record<string, string> | null,
  categoryHint?: CategoryHint | null,
  focusSectionId?: string | null,
): AiAssistResponse {
  const category = categoryHint || CATEGORY_HINTS.school;
  const theme = parseThemePalette(themeVars);
  const looks = buildThemeAboutLooks(theme, category);
  const look = pickLookFromTypedBrief(message, looks);
  const fields = polishedAboutFields(null, look, category);

  const customs = sections.filter(
    (section) => section.type === "CustomSection" && !section.page,
  );
  const focus = typeof focusSectionId === "string" ? focusSectionId.trim() : "";
  const target =
    (focus
      ? customs.find(
          (section) =>
            section.id === focus ||
            (section.id || "").toLowerCase() === focus.toLowerCase(),
        )
      : null) ||
    (/\b(update|change|restyle|is|ye|this)\b/i.test(message)
      ? [...customs].reverse()[0]
      : null);

  if (target && !/\b(new|naya|add|banao|bnao|create|make)\b/i.test(message)) {
    return {
      reply: `Aapke brief se ${category.label} design lagaya — ${look.label}. Aur alag chahiye to bolo "another option" ya naya brief type karo.`,
      actions: [
        {
          type: "patch",
          sectionHint: target.id || "CustomSection",
          fields,
        },
      ],
      choices: [],
    };
  }

  const afterHint =
    resolvePlacementHint(message, [], sections) || "Banner";
  return {
    reply: `Custom section banaya — ${look.label} (${category.label}). Example briefs: "3 column features", "dark CTA band", "stats row", "wide image with CTA".`,
    actions: [
      {
        type: "addCustomSection",
        layoutId: look.layout,
        afterSectionHint: afterHint,
        sectionFields: fields,
        elements: [],
      },
    ],
    choices: [],
  };
}

function customSectionLooksLikeAbout(section: SectionSnapshot): boolean {
  const name = String(section.data?.sectionName || "").toLowerCase();
  if (name.includes("about")) return true;
  const columns = section.data?.columns;
  if (!Array.isArray(columns)) return false;
  let hasImage = false;
  let hasHeading = false;
  for (const column of columns) {
    if (!column || typeof column !== "object") continue;
    const elements = (column as { elements?: unknown }).elements;
    if (!Array.isArray(elements)) continue;
    for (const el of elements) {
      if (!el || typeof el !== "object") continue;
      const type = (el as { type?: string }).type;
      if (type === "image") hasImage = true;
      if (type === "heading") hasHeading = true;
    }
  }
  return hasImage || hasHeading;
}

function restyleLatestCustomExpert(
  sections: SectionSnapshot[],
  themeVars?: Record<string, string> | null,
  focusSectionId?: string | null,
  categoryHint?: CategoryHint | null,
): AiAssistResponse {
  const category = categoryHint || CATEGORY_HINTS.school;
  const theme = parseThemePalette(themeVars);
  const looks = buildThemeAboutLooks(theme, category);
  const customs = sections.filter(
    (section) => section.type === "CustomSection" && !section.page,
  );
  const focus = typeof focusSectionId === "string" ? focusSectionId.trim() : "";
  const target =
    (focus
      ? customs.find(
          (section) =>
            section.id === focus ||
            (section.id || "").toLowerCase() === focus.toLowerCase(),
        )
      : null) ||
    [...customs].reverse()[0] ||
    null;
  if (!target) {
    return buildCustomAboutAdd("Banner", themeVars, category);
  }

  const idx = detectAboutLookIndex(looks, target);
  const look = looks[(Math.max(0, idx) + 1) % looks.length];
  const fields = polishedAboutFields(target, look, category);
  return {
    reply: `Theme se ${category.label} design banaya — ${look.label} (${look.pattern}). Primary ${theme.primaryBg}. Phir "another option" bolo for a different layout, ya type karo: "3 column features" / "dark CTA band" / "stats row".`,
    actions: [
      {
        type: "patch",
        sectionHint: target.id || "CustomSection",
        fields,
      },
    ],
    choices: [],
  };
}

function buildCustomFaqAdd(
  afterSectionHint?: string,
  userMessage = "",
): AiAssistResponse {
  const english = isMostlyEnglish(userMessage);
  return {
    reply: english
      ? "Added a Custom FAQ accordion. Edit questions anytime from the FAQ widget."
      : "Custom FAQ accordion add ho gaya. Edit se questions update kar sakte ho.",
    actions: [
      {
        type: "addCustomSection",
        layoutId: "single",
        afterSectionHint: afterSectionHint || "end",
        sectionFields: {
          sectionName: "FAQ",
          contentWidth: "container",
          columnGap: 2,
          sectionPadding: {
            desktop: { top: 56, right: 24, bottom: 56, left: 24 },
            tablet: { top: 44, right: 20, bottom: 44, left: 20 },
            mobile: { top: 36, right: 16, bottom: 36, left: 16 },
          },
        },
        elements: [
          {
            columnIndex: 0,
            type: "heading",
            value: "Frequently Asked Questions",
          },
          {
            columnIndex: 0,
            type: "faq",
            faqItems: [
              {
                question: "What is included?",
                answer:
                  "Share a short answer about what customers get with this offer.",
              },
              {
                question: "How do I get started?",
                answer:
                  "Explain the first step so visitors know exactly what to do next.",
              },
              {
                question: "Can I contact support?",
                answer:
                  "Tell people how to reach you for help, booking, or more details.",
              },
            ],
          },
        ],
      },
    ],
    choices: [],
  };
}

type MasterKind =
  | "blog"
  | "service"
  | "gallery"
  | "team"
  | "portfolio"
  | "event"
  | "property"
  | "country";

const MASTER_SUBMENU_CHOICES: AiChoice[] = [
  { id: "master_submenu_yes", label: "Yes" },
  { id: "master_submenu_no", label: "No" },
];

const MASTER_SUBMENU_MODE_NAME_CATEGORY: AiChoice[] = [
  { id: "master_submenu_mode_category", label: "Category" },
  { id: "master_submenu_mode_name", label: "Name" },
];

const MASTER_SUBMENU_MODE_NAME_TYPE: AiChoice[] = [
  { id: "master_submenu_mode_type", label: "Type" },
  { id: "master_submenu_mode_name", label: "Name" },
];

const MASTER_SUBMENU_MERGE_CHOICES: AiChoice[] = [
  { id: "master_submenu_merge_new", label: "Add New Submenu" },
  { id: "master_submenu_merge_before", label: "Before Existing" },
  { id: "master_submenu_merge_after", label: "After" },
  { id: "master_submenu_merge_skip", label: "Not Add" },
];

function masterSupportsHeaderSubmenu(master: MasterKind): boolean {
  return (
    master === "blog" ||
    master === "service" ||
    master === "team" ||
    master === "portfolio" ||
    master === "event" ||
    master === "property"
  );
}

function masterSubmenuModeChoices(master: MasterKind): AiChoice[] {
  return master === "property"
    ? MASTER_SUBMENU_MODE_NAME_TYPE
    : MASTER_SUBMENU_MODE_NAME_CATEGORY;
}

function prevAskedMasterHeaderSubmenu(prev: string): boolean {
  const p = prev.toLowerCase();
  return (
    /\bsubmenu\b/.test(p) ||
    (/\bheader\b/.test(p) && /\bmenu\b/.test(p)) ||
    (/\bmenu\b/.test(p) && /\b(dropdown|yes\s*\/\s*no|yes\/no)\b/.test(p))
  );
}

function prevAskedMasterSubmenuMode(prev: string): boolean {
  const p = prev.toLowerCase();
  return (
    /\b(category\s*\/\s*name|type\s*\/\s*name|submenu.*(category|type|name))\b/.test(
      p,
    ) ||
    (/\bcategory\b/.test(p) && /\bname\b/.test(p)) ||
    (/\btype\b/.test(p) && /\bname\b/.test(p)) ||
    /\bsubmenu (type|category) se banu\b/.test(p) ||
    /\bsubmenu by (type|category) or by name\b/.test(p)
  );
}

function prevAskedMasterSubmenuMerge(prev: string): boolean {
  const p = prev.toLowerCase();
  return (
    /\b(add new submenu|before existing|not add|pehle se dropdown|already.*(dropdown|submenu))\b/.test(
      p,
    ) ||
    (/\bbefore\b/.test(p) && /\bafter\b/.test(p)) ||
    (/\bmix\b/.test(p) && /\breplace\b/.test(p) && /\bskip\b/.test(p))
  );
}

function resolveMasterSubmenuChoice(
  message: string,
  pendingChoices: AiChoice[],
): boolean | null {
  const q = message.trim().toLowerCase();
  const pendingIds = new Set(
    pendingChoices.map((choice) => choice.id.trim().toLowerCase()),
  );
  const hasPending =
    pendingIds.has("master_submenu_yes") ||
    pendingIds.has("master_submenu_no") ||
    pendingChoices.some((choice) =>
      /^(yes|no)$/i.test(choice.label.trim()),
    );

  if (q === "master_submenu_yes" || q === "yes" || q === "ha" || q === "haan" || q === "ji") {
    if (hasPending || pendingChoices.length === 0) return true;
  }
  if (q === "master_submenu_no" || q === "no" || q === "nahi" || q === "na") {
    if (hasPending || pendingChoices.length === 0) return false;
  }
  for (const choice of pendingChoices) {
    if (choice.label.trim().toLowerCase() === q) {
      if (choice.id === "master_submenu_yes") return true;
      if (choice.id === "master_submenu_no") return false;
    }
  }
  return null;
}

function resolveMasterSubmenuModeChoice(
  message: string,
  pendingChoices: AiChoice[],
  master: MasterKind,
): "name" | "category" | "type" | null {
  const q = message.trim().toLowerCase();
  const pendingIds = new Set(
    pendingChoices.map((choice) => choice.id.trim().toLowerCase()),
  );
  const modeChoices = masterSubmenuModeChoices(master);
  const hasPending = modeChoices.some((choice) =>
    pendingIds.has(choice.id.toLowerCase()),
  );

  const fromId = (id: string): "name" | "category" | "type" | null => {
    if (id === "master_submenu_mode_name") return "name";
    if (id === "master_submenu_mode_category") return "category";
    if (id === "master_submenu_mode_type") return "type";
    return null;
  };

  if (
    q === "master_submenu_mode_name" ||
    q === "name" ||
    q === "names" ||
    q === "item" ||
    q === "items"
  ) {
    if (hasPending || pendingChoices.length === 0) return "name";
  }
  if (
    master !== "property" &&
    (q === "master_submenu_mode_category" ||
      q === "category" ||
      q === "categories" ||
      q === "cat")
  ) {
    if (hasPending || pendingChoices.length === 0) return "category";
  }
  if (
    master === "property" &&
    (q === "master_submenu_mode_type" ||
      q === "type" ||
      q === "types" ||
      q === "property type")
  ) {
    if (hasPending || pendingChoices.length === 0) return "type";
  }

  for (const choice of pendingChoices) {
    if (choice.label.trim().toLowerCase() === q) {
      const resolved = fromId(choice.id.trim().toLowerCase());
      if (resolved) return resolved;
    }
  }
  return null;
}

function resolveMasterSubmenuMergeChoice(
  message: string,
  pendingChoices: AiChoice[],
): "new" | "before" | "after" | "skip" | null {
  const q = message.trim().toLowerCase();
  const pendingIds = new Set(
    pendingChoices.map((choice) => choice.id.trim().toLowerCase()),
  );
  const hasPending = MASTER_SUBMENU_MERGE_CHOICES.some((choice) =>
    pendingIds.has(choice.id.toLowerCase()),
  );

  if (
    q === "master_submenu_merge_new" ||
    q === "add new submenu" ||
    q === "new submenu" ||
    q === "new" ||
    q === "replace" ||
    q === "overwrite"
  ) {
    if (hasPending || pendingChoices.length === 0) return "new";
  }
  if (
    q === "master_submenu_merge_before" ||
    q === "before existing" ||
    q === "before" ||
    q === "pehle"
  ) {
    if (hasPending || pendingChoices.length === 0) return "before";
  }
  if (
    q === "master_submenu_merge_after" ||
    q === "after" ||
    q === "after existing" ||
    q === "mix" ||
    q === "baad" ||
    q === "master_submenu_merge_mix"
  ) {
    if (hasPending || pendingChoices.length === 0) return "after";
  }
  if (
    q === "master_submenu_merge_skip" ||
    q === "not add" ||
    q === "skip" ||
    q === "mat chhedo" ||
    q === "leave" ||
    q === "no menu"
  ) {
    if (hasPending || pendingChoices.length === 0) return "skip";
  }

  for (const choice of pendingChoices) {
    if (choice.label.trim().toLowerCase() === q) {
      const id = choice.id.trim().toLowerCase();
      if (id === "master_submenu_merge_new") return "new";
      if (id === "master_submenu_merge_before") return "before";
      if (id === "master_submenu_merge_after") return "after";
      if (id === "master_submenu_merge_skip") return "skip";
      if (id === "master_submenu_merge_mix") return "after";
      if (id === "master_submenu_merge_replace") return "new";
    }
  }
  return null;
}

const MASTER_CREATE_INTENT_PREFIX = "__master_create__:";
const MASTER_SUBMENU_MODE_PREFIX = "__master_submenu_mode__:";

function encodeMasterCreateIntentChoice(source: string): AiChoice {
  return {
    id: `${MASTER_CREATE_INTENT_PREFIX}${encodeURIComponent(source)}`,
    label: "",
  };
}

function encodeMasterSubmenuModeChoice(
  mode: "name" | "category" | "type",
): AiChoice {
  return {
    id: `${MASTER_SUBMENU_MODE_PREFIX}${mode}`,
    label: "",
  };
}

function getMasterCreateFromPending(
  pendingChoices: AiChoice[],
): string | null {
  for (const choice of pendingChoices) {
    const id = (choice.id || "").trim();
    if (!id.startsWith(MASTER_CREATE_INTENT_PREFIX)) continue;
    try {
      const decoded = decodeURIComponent(
        id.slice(MASTER_CREATE_INTENT_PREFIX.length),
      ).trim();
      if (decoded) return decoded;
    } catch {
      // ignore malformed intent
    }
  }
  return null;
}

function getMasterSubmenuModeFromPending(
  pendingChoices: AiChoice[],
): "name" | "category" | "type" | null {
  for (const choice of pendingChoices) {
    const id = (choice.id || "").trim().toLowerCase();
    if (!id.startsWith(MASTER_SUBMENU_MODE_PREFIX)) continue;
    const mode = id.slice(MASTER_SUBMENU_MODE_PREFIX.length);
    if (mode === "name" || mode === "category" || mode === "type") return mode;
  }
  return null;
}

function withMasterCreateIntent(
  choices: AiChoice[],
  source: string | null | undefined,
  mode?: "name" | "category" | "type" | null,
): AiChoice[] {
  let next = choices;
  const text = (source || "").trim();
  if (text) next = [...next, encodeMasterCreateIntentChoice(text)];
  if (mode === "name" || mode === "category" || mode === "type") {
    next = [...next, encodeMasterSubmenuModeChoice(mode)];
  }
  return next;
}

/** Exact submenu-flow answers only — never treat create phrases as answers. */
function isMasterSubmenuFlowAnswer(
  text: string,
  _master: MasterKind,
): boolean {
  const q = text.trim().toLowerCase();
  if (!q) return false;
  if (q.startsWith("master_submenu_")) return true;
  if (
    q === "yes" ||
    q === "no" ||
    q === "haan" ||
    q === "han" ||
    q === "ha" ||
    q === "na" ||
    q === "nahi" ||
    q === "ji"
  ) {
    return true;
  }
  if (
    q === "name" ||
    q === "category" ||
    q === "categories" ||
    q === "cat" ||
    q === "type" ||
    q === "types" ||
    q === "property type"
  ) {
    return true;
  }
  if (
    q === "new" ||
    q === "add new submenu" ||
    q === "new submenu" ||
    q === "before" ||
    q === "before existing" ||
    q === "after" ||
    q === "after existing" ||
    q === "skip" ||
    q === "not add" ||
    q === "mix" ||
    q === "replace" ||
    q === "overwrite" ||
    q === "pehle" ||
    q === "baad" ||
    q === "mat chhedo" ||
    q === "leave" ||
    q === "no menu"
  ) {
    return true;
  }
  return false;
}

function findPriorMasterCreateMessage(
  history: Array<{ role: string; content: string }>,
  master: MasterKind,
): string | null {
  let digitFallback: string | null = null;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index];
    if (turn.role !== "user") continue;
    const text = turn.content.replace(/^\[SECTION_FOCUS\|[^\]]+\]\s*/i, "").trim();
    if (!text) continue;
    if (isMasterSubmenuFlowAnswer(text, master)) continue;
    // Prefer clear create / add intents (most recent wins).
    if (
      wantsAddMasterItems(text) ||
      /\b\d{1,2}\s*(?:new|aur|more|naye|naya)\b/i.test(text) ||
      /\b(?:add|create|banao|bnao|kro|karo)\s+\d{1,2}\b/i.test(text) ||
      /\b\d{1,2}\s*(?:blogs?|services?|gallery|teams?|portfolio|events?|propert)/i.test(
        text,
      )
    ) {
      return text;
    }
    if (!digitFallback && /\b\d{1,2}\b/.test(text)) {
      digitFallback = text;
    }
  }
  return digitFallback;
}

function findPriorMasterSubmenuMode(
  history: Array<{ role: string; content: string }>,
  master: MasterKind,
): "name" | "category" | "type" | null {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index];
    if (turn.role !== "user") continue;
    const text = turn.content.replace(/^\[SECTION_FOCUS\|[^\]]+\]\s*/i, "").trim();
    if (!text) continue;
    const mode = resolveMasterSubmenuModeChoice(
      text,
      masterSubmenuModeChoices(master),
      master,
    );
    if (mode) return mode;
  }
  return null;
}

function masterParentHasDropdownChildren(
  sections: SectionSnapshot[],
  master: MasterKind,
): boolean {
  const parentHrefs =
    master === "blog"
      ? ["#page-blogs"]
      : master === "service"
        ? ["#page-service", "#page-services"]
        : master === "event"
          ? ["#page-events", "#page-event"]
          : master === "portfolio"
            ? ["#page-portfolio"]
            : master === "team"
              ? ["#page-teams", "#page-team"]
              : ["#page-properties", "#page-property"];
  const parentLabels =
    master === "blog"
      ? ["blogs", "blog"]
      : master === "service"
        ? ["services", "service"]
        : master === "event"
          ? ["events", "event"]
          : master === "portfolio"
            ? ["portfolio", "portfolios"]
            : master === "team"
              ? ["teams", "team"]
              : ["properties", "property"];
  const groupPrefix = `#master-group/${master}/`;
  const blogPrefix = master === "blog" ? "#page-blog-" : "";

  const isParentLink = (link: {
    label?: string;
    href?: string;
    kind?: string;
  }) => {
    const href = (link.href || "").trim().toLowerCase();
    const label = (link.label || "").trim().toLowerCase();
    if (master === "blog" && link.kind === "blogIndex") return true;
    if (parentHrefs.includes(href)) return true;
    if (parentLabels.includes(label)) return true;
    return false;
  };

  const childrenSignalExisting = (children: unknown[]): boolean => {
    if (!children.length) return false;
    for (const child of children) {
      if (!child || typeof child !== "object") continue;
      const href = String(
        (child as { href?: string }).href || "",
      )
        .trim()
        .toLowerCase();
      if (
        href.startsWith(groupPrefix) ||
        (master !== "blog" && href.startsWith(`#master-detail/${master}/`)) ||
        (blogPrefix && href.startsWith(blogPrefix))
      ) {
        return true;
      }
      const nested = (child as { children?: unknown[] }).children;
      if (Array.isArray(nested) && nested.length) return true;
    }
    // Any non-empty dropdown under the parent counts as existing.
    return true;
  };

  const readMenus = (data: Record<string, unknown> | undefined) => {
    if (!data || typeof data !== "object") return [] as unknown[][];
    const menus: unknown[][] = [];
    // Flat assist snapshot: { menu: [...] }
    if (Array.isArray(data.menu)) menus.push(data.menu);
    // Nested section shape: { "Header-1": { menu: [...] }, ... }
    for (const value of Object.values(data)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const menu = (value as { menu?: unknown }).menu;
      if (Array.isArray(menu)) menus.push(menu);
    }
    return menus;
  };

  for (const section of sections) {
    if (section.type !== "Header") continue;
    const menus = readMenus(section.data as Record<string, unknown> | undefined);
    for (const menu of menus) {
      for (const raw of menu) {
        if (!raw || typeof raw !== "object") continue;
        const link = raw as {
          label?: string;
          href?: string;
          kind?: string;
          children?: unknown[];
        };
        if (!isParentLink(link)) continue;
        if (
          Array.isArray(link.children) &&
          childrenSignalExisting(link.children)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

const MASTER_DEFAULT_TITLES: Record<MasterKind, string[]> = {
  blog: [
    "Getting Started",
    "Industry Insights",
    "How-To Guide",
    "Customer Stories",
    "Tips & Best Practices",
    "Product Updates",
    "Behind the Scenes",
    "Expert Advice",
    "Case Study Highlights",
    "Weekly Roundup",
  ],
  service: [
    "Consulting",
    "Design Services",
    "Development",
    "Support Plans",
    "Strategy Workshop",
    "Brand Identity",
    "Digital Marketing",
    "Maintenance",
    "Training",
    "Custom Solutions",
  ],
  gallery: [
    "Workspace Moments",
    "Project Highlights",
    "Team Day",
    "Client Events",
    "Studio Shots",
    "Launch Night",
    "Behind the Scenes",
    "Community Meetup",
    "Office Tour",
    "Creative Process",
  ],
  team: [
    "Alex Morgan",
    "Jordan Lee",
    "Sam Rivera",
    "Taylor Chen",
    "Casey Brooks",
    "Riley Quinn",
    "Avery Patel",
    "Morgan Blake",
    "Jamie Soto",
    "Cameron Diaz",
  ],
  portfolio: [
    "Brand Refresh",
    "E-commerce Launch",
    "Mobile App UI",
    "Marketing Site",
    "Product Dashboard",
    "Campaign Design",
    "Identity System",
    "Landing Page",
    "Case Study Film",
    "Retail Experience",
  ],
  event: [
    "Open House Day",
    "Annual Celebration",
    "Workshop Series",
    "Community Meetup",
    "Guest Speaker Night",
    "Career Fair",
    "Sports Day",
    "Parent Orientation",
    "Fundraiser Gala",
    "Holiday Festival",
  ],
  property: [
    "Sunrise Apartments",
    "Garden Villa Estate",
    "Downtown Residences",
    "Lakeview Homes",
    "Heritage Townhouse",
    "Skyline Towers",
    "Green Park Flats",
    "Coastal Retreat",
    "Business Hub Office",
    "Corner Plot Opportunity",
  ],
  country: [
    "Admissions Open in Mumbai",
    "Campus Tour in Delhi",
    "Day Boarding in Bangalore",
    "Nursery Admissions in Pune",
    "CBSE Curriculum in Hyderabad",
    "Parent Orientation in Chennai",
    "After School Care in Kolkata",
    "STEM Programs in Ahmedabad",
    "Sports Academy in Jaipur",
    "Scholarship Support in Chandigarh",
  ],
};

/** Cities used when AI creates country listings for a named market. */
const COUNTRY_LISTING_CITIES: Record<string, string[]> = {
  India: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Pune",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Ahmedabad",
    "Jaipur",
    "Chandigarh",
  ],
  UK: [
    "London",
    "Manchester",
    "Birmingham",
    "Edinburgh",
    "Bristol",
    "Leeds",
    "Glasgow",
    "Liverpool",
    "Cardiff",
    "Sheffield",
  ],
  USA: [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Seattle",
    "Austin",
    "Boston",
    "Miami",
    "Denver",
    "Atlanta",
  ],
  Canada: [
    "Toronto",
    "Vancouver",
    "Montreal",
    "Calgary",
    "Ottawa",
    "Edmonton",
    "Winnipeg",
    "Quebec City",
  ],
  Ireland: ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kilkenny"],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra"],
};

/** Listing topics by website category — school ≠ logo design. */
const COUNTRY_LISTING_TOPICS_BY_CATEGORY: Record<string, string[]> = {
  school: [
    "Admissions Open",
    "Campus Tour",
    "Day Boarding",
    "Nursery Admissions",
    "CBSE Curriculum",
    "Parent Orientation",
    "After School Care",
    "STEM Programs",
    "Sports Academy",
    "Scholarship Support",
  ],
  business: [
    "Business Consulting",
    "Corporate Training",
    "Market Expansion",
    "Local Partnerships",
    "Client Success",
    "Franchise Support",
    "Sales Enablement",
    "Office Solutions",
    "Growth Strategy",
    "Account Management",
  ],
  realestate: [
    "Property Consultation",
    "Home Buying Guide",
    "Rental Support",
    "Investment Advisory",
    "Site Visits",
    "Luxury Listings",
    "Commercial Spaces",
    "Resale Homes",
    "New Projects",
    "NRI Property Desk",
  ],
};

const COUNTRY_NAME_ALIASES: Array<{ pattern: RegExp; name: string }> = [
  {
    pattern: /\bunited\s+kingdom\b|\bu\.?\s*k\.?\b|\bbritain\b|\bengland\b/i,
    name: "UK",
  },
  {
    pattern: /\bunited\s+states\b|\bu\.?\s*s\.?\s*a\.?\b|\bamerica\b|\busa\b/i,
    name: "USA",
  },
  { pattern: /\bindia\b|\bbharat\b/i, name: "India" },
  { pattern: /\bcanada\b/i, name: "Canada" },
  { pattern: /\bireland\b/i, name: "Ireland" },
  { pattern: /\buae\b|\bdubai\b|\bemirates\b/i, name: "UAE" },
  {
    pattern: /\baustralia\b|\baustrealia\b|\baustralai\b|\boz\b/i,
    name: "Australia",
  },
];

function canonicalizeCountryListingName(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  for (const entry of COUNTRY_NAME_ALIASES) {
    if (entry.pattern.test(value)) return entry.name;
  }
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

/** "Austrealia to Australia kar do" / "Austrealia ko Australia" */
function extractCountryRename(text: string): { from: string; to: string } | null {
  const pair = extractNameRenamePair(text);
  if (!pair) return null;
  const to = canonicalizeCountryListingName(pair.to) || pair.to;
  if (pair.from.toLowerCase() === to.toLowerCase()) return null;
  return { from: pair.from, to };
}

/** Shared rename pair parser (country / master item titles). */
function extractNameRenamePair(text: string): { from: string; to: string } | null {
  const cleaned = text
    .replace(/\b(please|pls|country|countries|listing|listings|name|blog|blogs|service|services|event|events|team|portfolio|property|properties|gallery|item|items|post|posts)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  if (
    /\b(add|create|banao|bnao|naya|new)\b/i.test(cleaned) &&
    /\b\d+\b/.test(cleaned)
  ) {
    return null;
  }
  if (/\b(seo|meta|publish|deploy)\b/i.test(cleaned)) return null;

  const patterns = [
    /^(.+?)\s+to\s+(.+?)(?:\s+(?:kar\s*do|kro|karo|badlo|change|rename|fix|update))?$/i,
    /^(.+?)\s+ko\s+(.+?)(?:\s+(?:kar\s*do|kro|karo|badlo|banao|change|rename|fix))?$/i,
    /(?:rename|change|fix|badlo|update)\s+(.+?)\s+(?:to|→|->|as)\s+(.+?)$/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match?.[1] || !match?.[2]) continue;
    const from = match[1].replace(/[?.!,]+$/g, "").trim();
    const toRaw = match[2].replace(/[?.!,]+$/g, "").trim();
    if (!from || !toRaw) continue;
    if (from.length > 80 || toRaw.length > 80) continue;
    const to = toRaw.replace(/\b\w/g, (char) => char.toUpperCase());
    if (from.toLowerCase() === to.toLowerCase()) continue;
    return { from, to };
  }
  return null;
}

function wantsSetSiteSeo(text: string): boolean {
  const q = text.toLowerCase();
  if (/\b(publish|deploy|live\s*kar)\b/.test(q)) return false;
  if (/\b(add|create|banao)\s+\d+\b/.test(q)) return false;
  return (
    /\b(seo|meta\s*title|meta\s*description|meta\s*keywords|og\s*title)\b/.test(
      q,
    ) ||
    /\b(site|website|page|home)\s+(ka|ki|ke)?\s*(seo|meta)\b/.test(q) ||
    /\b(seo|meta)\s*(set|update|likho|badlo|kro|karo|fix|change|cgange)\b/.test(
      q,
    ) ||
    /\b(change|cgange|chage|update|set)\b.+\b(seo|meta)\b/.test(q)
  );
}

function extractExplicitSeoField(
  text: string,
  field: "title" | "description" | "keywords",
): string | null {
  const patterns =
    field === "title"
      ? [
          /(?:meta\s*)?title\s*[:=]\s*["']?(.+?)["']?(?:\s*$|[.!]|\s+(?:desc|description|keywords))/i,
          /(?:seo\s*)?title\s*[:=]\s*["']?(.+?)["']?(?:\s*$|[.!])/i,
        ]
      : field === "description"
        ? [
            /(?:meta\s*)?description\s*[:=]\s*["']?(.+?)["']?(?:\s*$|[.!]|\s+keywords)/i,
            /(?:seo\s*)?desc(?:ription)?\s*[:=]\s*["']?(.+?)["']?(?:\s*$|[.!])/i,
          ]
        : [
            /(?:meta\s*)?keywords?\s*[:=]\s*["']?(.+?)["']?(?:\s*$|[.!])/i,
          ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return null;
}

function wantsAllPagesSeo(text: string): boolean {
  const q = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!/\b(seo|meta)\b/.test(q)) return false;
  return (
    /\b(all|every|entire|sab|saari|saara|sari|pure|poori|puri)\s+(pages?|page)\b/.test(
      q,
    ) ||
    /\b(pages?|page)\s+(ka|ki|ke)?\s*(sab|all|saara)\s*(seo|meta)\b/.test(q) ||
    /\b(all|sab)\s+(seo|meta)\b/.test(q)
  );
}

function extractSeoPageLabel(text: string): string | null {
  const q = text.toLowerCase().replace(/\s+/g, " ").trim();

  // "all pages SEO" / "change all page SEO" → site-wide, not a page named "all"
  if (wantsAllPagesSeo(text)) return null;

  // Home / site SEO — never invent a page from "change home page seo" / typos.
  if (
    /\b(home\s*page|homepage)\b/.test(q) &&
    /\b(seo|meta)\b/.test(q)
  ) {
    return null;
  }
  if (
    /\b(site|website)\s+(ka|ki|ke)?\s*(seo|meta)\b/.test(q) ||
    /\b(seo|meta)\s+(for\s+)?(the\s+)?(home|site|website)\b/.test(q)
  ) {
    return null;
  }
  if (
    /\b(change|cgange|chage|chnage|update|set|edit|fix|badlo|kro|karo)\b/.test(
      q,
    ) &&
    /\b(seo|meta)\b/.test(q) &&
    !/\b([a-z][a-z0-9\s-]{1,30})\s+page\s+(?:ka|ki|ke)?\s*(?:seo|meta)\b/i.test(
      q.replace(
        /\b(change|cgange|chage|chnage|update|set|edit|fix|badlo|kro|karo|please|pls|plz|the|a|an|home|page|seo|meta|title|description|keywords|all|every|sab)\b/gi,
        " ",
      ),
    )
  ) {
    // "change seo" / "update meta" with no other page name → site SEO
    const stripped = q
      .replace(
        /\b(change|cgange|chage|chnage|update|set|edit|fix|badlo|kro|karo|please|pls|plz|the|a|an|home|page|seo|meta|title|description|keywords|of|for|to|ka|ki|ke|all|every|sab|saara|saari)\b/gi,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim();
    if (!stripped) return null;
  }

  const match = text.match(
    /\b([A-Za-z][A-Za-z0-9\s-]{1,40}?)\s+page\s+(?:ka|ki|ke)?\s*(?:seo|meta)/i,
  );
  let label = (match?.[1] || "").replace(/\s+/g, " ").trim();
  label = label
    .replace(
      /^(please|pls|plz|change|cgange|chage|chnage|update|set|edit|fix|badlo|kro|karo)\s+/i,
      "",
    )
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
  if (!label) return null;
  if (
    /^(site|website|home|global|page|all|every|entire|sab|saara|saari|sari)$/i.test(
      label,
    )
  ) {
    return null;
  }
  // Leftover "change home" / "cgange home" / "all pages" after partial strip
  if (
    /^(change|cgange|chage|chnage|update|set)\s+home$/i.test(label) ||
    /^home$/i.test(label) ||
    /^(all|every|sab)\s+pages?$/i.test(label)
  ) {
    return null;
  }
  return label.slice(0, 48);
}

function buildSetSiteSeo(
  message: string,
  category?: { label?: string } | null,
): AiAssistResponse {
  const categoryLabel = (category?.label || "Website").trim() || "Website";
  const allPages = wantsAllPagesSeo(message);
  const pageLabel = allPages ? null : extractSeoPageLabel(message);
  const explicitTitle = extractExplicitSeoField(message, "title");
  const explicitDesc = extractExplicitSeoField(message, "description");
  const explicitKeywords = extractExplicitSeoField(message, "keywords");

  const metaTitle = (
    explicitTitle ||
    (pageLabel
      ? `${pageLabel} | ${categoryLabel}`
      : `${categoryLabel} | Official Website`)
  ).slice(0, 70);
  const metaDescription = (
    explicitDesc ||
    (pageLabel
      ? `${pageLabel} page for ${categoryLabel}. Learn more and get in touch.`
      : `Welcome to our ${categoryLabel} website. Explore programs, campus life, and how to get started.`)
  ).slice(0, 160);
  const metaKeywords = (
    explicitKeywords ||
    [categoryLabel, pageLabel, "website", "admissions"]
      .filter(Boolean)
      .join(", ")
  ).slice(0, 200);

  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? allPages
        ? `Updating SEO meta for all pages (title + description).`
        : pageLabel
          ? `Updating SEO for "${pageLabel}" page (title + description).`
          : `Setting site SEO meta title and description.`
      : allPages
        ? `Saari pages ka SEO meta update kar raha hoon.`
        : pageLabel
          ? `"${pageLabel}" page ka SEO set kar raha hoon.`
          : `Site ka SEO meta title aur description set kar raha hoon.`,
    actions: [
      {
        type: "setSiteSeo",
        metaTitle,
        metaDescription,
        metaKeywords,
        ...(allPages ? { allPages: true } : {}),
        ...(pageLabel ? { pageLabel } : {}),
      },
    ],
    choices: [],
  };
}

function wantsPublishSite(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (/\b(seo|meta|rename|blog|listing)\b/.test(q) && !/\bpublish\b/.test(q)) {
    return false;
  }
  return (
    /\b(publish|deploy)\b/.test(q) ||
    /\b(site|website)\s+(publish|live)\b/.test(q) ||
    /\b(live\s*kar\s*do|live\s*kro|website\s*live)\b/.test(q) ||
    /\b(publish\s*(kar\s*do|kro|karo|site|website))\b/.test(q)
  );
}

function buildPublishSiteAsk(message: string): AiAssistResponse {
  const hindi =
    /[^\u0000-\u007f]/.test(message) ||
    /\b(kro|karo|kar\s*do|live)\b/i.test(message);
  return {
    reply: hindi
      ? `Sure? Website ab publish / live karun?\n\nYes / No`
      : `Are you sure you want to publish this website now?\n\nYes / No`,
    actions: [
      {
        type: "ask",
        options: [
          { id: "publish-site-yes", label: "Yes" },
          { id: "publish-site-no", label: "No" },
        ],
      },
    ],
    choices: [
      { id: "publish-site-yes", label: "Yes" },
      { id: "publish-site-no", label: "No" },
    ],
  };
}

function resolvePublishSiteConfirm(
  message: string,
  pendingChoices: AiChoice[],
): "yes" | "no" | null {
  const hasPending = pendingChoices.some(
    (item) =>
      item.id === "publish-site-yes" || item.id === "publish-site-no",
  );
  if (!hasPending) return null;

  const q = message.trim().toLowerCase();
  if (
    q === "publish-site-yes" ||
    q === "yes" ||
    q === "ha" ||
    q === "haan" ||
    q === "han" ||
    q === "ji" ||
    q === "ok" ||
    q === "okay" ||
    q === "kro" ||
    q === "karo" ||
    q === "sure"
  ) {
    return "yes";
  }
  if (
    q === "publish-site-no" ||
    q === "no" ||
    q === "nahi" ||
    q === "nahin" ||
    q === "na" ||
    q === "cancel" ||
    q === "mat"
  ) {
    return "no";
  }
  return null;
}

function buildPublishSiteExecute(message: string): AiAssistResponse {
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? "Publishing your website now…"
      : "Website publish kar raha hoon…",
    actions: [{ type: "publishSite" }],
    choices: [],
  };
}

const THEME_COLOR_PRESETS: Array<{
  name: string;
  keys: string[];
  values: Record<string, string>;
}> = [
  {
    name: "Ocean",
    keys: ["ocean", "cyan", "aqua"],
    values: {
      "--primary-bg": "#00cadd",
      "--secondary-bg": "#ffffff",
      "--header-bg": "#245c6e",
      "--hero-bg": "#0b1220",
      "--primary-text": "#ffffff",
      "--secondary-text": "#0f172a",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#0f172a",
      "--secondary-link-bg": "#00cadd",
      "--blue-bg": "#0668ff",
    },
  },
  {
    name: "Forest",
    keys: ["forest", "green", "emerald"],
    values: {
      "--primary-bg": "#059669",
      "--secondary-bg": "#f0fdf4",
      "--header-bg": "#064e3b",
      "--hero-bg": "#052e16",
      "--primary-text": "#ffffff",
      "--secondary-text": "#064e3b",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#064e3b",
      "--secondary-link-bg": "#059669",
      "--blue-bg": "#10b981",
    },
  },
  {
    name: "Blue",
    keys: ["blue", "indigo"],
    values: {
      "--primary-bg": "#2563eb",
      "--secondary-bg": "#eff6ff",
      "--header-bg": "#1e3a8a",
      "--hero-bg": "#0f172a",
      "--primary-text": "#ffffff",
      "--secondary-text": "#0f172a",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#0f172a",
      "--secondary-link-bg": "#2563eb",
      "--blue-bg": "#3b82f6",
    },
  },
  {
    name: "Crimson",
    keys: ["crimson", "red", "rose"],
    values: {
      "--primary-bg": "#dc2626",
      "--secondary-bg": "#fff7f7",
      "--header-bg": "#7f1d1d",
      "--hero-bg": "#111827",
      "--primary-text": "#ffffff",
      "--secondary-text": "#111827",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#7f1d1d",
      "--secondary-link-bg": "#dc2626",
      "--blue-bg": "#ef4444",
    },
  },
  {
    name: "Orange",
    keys: ["orange", "amber"],
    values: {
      "--primary-bg": "#ea580c",
      "--secondary-bg": "#fff7ed",
      "--header-bg": "#9a3412",
      "--hero-bg": "#1c1917",
      "--primary-text": "#ffffff",
      "--secondary-text": "#9a3412",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#9a3412",
      "--secondary-link-bg": "#ea580c",
      "--blue-bg": "#f97316",
    },
  },
  {
    name: "Purple",
    keys: ["purple", "violet"],
    values: {
      "--primary-bg": "#7c3aed",
      "--secondary-bg": "#f5f3ff",
      "--header-bg": "#4c1d95",
      "--hero-bg": "#1e1b4b",
      "--primary-text": "#ffffff",
      "--secondary-text": "#4c1d95",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#4c1d95",
      "--secondary-link-bg": "#7c3aed",
      "--blue-bg": "#8b5cf6",
    },
  },
  {
    name: "Teal",
    keys: ["teal"],
    values: {
      "--primary-bg": "#0f766e",
      "--secondary-bg": "#f0fdfa",
      "--header-bg": "#134e4a",
      "--hero-bg": "#042f2e",
      "--primary-text": "#ffffff",
      "--secondary-text": "#134e4a",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#134e4a",
      "--secondary-link-bg": "#0f766e",
      "--blue-bg": "#14b8a6",
    },
  },
];

const NAMED_THEME_HEX: Array<{ keys: string[]; hex: string }> = [
  { keys: ["navy", "dark blue"], hex: "#1e3a8a" },
  { keys: ["sky", "light blue"], hex: "#0ea5e9" },
  { keys: ["pink"], hex: "#db2777" },
  { keys: ["black", "dark"], hex: "#0f172a" },
  { keys: ["maroon"], hex: "#9f1239" },
  { keys: ["gold", "yellow"], hex: "#ca8a04" },
];

function darkenHex(hex: string, amount = 0.4): string {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return hex;
  const channel = (start: number) => {
    const value = parseInt(raw.slice(start, start + 2), 16);
    const next = Math.max(0, Math.round(value * (1 - amount)));
    return next.toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

function themeValuesFromPrimary(hex: string): Record<string, string> {
  const primary = hex.startsWith("#") ? hex : `#${hex}`;
  const header = darkenHex(primary, 0.45);
  return {
    "--primary-bg": primary,
    "--secondary-bg": "#ffffff",
    "--header-bg": header,
    "--hero-bg": darkenHex(primary, 0.7),
    "--primary-text": "#ffffff",
    "--secondary-text": "#0f172a",
    "--header-text": "#ffffff",
    "--hero-title": "#ffffff",
    "--primary-link-bg": "#ffffff",
    "--primary-link-color": header,
    "--secondary-link-bg": primary,
    "--blue-bg": primary,
  };
}

function extractThemeHex(text: string): string | null {
  const hex = text.match(/#([0-9a-fA-F]{6})\b/);
  if (hex?.[1]) return `#${hex[1]}`;
  const q = text.toLowerCase();
  for (const entry of NAMED_THEME_HEX) {
    if (entry.keys.some((key) => q.includes(key))) return entry.hex;
  }
  return null;
}

function resolveThemePreset(text: string): {
  name: string;
  values: Record<string, string>;
} | null {
  const q = text.toLowerCase();
  for (const preset of THEME_COLOR_PRESETS) {
    if (
      preset.keys.some(
        (key) =>
          new RegExp(`\\b${key.replace(/\s+/g, "\\s+")}\\b`, "i").test(q),
      )
    ) {
      return { name: preset.name, values: preset.values };
    }
  }
  return null;
}

function wantsSetThemeColor(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  if (wantsDeleteSection(text) || wantsMoveSection(text)) return false;
  if (
    /^theme-(blue|green|teal|orange|red|purple|forest|ocean|crimson|violet)$/i.test(
      q,
    )
  ) {
    return true;
  }
  if (
    /\b(theme|primary\s*color|brand\s*color|accent\s*color|website\s*color|site\s*color)\b/.test(
      q,
    )
  ) {
    return true;
  }
  if (
    /\b(color|colour)\s*(change|badlo|set|kro|karo|update|banao)\b/.test(q)
  ) {
    return true;
  }
  if (
    /\b(blue|green|red|orange|purple|teal|forest|ocean|crimson|violet)\s+(theme|color|colour)\b/.test(
      q,
    ) ||
    /\b(theme|color|colour)\s+(blue|green|red|orange|purple|teal|forest|ocean|crimson|violet)\b/.test(
      q,
    )
  ) {
    return true;
  }
  if (
    /#([0-9a-fA-F]{6})\b/.test(text) &&
    /\b(theme|color|colour|primary|set|kro|karo)\b/.test(q)
  ) {
    return true;
  }
  return false;
}

function buildSetThemeColor(message: string): AiAssistResponse {
  const trimmed = message.trim();
  const choiceKey = trimmed.toLowerCase().startsWith("theme-")
    ? trimmed.replace(/^theme-/i, "")
    : trimmed;
  const preset = resolveThemePreset(choiceKey) || resolveThemePreset(message);
  const hex = extractThemeHex(message);
  const values = preset?.values || (hex ? themeValuesFromPrimary(hex) : null);
  const label = preset?.name || hex || "Custom";
  if (!values) {
    return {
      reply:
        "Kaunsa color chahiye? Example: primary color blue kro — ya theme green banao — ya #2563eb set kro.",
      actions: [],
      choices: [
        { id: "theme-blue", label: "Blue" },
        { id: "theme-green", label: "Green" },
        { id: "theme-teal", label: "Teal" },
        { id: "theme-orange", label: "Orange" },
      ],
    };
  }
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Updating website theme to ${label}…`
      : `Website theme ${label} pe set kar raha hoon…`,
    actions: [
      {
        type: "setThemeColors",
        values,
        label,
      },
    ],
    choices: [],
  };
}

function wantsPatchTopbarContact(text: string): boolean {
  const q = text.toLowerCase();
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  const mentionsContact =
    /\b(phone|mobile|number|email|mail|location|address|topbar|contact\s*info)\b/.test(
      q,
    );
  const wantsSet =
    /\b(set|change|update|badlo|kro|karo|dal|daalo|likho|update)\b/.test(q) ||
    /\+?\d[\d\s-]{8,}/.test(text) ||
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  return mentionsContact && wantsSet;
}

function extractTopbarPhone(text: string): string | null {
  const labeled = text.match(
    /(?:phone|mobile|number|call)\s*[:=]?\s*(\+?\d[\d\s-]{8,}\d)/i,
  );
  if (labeled?.[1]) return labeled[1].replace(/\s+/g, " ").trim();
  const bare = text.match(/(\+?\d[\d\s-]{8,}\d)/);
  return bare?.[1]?.replace(/\s+/g, " ").trim() || null;
}

function extractTopbarEmail(text: string): string | null {
  const labeled = text.match(
    /(?:email|mail|e-mail)\s*[:=]?\s*([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i,
  );
  if (labeled?.[1]) return labeled[1].trim();
  const bare = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  return bare?.[1]?.trim() || null;
}

function extractTopbarLocation(text: string): string | null {
  const labeled = text.match(
    /(?:location|address|city)\s*[:=]\s*["']?([^"'?\n,]{2,60})["']?/i,
  );
  if (labeled?.[1]) return labeled[1].trim();
  const hindi = text.match(
    /(?:location|address|city)\s+(?:badlo|set|kro|karo|daalo)?\s*[:=]?\s*([A-Za-z][A-Za-z\s,]{1,50})/i,
  );
  const value = hindi?.[1]?.trim();
  if (!value) return null;
  if (/^(phone|email|mail|number|set|change)$/i.test(value)) return null;
  return value.slice(0, 60);
}

function buildPatchTopbarContact(message: string): AiAssistResponse {
  const phone = extractTopbarPhone(message);
  const email = extractTopbarEmail(message);
  const location = extractTopbarLocation(message);
  if (!phone && !email && !location) {
    return {
      reply:
        "Phone / email / location likho. Example: phone +91 98765 43210 set kro — ya email hello@school.com kro.",
      actions: [],
      choices: [],
    };
  }
  const fields: Record<string, unknown> = {};
  if (phone) fields.phone = phone;
  if (email) fields.email = email;
  if (location) fields.location = location;
  const bits = [
    phone ? `phone ${phone}` : "",
    email ? `email ${email}` : "",
    location ? `location ${location}` : "",
  ].filter(Boolean);
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Updating topbar contact (${bits.join(", ")})…`
      : `Topbar contact update: ${bits.join(", ")}`,
    actions: [
      {
        type: "patch",
        sectionHint: "Topbar",
        fields,
      },
    ],
    choices: [],
  };
}

function wantsPatchHeaderBrand(text: string): boolean {
  const q = text.toLowerCase();
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  if (wantsPatchTopbarContact(text)) return false;
  return (
    (/\b(logo|brand|company\s*name|site\s*name|website\s*name|header\s*name)\b/.test(
      q,
    ) &&
      /\b(set|change|update|badlo|kro|karo|likho|banao|name)\b/.test(q)) ||
    /\bheader\s*(mein|mai|me)\s+.+\s*(name|logo)\b/.test(q) ||
    /\b(company|site|brand)\s*name\b/.test(q)
  );
}

function extractHeaderBrandName(text: string): string | null {
  const patterns = [
    /(?:logo|brand|company\s*name|site\s*name|website\s*name|header\s*name)\s*[:=]\s*["']?([^"'?\n]{2,48})["']?/i,
    /(?:logo|brand|company\s*name|site\s*name)\s+(?:badlo|set|kro|karo|likho|banao)\s+["']?([^"'?\n]{2,48})["']?/i,
    /header\s*(?:mein|mai|me)\s+(?:company\s*)?name\s+["']?([^"'?\n]{2,48})["']?/i,
    /(?:company|site|brand)\s*name\s+(?:ko\s+)?["']?([^"'?\n]{2,48})["']?\s*(?:kro|karo|badlo|set)?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    let value = match?.[1]?.trim() || "";
    value = value
      .replace(/\b(kro|karo|kar\s*do|set|please|pls)\b/gi, "")
      .trim();
    if (value.length >= 2) return value.slice(0, 48);
  }
  return null;
}

function buildPatchHeaderBrand(message: string): AiAssistResponse {
  const logo = extractHeaderBrandName(message);
  if (!logo) {
    return {
      reply:
        "Header/brand name likho. Example: company name CSS Founder kro — ya logo text School Name set kro.",
      actions: [],
      choices: [],
    };
  }
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Updating header brand name to "${logo}"…`
      : `Header brand name "${logo}" set kar raha hoon…`,
    actions: [
      {
        type: "patch",
        sectionHint: "Header",
        fields: { logo },
      },
    ],
    choices: [],
  };
}

const MASTER_DELETE_KIND_RE =
  /(blogs?|posts?|articles?|services?|gallery(?:\s*items?)?|team(?:\s*members?)?|members?|portfolio(?:\s*(?:items?|projects?))?|events?|propert(?:y|ies)|listings?)/i;

function detectMasterKindForDelete(text: string): MasterKind | null {
  const q = text.toLowerCase();
  if (/\b(blogs?|posts?|articles?)\b/.test(q)) return "blog";
  if (/\bservices?\b/.test(q)) return "service";
  if (/\bgallery\b/.test(q)) return "gallery";
  if (/\b(team(?:\s*members?)?|members?)\b/.test(q) && !/\bteam\s*section\b/.test(q))
    return "team";
  if (/\bportfolio\b/.test(q)) return "portfolio";
  if (/\bevents?\b/.test(q)) return "event";
  if (/\bpropert(?:y|ies)\b/.test(q)) return "property";
  if (/\b(listings?|countr(?:y|ies))\b/.test(q)) return "country";
  return null;
}

function extractDeleteMasterTitle(
  text: string,
  master?: MasterKind | null,
): string | null {
  const patterns = [
    new RegExp(
      `\\b(?:delete|remove|hatao|hata\\s*do|hata\\s*kro)\\s+(?:the\\s+|yeh\\s+|is\\s+|this\\s+)?(.+?)\\s+${MASTER_DELETE_KIND_RE.source}\\b`,
      "i",
    ),
    new RegExp(
      `\\b(.+?)\\s+${MASTER_DELETE_KIND_RE.source}\\s+(?:delete|remove|hatao|hata\\s*do|hata\\s*kro|delete\\s*karo|remove\\s*karo)\\b`,
      "i",
    ),
    /\b(?:delete|remove|hatao|hata\s*do)\s+(?:the\s+)?["']([^"']{2,60})["']/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    let title = (match?.[1] || "").replace(/\s+/g, " ").trim();
    title = title
      .replace(
        /^(a|an|the|yeh|is|this|that|ek|ak|naya|new|delete|remove)\s+/i,
        "",
      )
      .replace(/\b(kro|karo|kar\s*do|please|pls)\b/gi, "")
      .trim();
    if (
      !title ||
      title.length < 2 ||
      /^(yeh|is|this|that|all|sab|item|items|blog|blogs|service|services|listing|listings)$/i.test(
        title,
      )
    ) {
      continue;
    }
    if (master === "blog" && /\b(page|section)\b/i.test(title)) continue;
    return title.slice(0, 80);
  }
  return null;
}

function wantsDeleteMasterItem(
  text: string,
  forceMaster?: MasterKind | null,
): boolean {
  const q = text.toLowerCase();
  if (wantsDeletePage(text)) return false;
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  if (!/\b(delete|remove|hatao|hata\s*do|hata\s*kro|nikalo)\b/.test(q)) {
    return false;
  }
  if (/\b(page|menu|nav|navigation)\b/.test(q) && !forceMaster) return false;
  if (/\bsection\b/.test(q) && !forceMaster) return false;
  const master = forceMaster || detectMasterKindForDelete(text);
  if (!master) return false;
  if (extractDeleteMasterTitle(text, master)) return true;
  // Manager focus: "hatao" / "delete" alone → ask for title
  if (forceMaster) return true;
  return false;
}

function deleteMasterConfirmChoices(
  master: MasterKind,
  title: string,
): AiChoice[] {
  const encoded = `${master}::${title}`;
  return [
    { id: `delete-master-yes:${encoded}`, label: "Yes" },
    { id: `delete-master-no:${encoded}`, label: "No" },
  ];
}

function getPendingDeleteMaster(
  pendingChoices: AiChoice[],
): { master: MasterKind; title: string } | null {
  for (const choice of pendingChoices) {
    const id = typeof choice?.id === "string" ? choice.id : "";
    const match = id.match(/^delete-master-(?:yes|no):([a-z]+)::(.+)$/i);
    if (!match?.[1] || !match[2]) continue;
    const master = match[1].toLowerCase() as MasterKind;
    if (
      master === "blog" ||
      master === "service" ||
      master === "gallery" ||
      master === "team" ||
      master === "portfolio" ||
      master === "event" ||
      master === "property" ||
      master === "country"
    ) {
      return { master, title: match[2].trim() };
    }
  }
  return null;
}

function resolveDeleteMasterConfirm(
  message: string,
  pendingChoices: AiChoice[],
): "yes" | "no" | null {
  const pending = getPendingDeleteMaster(pendingChoices);
  if (!pending) return null;
  const q = message.trim().toLowerCase();
  const encoded = `${pending.master}::${pending.title}`.toLowerCase();
  if (
    q === `delete-master-yes:${encoded}` ||
    q === "yes" ||
    q === "ha" ||
    q === "haan" ||
    q === "han" ||
    q === "ji" ||
    q === "ok" ||
    q === "okay"
  ) {
    return "yes";
  }
  if (
    q === `delete-master-no:${encoded}` ||
    q === "no" ||
    q === "nahi" ||
    q === "na" ||
    q === "cancel" ||
    q === "mat"
  ) {
    return "no";
  }
  return null;
}

function buildDeleteMasterItemAsk(
  master: MasterKind,
  title: string,
  message: string,
): AiAssistResponse {
  const choices = deleteMasterConfirmChoices(master, title);
  const hindi =
    /[^\u0000-\u007f]/.test(message) ||
    /\b(hatao|hata|kro|karo)\b/i.test(message);
  return {
    reply: hindi
      ? `Sure? "${title}" ${master} delete karun?\n\nYes / No`
      : `Are you sure you want to delete ${master} "${title}"?\n\nYes / No`,
    actions: [{ type: "ask", options: choices }],
    choices,
  };
}

function buildDeleteMasterItemExecute(
  master: MasterKind,
  title: string,
  message: string,
): AiAssistResponse {
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Deleting ${master} "${title}"…`
      : `"${title}" ${master} delete kar raha hoon…`,
    actions: [{ type: "deleteMasterItem", master, title }],
    choices: [],
  };
}

function wantsRenamePage(text: string): boolean {
  const q = text.toLowerCase();
  if (wantsDeletePage(text) || wantsDeleteSection(text)) return false;
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  if (wantsDeleteMasterItem(text)) return false;
  return (
    /\bpage\s*(ka|ki|ke)?\s*naam\b/.test(q) ||
    /\brename\s+(?:the\s+)?(?:page|)\b/.test(q) ||
    /\bpage\s+rename\b/.test(q) ||
    /\b([A-Za-z][A-Za-z0-9\s-]{1,40})\s+page\s+(?:ka\s+naam|ko)\s+/i.test(
      text,
    ) ||
    /\b(page\s+name|nav\s+label)\s*(badlo|change|set|kro|karo)\b/.test(q)
  );
}

function extractRenamePagePair(
  text: string,
): { from: string; to: string } | null {
  const patterns = [
    // "Rename the About page to Support"
    /\brename\s+(?:the\s+)?([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+page\s+(?:to|→|->|as)\s+([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\b/i,
    /\b([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+page\s+(?:ka\s+naam|name)\s+([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)(?:\s+(?:kro|karo|kar\s*do|badlo|set|banao))?\b/i,
    /\b([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+page\s+ko\s+([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)(?:\s+(?:kro|karo|kar\s*do|badlo|rename|banao))?\b/i,
    /\brename\s+(?:the\s+)?(?:page\s+)?([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+(?:to|→|->|as)\s+([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\b/i,
    /\bpage\s+([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+(?:to|→|->)\s+([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    let from = (match?.[1] || "").replace(/\s+/g, " ").trim();
    let to = (match?.[2] || "").replace(/\s+/g, " ").trim();
    from = from
      .replace(/^(the|a|an)\s+/i, "")
      .replace(/\b(please|pls|rename|page)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    to = to
      .replace(/^(the|a|an)\s+/i, "")
      .replace(/\b(kro|karo|kar\s*do|please|pls|badlo|set|banao)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!from || !to) continue;
    if (/^home$/i.test(from) || /^home$/i.test(to)) continue;
    if (from.toLowerCase() === to.toLowerCase()) continue;
    return { from: from.slice(0, 48), to: to.slice(0, 48) };
  }
  return null;
}

function buildRenamePage(
  message: string,
  opts?: { isSinglePage?: boolean; pageLabels?: string[] },
): AiAssistResponse {
  if (opts?.isSinglePage) {
    return {
      reply:
        "This is a single-page site — page rename isn’t available. Use nav labels on multi-page sites, or create a legal page instead.",
      actions: [],
      choices: [],
    };
  }
  const pair = extractRenamePagePair(message);
  if (!pair) {
    const known = (opts?.pageLabels || [])
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 6);
    const exampleFrom = known.find((label) => !/^home$/i.test(label)) || "About";
    return {
      reply: known.length
        ? `Which page should I rename? Your pages: ${known.join(", ")}. Example: Rename ${exampleFrom} to Support.`
        : "Which page should I rename? Example: Rename About to Support — or rename Contact to Help.",
      actions: [],
      choices: [],
    };
  }
  const labels = (opts?.pageLabels || [])
    .map((label) => label.trim())
    .filter(Boolean);
  if (labels.length) {
    const exists = labels.some(
      (label) => label.toLowerCase() === pair.from.toLowerCase(),
    );
    if (!exists) {
      return {
        reply: `Page "${pair.from}" isn’t on this site. Available pages: ${labels.join(", ")}.`,
        actions: [],
        choices: [],
      };
    }
  }
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Renaming page "${pair.from}" → "${pair.to}"…`
      : `"${pair.from}" page ka naam "${pair.to}" kar raha hoon…`,
    actions: [{ type: "renamePage", from: pair.from, to: pair.to }],
    choices: [],
  };
}

function wantsDuplicateSection(text: string): boolean {
  const q = text.toLowerCase();
  if (wantsDeletePage(text) || wantsDeleteMasterItem(text)) return false;
  if (
    !/\b(duplicate|copy|clone|dobara|do\s*baar|duplicate\s*kro|copy\s*kro)\b/.test(
      q,
    )
  ) {
    return false;
  }
  return Boolean(extractTargetSectionType(text)) || /\bsection\b/.test(q);
}

function buildDuplicateSection(
  message: string,
  focusType?: string | null,
): AiAssistResponse {
  const sectionType =
    extractTargetSectionType(message) ||
    (focusType && !LOCKED_SECTION_TYPES.has(focusType) ? focusType : null);
  if (!sectionType || LOCKED_SECTION_TYPES.has(sectionType)) {
    return {
      reply:
        "Kaunsa section duplicate? Example: About section duplicate kro — ya Banner copy kro.",
      actions: [],
      choices: [],
    };
  }
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Duplicating "${label}" section…`
      : `"${label}" section duplicate kar raha hoon…`,
    actions: [{ type: "duplicateSection", sectionHint: sectionType }],
    choices: [],
  };
}

function detectRefreshAudience(
  text: string,
  categoryLabel?: string | null,
): string | null {
  const q = text.toLowerCase();
  if (/\b(school|education|college|university|coaching)\b/.test(q))
    return "school";
  if (/\b(real\s*estate|property|housing|realtor)\b/.test(q))
    return "realestate";
  if (/\b(business|company|corporate|agency|startup)\b/.test(q))
    return "business";
  if (/\b(hospital|clinic|medical|doctor)\b/.test(q)) return "hospital";
  if (/\b(restaurant|cafe|hotel|food)\b/.test(q)) return "restaurant";
  const cat = (categoryLabel || "").toLowerCase();
  if (cat.includes("school") || cat.includes("educat")) return "school";
  if (cat.includes("real") || cat.includes("propert")) return "realestate";
  if (cat.includes("business")) return "business";
  if (cat.includes("hospital") || cat.includes("health")) return "hospital";
  return null;
}

function wantsRefreshHomeContent(text: string): boolean {
  const q = text.toLowerCase();
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  if (wantsDeleteSection(text) || wantsDeletePage(text)) return false;
  // Language conversion has its own patch path — don't steal it for audience rewrite.
  if (extractHomeContentLanguage(text)) return false;
  return (
    /\b(poori|puri|pure|whole|entire|full)\s+(home\s*)?(page\s*)?(ka\s*)?content\b/.test(
      q,
    ) ||
    /\b(home\s*page|sab\s*sections?)\s+(ka\s*)?(content\s*)?(rewrite|refresh|update|badlo)\b/.test(
      q,
    ) ||
    /\b(rewrite|refresh)\s+(home|sab|all|poori|puri|pure)\b/.test(q) ||
    /\bcontent\s+(school|business|real\s*estate)\s*(ke\s*liye|for)?\s*(rewrite|refresh|update|badlo|kro)?\b/.test(
      q,
    ) ||
    /\b(school|business|real\s*estate)\s+ke\s+liye\s+(rewrite|content)\b/.test(q)
  );
}

function refreshHomeConfirmChoices(audience: string): AiChoice[] {
  return [
    { id: `refresh-home-yes:${audience}`, label: "Yes" },
    { id: `refresh-home-no:${audience}`, label: "No" },
  ];
}

function getPendingRefreshAudience(
  pendingChoices: AiChoice[],
): string | null {
  for (const choice of pendingChoices) {
    const id = typeof choice?.id === "string" ? choice.id : "";
    const match = id.match(/^refresh-home-(?:yes|no):(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function resolveRefreshHomeConfirm(
  message: string,
  pendingChoices: AiChoice[],
): "yes" | "no" | null {
  const pending = getPendingRefreshAudience(pendingChoices);
  if (!pending) return null;
  const q = message.trim().toLowerCase();
  if (
    q === `refresh-home-yes:${pending}`.toLowerCase() ||
    q === "yes" ||
    q === "ha" ||
    q === "haan" ||
    q === "han" ||
    q === "ji" ||
    q === "ok" ||
    q === "okay"
  ) {
    return "yes";
  }
  if (
    q === `refresh-home-no:${pending}`.toLowerCase() ||
    q === "no" ||
    q === "nahi" ||
    q === "na" ||
    q === "cancel" ||
    q === "mat"
  ) {
    return "no";
  }
  return null;
}

function buildRefreshHomeContentAsk(
  audience: string,
  message: string,
): AiAssistResponse {
  const choices = refreshHomeConfirmChoices(audience);
  const hindi =
    /[^\u0000-\u007f]/.test(message) ||
    /\b(kro|karo|badlo|rewrite)\b/i.test(message);
  return {
    reply: hindi
      ? `Sure? Home page content (${audience}) rewrite karun? Banner + About + Why Choose Us update honge.\n\nYes / No`
      : `Rewrite home content for "${audience}"? This updates Banner, About, and Why Choose Us.\n\nYes / No`,
    actions: [{ type: "ask", options: choices }],
    choices,
  };
}

function buildRefreshHomeContentExecute(
  audience: string,
  message: string,
): AiAssistResponse {
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Refreshing home page content for ${audience}…`
      : `Home page content ${audience} ke liye rewrite kar raha hoon…`,
    actions: [{ type: "refreshHomeContent", audience }],
    choices: [],
  };
}

type HomeContentLanguage = string;

const KNOWN_CONTENT_LANGUAGES: Array<{ id: string; pattern: RegExp }> = [
  { id: "hindi", pattern: /\bhindi\b|हिंदी|हिन्दी/i },
  { id: "english", pattern: /\b(english|angrezi|angrejee)\b/i },
  { id: "urdu", pattern: /\b(urdu|urdo|urdoo)\b|اردو/i },
  { id: "bhojpuri", pattern: /\b(bhojpuri|bhojpuriya|bhojapuri|bhojpur)\b/i },
  { id: "punjabi", pattern: /\b(punjabi|panjabi)\b|ਪੰਜਾਬੀ/i },
  { id: "tamil", pattern: /\b(tamil)\b|தமிழ்/i },
  { id: "telugu", pattern: /\b(telugu)\b|తెలుగు/i },
  { id: "marathi", pattern: /\b(marathi)\b|मराठी/i },
  { id: "gujarati", pattern: /\b(gujarati)\b|ગુજરાતી/i },
  { id: "bengali", pattern: /\b(bengali|bangla)\b|বাংলা/i },
  { id: "kannada", pattern: /\b(kannada)\b|ಕನ್ನಡ/i },
  { id: "malayalam", pattern: /\b(malayalam)\b|മലയാളം/i },
  { id: "odia", pattern: /\b(odia|oriya)\b|ଓଡ଼ିଆ/i },
  { id: "assamese", pattern: /\b(assamese)\b|অসমীয়া/i },
  { id: "sanskrit", pattern: /\b(sanskrit)\b|संस्कृत/i },
  { id: "french", pattern: /\b(french|francais|français)\b/i },
  { id: "spanish", pattern: /\b(spanish|espanol|español)\b/i },
  { id: "german", pattern: /\b(german|deutsch)\b/i },
  { id: "arabic", pattern: /\b(arabic)\b|العربية/i },
];

function extractHomeContentLanguage(text: string): HomeContentLanguage | null {
  const q = text.toLowerCase();
  for (const row of KNOWN_CONTENT_LANGUAGES) {
    if (row.pattern.test(text) || row.pattern.test(q)) return row.id;
  }
  // Generic: "... content <language> mai/mein kro"
  const generic = q.match(
    /\b(?:content|text|website|site|page|copy)\b[\s\S]{0,48}?\b([a-z]{3,20})\s*(?:mai|mein|me|m|me)\b/,
  );
  if (generic?.[1]) {
    const lang = generic[1];
    if (
      !/^(content|text|page|home|website|site|copy|all|sab|pure|poora|pura|full|whole)$/.test(
        lang,
      )
    ) {
      return lang;
    }
  }
  const trailing = q.match(
    /\b([a-z]{3,20})\s*(?:mai|mein|me)\s*(?:kro|karo|kar\s*do|translate|convert)?\s*$/,
  );
  if (trailing?.[1]) {
    const lang = trailing[1];
    if (
      !/^(content|text|page|home|website|site|copy|all|sab|pure|poora|pura|full|whole|change|update)$/.test(
        lang,
      )
    ) {
      return lang;
    }
  }
  return null;
}

/** True when user wants page/site content rewritten into a named language. */
function wantsHomeLanguageContent(text: string): boolean {
  const language = extractHomeContentLanguage(text);
  if (!language) return false;
  const q = text.toLowerCase();
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  if (wantsDeleteSection(text) || wantsDeletePage(text)) return false;
  // Explicit language rewrite of content/website/page — never FAQ/title shortcuts.
  if (
    /\b(content|text|copy|website|site|page|home)\b/.test(q) &&
    (/\b(mai|mein|me|m)\b/.test(q) ||
      /\b(translate|convert|language)\b/.test(q) ||
      /\b(kro|karo|change|update|badlo)\b/.test(q))
  ) {
    return true;
  }
  return (
    /\b(home\s*page|homepage|home)\b/.test(q) ||
    /\b(poori|puri|pure|poora|pura|whole|entire|full|all|sab|saara|saari)\b/.test(
      q,
    ) ||
    /\b(translate|convert|language)\b/.test(q)
  );
}

function languageWriteRule(language: HomeContentLanguage): string {
  switch (language) {
    case "hindi":
      return "Write EVERY text field in Hindi using Devanagari script only. No English except brand names. No Latin-script Hinglish.";
    case "urdu":
      return "Write EVERY text field in Urdu using Nastaliq/Arabic script (اردو) only. No English except brand names. No Roman Urdu.";
    case "english":
      return "Write EVERY text field in clear English only.";
    case "bhojpuri":
      return "Write EVERY text field in Bhojpuri using Devanagari script. Natural Bhojpuri website copy. No English except brand names.";
    case "punjabi":
      return "Write EVERY text field in Punjabi (Gurmukhi script) only. No English except brand names.";
    default:
      return `Write EVERY text field in ${language}. Use the correct native script for ${language}. No English except brand names.`;
  }
}

const HOME_LANGUAGE_FALLBACK: Record<
  string,
  {
    banner: { pretitle: string; title: string; desc: string; buttonLabel: string };
    about: { pretitle: string; title: string; desc: string };
    why: { pretitle: string; title: string; desc: string };
  }
> = {
  hindi: {
    banner: {
      pretitle: "प्रवेश खुले हैं",
      title: "कल के लिए उत्सुक मस्तिष्कों का पोषण",
      desc: "मजबूत शिक्षा, खेल और मूल्यों के साथ एक आधुनिक स्कूल अनुभव — हर विद्यार्थी के लिए।",
      buttonLabel: "अभी आवेदन करें",
    },
    about: {
      pretitle: "हमारे स्कूल के बारे में",
      title: "जहाँ सीखना व्यक्तिगत महसूस होता है",
      desc: "अनुभवी शिक्षक, सुरक्षित परिसर और व्यावहारिक गतिविधियाँ छात्रों को पढ़ाई और जीवन कौशल में आत्मविश्वास देती हैं।",
    },
    why: {
      pretitle: "परिवार हमें क्यों चुनते हैं",
      title: "देखभाल, स्पष्टता और परिणाम",
      desc: "स्पष्ट संवाद, देखभाल करने वाला स्टाफ और लगातार प्रगति — इसलिए परिवार हम पर भरोसा करते हैं।",
    },
  },
  bhojpuri: {
    banner: {
      pretitle: "स्वागत बा",
      title: "सही जगह, सही प्रॉपर्टी",
      desc: "हमनी के टीम रियल एस्टेट में साफ सलाह आ भरोसेमंद लिस्टिंग देले बानी।",
      buttonLabel: "अभी संपर्क करीं",
    },
    about: {
      pretitle: "हमनी के बारे में",
      title: "स्थानीय समझ, साफ डील",
      desc: "खरीदार आ किराएदार दुनों खातिर आसान प्रक्रिया आ सही जानकारी।",
    },
    why: {
      pretitle: "काहे चुनल जाला",
      title: "भरोसा आ नतीजा",
      desc: "वेरिफाइड लिस्टिंग, लोकल गाइडेंस आ पूरा सपोर्ट।",
    },
  },
  urdu: {
    banner: {
      pretitle: "داخلے کھلے ہیں",
      title: "کل کے لیے متجسس ذہنوں کی پرورش",
      desc: "مضبوط تعلیم، کھیل اور اقدار کے ساتھ ایک جدید تجربہ — ہر سیکھنے والے کے لیے۔",
      buttonLabel: "ابھی درخواست دیں",
    },
    about: {
      pretitle: "ہمارے بارے میں",
      title: "جہاں سیکھنا ذاتی محسوس ہوتا ہے",
      desc: "تجربہ کار رہنما، محفوظ ماحول اور عملی سرگرمیاں لوگوں کو اعتماد کے ساتھ آگے بڑھاتی ہیں۔",
    },
    why: {
      pretitle: "ہمیں کیوں چنا جاتا ہے",
      title: "خیال، وضاحت اور نتائج",
      desc: "صاف بات چیت، مددگار ٹیم اور مسلسل پیش رفت — اسی لیے لوگ ہم پر بھروسہ کرتے ہیں۔",
    },
  },
  english: {
    banner: {
      pretitle: "Admissions open",
      title: "Nurturing curious minds for tomorrow",
      desc: "A warm, modern school experience with strong academics, sports, and values — built for every learner.",
      buttonLabel: "Apply Now",
    },
    about: {
      pretitle: "About our school",
      title: "Where learning feels personal",
      desc: "We combine experienced teachers, safe campuses, and hands-on activities so students grow confidently in studies and life skills.",
    },
    why: {
      pretitle: "Why families choose us",
      title: "Care, clarity, and results",
      desc: "From early years to senior grades, families trust our clear communication, caring staff, and consistent student progress.",
    },
  },
};

function sectionExistsOnPage(
  sections: SectionSnapshot[],
  type: string,
): boolean {
  const lower = type.toLowerCase();
  return sections.some((section) => {
    if (section.page) return false;
    const t = (section.type || "").toLowerCase();
    if (t === lower) return true;
    if (lower === "whychooseus" && /why\s*choose|whychoose/.test(t)) return true;
    return false;
  });
}

function readCustomSectionCopy(data: Record<string, unknown>): {
  title?: string;
  desc?: string;
  buttonLabel?: string;
} {
  const out: { title?: string; desc?: string; buttonLabel?: string } = {};
  if (!Array.isArray(data.columns)) return out;
  for (const column of data.columns) {
    if (!column || typeof column !== "object") continue;
    const elements = (column as { elements?: unknown }).elements;
    if (!Array.isArray(elements)) continue;
    for (const el of elements) {
      if (!el || typeof el !== "object") continue;
      const type = String((el as { type?: string }).type || "");
      const value = (el as { value?: unknown }).value;
      if (typeof value !== "string" || !value.trim()) continue;
      if (type === "heading" && !out.title) out.title = value.trim();
      else if (type === "text" && !out.desc) out.desc = value.trim();
      else if (type === "button" && !out.buttonLabel) out.buttonLabel = value.trim();
    }
  }
  return out;
}

function snapshotHomeSectionCopy(
  section: SectionSnapshot,
): Record<string, string> {
  const data = section.data || {};
  const out: Record<string, string> = {};
  for (const key of ["pretitle", "title", "subtitle", "desc"] as const) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  // RealEstate highlight / listing headers use alternate keys
  if (!out.pretitle) {
    for (const key of [
      "categoriesPretitle",
      "listingsPretitle",
      "projectsPretitle",
    ]) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) {
        out.pretitle = value.trim();
        break;
      }
    }
  }
  if (!out.title) {
    for (const key of [
      "categoriesTitle",
      "listingsTitle",
      "projectsTitle",
      "featuresTitle",
      "statsTitle",
    ]) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) {
        out.title = value.trim();
        break;
      }
    }
  }
  if (!out.desc) {
    for (const key of [
      "categoriesDesc",
      "listingsDesc",
      "projectsDesc",
      "featuresDesc",
    ]) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) {
        out.desc = value.trim();
        break;
      }
    }
  }
  // Slider banners: surface first-slide copy so language rewrite always has text
  if (Array.isArray(data.bannerSlides) && data.bannerSlides.length) {
    const first = data.bannerSlides[0];
    if (first && typeof first === "object") {
      const slide = first as Record<string, unknown>;
      if (!out.pretitle && typeof slide.pretitle === "string" && slide.pretitle.trim()) {
        out.pretitle = slide.pretitle.trim();
      }
      if (!out.title && typeof slide.title === "string" && slide.title.trim()) {
        out.title = slide.title.trim();
      }
      if (!out.desc && typeof slide.desc === "string" && slide.desc.trim()) {
        out.desc = slide.desc.trim();
      }
      if (!out.buttonLabel) {
        const button = slide.button;
        if (button && typeof button === "object") {
          const label = (button as { label?: unknown }).label;
          if (typeof label === "string" && label.trim()) {
            out.buttonLabel = label.trim();
          }
        }
      }
    }
  }
  if (typeof data.buttonLabel === "string" && data.buttonLabel.trim()) {
    out.buttonLabel = data.buttonLabel.trim();
  }
  if (!out.buttonLabel && Array.isArray(data.buttons)) {
    for (const button of data.buttons) {
      if (!button || typeof button !== "object") continue;
      const label = (button as { label?: unknown }).label;
      if (typeof label === "string" && label.trim()) {
        out.buttonLabel = label.trim();
        break;
      }
    }
  }
  if (section.type === "CustomSection") {
    const custom = readCustomSectionCopy(data);
    if (!out.title && custom.title) out.title = custom.title;
    if (!out.desc && custom.desc) out.desc = custom.desc;
    if (!out.buttonLabel && custom.buttonLabel) {
      out.buttonLabel = custom.buttonLabel;
    }
  }
  // Blocks-based sections (some About/Banner variants)
  if ((!out.title || !out.desc || !out.pretitle) && Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      if (!block || typeof block !== "object") continue;
      const row = block as Record<string, unknown>;
      const content =
        typeof row.content === "string" ? row.content.trim() : "";
      if (!content) continue;
      if (row.type === "text" && row.role === "pretitle" && !out.pretitle) {
        out.pretitle = content;
      }
      if (row.type === "text" && row.role === "heading" && !out.title) {
        out.title = content;
      }
      if (
        row.type === "text" &&
        (row.role === "paragraph" || row.role === "paragraph-secondary") &&
        !out.desc
      ) {
        out.desc = content;
      }
      if (row.type === "button") {
        const label =
          typeof row.label === "string"
            ? row.label.trim()
            : typeof row.content === "string"
              ? row.content.trim()
              : "";
        if (label && !out.buttonLabel) out.buttonLabel = label;
      }
    }
  }
  return out;
}

function collectHomeLanguageTargets(sections: SectionSnapshot[]): Array<{
  hint: string;
  type: string;
  label: string;
  current: Record<string, string>;
  faqItems?: Array<{ question: string; answer: string }>;
  hasCardItems?: boolean;
}> {
  const out: Array<{
    hint: string;
    type: string;
    label: string;
    current: Record<string, string>;
    faqItems?: Array<{ question: string; answer: string }>;
    hasCardItems?: boolean;
  }> = [];

  for (const section of sections) {
    if (section.page) continue;
    if (PLACEMENT_SKIP_TYPES.has(section.type)) continue;
    const hint = (section.id || section.type || "").trim();
    if (!hint) continue;
    const current = snapshotHomeSectionCopy(section);
    const data = section.data || {};
    let faqItems: Array<{ question: string; answer: string }> | undefined;
    if (Array.isArray(data.faqItems) && data.faqItems.length) {
      faqItems = data.faqItems
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const question = String(
            (item as { question?: unknown }).question || "",
          ).trim();
          const answer = String(
            (item as { answer?: unknown }).answer || "",
          ).trim();
          if (!question && !answer) return null;
          return { question, answer };
        })
        .filter((row): row is { question: string; answer: string } =>
          Boolean(row),
        )
        .slice(0, 12);
    }
    const hasCardItems = Boolean(
      (Array.isArray(data.whyChooseUsItems) && data.whyChooseUsItems.length) ||
        (Array.isArray(data.productItems) && data.productItems.length) ||
        (Array.isArray(data.serviceSlides) && data.serviceSlides.length) ||
        (Array.isArray(data.productSlides) && data.productSlides.length) ||
        (Array.isArray(data.galleryItems) && data.galleryItems.length) ||
        (Array.isArray(data.testimonialItems) &&
          data.testimonialItems.length) ||
        (Array.isArray(data.productFeatures) && data.productFeatures.length) ||
        (Array.isArray(data.bannerSlides) && data.bannerSlides.length) ||
        (Array.isArray(data.cities) && data.cities.length) ||
        (Array.isArray(data.listings) && data.listings.length) ||
        (Array.isArray(data.categories) && data.categories.length) ||
        (Array.isArray(data.projectItems) && data.projectItems.length) ||
        (Array.isArray(data.features) && data.features.length) ||
        (Array.isArray(data.stats) && data.stats.length) ||
        (Array.isArray(data.blocks) &&
          data.blocks.some(
            (block) =>
              block &&
              typeof block === "object" &&
              (block as { type?: string }).type === "card",
          )),
    );
    if (!Object.keys(current).length && !faqItems?.length && !hasCardItems) {
      continue;
    }
    const button =
      current.buttonLabel ||
      getSectionButtonLabel(sections, hint) ||
      getSectionButtonLabel(sections, section.type);
    if (button) current.buttonLabel = button;
    const label =
      section.type === "CustomSection"
        ? String(
            (data as { sectionName?: string }).sectionName || "Custom Section",
          )
        : READY_SECTIONS.find((row) => row.type === section.type)?.label ||
          section.type;
    out.push({
      hint,
      type: section.type,
      label,
      current,
      faqItems,
      hasCardItems,
    });
  }
  return out;
}

async function generateHomeLanguageBatch(params: {
  apiKey: string;
  model: string;
  language: HomeContentLanguage;
  siteContext: string;
  targets: Array<{
    hint: string;
    type: string;
    label: string;
    current: Record<string, string>;
    faqItems?: Array<{ question: string; answer: string }>;
  }>;
}): Promise<
  Array<{
    id: string;
    pretitle?: string;
    title?: string;
    subtitle?: string;
    desc?: string;
    buttonLabel?: string;
    faqItems?: Array<{ question: string; answer: string }>;
  }>
> {
  const langRule = languageWriteRule(params.language);

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: `You translate/rewrite website home-page copy for a website builder.
Return ONLY valid JSON:
{"sections":[{"id":"...","pretitle":"...","title":"...","subtitle":"...","desc":"...","buttonLabel":"...","faqItems":[{"question":"...","answer":"..."}]}]}
Rules:
- Include every section id from the input.
- Keep only fields that exist on that section in the input (plus faqItems when provided).
- buttonLabel: max 4 words, clear CTA.
- pretitle: max 6 words. title: max 12 words. desc: 2-4 sentences.
- ${langRule}
- Do not describe edits. Do not skip sections.`,
    },
    {
      role: "user",
      content: JSON.stringify({
        siteContext: params.siteContext,
        language: params.language,
        sections: params.targets.map((row) => ({
          id: row.hint,
          type: row.type,
          label: row.label,
          fields: row.current,
          faqItems: row.faqItems || undefined,
        })),
      }),
    },
  ];

  let response = await callOpenAi({
    apiKey: params.apiKey,
    model: params.model,
    messages,
    useJsonFormat: true,
    temperature: 0.55,
    maxTokens: 3500,
  });
  if (!response.ok) {
    response = await callOpenAi({
      apiKey: params.apiKey,
      model: params.model,
      messages,
      useJsonFormat: false,
      temperature: 0.55,
      maxTokens: 3500,
    });
  }
  if (!response.ok) return [];
  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content || "";
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const extracted = extractJson(raw);
    parsed = extracted as unknown as Record<string, unknown> | null;
  }
  const rows = Array.isArray(parsed?.sections)
    ? (parsed?.sections as unknown[])
    : Array.isArray(parsed?.actions)
      ? []
      : [];
  // extractJson returns AiAssistResponse — if parse failed that way, try regex
  if (!rows.length) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const again = JSON.parse(match[0]) as { sections?: unknown[] };
        if (Array.isArray(again.sections)) {
          return again.sections
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const row = item as Record<string, unknown>;
              const id = String(row.id || "").trim();
              if (!id) return null;
              return {
                id,
                pretitle:
                  typeof row.pretitle === "string" ? row.pretitle.trim() : undefined,
                title: typeof row.title === "string" ? row.title.trim() : undefined,
                subtitle:
                  typeof row.subtitle === "string" ? row.subtitle.trim() : undefined,
                desc: typeof row.desc === "string" ? row.desc.trim() : undefined,
                buttonLabel:
                  typeof row.buttonLabel === "string"
                    ? row.buttonLabel.trim()
                    : undefined,
                faqItems: Array.isArray(row.faqItems)
                  ? (row.faqItems as Array<{ question?: string; answer?: string }>)
                      .map((faq) => ({
                        question: String(faq?.question || "").trim(),
                        answer: String(faq?.answer || "").trim(),
                      }))
                      .filter((faq) => faq.question || faq.answer)
                  : undefined,
              };
            })
            .filter((row): row is NonNullable<typeof row> => Boolean(row));
        }
      } catch {
        return [];
      }
    }
    return [];
  }

  return rows
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = String(row.id || "").trim();
      if (!id) return null;
      return {
        id,
        pretitle:
          typeof row.pretitle === "string" ? row.pretitle.trim() : undefined,
        title: typeof row.title === "string" ? row.title.trim() : undefined,
        subtitle:
          typeof row.subtitle === "string" ? row.subtitle.trim() : undefined,
        desc: typeof row.desc === "string" ? row.desc.trim() : undefined,
        buttonLabel:
          typeof row.buttonLabel === "string"
            ? row.buttonLabel.trim()
            : undefined,
        faqItems: Array.isArray(row.faqItems)
          ? (row.faqItems as Array<{ question?: string; answer?: string }>)
              .map((faq) => ({
                question: String(faq?.question || "").trim(),
                answer: String(faq?.answer || "").trim(),
              }))
              .filter((faq) => faq.question || faq.answer)
          : undefined,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

async function buildHomeLanguageContentResponse(params: {
  message: string;
  language: HomeContentLanguage;
  sections: SectionSnapshot[];
  siteContext: string;
}): Promise<AiAssistResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const targets = collectHomeLanguageTargets(params.sections);

  const actions: Array<{
    type: "patch";
    sectionHint: string;
    fields: Record<string, unknown>;
  }> = [];
  const bits: string[] = [];
  const languageLabel =
    params.language.charAt(0).toUpperCase() + params.language.slice(1);

  if (apiKey && targets.length) {
    const generated = await generateHomeLanguageBatch({
      apiKey,
      model,
      language: params.language,
      siteContext: params.siteContext,
      targets,
    });
    const byId = new Map(generated.map((row) => [row.id, row]));
    const languageAsk = `${params.message}\n\nCRITICAL: ${languageWriteRule(params.language)}`;

    const sectionResults = await Promise.all(
      targets.map(async (target) => {
        const row = byId.get(target.hint);
        const fields: Record<string, unknown> = {};
        if (row) {
          if (target.current.pretitle && row.pretitle) {
            fields.pretitle = row.pretitle;
          }
          if (target.current.title && row.title) fields.title = row.title;
          if (target.current.subtitle && row.subtitle) {
            fields.subtitle = row.subtitle;
          }
          if (target.current.desc && row.desc) fields.desc = row.desc;
          if (target.current.buttonLabel && row.buttonLabel) {
            fields.buttonLabel = row.buttonLabel;
          }
          if (target.faqItems?.length && row.faqItems?.length) {
            fields.faqItems = row.faqItems.map((faq, index) => ({
              id:
                (
                  (
                    params.sections.find((s) => s.id === target.hint)?.data
                      ?.faqItems as Array<{ id?: string }> | undefined
                  )?.[index]?.id
                ) || `faq-${index + 1}`,
              question: faq.question,
              answer: faq.answer,
            }));
          }
        }

        // Per-section fallback if batch skipped this section / button
        if (
          !fields.title ||
          (target.current.buttonLabel && !fields.buttonLabel)
        ) {
          const fieldList: Array<"pretitle" | "title" | "desc" | "button"> =
            [];
          if (target.current.pretitle && !fields.pretitle) {
            fieldList.push("pretitle");
          }
          if (target.current.title && !fields.title) fieldList.push("title");
          if (target.current.desc && !fields.desc) fieldList.push("desc");
          if (target.current.buttonLabel && !fields.buttonLabel) {
            fieldList.push("button");
          }
          for (const field of fieldList) {
            const copy = await generateFreshCopy({
              apiKey,
              model,
              sectionType: target.hint,
              field,
              sections: params.sections,
              siteContext: params.siteContext,
              userMessage: languageAsk,
              wordTarget: field === "desc" ? 45 : null,
            });
            if (!copy?.trim()) continue;
            if (field === "button") fields.buttonLabel = copy.trim();
            else fields[field] = copy.trim();
          }
        }

        // Cards/items (WhyChooseUs, Services, Testimonials, Gallery, FAQ…)
        const section =
          params.sections.find((item) => item.id === target.hint) ||
          params.sections.find((item) => item.type === target.type);
        const cardFields = await translateFocusedSectionCards({
          apiKey,
          model,
          userMessage: languageAsk,
          siteContext: params.siteContext,
          sectionType: target.type,
          data:
            section?.data && typeof section.data === "object"
              ? section.data
              : {},
        });
        Object.assign(fields, cardFields);

        // RealEstate sections often store section headers under alternate keys.
        const live =
          section?.data && typeof section.data === "object" ? section.data : {};
        if (typeof fields.title === "string") {
          if ("categoriesTitle" in live && !("title" in live)) {
            fields.categoriesTitle = fields.title;
          }
          if ("listingsTitle" in live && !("title" in live)) {
            fields.listingsTitle = fields.title;
          }
          if ("projectsTitle" in live && !("title" in live)) {
            fields.projectsTitle = fields.title;
          }
        }
        if (typeof fields.pretitle === "string") {
          if ("categoriesPretitle" in live && !("pretitle" in live)) {
            fields.categoriesPretitle = fields.pretitle;
          }
          if ("listingsPretitle" in live && !("pretitle" in live)) {
            fields.listingsPretitle = fields.pretitle;
          }
        }
        if (typeof fields.desc === "string") {
          if ("categoriesDesc" in live && !("desc" in live)) {
            fields.categoriesDesc = fields.desc;
          }
          if ("listingsDesc" in live && !("desc" in live)) {
            fields.listingsDesc = fields.desc;
          }
        }

        return { target, fields };
      }),
    );

    for (const { target, fields } of sectionResults) {
      if (Object.keys(fields).length) {
        actions.push({
          type: "patch",
          sectionHint: target.hint,
          fields,
        });
        bits.push(target.label);
      }
    }
  }

  if (!actions.length) {
    const pack =
      HOME_LANGUAGE_FALLBACK[params.language] ||
      HOME_LANGUAGE_FALLBACK.english;
    if (sectionExistsOnPage(params.sections, "Banner")) {
      actions.push({
        type: "patch",
        sectionHint: "Banner",
        fields: {
          pretitle: pack.banner.pretitle,
          title: pack.banner.title,
          desc: pack.banner.desc,
          buttonLabel: pack.banner.buttonLabel,
        },
      });
      bits.push("Banner");
    }
    if (sectionExistsOnPage(params.sections, "About")) {
      actions.push({
        type: "patch",
        sectionHint: "About",
        fields: {
          pretitle: pack.about.pretitle,
          title: pack.about.title,
          desc: pack.about.desc,
          buttonLabel:
            params.language === "hindi"
              ? "हमारे शिक्षक से मिलें"
              : params.language === "urdu"
                ? "ہماری ٹیم سے ملیں"
                : params.language === "bhojpuri"
                  ? "हमनी से मिलीं"
                  : "Meet Our Educators",
        },
      });
      bits.push("About");
    }
    if (sectionExistsOnPage(params.sections, "WhyChooseUs")) {
      actions.push({
        type: "patch",
        sectionHint: "WhyChooseUs",
        fields: {
          pretitle: pack.why.pretitle,
          title: pack.why.title,
          desc: pack.why.desc,
        },
      });
      bits.push("WhyChooseUs");
    }
  }

  if (!actions.length) {
    return {
      reply: `Home pe update karne layak content sections nahi mile (${languageLabel}).`,
      actions: [],
      choices: [],
    };
  }

  const list = bits.join(", ");
  return {
    reply: `Home/website content ${languageLabel} mein update kar diya (${list}) — headings, buttons, aur cards/items bhi. Page pe check karo.`,
    actions,
    choices: [],
  };
}

const SECTION_TYPE_ALIASES: Array<{ type: string; keys: string[] }> = [
  { type: "Banner", keys: ["banner", "hero", "home banner"] },
  { type: "About", keys: ["about", "about us"] },
  { type: "Product", keys: ["product", "services section", "service section", "services", "service"] },
  { type: "WhyChooseUs", keys: ["why choose us", "why choose", "whychoose"] },
  { type: "Gallery", keys: ["gallery"] },
  {
    type: "CountriesServe",
    keys: ["countries we serve", "countries serve", "countries section", "countries"],
  },
  { type: "FormDetail", keys: ["form detail", "lead form", "contact form", "form"] },
  { type: "FAQ", keys: ["faq", "faqs"] },
  {
    type: "Testimonial",
    keys: ["testimonial", "testimonials", "reviews", "clients"],
  },
  {
    type: "CustomSection",
    keys: ["cta card", "cta section", "custom section", "cta"],
  },
];

const LOCKED_SECTION_TYPES = new Set(["Header", "Topbar", "Footer", "Breadcrumb"]);

function extractTargetSectionType(text: string): string | null {
  const q = text.toLowerCase();
  // Longer keys first (services section before service)
  const ranked = [...SECTION_TYPE_ALIASES].sort(
    (a, b) =>
      Math.max(...b.keys.map((k) => k.length)) -
      Math.max(...a.keys.map((k) => k.length)),
  );
  for (const entry of ranked) {
    if (entry.keys.some((key) => q.includes(key))) {
      return entry.type;
    }
  }
  return null;
}

function wantsDeleteSection(text: string): boolean {
  const q = text.toLowerCase();
  if (wantsDeletePage(text)) return false;
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  // Prefer master-item delete when a titled blog/service/listing is named
  if (wantsDeleteMasterItem(text)) return false;
  if (!/\b(delete|remove|hatao|hata\s*do|hata\s*kro|nikalo)\b/.test(q)) {
    return false;
  }
  // FAQ Q&A row removal stays with wantsRemoveFaqItems
  if (
    /\bfaqs?\b/.test(q) &&
    /\b(questions?|items?|jo\s*(add\s*)?kiya|last\s+\d+)\b/.test(q) &&
    !/\bsection\b/.test(q)
  ) {
    return false;
  }
  const sectionType = extractTargetSectionType(text);
  if (!sectionType) return false;
  if (LOCKED_SECTION_TYPES.has(sectionType)) return false;
  return true;
}

function buildDeleteSectionAsk(
  sectionType: string,
  message: string,
): AiAssistResponse {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  const hindi =
    /[^\u0000-\u007f]/.test(message) ||
    /\b(hatao|hata|kro|karo)\b/i.test(message);
  return {
    reply: hindi
      ? `Sure? "${label}" section delete karun?\n\nYes / No`
      : `Are you sure you want to delete the "${label}" section?\n\nYes / No`,
    actions: [
      {
        type: "ask",
        options: [
          { id: `delete-section-yes:${sectionType}`, label: "Yes" },
          { id: `delete-section-no:${sectionType}`, label: "No" },
        ],
      },
    ],
    choices: [
      { id: `delete-section-yes:${sectionType}`, label: "Yes" },
      { id: `delete-section-no:${sectionType}`, label: "No" },
    ],
  };
}

function getPendingDeleteSectionType(
  pendingChoices: AiChoice[],
): string | null {
  for (const choice of pendingChoices) {
    const match = choice.id.match(/^delete-section-(?:yes|no):(.+)$/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

function resolveDeleteSectionConfirm(
  message: string,
  pendingChoices: AiChoice[],
): "yes" | "no" | null {
  const pendingType = getPendingDeleteSectionType(pendingChoices);
  if (!pendingType) return null;
  const q = message.trim().toLowerCase();
  if (
    q === `delete-section-yes:${pendingType}`.toLowerCase() ||
    q === "yes" ||
    q === "ha" ||
    q === "haan" ||
    q === "han" ||
    q === "ji" ||
    q === "ok" ||
    q === "okay" ||
    q === "kro" ||
    q === "karo" ||
    q === "sure"
  ) {
    return "yes";
  }
  if (
    q === `delete-section-no:${pendingType}`.toLowerCase() ||
    q === "no" ||
    q === "nahi" ||
    q === "nahin" ||
    q === "na" ||
    q === "cancel" ||
    q === "mat"
  ) {
    return "no";
  }
  return null;
}

function buildDeleteSectionExecute(
  sectionType: string,
  message: string,
): AiAssistResponse {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Deleting "${label}" section…`
      : `"${label}" section delete kar raha hoon…`,
    actions: [{ type: "deleteSection", sectionHint: sectionType }],
    choices: [],
  };
}

function wantsMoveSection(text: string): boolean {
  const q = text.toLowerCase();
  if (wantsDeleteSection(text) || wantsDeletePage(text)) return false;
  if (wantsPublishSite(text) || wantsSetSiteSeo(text)) return false;
  const hasMove =
    /\b(move|shift|upar|neeche|up|down|above|below)\b/.test(q) ||
    /\b(le\s*jao|lejao|upar\s*karo|neeche\s*karo)\b/.test(q);
  if (!hasMove) return false;
  // Avoid "sabse upar wali line" pretitle edits
  if (
    /\b(sabse\s+upar\s+wali|top\s+line|pretitle|tagline|eyebrow)\b/.test(q)
  ) {
    return false;
  }
  return Boolean(extractTargetSectionType(text));
}

function extractMoveDirection(text: string): "up" | "down" {
  const q = text.toLowerCase();
  if (
    /\b(neeche|down|below|baad|after)\b/.test(q) ||
    /\bneeche\s*(le\s*jao|karo|kro)\b/.test(q)
  ) {
    return "down";
  }
  return "up";
}

function buildMoveSection(
  sectionType: string,
  direction: "up" | "down",
  message: string,
): AiAssistResponse {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  const english = isMostlyEnglish(message);
  return {
    reply: english
      ? `Moving "${label}" section ${direction}…`
      : `"${label}" section ${direction === "up" ? "upar" : "neeche"} move kar raha hoon…`,
    actions: [
      {
        type: "moveSection",
        sectionHint: sectionType,
        direction,
      },
    ],
    choices: [],
  };
}

/** "add 9 listings in india" / "india mein 5 listing" → India */
function extractCountryListingTarget(text: string): string | null {
  const loc = text.match(
    /\b(?:in|for|of|under)\s+([A-Za-z][A-Za-z.\s-]{0,40}?)(?=\s*$|[.,!]|\s+(?:please|pls|listing|listings|items?|add|kro|karo|daalo|dal)\b)/i,
  );
  const mein = text.match(
    /\b([A-Za-z][A-Za-z.\s-]{0,40}?)\s*(?:mein|mai)\b/i,
  );
  const candidate = (loc?.[1] || mein?.[1] || "").trim();
  if (candidate) {
    return canonicalizeCountryListingName(candidate);
  }
  for (const entry of COUNTRY_NAME_ALIASES) {
    if (entry.pattern.test(text)) return entry.name;
  }
  return null;
}

function resolveCountryListingTopicKey(categoryIdOrLabel?: string | null): string {
  const key = (categoryIdOrLabel || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (key.includes("school") || key.includes("education")) return "school";
  if (
    key.includes("realestate") ||
    key.includes("property") ||
    key.includes("estate")
  ) {
    return "realestate";
  }
  if (
    key.includes("business") ||
    key.includes("corporate") ||
    key.includes("agency")
  ) {
    return "business";
  }
  return "school";
}

function buildCountryListingTitles(
  countryName: string,
  count: number,
  categoryIdOrLabel?: string | null,
): string[] {
  const topicKey = resolveCountryListingTopicKey(categoryIdOrLabel);
  const topics =
    COUNTRY_LISTING_TOPICS_BY_CATEGORY[topicKey] ||
    COUNTRY_LISTING_TOPICS_BY_CATEGORY.school;
  const cities =
    COUNTRY_LISTING_CITIES[countryName] ||
    Array.from({ length: Math.max(count, 4) }, (_, index) =>
      index === 0 ? countryName : `${countryName} Area ${index + 1}`,
    );
  return Array.from({ length: count }, (_, index) => {
    const topic = topics[index % topics.length];
    const city = cities[index % cities.length];
    return `${topic} in ${city}`;
  });
}

/** Distinct group labels so category/type submenus are not one generic bucket. */
const MASTER_GROUP_DEFAULTS: Record<MasterKind, string[]> = {
  blog: ["News", "Guides", "Tips", "Updates", "Stories"],
  service: [
    "Consulting",
    "Design",
    "Development",
    "Support",
    "Strategy",
    "Marketing",
    "Maintenance",
    "Training",
  ],
  gallery: ["Workspace", "Projects", "Team", "Events", "Studio"],
  team: ["Leadership", "Design", "Engineering", "Sales", "Support"],
  portfolio: ["Branding", "Web", "Product", "Campaign", "App"],
  event: ["Workshop", "Networking", "Demo", "Meetup", "Open House"],
  property: ["Apartment", "Villa", "Studio", "House", "Loft"],
  country: ["India", "UK", "USA", "Canada", "UAE"],
};

const GENERIC_MASTER_CATEGORIES = new Set([
  "service",
  "general",
  "team",
  "portfolio",
  "event",
  "gallery",
  "residential",
]);

function diversifyMasterItemGroups<
  T extends { category?: string; propertyType?: string },
>(
  items: T[],
  master: MasterKind,
  mode: "name" | "category" | "type" | undefined,
): T[] {
  if (mode !== "category" && mode !== "type") return items;
  const defaults = MASTER_GROUP_DEFAULTS[master] || ["General"];
  return items.map((item, index) => {
    const group = defaults[index % defaults.length] || "General";
    if (mode === "type" || master === "property") {
      const current = (item.propertyType || item.category || "").trim();
      if (current && !GENERIC_MASTER_CATEGORIES.has(current.toLowerCase())) {
        return item;
      }
      return { ...item, propertyType: group, category: group };
    }
    const current = (item.category || "").trim();
    if (current && !GENERIC_MASTER_CATEGORIES.has(current.toLowerCase())) {
      return item;
    }
    return { ...item, category: group };
  });
}

function detectMasterKind(text: string): MasterKind | null {
  const q = text.toLowerCase();
  // "create Vastu page … add menu after Blogs" — Blogs is a nav anchor, not a blog post.
  if (isNamedCustomPageCreate(text) && mentionsNavMenu(text)) {
    // fall through to other masters only if the *page name* itself is a master kind
  } else if (
    /\b(blog\s*posts?|blogs?|articles?|blog\s*page)\b/.test(q) &&
    !/\b(blog\s*index)\b/.test(q)
  ) {
    // Prefer blog when blogs/posts mentioned; avoid treating "about blog section" as master
    if (/\b(blog\s*posts?|blogs|articles?)\b/.test(q)) return "blog";
    if (/\bblog\b/.test(q) && /\b(page|post|manager|mai|me)\b/.test(q))
      return "blog";
  }
  if (
    /\b(services?|service\s*page|service\s*items?)\b/.test(q) &&
    !/\b(ready\s*section|banner|ke\s*baad|after)\b/.test(q)
  ) {
    if (
      /\b(service\s*page|service\s*items?|services?\s*(mai|me|manager)|master\s*service)\b/.test(
        q,
      ) ||
      /\b\d+\s+services?\b/.test(q) ||
      /\b(new|naya|add|banao|bnao|create)\s+services?\b/.test(q) ||
      /\bservices?\s+(add|banao|bnao|create|kro|karo)\b/.test(q)
    ) {
      return "service";
    }
  }
  if (
    /\b(gallery\s*(page|items?|images?|photos?)|galleries)\b/.test(q) ||
    (/\bgallery\b/.test(q) &&
      /\b(page|item|manager|mai|me|\d+)\b/.test(q) &&
      !/\b(ke\s*baad|after|ready\s*section|section\s*add)\b/.test(q))
  ) {
    return "gallery";
  }
  if (
    /\b(team\s*members?|teams?\s*(page|mai|me|manager)|new\s+team|\d+\s+teams?)\b/.test(
      q,
    ) ||
    (/\b(teams?|members?)\b/.test(q) &&
      /\b(add|banao|bnao|create|naya|new)\b/.test(q) &&
      !/\b(ke\s*baad|after|ready)\b/.test(q))
  ) {
    return "team";
  }
  if (
    /\b(portfolio\s*(page|items?|projects?)|portfolios)\b/.test(q) ||
    (/\bportfolio\b/.test(q) &&
      /\b(add|banao|bnao|create|naya|new|\d+|mai|me|manager)\b/.test(q) &&
      !/\b(ke\s*baad|after|ready\s*section)\b/.test(q))
  ) {
    return "portfolio";
  }
  if (
    /\b(events?\s*(page|items?|manager)|upcoming\s*events?|\d+\s+events?)\b/.test(
      q,
    ) ||
    (/\bevents?\b/.test(q) &&
      /\b(add|banao|bnao|create|naya|new|mai|me|manager)\b/.test(q) &&
      !/\b(ke\s*baad|after|ready\s*section|gallery)\b/.test(q))
  ) {
    return "event";
  }
  if (
    /\b(propert(?:y|ies)\s*(page|items?|listings?|manager)|\d+\s+propert(?:y|ies))\b/.test(
      q,
    ) ||
    (/\bpropert(?:y|ies)\b/.test(q) &&
      /\b(add|banao|bnao|create|naya|new|mai|me|manager|listings?)\b/.test(q) &&
      !/\b(ke\s*baad|after|ready\s*section)\b/.test(q))
  ) {
    return "property";
  }
  if (
    /\b(countr(?:y|ies)\s*(listings?|manager|items?)|\d+\s+countr(?:y|ies)\s*listings?|country\s*listings?)\b/.test(
      q,
    ) ||
    (/\b(countr(?:y|ies)|countries\s*we\s*serve)\b/.test(q) &&
      /\b(add|banao|bnao|create|naya|new|mai|me|manager|listings?)\b/.test(q) &&
      !/\b(ke\s*baad|after|ready\s*section)\b/.test(q))
  ) {
    return "country";
  }
  return null;
}

function extractMasterItemCount(text: string): number {
  const q = text.toLowerCase();
  const patterns = [
    /\b(\d{1,2})\s*(?:new\s+)?(?:blogs?|blog\s*posts?|articles?|services?|gallery\s*items?|galleries|team\s*members?|teams?|portfolio\s*items?|portfolio\s*projects?|portfolios?|events?|propert(?:y|ies)|listings?|items?|posts?|members?|projects?)\b/,
    /\b(?:blogs?|blog\s*posts?|articles?|services?|gallery|galleries|teams?|team\s*members?|portfolio|portfolios?|events?|propert(?:y|ies))\s*(?:mai|me|mein)?\s*(\d{1,2})\b/,
    /\b(?:add|create|banao|bnao|kro|karo)\s+(\d{1,2})\b/,
    /\b(\d{1,2})\s*(?:aur|more|or)?\s*(?:add|banao|bnao|kro|karo|daalo|dal)\b/,
    /\b(\d{1,2})\s*(?:aur\s+)?add\b/,
    // "2 new", "3 aur", "2 naye" (master noun optional — focus chat provides kind)
    /\b(\d{1,2})\s*(?:new|aur|more|naye|naya)\b/,
    /\b(?:new|aur|more|naye|naya)\s+(\d{1,2})\b/,
  ];
  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n >= 1)
        return Math.min(MASTER_MAX_ITEMS, Math.floor(n));
    }
  }
  return 1;
}

function extractMasterItemTitles(
  text: string,
  count: number,
): string[] | null {
  const named = text.match(
    /(?:named|called|titles?|naam)\s*[:\-]?\s*(.+)$/i,
  );
  const colonList = text.match(
    /(?:blogs?|services?|items?|members?|projects?|posts?|listings?|countr(?:y|ies))\s*[:\-]\s*(.+)$/i,
  );
  const raw = (named?.[1] || colonList?.[1] || "").trim();
  if (!raw) return null;
  const parts = raw
    .replace(/\s+and\s+/gi, ",")
    .replace(/\s+aur\s+/gi, ",")
    .split(/[,|]+/)
    .flatMap((part) => part.split("/"))
    .map((part) => part.replace(/^["'\s]+|["'\s.!?]+$/g, "").trim())
    .filter((part) => part.length >= 2 && part.length <= 80);
  if (parts.length >= 1) return parts.slice(0, Math.max(count, parts.length));
  return null;
}

function wantsAddMasterItems(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  // "create Vastu page and add menu after Blogs" → nav page, not blog/service items
  if (isNamedCustomPageCreate(text)) return false;
  // Don't steal Ready-section placement flows ("Banner ke baad Gallery")
  if (
    /\b(ke\s*baad|after|before)\b/.test(q) &&
    /\b(banner|about|faq|header|footer|cta|slider)\b/.test(q)
  ) {
    return false;
  }
  if (/\b(ready\s*section|custom\s*section)\b/.test(q)) return false;
  if (!detectMasterKind(text)) return false;
  return (
    /\b(add|create|banao|bnao|kro|karo|naya|new|daalo|daldo|jod|jodo|lagao)\b/.test(
      q,
    ) || /\b\d+\s+(?:blogs?|services?|gallery|teams?|portfolio)/.test(q)
  );
}

const RESERVED_NAV_PAGE_LABELS = new Set([
  "home",
  "blog",
  "blogs",
  "service",
  "services",
  "gallery",
  "team",
  "teams",
  "portfolio",
  "event",
  "events",
  "property",
  "properties",
]);

const LEGAL_PAGE_CHOICES: AiChoice[] = [
  { id: "legal-page:Privacy Policy", label: "Privacy Policy" },
  { id: "legal-page:Terms & Conditions", label: "Terms & Conditions" },
  { id: "legal-page:Cookie Policy", label: "Cookie Policy" },
  { id: "legal-page:Disclaimer", label: "Disclaimer" },
  { id: "legal-page:Refund Policy", label: "Refund Policy" },
];

function isLegalPageLabel(label: string): boolean {
  const q = label
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!q) return false;
  return (
    /\bprivacy\b/.test(q) ||
    /\bterms?\b/.test(q) ||
    /\bcookie/.test(q) ||
    /\bdisclaimer\b/.test(q) ||
    /\brefund\b/.test(q) ||
    /\bcancellation\b/.test(q) ||
    /\blegal\s*(notice|page|info)?\b/.test(q) ||
    /\bshipping\s+policy\b/.test(q) ||
    /\bacceptable\s+use\b/.test(q)
  );
}

function normalizeLegalPageLabel(label: string): string {
  const q = label.toLowerCase();
  if (/\bprivacy\b/.test(q)) return "Privacy Policy";
  if (/\bterms?\b/.test(q)) return "Terms & Conditions";
  if (/\bcookie/.test(q)) return "Cookie Policy";
  if (/\bdisclaimer\b/.test(q)) return "Disclaimer";
  if (/\brefund\b/.test(q) || /\bcancellation\b/.test(q)) return "Refund Policy";
  if (/\bshipping\b/.test(q)) return "Shipping Policy";
  if (/\blegal\b/.test(q)) return "Legal Notice";
  return label.trim().slice(0, 48);
}

function resolveLegalPageChoice(
  message: string,
  pendingChoices: AiChoice[],
): string | null {
  const raw = message.trim();
  if (!raw) return null;

  const byId = pendingChoices.find((item) => item.id === raw);
  if (byId?.id.startsWith("legal-page:")) {
    return byId.id.slice("legal-page:".length);
  }

  const byLabel = pendingChoices.find(
    (item) => item.label.trim().toLowerCase() === raw.toLowerCase(),
  );
  if (byLabel?.id.startsWith("legal-page:")) {
    return byLabel.id.slice("legal-page:".length);
  }
  if (byLabel && isLegalPageLabel(byLabel.label)) {
    return normalizeLegalPageLabel(byLabel.label);
  }

  if (isLegalPageLabel(raw)) return normalizeLegalPageLabel(raw);
  return null;
}

function mentionsNavMenu(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  return (
    /\b(nav\s*menu|navigation|header\s*menu|in\s+(the\s+)?nav)\b/.test(q) ||
    /\bmenu\s*(mein|me|mai)\b/.test(q) ||
    // "add menu after About" / "menu after About" / "add to menu"
    (/\bmenu\b/.test(q) &&
      /\b(after|before|ke\s*baad|add|daalo|daldo|lagao|jodo|put|place)\b/.test(
        q,
      ))
  );
}

/** True when user is creating a named inner page (not a blog/service item). */
function isNamedCustomPageCreate(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q || !/\bpage\b/.test(q)) return false;
  if (
    !/\b(add|create|new|naya|banao|bnao|kro|karo|daalo|daldo|jod|jodo|lagao)\b/.test(
      q,
    ) &&
    !/\bpage\s+(banao|bnao|add|create|bana)\b/.test(q)
  ) {
    return false;
  }
  const label = extractPageLabel(text);
  return Boolean(label);
}

function wantsCreatePageIntent(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  if (wantsAddBreadcrumb(text)) return false;
  if (/\b(ready\s*section|custom\s*section)\b/.test(q)) return false;
  // Explicit section/card/block requests stay on the section flow.
  if (/\b(section|seciton|card|block)\b/.test(q)) {
    return false;
  }
  // Placement answers for sections ("After About") are not page creates.
  if (/^(after|before|at\s+the\s+end)\b/.test(q)) return false;
  return isNamedCustomPageCreate(text);
}

function wantsAddPage(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  // Pure nav placement (no new page name) is handled separately.
  if (mentionsNavMenu(q) && !extractPageLabel(text)) return false;
  // Create + "add menu after X" is handled by wantsAddPageAndPlaceInNav.
  if (mentionsNavMenu(q) && extractNavAfterLabel(text)) return false;
  return wantsCreatePageIntent(text);
}

function wantsAddBreadcrumb(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  if (!/\b(bread\s*crumb|breadcrumb|bredcrumb|bredcrum|breadcrum)\b/.test(q)) {
    return false;
  }
  return /\b(add|create|naya|new|banao|bnao|lagao|daalo|daldo|jodo|kro|karo)\b/.test(
    q,
  );
}

function extractBreadcrumbPageLabel(
  text: string,
  currentPage?: string | null,
): string {
  const patterns = [
    /\b(?:in|on|to|for|pe|par|mai|mein|me)\s+([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+page\b/i,
    /\b([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+page\s+(?:pe|par|mai|mein|me|par)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    let label = match?.[1]?.replace(/\s+/g, " ").trim() || "";
    label = label
      .replace(
        /^(a|an|the|ek|naya|new|add|bread\s*crumb|breadcrumb|bredcrumb|bredcrum|breadcrum)\s+/i,
        "",
      )
      .trim();
    if (
      label &&
      !/^(this|that|current|ye|is|home|ready|custom)$/i.test(label)
    ) {
      return label.slice(0, 48);
    }
  }
  if (currentPage?.trim() && !/^home$/i.test(currentPage.trim())) {
    return currentPage.trim();
  }
  return "current";
}

function buildAddBreadcrumb(
  message: string,
  langSource: string,
  currentPage?: string | null,
): AiAssistResponse {
  const hindi =
    /[^\u0000-\u007f]/.test(langSource) ||
    /\b(banao|bnao|kro|karo|daalo|page|pe)\b/i.test(langSource);
  const pageLabel = extractBreadcrumbPageLabel(message, currentPage);
  return {
    reply: hindi
      ? `"${pageLabel === "current" ? "Current" : pageLabel}" page pe breadcrumb add kar raha hoon.`
      : `Adding a breadcrumb to the "${pageLabel === "current" ? "current" : pageLabel}" page.`,
    actions: [{ type: "addBreadcrumb", pageLabel }],
    choices: [],
  };
}

function wantsPlacePageInNav(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  if (!mentionsNavMenu(q)) return false;
  // Creating a brand-new named page + menu belongs to wantsAddPageAndPlaceInNav.
  if (wantsCreatePageIntent(text) && extractNavAfterLabel(text)) return false;
  const hasPlace =
    /\b(add|daalo|daldo|lagao|jodo|put|place|include|show)\b/.test(q);
  const hasPageOrThis =
    /\bpage\b/.test(q) ||
    /\b(this|that|current|ye|is|usi)\b/.test(q);
  return hasPlace && hasPageOrThis;
}

function wantsAddPageAndPlaceInNav(text: string): boolean {
  return (
    wantsCreatePageIntent(text) &&
    mentionsNavMenu(text) &&
    Boolean(extractNavAfterLabel(text))
  );
}

function wantsDeletePage(text: string): boolean {
  const q = text.toLowerCase().trim();
  if (!q) return false;
  // Creating a page is not deleting.
  if (wantsCreatePageIntent(text) || wantsAddPageAndPlaceInNav(text)) {
    return false;
  }
  if (
    !/\b(delete|remove|hatao|hata\s*do|discard|unlink)\b/.test(q)
  ) {
    return false;
  }
  // "delete Loan page" OR "delete Loan menu" / "remove Loan from nav"
  return (
    /\bpage\b/.test(q) ||
    /\bmenu\b/.test(q) ||
    /\bnav\b/.test(q) ||
    /\bnavigation\b/.test(q)
  );
}

function extractDeletePageLabel(
  text: string,
  currentPage?: string | null,
): string | null {
  const patterns = [
    /\b(?:delete|remove|hatao|hata\s*do)\s+(?:the\s+|a\s+|an\s+|ek\s+|ak\s+)?([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+(?:page|menu)\b/i,
    /\b(?:delete|remove|hatao|hata\s*do)\s+(?:the\s+|a\s+|an\s+|ek\s+|ak\s+)?([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+from\s+(?:the\s+)?(?:nav|menu|navigation)\b/i,
    /\b([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+page\s+(?:delete|remove|hatao|hata\s*do|delete\s*karo|remove\s*karo)\b/i,
    /\b([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+menu\s+(?:delete|remove|hatao|hata\s*do)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    let label = match?.[1]?.replace(/\s+/g, " ").trim() || "";
    label = label
      .replace(
        /^(a|an|the|ek|ak|naya|new|add|create|delete|remove|from)\s+/i,
        "",
      )
      .trim();
    if (
      label &&
      !/^(this|that|current|ye|is|home|ready|custom|nav|menu)$/i.test(label)
    ) {
      if (label === label.toLowerCase() || label === label.toUpperCase()) {
        label = label
          .toLowerCase()
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }
      return label.slice(0, 48);
    }
  }
  if (currentPage?.trim() && !/^home$/i.test(currentPage.trim())) {
    return currentPage.trim();
  }
  return null;
}

function deletePageConfirmChoices(pageLabel: string): AiChoice[] {
  return [
    { id: `delete-page-yes:${pageLabel}`, label: "Yes" },
    { id: `delete-page-no:${pageLabel}`, label: "No" },
  ];
}

function getPendingDeletePageLabel(pendingChoices: AiChoice[]): string | null {
  for (const choice of pendingChoices) {
    const id = typeof choice?.id === "string" ? choice.id : "";
    if (id.startsWith("delete-page-yes:")) {
      return id.slice("delete-page-yes:".length).trim() || null;
    }
    if (id.startsWith("delete-page-no:")) {
      return id.slice("delete-page-no:".length).trim() || null;
    }
  }
  return null;
}

function getDeletePageLabelFromMessage(message: string): {
  confirm: "yes" | "no";
  label: string;
} | null {
  const yesMatch = message
    .trim()
    .match(/^delete-page-yes:(.+)$/i);
  if (yesMatch?.[1]?.trim()) {
    return { confirm: "yes", label: yesMatch[1].trim() };
  }
  const noMatch = message.trim().match(/^delete-page-no:(.+)$/i);
  if (noMatch?.[1]?.trim()) {
    return { confirm: "no", label: noMatch[1].trim() };
  }
  return null;
}

function resolveDeletePageConfirm(
  message: string,
  pendingChoices: AiChoice[],
): "yes" | "no" | null {
  const fromMessage = getDeletePageLabelFromMessage(message);
  if (fromMessage) return fromMessage.confirm;

  const pageLabel = getPendingDeletePageLabel(pendingChoices);
  if (!pageLabel) return null;

  const q = message.trim().toLowerCase();
  const yesId = `delete-page-yes:${pageLabel}`.toLowerCase();
  const noId = `delete-page-no:${pageLabel}`.toLowerCase();

  if (
    q === yesId ||
    q === "yes" ||
    q === "ha" ||
    q === "haan" ||
    q === "han" ||
    q === "ji" ||
    q === "ok" ||
    q === "okay" ||
    q === "kro" ||
    q === "karo" ||
    q === "sure"
  ) {
    return "yes";
  }
  if (
    q === noId ||
    q === "no" ||
    q === "nahi" ||
    q === "nahin" ||
    q === "na" ||
    q === "cancel" ||
    q === "mat"
  ) {
    return "no";
  }
  return null;
}

function buildDeletePageAsk(
  message: string,
  langSource: string,
  currentPage?: string | null,
): AiAssistResponse {
  const hindi =
    /[^\u0000-\u007f]/.test(langSource) ||
    /\b(hatao|hata|delete|page|karo|kro|sure)\b/i.test(langSource);
  const pageLabel = extractDeletePageLabel(message, currentPage);
  if (!pageLabel) {
    return {
      reply: hindi
        ? "Kaunsa page delete karun? Jaise: delete Gaurav page."
        : "Which page should I delete? For example: delete Gaurav page.",
      actions: [],
      choices: [],
    };
  }
  if (/^home$/i.test(pageLabel)) {
    return {
      reply: hindi
        ? "Home page delete nahi ho sakti."
        : "The Home page cannot be deleted.",
      actions: [],
      choices: [],
    };
  }
  const choices = deletePageConfirmChoices(pageLabel);
  return {
    reply: hindi
      ? `Sure? "${pageLabel}" page delete karun?\n\nYes / No`
      : `Are you sure you want to delete "${pageLabel}" page?\n\nYes / No`,
    actions: [{ type: "ask", options: choices }],
    choices,
  };
}

function buildDeletePageExecute(
  pageLabel: string,
  langSource: string,
): AiAssistResponse {
  const hindi =
    /[^\u0000-\u007f]/.test(langSource) ||
    /\b(hatao|hata|delete|page|karo|kro|yes|ha)\b/i.test(langSource);
  const label = pageLabel.trim();
  if (!label || /^home$/i.test(label)) {
    return {
      reply: hindi
        ? "Home page delete nahi ho sakti."
        : "The Home page cannot be deleted.",
      actions: [],
      choices: [],
    };
  }
  return {
    reply: hindi
      ? `"${label}" page delete kar raha hoon — Pages list, nav menu, aur page sections se.`
      : `Deleting the "${label}" page from Pages, nav menu, and page sections.`,
    actions: [{ type: "deletePage", pageLabel: label }],
    choices: [],
  };
}

/** @deprecated use buildDeletePageAsk — kept for call-site renames */
function buildDeletePage(
  message: string,
  langSource: string,
  currentPage?: string | null,
): AiAssistResponse {
  return buildDeletePageAsk(message, langSource, currentPage);
}

function extractNavAfterLabel(text: string): string | null {
  const afterMatch = text.match(
    /\b(?:after|before)\s+(?:the\s+)?([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)(?:\s+menu)?(?:\s|$)/i,
  );
  if (afterMatch?.[1]) {
    let label = afterMatch[1].replace(/\s+/g, " ").trim();
    label = label.replace(/\s+menu$/i, "").trim();
    if (label && !/^(the|a|an|nav|header)$/i.test(label)) return label;
  }
  const hindiMatch = text.match(
    /\b([A-Za-z][A-Za-z0-9\s&/-]{0,40}?)\s+(?:menu\s+)?ke\s*baad\b/i,
  );
  if (hindiMatch?.[1]) {
    let label = hindiMatch[1].replace(/\s+/g, " ").trim();
    label = label.replace(/^(after|before|the)\s+/i, "").trim();
    if (label) return label;
  }
  return null;
}

function extractPageLabel(text: string): string | null {
  const raw = text.trim();
  if (!raw) return null;

  const patterns = [
    /(?:add|create|new|naya)\s+(?:(?:a|an|ek|ak)\s+)?([A-Za-z][A-Za-z0-9\s&/._-]{0,48}?)\s+page\b/i,
    /\b(?:naya|new)\s+([A-Za-z][A-Za-z0-9\s&/._-]{0,48}?)\s+page\b/i,
    /^([A-Za-z][A-Za-z0-9\s&/._-]{0,48}?)\s+page\s+(?:banao|bnao|add|create|bana|kro|karo)\b/i,
    /\bpage\s+(?:named|called|:)\s*([A-Za-z][A-Za-z0-9\s&/._-]{0,48})/i,
    /\bpage\s+(?:banao|bnao|add|create)\s+(?:named|called|:)?\s*([A-Za-z][A-Za-z0-9\s&/._-]{0,48})/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    let label = match?.[1]?.replace(/\s+/g, " ").trim() || "";
    label = label
      .replace(/^(a|an|the|ek|ak|naya|new|add|create|banao|bnao)\s+/i, "")
      .trim();
    if (!label) continue;
    if (
      /^(ready|custom|home|section|website|site|this|that|current|ye|is|usi|us|ak)$/i.test(
        label,
      )
    ) {
      continue;
    }
    if (RESERVED_NAV_PAGE_LABELS.has(label.toLowerCase())) continue;
    // Title-case short labels; keep mixed case if user typed it that way.
    if (label === label.toLowerCase() || label === label.toUpperCase()) {
      label = label
        .toLowerCase()
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
    return label.slice(0, 48);
  }

  return null;
}

function buildPlacePageInNav(
  message: string,
  langSource: string,
  currentPage?: string | null,
): AiAssistResponse {
  const hindi =
    /[^\u0000-\u007f]/.test(langSource) ||
    /\b(banao|bnao|kro|karo|daalo|menu|baad)\b/i.test(langSource);
  const afterLabel = extractNavAfterLabel(message);
  if (!afterLabel) {
    return {
      reply: hindi
        ? "Nav menu mein kis item ke baad add karun? Jaise: After About."
        : "After which nav item should I place it? For example: After About.",
      actions: [],
      choices: [],
    };
  }

  const extracted = extractPageLabel(message);
  const pageLabel =
    extracted &&
    !/^(this|that|current|ye|is)$/i.test(extracted)
      ? extracted
      : currentPage?.trim() && !/^home$/i.test(currentPage.trim())
        ? currentPage.trim()
        : "current";

  return {
    reply: hindi
      ? `"${pageLabel === "current" ? "Current" : pageLabel}" page ko nav menu mein ${afterLabel} ke baad add kar raha hoon.`
      : `Adding "${pageLabel === "current" ? "the current" : pageLabel}" page to the nav menu after ${afterLabel}.`,
    actions: [
      {
        type: "placePageInNav",
        pageLabel,
        afterLabel,
      },
    ],
    choices: [],
  };
}

function buildAddPageAndPlaceInNav(
  message: string,
  langSource: string,
  isSinglePage = false,
): AiAssistResponse {
  const pageResult = buildAddPage(message, langSource, isSinglePage);
  if (!pageResult.actions.some((action) => action.type === "addPage")) {
    return pageResult;
  }
  const afterLabel = extractNavAfterLabel(message);
  if (!afterLabel) return pageResult;

  const addAction = pageResult.actions.find(
    (action) => action.type === "addPage",
  ) as { type: "addPage"; pageLabel: string };
  const pageLabel = addAction.pageLabel;
  const hindi =
    /[^\u0000-\u007f]/.test(langSource) ||
    /\b(banao|bnao|kro|karo|naya|page|menu|baad)\b/i.test(langSource);

  return {
    reply: hindi
      ? `"${pageLabel}" page bana raha hoon — breadcrumb, hero, ~500 word detail, aur nav menu mein ${afterLabel} ke baad.`
      : `Creating the "${pageLabel}" page with breadcrumb, hero, ~500-word detail, and placing it in the nav after ${afterLabel}.`,
    actions: [
      { type: "addPage", pageLabel },
      { type: "placePageInNav", pageLabel, afterLabel },
    ],
    choices: [],
  };
}

function buildAddPage(
  message: string,
  langSource: string,
  isSinglePage = false,
): AiAssistResponse {
  const hindi =
    /[^\u0000-\u007f]/.test(langSource) ||
    /\b(banao|bnao|kro|karo|naya|page)\b/i.test(langSource);

  let pageLabel = extractPageLabel(message);

  if (isSinglePage) {
    if (pageLabel && isLegalPageLabel(pageLabel)) {
      pageLabel = normalizeLegalPageLabel(pageLabel);
    } else {
      return {
        reply: hindi
          ? "Single-page website pe sirf legal pages ban sakte hain (Privacy, Terms…). Kaunsa banau?"
          : "On a single-page website you can only add legal pages. Which one should I create?",
        actions: [{ type: "ask", options: LEGAL_PAGE_CHOICES }],
        choices: LEGAL_PAGE_CHOICES,
      };
    }
  }

  if (!pageLabel) {
    return {
      reply: hindi
        ? "Naye page ka naam kya rakhun? Jaise: Contact, Admissions, Careers."
        : "What should I name the new page? For example: Contact, Admissions, Careers.",
      actions: [],
      choices: [],
    };
  }

  return {
    reply: hindi
      ? isSinglePage
        ? `"${pageLabel}" legal page bana raha hoon — breadcrumb, hero, aur ~500 word detail section ke saath.`
        : `"${pageLabel}" page bana raha hoon — breadcrumb, hero, aur ~500 word detail section (headings ke saath) ke baad.`
      : isSinglePage
        ? `Creating the "${pageLabel}" legal page with breadcrumb, hero, and a ~500-word detail section.`
        : `Creating the "${pageLabel}" page with breadcrumb, hero, and a ~500-word detail section with headings.`,
    actions: [{ type: "addPage", pageLabel }],
    choices: [],
  };
}

const MASTER_MIN_CONTENT_WORDS = 500;
/** Soft target for master detail bodies (incl. short section headings). */
const MASTER_TARGET_CONTENT_WORDS = 550;
/** Max master items created in one AI request (blogs, services, events, …). */
const MASTER_MAX_ITEMS = 50;

function countPlainWords(text: string): number {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Ensure master detail bodies use HTML with a few short h2 section headings. */
function normalizeMasterContentHtml(
  raw: string,
  title: string,
): string {
  let text = (raw || "").trim();
  if (!text) return text;

  // Strip accidental wrappers / fences from the model.
  text = text
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/<\/?(?:html|body|article)[^>]*>/gi, "")
    .trim();

  // Markdown headings → HTML
  text = text.replace(/^#{1,3}\s+(.+)$/gm, (_match, heading: string) => {
    const clean = String(heading || "")
      .replace(/[#*_`]/g, "")
      .trim();
    return clean ? `<h2>${clean}</h2>` : "";
  });

  if (/<h2[\s>]/i.test(text)) {
    // Plain paragraphs without tags → wrap leftover blocks lightly
    if (!/<\/?[a-z][\s\S]*>/i.test(text.replace(/<\/?h2[^>]*>/gi, ""))) {
      text = text
        .split(/\n{2,}/)
        .map((block) => {
          const part = block.trim();
          if (!part) return "";
          if (/^<h2[\s>]/i.test(part)) return part;
          return `<p>${part}</p>`;
        })
        .filter(Boolean)
        .join("\n");
    }
    return text;
  }

  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!blocks.length) return text;

  const topic = title.trim() || "Overview";
  const headingPool = [
    `About ${topic}`.split(/\s+/).slice(0, 5).join(" "),
    "Key benefits",
    "How it works",
    "What to expect",
    "Next steps",
  ];
  const headingCount = Math.min(5, Math.max(3, Math.ceil(blocks.length / 2)));
  const chunkSize = Math.max(1, Math.ceil(blocks.length / headingCount));
  const parts: string[] = [];
  for (let index = 0; index < headingCount; index += 1) {
    const slice = blocks.slice(index * chunkSize, (index + 1) * chunkSize);
    if (!slice.length) break;
    parts.push(`<h2>${headingPool[index] || `Section ${index + 1}`}</h2>`);
    for (const paragraph of slice) {
      if (/^<p[\s>]/i.test(paragraph)) parts.push(paragraph);
      else parts.push(`<p>${paragraph}</p>`);
    }
  }
  return parts.join("\n");
}

function masterImagePool(category: {
  stockImages: string[];
}): string[] {
  const pooled = [...category.stockImages, ...STOCK_IMAGES];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of pooled) {
    const key = src.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(src);
  }
  return out.length ? out : ["/bg1.jpg"];
}

function assignUniqueMasterImages(
  count: number,
  category: { stockImages: string[] },
): string[] {
  const pool = masterImagePool(category);
  const start = Math.floor(Math.random() * pool.length);
  return Array.from({ length: count }, (_, index) => {
    return pool[(start + index) % pool.length];
  });
}

/** Local fallback: topic-wise HTML body (~550 words) with 3–5 short h2 headings. */
function buildMasterTopicContent(
  title: string,
  master: MasterKind,
  categoryLabel: string,
): string {
  const topic = title.trim() || master;
  const kindLabel =
    master === "blog"
      ? "article"
      : master === "service"
        ? "service offering"
        : master === "portfolio"
          ? "portfolio project"
          : master === "team"
            ? "team profile"
            : master === "event"
              ? "event listing"
              : master === "property"
                ? "property listing"
                : master === "country"
                  ? "country listing"
                  : "gallery story";

  const headings = [
    `Why ${topic} matters`,
    `How ${topic} works`,
    `What you can expect`,
    `Practical next steps`,
  ].map((heading) => {
    const words = heading.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 5) return heading;
    return words.slice(0, 5).join(" ");
  });

  const sections: Array<{ heading: string; paragraphs: string[] }> = [
    {
      heading: headings[0],
      paragraphs: [
        `${topic} is a focused ${kindLabel} created for a ${categoryLabel} website audience. This page explains why the topic matters, who it helps, and how visitors can take the next step with confidence.`,
        `People looking for ${topic} usually want clear guidance, practical examples, and trustworthy details. Here we cover the purpose of ${topic}, the outcomes you can expect, and the approach that keeps quality consistent from first contact to delivery.`,
      ],
    },
    {
      heading: headings[1],
      paragraphs: [
        `In the context of ${categoryLabel}, ${topic} connects everyday needs with a structured plan. Visitors learn what is included, what makes this offering different, and how the experience is designed for real-world results rather than generic promises.`,
        `A strong ${kindLabel} on ${topic} starts with understanding the audience. Families, students, clients, and partners each bring different questions. This content answers those questions in plain language while keeping a professional tone that fits the brand.`,
        `Implementation matters as much as inspiration. For ${topic}, we outline the steps, timelines, and checkpoints that keep work organized. That includes discovery, planning, delivery, review, and ongoing support so improvements continue after launch.`,
      ],
    },
    {
      heading: headings[2],
      paragraphs: [
        `Quality for ${topic} also means measurable progress. Clear goals, simple reporting, and honest communication help stakeholders see value early. When people understand the process, they engage more and recommend the experience to others.`,
        `Community and culture strengthen ${topic}. Stories, testimonials, and practical tips show how similar visitors succeeded. These examples turn abstract benefits into concrete moments people can picture for themselves.`,
        `Accessibility and clarity remain priorities throughout this ${kindLabel}. Content about ${topic} should be easy to scan on mobile, useful for first-time readers, and detailed enough for anyone comparing options seriously.`,
      ],
    },
    {
      heading: headings[3],
      paragraphs: [
        `Next steps for ${topic} are intentionally simple: explore related pages, speak with the team, or start an inquiry. The goal is momentum — move from curiosity to action without friction or confusion.`,
        `Ultimately, ${topic} represents a commitment to thoughtful ${categoryLabel} experiences. By combining expertise, care, and transparent communication, this page gives visitors everything they need to decide with confidence.`,
      ],
    },
  ];

  const intro = `<p>${topic} brings clear value for ${categoryLabel} visitors who want practical information, trustworthy guidance, and a confident next step. This ${kindLabel} page is written to be easy to scan while still covering the details people compare before they decide.</p>`;

  const buildHtml = () =>
    [
      intro,
      ...sections.flatMap((section) => [
        `<h2>${section.heading}</h2>`,
        ...section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`),
      ]),
    ].join("\n");

  let html = buildHtml();
  let guard = 0;
  while (
    countPlainWords(html) < MASTER_MIN_CONTENT_WORDS &&
    guard < 12
  ) {
    sections[sections.length - 1].paragraphs.push(
      `Additional depth on ${topic}: practical checklists, common mistakes to avoid, recommended resources, and FAQs that appear during research. Visitors comparing alternatives for ${topic} benefit from transparent cues, eligibility notes, and contact paths that remove guesswork. Every paragraph reinforces how ${categoryLabel} standards shape delivery, safety, and long-term value around ${topic}.`,
    );
    html = buildHtml();
    guard += 1;
  }

  while (countPlainWords(html) < MASTER_MIN_CONTENT_WORDS) {
    html += `\n<p>${topic} continues to deliver relevant insights for ${categoryLabel} audiences seeking dependable information, clear benefits, and a confident next step.</p>`;
  }

  // Soft cap near target so pages stay readable (~550 words).
  if (countPlainWords(html) > MASTER_TARGET_CONTENT_WORDS + 80) {
    const parts = html.split(/(?=<h2>)/i);
    while (
      parts.length > 4 &&
      countPlainWords(parts.join("")) > MASTER_TARGET_CONTENT_WORDS + 40
    ) {
      parts.pop();
    }
    html = parts.join("").trim() || html;
  }

  return html.trim();
}

function buildMasterShortDesc(title: string, master: MasterKind): string {
  if (master === "blog") {
    return `Explore ${title} with practical insights, clear examples, and actionable takeaways.`;
  }
  if (master === "team") {
    return `${title} brings expertise, collaboration, and a people-first approach to every project.`;
  }
  if (master === "gallery") {
    return `A visual highlight of ${title} — moments, work, and atmosphere from our community.`;
  }
  if (master === "portfolio") {
    return `${title} showcases goals, process, and results from a real-world engagement.`;
  }
  if (master === "event") {
    return `Join us for ${title} — a memorable gathering with clear details and a warm welcome.`;
  }
  if (master === "property") {
    return `${title} offers a well-planned space with practical details for serious buyers and renters.`;
  }
  if (master === "country") {
    return `${title} — local programs and support for families and communities in this market.`;
  }
  return `${title} delivers focused support with clear outcomes for the people we serve.`;
}

function buildMasterSeoMeta(params: {
  title: string;
  desc?: string;
  master: MasterKind;
  categoryLabel: string;
  category?: string;
}): {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
} {
  const title = params.title.trim() || params.master;
  const kindLabel =
    params.master === "blog"
      ? "Blog"
      : params.master === "service"
        ? "Service"
        : params.master === "gallery"
          ? "Gallery"
          : params.master === "team"
            ? "Team"
            : params.master === "portfolio"
              ? "Portfolio"
              : params.master === "event"
                ? "Event"
                : "Property";
  const desc =
    (params.desc || "").trim() ||
    buildMasterShortDesc(title, params.master);
  const seoTitle = `${title} | ${kindLabel}`.slice(0, 70);
  const seoDescription = desc.slice(0, 160);
  const keywordParts = [
    title,
    params.category?.trim() || kindLabel,
    params.categoryLabel.trim(),
    kindLabel.toLowerCase(),
    params.master === "property" ? "real estate" : "",
    params.master === "event" ? "upcoming event" : "",
  ]
    .map((part) => part.trim())
    .filter(Boolean);
  const seoKeywords = Array.from(new Set(keywordParts)).join(", ");
  return { seoTitle, seoDescription, seoKeywords };
}

async function generateMasterItemContent(params: {
  apiKey: string;
  model: string;
  master: MasterKind;
  title: string;
  siteContext: string;
  categoryLabel: string;
  userMessage: string;
}): Promise<string | null> {
  const kindLabel =
    params.master === "blog"
      ? "blog article"
      : params.master === "service"
        ? "service detail page"
        : params.master === "portfolio"
          ? "portfolio case study"
          : params.master === "team"
            ? "team member profile"
            : params.master === "event"
              ? "event detail page"
              : params.master === "property"
                ? "property listing page"
                : params.master === "country"
                  ? "country listing page"
                  : "gallery item story";

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: `You write long-form website page content for CSS Founder.
Return ONLY HTML body fragments using <h2> and <p> tags. No markdown. No JSON. No <html>/<body> wrapper. No page title as an h1.
Write about ${MASTER_TARGET_CONTENT_WORDS} words total (minimum ${MASTER_MIN_CONTENT_WORDS}), counting heading text too.
Include 3 to 5 section headings as <h2>...</h2>. Each heading must be short (3 to 5 words).
Put useful <p> paragraphs under each heading. Do not invent fake contact numbers.
Language: English website copy unless the user clearly asked for Hindi content.`,
    },
    {
      role: "user",
      content: JSON.stringify({
        siteContext: params.siteContext,
        category: params.categoryLabel,
        pageType: kindLabel,
        topicTitle: params.title,
        userRequest: params.userMessage,
        minWords: MASTER_MIN_CONTENT_WORDS,
        targetWords: MASTER_TARGET_CONTENT_WORDS,
        instruction: `Write a complete ${kindLabel} body about "${params.title}" as HTML with 3–5 short <h2> headings (3–5 words each) and paragraphs. Aim for ~${MASTER_TARGET_CONTENT_WORDS} words including headings (min ${MASTER_MIN_CONTENT_WORDS}). Topic-wise, useful, unique. Plain text without headings is not allowed.`,
      }),
    },
  ];

  try {
    let response = await callOpenAi({
      apiKey: params.apiKey,
      model: params.model,
      messages,
      useJsonFormat: false,
      temperature: 0.85,
    });
    if (!response.ok) {
      response = await callOpenAi({
        apiKey: params.apiKey,
        model: params.model,
        messages,
        useJsonFormat: false,
        temperature: 0.7,
      });
    }
    if (!response.ok) return null;
    const data = (await response.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = (data.choices?.[0]?.message?.content || "").trim();
    if (!text || countPlainWords(text) < 120) return null;
    const normalized = normalizeMasterContentHtml(text, params.title);
    if (countPlainWords(normalized) >= MASTER_MIN_CONTENT_WORDS) {
      return normalized;
    }
    // Pad lightly if model undershoots
    return normalizeMasterContentHtml(
      `${normalized}\n${buildMasterTopicContent(
        params.title,
        params.master,
        params.categoryLabel,
      )}`,
      params.title,
    ).trim();
  } catch {
    return null;
  }
}

async function enrichAddMasterItemsResponse(params: {
  response: AiAssistResponse;
  apiKey?: string;
  model: string;
  siteContext: string;
  userMessage: string;
  country: CountryHint;
  category: {
    id: string;
    label: string;
    folder: string;
    imageKeywords: string[];
    stockImages: string[];
  };
}): Promise<AiAssistResponse> {
  const action = params.response.actions.find(
    (item) => item.type === "addMasterItems",
  );
  if (!action || action.type !== "addMasterItems") return params.response;

  const master = action.master;
  const needsLongContent =
    master === "blog" ||
    master === "service" ||
    master === "portfolio" ||
    master === "team" ||
    master === "event" ||
    master === "property" ||
    master === "country";

  const avoidFingerprints = new Set<string>();
  const usedMagnificIds = new Set<number>();
  const usedImages = new Set<string>();

  const enrichedItems = [];
  for (let index = 0; index < action.items.length; index += 1) {
    const item = action.items[index];
    let content = typeof item.content === "string" ? item.content : "";
    let desc = typeof item.desc === "string" ? item.desc : "";
    let image = typeof item.image === "string" ? item.image.trim() : "";

    if (needsLongContent) {
      if (params.apiKey && countPlainWords(content) < MASTER_MIN_CONTENT_WORDS) {
        const aiContent = await generateMasterItemContent({
          apiKey: params.apiKey,
          model: params.model,
          master,
          title: item.title,
          siteContext: params.siteContext,
          categoryLabel: params.category.label,
          userMessage: params.userMessage,
        });
        if (aiContent) content = aiContent;
      }
      if (countPlainWords(content) < MASTER_MIN_CONTENT_WORDS) {
        content = buildMasterTopicContent(
          item.title,
          master,
          params.category.label,
        );
      }
      content = normalizeMasterContentHtml(content, item.title);
      if (!desc.trim()) {
        desc = buildMasterShortDesc(item.title, master);
      }
    }

    // Prefer a unique downloaded online image per item
    let nextImage = image;
    const online = await fetchOnlineStockImage(
      master === "blog"
        ? "About"
        : master === "service"
          ? "Product"
          : master === "portfolio"
            ? "Gallery"
            : master === "team"
              ? "WhyChooseUs"
              : master === "event"
                ? "Gallery"
                : master === "property"
                  ? "Product"
                  : master === "country"
                    ? "Product"
                    : "Gallery",
      params.country,
      params.category,
      avoidFingerprints,
      usedMagnificIds,
      [item.title, desc, `item${index}`].filter(Boolean),
    );
    if (online) {
      nextImage = online;
      usedImages.add(online.toLowerCase());
    } else if (!nextImage || usedImages.has(nextImage.toLowerCase())) {
      const locals = assignUniqueMasterImages(
        action.items.length + 2,
        params.category,
      );
      nextImage =
        locals.find((src) => !usedImages.has(src.toLowerCase())) ||
        locals[index % locals.length];
      usedImages.add(nextImage.toLowerCase());
    } else {
      usedImages.add(nextImage.toLowerCase());
    }

    enrichedItems.push({
      ...item,
      desc: desc || item.desc,
      content: needsLongContent ? content : item.content,
      image: nextImage,
      ...(() => {
        const existingTitle =
          typeof item.seoTitle === "string" ? item.seoTitle.trim() : "";
        const existingDesc =
          typeof item.seoDescription === "string"
            ? item.seoDescription.trim()
            : "";
        const existingKeywords =
          typeof item.seoKeywords === "string" ? item.seoKeywords.trim() : "";
        if (existingTitle && existingDesc && existingKeywords) {
          return {
            seoTitle: existingTitle.slice(0, 70),
            seoDescription: existingDesc.slice(0, 160),
            seoKeywords: existingKeywords,
          };
        }
        return buildMasterSeoMeta({
          title: item.title,
          desc: desc || item.desc,
          master,
          categoryLabel: params.category.label,
          category:
            typeof item.category === "string" ? item.category : undefined,
        });
      })(),
    });
  }

  const english = isMostlyEnglish(params.userMessage);
  return {
    ...params.response,
    reply: english
      ? `${params.response.reply} Each item has topic-wise content (~550 words with section headings), SEO meta, and a unique image.`
      : `${params.response.reply} Har item pe topic-wise content (~550 words with headings), SEO meta, aur alag image set ki.`,
    actions: [
      {
        type: "addMasterItems",
        master,
        headerSubmenu: action.headerSubmenu,
        headerSubmenuMode: action.headerSubmenuMode,
        headerSubmenuMerge: action.headerSubmenuMerge,
        items: enrichedItems,
      },
    ],
  };
}

function buildAddMasterItems(
  message: string,
  category?: {
    id: string;
    label: string;
    folder: string;
    imageKeywords: string[];
    stockImages: string[];
  } | null,
  forceMaster?: MasterKind | null,
): AiAssistResponse {
  const resolvedCategory =
    category && typeof category === "object" && "stockImages" in category
      ? category
      : {
          id: "school",
          label: "School",
          folder: "school",
          imageKeywords: ["school", "education", "campus"],
          stockImages: [
            "/categories/school/bg11.jpg",
            "/categories/school/bg22.jpg",
            "/categories/school/bg33.png",
            "/bg1.jpg",
          ],
        };

  const master = forceMaster || detectMasterKind(message) || "blog";
  const count = extractMasterItemCount(message);
  const customTitles = extractMasterItemTitles(message, count);
  const countryTarget =
    master === "country" ? extractCountryListingTarget(message) : null;
  const defaults = MASTER_DEFAULT_TITLES[master];
  const itemCount = Math.min(
    MASTER_MAX_ITEMS,
    Math.max(count, customTitles?.length || 0) || 1,
  );
  const countryTitles =
    master === "country" && !customTitles?.length
      ? buildCountryListingTitles(
          countryTarget || "India",
          itemCount,
          resolvedCategory.id || resolvedCategory.label,
        )
      : null;
  const images = assignUniqueMasterImages(itemCount, resolvedCategory);
  const needsLongContent =
    master === "blog" ||
    master === "service" ||
    master === "portfolio" ||
    master === "team" ||
    master === "event" ||
    master === "property" ||
    master === "country";

  const items = Array.from({ length: itemCount }, (_, index) => {
    const title =
      customTitles?.[index] ||
      countryTitles?.[index] ||
      defaults[index % defaults.length] ||
      `${master} ${index + 1}`;
    const desc = buildMasterShortDesc(title, master);
    const content = needsLongContent
      ? buildMasterTopicContent(title, master, resolvedCategory.label)
      : undefined;
    const category =
      master === "blog"
        ? "General"
        : master === "service"
          ? "Service"
          : master === "team"
            ? "Team"
            : master === "portfolio"
              ? "Portfolio"
              : master === "event"
                ? "Event"
                : master === "property"
                  ? "Residential"
                  : master === "country"
                    ? countryTarget || "India"
                    : "Gallery";
    const seo = buildMasterSeoMeta({
      title,
      desc,
      master,
      categoryLabel: resolvedCategory.label,
      category,
    });
    return {
      title,
      desc,
      content,
      author: master === "blog" ? "Website author" : undefined,
      category,
      image: images[index] || "/bg1.jpg",
      ...seo,
    };
  });

  const english = isMostlyEnglish(message);
  const labels: Record<MasterKind, { en: string; hi: string }> = {
    blog: { en: "blog post(s)", hi: "blog post(s)" },
    service: { en: "service(s)", hi: "service(s)" },
    gallery: { en: "gallery item(s)", hi: "gallery item(s)" },
    team: { en: "team member(s)", hi: "team member(s)" },
    portfolio: { en: "portfolio item(s)", hi: "portfolio item(s)" },
    event: { en: "event(s)", hi: "event(s)" },
    property: { en: "property listing(s)", hi: "property listing(s)" },
    country: { en: "country listing(s)", hi: "country listing(s)" },
  };
  const label = english ? labels[master].en : labels[master].hi;
  return {
    reply: english
      ? `Adding ${itemCount} ${label} to the ${master} master page — each with unique images, SEO meta${needsLongContent ? ", and ~550 word content with section headings" : ""}.`
      : `${itemCount} ${label} ${master} master page pe add kar raha hoon — har ek ki alag image, SEO meta${needsLongContent ? ", aur ~550 words content with headings" : ""}.`,
    actions: [
      {
        type: "addMasterItems",
        master,
        items,
      },
    ],
    choices: [],
  };
}

/** "CTA Card add" / "add card after Banner" — custom CTA block, not button text. */
function wantsAddCtaCard(text: string): boolean {
  const q = text.toLowerCase();
  const wantsAdd =
    /\b(add|naya|new|daalo|daldo|jod|jodo|banao|lagao|dal)\b/.test(q) ||
    /\badd\s*kro\b/.test(q);
  if (!wantsAdd) return false;
  return (
    /\bcta\s*card\b/.test(q) ||
    /\b(promo\s*card|action\s*card)\b/.test(q) ||
    (/\bcta\b/.test(q) && /\b(card|section|block)\b/.test(q)) ||
    (/\bcard\b/.test(q) &&
      /\b(add|naya|new)\b/.test(q) &&
      !/\b(faq|gallery|credit)\b/.test(q))
  );
}

type CtaLookVariant = {
  id: string;
  label: string;
  bg: string;
  align: "center" | "left";
  title: string;
  desc: string;
  titleColor: string;
  descColor: string;
  buttonLabel: string;
  buttonBg: string;
  buttonText: string;
  buttonRadius: number;
  buttonVariant?: "primary" | "secondary";
  paddingY: number;
};

const CTA_LOOK_VARIANTS: CtaLookVariant[] = [
  {
    id: "teal-center",
    label: "teal band + white pill button",
    bg: "#0f766e",
    align: "center",
    title: "Build your child's brightest future",
    desc: "Admissions open — visit campus, meet teachers, and see how we nurture every learner.",
    titleColor: "#ffffff",
    descColor: "rgba(255,255,255,0.9)",
    buttonLabel: "Book a Campus Visit",
    buttonBg: "#ffffff",
    buttonText: "#0f766e",
    buttonRadius: 999,
    paddingY: 72,
  },
  {
    id: "soft-light",
    label: "soft light panel + solid teal button",
    bg: "#f3f6f5",
    align: "center",
    title: "A calmer path to confident learning",
    desc: "Small classes, clear progress updates, and teachers who know every student by name.",
    titleColor: "#0f172a",
    descColor: "#475569",
    buttonLabel: "Talk to Admissions",
    buttonBg: "#0f766e",
    buttonText: "#ffffff",
    buttonRadius: 10,
    paddingY: 64,
  },
  {
    id: "navy-left",
    label: "navy strip + left-aligned amber CTA",
    bg: "#0c1f2e",
    align: "left",
    title: "Start the school year with clarity",
    desc: "Tour the campus this week and get a personal walkthrough of classrooms, labs, and activities.",
    titleColor: "#f8fafc",
    descColor: "rgba(248,250,252,0.82)",
    buttonLabel: "Schedule a Tour",
    buttonBg: "#f59e0b",
    buttonText: "#111827",
    buttonRadius: 8,
    paddingY: 68,
  },
  {
    id: "ink-outline",
    label: "charcoal band + outline button",
    bg: "#111827",
    align: "center",
    title: "Where curiosity becomes confidence",
    desc: "From first inquiry to first day — we keep parents informed and students excited.",
    titleColor: "#fef3c7",
    descColor: "rgba(255,255,255,0.78)",
    buttonLabel: "Apply Now",
    buttonBg: "transparent",
    buttonText: "#ffffff",
    buttonRadius: 999,
    buttonVariant: "secondary",
    paddingY: 70,
  },
  {
    id: "sand-warm",
    label: "warm sand background + dark button",
    bg: "#ebe4d4",
    align: "center",
    title: "Learning that feels personal",
    desc: "Balanced academics, sports, and arts — designed for real growth, not just report cards.",
    titleColor: "#1c1917",
    descColor: "#57534e",
    buttonLabel: "Explore Programs",
    buttonBg: "#1c1917",
    buttonText: "#fafaf9",
    buttonRadius: 6,
    paddingY: 66,
  },
];

function detectCtaLookIndex(existing?: SectionSnapshot | null): number {
  const bg = String(existing?.data?.sectionBackgroundColor || "")
    .trim()
    .toLowerCase();
  if (!bg) return -1;
  return CTA_LOOK_VARIANTS.findIndex((item) => item.bg.toLowerCase() === bg);
}

function pickCtaLookVariant(
  existing?: SectionSnapshot | null,
  forceNext = false,
): CtaLookVariant {
  const current = detectCtaLookIndex(existing);
  if (forceNext) {
    const next =
      current < 0 ? 1 % CTA_LOOK_VARIANTS.length : (current + 1) % CTA_LOOK_VARIANTS.length;
    return CTA_LOOK_VARIANTS[next];
  }
  if (current >= 0) return CTA_LOOK_VARIANTS[current];
  return CTA_LOOK_VARIANTS[0];
}

function buildCtaCardAdd(afterSectionHint?: string): AiAssistResponse {
  const look = CTA_LOOK_VARIANTS[0];
  const polished = polishedCtaFields(null, look);
  const columns = polished.columns as Array<{
    elements?: Array<Record<string, unknown>>;
  }>;
  const elements = (columns[0]?.elements || []).map((el) => ({
    columnIndex: 0,
    type: (el.type as "text" | "image" | "button" | "table") || "text",
    value: typeof el.value === "string" ? el.value : undefined,
    href: typeof el.href === "string" ? el.href : undefined,
  }));

  return {
    reply: `Banner ke baad CTA Card add kar diya (${look.label}). Page pe check kar lo.`,
    actions: [
      {
        type: "addCustomSection",
        layoutId: "single",
        afterSectionHint: afterSectionHint || "Banner",
        sectionFields: {
          sectionBackgroundColor: polished.sectionBackgroundColor,
          sectionBackgroundImage: "",
          sectionPadding: polished.sectionPadding,
        },
        elements,
      },
    ],
    choices: [],
  };
}

function findCtaCustomSection(
  sections: SectionSnapshot[],
): SectionSnapshot | null {
  const customs = sections.filter(
    (section) => section.type === "CustomSection" && !section.page,
  );
  const withButton = [...customs].reverse().find((section) => {
    const columns = section.data?.columns;
    if (!Array.isArray(columns)) return false;
    return columns.some((column) => {
      if (!column || typeof column !== "object") return false;
      const elements = (column as { elements?: unknown }).elements;
      if (!Array.isArray(elements)) return false;
      return elements.some(
        (el) =>
          el &&
          typeof el === "object" &&
          (el as { type?: string }).type === "button",
      );
    });
  });
  return withButton || customs[customs.length - 1] || null;
}

function polishedCtaFields(
  existing?: SectionSnapshot | null,
  look?: CtaLookVariant,
  options?: { withImage?: boolean; imageSrc?: string },
): Record<string, unknown> {
  const variant = look || pickCtaLookVariant(existing, false);
  const withImage = Boolean(options?.withImage);
  const imageSrc =
    options?.imageSrc ||
    STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)] ||
    "/bg1.jpg";
  const columnsRaw = existing?.data?.columns;
  const firstCol =
    Array.isArray(columnsRaw) &&
    columnsRaw[0] &&
    typeof columnsRaw[0] === "object"
      ? (columnsRaw[0] as Record<string, unknown>)
      : {};
  const secondCol =
    Array.isArray(columnsRaw) &&
    columnsRaw[1] &&
    typeof columnsRaw[1] === "object"
      ? (columnsRaw[1] as Record<string, unknown>)
      : {};
  const colId =
    typeof firstCol.id === "string" && firstCol.id.trim()
      ? firstCol.id
      : "cta-column";
  const colId2 =
    typeof secondCol.id === "string" && secondCol.id.trim()
      ? secondCol.id
      : "cta-column-2";

  const titleHtml = `<p style="margin:0;font-size:2rem;font-weight:700;letter-spacing:-0.02em;color:${variant.titleColor};text-align:${variant.align};">${variant.title}</p>`;
  const descHtml = `<p style="margin:12px ${variant.align === "center" ? "auto" : "0"} 0;max-width:36rem;font-size:1.05rem;line-height:1.65;color:${variant.descColor};text-align:${variant.align};">${variant.desc}</p>`;

  const textElements = [
    {
      id: "cta-title",
      type: "text",
      align: variant.align,
      value: titleHtml,
    },
    {
      id: "cta-desc",
      type: "text",
      align: variant.align,
      value: descHtml,
    },
    {
      id: "cta-btn",
      type: "button",
      align: variant.align,
      value: variant.buttonLabel,
      href: "#contact",
      buttonVariant: variant.buttonVariant || "primary",
      buttonBackgroundColor: variant.buttonBg,
      buttonTextColor: variant.buttonText,
      buttonBorderRadius: variant.buttonRadius,
    },
  ];

  if (withImage) {
    return {
      layout: "two-columns",
      sectionBackgroundColor: variant.bg,
      sectionBackgroundImage: "",
      sectionPadding: {
        desktop: {
          top: variant.paddingY,
          right: 24,
          bottom: variant.paddingY,
          left: 24,
        },
        tablet: {
          top: Math.max(48, variant.paddingY - 16),
          right: 20,
          bottom: Math.max(48, variant.paddingY - 16),
          left: 20,
        },
        mobile: {
          top: Math.max(40, variant.paddingY - 24),
          right: 16,
          bottom: Math.max(40, variant.paddingY - 24),
          left: 16,
        },
      },
      columns: [
        {
          id: colId,
          contentAlignH: "center",
          contentAlignV: "center",
          elements: [
            {
              id: "cta-image",
              type: "image",
              src: imageSrc,
              imageStyle: "cover",
            },
          ],
        },
        {
          id: colId2,
          contentAlignH: variant.align === "left" ? "left" : "center",
          contentAlignV: "center",
          elements: textElements.map((el) => ({
            ...el,
            align: variant.align === "left" ? "left" : "center",
          })),
        },
      ],
    };
  }

  return {
    layout: "single",
    sectionBackgroundColor: variant.bg,
    sectionBackgroundImage: "",
    sectionPadding: {
      desktop: {
        top: variant.paddingY,
        right: 24,
        bottom: variant.paddingY,
        left: 24,
      },
      tablet: {
        top: Math.max(48, variant.paddingY - 16),
        right: 20,
        bottom: Math.max(48, variant.paddingY - 16),
        left: 20,
      },
      mobile: {
        top: Math.max(40, variant.paddingY - 24),
        right: 16,
        bottom: Math.max(40, variant.paddingY - 24),
        left: 16,
      },
    },
    columns: [
      {
        id: colId,
        contentAlignH: variant.align,
        contentAlignV: "center",
        elements: textElements,
      },
    ],
  };
}

function wantsCtaImageAdd(text: string): boolean {
  const q = text.toLowerCase();
  const hasImage = /\b(image|img|photo|picture|pic)\b/.test(q);
  if (!hasImage) return false;
  return (
    /\b(cta|custom\s*section|cta\s*card)\b/.test(q) ||
    (/\b(jo\s*bn[aiy]+|usmai|usme|uska|usko|ata\s+jo)\b/.test(q) &&
      /\b(cta|card|look|change)\b/.test(q))
  );
}

function wantsImproveCtaLook(text: string, prevAssistant = ""): boolean {
  const q = text.toLowerCase();
  const prev = prevAssistant.toLowerCase();
  if (wantsCtaImageAdd(text)) return true;
  const mentionsLook =
    /\b(look|design|style|ui|layout|achha|accha|sundar|better|improve|upgrade|polish|alag|different|naya)\b/.test(
      q,
    ) || /\b(achha\s*bnao|accha\s*banao|achaa\s*nhi|achha\s*nhi)\b/.test(q);
  if (!mentionsLook) return false;

  const mentionsCta =
    /\b(cta|card|custom)\b/.test(q) ||
    /\b(jo\s*bn[aiy]+|uska|usko|uska\s*look|ata\s+jo)\b/.test(q);
  if (mentionsCta) return true;

  // Follow-up after we just added/mentioned CTA Card
  if (
    /\b(cta|custom section|cta card)\b/.test(prev) &&
    !/\b(banner|about|faq|gallery)\s+(button|title|image)\b/.test(q)
  ) {
    return true;
  }
  return false;
}

function restyleCtaCard(
  sections: SectionSnapshot[],
  options?: { withImage?: boolean },
): AiAssistResponse {
  const target = findCtaCustomSection(sections);
  if (!target) {
    return buildCtaCardAdd("Banner");
  }

  const withImage = Boolean(options?.withImage);
  const look = pickCtaLookVariant(target, true);
  const imageIdx =
    (Math.max(0, detectCtaLookIndex(target)) + 1) % STOCK_IMAGES.length;
  const fields = polishedCtaFields(target, look, {
    withImage,
    imageSrc: STOCK_IMAGES[imageIdx],
  });

  return {
    reply: withImage
      ? `CTA Card update: naya look (${look.label}) + image add ho gayi. Page pe dekh lo.`
      : `CTA Card ka naya look laga diya — ${look.label}. Agar image bhi chahiye to bolo "CTA me image add kro".`,
    actions: [
      {
        type: "patch",
        sectionHint: target.id || "CustomSection",
        fields,
      },
    ],
    choices: [],
  };
}

/** "cta mai apply now ko call now kro" */
function extractCtaButtonRename(text: string): string | null {
  const cleaned = text
    .replace(/\bcta\s*(mai|me|mein|card)?\b/gi, " ")
    .replace(/\b(custom\s*section|button|btn|text|label)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const koMatch = cleaned.match(
    /^(.+?)\s+ko\s+(.+?)(?:\s+(?:kro|karo|kar\s*do|badlo|banao|change|set))?$/i,
  );
  if (koMatch?.[2]) {
    const to = koMatch[2].replace(/[?.!]+$/, "").trim();
    if (to && to.length <= 40) return to;
  }

  const labeled = cleaned.match(
    /(?:button\s*)?(?:text|label)\s*[:=]\s*["']?(.+?)["']?$/i,
  );
  if (labeled?.[1]?.trim()) return labeled[1].trim().slice(0, 40);

  return null;
}

function wantsCtaButtonRename(text: string): boolean {
  const q = text.toLowerCase();
  const mentionsCta =
    /\bcta\b/.test(q) ||
    /\bcustom\s*section\b/.test(q) ||
    /\bcta\s*(mai|me|mein)\b/.test(q);
  if (!mentionsCta) return false;
  if (extractCtaButtonRename(text)) return true;
  return (
    /\b(button|btn|apply\s*now|get\s*started|book|explore)\b/.test(q) &&
    /\b(ko|change|badlo|rename|text|label)\b/.test(q)
  );
}

function patchCtaButtonLabel(
  sections: SectionSnapshot[],
  label: string,
): AiAssistResponse {
  const target = findCtaCustomSection(sections);
  if (!target) {
    return {
      reply: "CTA card nahi mila — pehle CTA Card add karo.",
      actions: [],
      choices: [],
    };
  }

  const data = target.data || {};
  const columnsRaw = Array.isArray(data.columns)
    ? structuredClone(data.columns)
    : [];
  let touched = false;
  const columns = (
    columnsRaw as Array<Record<string, unknown>>
  ).map((column) => {
    if (!column || typeof column !== "object") return column;
    const elements = Array.isArray(column.elements)
      ? (column.elements as Array<Record<string, unknown>>)
      : [];
    return {
      ...column,
      elements: elements.map((element) => {
        if (
          touched ||
          !element ||
          typeof element !== "object" ||
          element.type !== "button"
        ) {
          return element;
        }
        touched = true;
        return { ...element, value: label };
      }),
    };
  });

  if (!touched) {
    // No button element yet — still send buttonLabel for applyPatch fallback
    return {
      reply: `CTA button text "${label}" set kar diya.`,
      actions: [
        {
          type: "patch",
          sectionHint: target.id || "CustomSection",
          fields: { buttonLabel: label },
        },
      ],
      choices: [],
    };
  }

  return {
    reply: `CTA button ab "${label}" hai. Page pe check kar lo.`,
    actions: [
      {
        type: "patch",
        sectionHint: target.id || "CustomSection",
        fields: { columns, buttonLabel: label },
      },
    ],
    choices: [],
  };
}

function resolveDeterministic(
  message: string,
  history: ChatTurn[],
  pendingChoices: AiChoice[] = [],
  sections: SectionSnapshot[] = [],
  themeVariables?: Record<string, string> | null,
  focusSectionId?: string | null,
  category?: {
    id: string;
    label: string;
    folder: string;
    imageKeywords: string[];
    stockImages: string[];
  } | null,
  isSinglePage = false,
  currentPage?: string | null,
  pageLabels: string[] = [],
): ResolveResult | null {
  const q = message.trim().toLowerCase();
  const prev = lastAssistantText(history).toLowerCase();
  const pendingChoiceIds = pendingChoices
    .map((item) => item?.id)
    .filter((id): id is string => typeof id === "string");
  const prevAskedForExactTitle =
    prev.includes("exact new banner title") ||
    prev.includes("what new title should i set") ||
    prev.includes("what new heading would you like") ||
    prev.includes("type the exact");
  const pendingIsPlacement = pendingChoiceIds.some((id) =>
    id.startsWith("after:"),
  );
  const askedPlacement =
    pendingIsPlacement ||
    prev.includes("where should i place the new") ||
    prev.includes("choose after which section");

  const focusId = typeof focusSectionId === "string" ? focusSectionId.trim() : "";
  const focusedSection = focusId
    ? sections.find(
        (item) =>
          item.id === focusId ||
          (item.id || "").toLowerCase() === focusId.toLowerCase() ||
          item.type.toLowerCase() === focusId.toLowerCase(),
      ) || null
    : null;
  const focusPatchHint = focusedSection
    ? focusedSection.id || focusedSection.type
    : "";

  // Whole-page language rewrite must never be stolen by FAQ/title shortcuts.
  if (wantsHomeLanguageContent(message)) {
    return null;
  }

    // Section-scoped chat: edit this section only — never ask Ready vs Custom
  if (focusedSection && focusPatchHint) {
    const focusType = focusedSection.type;
    const imageTarget =
      focusType === "CustomSection" ? focusPatchHint : focusType;

    // Delete / move this focused section
    {
      const sectionDeleteConfirm = resolveDeleteSectionConfirm(
        message,
        pendingChoices,
      );
      const pendingSectionType = getPendingDeleteSectionType(pendingChoices);
      if (sectionDeleteConfirm === "yes" && pendingSectionType) {
        return buildDeleteSectionExecute(pendingSectionType, message);
      }
      if (sectionDeleteConfirm === "no" && pendingSectionType) {
        return {
          reply: `OK — section delete cancelled.`,
          actions: [],
          choices: [],
        };
      }
    }
    if (
      !LOCKED_SECTION_TYPES.has(focusType) &&
      /\b(delete|remove|hatao|hata\s*do|hata\s*kro)\b/i.test(message) &&
      !/\b(page|menu|nav)\b/i.test(message) &&
      !wantsRemoveFaqItems(message)
    ) {
      return buildDeleteSectionAsk(focusType, message);
    }
    if (
      !LOCKED_SECTION_TYPES.has(focusType) &&
      (/\b(move|upar|neeche|up|down)\b/i.test(message) ||
        /\b(le\s*jao|lejao)\b/i.test(message)) &&
      !/\b(sabse\s+upar\s+wali|pretitle|tagline)\b/i.test(message)
    ) {
      return buildMoveSection(
        focusType,
        extractMoveDirection(message),
        message,
      );
    }

    if (wantsDuplicateSection(message) || /\b(duplicate|copy|clone)\b/i.test(message)) {
      return buildDuplicateSection(message, focusType);
    }

    if (wantsBestDesign(message) && focusType === "CustomSection") {
      return restyleLatestCustomExpert(
        sections,
        themeVariables,
        focusId,
        category || null,
      );
    }

    // Image: explicit change, short subject ("school building"), or "kro" after image reply
    const confirmShort = /^(kro|karo|ha|haan|yes|ok|okay|ji|theek|do\s*it|apply|lagao|lga\s*do)$/i.test(
      message.trim(),
    );
    const prevWantsImage =
      /\b(image|photo|picture|img|background|banner\s*image)\b/.test(prev) ||
      /\bupdating\b.+\bimage\b/.test(prev) ||
      /\bnew image\b/.test(prev);
    const subjectLooksLikeImageTopic =
      message.trim().split(/\s+/).length <= 8 &&
      !wantsHeadingContentChange(message) &&
      !wantsButtonTextChange(message) &&
      !wantsDescContentChange(message) &&
      /\b(school|building|campus|classroom|kids|students|playground|library|teacher|outdoor|nature|sports|lab|office|hospital|hotel|shop|store|team|people|child|children)\b/i.test(
        message,
      ) &&
      (focusType === "Banner" ||
        focusType === "About" ||
        focusType === "Gallery" ||
        focusType === "CustomSection");

    if (
      wantsImageChange(message) ||
      (confirmShort && prevWantsImage) ||
      subjectLooksLikeImageTopic
    ) {
      return needFreshImage(imageTarget);
    }

    if (shouldDeferContentToFocusLlm(message)) {
      // Let section-focus LLM read editableFields/itemShapes — no single-field shortcuts.
    } else if (wantsButtonTextChange(message)) {
      return needFreshCopy(focusPatchHint, "button");
    } else if (wantsDescContentChange(message)) {
      return needFreshCopy(focusPatchHint, "desc");
    } else if (
      wantsHeadingContentChange(message) ||
      wantsBannerContentChange(message) ||
      (/\b(heading|title)\b/.test(q) &&
        /\b(change|update|edit|rewrite|new|badlo|badal)\b/.test(q))
    ) {
      return needFreshCopy(focusPatchHint, "title");
    }
    if (
      /(add|naya|new).*(section|seciton|card|block)/.test(q) ||
      /(section|card|block).*(add|banao|bana)/.test(q)
    ) {
      return {
        reply: `Yeh chat sirf "${focusType === "CustomSection" ? String(focusedSection.data?.sectionName || "Custom") : focusType}" section ke liye hai. Heading, text, image, ya design change bolo — naya section yahan add nahi hoga.`,
        actions: [],
        choices: [],
      };
    }
  }

  // Name / identity questions before bare greeting
  if (wantsAssistIdentity(message)) {
    return replyAssistIdentity(message);
  }

  // Casual hi / how are you — match user language
  if (wantsCasualGreeting(message)) {
    return replyCasualGreeting(message);
  }

  const isReadyPick =
    q === "ready" ||
    q === "ready section" ||
    q.includes("ready section") ||
    (pendingChoiceIds.includes("ready") && q === "ready section");
  const isCustomPick =
    q === "custom" ||
    q === "custom section" ||
    /^custom\s*(bnao|banao|kro|karo)?$/.test(q) ||
    (/\bcustom\b/.test(q) && /\b(bnao|banao)\b/.test(q)) ||
    (q.includes("custom section") && !askedPlacement);

  const pickedSliderReady =
    q === "slider-ready" ||
    q.includes("ready image slider") ||
    ((pendingChoiceIds.includes("slider-ready") ||
      prevAskedSliderReadyOrCustom(prev)) &&
      (q === "ready" || q === "1"));
  const pickedSliderCustom =
    q === "slider-custom" ||
    q.includes("custom slider") ||
    ((pendingChoiceIds.includes("slider-custom") ||
      prevAskedSliderReadyOrCustom(prev)) &&
      (q === "custom" ||
        q === "2" ||
        (/\bcustom\b/.test(q) && !/\bready\b/.test(q))));

  // User answered Ready/Custom for slider
  if (
    (prevAskedSliderReadyOrCustom(prev) ||
      pendingChoiceIds.includes("slider-ready") ||
      pendingChoiceIds.includes("slider-custom")) &&
    (pickedSliderReady || pickedSliderCustom)
  ) {
    const afterHint = extractSliderAfterHint(
      message,
      history,
      pendingChoices,
      sections,
    );
    const cards =
      extractSliderCardsPerView(message) ||
      extractSliderCardsPerView(history.map((t) => t.content).join(" ")) ||
      1;
    const langSource =
      [...history]
        .reverse()
        .find(
          (turn) =>
            turn.role === "user" && wantsAddImageSlider(turn.content),
        )?.content || message;
    if (pickedSliderCustom) {
      return buildCustomImageSliderAdd(afterHint, cards, langSource);
    }
    return buildImageSliderAdd(afterHint, langSource);
  }

  // New slider request → ask Ready vs Custom first
  if (wantsAddImageSlider(message)) {
    return askSliderReadyOrCustom(message);
  }

  // Create page + place in nav BEFORE master items
  // ("create Vastu page and add menu after Blogs" must not become "add blog post")
  if (wantsAddPageAndPlaceInNav(message)) {
    return buildAddPageAndPlaceInNav(message, message, isSinglePage);
  }

  // Place existing/current page into header nav (not create a new page)
  if (wantsPlacePageInNav(message)) {
    return buildPlacePageInNav(message, message, currentPage);
  }

  // Confirm / cancel a pending publish (Yes / No)
  {
    const publishConfirm = resolvePublishSiteConfirm(message, pendingChoices);
    if (publishConfirm === "yes") {
      return buildPublishSiteExecute(message);
    }
    if (publishConfirm === "no") {
      const hindi =
        /[^\u0000-\u007f]/.test(message) ||
        /\b(nahi|na|cancel|mat)\b/i.test(message);
      return {
        reply: hindi ? "OK — publish cancel." : "OK — publish cancelled.",
        actions: [],
        choices: [],
      };
    }
  }

  // Publish website → ask Sure? Yes / No first (never auto-publish)
  if (wantsPublishSite(message)) {
    return buildPublishSiteAsk(message);
  }

  // Site / page SEO meta
  if (wantsSetSiteSeo(message)) {
    return buildSetSiteSeo(message, category || null);
  }

  // Theme / brand colors
  if (wantsSetThemeColor(message)) {
    return buildSetThemeColor(message);
  }

  // Topbar phone / email / location
  if (wantsPatchTopbarContact(message)) {
    return buildPatchTopbarContact(message);
  }

  // Header brand / company name (logo text)
  if (wantsPatchHeaderBrand(message)) {
    return buildPatchHeaderBrand(message);
  }

  // Confirm / cancel pending master-item delete
  {
    const masterDeleteConfirm = resolveDeleteMasterConfirm(
      message,
      pendingChoices,
    );
    const pendingMaster = getPendingDeleteMaster(pendingChoices);
    if (masterDeleteConfirm === "yes" && pendingMaster) {
      return buildDeleteMasterItemExecute(
        pendingMaster.master,
        pendingMaster.title,
        message,
      );
    }
    if (masterDeleteConfirm === "no" && pendingMaster) {
      return {
        reply: `OK — "${pendingMaster.title}" ${pendingMaster.master} delete cancelled.`,
        actions: [],
        choices: [],
      };
    }
  }

  // Master item delete (blog/service/listing…) → Yes / No first
  if (wantsDeleteMasterItem(message)) {
    const master = detectMasterKindForDelete(message);
    const title = master ? extractDeleteMasterTitle(message, master) : null;
    if (master && title) {
      return buildDeleteMasterItemAsk(master, title, message);
    }
  }

  // Page rename (non-destructive)
  if (wantsRenamePage(message)) {
    return buildRenamePage(message, {
      isSinglePage,
      pageLabels,
    });
  }

  // Duplicate section
  if (wantsDuplicateSection(message)) {
    return buildDuplicateSection(message, focusedSection?.type || null);
  }

  // Confirm / cancel home content refresh
  {
    const directRefresh = message
      .trim()
      .match(/^refresh-home-(yes|no):(.+)$/i);
    if (directRefresh) {
      const audience = directRefresh[2].trim();
      if (directRefresh[1].toLowerCase() === "yes" && audience) {
        return buildRefreshHomeContentExecute(audience, message);
      }
      return {
        reply: "OK — home content refresh cancelled.",
        actions: [],
        choices: [],
      };
    }
    const refreshConfirm = resolveRefreshHomeConfirm(message, pendingChoices);
    const pendingAudience = getPendingRefreshAudience(pendingChoices);
    if (refreshConfirm === "yes" && pendingAudience) {
      return buildRefreshHomeContentExecute(pendingAudience, message);
    }
    if (refreshConfirm === "no" && pendingAudience) {
      return {
        reply: "OK — home content refresh cancelled.",
        actions: [],
        choices: [],
      };
    }
  }

  // Bulk home content refresh → Yes / No
  if (wantsRefreshHomeContent(message)) {
    const audience =
      detectRefreshAudience(message, category?.label) ||
      detectRefreshAudience(message, null);
    if (!audience) {
      return {
        reply:
          "Kis industry ke liye rewrite? Example: poori home page ka content school ke liye rewrite kro.",
        actions: [],
        choices: [
          { id: "refresh-home-yes:school", label: "School" },
          { id: "refresh-home-yes:business", label: "Business" },
          { id: "refresh-home-yes:realestate", label: "Realestate" },
        ],
      };
    }
    return buildRefreshHomeContentAsk(audience, message);
  }

  // Confirm / cancel a pending SECTION delete (Yes / No)
  {
    const sectionDeleteConfirm = resolveDeleteSectionConfirm(
      message,
      pendingChoices,
    );
    const pendingSectionType = getPendingDeleteSectionType(pendingChoices);
    if (sectionDeleteConfirm === "yes" && pendingSectionType) {
      return buildDeleteSectionExecute(pendingSectionType, message);
    }
    if (sectionDeleteConfirm === "no" && pendingSectionType) {
      const label =
        READY_SECTIONS.find((item) => item.type === pendingSectionType)
          ?.label || pendingSectionType;
      return {
        reply: `OK — "${label}" section delete cancelled.`,
        actions: [],
        choices: [],
      };
    }
  }

  // Delete a home Ready/Custom section → ask Sure? Yes / No first
  if (wantsDeleteSection(message)) {
    const sectionType = extractTargetSectionType(message);
    if (sectionType) {
      return buildDeleteSectionAsk(sectionType, message);
    }
  }

  // Move section up/down (no confirm — reversible)
  if (wantsMoveSection(message)) {
    const sectionType = extractTargetSectionType(message);
    if (sectionType && !LOCKED_SECTION_TYPES.has(sectionType)) {
      return buildMoveSection(
        sectionType,
        extractMoveDirection(message),
        message,
      );
    }
  }

  // Confirm / cancel a pending page delete (Yes / No)
  {
    const deleteConfirm = resolveDeletePageConfirm(message, pendingChoices);
    const pendingDeleteLabel =
      getPendingDeletePageLabel(pendingChoices) ||
      getDeletePageLabelFromMessage(message)?.label ||
      null;
    if (deleteConfirm === "yes" && pendingDeleteLabel) {
      return buildDeletePageExecute(pendingDeleteLabel, message);
    }
    if (deleteConfirm === "no" && pendingDeleteLabel) {
      const hindi =
        /[^\u0000-\u007f]/.test(message) ||
        /\b(nahi|na|cancel|mat)\b/i.test(message);
      return {
        reply: hindi
          ? `OK — "${pendingDeleteLabel}" page delete cancel.`
          : `OK — "${pendingDeleteLabel}" page delete cancelled.`,
        actions: [],
        choices: [],
      };
    }
  }

  // Delete an inner page → ask Sure? Yes / No first
  if (wantsDeletePage(message)) {
    return buildDeletePageAsk(message, message, currentPage);
  }

  // Breadcrumb on an existing page (not a new page named Breadcrumb…)
  if (wantsAddBreadcrumb(message)) {
    return buildAddBreadcrumb(message, message, currentPage);
  }

  // New nav / inner page (NOT a home section / NOT a blog post)
  if (wantsAddPage(message)) {
    return buildAddPage(message, message, isSinglePage);
  }

  // Master pages: blogs / services / gallery / teams / portfolio items
  if (wantsAddMasterItems(message)) {
    return buildAddMasterItems(message, category || null);
  }

  // Legal-page chip answer (single-page only)
  if (
    isSinglePage &&
    pendingChoices.some((item) => item.id.startsWith("legal-page:"))
  ) {
    const legalLabel = resolveLegalPageChoice(message, pendingChoices);
    if (legalLabel) {
      const hindi =
        /[^\u0000-\u007f]/.test(message) ||
        /\b(banao|bnao|kro|karo|naya)\b/i.test(message);
      return {
        reply: hindi
          ? `"${legalLabel}" legal page bana raha hoon.`
          : `Creating the "${legalLabel}" legal page.`,
        actions: [{ type: "addPage", pageLabel: legalLabel }],
        choices: [],
      };
    }
  }

  // Placement answer → finally add
  if (askedPlacement) {
    const pendingAdd = pendingAddFromHistory(history);
    const afterHint = resolvePlacementHint(message, pendingChoices, sections);
    if (pendingAdd && afterHint) {
      if (pendingAdd.kind === "customFaq") {
        return buildCustomFaqAdd(afterHint, message);
      }
      if (pendingAdd.kind === "customAbout") {
        return buildCustomAboutAdd(afterHint, themeVariables, category || null);
      }
      if (pendingAdd.kind === "custom") {
        return buildCustomAdd(afterHint);
      }
      return {
        reply: `Adding Ready Section: ${pendingAdd.label} after your chosen section.`,
        actions: [
          {
            type: "addSection",
            sectionType: pendingAdd.sectionType,
            afterSectionHint: afterHint,
          },
        ],
        choices: [],
      };
    }
    if (pendingAdd && !afterHint) {
      return askPlacement(
        pendingAdd.kind === "customFaq"
          ? "Custom FAQ"
          : pendingAdd.kind === "customAbout"
            ? "Custom About"
            : pendingAdd.kind === "custom"
              ? "Custom"
              : pendingAdd.label,
        sections,
      );
    }
  }

  // Explicit Ready/Custom answers
  if (isCustomPick) {
    // After "add faq" Ready/Custom ask → Custom FAQ widget section
    if (
      /\bfaq\b/.test(prev) &&
      (pendingChoiceIds.includes("ready") ||
        pendingChoiceIds.includes("custom") ||
        prev.includes("ready section or custom") ||
        prev.includes("ready section add karun ya custom"))
    ) {
      return askPlacement("Custom FAQ", sections);
    }
    const userBlob = history
      .filter((turn) => turn.role === "user")
      .map((turn) => turn.content)
      .join(" ")
      .toLowerCase();
    if (/\babout\b/.test(userBlob)) {
      return askPlacement("Custom About", sections);
    }
    return askPlacement("Custom", sections);
  }

  if (
    isReadyPick ||
    (prev.includes("ready section") &&
      prev.includes("custom") &&
      (q === "ready" || q === "1"))
  ) {
    // After "add faq" Ready/Custom ask — skip full catalog, go to FAQ placement
    if (
      /\bfaq\b/.test(prev) &&
      (pendingChoiceIds.includes("ready") ||
        pendingChoiceIds.includes("custom") ||
        prev.includes("ready section or custom") ||
        prev.includes("ready section add karun ya custom"))
    ) {
      return askPlacement("FAQ", sections);
    }
    return {
      reply: "Which Ready Section should I add?",
      actions: [{ type: "ask", options: READY_CATALOG_CHOICES }],
      choices: READY_CATALOG_CHOICES,
    };
  }

  // Catalog pick → ask placement (do not add yet)
  const readyMatch = READY_SECTIONS.find(
    (item) =>
      q === item.type.toLowerCase() ||
      q === item.label.toLowerCase(),
  );
  const pendingIsReadyCatalog = pendingChoiceIds.some((id) =>
    READY_SECTIONS.some((item) => item.type === id),
  );
  if (
    readyMatch &&
    (prev.includes("which ready") ||
      prev.includes("ready section") ||
      pendingIsReadyCatalog)
  ) {
    return askPlacement(readyMatch.label, sections);
  }

  // List / count sections in live canvas order (after user reorder)
  if (wantsListPageSections(message)) {
    return listPageSectionsInOrder(sections);
  }

  // Expert "best design" — polish latest Custom section from live theme colors
  if (wantsBestDesign(message)) {
    return restyleLatestCustomExpert(
      sections,
      themeVariables,
      focusSectionId,
      category || null,
    );
  }

  // Free-text design brief → unique custom layout (features / stats / CTA band / …)
  if (wantsTypedCustomDesign(message)) {
    return buildTypedCustomDesign(
      message,
      sections,
      themeVariables,
      category || null,
      focusSectionId,
    );
  }

  // CTA look / CTA + image — before About image swap
  if (wantsImproveCtaLook(message, prev) || wantsCtaImageAdd(message)) {
    const latestCustom = [...sections]
      .reverse()
      .find((section) => section.type === "CustomSection" && !section.page);
    if (
      latestCustom &&
      customSectionLooksLikeAbout(latestCustom) &&
      !/\bcta\b/.test(q)
    ) {
      return restyleLatestCustomExpert(
        sections,
        themeVariables,
        focusSectionId,
        category || null,
      );
    }
    return restyleCtaCard(sections, {
      withImage: wantsCtaImageAdd(message),
    });
  }

  // CTA button rename: "cta mai apply now ko call now kro"
  if (wantsCtaButtonRename(message)) {
    const nextLabel = extractCtaButtonRename(message) || "Call Now";
    return patchCtaButtonLabel(sections, nextLabel);
  }

  // Image change on existing section — never treat as add-section
  if (wantsImageChange(message)) {
    const mentioned = detectMentionedSection(message) || "About";
    return needFreshImage(mentioned);
  }

  // Remove FAQ items (e.g. "jo add kiya remove kro") — before add
  if (wantsRemoveFaqItems(message)) {
    return patchFaqItemsRemove(sections, extractFaqCount(message));
  }

  // "add faq" / "custom faq" → new FAQ section (Ready vs Custom), NOT Q&A rows
  if (wantsAddFaqSection(message)) {
    return resolveAddFaqSection(message, sections);
  }

  // Add FAQ Q&A into existing FAQ section (not Custom / empty widgets)
  if (wantsAddFaqItems(message)) {
    return patchFaqItemsAppend(sections, extractFaqCount(message));
  }

  // CTA Card / card after Banner — never rewrite Banner button text
  if (wantsAddCtaCard(message)) {
    const afterHint =
      resolvePlacementHint(message, pendingChoices, sections) || "Banner";
    return buildCtaCardAdd(afterHint);
  }

  // After AI asked which FAQ questions — invent & apply
  // Never treat whole-page language rewrite as FAQ confirm.
  if (
    prevAskedForFaqItems(prev) &&
    !wantsHomeLanguageContent(message) &&
    !extractHomeContentLanguage(message) &&
    !/\b(content|website|site|page|translate|language)\b/i.test(message)
  ) {
    if (
      /^(yes|ok|okay|ha|haan|ji|theek|thik)$/i.test(message.trim()) ||
      (/^(kro|karo|ha|haan|yes|ok)$/i.test(message.trim()) &&
        !/\b(content|website|page)\b/i.test(message))
    ) {
      const countFromPrev = extractFaqCount(prev) || 5;
      return patchFaqItemsAppend(sections, countFromPrev);
    }
  }

  // Add section intent without type
  if (
    /(add|naya|new|create).*(section|seciton|card|block)/.test(q) ||
    /(section|card|block).*(add|banao|bana|create)/.test(q)
  ) {
    if (q.includes("custom")) {
      return resolveDeterministic(
        "Custom Section",
        history,
        pendingChoices,
        sections,
        themeVariables,
        focusSectionId,
      );
    }
    if (q.includes("ready")) {
      return resolveDeterministic(
        "Ready Section",
        history,
        pendingChoices,
        sections,
        themeVariables,
        focusSectionId,
      );
    }
    // Bare "create/add section" → Custom (skip Ready/Custom quiz); ask placement only.
    return askPlacement("Custom", sections);
  }

  // Explicit title only — never paste instruction text into the site.
  const explicitTitle = extractExplicitTitle(message);
  if (explicitTitle) {
    const mentionedForTitle = detectMentionedSection(message) || "Banner";
    return patchSectionTitle(mentionedForTitle, explicitTitle);
  }

  const explicitDesc = extractExplicitDesc(message);
  if (explicitDesc) {
    const mentionedForDesc = detectMentionedSection(message) || "About";
    return patchSectionDesc(mentionedForDesc, explicitDesc);
  }

  // After AI/OpenAI asked for description — invent or apply, never loop
  if (prevAskedForDescription(prev)) {
    const section = sectionFromAssistantPrompt(prev);
    if (
      /^(yes|ok|okay|ha|haan|ji)$/i.test(message.trim()) ||
      looksLikeInstruction(message)
    ) {
      return needFreshCopy(section, "desc");
    }
    if (message.trim().length > 40) {
      return patchSectionDesc(section, message.trim());
    }
    return needFreshCopy(section, "desc");
  }

  // Follow-up after we asked for the exact title text
  if (prevAskedForExactTitle) {
    if (
      /^(yes|ok|okay|ha|haan|ji)$/i.test(message.trim()) ||
      looksLikeInstruction(message)
    ) {
      return needFreshCopy("Banner", "title");
    }
    if (!looksLikeInstruction(message) && message.trim().length > 2) {
      return patchBannerTitle(message.trim());
    }
  }

  // Description change for named section (About description, etc.)
  if (shouldDeferContentToFocusLlm(message)) {
    return null;
  }
  if (wantsDescContentChange(message)) {
    const mentioned = detectMentionedSection(message) || "About";
    return needFreshCopy(mentioned, "desc");
  }

  // Button text — must run before heading/content (which also matches "text")
  if (wantsButtonTextChange(message)) {
    const mentioned = detectMentionedSection(message) || "Banner";
    return needFreshCopy(mentioned, "button");
  }

  // Named section heading/content change (About, Gallery, …) — never force Banner
  if (wantsHeadingContentChange(message)) {
    const mentioned = detectMentionedSection(message);
    if (mentioned && mentioned !== "Banner") {
      return needFreshCopy(mentioned, "title");
    }
    if (wantsBannerContentChange(message)) {
      return needFreshCopy("Banner", "title");
    }
  }

  // "yes" alone after a question asking for title — invent, don't loop
  if (/^(yes|ok|okay|ha|haan|ji)$/i.test(message.trim())) {
    if (
      prevAskedForFaqItems(prev) &&
      !wantsHomeLanguageContent(message) &&
      !extractHomeContentLanguage(message)
    ) {
      return patchFaqItemsAppend(sections, extractFaqCount(prev) || 5);
    }
    if (prevAskedForDescription(prev)) {
      const section = sectionFromAssistantPrompt(prev);
      return needFreshCopy(section, "desc");
    }
    if (prev.includes("title") || prev.includes("heading")) {
      const section = detectMentionedSection(prev) || "Banner";
      return needFreshCopy(section, "title");
    }
  }

  return null;
}

async function callOpenAi(params: {
  apiKey: string;
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  useJsonFormat: boolean;
  temperature?: number;
  maxTokens?: number;
}) {
  // Shared provider: Gemini first (GEMINI_API_KEY), OpenAI fallback.
  const { generateAiText } = await import("@/lib/aiProvider");
  const ai = await generateAiText({
    messages: params.messages,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    jsonMode: params.useJsonFormat,
  });

  const fakeResponse = {
    ok: Boolean(ai.text),
    status: ai.text ? 200 : 500,
    async json() {
      if (!ai.text) {
        return { error: { message: ai.fallbackReason || "AI unavailable" } };
      }
      return {
        choices: [{ message: { content: ai.text } }],
        usage: { total_tokens: ai.tokensUsed },
      };
    },
  };

  return fakeResponse as unknown as Response;
}

function cleanGeneratedText(raw: string, preserveParagraphs = false): string {
  let text = raw.trim();
  text = text.replace(/^```(?:\w+)?\s*([\s\S]*?)```$/u, "$1").trim();
  text = text.replace(/^["'“”]+|["'“”]+$/g, "").trim();
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const value =
        (typeof parsed.text === "string" && parsed.text) ||
        (typeof parsed.title === "string" && parsed.title) ||
        (typeof parsed.desc === "string" && parsed.desc) ||
        (typeof parsed.content === "string" && parsed.content) ||
        "";
      if (value.trim()) text = value.trim();
    } catch {
      // keep cleaned text
    }
  }
  if (preserveParagraphs) {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return text.replace(/\s+/g, " ").trim();
}

async function translateFocusedSectionCards(params: {
  apiKey: string;
  model: string;
  userMessage: string;
  siteContext: string;
  sectionType: string;
  data: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const language =
    extractHomeContentLanguage(params.userMessage) ||
    (/[\u0600-\u06FF]/.test(params.userMessage)
      ? "urdu"
      : /[\u0900-\u097F]/.test(params.userMessage)
        ? "hindi"
        : null);
  const langRule = language
    ? languageWriteRule(language)
    : "Rewrite fresh website copy in the same language the user asked for.";

  type CardRow = {
    title: string;
    category: string;
    desc: string;
    buttonLabel: string;
  };

  const cards: CardRow[] = [];
  const productItems = Array.isArray(params.data.productItems)
    ? (params.data.productItems as Array<Record<string, unknown>>)
    : [];
  const whyChooseUsItems = Array.isArray(params.data.whyChooseUsItems)
    ? (params.data.whyChooseUsItems as Array<Record<string, unknown>>)
    : [];
  const galleryItems = Array.isArray(params.data.galleryItems)
    ? (params.data.galleryItems as Array<Record<string, unknown>>)
    : [];
  const faqItems = Array.isArray(params.data.faqItems)
    ? (params.data.faqItems as Array<Record<string, unknown>>)
    : [];
  const testimonialItems = Array.isArray(params.data.testimonialItems)
    ? (params.data.testimonialItems as Array<Record<string, unknown>>)
    : [];
  const serviceSlides = Array.isArray(params.data.serviceSlides)
    ? (params.data.serviceSlides as Array<Record<string, unknown>>)
    : Array.isArray(params.data.productSlides)
      ? (params.data.productSlides as Array<Record<string, unknown>>)
      : [];
  const blocks = Array.isArray(params.data.blocks)
    ? (params.data.blocks as Array<Record<string, unknown>>)
    : [];
  const cardBlocks = blocks.filter(
    (block) =>
      block &&
      typeof block === "object" &&
      block.type === "card",
  );

  type ItemSource =
    | "whyChooseUsItems"
    | "productItems"
    | "serviceSlides"
    | "galleryItems"
    | "faqItems"
    | "testimonialItems"
    | "cardBlocks"
    | "bannerSlides"
    | "cities"
    | "listings"
    | "categories"
    | "projectItems"
    | "featureItems"
    | "stats"
    | null;
  let itemSource: ItemSource = null;

  const bannerSlides = Array.isArray(params.data.bannerSlides)
    ? (params.data.bannerSlides as Array<Record<string, unknown>>)
    : [];
  const cities = Array.isArray(params.data.cities)
    ? (params.data.cities as Array<Record<string, unknown>>)
    : [];
  const listings = Array.isArray(params.data.listings)
    ? (params.data.listings as Array<Record<string, unknown>>)
    : [];
  const categories = Array.isArray(params.data.categories)
    ? (params.data.categories as Array<Record<string, unknown>>)
    : [];
  const projectItems = Array.isArray(params.data.projectItems)
    ? (params.data.projectItems as Array<Record<string, unknown>>)
    : [];
  const featureItems = Array.isArray(params.data.features)
    ? (params.data.features as Array<Record<string, unknown>>)
    : [];
  const statsItems = Array.isArray(params.data.stats)
    ? (params.data.stats as Array<Record<string, unknown>>)
    : [];

  if (bannerSlides.length) {
    itemSource = "bannerSlides";
    for (const slide of bannerSlides.slice(0, 6)) {
      if (!slide || typeof slide !== "object") continue;
      const button =
        slide.button && typeof slide.button === "object"
          ? (slide.button as { label?: unknown }).label
          : "";
      cards.push({
        title: String(slide.title || "").trim(),
        category: String(slide.pretitle || slide.alt || "").trim(),
        desc: String(slide.desc || "").trim(),
        buttonLabel: typeof button === "string" ? button.trim() : "",
      });
    }
  } else if (whyChooseUsItems.length) {
    itemSource = "whyChooseUsItems";
    for (const item of whyChooseUsItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || "").trim(),
        category: String(item.category || item.subtitle || "").trim(),
        desc: String(item.desc || item.description || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (productItems.length) {
    itemSource = "productItems";
    for (const item of productItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || "").trim(),
        category: String(item.category || "").trim(),
        desc: String(item.desc || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (serviceSlides.length) {
    itemSource = "serviceSlides";
    for (const slide of serviceSlides.slice(0, 12)) {
      if (!slide || typeof slide !== "object") continue;
      cards.push({
        title: String(slide.productTitle || slide.title || "").trim(),
        category: String(
          slide.productSubtitle || slide.category || "",
        ).trim(),
        desc: String(slide.productInfoDesc || slide.desc || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (galleryItems.length) {
    itemSource = "galleryItems";
    for (const item of galleryItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || item.alt || "").trim(),
        category: String(item.category || "").trim(),
        desc: String(item.desc || item.description || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (faqItems.length) {
    itemSource = "faqItems";
    for (const item of faqItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.question || item.title || "").trim(),
        category: "",
        desc: String(item.answer || item.desc || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (testimonialItems.length) {
    itemSource = "testimonialItems";
    for (const item of testimonialItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.name || item.title || "").trim(),
        category: String(item.role || item.designation || "").trim(),
        desc: String(item.quote || item.desc || item.content || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (cardBlocks.length) {
    itemSource = "cardBlocks";
    for (const block of cardBlocks.slice(0, 12)) {
      let buttonLabel = "";
      if (Array.isArray(block.blocks)) {
        for (const nested of block.blocks as Array<Record<string, unknown>>) {
          if (
            nested &&
            nested.type === "button" &&
            typeof nested.label === "string" &&
            nested.label.trim()
          ) {
            buttonLabel = nested.label.trim();
            break;
          }
        }
      }
      cards.push({
        title: String(block.title || "").trim(),
        category: String(block.category || "").trim(),
        desc: String(block.desc || "").trim(),
        buttonLabel,
      });
    }
  } else if (cities.length) {
    itemSource = "cities";
    for (const item of cities.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || item.name || item.city || "").trim(),
        category: String(item.subtitle || item.tag || item.count || "").trim(),
        desc: String(item.desc || item.description || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (listings.length) {
    itemSource = "listings";
    for (const item of listings.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || item.name || "").trim(),
        category: String(item.category || item.location || item.tag || "").trim(),
        desc: String(item.desc || item.description || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (categories.length) {
    itemSource = "categories";
    for (const item of categories.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || item.name || item.label || "").trim(),
        category: String(item.subtitle || item.tag || "").trim(),
        desc: String(item.desc || item.description || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (projectItems.length) {
    itemSource = "projectItems";
    for (const item of projectItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || item.name || "").trim(),
        category: String(item.location || item.category || "").trim(),
        desc: String(item.desc || item.description || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (featureItems.length) {
    itemSource = "featureItems";
    for (const item of featureItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.title || item.label || item.name || "").trim(),
        category: "",
        desc: String(item.desc || item.description || item.text || "").trim(),
        buttonLabel: "",
      });
    }
  } else if (statsItems.length) {
    itemSource = "stats";
    for (const item of statsItems.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      cards.push({
        title: String(item.label || item.title || item.name || "").trim(),
        category: String(item.value || item.stat || "").trim(),
        desc: String(item.desc || item.description || "").trim(),
        buttonLabel: "",
      });
    }
  }

  const features = Array.isArray(params.data.productFeatures)
    ? (params.data.productFeatures as Array<Record<string, unknown>>)
        .map((row) => ({
          label: String(row?.label || "").trim(),
          price: String(row?.price || "").trim(),
        }))
        .filter((row) => row.label)
        .slice(0, 12)
    : [];

  const shippingText =
    typeof params.data.productShippingText === "string"
      ? params.data.productShippingText.trim()
      : "";

  if (!cards.length && !features.length && !shippingText) return {};

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: `You rewrite website card/list copy for a ${params.sectionType} section.
Return ONLY valid JSON:
{"cards":[{"title":"...","category":"...","desc":"...","buttonLabel":"..."}],"features":[{"label":"...","price":"..."}],"shippingText":"..."}
Rules:
- Keep the same number of cards/features as input.
- For FAQ: title = question, desc = answer.
- For testimonials: title = name, category = role, desc = quote.
- For Why Choose Us / gallery / service cards: title + desc are the visible card texts.
- Preserve price values when they look like prices/numbers; translate labels.
- buttonLabel max 4 words. category max 6 words. title max 8 words. desc 1-3 sentences.
- ${langRule}
- Do not skip cards.`,
    },
    {
      role: "user",
      content: JSON.stringify({
        siteContext: params.siteContext,
        userRequest: params.userMessage,
        cards,
        features,
        shippingText: shippingText || undefined,
      }),
    },
  ];

  let response = await callOpenAi({
    apiKey: params.apiKey,
    model: params.model,
    messages,
    useJsonFormat: true,
    temperature: 0.5,
    maxTokens: 2500,
  });
  if (!response.ok) {
    response = await callOpenAi({
      apiKey: params.apiKey,
      model: params.model,
      messages,
      useJsonFormat: false,
      temperature: 0.5,
      maxTokens: 2500,
    });
  }
  if (!response.ok) return {};

  const payload = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = payload.choices?.[0]?.message?.content || "";
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed) return {};

  const nextCards = Array.isArray(parsed.cards)
    ? (parsed.cards as Array<Record<string, unknown>>)
        .map((row) => ({
          title: String(row?.title || "").trim(),
          category: String(row?.category || "").trim(),
          desc: String(row?.desc || "").trim(),
          buttonLabel: String(row?.buttonLabel || "").trim(),
        }))
        .filter((row) => row.title || row.desc || row.category)
    : [];
  const nextFeatures = Array.isArray(parsed.features)
    ? (parsed.features as Array<Record<string, unknown>>)
        .map((row, index) => ({
          label: String(row?.label || "").trim(),
          price:
            String(row?.price || "").trim() ||
            features[index]?.price ||
            "",
        }))
        .filter((row) => row.label)
    : [];
  const nextShipping =
    typeof parsed.shippingText === "string"
      ? parsed.shippingText.trim()
      : "";

  const fields: Record<string, unknown> = {};

  if (nextCards.length && itemSource === "whyChooseUsItems") {
    fields.whyChooseUsItems = whyChooseUsItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title ? { title: next.title } : {}),
        ...(next.category ? { category: next.category } : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "productItems") {
    fields.productItems = productItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title ? { title: next.title } : {}),
        ...(next.category ? { category: next.category } : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "serviceSlides") {
    const nextSlides = serviceSlides.map((slide, index) => {
      const next = nextCards[index];
      if (!next || !slide || typeof slide !== "object") return slide;
      return {
        ...slide,
        ...(next.title
          ? { productTitle: next.title, title: next.title }
          : {}),
        ...(next.category
          ? { productSubtitle: next.category, category: next.category }
          : {}),
        ...(next.desc
          ? { productInfoDesc: next.desc, desc: next.desc }
          : {}),
      };
    });
    fields.serviceSlides = nextSlides;
    fields.productSlides = nextSlides;
  }

  if (nextCards.length && itemSource === "galleryItems") {
    fields.galleryItems = galleryItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title ? { title: next.title } : {}),
        ...(next.category ? { category: next.category } : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "faqItems") {
    fields.faqItems = faqItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title ? { question: next.title } : {}),
        ...(next.desc ? { answer: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "testimonialItems") {
    fields.testimonialItems = testimonialItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title ? { name: next.title, title: next.title } : {}),
        ...(next.category ? { role: next.category } : {}),
        ...(next.desc ? { quote: next.desc, desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "cardBlocks") {
    let cardIndex = 0;
    fields.blocks = blocks.map((block) => {
      if (!block || typeof block !== "object" || block.type !== "card") {
        return block;
      }
      const next = nextCards[cardIndex++];
      if (!next) return block;
      let nested = block.blocks;
      if (Array.isArray(block.blocks) && next.buttonLabel) {
        let buttonDone = false;
        nested = (block.blocks as Array<Record<string, unknown>>).map(
          (child) => {
            if (
              buttonDone ||
              !child ||
              typeof child !== "object" ||
              child.type !== "button"
            ) {
              return child;
            }
            buttonDone = true;
            return { ...child, label: next.buttonLabel };
          },
        );
      }
      return {
        ...block,
        ...(next.title ? { title: next.title } : {}),
        ...(next.category ? { category: next.category } : {}),
        ...(next.desc ? { desc: next.desc } : {}),
        ...(nested ? { blocks: nested } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "bannerSlides") {
    fields.bannerSlides = bannerSlides.map((slide, index) => {
      const next = nextCards[index];
      if (!next || !slide || typeof slide !== "object") return slide;
      const nextSlide: Record<string, unknown> = {
        ...slide,
        ...(next.title ? { title: next.title } : {}),
        ...(next.category ? { pretitle: next.category } : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
      if (next.buttonLabel) {
        if (slide.button && typeof slide.button === "object") {
          nextSlide.button = {
            ...(slide.button as Record<string, unknown>),
            label: next.buttonLabel,
          };
        } else {
          nextSlide.button = { label: next.buttonLabel, href: "#" };
        }
      }
      return nextSlide;
    });
  }

  if (nextCards.length && itemSource === "cities") {
    fields.cities = cities.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title
          ? {
              title: next.title,
              ...(typeof item.name === "string" ? { name: next.title } : {}),
              ...(typeof item.city === "string" ? { city: next.title } : {}),
            }
          : {}),
        ...(next.category
          ? {
              ...(typeof item.subtitle === "string"
                ? { subtitle: next.category }
                : {}),
              ...(typeof item.tag === "string" ? { tag: next.category } : {}),
            }
          : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "listings") {
    fields.listings = listings.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title ? { title: next.title } : {}),
        ...(next.category
          ? {
              ...(typeof item.category === "string"
                ? { category: next.category }
                : {}),
              ...(typeof item.location === "string"
                ? { location: next.category }
                : {}),
              ...(typeof item.tag === "string" ? { tag: next.category } : {}),
            }
          : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "categories") {
    fields.categories = categories.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title
          ? {
              title: next.title,
              ...(typeof item.name === "string" ? { name: next.title } : {}),
              ...(typeof item.label === "string" ? { label: next.title } : {}),
            }
          : {}),
        ...(next.category
          ? {
              ...(typeof item.subtitle === "string"
                ? { subtitle: next.category }
                : {}),
              ...(typeof item.tag === "string" ? { tag: next.category } : {}),
            }
          : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "projectItems") {
    fields.projectItems = projectItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title ? { title: next.title } : {}),
        ...(next.category
          ? {
              ...(typeof item.location === "string"
                ? { location: next.category }
                : {}),
              ...(typeof item.category === "string"
                ? { category: next.category }
                : {}),
            }
          : {}),
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "featureItems") {
    fields.features = featureItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title
          ? {
              title: next.title,
              ...(typeof item.label === "string" ? { label: next.title } : {}),
              ...(typeof item.name === "string" ? { name: next.title } : {}),
            }
          : {}),
        ...(next.desc
          ? {
              desc: next.desc,
              ...(typeof item.text === "string" ? { text: next.desc } : {}),
            }
          : {}),
      };
    });
  }

  if (nextCards.length && itemSource === "stats") {
    fields.stats = statsItems.map((item, index) => {
      const next = nextCards[index];
      if (!next || !item || typeof item !== "object") return item;
      return {
        ...item,
        ...(next.title
          ? {
              label: next.title,
              ...(typeof item.title === "string" ? { title: next.title } : {}),
            }
          : {}),
        // Keep numeric values stable when category carried the value
        ...(next.desc ? { desc: next.desc } : {}),
      };
    });
  }

  if (
    !fields.bannerSlides &&
    (fields.productItems || fields.serviceSlides)
  ) {
    // JSON omits undefined — applyPatch must drop stale blocks when items change.
    fields.__rebuildBlocksFromItems = true;
  }

  if (nextFeatures.length && features.length) {
    fields.productFeatures = nextFeatures.map((row, index) => ({
      ...(features[index] || {}),
      label: row.label,
      price: row.price || features[index]?.price || "",
    }));
  }

  if (nextShipping && shippingText) {
    fields.productShippingText = nextShipping;
  }

  return fields;
}

async function generateFreshCopy(params: {
  apiKey: string;
  model: string;
  sectionType: string;
  field: "title" | "desc" | "button" | "pretitle";
  sections: SectionSnapshot[];
  siteContext: string;
  userMessage: string;
  wordTarget?: number | null;
}): Promise<string | null> {
  const current =
    params.field === "title"
      ? getSectionTitle(params.sections, params.sectionType)
      : params.field === "button"
        ? getSectionButtonLabel(params.sections, params.sectionType)
        : params.field === "pretitle"
          ? getSectionPretitle(params.sections, params.sectionType)
          : getSectionDesc(params.sections, params.sectionType);
  const label =
    READY_SECTIONS.find((item) => item.type === params.sectionType)?.label ||
    params.sectionType;
  const fieldLabel =
    params.field === "title"
      ? "heading"
      : params.field === "button"
        ? "button label"
        : params.field === "pretitle"
          ? "pretitle tagline"
          : "description";
  const variation = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const wordTarget =
    params.field === "desc"
      ? params.wordTarget || extractWordTarget(params.userMessage) || 60
      : null;

  const lengthRule =
    params.field === "button"
      ? "Button label: max 4 words, clear CTA, no punctuation except optional !."
      : params.field === "pretitle"
        ? "Pretitle/tagline: max 5 words, short eyebrow line above the main heading."
        : params.field === "title"
          ? "Title: max 12 words, punchy, clearly different from current."
          : wordTarget && wordTarget >= 150
            ? `Description: write about ${wordTarget} words in 2-4 short paragraphs. Do not stop early.`
            : wordTarget
              ? `Description: write approximately ${wordTarget} words (not much shorter, not much longer). Plain website copy only — do NOT say "I updated" or describe the edit.`
              : "Description: 2-4 natural sentences, clearly different from current.";

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: `You write website copy for CSS Founder editor.
Return ONLY the ${fieldLabel} text. No quotes around the whole answer. No markdown. No JSON.
Make it fresh and unique every time. Must be clearly different from the current text.
${lengthRule}
Language: ${
          /\bhindi\b/i.test(params.userMessage) ||
          /हिंदी|हिन्दी/.test(params.userMessage) ||
          (/[\u0900-\u097F]/.test(params.userMessage) &&
            !/\b(english|angrezi)\b/i.test(params.userMessage))
            ? "Hindi (Devanagari script ONLY). Do not use English words except brand names."
            : /\b(english|angrezi)\b/i.test(params.userMessage)
              ? "English only."
              : isMostlyEnglish(params.userMessage)
                ? "English only."
                : "Hinglish/Hindi mixed is fine for chat tone, but keep website on-page copy in English unless the user asked for Hindi content."
        }`,
    },
    {
      role: "user",
      content: JSON.stringify({
        siteContext: params.siteContext,
        section: label,
        field: fieldLabel,
        currentText: current || null,
        userRequest: params.userMessage,
        targetWordCount: wordTarget,
        variationSeed: variation,
        instruction:
          "Write a brand-new version now. Do not reuse the current text. For button labels return only the short CTA text. For pretitle return only the short top line.",
      }),
    },
  ];

  const maxTokens =
    params.field === "button" || params.field === "pretitle"
      ? 24
      : params.field === "title"
        ? 80
        : wordTarget
          ? Math.min(2200, Math.max(350, wordTarget * 3))
          : 350;

  let response = await callOpenAi({
    apiKey: params.apiKey,
    model: params.model,
    messages,
    useJsonFormat: false,
    temperature: 1.1,
    maxTokens,
  });

  if (!response.ok) {
    response = await callOpenAi({
      apiKey: params.apiKey,
      model: params.model,
      messages,
      useJsonFormat: false,
      temperature: 0.95,
      maxTokens,
    });
  }

  if (!response.ok) return null;
  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  const raw = data.choices?.[0]?.message?.content || "";
  const cleaned = cleanGeneratedText(raw, params.field === "desc");
  if (!cleaned) return null;
  if (current && cleaned.toLowerCase() === current.toLowerCase()) return null;
  return cleaned;
}

async function saveImageBuffer(
  buffer: Buffer,
  extension: "png" | "jpg" | "webp",
): Promise<string> {
  const folder = `${new Date().getUTCFullYear()}-${String(
    new Date().getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const directory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "ai-assist",
    folder,
  );
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, filename), buffer);
  return `/uploads/ai-assist/${folder}/${filename}`;
}

type CountryHint = {
  code: string;
  name: string;
  region: string;
  imageKeywords: string[];
};

const COUNTRY_BY_CODE: Record<string, CountryHint> = {
  IN: {
    code: "IN",
    name: "India",
    region: "South Asia",
    imageKeywords: [
      "indian",
      "india",
      "mumbai",
      "delhi",
      "bangalore",
      "south asian",
    ],
  },
  PK: {
    code: "PK",
    name: "Pakistan",
    region: "South Asia",
    imageKeywords: ["pakistani", "pakistan", "karachi", "lahore"],
  },
  BD: {
    code: "BD",
    name: "Bangladesh",
    region: "South Asia",
    imageKeywords: ["bangladeshi", "bangladesh", "dhaka"],
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    region: "Middle East",
    imageKeywords: ["dubai", "uae", "emirates", "abu dhabi"],
  },
  SA: {
    code: "SA",
    name: "Saudi Arabia",
    region: "Middle East",
    imageKeywords: ["saudi", "riyadh", "jeddah"],
  },
  US: {
    code: "US",
    name: "United States",
    region: "North America",
    imageKeywords: ["american", "usa", "united states", "new york"],
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    region: "Europe",
    imageKeywords: ["british", "uk", "london", "england"],
  },
  CA: {
    code: "CA",
    name: "Canada",
    region: "North America",
    imageKeywords: ["canadian", "canada", "toronto"],
  },
  AU: {
    code: "AU",
    name: "Australia",
    region: "Oceania",
    imageKeywords: ["australian", "australia", "sydney"],
  },
  SG: {
    code: "SG",
    name: "Singapore",
    region: "Southeast Asia",
    imageKeywords: ["singapore", "singaporean"],
  },
  MY: {
    code: "MY",
    name: "Malaysia",
    region: "Southeast Asia",
    imageKeywords: ["malaysian", "malaysia", "kuala lumpur"],
  },
  NP: {
    code: "NP",
    name: "Nepal",
    region: "South Asia",
    imageKeywords: ["nepali", "nepal", "kathmandu"],
  },
  LK: {
    code: "LK",
    name: "Sri Lanka",
    region: "South Asia",
    imageKeywords: ["sri lankan", "sri lanka", "colombo"],
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    region: "Africa",
    imageKeywords: ["nigerian", "nigeria", "lagos"],
  },
  ZA: {
    code: "ZA",
    name: "South Africa",
    region: "Africa",
    imageKeywords: ["southafrica"],
  },
  DE: {
    code: "DE",
    name: "Germany",
    region: "Europe",
    imageKeywords: ["germany", "german"],
  },
  FR: {
    code: "FR",
    name: "France",
    region: "Europe",
    imageKeywords: ["france", "french"],
  },
};

const TIMEZONE_COUNTRY: Array<{ match: RegExp; code: string }> = [
  { match: /^Asia\/(Kolkata|Calcutta)$/i, code: "IN" },
  { match: /^Asia\/Karachi$/i, code: "PK" },
  { match: /^Asia\/Dhaka$/i, code: "BD" },
  { match: /^Asia\/(Dubai|Muscat)$/i, code: "AE" },
  { match: /^Asia\/Riyadh$/i, code: "SA" },
  { match: /^Asia\/Singapore$/i, code: "SG" },
  { match: /^Asia\/Kuala_Lumpur$/i, code: "MY" },
  { match: /^Asia\/Kathmandu$/i, code: "NP" },
  { match: /^Asia\/Colombo$/i, code: "LK" },
  { match: /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix)/i, code: "US" },
  { match: /^Europe\/London$/i, code: "GB" },
  { match: /^America\/(Toronto|Vancouver)/i, code: "CA" },
  { match: /^Australia\//i, code: "AU" },
  { match: /^Africa\/Lagos$/i, code: "NG" },
  { match: /^Africa\/Johannesburg$/i, code: "ZA" },
  { match: /^Europe\/Berlin$/i, code: "DE" },
  { match: /^Europe\/Paris$/i, code: "FR" },
];

function countryFromCode(code?: string | null): CountryHint | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (normalized === "UK") return COUNTRY_BY_CODE.GB;
  return COUNTRY_BY_CODE[normalized] || null;
}

function resolveCountryHint(input: {
  country?: string;
  locale?: string;
  timeZone?: string;
  headerCountry?: string | null;
}): CountryHint {
  const explicit = countryFromCode(input.country);
  if (explicit) return explicit;

  const header = countryFromCode(input.headerCountry);
  if (header) return header;

  // Timezone reflects real location better than browser language (often en-US).
  const timeZone = (input.timeZone || "").trim();
  for (const row of TIMEZONE_COUNTRY) {
    if (row.match.test(timeZone)) {
      const found = countryFromCode(row.code);
      if (found) return found;
    }
  }

  const locale = (input.locale || "").trim();
  const localeRegion = locale.match(/[-_]([A-Za-z]{2})$/)?.[1];
  const fromLocale = countryFromCode(localeRegion);
  if (fromLocale) return fromLocale;

  // Default for this product audience when unknown
  return COUNTRY_BY_CODE.IN;
}

type CategoryHint = {
  id: string;
  label: string;
  folder: string;
  imageKeywords: string[];
  stockImages: string[];
};

const CATEGORY_HINTS: Record<string, CategoryHint> = {
  school: {
    id: "school",
    label: "School",
    folder: "school",
    imageKeywords: [
      "school",
      "classroom",
      "students",
      "campus",
      "teachers",
      "education",
    ],
    stockImages: [
      "/categories/school/bg11.jpg",
      "/categories/school/bg22.jpg",
      "/categories/school/bg33.png",
    ],
  },
  business: {
    id: "business",
    label: "Business",
    folder: "business",
    imageKeywords: ["office", "business", "corporate", "meeting", "startup"],
    stockImages: [
      "/categories/business/bg11.jpg",
      "/categories/business/bg22.jpg",
      "/categories/business/bg33.jpg",
    ],
  },
  realestate: {
    id: "realestate",
    label: "Real Estate",
    folder: "realestate",
    imageKeywords: ["house", "property", "apartment", "realestate", "home"],
    stockImages: [
      "/categories/realestate/bg1.jpg",
      "/categories/realestate/bg2.jpg",
      "/categories/realestate/BG3.jpg",
    ],
  },
};

function resolveCategoryHint(raw?: string | null): CategoryHint {
  const key = (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (key.includes("school") || key.includes("education")) {
    return CATEGORY_HINTS.school;
  }
  if (key.includes("realestate") || key.includes("property") || key.includes("estate")) {
    return CATEGORY_HINTS.realestate;
  }
  if (key.includes("business") || key.includes("corporate") || key.includes("agency")) {
    return CATEGORY_HINTS.business;
  }
  return CATEGORY_HINTS.school;
}

function sectionTopicKeywords(
  sectionType: string,
  category: CategoryHint,
): string[] {
  const bySection: Record<string, string[]> = {
    About: ["about", "campus", "people"],
    Banner: ["banner", "hero", "building"],
    Gallery: ["gallery", "activity", "event"],
    Product: ["services", "program", "offer"],
    WhyChooseUs: ["teachers", "team", "quality"],
    Testimonial: ["happy", "parents", "clients"],
    FAQ: ["help", "support", "guide"],
    FormDetail: ["contact", "reception", "desk"],
  };
  return [
    ...category.imageKeywords.slice(0, 4),
    ...(bySection[sectionType] || ["website"]),
  ];
}

function buildImagePrompt(
  sectionType: string,
  siteContext: string,
  userMessage: string,
  country: CountryHint,
  category: CategoryHint,
  variationSeed: string,
): string {
  const label =
    READY_SECTIONS.find((item) => item.type === sectionType)?.label ||
    sectionType;
  return `Professional website photo for a ${category.label} website ${label} section in ${country.name}. Context: ${siteContext}. User request: ${userMessage}. Variation: ${variationSeed}. The photo MUST clearly match the ${category.label} category (keywords: ${category.imageKeywords.join(", ")}). People, places, clothing and environment should look like ${country.name}. Do NOT show unrelated scenes like ocean, mountains, abstract art, or random nature unless the category is travel. Photorealistic, high quality, no text, no watermark, no logo.`;
}

async function generateOpenAiImage(params: {
  apiKey: string;
  sectionType: string;
  siteContext: string;
  userMessage: string;
  country: CountryHint;
  category: CategoryHint;
}): Promise<string | null> {
  const variationSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const prompt = buildImagePrompt(
    params.sectionType,
    params.siteContext,
    params.userMessage,
    params.country,
    params.category,
    variationSeed,
  );

  // Prefer dall-e-3; fall back to dall-e-2 if unavailable.
  const attempts: Array<{ model: string; size: string }> = [
    { model: "dall-e-3", size: "1024x1024" },
    { model: "dall-e-2", size: "1024x1024" },
  ];

  for (const attempt of attempts) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: attempt.model,
        prompt,
        n: 1,
        size: attempt.size,
        response_format: "b64_json",
      }),
    });

    if (!response.ok) continue;
    const data = (await response.json().catch(() => ({}))) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const b64 = data.data?.[0]?.b64_json;
    if (b64) {
      return saveImageBuffer(Buffer.from(b64, "base64"), "png");
    }
    const remoteUrl = data.data?.[0]?.url;
    if (remoteUrl) {
      const downloaded = await fetch(remoteUrl, { cache: "no-store" });
      if (!downloaded.ok) continue;
      const bytes = Buffer.from(await downloaded.arrayBuffer());
      return saveImageBuffer(bytes, "png");
    }
  }
  return null;
}

function bufferFingerprint(bytes: Buffer): string {
  const sample = bytes.subarray(0, Math.min(bytes.length, 2048));
  let hash = bytes.length;
  for (let i = 0; i < sample.length; i += 17) {
    hash = (hash * 33 + sample[i]) >>> 0;
  }
  return `${bytes.length}:${hash}`;
}

async function readExistingImageFingerprint(
  publicPath: string,
): Promise<string | null> {
  if (!publicPath || !publicPath.startsWith("/")) return null;
  try {
    const absolute = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    const { readFile } = await import("fs/promises");
    const bytes = await readFile(absolute);
    return bufferFingerprint(bytes);
  } catch {
    return null;
  }
}

async function downloadImageCandidate(url: string): Promise<{
  bytes: Buffer;
  extension: "png" | "jpg" | "webp";
} | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "image/*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1500) return null;
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    return { bytes, extension };
  } catch {
    return null;
  }
}

async function fetchOnlineStockImage(
  sectionType: string,
  country: CountryHint,
  category: CategoryHint,
  avoidFingerprints: Set<string> = new Set(),
  usedMagnificIds: Set<number> = new Set(),
  extraTopics: string[] = [],
): Promise<string | null> {
  const topics = buildLocalizedStockTerms({
    category: {
      id: category.id,
      label: category.label,
      imageKeywords: category.imageKeywords,
      stockImages: category.stockImages,
    },
    country: {
      code: country.code,
      name: country.name,
      region: country.region,
      imageKeywords: country.imageKeywords,
      acceptLanguage:
        country.code === "IN"
          ? "en-IN"
          : country.code === "GB"
            ? "en-GB"
            : country.code === "AE"
              ? "en-AE"
              : "en-US",
    },
    hintWords: [
      ...extraTopics,
      ...sectionTopicKeywords(sectionType, category).slice(0, 3),
    ],
    extras: [`slot${usedMagnificIds.size}`],
  });

  const acceptLanguage =
    country.code === "IN"
      ? "en-IN"
      : country.code === "GB"
        ? "en-GB"
        : country.code === "AE"
          ? "en-AE"
          : country.code === "US"
            ? "en-US"
            : "en-US";

  for (let magAttempt = 0; magAttempt < 4; magAttempt += 1) {
    const magnific = await fetchMagnificStockImage(topics, {
      maxAttempts: 5,
      excludeFingerprints: avoidFingerprints,
      excludeIds: usedMagnificIds,
      acceptLanguage,
    });
    if (!magnific) break;
    const fingerprint = bufferFingerprint(magnific.bytes);
    if (avoidFingerprints.has(fingerprint)) continue;
    usedMagnificIds.add(magnific.resourceId);
    const saved = await saveImageBuffer(magnific.bytes, magnific.extension);
    avoidFingerprints.add(fingerprint);
    return saved;
  }

  // Magnific daily quota exhausted / failed → Pixabay (2nd)
  for (let pixabayAttempt = 0; pixabayAttempt < 4; pixabayAttempt += 1) {
    const pixabay = await fetchPixabayStockImage(topics, {
      maxAttempts: 6,
      excludeFingerprints: avoidFingerprints,
      excludeIds: usedMagnificIds,
      countryCode: country.code,
      categoryKeywords: [
        category.label,
        category.id,
        ...category.imageKeywords,
      ],
      countryKeywords: [
        country.name,
        country.region,
        country.code,
        ...country.imageKeywords,
      ],
    });
    if (!pixabay) break;
    const fingerprint = bufferFingerprint(pixabay.bytes);
    if (avoidFingerprints.has(fingerprint)) continue;
    usedMagnificIds.add(pixabay.resourceId);
    const saved = await saveImageBuffer(pixabay.bytes, pixabay.extension);
    avoidFingerprints.add(fingerprint);
    return saved;
  }

  // Then Pexels (3rd)
  for (let pexelsAttempt = 0; pexelsAttempt < 4; pexelsAttempt += 1) {
    const pexels = await fetchPexelsStockImage(topics, {
      maxAttempts: 6,
      excludeFingerprints: avoidFingerprints,
      excludeIds: usedMagnificIds,
      acceptLanguage,
      countryCode: country.code,
      categoryKeywords: [
        category.label,
        category.id,
        ...category.imageKeywords,
      ],
      countryKeywords: [
        country.name,
        country.region,
        country.code,
        ...country.imageKeywords,
      ],
    });
    if (!pexels) break;
    const fingerprint = bufferFingerprint(pexels.bytes);
    if (avoidFingerprints.has(fingerprint)) continue;
    usedMagnificIds.add(pexels.resourceId);
    const saved = await saveImageBuffer(pexels.bytes, pexels.extension);
    avoidFingerprints.add(fingerprint);
    return saved;
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const seed = `${Date.now()}-${attempt}-${Math.random().toString(36).slice(2, 10)}`;
    const topic = topics[attempt % topics.length];
    const countryKey =
      country.imageKeywords[attempt % country.imageKeywords.length];
    const categoryKey =
      category.imageKeywords[attempt % category.imageKeywords.length];

    // Legacy fallback only — prefer Magnific / Pixabay / Pexels above.
    const candidates = [
      `https://loremflickr.com/1280/854/${encodeURIComponent(`${categoryKey},${topic},${countryKey}`)}?random=${encodeURIComponent(seed)}`,
      `https://loremflickr.com/1280/854/${encodeURIComponent(`${category.id},${topic},${country.code.toLowerCase()}`)}?lock=${encodeURIComponent(seed)}`,
      `https://loremflickr.com/1280/854/${encodeURIComponent(`${categoryKey},${countryKey}`)}?random=${encodeURIComponent(`${seed}-b`)}`,
    ];

    for (const url of candidates) {
      const downloaded = await downloadImageCandidate(url);
      if (!downloaded) continue;
      const fingerprint = bufferFingerprint(downloaded.bytes);
      if (avoidFingerprints.has(fingerprint)) continue;
      const saved = await saveImageBuffer(
        downloaded.bytes,
        downloaded.extension,
      );
      avoidFingerprints.add(fingerprint);
      return saved;
    }
  }
  return null;
}

function localFallbackImageFields(
  sectionType: string,
  sections: SectionSnapshot[],
  category: CategoryHint,
): Record<string, unknown> {
  const current = getSectionImageFields(sections, sectionType);
  const pool = category.stockImages.length
    ? category.stockImages
    : STOCK_IMAGES;
  const pick = (currentSrc: string, alsoAvoid: string[] = []) => {
    const avoid = new Set(
      [currentSrc, ...alsoAvoid]
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    );
    const options = pool.filter((src) => !avoid.has(src.toLowerCase()));
    if (options.length) {
      return options[Math.floor(Math.random() * options.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)] || STOCK_IMAGES[0];
  };

  const nextBackground = pick(current.backgroundImage);
  const fields: Record<string, unknown> = {
    backgroundImage: nextBackground,
  };
  if (sectionType === "About" || current.sideImage) {
    fields.sideImage = pick(current.sideImage, [nextBackground]);
  }
  return fields;
}

async function buildOnlineImageFields(params: {
  apiKey?: string;
  sectionType: string;
  sections: SectionSnapshot[];
  siteContext: string;
  userMessage: string;
  country: CountryHint;
  category: CategoryHint;
}): Promise<{ fields: Record<string, unknown>; source: "ai" | "online" | "local" }> {
  const current = getSectionImageFields(params.sections, params.sectionType);
  const needSide = params.sectionType === "About" || Boolean(current.sideImage);
  const avoid = new Set<string>();
  const usedMagnificIds = new Set<number>();
  for (const src of [current.backgroundImage, current.sideImage]) {
    const fp = await readExistingImageFingerprint(src.split("?")[0] || src);
    if (fp) avoid.add(fp);
  }

  let background: string | null = null;
  let side: string | null = null;
  let source: "ai" | "online" | "local" = "local";

  if (params.apiKey) {
    background = await generateOpenAiImage({
      apiKey: params.apiKey,
      sectionType: params.sectionType,
      siteContext: params.siteContext,
      userMessage: `${params.userMessage} | ${params.category.label} category | unique scene ${Date.now()}`,
      country: params.country,
      category: params.category,
    });
    if (background && needSide) {
      side = await generateOpenAiImage({
        apiKey: params.apiKey,
        sectionType: params.sectionType,
        siteContext: params.siteContext,
        userMessage: `${params.userMessage} (alternate secondary/side photo for ${params.category.label}, different angle, unique ${Date.now()})`,
        country: params.country,
        category: params.category,
      });
    }
    if (background) source = "ai";
  }

  if (!background) {
    background = await fetchOnlineStockImage(
      params.sectionType,
      params.country,
      params.category,
      avoid,
      usedMagnificIds,
    );
    if (background && needSide) {
      side = await fetchOnlineStockImage(
        params.sectionType,
        params.country,
        params.category,
        avoid,
        usedMagnificIds,
      );
    }
    if (background) source = "online";
  }

  if (!background) {
    return {
      fields: localFallbackImageFields(
        params.sectionType,
        params.sections,
        params.category,
      ),
      source: "local",
    };
  }

  const fields: Record<string, unknown> = { backgroundImage: background };
  if (needSide) {
    fields.sideImage =
      side ||
      (await fetchOnlineStockImage(
        params.sectionType,
        params.country,
        params.category,
        avoid,
        usedMagnificIds,
      )) ||
      localFallbackImageFields(
        params.sectionType,
        params.sections,
        params.category,
      ).sideImage ||
      pickDifferentImage(current.sideImage, [background]);
  }
  return { fields, source };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      message?: string;
      sections?: SectionSnapshot[];
      siteContext?: string;
      history?: ChatTurn[];
      pendingChoices?: AiChoice[];
      country?: string;
      locale?: string;
      timeZone?: string;
      category?: string;
      isSinglePageTemplate?: boolean;
      currentPage?: string;
      pageLabels?: string[];
      themeVariables?: Record<string, string>;
      focusSectionId?: string;
      focusSectionType?: string;
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 },
      );
    }

    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const pendingChoices = Array.isArray(body.pendingChoices)
      ? body.pendingChoices.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.label === "string",
        )
      : [];
    const sections = Array.isArray(body.sections) ? body.sections : [];
    const siteContext = body.siteContext?.trim() || "Website builder project";
    const country = resolveCountryHint({
      country: body.country,
      locale: body.locale,
      timeZone: body.timeZone,
      headerCountry:
        request.headers.get("x-vercel-ip-country") ||
        request.headers.get("cf-ipcountry") ||
        request.headers.get("x-country-code"),
    });
    const category = resolveCategoryHint(
      body.category || siteContext.match(/category:\s*([^·]+)/i)?.[1],
    );
    const isSinglePageTemplate = body.isSinglePageTemplate === true;
    const currentPage =
      typeof body.currentPage === "string" ? body.currentPage.trim() : "";
    const pageLabels = Array.isArray(body.pageLabels)
      ? body.pageLabels
          .filter((label): label is string => typeof label === "string")
          .map((label) => label.trim())
          .filter(Boolean)
          .slice(0, 40)
      : [];

    // Fast local path — works even if OpenAI is down/invalid.
    const themeVariables =
      body.themeVariables && typeof body.themeVariables === "object"
        ? (body.themeVariables as Record<string, string>)
        : undefined;
    const focusSectionId =
      typeof (body as { focusSectionId?: unknown }).focusSectionId === "string"
        ? (body as { focusSectionId: string }).focusSectionId.trim()
        : "";
    // Strip client focus tag so intent parsers don't match words like "add/section".
    const focusTag = message.match(
      /^\[SECTION_FOCUS\|([^|\]]*)\|([^|\]]*)\|([^\]]*)\]\s*/i,
    );
    const cleanMessage = focusTag
      ? message.slice(focusTag[0].length).trim()
      : message;
    const resolvedFocusId =
      focusSectionId ||
      (focusTag?.[1] ? focusTag[1].trim() : "") ||
      null;
    const focusSectionType =
      typeof (body as { focusSectionType?: unknown }).focusSectionType ===
      "string"
        ? (body as { focusSectionType: string }).focusSectionType.trim()
        : focusTag?.[2]?.trim() || "";

    // Manager AI — scoped addMasterItems for master page managers
    const masterFocusKindById: Record<string, MasterKind> = {
      __master_blog__: "blog",
      __master_service__: "service",
      __master_gallery__: "gallery",
      __master_team__: "team",
      __master_portfolio__: "portfolio",
      __master_event__: "event",
      __master_property__: "property",
      __master_countries__: "country",
    };
    const masterFocusKindByType: Record<string, MasterKind> = {
      MasterBlog: "blog",
      MasterService: "service",
      MasterGallery: "gallery",
      MasterTeam: "team",
      MasterPortfolio: "portfolio",
      MasterEvent: "event",
      MasterProperty: "property",
      MasterCountries: "country",
    };
    const focusedMaster: MasterKind | null =
      masterFocusKindById[resolvedFocusId || ""] ||
      masterFocusKindByType[focusSectionType || ""] ||
      null;

    if (resolvedFocusId && focusedMaster) {
      const masterNoun: Record<
        MasterKind,
        { en: string; hi: string; examples: { en: string; hi: string } }
      > = {
        blog: {
          en: "Blogs",
          hi: "Blogs",
          examples: {
            en: "add 3 blogs — or topics: blogs: STEM, Sports, Admissions",
            hi: "3 blogs add kro — ya topics: blogs: STEM, Sports, Admissions",
          },
        },
        service: {
          en: "Services",
          hi: "Services",
          examples: {
            en: "add 3 services — or: services: Consulting, Support, Training",
            hi: "3 services add kro — ya: services: Consulting, Support, Training",
          },
        },
        gallery: {
          en: "Gallery",
          hi: "Gallery",
          examples: {
            en: "add 4 gallery items — or: gallery: Campus, Events, Sports",
            hi: "4 gallery items add kro — ya: gallery: Campus, Events, Sports",
          },
        },
        team: {
          en: "Teams",
          hi: "Teams",
          examples: {
            en: "add 3 team members — or: team: Principal, Counselor, Coach",
            hi: "3 team members add kro — ya: team: Principal, Counselor, Coach",
          },
        },
        portfolio: {
          en: "Portfolio",
          hi: "Portfolio",
          examples: {
            en: "add 3 portfolio items — or: portfolio: Website, Branding, App",
            hi: "3 portfolio items add kro — ya: portfolio: Website, Branding, App",
          },
        },
        event: {
          en: "Events",
          hi: "Events",
          examples: {
            en: "add 3 events — or: events: Open House, Sports Day, Workshop",
            hi: "3 events add kro — ya: events: Open House, Sports Day, Workshop",
          },
        },
        property: {
          en: "Property",
          hi: "Property",
          examples: {
            en: "add 2 properties — or: properties: Lakeview Villa, City Apartment",
            hi: "2 properties add kro — ya: properties: Lakeview Villa, City Apartment",
          },
        },
        country: {
          en: "Country listings",
          hi: "Country listings",
          examples: {
            en: "add 3 country listings — or fix: Austrealia to Australia",
            hi: "3 country listings add kro — ya fix: Austrealia to Australia",
          },
        },
      };
      const noun = masterNoun[focusedMaster];
      const prevAssistant = lastAssistantText(history as ChatTurn[]);
      const submenuAnswer = resolveMasterSubmenuChoice(
        cleanMessage,
        pendingChoices as AiChoice[],
      );
      const modeAnswer = resolveMasterSubmenuModeChoice(
        cleanMessage,
        pendingChoices as AiChoice[],
        focusedMaster,
      );
      const mergeAnswer = resolveMasterSubmenuMergeChoice(
        cleanMessage,
        pendingChoices as AiChoice[],
      );

      const continuingSubmenuAsk =
        masterSupportsHeaderSubmenu(focusedMaster) &&
        submenuAnswer !== null &&
        (prevAskedMasterHeaderSubmenu(prevAssistant) ||
          pendingChoices.some(
            (choice) =>
              choice.id === "master_submenu_yes" ||
              choice.id === "master_submenu_no",
          ));

      const continuingModeAsk =
        masterSupportsHeaderSubmenu(focusedMaster) &&
        modeAnswer !== null &&
        (prevAskedMasterSubmenuMode(prevAssistant) ||
          pendingChoices.some(
            (choice) =>
              choice.id === "master_submenu_mode_name" ||
              choice.id === "master_submenu_mode_category" ||
              choice.id === "master_submenu_mode_type",
          ));

      const continuingMergeAsk =
        masterSupportsHeaderSubmenu(focusedMaster) &&
        mergeAnswer !== null &&
        (prevAskedMasterSubmenuMerge(prevAssistant) ||
          pendingChoices.some(
            (choice) =>
              choice.id === "master_submenu_merge_new" ||
              choice.id === "master_submenu_merge_before" ||
              choice.id === "master_submenu_merge_after" ||
              choice.id === "master_submenu_merge_skip" ||
              choice.id === "master_submenu_merge_mix" ||
              choice.id === "master_submenu_merge_replace",
          ));

      const looksLikeCreate =
        !wantsPublishSite(cleanMessage) &&
        !wantsSetSiteSeo(cleanMessage) &&
        !wantsSetThemeColor(cleanMessage) &&
        !wantsPatchTopbarContact(cleanMessage) &&
        !wantsPatchHeaderBrand(cleanMessage) &&
        !wantsDeleteMasterItem(cleanMessage) &&
        !wantsRenamePage(cleanMessage) &&
        !wantsDuplicateSection(cleanMessage) &&
        !wantsRefreshHomeContent(cleanMessage) &&
        !wantsDeleteSection(cleanMessage) &&
        !wantsMoveSection(cleanMessage) &&
        (/\b\d+\s*(blogs?|posts?|articles?|services?|gallery|galleries|items?|team|members?|portfolio|projects?|events?|propert(?:y|ies)|countr(?:y|ies)|listings?)?\b/i.test(
          cleanMessage,
        ) ||
          /\b(add|banao|bnao|create|naya|new|kro|karo|daalo|dal|lagao)\b/i.test(
            cleanMessage,
          ) ||
          /\b(blogs?|posts?|articles?|services?|gallery|team|portfolio|events?|propert(?:y|ies))\s*[:\-]/i.test(
            cleanMessage,
          ) ||
          Boolean(extractMasterItemTitles(cleanMessage, 1)));

      if (focusedMaster === "country") {
        const countryRename = extractCountryRename(cleanMessage);
        if (countryRename) {
          const english = isMostlyEnglish(cleanMessage);
          return NextResponse.json({
            reply: english
              ? `Renaming country "${countryRename.from}" → "${countryRename.to}" (including listing labels).`
              : `"${countryRename.from}" ko "${countryRename.to}" rename kar raha hoon — listings bhi update hongi.`,
            actions: [
              {
                type: "renameCountry",
                from: countryRename.from,
                to: countryRename.to,
              },
            ],
            choices: [],
          });
        }
      } else {
        const itemRename = extractNameRenamePair(cleanMessage);
        if (itemRename) {
          const english = isMostlyEnglish(cleanMessage);
          return NextResponse.json({
            reply: english
              ? `Renaming ${focusedMaster} "${itemRename.from}" → "${itemRename.to}".`
              : `"${itemRename.from}" ko "${itemRename.to}" rename kar raha hoon.`,
            actions: [
              {
                type: "renameMasterItem",
                master: focusedMaster,
                from: itemRename.from,
                to: itemRename.to,
              },
            ],
            choices: [],
          });
        }
      }

      // Master item delete from manager chat
      {
        const masterDeleteConfirm = resolveDeleteMasterConfirm(
          cleanMessage,
          pendingChoices as AiChoice[],
        );
        const pendingMaster = getPendingDeleteMaster(
          pendingChoices as AiChoice[],
        );
        if (masterDeleteConfirm === "yes" && pendingMaster) {
          return NextResponse.json(
            buildDeleteMasterItemExecute(
              pendingMaster.master,
              pendingMaster.title,
              cleanMessage,
            ),
          );
        }
        if (masterDeleteConfirm === "no" && pendingMaster) {
          return NextResponse.json({
            reply: `OK — "${pendingMaster.title}" delete cancelled.`,
            actions: [],
            choices: [],
          });
        }
      }
      if (wantsDeleteMasterItem(cleanMessage, focusedMaster)) {
        const title = extractDeleteMasterTitle(cleanMessage, focusedMaster);
        if (title) {
          return NextResponse.json(
            buildDeleteMasterItemAsk(focusedMaster, title, cleanMessage),
          );
        }
        // "STEM hatao" / "delete STEM" inside blogs manager
        const bare = cleanMessage
          .replace(
            /\b(delete|remove|hatao|hata\s*do|hata\s*kro|karo|kro|please|pls|blog|blogs|service|services|gallery|team|portfolio|event|events|property|properties|listing|listings)\b/gi,
            " ",
          )
          .replace(/\s+/g, " ")
          .trim();
        if (bare.length >= 2 && bare.length <= 80) {
          return NextResponse.json(
            buildDeleteMasterItemAsk(focusedMaster, bare, cleanMessage),
          );
        }
        return NextResponse.json({
          reply: `Kaunsa ${focusedMaster} delete? Exact title likho. Example: STEM delete kro.`,
          actions: [],
          choices: [],
        });
      }

      // Allow site-wide SEO / publish even from manager chat
      {
        const publishConfirm = resolvePublishSiteConfirm(
          cleanMessage,
          pendingChoices as AiChoice[],
        );
        if (publishConfirm === "yes") {
          return NextResponse.json(buildPublishSiteExecute(cleanMessage));
        }
        if (publishConfirm === "no") {
          return NextResponse.json({
            reply: "OK — publish cancelled.",
            actions: [],
            choices: [],
          });
        }
      }
      if (wantsPublishSite(cleanMessage)) {
        return NextResponse.json(buildPublishSiteAsk(cleanMessage));
      }
      if (wantsSetSiteSeo(cleanMessage)) {
        return NextResponse.json(buildSetSiteSeo(cleanMessage, category));
      }
      if (wantsSetThemeColor(cleanMessage)) {
        return NextResponse.json(buildSetThemeColor(cleanMessage));
      }
      if (wantsPatchTopbarContact(cleanMessage)) {
        return NextResponse.json(buildPatchTopbarContact(cleanMessage));
      }
      if (wantsPatchHeaderBrand(cleanMessage)) {
        return NextResponse.json(buildPatchHeaderBrand(cleanMessage));
      }
      if (wantsRenamePage(cleanMessage)) {
        return NextResponse.json(
          buildRenamePage(cleanMessage, {
            isSinglePage: isSinglePageTemplate,
            pageLabels,
          }),
        );
      }
      if (wantsDuplicateSection(cleanMessage)) {
        return NextResponse.json(buildDuplicateSection(cleanMessage));
      }
      {
        const directRefresh = cleanMessage
          .trim()
          .match(/^refresh-home-(yes|no):(.+)$/i);
        if (directRefresh) {
          const audience = directRefresh[2].trim();
          if (directRefresh[1].toLowerCase() === "yes" && audience) {
            return NextResponse.json(
              buildRefreshHomeContentExecute(audience, cleanMessage),
            );
          }
          return NextResponse.json({
            reply: "OK — home content refresh cancelled.",
            actions: [],
            choices: [],
          });
        }
        const refreshConfirm = resolveRefreshHomeConfirm(
          cleanMessage,
          pendingChoices as AiChoice[],
        );
        const pendingAudience = getPendingRefreshAudience(
          pendingChoices as AiChoice[],
        );
        if (refreshConfirm === "yes" && pendingAudience) {
          return NextResponse.json(
            buildRefreshHomeContentExecute(pendingAudience, cleanMessage),
          );
        }
        if (refreshConfirm === "no" && pendingAudience) {
          return NextResponse.json({
            reply: "OK — home content refresh cancelled.",
            actions: [],
            choices: [],
          });
        }
      }
      if (wantsRefreshHomeContent(cleanMessage)) {
        const audience =
          detectRefreshAudience(cleanMessage, category?.label) ||
          detectRefreshAudience(cleanMessage, null);
        if (!audience) {
          return NextResponse.json({
            reply:
              "Kis industry ke liye rewrite? Example: poori home page ka content school ke liye rewrite kro.",
            actions: [],
            choices: [
              { id: "refresh-home-yes:school", label: "School" },
              { id: "refresh-home-yes:business", label: "Business" },
              { id: "refresh-home-yes:realestate", label: "Realestate" },
            ],
          });
        }
        return NextResponse.json(
          buildRefreshHomeContentAsk(audience, cleanMessage),
        );
      }

      // Step 1: ask Yes/No for header submenu before creating items
      if (
        looksLikeCreate &&
        !continuingSubmenuAsk &&
        !continuingModeAsk &&
        !continuingMergeAsk &&
        masterSupportsHeaderSubmenu(focusedMaster)
      ) {
        const createIntentChoices = withMasterCreateIntent(
          MASTER_SUBMENU_CHOICES,
          cleanMessage,
        );
        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            `Before I create these ${noun.en.toLowerCase()}, add a header menu submenu?`,
            `Banane se pehle: header menu mein ${noun.hi} submenu chahiye?`,
          ),
          actions: [{ type: "ask", options: createIntentChoices }],
          choices: createIntentChoices,
        });
      }

      const pendingCreateIntent =
        getMasterCreateFromPending(pendingChoices as AiChoice[]) ||
        findPriorMasterCreateMessage(history, focusedMaster);

      // Step 2 (after Yes): Category/Name — or Type/Name for Property
      if (continuingSubmenuAsk && submenuAnswer === true) {
        const modeChoices = withMasterCreateIntent(
          masterSubmenuModeChoices(focusedMaster),
          pendingCreateIntent || cleanMessage,
        );
        const isProperty = focusedMaster === "property";
        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            isProperty
              ? "Submenu by Type or by Name? Type = property types (Apartment, Villa…). Name = short titles → detail pages."
              : "Submenu by Category or by Name? Category = group labels → listing page. Name = short titles → detail pages.",
            isProperty
              ? "Submenu Type se banu ya Name se? Type = Apartment/Villa… Name = short title → detail page."
              : "Submenu Category se banu ya Name se? Category = group → listing. Name = short title → detail page.",
          ),
          actions: [{ type: "ask", options: modeChoices }],
          choices: modeChoices,
        });
      }

      // Step 3: if parent already has dropdown children → placement choices
      if (continuingModeAsk && modeAnswer) {
        const hasExisting = masterParentHasDropdownChildren(
          sections,
          focusedMaster,
        );
        if (hasExisting) {
          const mergeChoices = withMasterCreateIntent(
            MASTER_SUBMENU_MERGE_CHOICES,
            pendingCreateIntent || cleanMessage,
            modeAnswer,
          );
          return NextResponse.json({
            reply: focusChatReply(
              cleanMessage,
              "This menu already has a dropdown. Add New Submenu, Before Existing, After, or Not Add?",
              "Pehle se dropdown hai — Add New Submenu, Before Existing, After, ya Not Add?",
            ),
            actions: [{ type: "ask", options: mergeChoices }],
            choices: mergeChoices,
          });
        }
      }

      if (
        !looksLikeCreate &&
        !continuingSubmenuAsk &&
        !continuingModeAsk &&
        !continuingMergeAsk
      ) {
        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            `This chat is for ${noun.en} only. Tell me how many to create — e.g. ${noun.examples.en}.`,
            `Yeh chat sirf ${noun.hi} ke liye hai. Kitne chahiye? Example: ${noun.examples.hi}.`,
          ),
          actions: [],
          choices: [],
        });
      }

      const createSourceMessage =
        continuingSubmenuAsk || continuingModeAsk || continuingMergeAsk
          ? pendingCreateIntent ||
            findPriorMasterCreateMessage(history, focusedMaster) ||
            cleanMessage
          : cleanMessage;

      let headerSubmenu = false;
      let headerSubmenuMode: "name" | "category" | "type" | undefined;
      let headerSubmenuMerge: "new" | "before" | "after" | "skip" | undefined;

      if (continuingSubmenuAsk && submenuAnswer === false) {
        headerSubmenu = false;
      } else if (continuingMergeAsk && mergeAnswer) {
        headerSubmenu = mergeAnswer !== "skip";
        headerSubmenuMode =
          getMasterSubmenuModeFromPending(pendingChoices as AiChoice[]) ||
          findPriorMasterSubmenuMode(history, focusedMaster) ||
          "name";
        headerSubmenuMerge = mergeAnswer;
      } else if (continuingModeAsk && modeAnswer) {
        // No existing dropdown — create submenu from new items only
        headerSubmenu = true;
        headerSubmenuMode = modeAnswer;
        headerSubmenuMerge = "new";
      }

      const apiKeyForMaster = process.env.OPENAI_API_KEY?.trim();
      const modelForMaster = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
      const masterAliases: Record<MasterKind, RegExp> = {
        blog: /\b(blog|blogs|post|posts|article|articles)\b/i,
        service: /\b(service|services)\b/i,
        gallery: /\b(gallery|galleries|images?)\b/i,
        team: /\b(team|members?)\b/i,
        portfolio: /\b(portfolio|portfolios|projects?)\b/i,
        event: /\b(event|events)\b/i,
        property: /\b(property|properties|listings?)\b/i,
        country: /\b(country|countries|listings?)\b/i,
      };
      const masterPhrase: Record<MasterKind, string> = {
        blog: "blogs",
        service: "services",
        gallery: "gallery items",
        team: "team members",
        portfolio: "portfolio items",
        event: "events",
        property: "properties",
        country: "country listings",
      };
      const masterMessage = masterAliases[focusedMaster].test(createSourceMessage)
        ? createSourceMessage
        : `add ${masterPhrase[focusedMaster]} ${createSourceMessage}`;
      let response = buildAddMasterItems(
        masterMessage,
        category,
        focusedMaster,
      );
      const attachSubmenuMeta = (action: AiAction): AiAction =>
        action.type === "addMasterItems"
          ? {
              ...action,
              master: focusedMaster,
              headerSubmenu,
              ...(headerSubmenuMode
                ? { headerSubmenuMode }
                : {}),
              ...(headerSubmenuMerge
                ? { headerSubmenuMerge }
                : {}),
            }
          : action;
      response = {
        ...response,
        actions: response.actions.map(attachSubmenuMeta),
      };
      // Category/type submenu needs distinct group labels (not all "Service").
      response = {
        ...response,
        actions: response.actions.map((action) => {
          if (action.type !== "addMasterItems") return action;
          return {
            ...action,
            items: diversifyMasterItemGroups(
              action.items,
              focusedMaster,
              headerSubmenuMode,
            ),
          };
        }),
      };
      response = await enrichAddMasterItemsResponse({
        response,
        apiKey: apiKeyForMaster,
        model: modelForMaster,
        siteContext,
        userMessage: createSourceMessage,
        country,
        category,
      });
      const actions = normalizeActions(response.actions)
        .filter((action) => action.type === "addMasterItems")
        .map((action) => {
          const withMeta = attachSubmenuMeta(action);
          if (withMeta.type !== "addMasterItems") return withMeta;
          return {
            ...withMeta,
            items: diversifyMasterItemGroups(
              withMeta.items,
              focusedMaster,
              headerSubmenuMode,
            ),
          };
        });
      if (!actions.length) {
        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            `This chat is for ${noun.en} only. Try: ${noun.examples.en}.`,
            `Yeh chat sirf ${noun.hi} ke liye hai. Example: ${noun.examples.hi}.`,
          ),
          actions: [],
          choices: [],
        });
      }
      const submenuNote = !headerSubmenu
        ? headerSubmenuMerge === "skip"
          ? focusChatReply(
              cleanMessage,
              " Items added; header menu left unchanged (Not Add).",
              " Items add ho gaye; header menu same (Not Add).",
            )
          : ""
        : headerSubmenuMode === "category"
          ? focusChatReply(
              cleanMessage,
              " Header submenu by category is ready — click opens the listing page.",
              " Header submenu category-wise set ho gaya — click pe listing page khulegi.",
            )
          : headerSubmenuMode === "type"
            ? focusChatReply(
                cleanMessage,
                " Header submenu by property type is ready — click opens the listing page.",
                " Header submenu type-wise set ho gaya — click pe listing page khulegi.",
              )
            : focusChatReply(
                cleanMessage,
                " Header submenu with short names is ready — click opens each detail page.",
                " Header submenu short names ke saath set ho gaya — click pe detail page khulegi.",
              );
      return NextResponse.json({
        reply: `${response.reply}${submenuNote}`,
        actions,
        choices: [],
      });
    }

    // Whole-home language rewrite (hindi/english/urdu) — before FAQ/section shortcuts.
    if (wantsHomeLanguageContent(cleanMessage)) {
      const language = extractHomeContentLanguage(cleanMessage);
      if (language) {
        return NextResponse.json(
          await buildHomeLanguageContentResponse({
            message: cleanMessage,
            language,
            sections,
            siteContext,
          }),
        );
      }
    }

    // Section-scoped chat → LLM-first (ChatGPT-style). Skip regex intent maze.
    if (resolvedFocusId) {
      const focused = findFocusedSection(sections, resolvedFocusId);
      if (!focused) {
        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            "Focused section not found. Close chat and open AI from the section toolbar again.",
            "Focused section nahi mili. Chat band karke section toolbar se AI dobara open karo.",
          ),
          actions: [],
          choices: [],
        });
      }

      const focusType = focused.type;
      const focusHint = focused.id || focused.type;
      const focusLocked = LOCKED_SECTION_TYPES.has(focusType);

      // Structure ops must be deterministic — LLM used to wrongly say "not possible".
      {
        const sectionDeleteConfirm = resolveDeleteSectionConfirm(
          cleanMessage,
          pendingChoices as AiChoice[],
        );
        const pendingSectionType = getPendingDeleteSectionType(
          pendingChoices as AiChoice[],
        );
        if (sectionDeleteConfirm === "yes" && pendingSectionType) {
          return NextResponse.json(
            buildDeleteSectionExecute(pendingSectionType, cleanMessage),
          );
        }
        if (sectionDeleteConfirm === "no" && pendingSectionType) {
          return NextResponse.json({
            reply: focusChatReply(
              cleanMessage,
              "OK — section delete cancelled.",
              "OK — section delete cancel.",
            ),
            actions: [],
            choices: [],
          });
        }
      }
      if (
        !focusLocked &&
        /\b(delete|remove|hatao|hata\s*do|hata\s*kro)\b/i.test(cleanMessage) &&
        !/\b(page|menu|nav)\b/i.test(cleanMessage) &&
        !wantsRemoveFaqItems(cleanMessage)
      ) {
        return NextResponse.json(
          buildDeleteSectionAsk(focusType, cleanMessage),
        );
      }
      if (
        !focusLocked &&
        (/\b(move|upar|neeche|up|down)\b/i.test(cleanMessage) ||
          /\b(le\s*jao|lejao)\b/i.test(cleanMessage)) &&
        !/\b(sabse\s+upar\s+wali|pretitle|tagline)\b/i.test(cleanMessage)
      ) {
        return NextResponse.json(
          buildMoveSection(
            focusHint,
            extractMoveDirection(cleanMessage),
            cleanMessage,
          ),
        );
      }
      if (
        !focusLocked &&
        (wantsDuplicateSection(cleanMessage) ||
          /\b(duplicate|copy|clone)\b/i.test(cleanMessage))
      ) {
        const english = isMostlyEnglish(cleanMessage);
        const label =
          READY_SECTIONS.find((item) => item.type === focusType)?.label ||
          focusType;
        return NextResponse.json({
          reply: english
            ? `Duplicating "${label}" section…`
            : `"${label}" section duplicate kar raha hoon…`,
          actions: [{ type: "duplicateSection", sectionHint: focusHint }],
          choices: [],
        });
      }
      if (focusLocked) {
        if (
          /\b(duplicate|copy|clone|delete|remove|hatao|move|upar|neeche)\b/i.test(
            cleanMessage,
          )
        ) {
          return NextResponse.json({
            reply: focusChatReply(
              cleanMessage,
              `"${focusType}" cannot be moved, duplicated, or deleted. You can still change its content.`,
              `"${focusType}" ko move / duplicate / delete nahi kar sakte. Content change kar sakte ho.`,
            ),
            actions: [],
            choices: [],
          });
        }
      }

      // "full image" / "big image" / "image size full" = layout size, NOT new photo
      // If user ALSO asked for content/word-count, skip this — content path handles both.
      const imageLayoutKind = wantsFullOrBigImageLayout(cleanMessage);
      if (imageLayoutKind && !wantsFocusContentRefresh(cleanMessage)) {
        const layout = buildFocusImageLayoutPatch(
          imageLayoutKind,
          focused.id || focused.type,
          focused,
          cleanMessage,
        );
        return NextResponse.json({
          reply: layout.reply,
          actions: normalizeActions(layout.actions),
          choices: [],
        });
      }

      // "button mai icon lagao" / "phone icon" → set CustomSection button.icon
      const prevAssistantForIcon =
        [...history]
          .reverse()
          .find((turn) => turn.role === "assistant")?.content || "";
      if (wantsFocusButtonIcon(cleanMessage, prevAssistantForIcon)) {
        const focusId = focused.id || focused.type;
        const label = sectionDisplayLabel(focused);
        const { icon, iconPosition } =
          resolveButtonIconFromMessage(cleanMessage);
        const data =
          focused.data && typeof focused.data === "object"
            ? focused.data
            : {};

        if (focused.type === "CustomSection") {
          const fields = patchCustomSectionButtonIcon(
            data,
            icon,
            iconPosition,
          );
          if (!fields) {
            return NextResponse.json({
              reply: focusChatReply(
                cleanMessage,
                `No button found in ${label}. Add a button first, then ask for an icon.`,
                `${label} me button nahi mila. Pehle button add karo, phir icon bolo.`,
              ),
              actions: [],
              choices: [],
            });
          }
          const iconLabel =
            icon === "none" ? "removed" : icon.replace(/-/g, " ");
          return NextResponse.json({
            reply: focusChatReply(
              cleanMessage,
              icon === "none"
                ? `${label} button icon removed.`
                : `${label} button icon set to ${iconLabel} (${iconPosition}).`,
              icon === "none"
                ? `${label} button se icon hata diya.`
                : `${label} button pe ${iconLabel} icon laga diya (${iconPosition}).`,
            ),
            actions: [
              {
                type: "patch",
                sectionHint: focusId,
                fields,
              },
            ],
            choices: [],
          });
        }

        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            `Button icons are supported on Custom Section buttons. This ${label} section uses a different button style.`,
            `Button icons Custom Section buttons pe support hain. Is ${label} section me alag button style hai.`,
          ),
          actions: [],
          choices: [],
        });
      }

      const prevAssistantText = [...history]
        .reverse()
        .find((turn) => turn.role === "assistant")?.content || "";

      const imageItems = listFocusImageItems(focused);
      const selectedImageIndex = resolveFocusImageItemIndex(
        cleanMessage,
        pendingChoices,
        prevAssistantText,
        imageItems.length,
      );
      const continuingImagePick =
        imageItems.length > 1 &&
        selectedImageIndex != null &&
        /\b(kaunsi|which|konsi|images hain|kaunsi change|which image)\b/i.test(
          prevAssistantText,
        ) &&
        !wantsFocusContentRefresh(cleanMessage);

      // "images update kro" → if multiple cards, ask which; else generate+apply
      if (
        wantsFocusImageRefresh(cleanMessage, prevAssistantText) ||
        continuingImagePick
      ) {
        const apiKeyForImage = process.env.OPENAI_API_KEY?.trim();
        const focusId = focused.id || focused.type;
        const label = sectionDisplayLabel(focused);
        const selectedIndex = selectedImageIndex;

        // Multiple images and user hasn't picked yet → ask
        if (imageItems.length > 1 && selectedIndex == null) {
          const choices: AiChoice[] = imageItems.map((item) => ({
            id: `img-item:${item.index}`,
            label: `${item.index + 1}. ${item.label}`,
          }));
          return NextResponse.json({
            reply: focusChatReply(
              cleanMessage,
              `${label} has ${imageItems.length} images. Which one should I change?`,
              `${label} me ${imageItems.length} images hain. Kaunsi change karni hai?`,
            ),
            actions: [],
            choices,
          });
        }

        const targetIndex =
          selectedIndex != null
            ? selectedIndex
            : imageItems.length
              ? 0
              : 0;
        const currentImg =
          imageItems[targetIndex]?.image ||
          getFocusSectionCurrentImage(focused);
        const pickedLabel =
          imageItems[targetIndex]?.label || `${targetIndex + 1}`;
        const imagePrompt =
          continuingImagePick ||
          selectedIndex != null ||
          /^(images?|photos?|pictures?|img)$/i.test(cleanMessage.trim()) ||
          /\b(images?\s*bola|image\s*bola|i\s*said\s*images?|change\s*image|image\s*change)\b/i.test(
            cleanMessage,
          )
            ? `${category.label} ${label} ${pickedLabel} photo, realistic, unique scene ${Date.now()}`
            : cleanMessage;
        const imageGenType =
          focused.type === "Product" ||
          focused.type === "CustomSection" ||
          focused.type === "Gallery"
            ? "Banner"
            : focused.type;
        const { fields: generated, source } = await buildOnlineImageFields({
          apiKey: apiKeyForImage,
          sectionType: imageGenType,
          sections,
          siteContext,
          userMessage: imagePrompt,
          country,
          category,
        });
        let imageSrc =
          (typeof generated.backgroundImage === "string" &&
            generated.backgroundImage) ||
          (typeof generated.sideImage === "string" && generated.sideImage) ||
          "";
        if (
          !imageSrc ||
          imageSrc.split("?")[0].toLowerCase() ===
            currentImg.split("?")[0].toLowerCase()
        ) {
          imageSrc = pickDifferentImage(currentImg || imageSrc);
        }
        const fields = buildFocusSectionImageFields(
          focused,
          imageSrc,
          targetIndex,
        );
        if (!imageSrc || !Object.keys(fields).length) {
          return NextResponse.json({
            reply: focusChatReply(
              cleanMessage,
              `Couldn't update the image for ${label}. Please try again.`,
              `${label} ke liye image update nahi ho payi. Phir se try karo.`,
            ),
            actions: [],
            choices: [],
          });
        }
        const sourceNoteEn =
          source === "ai"
            ? "AI photo"
            : source === "online"
              ? "online photo"
              : "stock photo";
        const sourceNoteHi = sourceNoteEn;
        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            `${label} → "${pickedLabel}" image updated (${sourceNoteEn}).`,
            `${label} → "${pickedLabel}" image change ho gayi (${sourceNoteHi}).`,
          ),
          actions: [
            {
              type: "patch",
              sectionHint: focusId,
              fields,
            },
          ],
          choices: [],
        });
      }

      const { hasAnyAiKey } = await import("@/lib/aiProvider");
      if (!hasAnyAiKey()) {
        return NextResponse.json(
          {
            message:
              "GEMINI_API_KEY missing. Add it in apps/frontend/.env.local then restart.",
            code: "MISSING_API_KEY",
          },
          { status: 503 },
        );
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "gemini";
      const model = process.env.GEMINI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gemini-2.0-flash";
      const focusData =
        focused.data && typeof focused.data === "object" ? focused.data : {};
      const editableFields =
        Array.isArray(focused.editableFields) && focused.editableFields.length
          ? focused.editableFields
          : Object.keys(focusData);
      const focusPayload = {
        mode: "section-focus",
        siteContext,
        userRequest: cleanMessage,
        replyLanguage: isMostlyEnglish(cleanMessage) ? "English" : "Hindi",
        themeVariables: themeVariables || {},
        focusedSection: {
          id: focused.id || focused.type,
          type: focused.type,
          variant: focused.variant,
          editableFields,
          itemShapes: focused.itemShapes || {},
          data: focusData,
          label:
            focused.type === "CustomSection"
              ? String(
                  (focusData as { sectionName?: string }).sectionName ||
                    "Custom",
                )
              : focused.type,
        },
        fieldGuide: wantsFocusPretitleOnly(cleanMessage)
          ? "Update ONLY the pretitle/tagline using exact editableFields keys from focusedSection.data."
          : shouldDeferContentToFocusLlm(cleanMessage)
            ? "Rewrite ALL text in focusedSection using editableFields + itemShapes. Patch nested array items (bannerSlides, faqItems, productItems, columns, blocks, etc.) with unique copy per item. Use exact field names from data — do not invent aliases. Keep images unchanged."
            : "Patch only focusedSection. Reply in replyLanguage only (English→English, Hindi→Hindi). Subject photo change → __generateImage+__imagePrompt. 'full/big image' → layout only. Don't rewrite text unless asked.",
        variationSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };

      const focusHistory = shouldDeferContentToFocusLlm(cleanMessage)
        ? []
        : history.filter(
            (turn) =>
              turn &&
              (turn.role === "user" || turn.role === "assistant") &&
              typeof turn.content === "string" &&
              turn.content.trim(),
          );
      const focusMessages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        { role: "system", content: SECTION_FOCUS_SYSTEM_PROMPT },
        ...focusHistory.map((turn) => ({
          role: turn.role,
          content: turn.content,
        })),
        {
          role: "user",
          content: JSON.stringify(focusPayload),
        },
      ];

      let openaiRes = await callOpenAi({
        apiKey,
        model,
        messages: focusMessages,
        useJsonFormat: true,
        temperature: 0.7,
      });
      if (!openaiRes.ok) {
        openaiRes = await callOpenAi({
          apiKey,
          model,
          messages: focusMessages,
          useJsonFormat: false,
          temperature: 0.7,
        });
      }

      const openaiData = (await openaiRes.json().catch(() => ({}))) as {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
      };

      if (!openaiRes.ok) {
        return NextResponse.json({
          reply:
            openaiData.error?.message ||
            focusChatReply(
              cleanMessage,
              "AI service had an issue. Try again in a moment.",
              "AI service me issue aa gaya. Thodi der baad try karo.",
            ),
          actions: [],
          choices: [],
        });
      }

      const content = openaiData.choices?.[0]?.message?.content || "";
      const parsed = extractJson(content);
      if (!parsed) {
        return NextResponse.json({
          reply: focusChatReply(
            cleanMessage,
            "I didn't catch that. Tell me clearly what to change — heading, text, button, image, or design — for this section.",
            "Samajh nahi aaya. Heading, text, button, image, ya design clearly bolo — isi section pe apply karunga.",
          ),
          actions: [],
          choices: [],
        });
      }

      const focusId = focused.id || focused.type;
      let actions = constrainFocusActions(
        normalizeActions(parsed.actions),
        focusId,
      );
      actions = await expandFocusImageActions({
        actions,
        focusId,
        focusType: focused.type,
        sections,
        apiKey,
        userMessage: cleanMessage,
        siteContext,
        country,
        category,
      });

      return NextResponse.json({
        reply: parsed.reply,
        actions: actions.filter((action) => action.type !== "ask"),
        choices: [],
      });
    }

    // Whole-home language rewrite must apply real patches (LLM often only narrates).
    // Even if a section chat was open, "all home page ... urdu/hindi" means the full home.
    if (wantsHomeLanguageContent(cleanMessage)) {
      const language = extractHomeContentLanguage(cleanMessage);
      if (language) {
        return NextResponse.json(
          await buildHomeLanguageContentResponse({
            message: cleanMessage,
            language,
            sections,
            siteContext,
          }),
        );
      }
    }

    const deterministic = resolveDeterministic(
      cleanMessage,
      history,
      pendingChoices,
      sections,
      themeVariables,
      resolvedFocusId,
      category,
      isSinglePageTemplate,
      currentPage || null,
      pageLabels,
    );

    if (isImageGenerateIntent(deterministic)) {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      // "kro" / short confirm → use last real user topic for the image prompt
      const confirmOnly =
        /^(kro|karo|ha|haan|yes|ok|okay|ji|theek|do\s*it|apply|lagao|lga\s*do)$/i.test(
          cleanMessage.trim(),
        );
      const lastUserTopic = [...history]
        .reverse()
        .find(
          (turn) =>
            turn.role === "user" &&
            typeof turn.content === "string" &&
            turn.content.trim() &&
            !/^(kro|karo|ha|haan|yes|ok|okay|ji|theek|do\s*it|apply|lagao|lga\s*do)$/i.test(
              turn.content.trim(),
            ),
        )?.content;
      const imageUserMessage =
        confirmOnly && typeof lastUserTopic === "string" && lastUserTopic.trim()
          ? lastUserTopic.trim()
          : cleanMessage;
      const { fields, source } = await buildOnlineImageFields({
        apiKey,
        sectionType: deterministic.sectionType,
        sections,
        siteContext,
        userMessage: imageUserMessage,
        country,
        category,
      });
      const response = patchSectionImages(
        deterministic.sectionType,
        fields,
        source,
        {
          countryName: country.name,
          categoryLabel: category.label,
        },
      );
      // Keep patch on the focused section id when present
      const actions = normalizeActions(response.actions).map((action) => {
        if (
          resolvedFocusId &&
          (action.type === "patch" ||
            action.type === "deleteSection" ||
            action.type === "moveSection")
        ) {
          return { ...action, sectionHint: resolvedFocusId };
        }
        return action;
      });
      return NextResponse.json({
        reply: response.reply,
        actions: actions.filter((action) => action.type !== "ask"),
        choices: [],
      });
    }

    if (isGenerateIntent(deterministic)) {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
      const wordTarget = extractWordTarget(cleanMessage);
      let text: string | null = null;
      let fromAi = false;
      if (apiKey) {
        text = await generateFreshCopy({
          apiKey,
          model,
          sectionType: deterministic.sectionType,
          field: deterministic.field,
          sections,
          siteContext,
          userMessage: cleanMessage,
          wordTarget,
        });
        // One retry if model echoed current text / empty
        if (!text) {
          text = await generateFreshCopy({
            apiKey,
            model,
            sectionType: deterministic.sectionType,
            field: deterministic.field,
            sections,
            siteContext,
            userMessage: `${cleanMessage}\n\nMake it completely different this time. Variation ${Date.now()}.`,
            wordTarget,
          });
        }
        fromAi = Boolean(text);
      }

      if (!text) {
        text =
          deterministic.field === "title"
            ? inventSectionTitle(deterministic.sectionType, sections)
            : deterministic.field === "button"
              ? inventButtonLabel(deterministic.sectionType, sections)
              : deterministic.field === "pretitle"
                ? inventSectionPretitle(deterministic.sectionType, sections)
                : inventSectionDesc(deterministic.sectionType, sections);
      }

      if (deterministic.field === "button") {
        text = text
          .replace(/^["'“”]+|["'“”]+$/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .split(/\s+/)
          .slice(0, 5)
          .join(" ");
      }

      if (deterministic.field === "pretitle") {
        text = text
          .replace(/^["'“”]+|["'“”]+$/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .split(/\s+/)
          .slice(0, 6)
          .join(" ");
      }

      // About description: also refresh the big heading so the canvas change is obvious.
      let titleExtra: string | null = null;
      if (
        deterministic.field === "desc" &&
        deterministic.sectionType === "About" &&
        apiKey
      ) {
        titleExtra = await generateFreshCopy({
          apiKey,
          model,
          sectionType: "About",
          field: "title",
          sections,
          siteContext,
          userMessage: `Write a fresh About heading for: ${message}`,
          wordTarget: null,
        });
      }

      const response =
        deterministic.field === "title"
          ? patchSectionTitle(deterministic.sectionType, text)
          : deterministic.field === "button"
            ? patchSectionButton(deterministic.sectionType, text)
            : deterministic.field === "pretitle"
              ? {
                  reply: `Updated ${deterministic.sectionType} top line (pretitle) to:\n"${text}"`,
                  actions: [
                    {
                      type: "patch" as const,
                      sectionHint: deterministic.sectionType.toLowerCase(),
                      fields: { pretitle: text },
                    },
                  ],
                  choices: [],
                }
              : patchSectionDesc(deterministic.sectionType, text);

      if (titleExtra) {
        response.actions = [
          {
            type: "patch",
            sectionHint: "about",
            fields: { title: titleExtra, desc: text },
          },
        ];
        response.reply = `Updated About heading + description${fromAi ? " (AI)" : " (fallback)"}:\n\nHeading: ${titleExtra}\n\n${text}`;
      } else if (!fromAi) {
        response.reply = `${response.reply}\n\n(Note: OpenAI unavailable — temporary fallback text used. Check OPENAI_API_KEY / restart frontend.)`;
      } else {
        response.reply = response.reply.replace(
          /^Updated/,
          "Updated (AI)",
        );
      }

      const actions = normalizeActions(response.actions);
      return NextResponse.json({
        reply: response.reply,
        actions: actions.filter((action) => action.type !== "ask"),
        choices: [],
      });
    }

    if (deterministic) {
      let response: AiAssistResponse = {
        reply: deterministic.reply,
        actions: deterministic.actions,
        choices: deterministic.choices,
      };
      if (
        response.actions.some((action) => action.type === "addMasterItems")
      ) {
        const apiKeyForMaster = process.env.OPENAI_API_KEY?.trim();
        const modelForMaster =
          process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
        response = await enrichAddMasterItemsResponse({
          response,
          apiKey: apiKeyForMaster,
          model: modelForMaster,
          siteContext,
          userMessage: cleanMessage,
          country,
          category,
        });
      }
      const actions = normalizeActions(response.actions);
      return NextResponse.json({
        reply: response.reply,
        actions: actions.filter((action) => action.type !== "ask"),
        choices:
          response.choices || collectChoices(response, actions),
      });
    }

    const { hasAnyAiKey } = await import("@/lib/aiProvider");
    if (!hasAnyAiKey()) {
      return NextResponse.json(
        {
          message:
            "GEMINI_API_KEY missing. Add it in apps/frontend/.env.local then restart.",
          code: "MISSING_API_KEY",
        },
        { status: 503 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "gemini";
    const model = process.env.GEMINI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gemini-2.0-flash";

    const compactSections = sections.map((section, index) => {
      const data =
        section.data && typeof section.data === "object" ? section.data : {};
      const editableFields =
        Array.isArray(section.editableFields) && section.editableFields.length
          ? section.editableFields
          : Object.keys(data);
      const itemShapes: Record<string, string[]> =
        section.itemShapes && typeof section.itemShapes === "object"
          ? section.itemShapes
          : {};
      if (!Object.keys(itemShapes).length) {
        for (const [key, value] of Object.entries(data)) {
          if (
            Array.isArray(value) &&
            value[0] &&
            typeof value[0] === "object" &&
            !Array.isArray(value[0])
          ) {
            itemShapes[key] = Object.keys(value[0] as Record<string, unknown>);
          }
        }
      }
      return {
        id: section.id,
        type: section.type,
        variant: section.variant,
        order: index + 1,
        editableFields,
        itemShapes,
        data,
      };
    });

    const userPayload = {
      siteContext,
      userRequest: message,
      replyLanguage: isMostlyEnglish(message) ? "English" : "Hindi",
      pendingChoices,
      readySectionCatalog: READY_SECTIONS,
      customLayouts: CUSTOM_LAYOUTS,
      customWidgets: CUSTOM_WIDGETS,
      sections: compactSections,
      fieldGuide:
        "editableFields/itemShapes are auto-fetched from the live page. Patch using those keys. New fields appear here automatically. Reply in replyLanguage only (English message → English reply only; Hindi → Hindi).",
      variationSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history
        .filter(
          (turn) =>
            turn &&
            (turn.role === "user" || turn.role === "assistant") &&
            typeof turn.content === "string" &&
            turn.content.trim(),
        )
        .map((turn) => ({
          role: turn.role,
          content: turn.content,
        })),
      {
        role: "user",
        content: JSON.stringify(userPayload),
      },
    ];

    let openaiRes = await callOpenAi({
      apiKey,
      model,
      messages,
      useJsonFormat: true,
      temperature: 0.85,
    });

    // Retry once without response_format for older/restricted keys.
    if (!openaiRes.ok) {
      openaiRes = await callOpenAi({
        apiKey,
        model,
        messages,
        useJsonFormat: false,
        temperature: 0.85,
      });
    }

    const openaiData = (await openaiRes.json().catch(() => ({}))) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!openaiRes.ok) {
      // Soft fallback so chat doesn't die.
      return NextResponse.json({
        reply:
          openaiData.error?.message ||
          "AI service had an issue. Tell me clearly: change banner title, or add Ready/Custom section.",
        actions: [],
        choices: READY_OR_CUSTOM_CHOICES,
      });
    }

    const content = openaiData.choices?.[0]?.message?.content || "";
    const parsed = extractJson(content);
    if (!parsed) {
      return NextResponse.json({
        reply:
          "I couldn't parse that. Choose Ready Section or Custom Section, or type a banner title like: Banner title: Welcome to our school",
        actions: [],
        choices: READY_OR_CUSTOM_CHOICES,
      });
    }

    const actions = normalizeActions(parsed.actions);
    let reply = parsed.reply || "";
    let applyActions = actions.filter((action) => action.type !== "ask");
    let choices = collectChoices(parsed, actions);

    // Model sometimes treats "create Vastu page" as a home section — force page create.
    if (wantsAddPageAndPlaceInNav(cleanMessage)) {
      const forced = buildAddPageAndPlaceInNav(
        cleanMessage,
        cleanMessage,
        isSinglePageTemplate,
      );
      return NextResponse.json({
        reply: forced.reply,
        actions: normalizeActions(forced.actions).filter(
          (action) => action.type !== "ask",
        ),
        choices: forced.choices || [],
      });
    }

    if (wantsPlacePageInNav(cleanMessage)) {
      const forced = buildPlacePageInNav(
        cleanMessage,
        cleanMessage,
        currentPage || null,
      );
      return NextResponse.json({
        reply: forced.reply,
        actions: normalizeActions(forced.actions).filter(
          (action) => action.type !== "ask",
        ),
        choices: forced.choices || [],
      });
    }

    {
      const deleteConfirm = resolveDeletePageConfirm(
        cleanMessage,
        pendingChoices as AiChoice[],
      );
      const pendingDeleteLabel =
        getPendingDeletePageLabel(pendingChoices as AiChoice[]) ||
        getDeletePageLabelFromMessage(cleanMessage)?.label ||
        null;
      if (deleteConfirm === "yes" && pendingDeleteLabel) {
        const forced = buildDeletePageExecute(pendingDeleteLabel, cleanMessage);
        return NextResponse.json({
          reply: forced.reply,
          actions: normalizeActions(forced.actions).filter(
            (action) => action.type !== "ask",
          ),
          choices: forced.choices || [],
        });
      }
      if (deleteConfirm === "no" && pendingDeleteLabel) {
        const hindi =
          /[^\u0000-\u007f]/.test(cleanMessage) ||
          /\b(nahi|na|cancel|mat)\b/i.test(cleanMessage);
        return NextResponse.json({
          reply: hindi
            ? `OK — "${pendingDeleteLabel}" page delete cancel.`
            : `OK — "${pendingDeleteLabel}" page delete cancelled.`,
          actions: [],
          choices: [],
        });
      }
    }

    if (wantsDeletePage(cleanMessage)) {
      const forced = buildDeletePageAsk(
        cleanMessage,
        cleanMessage,
        currentPage || null,
      );
      return NextResponse.json({
        reply: forced.reply,
        actions: normalizeActions(forced.actions).filter(
          (action) => action.type !== "ask",
        ),
        choices: forced.choices || [],
      });
    }

    if (wantsAddBreadcrumb(cleanMessage)) {
      const forced = buildAddBreadcrumb(
        cleanMessage,
        cleanMessage,
        currentPage || null,
      );
      return NextResponse.json({
        reply: forced.reply,
        actions: normalizeActions(forced.actions).filter(
          (action) => action.type !== "ask",
        ),
        choices: forced.choices || [],
      });
    }

    if (wantsAddPage(cleanMessage)) {
      const forced = buildAddPage(
        cleanMessage,
        cleanMessage,
        isSinglePageTemplate,
      );
      return NextResponse.json({
        reply: forced.reply,
        actions: normalizeActions(forced.actions).filter(
          (action) => action.type !== "ask",
        ),
        choices: forced.choices || [],
      });
    }

    if (applyActions.some((action) => action.type === "addMasterItems")) {
      const enriched = await enrichAddMasterItemsResponse({
        response: { reply, actions: applyActions, choices },
        apiKey,
        model,
        siteContext,
        userMessage: cleanMessage,
        country,
        category,
      });
      reply = enriched.reply;
      applyActions = normalizeActions(enriched.actions).filter(
        (action) => action.type !== "ask",
      );
      choices = enriched.choices || choices;
    }

    return NextResponse.json({
      reply,
      actions: applyActions,
      choices,
    });
  } catch (error) {
    return NextResponse.json({
      reply:
        error instanceof Error
          ? error.message
          : "AI assist failed. Please try again with a clearer command.",
      actions: [],
      choices: READY_OR_CUSTOM_CHOICES,
    });
  }
}
