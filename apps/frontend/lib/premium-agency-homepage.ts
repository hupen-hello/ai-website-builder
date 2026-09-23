import type { BuiltSiteSectionItem, BuiltSiteTheme } from "@/lib/built-site-theme";

export type PremiumVariant =
  | "dark-tech"
  | "split-bold"
  | "midnight-grid"
  | "slate-aurora";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickVariant(theme: BuiltSiteTheme): PremiumVariant {
  const key = `${theme.referenceUrl || ""}|${theme.brandName || ""}|${theme.primaryColor || ""}|${theme.headerStyle || ""}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
  }
  const variants: PremiumVariant[] = [
    "dark-tech",
    "split-bold",
    "midnight-grid",
    "slate-aurora",
  ];
  return variants[hash % variants.length];
}

function brandVars(primary: string, accent: string) {
  return `style="--brand:${primary};--accent:${accent}"`;
}

/**
 * Tailwind-first redesign sections (export-ready for HTML / Next.js).
 * Variant rotates by reference+brand so builds don't look identical every time.
 */
export function buildPremiumAgencyHomepage(
  theme: BuiltSiteTheme,
  vision = "",
  imageUrls: string[] = [],
): BuiltSiteSectionItem[] {
  const variant = pickVariant(theme);
  const brand = esc(theme.brandName || "Your Brand");
  const headline = esc(
    theme.headline || theme.brandName || "Where Innovation Meets Imagination",
  );
  const tagline = esc(
    theme.tagline || theme.headings?.[0] || "WEB DESIGNING COMPANY IN INDIA",
  );
  const description = esc(
    theme.description ||
      theme.paragraphs?.[0] ||
      vision ||
      "We deliver smart, scalable custom software and enterprise-ready web applications.",
  );
  const primary = esc(theme.primaryColor || "#f39200");
  const accent = esc(theme.accentColor || "#00d2ff");
  const vars = brandVars(primary, accent);
  const navItems = (theme.navItems?.length
    ? theme.navItems
    : ["Services", "Solutions", "Industries", "Insights"]
  ).slice(0, 6);
  const headerNavItems = navItems.slice(0, 5);
  const nav = navItems
    .map(
      (item) =>
        `<a href="#" class="text-sm font-semibold tracking-wide text-white/90 transition hover:text-white">${esc(item)}</a>`,
    )
    .join("");
  const headerNav = headerNavItems
    .map(
      (item) =>
        `<a href="#" class="shrink-0 whitespace-nowrap text-sm font-semibold tracking-wide text-white/90 transition hover:text-white">${esc(item)}</a>`,
    )
    .join("");
  const headerNavLight = headerNavItems
    .map(
      (item) =>
        `<a href="#" class="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-700 hover:text-slate-950">${esc(item)}</a>`,
    )
    .join("");
  const cta1 = esc(theme.ctaButtons?.[0] || "Our Services");
  const cta2 = esc(theme.ctaButtons?.[1] || "Talk To Experts");
  const img0 = imageUrls[0] || theme.heroImage || "";
  const img1 = imageUrls[1] || imageUrls[0] || "";
  const img2 = imageUrls[2] || imageUrls[1] || imageUrls[0] || "";
  const logoUrl = (theme.logoImage || "").trim();
  const brandMark = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${brand}" class="h-8 w-auto max-w-[120px] shrink-0 object-contain" />`
    : `<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--brand)] text-sm font-black text-slate-950">${brand.slice(0, 1)}</span>`;
  const brandLockup = `<div class="flex min-w-0 max-w-[11rem] shrink-0 items-center gap-2 md:max-w-[16rem]">${brandMark}<strong class="truncate text-sm font-bold tracking-wide md:text-base">${brand}</strong></div>`;

  const features = (
    theme.features?.length
      ? theme.features
      : (theme.headings || []).slice(0, 6).map((title, index) => ({
          title,
          description:
            theme.paragraphs?.[index] ||
            theme.description ||
            "Premium digital solutions crafted for growth.",
        }))
  ).slice(0, 6);

  while (features.length < 3) {
    features.push({
      title: `Capability ${features.length + 1}`,
      description: theme.description || vision || "High-impact delivery for modern brands.",
    });
  }

  const featureCards = features
    .map(
      (feature, index) => `<article data-export="card" class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-white/20">
  <div class="mb-4 h-10 w-10 rounded-xl ${index % 2 === 0 ? "bg-[var(--brand)]" : "bg-[var(--accent)]"}"></div>
  <h3 class="text-lg font-semibold text-white">${esc(feature.title)}</h3>
  <p class="mt-2 text-sm leading-relaxed text-white/70">${esc(feature.description || "")}</p>
</article>`,
    )
    .join("");

  const clientRow = (
    theme.features?.map((f) => f.title) ||
    theme.headings ||
    ["Nova", "Pulse", "Orbit", "Vertex", "Flux", "Summit"]
  )
    .slice(0, 8)
    .map(
      (name) =>
        `<span class="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">${esc(String(name).slice(0, 16))}</span>`,
    )
    .join("");

  const heroImageBlock = img0
    ? `<div data-export="media" class="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
        <img src="${esc(img0)}" alt="" class="h-full min-h-[320px] w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent"></div>
      </div>`
    : `<div data-export="media" class="min-h-[320px] rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_30%_20%,rgba(0,210,255,.25),transparent_45%),linear-gradient(160deg,#020617,#0b1220)] shadow-2xl shadow-black/40"></div>`;

  const aboutImage = img1
    ? `<img src="${esc(img1)}" alt="" class="h-full min-h-[360px] w-full rounded-3xl object-cover" />`
    : `<div class="min-h-[360px] rounded-3xl bg-gradient-to-br from-sky-500 via-slate-900 to-[var(--brand)]"></div>`;

  const showcase = [img0, img1, img2]
    .map((src, index) => {
      const title = esc(features[index]?.title || `Project ${index + 1}`);
      if (src) {
        return `<figure data-export="card" class="overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
          <img src="${esc(src)}" alt="" class="h-52 w-full object-cover" />
          <figcaption class="px-5 py-4 text-sm font-semibold text-white">${title}</figcaption>
        </figure>`;
      }
      return `<figure data-export="card" class="flex min-h-[260px] items-end rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-sky-700 p-5">
        <figcaption class="text-sm font-semibold text-white">${title}</figcaption>
      </figure>`;
    })
    .join("");

  const shell = (id: string, label: string, html: string): BuiltSiteSectionItem => ({
    id,
    label,
    html: html
      .replace(
        /^<section\b/,
        `<section data-export="section" data-section-id="${id}" data-variant="${variant}"`,
      )
      .replace(
        /^<header\b/,
        `<header data-export="section" data-section-id="${id}" data-variant="${variant}"`,
      )
      .replace(
        /^<footer\b/,
        `<footer data-export="section" data-section-id="${id}" data-variant="${variant}"`,
      ),
  });

  const darkHeader = shell(
    "header",
    "Header",
    `<header ${vars} class="sticky top-0 z-40 border-b border-white/10 bg-slate-950 font-sans text-white">
  <div class="flex items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-6 py-2 text-xs text-white/80">
    <span class="truncate">${brand} worldwide</span>
    <a href="#" class="shrink-0 font-semibold text-[var(--accent)]">Contact</a>
  </div>
  <div class="mx-auto flex max-w-7xl flex-nowrap items-center gap-3 px-4 py-3 md:gap-5 md:px-6">
    ${brandLockup}
    <nav class="hidden min-w-0 flex-1 items-center justify-end gap-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">${headerNav}</nav>
    <a href="#" class="ml-auto shrink-0 rounded-full bg-gradient-to-r from-[var(--accent)] to-sky-400 px-4 py-2 text-xs font-extrabold text-slate-950 md:px-5 md:text-sm">Contact Us</a>
  </div>
</header>`,
  );

  const lightHeader = shell(
    "header",
    "Header",
    `<header ${vars} class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 font-sans text-slate-900 backdrop-blur">
  <div class="border-b border-slate-200 bg-slate-50 px-6 py-2 text-xs text-slate-600">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <span class="truncate">${brand} worldwide delivery</span>
      <a href="#" class="shrink-0 font-semibold text-[var(--brand)]">Talk to sales</a>
    </div>
  </div>
  <div class="mx-auto flex max-w-7xl flex-nowrap items-center gap-3 px-4 py-3 md:gap-5 md:px-6">
    ${brandLockup.replace("tracking-wide", "tracking-wide text-slate-950")}
    <nav class="hidden min-w-0 flex-1 items-center justify-end gap-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">${headerNavLight}</nav>
    <a href="#" class="ml-auto shrink-0 rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-extrabold text-white md:px-5 md:text-sm">Contact Us</a>
  </div>
</header>`,
  );

  if (variant === "split-bold") {
    return [
      darkHeader,
      shell(
        "hero",
        "Hero",
        `<section ${vars} class="overflow-hidden bg-slate-950 font-sans text-white">
  <div class="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
    <div>
      <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand)]">${tagline}</p>
      <h1 class="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight md:text-6xl">${headline}</h1>
      <p class="mt-5 max-w-xl text-base leading-relaxed text-white/80">${description}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold text-white">${cta1}</a>
        <a href="#" class="rounded-xl border border-[var(--brand)] px-6 py-3.5 text-sm font-extrabold text-white">${cta2}</a>
      </div>
    </div>
    ${heroImageBlock}
  </div>
</section>`,
      ),
      shell(
        "services",
        "Services",
        `<section ${vars} class="bg-slate-950 px-6 py-20 font-sans text-white">
  <div class="mx-auto max-w-7xl">
    <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand)]">Services</p>
    <h2 class="mt-3 font-serif text-3xl font-bold md:text-4xl">${esc(theme.sectionsTitle || "What we build")}</h2>
    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${featureCards}</div>
  </div>
</section>`,
      ),
      shell(
        "about",
        "About",
        `<section ${vars} class="bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-20 font-sans text-white">
  <div class="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
    <div data-export="media" class="overflow-hidden rounded-3xl border border-white/10">${aboutImage}</div>
    <div>
      <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">About</p>
      <h2 class="mt-3 font-serif text-3xl font-bold md:text-4xl">${esc(theme.headings?.[1] || `Why ${theme.brandName}`)}</h2>
      <p class="mt-4 leading-relaxed text-white/75">${esc(theme.paragraphs?.[1] || theme.description || vision || "")}</p>
    </div>
  </div>
</section>`,
      ),
      shell(
        "showcase",
        "Showcase",
        `<section ${vars} class="bg-slate-950 px-6 py-20 font-sans text-white">
  <div class="mx-auto max-w-7xl">
    <h2 class="font-serif text-3xl font-bold md:text-4xl">Selected work energy</h2>
    <div class="mt-10 grid gap-5 md:grid-cols-3">${showcase}</div>
  </div>
</section>`,
      ),
      shell(
        "cta",
        "CTA",
        `<section ${vars} class="bg-[radial-gradient(700px_260px_at_50%_0%,rgba(243,146,0,.28),transparent_60%)] bg-slate-900 px-6 py-20 text-center font-sans text-white">
  <h2 class="font-serif text-3xl font-bold md:text-4xl">Ready to grow with ${brand}?</h2>
  <p class="mx-auto mt-4 max-w-xl text-white/75">${esc(theme.tagline || "Transparent next steps. Premium delivery.")}</p>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta1}</a>
    <a href="#" class="rounded-xl border border-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta2}</a>
  </div>
</section>`,
      ),
      shell(
        "footer",
        "Footer",
        `<footer ${vars} class="border-t border-white/10 bg-slate-950 px-6 py-10 font-sans text-white/80">
  <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
    <div><strong class="text-white">${brand}</strong><p class="mt-2 max-w-md text-sm leading-relaxed">${description}</p></div>
    <nav class="flex flex-wrap gap-4">${nav}</nav>
  </div>
</footer>`,
      ),
    ];
  }

  if (variant === "midnight-grid") {
    return [
      darkHeader,
      shell(
        "hero",
        "Hero",
        `<section ${vars} class="relative overflow-hidden bg-[#050814] font-sans text-white">
  <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40"></div>
  <div class="relative mx-auto max-w-7xl px-6 pb-16 pt-14">
    <div class="max-w-4xl">
      <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand)]">${tagline}</p>
      <h1 class="mt-4 font-serif text-5xl font-bold leading-none md:text-6xl">${headline}</h1>
      <p class="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">${description}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta1}</a>
        <a href="#" class="rounded-xl border border-white/30 px-6 py-3.5 text-sm font-extrabold">${cta2}</a>
      </div>
    </div>
    <div class="mt-14 grid gap-4 md:grid-cols-3">${showcase}</div>
  </div>
</section>`,
      ),
      shell(
        "services",
        "Services",
        `<section ${vars} class="bg-[#070b16] px-6 py-20 font-sans text-white">
  <div class="mx-auto max-w-7xl">
    <h2 class="font-serif text-3xl font-bold md:text-4xl">${esc(theme.sectionsTitle || "Capabilities")}</h2>
    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${featureCards}</div>
  </div>
</section>`,
      ),
      shell(
        "about",
        "About",
        `<section ${vars} class="bg-slate-950 px-6 py-20 font-sans text-white">
  <div class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
    <div>
      <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">About</p>
      <h2 class="mt-3 font-serif text-3xl font-bold">${esc(theme.headings?.[1] || brand)}</h2>
      <p class="mt-4 leading-relaxed text-white/75">${esc(theme.paragraphs?.[1] || description)}</p>
    </div>
    <div data-export="media">${aboutImage}</div>
  </div>
</section>`,
      ),
      shell(
        "cta",
        "CTA",
        `<section ${vars} class="bg-slate-900 px-6 py-16 text-center font-sans text-white">
  <h2 class="font-serif text-3xl font-bold">Build the next release with ${brand}</h2>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta1}</a>
    <a href="#" class="rounded-xl border border-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta2}</a>
  </div>
</section>`,
      ),
      shell(
        "footer",
        "Footer",
        `<footer ${vars} class="border-t border-white/10 bg-[#020617] px-6 py-10 font-sans text-white/80">
  <div class="mx-auto flex max-w-7xl flex-wrap justify-between gap-6">
    <strong class="text-white">${brand}</strong>
    <nav class="flex flex-wrap gap-4">${nav}</nav>
  </div>
</footer>`,
      ),
    ];
  }

  if (variant === "slate-aurora") {
    return [
      lightHeader,
      shell(
        "hero",
        "Hero",
        `<section ${vars} class="overflow-hidden bg-slate-50 font-sans text-slate-900">
  <div class="mx-auto max-w-7xl px-6 py-16">
    <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">${tagline}</p>
        <h1 class="mt-4 font-serif text-4xl font-bold leading-tight md:text-6xl">${headline}</h1>
        <p class="mt-5 max-w-xl text-base leading-relaxed text-slate-600">${description}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold text-white">${cta1}</a>
          <a href="#" class="rounded-xl border border-slate-300 px-6 py-3.5 text-sm font-extrabold text-slate-900">${cta2}</a>
        </div>
      </div>
      ${heroImageBlock.replace("border-white/10", "border-slate-200").replace("shadow-black/40", "shadow-slate-300/50")}
    </div>
  </div>
</section>`,
      ),
      shell(
        "services",
        "Services",
        `<section ${vars} class="bg-white px-6 py-20 font-sans text-slate-900">
  <div class="mx-auto max-w-7xl">
    <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand)]">Services</p>
    <h2 class="mt-3 font-serif text-3xl font-bold md:text-4xl">${esc(theme.sectionsTitle || "Solutions that scale")}</h2>
    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${features
        .map(
          (feature, index) => `<article data-export="card" class="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
  <div class="mb-4 h-10 w-10 rounded-xl ${index % 2 === 0 ? "bg-[var(--brand)]" : "bg-[var(--accent)]"}"></div>
  <h3 class="text-lg font-semibold">${esc(feature.title)}</h3>
  <p class="mt-2 text-sm leading-relaxed text-slate-600">${esc(feature.description || "")}</p>
</article>`,
        )
        .join("")}
    </div>
  </div>
</section>`,
      ),
      shell(
        "about",
        "About",
        `<section ${vars} class="bg-slate-100 px-6 py-20 font-sans text-slate-900">
  <div class="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
    <div data-export="media">${aboutImage}</div>
    <div>
      <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">About</p>
      <h2 class="mt-3 font-serif text-3xl font-bold">${esc(theme.headings?.[1] || `About ${theme.brandName}`)}</h2>
      <p class="mt-4 leading-relaxed text-slate-600">${esc(theme.paragraphs?.[1] || description)}</p>
    </div>
  </div>
</section>`,
      ),
      shell(
        "cta",
        "CTA",
        `<section ${vars} class="bg-slate-950 px-6 py-20 text-center font-sans text-white">
  <h2 class="font-serif text-3xl font-bold md:text-4xl">Ship faster with ${brand}</h2>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta1}</a>
    <a href="#" class="rounded-xl border border-white/30 px-6 py-3.5 text-sm font-extrabold">${cta2}</a>
  </div>
</section>`,
      ),
      shell(
        "footer",
        "Footer",
        `<footer ${vars} class="border-t border-slate-200 bg-white px-6 py-10 font-sans text-slate-600">
  <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
    <strong class="text-slate-950">${brand}</strong>
    <nav class="flex flex-wrap gap-4 text-sm font-semibold">${navItems.map((item) => `<a href="#">${esc(item)}</a>`).join("")}</nav>
  </div>
</footer>`,
      ),
    ];
  }

  // default: dark-tech (Invoidea-like)
  return [
    darkHeader,
    shell(
      "hero",
      "Hero",
      `<section ${vars} class="relative overflow-hidden bg-slate-950 font-sans text-white">
  <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_85%_10%,rgba(0,210,255,.22),transparent_55%),radial-gradient(700px_380px_at_10%_90%,rgba(243,146,0,.12),transparent_50%)]"></div>
  <div class="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-2">
    <div>
      <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand)]">${tagline}</p>
      <h1 class="mt-4 font-serif text-4xl font-bold leading-tight md:text-6xl">${headline}</h1>
      <p class="mt-5 max-w-xl text-base leading-relaxed text-white/80">${description}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold text-white">${cta1}</a>
        <a href="#" class="rounded-xl border border-[var(--brand)] px-6 py-3.5 text-sm font-extrabold text-white">${cta2}</a>
      </div>
    </div>
    ${heroImageBlock}
  </div>
  <div class="relative z-10 border-t border-white/10 bg-black/50 px-6 py-5">
    <div class="mx-auto flex max-w-7xl flex-wrap justify-between gap-3">${clientRow}</div>
  </div>
</section>`,
    ),
    shell(
      "services",
      "Services",
      `<section ${vars} class="bg-[#070b16] px-6 py-20 font-sans text-white">
  <div class="mx-auto max-w-7xl">
    <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand)]">Services</p>
    <h2 class="mt-3 font-serif text-3xl font-bold md:text-4xl">${esc(theme.sectionsTitle || "Empowering businesses with digital innovation")}</h2>
    <p class="mt-4 max-w-2xl leading-relaxed text-white/70">${esc(theme.paragraphs?.[1] || theme.description || vision || "")}</p>
    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${featureCards}</div>
  </div>
</section>`,
    ),
    shell(
      "about",
      "About",
      `<section ${vars} class="bg-gradient-to-b from-slate-900 to-[#070b16] px-6 py-20 font-sans text-white">
  <div class="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
    <div data-export="media" class="overflow-hidden rounded-3xl border border-white/10">${aboutImage}</div>
    <div>
      <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">About ${brand}</p>
      <h2 class="mt-3 font-serif text-3xl font-bold md:text-4xl">${esc(theme.headings?.[1] || `Why teams choose ${theme.brandName}`)}</h2>
      <p class="mt-4 leading-relaxed text-white/75">${esc(theme.paragraphs?.[2] || theme.description || vision || "")}</p>
    </div>
  </div>
</section>`,
    ),
    shell(
      "showcase",
      "Showcase",
      `<section ${vars} class="bg-slate-950 px-6 py-20 font-sans text-white">
  <div class="mx-auto max-w-7xl">
    <h2 class="font-serif text-3xl font-bold md:text-4xl">Experiences that convert</h2>
    <div class="mt-10 grid gap-5 md:grid-cols-3">${showcase}</div>
  </div>
</section>`,
    ),
    shell(
      "cta",
      "CTA",
      `<section ${vars} class="bg-[radial-gradient(700px_260px_at_50%_0%,rgba(243,146,0,.28),transparent_60%)] bg-slate-900 px-6 py-20 text-center font-sans text-white">
  <h2 class="font-serif text-3xl font-bold md:text-4xl">Ready to grow with ${brand}?</h2>
  <p class="mx-auto mt-4 max-w-xl text-white/75">${esc(theme.tagline || "Get a free consultation with transparent next steps.")}</p>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <a href="#" class="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta1}</a>
    <a href="#" class="rounded-xl border border-[var(--brand)] px-6 py-3.5 text-sm font-extrabold">${cta2}</a>
  </div>
</section>`,
    ),
    shell(
      "footer",
      "Footer",
      `<footer ${vars} class="border-t border-white/10 bg-slate-950 px-6 py-10 font-sans text-white/80">
  <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
    <div><strong class="text-white">${brand}</strong><p class="mt-2 max-w-md text-sm leading-relaxed">${description}</p></div>
    <nav class="flex flex-wrap gap-4">${nav}</nav>
  </div>
</footer>`,
    ),
  ];
}

