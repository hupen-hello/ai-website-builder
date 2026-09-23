import type { BuiltSiteSectionItem, BuiltSiteSectionPlan } from "@/lib/built-site-theme";
import { normalizeSectionLayout, applySiteLogoPolicy } from "@/lib/redesign-section-layout";

function slugId(value: string, fallback: string) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || fallback;
}

function scoreLabelMatch(a: string, b: string) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (!x || !y) return 0;
  if (x === y) return 10;
  if (x.includes(y) || y.includes(x)) return 8;
  const xw = x.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const yw = y.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  let hits = 0;
  for (const w of xw) if (yw.includes(w)) hits += 1;
  return hits;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Ensure the section root tag has a stable id for in-page scroll. */
export function ensureSectionAnchorHtml(html: string, id: string) {
  const trimmed = (html || "").trim();
  if (!trimmed) return trimmed;
  if (new RegExp(`\\bid=["']${escapeRegex(id)}["']`, "i").test(trimmed)) {
    if (/data-section-id=/i.test(trimmed)) return trimmed;
    return trimmed.replace(
      /^(\s*<[a-z0-9]+)([^>]*>)/i,
      `$1 data-section-id="${id}"$2`,
    );
  }
  return trimmed.replace(/^(\s*<([a-z0-9]+))([^>]*)>/i, (match, open, _tag, attrs) => {
    if (/\bid\s*=/.test(attrs)) return match;
    return `${open}${attrs} id="${id}" data-section-id="${id}" style="scroll-margin-top:5.5rem">`;
  });
}

function isChromeSectionMeta(id = "", label = "") {
  return /header|footer|topbar|top-bar|utility|news|ticker|announcement|notice|marquee|hero|banner|slider|top-fold|topfold|session-bar|contact-bar|navigation bar|nav bar/i.test(
    `${id} ${label}`.toLowerCase(),
  );
}

function isChromeNavCategory(label: string) {
  const t = label.trim().toLowerCase();
  if (!t) return true;
  return /^(header|footer|banner|hero|topbar|top bar|news|ticker|navigation|nav bar|logo|utility bar|news ticker|top fold|section \d+)$/i.test(t);
}

/** Short nav label for a content section (never map Gallery → Testimonials). */
function navLabelForSection(id = "", label = ""): string | null {
  const s = `${id} ${label}`.toLowerCase();
  if (!s.trim()) return null;
  if (/header|footer|hero|banner|topfold|top-fold|topbar|ticker|nav/.test(s)) return null;
  if (/\babout\b/.test(s)) return "About";
  if (/program|service|how-we-help|how we help/.test(s)) return "Services";
  if (/\bimpact\b/.test(s)) return "Impact";
  if (/galler|photo|media/.test(s)) return "Gallery";
  if (/stor|testimonial|review|people say/.test(s)) return "Stories";
  if (/get-involved|involve|contact|enquire|donate|volunteer/.test(s)) return "Contact";
  const clean = (label || id).replace(/\s+/g, " ").trim();
  if (clean.length < 2 || clean.length > 22) return null;
  return clean;
}

function resolveNavTargetId(
  navLabel: string,
  content: Array<{ id: string; label: string }>,
  hero?: { id: string; label: string },
): string | null {
  const lower = navLabel.toLowerCase().trim();
  if (!lower) return null;
  if (/^home$/i.test(lower)) return hero?.id || content[0]?.id || null;

  if (/contact|admission|reach us|enquire|get involved|donate|join/i.test(lower)) {
    const hit =
      content.find((p) =>
        /contact|get-involved|involve|enquire|inquiry|donate|volunteer|form/i.test(
          `${p.id} ${p.label}`,
        ),
      ) || content.find((p) => /footer/i.test(`${p.id} ${p.label}`));
    return hit?.id || null;
  }

  // Gallery must NOT land on testimonials/stories.
  if (/galler|photos?/i.test(lower)) {
    const gallery = content.find((p) => /galler|photo|media/i.test(`${p.id} ${p.label}`));
    if (gallery) return gallery.id;
    const visual = content.find((p) => /impact|program|service|about/i.test(`${p.id} ${p.label}`));
    return visual?.id || hero?.id || null;
  }

  if (/stor|testimonial|review/i.test(lower)) {
    const hit = content.find((p) =>
      /stor|testimonial|review|people say/i.test(`${p.id} ${p.label}`),
    );
    return hit?.id || null;
  }

  if (/about|history|welcome|overview|mission/i.test(lower)) {
    const hit = content.find((p) =>
      /\babout\b|overview|mission|history|welcome|why.?us|why families/i.test(`${p.id} ${p.label}`),
    );
    return hit?.id || hero?.id || null;
  }

  // Leadership / message pages → about / stories / first content band
  if (/message|principal|secretary|president|vice.?president|\bmd\b|chairman|director|faculty/i.test(lower)) {
    const hit =
      content.find((p) =>
        /about|message|leader|principal|faculty|team|welcome|stories/i.test(`${p.id} ${p.label}`),
      ) || content.find((p) => /\babout\b|welcome/i.test(`${p.id} ${p.label}`));
    return hit?.id || hero?.id || content[0]?.id || null;
  }

  if (/academ|class|programme|program|student.?zone|vacancy|admission/i.test(lower)) {
    const hit = content.find((p) =>
      /program|service|academ|class|admission|updates|how.?we.?help/i.test(`${p.id} ${p.label}`),
    );
    return hit?.id || content[0]?.id || null;
  }

  if (/facilit|campus|activit|infrastruct/i.test(lower)) {
    const hit = content.find((p) =>
      /facilit|campus|galler|infra|activit|program|service/i.test(`${p.id} ${p.label}`),
    );
    return hit?.id || content[0]?.id || null;
  }

  if (/service|programme|program/i.test(lower)) {
    const hit = content.find((p) =>
      /program|service|how-we-help|how we help|academ/i.test(`${p.id} ${p.label}`),
    );
    return hit?.id || null;
  }

  if (/impact|why.?us|why families/i.test(lower)) {
    const hit = content.find((p) => /\bimpact\b|why.?us|why families/i.test(`${p.id} ${p.label}`));
    return hit?.id || null;
  }

  let best: { id: string; label: string } | null = null;
  let bestScore = 0;
  for (const sec of content) {
    const score = scoreLabelMatch(navLabel, sec.label || sec.id);
    if (score > bestScore) {
      bestScore = score;
      best = sec;
    }
  }
  // Soft fallback so every reference menu item still scrolls somewhere useful
  if (bestScore >= 2 && best) return best.id;
  return hero?.id || content[0]?.id || null;
}

