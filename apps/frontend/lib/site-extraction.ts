export type SiteFeature = {
  title: string;
  description: string;
};

export type SiteContent = {
  brandName: string;
  headline: string;
  headlineAccent: string;
  tagline: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  features: SiteFeature[];
  navItems: string[];
  /** Nav / menu categories from the existing (domain) website — content IA */
  categories: string[];
  ctaButtons: string[];
  listItems: string[];
  heroImage: string;
  /** Absolute logo URL from the customer's existing site (header/favicon/removebg) */
  logoImage: string;
  /** Absolute image URLs scraped from the customer's existing site */
  contentImages: string[];
  sectionsTitle: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactPhones?: string[];
  contactEmails?: string[];
};

/** Motion / interactive patterns detected on the reference homepage HTML. */
export type ReferenceMotion = {
  hasHeroSlider: boolean;
  hasTicker: boolean;
  hasTabs: boolean;
  hasAccordion: boolean;
  hasLogoCarousel: boolean;
  hasScrollAnimations: boolean;
  libraries: string[];
  notes: string[];
};

export type ReferenceDesign = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  buttonRadius: string;
  heroLayout: "left" | "center";
  headerStyle: "light" | "dark";
  referenceSiteName: string;
  /** Top-level menu labels from the reference homepage (for redesign nav count/IA) */
  referenceNavItems: string[];
  /** Outline of major sections found on the reference homepage */
  sectionPlan: ReferenceSectionPlan[];
  /** Detected sliders / tickers / animation libs from reference HTML */
  referenceMotion?: ReferenceMotion;
};

export type ReferenceSectionPlan = {
  id: string;
  label: string;
  hint: string;
  /** Captured reference section HTML (UI blueprint — structure/layout) */
  uiBlueprint: string;
  /** Short layout description derived from the reference block */
  layout: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string) {
  return decodeHtml(html.replace(/<[^>]+>/g, " "));
}

function unique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchMeta(html: string, key: string) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${key}["']`,
    "i",
  );
  const match = html.match(pattern);
  return decodeHtml(match?.[1] || match?.[2] || "");
}

function matchAllTags(html: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const matches = [...html.matchAll(pattern)];
  return matches
    .map((match) => stripHtml(match[1] || ""))
    .filter((text) => text.length > 2);
}

function matchAllHeadings(html: string) {
  const pattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const matches = [...html.matchAll(pattern)];
  return matches
    .map((match) => stripHtml(match[2] || ""))
    .filter((text) => text.length > 2);
}

function cleanBodyHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function extractBody(html: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return cleanBodyHtml(bodyMatch?.[1] || html);
}

function isUsefulText(text: string) {
  if (text.length < 8) return false;
  if (/^(home|menu|search|login|sign up|submit|read more|learn more|click here)$/i.test(text)) {
    return false;
  }
  return true;
}

function isCleanNavLabel(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 2 || t.length > 28) return false;
  if (/^[:.\-\s]+/.test(t)) return false;
  if (/@|\+?\d[\d\s().-]{7,}\d|mailto:|tel:/i.test(t)) return false;
  if (/^(home|logo|submit|read more)$/i.test(t)) return false;
  if (/^(mon|tue|wed|thu|fri|sat|sun)\b|opening hours|write to us|copyright/i.test(t)) {
    return false;
  }
  // Reject glued mega-menu dumps
  if (/\bOVERVIEW\b.+\b(TARGET|GALLERY|SERVICES)\b/i.test(t)) return false;
  if ((t.match(/\b(About|Gallery|Services|Contact|Overview|Photos|Videos)\b/gi) || []).length >= 3) {
    return false;
  }
  return true;
}

function extractNavItems(html: string) {
  const navBlocks = [
    ...html.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/gi),
    ...html.matchAll(/<header[^>]*>([\s\S]*?)<\/header>/gi),
    // Menu / #menu / .navbar blocks outside classic <nav> (WordPress / NGO themes).
    ...html.matchAll(
      /<(?:ul|div)[^>]*(?:id|class)=["'][^"']*(?:menu|navbar|main-menu|primary-menu|nav-menu)[^"']*["'][^>]*>([\s\S]*?)<\/(?:ul|div)>/gi,
    ),
  ];

  const links: string[] = [];
  for (const block of navBlocks) {
    const anchorMatches = [...(block[1] || "").matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)];
    for (const anchor of anchorMatches) {
      const text = stripHtml(anchor[1] || "");
      if (!isCleanNavLabel(text)) continue;
      links.push(text.replace(/\s+/g, " ").trim());
    }
  }

  const cleaned = unique(links).slice(0, 12);
  return cleaned.length >= 3
    ? cleaned
    : ["About Us", "Our Services", "Gallery", "Contact Us"];
}

/** User vision / short form intents must not become site description copy. */
function isJunkDescription(text: string) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length < 24) return true;
  return /^(redesign|rebuild|new website|website|home|build|make|create|update)(\s+\w+){0,4}$/i.test(
    t,
  );
}

function extractButtons(html: string) {
  const buttonMatches = [
    ...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi),
    ...html.matchAll(/<a[^>]*class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi),
  ];

  return unique(
    buttonMatches
      .map((match) => stripHtml(match[1] || ""))
      .filter((text) => text.length >= 2 && text.length <= 48),
  ).slice(0, 4);
}

function normalizePhone(raw: string) {
  return raw.replace(/^tel:/i, "").replace(/\s+/g, " ").trim();
}

