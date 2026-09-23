/**
 * Deterministic QA rails for Create-with-AI HTML.
 * Fixes recurring model bugs WITHOUT endless prompt whack-a-mole:
 * - header white-on-white / low contrast
 * - missing footer
 * - empty card shells
 * - huge empty vertical gaps
 */

const QA_MARK = 'data-create-ai-qa-rails="1"';

function stripTags(s: string) {
  return (s || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Reject CSS / selector scraps that false-match brand attrs in <style>. */
function isSaneCreateAiBrand(name: string) {
  const s = (name || "").trim();
  if (s.length < 2 || s.length > 80) return false;
  if (/[{};]|::|--[a-z]|!important|^\*|[\[\]]/i.test(s)) return false;
  if (/\b(header|nav|span|div|first-child|not\(|max-width)\b/i.test(s)) {
    return false;
  }
  return true;
}

/**
 * Read brand from real HTML attrs only — never CSS like `[data-cai-brand-label]{`.
 */
function extractCreateAiBrandFromHtml(html: string) {
  if (!html) return "";
  const bodyOnly = html.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const candidates = [
    bodyOnly.match(
      /data-cai-brand-label\s*=\s*["'][^"']*["'][^>]*>([\s\S]*?)<\//i,
    )?.[1],
    bodyOnly.match(
      /<(?:span|a|strong|div)\b[^>]*\bdata-cai-brand-label\b[^>]*>([\s\S]*?)<\//i,
    )?.[1],
    bodyOnly.match(
      /alt\s*=\s*["']([^"']{2,80})["'][^>]*\bdata-create-ai-logo\b/i,
    )?.[1],
    bodyOnly.match(
      /\bdata-create-ai-logo\b[^>]*\balt\s*=\s*["']([^"']{2,80})["']/i,
    )?.[1],
    bodyOnly.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
  ];
  for (const raw of candidates) {
    const name = stripTags(raw || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
    if (isSaneCreateAiBrand(name)) return name;
  }
  return "";
}

/** Parse #rgb / #rrggbb / rgb() → luminance 0–1 */
function colorLuminance(raw: string): number | null {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return null;
  if (/^(white|#fff|#ffffff|transparent)$/i.test(s)) return 1;
  if (/^(black|#000|#000000)$/i.test(s)) return 0;
  let r = 0;
  let g = 0;
  let b = 0;
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else {
    const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (!m) return null;
    r = +m[1];
    g = +m[2];
    b = +m[3];
  }
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function styleProp(style: string, prop: string): string {
  const re = new RegExp(
    `(?:^|;|\\s)${prop}\\s*:\\s*([^;]+)`,
    "i",
  );
  return style.match(re)?.[1]?.trim() || "";
}

/**
 * Header: force readable ink on light bars (AI loves color:#fff on #fafafa).
 * Dark intentional headers keep light text.
 */
export function fixCreateAiHeaderContrast(html: string): string {
  if (!html || !/<header\b/i.test(html)) return html;
  return html.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (_m, attrs: string, inner: string) => {
      const style = attrs.match(/\bstyle=(["'])([\s\S]*?)\1/i)?.[2] || "";
      const bg =
        styleProp(style, "background-color") ||
        styleProp(style, "background") ||
        "";
      const fg = styleProp(style, "color") || "";
      const bgL = colorLuminance(bg.split(/\s/)[0] || "") ?? 0.96;
      const fgL = colorLuminance(fg) ?? 0.95;
      const bgIsLight = !bg || bgL > 0.72 || /transparent|none/i.test(bg);
      const fgIsLight = !fg || fgL > 0.72;
      const bgIsDark = bgL < 0.35;

      let nextAttrs = attrs;
      let nextInner = inner;

      if (bgIsLight && fgIsLight) {
        // Force light bar + dark ink
        if (/\bstyle=(["'])/i.test(nextAttrs)) {
          nextAttrs = nextAttrs.replace(
            /\bstyle=(["'])([\s\S]*?)\1/i,
            (_s, q: string, st: string) => {
              let s = st
                .replace(/color\s*:\s*[^;]+;?/gi, "")
                .replace(/background(?:-color)?\s*:\s*[^;]+;?/gi, "");
              s = `background:#ffffff;color:#0f172a;border-bottom:1px solid rgba(15,23,42,.08);${s}`;
              return `style=${q}${s}${q}`;
            },
          );
        } else {
          nextAttrs += ` style="background:#ffffff;color:#0f172a;border-bottom:1px solid rgba(15,23,42,.08)"`;
        }
        // Strip white/light ink from brand + nav links (keep CTA pills with own bg)
        nextInner = nextInner.replace(
          /<(a|span|div|p|nav|button)\b([^>]*)>/gi,
          (full, tag: string, a: string) => {
            if (/data-cai-menu-btn/i.test(a)) return full;
            const st = a.match(/\bstyle=(["'])([\s\S]*?)\1/i)?.[2] || "";
            const ownBg =
              styleProp(st, "background-color") || styleProp(st, "background");
            const ownBgL = colorLuminance(ownBg.split(/\s/)[0] || "");
            if (ownBg && ownBgL != null && ownBgL < 0.45) return full; // dark CTA
            if (!/color\s*:/i.test(st) && !/color\s*:/i.test(a)) {
              // class-only white text — add ink
              if (/\bstyle=(["'])/i.test(a)) {
                return `<${tag}${a.replace(
                  /\bstyle=(["'])([\s\S]*?)\1/i,
                  (_x, q: string, s: string) =>
                    `style=${q}${s.replace(/color\s*:\s*[^;]+;?/gi, "")}color:#0f172a;${q}`,
                )}>`;
              }
              return `<${tag}${a} style="color:#0f172a">`;
            }
            return `<${tag}${a.replace(
              /\bstyle=(["'])([\s\S]*?)\1/i,
              (_x, q: string, s: string) => {
                const col = styleProp(s, "color");
                const cL = colorLuminance(col);
                if (cL != null && cL > 0.7) {
                  return `style=${q}${s.replace(/color\s*:\s*[^;]+;?/gi, "")}color:#0f172a;${q}`;
                }
                return `style=${q}${s}${q}`;
              },
            )}>`;
          },
        );
      } else if (bgIsDark && fg && colorLuminance(fg)! < 0.4) {
        // Dark bar + dark text → light ink
        nextInner = nextInner.replace(
          /color\s*:\s*[^;]+/gi,
          "color:#f8fafc",
        );
      }

      if (!/data-create-ai-hdr=/i.test(nextAttrs)) {
        nextAttrs += ` data-create-ai-hdr="1"`;
      }
      return `<header${nextAttrs}>${nextInner}</header>`;
    },
  );
}

/** Always have exactly one real footer. */
export function ensureCreateAiFooter(
  html: string,
  brandName?: string,
  contact?: { email?: string; mobile?: string; address?: string },
): string {
  if (!html) return html;
  return polishCreateAiFooter(html, brandName, contact);
}

/**
 * Header CTA pills: force readable label ink (usually #fff on colored fill).
 * Stops dark-on-dark / light-on-light after generate + QA rails.
 */
export function ensureCreateAiHeaderCtaInk(html: string): string {
  if (!html || !/<header\b/i.test(html)) return html;
  return html.replace(
    /<header\b([^>]*)>([\s\S]*?)<\/header>/i,
    (block, hAttrs: string, inner: string) => {
      let touched = false;
      const nextInner = inner.replace(
        /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
        (full, tag: string, attrs: string, body: string) => {
          const text = stripTags(body).replace(/\s+/g, " ").trim();
          if (!text || text.length > 40) return full;
          if (/data-cai-brand|data-create-ai-brand|data-cai-menu/i.test(attrs)) {
            return full;
          }
          const st = attrs.match(/\bstyle=(["'])([\s\S]*?)\1/i)?.[2] || "";
          const looksCta =
            tag.toLowerCase() === "button" ||
            /btn|cta|button/i.test(attrs) ||
            (/padding/i.test(st) &&
              (/background/i.test(st) || /border-radius/i.test(st))) ||
            /book|get\s*started|schedule|repair|enquire|request|consult|talk|call|visit|reserve/i.test(
              text,
            );
          if (!looksCta) return full;
          const bg =
            styleProp(st, "background-color") || styleProp(st, "background");
          const bgL = colorLuminance((bg || "").split(/\s/)[0] || "");
          // Dark / mid fill → white label; light fill → dark label
          const ink =
            bgL == null || bgL < 0.62 ? "#ffffff" : "#0f172a";
          touched = true;
          let next = attrs.replace(/\s*data-cai-btn=(["'])[^"']*\1/gi, "");
          next = `${next} data-cai-btn="hdr-cta"`;
          if (/\bstyle\s*=/i.test(next)) {
            next = next.replace(
              /\bstyle\s*=\s*(["'])([^"']*)\1/i,
              (_s, q: string, style: string) => {
                const cleaned = style
                  .replace(/color\s*:\s*[^;]+;?/gi, "")
                  .trim()
                  .replace(/;+\s*$/g, "");
                const joined = cleaned
                  ? `${cleaned};color:${ink} !important`
                  : `color:${ink} !important`;
                return `style=${q}${joined}${q}`;
              },
            );
          } else {
            next += ` style="color:${ink} !important"`;
          }
          return `<${tag}${next}>${body}</${tag}>`;
        },
      );
      if (!touched) return block;
      return `<header${hAttrs}>${nextInner}</header>`;
    },
  );
}

/** Remove every footer (closed + unclosed) and our polish orphans — then inject one. */
function stripAllFootersAndOrphans(html: string): string {
  let out = html || "";
  // Closed footers (all)
  out = out.replace(/<footer\b[\s\S]*?<\/footer>/gi, "");
  // Unclosed <footer ...> through </body> / end
  out = out.replace(/<footer\b[^>]*>[\s\S]*?(?=<\/body>|$)/gi, "");
  // Orphan polish columns left on light background (duplicate EXPLORE / CONTACT)
  out = out.replace(
    /<(?:div|section)\b[^>]*>[\s\S]*?Thanks for visiting\. Reach out anytime[\s\S]*?(?:All rights reserved\.|Add email \/ phone in chat)[\s\S]*?<\/(?:div|section)>/gi,
    "",
  );
  out = out.replace(
    /<(?:div|section)\b[^>]*>[\s\S]*?>\s*EXPLORE\s*<[\s\S]*?>\s*CONTACT\s*<[\s\S]*?(?:Add email \/ phone in chat|All rights reserved\.)[\s\S]*?<\/(?:div|section)>/gi,
    "",
  );
  // Stray copyright lines immediately before </body>
  out = out.replace(
    /(?:<p[^>]*>\s*)?©\s*\d{4}[^<]{0,80}(?:All rights reserved\.?)?\s*(?:<\/p>)?\s*(?=<\/body>)/gi,
    "",
  );
  return out;
}

/**
 * User asked "footer acha/banao" / generate rails — exactly ONE multi-block footer.
 */
export function polishCreateAiFooter(
  html: string,
  brandName?: string,
  contact?: { email?: string; mobile?: string; address?: string },
): string {
  if (!html) return html;
  const fromArg = (brandName || "").trim();
  const brand =
    (isSaneCreateAiBrand(fromArg) ? fromArg.slice(0, 60) : "") ||
    extractCreateAiBrandFromHtml(html) ||
    "Brand";
  const year = new Date().getFullYear();
  const sectionLinks = (() => {
    const body =
      html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ||
      html.replace(/<style[\s\S]*?<\/style>/gi, " ");
    const specs: Array<{ id: string; label: string }> = [
      { id: "home", label: "Home" },
      { id: "about", label: "About" },
      { id: "services", label: "Services" },
      { id: "gallery", label: "Gallery" },
      { id: "testimonials", label: "Reviews" },
      { id: "pricing", label: "Pricing" },
      { id: "faq", label: "FAQ" },
      { id: "team", label: "Team" },
      { id: "contact", label: "Contact" },
    ];
    const out: Array<{ id: string; label: string }> = [];
    for (const s of specs) {
      const ids = s.id === "home" ? ["home", "hero"] : [s.id];
      const hit = ids.some((id) =>
        new RegExp(
          `<(?:section|div|main|article)\\b[^>]*(?:\\bid=["']${id}["']|data-create-ai-${id}=["']1["']|data-create-ai-contact=["']1["'])`,
          "i",
        ).test(body),
      );
      if (hit || s.id === "home") out.push(s);
    }
    // Home first, rest keep order
    const home = out.find((x) => x.id === "home");
    const rest = out.filter((x) => x.id !== "home");
    return home ? [home, ...rest] : [{ id: "home", label: "Home" }, ...rest];
  })();
  const quickLinksHtml = sectionLinks
    .map(
      (s) =>
        `<a href="#${escapeHtml(s.id)}" style="color:#FFEDD5;text-decoration:none">${escapeHtml(s.label)}</a>`,
    )
    .join("\n        ");
  const email =
    (contact?.email || "").trim() ||
    html.match(/mailto:([^"'?\s]+)/i)?.[1] ||
    html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    "";
  const phone =
    (contact?.mobile || "").trim() ||
    html.match(/tel:([^"'?\s]+)/i)?.[1] ||
    html.match(/\+?\d[\d\s\-()]{8,}\d/)?.[0] ||
    "";
  const address =
    (contact?.address || "").trim() ||
    stripTags(
      html.match(/(?:address|addr)[^<]{0,40}[:\s]([^<]{8,80})/i)?.[1] || "",
    ).slice(0, 80);

  const contactBits = [
    email &&
      `<a href="mailto:${escapeHtml(email)}" style="color:#e2e8f0;text-decoration:none">${escapeHtml(email)}</a>`,
    phone &&
      `<a href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}" style="color:#e2e8f0;text-decoration:none">${escapeHtml(phone)}</a>`,
    address && `<span>${escapeHtml(address)}</span>`,
  ].filter(Boolean);

  const rich = `<footer data-create-ai-footer="1" data-cai-footer-polish="1" style="margin-top:64px;padding:48px 24px 28px;background:linear-gradient(165deg,#1C1917 0%,#2A2421 100%);color:#FAF2EA;font-family:Manrope,system-ui,sans-serif">
  <div style="max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1.4fr repeat(3,minmax(140px,1fr));gap:32px;align-items:start;text-align:left">
    <div>
      <strong style="display:block;font:400 1.5rem/1.2 Instrument Serif,Georgia,serif;letter-spacing:.01em;margin-bottom:12px;color:#FFF7ED">${escapeHtml(brand)}</strong>
      <p style="margin:0;opacity:.78;font-size:14px;line-height:1.6;max-width:36ch">Premium service with clear communication — strategy, craft, and care in every engagement.</p>
    </div>
    <div>
      <strong style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:.1em;opacity:.65;margin-bottom:14px">Quick Links</strong>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:14px">
        ${quickLinksHtml}
      </div>
    </div>
    <div>
      <strong style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:.1em;opacity:.65;margin-bottom:14px">Contact</strong>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;opacity:.92">${
        contactBits.length
          ? contactBits
              .map((b) =>
                b
                  .replace(/color:#e2e8f0/gi, "color:#FFEDD5")
                  .replace(/color:#e2e8f0/gi, "color:#FFEDD5"),
              )
              .join("")
          : `<span style="opacity:.7">Add email / phone in chat</span>`
      }</div>
    </div>
    <div>
      <strong style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:.1em;opacity:.65;margin-bottom:14px">Follow</strong>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <a href="#" aria-label="Facebook" style="width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,247,237,.22);display:grid;place-items:center;color:#FFEDD5;text-decoration:none;font-size:13px">f</a>
        <a href="#" aria-label="Twitter" style="width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,247,237,.22);display:grid;place-items:center;color:#FFEDD5;text-decoration:none;font-size:13px">𝕏</a>
        <a href="#" aria-label="LinkedIn" style="width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,247,237,.22);display:grid;place-items:center;color:#FFEDD5;text-decoration:none;font-size:13px">in</a>
        <a href="#" aria-label="Instagram" style="width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,247,237,.22);display:grid;place-items:center;color:#FFEDD5;text-decoration:none;font-size:13px">ig</a>
      </div>
    </div>
  </div>
  <div style="max-width:1240px;margin:32px auto 0;padding-top:20px;border-top:1px solid rgba(250,242,234,.12);display:flex;flex-wrap:wrap;gap:10px 24px;justify-content:space-between;opacity:.65;font-size:13px">
    <p style="margin:0">© ${year} ${escapeHtml(brand)}. All rights reserved.</p>
    <p style="margin:0">Designed for ${escapeHtml(brand)}</p>
  </div>
</footer>
<style data-cai-footer-resp="1">@media (max-width:800px){footer[data-cai-footer-polish="1"]>div:first-child{grid-template-columns:1fr 1fr!important;gap:22px!important}footer[data-cai-footer-polish="1"]>div:first-child>div:first-child{grid-column:1/-1}}</style>`;

  let out = stripAllFootersAndOrphans(html);
  if (/<\/body>/i.test(out)) {
    return out.replace(/<\/body>/i, `${rich}\n</body>`);
  }
  return `${out}\n${rich}`;
}

/** Drop empty card / ghost boxes AI leaves in grids. */
export function stripEmptyCreateAiCards(html: string): string {
  if (!html) return html;
  let out = html;
  for (let i = 0; i < 4; i += 1) {
    const before = out;
    out = out.replace(
      /<(div|article|li|section)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
      (full, tag: string, attrs: string, inner: string) => {
        if (/id=["']/i.test(attrs) || /data-create-ai|data-cai-/i.test(attrs)) {
          return full;
        }
        const text = stripTags(inner);
        const hasMedia = /<(img|svg|video|iframe)\b/i.test(inner);
        if (!text && !hasMedia) return "";
        if (text.length < 2 && !hasMedia) return "";
        // Whitespace-only ghost card
        if (!hasMedia && /^[\s\u00a0]*$/.test(inner.replace(/<br\s*\/?>/gi, ""))) {
          return "";
        }
        return full;
      },
    );
    if (out === before) break;
  }
  return out;
}

/** CSS rails: contrast safety + gap clamp (no more prompt-only fixes). */
export function injectCreateAiQaRails(html: string): string {
  if (!html) return html;
  let out = html.replace(
    /<style\b[^>]*data-create-ai-qa-rails=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    "",
  );
  const css = `<style ${QA_MARK}>
/* Only fix light headers — do not paint over intentional dark chrome.
   Never force ink on .active / aria-current — theme accent owns those. */
header[data-create-ai-hdr="1"]:not([style*="background:#0"]):not([style*="background: #0"]):not([style*="background:#1"]):not([style*="background:#2"]):not([style*="background-color:#0"]):not([style*="background-color:#1"]) a:not([style*="background"]):not([style*="background-color"]):not([data-cai-btn]):not(.active):not([aria-current="true"]):not([aria-current="page"]),
header[data-create-ai-hdr="1"]:not([style*="background:#0"]):not([style*="background: #0"]):not([style*="background:#1"]):not([style*="background:#2"]) nav a:not([data-cai-btn]):not(.active):not([aria-current="true"]):not([aria-current="page"]),
header[data-create-ai-hdr="1"]:not([style*="background:#0"]):not([style*="background: #0"]):not([style*="background:#1"]) [data-cai-brand],
header[data-create-ai-hdr="1"]:not([style*="background:#0"]):not([style*="background: #0"]):not([style*="background:#1"]) [data-create-ai-brand],
header[data-create-ai-hdr="1"]:not([style*="background:#0"]):not([style*="background: #0"]):not([style*="background:#1"]) [data-cai-brand-label]{
  color:#0f172a!important;
}
/* Soft gap clamp — don't smash designer padding entirely */
section[id]{
  min-height:0!important;
}
footer[data-create-ai-footer="1"]{
  margin-top:clamp(1.5rem,4vw,3rem);
}
</style>`;
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${css}\n</head>`);
  } else {
    out = css + out;
  }
  return out;
}

/** Inject Lucide icons into bare feature/service list items (AI often skips SVGs). */
export function ensureCreateAiLucideIcons(html: string): string {
  if (!html) return html;
  const icons = [
    "wrench",
    "zap",
    "shield-check",
    "thermometer",
    "droplets",
    "hammer",
    "check-circle",
    "star",
    "phone",
    "mail",
    "map-pin",
    "clock",
  ];
  let i = 0;
  let out = html.replace(
    /<section\b([^>]*\bid=["'](services|about|contact|home|testimonials)["'][^>]*)>([\s\S]*?)<\/section>/gi,
    (full, attrs: string, _id: string, inner: string) => {
      const next = inner.replace(
        /<li\b([^>]*)>([\s\S]*?)<\/li>/gi,
        (liFull: string, liA: string, liBody: string) => {
          if (/data-lucide|<svg\b/i.test(liBody)) return liFull;
          const text = stripTags(liBody);
          if (!text || text.length < 2) return liFull;
          const name = icons[i++ % icons.length];
          return `<li${liA}><i data-lucide="${name}" data-cai-icon="1" style="width:18px;height:18px;display:inline-block;vertical-align:-3px;margin-right:8px"></i>${liBody}</li>`;
        },
      );
      return `<section${attrs}>${next}</section>`;
    },
  );

  // Soft CSS so lucide SVGs size correctly after createIcons()
  if (
    /data-cai-icon=["']1["']/i.test(out) &&
    !/data-create-ai-lucide-css=["']1["']/i.test(out)
  ) {
    const css = `<style data-create-ai-lucide-css="1">
i[data-lucide],i[data-cai-icon]{display:inline-flex;line-height:0}
i[data-lucide] svg,i[data-cai-icon] svg{width:1.15em;height:1.15em;stroke:currentColor}
</style>`;
    if (/<\/head>/i.test(out)) {
      out = out.replace(/<\/head>/i, `${css}\n</head>`);
    } else {
      out = css + out;
    }
  }
  return out;
}

/** Run all QA rails (call from polishCreateAiExportHtml). */
export function applyCreateAiQaRails(
  html: string,
  brandName?: string,
  contact?: { email?: string; mobile?: string; address?: string },
): string {
  if (!html) return html;
  let out = html;
  out = fixCreateAiHeaderContrast(out);
  out = ensureCreateAiHeaderCtaInk(out);
  out = stripEmptyCreateAiCards(out);
  out = ensureCreateAiFooter(out, brandName, contact);
  out = ensureCreateAiLucideIcons(out);
  out = injectCreateAiQaRails(out);
  return out;
}
