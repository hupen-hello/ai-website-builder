import { NextResponse } from "next/server";
import { generateAiText, hasAnyAiKey } from "@/lib/aiProvider";
import { fetchCreateAiImageUrls } from "@/lib/create-ai-images";
import {
  formatCreateAiDesignPrefsPrompt,
  normalizeCreateAiDesignPrefs,
  type CreateAiDesignPrefs,
} from "@/lib/create-ai-design-prefs";
import {
  normalizeCreateAiCopyrightYear,
  polishCreateAiExportHtml,
} from "@/lib/create-ai-chrome";
import { ensureCreateAiSectionIds } from "@/lib/create-ai-section-edit";

export const runtime = "nodejs";
export const maxDuration = 180;
export const dynamic = "force-dynamic";

type CreateSiteBody = {
  brandName?: string;
  description?: string;
  category?: string;
  websiteRelated?: string;
  pageType?: string;
  audience?: string;
  email?: string;
  mobile?: string;
  address?: string;
  pageLabel?: string;
  designPrefs?: CreateAiDesignPrefs;
};

function audienceLabel(audience: string) {
  const a = (audience || "").toLowerCase();
  if (a === "myself" || a === "individual") return "an individual / personal brand";
  if (a === "clients" || a === "agency") return "an agency building for clients";
  if (a === "company" || a === "business") return "a company / business";
  return audience || "a business";
}

function relatedLabel(websiteRelated: string) {
  const w = (websiteRelated || "").toLowerCase();
  if (w === "campaign-page") return "campaign / landing page (conversion-focused single story)";
  if (w === "service-provider") return "service business";
  if (w === "products") return "product / catalog oriented site";
  if (w === "blog") return "content / blog oriented site";
  if (w === "ngo") return "NGO / non-profit / cause site";
  return websiteRelated || "general website";
}

function designBlueprint(category: string, websiteRelated: string, pageType: string) {
  const isCampaign = /campaign/i.test(websiteRelated);
  const isSingle = !/multi/i.test(pageType) || isCampaign;
  let niche = `Invent a brand-new premium, complete website for "${category}" — original palette, typography, hero, and 5+ polished sections. Not a thin stub.`;
  if (isCampaign) {
    niche +=
      " Campaign: one strong message + repeated primary CTA; never show onboarding meta chips.";
  }
  if (isSingle) {
    niche +=
      " Single-page: nav anchors #home #about #services #gallery #contact — every id must exist with scroll-margin-top:80px.";
  } else {
    niche +=
      " Multi-page: generate ONLY the Home homepage now. Header nav may list Home/About/Services/Gallery/Contact as labels — other pages are added later by the user. One strong finished Home, not thin stubs.";
  }
  return niche;
}