function extractContactInfo(html: string) {
  // Include <head> — many sites only publish email/phone in JSON-LD / meta.
  const searchHtml = html || "";
  const body = extractBody(html);
  const phones = unique(
    [
      ...[...searchHtml.matchAll(/href=["']tel:([^"']+)["']/gi)].map((m) =>
        normalizePhone(m[1] || ""),
      ),
      ...[...searchHtml.matchAll(/"telephone"\s*:\s*"([^"]+)"/gi)].map((m) =>
        normalizePhone(m[1] || ""),
      ),
      ...[...body.matchAll(/(?:\+?\d[\d\s().-]{8,}\d)/g)].map((m) => m[0].trim()),
    ].filter((value) => value.replace(/\D/g, "").length >= 10),
  );

  const emails = unique(
    [
      ...[...searchHtml.matchAll(/href=["']mailto:([^"'?]+)/gi)].map((m) =>
        m[1].trim().toLowerCase(),
      ),
      ...[...searchHtml.matchAll(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi)].map(
        (m) => m[0].toLowerCase(),
      ),
    ].filter(
      (value) =>
        !/example\.|sentry|webpack|wixpress|placeholder|schema\.org|w3\.org/.test(
          value,
        ),
    ),
  );

  const addressCandidates: string[] = [];
  const contactHtml =
    body.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] ||
    body.match(/<header\b[\s\S]*?<\/header>/i)?.[0] ||
    body;
  for (const match of contactHtml.matchAll(
    /<(?:p|div|span|li|address|td)[^>]*>([\s\S]{18,360}?)<\/(?:p|div|span|li|address|td)>/gi,
  )) {
    const text = stripHtml(match[1] || "");
    if (text.length < 18) continue;
    if (
      /\d{6}\b|\bindia\b|\bdelhi\b|\bncr\b|\bmumbai\b|\bpune\b|\bjaipur\b|\blucknow\b|street|road|sector|nagar|colony|pin|address|office|plot|floor|building|village|district|state|uttar|pradesh|bihar|rajasthan/i.test(
        text,
      )
    ) {
      addressCandidates.push(text);
    }
  }

  const usableAddresses = addressCandidates.filter((text) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (t.length < 12 || t.length > 160) return false;
    if (/^about\s*us\b/i.test(t)) return false;
    if (/president|formed the|union minister|helping hand|memorial society has/i.test(t)) {
      return false;
    }
    return true;
  });
  usableAddresses.sort((a, b) => a.length - b.length);
  return {
    contactPhone: phones[0] || "",
    contactEmail: emails[0] || "",
    contactAddress: usableAddresses[0] || "",
    contactPhones: phones.slice(0, 4),
    contactEmails: emails.slice(0, 4),
  };
}

function extractFeaturePairs(html: string) {
  const features: SiteFeature[] = [];
  const cardPatterns = [
    ...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>\s*<p[^>]*>([\s\S]*?)<\/p>/gi),
    ...html.matchAll(/<h[3-4][^>]*>([\s\S]*?)<\/h[3-4][\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi),
  ];

  for (const match of cardPatterns) {
    const title = stripHtml(match[1] || "");
    const description = stripHtml(match[2] || "");
    if (title.length >= 3 && description.length >= 20) {
      features.push({ title, description });
    }
  }

  const deduped = new Map<string, SiteFeature>();
  for (const feature of features) {
    deduped.set(feature.title.toLowerCase(), feature);
  }
  return [...deduped.values()].slice(0, 6);
}

function splitHeadline(text: string) {
  const words = text.trim().split(/\s+/);
  if (words.length <= 4) {
    return { headline: text, headlineAccent: "" };
  }

  const splitAt = Math.ceil(words.length / 2);
  return {
    headline: words.slice(0, splitAt).join(" "),
    headlineAccent: words.slice(splitAt).join(" "),
  };
}

function hostnameLabel(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname
      .split(".")[0]
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return "Your Brand";
  }
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized.slice(0, 6);
  const int = Number.parseInt(value, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function isNeutralColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return saturation < 0.12 || (r > 230 && g > 230 && b > 230) || (r < 30 && g < 30 && b < 30);
}

function normalizeHex(color: string) {
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
  }
  return color.toLowerCase();
}

function isDefaultAiPurple(hex: string) {
  const n = normalizeHex(hex);
  return (
    n === "#7c3aed" ||
    n === "#8b5cf6" ||
    n === "#a78bfa" ||
    n === "#6366f1" ||
    n === "#4f46e5" ||
    n === "#f7f5ff" ||
    n === "#f5f3ff" ||
    n === "#ede9fe"
  );
}

