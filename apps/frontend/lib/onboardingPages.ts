import type { EditorDraftPageLink } from "@/lib/editorDraft";
import type { OnboardingBusinessInfo } from "@/lib/onboardingDraft";
import {
  getBuilderTemplate,
  getCategoriesForOnboarding,
  getCategoryNamesWithContent,
  getTemplatePages,
  resolveLayoutPreview,
  type BuilderTemplate,
} from "@/app/editor/layout/src/data/templateFlow";

export type ThemeMenuOption = {
  id: string;
  label: string;
  href: string;
  kind?: "page" | "section";
  dropdown?: Array<{ id: string; label: string; href: string }>;
};

export type ThemeFooterColumn = {
  id: string;
  title: string;
  links: Array<{ id: string; label: string; href: string }>;
};

export type OnboardingPagesSelection = {
  /** Keys like `header:about`, `footer:useful-links:contact` */
  selectedPages: string[];
};

/** Column-scoped footer key so duplicate labels (e.g. Contact) toggle independently. */
export function footerSelectionKey(columnId: string, linkId: string) {
  return `footer:${columnId}:${linkId}`;
}

function parseFooterSelectionKey(
  key: string,
): { columnId: string; linkId: string } | null {
  if (!key.startsWith("footer:")) return null;
  const rest = key.slice("footer:".length);
  const sep = rest.indexOf(":");
  // Legacy `footer:contact` (no column) — treat as link-only.
  if (sep < 0) return { columnId: "*", linkId: rest };
  return {
    columnId: rest.slice(0, sep),
    linkId: rest.slice(sep + 1),
  };
}

/** Same cap as the header editor (EditSectionModal MAX_MENU_LINKS). */
export const HEADER_MENU_LIMIT = 10;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryNameForTemplate(templateId: string | null) {
  const id = (templateId || "").trim();
  if (id) {
    for (const category of getCategoriesForOnboarding()) {
      if (category.templates.includes(id)) return category.name;
    }
  }
  return getCategoryNamesWithContent()[0] || "Business";
}

function itemIdFromHrefOrLabel(href: string, label: string) {
  const raw = (href || "").trim();
  const fromHash = raw.match(/#page-([^/?#]+)/i)?.[1];
  if (fromHash) return slugify(decodeURIComponent(fromHash));
  const path = raw.split(/[?#]/, 1)[0].replace(/^\/+/, "");
  if (path && path !== "#" && !["home", "index"].includes(path.toLowerCase())) {
    return slugify(path);
  }
  const fromLabel = slugify(label);
  return fromLabel === "home" || !fromLabel ? "home" : fromLabel;
}

type RawMenuChild = { id: string; label: string; href: string };

function readMenuChildren(value: unknown): RawMenuChild[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const children: RawMenuChild[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const item = row as Record<string, unknown>;
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!label) continue;
    const href = typeof item.href === "string" ? item.href : "#";
    let id = itemIdFromHrefOrLabel(href, label);
    if (seen.has(id)) id = `${id}-${children.length + 1}`;
    seen.add(id);
    children.push({ id, label, href });
  }
  return children;
}

function readThemeHeaderMenu(template: BuilderTemplate): ThemeMenuOption[] {
  const variant = template.sectionVariants?.Header;
  if (!variant) return [];
  const preview = resolveLayoutPreview(
    variant,
    categoryNameForTemplate(template.id),
  );
  const menu = preview?.data?.menu;
  if (!Array.isArray(menu) || !menu.length) return [];

  const options: ThemeMenuOption[] = [];
  const seen = new Set<string>();
  for (const row of menu) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const item = row as Record<string, unknown>;
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!label) continue;
    const href = typeof item.href === "string" ? item.href : "#";
    let id = itemIdFromHrefOrLabel(href, label);
    if (id === "home" || label.toLowerCase() === "home") id = "home";
    if (seen.has(id)) id = `${id}-${options.length + 1}`;
    seen.add(id);
    const dropdown = readMenuChildren(item.children);
    const option: ThemeMenuOption = {
      id,
      label,
      href: id === "home" ? "#" : href || pageHref(id, true),
      kind: "page",
    };
    if (dropdown.length) option.dropdown = dropdown;
    options.push(option);
    if (options.length >= HEADER_MENU_LIMIT) break;
  }

  if (!options.some((item) => item.id === "home")) {
    options.unshift({ id: "home", label: "Home", href: "#", kind: "page" });
    if (options.length > HEADER_MENU_LIMIT) options.pop();
  }
  return options;
}

