/**
 * Reference homepage clone → domain swap → redesign finishing.
 * Finishing = section polish, responsive, menu scroll, content, images — then show.
 */

import type {
  BuiltSiteSectionItem,
  BuiltSiteTheme,
} from "@/lib/built-site-theme";

const FETCH_MS = 14_000;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function absUrl(raw: string, base: string) {
  const value = (raw || "").trim();
  if (!value || value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("#")) {
    return value;
  }
  if (/^(mailto:|tel:|javascript:)/i.test(value)) return value;
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

function hostnameOf(url: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_MS),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`Could not fetch ${url} (${response.status})`);
  return response.text();
}

/** Prefer rendered DOM when static HTML is blocked (403) or a thin SPA shell. */
export async function fetchRenderedHtml(url: string): Promise<string> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 22000 });
    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const max = Math.min(
        Math.max(
          document.body?.scrollHeight || 0,
          document.documentElement?.scrollHeight || 0,
          2400,
        ),
        6000,
      );
      for (let y = 0; y < max; y += 1000) {
        window.scrollTo(0, y);
        await delay(60);
      }
      window.scrollTo(0, 0);
      await delay(200);
    });
    return await page.content();
  } finally {
    await browser.close().catch(() => undefined);
  }
}

/** Static fetch first; on 403/fail/thin shell → Playwright render. */
export async function fetchHtmlResilient(url: string): Promise<{
  html: string;
  mode: "static" | "rendered";
}> {
  try {
    const html = await fetchHtml(url);
    const textLen = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
    if (textLen >= 900) return { html, mode: "static" };
    const rendered = await fetchRenderedHtml(url);
    return { html: rendered, mode: "rendered" };
  } catch {
    const rendered = await fetchRenderedHtml(url);
    return { html: rendered, mode: "rendered" };
  }
}

function absolutizeAssetUrls(html: string, baseUrl: string) {
  let out = html;
  out = out.replace(
    /(<base\b[^>]*href=["'])([^"']+)(["'])/gi,
    (_m, a, href, c) => `${a}${absUrl(href, baseUrl)}${c}`,
  );
  out = out.replace(
    /(<(?:link|script|img|source|video|audio|iframe)\b[^>]*?\s(?:href|src)=["'])([^"']+)(["'])/gi,
    (_m, a, url, c) => `${a}${absUrl(url, baseUrl)}${c}`,
  );
  out = out.replace(
    /(<(?:link|source)\b[^>]*?\ssrcset=["'])([^"']+)(["'])/gi,
    (_m, a, srcset, c) => {
      const next = srcset
        .split(",")
        .map((part: string) => {
          const [u, ...rest] = part.trim().split(/\s+/);
          return [absUrl(u || "", baseUrl), ...rest].join(" ").trim();
        })
        .join(", ");
      return `${a}${next}${c}`;
    },
  );
  out = out.replace(
    /url\(\s*(['"]?)([^"')]+)\1\s*\)/gi,
    (_m, _q, url) => `url(${absUrl(url, baseUrl)})`,
  );
  return out;
}

function stripRuntimeNoise(html: string) {
  return (
    html
      // Drop trackers only — keep jQuery/Swiper/tabs scripts so sliders work
      .replace(
        /<script\b[^>]*(?:google-analytics|googletagmanager|gtag\/js|facebook\.net|fbevents|hotjar|clarity|pixel)\b[^>]*>[\s\S]*?<\/script>/gi,
        "",
      )
      .replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
        if (/\bsrc=/i.test(attrs)) return full;
        if (/gtag\(|fbq\(|analytics|hotjar|clarity|gtm\.start/i.test(body)) return "";
        return full;
      })
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
      .replace(/<meta[^>]+http-equiv=["']refresh["'][^>]*>/gi, "")
  );
}

function decodeBasicEntities(value: string) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function swapTextGlobal(html: string, from: string, to: string) {
  const src = (from || "").trim();
  const dest = (to || "").trim();
  if (!src || !dest || src.length < 2 || src.toLowerCase() === dest.toLowerCase()) {
    return html;
  }
  return html.replace(new RegExp(escapeRegExp(src), "gi"), dest);
}

/** Protect absolute URLs so brand leak-replace cannot destroy CSS/JS/image hosts. */
function withProtectedUrls(html: string, fn: (safe: string) => string) {
  const saved: string[] = [];
  const stash = (value: string) => {
    saved.push(value);
    return `%%LESTOWURL${saved.length - 1}%%`;
  };
  let safe = html.replace(/https?:\/\/[^\s"'<>)\\]+/gi, stash);
  safe = safe.replace(/url\(\s*(['"]?)(?!%%LESTOWURL)([^"')]+)\1\s*\)/gi, (full) => stash(full));
  let out = fn(safe);
  for (let i = saved.length - 1; i >= 0; i -= 1) {
    out = out.split(`%%LESTOWURL${i}%%`).join(saved[i]);
  }
  return out;
}

function isGenericSiteTitle(value: string) {
  return /^(home|index|welcome|untitled|website|site)$/i.test(value.trim());
}

function pickBody(html: string) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1];
  return body || html;
}

function rewriteCssUrls(css: string, cssBase: string) {
  return css.replace(
    /url\(\s*(['"]?)([^"')]+)\1\s*\)/gi,
    (_m, _q, url) => {
      const u = (url || "").trim();
      if (!u || u.startsWith("data:") || u.startsWith("#")) return `url(${u})`;
      return `url(${absUrl(u, cssBase)})`;
    },
  );
}

