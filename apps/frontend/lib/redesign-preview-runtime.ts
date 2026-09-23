/** Base CSS + DOM hooks for AI-generated redesign sections inside the preview iframe. */

const HERO_SLIDER_AUTO_MS = 8000;
const heroSliderTimers = new WeakMap<HTMLElement, number>();

export const REDESIGN_SECTIONS_UPDATED_EVENT = "redesign-sections-updated";

export const REDESIGN_PREVIEW_BASE_CSS = `
  html { scroll-behavior: smooth; overflow-y: auto; }
  html, body { overflow-x: clip; max-width: 100%; }
  body { overflow-y: visible; }
  .ai-redesign-section { width: 100%; max-width: 100%; overflow-x: clip; overflow-y: visible; box-sizing: border-box; }
  .ai-redesign-section:has(> header),
  .ai-redesign-section:has(> nav),
  .ai-redesign-section header,
  .ai-redesign-section nav {
    overflow: visible !important;
  }
  header[data-redesign-sticky]:not(:has([data-hero-slider], .hero-slide, [data-hero-slide])),
  .ai-redesign-section > header:not(:has([data-hero-slider], .hero-slide)),
  .ai-redesign-section header.sticky:not(:has([data-hero-slider], .hero-slide)) {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
  }
  header:has([data-hero-slider], .hero-slide, [data-hero-slide]) {
    position: static !important;
    top: auto !important;
  }
  header:has([data-hero-slider], .hero-slide) > div:has(> nav:not([data-mobile-menu])),
  header:has([data-hero-slider], .hero-slide) [data-redesign-nav-sticky],
  header:has([data-hero-slider]) [data-redesign-chrome-sticky],
  .ai-redesign-section nav.sticky,
  .ai-redesign-section [class*="sticky"][class*="top-0"]:not([data-hero-slider]):not(.hero-slide) {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
  }
  [data-hero-slider] {
    position: relative !important;
    overflow: hidden !important;
    isolation: isolate;
    min-height: min(70vh, 820px);
  }
  [data-hero-slider] > .hero-slide,
  [data-hero-slider] > [data-hero-slide] {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    min-height: min(70vh, 820px);
  }
  [data-hero-slider] > .hero-slide:not(.active),
  [data-hero-slider] > [data-hero-slide]:not(.active) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    z-index: 0 !important;
  }
  [data-hero-slider] > .hero-slide.active,
  [data-hero-slider] > [data-hero-slide].active {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 2 !important;
    animation: none !important;
    transform: none !important;
  }
  .ai-redesign-section *, .ai-redesign-section *::before, .ai-redesign-section *::after { box-sizing: border-box; }
  .ai-redesign-section img, .ai-redesign-section video, .ai-redesign-section svg { max-width: 100%; height: auto; }
  .ai-redesign-section table { width: 100%; display: block; overflow-x: auto; }
  [data-before-after] {
    position: relative !important;
    overflow: hidden !important;
    user-select: none;
    touch-action: none;
    isolation: isolate;
  }
  [data-before-after] > img:first-of-type,
  [data-before-after] [data-before-after-base] {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    object-fit: cover !important;
  }
  [data-before-after] [data-before-after-overlay] {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    height: 100% !important;
    overflow: hidden !important;
    border-right: 2px solid rgba(255,255,255,0.9) !important;
    z-index: 2 !important;
    pointer-events: none !important;
    max-width: 100% !important;
  }
  [data-before-after] [data-before-after-overlay] img {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    height: 100% !important;
    max-width: none !important;
    width: var(--ba-host-w, 100%) !important;
    object-fit: cover !important;
    object-position: left center !important;
  }
  [data-before-after] [data-before-after-range] {
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    opacity: 0 !important;
    cursor: ew-resize !important;
    z-index: 5 !important;
    appearance: none !important;
    -webkit-appearance: none !important;
  }
  [data-before-after] [data-before-after-handle] {
    position: absolute !important;
    top: 50% !important;
    z-index: 4 !important;
    width: 2.25rem !important;
    height: 2.25rem !important;
    margin-left: -1.125rem !important;
    transform: translateY(-50%) !important;
    border-radius: 9999px !important;
    border: 2px solid #fff !important;
    background: rgba(0, 51, 153, 0.95) !important;
    box-shadow: 0 8px 20px rgba(0,0,0,0.35) !important;
    pointer-events: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #fff !important;
    font-size: 11px !important;
    font-weight: 700 !important;
  }
  [data-mobile-menu][data-open="true"],
  nav[data-mobile-menu][data-open="true"] {
    display: flex !important;
    flex-direction: column !important;
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    z-index: 150 !important;
    background: #fff !important;
    padding: 0.75rem 1rem !important;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14) !important;
    max-height: min(72vh, 520px) !important;
    overflow-y: auto !important;
  }
  header {
    position: relative !important;
  }
  /* Below lg: hamburger only — stops desktop links wrapping like a tab row. */
  @media (max-width: 1023px) {
    header nav:not([data-mobile-menu]),
    header [data-redesign-main-nav] {
      display: none !important;
    }
    header [data-mobile-menu-toggle] {
      display: inline-flex !important;
    }
  }
  @media (min-width: 1024px) {
    header [data-mobile-menu-toggle],
    header [data-mobile-menu] {
      display: none !important;
    }
  }
  @media (min-width: 768px) and (max-width: 1279px) {
    header nav:not([data-mobile-menu]) > ul,
    header > div nav > ul,
    header nav.flex {
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      gap: 0.35rem 0.65rem !important;
      scrollbar-width: none;
      max-width: 100%;
    }
    header nav:not([data-mobile-menu]) a,
    header nav:not([data-mobile-menu]) button:not([data-mobile-menu-toggle]) {
      font-size: 0.68rem !important;
      white-space: nowrap !important;
    }
  }
  [data-hero-slider] nav:not([data-mobile-menu]),
  [data-hero-slider] > nav {
    display: none !important;
  }
  nav[data-mobile-menu]:not([data-open="true"]),
  [data-mobile-menu]:not([data-open="true"]) {
    display: none !important;
  }
  /* Narrow preview iframes can still report large widths; never hide an open drawer. */
  @media (min-width: 1024px) {
    nav[data-mobile-menu]:not([data-open="true"]),
    [data-mobile-menu]:not([data-open="true"]) {
      display: none !important;
    }
  }
  [data-tab-trigger][data-active="true"],
  [role="tab"][aria-selected="true"] {
    border-color: #ea580c !important;
    box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2) !important;
  }
  [data-tab-panel][data-tab-active="false"],
  [role="tabpanel"][hidden] {
    display: none !important;
  }
  [data-hero-dot][data-active="true"],
  button[data-hero-dot][data-active="true"] {
    opacity: 1 !important;
    transform: scale(1.2) !important;
    background-color: #ea580c !important;
  }
  [data-hero-dot][data-active="false"] {
    opacity: 0.45 !important;
    transform: scale(1) !important;
  }
  header, header nav, header ul, [data-nav-dropdown] {
    overflow: visible !important;
  }
  header nav li.has-submenu,
  header nav li.group,
  [data-nav-dropdown] {
    position: relative !important;
  }
  header nav li.has-submenu > ul,
  header nav li.group > ul {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    z-index: 120 !important;
    min-width: 12rem;
    max-height: min(70vh, 420px);
    overflow-y: auto;
    background: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
    padding-top: 0.5rem !important;
  }
  header nav li.has-submenu > ul::before,
  header nav li.group > ul::before,
  [data-nav-dropdown-panel]::before {
    content: "";
    position: absolute;
    top: -14px;
    left: 0;
    right: 0;
    height: 14px;
  }
  [data-nav-dropdown-panel] {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: auto !important;
    z-index: 120 !important;
    min-width: 12rem;
    max-height: min(70vh, 420px);
    overflow-y: auto;
    background: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
    padding-top: 0.5rem !important;
  }
  [data-nav-dropdown-panel].hidden:not([data-open="true"]) { display: none !important; }
  [data-nav-dropdown-panel][data-open="true"] { display: block !important; }
  /* Mobile drawer: keep every submenu collapsed until tapped */
  @media (max-width: 767px) {
    [data-mobile-menu] [data-nav-dropdown-panel],
    [data-mobile-menu] li.has-submenu > ul,
    [data-mobile-menu] li.group > ul,
    [data-mobile-menu] [data-mobile-submenu-panel] {
      position: static !important;
      top: auto !important;
      left: auto !important;
      box-shadow: none !important;
      min-width: 0 !important;
      max-height: none !important;
      padding: 0.25rem 0 0.25rem 0.85rem !important;
      border-radius: 0 !important;
      background: transparent !important;
      display: none !important;
    }
    [data-mobile-menu] [data-nav-dropdown-panel][data-open="true"],
    [data-mobile-menu] li.has-submenu[data-open="true"] > ul,
    [data-mobile-menu] li.group[data-open="true"] > ul,
    [data-mobile-menu] [data-mobile-submenu-panel][data-open="true"] {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.15rem !important;
    }
    [data-mobile-menu] [data-mobile-submenu-trigger]::after {
      content: "+";
      margin-left: auto;
      font-size: 1rem;
      font-weight: 700;
      line-height: 1;
      opacity: 0.85;
    }
    [data-mobile-menu] [data-mobile-submenu-trigger][aria-expanded="true"]::after {
      content: "−";
    }
    [data-mobile-menu] [data-mobile-submenu-trigger] {
      display: flex !important;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
  }
  @media (min-width: 768px) {
    header nav li.group > ul,
    header nav li.has-submenu > ul,
    [data-nav-dropdown-panel] {
      display: none;
    }
    [data-nav-dropdown]:hover > [data-nav-dropdown-panel],
    [data-nav-dropdown]:focus-within > [data-nav-dropdown-panel],
    header nav li.group:hover > ul,
    header nav .group:hover > ul,
    header nav li.has-submenu:hover > ul,
    header nav li.has-submenu:focus-within > ul,
    header nav li[data-nav-dropdown]:hover > ul,
    header nav li[data-nav-dropdown]:focus-within > ul,
    [data-nav-dropdown-panel][data-open="true"] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    [data-nav-dropdown][data-submenu-suppressed="true"] > [data-nav-dropdown-panel],
    header nav li.has-submenu[data-submenu-suppressed="true"] > ul,
    header nav li.group[data-submenu-suppressed="true"] > ul {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  }
  @keyframes redesign-ticker {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(-50%, 0, 0); }
  }
  [class*="ticker"],
  .ticker-track {
    overflow: hidden !important;
  }
  [class*="marquee"] > *,
  [class*="ticker"] > *,
  .ticker-track {
    animation: redesign-ticker 32s linear infinite !important;
    will-change: transform;
    backface-visibility: hidden;
    white-space: nowrap;
  }
  [class*="marquee"]:hover > *,
  [class*="ticker"]:hover > *,
  .ticker-track:hover {
    animation-play-state: paused !important;
  }
  .ai-redesign-section [class*="animate-pulse"],
  .ai-redesign-section [class*="animate-bounce"],
  .ai-redesign-section [class*="animate-ping"],
  .ai-redesign-section [class*="blink"] {
    animation: none !important;
    opacity: 1 !important;
  }
  .hero-slide { opacity: 0; transition: opacity 0.7s ease; position: absolute; inset: 0; }
  .hero-slide.active { opacity: 1; z-index: 1; }
  .ai-redesign-section a.fixed[href*="wa.me"],
  .ai-redesign-section a.fixed[href*="whatsapp"],
  .ai-redesign-section a.fixed[href^="tel:"],
  .ai-redesign-section div.fixed[class*="bottom-"]:has(a[href*="wa.me"]),
  .ai-redesign-section div.fixed[class*="bottom-"]:has(a[href^="tel:"]) {
    display: none !important;
  }
`;

