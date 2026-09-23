/** Create-AI preview Edit mode helpers (DOM chrome — strip before save). */

import { confirmDangerAction } from "@/lib/confirmDialog";

export const CAI_EDIT_CHROME = "data-cai-edit-chrome";
export const CAI_EDIT_SECTION = "data-cai-edit-section";

export type CreateAiEditSectionKind =
  | "blank"
  | "team"
  | "faq"
  | "pricing"
  | "testimonials"
  | "map"
  | "video"
  | "timeline"
  | "services";

const SECTION_HTML: Record<CreateAiEditSectionKind, string> = {
  blank: `<section ${CAI_EDIT_SECTION}="1" style="padding:56px 24px;background:#f8fafc;color:#0f172a">
  <div style="max-width:960px;margin:0 auto;text-align:center">
    <h2 style="margin:0 0 12px;font:700 28px/1.2 Georgia,serif">New section</h2>
    <p style="margin:0;font:400 15px/1.6 system-ui,sans-serif;opacity:.8">Add your content here. Click text to edit.</p>
  </div>
</section>`,
  team: `<section ${CAI_EDIT_SECTION}="1" data-cai-team="1" style="padding:56px 24px;background:#fff;color:#0f172a">
  <div style="max-width:1000px;margin:0 auto">
    <h2 style="text-align:center;margin:0 0 28px;font:700 28px/1.2 Georgia,serif">Our team</h2>
    <div data-cai-items="team" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px">
      <div data-cai-item="1" style="text-align:center"><img alt="Team" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" style="width:120px;height:120px;border-radius:999px;object-fit:cover;margin:0 auto 10px;display:block"/><strong>Alex</strong><p style="margin:4px 0 0;opacity:.7;font-size:13px">Founder</p></div>
      <div data-cai-item="1" style="text-align:center"><img alt="Team" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" style="width:120px;height:120px;border-radius:999px;object-fit:cover;margin:0 auto 10px;display:block"/><strong>Sam</strong><p style="margin:4px 0 0;opacity:.7;font-size:13px">Design</p></div>
    </div>
  </div>
</section>`,
  faq: `<section ${CAI_EDIT_SECTION}="1" data-cai-faq="1" style="padding:56px 24px;background:#0f172a;color:#f8fafc">
  <div style="max-width:800px;margin:0 auto">
    <h2 style="text-align:center;margin:0 0 24px;font:700 28px/1.2 Georgia,serif">FAQ</h2>
    <div data-cai-items="faq">
      <details data-cai-item="1" style="margin:0 0 10px;padding:14px 16px;background:rgba(255,255,255,.06);border-radius:10px"><summary style="cursor:pointer;font-weight:600">How do we get started?</summary><p style="margin:10px 0 0;opacity:.85">Tell us your goals — we guide the next steps.</p></details>
    </div>
  </div>
</section>`,
  pricing: `<section ${CAI_EDIT_SECTION}="1" data-cai-pricing="1" style="padding:56px 24px;background:#fff;color:#0f172a">
  <div style="max-width:960px;margin:0 auto;text-align:center">
    <h2 style="margin:0 0 28px;font:700 28px/1.2 Georgia,serif">Pricing</h2>
    <div data-cai-items="pricing" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;text-align:left">
      <div data-cai-item="1" style="padding:22px;border:1px solid #e2e8f0;border-radius:14px"><h3 style="margin:0 0 8px">Starter</h3><p style="margin:0 0 12px;font-size:28px;font-weight:800">₹999</p><p style="margin:0;opacity:.75;font-size:14px">Essential guidance.</p></div>
    </div>
  </div>
</section>`,
  testimonials: `<section ${CAI_EDIT_SECTION}="1" data-cai-testimonials="1" style="padding:56px 24px;background:#f1f5f9;color:#0f172a">
  <div style="max-width:900px;margin:0 auto;text-align:center">
    <h2 style="margin:0 0 24px;font:700 28px/1.2 Georgia,serif">Clients say</h2>
    <div data-cai-items="testimonials" style="display:grid;gap:16px">
      <blockquote data-cai-item="1" style="margin:0;padding:24px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.06)"><p style="margin:0 0 12px;font:italic 16px/1.6 Georgia,serif">“Smooth, honest, and genuinely helpful throughout.”</p><footer style="opacity:.7;font-size:13px">— Happy client</footer></blockquote>
    </div>
  </div>
</section>`,
  map: `<section ${CAI_EDIT_SECTION}="1" data-cai-map="1" style="padding:56px 24px;background:#fff;color:#0f172a">
  <div style="max-width:960px;margin:0 auto">
    <h2 style="text-align:center;margin:0 0 20px;font:700 28px/1.2 Georgia,serif">Find us</h2>
    <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;min-height:280px;background:#e2e8f0;display:grid;place-items:center;color:#64748b">Map placeholder — replace with your embed</div>
  </div>
</section>`,
  video: `<section ${CAI_EDIT_SECTION}="1" data-cai-video="1" style="padding:56px 24px;background:#0b1220;color:#f8fafc">
  <div style="max-width:900px;margin:0 auto;text-align:center">
    <h2 style="margin:0 0 20px;font:700 28px/1.2 Georgia,serif">Watch</h2>
    <div data-cai-video-frame="1" style="aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#1e293b;display:grid;place-items:center;color:#94a3b8">Add YouTube via Edit → Video</div>
  </div>
</section>`,
  timeline: `<section ${CAI_EDIT_SECTION}="1" data-cai-timeline="1" style="padding:56px 24px;background:#fff;color:#0f172a">
  <div style="max-width:720px;margin:0 auto">
    <h2 style="text-align:center;margin:0 0 28px;font:700 28px/1.2 Georgia,serif">Our journey</h2>
    <ol data-cai-items="timeline" style="margin:0;padding:0 0 0 18px;line-height:1.7"><li data-cai-item="1"><strong>2018</strong> — Started with a local focus</li><li data-cai-item="1"><strong>Today</strong> — Personalized advisory</li></ol>
  </div>
</section>`,
  services: `<section ${CAI_EDIT_SECTION}="1" data-cai-services="1" style="padding:56px 24px;background:#fff;color:#0f172a">
  <div style="max-width:1000px;margin:0 auto;text-align:center">
    <h2 style="margin:0 0 28px;font:700 28px/1.2 Georgia,serif">Services</h2>
    <div data-cai-items="services" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;text-align:left">
      <div data-cai-item="1" style="padding:20px;border:1px solid #e2e8f0;border-radius:14px"><h3 style="margin:0 0 8px">Advisory</h3><p style="margin:0;opacity:.75;font-size:14px">Personalised property guidance.</p></div>
      <div data-cai-item="1" style="padding:20px;border:1px solid #e2e8f0;border-radius:14px"><h3 style="margin:0 0 8px">Viewings</h3><p style="margin:0;opacity:.75;font-size:14px">Curated private tours.</p></div>
    </div>
  </div>
</section>`,
};