async function inlineStylesheets(html: string, pageBase: string) {
  const linkRe =
    /<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi;
  const links = html.match(linkRe) || [];
  let out = html;
  const inlined: string[] = [];
  let totalCss = 0;

  // Cap inlining — huge CSS blows sessionStorage and editor opens empty.
  for (const tag of links.slice(0, 8)) {
    if (totalCss > 350_000) break;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const absolute = absUrl(href, pageBase);
    try {
      const res = await fetch(absolute, {
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/css,*/*;q=0.1",
        },
      });
      if (!res.ok) continue;
      let css = await res.text();
      if (css.length > 220_000) css = css.slice(0, 220_000);
      css = rewriteCssUrls(css, absolute);
      totalCss += css.length;
      inlined.push(`<style data-lestow-inlined="${absolute}">${css}</style>`);
      out = out.replace(tag, `<!-- inlined: ${absolute} -->`);
    } catch {
      // Keep original absolute link as fallback (base href resolves it)
    }
  }

  if (inlined.length) {
    if (/<\/head>/i.test(out)) {
      out = out.replace(/<\/head>/i, `${inlined.join("\n")}</head>`);
    } else {
      out = `${inlined.join("\n")}${out}`;
    }
  }
  return out;
}

function bodyClassList(html: string) {
  return html.match(/<body\b[^>]*class=["']([^"']*)["']/i)?.[1]?.trim() || "";
}

function injectThemeVars(html: string, theme: BuiltSiteTheme) {
  const primary = theme.primaryColor || "#0f766e";
  const accent = theme.accentColor || "#c2410c";
  const bg = theme.backgroundColor || "#ffffff";
  const text = theme.textColor || "#101214";
  const css = [
    ":root{",
    `--built-primary:${primary};`,
    `--built-accent:${accent};`,
    `--built-bg:${bg};`,
    `--built-text:${text};`,
    `--navy:${primary};--navy2:${primary};`,
    `--red:${accent};--red2:${accent};`,
    `--gold:${accent};`,
    `--primary:${primary};--secondary:${accent};--brand:${primary};`,
    "}",
    "html,body{margin:0;padding:0;width:100%!important;max-width:100%!important;overflow-x:hidden;background:var(--built-bg);}",
    "img{max-width:100%;height:auto;}",
    ".container,.container-fluid,.wrap,.wrapper,.inner,.site-container,.page-wrapper,.main-wrap,.content-wrap,",
    ".header-inner,.nav-inner,.navbar-inner,.site-header .container,.main-header .container{",
    "max-width:100%!important;width:100%!important;margin-left:0!important;margin-right:0!important;",
    "}",
    "header,nav,.navbar,.main-header,.site-header,.top-header,.header-area,.header-main,.main-nav-wrap{",
    "width:100%!important;max-width:100%!important;",
    "}",
    /* Menu stay on the RIGHT of logo (not stuck mid-left) */
    ".header-main,.main-header,.site-header,.navbar,.header-inner,.nav-wrap,.menu-wrap{",
    "display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;flex-wrap:wrap!important;",
    "}",
    ".navbar-nav,ul.menu,ul.nav,.main-menu,.primary-menu,.header-menu,nav ul,",
    "[class*=main-menu],[class*=primary-menu],[class*=nav-menu]{",
    "display:flex!important;flex-wrap:wrap!important;align-items:center!important;",
    "margin-left:auto!important;margin-right:12px!important;justify-content:flex-end!important;gap:8px 18px!important;",
    "}",
    "a.btn, .btn, .button, .cta, [class*=btn-primary]{background:var(--built-accent)!important;border-color:var(--built-accent)!important;}",
    ".util-bar,.top-bar{background:var(--built-primary)!important;}",
    "footer,.site-footer{background:var(--built-primary)!important;}",
    "section, .section{min-height:0!important;}",
    ".spacer,.gap, .empty-space{display:none!important;height:0!important;}",
    /* Kill reference floating chat — NOT our #lestow-btt */
    "a[href*='whatsapp'],a[href*='wa.me'],[class*='whatsapp'],[id*='whatsapp'],",
    "[class*='wa-float'],[class*='float-btn'],[class*='floating-social'],",
    "[class*='scrollup'],[class*='back-to-top']:not(#lestow-btt){display:none!important;visibility:hidden!important;}",
    /* Always-visible back-to-top */
    "#lestow-btt{position:fixed!important;right:18px!important;bottom:18px!important;z-index:2147483646!important;",
    "width:46px!important;height:46px!important;border-radius:999px!important;border:0!important;",
    `background:${primary}!important;color:#fff!important;font-size:22px!important;line-height:46px!important;`,
    "text-align:center!important;cursor:pointer!important;box-shadow:0 4px 16px rgba(0,0,0,.28)!important;",
    "display:flex!important;align-items:center!important;justify-content:center!important;opacity:.92!important;}",
    "#lestow-btt:hover{opacity:1!important;}",
    /* Slider arrows we inject */
    ".lestow-arr{position:absolute!important;top:50%!important;transform:translateY(-50%)!important;z-index:30!important;",
    "width:48px!important;height:48px!important;border-radius:999px!important;border:0!important;",
    "background:rgba(0,0,0,.55)!important;color:#fff!important;font-size:30px!important;line-height:48px!important;",
    "cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;}",
    ".lestow-arr.prev{left:14px!important;}.lestow-arr.next{right:14px!important;}",
    ".hero,.banner,[class*=slider],[class*=carousel]{position:relative!important;}",
    /* Redesign finishing — section / responsive / images */
    "section,[class*=section],.elementor-section{scroll-margin-top:5.5rem;}",
    "img,video,iframe{max-width:100%!important;height:auto;}",
    "img[src]:not([width]){object-fit:cover;}",
    "@media (max-width:991px){",
    "html,body{overflow-x:hidden!important;}",
    ".navbar-nav,ul.menu,ul.nav,.main-menu,.primary-menu,.header-menu,",
    "[class*=main-menu],[class*=primary-menu],[class*=nav-menu]{",
    "flex-direction:column!important;align-items:stretch!important;width:100%!important;",
    "margin-left:0!important;gap:0!important;",
    "}",
    ".navbar-nav a,ul.menu a,.main-menu a,.primary-menu a{padding:10px 12px!important;display:block!important;}",
    ".header-main,.main-header,.site-header,.navbar,.header-inner{flex-wrap:wrap!important;}",
    "section,.elementor-section{padding-left:16px!important;padding-right:16px!important;}",
    ".lestow-arr{width:40px!important;height:40px!important;font-size:24px!important;}",
    "}",
  ].join("");
  const block = '<style id="lestow-clone-theme">' + css + "</style>";
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, block + "</head>");
  }
  return block + html;
}

/**
 * Redesign finishing pass after clone+swap:
 * section polish, responsive, menu hooks, content/image cleanup.
 */
export function polishClonedRedesign(html: string, theme: BuiltSiteTheme): string {
  const brand = theme.brandName || "Brand";
  let out = html || "";

  // Viewport (mobile)
  if (!/<meta[^>]+name=["']viewport["']/i.test(out)) {
    const viewport =
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />';
    out = /<\/head>/i.test(out)
      ? out.replace(/<\/head>/i, `${viewport}</head>`)
      : viewport + out;
  }

  // Prefer reference-sized menu labels already on theme.navItems
  const navLabels = (theme.navItems || theme.categories || [])
    .map((v) => decodeBasicEntities(String(v || "")).replace(/\s+/g, " ").trim().slice(0, 36))
    .filter((t) => t.length >= 2 && !/logo|login|erp|home$/i.test(t))
    .slice(0, 10);

  // Ensure header/nav anchors carry scroll hooks for every visible link
  if (navLabels.length >= 3) {
    let idx = 0;
    out = out.replace(
      /<(header|nav)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
      (full, tag, attrs, inner) => {
        const nextInner = String(inner).replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (aFull, aAttrs, aInner) => {
          const text = String(aInner)
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (text.length < 2 || text.length > 48) return aFull;
          if (/logo|login|sign|cart|search|whatsapp|facebook/i.test(text)) return aFull;
          if (/<img\b/i.test(aInner)) return aFull;
          const label = navLabels[idx] || text;
          idx = Math.min(idx + 1, navLabels.length);
          let nextAttrs = String(aAttrs)
            .replace(/\bhref=(["'])[^"']*\1/i, 'href="#"')
            .replace(/\sdata-lestow-nav=(["'])[^"']*\1/gi, "");
          if (!/\bhref=/i.test(nextAttrs)) nextAttrs += ' href="#"';
          nextAttrs += ` data-lestow-nav="${label.replace(/"/g, "")}"`;
          return `<a${nextAttrs}>${label}</a>`;
        });
        return `<${tag}${attrs}>${nextInner}</${tag}>`;
      },
    );
  }

  // Section anchors for polish scroll targets
  let sectionN = 0;
  out = out.replace(/<section\b([^>]*)>/gi, (full, attrs) => {
    sectionN += 1;
    if (/\bid=/i.test(attrs)) return full;
    return `<section${attrs} id="section-${sectionN}" data-section-id="section-${sectionN}" style="scroll-margin-top:5.5rem">`;
  });

  // Image finishing: alt + loading
  out = out.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    let next = String(attrs);
    if (!/\balt=/i.test(next)) next += ` alt="${brand.replace(/"/g, "")}"`;
    if (!/\bloading=/i.test(next)) next += ' loading="lazy"';
    if (!/\bdecoding=/i.test(next)) next += ' decoding="async"';
    return `<img${next}>`;
  });

  // Soft content polish: empty headings get domain copy
  const headline = decodeBasicEntities(theme.headline || brand).slice(0, 80);
  const tagline = decodeBasicEntities(
    theme.tagline || theme.headings?.[0] || theme.description || "",
  ).slice(0, 120);
  out = out.replace(/<(h1)\b([^>]*)>(\s*)<\/\1>/gi, `<$1$2>${headline}</$1>`);
  out = out.replace(/<(h2)\b([^>]*)>(\s*)<\/\1>/gi, (_m, tag, attrs) => {
    return `<${tag}${attrs}>${tagline || headline}</${tag}>`;
  });

  // Inject finishing CSS block (idempotent)
  const finishCss = [
    '<style id="lestow-redesign-finish">',
    "/* redesign finishing */",
    "*{box-sizing:border-box;}",
    "img{display:block;}",
    "header a[data-lestow-nav],nav a[data-lestow-nav]{cursor:pointer;}",
    "@media (max-width:767px){",
    "h1{font-size:clamp(1.6rem,6vw,2.4rem)!important;line-height:1.2!important;}",
    "h2{font-size:clamp(1.25rem,4.5vw,1.85rem)!important;}",
    "p{font-size:15px!important;line-height:1.65!important;}",
    "}",
    "</style>",
  ].join("");
  if (!/id=["']lestow-redesign-finish["']/i.test(out)) {
    out = /<\/head>/i.test(out)
      ? out.replace(/<\/head>/i, `${finishCss}</head>`)
      : finishCss + out;
  }

  return out;
}

function dummyCopy(theme: BuiltSiteTheme) {
  const brand = theme.brandName || "Our organization";
  const paras = (theme.paragraphs || [])
    .map(decodeBasicEntities)
    .filter((p) => (p || "").trim().length > 24);
  const headings = (theme.headings || [])
    .map(decodeBasicEntities)
    .filter((h) => (h || "").trim().length > 2);
  const features = (theme.features || []).map((f) => ({
    title: decodeBasicEntities(f.title),
    description: decodeBasicEntities(f.description),
  }));
  const pool = [
    decodeBasicEntities(theme.headline || ""),
    decodeBasicEntities(theme.tagline || ""),
    decodeBasicEntities(theme.description || ""),
    ...headings,
    ...paras,
    ...features.map((f) => f.title),
    ...features.map((f) => f.description),
  ]
    .map((v) => String(v || "").replace(/\s+/g, " ").trim())
    .filter(
      (v) =>
        v.length >= 3 &&
        !/search keywords|no matching page|jump to|type a page topic/i.test(v),
    );
  const fallbacks = [
    brand,
    `Welcome to ${brand}`,
    `${brand} is committed to quality, care, and lasting impact.`,
    "Explore our programmes, campus life, and how you can get involved.",
    "We support every learner with guidance, opportunity, and a welcoming community.",
    "Reach out to learn more about admissions, visits, and partnerships.",
    "Building brighter futures through education, values, and everyday excellence.",
  ];
  return pool.length ? pool : fallbacks;
}

function isStockOrDomainHost(host: string, domainHost: string) {
  if (!host) return false;
  if (domainHost && (host === domainHost || host.endsWith(`.${domainHost}`))) return true;
  return /pixabay|pexels|unsplash|images\.unsplash|cdn\.pixabay|images\.pexels/i.test(host);
}

function buildCloneLeakPhrases(
  theme: BuiltSiteTheme,
  referenceUrl: string,
  html: string,
): string[] {
  const brand = (theme.brandName || "Brand").trim();
  const refHost = hostnameOf(referenceUrl);
  const out: string[] = [];
  const add = (value: string) => {
    const t = String(value || "").replace(/\s+/g, " ").trim();
    if (t.length < 3) return;
    if (t.toLowerCase() === brand.toLowerCase()) return;
    out.push(t);
  };

  const titleFromHtml =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(/[|\-–—]/)[0]
      ?.trim() || "";
  const ogSite =
    html.match(
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
    )?.[1] ||
    "";
  const logoAlt =
    html.match(/<img\b[^>]*(?:logo|brand)[^>]*\balt=["']([^"']+)["']/i)?.[1] ||
    html.match(/<img\b[^>]*\balt=["']([^"']+)["'][^>]*(?:logo|brand)/i)?.[1] ||
    "";
  const h1Text =
    html
      .match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "";

  const names = [
    theme.referenceSiteName,
    titleFromHtml,
    ogSite,
    logoAlt,
    h1Text,
    refHost,
    refHost.split(".")[0] || "",
  ];
  for (const name of names) {
    const n = String(name || "").trim();
    if (!n || isGenericSiteTitle(n)) continue;
    add(n);
    const stripped = n
      .replace(
        /\b(public\s+school|school|academy|college|university|foundation|society|trust|welfare|association|organisation|organization|ngo|inc|ltd|llc|pvt\.?|private|limited|company|corp\.?|corporation)\b/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();
    add(stripped);
    const words = n.split(/\s+/).filter(Boolean);
    if (words.length >= 3) add(words.slice(0, 3).join(" "));
    if (words.length >= 2) add(words.slice(0, 2).join(" "));
  }
  if (refHost) {
    add(refHost);
    add(`www.${refHost}`);
    const slug = refHost.split(".")[0] || "";
    if (slug.length >= 3) {
      add(slug);
      const parts = slug.match(
        /^([a-z0-9]+?)(publicschool|public-school|school|academy|college|university|foundation|trust)$/i,
      );
      if (parts?.[1] && parts[1].length >= 4) {
        add(parts[1]);
        add(parts[2]);
      }
      // School-site abbreviation leaks (Jamdagni Public School → JPS)
      if (/jamdagni/i.test(slug)) {
        add("JPS");
        add("@JPS");
        add("Welcome to JPS");
        add("Campus Life @JPS");
        add("Campus Life @ JPS");
      }
    }
  }
  return [...new Set(out)].sort((a, b) => b.length - a.length);
}

function isImageAssetUrl(url: string) {
  const u = String(url || "").trim();
  if (!u || u.startsWith("data:") || u.startsWith("#")) return false;
  if (/\.(woff2?|ttf|otf|eot|css)(\?|#|$)/i.test(u)) return false;
  return (
    /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|#|$)/i.test(u) ||
    /\/(?:uploads?|media|images?|img|photos?|gallery|banner|slider)\//i.test(u) ||
    /(?:pixabay|pexels|unsplash|cloudinary|imgix)/i.test(u)
  );
}

function swapDomainContent(html: string, theme: BuiltSiteTheme, referenceUrl: string) {
  const brand = theme.brandName || "Brand";
  const refHost = hostnameOf(referenceUrl);
  const domainHost = hostnameOf(theme.domainUrl || "");
  let out = html;

  // --- NEVER keep reference brand / host text (never inside URLs — breaks CSS) ---
  const leaks = buildCloneLeakPhrases(theme, referenceUrl, html);
  out = withProtectedUrls(out, (safe) => {
    let next = safe;
    for (const leak of leaks) {
      next = swapTextGlobal(next, leak, brand);
    }
    return next;
  });

  const title = theme.headline || brand;
  out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escHtml(title)}</title>`);
  // Drop reference SEO meta / JSON-LD (brand copy already in body)
  out = out.replace(
    /<meta\b[^>]*(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+|description|application-name)["'][^>]*>/gi,
    "",
  );
  out = out.replace(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  const descMeta = escHtml(
    (theme.description || theme.tagline || `Welcome to ${brand}`)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180),
  );
  const cleanMeta = [
    `<meta name="description" content="${descMeta}">`,
    `<meta property="og:title" content="${escHtml(title)}">`,
    `<meta property="og:site_name" content="${escHtml(brand)}">`,
    `<meta property="og:description" content="${descMeta}">`,
  ].join("");
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${cleanMeta}</head>`);
  } else {
    out = cleanMeta + out;
  }

  // Contact: force domain phone/email; strip unknown contacts
  const email = (theme.contactEmail || "").trim();
  const phone = (theme.contactPhone || "").trim();
  out = out.replace(
    /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi,
    (found) => {
      if (/wix|sentry|example|placeholder|webpack/i.test(found)) return found;
      return email || `${brand.toLowerCase().replace(/\s+/g, "")}@example.com`;
    },
  );
  out = out.replace(/mailto:[^"'>\s]+/gi, email ? `mailto:${email}` : "mailto:#");
  out = out.replace(/tel:[^"'>\s]+/gi, phone ? `tel:${phone.replace(/\s+/g, "")}` : "tel:#");
  // Raw phone-looking strings → domain phone or hide
  if (phone) {
    out = out.replace(/(?:\+?\d[\d\s().-]{8,}\d)/g, phone);
  }

  const STOCK = [
    "https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  ];
  const gallery = [
    ...(theme.contentImages || []).filter(Boolean),
    theme.heroImage || "",
  ].filter((u) => {
    const host = hostnameOf(u);
    // Never keep reference-host URLs even if they leaked into theme
    if (refHost && host === refHost) return false;
    return Boolean(u);
  });
  const logo = (() => {
    const l = (theme.logoImage || "").trim();
    if (!l) return "";
    const host = hostnameOf(l);
    if (refHost && host === refHost) return "";
    return l;
  })();
  const pool = gallery.length ? gallery : STOCK;

  // ALL images → domain/stock only (including logos)
  {
    let i = 0;
    let logoDone = false;
    out = out.replace(/<img\b[^>]*>/gi, (tag) => {
      const isLogo =
        /logo|brand|navbar|site-logo/i.test(tag) || /class=["'][^"']*logo/i.test(tag);
      let next = "";
      if (isLogo && logo && !logoDone) {
        next = logo;
        logoDone = true;
      } else if (isLogo && !logo) {
        // No domain logo → stock (never reference logo file)
        next = STOCK[0];
      } else {
        next = pool[i % pool.length] || STOCK[i % STOCK.length];
        i += 1;
      }
      let nextTag = /\bsrc=/i.test(tag)
        ? tag.replace(/\bsrc=(["'])[^"']*\1/i, `src="${next}"`)
        : tag.replace(/<img\b/i, `<img src="${next}"`);
      nextTag = nextTag.replace(/\bsrcset=(["'])[^"']*\1/gi, "");
      if (!/\bonerror=/i.test(nextTag)) {
        const fallback = STOCK[(i + 1) % STOCK.length];
        nextTag = nextTag.replace(
          /<img\b/i,
          `<img onerror="this.onerror=null;this.src='${fallback}'"`,
        );
      }
      return nextTag;
    });
  }

  // background-image / url(...) — swap IMAGE assets only (keep fonts/CSS)
  {
    let bi = 0;
    out = out.replace(/url\(\s*(['"]?)([^"')]+)\1\s*\)/gi, (_m, _q, url) => {
      const u = String(url || "").trim();
      if (!u || u.startsWith("data:") || u.startsWith("#")) return `url(${u})`;
      const host = hostnameOf(u);
      if (isStockOrDomainHost(host, domainHost)) return `url(${u})`;
      if (!isImageAssetUrl(u)) return `url(${u})`;
      if ((refHost && host === refHost) || (host && host !== domainHost)) {
        const next = pool[bi % pool.length] || STOCK[bi % STOCK.length];
        bi += 1;
        return `url(${next})`;
      }
      return `url(${u})`;
    });
  }

  // Kill floating chat / WhatsApp / share widgets + broken back-to-top chrome from reference
  out = out.replace(/href=["']https?:\/\/(?:api\.)?whatsapp\.com\/[^"']+["']/gi, 'href="#"');
  out = out.replace(/href=["']https?:\/\/wa\.me\/[^"']+["']/gi, 'href="#"');
  out = out.replace(
    /<(?:div|a|button|aside)\b[^>]*(?:class|id)=["'][^"']*(?:whatsapp|wa-float|float-btn|floating|fixed-contact|back-?to-?top|scroll-?top|scrollup)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|a|button|aside)>/gi,
    "",
  );
  out = out.replace(/<a\b[^>]*(?:whatsapp|wa\.me)[^>]*>[\s\S]*?<\/a>/gi, "");
  out = out.replace(
    /<(?:a|button)\b[^>]*(?:back.?to.?top|scroll.?top|scrollup)[^>]*>[\s\S]*?<\/(?:a|button)>/gi,
    "",
  );
  // Canonical / icons / hidden fields must not point at reference
  if (domainHost) {
    out = out.replace(
      /<link\b[^>]*rel=["']canonical["'][^>]*>/gi,
      `<link rel="canonical" href="https://${domainHost}/" />`,
    );
  }
  out = out.replace(/<link\b[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/gi, (tag) => {
    if (logo) return tag.replace(/\bhref=(["'])[^"']*\1/i, `href="${logo}"`);
    return "";
  });
  // Neutralize reference PAGE links + social profiles of the reference brand
  if (refHost) {
    const refRe = new RegExp(
      `https?:\\/\\/(?:www\\.)?${refHost.replace(/\./g, "\\.")}[^"'\\s<>]*`,
      "gi",
    );
    out = out.replace(/<a\b([^>]*)\bhref=(["'])([^"']+)\2/gi, (full, attrs, q, href) => {
      if (!refRe.test(href)) return full;
      refRe.lastIndex = 0;
      return `<a${attrs}href=${q}#${q}`;
    });
    out = out.replace(
      /<(?:iframe|form)\b([^>]*)\b(?:src|action)=(["'])([^"']+)\2/gi,
      (full, attrs, q, href) => {
        if (!refRe.test(href)) return full;
        refRe.lastIndex = 0;
        const attr = /\bsrc=/i.test(full) ? "src" : "action";
        return full.replace(
          new RegExp(`\\b${attr}=(["'])[^"']*\\1`, "i"),
          `${attr}=${q}#${q}`,
        );
      },
    );
  }
  // Social / mailto that still carry reference slug (facebook.com/Jamdagni…)
  {
    const socialLeaks = buildCloneLeakPhrases(theme, referenceUrl, html).filter((l) => l.length >= 5);
    out = out.replace(/<a\b([^>]*)\bhref=(["'])([^"']+)\2/gi, (full, attrs, q, href) => {
      const low = String(href || "").toLowerCase();
      if (!/facebook|instagram|youtube|twitter|x\.com|linkedin|wa\.me/i.test(low)) return full;
      if (!socialLeaks.some((l) => low.includes(l.toLowerCase()))) return full;
      return `<a${attrs}href=${q}#${q}`;
    });
    out = out.replace(/\bvalue=(["'])(https?:\/\/[^"']+)\1/gi, (full, q, href) => {
      if (refHost && hostnameOf(href) === refHost) return `value=${q}#${q}`;
      return full;
    });
  }

  // Nav: keep EVERY menu item. Map domain labels onto first slots; keep rest (scrubbed).
  const navRaw = (theme.navItems || theme.categories || [])
    .map((v) => decodeBasicEntities(String(v || "")))
    .filter(Boolean);
  const navFallback = [
    "About Us",
    "Academics",
    "Admissions",
    "Facilities",
    "Gallery",
    "Faculty",
    "Contact",
    "Home",
  ];
  const navUse: string[] = [];
  for (const label of [...navRaw, ...navFallback]) {
    const clean = label.replace(/\s+/g, " ").trim().slice(0, 40);
    if (clean.length < 2) continue;
    if (/logo|login|erp|vedanta|whatsapp|facebook/i.test(clean)) continue;
    if (navUse.some((n) => n.toLowerCase() === clean.toLowerCase())) continue;
    navUse.push(clean);
  }
  const rewriteMenuBlock = (block: string) => {
    let idx = 0;
    return block.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length < 2 || text.length > 48) return full;
      if (/logo|login|sign|cart|search|cbse\.gov|notice|virtual tour/i.test(text)) return full;
      if (/erp|vedanta|apply online/i.test(text)) {
        const cta = (theme.ctaButtons || [])[0] || "Apply Now";
        return `<a${attrs} href="#">${cta}</a>`;
      }
      if (/<img\b/i.test(inner)) return full;
      const label = navUse[idx] || text;
      idx += 1;
      // Point in-page so clicks don't jump to broken domain paths via <base>
      let nextAttrs = String(attrs).replace(/\bhref=(["'])[^"']*\1/i, 'href="#"');
      if (!/\bhref=/i.test(nextAttrs)) nextAttrs += ' href="#"';
      nextAttrs += ` data-lestow-nav="${label.replace(/"/g, "")}"`;
      return `<a${nextAttrs}>${label}</a>`;
    });
  };
  out = out.replace(/<(nav|header)\b[\s\S]*?<\/\1>/gi, rewriteMenuBlock);
  out = out.replace(
    /<(?:div|ul)\b[^>]*(?:class|id)=["'][^"']*(?:nav|menu|navbar|main-menu|primary-menu)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|ul)>/gi,
    rewriteMenuBlock,
  );

  // Header brand text: force clean school name (no "… School Public School")
  out = out.replace(/<(header|div)\b([^>]*(?:logo|brand|site-title|navbar-brand)[^>]*)>([\s\S]*?)<\/\1>/gi, (full) => {
    let block = full;
    block = block.replace(
      new RegExp(`${escapeRegExp(brand)}\\s*(?:Public\\s+School|School)\\b`, "gi"),
      brand,
    );
    block = withProtectedUrls(block, (safe) =>
      safe.replace(
        />([^<]{0,80}Public\s+School[^<]{0,40})</gi,
        `>${brand}<`,
      ),
    );
    return block;
  });
  out = withProtectedUrls(out, (safe) =>
    safe
      .replace(
        new RegExp(`${escapeRegExp(brand)}\\s*(?:Public\\s+School)\\b`, "gi"),
        brand,
      )
      .replace(
        new RegExp(`${escapeRegExp(brand)}\\s+${escapeRegExp(brand)}`, "gi"),
        brand,
      ),
  );

  // Visible copy: scrub leaky / junk text; keep healthy domain/reference structure text
  const copies = dummyCopy(theme);
  let copyIdx = 0;
  const nextCopy = (minLen: number) => {
    for (let n = 0; n < copies.length; n += 1) {
      const c = copies[(copyIdx + n) % copies.length];
      if (c.length >= minLen) {
        copyIdx = (copyIdx + n + 1) % copies.length;
        return c;
      }
    }
    copyIdx = (copyIdx + 1) % copies.length;
    return copies[copyIdx] || brand;
  };
  const leakCheck = buildCloneLeakPhrases(theme, referenceUrl, html);
  const isJunkCopy = (text: string) =>
    /search keywords|no matching page|jump to|type a page topic|submitting your request/i.test(
      text,
    ) || leakCheck.some((l) => text.toLowerCase().includes(l.toLowerCase()));

  out = out.replace(/<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, inner) => {
    if (/<img\b/i.test(inner)) return full;
    const text = decodeBasicEntities(inner.replace(/<[^>]+>/g, " "));
    if (text.length < 2) return full;
    if (tag === "h1" || isJunkCopy(text)) {
      return `<${tag}${attrs}>${tag === "h1" ? brand : nextCopy(4)}</${tag}>`;
    }
    return full;
  });

  let pCount = 0;
  out = out.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const text = decodeBasicEntities(inner.replace(/<[^>]+>/g, " "));
    if (text.length < 20) return full;
    if (/copyright|©|all rights reserved/i.test(text)) {
      return `<p${attrs}>© ${new Date().getFullYear()} ${brand}. All rights reserved.</p>`;
    }
    if (!isJunkCopy(text)) return full;
    pCount += 1;
    if (pCount > 40) return full;
    return `<p${attrs}>${nextCopy(24)}</p>`;
  });

  // Buttons / CTAs
  const ctas = (theme.ctaButtons || []).map(decodeBasicEntities).filter(Boolean);
  const ctaPool = ctas.length ? ctas : ["Learn More", "Contact Us", "Apply Now", "Get Started"];
  let ctaIdx = 0;
  out = out.replace(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, inner) => {
    if (/<img\b/i.test(inner)) return full;
    if (!/btn|button|cta|wp-block-button/i.test(`${attrs} ${full}`) && tag !== "button") {
      return full;
    }
    const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 2 || text.length > 32) return full;
    if (/menu|toggle|close|search|cart/i.test(text)) return full;
    if (/erp|vedanta/i.test(text)) {
      return `<${tag}${attrs}>${ctaPool[0] || "Apply Now"}</${tag}>`;
    }
    const label = ctaPool[ctaIdx % ctaPool.length];
    ctaIdx += 1;
    return `<${tag}${attrs}>${label}</${tag}>`;
  });

  // Short leftover visible bits that still mention reference slogans / junk
  out = out.replace(
    /<(span|li|figcaption|td|label|strong|em)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag, attrs, inner) => {
      if (/<img\b|<a\b|<svg\b/i.test(inner)) return full;
      const text = decodeBasicEntities(inner.replace(/<[^>]+>/g, " "));
      if (text.length < 8 || text.length > 120) return full;
      if (!isJunkCopy(text)) return full;
      return `<${tag}${attrs}>${nextCopy(8)}</${tag}>`;
    },
  );

  // Final brand pass (URLs still protected)
  out = withProtectedUrls(out, (safe) => {
    let next = safe;
    for (const leak of buildCloneLeakPhrases(theme, referenceUrl, html)) {
      next = swapTextGlobal(next, leak, brand);
    }
    next = next.replace(
      new RegExp(`${escapeRegExp(brand)}\\s*(?:Public\\s+School)\\b`, "gi"),
      brand,
    );
    // Hard scrub common school abbreviations left in headings
    next = next.replace(/\bJPS\b/g, brand);
    next = next.replace(/@\s*JPS\b/gi, brand);
    next = next.replace(/Welcome\s+to\s+JPS/gi, `Welcome to ${brand}`);
    next = next.replace(/Campus\s+Life\s*@\s*JPS/gi, `Campus Life @ ${brand}`);
    return next;
  });

  // Decode leftover entities in text nodes that we may have injected
  out = out.replace(/&#0?39;/g, "'").replace(/&mdash;/g, "—").replace(/&nbsp;/g, " ");

  // Vedanta / ERP chrome anywhere
  out = out.replace(/>\s*VEDANTA\s+ERP\s+LOGIN\s*</gi, `>${(theme.ctaButtons || [])[0] || "Apply Now"}<`);
  out = out.replace(/>\s*ERP\s+LOGIN\s*</gi, `>${(theme.ctaButtons || [])[0] || "Apply Now"}<`);

  return out;
}

function escHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Original Tailwind bands so the page is not a 1:1 copy of the reference. */
function buildOriginalLestowBands(theme: BuiltSiteTheme): string[] {
  const brand = escHtml(theme.brandName || "Our organization");
  const desc = escHtml(
    (theme.description || theme.paragraphs?.[0] || "Serving our community with care and excellence.")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220),
  );
  const primary = escHtml(theme.primaryColor || "#0f766e");
  const accent = escHtml(theme.accentColor || "#c2410c");
  const phone = escHtml(theme.contactPhone || "");
  const email = escHtml(theme.contactEmail || "");
  const img =
    (theme.contentImages || []).find((u) => u && !/logo/i.test(u)) ||
    theme.heroImage ||
    "";
  const features = (theme.features || []).slice(0, 3);

  const impact = [
    '<section id="lestow-impact" data-lestow-original="true" class="w-full bg-slate-50 py-16 md:py-20">',
    '<div class="mx-auto max-w-6xl px-6">',
    '<p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Impact</p>',
    `<h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Why families choose ${brand}</h2>`,
    `<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">${desc}</p>`,
    '<div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">',
    ...(features.length
      ? features.map(
          (f) =>
            `<article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 class="text-lg font-semibold text-slate-900">${escHtml(f.title)}</h3><p class="mt-2 text-sm leading-6 text-slate-600">${escHtml((f.description || "").slice(0, 160))}</p></article>`,
        )
      : [
          `<article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 class="text-lg font-semibold text-slate-900">Trusted care</h3><p class="mt-2 text-sm leading-6 text-slate-600">${desc}</p></article>`,
          `<article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 class="text-lg font-semibold text-slate-900">Clear communication</h3><p class="mt-2 text-sm leading-6 text-slate-600">Stay connected with updates, support, and a welcoming campus culture.</p></article>`,
          `<article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 class="text-lg font-semibold text-slate-900">Strong foundations</h3><p class="mt-2 text-sm leading-6 text-slate-600">Programs designed for growth, confidence, and real-world readiness.</p></article>`,
        ]),
    "</div></div></section>",
  ].join("");

  const how = [
    '<section id="lestow-how" data-lestow-original="true" class="w-full py-16 md:py-20" style="background:linear-gradient(180deg,#fff, #f8fafc)">',
    '<div class="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">',
    "<div>",
    '<p class="text-xs font-bold uppercase tracking-[0.2em]" style="color:' + primary + '">How we help</p>',
    '<h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">A simple path from enquiry to joining</h2>',
    '<ol class="mt-8 space-y-4 text-sm leading-6 text-slate-700">',
    "<li class=\"rounded-xl border border-slate-200 bg-white px-4 py-3\"><strong>1. Reach out</strong> — call or write to our office.</li>",
    "<li class=\"rounded-xl border border-slate-200 bg-white px-4 py-3\"><strong>2. Visit / learn</strong> — understand programmes and campus life.</li>",
    "<li class=\"rounded-xl border border-slate-200 bg-white px-4 py-3\"><strong>3. Enrol</strong> — complete admission with guided support.</li>",
    "</ol></div>",
    img
      ? `<div class="overflow-hidden rounded-3xl shadow-lg"><img src="${escHtml(img)}" alt="${brand}" class="h-full w-full object-cover" style="min-height:280px"/></div>`
      : `<div class="flex min-h-[280px] items-center justify-center rounded-3xl text-white" style="background:${primary}"><span class="text-xl font-semibold">${brand}</span></div>`,
    "</div></section>",
  ].join("");

  const cta = [
    '<section id="lestow-cta" data-lestow-original="true" class="w-full py-16 text-white" style="background:' + primary + '">',
    '<div class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">',
    "<div>",
    `<h2 class="text-3xl font-bold tracking-tight md:text-4xl">Ready to connect with ${brand}?</h2>`,
    '<p class="mt-3 max-w-xl text-white/85">Talk to our team — we are happy to guide the next step.</p>',
    "</div>",
    '<div class="flex flex-wrap gap-3">',
    phone
      ? `<a href="tel:${phone.replace(/\s+/g, "")}" class="inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold" style="color:${primary}">Call ${phone}</a>`
      : "",
    email
      ? `<a href="mailto:${email}" class="inline-flex rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white">Email us</a>`
      : `<a href="#footer" class="inline-flex rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white">Contact</a>`,
    "</div></div></section>",
  ].join("");

  return [impact, how, cta].map((html) =>
    html.replace(
      /style="background:([^"]+)"/g,
      (_m, color) =>
        color === primary || color === accent
          ? `style="background:${color}"`
          : `style="background:${color}"`,
    ),
  );
}

/**
 * Keep reference layout intact — no Impact / original Lestow bands.
 * Only strip leftover floating chrome that swapDomainContent may miss.
 */
export function differentiateClonedBody(bodyHtml: string, _theme: BuiltSiteTheme): string {
  return bodyHtml
    .replace(
      /<(?:div|a|button|aside)\b[^>]*(?:class|id)=["'][^"']*(?:whatsapp|wa-float|float-btn|floating-btn|back-?to-?top|scroll-?top|scrollup)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|a|button|aside)>/gi,
      "",
    )
    .replace(/<section\b[^>]*data-lestow-original=["']true["'][^>]*>[\s\S]*?<\/section>/gi, "");
}

function splitClonedBodyToSections(bodyHtml: string): BuiltSiteSectionItem[] {
  const items: BuiltSiteSectionItem[] = [];
  const push = (id: string, label: string, html: string) => {
    const trimmed = (html || "").trim();
    if (trimmed.length < 80) return;
    if (items.some((item) => item.html.slice(0, 120) === trimmed.slice(0, 120))) return;
    items.push({ id, label, html: trimmed });
  };

  const header = bodyHtml.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0];
  if (header) push("header", "Header", header);

  const sections = bodyHtml.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) || [];
  sections.forEach((block, index) => {
    const heading = block
      .match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1]
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 48);
    const id =
      block.match(/\bid=["']([^"']+)["']/i)?.[1]?.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() ||
      `section-${index + 1}`;
    push(id.slice(0, 40), heading || `Section ${index + 1}`, block);
  });

  const footer = bodyHtml.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0];
  if (footer) push("footer", "Footer", footer);

  // Agency sites: large semantic/classed blocks when few <section> tags.
  if (items.length < 4) {
    const main = bodyHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || bodyHtml;
    const chunks =
      main.match(
        /<(?:div|article)\b[^>]*(?:class|id)=["'][^"']*(?:hero|banner|about|service|feature|work|project|team|testimonial|contact|cta|portfolio|gallery|footer|section)[^"']*["'][^>]*>[\s\S]{300,14000}?<\/(?:div|article)>/gi,
      ) || [];
    chunks.slice(0, 10).forEach((block, index) => {
      const heading = block
        .match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)?.[1]
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48);
      push(`block-${index + 1}`, heading || `Section ${index + 1}`, block);
    });
  }

  if (items.length < 3) {
    const main = bodyHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || bodyHtml;
    const chunks = main.match(/<(?:div|article)\b[^>]{0,220}>[\s\S]{500,14000}?<\/(?:div|article)>/gi) || [];
    chunks.slice(0, 8).forEach((block, index) => {
      push(`chunk-${index + 1}`, `Section ${index + 1}`, block);
    });
  }

  // Last resort: whole body as one page (still better than AI stubs)
  if (items.length < 2) {
    push("page", "Homepage", `<div data-lestow-clone-page class="w-full min-h-screen">${bodyHtml}</div>`);
  }

  return items.slice(0, 15);
}

export async function cloneReferenceWithDomainSwap(params: {
  referenceUrl: string;
  theme: BuiltSiteTheme;
}): Promise<{
  items: BuiltSiteSectionItem[];
  mode: "clone-swap" | "clone-swap-rendered";
  error?: string;
  htmlBytes: number;
}> {
  const referenceUrl = params.referenceUrl.trim();
  const base =
    /^https?:\/\//i.test(referenceUrl) ? referenceUrl : `https://${referenceUrl}`;

  let mode: "clone-swap" | "clone-swap-rendered" = "clone-swap";
  let raw = "";
  try {
    const fetched = await fetchHtmlResilient(base);
    raw = fetched.html;
    mode = fetched.mode === "rendered" ? "clone-swap-rendered" : "clone-swap";
  } catch (error) {
    return {
      items: [],
      mode,
      htmlBytes: 0,
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }

  const bodyLen = pickBody(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  if (bodyLen < 400) {
    return {
      items: [],
      mode,
      htmlBytes: raw.length,
      error: "Reference HTML still too thin after browser render",
    };
  }

  let html = absolutizeAssetUrls(raw, base);
  html = stripRuntimeNoise(html);
  html = await inlineStylesheets(html, base);
  html = injectThemeVars(html, params.theme);
  html = swapDomainContent(html, params.theme, base);
  // Redesign finishing: sections + responsive + menu + content + images
  html = polishClonedRedesign(html, params.theme);

  const bodyClasses = bodyClassList(html);
  let body = pickBody(html);
  body = differentiateClonedBody(body, params.theme);

  const headInner =
    html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ||
    [
      ...(html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []),
      ...(html.match(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi) || []),
    ].join("\n");
  const domainBase = (() => {
    const d = (params.theme.domainUrl || "").trim();
    if (!d) return "";
    try {
      const withProtocol = /^https?:\/\//i.test(d) ? d : `https://${d}`;
      const u = new URL(withProtocol);
      return u.origin + "/";
    } catch {
      return "";
    }
  })();
  // Never use reference as <base> — that reloads reference assets.
  const baseHref = domainBase || "/";

  const primaryJs = (params.theme.primaryColor || "#5f2e18").replace(/[^#a-fA-F0-9]/g, "");
  const stockJs = [
    ...(params.theme.contentImages || []).slice(0, 8),
    "https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
  ].filter(Boolean);

  // Static chrome — survives even if later JS errors
  const chromeHtml = [
    '<button type="button" id="lestow-btt" aria-label="Back to top" title="Back to top">\u2191</button>',
    "<script>",
    "(function(){",
    "try{",
    "var STOCK=" + JSON.stringify(stockJs) + ";",
    "var PRIMARY='" + primaryJs + "';",
    "function clean(t){return (t||'').replace(/\\s+/g,' ').trim().toLowerCase();}",
    // Menu scroll — only header/nav links with data-lestow-nav or # href
    "document.addEventListener('click',function(e){",
    "var a=e.target&&e.target.closest&&e.target.closest('a[data-lestow-nav], header nav a, .main-menu a, .primary-menu a, .navbar-nav a, header .menu a');",
    "if(!a)return;",
    "var label=clean(a.getAttribute('data-lestow-nav')||a.textContent||'');",
    "if(!label||/logo|login|erp|whatsapp|facebook|apply online|cbse/i.test(label))return;",
    "var nodes=[].slice.call(document.querySelectorAll('section, footer, [id], h1, h2, h3, [class*=about], [class*=academ], [class*=facilit], [class*=campus], [class*=galler], [class*=contact], [class*=admission], [class*=welcome]'));",
    "var best=null,bestScore=0;",
    "nodes.forEach(function(el){",
    "var meta=clean((el.id||'')+' '+(typeof el.className==='string'?el.className:'')+' '+(el.textContent||'').slice(0,120));",
    "var s=0; label.split(/[^a-z0-9]+/).forEach(function(w){if(w.length>2&&meta.indexOf(w)>=0)s+=3;});",
    "if(/history|about/i.test(label)&&/history|about|welcome/i.test(meta))s+=6;",
    "if(/faculty|message|md/i.test(label)&&/faculty|message|principal|md/i.test(meta))s+=6;",
    "if(/academ|class|student|vacancy/i.test(label)&&/academ|class|student|vacancy|programme/i.test(meta))s+=6;",
    "if(/contact/i.test(label)&&/contact|footer|enquiry/i.test(meta))s+=8;",
    "if(/campus|facilit|galler/i.test(label)&&/campus|facilit|galler/i.test(meta))s+=6;",
    "if(s>bestScore){bestScore=s;best=el;}",
    "});",
    "if(bestScore>=5&&best){e.preventDefault();e.stopPropagation();try{best.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){best.scrollIntoView(true);}}",
    "},true);",
    // Back to top (static button)
    "var btt=document.getElementById('lestow-btt');",
    "if(btt){btt.addEventListener('click',function(){try{window.scrollTo({top:0,behavior:'smooth'});}catch(_){window.scrollTo(0,0);}});}",
    // Kill floaters
    "[].slice.call(document.querySelectorAll('a,div,button,aside,iframe')).forEach(function(el){",
    "var cls=((el.className||'')+' '+(el.id||'')+' '+(el.getAttribute&&el.getAttribute('href')||'')).toLowerCase();",
    "if(el.id==='lestow-btt')return;",
    "if(/whatsapp|wa\.me|wa-float|float-btn|floating|tawk|chat-widget/.test(cls)){el.remove();return;}",
    "try{var st=getComputedStyle(el);if(st.position==='fixed'&&(parseInt(st.bottom)||0)<160&&(parseInt(st.left)||0)<160&&el.id!=='lestow-btt'){el.remove();}}catch(_){}",
    "});",
    // Slider arrows + cycle
    "function wireSlider(root){",
    "if(!root||root.getAttribute('data-lestow-slider')==='1')return;",
    "var slides=[].slice.call(root.querySelectorAll('.slide,.swiper-slide,.carousel-item,.owl-item,.slider-item,[class*=slide]'));",
    "if(slides.length<2){slides=[].slice.call(root.children).filter(function(el){return el&&/DIV|ARTICLE|SECTION|LI|FIGURE|A/i.test(el.tagName)&&!(el.classList&&el.classList.contains('lestow-arr'));});}",
    "if(slides.length<2)return;",
    "root.setAttribute('data-lestow-slider','1');",
    "if(getComputedStyle(root).position==='static')root.style.position='relative';",
    "var i=0;function show(n){i=(n+slides.length)%slides.length;slides.forEach(function(s,idx){s.style.display=idx===i?'block':'none';s.classList.toggle('active',idx===i);});}",
    "show(0);",
    "function mk(dir){var b=document.createElement('button');b.type='button';b.className='lestow-arr '+(dir==='prev'?'prev':'next');b.textContent=dir==='prev'?'\u2039':'\u203A';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();show(dir==='prev'?i-1:i+1);});root.appendChild(b);}",
    "if(!root.querySelector('.lestow-arr.prev'))mk('prev');",
    "if(!root.querySelector('.lestow-arr.next'))mk('next');",
    // Restyle side About Us / Activities text into arrow affordance
    "[].slice.call(root.querySelectorAll('a,button,span,div')).forEach(function(el){",
    "var t=clean(el.textContent||'');",
    "if(t==='about us'||t==='activities'){el.textContent=t==='about us'?'\u2039':'\u203A';el.classList.add('lestow-arr');el.style.fontSize='32px';",
    "el.addEventListener('click',function(e){e.preventDefault();show(t==='about us'?i-1:i+1);});}",
    "});",
    "setInterval(function(){show(i+1);},6500);",
    "}",
    "document.querySelectorAll('.hero,.banner,.hero-slider,.banner-slider,.swiper,.owl-carousel,[class*=slider],[class*=carousel]').forEach(wireSlider);",
    // Tabs
    "document.querySelectorAll('[role=tablist],.tabs,.tab-nav,.nav-tabs,.class-tabs').forEach(function(group){",
    "var tabs=[].slice.call(group.querySelectorAll('[role=tab],.tab,.tab-btn,a,button')).filter(function(t){return (t.textContent||'').trim().length>1;});",
    "if(tabs.length<2)return;",
    "var root=group.closest('section,.tab-area,.tabs-wrap,div')||group.parentElement;",
    "tabs.forEach(function(tab,idx){tab.addEventListener('click',function(ev){ev.preventDefault();tabs.forEach(function(t){t.classList.remove('active','is-active');});tab.classList.add('active','is-active');",
    "var panels=[].slice.call((root||document).querySelectorAll('[role=tabpanel],.tab-panel,.tab-pane,.tab-content'));",
    "panels.forEach(function(p,i){var on=i===idx;p.style.display=on?'block':'none';p.classList.toggle('active',on);});});});",
    "});",
    // Fill missing images
    "[].slice.call(document.querySelectorAll('img')).forEach(function(img,idx){",
    "function fix(){img.src=STOCK[idx%STOCK.length]||STOCK[0];img.style.objectFit='cover';}",
    "if(!img.getAttribute('src')||img.getAttribute('src')==='#')fix();",
    "img.addEventListener('error',function(){this.onerror=null;fix();});",
    "});",
    "[].slice.call(document.querySelectorAll('figure,.campus-card,[class*=gallery] [class*=item],[class*=card-img],[class*=image-box],.tab-image,[class*=media]')).forEach(function(el,idx){",
    "if(el.querySelector('img'))return;",
    "var bg='';try{bg=getComputedStyle(el).backgroundImage;}catch(_){}",
    "if(bg&&bg!=='none'&&bg.indexOf('gradient')<0)return;",
    "el.style.backgroundImage='url('+JSON.stringify(STOCK[idx%STOCK.length]||STOCK[0])+')';",
    "el.style.backgroundSize='cover';el.style.backgroundPosition='center';",
    "if(!el.style.minHeight)el.style.minHeight='200px';",
    "});",
    "}catch(err){console&&console.warn&&console.warn('lestow-runtime',err);}",
    "})();",
    "<\/script>",
  ].join("");

  const lestowJs = chromeHtml;

  // Avoid multiline HTML template literals — Turbopack/SWC misparses </html>` in templates.
  const fullDoc = [
    "<!DOCTYPE html>",
    '<html lang="en" data-lestow-clone-doc="true">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<base href="' + baseHref + '" />',
    headInner,
    "</head>",
    '<body class="' +
      bodyClasses +
      '" data-lestow-clone="true" data-lestow-clone-doc="true">',
    body,
    lestowJs,
    "</body>",
    "</html>",
  ].join("\n");

  // Single full document — CSS stays intact in iframe; differentiation is inside body.
  const items: BuiltSiteSectionItem[] = [
    {
      id: "clone-page",
      label: "Homepage",
      html: fullDoc,
    },
  ];

  return {
    items,
    mode,
    htmlBytes: raw.length,
    error: body.length < 400 ? "Reference HTML still too thin after browser render" : undefined,
  };
}
