"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Images,
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
import {
  AiFieldButton,
  FieldLabelWithAi,
  useManagerAiFields,
} from "./managerAi";
import { usePreview } from "../layout/src/components/context/PreviewContext";
import {
  getPageSeo,
  patchPageSeo,
  type SiteSeoSettings,
} from "@/lib/siteSeo";
import {
  DEFAULT_GALLERY_INDEX_LAYOUT,
  GALLERY_INDEX_LAYOUTS,
  normalizeGalleryIndexLayout,
  type GalleryLayoutOption,
} from "../layout/src/lib/galleryLayouts";

type GalleryTab = "gallery" | "categories" | "templates" | "seo";

const DEFAULT_GALLERY_CATEGORY = "Gallery";
const LIST_PAGE_SIZE = 5;
const GALLERY_PAGE_SEO_KEY = "Gallery";

export type GalleryItem = {
  id: string;
  title: string;
  category: string;
  desc: string;
  image: string;
  alt?: string;
  order?: number;
  active?: boolean;
};

export type GalleryPageState = {
  pretitle: string;
  title: string;
  desc: string;
  layout?: string;
  galleryItems: GalleryItem[];
};

type GalleryManagerProps = {
  onClose: () => void;
  siteId?: string;
};

const emptyGalleryItem = (order = 1): GalleryItem => ({
  id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  category: DEFAULT_GALLERY_CATEGORY,
  desc: "",
  image: "",
  alt: "",
  order,
  active: true,
});

const emptyPageState = (): GalleryPageState => ({
  pretitle: "Our Gallery",
  title: "Moments worth sharing",
  desc: "Browse photos and visuals from our work, events, and community.",
  layout: DEFAULT_GALLERY_INDEX_LAYOUT,
  galleryItems: [],
});

const isGalleryPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return href === "#page-gallery" || label === "gallery";
};

const tabItems: Array<{
  id: GalleryTab;
  label: string;
  icon: typeof Images;
}> = [
  { id: "gallery", label: "Gallery items", icon: Images },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "seo", label: "SEO", icon: Settings2 },
];

