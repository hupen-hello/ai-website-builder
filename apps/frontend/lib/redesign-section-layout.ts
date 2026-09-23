/** Remove AI duplicate WhatsApp / Call / back-to-top — app injects RedesignFloatingChrome. */
function stripAiFloatingWidgets(html: string) {
  let out = html;
  out = out.replace(/<div\b[^>]*class=["'][^"']*\bfixed\b[^"']*\bbottom-[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, (block) =>
    /wa\.me|whatsapp|tel:|back.?to.?top|scroll.?top|arrow-up|phone/i.test(block) ? "" : block,
  );
  out = out.replace(
    /<(?:a|button)\b[^>]*(?:class=["'][^"']*\bfixed\b[^"']*(?:bottom-|right-|left-)|href=["'][^"']*(?:wa\.me|whatsapp|tel:))[^>]*>[\s\S]*?<\/(?:a|button)>/gi,
    (block) =>
      /\bfixed\b/.test(block) && /(?:bottom-|wa\.me|whatsapp|tel:|back.?to.?top|scroll.?top|arrow)/i.test(block)
        ? ""
        : block,
  );
  return out;
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function isHeaderSectionHtml(html: string, label: string) {
  return /<header\b/i.test(html) || /header|navbar|topbar|site-header/i.test(label);
}

function headerBrandSlice(html: string) {
  const stop = html.search(/data-hero-slider|class="[^"]*hero-slide|<section\b/i);
  if (stop > 0) return html.slice(0, stop);
  const close = html.search(/<\/header>/i);
  return close > 0 ? html.slice(0, close + 9) : html;
}

export function applyHeaderLogoPolicy(
  html: string,
  opts?: { logoImage?: string; brandName?: string },
) {
  let out = (html || "").trim();
  if (!out || !/<header\b/i.test(out)) return out;

  const logo = (opts?.logoImage || "").trim();
  const brand = (opts?.brandName || "").trim();
  const keepTextLogo = /\bdata-redesign-text-logo=["']true["']/i.test(out);
  const head = headerBrandSlice(out);
  const tail = out.slice(head.length);

  if (logo) {
    const headWithCollage = replaceLogoCollage(
      head,
      logo,
      brand,
      "h-9 lg:h-11 w-auto max-w-[220px] object-contain max-w-full",
    );
    const brandLink = headWithCollage.match(/<a\b[^>]*>\s*<img\b[^>]*>/i);
    if (brandLink) {
      let replaced = false;
      const fixedHead = headWithCollage.replace(/(<a\b[^>]*>\s*)<img\b[^>]*>/gi, (match, open) => {
        if (replaced) return match;
        replaced = true;
        return `${open}<img src="${escapeAttr(logo)}" alt="${escapeAttr(brand || "Logo")}" class="h-9 lg:h-11 w-auto max-w-[220px] object-contain max-w-full" />`;
      });
      out = fixedHead + tail;
    } else {
      let replaced = false;
      const fixedHead = headWithCollage.replace(/<img\b[^>]*>/gi, (img) => {
        if (replaced) return img;
        if (/data-hero-slider|hero-slide|data-hero-slide/i.test(img)) return img;
        replaced = true;
        return `<img src="${escapeAttr(logo)}" alt="${escapeAttr(brand || "Logo")}" class="h-9 lg:h-11 w-auto max-w-[220px] object-contain max-w-full" />`;
      });
      out = (replaced ? fixedHead : headWithCollage) + tail;
    }

    if (!keepTextLogo) {
      out = out.replace(/(<header[\s\S]*?<\/header>)/i, (header) =>
        header
          .replace(
            /(<a\b[^>]*>\s*<img\b[^>]*>)([\s\S]*?)(<\/a>)/gi,
            (match, open, middle, close) => {
              if (!/<(?:span|strong|h1|h2|h3|div|p|em|small)\b/i.test(middle)) return match;
              if (middle.length > 500) return match;
              return `${open}${close}`;
            },
          )
          .replace(
            /(<img\b[^>]*class="[^"]*object-contain[^"]*"[^>]*>)\s*(<(?:span|strong|div|h1|h2|h3|p)\b[^>]*>[\s\S]*?<\/(?:span|strong|div|h1|h2|h3|p)>)/gi,
            "$1",
          ),
      );
    }
    return out;
  }

  if (!brand) return out;

  out = out.replace(/(<header[\s\S]*?<\/header>)/i, (header) => {
    let done = false;
    return header.replace(/<img\b[^>]*>/gi, (img) => {
      if (done) return img;
      if (/data-hero-slider|hero-slide|data-hero-slide/i.test(img)) return img;
      done = true;
      return `<span class="text-lg font-bold tracking-tight text-neutral-900">${escapeAttr(brand)}</span>`;
    });
  });

  return out;
}

function countHeroSlides(html: string) {
  const roots = html.match(/<(?:div|section)[^>]*(?:class="[^"]*\bhero-slide\b[^"]*"|data-hero-slide)/gi) || [];
  return roots.length;
}

function countDistinctHeroSlides(html: string) {
  const blocks = [
    ...html.matchAll(
      /<(?:div|section)[^>]*(?:class="[^"]*\bhero-slide\b[^"]*"|data-hero-slide)[^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
    ),
  ];
  if (!blocks.length) return countHeroSlides(html);

  const keys = new Set<string>();
  for (const match of blocks) {
    const inner = match[1] || "";
    const img = inner.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1]?.trim() || "";
    const heading = inner
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 96);
    keys.add(img || heading || "empty");
  }
  return keys.size;
}

/** Client-logo walls (many tiny imgs) are not the brand mark — swap for one logo. */
function replaceLogoCollage(block: string, logo: string, brand: string, imgClass: string) {
  let replaced = false;
  return block.replace(/<(?:div|figure|a)\b([^>]*)>([\s\S]*?)<\/(?:div|figure|a)>/gi, (full, attrs, inner) => {
    if (replaced) return full;
    const imgCount = (inner.match(/<img\b/gi) || []).length;
    if (imgCount < 4) return full;
    const hint = `${attrs} ${inner.slice(0, 600)}`.toLowerCase();
    if (
      imgCount >= 8 ||
      /logo|clent|client|brand|partner|gallery|grid|flex-wrap|flex\s|grid-cols/.test(hint)
    ) {
      replaced = true;
      return `<a href="/" class="inline-block shrink-0"><img src="${escapeAttr(logo)}" alt="${escapeAttr(brand || "Logo")}" class="${imgClass}" /></a>`;
    }
    return full;
  });
}

/** Reference single banner → no fake slider dots/arrows/hidden slides.
 *  When referenceMotion.hasHeroSlider, never strip — repair hooks instead. */
function stripInventedHeroSlider(html: string, preserveRealSlider = false) {
  let out = html;
  const slides = countHeroSlides(out);
  const distinctSlides = countDistinctHeroSlides(out);
  const hasSlider = /data-hero-slider/i.test(out);

  // Keep controls when this is a real multi-slide hero OR reference requires a slider.
  if (preserveRealSlider) return out;
  if (slides >= 2 && distinctSlides >= 2 && hasSlider) return out;

  out = out
    .replace(/<button\b[^>]*\bdata-hero-dot\b[^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<button\b[^>]*\bdata-hero-(?:prev|next)\b[^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/\sdata-hero-slider(=["'][^"']*["'])?/gi, "")
    .replace(/\sdata-hero-slide(=["'][^"']*["'])?/gi, "")
    .replace(/\bhero-slide\b/g, "")
    .replace(/\bdata-hero-dot\b/g, "")
    .replace(/\bdata-hero-prev\b/g, "")
    .replace(/\bdata-hero-next\b/g, "");

  out = out.replace(
    /(<(?:div|section|article)[^>]*)\bhidden\b([^>]*>)/gi,
    (match, open, close) =>
      /hero|banner|slide/i.test(match) && !/md:hidden|lg:hidden|sm:hidden/i.test(match)
        ? `${open}${close}`
        : match,
  );

  return out;
}

/** Ensure hero has working data-hero-slider when reference (or markup) expects a carousel. */
export function ensureHeroSliderMarkup(
  html: string,
  opts?: { force?: boolean; images?: string[] },
) {
  const force = Boolean(opts?.force);
  const pool = (opts?.images || []).filter(Boolean);
  let out = html || "";
  if (!out) return out;

  const alreadyGood =
    /data-hero-slider/i.test(out) &&
    countDistinctHeroSlides(out) >= 2 &&
    countHeroSlides(out) >= 2 &&
    heroSlidesAreUsable(out);
  if (alreadyGood) return out;

  const wantsSlider =
    force ||
    /swiper|owl-carousel|slick|flexslider|carousel-item|data-bs-ride|nivo-slider/i.test(out);

  if (!wantsSlider) return out;

  let slideSrcs = [
    ...new Set(
      [...out.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
        .map((m) => m[1])
        .filter(
          (src) =>
            src &&
            !/logo|icon|svg|sprite|favicon|whatsapp|pixel|sol-cion|social|facebook|twitter|linkedin/i.test(
              src,
            ),
        ),
    ),
  ].slice(0, 5);

  if (slideSrcs.length < 2 && pool.length >= 2) {
    slideSrcs = pool.slice(0, 5);
  } else if (slideSrcs.length === 1 && pool.length) {
    slideSrcs = [slideSrcs[0], ...pool.filter((u) => u !== slideSrcs[0])].slice(0, 4);
  }
  if (slideSrcs.length < 2) return out;

  const slides = slideSrcs
    .map(
      (src, i) =>
        `<div class="hero-slide${i === 0 ? " active" : ""}" data-hero-slide="${i}"><img src="${escapeAttr(src)}" alt="Campus slide ${i + 1}" class="h-full min-h-[70vh] w-full object-cover object-top" /></div>`,
    )
    .join("");
  const dots = slideSrcs
    .map(
      (_, i) =>
        `<button type="button" data-hero-dot="${i}" aria-label="Go to slide ${i + 1}" class="h-2.5 w-2.5 rounded-full border border-white/40 ${i === 0 ? "bg-white" : "bg-white/40"}"></button>`,
    )
    .join("");
  const slider = `<div data-hero-slider class="relative min-h-[70vh] w-full overflow-hidden bg-stone-900">${slides}<div class="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-black/55 via-black/15 to-black/25"></div><div class="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">${dots}</div><button type="button" data-hero-prev aria-label="Previous slide" class="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-xl text-white backdrop-blur-sm">‹</button><button type="button" data-hero-next aria-label="Next slide" class="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-xl text-white backdrop-blur-sm">›</button></div>`;

  // Replace obvious carousel shells first.
  const replaced = out.replace(
    /<(div|section|article)\b[^>]*(?:class=["'][^"']*(?:swiper|owl-carousel|slick|carousel|slider|flexslider|nivo)[^"']*["']|data-bs-ride|data-hero-slider)[^>]*>[\s\S]*?<\/\1>/i,
    slider,
  );
  if (replaced !== out) return replaced;

  // Hero/banner sections: inject slider after opening tag (keep copy overlays if present).
  // Never treat logo-slider / partner strips as heroes.
  if (
    /hero|banner|topfold/i.test(out.slice(0, 200)) ||
    (/<header\b/i.test(out) && !/logo-slider|logo-strip|client/i.test(out.slice(0, 200)))
  ) {
    return out.replace(/(<(?:section|header|div)\b[^>]*>)/i, `$1${slider}`);
  }

  return `${slider}${out}`;
}

function isSmallAssetImage(src: string) {
  return /sol-cion|social|facebook|twitter|linkedin|instagram|youtube|whatsapp|f\.png|t\.png|\/icon[s]?\//i.test(
    src,
  );
}

function isLogoStripLabel(label: string) {
  return /logo[-_\s]?slider|logo[-_\s]?strip|client.?logo|partner|trusted by|brand.?logo|logo.?row|logo.?carousel/i.test(
    label || "",
  );
}

function heroSlidesAreUsable(html: string) {
  const srcs = [
    ...html.matchAll(/data-hero-slide[\s\S]{0,400}?<img\b[^>]*\bsrc=["']([^"']+)["']/gi),
  ].map((m) => m[1] || "");
  if (srcs.length < 2) return false;
  const usable = srcs.filter((src) => src && !isSmallAssetImage(src) && !/logo|sprite|favicon|svg/i.test(src));
  return usable.length >= 2;
}

function swapIconCardImages(html: string, contentImages: string[] = []) {
  const pool = contentImages.filter(Boolean);
  if (!pool.length) return html;
  let idx = 0;
  return html.replace(/<img\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>/gi, (full, _pre, src, _post) => {
    if (!isSmallAssetImage(src)) return full;
    if (!/article|card|portfolio|case|shadow|rounded|grid-cols|figure/i.test(full)) return full;
    const next = pool[idx % pool.length];
    idx += 1;
    return full.replace(src, next);
  });
}

/** Side-by-side person/achiever cards → photo on top (no landscape face crop). */
function normalizeHorizontalMediaCards(html: string) {
  return html.replace(
    /<(article|a|div)(\s[^>]*\bclass=(["'])([^"']*)\3[^>]*)>([\s\S]{0,2400}?)<\/\1>/gi,
    (full, tag, _open, _q, classes, inner) => {
      if (!/\bflex\b/.test(classes) || /\bflex-col\b/.test(classes)) return full;
      if (/fixed|sticky|absolute|header|nav|menu|ticker|logo-track|items-center\s+justify-between/i.test(classes)) {
        return full;
      }
      if ((inner.match(/<img\b/gi) || []).length !== 1) return full;
      if (!/<h[1-6]\b|<p\b|<span\b[^>]*>[^<]{3,}/i.test(inner)) return full;
      if (/object-contain|max-w-\[\s*220px\s*\]|h-8\b|h-9\b|h-10\b|h-11\b|h-12\b/i.test(inner)) return full;

      let nextClasses = classes
        .replace(/\bitems-center\b/g, "")
        .replace(/\bitems-stretch\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!/\bflex-col\b/.test(nextClasses)) nextClasses = `${nextClasses} flex-col`.trim();
      if (!/\boverflow-hidden\b/.test(nextClasses)) nextClasses = `${nextClasses} overflow-hidden`.trim();

      let nextInner = inner.replace(/<img\b([^>]*)>/i, (imgFull, imgAttrs) => {
        let cls = (imgAttrs.match(/\bclass=(["'])([^"']*)\1/i)?.[2] || "").replace(/\s+/g, " ").trim();
        cls = cls
          .replace(/\bh-(?:\[.*?\]|\d+)\b/g, "")
          .replace(/\bw-(?:\[.*?\]|\d+|full|auto|1\/\d+)\b/g, "")
          .replace(/\baspect-(?:\[.*?\]|video|square|auto)\b/g, "")
          .replace(/\brounded-(?:\[.*?\]|full|l-\w+|r-\w+|t-\w+|b-\w+)\b/g, "")
          .replace(/\bshrink-0\b/g, "")
          .replace(/\s+/g, " ")
          .trim();
        cls = `${cls} h-44 w-full object-cover object-top md:h-48`.trim();
        if (/\bclass=/i.test(imgAttrs)) {
          return `<img${imgAttrs.replace(/\bclass=(["'])([^"']*)\1/i, `class="${cls}"`)}>`;
        }
        return `<img class="${cls}"${imgAttrs}>`;
      });

      // Media wrappers that forced a short landscape strip.
      nextInner = nextInner.replace(
        /<(div)(\s[^>]*\bclass=(["'])([^"']*)\3[^>]*)>\s*(<img\b[^>]*>)\s*<\/div>/i,
        (_m, dTag, dOpen, dq, dCls, img) => {
          let wrap = dCls
            .replace(/\bw-(?:\[.*?\]|\d+|1\/\d+|full)\b/g, "")
            .replace(/\bh-(?:\[.*?\]|\d+)\b/g, "")
            .replace(/\bmax-w-\S+/g, "")
            .replace(/\bmin-w-\S+/g, "")
            .replace(/\bshrink-0\b/g, "")
            .replace(/\s+/g, " ")
            .trim();
          wrap = `${wrap} w-full shrink-0 overflow-hidden`.trim();
          return `<${dTag}${dOpen.replace(/\bclass=(["'])([^"']*)\1/i, `class="${wrap}"`)}>${img}</div>`;
        },
      );

      return `<${tag}${_open.replace(/\bclass=(["'])([^"']*)\1/i, `class="${nextClasses}"`)}>${nextInner}</${tag}>`;
    },
  );
}

/** Stop tiny icons stretching blurry; avoid chopping portraits/cards. */
function normalizeSectionImages(html: string) {
  return html.replace(/<img\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>/gi, (full, pre, src, post) => {
    const attrs = `${pre}${post}`;
    if (/object-contain|max-w-\[\s*220px\s*\]|data-redesign-text-logo/i.test(attrs)) return full;
    if (/logo|clent-logo|client-logo|brand-logo/i.test(src) && /object-contain|h-9|h-10|h-11/i.test(attrs)) {
      return full;
    }

    let cls = attrs.match(/\bclass=(["'])([^"']*)\1/i)?.[2] || "";
    cls = cls.replace(/\s+/g, " ").trim();

    if (isSmallAssetImage(src)) {
      cls = "mx-auto h-32 w-auto max-w-[220px] object-contain";
      return `<img src="${src}" class="${cls}" alt="" />`;
    }

    // Card / gallery thumbs — keep face/top in frame, taller crop.
    if (/article|figure|portfolio|case|card|grid-cols|shadow|rounded/i.test(`${full} ${attrs}`)) {
      cls = cls
        .replace(/\bh-16\b/g, "")
        .replace(/\bh-20\b/g, "")
        .replace(/\bh-24\b/g, "")
        .replace(/\bh-28\b/g, "")
        .replace(/\bh-32\b/g, "")
        .replace(/\bh-40\b/g, "")
        .replace(/\bh-48\b/g, "")
        .replace(/\baspect-video\b/g, "")
        .replace(/\baspect-\[[^\]]+\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!/\bw-full\b/.test(cls)) cls = `${cls} w-full`.trim();
      if (!/\bh-\[|\bh-\d+|aspect-/.test(cls)) cls = `${cls} h-44 md:h-52`.trim();
      if (!/\bobject-/.test(cls)) cls = `${cls} object-cover object-top`.trim();
      else if (/\bobject-cover\b/.test(cls) && !/\bobject-(top|left|right|bottom|center)\b/.test(cls)) {
        cls = `${cls} object-top`.trim();
      }
      const alt = attrs.match(/\balt=(["'])([^"']*)\1/i)?.[2] || "";
      if (/\bclass=/i.test(attrs)) {
        return full
          .replace(/\bclass=(["'])([^"']*)\1/i, `class="${cls}"`)
          .replace(/\balt=(["'])([^"']*)\1/i, `alt="${alt.replace(/"/g, "&quot;")}"`);
      }
      return `<img src="${src}" alt="${alt.replace(/"/g, "&quot;")}" class="${cls}" />`;
    }

    if (!/\bobject-(cover|contain)\b/.test(cls)) {
      cls = `${cls} w-full max-w-full h-auto object-cover object-center`.trim();
    }
    if (/\bclass=/i.test(attrs)) {
      return full.replace(/\bclass=(["'])([^"']*)\1/i, `class="${cls}"`);
    }
    return `<img src="${src}" class="${cls}"${attrs}>`;
  });
}

function applyFooterLogoPolicy(
  html: string,
  opts?: { logoImage?: string; brandName?: string },
) {
  if (!/<footer\b/i.test(html)) return html;
  const logo = (opts?.logoImage || "").trim();
  const brand = (opts?.brandName || "").trim();
  if (!logo) return html;

  let done = false;
  return html.replace(/(<footer[\s\S]*?<\/footer>)/i, (footer) => {
    let next = replaceLogoCollage(
      footer,
      logo,
      brand,
      "h-10 w-auto max-w-[200px] object-contain bg-white rounded p-1",
    );
    next = next.replace(/(<a\b[^>]*>\s*)<img\b[^>]*>/gi, (match, open) => {
      if (done) return match;
      done = true;
      return `${open}<img src="${escapeAttr(logo)}" alt="${escapeAttr(brand || "Logo")}" class="h-10 w-auto max-w-[200px] object-contain bg-white rounded p-1" />`;
    });
    if (!done) {
      next = next.replace(/<img\b[^>]*>/i, (img) => {
        done = true;
        return `<img src="${escapeAttr(logo)}" alt="${escapeAttr(brand || "Logo")}" class="h-10 w-auto max-w-[200px] object-contain bg-white rounded p-1" />`;
      });
    }
    return next;
  });
}

/** Header + footer brand: logo image first; text only when logo missing. */
export function applySiteLogoPolicy(
  html: string,
  opts?: { logoImage?: string; brandName?: string },
) {
  return applyFooterLogoPolicy(applyHeaderLogoPolicy(html, opts), opts);
}

/** Strip AI patterns that create huge white gaps between sections. */
export function normalizeSectionLayout(
  html: string,
  index: number,
  label: string,
  opts?: {
    contentImages?: string[];
    preserveHeroSlider?: boolean;
  },
) {
  let out = (html || "").trim();
  if (!out) return out;

  const isHero = index <= 1 || /hero|banner|topfold|top-fold|slider/i.test(label);
  const isHeader = /header|topbar|utility|nav/i.test(label);
  const isFooter = /footer/i.test(label);
  const isNewsChrome = /news|ticker|announcement|notice|topbar|top-bar|utility|marquee/i.test(label);

  if (isNewsChrome) {
    out = out
      .replace(/\babsolute\b/g, "relative")
      .replace(/\bfixed\b/g, "relative")
      .replace(/\b-z-\[\d+\]/g, "")
      .replace(/\bz-50\b/g, "z-10")
      .replace(/\b-mt-\d+\b/g, "mt-0")
      .replace(/\b-top-\d+\b/g, "top-0")
      .replace(/\banimate-pulse\b/g, "")
      .replace(/\banimate-bounce\b/g, "")
      .replace(/\banimate-ping\b/g, "")
      .replace(/\banimate-spin\b/g, "");
  }

  if (isHeader) {
    const headerHasHero = /data-hero-slider|hero-slide|data-hero-slide/i.test(out);
    out = out.replace(/<header\b([^>]*)>/i, (_m, attrs: string) => {
      if (headerHasHero) {
        const cleaned = attrs
          .replace(/\sstyle=(["'])[^"']*\1/gi, "")
          .replace(/\sdata-redesign-sticky\b/gi, "");
        return `<header${cleaned}>`;
      }
      if (/data-redesign-sticky/.test(attrs)) return `<header${attrs}>`;
      if (/style=/i.test(attrs)) {
        return `<header${attrs.replace(/style=(["'])/i, "style=$1position:sticky;top:0;z-index:100;")} data-redesign-sticky>`;
      }
      return `<header${attrs} data-redesign-sticky style="position:sticky;top:0;z-index:100">`;
    });
    if (headerHasHero) {
      out = out.replace(
        /<div\b([^>]*class=["'][^"']*\bsticky\b[^"']*["'][^>]*)>/i,
        (_m, attrs: string) =>
          /data-redesign-nav-sticky/.test(attrs) ? `<div${attrs}>` : `<div${attrs} data-redesign-nav-sticky>`,
      );
    }
    out = out.replace(/<nav\b([^>]*)>/gi, (_m, attrs: string) => {
      // Desktop nav: hidden on mobile, flex from md up. Never force-open on phones.
      if (/data-mobile-menu/i.test(attrs)) return `<nav${attrs}>`;
      if (/sticky|data-redesign-sticky/.test(attrs)) return `<nav${attrs}>`;
      let cleaned = String(attrs)
        .replace(/\binvisible\b/gi, "")
        .replace(/\bopacity-0\b/gi, "")
        .replace(/\bsr-only\b/gi, "");
      if (!/\bmd:flex\b/i.test(cleaned)) {
        cleaned = /\bclass=/i.test(cleaned)
          ? cleaned.replace(/class=(["'])([^"']*)\1/, 'class=$1hidden md:flex flex-wrap items-center gap-3 $2$1')
          : `${cleaned} class="hidden md:flex flex-wrap items-center gap-3"`;
      } else if (!/\bhidden\b/i.test(cleaned)) {
        cleaned = cleaned.replace(/class=(["'])([^"']*)\1/, 'class=$1hidden $2$1');
      }
      return `<nav${cleaned}>`;
    });
    out = out
      .replace(/@keyframes\s+fadeIn\s*\{[\s\S]*?\}/gi, "")
      .replace(/animation:\s*fadeIn[^;"']*;?/gi, "")
      .replace(/\.hero-slide\s*\{[^}]*\}/gi, "")
      .replace(/\.hero-slide\.active\s*\{[^}]*\}/gi, "");
    out = out.replace(/<nav\b([^>]*data-mobile-menu[^>]*)>/gi, (_m, attrs: string) => {
      let next = attrs
        .replace(/\bmd:flex\b/gi, "")
        .replace(/\bmd:block\b/gi, "")
        .replace(/\bmd:grid\b/gi, "");
      if (!/\bhidden\b/i.test(next)) {
        next = /\bclass=/i.test(next)
          ? next.replace(/class=(["'])([^"']*)\1/i, 'class=$1hidden $2$1')
          : `${next} class="hidden"`;
      }
      if (!/\bdata-open=/i.test(next)) next += ' data-open="false"';
      return `<nav${next}>`;
    });
  }

  if (!isHero) {
    out = out
      .replace(/\bmin-h-screen\b/g, "min-h-0")
      .replace(/\bh-screen\b/g, "h-auto")
      .replace(/\bmin-h-\[100vh\]/gi, "min-h-0")
      .replace(/\bmin-h-\[90vh\]/gi, "min-h-0")
      .replace(/\bmin-h-\[80vh\]/gi, "min-h-0")
      .replace(/\boverflow-y-auto\b/g, "overflow-visible")
      .replace(/\boverflow-y-scroll\b/g, "overflow-visible")
      .replace(/\bmax-h-screen\b/g, "max-h-none");
  }

  if (isHeader || isFooter) {
    out = out
      .replace(/\bpy-24\b/g, "py-4")
      .replace(/\bpy-20\b/g, "py-4")
      .replace(/\bpy-16\b/g, "py-3");
  }

  // Full-bleed school/reference layouts — avoid narrow boxed wrappers on outer section.
  if (!isHeader && !isFooter) {
    out = out.replace(
      /class="([^"]*)"/gi,
      (_m, classes: string) => {
        const next = classes
          .replace(/\bmy-24\b/g, "my-0")
          .replace(/\bmy-20\b/g, "my-0")
          .replace(/\bmy-16\b/g, "my-0")
          .replace(/\bfixed\b/g, "sticky");
        return `class="${next}"`;
      },
    );
  }

  out = out
    .replace(/Submitting your request\.{0,3}/gi, "")
    .replace(/Loading\.{0,3}/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    // AI sometimes emits broken <img ="lazy" …> instead of loading="lazy"
    .replace(/<img\s+=(["'])lazy\1/gi, '<img loading="lazy"')
    .replace(/<img\s+=lazy\b/gi, '<img loading="lazy"');

  out = stripAiFloatingWidgets(out);
  const preserveSlider = Boolean(opts?.preserveHeroSlider);
  const logoStrip = isLogoStripLabel(label || "");

  if (logoStrip) {
    // Partner logo rows must never become min-h-[70vh] hero carousels.
    out = stripInventedHeroSlider(out, false);
    out = out
      .replace(/\bmin-h-\[(?:60|70|80|90|100)vh\]/gi, "min-h-0")
      .replace(/\bmin-h-screen\b/gi, "min-h-0");
  } else {
    out = stripInventedHeroSlider(out, preserveSlider);
    if (preserveSlider && /hero|banner|topfold/i.test(label)) {
      out = ensureHeroSliderMarkup(out, {
        force: true,
        images: opts?.contentImages,
      });
    } else if (/swiper|owl-carousel|slick|carousel|flexslider|nivo-slider/i.test(out)) {
      out = ensureHeroSliderMarkup(out, { force: true, images: opts?.contentImages });
    }
  }
  out = swapIconCardImages(out, opts?.contentImages);
  out = normalizeHorizontalMediaCards(out);
  out = normalizeSectionImages(out);

  return out;
}

export const REDESIGN_SEAMLESS_LAYOUT_CSS = `
  html {
    overflow-x: clip !important;
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100% !important;
    max-height: none !important;
  }
  body {
    overflow-x: clip !important;
    overflow-y: visible !important;
    height: auto !important;
    min-height: 100% !important;
    max-height: none !important;
  }
  .redesign-template-scrollbars {
    padding-bottom: 0 !important;
    overflow: visible !important;
    max-height: none !important;
  }
  [data-export="page"] {
    overflow: visible !important;
  }
  [data-editable-section] {
    display: block;
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
    overflow: visible !important;
  }
  [data-editable-section-content],
  [data-redesign-section-anchor],
  [data-redesign-flat-site],
  .ai-redesign-section {
    display: block;
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
    max-width: 100%;
    overflow-x: visible !important;
    overflow-y: visible !important;
  }
  [data-redesign-flat-site] img:not([class*="object-contain"]) {
    image-rendering: auto;
  }
  /* Stacked gallery / article media */
  [data-redesign-flat-site] article:not([class*="flex"]) > img,
  [data-redesign-flat-site] figure > img,
  [data-redesign-flat-site] .ai-redesign-section article:not([class*="flex"]) > img,
  .ai-redesign-section figure > img {
    width: 100%;
    height: auto;
    min-height: 11rem;
    max-height: 22rem;
    object-fit: cover;
    object-position: top center;
  }
  /* Achiever / news cards saved as flex-row with landscape strip → force portrait top media */
  [data-redesign-flat-site] section .grid .flex:has(> img:first-child):not([class*="flex-col"]),
  [data-redesign-flat-site] section .grid .flex:has(> div:first-child > img):not([class*="flex-col"]),
  [data-redesign-flat-site] section .grid article.flex:has(> img:first-child):not([class*="flex-col"]),
  [data-redesign-flat-site] section .grid article.flex:has(> div:first-child > img):not([class*="flex-col"]) {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  [data-redesign-flat-site] section .grid .flex:has(> img:first-child) > img:first-child,
  [data-redesign-flat-site] section .grid article.flex:has(> img:first-child) > img:first-child {
    width: 100% !important;
    max-width: 100% !important;
    height: 11rem !important;
    min-height: 11rem !important;
    max-height: 14rem !important;
    flex: 0 0 auto !important;
    object-fit: cover !important;
    object-position: top center !important;
    border-radius: 0.75rem 0.75rem 0 0;
  }
  [data-redesign-flat-site] section .grid .flex > div:first-child:has(> img),
  [data-redesign-flat-site] section .grid article.flex > div:first-child:has(> img) {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    flex: 0 0 auto !important;
    height: 11rem !important;
    min-height: 11rem !important;
    overflow: hidden !important;
    border-radius: 0.75rem 0.75rem 0 0;
  }
  [data-redesign-flat-site] section .grid .flex > div:first-child:has(> img) img,
  [data-redesign-flat-site] section .grid article.flex > div:first-child:has(> img) img {
    width: 100% !important;
    height: 100% !important;
    min-height: 11rem !important;
    max-height: none !important;
    object-fit: cover !important;
    object-position: top center !important;
  }
  [data-redesign-flat-site] h1,
  [data-redesign-flat-site] h2,
  .ai-redesign-section h1,
  .ai-redesign-section h2 {
    overflow: visible !important;
    text-overflow: unset !important;
    white-space: normal !important;
  }
  header nav[data-redesign-main-nav],
  header nav:not([data-mobile-menu]) {
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.25rem;
  }
  /* Mobile: desktop links stay collapsed; open only via hamburger → data-mobile-menu */
  @media (max-width: 767px) {
    header nav[data-redesign-main-nav],
    header nav:not([data-mobile-menu]),
    header [data-redesign-desktop-only] {
      display: none !important;
    }
    header nav[data-mobile-menu]:not([data-open="true"]),
    [data-mobile-menu]:not([data-open="true"]) {
      display: none !important;
    }
    header nav[data-mobile-menu][data-open="true"],
    [data-mobile-menu][data-open="true"] {
      display: flex !important;
      flex-direction: column !important;
    }
    header details {
      display: none !important;
    }
  }
  @media (min-width: 768px) {
    header nav[data-redesign-main-nav],
    header nav:not([data-mobile-menu]) {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    header nav[data-redesign-main-nav] a,
    header nav:not([data-mobile-menu]) a {
      display: inline-flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  }
  [data-redesign-flat-site] .logo-track,
  [data-redesign-flat-site] .ticker-track {
    display: flex !important;
    width: max-content !important;
  }
  .ai-redesign-section:has(header),
  .ai-redesign-section:has(nav),
  [data-editable-section]:has(header),
  [data-editable-section]:has(nav) {
    overflow: visible !important;
  }
  [data-editable-section] + [data-editable-section] {
    margin-top: 0 !important;
  }
  [data-section-move-controls] {
    pointer-events: none;
  }
  html[data-redesign-view-mode] [data-section-move-controls] {
    display: none !important;
  }
  [data-redesign-float] {
    position: fixed !important;
  }
  .ai-redesign-section a.fixed[href*="wa.me"],
  .ai-redesign-section a.fixed[href*="whatsapp"],
  .ai-redesign-section a.fixed[href^="tel:"],
  .ai-redesign-section button.fixed[aria-label*="top" i],
  .ai-redesign-section div.fixed[class*="bottom-"]:has(a[href*="wa.me"]),
  .ai-redesign-section div.fixed[class*="bottom-"]:has(a[href^="tel:"]) {
    display: none !important;
  }
  header, header nav, header ul, [data-nav-dropdown] {
    overflow: visible !important;
  }
  [data-nav-dropdown] {
    position: relative !important;
  }
  [data-nav-dropdown-panel] {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    z-index: 120 !important;
  }
  [data-nav-dropdown-panel]::before {
    content: "";
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    height: 10px;
  }
  @media (min-width: 768px) {
    [data-nav-dropdown]:hover > [data-nav-dropdown-panel],
    header nav li.has-submenu:hover > ul,
    header nav li.group:hover > ul {
      display: block !important;
    }
  }
`;