/** Rotate section layouts so every Generate feels different. */
function pickSectionVariety(seed: string) {
  const recipes = [
    "Hero: full-bleed photo + left typography stack; About: image-right text-left; Services: 3 equal cards; Gallery: 2×2 mosaic; Contact: split form + details panel",
    "Hero: split 50/50 photo|copy; About: centered narrow editorial; Services: numbered horizontal steps; Gallery: horizontal scroll strip; Contact: dark band with inline form",
    "Hero: tall cinematic + bottom CTA bar; About: two-column story + pull-quote; Services: bento (1 large + 2 small); Gallery: masonry uneven; Contact: card over map-style muted panel",
    "Hero: minimal cream + big serif headline; About: timeline milestones; Services: icon row + expand copy; Gallery: polaroid tilt grid; Contact: sticky side rail form",
    "Hero: dark overlay + centered glass CTA; About: zigzag image/text bands; Services: price-style feature tiles; Gallery: full-width 3-up; Contact: two-column with accent border",
    "Hero: angled clip-path photo; About: stats strip then story; Services: alternating left/right feature rows; Gallery: lightbox-ready large thumbs; Contact: compact footer-adjacent form",
    "Hero: soft pastel gradient + product shot; About: magazine 2-col; Services: checklist + photo; Gallery: framed collage; Contact: pill inputs on soft panel",
    "Hero: asymmetric L-layout; About: quote-first then bio; Services: tab-like card stack; Gallery: filmstrip; Contact: bold phone-first + short form",
  ];
  const fonts = [
    "Playfair Display + Source Sans 3",
    "Fraunces + DM Sans",
    "Cormorant Garamond + Outfit",
    "Libre Baskerville + Nunito Sans",
    "Syne + Inter Tight",
    "Instrument Serif + Manrope",
    "Newsreader + Figtree",
    "Space Grotesk + IBM Plex Sans",
  ];
  const palettes = [
    "ink + warm sand + terracotta accent",
    "deep forest + cream + brass",
    "charcoal + blush + bone",
    "navy + soft + off-white",
    "espresso + linen + clay",
    "slate + mint + ivory",
    "oxblood + parchment + black",
    "ocean teal + sand + white",
  ];
  let h = 0;
  const s = `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return {
    layout: recipes[h % recipes.length],
    fonts: fonts[(h >>> 3) % fonts.length],
    palette: palettes[(h >>> 7) % palettes.length],
    seed: s.slice(-10),
  };
}

function premiumDesignRules(
  brandName: string,
  category: string,
  imageUrls: string[],
  variety: { layout: string; fonts: string; palette: string; seed: string },
) {
  const imgs =
    imageUrls.length > 0
      ? imageUrls
          .slice(0, 6)
          .map((u, i) => `${i + 1}. ${u}`)
          .join("\n")
      : "(use https images.unsplash.com / images.pexels.com)";

  // Match morning-quality exports: design-token CSS system (abhishek-mishra-home level)
  return `You are a senior brand designer shipping a publish-ready one-page site at the SAME quality as a custom Instrument Serif + Manrope linen/espresso editorial site.
Return ONLY complete <!DOCTYPE html>…</html>. No markdown. No JSON.

Brand: "${brandName}" · Category: ${category}
Direction: palette ${variety.palette}; Google Fonts pair ${variety.fonts}; layout ${variety.layout}; seed ${variety.seed}.

MANDATORY DESIGN SYSTEM (morning reference level):
1) <head>: Google Fonts = Instrument Serif + Manrope (or the pairing above) + ONE rich <style> with:
   :root { --primary (warm terracotta/orange OK), --accent, --espresso/#1C1917, --linen/#FFF7ED, --surface, --text, --muted, --border/#E7DBCE, --shadow-md, --radius-lg, --font-heading, --font-body }
   Full rules for: body linen bg, header sticky glass, .badge pills, .btn primary/secondary, hero-grid (copy left / media right), about-grid, services-grid cards, gallery mosaic, testimonials cards, contact-split (details + FORM), footer columns, @media ≤900px
2) Semantic classes — not only Tailwind utilities.
3) Every section: badge eyebrow + Instrument Serif h2 + Manrope body + real imagery.

SECTION ANATOMY (do not skip):
<header> logo+brand LEFT · nav links · ONE solid CTA right (readable white text on primary) · one ☰ mobile
<section id="home"> badge · big italic-accent headline · subtitle · 2 CTAs · optional stats · hero image with floating accent card
<section id="about"> split: story + 3–4 value rows with icons · photo + years badge
<section id="services"> 3 service cards: icon · title · copy · 3 checklist lines · link
<section id="gallery"> mosaic ≥4 real photos (never empty/broken tiles)
<section id="testimonials"> 3 quote cards with stars + avatar initials + name/role
<section id="contact"> TWO columns: contact details (email/phone/address) + WORKING form (name, email, message, Send)
<footer> brand blurb · Quick Links · Contact · © year

PREMIUM BAR:
- Cohesive tokens; never white-on-white header; CTA text #fff on dark/primary fill
- Depth: shadows, linen cards, borders — not empty flat stubs
- Lucide <i data-lucide> OR FA icons on services/about/contact
- ≥4 images from:
${imgs}
- Close </body></html>. No truncate.