function readThemeFooterColumns(template: BuilderTemplate): ThemeFooterColumn[] {
  const variant = template.sectionVariants?.Footer;
  if (!variant) return [];
  const preview = resolveLayoutPreview(
    variant,
    categoryNameForTemplate(template.id),
  );
  const columns = preview?.data?.footerColumns;
  if (!Array.isArray(columns) || !columns.length) return [];

  return columns.flatMap((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const column = row as Record<string, unknown>;
    const title =
      typeof column.title === "string" && column.title.trim()
        ? column.title.trim()
        : `Column ${index + 1}`;
    const links = readMenuChildren(column.links);
    if (!links.length) return [];
    return [
      {
        id: slugify(title) || `column-${index + 1}`,
        title,
        links: links.map((link) => ({
          id: link.id,
          label: link.label,
          href: link.href,
        })),
      },
    ];
  });
}

const SINGLE_PAGE_SECTIONS: Array<{
  sectionType: string;
  id: string;
  label: string;
  href: string;
}> = [
  { sectionType: "Banner", id: "home", label: "Home", href: "#" },
  { sectionType: "About", id: "about", label: "About", href: "#about" },
  {
    sectionType: "Product",
    id: "services",
    label: "Services",
    href: "#services",
  },
  {
    sectionType: "WhyChooseUs",
    id: "why-choose-us",
    label: "Why Choose Us",
    href: "#why-choose-us",
  },
  { sectionType: "Gallery", id: "gallery", label: "Gallery", href: "#gallery" },
  {
    sectionType: "FormDetail",
    id: "contact",
    label: "Contact",
    href: "#contact",
  },
  { sectionType: "FAQ", id: "faq", label: "FAQ", href: "#faq" },
  {
    sectionType: "Testimonial",
    id: "testimonials",
    label: "Testimonials",
    href: "#testimonials",
  },
  {
    sectionType: "CountriesServe",
    id: "countries-we-serve",
    label: "Countries",
    href: "#countries-we-serve",
  },
];

function isMultiPageTemplate(
  template: BuilderTemplate,
  pageType: OnboardingBusinessInfo["pageType"],
) {
  if (pageType === "multi-page") return true;
  if (pageType === "single-page") return false;
  return template.type === "Multiple Pages Website";
}

function pageHref(id: string, multi: boolean) {
  if (id === "home") return "#";
  if (id === "blog" || id === "blogs") return "#page-blogs";
  if (!multi && ["about", "services", "gallery", "events", "contact", "faq", "testimonials", "why-choose-us", "countries-we-serve"].includes(id)) {
    return id === "why-choose-us"
      ? "#why-choose-us"
      : id === "countries-we-serve"
        ? "#countries-we-serve"
        : `#${id}`;
  }
  return `#page-${id}`;
}

/** Pages/sections this theme can actually render. */
export function getThemeMenuCatalog(
  templateId: string | null,
  pageType: OnboardingBusinessInfo["pageType"],
): ThemeMenuOption[] {
  const template = getBuilderTemplate(templateId);
  const multi = isMultiPageTemplate(template, pageType);
  const variants = template.sectionVariants || {};

  if (!multi) {
    // Single-page sites use flat section anchors — no submenu pages.
    return SINGLE_PAGE_SECTIONS.filter(
      (item) => item.id === "home" || Boolean(variants[item.sectionType]),
    )
      .slice(0, HEADER_MENU_LIMIT)
      .map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        kind: "section" as const,
      }));
  }

  const fromHeader = readThemeHeaderMenu(template);
  if (fromHeader.length) return fromHeader;

  const pagesSource =
    getTemplatePages(template).length > 0
      ? getTemplatePages(template)
      : [
          { id: "about", label: "About", sectionType: "AboutPage" },
          { id: "services", label: "Services", sectionType: "ServicePage" },
          { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
          { id: "contact", label: "Contact", sectionType: "ContactPage" },
        ];

  const pages = pagesSource.filter((page) =>
    Boolean(variants[page.sectionType]),
  );

  const options: ThemeMenuOption[] = [
    { id: "home", label: "Home", href: "#", kind: "page" },
    ...pages.map((page) => ({
      id: page.id,
      label: page.label,
      href: pageHref(page.id, true),
      kind: "page" as const,
    })),
  ];

  return options.slice(0, HEADER_MENU_LIMIT);
}