export function buildNavAnchorMap(
  plan: BuiltSiteSectionPlan[],
  categories: string[] = [],
  items: BuiltSiteSectionItem[] = [],
) {
  const sectionSource: Array<{ id: string; label: string }> = items.length
    ? items.map((i) => ({ id: i.id, label: i.label }))
    : plan.map((p) => ({ id: p.id, label: p.label }));

  const content = sectionSource.filter((p) => !isChromeSectionMeta(p.id, p.label));
  const hero =
    sectionSource.find((p) => /hero|banner|topfold|top-fold|slider/i.test(`${p.id} ${p.label}`)) ||
    content[0];

  const normalizeId = (id: string) =>
    String(id || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "hero";

  const out: Array<{ label: string; targetId: string }> = [];
  const usedLabels = new Set<string>();

  const push = (label: string, targetId: string) => {
    const key = label.toLowerCase();
    const tid = normalizeId(targetId);
    if (!label || !tid || usedLabels.has(key)) return;
    usedLabels.add(key);
    // Allow multiple menu labels to share one section (e.g. messages → about).
    out.push({ label, targetId: tid });
  };

  const cats = categories.filter((c) => !isChromeNavCategory(c));

  // 1) Prefer reference/domain menu labels (full count), map each to best section.
  for (const label of cats) {
    const friendly = label.replace(/\s+/g, " ").trim().slice(0, 36);
    if (!friendly) continue;
    const targetId =
      resolveNavTargetId(friendly, content, hero) ||
      hero?.id ||
      content[0]?.id ||
      "hero";
    push(friendly, targetId);
    if (out.length >= 10) break;
  }

  // 2) Fill from real sections if menu still thin.
  if (out.length < 5) {
    for (const sec of content) {
      const label = navLabelForSection(sec.id, sec.label);
      if (!label) continue;
      push(label, sec.id);
      if (out.length >= 10) break;
    }
  }

  // 3) Guaranteed baseline.
  if (out.length < 4) {
    const fallbacks: Array<{ label: string; re: RegExp }> = [
      { label: "About", re: /\babout\b|history|welcome/i },
      { label: "Academics", re: /program|service|academ|class/i },
      { label: "Facilities", re: /facilit|campus|galler/i },
      { label: "Gallery", re: /galler|photo|campus/i },
      { label: "Contact", re: /involve|contact|footer|admission/i },
    ];
    for (const fb of fallbacks) {
      const sec = content.find((p) => fb.re.test(`${p.id} ${p.label}`)) || hero;
      if (sec) push(fb.label, sec.id);
    }
  }

  return out.slice(0, 10);
}

/** Rewrite header nav links to scroll within the single homepage. */
export function wireHeaderNavAnchors(html: string, anchors: Array<{ label: string; targetId: string }>) {
  let out = html;
  for (const { label, targetId } of anchors) {
    const text = label.trim();
    if (!text || !targetId) continue;
    const re = new RegExp(
      `<a\\b([^>]*)>([\\s\\S]*?)${escapeRegex(text)}([\\s\\S]*?)<\\/a>`,
      "gi",
    );
    out = out.replace(re, (_m, attrs, before, after) => {
      let nextAttrs = String(attrs)
        .replace(/\shref=(["'])[^"']*\1/gi, "")
        .replace(/\starget=(["'])[^"']*\1/gi, "")
        .replace(/\srel=(["'])[^"']*\1/gi, "");
      return `<a${nextAttrs} href="#${targetId}" data-redesign-scroll="${targetId}">${before}${text}${after}</a>`;
    });
  }
  return out;
}

/** Build leak phrases from whatever reference the user picked (any site). */
function buildReferenceLeakPhrases(
  referenceSiteName?: string,
  referenceUrl?: string,
): string[] {
  const out: string[] = [];
  const add = (value: string) => {
    const t = String(value || "").replace(/\s+/g, " ").trim();
    if (t.length >= 3) out.push(t);
  };

  const name = (referenceSiteName || "").trim();
  if (name) {
    add(name);
    const stripped = name
      .replace(
        /\b(foundation|society|trust|welfare|association|organisation|organization|ngo|inc|ltd|llc|pvt\.?|private|limited|company|corp\.?|corporation)\b/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();
    if (stripped.length >= 3 && stripped.toLowerCase() !== name.toLowerCase()) {
      add(stripped);
    }
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 3) add(words.slice(0, 3).join(" "));
    if (words.length >= 2) add(words.slice(0, 2).join(" "));
  }

  const rawUrl = (referenceUrl || "").trim();
  if (rawUrl) {
    try {
      const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      const host = new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
      if (host) {
        add(host);
        add(`www.${host}`);
        const slug = host.split(".")[0] || "";
        if (slug.length >= 3 && !/^(com|org|net|in|co|io|edu|gov)$/i.test(slug)) {
          add(slug);
        }
      }
    } catch {
      /* ignore bad URL */
    }
  }

  // Longer phrases first so "Dreams for Life Welfare Foundation" wins over "Dreams for Life"
  return [...new Set(out)].sort((a, b) => b.length - a.length);
}

/** Strip reference brand leaks from customer redesign HTML (any reference site). */
function stripReferenceAgencyLeak(
  html: string,
  brandName?: string,
  referenceSiteName?: string,
  referenceUrl?: string,
) {
  if (!html) return html;
  const brand = (brandName || "Brand").replace(/[<>&"]/g, "").slice(0, 48) || "Brand";
  let out = html;

  for (const leak of buildReferenceLeakPhrases(referenceSiteName, referenceUrl)) {
    if (leak.toLowerCase() === brand.toLowerCase()) continue;
    const escaped = leak.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), brand);
  }

  return out;
}

function sanitizePlanLabel(label: string, brandName?: string) {
  let next = (label || "").replace(/\s+/g, " ").trim();
  next = next
    .replace(/\bjoin the\b.*\bfamily\b/gi, "Careers")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 48);
  // Hostnames / capture ids / sentence-length slogans are not section titles.
  if (
    /\.(com|org|in|net|io|co)\b/i.test(next) ||
    /^(ref-section|section-band|top-fold|topfold|captured|reference)\b/i.test(next) ||
    /^[a-z0-9-]+\.[a-z]{2,}$/i.test(next) ||
    /donor-banner|ticker|marquee/i.test(next) ||
    (next.split(/\s+/).length >= 8 && /[,.]|deserve|together|accounted/i.test(next))
  ) {
    next = "";
  }
  if (!next && brandName) return brandName.slice(0, 48);
  return next || "Section";
}

function isThinFooterSection(item: BuiltSiteSectionItem) {
  const html = (item.html || "").trim();
  if (!/footer/i.test(`${item.id} ${item.label}`) && !/<footer\b/i.test(html)) return false;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  // Known fallback stub — replace even when template markup is long.
  if (
    /contact us for a free consultation/i.test(text) &&
    !/\+?\d[\d\s().-]{7,}\d|@|mailto:|tel:/i.test(text)
  ) {
    return true;
  }
  if (/^(?:.|\n){0,200}\bredesign\b(?:.|\n){0,120}$/i.test(text) && text.length < 420) {
    return true;
  }
  // Keep any real multi-column / link-rich footer from AI — only replace stubs.
  if (/grid-cols|md:grid|quick links|copyright|contact|address|phone|email/i.test(html) && html.length > 280) {
    return false;
  }
  if (/<footer\b[\s\S]{280,}/i.test(html)) return false;
  return text.length < 80 || /^footer$/i.test(text);
}

/** Keep plan chrome sane: header → hero → content → single footer last. */
export function normalizeSectionPlanOrder(
  plan: BuiltSiteSectionPlan[],
): BuiltSiteSectionPlan[] {
  if (plan.length < 2) return plan;

  const isFooter = (p: BuiltSiteSectionPlan) =>
    /footer/i.test(`${p.id} ${p.label}`) || /site-footer/i.test(p.layout || "");
  const isHeader = (p: BuiltSiteSectionPlan) =>
    /header|navbar|main-nav|top-navigation/i.test(`${p.id} ${p.label} ${p.layout || ""}`) &&
    !/hero|banner|topfold|top-fold/i.test(`${p.id} ${p.label}`);
  const isHero = (p: BuiltSiteSectionPlan) =>
    /hero|banner|topfold|top-fold|full-bleed-hero|hero-heading/i.test(
      `${p.id} ${p.label} ${p.layout || ""}`,
    );

  const headers = plan.filter((p) => isHeader(p) && !isFooter(p));
  const heroes = plan.filter((p) => isHero(p) && !isHeader(p) && !isFooter(p));
  const footers = plan.filter(isFooter);
  const rest = plan.filter(
    (p) => !isFooter(p) && !headers.includes(p) && !heroes.includes(p),
  );

  const header = headers[0];
  const footer =
    footers[footers.length - 1] ||
    ({
      id: "footer",
      label: "Footer",
      hint: "Footer links and copyright",
      uiBlueprint: "",
      layout: "site-footer",
    } satisfies BuiltSiteSectionPlan);

  const out: BuiltSiteSectionPlan[] = [];
  if (header) out.push(header);
  out.push(...heroes);
  out.push(...rest);
  out.push(footer);
  return out.slice(0, 15);
}

function buildFallbackFooterHtml(
  brand: string,
  description: string,
  id: string,
  extra?: { phone?: string; email?: string; address?: string; logoImage?: string },
) {
  const safeBrand = brand.replace(/[<>&"]/g, "");
  const safeDesc = description.replace(/[<>&"]/g, "").slice(0, 280);
  const phone = (extra?.phone || "").replace(/[<>&"]/g, "");
  const email = (extra?.email || "").replace(/[<>&"]/g, "");
  const address = (extra?.address || "").replace(/[<>&"]/g, "").slice(0, 160);
  const logo = (extra?.logoImage || "").replace(/[<>&"]/g, "");
  const year = new Date().getFullYear();
  const brandMark = logo
    ? `<img src="${logo}" alt="${safeBrand}" class="mb-3 h-12 w-auto max-w-[180px] object-contain rounded bg-white/95 p-1" />`
    : "";
  return `<footer id="${id}" data-section-id="${id}" class="w-full bg-stone-950 text-white"><div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4"><div class="md:col-span-2">${brandMark}<strong class="text-lg">${safeBrand}</strong><p class="mt-3 text-sm leading-6 text-white/70">${safeDesc}</p></div><div><p class="text-xs font-bold uppercase tracking-wider text-orange-400">Quick Links</p><ul class="mt-3 space-y-2 text-sm text-white/80"><li><a href="#hero" data-redesign-scroll="hero">Home</a></li><li><a href="#about" data-redesign-scroll="about">About</a></li><li><a href="#services" data-redesign-scroll="services">Services</a></li><li><a href="#contact" data-redesign-scroll="contact">Contact</a></li></ul></div><div><p class="text-xs font-bold uppercase tracking-wider text-orange-400">Get in Touch</p><ul class="mt-3 space-y-2 text-sm text-white/70">${phone ? `<li>${phone}</li>` : ""}${email ? `<li>${email}</li>` : ""}${address ? `<li>${address}</li>` : ""}${!phone && !email && !address ? "<li>Contact us for a free consultation.</li>" : ""}</ul></div></div><div class="border-t border-white/10 px-6 py-4 text-center text-xs text-white/50">© ${year} ${safeBrand}. All rights reserved.</div></footer>`;
}

function sectionFingerprint(html: string) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 220);
}

function sectionHeadingKey(html: string) {
  const heading = (html || "").match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1] || "";
  return heading
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 80);
}

/** Collapse similar sections to one role (stops duplicate Hero/About/Gallery blocks). */
function sectionRoleKey(id: string, label: string, html: string) {
  const s = `${id} ${label} ${(html || "").slice(0, 500)}`.toLowerCase();
  if (/footer/.test(s) || /<footer\b/.test(html || "")) return "footer";
  if (/news.?ticker|ticker|marquee|announcement-bar/.test(s)) return "ticker";
  if (/top.?bar|utility|session-bar|helpline/.test(s) && !/<header\b/.test(html || "")) return "topbar";
  if ((/header|navbar|main-nav|site-header/.test(s) || /<header\b/.test(html || "")) && !/hero|banner|topfold/.test(s)) {
    return "header";
  }
  if (/hero|banner|topfold|top-fold|slider|welcome to/.test(s)) return "hero";
  if (/about|who we|our story|our school/.test(s)) return "about";
  if (/academic|programme|program|curriculum|classes offered/.test(s)) return "academics";
  if (/facilit|infrastruct|campus|lab|library/.test(s)) return "facilities";
  if (/galler|photo|media/.test(s)) return "gallery";
  if (/testimonial|what .+ say|parent.?voice|review/.test(s)) return "testimonials";
  if (/achiev|topper|result|award|board pass/.test(s)) return "achievements";
  if (/facult|teacher|staff|educator/.test(s)) return "faculty";
  if (/admission|enroll|apply online/.test(s)) return "admissions";
  if (/contact|reach us|get in touch|location|map/.test(s)) return "contact";
  if (/event|news(?! ticker)|update|blog/.test(s)) return "news";
  if (/accredit|affiliat|cbse|icse|recognition/.test(s)) return "accreditation";
  return "";
}

function hasUsableFooter(items: BuiltSiteSectionItem[]) {
  return items.some((item) => {
    const html = item.html || "";
    if (!/<footer\b/i.test(html) && !/footer/i.test(`${item.id} ${item.label}`)) return false;
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text.length >= 80;
  });
}

/** Keep exactly one real <footer>; strip footer blocks from blogs/contact/etc. */
function consolidateFooters(
  items: BuiltSiteSectionItem[],
  meta?: {
    brandName?: string;
    description?: string;
    logoImage?: string;
    contactPhone?: string;
    contactEmail?: string;
    contactAddress?: string;
  },
): BuiltSiteSectionItem[] {
  let bestFoot: string | null = null;
  const out: BuiltSiteSectionItem[] = [];

  for (const item of items) {
    let html = item.html || "";
    const isFooterSlot = /footer/i.test(`${item.id} ${item.label}`);
    const match = html.match(/<footer\b[\s\S]*?<\/footer>/i);

    if (match) {
      if (!bestFoot || match[0].length > bestFoot.length) bestFoot = match[0];
      if (isFooterSlot) continue;
      html = html.replace(/<footer\b[\s\S]*?<\/footer>/gi, "").trim();
      if (html.length < 100) continue;
      out.push({ ...item, html });
      continue;
    }

    if (isFooterSlot) continue;
    out.push(item);
  }

  const footText = (html: string) =>
    html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const isStubFoot = (html: string) => {
    const text = footText(html);
    if (
      /contact us for a free consultation/i.test(text) &&
      !/\+?\d[\d\s().-]{7,}\d|@|mailto:|tel:/i.test(text)
    ) {
      return true;
    }
    return false;
  };

  if (bestFoot && footText(bestFoot).length >= 80 && !isStubFoot(bestFoot)) {
    out.push({ id: "footer", label: "Footer", html: bestFoot });
  } else {
    const d = (meta?.description || "").replace(/\s+/g, " ").trim();
    const safeDesc =
      d.length >= 24 &&
      !/^(redesign|rebuild|new website|website|home|build|make|create|update)(\s+\w+){0,4}$/i.test(d)
        ? d
        : "Trusted organization serving the community.";
    out.push({
      id: "footer",
      label: "Footer",
      html: buildFallbackFooterHtml(
        meta?.brandName || "Your Brand",
        safeDesc,
        "footer",
        {
          phone: meta?.contactPhone,
          email: meta?.contactEmail,
          address: meta?.contactAddress,
          logoImage: meta?.logoImage,
        },
      ),
    });
  }

  return out;
}

function countHeaderMenuLinks(headerHtml: string) {
  const links = [...headerHtml.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)];
  let count = 0;
  for (const match of links) {
    const text = (match[1] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 2 || text.length > 48) continue;
    if (/^logo$/i.test(text)) continue;
    if (/<img\b/i.test(match[0]) && text.length < 3) continue;
    count += 1;
  }
  return count;
}

/** Inject / repair header nav: desktop = lg+, mobile = hamburger drawer (one only). */
export function ensureHeaderNavLinks(
  html: string,
  anchors: Array<{ label: string; targetId: string }>,
) {
  if (!html || !/<header\b/i.test(html)) return html;

  const safeAnchors =
    anchors.length >= 2
      ? anchors.slice(0, 10)
      : [
          { label: "Home", targetId: "hero" },
          { label: "About", targetId: "about" },
          { label: "Academics", targetId: "services" },
          { label: "Gallery", targetId: "gallery" },
          { label: "Contact", targetId: "footer" },
        ];

  return html.replace(/(<header\b[\s\S]*?<\/header>)/i, (header) => {
    const items = safeAnchors
      .map(
        ({ label, targetId }) =>
          `<a href="#${targetId}" data-redesign-scroll="${targetId}" class="whitespace-nowrap text-[13px] font-semibold text-slate-800 hover:text-orange-600 xl:text-sm">${label.replace(/[<>&]/g, "")}</a>`,
      )
      .join("\n");

    const desktopNav = `<nav class="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-2 lg:flex xl:gap-x-5" data-redesign-main-nav="true">${items}</nav>`;
    const mobileItems = safeAnchors
      .map(
        ({ label, targetId }) =>
          `<a href="#${targetId}" data-redesign-scroll="${targetId}" class="block border-b border-slate-100 px-3 py-3 text-sm font-semibold text-slate-800">${label.replace(/[<>&]/g, "")}</a>`,
      )
      .join("");
    const mobileNav = `<nav class="hidden flex-col gap-0 border-t border-slate-100 bg-white px-1 py-1 lg:hidden" data-mobile-menu="main" data-open="false">${mobileItems}</nav>`;
    const burger = `<button type="button" class="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-800 lg:hidden" data-mobile-menu-toggle="main" aria-label="Open menu" aria-expanded="false"><span class="text-xl leading-none">☰</span></button>`;

    let next = header;

    // Wipe every mobile drawer + every hamburger-like control — then inject exactly one of each.
    next = next.replace(/<nav\b[^>]*\bdata-mobile-menu\b[^>]*>[\s\S]*?<\/nav>/gi, "");
    next = next.replace(
      /<button\b[^>]*(?:data-mobile-menu-toggle|aria-label=["'][^"']*menu[^"']*["']|aria-controls=["'][^"']*(?:nav|menu)[^"']*["']|class=["'][^"']*(?:menu-btn|hamburger|nav-toggle|mobile-menu)[^"']*["'])[^>]*>[\s\S]*?<\/button>/gi,
      "",
    );
    // Bare ☰ / three-line icon buttons without attributes
    next = next.replace(
      /<button\b[^>]*>\s*(?:<span[^>]*>\s*☰\s*<\/span>|☰|<svg\b[\s\S]*?<\/svg>)\s*<\/button>/gi,
      (full) => (/lg:hidden|md:hidden|sm:hidden/i.test(full) ? "" : full),
    );

    // Always sync desktop nav link list to anchors (fixes thin / wrong Gallery targets).
    if (/data-redesign-main-nav/i.test(next)) {
      next = next.replace(
        /<nav\b[^>]*data-redesign-main-nav\b[^>]*>[\s\S]*?<\/nav>/i,
        desktopNav,
      );
    } else if (/<nav\b(?![^>]*data-mobile-menu)[^>]*>[\s\S]*?<\/nav>/i.test(next)) {
      next = next.replace(/<nav\b(?![^>]*data-mobile-menu)[^>]*>[\s\S]*?<\/nav>/i, desktopNav);
    } else if (/<a\b[^>]*>\s*<img\b/i.test(next)) {
      next = next.replace(
        /(<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>)/i,
        `$1<div class="relative ml-auto flex items-center gap-3">${desktopNav}</div>`,
      );
    } else {
      next = next.replace(
        /(<\/header>)/i,
        `<div class="relative flex w-full items-center gap-4 px-4 py-3 md:px-6">${desktopNav}</div>$1`,
      );
    }

    // Exactly one burger + one drawer.
    next = next.replace(
      /(data-redesign-main-nav=["']true["'][^>]*>[\s\S]*?<\/nav>)/i,
      `$1${burger}`,
    );
    if (!/data-mobile-menu-toggle/i.test(next)) {
      next = next.replace(
        /(<\/header>)/i,
        `<div class="relative flex justify-end px-4 pb-2 lg:hidden">${burger}</div>$1`,
      );
    }
    if (!/\bdata-mobile-menu\b/i.test(next)) {
      next = next.replace(/(<\/header>)/i, `${mobileNav}$1`);
    }

    // Desktop nav: only from lg up.
    next = next.replace(/<nav\b([^>]*)>/gi, (full, attrs: string) => {
      if (/data-mobile-menu/i.test(attrs)) return full;
      let a = String(attrs);
      a = a
        .replace(/\bmd:flex\b/gi, "lg:flex")
        .replace(/\bflex-wrap\b/gi, "flex-nowrap");
      if (!/\blg:flex\b/i.test(a)) {
        a = /\bclass=/i.test(a)
          ? a.replace(/class=(["'])([^"']*)\1/i, 'class=$1hidden lg:flex flex-nowrap $2$1')
          : `${a} class="hidden lg:flex flex-nowrap"`;
      } else if (!/\bhidden\b/i.test(a)) {
        a = a.replace(/class=(["'])([^"']*)\1/i, 'class=$1hidden $2$1');
      }
      if (!/\bflex-nowrap\b/i.test(a)) {
        a = a.replace(/class=(["'])([^"']*)\1/i, 'class=$1flex-nowrap $2$1');
      }
      if (!/data-redesign-main-nav/i.test(a)) a += ' data-redesign-main-nav="true"';
      return `<nav${a}>`;
    });

    if (!/\brelative\b/i.test(next.slice(0, 160))) {
      next = next.replace(/<header\b([^>]*)>/i, (_m, attrs: string) => {
        let a = String(attrs);
        a = /\bclass=/i.test(a)
          ? a.replace(/class=(["'])([^"']*)\1/i, 'class=$1relative $2$1')
          : `${a} class="relative"`;
        return `<header${a}>`;
      });
    }

    return next;
  });
}

function repairVisibleNav(html: string) {
  let out = html || "";
  out = out.replace(/<nav\b([^>]*)>/gi, (full, attrs: string) => {
    if (/data-mobile-menu/i.test(attrs)) {
      let mobile = String(attrs);
      if (!/\bhidden\b/i.test(mobile)) {
        mobile = /\bclass=/i.test(mobile)
          ? mobile.replace(/class=(["'])([^"']*)\1/i, 'class=$1hidden $2$1')
          : `${mobile} class="hidden"`;
      }
      // Match hamburger breakpoint (lg), not md.
      mobile = mobile.replace(/\bmd:hidden\b/gi, "lg:hidden");
      if (!/\blg:hidden\b/i.test(mobile) && /\bclass=/i.test(mobile)) {
        mobile = mobile.replace(/class=(["'])([^"']*)\1/i, 'class=$1lg:hidden $2$1');
      }
      if (!/\bdata-open=/i.test(mobile)) mobile += ' data-open="false"';
      if (!/data-mobile-menu=/i.test(mobile)) {
        mobile = mobile.replace(/data-mobile-menu(?!=)/i, 'data-mobile-menu="main"');
      }
      return `<nav${mobile}>`;
    }
    let next = attrs
      .replace(/\binvisible\b/gi, "")
      .replace(/\bopacity-0\b/gi, "")
      .replace(/\bsr-only\b/gi, "")
      .replace(/\bmd:flex\b/gi, "lg:flex")
      .replace(/\bflex-wrap\b/gi, "flex-nowrap")
      .replace(/\s+/g, " ");
    // Keep mobile-first collapse: hidden lg:flex (do NOT strip hidden).
    if (!/\blg:flex\b/i.test(next)) {
      next = /\bclass=/i.test(next)
        ? next.replace(/class=(["'])([^"']*)\1/i, 'class=$1hidden lg:flex flex-nowrap items-center gap-4 $2$1')
        : `${next} class="hidden lg:flex flex-nowrap items-center gap-4"`;
    } else if (!/\bhidden\b/i.test(next)) {
      next = next.replace(/class=(["'])([^"']*)\1/i, 'class=$1hidden $2$1');
    }
    return `<nav${next}>`;
  });
  out = out.replace(/\btruncate\b/g, "");
  out = out.replace(/\bline-clamp-[0-9]+\b/g, "");
  return out;
}

/** Post-process guards so known redesign bugs do not ship again. */
export function finalizeRedesignSections(
  items: BuiltSiteSectionItem[],
  plan: BuiltSiteSectionPlan[] = [],
  meta?: {
    brandName?: string;
    description?: string;
    logoImage?: string;
    contentImages?: string[];
    navItems?: string[];
    contactPhone?: string;
    contactEmail?: string;
    contactAddress?: string;
    referenceSiteName?: string;
    referenceUrl?: string;
  },
): BuiltSiteSectionItem[] {
  if (!items.length) return items;

  const seenFp = new Set<string>();
  const seenRoles = new Set<string>();
  const seenHeadings = new Set<string>();
  const repaired: BuiltSiteSectionItem[] = [];
  const navSource = (meta?.navItems || []).filter((c) => !isChromeNavCategory(c));
  const fallbackNav = items
    .filter((item) => !isChromeSectionMeta(item.id, item.label))
    .map((item) => item.label)
    .filter((label) => label && label.length >= 2 && label.length <= 40)
    .slice(0, 10);
  const anchors = buildNavAnchorMap(
    plan.length ? plan : items.map((i) => ({ id: i.id, label: i.label, hint: i.label })),
    navSource.length >= 2 ? navSource : fallbackNav,
    items,
  );
  const footerDescription = (() => {
    const d = (meta?.description || "").replace(/\s+/g, " ").trim();
    if (
      d.length >= 24 &&
      !/^(redesign|rebuild|new website|website|home|build|make|create|update)(\s+\w+){0,4}$/i.test(d)
    ) {
      return d;
    }
    return "Trusted organization serving the community.";
  })();

  for (const item of items) {
    let html = stripReferenceAgencyLeak(
      repairVisibleNav(item.html || ""),
      meta?.brandName,
      meta?.referenceSiteName,
      meta?.referenceUrl,
    );
    const cleanLabel = sanitizePlanLabel(item.label || "", meta?.brandName);
    const fp = sectionFingerprint(html);
    const role = sectionRoleKey(item.id, cleanLabel, html);
    const heading = sectionHeadingKey(html);
    const isChrome = /header|footer|topbar|ticker|nav/i.test(`${item.id} ${cleanLabel}`);
    const planIds = new Set(
      plan.map((p) => slugId(p.id || p.label, "")).filter(Boolean),
    );
    const itemPlanId = slugId(item.id || cleanLabel, "");
    const lockedToPlan = Boolean(itemPlanId && planIds.has(itemPlanId));

    // Drop near-identical HTML repeats.
    if (fp.length > 60 && seenFp.has(fp)) continue;
    // Role/heading dedupe ONLY when not mapped to a distinct reference-plan slot.
    // (Was collapsing Process/Testimonials/Blogs/… into ~7 leftover sections.)
    if (!lockedToPlan && role && seenRoles.has(role) && !isChrome) continue;
    if (!lockedToPlan && heading.length > 12 && seenHeadings.has(heading) && !isChrome) continue;

    if (fp.length > 60) seenFp.add(fp);
    if (role) seenRoles.add(role);
    if (heading.length > 12) seenHeadings.add(heading);

    if (/header|navbar|main-nav|site-header|topbar/i.test(`${item.id} ${cleanLabel}`) || /<header\b/i.test(html)) {
      html = ensureHeaderNavLinks(html, anchors);
      html = repairVisibleNav(html);
      if (anchors.length) html = wireHeaderNavAnchors(html, anchors);
    }

    if (isThinFooterSection({ ...item, label: cleanLabel, html })) {
      const id = slugId(item.id || "footer", "footer");
      repaired.push({
        ...item,
        id,
        label: "Footer",
        html: buildFallbackFooterHtml(
          meta?.brandName || "Your School",
          footerDescription,
          id,
          {
            phone: meta?.contactPhone,
            email: meta?.contactEmail,
            address: meta?.contactAddress,
            logoImage: meta?.logoImage,
          },
        ),
      });
      continue;
    }

    if (/<header\b|<footer\b/i.test(html) || /header|footer|navbar|topbar|site-header/i.test(cleanLabel || "")) {
      html = applySiteLogoPolicy(html, {
        logoImage: meta?.logoImage,
        brandName: meta?.brandName,
      });
    }

    repaired.push({ ...item, label: cleanLabel || item.label, html });
  }

  const withOneFooter = consolidateFooters(repaired, meta);
  return ensureSchoolPageOrder(withOneFooter, plan);
}

export function wireSinglePageSections(
  items: BuiltSiteSectionItem[],
  plan: BuiltSiteSectionPlan[],
  categories: string[] = [],
  meta?: {
    brandName?: string;
    description?: string;
    logoImage?: string;
    contentImages?: string[];
    preserveHeroSlider?: boolean;
    contactPhone?: string;
    contactEmail?: string;
    contactAddress?: string;
    referenceSiteName?: string;
    referenceUrl?: string;
  },
): BuiltSiteSectionItem[] {
  if (!items.length) return items;
  const normalized = items.map((item, index) => {
    const id = slugId(item.id || item.label || plan[index]?.id || "", `section-${index + 1}`);
    const label = item.label || plan[index]?.label || "";
    let raw = normalizeSectionLayout(item.html || "", index, label, {
      contentImages: meta?.contentImages,
      preserveHeroSlider: meta?.preserveHeroSlider,
    });
    if (/<header\b|<footer\b/i.test(raw) || /header|footer|navbar|topbar|site-header/i.test(`${id} ${label}`)) {
      raw = applySiteLogoPolicy(raw, {
        logoImage: meta?.logoImage,
        brandName: meta?.brandName,
      });
    }
    return {
      ...item,
      id,
      html: ensureSectionAnchorHtml(raw, id),
    };
  });

  const anchors = buildNavAnchorMap(
    plan.length
      ? plan
      : normalized.map((i) => ({
          id: i.id,
          label: i.label,
          hint: i.label,
        })),
    categories.filter((c) => !isChromeNavCategory(c)),
    normalized,
  );

  const headerIdx = normalized.findIndex((item) =>
    /header|nav|topbar/i.test(`${item.id} ${item.label}`),
  );
  normalized.forEach((item, idx) => {
    if (!/header|navbar|main-nav|site-header|topbar/i.test(`${item.id} ${item.label}`)) return;
    let html = item.html || "";
    html = ensureHeaderNavLinks(html, anchors);
    if (anchors.length) html = wireHeaderNavAnchors(html, anchors);
    normalized[idx] = { ...item, html };
  });

  return finalizeRedesignSections(normalized, plan, {
    ...meta,
    navItems: categories,
  });
}

export function plansAlreadyInOrder(plan: BuiltSiteSectionPlan[], items: BuiltSiteSectionItem[]) {
  if (!plan.length || items.length < plan.length) return false;
  for (let i = 0; i < plan.length; i += 1) {
    const planId = slugId(plan[i].id || plan[i].label, `section-${i + 1}`);
    const itemId = slugId(items[i].id || items[i].label, "");
    if (planId === itemId) continue;
    if (scoreLabelMatch(plan[i].label || plan[i].id, items[i].label || items[i].id) >= 2) continue;
    return false;
  }
  return true;
}

function scoreItemToPlanSlot(item: BuiltSiteSectionItem, planLabel: string, planId: string) {
  let score = scoreLabelMatch(item.label || item.id, planLabel || planId);
  const slot = `${planId} ${planLabel}`.toLowerCase();
  const html = (item.html || "").slice(0, 2400).toLowerCase();

  if (/hero|banner|slider|top-fold|topfold/.test(slot)) {
    if (/hero-slide|hero-slider|swiper|carousel|building tomorrow|leaders today/.test(html)) score += 6;
    if (/<h1\b/.test(html) && /min-h-\[(?:60|70|80|90|100)vh\]|min-h-screen/.test(html)) score += 4;
  }
  if (/footer/.test(slot)) {
    if (/<footer\b/.test(html)) score += 8;
    if (/copyright|all rights|quick links|contact us/.test(html)) score += 2;
  }
  if (/header|navbar|main-nav/.test(slot) && !/hero|banner|topfold/.test(slot)) {
    if (/<header\b/.test(html) && /<nav\b/.test(html)) score += 5;
  }
  if (/topbar|top-bar|utility|session-bar/.test(slot)) {
    if (/helpline|session 202|virtual tour|principal@/.test(html)) score += 3;
  }
  if (/news|ticker|announcement|marquee/.test(slot)) {
    if (/ticker|marquee|announcement|breaking news/.test(html)) score += 4;
  }
  return score;
}

function chromeRankForItem(item: BuiltSiteSectionItem, index: number): number | null {
  const id = (item.id || "").toLowerCase();
  const label = (item.label || "").toLowerCase();
  const meta = `${id} ${label}`;
  const html = item.html || "";

  if (/footer/.test(meta) || /<footer\b/i.test(html)) return 900;
  if (/topbar|top-bar|utility|contact-bar|session-bar/.test(meta)) return 20;
  if (/news|ticker|announcement|notice|marquee/.test(meta)) return 30;
  if (id === "header" || /^header\b|main-nav|navbar|site-header/.test(meta)) return 40;
  if (/hero|banner|slider|top-fold|topfold/.test(meta)) return 50;

  if (!/admission|enquiry|inquiry|form|facilit|academic|campus|about|contact|footer|jump to|wings|achiev|result|news update/.test(meta)) {
    const head = html.slice(0, 1200).toLowerCase();
    if (
      (/hero-slide|hero-slider|swiper|carousel|building tomorrow|leaders today/.test(head) ||
        (/<h1\b/i.test(html) && /min-h-\[(?:60|70|80|90|100)vh\]|min-h-screen/.test(head))) &&
      index < 14
    ) {
      return 50;
    }
  }
  return null;
}

function applyChromeFirstOrder(items: BuiltSiteSectionItem[]): BuiltSiteSectionItem[] {
  if (items.length < 2) return items;

  const footers: BuiltSiteSectionItem[] = [];
  const chrome: Array<{ item: BuiltSiteSectionItem; rank: number; i: number }> = [];
  const content: Array<{ item: BuiltSiteSectionItem; i: number }> = [];

  items.forEach((item, i) => {
    const rank = chromeRankForItem(item, i);
    if (rank === 900) footers.push(item);
    else if (rank !== null) chrome.push({ item, rank, i });
    else content.push({ item, i });
  });

  chrome.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.i - b.i));
  content.sort((a, b) => a.i - b.i);

  if (footers.length > 1) {
    footers.sort((a, b) => {
      const aReal = /<footer\b/i.test(a.html || "") ? 1 : 0;
      const bReal = /<footer\b/i.test(b.html || "") ? 1 : 0;
      if (bReal !== aReal) return bReal - aReal;
      return (b.html?.length || 0) - (a.html?.length || 0);
    });
    footers.splice(1);
  }

  return [...chrome.map((x) => x.item), ...content.map((x) => x.item), ...footers];
}

/** Match generated sections to reference plan order (topbar → news → header → hero → …). */
function orderItemsByReferencePlan(
  items: BuiltSiteSectionItem[],
  plan: BuiltSiteSectionPlan[],
): BuiltSiteSectionItem[] {
  if (!plan.length || !items.length) return items;

  const used = new Set<number>();
  const usedFp = new Set<string>();
  const out: BuiltSiteSectionItem[] = [];

  for (let i = 0; i < plan.length; i += 1) {
    const planItem = plan[i];
    const planLabel = (planItem.label || planItem.id || "").trim();
    const planId = slugId(planItem.id || planItem.label, `section-${i + 1}`);

    let bestIdx = -1;
    let bestScore = 0;
    if (i < items.length && !used.has(i)) {
      const seq = scoreItemToPlanSlot(items[i], planLabel, planId);
      if (seq >= 1) {
        bestIdx = i;
        bestScore = seq + 2;
      }
    }
    for (let j = 0; j < items.length; j += 1) {
      if (used.has(j)) continue;
      const fp = sectionFingerprint(items[j].html || "");
      if (fp.length > 60 && usedFp.has(fp)) continue;
      const score = scoreItemToPlanSlot(items[j], planLabel, planId);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }
    const minScore = /footer|hero|banner|header|topbar|news|ticker|top-fold|topfold/i.test(
      `${planId} ${planLabel}`,
    )
      ? 1
      : 2;
    if (bestIdx >= 0 && bestScore >= minScore) {
      const fp = sectionFingerprint(items[bestIdx].html || "");
      if (fp.length > 60 && usedFp.has(fp)) {
        out.push({
          id: planId,
          label: planLabel || `Section ${i + 1}`,
          html: "",
        });
        continue;
      }
      used.add(bestIdx);
      if (fp.length > 60) usedFp.add(fp);
      out.push({
        ...items[bestIdx],
        id: planId,
        label: planLabel || items[bestIdx].label,
      });
    } else if (i < items.length && !used.has(i)) {
      used.add(i);
      out.push({
        ...items[i],
        id: planId,
        label: planLabel || items[i].label,
      });
    } else {
      // Always keep the plan slot (footer/process/etc. were being silently dropped).
      out.push({
        id: planId,
        label: planLabel || `Section ${i + 1}`,
        html: "",
      });
    }
  }

  // Never append unused AI leftovers — they cause repeated Hero/About/Gallery blocks.
  // Keep plan slot order (do not chrome-reshuffle — that dropped footer / reordered mid-page).
  return out.length ? out : items;
}

/** School/reference page order: topbar → news → header → hero → content (unchanged) → footer. */
export function ensureSchoolPageOrder(
  items: BuiltSiteSectionItem[],
  plan?: BuiltSiteSectionPlan[],
): BuiltSiteSectionItem[] {
  if (items.length < 2) return items;

  let ordered: BuiltSiteSectionItem[];
  if (plan?.length) {
    const sanePlan = normalizeSectionPlanOrder(plan);
    ordered = plansAlreadyInOrder(sanePlan, items)
      ? items
      : orderItemsByReferencePlan(items, sanePlan);
  } else {
    ordered = items;
  }
  // Always pin chrome first + footer last (shot-merge used to leave footer mid-page).
  return applyChromeFirstOrder(ordered);
}

/** @deprecated use ensureSchoolPageOrder */
export function ensureHeroAfterHeader(items: BuiltSiteSectionItem[]): BuiltSiteSectionItem[] {
  return ensureSchoolPageOrder(items);
}