const ITEM_HTML: Record<string, string> = {
  team: `<div data-cai-item="1" style="text-align:center"><img alt="Team" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" style="width:120px;height:120px;border-radius:999px;object-fit:cover;margin:0 auto 10px;display:block"/><strong>New member</strong><p style="margin:4px 0 0;opacity:.7;font-size:13px">Role</p></div>`,
  testimonials: `<blockquote data-cai-item="1" style="margin:0;padding:24px;background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.06)"><p style="margin:0 0 12px;font:italic 16px/1.6 Georgia,serif">“New testimonial — edit this text.”</p><footer style="opacity:.7;font-size:13px">— Client name</footer></blockquote>`,
  faq: `<details data-cai-item="1" style="margin:0 0 10px;padding:14px 16px;background:rgba(255,255,255,.06);border-radius:10px;border:1px solid rgba(127,127,127,.25)"><summary style="cursor:pointer;font-weight:600">New question?</summary><p style="margin:10px 0 0;opacity:.85">Answer — click to edit.</p></details>`,
  pricing: `<div data-cai-item="1" style="padding:22px;border:1px solid #e2e8f0;border-radius:14px"><h3 style="margin:0 0 8px">New plan</h3><p style="margin:0 0 12px;font-size:28px;font-weight:800">₹—</p><p style="margin:0;opacity:.75;font-size:14px">Describe this plan.</p></div>`,
  services: `<div data-cai-item="1" style="padding:20px;border:1px solid #e2e8f0;border-radius:14px"><h3 style="margin:0 0 8px">New service</h3><p style="margin:0;opacity:.75;font-size:14px">Short description.</p></div>`,
  timeline: `<li data-cai-item="1"><strong>Year</strong> — Milestone</li>`,
  slider: `<div data-cai-item="1" style="min-width:220px;padding:16px;border-radius:12px;background:#fff;border:1px solid #e2e8f0"><img alt="Slide" src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=360&fit=crop" style="width:100%;height:140px;object-fit:cover;border-radius:8px;display:block;margin-bottom:10px"/><strong>New slide</strong><p style="margin:6px 0 0;font-size:13px;opacity:.75">Edit caption</p></div>`,
};

export const CREATE_AI_EDIT_SECTION_OPTIONS: Array<{
  kind: CreateAiEditSectionKind;
  label: string;
}> = [
  { kind: "blank", label: "Blank" },
  { kind: "team", label: "Team" },
  { kind: "services", label: "Services" },
  { kind: "faq", label: "FAQ" },
  { kind: "pricing", label: "Pricing" },
  { kind: "testimonials", label: "Testimonials" },
  { kind: "map", label: "Map" },
  { kind: "video", label: "Video" },
  { kind: "timeline", label: "Timeline" },
];

