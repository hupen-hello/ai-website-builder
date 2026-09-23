"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FilePenLine,
  LayoutTemplate,
  Plus,
  Search,
  Settings2,
  Tags,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import ImageLibraryPicker from "../layout/src/components/builder/ImageLibraryPicker";
import CustomSectionRichTextEditor from "../layout/src/components/sections/custom/CustomSectionRichTextEditor";
import {
  AiFieldButton,
  FieldLabelWithAi,
  useManagerAiFields,
} from "./managerAi";
import { usePreview } from "../layout/src/components/context/PreviewContext";
import type { PageLink } from "../layout/src/components/context/PreviewContext";
import { resolveThemePortfolioNavLink } from "../layout/src/data/templateFlow";
import {
  getPageSeo,
  patchPageSeo,
  type SiteSeoSettings,
} from "@/lib/siteSeo";
import {
  DEFAULT_PORTFOLIO_DETAIL_LAYOUT,
  DEFAULT_PORTFOLIO_INDEX_LAYOUT,
  normalizePortfolioDetailLayout,
  normalizePortfolioIndexLayout,
  PORTFOLIO_DETAIL_LAYOUTS,
  PORTFOLIO_INDEX_LAYOUTS,
  type PortfolioLayoutOption,
} from "../layout/src/lib/portfolioLayouts";

type PortfolioTab = "portfolio" | "categories" | "templates" | "seo";
type LayoutPane = "index" | "detail";

const DEFAULT_PORTFOLIO_CATEGORY = "Portfolio";
const LIST_PAGE_SIZE = 5;
const PORTFOLIO_PAGE_SEO_KEY = "Portfolio";

export type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  desc: string;
  content?: string;
  image: string;
  alt?: string;
  slug?: string;
  order?: number;
  active?: boolean;
  /** When true, this project can appear on home teasers. */
  featured?: boolean;
  /** Badge on latest-project cards, e.g. `Completed`. */
  status?: string;
  /** Line on project cards, e.g. `NH-24, Ghaziabad`. */
  location?: string;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

export type PortfolioPageState = {
  pretitle: string;
  title: string;
  subtitle: string;
  desc: string;
  desc2: string;
  sideImage: string;
  sideImageTitle: string;
  productSectionTitle: string;
  layout?: string;
  detailLayout?: string;
  portfolioItems: PortfolioItem[];
};

type PortfolioManagerProps = {
  onClose: () => void;
  siteId?: string;
  preserveNavigation?: boolean;
};

const createPortfolioSlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniquePortfolioSlug = (
  preferred: string,
  items: PortfolioItem[],
  excludeId?: string | null,
) => {
  const base = preferred || "portfolio-item";
  const taken = new Set(
    items
      .filter((item) => item.id !== excludeId)
      .map((item) =>
        (item.slug || createPortfolioSlug(item.title) || "").toLowerCase(),
      )
      .filter(Boolean),
  );
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};

