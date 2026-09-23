"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FilePenLine,
  Filter,
  LayoutTemplate,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import type { PageLink } from "../layout/src/components/context/PreviewContext";
import { usePreview } from "../layout/src/components/context/PreviewContext";
import ImageLibraryPicker from "../layout/src/components/builder/ImageLibraryPicker";
import CustomSectionRichTextEditor from "../layout/src/components/sections/custom/CustomSectionRichTextEditor";
import {
  AiFieldButton,
  FieldLabelWithAi,
  useManagerAiFields,
} from "./managerAi";
import {
  getPageSeo,
  patchPageSeo,
  type SiteSeoSettings,
} from "@/lib/siteSeo";
import {
  BLOG_DETAIL_LAYOUTS,
  BLOG_INDEX_LAYOUTS,
  normalizeBlogDetailLayout,
  normalizeBlogIndexLayout,
  type BlogLayoutOption,
} from "../layout/src/lib/blogLayouts";

type BlogTab = "posts" | "categories" | "layouts" | "seo";
type LayoutPane = "index" | "detail";

/** Published blogs index: /published/{site}/blogs */
const BLOGS_INDEX_PAGE = "Blogs";
const LIST_PAGE_SIZE = 5;

const stripHtmlPreview = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const toDateInputValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const dayMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dayMatch) return dayMatch[1];
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return "";
  const date = new Date(parsed);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatBlogCardDate = (value: string) => {
  const input = toDateInputValue(value);
  if (!input) return value.trim();
  const [year, month, day] = input.split("-").map(Number);
  if (!year || !month || !day) return value.trim();
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const todayDateInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type NewBlogPostInput = {
  title: string;
  author: string;
  image: string;
  layout: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  order: number;
  hidden: boolean;
  slug: string;
  createdAt?: string;
};

type BlogManagerProps = {
  blogs: PageLink[];
  siteId: string;
  authorName: string;
  draftTitle: string;
  draftLayout: string;
  indexLayout: string;
  /** When false, /blogs and /blog/{slug} are not public. Posts stay saved. */
  blogsWebsiteEnabled: boolean;
  onBlogsWebsiteEnabledChange: (enabled: boolean) => void;
  onDraftTitleChange: (value: string) => void;
  onDraftLayoutChange: (value: string) => void;
  onIndexLayoutChange: (value: string) => void;
  onApplyDetailLayout: (value: string) => void;
  onAddBlog: (input: NewBlogPostInput) => void;
  onUpdateBlog: (href: string, patch: Partial<PageLink>) => void;
  onDeleteBlog: (blog: PageLink) => void;
  onDeleteBlogs?: (blogs: PageLink[]) => void;
  onClose: () => void;
};

const tabItems: Array<{
  id: BlogTab;
  label: string;
  icon: typeof FilePenLine;
}> = [
  { id: "posts", label: "Posts", icon: FilePenLine },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "layouts", label: "Layouts", icon: LayoutTemplate },
  { id: "seo", label: "SEO", icon: Settings2 },
];