function extractColors(html: string) {
  const hexMatches = html.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
  const rgbMatches = [...html.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)].map(
    ([, r, g, b]) => {
      const toHex = (value: string) => Number(value).toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },
  );

  const counts = new Map<string, number>();
  for (const color of [...hexMatches, ...rgbMatches]) {
    const normalized = normalizeHex(color);
    if (isNeutralColor(normalized)) continue;
    if (isDefaultAiPurple(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([color]) => color);
}

function pickBrandSafeColors(colors: string[]) {
  const usable = colors.filter((c) => !isNeutralColor(c) && !isDefaultAiPurple(c));
  // Prefer warm / earthy / teal over generic blue-purple AI defaults.
  const primary = usable[0] || "#0f766e";
  const accent =
    usable.find((c) => normalizeHex(c) !== normalizeHex(primary)) || "#c2410c";
  return { primary, accent };
}

function extractFontFamily(html: string) {
  const fontMatch = html.match(/font-family\s*:\s*([^;}{]+)/i);
  if (!fontMatch) return "Georgia, 'Times New Roman', serif";
  const firstFont = fontMatch[1].split(",")[0]?.replace(/['"]/g, "").trim();
  if (!firstFont || /^(inter|roboto|arial|system-ui|sans-serif)$/i.test(firstFont)) {
    return "Georgia, 'Times New Roman', serif";
  }
  return firstFont;
}

function extractButtonRadius(html: string) {
  if (/border-radius\s*:\s*999/i.test(html) || /rounded-full/i.test(html)) return "9999px";
  if (/border-radius\s*:\s*(\d+)px/i.test(html)) {
    const match = html.match(/border-radius\s*:\s*(\d+)px/i);
    return `${match?.[1] || "12"}px`;
  }
  return "9999px";
}

function detectHeroLayout(html: string) {
  return /text-align\s*:\s*center|items-center|justify-center|text-center/i.test(html)
    ? "center"
    : "left";
}

function detectHeaderStyle(html: string) {
  const headerMatch = html.match(/<header[^>]*style=["']([^"']+)["'][^>]*>/i);
  const headerClass = html.match(/<header[^>]*class=["']([^"']+)["'][^>]*>/i)?.[1] || "";
  const style = headerMatch?.[1] || "";
  if (/background\s*:\s*#(?:000|0{3,6})|bg-black|bg-slate-9|bg-gray-9|text-white/i.test(`${style} ${headerClass}`)) {
    return "dark";
  }
  return "light";
}

function resolveUrl(raw: string, baseUrl: string) {
  try {
    return new URL(raw.trim().replace(/\\u002F/gi, "/").replace(/\\\//g, "/"), baseUrl).toString();
  } catch {
    return "";
  }
}

function decodeEscapedUrl(raw: string) {
  return raw
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/%7E/gi, "~")
    .trim();
}

function mediaFingerprint(url: string) {
  const wix = url.match(/\/media\/([a-z0-9_%.~-]+)/i)?.[1]?.toLowerCase() || "";
  if (wix) return wix.split("/v1")[0] || wix;
  return url.split("?")[0]?.toLowerCase() || url.toLowerCase();
}

function fillWidth(url: string) {
  const match = url.match(/[?/_-]w[_=]?(\d{2,4})/i) || url.match(/\/fill\/w_(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function isUnusableMedia(url: string) {
  const lower = url.toLowerCase();
  if (!/^https?:\/\//i.test(url)) return true;
  if (/\.(svg|heic|heif|tif|tiff)(\?|$)/i.test(lower)) return true;
  if (/data:image|sprite|1x1|pixel|tracking|blur_2|favicon\.ico/i.test(lower)) return true;
  if (/youtube-logo|discord-logo|instagram|vecteezy_|pngegg|facebook|linkedin|twitter/i.test(lower)) {
    return true;
  }
  const width = fillWidth(url);
  if (width > 0 && width < 70) return true;
  return false;
}

function looksLikeLogo(url: string) {
  const lower = url.toLowerCase();
  return (
    /logo|removebg|brand-mark|apple-touch-icon|favicon/i.test(lower) ||
    /screen_shot_.*removebg/i.test(lower)
  );
}

function upgradeMediaUrl(url: string, kind: "logo" | "content") {
  let next = decodeEscapedUrl(url);
  if (/static\.wixstatic\.com\/media\//i.test(next)) {
    next = next.replace(/enc_avif/gi, "enc_auto");
    if (kind === "logo") {
      next = next.replace(/\/fill\/w_\d+(?:,h_\d+)?/i, "/fill/w_480,h_220");
    } else {
      next = next.replace(/\/fill\/w_\d+(?:,h_\d+)?/i, "/fill/w_1200,h_900");
    }
  }
  return next;
}

function pickBrandName(title: string, websiteName: string, domainUrl: string) {
  const clean = (value: string) => value.replace(/\s+/g, " ").trim();
  const wn = clean(websiteName);
  // Prefer explicit website name when it's a real brand (not a raw URL / tiny acronym dump).
  if (
    wn &&
    wn.length >= 3 &&
    wn.length <= 48 &&
    !/^https?:\/\//i.test(wn) &&
    !/\./.test(wn.split(/\s/)[0] || "") &&
    !/^(welcome|home)$/i.test(wn)
  ) {
    // "Cws" alone is too weak — prefer expanded title / host below when available.
    if (wn.length > 4 || /[a-z]{2,}\s+[a-z]/i.test(wn)) return wn;
  }

  // Prefer the first title segment before | / - / : (avoid longest SEO dump).
  const segments = title
    .split(/[|\-–—•:]/)
    .map((part) => clean(part))
    .filter((part) => part.length >= 2);
  const short = segments.find(
    (part) =>
      part.length <= 48 &&
      !/^welcome\b/i.test(part) &&
      !/^home\b/i.test(part) &&
      !/web design|digital marketing|best |agency in/i.test(part),
  );
  if (short && short.length > 4) return short;

  // "Creative Weblink Solution" style phrases in title.
  const agency = title.match(
    /\b(creative\s+weblink\s+solution[s]?|[\w.&]+\s+(?:solutions?|agency|studios?|media|labs?))\b/i,
  )?.[1];
  if (agency && agency.length <= 48) return clean(agency);

  const host = hostnameLabel(domainUrl);
  if (host) {
    // cwsindia → CWS India
    if (/^cws/i.test(host)) return "CWS India";
    return host;
  }
  if (wn) return wn;
  return segments[0] || "Brand";
}

function scoreLogoCandidate(url: string) {
  const lower = url.toLowerCase();
  let score = 0;
  if (/clent-logo|client-logo|site-logo|brand-logo|logo[-_]?0?1|\/logo\./i.test(lower)) score += 60;
  if (/css-?founder-?logo|founder-?logo|company-?logo|main-?logo/i.test(lower)) score += 80;
  if (/logo|removebg|brand-mark|apple-touch-icon/i.test(lower)) score += 25;
  if (/logo[-_]?white|white[-_]?logo|-white\./i.test(lower)) score -= 8;
  if (/logopsd|sprite|icon-pack|collage|thumb|gallery|banner|hero|slide/i.test(lower)) score -= 45;
  // Partner / press logos are not the brand mark.
  if (
    /cnbc|forbes|yourstory|times-of-india|news[-_]?logo|partner|client[-_]?logo|inhouse\/\w+_logo/i.test(
      lower,
    )
  ) {
    score -= 90;
  }
  const width = fillWidth(url);
  if (width > 520) score -= 35;
  if (width > 0 && width <= 320) score += 12;
  return score;
}

function extractJsonLdLogos(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  for (const match of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const raw = (match[1] || "").trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const stack: unknown[] = [parsed];
      while (stack.length) {
        const node = stack.pop();
        if (!node) continue;
        if (Array.isArray(node)) {
          stack.push(...node);
          continue;
        }
        if (typeof node !== "object") continue;
        const obj = node as Record<string, unknown>;
        const logo = obj.logo;
        if (typeof logo === "string") out.push(logo);
        else if (logo && typeof logo === "object") {
          const url = (logo as { url?: unknown }).url;
          if (typeof url === "string") out.push(url);
        }
        for (const value of Object.values(obj)) {
          if (value && typeof value === "object") stack.push(value);
        }
      }
    } catch {
      /* ignore invalid JSON-LD */
    }
  }
  return out
    .map((raw) => resolveUrl(decodeEscapedUrl(raw), baseUrl))
    .filter((url): url is string => Boolean(url));
}

function extractLogoImage(html: string, baseUrl: string, contentImages: string[]): string {
  const candidates: string[] = [];
  const push = (raw: string) => {
    const absolute = resolveUrl(decodeEscapedUrl(raw), baseUrl);
    if (!absolute || isUnusableMedia(absolute)) return;
    if (!candidates.includes(absolute)) candidates.push(absolute);
  };

  for (const url of extractJsonLdLogos(html, baseUrl)) push(url);

  const clent = html.match(/https?:\/\/[^"'\\s<>]*clent-logo[^"'\\s<>]*/i);
  if (clent?.[0]) push(clent[0]);
  const clientLogo = html.match(/https?:\/\/[^"'\\s<>]*client[-_]?logo[^"'\\s<>]*/i);
  if (clientLogo?.[0]) push(clientLogo[0]);

  // Prefer explicit brand logo filenames early (cssfounder, etc.).
  for (const match of html.matchAll(
    /https?:\/\/[^"'\\\s<>]*[\/_-](?:css[-_]?founder[-_]?logo|site[-_]?logo|brand[-_]?logo|main[-_]?logo|logo)[^"'\\\s<>]*/gi,
  )) {
    push(match[0] || "");
  }

  const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  if (header) {
    const headerImg = header.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
    if (headerImg?.[1]) push(headerImg[1]);
    const headerLogo = header.match(
      /<img\b[^>]*(?:class|alt|id)=["'][^"']*logo[^"']*["'][^>]*\bsrc=["']([^"']+)["']/i,
    );
    if (headerLogo?.[1]) push(headerLogo[1]);
  }

  // Common NGO / WordPress logo paths + alt="…logo…"
  for (const match of html.matchAll(
    /<img\b[^>]*(?:src=["']([^"']*(?:logo|brand|emblem)[^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?|alt=["']([^"']*logo[^"']*)["'][^>]*src=["']([^"']+)["'])[^>]*>/gi,
  )) {
    push(match[1] || match[4] || "");
  }

  const apple = html.match(
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
  );
  if (apple?.[1]) push(apple[1]);
  const icon = html.match(
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
  );
  if (icon?.[1]) push(icon[1]);

  for (const url of contentImages) {
    if (looksLikeLogo(url)) push(url);
  }

  const named = html.match(
    /https?:\\?\/\\?\/static\.wixstatic\.com\\?\/media\\?\/[^"'\\\s<>]*(?:logo|removebg|brand)[^"'\\\s<>]*/gi,
  );
  for (const raw of named || []) push(raw);

  if (!candidates.length) return "";

  candidates.sort((a, b) => scoreLogoCandidate(b) - scoreLogoCandidate(a));
  return upgradeMediaUrl(candidates[0], "logo");
}

function extractContentImages(html: string, baseUrl: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string, allowLogo = false) => {
    const absolute = resolveUrl(decodeEscapedUrl(raw), baseUrl);
    if (!absolute || isUnusableMedia(absolute)) return;
    if (!allowLogo && looksLikeLogo(absolute) && !/\.(jpe?g|webp)(\?|$)/i.test(absolute)) {
      // Keep logos out of hero gallery unless they are photo-like.
      return;
    }
    const key = mediaFingerprint(absolute);
    if (seen.has(key)) return;
    seen.add(key);
    found.push(upgradeMediaUrl(absolute, "content"));
  };

  push(matchMeta(html, "og:image"), true);
  push(matchMeta(html, "twitter:image"), true);

  const imgRegex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) && found.length < 20) {
    push(match[1] || "", true);
  }

  const srcsetRegex = /<img\b[^>]*\bsrcset=["']([^"']+)["'][^>]*>/gi;
  while ((match = srcsetRegex.exec(html)) && found.length < 20) {
    const first = (match[1] || "").split(",")[0]?.trim().split(/\s+/)[0];
    if (first) push(first, true);
  }

  // Wix / SPA sites embed media URLs in JSON, not classic <img src>.
  const cdnRegex =
    /https?:\\?\/\\?\/(?:static\.wixstatic\.com\\?\/media|images\.unsplash\.com|cdn\.shopify\.com|res\.cloudinary\.com)[^"'\\\s<>]+/gi;
  while ((match = cdnRegex.exec(html)) && found.length < 24) {
    push(match[0] || "");
  }

  // Prefer larger / photo-like assets first.
  found.sort((a, b) => {
    const score = (url: string) =>
      fillWidth(url) + (/\.(jpe?g|webp)/i.test(url) ? 400 : 0) - (looksLikeLogo(url) ? 300 : 0);
    return score(b) - score(a);
  });

  return found.slice(0, 12);
}

export function extractDomainContent(
  html: string,
  domainUrl: string,
  websiteName: string,
  vision: string,
): SiteContent {
  const body = extractBody(html);
  const title = matchAllTags(html, "title")[0] || websiteName || hostnameLabel(domainUrl);
  const metaRaw =
    matchMeta(html, "description") || matchMeta(html, "og:description") || "";
  const headings = unique(matchAllHeadings(body)).filter(isUsefulText);
  const paragraphs = unique(matchAllTags(body, "p")).filter((text) => text.length >= 24);
  const metaDescription = !isJunkDescription(metaRaw)
    ? metaRaw
    : paragraphs.find((p) => !isJunkDescription(p)) ||
      headings.find((h) => h.length >= 24) ||
      "";
  const listItems = unique([
    ...matchAllTags(body, "li"),
    ...matchAllTags(body, "span").filter((text) => text.length >= 12 && text.length <= 80),
  ]).filter(isUsefulText);
  const h1 = headings[0] || title;
  const { headline, headlineAccent } = splitHeadline(h1);
  const features = extractFeaturePairs(body);
  const navItems = extractNavItems(body);
  const ctaButtons = extractButtons(body);

  const categories = unique([
    ...navItems,
    ...listItems.filter((item) => item.length >= 3 && item.length <= 48).slice(0, 12),
  ]).slice(0, 20);

  const fallbackFeatures: SiteFeature[] = [];
  for (let index = 0; index < headings.slice(1, 4).length; index += 1) {
    const featureTitle = headings.slice(1)[index];
    const featureDescription = paragraphs[index + 1] || paragraphs[index] || metaDescription;
    if (featureTitle && featureDescription) {
      fallbackFeatures.push({ title: featureTitle, description: featureDescription });
    }
  }

  const resolvedFeatures = features.length ? features : fallbackFeatures;
  const extraParagraphs = paragraphs.filter(
    (paragraph) =>
      paragraph !== metaDescription &&
      !resolvedFeatures.some((feature) => feature.description === paragraph),
  );

  const base =
    /^https?:\/\//i.test(domainUrl.trim())
      ? domainUrl.trim()
      : `https://${domainUrl.trim() || "example.com"}`;
  const contentImages = html ? extractContentImages(html, base) : [];
  const logoImage = html ? extractLogoImage(html, base, contentImages) : "";
  const contact = html ? extractContactInfo(html) : extractContactInfo("");

  return {
    brandName: pickBrandName(title, websiteName, domainUrl),
    headline,
    headlineAccent,
    tagline: headings[1] || headings[0] || "Welcome",
    description:
      metaDescription ||
      paragraphs.find((p) => !isJunkDescription(p)) ||
      (!isJunkDescription(vision) ? vision : "") ||
      "Trusted organization serving the community.",
    headings,
    paragraphs: extraParagraphs.length ? extraParagraphs : paragraphs,
    features: resolvedFeatures.length
      ? resolvedFeatures
      : listItems.slice(0, 3).map((item, index) => ({
          title: headings[index + 2] || `Highlight ${index + 1}`,
          description: item,
        })),
    navItems: navItems.length ? navItems : ["Home", "Services", "About", "Contact"],
    categories: categories.length
      ? categories
      : navItems.length
        ? navItems
        : ["Home", "About", "Academics", "Facilities", "Admissions", "Contact"],
    ctaButtons: ctaButtons.length ? ctaButtons : ["Get Started", "Contact Us"],
    listItems,
    heroImage: contentImages[0] || matchMeta(html, "og:image") || "",
    logoImage,
    contentImages,
    sectionsTitle: headings.find((heading) => heading.length > 8 && heading !== h1) || "What we offer",
    ...contact,
  };
}

export function extractReferenceMotion(html: string): ReferenceMotion {
  const lower = (html || "").toLowerCase();
  const libraries: string[] = [];
  const notes: string[] = [];

  const pushLib = (name: string, re: RegExp, note: string) => {
    if (re.test(lower) && !libraries.includes(name)) {
      libraries.push(name);
      notes.push(note);
    }
  };

  pushLib("swiper", /swiper(-bundle)?(\.min)?\.js|class=["'][^"']*swiper/i, "Swiper carousel present");
  pushLib("slick", /slick(\.min)?\.js|slick-carousel|class=["'][^"']*slick/i, "Slick slider present");
  pushLib("owl", /owl\.carousel|class=["'][^"']*owl-carousel/i, "Owl Carousel present");
  pushLib("jquery", /jquery(-|\.)?(min\.)?js|jquery\.com/i, "jQuery present");
  pushLib("aos", /\baos\b|animate\.on\.scroll/i, "AOS scroll animations");
  pushLib("wow", /\bwow\.js\b|class=["'][^"']*\bwow\b/i, "WOW.js animations");
  pushLib("animate.css", /animate\.css|animate\.min\.css|class=["'][^"']*\banimated\b/i, "Animate.css classes");
  pushLib("gsap", /gsap(\.min)?\.js|scrolltrigger/i, "GSAP motion");
  pushLib("bootstrap", /bootstrap(\.min)?\.js|data-bs-ride=["']carousel/i, "Bootstrap carousel/JS");

  const slideHits =
    (lower.match(/swiper-slide|carousel-item|owl-item|slick-slide|hero-slide|slider-item/g) || [])
      .length;
  const hasHeroSlider =
    slideHits >= 2 ||
    /data-bs-ride=["']carousel|owl-carousel|swiper-wrapper|slick-slider|flexslider|nivo-slider|#slider|\bslider\b|banner.?slider|hero.?slider|revolution.?slider/i.test(
      lower,
    ) ||
    ((lower.match(/<img\b[^>]*(?:banner|slider|slide|carousel)[^>]*>/g) || []).length >= 2);
  if (hasHeroSlider) notes.push("Hero/banner has 2+ slides — recreate as data-hero-slider");

  const hasTicker =
    /ticker|marquee|news-scroll|breaking.?news|announcement.?bar/i.test(lower) ||
    /<marquee\b/i.test(html);
  if (hasTicker) notes.push("News ticker / marquee — use .ticker-track");

  const hasTabs =
    /nav-tabs|tab-pane|data-tab|role=["']tablist|tab-content/i.test(lower);
  if (hasTabs) notes.push("Tabs — use data-tab-group hooks");

  const hasAccordion =
    /accordion|collapse|faq|data-bs-toggle=["']collapse/i.test(lower);
  if (hasAccordion) notes.push("Accordion/FAQ — recreate open/close panels");

  const hasLogoCarousel =
    /client.?logo|partner.?logo|logo.?slider|brand.?slider|clent-logo/i.test(lower) &&
    (hasHeroSlider || /owl-carousel|slick|swiper/i.test(lower));
  if (hasLogoCarousel) notes.push("Client logo row may animate/carousel");

  const hasScrollAnimations =
    libraries.some((lib) => /aos|wow|animate\.css|gsap/i.test(lib)) ||
    /data-aos=|wow fade|animate__|fadeInUp|slideIn/i.test(lower);
  if (hasScrollAnimations) notes.push("Scroll/entrance animations — CSS @keyframes or data-aos-like classes");

  return {
    hasHeroSlider,
    hasTicker,
    hasTabs,
    hasAccordion,
    hasLogoCarousel,
    hasScrollAnimations,
    libraries,
    notes: notes.slice(0, 12),
  };
}

export function extractReferenceDesign(html: string, referenceUrl: string): ReferenceDesign {
  const colors = extractColors(html);
  const { primary: primaryColor, accent: accentColor } = pickBrandSafeColors(colors);
  const themeColorRaw = matchMeta(html, "theme-color") || "";
  const themeColor =
    themeColorRaw.startsWith("#") && !isDefaultAiPurple(themeColorRaw)
      ? themeColorRaw
      : primaryColor;
  const referenceTitle = matchAllTags(html, "title")[0] || hostnameLabel(referenceUrl);
  const refHost = hostnameLabel(referenceUrl);
  const refNameRaw = referenceTitle.split(/[|\-–—]/)[0]?.trim() || refHost;
  const genericTitle = /^(home|index|welcome|untitled|website|site)$/i.test(refNameRaw);
  // SEO titles are not brand names (e.g. "Creative Web Design & Development Agency…").
  const referenceSiteName =
    genericTitle ||
    refNameRaw.length > 42 ||
    /web design|agency in|digital marketing|best /i.test(refNameRaw)
      ? refHost || refNameRaw.slice(0, 40)
      : refNameRaw;

  const bgFromTheme = themeColor.startsWith("#") ? `${themeColor}14` : "#f4f7f6";
  const backgroundColor = isDefaultAiPurple(bgFromTheme) || /f7f5ff|f5f3ff/i.test(bgFromTheme)
    ? "#f4f7f6"
    : bgFromTheme;

  return {
    primaryColor,
    accentColor,
    backgroundColor,
    textColor: detectHeaderStyle(html) === "dark" ? "#ffffff" : "#101214",
    fontFamily: extractFontFamily(html),
    buttonRadius: extractButtonRadius(html),
    heroLayout: detectHeroLayout(html),
    headerStyle: detectHeaderStyle(html),
    referenceSiteName,
    referenceNavItems: extractNavItems(html).slice(0, 12),
    sectionPlan: extractReferenceSectionPlan(html),
    referenceMotion: extractReferenceMotion(html),
  };
}

/** Detect major homepage blocks from the reference site and capture each section's UI HTML. */
export function extractReferenceSectionPlan(html: string): ReferenceSectionPlan[] {
  const plans: ReferenceSectionPlan[] = [];

  const toBlueprint = (block: string) => {
    let clean = block
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/\son\w+=(["'])[\s\S]*?\1/gi, "")
      .replace(/https?:\/\/[^\s"'<>]+/gi, "#")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (clean.length > 3600) clean = `${clean.slice(0, 3600)}<!--truncated-->`;
    return clean;
  };

  const detectLayout = (block: string, label: string) => {
    const lower = `${block} ${label}`.toLowerCase();
    if (/header|navbar|nav-/.test(lower)) return "top-navigation-bar";
    // Client/partner logo rows are NOT heroes (logo-slider was matching /slider/).
    if (/logo[-_\s]?slider|logo[-_\s]?strip|client.?logo|partner.?logo|trusted by|brand.?logo/.test(lower)) {
      return "logo-or-client-row";
    }
    if (/client|logo|partner/.test(lower) && !/hero|banner|topfold/.test(lower)) {
      return "logo-or-client-row";
    }
    if (/hero|banner|topfold|top-fold/.test(lower)) return "full-bleed-hero";
    if (/\bswiper\b|\bslider\b/.test(lower) && /hero|banner|home/.test(lower)) {
      return "full-bleed-hero";
    }
    if (/testimonial|review/.test(lower)) return "testimonial-cards";
    if (/pricing|plan/.test(lower)) return "pricing-columns";
    if (/team|about/.test(lower)) return "about-or-team-split";
    if (/contact|form/.test(lower)) return "contact-form-block";
    if (/gallery|portfolio|project/.test(lower)) return "image-gallery-grid";
    if (/footer/.test(lower)) return "site-footer";
    if ((block.match(/<article\b/gi) || []).length >= 2 || (block.match(/card/gi) || []).length >= 2) {
      return "multi-card-grid";
    }
    if ((block.match(/<h1\b/gi) || []).length) return "hero-heading-block";
    return "content-section";
  };

  const push = (label: string, blockHtml: string) => {
    let cleanLabel =
      label.replace(/\s+/g, " ").trim().slice(0, 48) || `Section ${plans.length + 1}`;
    // Never keep reference-agency marketing lines as plan labels.
    cleanLabel = cleanLabel
      .replace(/\bprettify(\s+creative)?\b/gi, "")
      .replace(/\bjoin the\b.*\bfamily\b/gi, "Careers")
      .replace(/\bplaying the right cards\b.*/i, "Services")
      .replace(/\bvictor$/i, "victory")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 48);
    if (
      /\.(com|org|in|net|io|co)\b/i.test(cleanLabel) ||
      /^(ref-section|section-band|top-fold)\b/i.test(cleanLabel) ||
      /^[a-z0-9-]+\.[a-z]{2,}$/i.test(cleanLabel)
    ) {
      cleanLabel = "";
    }
    cleanLabel = cleanLabel || `Section ${plans.length + 1}`;
    const role = cleanLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    // Skip duplicate purpose labels from messy reference HTML (About×2, Gallery×2, …).
    if (
      role &&
      plans.some((item) => {
        const existing = (item.label || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
        if (!existing) return false;
        if (existing === role) return true;
        if (existing.includes(role) || role.includes(existing)) {
          const short = existing.length < 28 && role.length < 28;
          return short;
        }
        return false;
      })
    ) {
      return;
    }
    let id =
      cleanLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || `section-${plans.length + 1}`;
    if (plans.some((item) => item.id === id)) {
      id = `${id}-${plans.length + 1}`;
    }
    const blueprint = toBlueprint(blockHtml);
    plans.push({
      id,
      label: cleanLabel,
      hint: stripHtml(blockHtml).slice(0, 220),
      uiBlueprint: blueprint,
      layout: detectLayout(blockHtml, cleanLabel),
    });
  };

  const headerMatch = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i);

  // Reference school sites: utility topbar + news ticker ABOVE main header nav.
  const preHeaderHtml = html.slice(0, headerMatch?.index ?? html.length);
  const topBarMatch = preHeaderHtml.match(
    /<(?:div|section|nav)[^>]*(?:topbar|top-bar|utility|helpline|session|admission)[^>]*>[\s\S]{40,1200}?<\/(?:div|section|nav)>/i,
  );
  const newsMatch = preHeaderHtml.match(
    /<(?:div|section)[^>]*(?:news|ticker|announcement|notice|marquee)[^>]*>[\s\S]{40,1800}?<\/(?:div|section)>/i,
  );
  if (topBarMatch) push("Top Bar", topBarMatch[0]);
  if (newsMatch) push("News Ticker", newsMatch[0]);

  if (headerMatch) {
    push("Header", headerMatch[0]);
  } else {
    const navMatch = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/i);
    push("Header", navMatch?.[0] || "<header><nav>Logo | Menu | CTA</nav></header>");
  }

  const seen = new Set<string>();
  const sectionTags = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) || [];
  for (const block of sectionTags) {
    if (plans.length >= 16) break;
    if (block.length < 120) continue;
    const fingerprint = stripHtml(block).slice(0, 80);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    const heading = block.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1];
    const classHint = block.match(/\b(?:id|class)=["']([^"']+)["']/i)?.[1] || "";
    push(stripHtml(heading || "") || classHint.split(/\s+/)[0] || `Section ${plans.length}`, block);
  }

  const candidateRegex =
    /<(section|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  const keyword =
    /hero|banner|about|service|feature|testimonial|client|team|pricing|contact|gallery|portfolio|cta|work|project|process|blog|faq|counter|stat|partner|slider|admission|faculty|event|news|academic|program|course|school|campus|welcome|why|choose|offer|package|happiness|creativity|proposal|industr/i;

  while ((match = candidateRegex.exec(html)) && plans.length < 16) {
    const tagAttrs = match[2] || "";
    const inner = match[3] || "";
    const full = match[0];
    if (full.length < 180) continue;
    if (/footer\b/i.test(tagAttrs) && plans.some((item) => /footer/i.test(item.label))) continue;
    if (!keyword.test(tagAttrs) && !keyword.test(inner.slice(0, 400))) {
      // Still allow large <section> blocks with headings
      if (!/^section$/i.test(match[1] || "") || !/<h[1-3]\b/i.test(full)) continue;
    }
    const fingerprint = stripHtml(full).slice(0, 80);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);

    const heading =
      full.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1] ||
      tagAttrs.match(
        /(?:id|class)=["'][^"']*(hero|banner|about|services?|features?|testimonials?|clients?|team|pricing|contact|gallery|portfolio|cta|work|project|process|faq|admission|faculty|event|news)[^"']*["']/i,
      )?.[1] ||
      `Section ${plans.length}`;
    push(stripHtml(heading) || `Section ${plans.length}`, full);
  }

  if (plans.length < 4) {
    const mainBlocks = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) || [];
    for (const block of mainBlocks) {
      if (plans.length >= 16) break;
      if (block.length < 160) continue;
      const heading = block.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1];
      push(stripHtml(heading || `Content ${plans.length}`), block);
    }
  }

  const footerMatch = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i);
  if (footerMatch) {
    push("Footer", footerMatch[0]);
  } else if (!plans.some((item) => /footer/i.test(item.id) || /footer/i.test(item.label))) {
    push("Footer", "<footer><p>Copyright</p></footer>");
  }

  const header = plans.find((item) => /header|nav/i.test(item.id) || /header/i.test(item.label)) || plans[0];
  const footer =
    [...plans].reverse().find((item) => /footer/i.test(item.id) || /footer/i.test(item.label)) ||
    plans[plans.length - 1];
  let middle = plans.filter((item) => item !== header && item !== footer).slice(0, 13);

  const isRealHero = (item: ReferenceSectionPlan) => {
    const m = `${item.id} ${item.label} ${item.layout}`.toLowerCase();
    if (/logo|client|partner|trusted|brand-strip/.test(m)) return false;
    return /hero|topfold|top-fold|banner|full-bleed-hero|hero-heading/.test(m);
  };

  // Prettify-like sites often put the cinematic hero in a <div>, not <section> —
  // without this, logo-slider becomes the fake "hero" (social icons / 70vh black).
  if (!middle.some(isRealHero) && headerMatch) {
    const afterHeader = html.slice((headerMatch.index || 0) + headerMatch[0].length);
    const heroBlock =
      afterHeader.match(
        /<(?:section|div)\b[^>]*(?:class|id)=["'][^"']*(?:hero|banner|home-banner|main-banner|banner-sec|slider-home|home-sec|intro)[^"']*["'][^>]*>[\s\S]{220,12000}?<\/(?:section|div)>/i,
      )?.[0] ||
      afterHeader.match(/<(?:section|div)\b[^>]*>[\s\S]{0,400}<h1\b[\s\S]{200,8000}?<\/(?:section|div)>/i)?.[0];
    if (heroBlock && heroBlock.length > 220) {
      const heading = stripHtml(
        heroBlock.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "Hero",
      ).slice(0, 48);
      middle = [
        {
          id: "hero",
          label: heading || "Hero",
          hint: stripHtml(heroBlock).slice(0, 220),
          uiBlueprint: toBlueprint(heroBlock),
          layout: "full-bleed-hero",
        },
        ...middle,
      ].slice(0, 13);
    } else {
      middle = [
        {
          id: "hero",
          label: "Hero",
          hint: "Full-bleed hero: headline, dual CTAs, motion/background like the reference first viewport",
          uiBlueprint:
            "<section class=\"hero\"><h1>Headline</h1><p>Subcopy</p><a class=\"btn\">Primary CTA</a><a class=\"btn\">Secondary CTA</a></section>",
          layout: "full-bleed-hero",
        },
        ...middle,
      ].slice(0, 13);
    }
  }

  return [header, ...middle, footer].filter(Boolean).slice(0, 15);
}

export function mergeSiteBuild(
  content: SiteContent,
  design: ReferenceDesign,
  domainUrl: string,
  referenceUrl: string,
) {
  const contentImages = Array.isArray(content.contentImages)
    ? content.contentImages.filter(Boolean).slice(0, 12)
    : [];
  return {
    ...content,
    ...design,
    // Keep customer's site photos for redesign media; do not wipe them.
    contentImages,
    heroImage: contentImages[0] || content.heroImage || "",
    logoImage: content.logoImage || "",
    domainUrl,
    referenceUrl,
  };
}