export function getThemeFooterCatalog(
  templateId: string | null,
  pageType: OnboardingBusinessInfo["pageType"],
): ThemeFooterColumn[] {
  const template = getBuilderTemplate(templateId);
  const fromTheme = readThemeFooterColumns(template);
  if (fromTheme.length) return fromTheme;

  const menu = getThemeMenuCatalog(templateId, pageType);
  const byId = new Map(menu.map((item) => [item.id, item]));
  const multi = isMultiPageTemplate(template, pageType);

  const usefulIds = [
    "home",
    "about",
    "gallery",
    "events",
    "contact",
    "portfolio",
    "teams",
    "properties",
  ] as const;
  const usefulLabels: Record<string, string> = {
    home: "Home",
    about: "About Us",
    gallery: "Gallery",
    events: "Events",
    contact: "Contact",
    portfolio: "Portfolio",
    teams: "Teams",
    properties: "Properties",
  };
  const usefulLinks = usefulIds
    .filter((id) => byId.has(id))
    .map((id) => ({
      id,
      label: usefulLabels[id] || byId.get(id)!.label,
      href: pageHref(id, multi),
    }));

  const columns: ThemeFooterColumn[] = [
    {
      id: "useful-links",
      title: "Useful Links",
      links: usefulLinks,
    },
  ];

  if (byId.get("contact")) {
    columns.push({
      id: "support",
      title: "Support",
      links: [
        {
          id: "contact",
          label: "Contact",
          href: pageHref("contact", multi),
        },
      ],
    });
  }

  return columns.filter((column) => column.links.length > 0);
}

export function defaultOnboardingPagesSelection(
  templateId: string | null,
  pageType: OnboardingBusinessInfo["pageType"],
): OnboardingPagesSelection {
  const menu = getThemeMenuCatalog(templateId, pageType);
  const footer = getThemeFooterCatalog(templateId, pageType);

  const headerKeys = menu.flatMap((item) => [
    `header:${item.id}`,
    ...(item.dropdown?.map((child) => `header:${child.id}`) || []),
  ]);

  const footerKeys = footer.flatMap((column) =>
    column.links.map((link) => footerSelectionKey(column.id, link.id)),
  );

  return { selectedPages: [...new Set([...headerKeys, ...footerKeys])] };
}

export function normalizeOnboardingPagesSelection(
  raw: unknown,
  templateId?: string | null,
  pageType?: OnboardingBusinessInfo["pageType"],
): OnboardingPagesSelection {
  const defaults = defaultOnboardingPagesSelection(
    templateId ?? null,
    pageType ?? "single-page",
  );
  if (!raw || typeof raw !== "object") return defaults;
  const value = raw as { selectedPages?: unknown };
  if (!Array.isArray(value.selectedPages)) return defaults;

  const selectedPages = value.selectedPages.filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
  if (!selectedPages.length) return defaults;

  // Drop keys that are no longer offered by this theme.
  const menu = getThemeMenuCatalog(templateId ?? null, pageType ?? "single-page");
  const footer = getThemeFooterCatalog(
    templateId ?? null,
    pageType ?? "single-page",
  );
  const allowed = new Set<string>([
    ...menu.flatMap((item) => [
      `header:${item.id}`,
      ...(item.dropdown?.map((child) => `header:${child.id}`) || []),
    ]),
    ...footer.flatMap((column) =>
      column.links.map((link) => footerSelectionKey(column.id, link.id)),
    ),
  ]);

  // Expand legacy `footer:contact` into every column that offers that link.
  const expanded = selectedPages.flatMap((key) => {
    const parsed = parseFooterSelectionKey(key);
    if (!parsed) return [key];
    if (parsed.columnId !== "*") return [key];
    const matches = footer.flatMap((column) =>
      column.links.some((link) => link.id === parsed.linkId)
        ? [footerSelectionKey(column.id, parsed.linkId)]
        : [],
    );
    return matches.length ? matches : [];
  });

  const filtered = expanded.filter((key) => allowed.has(key));
  if (!filtered.some((key) => key === "header:home")) {
    filtered.unshift("header:home");
  }
  return {
    selectedPages: filtered.length ? filtered : defaults.selectedPages,
  };
}

