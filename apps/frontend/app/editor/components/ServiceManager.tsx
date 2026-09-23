"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Briefcase,
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
import {
  getPageSeo,
  patchPageSeo,
  type SiteSeoSettings,
} from "@/lib/siteSeo";
import {
  DEFAULT_SERVICE_DETAIL_LAYOUT,
  DEFAULT_SERVICE_INDEX_LAYOUT,
  normalizeServiceDetailLayout,
  normalizeServiceIndexLayout,
  SERVICE_DETAIL_LAYOUTS,
  SERVICE_INDEX_LAYOUTS,
  type ServiceLayoutOption,
} from "../layout/src/lib/serviceLayouts";

type ServiceTab = "services" | "categories" | "templates" | "seo";
type LayoutPane = "index" | "detail";

const DEFAULT_SERVICE_CATEGORY = "Service";
const LIST_PAGE_SIZE = 5;

export type ServiceItem = {
  id: string;
  title: string;
  category: string;
  desc: string;
  content?: string;
  image: string;
  alt?: string;
  /** Detail page URL slug (`/service/{slug}`). Auto-filled from title when empty. */
  slug?: string;
  order?: number;
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

const createServiceSlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueServiceSlug = (
  preferred: string,
  services: ServiceItem[],
  excludeId?: string | null,
) => {
  const base = preferred || "service";
  const taken = new Set(
    services
      .filter((service) => service.id !== excludeId)
      .map((service) =>
        (service.slug || createServiceSlug(service.title) || "").toLowerCase(),
      )
      .filter(Boolean),
  );
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};

export type ServicePageState = {
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
  services: ServiceItem[];
};

type ServiceManagerProps = {
  onClose: () => void;
  siteId?: string;
  preserveNavigation?: boolean;
};

const SERVICE_PAGE_SEO_KEY = "Services";

const isServicesPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    href === "#page-service" ||
    href === "#page-services" ||
    label === "service" ||
    label === "services"
  );
};

const stripHtmlPreview = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const tabItems: Array<{
  id: ServiceTab;
  label: string;
  icon: typeof Briefcase;
}> = [
  { id: "services", label: "Services", icon: Briefcase },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "seo", label: "SEO", icon: Settings2 },
];

