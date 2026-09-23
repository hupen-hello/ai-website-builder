/**
 * Capture EVERY major reference homepage section (DOM-based), not fixed school scroll bands.
 * REFERENCE = design + layout + sections + UI only.
 */

export type ReferenceSectionShot = {
  id: string;
  label: string;
  mimeType: "image/jpeg";
  imageBase64: string;
  width: number;
  height: number;
  /** 0-based order top → bottom on the reference page */
  order: number;
};

type DiscoveredSection = {
  index: number;
  id: string;
  label: string;
  top: number;
  height: number;
};

const DEFAULT_MAX_SECTIONS = 8;
const HARD_MAX_SECTIONS = 10;

export type CaptureMode = "full" | "topfold";

function slugId(label: string, index: number) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 36) || `section-${index + 1}`;
  return index === 0 && /header|nav|top|hero|fold/i.test(label) ? "top-fold-1" : `${base}-${index + 1}`;
}

async function discoverReferenceSections(
  page: import("playwright").Page,
  maxSections: number,
): Promise<DiscoveredSection[]> {
  return page.evaluate((limit) => {
    const clean = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 48);

    const labelFor = (el: Element, fallback: string) => {
      const heading = el.querySelector("h1, h2, h3");
      if (heading?.textContent) {
        const t = clean(heading.textContent);
        if (t.length >= 2) return t;
      }
      const aria = el.getAttribute("aria-label");
      if (aria && clean(aria).length >= 2) return clean(aria);
      const id = el.getAttribute("id");
      if (id && clean(id.replace(/[-_]/g, " ")).length >= 2) {
        return clean(id.replace(/[-_]/g, " "));
      }
      const cls = (el.getAttribute("class") || "").toLowerCase();
      const hint =
        cls.match(
          /hero|banner|about|service|feature|testimonial|client|logo|partner|team|pricing|contact|gallery|portfolio|cta|work|project|process|faq|stat|result|industr|footer|header|nav/,
        )?.[0] || "";
      if (hint) return clean(hint);
      return fallback;
    };

    const root =
      document.querySelector("main") ||
      document.querySelector("#__next") ||
      document.querySelector("#root") ||
      document.querySelector("[data-scroll-container]") ||
      document.body;

    const picked: HTMLElement[] = [];
    const pushEl = (el: Element | null | undefined) => {
      if (!el || !(el instanceof HTMLElement)) return;
      if (picked.includes(el)) return;
      const tag = el.tagName;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "SVG", "PATH"].includes(tag)) return;
      const rect = el.getBoundingClientRect();
      const height = Math.max(el.offsetHeight || 0, el.scrollHeight || 0, rect.height || 0);
      if (height < 160) return;
      // Skip tiny utility chips
      if (height < 220 && !/HEADER|FOOTER|SECTION|NAV/.test(tag) && !el.querySelector("h1,h2,h3")) {
        return;
      }
      picked.push(el);
    };

    pushEl(document.querySelector("header"));
    if (!document.querySelector("header")) {
      pushEl(document.querySelector("nav"));
    }

    const explicit = [
      ...root.querySelectorAll(
        ":scope > section, :scope > header, :scope > footer, :scope > article, :scope > [data-section], :scope > .elementor-section, :scope > .e-con, :scope > .vc_row, :scope > .wp-block-group",
      ),
    ];
    explicit.forEach((el) => pushEl(el));

    // Agency sites often use nested wrappers — walk one more level of large blocks.
    if (picked.length < 5) {
      [...root.children].forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        pushEl(child);
        [...child.children].forEach((grand) => {
          if (!(grand instanceof HTMLElement)) return;
          const h = Math.max(grand.offsetHeight || 0, grand.scrollHeight || 0);
          if (h >= 280) pushEl(grand);
        });
      });
    }

    pushEl(document.querySelector("footer"));

    // Sort top → bottom, drop heavy overlaps (same band captured twice).
    const ranked = picked
      .map((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        const height = Math.max(el.offsetHeight || 0, el.scrollHeight || 0);
        return { el, top, height };
      })
      .sort((a, b) => a.top - b.top);

    const unique: typeof ranked = [];
    for (const row of ranked) {
      const prev = unique[unique.length - 1];
      if (prev && Math.abs(prev.top - row.top) < 120 && row.height < prev.height * 1.15) {
        continue;
      }
      // Prefer larger block when almost same start
      if (prev && Math.abs(prev.top - row.top) < 80 && row.height > prev.height * 1.35) {
        unique[unique.length - 1] = row;
        continue;
      }
      unique.push(row);
    }

    // Mark nodes with data attribute so Playwright can screenshot them stably.
    return unique.slice(0, limit).map((row, index) => {
      const label = labelFor(row.el, index === 0 ? "TopFold" : `Section ${index + 1}`);
      const id =
        index === 0 && /header|nav|top|hero|fold/i.test(label)
          ? "top-fold-1"
          : `ref-section-${index + 1}`;
      row.el.setAttribute("data-redesign-capture", id);
      return {
        index,
        id,
        label,
        top: Math.round(row.top),
        height: Math.round(row.height),
      };
    });
  }, maxSections);
}