const LayoutPreviewMock = ({
  layout,
}: {
  layout: BlogLayoutOption;
}) => {
  switch (layout.preview) {
    case "magazine":
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-[1.3fr_0.7fr] gap-3 text-white">
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
            <div className="h-16 rounded-lg bg-white/25" />
            <div className="mt-2 h-2 w-4/5 rounded bg-white/80" />
            <div className="mt-1.5 h-2 w-3/5 rounded bg-white/50" />
          </div>
          <div className="space-y-2">
            <div className="h-10 rounded-lg bg-white/20" />
            <div className="h-10 rounded-lg bg-white/15" />
            <div className="h-10 rounded-lg bg-white/10" />
          </div>
        </div>
      );
    case "list":
      return (
        <div className="absolute inset-x-5 bottom-5 space-y-2 text-white">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex items-center gap-3 rounded-xl bg-white/15 p-2 backdrop-blur-sm"
            >
              <div className="h-10 w-14 shrink-0 rounded-lg bg-white/30" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-2 w-3/4 rounded bg-white/80" />
                <div className="h-2 w-1/2 rounded bg-white/45" />
              </div>
            </div>
          ))}
        </div>
      );
    case "minimal":
      return (
        <div className="absolute inset-x-8 bottom-6 space-y-4 text-white">
          <div className="h-2 w-20 rounded bg-blue-200/80" />
          <div className="h-3 w-4/5 rounded bg-white/90" />
          <div className="h-2 w-full rounded bg-white/40" />
          <div className="h-2 w-20 rounded bg-blue-200/80" />
          <div className="h-3 w-3/4 rounded bg-white/90" />
        </div>
      );
    case "overlay":
      return (
        <div className="absolute inset-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="relative overflow-hidden rounded-xl bg-white/10"
            >
              <div className="absolute inset-x-2 bottom-2">
                <div className="h-1.5 w-10 rounded bg-blue-200/80" />
                <div className="mt-1.5 h-2 rounded bg-white/90" />
              </div>
            </div>
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
            <p className="mt-2 text-xl font-bold">Split article</p>
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
            <div className="h-2 w-2/3 rounded bg-white/20" />
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
          <div className="mt-4 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-blue-400" />
            <div className="h-2 w-28 rounded bg-white/60" />
          </div>
        </div>
      );
    case "classic":
      return (
        <div className="absolute inset-x-8 bottom-7 text-center text-white">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
            Blog
          </span>
          <p className="mt-2 text-2xl font-bold">A centered classic story</p>
          <div className="mx-auto mt-3 h-1.5 w-36 rounded bg-white/70" />
        </div>
      );
    default:
      return (
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="rounded-xl bg-white/15 p-2 backdrop-blur-sm"
            >
              <div className="aspect-[16/10] rounded-lg bg-white/25" />
              <div className="mt-2 h-1.5 rounded bg-white/80" />
              <div className="mt-1 h-1.5 w-2/3 rounded bg-white/45" />
            </div>
          ))}
        </div>
      );
  }
};

const toBlogSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "post";