function headerChildParentMap(catalog: ThemeMenuOption[]) {
  const map: Record<string, string> = {};
  for (const item of catalog) {
    for (const child of item.dropdown || []) {
      map[child.id] = item.id;
    }
  }
  return map;
}

/** Convert selections into editor pageLinks for the chosen theme. */
export function buildPageLinksFromOnboardingSelection(
  selection: OnboardingPagesSelection,
  templateId: string | null,
  pageType: OnboardingBusinessInfo["pageType"],
): EditorDraftPageLink[] {
  const catalog = getThemeMenuCatalog(templateId, pageType);
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const childParent = headerChildParentMap(catalog);
  const headerIds = selection.selectedPages
    .filter((key) => key.startsWith("header:"))
    .map((key) => key.slice("header:".length));

  const topLevel = catalog
    .map((item) => item.id)
    .filter((id) => headerIds.includes(id));

  for (const id of headerIds) {
    const parent = childParent[id];
    if (parent && byId.has(parent) && !topLevel.includes(parent)) {
      topLevel.push(parent);
    }
  }
  if (!topLevel.includes("home") && byId.has("home")) {
    topLevel.unshift("home");
  }

  return topLevel
    .map((id) => byId.get(id))
    .filter((item): item is ThemeMenuOption => Boolean(item))
    .map((item) => {
      const multi = isMultiPageTemplate(
        getBuilderTemplate(templateId),
        pageType,
      );
      const children = multi
        ? (item.dropdown || [])
            .filter((child) => headerIds.includes(child.id))
            .map((child) => ({
              label: child.label,
              href: child.href,
              kind: "page" as const,
            }))
        : [];
      const link: EditorDraftPageLink = {
        label: item.label,
        href: item.href,
        kind: "page",
      };
      if (children.length) link.children = children;
      return link;
    });
}

export type OnboardingFooterColumnData = {
  title: string;
  links: { label: string; href: string }[];
};

export function resolveOnboardingPageTypeForTemplate(
  templateId: string | null,
  category?: string | null,
): OnboardingBusinessInfo["pageType"] {
  const template = getBuilderTemplate(templateId, category);
  return template.type === "Single Page Website" ? "single-page" : "multi-page";
}

/** Default header + footer picks for a theme (same source as Choose pages step). */
export function buildDefaultThemeNav(
  templateId: string | null,
  category?: string | null,
) {
  const pageType = resolveOnboardingPageTypeForTemplate(templateId, category);
  const pagesSelection = defaultOnboardingPagesSelection(templateId, pageType);
  const headerMenu = buildPageLinksFromOnboardingSelection(
    pagesSelection,
    templateId,
    pageType,
  );
  const footerColumns = buildFooterColumnsFromOnboardingSelection(
    pagesSelection,
    templateId,
    pageType,
  );
  return { pageType, pagesSelection, headerMenu, footerColumns };
}

export function buildFooterColumnsFromOnboardingSelection(
  selection: OnboardingPagesSelection,
  templateId: string | null,
  pageType: OnboardingBusinessInfo["pageType"],
): OnboardingFooterColumnData[] {
  const selected = new Set(selection.selectedPages);
  return getThemeFooterCatalog(templateId, pageType)
    .map((column) => ({
      title: column.title,
      links: column.links
        .filter(
          (link) =>
            selected.has(footerSelectionKey(column.id, link.id)) ||
            // Legacy drafts before column-scoped keys.
            selected.has(`footer:${link.id}`),
        )
        .map((link) => ({ label: link.label, href: link.href })),
    }))
    .filter((column) => column.links.length > 0);
}