/** Remove edit-mode rails / outlines before persisting HTML. */
export function stripCreateAiEditChrome(html: string) {
  if (!html) return html;
  let out = html.replace(
    new RegExp(
      `<[^>]+\\s${CAI_EDIT_CHROME}=["']1["'][^>]*>[\\s\\S]*?<\\/[^>]+>`,
      "gi",
    ),
    "",
  );
  out = out.replace(
    new RegExp(
      `<style[^>]*${CAI_EDIT_CHROME}=["']1["'][^>]*>[\\s\\S]*?<\\/style>`,
      "gi",
    ),
    "",
  );
  out = out.replace(/\sdata-cai-edit-hover=["']1["']/gi, "");
  return out;
}

function listEditableSections(doc: Document): HTMLElement[] {
  const body = doc.body;
  if (!body) return [];
  const nodes = [
    ...body.querySelectorAll<HTMLElement>(
      `main section, body > section, [${CAI_EDIT_SECTION}="1"], [data-create-ai-section]`,
    ),
  ];
  return nodes.filter((el) => {
    if (el.closest(`[${CAI_EDIT_CHROME}="1"]`)) return false;
    const parentSection = el.parentElement?.closest("section");
    return !parentSection || parentSection === el;
  });
}

function detectSectionKind(section: HTMLElement): string {
  if (section.getAttribute("data-cai-team") || /team/i.test(section.id + section.className))
    return "team";
  if (
    section.getAttribute("data-cai-testimonials") ||
    /testimonial/i.test(section.id + section.className)
  )
    return "testimonials";
  if (section.getAttribute("data-cai-faq") || /faq/i.test(section.id + section.className))
    return "faq";
  if (
    section.getAttribute("data-cai-pricing") ||
    /pricing|price/i.test(section.id + section.className)
  )
    return "pricing";
  if (
    section.getAttribute("data-cai-services") ||
    /service/i.test(section.id + section.className)
  )
    return "services";
  if (
    section.getAttribute("data-cai-timeline") ||
    /timeline/i.test(section.id + section.className)
  )
    return "timeline";
  if (
    section.querySelector(
      ".swiper, [class*='slider'], [class*='carousel'], [data-slider], [data-carousel]",
    )
  )
    return "slider";
  if (
    section.getAttribute("data-cai-video") ||
    section.querySelector("iframe[src*='youtube'], iframe[src*='youtu.be'], [data-cai-video-frame]")
  )
    return "video";
  return "";
}

export type CreateAiEditModeHooks = {
  onDirty: () => void;
  /** Persist HTML without reinstalling rails (text style, etc.). */
  onPersist?: () => void;
  onRequestAddSection: (afterIndex: number) => void;
  onReplaceMedia: (el: HTMLImageElement | SVGElement) => void;
  onRequestBg: (sectionIndex: number) => void;
  onRequestYoutube: (sectionIndex: number) => void;
};

/** Install edit chrome + media/section handlers. Returns cleanup. */
export function installCreateAiEditMode(
  doc: Document,
  hooks: CreateAiEditModeHooks,
): () => void {
  const cleanups: Array<() => void> = [];

  const style = doc.createElement("style");
  style.setAttribute(CAI_EDIT_CHROME, "1");
  style.textContent = `
/* Nav / header: no navigation (text elsewhere stays clickable for designMode) */
header a, header button,
nav a, nav button,
[data-create-ai-hdr] a, [data-create-ai-hdr] button,
[data-cai-menu-btn], [data-cai-mobile-panel] a,
[data-cai-mobile-panel] button {
  pointer-events: none !important;
  cursor: text !important;
}
header img, header svg, nav img, nav svg,
[data-create-ai-hdr] img, [data-create-ai-hdr] svg {
  pointer-events: auto !important;
  cursor: pointer !important;
}
img, svg, [class*="icon"], [data-icon] {
  cursor: pointer !important;
  outline: 2px dashed transparent;
  outline-offset: 2px;
}
img:hover, svg:hover {
  outline-color: #f59e0b !important;
}
[${CAI_EDIT_CHROME}="1"][data-cai-rail] {
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  margin: 0;
  background: rgba(15,23,42,.94) !important;
  border: 1px dashed rgba(251,191,36,.7) !important;
  color: #fff !important;
  font: 600 11px/1 system-ui,sans-serif !important;
  position: relative;
  z-index: 2147483000;
  pointer-events: auto !important;
}
[${CAI_EDIT_CHROME}="1"] button {
  pointer-events: auto !important;
  cursor: pointer !important;
  border: 0;
  border-radius: 8px;
  padding: 7px 10px;
  font: 700 11px/1 system-ui,sans-serif;
  background: #f59e0b;
  color: #111;
}
[${CAI_EDIT_CHROME}="1"] button[data-cai-move],
[${CAI_EDIT_CHROME}="1"] button[data-cai-bg],
[${CAI_EDIT_CHROME}="1"] button[data-cai-yt],
[${CAI_EDIT_CHROME}="1"] button[data-cai-item-add] {
  background: #e2e8f0;
  color: #0f172a;
}
[${CAI_EDIT_CHROME}="1"] button[data-cai-del] {
  background: #fecaca;
  color: #7f1d1d;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] {
  display: none;
  position: fixed !important;
  left: 12px;
  top: 12px;
  z-index: 2147483646 !important;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px !important;
  margin: 0 !important;
  background: rgba(15,23,42,.96) !important;
  border: 1px solid rgba(251,191,36,.75) !important;
  border-radius: 12px !important;
  box-shadow: 0 12px 40px rgba(0,0,0,.35);
  font: 600 11px/1 system-ui,sans-serif !important;
  pointer-events: auto !important;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar][data-open="1"] {
  display: flex !important;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #e2e8f0 !important;
  font: 600 10px/1 system-ui,sans-serif !important;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] select,
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] input[type="color"] {
  pointer-events: auto !important;
  border: 0;
  border-radius: 8px;
  background: #e2e8f0;
  color: #0f172a;
  font: 600 11px/1 system-ui,sans-serif;
  padding: 6px 8px;
  max-width: 140px;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] input[type="color"] {
  width: 36px;
  height: 28px;
  padding: 2px;
  cursor: pointer;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] [data-cai-size-toggle] {
  background: #e2e8f0 !important;
  color: #0f172a !important;
  border: 0 !important;
  border-radius: 8px !important;
  padding: 6px 10px !important;
  font: 700 11px/1 system-ui,sans-serif !important;
  cursor: pointer !important;
  min-width: 72px;
  text-align: left;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] [data-cai-size-menu] {
  display: none !important;
  position: absolute;
  left: 0;
  top: calc(100% + 4px);
  flex-direction: column;
  gap: 0;
  padding: 4px;
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 10px;
  z-index: 3;
  min-width: 88px;
  max-height: 220px;
  overflow: auto;
  box-shadow: 0 10px 28px rgba(15,23,42,.22);
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] [data-cai-size-menu][data-open="1"] {
  display: flex !important;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] [data-cai-size-menu] button {
  background: transparent !important;
  color: #0f172a !important;
  border: 0 !important;
  border-radius: 6px !important;
  padding: 8px 10px !important;
  font: 600 12px/1 system-ui,sans-serif !important;
  cursor: pointer !important;
  text-align: left !important;
  width: 100%;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] [data-cai-size-menu] button:hover {
  background: #f1f5f9 !important;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] [data-cai-text-close] {
  background: transparent !important;
  color: #cbd5e1 !important;
  border: 0 !important;
  border-radius: 8px !important;
  padding: 4px 8px !important;
  font: 700 14px/1 system-ui,sans-serif !important;
  cursor: pointer !important;
  margin-left: 2px;
}
[${CAI_EDIT_CHROME}="1"][data-cai-text-bar] [data-cai-text-close]:hover {
  background: rgba(255,255,255,.12) !important;
  color: #fff !important;
}
`;
  doc.head?.appendChild(style);
  cleanups.push(() => style.remove());

  // Floating text style bar (color / size) — menu closed until Size is clicked
  const textBar = doc.createElement("div");
  textBar.setAttribute(CAI_EDIT_CHROME, "1");
  textBar.setAttribute("data-cai-text-bar", "1");
  textBar.setAttribute("contenteditable", "false");
  textBar.innerHTML = `
    <label>Color <input type="color" data-cai-text-color value="#ffffff" title="Text color" /></label>
    <div data-cai-size-wrap style="position:relative;display:inline-flex;align-items:center;gap:4px">
      <span style="color:#e2e8f0;font:600 10px/1 system-ui,sans-serif">Size</span>
      <button type="button" data-cai-size-toggle title="Font size">Size ▾</button>
      <div data-cai-size-menu>
        ${["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px", "64px"]
          .map(
            (s) =>
              `<button type="button" data-cai-size="${s}">${s}</button>`,
          )
          .join("")}
      </div>
    </div>
    <button type="button" data-cai-text-close title="Close" aria-label="Close">✕</button>
  `;
  doc.body?.appendChild(textBar);
  cleanups.push(() => textBar.remove());

  let savedRange: Range | null = null;
  let sizeMenuOpen = false;
  let textBarPinnedClosed = false;

  const colorInput = textBar.querySelector(
    "[data-cai-text-color]",
  ) as HTMLInputElement | null;
  const sizeToggle = textBar.querySelector(
    "[data-cai-size-toggle]",
  ) as HTMLButtonElement | null;
  const sizeMenu = textBar.querySelector(
    "[data-cai-size-menu]",
  ) as HTMLElement | null;
  const textCloseBtn = textBar.querySelector(
    "[data-cai-text-close]",
  ) as HTMLButtonElement | null;

  const rememberSelection = () => {
    if (sizeMenuOpen) return; // keep the text range while picking size
    const sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const el =
      node?.nodeType === 3
        ? (node.parentElement as HTMLElement | null)
        : (node as HTMLElement | null);
    if (el?.closest?.(`[${CAI_EDIT_CHROME}="1"]`)) return;
    try {
      savedRange = sel.getRangeAt(0).cloneRange();
    } catch {
      /* ignore */
    }
  };

  const restoreSelection = () => {
    if (!savedRange) return false;
    const sel = doc.getSelection();
    if (!sel) return false;
    try {
      sel.removeAllRanges();
      sel.addRange(savedRange);
      return true;
    } catch {
      return false;
    }
  };

  const closeSizeMenu = () => {
    sizeMenuOpen = false;
    sizeMenu?.removeAttribute("data-open");
  };

  const openSizeMenu = () => {
    sizeMenuOpen = true;
    sizeMenu?.setAttribute("data-open", "1");
    textBar.setAttribute("data-open", "1");
  };

  const rgbToHex = (input: string): string => {
    const s = (input || "").trim();
    if (!s) return "#ffffff";
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    const m = s.match(
      /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
    );
    if (!m) return "#ffffff";
    const toHex = (n: string) =>
      Math.max(0, Math.min(255, Math.round(Number(n))))
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
  };

  const snapFontSize = (px: number): string => {
    const steps = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
    let best = steps[0];
    let bestDiff = Math.abs(px - best);
    for (const s of steps) {
      const d = Math.abs(px - s);
      if (d < bestDiff) {
        best = s;
        bestDiff = d;
      }
    }
    return `${best}px`;
  };

  const syncTextBarFromSelection = () => {
    const win = doc.defaultView;
    if (!win || !colorInput || !sizeToggle) return;
    const sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const host = findStyleTarget(sel.anchorNode);
    if (!host) return;
    const cs = win.getComputedStyle(host);
    const hex = rgbToHex(cs.color || "#ffffff");
    try {
      colorInput.value = hex;
    } catch {
      /* ignore invalid color */
    }
    const rawPx = parseFloat(cs.fontSize || "16");
    const sizeLabel = Number.isFinite(rawPx)
      ? `${Math.round(rawPx)}px`
      : "Size";
    const snapped = Number.isFinite(rawPx) ? snapFontSize(rawPx) : "";
    sizeToggle.textContent = `${sizeLabel} ▾`;
    sizeToggle.setAttribute("data-detected-size", snapped || sizeLabel);
    // Highlight matching size in menu
    sizeMenu?.querySelectorAll("[data-cai-size]").forEach((btn) => {
      const b = btn as HTMLElement;
      const match = snapped && b.getAttribute("data-cai-size") === snapped;
      b.style.background = match ? "#fef3c7" : "transparent";
      b.style.fontWeight = match ? "800" : "600";
    });
  };

  const isIconLikeElement = (el: Element | null): boolean => {
    if (!el) return false;
    const hit = el as HTMLElement;
    // Back-to-top / float widgets — never show text Color/Size plate
    if (
      hit.closest?.(
        `#create-ai-btt, [data-create-ai-btt], [id*="btt"], [class*="back-to-top"], [class*="backtotop"], [aria-label*="top" i], [title*="back to top" i], [data-cai-float], [data-create-ai-float]`,
      )
    ) {
      return true;
    }
    if (
      hit.closest?.(
        "img, svg, path, use, symbol, canvas, video, iframe, .material-icons, .fa, .fas, .far, .fab, .bi",
      )
    ) {
      return true;
    }
    if (hit.closest?.("i") && /icon|fa-|bi-|lucide|heroicon/i.test(
      `${(hit.closest("i") as HTMLElement)?.className || ""}`,
    )) {
      return true;
    }
    if (
      hit.matches?.("[data-icon], i") ||
      hit.closest?.("[data-icon]")
    ) {
      const text = (hit.innerText || hit.textContent || "").replace(/\s+/g, "").trim();
      if (text.length < 3) return true;
    }
    const cls = String(hit.className || "");
    if (/icon|lucide|heroicon|fa-|material-icons|back.?to.?top|scroll.?top|\bbtt\b/i.test(cls)) {
      const text = (hit.innerText || hit.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 3) return true;
      const r = hit.getBoundingClientRect?.();
      if (r && r.width <= 56 && r.height <= 56 && text.length <= 2) return true;
    }
    // Fixed round “↑” controls (common BTT style without our id)
    const fixedHost = hit.closest?.("a, button, div") as HTMLElement | null;
    if (fixedHost) {
      const cs = hit.ownerDocument.defaultView?.getComputedStyle(fixedHost);
      const text = (fixedHost.innerText || fixedHost.textContent || "")
        .replace(/\s+/g, "")
        .trim();
      const r = fixedHost.getBoundingClientRect();
      if (
        cs &&
        (cs.position === "fixed" || cs.position === "sticky") &&
        r.width <= 64 &&
        r.height <= 64 &&
        (text === "↑" ||
          text === "⬆" ||
          text === "^" ||
          /top|btt/i.test(fixedHost.id + fixedHost.className) ||
          !!fixedHost.querySelector("svg"))
      ) {
        return true;
      }
    }
    return false;
  };

  const isEditableTextContext = (el: Element | null): boolean => {
    if (!el) return false;
    if (el.closest?.(`[${CAI_EDIT_CHROME}="1"]`)) return false;
    if (el.closest?.("img, svg, script, style, canvas, video, iframe")) return false;
    if (isIconLikeElement(el)) return false;
    const host =
      (el.closest?.(
        "h1,h2,h3,h4,h5,h6,p,li,span,a,strong,em,blockquote,figcaption,label,td,th,button,div",
      ) as HTMLElement | null) || (el as HTMLElement);
    if (isIconLikeElement(host)) return false;
    const text = (host.innerText || host.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 1) return false;
    if (
      host.matches?.("button, a, [role='button']") &&
      host.querySelector?.("svg, img, i, [data-icon]") &&
      text.length < 3
    ) {
      return false;
    }
    return true;
  };

  const positionTextBar = () => {
    const win = doc.defaultView;
    if (!win) return;
    if (textBarPinnedClosed) {
      textBar.removeAttribute("data-open");
      return;
    }
    if (sizeMenuOpen) {
      textBar.setAttribute("data-open", "1");
      return;
    }
    const sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0) {
      textBar.removeAttribute("data-open");
      closeSizeMenu();
      return;
    }
    const anchor = sel.anchorNode;
    const el =
      anchor?.nodeType === 3
        ? (anchor.parentElement as HTMLElement | null)
        : (anchor as HTMLElement | null);
    if (!el || el.closest?.(`[${CAI_EDIT_CHROME}="1"]`)) {
      textBar.removeAttribute("data-open");
      return;
    }
    if (!isEditableTextContext(el)) {
      textBar.removeAttribute("data-open");
      closeSizeMenu();
      return;
    }
    let rect: DOMRect | null = null;
    try {
      rect = sel.getRangeAt(0).getBoundingClientRect();
    } catch {
      rect = null;
    }
    if (!rect || (rect.width === 0 && rect.height === 0 && sel.isCollapsed)) {
      rect = el.getBoundingClientRect();
    }
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      textBar.removeAttribute("data-open");
      return;
    }
    textBar.setAttribute("data-open", "1");
    syncTextBarFromSelection();
    const barW = textBar.offsetWidth || 200;
    const left = Math.max(
      8,
      Math.min(rect.left, win.innerWidth - barW - 8),
    );
    const top = Math.max(8, rect.top - 52);
    textBar.style.left = `${left}px`;
    textBar.style.top = `${top}px`;
  };

  const findStyleTarget = (from: Node | null): HTMLElement | null => {
    if (!from) return null;
    let el: HTMLElement | null =
      from.nodeType === 3
        ? (from.parentElement as HTMLElement | null)
        : (from as HTMLElement);
    if (!el) return null;
    if (el.closest?.(`[${CAI_EDIT_CHROME}="1"]`)) return null;
    if (!isEditableTextContext(el)) return null;
    const preferred = el.closest(
      "h1,h2,h3,h4,h5,h6,p,li,span,a,strong,em,blockquote,figcaption,label,td,th,button",
    ) as HTMLElement | null;
    if (
      preferred &&
      !preferred.closest(`[${CAI_EDIT_CHROME}="1"]`) &&
      isEditableTextContext(preferred)
    ) {
      return preferred;
    }
    const skip = new Set([
      "SCRIPT",
      "STYLE",
      "SVG",
      "IMG",
      "SECTION",
      "MAIN",
      "HEADER",
      "FOOTER",
      "NAV",
      "BODY",
      "HTML",
      "FORM",
    ]);
    while (el && el !== doc.body) {
      if (el.closest(`[${CAI_EDIT_CHROME}="1"]`)) return null;
      if (!skip.has(el.tagName)) return el;
      el = el.parentElement;
    }
    return null;
  };

  const applyTextStyle = (mutate: (el: HTMLElement) => void) => {
    restoreSelection();
    const live = doc.getSelection();
    if (!live || live.rangeCount === 0) return;

    if (!live.isCollapsed) {
      const range = live.getRangeAt(0);
      try {
        const span = doc.createElement("span");
        mutate(span);
        span.appendChild(range.extractContents());
        range.insertNode(span);
        live.removeAllRanges();
        const next = doc.createRange();
        next.selectNodeContents(span);
        live.addRange(next);
        savedRange = next.cloneRange();
      } catch {
        const host = findStyleTarget(range.commonAncestorContainer);
        if (host) mutate(host);
      }
    } else {
      const host = findStyleTarget(live.anchorNode);
      if (host) mutate(host);
    }
    closeSizeMenu();
    if (hooks.onPersist) hooks.onPersist();
    else hooks.onDirty();
    syncTextBarFromSelection();
    positionTextBar();
  };

  textBar.addEventListener(
    "mousedown",
    (e) => {
      // Save caret before toolbar steals focus; don't overwrite while menu open
      if (!sizeMenuOpen) rememberSelection();
      e.stopPropagation();
      const t = e.target as Element | null;
      if (t?.closest?.("input, button, [data-cai-size-menu]")) {
        e.preventDefault();
      }
    },
    true,
  );

  colorInput?.addEventListener("input", () => {
    applyTextStyle((el) => {
      el.style.setProperty("color", colorInput.value, "important");
    });
  });

  sizeToggle?.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sizeMenuOpen) rememberSelection();
  });
  sizeToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (sizeMenuOpen) closeSizeMenu();
    else openSizeMenu();
  });

  sizeMenu?.querySelectorAll("[data-cai-size]").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const size = (btn as HTMLElement).getAttribute("data-cai-size") || "";
      if (!size) return;
      applyTextStyle((el) => {
        el.style.setProperty("font-size", size, "important");
        el.style.setProperty("line-height", "1.25", "important");
      });
      if (sizeToggle) sizeToggle.textContent = `${size} ▾`;
    });
  });

  const onDocCloseSizeMenu = (e: Event) => {
    const t = e.target as Element | null;
    if (t?.closest?.("[data-cai-size-wrap]")) return;
    closeSizeMenu();
  };
  doc.addEventListener("mousedown", onDocCloseSizeMenu, true);
  cleanups.push(() =>
    doc.removeEventListener("mousedown", onDocCloseSizeMenu, true),
  );

  textCloseBtn?.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  textCloseBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeSizeMenu();
    textBarPinnedClosed = true;
    textBar.removeAttribute("data-open");
  });

  const onSelChange = () => {
    // New text click/selection → allow bar again after close
    if (textBarPinnedClosed) {
      const sel = doc.getSelection();
      const node = sel?.anchorNode;
      const el =
        node?.nodeType === 3
          ? (node.parentElement as HTMLElement | null)
          : (node as HTMLElement | null);
      if (el && !el.closest?.(`[${CAI_EDIT_CHROME}="1"]`)) {
        textBarPinnedClosed = false;
      }
    }
    if (!sizeMenuOpen) rememberSelection();
    positionTextBar();
  };
  doc.addEventListener("mouseup", onSelChange, true);
  doc.addEventListener("keyup", onSelChange, true);
  doc.addEventListener("selectionchange", onSelChange);
  cleanups.push(() => {
    doc.removeEventListener("mouseup", onSelChange, true);
    doc.removeEventListener("keyup", onSelChange, true);
    doc.removeEventListener("selectionchange", onSelChange);
  });

  const sections = listEditableSections(doc);
  sections.forEach((section, index) => {
    if (!section.getAttribute(CAI_EDIT_SECTION)) {
      section.setAttribute(CAI_EDIT_SECTION, "1");
    }
    const kind = detectSectionKind(section);
    const rail = doc.createElement("div");
    rail.setAttribute(CAI_EDIT_CHROME, "1");
    rail.setAttribute("data-cai-rail", "1");
    rail.setAttribute("contenteditable", "false");
    const itemBtn =
      kind && ITEM_HTML[kind]
        ? `<button type="button" data-cai-item-add="${kind}" title="Add item">+ ${kind === "slider" ? "Slide" : "Item"}</button>`
        : "";
    const ytBtn =
      kind === "video" || section.querySelector("iframe, [data-cai-video-frame]")
        ? `<button type="button" data-cai-yt="1" title="YouTube URL">Video</button>`
        : `<button type="button" data-cai-yt="1" title="Add / edit YouTube">Video</button>`;
    rail.innerHTML = `
      <button type="button" data-cai-move="up" title="Move up">↑</button>
      <button type="button" data-cai-move="down" title="Move down">↓</button>
      <button type="button" data-cai-bg="1" title="Section background">Bg</button>
      ${ytBtn}
      ${itemBtn}
      <button type="button" data-cai-add="1">+ Section</button>
      <button type="button" data-cai-del="1" title="Delete section">Delete</button>
    `;
    section.insertAdjacentElement("afterend", rail);

    const onRailClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      const btn = (event.target as Element | null)?.closest?.("button");
      if (!btn) return;
      const move = btn.getAttribute("data-cai-move");
      if (move === "up" || move === "down") {
        moveSection(doc, index, move);
        hooks.onDirty();
        return;
      }
      if (btn.getAttribute("data-cai-add") === "1") {
        hooks.onRequestAddSection(index);
        return;
      }
      if (btn.getAttribute("data-cai-del") === "1") {
        void (async () => {
          const ok = await confirmDangerAction({
            title: "Delete this section?",
            text: "This removes the whole block from the page. You can Undo after if needed.",
            confirmButtonText: "Yes, delete",
          });
          if (!ok) return;
          const railEl = section.nextElementSibling as HTMLElement | null;
          section.remove();
          if (railEl?.getAttribute?.(CAI_EDIT_CHROME) === "1") railEl.remove();
          hooks.onDirty();
        })();
        return;
      }
      if (btn.getAttribute("data-cai-bg") === "1") {
        hooks.onRequestBg(index);
        return;
      }
      if (btn.getAttribute("data-cai-yt") === "1") {
        hooks.onRequestYoutube(index);
        return;
      }
      const itemKind = btn.getAttribute("data-cai-item-add");
      if (itemKind) {
        addItemToSection(section, itemKind);
        hooks.onDirty();
      }
    };
    rail.addEventListener("click", onRailClick, true);
    cleanups.push(() => {
      rail.removeEventListener("click", onRailClick, true);
      rail.remove();
    });
  });

  const onMediaClick = (event: MouseEvent) => {
    const t = event.target as Element | null;
    if (!t) return;
    if (t.closest?.(`[${CAI_EDIT_CHROME}="1"]`)) return;
    const img = t.closest?.("img") as HTMLImageElement | null;
    const svg = !img ? (t.closest?.("svg") as SVGElement | null) : null;
    if (!img && !svg) return;
    if (img && img.naturalWidth > 0 && img.naturalWidth < 12) return;
    event.preventDefault();
    event.stopPropagation();
    hooks.onReplaceMedia(img || (svg as SVGElement));
  };

  const blockNav = (event: Event) => {
    const t = event.target as Element | null;
    if (!t) return;
    if (t.closest?.(`[${CAI_EDIT_CHROME}="1"]`)) return;
    if (t.closest?.("img, svg")) return;
    const a = t.closest?.("a");
    const btn = t.closest?.("button, [role='button']");
    const navish = t.closest?.(
      "nav, header, [data-create-ai-hdr], [data-cai-menu-btn], [data-cai-mobile-panel], .swiper-button-next, .swiper-button-prev, .swiper-pagination, [class*='slider'] button, [class*='carousel'] button",
    );
    if (a || (btn && navish) || (navish && btn)) {
      event.preventDefault();
      event.stopPropagation();
      // @ts-expect-error stopImmediatePropagation exists on Event in browsers
      event.stopImmediatePropagation?.();
    }
  };

  doc.addEventListener("click", onMediaClick, true);
  doc.addEventListener("click", blockNav, true);
  doc.addEventListener("auxclick", blockNav, true);
  cleanups.push(() => {
    doc.removeEventListener("click", onMediaClick, true);
    doc.removeEventListener("click", blockNav, true);
    doc.removeEventListener("auxclick", blockNav, true);
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

function addItemToSection(section: HTMLElement, kind: string) {
  const html = ITEM_HTML[kind];
  if (!html) return;
  const wrap = section.ownerDocument.createElement("div");
  wrap.innerHTML = html.trim();
  const node = wrap.firstElementChild as HTMLElement | null;
  if (!node) return;
  const host =
    section.querySelector(`[data-cai-items="${kind}"]`) ||
    section.querySelector("[data-cai-items]") ||
    section.querySelector(
      ".swiper-wrapper, [class*='slider'], [class*='carousel'], [class*='grid']",
    ) ||
    section;
  host.appendChild(node);
}

function moveSection(doc: Document, index: number, dir: "up" | "down") {
  const sections = listEditableSections(doc);
  const section = sections[index];
  if (!section) return;
  const rail =
    section.nextElementSibling?.getAttribute?.(CAI_EDIT_CHROME) === "1"
      ? (section.nextElementSibling as HTMLElement)
      : null;

  if (dir === "up") {
    const prev = sections[index - 1];
    if (!prev) return;
    const parent = prev.parentElement;
    if (!parent) return;
    parent.insertBefore(section, prev);
    if (rail) parent.insertBefore(rail, prev);
    return;
  }

  const next = sections[index + 1];
  if (!next) return;
  const nextRail =
    next.nextElementSibling?.getAttribute?.(CAI_EDIT_CHROME) === "1"
      ? (next.nextElementSibling as HTMLElement)
      : null;
  const parent = next.parentElement;
  if (!parent) return;
  const after = nextRail || next;
  if (rail) parent.insertBefore(rail, after.nextSibling);
  parent.insertBefore(section, after.nextSibling);
  if (rail) parent.insertBefore(rail, section.nextSibling);
}

export function insertCreateAiEditSection(
  doc: Document,
  afterIndex: number,
  kind: CreateAiEditSectionKind,
) {
  const sections = listEditableSections(doc);
  const html = SECTION_HTML[kind] || SECTION_HTML.blank;
  const wrap = doc.createElement("div");
  wrap.innerHTML = html.trim();
  const node = wrap.firstElementChild as HTMLElement | null;
  if (!node) return;

  const after = sections[afterIndex];
  if (after) {
    const rail =
      after.nextElementSibling?.getAttribute?.(CAI_EDIT_CHROME) === "1"
        ? after.nextElementSibling
        : null;
    (rail || after).insertAdjacentElement("afterend", node);
  } else {
    const footer = doc.querySelector("footer");
    if (footer) footer.insertAdjacentElement("beforebegin", node);
    else doc.body?.appendChild(node);
  }
}

export function applyCreateAiSectionBackground(
  doc: Document,
  sectionIndex: number,
  value: { color?: string; imageUrl?: string },
) {
  const section = listEditableSections(doc)[sectionIndex];
  if (!section) return;
  if (value.imageUrl) {
    section.style.backgroundImage = `url("${value.imageUrl.replace(/"/g, "%22")}")`;
    section.style.backgroundSize = "cover";
    section.style.backgroundPosition = "center";
    if (value.color) section.style.backgroundColor = value.color;
  } else if (value.color) {
    section.style.backgroundImage = "none";
    section.style.backgroundColor = value.color;
  }
}

export function applyCreateAiSectionYoutube(
  doc: Document,
  sectionIndex: number,
  rawUrl: string,
) {
  const section = listEditableSections(doc)[sectionIndex];
  if (!section) return;
  const id = extractYoutubeId(rawUrl);
  if (!id) return;
  const embed = `https://www.youtube.com/embed/${id}`;
  let frame = section.querySelector(
    "iframe, [data-cai-video-frame]",
  ) as HTMLElement | null;
  if (frame?.tagName === "IFRAME") {
    (frame as HTMLIFrameElement).src = embed;
    return;
  }
  const iframe = doc.createElement("iframe");
  iframe.src = embed;
  iframe.title = "YouTube video";
  iframe.setAttribute("allowfullscreen", "true");
  iframe.style.cssText =
    "width:100%;aspect-ratio:16/9;border:0;border-radius:14px;display:block";
  if (frame) {
    frame.replaceWith(iframe);
  } else {
    const box =
      section.querySelector("div") || section;
    box.appendChild(iframe);
  }
}

function extractYoutubeId(input: string) {
  const s = (input || "").trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").slice(0, 11);
    }
    const v = u.searchParams.get("v");
    if (v) return v.slice(0, 11);
    const m = u.pathname.match(/\/embed\/([\w-]{11})/);
    if (m?.[1]) return m[1];
  } catch {
    /* ignore */
  }
  return "";
}

