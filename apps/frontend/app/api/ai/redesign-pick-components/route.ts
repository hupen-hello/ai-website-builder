import { NextResponse } from "next/server";
import { generateAiText, hasAnyAiKey } from "@/lib/aiProvider";
import type { BuiltSiteTheme } from "@/lib/built-site-theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type LayoutRow = {
  key: string;
  name: string;
  sectionType: string;
  categorySlug?: string | null;
  scope?: string;
  status?: string;
  description?: string | null;
};

type TemplateRow = {
  id: string;
  title?: string;
  status?: string;
  sectionVariants?: Record<string, string>;
};

type Bundle = {
  layouts?: LayoutRow[];
  templates?: TemplateRow[];
  categories?: Record<
    string,
    { slug?: string; templates?: string[]; description?: string }
  >;
};

type PickBody = {
  theme?: BuiltSiteTheme;
  vision?: string;
};

const HOME_TYPES = [
  "Topbar",
  "Header",
  "Banner",
  "About",
  "Product",
  "WhyChooseUs",
  "Gallery",
  "Testimonial",
  "FAQ",
  "Footer",
] as const;

function backendBase() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
}

async function loadBundle(): Promise<Bundle> {
  try {
    const res = await fetch(`${backendBase()}/contents/bundle`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    return (await res.json()) as Bundle;
  } catch {
    return {};
  }
}

function activeLayouts(bundle: Bundle): LayoutRow[] {
  return (bundle.layouts || []).filter(
    (l) => !l.status || l.status === "Active",
  );
}

function categoriesWithTemplates(bundle: Bundle) {
  const activeTemplates = (bundle.templates || [])
    .filter((t) => !t.status || t.status === "Active")
    .map((t) => t.id);
  const borrow = activeTemplates.slice(0, 1);

  return Object.entries(bundle.categories || {})
    .filter(([, pack]) => {
      const status = (pack as { status?: string }).status;
      return !status || status === "Active";
    })
    .map(([name, pack]) => {
      const own = pack.templates || [];
      return {
        name,
        slug: pack.slug || name.toLowerCase(),
        templates: own.length ? own : borrow,
        borrowed: own.length === 0 && borrow.length > 0,
        description: pack.description || "",
      };
    })
    .filter((c) => c.templates.length > 0);
}

function heuristicCategory(
  theme: BuiltSiteTheme,
  vision: string,
  cats: ReturnType<typeof categoriesWithTemplates>,
) {
  const hint = [
    theme.brandName,
    theme.description,
    theme.tagline,
    vision,
    theme.domainUrl,
    (theme.paragraphs || []).slice(0, 3).join(" "),
    // Nav labels only — not long industry laundry lists
    (theme.navItems || theme.categories || []).slice(0, 8).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  /** Priority order — agency/web-design before Realestate (industries chips). */
  const rules: Array<{ re: RegExp; slug: string }> = [
    {
      re: /web\s*design|website\s*design|website\s*develop|web\s*develop|digital\s*agency|creative\s*agency|it\s*(company|services)|software\s*(company|agency)|css\s*founder|ui\/?ux|hire\s+(developer|designer)/,
      slug: "business",
    },
    {
      re: /\b(agency|studio|consultancy|consulting|marketing\s*agency|branding)\b/,
      slug: "business",
    },
    { re: /school|college|education|cbse|admission/, slug: "school" },
    { re: /hospital|clinic|doctor|medical|healthcare/, slug: "hospital" },
    {
      re: /realtor|real\s*estate\s+(agency|agent|broker|company)|property\s+(dealer|listing|for\s+sale)|buy\s*(a\s*)?(home|flat)/,
      slug: "realestate",
    },
    { re: /e-?commerce|online\s*store|shopify/, slug: "ecommerce" },
    { re: /portfolio|freelancer/, slug: "portfolio" },
    { re: /business|company|services|corporate/, slug: "business" },
  ];

  for (const rule of rules) {
    if (!rule.re.test(hint)) continue;
    const hit = cats.find(
      (c) =>
        c.slug.toLowerCase() === rule.slug ||
        c.name.toLowerCase() === rule.slug ||
        c.name.toLowerCase().includes(rule.slug) ||
        rule.slug.includes(c.name.toLowerCase()),
    );
    if (hit) return hit.name;
  }

  const prefer = ["Business", "Portfolio", "School"];
  for (const name of prefer) {
    const hit = cats.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (hit) return hit.name;
  }
  return cats.find((c) => c.name.toLowerCase() !== "realestate")?.name ||
    cats[0]?.name ||
    "Business";
}

function layoutsForType(
  layouts: LayoutRow[],
  sectionType: string,
  categorySlug: string,
  avoidRealestatePack = false,
) {
  const typeMatch = layouts.filter(
    (l) => l.sectionType === sectionType && (!l.scope || l.scope === "home"),
  );
  const cat = typeMatch.filter(
    (l) =>
      !l.categorySlug ||
      l.categorySlug.toLowerCase() === categorySlug.toLowerCase(),
  );
  if (cat.length) return cat;
  if (avoidRealestatePack) {
    const generic = typeMatch.filter(
      (l) =>
        !l.categorySlug ||
        !/real\s*estate|realestate/i.test(l.categorySlug || ""),
    );
    const nonFive = generic.filter((l) => !/-5$/i.test(l.key));
    if (nonFive.length) return nonFive;
    if (generic.length) return generic;
  }
  return typeMatch;
}

function heuristicVariants(
  layouts: LayoutRow[],
  categorySlug: string,
  template?: TemplateRow,
  opts?: { ignoreTemplateDefaults?: boolean },
): Record<string, string> {
  const avoidRe = opts?.ignoreTemplateDefaults || /business|portfolio/i.test(categorySlug);
  const out: Record<string, string> = {
    ...(opts?.ignoreTemplateDefaults ? {} : template?.sectionVariants || {}),
  };
  for (const type of HOME_TYPES) {
    const options = layoutsForType(layouts, type, categorySlug, avoidRe);
    if (!options.length) continue;
    // Prefer keeping template default if still in catalog
    const preferred = out[type];
    if (preferred && options.some((o) => o.key === preferred)) continue;
    out[type] = options[0].key;
  }
  return out;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence?.[1]?.trim() || trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PickBody;
  const theme = body.theme;
  const vision = typeof body.vision === "string" ? body.vision.trim() : "";

  if (!theme || typeof theme !== "object") {
    return NextResponse.json({ message: "theme required" }, { status: 400 });
  }

  const bundle = await loadBundle();
  const layouts = activeLayouts(bundle);
  const cats = categoriesWithTemplates(bundle);
  const templates = (bundle.templates || []).filter(
    (t) => !t.status || t.status === "Active",
  );

  if (!cats.length || !templates.length) {
    return NextResponse.json(
      {
        message: "No custom-layouts / templates in contents bundle",
        category: "Business",
        templateId: "template-1",
        sectionVariants: {},
        pickedBy: "heuristic",
      },
      { status: 200 },
    );
  }

  const heuristicCat = heuristicCategory(theme, vision, cats);
  let category = heuristicCat;
  let catPack = cats.find((c) => c.name === category) || cats[0];
  let templateId = catPack.templates[0] || templates[0].id;
  let template = templates.find((t) => t.id === templateId) || templates[0];
  let sectionVariants = heuristicVariants(
    layouts,
    catPack.slug,
    template,
    { ignoreTemplateDefaults: Boolean(catPack.borrowed) },
  );
  let pickedBy: "ai" | "heuristic" = "heuristic";

  if (hasAnyAiKey() && layouts.length) {
    const catalog = layouts
      .slice(0, 120)
      .map(
        (l) =>
          `${l.key}|${l.sectionType}|${l.name}|${l.categorySlug || "any"}|${(l.description || "").slice(0, 80)}`,
      )
      .join("\n");
    const plan = (theme.sectionPlan || [])
      .slice(0, 12)
      .map((p) => `${p.id}:${p.label}`)
      .join(", ");

    const prompt = `You pick UI components from our custom-layouts catalog for a website redesign.
Domain brand: ${theme.brandName}
Domain: ${theme.domainUrl}
Description: ${(theme.description || "").slice(0, 400)}
Vision: ${vision.slice(0, 300)}
Nav/categories: ${(theme.categories || theme.navItems || []).slice(0, 12).join(", ")}
Section plan from existing site: ${plan || "unknown"}

Available categories (name → templates): ${cats.map((c) => `${c.name}[${c.templates.join(",")}]`).join("; ")}

Layouts catalog lines (key|sectionType|name|categorySlug|desc):
${catalog}

Rules:
- Pick ONE category name from the available list that best matches the PRIMARY business niche of the domain.
- Web design / digital agency / IT / software company → Business (or Portfolio if Business missing). NEVER Realestate.
- Do NOT pick Realestate only because an industries list mentions "Real Estate" among many sectors.
- Realestate ONLY if the site is primarily a realtor / property dealer / housing business.
- School ONLY for education campuses; Hospitals for medical clinics.
- Pick ONE templateId that belongs to that category.
- For each home section type you need, pick ONE layout key from the catalog (same sectionType). Prefer layouts whose categorySlug matches or is empty.
- Required section types when available in catalog: ${HOME_TYPES.join(", ")}
- Return ONLY JSON: {"category":"...","templateId":"...","sectionVariants":{"Header":"Header-5","Banner":"Banner-5",...},"reason":"short"}`;

    try {
      const ai = await generateAiText({
        messages: [
          {
            role: "system",
            content:
              "You are a layout picker for Lestow redesign. Reply with JSON only. Never invent layout keys not in the catalog.",
          },
          { role: "user", content: prompt },
        ],
        maxTokens: 900,
        temperature: 0.2,
      });
      const parsed = parseJsonObject(ai.text || "");
      if (parsed) {
        const aiCat = String(parsed.category || "").trim();
        const aiTpl = String(parsed.templateId || "").trim();
        const aiVars =
          parsed.sectionVariants && typeof parsed.sectionVariants === "object"
            ? (parsed.sectionVariants as Record<string, unknown>)
            : {};
        if (aiCat && cats.some((c) => c.name === aiCat)) {
          category = aiCat;
          catPack = cats.find((c) => c.name === category) || catPack;
        }
        if (aiTpl && catPack.templates.includes(aiTpl)) {
          templateId = aiTpl;
          template = templates.find((t) => t.id === templateId) || template;
        }
        const next = { ...sectionVariants };
        const validKeys = new Set(layouts.map((l) => l.key));
        for (const [type, keyRaw] of Object.entries(aiVars)) {
          const key = String(keyRaw || "").trim();
          if (!key || !validKeys.has(key)) continue;
          const row = layouts.find((l) => l.key === key);
          if (!row || row.sectionType !== type) continue;
          next[type] = key;
        }
        sectionVariants = next;
        pickedBy = "ai";

        // Agency sites often list "Real Estate" as an industry they serve — never trust that as niche.
        if (
          category === "Realestate" &&
          heuristicCat === "Business" &&
          cats.some((c) => c.name === "Business")
        ) {
          category = "Business";
          catPack = cats.find((c) => c.name === "Business") || catPack;
          templateId = catPack.templates[0] || templateId;
          template = templates.find((t) => t.id === templateId) || template;
          sectionVariants = heuristicVariants(layouts, catPack.slug, template, {
            ignoreTemplateDefaults: Boolean(catPack.borrowed),
          });
          pickedBy = "heuristic";
        } else if (catPack.borrowed && /business/i.test(category)) {
          // Keep niche category; rebuild variants without Realestate *-5 defaults.
          sectionVariants = heuristicVariants(layouts, catPack.slug, template, {
            ignoreTemplateDefaults: true,
          });
        }
      }
    } catch {
      /* keep heuristic */
    }
  }

  return NextResponse.json({
    category,
    templateId,
    sectionVariants,
    pickedBy,
    layoutCount: layouts.length,
    message:
      pickedBy === "ai"
        ? "AI picked components from custom-layouts"
        : "Heuristic pick from custom-layouts catalog",
  });
}