const LayoutPreviewMock = ({ layout }: { layout: GalleryLayoutOption }) => {
  switch (layout.preview) {
    case "plain":
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((card) => (
            <div key={card} className="space-y-1">
              <div className="h-12 rounded-lg bg-white/25" />
              <div className="h-1 w-3/4 rounded bg-white/70" />
            </div>
          ))}
        </div>
      );
    case "slider":
      return (
        <div className="absolute inset-x-5 bottom-5">
          <div className="relative h-16 rounded-xl bg-white/20">
            <div className="absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white/40" />
            <div className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white/40" />
            <div className="absolute inset-x-8 bottom-2 h-1.5 rounded bg-white/80" />
          </div>
        </div>
      );
    case "grid":
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((card) => (
            <div key={card} className="aspect-square rounded-md bg-white/20" />
          ))}
        </div>
      );
    case "tabs":
      return (
        <div className="absolute inset-x-5 bottom-5 space-y-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((tab) => (
              <div
                key={tab}
                className={`h-4 w-10 rounded-full ${tab === 0 ? "bg-white/90" : "bg-white/30"}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((card) => (
              <div key={card} className="h-10 rounded-md bg-white/20" />
            ))}
          </div>
        </div>
      );
    case "random":
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 auto-rows-[28px] gap-1.5">
          <div className="col-span-2 row-span-2 rounded-md bg-white/25" />
          <div className="rounded-md bg-white/20" />
          <div className="row-span-2 rounded-md bg-white/20" />
          <div className="rounded-md bg-white/15" />
          <div className="col-span-2 rounded-md bg-white/15" />
        </div>
      );
    default:
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((card) => (
            <div key={card} className="h-12 rounded-lg bg-white/20" />
          ))}
        </div>
      );
  }
};

export default function GalleryManager({
  onClose,
  siteId = "draft",
}: GalleryManagerProps) {
  const { siteSeoConfig, setSiteSeoConfig, pageLinks, setPageLinks } =
    usePreview();
  const [activeTab, setActiveTab] = useState<GalleryTab>("gallery");
  const [ready, setReady] = useState(false);
  const [pageState, setPageState] = useState<GalleryPageState>(emptyPageState);
  const [localIndexLayout, setLocalIndexLayout] = useState(
    DEFAULT_GALLERY_INDEX_LAYOUT,
  );
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryItem>(emptyGalleryItem());
  const { aiFieldBusy, generateText, generateImage, requireCorePlanForAi } =
    useManagerAiFields({
      siteId,
      kind: "gallery",
      getTitle: () => draft.title,
      getItem: () => ({
        title: draft.title,
        desc: draft.desc,
        category: draft.category,
      }),
      getExisting: (field) => (field === "summary" ? draft.desc : undefined),
      onSummary: (text) => setDraft((current) => ({ ...current, desc: text })),
      onImage: (url) =>
        setDraft((current) => ({
          ...current,
          image: url,
          alt: current.alt || current.title,
        })),
      imageHintParts: () => [draft.title, draft.category, "gallery photo"],
      avoidImageSrcs: () => [draft.image].filter(Boolean),
    });
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [categories, setCategories] = useState<string[]>([
    DEFAULT_GALLERY_CATEGORY,
  ]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [galleryItemToDelete, setGalleryItemToDelete] =
    useState<GalleryItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [seoDraft, setSeoDraft] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [seoSaveState, setSeoSaveState] = useState<"idle" | "saved">("idle");

  const galleryWebsiteEnabled = useMemo(() => {
    const link = pageLinks.find(isGalleryPageLink);
    return Boolean(link && !link.hidden);
  }, [pageLinks]);

  const gallerySeo = useMemo(
    () => getPageSeo(siteSeoConfig, GALLERY_PAGE_SEO_KEY),
    [siteSeoConfig],
  );

  const categoryStorageKey = `ai-builder-gallery-categories:${siteId}`;
  const galleryCategoriesKey = useMemo(
    () =>
      Array.from(
        new Set(
          pageState.galleryItems
            .map((item) =>
              (item.category || DEFAULT_GALLERY_CATEGORY).trim(),
            )
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [pageState.galleryItems],
  );

  useEffect(() => {
    if (activeTab !== "seo") return;
    setSeoDraft({
      metaTitle: gallerySeo.metaTitle || "",
      metaDescription: gallerySeo.metaDescription || "",
      metaKeywords: gallerySeo.metaKeywords || "",
    });
    setSeoSaveState("idle");
  }, [activeTab, gallerySeo]);

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
      if (showImagePicker) return setShowImagePicker(false);
      if (showComposer) return closeComposer();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, showComposer, showImagePicker]);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<GalleryPageState>).detail;
      if (!detail) return;
      const layout = normalizeGalleryIndexLayout(detail.layout);
      setPageState({
        ...emptyPageState(),
        ...detail,
        layout,
        galleryItems: Array.isArray(detail.galleryItems)
          ? detail.galleryItems
          : [],
      });
      setLocalIndexLayout(layout);
      setReady(true);
    };

    window.addEventListener("ai-builder-gallery-page-state", handleState);
    window.dispatchEvent(new CustomEvent("ai-builder-ensure-gallery-page"));
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("ai-builder-gallery-page-query"));
    }, 0);

    return () => {
      window.removeEventListener(
        "ai-builder-gallery-page-state",
        handleState,
      );
    };
  }, []);

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
    const fromItems = galleryCategoriesKey
      ? galleryCategoriesKey.split("\0")
      : [];
    setCategories(
      Array.from(
        new Set([DEFAULT_GALLERY_CATEGORY, ...saved, ...fromItems]),
      ),
    );
    setCategoriesReady(true);
  }, [categoryStorageKey, galleryCategoriesKey, readStoredCategories]);

  useEffect(() => {
    if (!categoriesReady) return;
    persistCategories(categories);
  }, [categories, categoriesReady, persistCategories]);

  const patchGallerySeo = (patch: Partial<SiteSeoSettings>) => {
    setSiteSeoConfig(
      patchPageSeo(siteSeoConfig, GALLERY_PAGE_SEO_KEY, patch),
    );
  };

  const persist = (next: GalleryPageState) => {
    const withLayout = {
      ...next,
      layout: normalizeGalleryIndexLayout(next.layout || localIndexLayout),
    };
    setPageState(withLayout);
    window.dispatchEvent(
      new CustomEvent("ai-builder-gallery-page-update", {
        detail: withLayout,
      }),
    );
  };

  const setGalleryWebsiteEnabled = (enabled: boolean) => {
    if (enabled) {
      const hasLink = pageLinks.some(isGalleryPageLink);
      setPageLinks(
        hasLink
          ? pageLinks.map((page) =>
              isGalleryPageLink(page)
                ? {
                    ...page,
                    label: page.label || "Gallery",
                    href: page.href || "#page-gallery",
                    hidden: false,
                  }
                : page,
            )
          : [
              ...pageLinks,
              {
                label: "Gallery",
                href: "#page-gallery",
                hidden: false,
              },
            ],
      );
      window.dispatchEvent(
        new CustomEvent("ai-builder-ensure-gallery-page"),
      );
      window.dispatchEvent(
        new CustomEvent("ai-builder-gallery-website-visibility", {
          detail: { enabled: true },
        }),
      );
      return;
    }

    setPageLinks(
      pageLinks.map((page) =>
        isGalleryPageLink(page) ? { ...page, hidden: true } : page,
      ),
    );
    window.dispatchEvent(
      new CustomEvent("ai-builder-gallery-website-visibility", {
        detail: { enabled: false },
      }),
    );
  };

  const saveGallerySeo = () => {
    patchGallerySeo({
      metaTitle: seoDraft.metaTitle.trim(),
      metaDescription: seoDraft.metaDescription.trim(),
      metaKeywords: seoDraft.metaKeywords.trim(),
    });
    setSeoSaveState("saved");
    window.setTimeout(() => setSeoSaveState("idle"), 2000);
  };

  const applyIndexLayout = (layoutId: string) => {
    const layout = normalizeGalleryIndexLayout(layoutId);
    setLocalIndexLayout(layout);
    persist({ ...pageState, layout });
  };

  const nextDefaultOrder = useMemo(() => {
    const maxOrder = pageState.galleryItems.reduce(
      (max, item) => Math.max(max, item.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [pageState.galleryItems]);

  const filteredGalleryItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...pageState.galleryItems].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    if (!query) return sorted;
    return sorted.filter((item) =>
      [item.title, item.category, item.desc].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [pageState.galleryItems, search]);

  useEffect(() => {
    setListPage(1);
  }, [search]);

  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredGalleryItems.length / LIST_PAGE_SIZE),
  );
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedGalleryItems = useMemo(() => {
    const start = (safeListPage - 1) * LIST_PAGE_SIZE;
    return filteredGalleryItems.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredGalleryItems, safeListPage]);

  useEffect(() => {
    if (listPage !== safeListPage) setListPage(safeListPage);
  }, [listPage, safeListPage]);

  const openCreate = () => {
    setEditingId(null);
    const created = emptyGalleryItem(nextDefaultOrder);
    created.category = categories[0] || DEFAULT_GALLERY_CATEGORY;
    setDraft(created);
    setShowComposer(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setDraft({
      ...emptyGalleryItem(1),
      ...item,
      order: item.order ?? 1,
      active: item.active !== false,
    });
    setShowComposer(true);
  };

  function closeComposer() {
    setShowComposer(false);
    setEditingId(null);
    setDraft(emptyGalleryItem());
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
    const nextItems = pageState.galleryItems.map((item) =>
      (item.category || DEFAULT_GALLERY_CATEGORY) === editingCategory
        ? { ...item, category: nextName }
        : item,
    );
    persist({ ...pageState, galleryItems: nextItems });
    if ((draft.category || DEFAULT_GALLERY_CATEGORY) === editingCategory) {
      setDraft((current) => ({ ...current, category: nextName }));
    }
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const saveGalleryItem = () => {
    const title = draft.title.trim();
    if (!title) return;
    const nextItem: GalleryItem = {
      ...draft,
      title,
      category: draft.category.trim() || DEFAULT_GALLERY_CATEGORY,
      desc: draft.desc.trim(),
      image: draft.image.trim() || "/bg1.jpg",
      alt: draft.alt?.trim() || title,
      order: Math.max(1, Number(draft.order) || 1),
      active: draft.active !== false,
    };

    const galleryItems = editingId
      ? pageState.galleryItems.map((item) =>
          item.id === editingId ? nextItem : item,
        )
      : [...pageState.galleryItems, nextItem];

    persist({ ...pageState, galleryItems });
    closeComposer();
  };

  const deleteGalleryItem = (id: string) => {
    persist({
      ...pageState,
      galleryItems: pageState.galleryItems.filter((item) => item.id !== id),
    });
  };

  const deleteGalleryItemsByIds = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    persist({
      ...pageState,
      galleryItems: pageState.galleryItems.filter((item) => !idSet.has(item.id)),
    });
    setSelected([]);
  };

  const confirmDeleteGalleryItem = () => {
    if (!galleryItemToDelete) return;
    deleteGalleryItem(galleryItemToDelete.id);
    setSelected((current) =>
      current.filter((id) => id !== galleryItemToDelete.id),
    );
    setGalleryItemToDelete(null);
  };

  const content = (
    <div
      className="fixed inset-0 z-[10050] flex min-h-0 flex-col bg-white text-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-manager-title"
    >
      <header className="flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Gallery
          </p>
          <h1 id="gallery-manager-title" className="sr-only">
            Gallery page manager
          </h1>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <label
            className={`flex max-w-full cursor-pointer items-center gap-2.5 rounded-full border px-3 py-1.5 sm:px-4 ${
              galleryWebsiteEnabled
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
              checked={galleryWebsiteEnabled}
              onChange={(event) =>
                setGalleryWebsiteEnabled(event.target.checked)
              }
            />
            <span
              aria-hidden="true"
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                galleryWebsiteEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  galleryWebsiteEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Gallery page help"
          >
            <CircleHelp size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close gallery manager"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {!galleryWebsiteEnabled ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-900 sm:px-7">
          Gallery is hidden on the live website. Items stay saved here -{" "}
          <span className="font-semibold">/gallery</span> will show 404 until you
          turn <span className="font-semibold">Show on website</span> on, then
          republish.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="w-[168px] shrink-0 border-r border-slate-200 bg-white p-2 sm:w-[200px] sm:p-3">
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
              Loading gallery page...
            </div>
          ) : null}

          {ready && activeTab === "gallery" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Gallery items
                  </h2>
                  <p className="mt-2 text-base text-slate-600">
                    Create and manage images shown on your Gallery page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="AI Assist — generate gallery items"
                    aria-label="AI Assist"
                    onClick={() => {
                      if (!requireCorePlanForAi()) return;
                      window.dispatchEvent(
                        new CustomEvent("ai-builder-open-ai-assist", {
                          detail: {
                            source: "gallery-manager",
                            hint: "add gallery items",
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
                    New gallery item
                  </button>
                </div>
              </div>

              <div className="mt-6 flex max-w-md items-center gap-2 rounded-xl border border-slate-300 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search gallery items"
                  className="h-11 w-full bg-transparent text-sm outline-none"
                />
              </div>

              {selected.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">
                    {selected.length} gallery item
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
                      pagedGalleryItems.length > 0 &&
                      pagedGalleryItems.every((item) =>
                        selected.includes(item.id),
                      )
                    }
                    onChange={() => {
                      const ids = pagedGalleryItems.map((item) => item.id);
                      const allSelected = ids.every((id) =>
                        selected.includes(id),
                      );
                      setSelected((current) =>
                        allSelected
                          ? current.filter((id) => !ids.includes(id))
                          : Array.from(new Set([...current, ...ids])),
                      );
                    }}
                    aria-label="Select all gallery items on this page"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>Gallery item</span>
                  <span>Category</span>
                  <span>Order</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                {pagedGalleryItems.map((item) => {
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
                            {item.desc || "No caption"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-600">
                        {item.category || DEFAULT_GALLERY_CATEGORY}
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
                          onClick={() => setGalleryItemToDelete(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredGalleryItems.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-slate-500">
                    No gallery items yet. Add your first image to show on the
                    page.
                  </div>
                )}

                {filteredGalleryItems.length > LIST_PAGE_SIZE ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                    <p className="text-sm text-slate-600">
                      Showing {(safeListPage - 1) * LIST_PAGE_SIZE + 1}–
                      {Math.min(
                        safeListPage * LIST_PAGE_SIZE,
                        filteredGalleryItems.length,
                      )}{" "}
                      of {filteredGalleryItems.length}
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
                Organize gallery items into reusable categories.
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
                  const used = pageState.galleryItems.some(
                    (item) =>
                      (item.category || DEFAULT_GALLERY_CATEGORY) === category,
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
                            {category === DEFAULT_GALLERY_CATEGORY ? (
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
                Gallery layouts
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Choose a listing layout for the Gallery page. There are no
                detail pages — visitors browse images on this page only.
              </p>

              <p className="mt-5 text-sm font-semibold text-slate-500">
                Applied to the Gallery page for every visitor.
              </p>

              <div className="mt-6 grid w-full gap-7 md:grid-cols-2 xl:grid-cols-3">
                {GALLERY_INDEX_LAYOUTS.map((layout) => {
                  const active = localIndexLayout === layout.id;
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
                          alt={`${layout.name} gallery layout preview`}
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
                          onClick={() => applyIndexLayout(layout.id)}
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
                Gallery page SEO
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Meta tags for the Gallery page.
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
                    placeholder="Gallery page title for Google"
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
                    placeholder="gallery, photos, portfolio"
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={saveGallerySeo}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Check size={16} />
                    {seoSaveState === "saved" ? "Saved" : "Save SEO"}
                  </button>
                  {seoSaveState === "saved" ? (
                    <span className="text-sm font-medium text-emerald-600">
                      Gallery page SEO updated.
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
            <div className="my-auto max-h-[calc(100dvh-2rem)] w-[min(96vw,720px)] overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <header className="relative border-b border-slate-200 bg-slate-100 px-14 py-4 text-center">
                <h3 className="text-2xl font-medium text-slate-950">
                  {editingId ? "Edit gallery item" : "Create new gallery item"}
                </h3>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="mx-auto w-full max-w-[620px] space-y-5 px-6 py-7">
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
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Image title"
                    autoFocus
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Category
                    </span>
                    <select
                      value={
                        categories.includes(draft.category) || Boolean(draft.category)
                          ? draft.category || DEFAULT_GALLERY_CATEGORY
                          : categories[0] || DEFAULT_GALLERY_CATEGORY
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
                </div>

                <label className="block">
                  <FieldLabelWithAi
                    label="Caption"
                    aiTitle="AI generate caption"
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
                    placeholder="Short caption shown with the image"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Alt text
                  </span>
                  <input
                    value={draft.alt || ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        alt: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Describe the image for accessibility"
                  />
                </label>

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
                  onClick={saveGalleryItem}
                  disabled={!draft.title.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {editingId ? "Save changes" : "Add gallery item"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <ImageLibraryPicker
        open={showImagePicker}
        title="Gallery image"
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

      {galleryItemToDelete ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-gallery-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete gallery item
            </p>
            <h3
              id="delete-gallery-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Are you sure you want to delete &quot;
              {galleryItemToDelete.title.trim() || "this gallery item"}
              &quot;?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes it from the Gallery page. You cannot undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={confirmDeleteGalleryItem}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setGalleryItemToDelete(null)}
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
            aria-labelledby="bulk-delete-gallery-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete gallery items
            </p>
            <h3
              id="bulk-delete-gallery-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Delete {selected.length} selected gallery item
              {selected.length === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes them from the Gallery page. You can&apos;t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  deleteGalleryItemsByIds(selected);
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
