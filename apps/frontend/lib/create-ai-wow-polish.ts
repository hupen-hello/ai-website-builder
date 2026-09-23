/**
 * Premium visual rails — elevate flat Flash HTML without a second LLM pass.
 * Never hide sections with opacity:0.
 */

const WOW_MARK = 'data-create-ai-wow-polish="1"';

export function hasCreateAiWowPolish(html: string): boolean {
  return /data-create-ai-wow-polish=["']1["']/i.test(html || "");
}

export function stripCreateAiWowPolish(html: string): string {
  if (!html) return html;
  let out = html;
  out = out.replace(
    /<style\b[^>]*data-create-ai-wow-polish=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  out = out.replace(
    /<script\b[^>]*data-create-ai-wow-polish=["']1["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(/\s*data-cai-reveal=["'][^"']*["']/gi, "");
  out = out.replace(/\s*class=["']([^"']*)\bis-in\b([^"']*)["']/gi, (_m, a, b) => {
    const next = `${a}${b}`.replace(/\s+/g, " ").trim();
    return next ? ` class="${next}"` : "";
  });
  return out;
}

/** User asked for premium / wow / modern feel without naming one section. */
export function wantsCreateAiWowPolish(message: string): boolean {
  const m = message || "";
  return /\b(wow|premium\s*feel|modern\s*(bana|kro|karo|look|feel)|high[\s-]?end|pro\s*look|luxury\s*feel|animation|micro[\s-]?interact|hover\s*effect|smooth\s*scroll|polish\s*(karo|kro)|aur\s*(acha|achha|better|premium)|site\s*(ko\s*)?(wow|premium|modern))\b/i.test(
    m,
  );
}

/**
 * Instant premium finish on cards/CTAs/type — keeps Flash fast, looks less flat.
 */
export function injectCreateAiWowPolish(html: string): string {
  if (!html) return html;
  let out = stripCreateAiWowPolish(html);

  const css = `<style ${WOW_MARK}>
html { scroll-behavior: smooth; }
body {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { max-width: 100%; height: auto; border-radius: inherit; }
section {
  position: relative;
}
/* Don't force max-width on every child — breaks full-bleed heroes */
section > .container,
section > .wrap,
section > .inner {
  max-width: 1120px;
  margin-left: auto;
  margin-right: auto;
}
/* Cards / panels — lift flat boxes */
section [class*="card"],
section [class*="Card"],
section article,
section .service,
section .testimonial,
#services > div > div,
#testimonials > div > div,
#gallery > div > div {
  border-radius: 1.25rem !important;
  box-shadow: 0 10px 30px rgba(15,23,42,.08), 0 1px 0 rgba(15,23,42,.04) !important;
  transition: transform .22s ease, box-shadow .22s ease !important;
  overflow: hidden;
}
section [class*="card"]:hover,
section [class*="Card"]:hover,
section article:hover,
#services > div > div:hover,
#testimonials > div > div:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(15,23,42,.14) !important;
}
/* CTAs */
a[href][style*="border-radius"],
a.btn, button.btn,
a[data-create-ai-cta],
header a[href="#contact"],
header a[href*="book" i] {
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease !important;
}
a[href][style*="border-radius"]:hover,
a.btn:hover, button.btn:hover,
a[data-create-ai-cta]:hover {
  transform: translateY(-2px);
  filter: brightness(1.03);
}
/* Type contrast safety */
h1, h2, h3 {
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: inherit;
}
p, li {
  line-height: 1.65;
}
/* Gallery / grids — prevent squashed columns */
#gallery, #services, #testimonials {
  display: block;
  width: 100%;
}
#gallery p, #gallery h2, #services h2, #testimonials h2 {
  writing-mode: horizontal-tb !important;
  max-width: 100% !important;
  white-space: normal !important;
  transform: none !important;
}
/* Soft section breathing — only if AI left zero padding */
section[id]:not([style*="padding"]) {
  padding-top: clamp(2.5rem, 6vw, 5rem);
  padding-bottom: clamp(2.5rem, 6vw, 5rem);
  padding-left: clamp(1rem, 4vw, 1.5rem);
  padding-right: clamp(1rem, 4vw, 1.5rem);
  box-sizing: border-box;
}
footer {
  padding: 1.5rem clamp(1rem, 4vw, 1.5rem);
}
</style>`;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${css}\n</head>`);
  } else {
    out = css + out;
  }
  return out;
}