const emptyPortfolioItem = (
  order = 1,
  detailLayout = DEFAULT_PORTFOLIO_DETAIL_LAYOUT,
): PortfolioItem => ({
  id: `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  category: DEFAULT_PORTFOLIO_CATEGORY,
  desc: "",
  content: "",
  image: "",
  alt: "",
  slug: "",
  order,
  active: true,
  featured: false,
  status: "",
  location: "",
  layout: detailLayout,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
});

const emptyPageState = (): PortfolioPageState => ({
  pretitle: "Our Portfolio",
  title: "Work worth showing in detail",
  subtitle: "Featured work",
  desc: "Showcase selected projects, case studies, and visual work with dedicated detail pages.",
  desc2: "",
  sideImage: "/bg1.jpg",
  sideImageTitle: "Portfolio",
  productSectionTitle: "All portfolio items",
  layout: DEFAULT_PORTFOLIO_INDEX_LAYOUT,
  detailLayout: DEFAULT_PORTFOLIO_DETAIL_LAYOUT,
  portfolioItems: [],
});

const isPortfolioPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    href === "#page-portfolio" ||
    href === "#page-portfolios" ||
    href === "#page-projects" ||
    href === "#page-project" ||
    label === "portfolio" ||
    label === "portfolios" ||
    label === "projects" ||
    label === "project"
  );
};

const flattenPageLinks = (links: PageLink[]): PageLink[] =>
  links.flatMap((link) => [link, ...flattenPageLinks(link.children ?? [])]);

const mapPortfolioWebsiteVisibility = (
  links: PageLink[],
  enabled: boolean,
  nav: { label: string; href: string },
): PageLink[] => {
  let touched = false;
  const next = links.map((link) => {
    const children = link.children?.length
      ? mapPortfolioWebsiteVisibility(link.children, enabled, nav)
      : link.children;
    if (isPortfolioPageLink(link)) {
      touched = true;
      return {
        ...link,
        label: link.label || nav.label,
        href: link.href || nav.href,
        hidden: !enabled,
        children,
      };
    }
    if (children !== link.children) {
      return { ...link, children };
    }
    return link;
  });
  if (enabled && !touched && !flattenPageLinks(next).some(isPortfolioPageLink)) {
    return [
      ...next,
      {
        label: nav.label,
        href: nav.href,
        hidden: false,
      },
    ];
  }
  return next;
};

const stripHtmlPreview = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const tabItems: Array<{
  id: PortfolioTab;
  label: string;
  icon: typeof BriefcaseBusiness;
}> = [
  { id: "portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "seo", label: "SEO", icon: Settings2 },
];

const LayoutPreviewMock = ({ layout }: { layout: PortfolioLayoutOption }) => {
  switch (layout.preview) {
    case "feature":
      return (
        <div className="absolute inset-x-5 bottom-5 space-y-2 text-white">
          <div className="h-3 w-2/3 rounded bg-white/90" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((card) => (
              <div key={card} className="h-14 rounded-lg bg-white/20" />
            ))}
          </div>
        </div>
      );
    case "cards":
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="rounded-xl bg-white/15 p-2 backdrop-blur-sm"
            >
              <div className="h-10 rounded-lg bg-white/30" />
              <div className="mt-2 h-1.5 w-4/5 rounded bg-white/80" />
            </div>
          ))}
        </div>
      );
    case "grid":
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((card) => (
            <div key={card} className="h-12 rounded-lg bg-white/20" />
          ))}
        </div>
      );
    case "editorial":
      return (
        <div className="absolute inset-x-7 bottom-6 grid grid-cols-[0.8fr_1.2fr] gap-5 text-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
              Editorial
            </span>
            <p className="mt-2 text-xl font-bold">Portfolio detail</p>
          </div>
          <div className="space-y-2 pt-3">
            <div className="h-1.5 rounded bg-white/80" />
            <div className="h-1.5 w-4/5 rounded bg-white/60" />
            <div className="h-1.5 w-3/5 rounded bg-white/40" />
          </div>
        </div>
      );
    case "hero":
      return (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-6 pb-6 pt-16 text-white">
          <div className="h-2 w-16 rounded bg-blue-200/80" />
          <div className="mt-3 h-4 w-4/5 rounded bg-white/90" />
          <div className="mt-2 h-2 w-1/3 rounded bg-white/50" />
        </div>
      );
    case "sidebar":
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-[1.2fr_0.7fr] gap-3 text-white">
          <div className="space-y-2">
            <div className="h-3 w-4/5 rounded bg-white/90" />
            <div className="h-2 w-full rounded bg-white/40" />
            <div className="h-2 w-5/6 rounded bg-white/30" />
          </div>
          <div className="rounded-xl bg-white/15 p-2">
            <div className="aspect-[3/4] rounded-lg bg-white/25" />
          </div>
        </div>
      );
    case "story":
      return (
        <div className="absolute inset-x-8 bottom-7 text-white">
          <div className="h-5 w-16 rounded-full bg-white/90" />
          <div className="mt-3 h-4 w-full rounded bg-white/90" />
          <div className="mt-2 h-4 w-3/4 rounded bg-white/70" />
        </div>
      );
    case "classic":
      return (
        <div className="absolute inset-x-8 bottom-6 space-y-3 text-white">
          <div className="h-2 w-20 rounded bg-blue-200/80" />
          <div className="h-4 w-4/5 rounded bg-white/90" />
          <div className="h-24 rounded-xl bg-white/20" />
          <div className="h-2 w-full rounded bg-white/40" />
        </div>
      );
    default:
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-[1fr_1fr] gap-3 text-white">
          <div className="space-y-2">
            <div className="h-2 w-16 rounded bg-blue-200/80" />
            <div className="h-3 w-4/5 rounded bg-white/90" />
            <div className="h-2 w-full rounded bg-white/40" />
          </div>
          <div className="rounded-xl bg-white/20" />
        </div>
      );
  }
};

export default function PortfolioManager({
  onClose,
  siteId = "draft",
  preserveNavigation = false,
}: PortfolioManagerProps) {
  const { siteSeoConfig, setSiteSeoConfig, pageLinks, setPageLinks } =
    usePreview();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const categoryParam = searchParams.get("category");
  const portfolioNav = useMemo(
    () => resolveThemePortfolioNavLink(templateId, categoryParam),
    [templateId, categoryParam],
  );
  const [activeTab, setActiveTab] = useState<PortfolioTab>("portfolio");
  const [layoutPane, setLayoutPane] = useState<LayoutPane>("index");
  const [ready, setReady] = useState(false);
  const [pageState, setPageState] = useState<PortfolioPageState>(emptyPageState);
  const [localIndexLayout, setLocalIndexLayout] = useState(
    DEFAULT_PORTFOLIO_INDEX_LAYOUT,
  );
  const [localDetailLayout, setLocalDetailLayout] = useState(
    DEFAULT_PORTFOLIO_DETAIL_LAYOUT,
  );
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PortfolioItem>(emptyPortfolioItem());
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const { aiFieldBusy, generateText, generateImage, requireCorePlanForAi } =
    useManagerAiFields({
      siteId,
      kind: "portfolio",
      getTitle: () => draft.title,
      getItem: () => ({
        title: draft.title,
        desc: draft.desc,
        content: draft.content,
        category: draft.category,
      }),
      getExisting: (field) =>
        field === "summary"
          ? draft.desc
          : field === "content"
            ? draft.content
            : draft.seoDescription,
      onSummary: (text) => setDraft((current) => ({ ...current, desc: text })),
      onContent: (html) =>
        setDraft((current) => ({ ...current, content: html })),
      onSeo: (seo) =>
        setDraft((current) => ({
          ...current,
          seoTitle: seo.seoTitle || current.seoTitle,
          seoDescription: seo.seoDescription || current.seoDescription,
          seoKeywords: seo.seoKeywords || current.seoKeywords,
        })),
      onImage: (url) =>
        setDraft((current) => ({
          ...current,
          image: url,
          alt: current.alt || current.title,
        })),
      imageHintParts: () => [draft.title, draft.category, "portfolio project"],
      avoidImageSrcs: () => [draft.image].filter(Boolean),
    });
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [categories, setCategories] = useState<string[]>([
    DEFAULT_PORTFOLIO_CATEGORY,
  ]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [portfolioItemToDelete, setPortfolioItemToDelete] =
    useState<PortfolioItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [seoDraft, setSeoDraft] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [seoSaveState, setSeoSaveState] = useState<"idle" | "saved">("idle");

  const portfolioWebsiteEnabled = useMemo(() => {
    const link = flattenPageLinks(pageLinks).find(isPortfolioPageLink);
    return Boolean(link && !link.hidden);
  }, [pageLinks]);

  const portfolioSeo = useMemo(
    () => getPageSeo(siteSeoConfig, PORTFOLIO_PAGE_SEO_KEY),
    [siteSeoConfig],
  );

  const categoryStorageKey = `ai-builder-portfolio-categories:${siteId}`;
  const portfolioCategoriesKey = useMemo(
    () =>
      Array.from(
        new Set(
          pageState.portfolioItems
            .map((item) =>
              (item.category || DEFAULT_PORTFOLIO_CATEGORY).trim(),
            )
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [pageState.portfolioItems],
  );

  useEffect(() => {
    if (activeTab !== "seo") return;
    setSeoDraft({
      metaTitle: portfolioSeo.metaTitle || "",
      metaDescription: portfolioSeo.metaDescription || "",
      metaKeywords: portfolioSeo.metaKeywords || "",
    });
    setSeoSaveState("idle");
  }, [activeTab, portfolioSeo]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showContentEditor) return setShowContentEditor(false);
      if (showImagePicker) return setShowImagePicker(false);
      if (showComposer) return closeComposer();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, showComposer, showContentEditor, showImagePicker]);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<PortfolioPageState>).detail;
      if (!detail) return;
      const layout = normalizePortfolioIndexLayout(detail.layout);
      const detailLayout = normalizePortfolioDetailLayout(detail.detailLayout);
      setPageState({
        ...emptyPageState(),
        ...detail,
        layout,
        detailLayout,
        portfolioItems: Array.isArray(detail.portfolioItems)
          ? detail.portfolioItems
          : [],
      });
      setLocalIndexLayout(layout);
      setLocalDetailLayout(detailLayout);
      setReady(true);
    };

    window.addEventListener("ai-builder-portfolio-page-state", handleState);
    window.dispatchEvent(
      new CustomEvent("ai-builder-ensure-portfolio-page", {
        detail: { navigate: !preserveNavigation },
      }),
    );
    // Restore Projects in Header/Nav Menu if an older hide stripped it.
    // ensure-portfolio-page already re-attaches menu — do not fire
    // website-visibility enabled:true here (that confused Show on website).
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("ai-builder-portfolio-page-query"));
    }, 0);

    return () => {
      window.removeEventListener(
        "ai-builder-portfolio-page-state",
        handleState,
      );
    };
  }, [preserveNavigation]);

  const persistCategories = useCallback(
    (next: string[]) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(categoryStorageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [categoryStorageKey],
  );

  const readStoredCategories = useCallback(() => {
    if (typeof window === "undefined") return [] as string[];
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(categoryStorageKey) || "[]",
      ) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }, [categoryStorageKey]);

  useEffect(() => {
    setCategoriesReady(false);
    const saved = readStoredCategories();
    const fromItems = portfolioCategoriesKey
      ? portfolioCategoriesKey.split("\0")
      : [];
    setCategories(
      Array.from(
        new Set([DEFAULT_PORTFOLIO_CATEGORY, ...saved, ...fromItems]),
      ),
    );
    setCategoriesReady(true);
  }, [categoryStorageKey, portfolioCategoriesKey]);

  useEffect(() => {
    if (!categoriesReady) return;
    persistCategories(categories);
  }, [categories, categoriesReady, categoryStorageKey]);

  const patchPortfolioSeo = (patch: Partial<SiteSeoSettings>) => {
    setSiteSeoConfig(
      patchPageSeo(siteSeoConfig, PORTFOLIO_PAGE_SEO_KEY, patch),
    );
  };

  const persist = (next: PortfolioPageState) => {
    const withLayout = {
      ...next,
      layout: normalizePortfolioIndexLayout(next.layout || localIndexLayout),
      detailLayout: normalizePortfolioDetailLayout(
        next.detailLayout || localDetailLayout,
      ),
    };
    setPageState(withLayout);
    window.dispatchEvent(
      new CustomEvent("ai-builder-portfolio-page-update", {
        detail: withLayout,
      }),
    );
  };

  const setPortfolioWebsiteEnabled = (enabled: boolean) => {
    setPageLinks(
      mapPortfolioWebsiteVisibility(pageLinks, enabled, portfolioNav),
    );
    if (enabled) {
      window.dispatchEvent(
        new CustomEvent("ai-builder-ensure-portfolio-page", {
          detail: { forceVisible: true },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("ai-builder-portfolio-website-visibility", {
          detail: { enabled: true },
        }),
      );
      return;
    }

    window.dispatchEvent(
      new CustomEvent("ai-builder-portfolio-website-visibility", {
        detail: { enabled: false },
      }),
    );
  };

  const savePortfolioSeo = () => {
    patchPortfolioSeo({
      metaTitle: seoDraft.metaTitle.trim(),
      metaDescription: seoDraft.metaDescription.trim(),
      metaKeywords: seoDraft.metaKeywords.trim(),
    });
    setSeoSaveState("saved");
    window.setTimeout(() => setSeoSaveState("idle"), 2000);
  };

  const applyIndexLayout = (layoutId: string) => {
    const layout = normalizePortfolioIndexLayout(layoutId);
    setLocalIndexLayout(layout);
    persist({ ...pageState, layout });
  };

  const applyDetailLayout = (layoutId: string) => {
    const detailLayout = normalizePortfolioDetailLayout(layoutId);
    setLocalDetailLayout(detailLayout);
    persist({
      ...pageState,
      detailLayout,
      portfolioItems: pageState.portfolioItems.map((item) => ({
        ...item,
        layout: detailLayout,
      })),
    });
  };

  const nextDefaultOrder = useMemo(() => {
    const maxOrder = pageState.portfolioItems.reduce(
      (max, item) => Math.max(max, item.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [pageState.portfolioItems]);

  const filteredPortfolioItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...pageState.portfolioItems].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    if (!query) return sorted;
    return sorted.filter((item) =>
      [item.title, item.category, item.desc].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [pageState.portfolioItems, search]);

  useEffect(() => {
    setListPage(1);
  }, [search]);

  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredPortfolioItems.length / LIST_PAGE_SIZE),
  );
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedPortfolioItems = useMemo(() => {
    const start = (safeListPage - 1) * LIST_PAGE_SIZE;
    return filteredPortfolioItems.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredPortfolioItems, safeListPage]);

  useEffect(() => {
    if (listPage !== safeListPage) setListPage(safeListPage);
  }, [listPage, safeListPage]);

  const openCreate = () => {
    setEditingId(null);
    const created = emptyPortfolioItem(nextDefaultOrder, localDetailLayout);
    created.category = categories[0] || DEFAULT_PORTFOLIO_CATEGORY;
    setDraft(created);
    setShowComposer(true);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setDraft({
      ...emptyPortfolioItem(1, localDetailLayout),
      ...item,
      content: item.content || "",
      slug: item.slug || createPortfolioSlug(item.title),
      order: item.order ?? 1,
      active: item.active !== false,
      layout: item.layout || localDetailLayout,
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
      seoKeywords: item.seoKeywords || "",
      status: item.status || "",
      location: item.location || "",
    });
    setShowComposer(true);
  };

  function closeComposer() {
    setShowComposer(false);
    setEditingId(null);
    setShowContentEditor(false);
    setDraft(emptyPortfolioItem());
  }

  const addCategory = () => {
    const value = categoryName.trim();
    if (!value) return;
    setCategories((current) => {
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return current;
      }
      return [...current, value];
    });
    setCategoryName("");
  };

  const saveEditCategory = () => {
    if (!editingCategory) return;
    const nextName = editCategoryName.trim();
    if (!nextName) return;
    const duplicate = categories.some(
      (item) =>
        item !== editingCategory &&
        item.toLowerCase() === nextName.toLowerCase(),
    );
    if (duplicate) return;
    setCategories((current) =>
      current.map((item) => (item === editingCategory ? nextName : item)),
    );
    setPageState((current) => ({
      ...current,
      portfolioItems: current.portfolioItems.map((item) =>
        (item.category || DEFAULT_PORTFOLIO_CATEGORY) === editingCategory
          ? { ...item, category: nextName }
          : item,
      ),
    }));
    if ((draft.category || DEFAULT_PORTFOLIO_CATEGORY) === editingCategory) {
      setDraft((current) => ({ ...current, category: nextName }));
    }
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const savePortfolioItem = () => {
    const title = draft.title.trim();
    if (!title) return;
    const slug = uniquePortfolioSlug(
      createPortfolioSlug(draft.slug || title) || `portfolio-${Date.now()}`,
      pageState.portfolioItems,
      editingId,
    );
    const nextItem: PortfolioItem = {
      ...draft,
      title,
      category: draft.category.trim() || DEFAULT_PORTFOLIO_CATEGORY,
      desc: draft.desc.trim(),
      content: draft.content || "",
      image: draft.image.trim() || "/bg1.jpg",
      alt: draft.alt?.trim() || title,
      slug,
      order: Math.max(1, Number(draft.order) || 1),
      active: draft.active !== false,
      featured: draft.featured === true,
      layout: draft.layout || localDetailLayout,
      seoTitle: draft.seoTitle?.trim() || title,
      seoDescription: draft.seoDescription?.trim() || draft.desc.trim(),
      seoKeywords: draft.seoKeywords?.trim() || "",
      status: draft.status?.trim() || "",
      location: draft.location?.trim() || "",
    };

    const portfolioItems = editingId
      ? pageState.portfolioItems.map((item) =>
          item.id === editingId ? nextItem : item,
        )
      : [...pageState.portfolioItems, nextItem];

    persist({ ...pageState, portfolioItems });
    closeComposer();
  };

  const deletePortfolioItem = (id: string) => {
    persist({
      ...pageState,
      portfolioItems: pageState.portfolioItems.filter((item) => item.id !== id),
    });
  };

  const deletePortfolioItemsByIds = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    persist({
      ...pageState,
      portfolioItems: pageState.portfolioItems.filter((item) => !idSet.has(item.id)),
    });
    setSelected([]);
  };

  const confirmDeletePortfolioItem = () => {
    if (!portfolioItemToDelete) return;
    deletePortfolioItem(portfolioItemToDelete.id);
    setSelected((current) =>
      current.filter((id) => id !== portfolioItemToDelete.id),
    );
    setPortfolioItemToDelete(null);
  };

  const content = (
    <div
      className="fixed inset-0 z-[10050] flex min-h-0 flex-col bg-white text-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-manager-title"
    >
      <header className="flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Portfolio
          </p>
          <h1 id="portfolio-manager-title" className="sr-only">
            Portfolio page manager
          </h1>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <label
            className={`flex max-w-full cursor-pointer items-center gap-2.5 rounded-full border px-3 py-1.5 sm:px-4 ${
              portfolioWebsiteEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <span className="hidden text-xs font-semibold sm:inline">
              Show on website
            </span>
            <span className="text-xs font-semibold sm:hidden">Website</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={portfolioWebsiteEnabled}
              onChange={(event) =>
                setPortfolioWebsiteEnabled(event.target.checked)
              }
            />
            <span
              aria-hidden="true"
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                portfolioWebsiteEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  portfolioWebsiteEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Portfolio page help"
          >
            <CircleHelp size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close portfolio manager"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {!portfolioWebsiteEnabled ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-900 sm:px-7">
          Portfolio is hidden on the live website. Items stay saved here -{" "}
          <span className="font-semibold">{portfolioNav.path}</span> and detail
          links will show 404 until you turn{" "}
          <span className="font-semibold">Show on website</span> on, then
          republish.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="w-[116px] shrink-0 border-r border-slate-200 bg-white p-2 sm:w-[148px] sm:p-3">
          <nav className="space-y-1">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {!ready ? (
            <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">
              Loading portfolio page...
            </div>
          ) : null}

          {ready && activeTab === "portfolio" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Portfolio
                  </h2>
                  <p className="mt-2 text-base text-slate-600">
                    Create and manage portfolio items shown on your Portfolio
                    page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="AI Assist — generate portfolio items"
                    aria-label="AI Assist"
                    onClick={() => {
                      if (!requireCorePlanForAi()) return;
                      window.dispatchEvent(
                        new CustomEvent("ai-builder-open-ai-assist", {
                          detail: {
                            source: "portfolio-manager",
                            hint: "add portfolio items",
                          },
                        }),
                      );
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition hover:bg-blue-100 hover:text-blue-800"
                  >
                    <Sparkles size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    New Portfolio Item
                  </button>
                </div>
              </div>

              <div className="mt-6 flex max-w-md items-center gap-2 rounded-xl border border-slate-300 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search portfolio items"
                  className="h-11 w-full bg-transparent text-sm outline-none"
                />
              </div>

              {selected.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">
                    {selected.length} portfolio item
                    {selected.length === 1 ? "" : "s"} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected([])}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkDeleteConfirm(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[42px_minmax(220px,1.5fr)_110px_70px_90px_100px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <input
                    type="checkbox"
                    checked={
                      pagedPortfolioItems.length > 0 &&
                      pagedPortfolioItems.every((item) =>
                        selected.includes(item.id),
                      )
                    }
                    onChange={() => {
                      const ids = pagedPortfolioItems.map((item) => item.id);
                      const allSelected = ids.every((id) =>
                        selected.includes(id),
                      );
                      setSelected((current) =>
                        allSelected
                          ? current.filter((id) => !ids.includes(id))
                          : Array.from(new Set([...current, ...ids])),
                      );
                    }}
                    aria-label="Select all portfolio items on this page"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>Portfolio Item</span>
                  <span>Category</span>
                  <span>Order</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                {pagedPortfolioItems.map((item) => {
                  const isActive = item.active !== false;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[42px_minmax(220px,1.5fr)_110px_70px_90px_100px] items-center border-b border-slate-200 px-5 py-4 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id],
                          )
                        }
                        aria-label={`Select ${item.title}`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image || "/bg1.jpg"}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-950">
                            {item.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                            {item.desc || "No description"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-600">
                        {item.category || DEFAULT_PORTFOLIO_CATEGORY}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {item.order ?? "-"}
                      </span>
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        {isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          aria-label={`Edit ${item.title}`}
                        >
                          <FilePenLine size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioItemToDelete(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredPortfolioItems.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-slate-500">
                    No portfolio items yet. Add your first portfolio item to show
                    on the page.
                  </div>
                )}

                {filteredPortfolioItems.length > LIST_PAGE_SIZE ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                    <p className="text-sm text-slate-600">
                      Showing {(safeListPage - 1) * LIST_PAGE_SIZE + 1}–
                      {Math.min(
                        safeListPage * LIST_PAGE_SIZE,
                        filteredPortfolioItems.length,
                      )}{" "}
                      of {filteredPortfolioItems.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setListPage((page) => Math.max(1, page - 1))
                        }
                        disabled={safeListPage <= 1}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>
                      <span className="min-w-[4.5rem] text-center text-sm font-semibold text-slate-700">
                        {safeListPage} / {listTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setListPage((page) =>
                            Math.min(listTotalPages, page + 1),
                          )
                        }
                        disabled={safeListPage >= listTotalPages}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {ready && activeTab === "categories" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Categories
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Organize portfolio items into reusable categories.
              </p>
              <form
                className="mt-7 flex max-w-xl gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  addCategory();
                }}
              >
                <input
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Category name"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!categoryName.trim()}
                  className="rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add category
                </button>
              </form>
              <div className="mt-6 max-w-xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {categories.map((category) => {
                  const used = pageState.portfolioItems.some(
                    (item) =>
                      (item.category || DEFAULT_PORTFOLIO_CATEGORY) === category,
                  );
                  const isEditing = editingCategory === category;
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      {isEditing ? (
                        <form
                          className="flex min-w-0 flex-1 items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            saveEditCategory();
                          }}
                        >
                          <Tags size={16} className="shrink-0 text-blue-600" />
                          <input
                            autoFocus
                            value={editCategoryName}
                            onChange={(event) =>
                              setEditCategoryName(event.target.value)
                            }
                            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="submit"
                            disabled={!editCategoryName.trim()}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditCategoryName("");
                            }}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-800">
                            <Tags size={16} className="shrink-0 text-blue-600" />
                            <span className="truncate">{category}</span>
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(category);
                                setEditCategoryName(category);
                              }}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Edit ${category}`}
                            >
                              <FilePenLine size={15} />
                            </button>
                            {category === DEFAULT_PORTFOLIO_CATEGORY ? (
                              <span className="px-2 text-sm font-semibold text-slate-300">
                                Default
                              </span>
                            ) : used ? (
                              <span className="px-2 text-sm font-semibold text-slate-300">
                                In use
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setCategories((current) =>
                                    current.filter((item) => item !== category),
                                  )
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${category}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {ready && activeTab === "templates" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Portfolio layouts
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Choose a listing layout for the Portfolio page and a detail
                layout for individual portfolio items.
              </p>

              <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setLayoutPane("index")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    layoutPane === "index"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Portfolio
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutPane("detail")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    layoutPane === "detail"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Detail Pages
                </button>
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-500">
                {layoutPane === "index"
                  ? "Applied to the Portfolio listing page for every visitor."
                  : "Applied as the default for all portfolio detail pages."}
              </p>

              <div className="mt-6 grid w-full gap-7 md:grid-cols-2 xl:grid-cols-3">
                {(layoutPane === "index"
                  ? PORTFOLIO_INDEX_LAYOUTS
                  : PORTFOLIO_DETAIL_LAYOUTS
                ).map((layout) => {
                  const active =
                    layoutPane === "index"
                      ? localIndexLayout === layout.id
                      : localDetailLayout === layout.id;
                  return (
                    <article
                      key={layout.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                        active
                          ? "border-blue-500 ring-2 ring-blue-100"
                          : "border-slate-200 hover:-translate-y-0.5 hover:shadow-lg"
                      }`}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                        <Image
                          src={layout.image}
                          alt={`${layout.name} portfolio layout preview`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                        <LayoutPreviewMock layout={layout} />
                        {active ? (
                          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                            <Check size={14} /> Selected
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-3 p-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-950">
                            {layout.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {layout.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            layoutPane === "index"
                              ? applyIndexLayout(layout.id)
                              : applyDetailLayout(layout.id)
                          }
                          className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            active
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-950 text-white hover:bg-slate-800"
                          }`}
                        >
                          {active ? "Current choice" : "Use this layout"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {ready && activeTab === "seo" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Portfolio page SEO
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Meta tags for the Portfolio page. Each portfolio item can also
                have its own SEO in the add/edit form.
              </p>
              <div className="mt-7 max-w-xl space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Meta title
                  </span>
                  <input
                    type="text"
                    value={seoDraft.metaTitle}
                    onChange={(event) => {
                      setSeoSaveState("idle");
                      setSeoDraft((current) => ({
                        ...current,
                        metaTitle: event.target.value,
                      }));
                    }}
                    placeholder="Portfolio page title for Google"
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Meta description
                  </span>
                  <textarea
                    value={seoDraft.metaDescription}
                    onChange={(event) => {
                      setSeoSaveState("idle");
                      setSeoDraft((current) => ({
                        ...current,
                        metaDescription: event.target.value,
                      }));
                    }}
                    rows={3}
                    placeholder="Short summary for search results"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Meta keywords
                  </span>
                  <input
                    type="text"
                    value={seoDraft.metaKeywords}
                    onChange={(event) => {
                      setSeoSaveState("idle");
                      setSeoDraft((current) => ({
                        ...current,
                        metaKeywords: event.target.value,
                      }));
                    }}
                    placeholder="portfolio, case study, showcase"
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={savePortfolioSeo}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Check size={16} />
                    {seoSaveState === "saved" ? "Saved" : "Save SEO"}
                  </button>
                  {seoSaveState === "saved" ? (
                    <span className="text-sm font-medium text-emerald-600">
                      Portfolio page SEO updated.
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">
                      Click Save SEO to apply meta title, description, and
                      keywords.
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {showComposer &&
        createPortal(
          <div
            className="fixed inset-0 z-[10060] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeComposer();
            }}
          >
            <div className="my-auto max-h-[calc(100dvh-2rem)] w-[min(96vw,920px)] overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <header className="relative border-b border-slate-200 bg-slate-100 px-14 py-4 text-center">
                <h3 className="text-2xl font-medium text-slate-950">
                  {editingId ? "Edit portfolio item" : "Create new portfolio item"}
                </h3>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="mx-auto w-full max-w-[820px] space-y-5 px-6 py-7">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Title
                  </span>
                  <input
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        title: event.target.value,
                        slug:
                          !current.slug ||
                          current.slug === createPortfolioSlug(current.title)
                            ? createPortfolioSlug(event.target.value)
                            : current.slug,
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Portfolio item title"
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    URL slug
                  </span>
                  <input
                    value={draft.slug || ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        slug: createPortfolioSlug(event.target.value),
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="brand-identity-redesign"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Detail page: {portfolioNav.path}/{draft.slug || "your-slug"}
                  </p>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Category
                    </span>
                    <select
                      value={
                        categories.includes(draft.category) || Boolean(draft.category)
                          ? draft.category || DEFAULT_PORTFOLIO_CATEGORY
                          : categories[0] || DEFAULT_PORTFOLIO_CATEGORY
                      }
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {Array.from(
                        new Set([
                          ...categories,
                          ...(draft.category ? [draft.category] : []),
                        ]),
                      ).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Location
                    </span>
                    <input
                      value={draft.location || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="NH-24, Ghaziabad"
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Card badge
                    </span>
                    <input
                      value={draft.status || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Completed"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Shown on Latest Projects cards, e.g. New launch.
                    </p>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Order
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={draft.order ?? 1}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          order: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Status
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({ ...current, active: true }))
                      }
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        draft.active !== false
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Eye size={15} />
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({ ...current, active: false }))
                      }
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        draft.active === false
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <EyeOff size={15} />
                      Inactive
                    </button>
                  </div>
                  <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={draft.featured === true}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          featured: event.target.checked,
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    <span>
                      <span className="font-semibold">Also show on homepage</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Turn on for homepage project sections. Leave off for
                        the projects page only.
                      </span>
                    </span>
                  </label>
                </div>

                <label className="block">
                  <FieldLabelWithAi
                    label="Short description"
                    aiTitle="AI generate short description"
                    aiLoading={aiFieldBusy === "summary"}
                    onAiClick={() => generateText("summary")}
                  />
                  <textarea
                    value={draft.desc}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        desc: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Shown on the portfolio card"
                  />
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">
                      Content
                    </span>
                    <div className="flex items-center gap-2">
                      <AiFieldButton
                        title="AI generate content"
                        loading={aiFieldBusy === "content"}
                        onClick={() => generateText("content")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowContentEditor(true)}
                        className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                      >
                        Open editor
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContentEditor(true)}
                    className="min-h-[72px] w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/30"
                  >
                    {(draft.content || "").trim() ? (
                      <div
                        className="line-clamp-2 prose prose-sm max-w-none text-slate-800 [&_p]:my-0"
                        dangerouslySetInnerHTML={{ __html: draft.content || "" }}
                      />
                    ) : (
                      <p className="text-sm text-slate-400">
                        Write full portfolio content... Click to open the rich
                        text editor.
                      </p>
                    )}
                    {(draft.content || "").trim() ? (
                      <p className="mt-1.5 text-xs font-medium text-slate-500">
                        {stripHtmlPreview(draft.content || "")
                          .split(/\s+/)
                          .filter(Boolean).length}{" "}
                        words - Click to edit
                      </p>
                    ) : null}
                  </button>
                </div>

                <div>
                  <FieldLabelWithAi
                    label="Image"
                    aiTitle="AI generate image"
                    aiLoading={aiFieldBusy === "image"}
                    onAiClick={() => generateImage()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="group relative grid h-[102px] w-[102px] place-items-center overflow-hidden rounded-md border border-dashed border-slate-500 bg-slate-50 text-slate-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {draft.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={draft.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-1 text-center text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                          Change
                        </span>
                      </>
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-sm">
                        <Plus size={22} />
                        Image
                      </span>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Portfolio item SEO
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Optional meta for this portfolio item.
                      </p>
                    </div>
                    <AiFieldButton
                      title="AI generate SEO meta"
                      loading={aiFieldBusy === "seo"}
                      onClick={() => generateText("seo")}
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                        SEO title
                      </span>
                      <input
                        value={draft.seoTitle || ""}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            seoTitle: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                        placeholder="Defaults to portfolio title"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                        SEO description
                      </span>
                      <textarea
                        value={draft.seoDescription || ""}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            seoDescription: event.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder="Defaults to short description"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                        SEO keywords
                      </span>
                      <input
                        value={draft.seoKeywords || ""}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            seoKeywords: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                        placeholder="portfolio, case study, showcase"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeComposer}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePortfolioItem}
                  disabled={!draft.title.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {editingId ? "Save changes" : "Add portfolio item"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showContentEditor
        ? createPortal(
            <CustomSectionRichTextEditor
              open
              initialValue={draft.content || ""}
              placeholder="Write the complete portfolio content..."
              overlayClassName="z-[10090]"
              onClose={() => setShowContentEditor(false)}
              onSave={(html) => {
                setDraft((current) => ({ ...current, content: html }));
                setShowContentEditor(false);
              }}
            />,
            document.body,
          )
        : null}

      <ImageLibraryPicker
        open={showImagePicker}
        title="Portfolio image"
        initialValue={draft.image}
        onClose={() => setShowImagePicker(false)}
        onSelect={(source, fileName) => {
          setDraft((current) => ({
            ...current,
            image: source,
            alt: fileName || current.alt || current.title,
          }));
          setShowImagePicker(false);
        }}
      />

      {portfolioItemToDelete ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-portfolio-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete portfolio item
            </p>
            <h3
              id="delete-portfolio-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Are you sure you want to delete &quot;
              {portfolioItemToDelete.title.trim() || "this portfolio item"}
              &quot;?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes it from the Portfolio page. You cannot undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={confirmDeletePortfolioItem}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setPortfolioItemToDelete(null)}
                className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkDeleteConfirm && selected.length > 0 ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-portfolio-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete portfolio items
            </p>
            <h3
              id="bulk-delete-portfolio-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Delete {selected.length} selected portfolio item
              {selected.length === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes them from the Portfolio page. You can&apos;t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  deletePortfolioItemsByIds(selected);
                  setBulkDeleteConfirm(false);
                }}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