export default function BlogManager({
  blogs,
  siteId,
  authorName,
  draftTitle,
  draftLayout,
  indexLayout,
  blogsWebsiteEnabled,
  onBlogsWebsiteEnabledChange,
  onDraftTitleChange,
  onDraftLayoutChange,
  onIndexLayoutChange,
  onApplyDetailLayout,
  onAddBlog,
  onUpdateBlog,
  onDeleteBlog,
  onDeleteBlogs,
  onClose,
}: BlogManagerProps) {
  const { siteSeoConfig, setSiteSeoConfig } = usePreview();
  const blogsIndexSeo = useMemo(
    () => getPageSeo(siteSeoConfig, BLOGS_INDEX_PAGE),
    [siteSeoConfig],
  );
  const patchBlogsIndexSeo = (patch: Partial<SiteSeoSettings>) => {
    setSiteSeoConfig(patchPageSeo(siteSeoConfig, BLOGS_INDEX_PAGE, patch));
  };

  const [activeTab, setActiveTab] = useState<BlogTab>("posts");
  const [layoutPane, setLayoutPane] = useState<LayoutPane>("index");
  const resolvedDetailLayout = normalizeBlogDetailLayout(draftLayout);
  const resolvedIndexLayout = normalizeBlogIndexLayout(indexLayout);
  const [localIndexLayout, setLocalIndexLayout] = useState(resolvedIndexLayout);
  const [localDetailLayout, setLocalDetailLayout] = useState(
    resolvedDetailLayout,
  );
  const detailLayouts = BLOG_DETAIL_LAYOUTS;
  const indexLayouts = BLOG_INDEX_LAYOUTS;

  useEffect(() => {
    setLocalIndexLayout(resolvedIndexLayout);
  }, [resolvedIndexLayout]);

  useEffect(() => {
    setLocalDetailLayout(resolvedDetailLayout);
  }, [resolvedDetailLayout]);
  const [showComposer, setShowComposer] = useState(false);
  const [editingHref, setEditingHref] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showLongDescriptionEditor, setShowLongDescriptionEditor] =
    useState(false);
  const [draftImage, setDraftImage] = useState("");
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"all" | "visible" | "hidden">(
    "all",
  );
  const [sortNewest, setSortNewest] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);
  const [draftShortDescription, setDraftShortDescription] = useState("");
  const [draftLongDescription, setDraftLongDescription] = useState("");
  const [draftCategory, setDraftCategory] = useState("General");
  const [draftSeoTitle, setDraftSeoTitle] = useState("");
  const [draftSeoDescription, setDraftSeoDescription] = useState("");
  const [draftSeoKeywords, setDraftSeoKeywords] = useState("");
  const [draftOrder, setDraftOrder] = useState(1);
  const [draftSlug, setDraftSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"published" | "hidden">(
    "published",
  );
  const [draftCreatedAt, setDraftCreatedAt] = useState(todayDateInput);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [categories, setCategories] = useState<string[]>(["General"]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<PageLink | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [seoDraft, setSeoDraft] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [seoSaveState, setSeoSaveState] = useState<"idle" | "saved">("idle");
  const categoryStorageKey = `ai-builder-blog-categories:${siteId}`;
  const isEditing = Boolean(editingHref);
  const { aiFieldBusy, generateText, generateImage, requireCorePlanForAi } =
    useManagerAiFields({
      siteId,
      kind: "blog",
      getTitle: () => draftTitle,
      getItem: () => ({
        title: draftTitle,
        desc: draftShortDescription,
        content: draftLongDescription,
        category: draftCategory,
        author: authorName,
      }),
      getExisting: (field) =>
        field === "summary"
          ? draftShortDescription
          : field === "content"
            ? draftLongDescription
            : draftSeoDescription,
      onSummary: setDraftShortDescription,
      onContent: setDraftLongDescription,
      onSeo: (seo) => {
        if (seo.seoTitle) setDraftSeoTitle(seo.seoTitle);
        if (seo.seoDescription) setDraftSeoDescription(seo.seoDescription);
        if (seo.seoKeywords) setDraftSeoKeywords(seo.seoKeywords);
      },
      onImage: setDraftImage,
      imageHintParts: () => [
        draftTitle,
        draftCategory,
        authorName,
        "blog article",
      ],
      avoidImageSrcs: () => [draftImage].filter(Boolean),
    });

  useEffect(() => {
    if (activeTab !== "seo") return;
    setSeoDraft({
      metaTitle: blogsIndexSeo.metaTitle || "",
      metaDescription: blogsIndexSeo.metaDescription || "",
      metaKeywords: blogsIndexSeo.metaKeywords || "",
    });
    setSeoSaveState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate only when opening SEO tab
  }, [activeTab]);

  const saveBlogsIndexSeo = () => {
    patchBlogsIndexSeo({
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

  const blogCategoriesKey = useMemo(
    () =>
      Array.from(
        new Set(
          blogs
            .map((blog) => (blog.category || "General").trim())
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [blogs],
  );

  // Hydrate once per site — never let the initial ["General"] wipe storage.
  useEffect(() => {
    setCategoriesReady(false);
    const saved = readStoredCategories();
    const fromBlogs = blogCategoriesKey
      ? blogCategoriesKey.split("\0")
      : [];
    const next = Array.from(new Set(["General", ...saved, ...fromBlogs]));
    setCategories(next);
    setCategoriesReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- site key only
  }, [categoryStorageKey]);

  // When posts gain categories, merge them in without dropping custom ones.
  useEffect(() => {
    if (!categoriesReady) return;
    const fromBlogs = blogCategoriesKey
      ? blogCategoriesKey.split("\0")
      : [];
    if (!fromBlogs.length) return;

    setCategories((current) => {
      const next = Array.from(new Set([...current, ...fromBlogs]));
      const unchanged =
        next.length === current.length &&
        next.every((category) => current.includes(category));
      return unchanged ? current : next;
    });
  }, [blogCategoriesKey, categoriesReady]);

  useEffect(() => {
    if (!categoriesReady) return;
    persistCategories(categories);
  }, [categories, categoriesReady, categoryStorageKey]);

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
      if (showLongDescriptionEditor) {
        setShowLongDescriptionEditor(false);
        return;
      }
      if (showImagePicker) {
        setShowImagePicker(false);
        return;
      }
      if (showComposer) {
        closeComposer();
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, showComposer, showImagePicker, showLongDescriptionEditor]);

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = blogs.filter((blog) => {
      if (visibility === "visible" && blog.hidden) return false;
      if (visibility === "hidden" && !blog.hidden) return false;
      return (
        !query ||
        [
          blog.label,
          blog.category,
          blog.shortDescription,
          blog.longDescription,
          blog.author,
        ].some((value) => value?.toLowerCase().includes(query))
      );
    });
    return sortNewest ? [...matches].reverse() : matches;
  }, [blogs, search, sortNewest, visibility]);

  useEffect(() => {
    setListPage(1);
  }, [search, visibility, sortNewest]);

  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredBlogs.length / LIST_PAGE_SIZE),
  );
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedBlogs = useMemo(() => {
    const start = (safeListPage - 1) * LIST_PAGE_SIZE;
    return filteredBlogs.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredBlogs, safeListPage]);

  useEffect(() => {
    if (listPage !== safeListPage) setListPage(safeListPage);
  }, [listPage, safeListPage]);

  const selectedLayout =
    detailLayouts.find((layout) => layout.id === resolvedDetailLayout) ??
    detailLayouts[0];

  const nextDefaultOrder = useMemo(() => {
    const maxOrder = blogs.reduce(
      (max, blog) => Math.max(max, blog.order ?? 0),
      0,
    );
    return Math.max(maxOrder + 1, blogs.length + 1);
  }, [blogs]);

  const resetComposerFields = () => {
    setDraftImage("");
    onDraftTitleChange("");
    setDraftShortDescription("");
    setDraftLongDescription("");
    setDraftCategory("General");
    setDraftSeoTitle("");
    setDraftSeoDescription("");
    setDraftSeoKeywords("");
    setDraftOrder(nextDefaultOrder);
    setDraftSlug("");
    setSlugTouched(false);
    setDraftStatus("published");
    setDraftCreatedAt(todayDateInput());
    setEditingHref(null);
  };

  const closeComposer = () => {
    setShowImagePicker(false);
    setShowLongDescriptionEditor(false);
    setShowComposer(false);
    resetComposerFields();
  };

  const openComposer = () => {
    resetComposerFields();
    setDraftOrder(nextDefaultOrder);
    setShowComposer(true);
  };

  const openEditComposer = (blog: PageLink) => {
    setEditingHref(blog.href);
    onDraftTitleChange(blog.label);
    setDraftImage(blog.image || "");
    setDraftShortDescription(blog.shortDescription || "");
    setDraftLongDescription(blog.longDescription || "");
    setDraftCategory(blog.category || "General");
    setDraftSeoTitle(blog.seoTitle || "");
    setDraftSeoDescription(blog.seoDescription || "");
    setDraftSeoKeywords(blog.seoKeywords || "");
    setDraftOrder(blog.order ?? blogs.findIndex((item) => item.href === blog.href) + 1);
    setDraftSlug(blog.slug || toBlogSlug(blog.label));
    setSlugTouched(true);
    setDraftStatus(blog.hidden ? "hidden" : "published");
    setDraftCreatedAt(toDateInputValue(blog.createdAt || "") || todayDateInput());
    setShowComposer(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const STORAGE_KEY = "ai-builder-open-manager-item:Blogs";
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    window.sessionStorage.removeItem(STORAGE_KEY);
    try {
      const payload = JSON.parse(raw) as unknown;
      const href =
        typeof (payload as any)?.href === "string"
          ? ((payload as any).href as string)
          : undefined;
      if (!href) return;
      const found = blogs.find((b) => b.href === href);
      if (!found) return;

      openEditComposer(found);
    } catch {
      // ignore malformed storage payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogs]);

  const savePost = () => {
    const title = draftTitle.trim();
    if (!title) return;

    const slug = toBlogSlug(draftSlug || title);
    const payload = {
      title,
      author: authorName,
      image: draftImage || selectedLayout.image,
      layout: selectedLayout.id,
      shortDescription: draftShortDescription.trim(),
      longDescription: draftLongDescription.trim(),
      category: draftCategory,
      seoTitle: draftSeoTitle.trim() || title,
      seoDescription:
        draftSeoDescription.trim() || draftShortDescription.trim(),
      seoKeywords: draftSeoKeywords.trim(),
      order: Math.max(1, Number(draftOrder) || 1),
      hidden: draftStatus === "hidden",
      slug,
      createdAt: formatBlogCardDate(draftCreatedAt || todayDateInput()),
    };

    if (editingHref) {
      onUpdateBlog(editingHref, {
        label: payload.title,
        author: payload.author,
        image: payload.image,
        layout: payload.layout,
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        category: payload.category,
        seoTitle: payload.seoTitle,
        seoDescription: payload.seoDescription,
        seoKeywords: payload.seoKeywords,
        order: payload.order,
        hidden: payload.hidden,
        slug: payload.slug,
        createdAt: payload.createdAt,
        href: `#page-blog-${payload.slug}`,
      });
    } else {
      onAddBlog(payload);
    }
    closeComposer();
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
      blogs.forEach((blog) => {
        if ((blog.category || "General") === editingCategory) {
          onUpdateBlog(blog.href, { category: nextName });
        }
      });
      if (draftCategory === editingCategory) {
        setDraftCategory(nextName);
      }
    }

    cancelEditCategory();
  };

  const toggleSelected = (href: string) => {
    setSelected((current) =>
      current.includes(href)
        ? current.filter((item) => item !== href)
        : [...current, href],
    );
  };

  const selectAllVisible = () => {
    const visibleHrefs = pagedBlogs.map((blog) => blog.href);
    const allSelected =
      visibleHrefs.length > 0 &&
      visibleHrefs.every((href) => selected.includes(href));
    setSelected((current) =>
      allSelected
        ? current.filter((href) => !visibleHrefs.includes(href))
        : Array.from(new Set([...current, ...visibleHrefs])),
    );
  };

  const content = (
    <div
      className="fixed inset-0 z-[10050] flex min-h-0 flex-col bg-white text-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-manager-title"
    >
      <header className="flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Blog
          </p>
          <h1 id="blog-manager-title" className="sr-only">
            Blog manager
          </h1>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <label
            className={`flex max-w-full cursor-pointer items-center gap-2.5 rounded-full border px-3 py-1.5 sm:px-4 ${
              blogsWebsiteEnabled
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
              checked={blogsWebsiteEnabled}
              onChange={(event) =>
                onBlogsWebsiteEnabledChange(event.target.checked)
              }
            />
            <span
              aria-hidden="true"
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                blogsWebsiteEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  blogsWebsiteEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Blog help"
          >
            <CircleHelp size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close blog manager"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {!blogsWebsiteEnabled ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-900 sm:px-7">
          Blogs are hidden on the live website. Posts stay saved here —{" "}
          <span className="font-semibold">/blogs</span> and post links will show
          404 until you turn{" "}
          <span className="font-semibold">Show on website</span> on, then
          republish.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="w-[116px] shrink-0 border-r border-slate-200 bg-white p-2 sm:w-[148px] sm:p-3">
          <nav className="space-y-1" aria-label="Blog manager sections">
            {tabItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  activeTab === id
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-white">
          {activeTab === "posts" && (
            <section>
              <div className="border-b border-slate-100 px-5 py-7 sm:px-8 lg:px-10">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                      Posts
                    </h2>
                    <p className="mt-2 text-base text-slate-600">
                      Create, manage and organize your blog posts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="AI Assist — generate blog posts"
                      aria-label="AI Assist"
                      onClick={() => {
                        if (!requireCorePlanForAi()) return;
                        window.dispatchEvent(
                          new CustomEvent("ai-builder-open-ai-assist", {
                            detail: {
                              source: "blog-manager",
                              hint: "add blogs",
                            },
                          }),
                        );
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition hover:bg-blue-100 hover:text-blue-800"
                    >
                      <Sparkles size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={openComposer}
                      className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <Plus size={17} /> New Post
                    </button>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex h-10 w-full max-w-[330px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by title"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    />
                  </label>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <label className="flex items-center gap-1.5">
                      <Filter size={15} />
                      <select
                        value={visibility}
                        onChange={(event) =>
                          setVisibility(
                            event.target.value as
                              | "all"
                              | "visible"
                              | "hidden",
                          )
                        }
                        className="bg-transparent outline-none"
                      >
                        <option value="all">All posts</option>
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </label>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSortNewest((value) => !value)}
                      className="transition hover:text-slate-950"
                    >
                      {sortNewest ? "Created (newest first)" : "Created (oldest first)"}
                    </button>
                  </div>
                </div>
              </div>

              {selected.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3 sm:px-8 lg:px-10">
                  <p className="text-sm font-semibold text-red-800">
                    {selected.length} post{selected.length === 1 ? "" : "s"}{" "}
                    selected
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

              <div className="min-w-[860px]">
                <div className="grid grid-cols-[42px_minmax(280px,1fr)_120px_100px_140px] items-center border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={
                      pagedBlogs.length > 0 &&
                      pagedBlogs.every((blog) => selected.includes(blog.href))
                    }
                    onChange={selectAllVisible}
                    aria-label="Select all posts on this page"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>Posts ({filteredBlogs.length})</span>
                  <span>Status</span>
                  <span>Order</span>
                  <span className="text-right">Actions</span>
                </div>

                {pagedBlogs.map((blog) => {
                  const layout =
                    detailLayouts.find(
                      (item) => item.id === (blog.layout ?? draftLayout),
                    ) ?? selectedLayout;
                  const postOrder =
                    blog.order ??
                    blogs.findIndex((item) => item.href === blog.href) + 1;
                  return (
                    <div
                      key={blog.href}
                      className="grid min-h-[108px] grid-cols-[42px_minmax(280px,1fr)_120px_100px_140px] items-center border-b border-slate-200 px-6 py-4"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(blog.href)}
                        onChange={() => toggleSelected(blog.href)}
                        aria-label={`Select ${blog.label}`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={blog.image || layout.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {blog.label}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            By {blog.author || authorName}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                            blog.hidden
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {blog.hidden ? "Hidden" : "Published"}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {postOrder}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditComposer(blog)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          aria-label={`Edit ${blog.label}`}
                          title="Edit post"
                        >
                          <FilePenLine size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBlog(blog.href, {
                              hidden: !blog.hidden,
                            })
                          }
                          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          aria-label={
                            blog.hidden
                              ? `Show ${blog.label}`
                              : `Hide ${blog.label}`
                          }
                          title={blog.hidden ? "Show post" : "Hide post"}
                        >
                          {blog.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlogToDelete(blog)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${blog.label}`}
                          title="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredBlogs.length === 0 && (
                  <div className="grid min-h-[280px] place-items-center px-6 py-12 text-center">
                    <div>
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <FilePenLine size={24} />
                      </div>
                      <p className="mt-4 font-bold text-slate-900">
                        {blogs.length === 0
                          ? "No blog posts yet"
                          : "No matching posts"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {blogs.length === 0
                          ? "Create your first post to get started."
                          : "Try another search or filter."}
                      </p>
                    </div>
                  </div>
                )}

                {filteredBlogs.length > LIST_PAGE_SIZE ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                    <p className="text-sm text-slate-600">
                      Showing {(safeListPage - 1) * LIST_PAGE_SIZE + 1}–
                      {Math.min(
                        safeListPage * LIST_PAGE_SIZE,
                        filteredBlogs.length,
                      )}{" "}
                      of {filteredBlogs.length}
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

          {activeTab === "categories" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Categories
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Organize posts into reusable categories.
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
                  const used = blogs.some(
                    (blog) => (blog.category || "General") === category,
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
                            {category === "General" ? (
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

          {activeTab === "layouts" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Blog layouts
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  Choose a listing layout for the Blogs page and a detail layout
                  for individual posts. Layouts use your post fields: title,
                  author, category, image, short and long description.
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
                  Blogs Page
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
                  Details Page
                </button>
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-500">
                {layoutPane === "index"
                  ? "Applied to /blogs listing for every visitor."
                  : "Applied as the default for all post detail pages."}
              </p>

              <div className="mt-6 grid w-full gap-7 md:grid-cols-2 xl:grid-cols-3">
                {(layoutPane === "index" ? indexLayouts : detailLayouts).map(
                  (layout) => {
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
                            alt={`${layout.name} blog layout preview`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                          <LayoutPreviewMock layout={layout} />
                          {active && (
                            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                              <Check size={14} /> Selected
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-4 p-5">
                          <div>
                            <h3 className="font-bold text-slate-950">
                              {layout.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {layout.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (layoutPane === "index") {
                                setLocalIndexLayout(layout.id);
                                onIndexLayoutChange(layout.id);
                                return;
                              }
                              setLocalDetailLayout(layout.id);
                              onApplyDetailLayout(layout.id);
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
                  },
                )}
              </div>
            </section>
          )}

          {activeTab === "seo" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Blog SEO
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Meta tags for the blogs listing page only (
                <span className="font-medium text-slate-800">
                  /published/…/blogs
                </span>
                ). Individual posts have their own SEO in the post editor.
              </p>
              <div className="mt-7 max-w-xl space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Meta title
                  </span>
                  <input
                    type="text"
                    value={seoDraft.metaTitle}
                    onChange={(e) => {
                      setSeoSaveState("idle");
                      setSeoDraft((current) => ({
                        ...current,
                        metaTitle: e.target.value,
                      }));
                    }}
                    placeholder="Blogs page title for Google"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Meta description
                  </span>
                  <textarea
                    value={seoDraft.metaDescription}
                    onChange={(e) => {
                      setSeoSaveState("idle");
                      setSeoDraft((current) => ({
                        ...current,
                        metaDescription: e.target.value,
                      }));
                    }}
                    rows={4}
                    placeholder="Short summary shown in search results"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Keywords
                  </span>
                  <input
                    type="text"
                    value={seoDraft.metaKeywords}
                    onChange={(e) => {
                      setSeoSaveState("idle");
                      setSeoDraft((current) => ({
                        ...current,
                        metaKeywords: e.target.value,
                      }));
                    }}
                    placeholder="blog, news, articles"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Comma-separated
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={saveBlogsIndexSeo}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Check size={16} />
                    {seoSaveState === "saved" ? "Saved" : "Save SEO"}
                  </button>
                  {seoSaveState === "saved" ? (
                    <span className="text-sm font-medium text-emerald-600">
                      Blog page SEO updated.
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
        </main>
      </div>

      {showComposer && (
        <div
          className="fixed inset-0 z-[10070] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeComposer();
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-post-composer-title"
            onSubmit={(event) => {
              event.preventDefault();
              savePost();
            }}
            className="my-auto max-h-[calc(100dvh-2rem)] w-[min(96vw,980px)] overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <header className="relative border-b border-slate-200 bg-slate-100 px-14 py-4 text-center">
              <h2
                id="blog-post-composer-title"
                className="text-2xl font-medium text-slate-950"
              >
                {isEditing ? "Edit Post" : "Create New Post"}
              </h2>
              <button
                type="button"
                onClick={closeComposer}
                className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950"
                aria-label={isEditing ? "Close edit post" : "Close new post"}
              >
                <X size={18} />
              </button>
            </header>

            <div className="mx-auto w-full max-w-[860px] space-y-5 px-6 py-7">
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="new-blog-post-title"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Post title
                  </label>
                  <span className="text-xs font-medium text-slate-600">
                    {draftTitle.length}/200
                  </span>
                </div>
                <input
                  id="new-blog-post-title"
                  autoFocus
                  maxLength={200}
                  value={draftTitle}
                  onChange={(event) => {
                    const nextTitle = event.target.value.slice(0, 200);
                    onDraftTitleChange(nextTitle);
                    if (!slugTouched) {
                      setDraftSlug(toBlogSlug(nextTitle));
                    }
                  }}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="new-blog-post-slug"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Slug
                </label>
                <div className="flex h-11 items-center overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
                    /blog/
                  </span>
                  <input
                    id="new-blog-post-slug"
                    value={draftSlug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setDraftSlug(toBlogSlug(event.target.value));
                    }}
                    placeholder="post-url-slug"
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  URL path for this post. Letters, numbers and hyphens only.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-blog-post-author"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Post author
                  </label>
                  <select
                    id="new-blog-post-author"
                    defaultValue={authorName}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={authorName}>{authorName}</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="new-blog-post-category"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Category
                  </label>
                  <select
                    id="new-blog-post-category"
                    value={draftCategory}
                    onChange={(event) => setDraftCategory(event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-blog-post-date"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Publish date
                </label>
                <input
                  id="new-blog-post-date"
                  type="date"
                  value={draftCreatedAt}
                  onChange={(event) => setDraftCreatedAt(event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Shown on homepage blog cards.
                </p>
              </div>

              <div>
                <FieldLabelWithAi
                  label="Short description"
                  aiTitle="AI generate short description"
                  aiLoading={aiFieldBusy === "summary"}
                  onAiClick={() => generateText("summary")}
                />
                <textarea
                  id="new-blog-post-short-description"
                  rows={4}
                  maxLength={240}
                  value={draftShortDescription}
                  onChange={(event) =>
                    setDraftShortDescription(event.target.value)
                  }
                  placeholder="Shown on the blog card"
                  className="min-h-[104px] w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-800">
                    Long description
                  </label>
                  <div className="flex items-center gap-2">
                    <AiFieldButton
                      title="AI generate long description"
                      loading={aiFieldBusy === "content"}
                      onClick={() => generateText("content")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLongDescriptionEditor(true)}
                      className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Open editor
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLongDescriptionEditor(true)}
                  className="min-h-[72px] w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-left transition hover:border-blue-400 hover:bg-blue-50/30 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  aria-label="Edit long description"
                >
                  {draftLongDescription.trim() ? (
                    <div
                      className="line-clamp-2 prose prose-sm max-w-none text-slate-800 [&_p]:my-0"
                      dangerouslySetInnerHTML={{
                        __html: draftLongDescription,
                      }}
                    />
                  ) : (
                    <p className="text-sm text-slate-400">
                      Write the complete blog content… Click to open the rich
                      text editor.
                    </p>
                  )}
                  {draftLongDescription.trim() ? (
                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                      {stripHtmlPreview(draftLongDescription)
                        .split(/\s+/)
                        .filter(Boolean).length}{" "}
                      words · Click to edit
                    </p>
                  ) : null}
                </button>
              </div>

              <div>
                <FieldLabelWithAi
                  label="Post main image"
                  aiTitle="AI generate post image"
                  aiLoading={aiFieldBusy === "image"}
                  onAiClick={() => generateImage()}
                />
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="group relative grid h-[102px] w-[102px] place-items-center overflow-hidden rounded-md border border-dashed border-slate-500 bg-slate-50 text-slate-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                  aria-label={
                    draftImage ? "Change post main image" : "Add post main image"
                  }
                >
                  {draftImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draftImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-1 text-center text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                        Change image
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="blog-post-order"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Order
                  </label>
                  <input
                    id="blog-post-order"
                    type="number"
                    min={1}
                    value={draftOrder}
                    onChange={(event) =>
                      setDraftOrder(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="blog-post-status"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Status
                  </label>
                  <select
                    id="blog-post-status"
                    value={draftStatus}
                    onChange={(event) =>
                      setDraftStatus(
                        event.target.value === "hidden"
                          ? "hidden"
                          : "published",
                      )
                    }
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              <fieldset className="rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between gap-3 px-2">
                  <legend className="text-sm font-bold text-slate-800">
                    SEO
                  </legend>
                  <AiFieldButton
                    title="AI generate SEO meta"
                    loading={aiFieldBusy === "seo"}
                    onClick={() => generateText("seo")}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="new-blog-seo-title"
                      className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                      SEO title
                    </label>
                    <input
                      id="new-blog-seo-title"
                      value={draftSeoTitle}
                      onChange={(event) => setDraftSeoTitle(event.target.value)}
                      placeholder={draftTitle || "Search result title"}
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-blog-seo-description"
                      className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                      Meta description
                    </label>
                    <textarea
                      id="new-blog-seo-description"
                      rows={3}
                      value={draftSeoDescription}
                      onChange={(event) =>
                        setDraftSeoDescription(event.target.value)
                      }
                      placeholder="Description shown in search results"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-blog-seo-keywords"
                      className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                      Keywords
                    </label>
                    <input
                      id="new-blog-seo-keywords"
                      value={draftSeoKeywords}
                      onChange={(event) =>
                        setDraftSeoKeywords(event.target.value)
                      }
                      placeholder="business, tips, services"
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="border-t border-slate-200 pt-3">
                <p className="text-sm italic text-slate-500">
                  You can always edit this later in your post&apos;s settings.
                </p>
              </div>
            </div>

            <footer className="mx-auto flex w-full max-w-[860px] items-center justify-between gap-4 px-6 pb-7">
              <button
                type="button"
                onClick={closeComposer}
                className="min-w-[88px] rounded-md bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!draftTitle.trim()}
                className="min-w-[88px] rounded-md bg-[#ef6b4a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#df5b3b] disabled:cursor-not-allowed disabled:bg-[#f8b7a7]"
              >
                {isEditing ? "Save" : "Start"}
              </button>
            </footer>
          </form>
        </div>
      )}

      <ImageLibraryPicker
        open={showImagePicker}
        title="Post main image"
        initialValue={draftImage || selectedLayout.image}
        onClose={() => setShowImagePicker(false)}
        onSelect={(source) => {
          setDraftImage(source);
          setShowImagePicker(false);
        }}
      />

      {blogToDelete ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-blog-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete post
            </p>
            <h3
              id="delete-blog-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Are you sure you want to delete “
              {blogToDelete.label.trim() || "this post"}”?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes it from the Blogs page. You can’t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onDeleteBlog(blogToDelete);
                  setSelected((current) =>
                    current.filter((href) => href !== blogToDelete.href),
                  );
                  setBlogToDelete(null);
                }}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setBlogToDelete(null)}
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
            aria-labelledby="bulk-delete-blog-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete posts
            </p>
            <h3
              id="bulk-delete-blog-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Delete {selected.length} selected post
              {selected.length === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes them from the Blogs page. You can’t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const hrefSet = new Set(selected);
                  const blogsToRemove = blogs.filter((blog) =>
                    hrefSet.has(blog.href),
                  );
                  if (onDeleteBlogs) {
                    onDeleteBlogs(blogsToRemove);
                  } else {
                    for (const blog of blogsToRemove) {
                      onDeleteBlog(blog);
                    }
                  }
                  setSelected([]);
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

      {showLongDescriptionEditor && (
        <CustomSectionRichTextEditor
          open
          initialValue={draftLongDescription}
          placeholder="Write the complete blog content..."
          overlayClassName="z-[10090]"
          onClose={() => setShowLongDescriptionEditor(false)}
          onSave={(html) => {
            setDraftLongDescription(html);
            setShowLongDescriptionEditor(false);
          }}
        />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