async function shotElement(
  page: import("playwright").Page,
  meta: DiscoveredSection,
): Promise<ReferenceSectionShot | null> {
  try {
    const locator = page.locator(`[data-redesign-capture="${meta.id}"]`).first();
    const count = await locator.count();
    if (!count) return null;

    await locator.scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(280);

    // Cap very tall sections so vision tokens stay usable.
    const box = await locator.boundingBox();
    if (!box) return null;
    const maxH = 1400;
    const clipHeight = Math.min(Math.max(box.height, 200), maxH);
    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 38,
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: Math.min(box.width, 1280),
        height: clipHeight,
      },
    });

    return {
      id: meta.id,
      label: meta.label,
      mimeType: "image/jpeg",
      imageBase64: buffer.toString("base64"),
      width: Math.round(Math.min(box.width, 1280)),
      height: Math.round(clipHeight),
      order: meta.index,
    };
  } catch {
    return null;
  }
}

async function shotViewportBand(
  page: import("playwright").Page,
  id: string,
  label: string,
  order: number,
  scrollY: number,
): Promise<ReferenceSectionShot | null> {
  try {
    await page.evaluate((top) => window.scrollTo(0, top), scrollY);
    await page.waitForTimeout(450);
    const buffer = await page.screenshot({ type: "jpeg", quality: 38 });
    const viewport = page.viewportSize() || { width: 1280, height: 800 };
    return {
      id,
      label,
      mimeType: "image/jpeg",
      imageBase64: buffer.toString("base64"),
      width: viewport.width,
      height: viewport.height,
      order,
    };
  } catch {
    return null;
  }
}