/** Replace img/svg with uploaded image while keeping the on-screen frame size. */
export function applyCreateAiReplacedMedia(
  target: HTMLImageElement | SVGElement,
  dataUrl: string,
) {
  const win = target.ownerDocument.defaultView;
  const rect = target.getBoundingClientRect();
  let frame = target.parentElement as HTMLElement | null;
  let frameRect = frame?.getBoundingClientRect();
  // Climb to a real media frame (polaroid / card) if img itself is tiny
  let climb: HTMLElement | null = frame;
  for (let i = 0; i < 4 && climb; i++) {
    const r = climb.getBoundingClientRect();
    if (r.width >= 80 && r.height >= 80) {
      frame = climb;
      frameRect = r;
      break;
    }
    climb = climb.parentElement;
  }

  const fillFrame = (img: HTMLImageElement, box: DOMRect) => {
    img.removeAttribute("width");
    img.removeAttribute("height");
    img.style.boxSizing = "border-box";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = "cover";
    img.style.objectPosition = "center";
    img.style.display = "block";
    // If parent has no height, lock to previous/frame pixels so it doesn't collapse
    if (frame && win) {
      const pcs = win.getComputedStyle(frame);
      const parentH = parseFloat(pcs.height) || frameRect?.height || 0;
      if (parentH < 40 && box.height >= 40) {
        img.style.width = `${Math.round(box.width)}px`;
        img.style.height = `${Math.round(box.height)}px`;
      } else if ((frameRect?.height || 0) >= 80) {
        if (pcs.position === "static" || pcs.position === "") {
          // Keep parent from collapsing after src swap
          if (!pcs.minHeight || pcs.minHeight === "0px") {
            frame.style.minHeight = `${Math.round(frameRect!.height)}px`;
          }
        }
      }
    }
  };

  if (target instanceof HTMLImageElement) {
    const box =
      rect.width >= 48 && rect.height >= 48
        ? rect
        : frameRect && frameRect.width >= 80
          ? frameRect
          : rect;
    target.src = dataUrl;
    // Tiny placeholder / icon-sized img inside a big card → fill the card
    if (
      (rect.width < 48 || rect.height < 48) &&
      frameRect &&
      frameRect.width >= 80 &&
      frameRect.height >= 80
    ) {
      fillFrame(target, box);
      return;
    }
    // Normal gallery tile: keep rendered box + cover
    if (box.width >= 48 && box.height >= 48) {
      const hadInlineW = /(?:^|;)\s*width\s*:/i.test(target.getAttribute("style") || "");
      const hadInlineH = /(?:^|;)\s*height\s*:/i.test(target.getAttribute("style") || "");
      if (!hadInlineW && !target.className) {
        target.style.width = `${Math.round(box.width)}px`;
      }
      if (!hadInlineH && !target.className) {
        target.style.height = `${Math.round(box.height)}px`;
      }
      // Reinforce cover so new aspect ratio doesn't look wrong
      if (!target.style.objectFit) target.style.objectFit = "cover";
      if (!target.style.display) target.style.display = "block";
      // After swap, if layout collapsed, force fill
      requestAnimationFrame(() => {
        const after = target.getBoundingClientRect();
        if (after.width < 48 || after.height < 48) {
          fillFrame(target, box);
        }
      });
    }
    return;
  }

  // SVG → img matching the drawn box (or parent frame)
  const box =
    rect.width >= 24 && rect.height >= 24
      ? rect
      : frameRect && frameRect.width >= 80
        ? frameRect
        : rect;
  const img = target.ownerDocument.createElement("img");
  img.src = dataUrl;
  img.alt = "Image";
  const cls = target.getAttribute("class");
  if (cls) img.className = cls;
  const st = target.getAttribute("style");
  if (st) img.style.cssText = st;
  fillFrame(img, box.width >= 24 ? box : new DOMRect(0, 0, 120, 120));
  if (box.width >= 24 && (img.style.width === "100%" || !frameRect)) {
    // If no solid parent frame, use pixel size from SVG box
    if (!frameRect || frameRect.width < 80) {
      img.style.width = `${Math.round(Math.max(box.width, 48))}px`;
      img.style.height = `${Math.round(Math.max(box.height, 48))}px`;
    }
  }
  target.replaceWith(img);
}

/** Serialize document HTML without edit chrome. */
export function serializeCreateAiEditDocument(doc: Document) {
  const clone = doc.documentElement.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(`[${CAI_EDIT_CHROME}="1"]`)
    .forEach((el) => el.remove());
  return `<!DOCTYPE html>\n${clone.outerHTML}`;
}