FORBIDDEN: purple SaaS kit, AM mid-header, two ☰, clip-path diagonals, empty ghost cards, missing footer, contact without <form>, broken img, emoji-only icons.
Finish the full document.`;
}

function normalizeAiHtmlCandidate(raw: string) {
  let t = (raw || "").trim().replace(/^\uFEFF/, "");
  t = t.replace(/^["'`]{1,3}\s*html\b\s*/i, "");
  t = t.replace(/^["'`]+/, "");
  if (/^\s*\{[\s\S]*"html"\s*:/.test(t)) {
    try {
      const parsed = JSON.parse(t) as { html?: unknown };
      if (typeof parsed.html === "string" && parsed.html.length > 200) {
        t = parsed.html;
      }
    } catch {
      /* keep */
    }
  }
  return t.trim();
}

function extractHtml(text: string) {
  const raw = (text || "").trim();
  if (!raw) return "";
  let candidate = "";
  const fencedClosed = raw.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  if (fencedClosed) candidate = fencedClosed;
  else {
    const fencedOpen = raw.match(/```(?:html)?\s*([\s\S]+)/i)?.[1];
    candidate = (fencedOpen || raw).replace(/```\s*$/i, "");
  }
  candidate = normalizeAiHtmlCandidate(candidate);

  const full =
    candidate.match(/<!DOCTYPE html[\s\S]*<\/html>/i)?.[0] ||
    candidate.match(/<html\b[\s\S]*<\/html>/i)?.[0];
  if (full?.trim()) return full.trim();
  // Truncated Flash output — salvage instead of empty fail
  const open =
    candidate.match(/<!DOCTYPE html[\s\S]+/i)?.[0] ||
    candidate.match(/<html\b[\s\S]+/i)?.[0];
  if (open && open.length > 1800) return salvageHtml(open);
  return "";
}

/** Close truncated HTML so polish/rails can still run. */
function salvageHtml(html: string) {
  let t = (html || "").trim();
  if (!t) return "";
  if (/<html\b/i.test(t) && !/<\/html>/i.test(t)) {
    if (!/<body\b/i.test(t)) t += "\n<body>";
    if (!/<\/body>/i.test(t)) t += "\n</body>";
    t += "\n</html>";
  }
  if (!/<footer\b/i.test(t) && /<\/body>/i.test(t)) {
    const year = new Date().getFullYear();
    t = t.replace(
      /<\/body>/i,
      `<footer data-create-ai-footer="1" style="padding:28px 20px;text-align:center;background:#0f172a;color:#f8fafc">© ${year}</footer>\n</body>`,
    );
  }
  return t;
}

/** Reject thin / truncated Gemini stubs. */
function isCompleteSiteHtml(html: string, isInner: boolean) {
  const t = salvageHtml(html || "");
  if (!t || /^["'`]/.test(t) || /^html\b/i.test(t)) return false;
  if (!/<html\b/i.test(t) || !/<body\b/i.test(t) || !/<\/html>/i.test(t)) {
    return false;
  }
  if (isInner) {
    if (t.length < 1800) return false;
    const sections = (t.match(/<section\b/gi) || []).length;
    return sections >= 2 || /<main\b/i.test(t);
  }

  if (t.length < 4500) return false;
  if (!/<header\b/i.test(t)) return false;
  if (!/<footer\b/i.test(t)) return false;
  const sections = (t.match(/<section\b/gi) || []).length;
  if (sections < 3) return false;
  return true;
}

/** Good enough to show in studio (never blank preview). */
function isShipableSiteHtml(html: string, isInner: boolean) {
  const t = salvageHtml(html || "");
  if (!/<html\b/i.test(t) || !/<body\b/i.test(t)) return false;
  if (isInner) return t.length >= 1000;
  return t.length >= 2200 && (/<header\b/i.test(t) || /<section\b/i.test(t));
}

/** When AI fails Home: ship a usable shell (never empty "check API keys"). */
function buildHomePageFallback(params: {
  brandName: string;
  category: string;
  description?: string;
  email?: string;
  mobile?: string;
  address?: string;
  imageUrls?: string[];
}): string {
  const brand = (params.brandName || "Brand").replace(/</g, "");
  const cat = (params.category || "Services").replace(/</g, "");
  const desc = (
    params.description || `${brand} — premium ${cat} experiences.`
  )
    .replace(/</g, "")
    .slice(0, 280);
  const email = (params.email || "").replace(/</g, "");
  const mobile = (params.mobile || "").replace(/</g, "");
  const address = (params.address || "").replace(/</g, "");
  const img =
    (params.imageUrls || []).find((u) => /^https?:\/\//i.test(u)) ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80";
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${brand}</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;color:#111;background:#faf7f2">
<header data-create-ai-hdr="1" style="display:flex;align-items:center;gap:12px;padding:14px 20px;background:#fff;border-bottom:1px solid #e7e5e4">
  <span data-create-ai-brand="1" data-cai-brand="1" style="font-weight:800">${brand}</span>
  <nav style="margin-left:auto;display:flex;gap:16px;flex-wrap:wrap">
    <a href="#about">About</a><a href="#services">Services</a><a href="#gallery">Gallery</a><a href="#contact">Contact</a>
  </nav>
  <a href="#contact" style="padding:10px 16px;border-radius:999px;background:#111;color:#fff;text-decoration:none;font-weight:700">Book</a>
</header>
<section id="home" style="padding:48px 20px;display:grid;gap:24px;max-width:1100px;margin:0 auto">
  <div>
    <p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px;opacity:.7">${cat}</p>
    <h1 style="font-size:clamp(2rem,5vw,3.4rem);line-height:1.1;margin:8px 0 12px">${brand}</h1>
    <p style="max-width:36rem;line-height:1.6">${desc}</p>
    <a href="#contact" style="display:inline-block;margin-top:16px;padding:12px 20px;border-radius:999px;background:#c2410c;color:#fff;text-decoration:none;font-weight:700">Get started</a>
  </div>
  <img src="${img}" alt="" style="width:100%;max-height:420px;object-fit:cover;border-radius:24px" onerror="this.remove()"/>
</section>
<section id="about" style="padding:48px 20px;max-width:1100px;margin:0 auto"><h2>About</h2><p>${desc}</p></section>
<section id="services" style="padding:48px 20px;max-width:1100px;margin:0 auto"><h2>Services</h2><p>Tailored ${cat} for every client.</p></section>
<section id="gallery" style="padding:48px 20px;max-width:1100px;margin:0 auto"><h2>Gallery</h2><img src="${img}" alt="" style="width:100%;border-radius:20px" onerror="this.remove()"/></section>
<section id="testimonials" style="padding:48px 20px;max-width:1100px;margin:0 auto"><h2>Stories</h2><p>Clients trust ${brand} for reliable results.</p></section>
<section id="contact" style="padding:48px 20px;max-width:1100px;margin:0 auto;background:#1c1917;color:#fafaf9;border-radius:24px">
  <h2 style="color:#fff">Contact</h2>
  <p>${email ? `Email: ${email}` : ""} ${mobile ? `· Phone: ${mobile}` : ""}</p>
  <p>${address || ""}</p>
</section>
<footer style="padding:24px;text-align:center">© ${year} ${brand}</footer>
</body></html>`;
}

/** When AI fails Add-page: ship a rich inner shell (Home chrome is stitched in studio). */
function buildInnerPageFallback(params: {
  brandName: string;
  pageLabel: string;
  description?: string;
  email?: string;
  mobile?: string;
  address?: string;
}): string {
  const brand = (params.brandName || "Brand").replace(/</g, "");
  const label = (params.pageLabel || "Page").replace(/</g, "");
  const desc = (params.description || `${label} at ${brand}.`).replace(/</g, "").slice(0, 220);
  const email = (params.email || "").replace(/</g, "");
  const mobile = (params.mobile || "").replace(/</g, "");
  const address = (params.address || "").replace(/</g, "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${label} · ${brand}</title>
<style>
body{margin:0;font-family:Georgia,serif;color:#1c1917;background:#faf6f1}
main{max-width:1100px;margin:0 auto;padding:0 24px 64px}
.hero{padding:56px 0 28px}
.hero h1{margin:0 0 12px;font-size:clamp(1.8rem,4vw,2.6rem)}
.hero p{margin:0;opacity:.85;line-height:1.55;max-width:36rem}
section{padding:36px 0;border-top:1px solid rgba(0,0,0,.08)}
section h2{margin:0 0 12px;font-size:1.35rem}
section p{margin:0;opacity:.85;line-height:1.55}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:16px}
.card{padding:16px;border:1px solid rgba(0,0,0,.1);border-radius:12px;background:#fff}
</style>
</head>
<body>
<header style="padding:16px 24px;background:#fff;border-bottom:1px solid #e7e5e4"><strong>${brand}</strong> · ${label}</header>
<main>
<section class="hero" data-create-ai-inner-hero="1">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.65">Home / ${label}</p>
<h1>${label}</h1>
<p>${desc}</p>
</section>
<section>
<h2>What you will find</h2>
<p>A clear overview of ${label.toLowerCase()} at ${brand} — built for families who want clarity, care, and excellence.</p>
<div class="grid">
<div class="card"><strong>Guidance</strong><p style="margin:8px 0 0;font-size:14px">Thoughtful support at every step.</p></div>
<div class="card"><strong>Programs</strong><p style="margin:8px 0 0;font-size:14px">Structured paths with real outcomes.</p></div>
<div class="card"><strong>Community</strong><p style="margin:8px 0 0;font-size:14px">A calm culture of growth.</p></div>
</div>
</section>
<section>
<h2>Our approach</h2>
<p>We keep this page focused: one story, clear sections, and a direct next step — not filler.</p>
</section>
<section>
<h2>Highlights</h2>
<p>Experienced mentors, modern learning spaces, and transparent communication with parents.</p>
</section>
<section id="contact">
<h2>Talk to us</h2>
<p>${[email && `Email: ${email}`, mobile && `Phone: ${mobile}`, address && `Address: ${address}`].filter(Boolean).join(" · ") || `Reach ${brand} through the Contact section on Home.`}</p>
</section>
</main>
<footer style="padding:24px;background:#1c1917;color:#fff"><strong>${brand}</strong><p style="margin:8px 0 0;opacity:.75;font-size:13px">© ${new Date().getFullYear()} ${brand}. All rights reserved.</p></footer>
</body>
</html>`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateSiteBody;
    const brandName = (body.brandName || "").trim() || "Your Brand";
    const description = (body.description || "").trim();
    const category = (body.category || "Business").trim();
    const websiteRelated = (body.websiteRelated || "").trim();
    const pageType = (body.pageType || "single-page").trim();
    const audience = (body.audience || "").trim();
    const pageLabel = (body.pageLabel || "").trim();
    const isInner = Boolean(pageLabel) && !/^home$/i.test(pageLabel);
    const designPrefs = normalizeCreateAiDesignPrefs(body.designPrefs);
    const prefsBlock = formatCreateAiDesignPrefsPrompt(designPrefs);

    if (!hasAnyAiKey()) {
      return NextResponse.json(
        {
          error:
            "No AI API key configured — cannot invent a fresh design without AI.",
        },
        { status: 503 },
      );
    }

    const blueprint = designBlueprint(category, websiteRelated, pageType);
    const imageUrls = await withTimeout(
      fetchCreateAiImageUrls({
        category,
        brandName,
        description,
        websiteRelated,
        need: 8,
      }),
      6000,
      [] as string[],
    );
    const variety = pickSectionVariety(`${brandName}-${category}-${websiteRelated}`);
    const premium = premiumDesignRules(brandName, category, imageUrls, variety);

    const qualityRules = `QUALITY BAR:
- Category "${category}", purpose ${relatedLabel(websiteRelated)}, audience ${audienceLabel(audience)}.
- Contact email/mobile/address MUST appear when provided.
${prefsBlock}
${premium}`;

    const system = isInner
      ? `You are an award-level web designer. Design a COMPLETE INNER page for "${pageLabel}" of "${brandName}" (${category}).
Return ONLY a complete <!DOCTYPE html>…</html>.

INNER PAGE STRUCTURE (mandatory — not a stub):
1) Minimal header placeholder OK (studio replaces with Home chrome).
2) BREADCRUMB row immediately under header: Home / ${pageLabel} (clear, left-aligned, same content width as sections).
3) INNER HERO / page banner for "${pageLabel}" — title + 1 short supporting line (content aligned to the same ~1100px column as below).
4) Then 4 RICH, finished sections unique to "${pageLabel}" (story, detail, gallery, FAQ, CTA — pick what fits). Each section:
   - One clear headline + short support copy
   - Consistent horizontal alignment: max-width ~1100px, centered, equal left/right padding
   - NO random left/right drift, NO tiny centered column, NO overlapping blocks
5) Footer placeholder OK.

Layout quality:
- Sections share ONE vertical rhythm and ONE content width (aligned edges).
- Mobile: stack cleanly under 900px; no horizontal overflow.
- Copy matches onboarding brief. Use approved images where useful.
- Do NOT paste a blank/thin "Coming soon" page.

${blueprint}
${qualityRules}`
      : /multi/i.test(pageType) && !/campaign/i.test(websiteRelated)
        ? `You are a world-class art director (Awwwards / Gemini App Canvas level). Build ONE complete HTML HOMEPAGE (Home only) for "${brandName}".
Return ONLY full <!DOCTYPE html>…</html>. Real header+nav+footer. Hero + 5+ strong sections on THIS page.
Header: brand LEFT, nav+CTA RIGHT. No orphan AM initials. Publish-ready visual finishing — not a thin stub.
Do NOT generate other pages. Nav can include About/Services/Gallery/Contact labels for a multi-page site (pages added later).
${blueprint}
${qualityRules}`
        : `You are a world-class art director (Awwwards / Gemini App Canvas level). Build ONE COMPLETE single-page website for "${brandName}".
Return ONLY full <!DOCTYPE html>…</html>. 
Header nav = in-page anchors only (#about #services #gallery #contact). Every target id exists.
Header: brand LEFT, nav+CTA RIGHT. No orphan AM initials.
Must include: header, hero#home, about, services, gallery (images), testimonials, contact, footer — all finished, cinematic, not stubs.
${blueprint}
${qualityRules}`;

    const user = `ONBOARDING BRIEF:
${JSON.stringify(
  {
    brandName,
    description:
      description ||
      `${brandName} — compelling niche copy for ${category} ${relatedLabel(websiteRelated)}.`,
    category,
    websiteRelated,
    pageType,
    audience,
    email: body.email || "",
    mobile: body.mobile || "",
    address: body.address || "",
    pageLabel: pageLabel || "Home",
    approvedImageUrls: imageUrls,
    uniquenessSeed: variety.seed,
    layoutRecipe: variety.layout,
    fontPairing: variety.fonts,
    paletteDirection: variety.palette,
  },
  null,
  2,
)}

Return the COMPLETE finished HTML now. Do not truncate. Close all tags.`;

    // Hybrid: Gemini drafts FAST → if thin/broken, Grok/Claude only FINISH the draft (brain boost).
    let html = "";
    let ai: {
      text: string;
      provider: "none" | "gemini" | "xai" | "claude" | "openai";
      model: string;
      tokensUsed: number;
      fallbackReason: string;
    } = {
      text: "",
      provider: "none",
      model: "",
      tokensUsed: 0,
      fallbackReason: "",
    };

    const geminiDraft = await generateAiText({
      preferProvider: "gemini",
      // Speed path: GEMINI_MODEL (3.6-flash) only — no Pro / no 2nd polish pass
      modelTier: "fast",
      strictProvider: Boolean(
        process.env.GEMINI_API_KEY ||
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
          process.env.GOOGLE_API_KEY,
      ),
      messages: [
        {
          role: "system",
          content: isInner
            ? `${system}

COMPLETE INNER checklist (mandatory):
- Close </body></html>.
- Breadcrumb Home / ${pageLabel} present.
- Page hero + ≥4 real sections, aligned to one content width.
- Do not truncate. Richer than a stub.`
            : `${system}

SPEED+QUALITY checklist (one Flash shot — finish strong):
- Close </body></html>. Custom CSS :root tokens + classes (morning-quality), not a flat Tailwind stub.
- Header brand LEFT + nav/CTA RIGHT with readable contrast; hero; ≥5 sections; gallery; contact; footer.
- No orphan AM initials, no empty cards, no white-on-white header, no missing footer.
- Prefer finishing the full document over a second polish pass.`,
        },
        { role: "user", content: user },
      ],
      temperature: isInner ? 0.32 : 0.45,
      maxTokens: isInner ? 14000 : 14000,
    });
    ai = geminiDraft as typeof ai;
    {
      const extracted = salvageHtml(extractHtml(geminiDraft.text));
      if (
        extracted.length > html.length &&
        /<html\b/i.test(extracted) &&
        !/^["'`]/.test(extracted.trim())
      ) {
        html = extracted;
      }
    }

    // Truncated only: ONE Gemini Flash finish — never OpenAI cascade (was 6–8 min)
    if (!isCompleteSiteHtml(html, isInner)) {
      const finish = await generateAiText({
        preferProvider: "gemini",
        strictProvider: true,
        modelTier: "fast",
        messages: [
          {
            role: "system",
            content: `${system}

Finish incomplete HTML in ONE shot. Keep brand/colors. Return ONLY complete <!DOCTYPE html>…</html>.
${isInner ? `- INNER "${pageLabel}": breadcrumb + ≥3 sections + close </html>.` : ""}`,
          },
          {
            role: "user",
            content: html
              ? `Finish this draft:\n${html.slice(0, 28_000)}\n\nBRIEF:\n${user}`
              : user,
          },
        ],
        temperature: 0.35,
        maxTokens: 14000,
      });
      if (finish.text) {
        ai = finish as typeof ai;
        const extracted = salvageHtml(extractHtml(finish.text));
        if (
          extracted.length > html.length &&
          /<html\b/i.test(extracted)
        ) {
          html = extracted;
        }
      }
    }

    html = salvageHtml(html);

    // Inner Add-page must never hard-fail live — rich fallback shell (studio stitches Home chrome)
    if (!isShipableSiteHtml(html, isInner) && isInner) {
      html = buildInnerPageFallback({
        brandName,
        pageLabel,
        description,
        email: body.email,
        mobile: body.mobile,
        address: body.address,
      });
      return NextResponse.json({
        html: polishCreateAiExportHtml(
          ensureCreateAiSectionIds(normalizeCreateAiCopyrightYear(html)),
          brandName,
          {
            homeSections: designPrefs.homeSections,
            address: body.address,
            email: body.email,
            mobile: body.mobile,
            imageUrls,
          },
        ),
        provider: ai.provider || "fallback",
        model: ai.model || "inner-shell",
        tokensUsed: ai.tokensUsed,
        fallback: true,
        imageCount: imageUrls.length,
        message: `"${pageLabel}" page ready — Home header/footer will apply in studio.`,
      });
    }

    // Home: never blank preview — salvage AI HTML or ship shell
    if (!isShipableSiteHtml(html, isInner)) {
      html = buildHomePageFallback({
        brandName,
        category,
        description,
        email: body.email,
        mobile: body.mobile,
        address: body.address,
        imageUrls,
      });
      return NextResponse.json({
        html: polishCreateAiExportHtml(
          ensureCreateAiSectionIds(normalizeCreateAiCopyrightYear(html)),
          brandName,
          {
            homeSections: designPrefs.homeSections,
            address: body.address,
            email: body.email,
            mobile: body.mobile,
            imageUrls,
          },
        ),
        provider: ai.provider || "fallback",
        model: ai.model || "home-shell",
        tokensUsed: ai.tokensUsed,
        fallback: true,
        imageCount: imageUrls.length,
        message:
          "Starter preview ready — chat se refine karo, ya Create with AI dubara try karo.",
      });
    }

    return NextResponse.json({
      html: polishCreateAiExportHtml(
        ensureCreateAiSectionIds(normalizeCreateAiCopyrightYear(html)),
        brandName,
        {
          homeSections: designPrefs.homeSections,
          address: body.address,
          email: body.email,
          mobile: body.mobile,
          imageUrls,
        },
      ),
      provider: ai.provider,
      model: ai.model,
      tokensUsed: ai.tokensUsed,
      fallback: !isCompleteSiteHtml(html, isInner),
      imageCount: imageUrls.length,
      message: isCompleteSiteHtml(html, isInner)
        ? "Preview ready"
        : "Preview ready — sections refine kar sakte ho chat se.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create-site failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