export function scoreHomepageQuality(items: BuiltSiteSectionItem[]): number {
  if (!items.length) return 0;
  const html = items.map((item) => item.html).join("\n");
  let score = 0;
  if (items.length >= 5) score += 25;
  if (items.length >= 7) score += 10;
  if (items.length >= 10) score += 8;
  if (items.length >= 12) score += 5;
  if (html.length > 4000) score += 15;
  if (html.length > 9000) score += 10;
  if ((html.match(/class=/gi) || []).length >= 20) score += 15;
  // Reward visual variety (school/reference-like), not one dark agency shell.
  const darkHits = (html.match(/bg-slate-950|bg-\[#070b16\]|bg-\[#050814\]/gi) || []).length;
  const lightHits = (html.match(/bg-white|bg-slate-50|bg-slate-100|bg-\[#fff|bg-amber-50|bg-emerald-50/gi) || []).length;
  if (lightHits >= 2) score += 12;
  if (darkHits >= 4 && lightHits === 0) score -= 25;
  if (/linear-gradient|radial-gradient|bg-gradient/i.test(html)) score += 8;
  if (/<img\b/i.test(html)) score += 10;
  if ((html.match(/<img\b/gi) || []).length >= 3) score += 8;
  if (/data-export=/i.test(html)) score += 10;
  if (/<h1\b/i.test(html) && /<nav\b/i.test(html)) score += 8;
  if (/admission|principal|campus|academic|achiev|notice|ticker|slider/i.test(html)) {
    score += 12;
  }
  const uniqueIds = new Set(items.map((item) => item.id));
  if (uniqueIds.size >= 6) score += 8;
  // Penalize placeholder chrome — not real TopFold section ids/labels.
  if (/logo\s*[1-9]|toggle navigation|lorem ipsum|>\s*TopFold\s*</i.test(html)) score -= 40;
  if (/<header\b/i.test(html) && /<h1\b/i.test(html) && (html.match(/<img\b/gi) || []).length >= 1) {
    score += 10;
  }
  if (html.length > 1200 && /hero|top-fold|topfold|banner/i.test(html.slice(0, 800))) score += 8;
  if (items.length <= 2) score -= 30;
  return score;
}

export function getPremiumVariant(theme: BuiltSiteTheme): PremiumVariant {
  return pickVariant(theme);
}