export async function captureReferenceSectionShots(
  referenceUrl: string,
  options?: { maxSections?: number; mode?: CaptureMode },
): Promise<{ shots: ReferenceSectionShot[]; error?: string }> {
  const mode: CaptureMode =
    options?.mode ||
    (typeof options?.maxSections === "number" && options.maxSections <= 2
      ? "topfold"
      : "full");
  // Hybrid topfold: allow 1–2 shots. Full mode keeps prior 6–10 band captures.
  const maxSections =
    mode === "topfold"
      ? Math.min(Math.max(options?.maxSections ?? 2, 1), 2)
      : Math.min(
          Math.max(options?.maxSections ?? DEFAULT_MAX_SECTIONS, 4),
          HARD_MAX_SECTIONS,
        );
  const url = referenceUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    return { shots: [], error: "Reference URL must start with http(s)." };
  }

  let browser: import("playwright").Browser | null = null;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: mode === "topfold" ? 14000 : 18000,
    });
    await page.waitForTimeout(mode === "topfold" ? 350 : 600);

    // --- Hybrid fast path: only first viewport (+ optional hero band) ---
    if (mode === "topfold") {
      const shots: ReferenceSectionShot[] = [];
      const top = await shotViewportBand(page, "top-fold-1", "TopFold", 0, 0);
      if (top) shots.push(top);

      if (shots.length < maxSections) {
        const heroMeta = await page.evaluate(() => {
          const el =
            document.querySelector("header") ||
            document.querySelector(
              "[class*='hero'], [id*='hero'], [class*='banner'], section",
            );
          if (!(el instanceof HTMLElement)) return null;
          const topY = el.getBoundingClientRect().top + window.scrollY;
          const height = Math.max(el.offsetHeight || 0, el.scrollHeight || 0, 420);
          return {
            index: 1,
            id: "hero-band",
            label: "Hero",
            top: Math.max(0, topY),
            height: Math.min(height, 1100),
          };
        });
        if (heroMeta) {
          const hero = await shotElement(page, heroMeta);
          if (hero && hero.imageBase64 !== shots[0]?.imageBase64) shots.push(hero);
        }
      }

      if (!shots.length) {
        const full = await page.screenshot({ type: "jpeg", quality: 38 });
        shots.push({
          id: "top-fold-1",
          label: "TopFold",
          mimeType: "image/jpeg",
          imageBase64: full.toString("base64"),
          width: 1280,
          height: 900,
          order: 0,
        });
      }

      shots.forEach((shot, index) => {
        shot.order = index;
        if (!shot.id) shot.id = slugId(shot.label, index);
      });
      return { shots: shots.slice(0, maxSections) };
    }

    // Force lazy media / below-fold content to load (fast scroll).
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const max = Math.min(
        Math.max(
          document.body?.scrollHeight || 0,
          document.documentElement?.scrollHeight || 0,
          2400,
        ),
        4200,
      );
      for (let y = 0; y < max; y += 1100) {
        window.scrollTo(0, y);
        await delay(50);
      }
      window.scrollTo(0, 0);
      await delay(120);
    });

    const discovered = await discoverReferenceSections(page, maxSections);
    const shots: ReferenceSectionShot[] = [];

    for (const meta of discovered) {
      if (shots.length >= maxSections) break;
      const shot = await shotElement(page, meta);
      if (shot) shots.push(shot);
    }

    // Fallback: viewport bands covering full page height when DOM discovery is thin.
    if (shots.length < 4) {
      const pageHeight = await page.evaluate(() =>
        Math.max(document.body?.scrollHeight || 0, document.documentElement?.scrollHeight || 0),
      );
      const step = 850;
      const bands = Math.min(maxSections, Math.max(4, Math.ceil(pageHeight / step)));
      for (let i = 0; i < bands && shots.length < maxSections; i += 1) {
        const label =
          i === 0 ? "TopFold" : i >= bands - 1 ? "Footer" : `Section ${i + 1}`;
        const shot = await shotViewportBand(
          page,
          i === 0 ? "top-fold-1" : `section-band-${i + 1}`,
          label,
          i,
          i * step,
        );
        if (shot) {
          // Prefer DOM shots; only fill gaps with bands when discovery failed.
          if (discovered.length < 4) shots.push(shot);
        }
      }
    }

    if (!shots.length) {
      const full = await page.screenshot({ type: "jpeg", quality: 38 });
      shots.push({
        id: "top-fold-1",
        label: "TopFold",
        mimeType: "image/jpeg",
        imageBase64: full.toString("base64"),
        width: 1280,
        height: 900,
        order: 0,
      });
    }

    // Ensure stable order field
    shots.forEach((shot, index) => {
      shot.order = index;
      if (!shot.id) shot.id = slugId(shot.label, index);
    });

    return { shots };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to capture reference screenshots.";
    return { shots: [], error: message };
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