const emptyService = (order = 1, detailLayout = DEFAULT_SERVICE_DETAIL_LAYOUT): ServiceItem => ({
  id: `service-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  category: DEFAULT_SERVICE_CATEGORY,
  desc: "",
  content: "",
  image: "",
  alt: "",
  slug: "",
  order,
  active: true,
  layout: detailLayout,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
});

const emptyPageState = (): ServicePageState => ({
  pretitle: "Our Services",
  title: "Services that move your business forward",
  subtitle: "What we offer",
  desc: "Describe the services you provide and how they help customers.",
  desc2: "",
  sideImage: "/bg1.jpg",
  sideImageTitle: "Services",
  productSectionTitle: "All services",
  layout: DEFAULT_SERVICE_INDEX_LAYOUT,
  detailLayout: DEFAULT_SERVICE_DETAIL_LAYOUT,
  services: [],
});

const LayoutPreviewMock = ({ layout }: { layout: ServiceLayoutOption }) => {
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
            <p className="mt-2 text-xl font-bold">Service detail</p>
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

export default function ServiceManager({
  onClose,
  siteId = "draft",
  preserveNavigation = false,
}: ServiceManagerProps) {
  const { siteSeoConfig, setSiteSeoConfig, pageLinks, setPageLinks } =
    usePreview();
  const servicesWebsiteEnabled = useMemo(() => {
    const link = pageLinks.find(isServicesPageLink);
    return Boolean(link && !link.hidden);
  }, [pageLinks]);

  const setServicesWebsiteEnabled = (enabled: boolean) => {
    if (enabled) {
      const hasLink = pageLinks.some(isServicesPageLink);
      setPageLinks(
        hasLink
          ? pageLinks.map((page) =>
              isServicesPageLink(page)
                ? {
                    ...page,
                    label: page.label || "Services",
                    href: page.href || "#page-service",
                    hidden: false,
                  }
                : page,
            )
          : [
              ...pageLinks,
              {
                label: "Services",
                href: "#page-service",
                hidden: false,
              },
            ],
      );
      window.dispatchEvent(new CustomEvent("ai-builder-ensure-service-page"));
      window.dispatchEvent(
        new CustomEvent("ai-builder-services-website-visibility", {
          detail: { enabled: true },
        }),
      );
      return;
    }

    setPageLinks(
      pageLinks.map((page) =>
        isServicesPageLink(page) ? { ...page, hidden: true } : page,
      ),
    );
    window.dispatchEvent(
      new CustomEvent("ai-builder-services-website-visibility", {
        detail: { enabled: false },
      }),
    );
  };

  const serviceSeo = useMemo(
    () => getPageSeo(siteSeoConfig, SERVICE_PAGE_SEO_KEY),
    [siteSeoConfig],
  );
  const patchServiceSeo = (patch: Partial<SiteSeoSettings>) => {
    setSiteSeoConfig(patchPageSeo(siteSeoConfig, SERVICE_PAGE_SEO_KEY, patch));
  };

  const [activeTab, setActiveTab] = useState<ServiceTab>("services");
  const [layoutPane, setLayoutPane] = useState<LayoutPane>("index");
  const [ready, setReady] = useState(false);
  const [pageState, setPageState] = useState<ServicePageState>(emptyPageState);
  const [localIndexLayout, setLocalIndexLayout] = useState(
    DEFAULT_SERVICE_INDEX_LAYOUT,
  );
  const [localDetailLayout, setLocalDetailLayout] = useState(
    DEFAULT_SERVICE_DETAIL_LAYOUT,
  );
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceItem>(emptyService());
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const { aiFieldBusy, generateText, generateImage, requireCorePlanForAi } =
    useManagerAiFields({
      siteId,
      kind: "service",
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
      imageHintParts: () => [draft.title, draft.category, "professional service"],
      avoidImageSrcs: () => [draft.image].filter(Boolean),
    });
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [categories, setCategories] = useState<string[]>([
    DEFAULT_SERVICE_CATEGORY,
  ]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(
    null,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [seoDraft, setSeoDraft] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [seoSaveState, setSeoSaveState] = useState<"idle" | "saved">("idle");
  const categoryStorageKey = `ai-builder-service-categories:${siteId}`;

  useEffect(() => {
    if (activeTab !== "seo") return;
    setSeoDraft({
      metaTitle: serviceSeo.metaTitle || "",
      metaDescription: serviceSeo.metaDescription || "",
      metaKeywords: serviceSeo.metaKeywords || "",
    });
    setSeoSaveState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate only when opening SEO tab
  }, [activeTab]);

  const saveServiceSeo = () => {
    patchServiceSeo({
      metaTitle: seoDraft.metaTitle.trim(),
      metaDescription: seoDraft.metaDescription.trim(),
      metaKeywords: seoDraft.metaKeywords.trim(),
    });
    setSeoSaveState("saved");
    window.setTimeout(() => setSeoSaveState("idle"), 2000);
  };

  const persistCategories = (next: string[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(categoryStorageKey, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  };

  const readStoredCategories = () => {
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
  };

  const serviceCategoriesKey = useMemo(
    () =>
      Array.from(
        new Set(
          pageState.services
            .map((service) =>
              (service.category || DEFAULT_SERVICE_CATEGORY).trim(),
            )
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [pageState.services],
  );

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
      if (showContentEditor) {
        setShowContentEditor(false);
        return;
      }
      if (showImagePicker) {
        setShowImagePicker(false);
        return;
      }
      if (showComposer) {
        setShowComposer(false);
        setEditingId(null);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, showComposer, showContentEditor, showImagePicker]);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<ServicePageState>).detail;
      if (!detail) return;
      const layout = normalizeServiceIndexLayout(detail.layout);
      const detailLayout = normalizeServiceDetailLayout(detail.detailLayout);
      setPageState({
        ...emptyPageState(),
        ...detail,
        layout,
        detailLayout,
        services: Array.isArray(detail.services) ? detail.services : [],
      });
      setLocalIndexLayout(layout);
      setLocalDetailLayout(detailLayout);
      setReady(true);
    };

    window.addEventListener("ai-builder-service-page-state", handleState);
    window.dispatchEvent(
      new CustomEvent("ai-builder-ensure-service-page", {
        detail: { navigate: !preserveNavigation },
      }),
    );
    window.dispatchEvent(new CustomEvent("ai-builder-service-page-query"));

    return () => {
      window.removeEventListener("ai-builder-service-page-state", handleState);
    };
  }, [preserveNavigation]);

  // Hydrate categories once per site — never let the initial default wipe storage.
  useEffect(() => {
    setCategoriesReady(false);
    const saved = readStoredCategories();
    const fromServices = serviceCategoriesKey
      ? serviceCategoriesKey.split("\0")
      : [];
    const next = Array.from(
      new Set([DEFAULT_SERVICE_CATEGORY, ...saved, ...fromServices]),
    );
    setCategories(next);
    setCategoriesReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- site key only
  }, [categoryStorageKey]);

  // When services gain categories, merge them in without dropping custom ones.
  useEffect(() => {
    if (!categoriesReady) return;
    const fromServices = serviceCategoriesKey
      ? serviceCategoriesKey.split("\0")
      : [];
    if (!fromServices.length) return;

    setCategories((current) => {
      const next = Array.from(new Set([...current, ...fromServices]));
      const unchanged =
        next.length === current.length &&
        next.every((category) => current.includes(category));
      return unchanged ? current : next;
    });
  }, [serviceCategoriesKey, categoriesReady]);

  useEffect(() => {
    if (!categoriesReady) return;
    persistCategories(categories);
  }, [categories, categoriesReady, categoryStorageKey]);

  const persist = (next: ServicePageState) => {
    const withLayout = {
      ...next,
      layout: normalizeServiceIndexLayout(next.layout || localIndexLayout),
      detailLayout: normalizeServiceDetailLayout(
        next.detailLayout || localDetailLayout,
      ),
    };
    setPageState(withLayout);
    window.dispatchEvent(
      new CustomEvent("ai-builder-service-page-update", { detail: withLayout }),
    );
  };

  const applyIndexLayout = (layoutId: string) => {
    const layout = normalizeServiceIndexLayout(layoutId);
    setLocalIndexLayout(layout);
    persist({ ...pageState, layout });
  };

  const applyDetailLayout = (layoutId: string) => {
    const detailLayout = normalizeServiceDetailLayout(layoutId);
    setLocalDetailLayout(detailLayout);
    persist({
      ...pageState,
      detailLayout,
      services: pageState.services.map((service) => ({
        ...service,
        layout: detailLayout,
      })),
    });
  };

  const nextDefaultOrder = useMemo(() => {
    const maxOrder = pageState.services.reduce(
      (max, service) => Math.max(max, service.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [pageState.services]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...pageState.services].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    if (!query) return sorted;
    return sorted.filter((service) =>
      [service.title, service.category, service.desc].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [pageState.services, search]);

  useEffect(() => {
    setListPage(1);
  }, [search]);

  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / LIST_PAGE_SIZE),
  );
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedServices = useMemo(() => {
    const start = (safeListPage - 1) * LIST_PAGE_SIZE;
    return filteredServices.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredServices, safeListPage]);

  useEffect(() => {
    if (listPage !== safeListPage) setListPage(safeListPage);
  }, [listPage, safeListPage]);

  const openCreate = () => {
    setEditingId(null);
    const created = emptyService(nextDefaultOrder, localDetailLayout);
    created.category = categories[0] || DEFAULT_SERVICE_CATEGORY;
    setDraft(created);
    setShowComposer(true);
  };

  const openEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setDraft({
      ...emptyService(1, localDetailLayout),
      ...service,
      content: service.content || "",
      slug: service.slug || createServiceSlug(service.title),
      order: service.order ?? 1,
      active: service.active !== false,
      layout: service.layout || localDetailLayout,
      seoTitle: service.seoTitle || "",
      seoDescription: service.seoDescription || "",
      seoKeywords: service.seoKeywords || "",
    });
    setShowComposer(true);
  };

  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;
    const STORAGE_KEY = "ai-builder-open-manager-item:Services";
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    window.sessionStorage.removeItem(STORAGE_KEY);

    try {
      const payload = JSON.parse(raw) as unknown;
      const slug =
        typeof (payload as any)?.slug === "string"
          ? (payload as any).slug
          : undefined;
      const id =
        typeof (payload as any)?.id === "string"
          ? (payload as any).id
          : undefined;
      const title =
        typeof (payload as any)?.title === "string"
          ? (payload as any).title
          : undefined;

      const found = pageState.services.find((s) => {
        if (id && s.id === id) return true;
        if (slug && s.slug === slug) return true;
        if (title && s.title === title) return true;
        return false;
      });

      if (found) {
        setActiveTab("services");
        openEdit(found);
      }
    } catch {
      // ignore malformed storage payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pageState.services]);

  const closeComposer = () => {
    setShowComposer(false);
    setEditingId(null);
    setShowContentEditor(false);
    setDraft(emptyService());
  };

  const addCategory = () => {
    const value = categoryName.trim();
    if (!value) return;
    setCategories((current) => {
      if (
        current.some(
          (category) => category.toLowerCase() === value.toLowerCase(),
        )
      ) {
        return current;
      }
      const next = [...current, value];
      persistCategories(next);
      return next;
    });
    setCategoryName("");
  };

  const startEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryName(category);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const saveEditCategory = () => {
    if (!editingCategory) return;
    const nextName = editCategoryName.trim();
    if (!nextName) return;

    const duplicate = categories.some(
      (category) =>
        category !== editingCategory &&
        category.toLowerCase() === nextName.toLowerCase(),
    );
    if (duplicate) return;

    setCategories((current) => {
      const next = current.map((category) =>
        category === editingCategory ? nextName : category,
      );
      persistCategories(next);
      return next;
    });

    if (nextName !== editingCategory) {
      const renamedServices = pageState.services.map((service) =>
        (service.category || DEFAULT_SERVICE_CATEGORY) === editingCategory
          ? { ...service, category: nextName }
          : service,
      );
      persist({ ...pageState, services: renamedServices });
      if (
        (draft.category || DEFAULT_SERVICE_CATEGORY) === editingCategory
      ) {
        setDraft((current) => ({ ...current, category: nextName }));
      }
    }

    cancelEditCategory();
  };

  const saveService = () => {
    const title = draft.title.trim();
    if (!title) return;

    const slug = uniqueServiceSlug(
      createServiceSlug(draft.slug || title) || `service-${Date.now()}`,
      pageState.services,
      editingId,
    );

    const nextItem: ServiceItem = {
      ...draft,
      title,
      category: draft.category.trim() || DEFAULT_SERVICE_CATEGORY,
      desc: draft.desc.trim(),
      content: draft.content || "",
      image: draft.image.trim() || "/bg1.jpg",
      alt: draft.alt?.trim() || title,
      slug,
      order: Math.max(1, Number(draft.order) || 1),
      active: draft.active !== false,
      layout: draft.layout || localDetailLayout,
      seoTitle: draft.seoTitle?.trim() || title,
      seoDescription: draft.seoDescription?.trim() || draft.desc.trim(),
      seoKeywords: draft.seoKeywords?.trim() || "",
    };

    const services = editingId
      ? pageState.services.map((item) =>
          item.id === editingId ? nextItem : item,
        )
      : [...pageState.services, nextItem];

    persist({ ...pageState, services });
    closeComposer();
  };

  const deleteService = (id: string) => {
    persist({
      ...pageState,
      services: pageState.services.filter((item) => item.id !== id),
    });
  };

  const deleteServicesByIds = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    persist({
      ...pageState,
      services: pageState.services.filter((item) => !idSet.has(item.id)),
    });
    setSelected([]);
  };

  const confirmDeleteService = () => {
    if (!serviceToDelete) return;
    deleteService(serviceToDelete.id);
    setSelected((current) =>
      current.filter((id) => id !== serviceToDelete.id),
    );
    setServiceToDelete(null);
  };

  const content = (
    <div
      className="fixed inset-0 z-[10050] flex min-h-0 flex-col bg-white text-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-manager-title"
    >
      <header className="flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Services
          </p>
          <h1 id="service-manager-title" className="sr-only">
            Service page manager
          </h1>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <label
            className={`flex max-w-full cursor-pointer items-center gap-2.5 rounded-full border px-3 py-1.5 sm:px-4 ${
              servicesWebsiteEnabled
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
              checked={servicesWebsiteEnabled}
              onChange={(event) =>
                setServicesWebsiteEnabled(event.target.checked)
              }
            />
            <span
              aria-hidden="true"
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                servicesWebsiteEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  servicesWebsiteEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Service page help"
          >
            <CircleHelp size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close service manager"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {!servicesWebsiteEnabled ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-900 sm:px-7">
          Services are hidden on the live website. Items stay saved here —{" "}
          <span className="font-semibold">/services</span> and detail links will
          show 404 until you turn{" "}
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
              Loading service page…
            </div>
          ) : null}

          {ready && activeTab === "services" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Services
                  </h2>
                  <p className="mt-2 text-base text-slate-600">
                    Create and manage services shown on your Service page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="AI Assist — generate services"
                    aria-label="AI Assist"
                    onClick={() => {
                      if (!requireCorePlanForAi()) return;
                      window.dispatchEvent(
                        new CustomEvent("ai-builder-open-ai-assist", {
                          detail: {
                            source: "service-manager",
                            hint: "add services",
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
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    New Service
                  </button>
                </div>
              </div>

              <div className="mt-6 flex max-w-md items-center gap-2 rounded-xl border border-slate-300 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search services"
                  className="h-11 w-full bg-transparent text-sm outline-none"
                />
              </div>

              {selected.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">
                    {selected.length} service
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
                <div className="grid grid-cols-[42px_minmax(200px,1.4fr)_100px_70px_90px_100px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <input
                    type="checkbox"
                    checked={
                      pagedServices.length > 0 &&
                      pagedServices.every((service) =>
                        selected.includes(service.id),
                      )
                    }
                    onChange={() => {
                      const ids = pagedServices.map((service) => service.id);
                      const allSelected = ids.every((id) =>
                        selected.includes(id),
                      );
                      setSelected((current) =>
                        allSelected
                          ? current.filter((id) => !ids.includes(id))
                          : Array.from(new Set([...current, ...ids])),
                      );
                    }}
                    aria-label="Select all services on this page"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>Service</span>
                  <span>Category</span>
                  <span>Order</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                {pagedServices.map((service) => {
                  const isActive = service.active !== false;
                  return (
                    <div
                      key={service.id}
                      className="grid grid-cols-[42px_minmax(200px,1.4fr)_100px_70px_90px_100px] items-center border-b border-slate-200 px-5 py-4 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(service.id)}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(service.id)
                              ? current.filter((id) => id !== service.id)
                              : [...current, service.id],
                          )
                        }
                        aria-label={`Select ${service.title}`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={service.image || "/bg1.jpg"}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-950">
                            {service.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                            {service.desc || "No description"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-blue-700">
                        {service.category || DEFAULT_SERVICE_CATEGORY}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {service.order ?? "—"}
                      </span>
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isActive ? (
                          <Eye size={12} />
                        ) : (
                          <EyeOff size={12} />
                        )}
                        {isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(service)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          aria-label={`Edit ${service.title}`}
                        >
                          <FilePenLine size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setServiceToDelete(service)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${service.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredServices.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-slate-500">
                    No services yet. Add your first service to show on the page.
                  </div>
                )}

                {filteredServices.length > LIST_PAGE_SIZE ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                    <p className="text-sm text-slate-600">
                      Showing {(safeListPage - 1) * LIST_PAGE_SIZE + 1}–
                      {Math.min(
                        safeListPage * LIST_PAGE_SIZE,
                        filteredServices.length,
                      )}{" "}
                      of {filteredServices.length}
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
                Organize services into reusable categories.
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
                  const used = pageState.services.some(
                    (service) =>
                      (service.category || DEFAULT_SERVICE_CATEGORY) ===
                      category,
                  );
                  const isEditingCat = editingCategory === category;

                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      {isEditingCat ? (
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
                            aria-label={`Rename ${category}`}
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
                            onClick={cancelEditCategory}
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
                              onClick={() => startEditCategory(category)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Edit ${category}`}
                              title="Edit category"
                            >
                              <FilePenLine size={15} />
                            </button>
                            {category === DEFAULT_SERVICE_CATEGORY ? (
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
                                  setCategories((current) => {
                                    const next = current.filter(
                                      (item) => item !== category,
                                    );
                                    persistCategories(next);
                                    return next;
                                  })
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${category}`}
                                title="Delete category"
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
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Service layouts
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  Choose a listing layout for the Services page and a detail
                  layout for individual services.
                </p>
              </div>

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
                  Services
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
                  Details Pages
                </button>
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-500">
                {layoutPane === "index"
                  ? "Applied to the Services listing page for every visitor."
                  : "Applied as the default for all service detail pages."}
              </p>

              <div className="mt-6 grid w-full gap-7 md:grid-cols-2 xl:grid-cols-3">
                {(layoutPane === "index"
                  ? SERVICE_INDEX_LAYOUTS
                  : SERVICE_DETAIL_LAYOUTS
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
                          alt={`${layout.name} service layout preview`}
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
                          onClick={() => {
                            if (layoutPane === "index") {
                              applyIndexLayout(layout.id);
                              return;
                            }
                            applyDetailLayout(layout.id);
                          }}
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
                Service page SEO
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Meta tags for the Services page. Each service can also have its
                own SEO in the add/edit form.
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
                    placeholder="Services page title for Google"
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
                    placeholder="services, consulting, …"
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={saveServiceSeo}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Check size={16} />
                    {seoSaveState === "saved" ? "Saved" : "Save SEO"}
                  </button>
                  {seoSaveState === "saved" ? (
                    <span className="text-sm font-medium text-emerald-600">
                      Service page SEO updated.
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
                  {editingId ? "Edit service" : "Create new service"}
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
                          current.slug === createServiceSlug(current.title)
                            ? createServiceSlug(event.target.value)
                            : current.slug,
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Service name"
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
                        slug: createServiceSlug(event.target.value),
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="web-design"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Detail page: /service/{draft.slug || "your-slug"}
                  </p>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Category
                    </span>
                    <select
                      value={
                        categories.includes(draft.category) ||
                        Boolean(draft.category)
                          ? draft.category || DEFAULT_SERVICE_CATEGORY
                          : categories[0] || DEFAULT_SERVICE_CATEGORY
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
                    placeholder="Shown on the service card"
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
                        dangerouslySetInnerHTML={{
                          __html: draft.content || "",
                        }}
                      />
                    ) : (
                      <p className="text-sm text-slate-400">
                        Write full service content… Click to open the rich text
                        editor.
                      </p>
                    )}
                    {(draft.content || "").trim() ? (
                      <p className="mt-1.5 text-xs font-medium text-slate-500">
                        {stripHtmlPreview(draft.content || "")
                          .split(/\s+/)
                          .filter(Boolean).length}{" "}
                        words · Click to edit
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
                    onClick={() => {
                      setShowImagePicker(true);
                    }}
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
                        Service SEO
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Optional meta for this service item.
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
                        placeholder="Defaults to service title"
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
                        placeholder="service, consulting, …"
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
                  onClick={saveService}
                  disabled={!draft.title.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {editingId ? "Save changes" : "Add service"}
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
              placeholder="Write the complete service content..."
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
        title="Service image"
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

      {serviceToDelete ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-service-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete service
            </p>
            <h3
              id="delete-service-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Are you sure you want to delete “
              {serviceToDelete.title.trim() || "this service"}”?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes it from the Services page. You can’t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={confirmDeleteService}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
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
            aria-labelledby="bulk-delete-service-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete services
            </p>
            <h3
              id="bulk-delete-service-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Delete {selected.length} selected service
              {selected.length === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes them from the Services page. You can’t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  deleteServicesByIds(selected);
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