export function createRedesignPreviewInteractions() {
  const bound = new WeakSet<EventTarget>();

  function bindOnce(el: EventTarget, key: string, handler: EventListener) {
  const marker = `${key}-bound`;
  if ((el as HTMLElement & Record<string, boolean>)[marker]) return;
  (el as HTMLElement & Record<string, boolean>)[marker] = true;
  el.addEventListener("click", handler);
  }

  function scoreLabelMatch(a: string, b: string) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (!x || !y) return 0;
  if (x === y || x.includes(y) || y.includes(x)) return 8;
  const xw = x.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const yw = y.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  let hits = 0;
  for (const w of xw) if (yw.includes(w)) hits += 1;
  return hits;
  }

  function isChromeSectionLabel(label: string, id = "") {
  return /header|footer|topbar|top-bar|utility|news|ticker|announcement|notice|marquee|hero|banner|slider|top-fold|topfold|session-bar|navigation bar|nav bar/i.test(
    `${id} ${label}`.toLowerCase(),
  );
  }

  function suppressNavDropdown(item: HTMLElement | null) {
    item?.setAttribute("data-submenu-suppressed", "true");
  }

  function releaseNavDropdown(item: HTMLElement | null) {
    item?.removeAttribute("data-submenu-suppressed");
  }

  function openNavDropdown(panel: HTMLElement) {
  const owner = panel.closest<HTMLElement>("[data-nav-dropdown], header nav li.has-submenu, header nav li.group");
  releaseNavDropdown(owner);
  panel.setAttribute("data-open", "true");
  panel.classList.remove("hidden", "invisible", "opacity-0");
  panel.style.display = "block";
  panel.style.visibility = "visible";
  panel.style.opacity = "1";
  panel.style.pointerEvents = "auto";
  }

  function closeNavDropdown(panel: HTMLElement) {
  panel.setAttribute("data-open", "false");
  panel.style.display = "none";
  panel.style.visibility = "hidden";
  panel.style.opacity = "0";
  panel.style.pointerEvents = "none";
  panel.classList.add("hidden");
  }

  function closeAllNavDropdowns(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-nav-dropdown-panel], header nav li > ul").forEach((panel) => {
    closeNavDropdown(panel);
  });
  root.querySelectorAll<HTMLElement>("[data-nav-dropdown], header nav li.has-submenu, header nav li.group").forEach((item) => {
    suppressNavDropdown(item);
  });
  }

  function prepNavDropdowns(root: ParentNode) {
  if (!window.matchMedia("(min-width: 768px)").matches) return;
  root.querySelectorAll<HTMLElement>("[data-nav-dropdown-panel], header nav li > ul").forEach((panel) => {
    panel.classList.remove("hidden", "invisible", "opacity-0");
    panel.style.removeProperty("display");
    panel.style.removeProperty("visibility");
    panel.style.removeProperty("opacity");
  });
  }

  function bindHoverSubmenu(item: HTMLElement, panel: HTMLElement) {
  const marker = "hover-submenu-bound";
  if ((item as HTMLElement & Record<string, boolean>)[marker]) return;
  (item as HTMLElement & Record<string, boolean>)[marker] = true;

  item.addEventListener("mouseenter", () => {
    releaseNavDropdown(item);
    panel.style.removeProperty("display");
    panel.style.removeProperty("visibility");
    panel.style.removeProperty("opacity");
    panel.style.removeProperty("pointer-events");
    panel.classList.remove("hidden", "invisible", "opacity-0");
  });

  // Desktop: CSS :hover opens; mouseleave + click handlers close.
  if (window.matchMedia("(min-width: 768px)").matches) {
    item.addEventListener("mouseleave", () => closeNavDropdown(panel));
    panel.addEventListener("mouseleave", () => closeNavDropdown(panel));
    return;
  }

  let closeTimer: number | null = null;
  const cancelClose = () => {
    if (closeTimer !== null) window.clearTimeout(closeTimer);
    closeTimer = null;
  };
  const onEnter = () => {
    cancelClose();
    openNavDropdown(panel);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer = window.setTimeout(() => closeNavDropdown(panel), 300);
  };

  item.addEventListener("mouseenter", onEnter);
  item.addEventListener("mouseleave", scheduleClose);
  panel.addEventListener("mouseenter", onEnter);
  panel.addEventListener("mouseleave", scheduleClose);
  }

  function syncHeroDots(dots: HTMLElement[], activeIdx: number) {
  dots.forEach((dot, i) => {
    const on = i === activeIdx;
    dot.setAttribute("data-active", on ? "true" : "false");
    dot.setAttribute("aria-current", on ? "true" : "false");
    dot.classList.toggle("active", on);
    if (on) {
      dot.style.opacity = "1";
      dot.style.transform = "scale(1.2)";
      dot.style.backgroundColor = "#ea580c";
    } else {
      dot.style.opacity = "0.45";
      dot.style.transform = "scale(1)";
      dot.style.backgroundColor = "rgba(255,255,255,0.5)";
    }
  });
  }

  function activateHeroSlides(slides: HTMLElement[], activeIdx: number) {
  slides.forEach((slide, i) => {
    const on = i === activeIdx;
    const slider = slide.closest("[data-hero-slider]");
    slide.classList.toggle("active", on);
    slide.classList.toggle("hidden", !on);
    if (slider) {
      slide.style.position = "absolute";
      slide.style.inset = "0";
      slide.style.width = "100%";
      slide.style.display = on ? "block" : "none";
      slide.style.visibility = on ? "visible" : "hidden";
      slide.style.removeProperty("opacity");
    } else {
      slide.style.opacity = on ? "1" : "0";
    }
    slide.style.pointerEvents = on ? "auto" : "none";
    slide.style.zIndex = on ? "2" : "0";
    slide.setAttribute("data-active", on ? "true" : "false");
  });
  }

  function clearHeroSliderTimer(host: HTMLElement) {
  const timer = heroSliderTimers.get(host);
  if (timer != null) window.clearInterval(timer);
  heroSliderTimers.delete(host);
  host.removeAttribute("data-slider-timer");
  }

  function findHeroSlides(host: HTMLElement): HTMLElement[] {
  if (host.matches("[data-hero-slider]")) {
    const direct = [...host.children].filter(
      (c): c is HTMLElement =>
        c instanceof HTMLElement &&
        (c.classList.contains("hero-slide") ||
          c.hasAttribute("data-hero-slide") ||
          /\bmin-h-\[/.test(c.className) ||
          c.querySelector("h1,h2")),
    );
    if (direct.length >= 2) return direct;
  }

  let slides = [...host.querySelectorAll<HTMLElement>(":scope > .hero-slide, :scope > [data-hero-slide]")];
  if (slides.length >= 2) return slides;

  slides = [...host.querySelectorAll<HTMLElement>(".hero-slide, [data-hero-slide]")];
  if (slides.length >= 2) return slides;

  const absoluteSlides = [...host.querySelectorAll<HTMLElement>('[class*="absolute"][class*="inset"]')].filter(
    (s) => s.closest('[class*="relative"]') && (s.querySelector("img") || s.querySelector("h1")),
  );
  if (absoluteSlides.length >= 2) return absoluteSlides;

  const track = host.querySelector<HTMLElement>('[class*="relative"][class*="overflow"]');
  if (track && track.children.length >= 2) {
    slides = [...track.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    if (slides.length >= 2) return slides;
  }
  return [];
  }

  function findHeroDots(host: HTMLElement): HTMLElement[] {
  const marked = [...host.querySelectorAll<HTMLElement>("[data-hero-dot]")];
  if (marked.length >= 2) return marked;

  const byParent = new Map<HTMLElement, HTMLElement[]>();
  [...host.querySelectorAll<HTMLElement>("button, span, div")].forEach((el) => {
    if (!/\brounded-full\b/.test(el.className || "")) return;
    const w = el.offsetWidth;
    if (w <= 0 || w > 28) return;
    const parent = el.parentElement;
    if (!parent) return;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(el);
  });
  let best: HTMLElement[] = [];
  for (const group of byParent.values()) {
    if (group.length > best.length) best = group;
  }
  return best.length >= 2 ? best : [];
  }

  function wireHeroSlider(host: HTMLElement, slidesIn?: HTMLElement[], dotsIn?: HTMLElement[]) {
  if (host.getAttribute("data-slider-ready") === "true") return;
  const slides = slidesIn?.length ? slidesIn : findHeroSlides(host);
  if (slides.length < 2) return;
  if (slides.some((slide) => slide.closest("[data-slider-ready='true']"))) return;

  host.setAttribute("data-slider-ready", "true");
  clearHeroSliderTimer(host);

  const dots = dotsIn?.length ? dotsIn : findHeroDots(host);

  slides.forEach((s) => {
    if (!s.classList.contains("hero-slide")) s.classList.add("hero-slide");
  });
  dots.forEach((d) => d.setAttribute("data-hero-dot", "true"));

  let idx = slides.findIndex((s) => s.classList.contains("active") || s.getAttribute("data-active") === "true");
  if (idx < 0) idx = 0;
  activateHeroSlides(slides, idx);
  if (dots.length) syncHeroDots(dots, idx);

  const go = (next: number) => {
    idx = (next + slides.length) % slides.length;
    activateHeroSlides(slides, idx);
    if (dots.length) syncHeroDots(dots, idx);
  };

  let autoPaused = false;
  const pauseAuto = () => {
    autoPaused = true;
    clearHeroSliderTimer(host);
  };

  const manualGo = (next: number) => {
    pauseAuto();
    go(next);
  };

  host.querySelectorAll<HTMLElement>("[data-hero-prev]").forEach((btn) => {
    bindOnce(btn, "prev", (e) => {
      e.preventDefault();
      manualGo(idx - 1);
    });
  });
  host.querySelectorAll<HTMLElement>("[data-hero-next]").forEach((btn) => {
    bindOnce(btn, "next", (e) => {
      e.preventDefault();
      manualGo(idx + 1);
    });
  });
  dots.forEach((dot, i) => {
    bindOnce(dot, `dot-${i}`, (e) => {
      e.preventDefault();
      manualGo(i);
    });
  });

  const timer = window.setInterval(() => {
    if (!autoPaused) go(idx + 1);
  }, HERO_SLIDER_AUTO_MS);
  heroSliderTimers.set(host, timer);
  host.setAttribute("data-slider-timer", String(timer));
  host.addEventListener(
    "mouseenter",
    () => {
      pauseAuto();
    },
    { once: true },
  );
  }

  function wireHeroSliders(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-hero-slider]").forEach((slider) => wireHeroSlider(slider));
  }

  function tabFallbackCopy(label: string) {
  const name = (label || "").replace(/\s+/g, " ").trim();
  const lower = name.toLowerCase();
  if (/pre.?primary|nursery|kg|play/i.test(lower)) {
    return {
      title: name || "Pre-Primary",
      body: "A joyful start to schooling with play-based learning, phonics, activity corners and caring teachers who nurture curiosity in every child.",
      points: ["Play-based curriculum", "Phonics & early literacy", "Safe activity spaces", "Caring mentors"],
    };
  }
  if (/primary/i.test(lower)) {
    return {
      title: name || "Primary",
      body: "Strong foundations in language, mathematics and environmental studies through interactive classrooms, projects and continuous assessment.",
      points: ["Concept-based learning", "Smart classrooms", "Activity & art periods", "Value education"],
    };
  }
  if (/middle/i.test(lower)) {
    return {
      title: name || "Middle",
      body: "Students explore sciences, languages and humanities with labs, clubs and guided mentoring that builds confidence for higher classes.",
      points: ["Science & computer labs", "Clubs & competitions", "Language skills", "Life skills"],
    };
  }
  if (/sr\.?\s*secondary|senior/i.test(lower)) {
    return {
      title: name || "Sr. Secondary",
      body: "Focused ISC pathways with subject choices, career counselling and board-exam readiness supported by experienced faculty.",
      points: ["ISC streams", "Career counselling", "Board exam focus", "Research projects"],
    };
  }
  if (/secondary/i.test(lower)) {
    return {
      title: name || "Secondary",
      body: "ICSE-aligned academics with rigorous subject teaching, lab work and co-scholastic programmes that prepare students for board excellence.",
      points: ["ICSE curriculum", "Lab practicals", "Sports & arts", "Exam mentoring"],
    };
  }
  return {
    title: name || "Programme",
    body: `${name} at our school combines experienced faculty, modern facilities and a balanced focus on academics, values and holistic growth.`,
    points: ["Experienced faculty", "Modern facilities", "Holistic growth", "Student mentoring"],
  };
  }

  function fillEmptyTabPanel(panel: HTMLElement, label: string) {
  const text = (panel.textContent || "").replace(/\s+/g, " ").trim();
  if (text.length > 40 || panel.querySelector("img, p, li, h2, h3, h4")) return;
  const copy = tabFallbackCopy(label);
  panel.innerHTML = `<div class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
  <p class="text-xs font-bold uppercase tracking-wider text-orange-600">${copy.title}</p>
  <h3 class="mt-2 text-xl font-bold text-stone-900 md:text-2xl">${copy.title} Programme</h3>
  <p class="mt-3 text-sm leading-7 text-stone-600 md:text-base">${copy.body}</p>
  <ul class="mt-5 grid gap-2 sm:grid-cols-2">${copy.points
    .map(
      (point) =>
        `<li class="flex items-start gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700"><span class="mt-0.5 text-orange-600">✓</span><span>${point}</span></li>`,
    )
    .join("")}</ul>
</div>`;
  }

  function ensureTabPanels(bar: HTMLElement, buttons: HTMLElement[]) {
  let panelWrap = bar.nextElementSibling as HTMLElement | null;

  // Prefer an existing panels wrapper right under the tab bar.
  if (
    panelWrap &&
    ((panelWrap.querySelectorAll("[data-tab-panel], [role='tabpanel']").length > 0) ||
      panelWrap.children.length >= buttons.length)
  ) {
    // ok
  } else {
    panelWrap = document.createElement("div");
    panelWrap.setAttribute("data-tab-panels", "true");
    panelWrap.className = "mt-8 w-full";
    bar.insertAdjacentElement("afterend", panelWrap);
  }

  let panels = [
    ...panelWrap.querySelectorAll<HTMLElement>(":scope > [data-tab-panel], :scope > [role='tabpanel']"),
  ];
  if (panels.length < buttons.length) {
    panels = [...panelWrap.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
  }

  while (panels.length < buttons.length) {
    const panel = document.createElement("div");
    panel.setAttribute("data-tab-panel", String(panels.length));
    panel.setAttribute("role", "tabpanel");
    panel.className = "w-full";
    panelWrap.appendChild(panel);
    panels.push(panel);
  }

  panels = panels.slice(0, buttons.length);
  panels.forEach((panel, i) => {
    const label = (buttons[i].textContent || "").replace(/\s+/g, " ").trim();
    panel.setAttribute("data-tab-panel", String(i));
    panel.setAttribute("role", "tabpanel");
    fillEmptyTabPanel(panel, label);
  });

  return panels;
  }

  function wireTabTriggers(triggers: HTMLElement[], panels: HTMLElement[]) {
  if (triggers.length < 2 || !panels.length) return;

  const list = panels.slice(0, triggers.length);
  while (list.length < triggers.length) list.push(list[list.length - 1]);

  const activate = (idx: number) => {
    const safe = Math.max(0, Math.min(idx, list.length - 1));
    triggers.forEach((trigger, i) => {
      const on = i === safe;
      trigger.setAttribute("aria-selected", on ? "true" : "false");
      trigger.setAttribute("data-active", on ? "true" : "false");
      if (on) {
        trigger.classList.add("text-white");
        trigger.style.backgroundColor = trigger.style.backgroundColor || "";
      }
    });
    list.forEach((panel, i) => {
      const show = i === safe;
      panel.setAttribute("data-tab-active", show ? "true" : "false");
      panel.hidden = !show;
      panel.classList.toggle("hidden", !show);
      panel.style.display = show ? "block" : "none";
      panel.style.visibility = show ? "visible" : "hidden";
      if (show) {
        panel.style.minHeight = "8rem";
      }
    });
  };

  triggers.forEach((trigger, i) => {
    trigger.setAttribute("data-tab-trigger", String(i));
    trigger.setAttribute("role", "tab");
    bindOnce(trigger, `tab-${i}`, (e) => {
      e.preventDefault();
      e.stopPropagation();
      activate(i);
    });
  });
  activate(0);
  }

  /** Interactive before/after compare — only the small mockup frame, never a whole section. */
  function wireBeforeAfterSliders(root: ParentNode) {
    // Undo a previous bad wire that blew the overlay across the page.
    root.querySelectorAll<HTMLElement>("[data-before-after]").forEach((host) => {
      const rect = host.getBoundingClientRect();
      const bad =
        host.matches("section, header, footer") ||
        rect.width > 920 ||
        rect.height > 560 ||
        host.querySelectorAll("img").length > 4;
      if (!bad && host.dataset.beforeAfterWired === "1") return;
      host.removeAttribute("data-before-after");
      delete host.dataset.beforeAfterWired;
      host.querySelectorAll("[data-before-after-handle], [data-before-after-range]").forEach((n) => n.remove());
      host.querySelectorAll("img").forEach((img) => {
        img.removeAttribute("style");
        if (img.hasAttribute("")) img.removeAttribute("");
      });
      const ov = host.querySelector<HTMLElement>("[data-before-after-overlay]");
      if (ov) {
        ov.style.width = "";
        ov.style.height = "";
      }
    });

    const hosts = new Set<HTMLElement>();

    const consider = (host: HTMLElement | null) => {
      if (!host || !(host instanceof HTMLElement)) return;
      if (host.matches("section, header, footer, body, html")) return;
      if (host.querySelector("[data-hero-slider], [data-mobile-menu], header, footer")) return;
      const imgs = host.querySelectorAll("img");
      if (imgs.length < 2 || imgs.length > 4) return;
      const text = (host.textContent || "").toLowerCase();
      if (!/\bbefore\b/.test(text) || !/\bafter\b/.test(text)) return;
      // Reject giant wrappers (was exploding the CW logo across the viewport).
      const rect = host.getBoundingClientRect();
      if (rect.width > 920 || rect.height > 560 || rect.height < 120) return;
      hosts.add(host);
    };

    root.querySelectorAll<HTMLElement>("[data-before-after]").forEach((el) => consider(el));

    root.querySelectorAll<HTMLElement>("div").forEach((box) => {
      const cls = (typeof box.className === "string" ? box.className : "").toLowerCase();
      if (!/absolute/.test(cls)) return;
      if (!/(w-1\/2|w-\[50|left-0|inset-y)/.test(cls)) return;
      if (!box.querySelector("img")) return;
      consider(box.parentElement);
    });

    hosts.forEach((host) => {
      if (host.dataset.beforeAfterWired === "1") return;

      // Prefer existing half-width absolute overlay; else second image.
      let overlay =
        [...host.querySelectorAll<HTMLElement>(":scope > div")].find((d) => {
          const cls = (typeof d.className === "string" ? d.className : "").toLowerCase();
          return /absolute/.test(cls) && d.querySelector("img");
        }) || null;

      const imgs = [...host.querySelectorAll<HTMLImageElement>(":scope > img, :scope > div > img")];
      const baseImg =
        host.querySelector<HTMLImageElement>(":scope > img") ||
        imgs.find((img) => !overlay?.contains(img)) ||
        imgs[0];

      if (!overlay && imgs.length >= 2) {
        overlay = document.createElement("div");
        const clone = (imgs[1].cloneNode(true) as HTMLImageElement);
        if (clone.hasAttribute("")) clone.removeAttribute("");
        clone.setAttribute("loading", "lazy");
        overlay.appendChild(clone);
        imgs[1].style.display = "none";
        host.appendChild(overlay);
      }
      if (!overlay || !baseImg) return;

      // Reset any previous runaway inline sizes from a bad wire pass.
      overlay.querySelectorAll("img").forEach((img) => {
        img.removeAttribute("style");
        if (img.hasAttribute("")) img.removeAttribute("");
        img.setAttribute("loading", "lazy");
      });
      baseImg.removeAttribute("style");
      baseImg.setAttribute("data-before-after-base", "true");
      if (baseImg.hasAttribute("")) baseImg.removeAttribute("");

      overlay.setAttribute("data-before-after-overlay", "true");
      // Drop Tailwind half-width classes that fight the slider.
      overlay.className = (overlay.className || "")
        .toString()
        .replace(/\bw-1\/2\b/g, "")
        .replace(/\bw-\[50%[^\]]*\]/g, "")
        .replace(/\bborder-r-2\b/g, "")
        .trim();

      host.setAttribute("data-before-after", "true");
      host.dataset.beforeAfterWired = "1";
      host.style.position = "relative";
      host.style.overflow = "hidden";

      let range = host.querySelector<HTMLInputElement>("[data-before-after-range], input[type='range']");
      if (!range) {
        range = document.createElement("input");
        range.type = "range";
        range.min = "0";
        range.max = "100";
        range.value = "50";
        range.setAttribute("data-before-after-range", "true");
        range.setAttribute("aria-label", "Before and after comparison");
        host.appendChild(range);
      } else {
        range.setAttribute("data-before-after-range", "true");
      }

      let handle = host.querySelector<HTMLElement>("[data-before-after-handle]");
      if (!handle) {
        handle = document.createElement("div");
        handle.setAttribute("data-before-after-handle", "true");
        handle.setAttribute("aria-hidden", "true");
        handle.textContent = "⟷";
        host.appendChild(handle);
      }

      const syncHostWidth = () => {
        const w = Math.round(host.getBoundingClientRect().width || host.clientWidth || 0);
        if (w > 0) host.style.setProperty("--ba-host-w", `${w}px`);
      };

      const apply = (pct: number) => {
        const safe = Math.max(4, Math.min(96, pct));
        syncHostWidth();
        overlay!.style.width = `${safe}%`;
        handle!.style.left = `${safe}%`;
        range!.value = String(Math.round(safe));
      };

      apply(50);
      range.addEventListener("input", () => apply(Number(range!.value) || 50));
      range.addEventListener("change", () => apply(Number(range!.value) || 50));
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(() => apply(Number(range!.value) || 50)).observe(host);
      }
    });
  }

  /** Fix AI typo <img ="lazy" …> and dead blog/card thumbs. */
  function fixBrokenMedia(root: ParentNode) {
    const pool = [
      ...root.querySelectorAll<HTMLImageElement>("img[src]"),
    ]
      .map((img) => img.getAttribute("src") || "")
      .filter(
        (src) =>
          src &&
          !/sol-cion|whatsapp|facebook|twitter|logo|icon|svg|pixel|1x1/i.test(src) &&
          /\.(jpe?g|png|webp|gif)(\?|$)/i.test(src),
      );

    root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (img.hasAttribute("")) img.removeAttribute("");
      const raw = img.outerHTML;
      if (/img\s+=/.test(raw) || !img.getAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }
      // Broken/empty src or failed load → swap to a real content photo.
      const src = (img.getAttribute("src") || "").trim();
      const looksBroken =
        !src ||
        src === "#" ||
        /sol-cion|whatsapp\.png$/i.test(src) ||
        img.naturalWidth === 0 && img.complete && src.length > 0;

      const inCard =
        Boolean(img.closest("article, a.group, .group, [class*='blog'], [class*='card']")) &&
        /h-\[|h-40|h-44|h-48|h-52|object-cover|w-full/i.test(img.className || "");

      if (inCard) {
        img.addEventListener(
          "error",
          () => {
            const alt = (img.getAttribute("alt") || "").toLowerCase();
            const fallback =
              pool.find((u) => u !== src && !/clent-logo|logo/i.test(u)) ||
              pool[0];
            if (fallback && img.getAttribute("src") !== fallback) {
              img.setAttribute("src", fallback);
              img.style.objectFit = "cover";
              img.style.background = "#0b1220";
            } else {
              img.style.display = "none";
              const fig = img.parentElement;
              if (fig && !fig.querySelector("[data-img-fallback]")) {
                const ph = document.createElement("div");
                ph.setAttribute("data-img-fallback", "true");
                ph.className = "flex h-[190px] w-full items-center justify-center bg-slate-800 text-sm text-white/60";
                ph.textContent = alt || "Image";
                fig.appendChild(ph);
              }
            }
          },
          { once: true },
        );
      }

      if (looksBroken && inCard && pool.length) {
        const fallback = pool.find((u) => u !== src) || pool[0];
        if (fallback) img.setAttribute("src", fallback);
      }
    });
  }

  function wireCardCarousels(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("section, .ai-redesign-section, [data-section-id]").forEach((section) => {
    if (!(section instanceof HTMLElement) || section.dataset.carouselWired) return;
    const prev =
      section.querySelector<HTMLElement>("[data-carousel-prev], [data-hero-prev], button[aria-label*='prev' i]") ||
      [...section.querySelectorAll<HTMLElement>("button")].find((b) => /^[‹<←]$/.test((b.textContent || "").trim()));
    const next =
      section.querySelector<HTMLElement>("[data-carousel-next], [data-hero-next], button[aria-label*='next' i]") ||
      [...section.querySelectorAll<HTMLElement>("button")].find((b) => /^[›>→]$/.test((b.textContent || "").trim()));
    if (!prev && !next) return;
    if (section.querySelector("[data-hero-slider]")) return;

    const track =
      section.querySelector<HTMLElement>("[data-carousel-track], .overflow-x-auto, .overflow-hidden") ||
      [...section.querySelectorAll<HTMLElement>("div")].find((d) => {
        const kids = [...d.children].filter((c) => c instanceof HTMLElement);
        return kids.length >= 3 && /\bgrid\b|\bflex\b/.test(d.className);
      });
    if (!track) return;

    const cards = [...track.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    if (cards.length < 2) return;

    section.dataset.carouselWired = "true";
    let idx = 0;
    const pageSize = Math.max(1, Math.min(3, Math.floor(cards.length / 2) || 1));

    const show = () => {
      if (/\boverflow-x-auto\b|\boverflow-x-scroll\b/.test(track.className) || track.scrollWidth > track.clientWidth + 20) {
        const target = cards[Math.min(idx, cards.length - 1)];
        target?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        return;
      }
      cards.forEach((card, i) => {
        const on = i >= idx && i < idx + pageSize;
        card.style.display = on ? "" : "none";
      });
    };

    if (prev) {
      bindOnce(prev, "carousel-prev", (e) => {
        e.preventDefault();
        idx = Math.max(0, idx - pageSize);
        show();
      });
    }
    if (next) {
      bindOnce(next, "carousel-next", (e) => {
        e.preventDefault();
        idx = Math.min(Math.max(0, cards.length - pageSize), idx + pageSize);
        show();
      });
    }
    show();
  });
  }

  function wireSectionTabs(root: ParentNode) {
  const wireGroup = (scope: HTMLElement, triggers: HTMLElement[], panelsIn: HTMLElement[]) => {
    if (scope.dataset.tabsWired === "true") return;
    let panels = panelsIn;
    if (panels.length < triggers.length) {
      const bar =
        triggers[0].parentElement && triggers.every((t) => t.parentElement === triggers[0].parentElement)
          ? triggers[0].parentElement!
          : scope;
      panels = ensureTabPanels(bar, triggers);
    } else {
      panels.forEach((panel, i) => {
        fillEmptyTabPanel(panel, (triggers[i]?.textContent || "").trim());
      });
    }
    wireTabTriggers(triggers, panels);
    scope.dataset.tabsWired = "true";
  };

  root.querySelectorAll<HTMLElement>("[data-tab-group]").forEach((group) => {
    const triggers = [...group.querySelectorAll<HTMLElement>("[data-tab-trigger], [role='tab']")];
    const panels = [...group.querySelectorAll<HTMLElement>("[data-tab-panel], [role='tabpanel']")];
    if (triggers.length >= 2) wireGroup(group, triggers, panels);
  });

  root.querySelectorAll<HTMLElement>(".ai-redesign-section, section, [data-section-id]").forEach((section) => {
    if (!(section instanceof HTMLElement) || section.dataset.tabsWired === "true") return;

    const explicitTriggers = [...section.querySelectorAll<HTMLElement>("[data-tab-trigger], [data-tab], [role='tab']")];
    const explicitPanels = [...section.querySelectorAll<HTMLElement>("[data-tab-panel], [role='tabpanel']")];
    if (explicitTriggers.length >= 2) {
      wireGroup(section, explicitTriggers, explicitPanels);
      return;
    }

    for (const bar of section.querySelectorAll<HTMLElement>("div, nav")) {
      const buttons = [...bar.querySelectorAll<HTMLElement>(":scope > button")].filter(
        (b) => (b.textContent || "").replace(/\s+/g, " ").trim().length > 1,
      );
      if (buttons.length < 3 || buttons.length > 10) continue;
      if (!/\bflex\b|\bgrid\b|\bgap-/.test(bar.className)) continue;
      // Likely programme / class tabs (not random button rows).
      const labels = buttons.map((b) => (b.textContent || "").toLowerCase()).join(" ");
      if (
        !/primary|middle|secondary|pre|nursery|kg|class|grade|programme|program|tab/i.test(
          `${labels} ${section.textContent?.slice(0, 200) || ""}`,
        ) &&
        buttons.length < 4
      ) {
        continue;
      }

      const panels = ensureTabPanels(bar, buttons);
      buttons.forEach((b, i) => b.setAttribute("data-tab-trigger", String(i)));
      wireTabTriggers(buttons, panels);
      section.dataset.tabsWired = "true";
      break;
    }
  });
  }

  function prepMobileMenus(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-mobile-menu]").forEach((menu) => {
    menu.dataset.mobileMenuPrepped = "true";
    menu.setAttribute("data-open", "false");
    menu.classList.add("hidden");
    menu.style.display = "none";
  });
  }

  function cleanNavLabel(raw: string) {
  return (raw || "")
    .replace(/\s+/g, " ")
    .replace(/[▾▴▼▲∨∧▼︎▼︎+\-−–—›‹<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  }

  function getDesktopNav(root: ParentNode) {
  return (
    root.querySelector<HTMLElement>("header nav[data-redesign-main-nav]") ||
    root.querySelector<HTMLElement>("header nav:not([data-mobile-menu])")
  );
  }

  function collectDesktopNavTree(root: ParentNode) {
  const desktopNav = getDesktopNav(root);
  type NavNode = {
    label: string;
    href: string;
    children: Array<{ label: string; href: string }>;
  };
  const items: NavNode[] = [];
  if (!desktopNav) return items;

  const pushUnique = (node: NavNode) => {
    const key = node.label.toLowerCase();
    if (!key || items.some((i) => i.label.toLowerCase() === key)) return;
    items.push(node);
  };

  // Prefer structured top-level items from the desktop nav.
  const topCandidates = [
    ...desktopNav.querySelectorAll<HTMLElement>(":scope > a"),
    ...desktopNav.querySelectorAll<HTMLElement>(":scope > [data-nav-dropdown]"),
    ...desktopNav.querySelectorAll<HTMLElement>(":scope > li"),
    ...desktopNav.querySelectorAll<HTMLElement>(":scope > div > a"),
    ...desktopNav.querySelectorAll<HTMLElement>(":scope > div > [data-nav-dropdown]"),
    ...desktopNav.querySelectorAll<HTMLElement>(":scope > ul > li"),
  ];

  const seen = new Set<HTMLElement>();
  topCandidates.forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);

    if (el.matches("a")) {
      const label = cleanNavLabel(el.textContent || "");
      if (label.length < 2 || label.length > 48) return;
      if (el.querySelector("img") && label.length < 3) return;
      pushUnique({
        label,
        href: el.getAttribute("href") || "#",
        children: [],
      });
      return;
    }

    const trigger =
      el.querySelector<HTMLElement>("[data-nav-dropdown-trigger]") ||
      el.querySelector<HTMLElement>(":scope > a, :scope > button, :scope > span");
    const panel =
      el.querySelector<HTMLElement>("[data-nav-dropdown-panel]") ||
      el.querySelector<HTMLElement>(":scope > ul");
    const label = cleanNavLabel(
      (trigger?.childNodes && [...trigger.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent || "")
        .join(" ")) ||
        trigger?.textContent ||
        el.textContent ||
        "",
    )
      .split(" ")
      .slice(0, 6)
      .join(" ");
    if (!label || label.length > 48) return;
    const children = panel
      ? [...panel.querySelectorAll<HTMLAnchorElement>("a")]
          .map((a) => ({
            label: cleanNavLabel(a.textContent || ""),
            href: a.getAttribute("href") || "#",
          }))
          .filter((c) => c.label.length >= 2 && c.label.toLowerCase() !== label.toLowerCase())
      : [];
    pushUnique({
      label,
      href: trigger instanceof HTMLAnchorElement ? trigger.getAttribute("href") || "#" : "#",
      children,
    });
  });

  return items.slice(0, 10);
  }

  function markDesktopOnlyChrome(root: ParentNode) {
  const header = root.querySelector("header");
  if (!header) return;
  // Any link stack in header that is not logo / mobile drawer / toggle → desktop only.
  header.querySelectorAll<HTMLElement>("nav, ul, div").forEach((el) => {
    if (el.closest("[data-mobile-menu]")) return;
    if (el.matches("[data-mobile-menu]")) return;
    if (el.querySelector("[data-mobile-menu-toggle]")) return;
    const links = [...el.querySelectorAll(":scope > a, :scope > li > a")];
    if (links.length < 3) return;
    const texts = links.map((a) => (a.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean);
    if (texts.length < 3) return;
    // Looks like a menu list sitting open in the header.
    el.setAttribute("data-redesign-desktop-only", "true");
    if (el.tagName === "NAV" && !el.hasAttribute("data-redesign-main-nav")) {
      el.setAttribute("data-redesign-main-nav", "true");
    }
  });
  // Fake mobile accordion blocks AI sometimes dumps under header.
  header.querySelectorAll<HTMLElement>("details").forEach((d) => {
    d.removeAttribute("open");
    d.setAttribute("data-redesign-desktop-only", "true");
  });
  }

  function getHeaderChromeRow(header: HTMLElement): HTMLElement {
    return (
      header.querySelector<HTMLElement>("[data-redesign-nav-sticky]") ||
      header.querySelector<HTMLElement>("a:has(img)")?.parentElement ||
      header.querySelector<HTMLElement>("[data-redesign-main-nav]")?.parentElement ||
      header.querySelector<HTMLElement>("div:has(> nav:not([data-mobile-menu]))") ||
      header.querySelector<HTMLElement>("nav:not([data-mobile-menu])")?.parentElement ||
      header
    );
  }

  function looksLikeMobileMenuToggle(btn: HTMLElement): boolean {
    if (btn.closest("[data-nav-dropdown], [data-mobile-menu]")) return false;
    if (btn.matches("[data-mobile-menu-toggle]")) return true;
    const label = (
      btn.getAttribute("aria-label") ||
      btn.getAttribute("title") ||
      btn.getAttribute("aria-labelledby") ||
      ""
    ).toLowerCase();
    if (/menu|nav|toggle|hamburger|drawer|bars/.test(label)) return true;
    const cls = (typeof btn.className === "string" ? btn.className : "").toLowerCase();
    if (/hamburger|menu-toggle|nav-toggle|navbar-toggler|mobile-nav/.test(cls)) return true;
    if (/\b(lg|md|sm|xl):hidden\b/.test(cls) && btn.closest("header") && btn.querySelector("svg")) {
      const t = (btn.textContent || "").replace(/\s+/g, "").trim();
      if (t.length <= 12) return true;
    }
    const text = (btn.textContent || "").replace(/\s+/g, "").trim();
    if (text === "☰" || /☰|≡|☷/.test(text)) return true;
    if (btn.querySelector("svg") && text.length <= 2) return true;
    // CSS bar hamburger: 2–4 empty thin line spans/divs
    const bars = [...btn.querySelectorAll(":scope > span, :scope > i, :scope > div, :scope > b")].filter(
      (el) => el instanceof HTMLElement && el.children.length === 0,
    );
    if (bars.length >= 2 && bars.length <= 4 && text.length <= 4) {
      const barish = bars.filter((el) => {
        const c = (typeof el.className === "string" ? el.className : "").toLowerCase();
        return /h-0\.5|h-1\b|h-\[|w-4|w-5|w-6|w-7|bg-|rounded|block/.test(c);
      });
      if (barish.length >= 2) return true;
    }
    return false;
  }

  function fallbackMobileNavTree(root: ParentNode) {
    type NavNode = {
      label: string;
      href: string;
      children: Array<{ label: string; href: string }>;
    };
    const items: NavNode[] = [];
    const seen = new Set<string>();
    root.querySelectorAll<HTMLElement>("[data-redesign-section-anchor], [data-section-id]").forEach((el) => {
      const label = (
        el.getAttribute("data-section-label") ||
        el.getAttribute("data-redesign-section-anchor") ||
        el.id ||
        ""
      )
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!label || label.length > 40 || isChromeSectionLabel(label, el.id)) return;
      const key = label.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ label, href: `#${el.id || el.getAttribute("data-section-id") || ""}`, children: [] });
    });
    if (items.length) return items;
    return [
      { label: "Home", href: "#", children: [] },
      { label: "About", href: "#", children: [] },
      { label: "Contact", href: "#", children: [] },
    ];
  }

  /** Rebuild mobile drawer from desktop tree — submenus always collapsed. */
  function rebuildMobileMenuFromDesktop(root: ParentNode) {
  markDesktopOnlyChrome(root);
  const header = root.querySelector("header");
  if (!header) return;

  // One drawer only — AI + injector used to leave two [data-mobile-menu] nodes.
  const menus = [...header.querySelectorAll<HTMLElement>("[data-mobile-menu]")];
  let mobile = menus[0] || null;
  menus.slice(1).forEach((el) => el.remove());

  const tree = collectDesktopNavTree(root);
  const navTree = tree.length ? tree : fallbackMobileNavTree(root);
  const chromeRow = getHeaderChromeRow(header);

  if (!mobile) {
    mobile = document.createElement("nav");
    mobile.setAttribute("data-mobile-menu", "main");
    header.appendChild(mobile);
  } else if (mobile.parentElement !== header && mobile.parentElement !== chromeRow) {
    header.appendChild(mobile);
  }

  // Prefer header-level drawer so left:0/right:0 spans full width (not a thin chrome column).
  if (mobile.parentElement !== header) {
    header.appendChild(mobile);
  }

  mobile.innerHTML = "";
  mobile.setAttribute("data-mobile-menu", mobile.getAttribute("data-mobile-menu") || "main");
  mobile.setAttribute("data-open", "false");
  mobile.className =
    "hidden absolute left-0 right-0 top-full z-[150] flex w-full max-h-[min(72vh,520px)] flex-col gap-0 overflow-y-auto border-t border-slate-100 bg-white px-3 py-2 shadow-lg lg:hidden";
  mobile.style.display = "none";

  navTree.forEach((item) => {
    if (item.children.length) {
      const wrap = document.createElement("div");
      wrap.setAttribute("data-mobile-submenu", "true");
      wrap.setAttribute("data-open", "false");
      wrap.className = "w-full border-b border-slate-100";
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.setAttribute("data-mobile-submenu-trigger", "true");
      trigger.setAttribute("aria-expanded", "false");
      trigger.className =
        "flex w-full items-center justify-between gap-2 px-2 py-3 text-left text-sm font-semibold text-slate-800";
      trigger.textContent = item.label;

      const panel = document.createElement("div");
      panel.setAttribute("data-mobile-submenu-panel", "true");
      panel.setAttribute("data-open", "false");
      panel.className = "hidden flex-col gap-0.5 pb-2 pl-3";
      panel.style.display = "none";

      item.children.forEach((child) => {
        const a = document.createElement("a");
        a.href = child.href;
        a.textContent = child.label;
        a.className = "block rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-50";
        if (child.href.startsWith("#") && child.href.length > 1) {
          a.setAttribute("data-redesign-scroll", child.href.slice(1));
        }
        panel.appendChild(a);
      });

      wrap.appendChild(trigger);
      wrap.appendChild(panel);
      mobile!.appendChild(wrap);
    } else {
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      a.className =
        "block border-b border-slate-100 px-2 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50";
      if (item.href.startsWith("#") && item.href.length > 1) {
        a.setAttribute("data-redesign-scroll", item.href.slice(1));
      }
      mobile!.appendChild(a);
    }
  });

  if (!header.querySelector("[data-mobile-menu-toggle]")) {
    const burger = document.createElement("button");
    burger.type = "button";
    burger.setAttribute("data-mobile-menu-toggle", mobile.getAttribute("data-mobile-menu") || "main");
    burger.setAttribute("aria-label", "Open menu");
    burger.setAttribute("aria-expanded", "false");
    burger.className =
      "ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-800 lg:hidden";
    burger.innerHTML = `<span class="text-xl leading-none" aria-hidden="true">☰</span>`;
    chromeRow.classList.add("relative");
    chromeRow.style.position = chromeRow.style.position || "relative";
    chromeRow.appendChild(burger);
  } else {
    const toggles = [...header.querySelectorAll<HTMLElement>("[data-mobile-menu-toggle]")];
    toggles.slice(1).forEach((el) => el.remove());
    toggles[0]?.classList.remove("md:hidden");
    toggles[0]?.classList.add("lg:hidden");
    chromeRow.classList.add("relative");
    chromeRow.style.position = chromeRow.style.position || "relative";
  }

  // Strip unmarked hamburger clones (AI SVG + our ☰) so wireMobileMenus keeps one.
  const keeperToggle = header.querySelector<HTMLElement>("[data-mobile-menu-toggle]");
  header.querySelectorAll<HTMLElement>("button, a[role='button'], [role='button']").forEach((btn) => {
    if (btn === keeperToggle) return;
    if (btn.closest("[data-mobile-menu]")) return;
    if (looksLikeMobileMenuToggle(btn)) btn.remove();
  });

  header.classList.add("relative");
  mobile.dataset.submenuSynced = "true";
  }

  function collapseMobileSubmenus(menu: HTMLElement) {
  menu.querySelectorAll<HTMLElement>("[data-mobile-submenu-panel], [data-nav-dropdown-panel]").forEach((panel) => {
    panel.setAttribute("data-open", "false");
    panel.classList.add("hidden");
    panel.style.display = "none";
  });
  menu.querySelectorAll<HTMLElement>("li.has-submenu, li.group, [data-nav-dropdown], [data-mobile-submenu]").forEach((item) => {
    item.setAttribute("data-open", "false");
  });
  menu.querySelectorAll<HTMLElement>("[data-mobile-submenu-trigger], [data-nav-dropdown-trigger]").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
  menu.querySelectorAll<HTMLElement>("li.has-submenu > ul, li.group > ul").forEach((ul) => {
    ul.setAttribute("data-open", "false");
    ul.classList.add("hidden");
    ul.style.display = "none";
  });
  }

  function wireMobileSubmenus(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-mobile-menu]").forEach((menu) => {
    collapseMobileSubmenus(menu);

    menu.querySelectorAll<HTMLElement>("[data-mobile-submenu]").forEach((item) => {
      const trigger = item.querySelector<HTMLElement>("[data-mobile-submenu-trigger]");
      const panel = item.querySelector<HTMLElement>("[data-mobile-submenu-panel]");
      if (!trigger || !panel) return;
      // Re-bind every init (menu was rebuilt).
      trigger.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = panel.getAttribute("data-open") === "true";
        collapseMobileSubmenus(menu);
        if (!open) {
          panel.setAttribute("data-open", "true");
          panel.classList.remove("hidden");
          panel.style.display = "flex";
          trigger.setAttribute("aria-expanded", "true");
          item.setAttribute("data-open", "true");
        }
      };
    });
  });
  }

  function toggleMobileMenu(menu: HTMLElement) {
  const open = menu.getAttribute("data-open") === "true";
  const nextOpen = !open;
  menu.setAttribute("data-open", nextOpen ? "true" : "false");
  menu.classList.toggle("hidden", !nextOpen);
  if (nextOpen) {
    menu.style.setProperty("display", "flex", "important");
    menu.style.setProperty("flex-direction", "column", "important");
    menu.style.setProperty("position", "fixed", "important");
    menu.style.setProperty("left", "0", "important");
    menu.style.setProperty("right", "0", "important");
    menu.style.setProperty("top", "0", "important");
    menu.style.setProperty("width", "100%", "important");
    menu.style.setProperty("max-width", "100%", "important");
    menu.style.setProperty("margin-top", "3.5rem", "important");
    menu.style.setProperty("z-index", "400", "important");
    menu.style.setProperty("background", "#fff", "important");
  } else {
    menu.style.display = "none";
    collapseMobileSubmenus(menu);
  }
  }

  function closeMobileMenus(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-mobile-menu][data-open='true']").forEach((menu) => {
    menu.setAttribute("data-open", "false");
    menu.classList.add("hidden");
    menu.style.display = "none";
    collapseMobileSubmenus(menu);
  });
  }

  function wireMobileMenus(root: ParentNode) {
  const header = root.querySelector("header");
  if (!header) return;

  header.classList.add("relative");
  header.style.position = "relative";

  const menus = [...header.querySelectorAll<HTMLElement>("[data-mobile-menu]")];
  let menu = menus[0] || root.querySelector<HTMLElement>("[data-mobile-menu]");
  menus.slice(1).forEach((el) => el.remove());

  if (!menu) {
    menu = document.createElement("nav");
    menu.setAttribute("data-mobile-menu", "main");
    menu.className =
      "hidden z-[400] flex w-full flex-col gap-0 overflow-y-auto border-t border-slate-100 bg-white px-3 py-2 shadow-lg";
    menu.style.display = "none";
    menu.setAttribute("data-open", "false");
    header.appendChild(menu);
  } else {
    // Full-width drawer must live on header — chromeRow made the thin left strip.
    header.appendChild(menu);
  }
  if (!menu.hasAttribute("data-mobile-menu")) menu.setAttribute("data-mobile-menu", "main");
  const menuId = menu.getAttribute("data-mobile-menu") || "main";

  const chromeRow = getHeaderChromeRow(header);
  chromeRow.classList.add("relative");

  const candidates: HTMLElement[] = [];
  const pushCandidate = (btn: HTMLElement | null) => {
    if (!btn || candidates.includes(btn)) return;
    if (btn.closest("[data-mobile-menu], [data-nav-dropdown], footer")) return;
    candidates.push(btn);
  };

  header.querySelectorAll<HTMLElement>("[data-mobile-menu-toggle]").forEach(pushCandidate);
  header.querySelectorAll<HTMLElement>("button, a[role='button'], [role='button']").forEach((btn) => {
    if (looksLikeMobileMenuToggle(btn)) pushCandidate(btn);
  });

  // Exactly ONE hamburger — mark keeper, remove the rest (was tagging all → 2 icons).
  let keeper =
    candidates.find((b) => b.hasAttribute("data-mobile-menu-toggle")) || candidates[0] || null;
  if (!keeper) {
    keeper = document.createElement("button");
    keeper.type = "button";
    keeper.className =
      "ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-800 lg:hidden";
    keeper.innerHTML = `<span class="text-xl leading-none" aria-hidden="true">☰</span>`;
    chromeRow.appendChild(keeper);
  }
  candidates.forEach((btn) => {
    if (btn === keeper) return;
    btn.remove();
  });
  keeper.setAttribute("data-mobile-menu-toggle", menuId);
  keeper.setAttribute("aria-controls", menuId);
  keeper.setAttribute("aria-label", keeper.getAttribute("aria-label") || "Open menu");
  keeper.setAttribute("aria-expanded", "false");
  keeper.classList.remove("md:hidden");
  if (!/\blg:hidden\b/.test(keeper.className)) {
    keeper.classList.add("lg:hidden");
  }

  // Document capture runs before Edit-mode section handlers — menu always toggles.
  const doc = document as Document & { redesignMobileMenuDelegated?: boolean };
  if (!doc.redesignMobileMenuDelegated) {
    doc.redesignMobileMenuDelegated = true;
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;
        let btn = target.closest<HTMLElement>("[data-mobile-menu-toggle]");
        if (!btn) {
          const candidate = target.closest<HTMLElement>("button, a, [role='button']");
          if (candidate?.closest("header") && looksLikeMobileMenuToggle(candidate)) {
            btn = candidate;
            btn.setAttribute("data-mobile-menu-toggle", "main");
          }
        }
        if (!btn) return;
        // Ignore stray toggles if any reappear — prefer first marked toggle.
        const allToggles = [...document.querySelectorAll<HTMLElement>("[data-mobile-menu-toggle]")];
        if (allToggles.length > 1 && btn !== allToggles[0] && !allToggles[0]?.contains(btn)) {
          allToggles.slice(1).forEach((el) => {
            if (el !== btn) el.remove();
          });
        }
        const id = btn.getAttribute("data-mobile-menu-toggle") || "main";
        const live =
          document.querySelector<HTMLElement>(`[data-mobile-menu="${id}"]`) ||
          document.querySelector<HTMLElement>("[data-mobile-menu]");
        if (!live) return;
        const hdr = document.querySelector("header");
        if (hdr && live.parentElement !== hdr) hdr.appendChild(live);
        event.preventDefault();
        event.stopPropagation();
        toggleMobileMenu(live);
        btn.setAttribute("aria-expanded", live.getAttribute("data-open") === "true" ? "true" : "false");
      },
      true,
    );
  }
  }

  function fixNewsTickers(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[class*='marquee'], [class*='ticker'], .ticker-track").forEach((track) => {
    track.querySelectorAll<HTMLElement>("*").forEach((el) => {
      el.classList.remove("animate-pulse", "animate-bounce", "animate-ping", "animate-spin");
    });
    const row = track.firstElementChild as HTMLElement | null;
    if (!row || track.querySelector("[data-ticker-cloned]")) return;
    const clone = row.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-ticker-cloned", "true");
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });
  }

  function sectionMeta(el: HTMLElement) {
    return `${el.id} ${el.getAttribute("data-section-id") || ""} ${el.getAttribute("data-section-label") || ""} ${el.getAttribute("data-redesign-section-anchor") || ""}`.toLowerCase();
  }

  function collectScrollAnchors(root: ParentNode) {
    const nodes = [
      ...root.querySelectorAll<HTMLElement>("[data-redesign-section-anchor], [data-section-id], section[id], .ai-redesign-section[id]"),
    ];
    const out: HTMLElement[] = [];
    const seen = new Set<string>();
    for (const el of nodes) {
      const id = (el.id || el.getAttribute("data-section-id") || "").trim();
      if (!id || seen.has(id)) continue;
      if (isChromeSectionLabel(sectionMeta(el), id)) continue;
      seen.add(id);
      if (!el.id) el.id = id;
      out.push(el);
    }
    return out;
  }

  function resolveNavScrollTarget(text: string, anchors: HTMLElement[]): HTMLElement | null {
    const lower = (text || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!lower || anchors.length === 0) return null;

    const find = (re: RegExp) => anchors.find((a) => re.test(sectionMeta(a))) || null;

    if (/^home$/i.test(lower)) {
      return find(/hero|banner|topfold|top-fold/) || anchors[0];
    }
    if (/galler|photos?/i.test(lower)) {
      // Never land Gallery on testimonials/stories.
      return (
        find(/galler|photo|media/) ||
        find(/\bimpact\b|program|service|about/) ||
        null
      );
    }
    if (/stor|testimonial|review/i.test(lower)) {
      return find(/stor|testimonial|review|people say/);
    }
    if (/about/i.test(lower)) return find(/\babout\b|overview|mission/);
    if (/service|programme|program/i.test(lower)) {
      return find(/program|service|how-we-help|how we help/);
    }
    if (/impact/i.test(lower)) return find(/\bimpact\b/);
    if (/contact|involve|donate|enquire|join/i.test(lower)) {
      return find(/get-involved|involve|contact|enquire|donate|footer/);
    }

    let best: HTMLElement | null = null;
    let bestScore = 0;
    for (const anchor of anchors) {
      const label =
        anchor.getAttribute("data-section-label") ||
        anchor.getAttribute("data-redesign-section-anchor") ||
        anchor.id ||
        "";
      const score = scoreLabelMatch(lower, label);
      if (score > bestScore) {
        bestScore = score;
        best = anchor;
      }
    }
    return bestScore >= 2 ? best : null;
  }

  function wireNavLinksByLabel(root: ParentNode) {
  const anchors = collectScrollAnchors(root);
  if (!anchors.length) return;

  root.querySelectorAll<HTMLElement>("header a, nav a, [data-mobile-menu] a").forEach((link) => {
    if (link.matches("[data-nav-dropdown-trigger], [data-mobile-menu-toggle]")) return;

    const text = (link.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || isChromeSectionLabel(text)) return;

    const best = resolveNavScrollTarget(text, anchors);
    if (!best?.id) return;

    // Always correct wrong hashes (e.g. Gallery → #stories / testimonials).
    link.setAttribute("href", `#${best.id}`);
    link.setAttribute("data-redesign-scroll", best.id);
  });
  }

  function wireFloatingChrome(root: ParentNode) {
    const topBtn = root.querySelector<HTMLElement>("[data-redesign-scroll-top]");
    if (!topBtn || topBtn.dataset.floatBound) return;
    topBtn.dataset.floatBound = "true";

    const syncTop = () => {
      const show = window.scrollY > 420;
      topBtn.classList.toggle("opacity-0", !show);
      topBtn.classList.toggle("opacity-100", show);
      topBtn.classList.toggle("pointer-events-none", !show);
      topBtn.classList.toggle("pointer-events-auto", show);
    };
    syncTop();
    window.addEventListener("scroll", syncTop, { passive: true });
    topBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function stripHeroBlinkAnimations(root: ParentNode) {
    root.querySelectorAll<HTMLElement>("header style").forEach((styleEl) => {
      const next = (styleEl.textContent || "")
        .replace(/@keyframes\s+fadeIn\s*\{[\s\S]*?\}/gi, "")
        .replace(/animation:\s*fadeIn[^;"]*;?/gi, "")
        .replace(/\.hero-slide\s*\{[^}]*\}/gi, "")
        .replace(/\.hero-slide\.active\s*\{[^}]*\}/gi, "");
      if (next !== styleEl.textContent) styleEl.textContent = next;
    });
    root.querySelectorAll<HTMLElement>("[data-hero-slider]").forEach((slider) => {
      slider.style.overflow = "hidden";
      slider.style.position = "relative";
    });
  }

  function fixHeaderHeroScroll(root: ParentNode) {
    root.querySelectorAll<HTMLElement>("header").forEach((header) => {
      if (!header.querySelector("[data-hero-slider], .hero-slide, [data-hero-slide]")) return;
      header.style.position = "static";
      header.style.top = "auto";
      header.removeAttribute("data-redesign-sticky");
      const navRow =
        header.querySelector<HTMLElement>("div:has(> nav:not([data-mobile-menu]))") ||
        header.querySelector<HTMLElement>("nav:not([data-mobile-menu])")?.closest("div") ||
        null;
      if (navRow && !navRow.hasAttribute("data-redesign-nav-sticky")) {
        navRow.setAttribute("data-redesign-nav-sticky", "true");
      }
    });
  }

  function init(root: ParentNode = document) {
    stripHeroBlinkAnimations(root);
    fixHeaderHeroScroll(root);
    wireFloatingChrome(root);
    prepNavDropdowns(root);
    fixNewsTickers(root);
    prepMobileMenus(root);
    rebuildMobileMenuFromDesktop(root);
    wireMobileMenus(root);
    wireMobileSubmenus(root);

    root.querySelectorAll<HTMLElement>("[data-nav-dropdown]").forEach((item) => {
    if (bound.has(item)) return;
    bound.add(item);
    const trigger = item.querySelector<HTMLElement>("[data-nav-dropdown-trigger]");
    const panel =
      item.querySelector<HTMLElement>("[data-nav-dropdown-panel]") ||
      item.querySelector<HTMLElement>(":scope > ul");
    if (!panel) return;

    bindHoverSubmenu(item, panel);

    if (trigger) {
      bindOnce(trigger, "dropdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = panel.getAttribute("data-open") === "true";
        closeAllNavDropdowns(root);
        if (!isOpen) openNavDropdown(panel);
      });
    }

    panel.querySelectorAll<HTMLElement>("a").forEach((link) => {
      bindOnce(link, "dropdown-link", (event) => {
        event.preventDefault();
        closeAllNavDropdowns(root);
        const href = link.getAttribute("href") || "";
        const targetId =
          link.getAttribute("data-redesign-scroll") ||
          (href.startsWith("#") ? href.slice(1) : "");
        if (targetId && targetId.length <= 64) scrollToSection(targetId);
      });
    });
  });

  root.querySelectorAll<HTMLElement>("header nav li").forEach((li) => {
    if (li.hasAttribute("data-nav-dropdown")) return;
    const panel = li.querySelector<HTMLElement>(":scope > ul");
    if (!panel || bound.has(li)) return;
    bound.add(li);
    li.classList.add("has-submenu");
    bindHoverSubmenu(li, panel);
    panel.querySelectorAll<HTMLElement>("a").forEach((link) => {
      bindOnce(link, "dropdown-link", (event) => {
        event.preventDefault();
        closeAllNavDropdowns(root);
        const href = link.getAttribute("href") || "";
        const targetId =
          link.getAttribute("data-redesign-scroll") ||
          (href.startsWith("#") ? href.slice(1) : "");
        if (targetId && targetId.length <= 64) scrollToSection(targetId);
      });
    });
  });

  if (!(document as Document & { redesignDropdownCloseBound?: boolean }).redesignDropdownCloseBound) {
    (document as Document & { redesignDropdownCloseBound?: boolean }).redesignDropdownCloseBound = true;
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-nav-dropdown], header nav li.has-submenu")) return;
      closeAllNavDropdowns(document);
    });
  }

  wireHeroSliders(root);
  wireSectionTabs(root);
  wireCardCarousels(root);
  fixBrokenMedia(root);
  wireBeforeAfterSliders(root);

  // Fix Gallery/wrong hashes BEFORE click handlers read data-redesign-scroll.
  wireNavLinksByLabel(root);

  const scrollToSection = (targetId: string) => {
    const id = targetId.replace(/^#/, "").trim();
    if (!id) return;
    const el =
      document.getElementById(id) ||
      root.querySelector<HTMLElement>(`[data-section-id="${id}"]`) ||
      root.querySelector<HTMLElement>(`[data-redesign-section-anchor="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    closeAllNavDropdowns(root);
    closeMobileMenus(root);
  };

  root.querySelectorAll<HTMLElement>("a[href^='#'], [data-redesign-scroll]").forEach((link) => {
    if (bound.has(link)) return;
    bound.add(link);
    bindOnce(link, "anchor", (event) => {
      const href = link.getAttribute("href") || "";
      const targetId =
        link.getAttribute("data-redesign-scroll") ||
        (href.startsWith("#") ? href.slice(1) : "");
      if (!targetId || targetId.length > 64) return;
      event.preventDefault();
      scrollToSection(targetId);
    });
  });
  }

  return init;
}

export const initRedesignPreviewInteractions = createRedesignPreviewInteractions();

export function getRedesignExportScriptTag(): string {
  const factory = createRedesignPreviewInteractions.toString();
  return `<script>
(function(){
  var init = (${factory})();
  function boot(){
    init(document);
    var tw = window.tailwind;
    if (tw && tw.refresh) tw.refresh();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
<\/script>`;
}

export const REDESIGN_EXPORT_EXTRA_CSS = `
  header[data-redesign-sticky]:has([data-hero-slider]),
  header:has([data-hero-slider]) {
    position: relative !important;
    top: auto !important;
  }
  header:has([data-hero-slider]) > div:has(> nav:not([data-mobile-menu])),
  header:has([data-hero-slider]) [data-redesign-nav-sticky] {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
  }
  [data-hero-slider] {
    position: relative !important;
    overflow: hidden !important;
    isolation: isolate;
    min-height: min(70vh, 820px);
    z-index: 1 !important;
  }
  [data-hero-slider] > .hero-slide,
  [data-hero-slider] > [data-hero-slide] {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    min-height: min(70vh, 820px);
  }
  [data-hero-slider] > .hero-slide:not(.active),
  [data-hero-slider] > [data-hero-slide]:not(.active) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
  [data-hero-slider] > .hero-slide.active,
  [data-hero-slider] > [data-hero-slide].active {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 2 !important;
    animation: none !important;
    transform: none !important;
  }
  @media (max-width: 767px) {
    [data-mobile-menu][data-open="true"] {
      display: flex !important;
    }
  }
  nav[data-mobile-menu]:not([data-open="true"]),
  [data-mobile-menu]:not([data-open="true"]) {
    display: none !important;
  }
  /* Narrow preview iframes can still report large widths; never hide an open drawer. */
  @media (min-width: 1024px) {
    nav[data-mobile-menu]:not([data-open="true"]),
    [data-mobile-menu]:not([data-open="true"]) {
      display: none !important;
    }
  }
  [data-hero-slider] nav:not([data-mobile-menu]) {
    display: none !important;
  }
  [data-redesign-float] {
    position: fixed !important;
    z-index: 9990 !important;
  }
  [data-redesign-scroll-top].opacity-100 {
    opacity: 1 !important;
    pointer-events: auto !important;
  }
`;
