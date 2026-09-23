"use client";

import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Bold,
  Check,
  Edit,
  Italic,
  ChevronDown,
  Link2,
  List,
  ListOrdered,
  Palette,
  Play,
  Plus,
  Redo2,
  Search,
  Sparkles,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash,
  Underline,
  X,
  RemoveFormatting,
  Undo2,
  Upload,
} from "lucide-react";
import { type PageLink, usePreview } from "../context/PreviewContext";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import { isEditorCorePlanActive } from "@/lib/userPlan";
import { rememberEditorForAuthCancel, buildPlanPageUrl } from "@/lib/authReturn";
import { resolveEditorSiteId } from "@/lib/migrateGuestSite";
import { useRouter } from "next/navigation";
import {
  addableSectionCards,
  getAddableLayoutsForCategory,
  getContentBundle,
  getTemplateVariables,
  refreshCategoryContentFromApi,
  resolveLayoutPreview,
  type BuilderLayout,
} from "../../data/templateFlow";
import { sectionRegistry, resolveSectionComponent } from "../../lib/sectionRegistry";
import {
  applyInlineTextFormats,
  EDITOR_EMPTY_TEXT_VALUE,
  getInlineEditableElements,
  getInlinePersistableText,
  getInlineTextOccurrence,
  hasMeaningfulInlineFormatting,
  releaseAppliedInlineTextFormat,
  resolveInlineEditableElement,
  isPlainTextInlineElement,
  restoreAppliedInlineTextFormats,
  sanitizeInlineHtml,
  INLINE_PLAIN_TEXT_ATTRIBUTE,
  type InlineTextFormat,
} from "../../lib/inlineTextFormatting";
import {
  createInlineFormatRegistry,
  getUnconsumedInlineTextFormats,
  InlineTextFormattingProvider,
} from "./InlineRichText";
import EditorLoadingScreen from "@/app/editor/components/EditorLoadingScreen";
import {
  CUSTOM_SECTION_LAYOUTS,
  type CustomSectionLayoutId,
} from "../../data/customSectionLayouts";
import { scrollTemplateToTop } from "../../lib/sectionScroll";

const ADD_SECTION_CARDS_DELAY_MS = 1000;
const TOOLBAR_WIDTH = 400;
const TOOLBAR_HEIGHT = 64;
const TOOLBAR_CURSOR_GAP = 0;
const BOTTOM_TOOLBAR_GAP = 20;
const INLINE_TOOLBAR_WIDTH = 780;
const INLINE_TOOLBAR_HEIGHT = 40;
const INLINE_TOOLBAR_GAP = 12;
const INLINE_TOOLBAR_OFFSET = 8;
const INLINE_HIGHLIGHT_CLASS =
  "outline outline-2 outline-blue-500 outline-offset-2 rounded-sm cursor-text";
const INLINE_FONT_SIZE_OPTIONS = [
  "12",
  "14",
  "16",
  "18",
  "20",
  "24",
  "28",
  "32",
  "36",
  "40",
  "48",
  "56",
  "64",
  "68",
  "72",
];
const MAX_INLINE_FONT_SIZE = 72;
const INLINE_TEXT_COLOR_PRESETS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#0f172a",
];
const INLINE_EMPTY_TEXT_VALUE = EDITOR_EMPTY_TEXT_VALUE;
const INLINE_EMPTY_TEXT_ATTRIBUTE = "data-editor-empty-text";
const INLINE_BUTTON_HOVER_ATTRIBUTE = "data-editor-button-hover";
const INLINE_MULTILINE_TEXT_SELECTOR = "h1,h2,h3,h4,h5,h6,p";
const DEFAULT_PREUPLOADED_IMAGES = [
  "/bg1.jpg",
  "/bg2.jpg",
  "/blackbay.png",
  "/prod2.jpg",
  "/55.jpg",
  "/categories/realestate/bg1.jpg",
  "/categories/realestate/bg2.jpg",
  "/categories/realestate/BG3.jpg",
  "/categories/business/bg1.jpg",
  "/categories/business/bg2.jpg",
  "/categories/business/blackbay.png",
  "/categories/school/bg11.jpg",
  "/categories/school/bg22.jpg",
  "/categories/school/bg33.png",
];

type HoveredMedia = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
  oldSrc: string;
  occurrence: number;
  fieldHint?: string;
};

const INLINE_LINK_NAV_ATTRIBUTE = "data-editor-link-nav";

type HoveredLinkNav = {
  top: number;
  left: number;
  width: number;
  height: number;
  pageLabel: string | null;
  sectionHref: string | null;
  externalHref: string | null;
};

const normalizeEditorNavSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^#page-/, "")
    .replace(/^\/+/, "")
    .replace(/[?#].*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const findClosestHref = (element: HTMLElement | null) => {
  if (!element) return "";
  const link =
    element.closest<HTMLAnchorElement>("a[href]") ||
    element.querySelector<HTMLAnchorElement>("a[href]");
  return (link?.getAttribute("href") || "").trim();
};

const isChromeSection = (sectionLabel: string) => {
  const name = sectionLabel.trim().toLowerCase();
  return name === "header" || name === "footer" || name === "topbar";
};

const isManagerBackedCardArea = (element: HTMLElement | null) =>
  Boolean(element?.closest("[data-editor-no-inline]"));

const isButtonLikeHost = (element: HTMLElement) => {
  const host = element.closest<HTMLElement>("a, button, [role='button']");
  if (!host) return false;
  if (host.tagName === "BUTTON" || host.getAttribute("role") === "button") {
    return true;
  }
  if (host.tagName !== "A") return false;
  const className = `${host.className || ""}`.toLowerCase();
  return /(?:^|[\s:_-])(?:btn|button)(?:$|[\s:_-])|rounded-(?:full|2xl|xl|lg)|(?:^|\s)(?:px-|py-|inline-flex)/.test(
    className,
  );
};

type InlineCommandState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  unorderedList: boolean;
  orderedList: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

type InlineLinkType =
  | "page"
  | "external"
  | "email"
  | "phone"
  | "section"
  | "booking";

const INLINE_LINK_TYPES: Array<{
  type: InlineLinkType;
  label: string;
}> = [
  { type: "page", label: "Page link" },
  { type: "external", label: "External link" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone" },
  { type: "section", label: "Page section" },
  { type: "booking", label: "Booking" },
];

const EMPTY_INLINE_COMMAND_STATE: InlineCommandState = {
  bold: false,
  italic: false,
  underline: false,
  unorderedList: false,
  orderedList: false,
  canUndo: false,
  canRedo: false,
};

const getMediaFileName = (src: string) => {
  if (src.startsWith("data:")) return "Uploaded image";

  const cleanSrc = src.split(/[?#]/)[0];
  const fileName = cleanSrc.split("/").filter(Boolean).at(-1);

  return fileName ? decodeURIComponent(fileName) : "Selected image";
};

const TOOLBAR_ALIGN_STORAGE_KEY = "ai-builder-section-toolbar-align";
type SectionToolbarAlign = "left" | "center" | "right";

const loadSectionToolbarAlign = (): SectionToolbarAlign => {
  if (typeof window === "undefined") return "center";
  try {
    const raw = window.localStorage.getItem(TOOLBAR_ALIGN_STORAGE_KEY);
    if (raw === "left" || raw === "center" || raw === "right") return raw;
  } catch {
    /* ignore */
  }
  return "center";
};

/** Hide AI image button on logo / header / footer / testimonial — keep Edit. */
const AI_MEDIA_BLOCKED_SECTIONS = new Set([
  "Header",
  "Footer",
  "Topbar",
  "Testimonial",
]);

/** No image hover AI/Edit overlay (use section Edit toolbar instead). */
const MEDIA_OVERLAY_HIDDEN_SECTIONS = new Set(["Banner"]);

const shouldHideAiMediaButton = (
  sectionType: string,
  fieldHint?: string,
) => {
  if (AI_MEDIA_BLOCKED_SECTIONS.has(sectionType)) return true;
  if (MEDIA_OVERLAY_HIDDEN_SECTIONS.has(sectionType)) return true;
  return (fieldHint || "").trim().toLowerCase() === "logo";
};

const shouldHideMediaOverlay = (sectionType: string) =>
  MEDIA_OVERLAY_HIDDEN_SECTIONS.has(sectionType);

const getNearestInlineFontSize = (fontSize: string | undefined) => {
  const parsedSize = Number.parseInt(fontSize ?? "", 10);

  if (Number.isNaN(parsedSize)) return "16";

  return INLINE_FONT_SIZE_OPTIONS.reduce((closest, option) => {
    const currentDiff = Math.abs(Number(option) - parsedSize);
    const closestDiff = Math.abs(Number(closest) - parsedSize);
    return currentDiff < closestDiff ? option : closest;
  }, INLINE_FONT_SIZE_OPTIONS[0]);
};

const syncEmptyInlineTextPlaceholders = (container: HTMLElement) => {
  getInlineEditableElements(container).forEach((element) => {
    const hasOnlyEmptyMarker =
      (element.textContent ?? "").replaceAll(INLINE_EMPTY_TEXT_VALUE, "")
        .trim().length === 0 &&
      (element.textContent ?? "").includes(INLINE_EMPTY_TEXT_VALUE);

    if (hasOnlyEmptyMarker) {
      element.setAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE, "true");
      return;
    }

    element.removeAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE);
  });
};

type EditableSectionProps = {
  label: string;
  anchorId: string;
  sectionType?: string;
  category: string;
  pageScope?: "home" | "page";
  /** Empty inner pages: allow Add on Header so user can insert the first body section. */
  forceShowAddButton?: boolean;
  pageSectionLinks?: PageLink[];
  isSinglePage?: boolean;
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onAiAssist?: () => void;
  onAddSection: (sectionType: string, variant?: string) => void;
  onAddCustomSection: (layoutId: CustomSectionLayoutId) => void;
  onInlineTextEdit: (
    oldText: string,
    newText: string,
    formattedHtml: string | null,
    oldOccurrence: number,
    newOccurrence: number,
    formatKey?: string,
  ) => void;
  inlineTextFormats?: InlineTextFormat[];
  onInlineMediaEdit: (
    oldSrc: string,
    newSrc: string,
    mediaType: "image" | "video",
    fileName: string,
    occurrence: number,
    fieldHint?: string,
  ) => void;
  onInlineLinkEdit: (
    oldHref: string,
    newHref: string,
    linkText: string,
  ) => void;
  stickyMode?: "scroll" | "sticky";
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** Manager listing pages: no inline/media edit on canvas — use manager popup. */
  lockCanvasEdit?: boolean;
};

export default function EditableSection({
  label,
  anchorId,
  sectionType,
  category,
  pageScope = "home",
  forceShowAddButton = false,
  pageSectionLinks = [],
  isSinglePage = false,
  children,
  onEdit,
  onDelete,
  onAiAssist,
  onAddSection,
  onAddCustomSection,
  onInlineTextEdit,
  inlineTextFormats = [],
  onInlineMediaEdit,
  onInlineLinkEdit,
  stickyMode = "scroll",
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  lockCanvasEdit = false,
}: EditableSectionProps) {
  const router = useRouter();
  const { user } = useUserAuth();
  const { isPreview, pageLinks, setCurrentPage, setIsContentEditing } =
    usePreview();

  /** AI features only — Core plan required; others go to plans. */
  const requireCorePlanOrGoToUpgrade = () => {
    const siteId = resolveEditorSiteId();
    if (isEditorCorePlanActive(siteId)) return true;
    rememberEditorForAuthCancel();
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("ai-builder-login-required", {
          detail: { intent: "upgrade" },
        }),
      );
      return false;
    }
    router.push(buildPlanPageUrl(siteId));
    return false;
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSectionTypePopup, setShowSectionTypePopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showCustomSectionPopup, setShowCustomSectionPopup] = useState(false);
  const [addSectionSearch, setAddSectionSearch] = useState("");
  const [addSectionCardsReady, setAddSectionCardsReady] = useState(false);
  const [generatingComponent, setGeneratingComponent] = useState<string | null>(null);
  const [toolbarY, setToolbarY] = useState(48);
  const [sectionToolbarAlign, setSectionToolbarAlign] =
    useState<SectionToolbarAlign>("center");
  const [sectionHeight, setSectionHeight] = useState(0);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isRichInlineEditing, setIsRichInlineEditing] = useState(false);
  const [inlineToolbarPosition, setInlineToolbarPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [inlineFontSize, setInlineFontSize] = useState("16");
  const [inlineCommandState, setInlineCommandState] =
    useState<InlineCommandState>(EMPTY_INLINE_COMMAND_STATE);
  const [showInlineLinkEditor, setShowInlineLinkEditor] = useState(false);
  const [inlineLinkType, setInlineLinkType] =
    useState<InlineLinkType>("page");
  const [inlineLinkValue, setInlineLinkValue] = useState("");
  const [showInlineColorPicker, setShowInlineColorPicker] = useState(false);
  const [inlineTextColor, setInlineTextColor] = useState("#000000");
  const [hoveredMedia, setHoveredMedia] = useState<HoveredMedia | null>(null);
  const [hoveredLinkNav, setHoveredLinkNav] = useState<HoveredLinkNav | null>(
    null,
  );
  const [aiMediaBusy, setAiMediaBusy] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaLibrarySources, setMediaLibrarySources] = useState<string[]>([]);
  const [selectedMediaSrc, setSelectedMediaSrc] = useState("");
  const [selectedMediaFileName, setSelectedMediaFileName] = useState("");

  useEffect(() => {
    if (!showAddPopup) {
      setAddSectionSearch("");
      setAddSectionCardsReady(false);
      return;
    }

    setAddSectionCardsReady(false);
    const timer = window.setTimeout(
      () => setAddSectionCardsReady(true),
      ADD_SECTION_CARDS_DELAY_MS,
    );
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void refreshCategoryContentFromApi();
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [showAddPopup]);

  useEffect(() => {
    setSectionToolbarAlign(loadSectionToolbarAlign());
  }, []);

  const updateSectionToolbarAlign = (next: SectionToolbarAlign) => {
    setSectionToolbarAlign(next);
    try {
      window.localStorage.setItem(TOOLBAR_ALIGN_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState("");
  const hoveredEditableRef = useRef<HTMLElement | null>(null);
  const activeEditableRef = useRef<HTMLElement | null>(null);
  const inlineSelectionRef = useRef<Range | null>(null);
  const originalTextRef = useRef("");
  const originalHtmlRef = useRef("");
  const originalOccurrenceRef = useRef(0);
  const originalFormatKeyRef = useRef<string | undefined>(undefined);
  const inlineUndoRef = useRef<string[]>([]);
  const inlineRedoRef = useRef<string[]>([]);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const inlineToolbarRef = useRef<HTMLDivElement | null>(null);
  const inlineLinkEditorRef = useRef<HTMLDivElement | null>(null);
  // Sync flag so blur/outside handlers don't finish the edit while the link
  // dialog is opening (focus moves before React state is visible to handlers).
  const showInlineLinkEditorRef = useRef(false);
  const mediaEditorRef = useRef<HTMLDivElement | null>(null);
  const textColorInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const pendingMediaRef = useRef<{
    oldSrc: string;
    mediaType: "image" | "video";
    occurrence: number;
    fieldHint?: string;
  } | null>(null);

  const formatRegistry = useMemo(
    () => createInlineFormatRegistry(inlineTextFormats),
    [inlineTextFormats],
  );
  const inlinePageLinkOptions = useMemo(() => {
    const options: Array<{ label: string; href: string }> = [];
    const seen = new Set<string>();

    const pushOption = (label: string, href: string) => {
      const key = href.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      options.push({ label, href });
    };

    pushOption("Home", "#");

    if (isSinglePage) {
      const appendSinglePageLinks = (links: PageLink[]) => {
        links.forEach((link) => {
          const href = link.href.trim().toLowerCase();
          if (link.kind === "document") {
            pushOption(link.label, link.href);
          } else if (link.kind === "blogIndex" || href === "#page-blogs") {
            pushOption(link.label || "Blogs", "#page-blogs");
          }
          if (link.children?.length) appendSinglePageLinks(link.children);
        });
      };
      appendSinglePageLinks(pageLinks);
      if (!seen.has("#page-blogs")) {
        pushOption("Blogs", "#page-blogs");
      }
      return options;
    }

    const appendPageLinks = (links: PageLink[]) => {
      links.forEach((link) => {
        const href = link.href.trim().toLowerCase();
        if (
          link.kind === "blog" ||
          link.kind === "blogIndex" ||
          href === "#page-blogs" ||
          href.startsWith("#page-blog-")
        ) {
          if (link.children?.length) appendPageLinks(link.children);
          return;
        }
        // Section hashes belong in the Page section tab.
        if (href.startsWith("#") && !href.startsWith("#page-")) {
          if (link.children?.length) appendPageLinks(link.children);
          return;
        }
        pushOption(link.label, link.href);
        if (link.children?.length) appendPageLinks(link.children);
      });
    };

    appendPageLinks(pageLinks);
    return options;
  }, [isSinglePage, pageLinks]);

  const inlineSectionLinkOptions = useMemo(() => {
    const options: Array<{ label: string; href: string }> = [];
    const seen = new Set<string>();

    const pushOption = (label: string, href: string) => {
      const key = href.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      options.push({ label, href });
    };

    pageSectionLinks.forEach((link) => {
      if (link.href) pushOption(link.label, link.href);
    });

    // Fallback from nav/pageLinks section-style hashes if prop is empty.
    if (!options.length) {
      const appendSectionLinks = (links: PageLink[]) => {
        links.forEach((link) => {
          const href = link.href.trim().toLowerCase();
          if (href.startsWith("#") && !href.startsWith("#page-")) {
            pushOption(link.label, link.href);
          }
          if (link.children?.length) appendSectionLinks(link.children);
        });
      };
      appendSectionLinks(pageLinks);
    }

    // Last resort: read live section anchors from the editor canvas.
    if (!options.length && typeof document !== "undefined") {
      document
        .querySelectorAll<HTMLElement>(
          "[data-editor-live-surface] [data-section-id]",
        )
        .forEach((element) => {
          const id = (element.dataset.sectionId || element.id || "").trim();
          if (!id) return;
          const lower = id.toLowerCase();
          if (
            lower === "topbar" ||
            lower === "header" ||
            lower === "footer" ||
            lower.startsWith("topbar") ||
            lower.startsWith("header") ||
            lower.startsWith("footer")
          ) {
            return;
          }
          const label = id
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
          pushOption(label, id === "home" ? "#" : `#${id}`);
        });
    }

    return options;
  }, [pageLinks, pageSectionLinks]);

  const inlineBlogLinkOptions = useMemo(() => {
    const options: Array<{ label: string; href: string }> = [
      { label: "Blogs", href: "#page-blogs" },
    ];
    const seen = new Set(["#page-blogs"]);

    const appendBlogLinks = (links: PageLink[]) => {
      links.forEach((link) => {
        const href = link.href.trim().toLowerCase();
        if (
          link.kind === "blog" ||
          href.startsWith("#page-blog-")
        ) {
          if (link.href && !seen.has(href)) {
            seen.add(href);
            options.push({ label: link.label, href: link.href });
          }
        }
        if (link.children?.length) appendBlogLinks(link.children);
      });
    };
    appendBlogLinks(pageLinks);
    return options;
  }, [pageLinks]);

  useLayoutEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    if (!activeEditableRef.current) {
      applyInlineTextFormats(
        contentElement,
        getUnconsumedInlineTextFormats(formatRegistry),
      );
      syncEmptyInlineTextPlaceholders(contentElement);
    }

    return () => {
      restoreAppliedInlineTextFormats(contentElement);
    };
  }, [formatRegistry]);

  useEffect(() => {
    const handlePrepareSurfaceReplace = () => {
      const activeElement = activeEditableRef.current;
      if (activeElement) {
        finishInlineEdit(activeElement, true);
      }
      closeInlineToolbar();
      closeMediaEditor();
      const contentElement = contentRef.current;
      if (contentElement) {
        restoreAppliedInlineTextFormats(contentElement);
      }
    };

    window.addEventListener(
      "ai-builder-prepare-surface-replace",
      handlePrepareSurfaceReplace,
    );
    return () => {
      window.removeEventListener(
        "ai-builder-prepare-surface-replace",
        handlePrepareSurfaceReplace,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const closeMediaEditor = () => {
    setIsContentEditing(false);
    setShowMediaEditor(false);
    setMediaSearch("");
    setMediaLibrarySources([]);
    setSelectedMediaSrc("");
    setSelectedMediaFileName("");
    setIsMediaUploading(false);
    setMediaUploadError("");
    pendingMediaRef.current = null;
  };

  const getMediaOccurrence = (mediaElement: HTMLElement, oldSrc: string) => {
    const contentElement = contentRef.current;
    if (!contentElement) return 0;

    const matches = Array.from(
      contentElement.querySelectorAll<HTMLElement>("[data-editor-media]"),
    ).filter(
      (element) =>
        (element.dataset.editorMediaSrc || element.getAttribute("src") || "") ===
        oldSrc,
    );
    const occurrence = matches.indexOf(mediaElement);
    return occurrence >= 0 ? occurrence : 0;
  };

  const openMediaEditor = (
    oldSrc: string,
    occurrence: number,
    fieldHint?: string,
  ) => {
    setIsContentEditing(true);
    const pageImages = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-editor-media][data-editor-media-type="image"]',
      ),
    )
      .map(
        (element) =>
          element.dataset.editorMediaSrc || element.getAttribute("src") || "",
      )
      .filter(Boolean);
    const library = Array.from(
      new Set([oldSrc, ...pageImages, ...DEFAULT_PREUPLOADED_IMAGES]),
    );

    pendingMediaRef.current = {
      oldSrc,
      mediaType: "image",
      occurrence,
      fieldHint,
    };
    setSelectedMediaSrc(oldSrc);
    setSelectedMediaFileName(getMediaFileName(oldSrc));
    setMediaLibrarySources(library);
    setMediaSearch("");
    setMediaUploadError("");
    setHoveredMedia(null);
    setShowMediaEditor(true);
  };

  const replaceMediaWithAiOnline = async (media: HoveredMedia) => {
    if (!requireCorePlanOrGoToUpgrade()) return;
    if (aiMediaBusy) return;
    setAiMediaBusy(true);
    try {
      const contentElement = contentRef.current;
      const mediaNodes = contentElement
        ? Array.from(
            contentElement.querySelectorAll<HTMLElement>(
              '[data-editor-media][data-editor-media-type="image"]',
            ),
          )
        : [];
      const avoidSrcs = mediaNodes
        .map(
          (element) =>
            element.dataset.editorMediaSrc ||
            element.getAttribute("src") ||
            "",
        )
        .filter(Boolean);

      const activeNode = mediaNodes.find((element) => {
        const src =
          element.dataset.editorMediaSrc || element.getAttribute("src") || "";
        return (
          src === media.oldSrc &&
          getMediaOccurrence(element, media.oldSrc) === media.occurrence
        );
      });
      const cardText =
        activeNode
          ?.closest("article, li, [data-editor-gallery-item], .group")
          ?.textContent?.replace(/\s+/g, " ")
          .trim()
          .slice(0, 180) || "";
      const altHint =
        activeNode?.getAttribute("alt")?.trim() ||
        activeNode?.querySelector("img")?.getAttribute("alt")?.trim() ||
        "";

      let locale = "en-IN";
      let timeZone = "Asia/Kolkata";
      try {
        locale = navigator.language || locale;
        timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
      } catch {
        // keep defaults
      }

      const response = await fetch("/api/ai/related-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          locale,
          timeZone,
          hint: [label, cardText, altHint, `slot${media.occurrence}`]
            .filter(Boolean)
            .join(" ")
            .slice(0, 240),
          avoidSrc: media.oldSrc,
          avoidSrcs,
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { url?: string };
      const nextSrc = typeof data.url === "string" ? data.url.trim() : "";
      if (!nextSrc || nextSrc === media.oldSrc) return;
      onInlineMediaEdit(
        media.oldSrc,
        nextSrc,
        "image",
        getMediaFileName(nextSrc),
        media.occurrence,
        media.fieldHint,
      );
      setHoveredMedia(null);
    } catch {
      /* keep current image on failure */
    } finally {
      setAiMediaBusy(false);
    }
  };

  const openMediaUpload = () => {
    const pendingMedia = pendingMediaRef.current;
    if (!pendingMedia || !mediaInputRef.current) return;

    mediaInputRef.current.accept =
      pendingMedia.mediaType === "video" ? "video/*" : "image/*";
    mediaInputRef.current.click();
  };

  const applySelectedMedia = () => {
    const pendingMedia = pendingMediaRef.current;
    if (!pendingMedia || !selectedMediaSrc) return;

    if (selectedMediaSrc !== pendingMedia.oldSrc) {
      onInlineMediaEdit(
        pendingMedia.oldSrc,
        selectedMediaSrc,
        pendingMedia.mediaType,
        selectedMediaFileName || getMediaFileName(selectedMediaSrc),
        pendingMedia.occurrence,
        pendingMedia.fieldHint,
      );
    }

    closeMediaEditor();
  };

  const handleMediaElementClick = (mediaElement: HTMLElement) => {
    if (lockCanvasEdit) return;
    if (shouldHideMediaOverlay(label)) return;

    const mediaType =
      mediaElement.dataset.editorMediaType === "video" ? "video" : "image";
    const oldSrc =
      mediaElement.dataset.editorMediaSrc ||
      mediaElement.getAttribute("src") ||
      "";

    if (!oldSrc) return;

    if (mediaType === "image") {
      openMediaEditor(
        oldSrc,
        getMediaOccurrence(mediaElement, oldSrc),
        mediaElement.dataset.editorMediaRole,
      );
      return;
    }

    pendingMediaRef.current = {
      oldSrc,
      mediaType,
      occurrence: getMediaOccurrence(mediaElement, oldSrc),
      fieldHint: mediaElement.dataset.editorMediaRole,
    };
    setIsContentEditing(true);
    openMediaUpload();
  };

  const updateHoveredMedia = (mediaElement: HTMLElement) => {
    if (shouldHideMediaOverlay(label)) {
      setHoveredMedia(null);
      return;
    }

    const contentElement = contentRef.current;
    if (!contentElement) return;

    const oldSrc =
      mediaElement.dataset.editorMediaSrc ||
      mediaElement.getAttribute("src") ||
      "";
    if (!oldSrc) return;

    const mediaRect = mediaElement.getBoundingClientRect();
    const contentRect = contentElement.getBoundingClientRect();

    setHoveredMedia({
      top: mediaRect.top - contentRect.top,
      left: mediaRect.left - contentRect.left,
      width: mediaRect.width,
      height: mediaRect.height,
      borderRadius: window.getComputedStyle(mediaElement).borderRadius,
      oldSrc,
      occurrence: getMediaOccurrence(mediaElement, oldSrc),
      fieldHint: mediaElement.dataset.editorMediaRole,
    });
  };

  const resolveEditorLinkTarget = (
    href: string,
    textLabel = "",
    allowLabelFallback = false,
  ) => {
    const raw = href.trim();
    if (/^(tel:|mailto:|javascript:)/i.test(raw)) return null;
    if (!raw) return null;

    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        if (
          typeof window !== "undefined" &&
          url.host === window.location.host
        ) {
          return resolveEditorLinkTarget(url.pathname, textLabel, allowLabelFallback);
        }
      } catch {
        /* ignore */
      }
      return { pageLabel: null, sectionHref: null, externalHref: raw };
    }

    if (raw.startsWith("#") && !raw.toLowerCase().startsWith("#page-")) {
      if (raw === "#" || raw.toLowerCase() === "#home") {
        if (allowLabelFallback) {
          const labelSlug = normalizeEditorNavSlug(textLabel);
          if (labelSlug && labelSlug !== "home") {
            return resolveEditorLinkTarget(
              `#page-${labelSlug}`,
              textLabel,
              true,
            );
          }
        }
        return { pageLabel: "Home", sectionHref: null, externalHref: null };
      }
      const section = inlineSectionLinkOptions.find(
        (option) => option.href.trim().toLowerCase() === raw.toLowerCase(),
      );
      return {
        pageLabel: null,
        sectionHref: section?.href || raw,
        externalHref: null,
      };
    }

    const slug = normalizeEditorNavSlug(raw);
    if (!slug) return null;
    if (slug === "home") {
      return { pageLabel: "Home", sectionHref: null, externalHref: null };
    }

    const match = [...inlinePageLinkOptions, ...inlineBlogLinkOptions].find(
      (option) =>
        normalizeEditorNavSlug(option.href) === slug ||
        normalizeEditorNavSlug(option.label) === slug,
    );
    if (match) {
      return { pageLabel: match.label, sectionHref: null, externalHref: null };
    }

    if (slug === "blogs" || slug === "blog") {
      return { pageLabel: "Blogs", sectionHref: null, externalHref: null };
    }

    if (!allowLabelFallback) return null;

    return {
      pageLabel: slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      sectionHref: null,
      externalHref: null,
    };
  };

  const canShowGoToIcon = (element: HTMLElement | null) => {
    if (!element) return false;
    if (isChromeSection(label)) return Boolean(findClosestHref(element));
    return isButtonLikeHost(element) && Boolean(findClosestHref(element));
  };

  const goToResolvedLink = (target: HoveredLinkNav) => {
    if (target.externalHref) {
      window.open(target.externalHref, "_blank", "noopener,noreferrer");
      return;
    }
    if (target.pageLabel) {
      setCurrentPage(target.pageLabel);
      scrollTemplateToTop();
      return;
    }
    const sectionId = (target.sectionHref || "").replace(/^#/, "").trim();
    if (!sectionId) return;
    const sectionEl =
      document.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`) ||
      document.getElementById(sectionId);
    sectionEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearHoveredEditable = () => {
    hoveredEditableRef.current?.removeAttribute(
      INLINE_BUTTON_HOVER_ATTRIBUTE,
    );
    hoveredEditableRef.current?.removeAttribute(INLINE_LINK_NAV_ATTRIBUTE);
    if (
      hoveredEditableRef.current &&
      hoveredEditableRef.current !== activeEditableRef.current
    ) {
      hoveredEditableRef.current.classList.remove(
        ...INLINE_HIGHLIGHT_CLASS.split(" "),
      );
    }
    hoveredEditableRef.current = null;
    setHoveredLinkNav(null);
  };

  const setHoveredEditable = (element: HTMLElement | null) => {
    if (hoveredEditableRef.current === element) return;

    clearHoveredEditable();

    if (!element || element === activeEditableRef.current) return;

    hoveredEditableRef.current = element;
    element.classList.add(...INLINE_HIGHLIGHT_CLASS.split(" "));

    const href = findClosestHref(element);
    const textLabel = getInlinePersistableText(element);
    const target = canShowGoToIcon(element)
      ? resolveEditorLinkTarget(href, textLabel, isChromeSection(label))
      : null;

    if (target) {
      element.setAttribute(INLINE_LINK_NAV_ATTRIBUTE, "true");
      const rect = element.getBoundingClientRect();
      setHoveredLinkNav({
        top: rect.top,
        left: rect.left,
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
        pageLabel: target.pageLabel,
        sectionHref: target.sectionHref,
        externalHref: target.externalHref,
      });
      return;
    }

    element.setAttribute(INLINE_BUTTON_HOVER_ATTRIBUTE, "true");
  };

  const captureInlineSelection = () => {
    const activeElement = activeEditableRef.current;
    const selection = window.getSelection();

    if (!activeElement || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    if (
      !activeElement.contains(range.startContainer) &&
      !activeElement.contains(range.endContainer) &&
      !activeElement.contains(commonAncestor)
    ) {
      return;
    }

    inlineSelectionRef.current = range.cloneRange();
  };

  const restoreInlineSelection = () => {
    const activeElement = activeEditableRef.current;
    const selection = window.getSelection();

    if (!activeElement || !selection) return;

    activeElement.focus();

    if (!inlineSelectionRef.current) return;

    selection.removeAllRanges();
    selection.addRange(inlineSelectionRef.current);
  };

  const updateInlineToolbarPosition = () => {
    const activeElement = activeEditableRef.current;
    if (!activeElement) return;

    const selection = window.getSelection();
    const width = Math.min(
      INLINE_TOOLBAR_WIDTH,
      Math.max(window.innerWidth - 24, 280),
    );

    let targetRect = activeElement.getBoundingClientRect();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (
        activeElement.contains(range.startContainer) ||
        activeElement.contains(range.endContainer)
      ) {
        const selectionRect = range.getBoundingClientRect();
        if (selectionRect.width || selectionRect.height) {
          targetRect = selectionRect;
        }
      }
    }

    const centerX = targetRect.left + targetRect.width / 2;
    const left = Math.min(
      Math.max(centerX, width / 2 + INLINE_TOOLBAR_GAP),
      window.innerWidth - width / 2 - INLINE_TOOLBAR_GAP,
    );
    const aboveTop =
      targetRect.top - INLINE_TOOLBAR_OFFSET - INLINE_TOOLBAR_HEIGHT;
    const top =
      aboveTop >= INLINE_TOOLBAR_GAP
        ? aboveTop
        : targetRect.bottom + INLINE_TOOLBAR_OFFSET;

    setInlineToolbarPosition((current) =>
      current &&
      current.top === top &&
      current.left === left &&
      current.width === width
        ? current
        : { top, left, width },
    );
  };

  const closeInlineToolbar = () => {
    inlineSelectionRef.current = null;
    setInlineToolbarPosition(null);
    setInlineCommandState(EMPTY_INLINE_COMMAND_STATE);
    setShowInlineColorPicker(false);
  };

  const getActiveInlineSelectionElement = () => {
    const activeElement = activeEditableRef.current;
    const selection = window.getSelection();
    if (!activeElement || !selection || selection.rangeCount === 0) {
      return activeElement;
    }

    const range = selection.getRangeAt(0);
    if (!activeElement.contains(range.startContainer)) return activeElement;

    const selectionElement =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement;

    if (!selectionElement || !activeElement.contains(selectionElement)) {
      return activeElement;
    }

    if (selectionElement === activeElement) {
      return (
        activeElement.querySelector<HTMLElement>("[style*='font-size']") ||
        (activeElement.lastElementChild as HTMLElement | null) ||
        activeElement
      );
    }

    return selectionElement;
  };

  const getSelectedInlineStyleElements = () => {
    const activeElement = activeEditableRef.current;
    const selection = window.getSelection();
    if (!activeElement || !selection || selection.rangeCount === 0) return [];

    const range = selection.getRangeAt(0);
    if (
      !activeElement.contains(range.startContainer) ||
      !activeElement.contains(range.endContainer)
    ) {
      return [];
    }

    if (range.collapsed) {
      const selectionElement = getActiveInlineSelectionElement();
      return selectionElement ? [selectionElement] : [activeElement];
    }

    const elements: HTMLElement[] = [];
    const seen = new Set<HTMLElement>();
    const walker = document.createTreeWalker(
      activeElement,
      NodeFilter.SHOW_TEXT,
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      const text = currentNode.textContent ?? "";
      let intersects = false;

      try {
        intersects = Boolean(text.trim()) && range.intersectsNode(currentNode);
      } catch {
        intersects = false;
      }

      const parent = currentNode.parentElement;
      if (intersects && parent && !seen.has(parent)) {
        seen.add(parent);
        elements.push(parent);
      }
      currentNode = walker.nextNode();
    }

    return elements.length ? elements : [activeElement];
  };

  const rememberInlineDomChange = (activeElement: HTMLElement) => {
    inlineUndoRef.current = [
      ...inlineUndoRef.current.slice(-29),
      activeElement.innerHTML,
    ];
    inlineRedoRef.current = [];
  };

  const selectInlineNodeContents = (
    activeElement: HTMLElement,
    node: Node = activeElement,
  ) => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    inlineSelectionRef.current = range.cloneRange();
  };

  const applyDirectInlineCommand = (
    activeElement: HTMLElement,
    command: string,
    value?: string,
  ) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    if (
      !activeElement.contains(range.startContainer) ||
      !activeElement.contains(range.endContainer)
    ) {
      return false;
    }

    if (
      command === "insertUnorderedList" ||
      command === "insertOrderedList"
    ) {
      if (range.collapsed) range.selectNodeContents(activeElement);

      const selectedText = range.toString() || activeElement.innerText;
      const lines = selectedText.split(/\r?\n/);
      const contentLines = lines.filter((line) => line.trim());
      const isUnordered =
        contentLines.length > 0 &&
        contentLines.every((line) => /^\s*•\s+/.test(line));
      const isOrdered =
        contentLines.length > 0 &&
        contentLines.every((line) => /^\s*\d+\.\s+/.test(line));
      const cleanLines = lines.map((line) =>
        line.replace(/^\s*(?:•|\d+\.)\s+/, ""),
      );
      const shouldRemove =
        command === "insertUnorderedList" ? isUnordered : isOrdered;
      const formattedLines = cleanLines.map((line, index) => {
        if (!line.trim() || shouldRemove) return line;
        return command === "insertUnorderedList"
          ? `• ${line}`
          : `${index + 1}. ${line}`;
      });
      const replacement = document.createDocumentFragment();

      formattedLines.forEach((line, index) => {
        replacement.append(document.createTextNode(line));
        if (index < formattedLines.length - 1) {
          replacement.append(document.createElement("br"));
        }
      });

      rememberInlineDomChange(activeElement);
      range.deleteContents();
      range.insertNode(replacement);
      activeElement.normalize();
      selectInlineNodeContents(activeElement);
      return true;
    }

    if (range.collapsed) return false;

    const selectedElements = getSelectedInlineStyleElements();
    const selectedStyles = selectedElements.map((element) =>
      window.getComputedStyle(element),
    );
    const allBold =
      selectedStyles.length > 0 &&
      selectedStyles.every((style) => {
        const weight = Number.parseInt(style.fontWeight, 10);
        return (
          style.fontWeight === "bold" ||
          (!Number.isNaN(weight) && weight >= 600)
        );
      });
    const allItalic =
      selectedStyles.length > 0 &&
      selectedStyles.every((style) => style.fontStyle === "italic");
    const allUnderlined =
      selectedStyles.length > 0 &&
      selectedStyles.every(
        (style) =>
          style.textDecoration.includes("underline") ||
          style.textDecorationLine.includes("underline"),
      );

    if (
      ![
        "bold",
        "italic",
        "underline",
        "foreColor",
        "fontSize",
        "removeFormat",
      ].includes(command)
    ) {
      return false;
    }

    rememberInlineDomChange(activeElement);
    const fragment = range.extractContents();
    const clearFragmentProperty = (
      selector: string,
      styleProperties: string[],
    ) => {
      Array.from(fragment.querySelectorAll<HTMLElement>("[style]")).forEach(
        (element) => {
          styleProperties.forEach((property) =>
            element.style.removeProperty(property),
          );
          if (!element.getAttribute("style")?.trim()) {
            element.removeAttribute("style");
          }
        },
      );
      Array.from(fragment.querySelectorAll<HTMLElement>(selector))
        .reverse()
        .forEach((element) => {
          element.replaceWith(...Array.from(element.childNodes));
        });
    };

    if (command === "bold") {
      clearFragmentProperty("b,strong", ["font-weight"]);
    }
    if (command === "italic") {
      clearFragmentProperty("i,em", ["font-style"]);
    }
    if (command === "underline") {
      clearFragmentProperty("u", ["text-decoration", "text-decoration-line"]);
    }
    if (command === "removeFormat") {
      clearFragmentProperty("b,strong,i,em,u,s,strike,span", [
        "color",
        "font-size",
        "font-style",
        "font-weight",
        "text-decoration",
        "text-decoration-line",
      ]);
    }
    if (command === "foreColor") {
      Array.from(fragment.querySelectorAll<HTMLElement>("[style]")).forEach(
        (element) => {
          element.style.removeProperty("color");
          if (!element.getAttribute("style")?.trim()) {
            element.removeAttribute("style");
          }
        },
      );
      Array.from(fragment.querySelectorAll<HTMLSpanElement>("span"))
        .reverse()
        .forEach((span) => {
          if (!span.attributes.length) {
            span.replaceWith(...Array.from(span.childNodes));
          }
        });
    }
    if (command === "fontSize") {
      Array.from(fragment.querySelectorAll<HTMLElement>("[style]")).forEach(
        (element) => {
          element.style.removeProperty("font-size");
          if (!element.getAttribute("style")?.trim()) {
            element.removeAttribute("style");
          }
        },
      );
    }
    const wrapper = document.createElement("span");

    if (command === "bold") {
      wrapper.style.fontWeight = allBold ? "normal" : "bold";
    }
    if (command === "italic") {
      wrapper.style.fontStyle = allItalic ? "normal" : "italic";
    }
    if (command === "underline") {
      wrapper.style.textDecoration = allUnderlined ? "none" : "underline";
    }
    if (command === "foreColor" && value) wrapper.style.color = value;
    if (command === "fontSize" && value) {
      wrapper.style.fontSize = `${value}px`;
    }
    if (command === "removeFormat") {
      const baseStyle = window.getComputedStyle(activeElement);
      wrapper.style.color = baseStyle.color;
      wrapper.style.fontSize = baseStyle.fontSize;
      wrapper.style.fontStyle = baseStyle.fontStyle;
      wrapper.style.fontWeight = baseStyle.fontWeight;
      wrapper.style.textDecorationLine = baseStyle.textDecorationLine || "none";
    }

    wrapper.append(fragment);
    range.insertNode(wrapper);
    let selectedWrapper = wrapper;

    if (wrapper.getAttribute("style")) {
      let parent = selectedWrapper.parentElement;

      while (
        parent instanceof HTMLSpanElement &&
        parent.childNodes.length === 1 &&
        parent.firstChild === selectedWrapper
      ) {
        const currentParent = parent;
        Array.from(selectedWrapper.style).forEach((property) => {
          currentParent.style.setProperty(
            property,
            selectedWrapper.style.getPropertyValue(property),
          );
        });
        selectedWrapper.replaceWith(...Array.from(selectedWrapper.childNodes));
        selectedWrapper = currentParent;
        parent = selectedWrapper.parentElement;
      }
    }

    activeElement.normalize();
    selectInlineNodeContents(activeElement, selectedWrapper);
    return true;
  };

  const syncInlineCommandState = () => {
    const activeElement = activeEditableRef.current;
    if (!activeElement) return;

    const queryState = (command: string) => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };
    const queryEnabled = (command: string) => {
      try {
        return document.queryCommandEnabled(command);
      } catch {
        return false;
      }
    };
    const selectionElement = getActiveInlineSelectionElement();
    const selectedStyleElements = getSelectedInlineStyleElements();
    const selectedStyles = selectedStyleElements.map((element) =>
      window.getComputedStyle(element),
    );
    const selectionStyle = window.getComputedStyle(
      selectionElement || activeElement,
    );
    const selection = window.getSelection();
    const selectionRange = selection?.rangeCount
      ? selection.getRangeAt(0)
      : null;
    const selectedText = selectionRange?.collapsed
      ? activeElement.innerText
      : selectionRange?.toString() || activeElement.innerText;
    const selectedLines = selectedText
      .split(/\r?\n/)
      .filter((line) => line.trim());
    const hasUnorderedMarkers =
      selectedLines.length > 0 &&
      selectedLines.every((line) => /^\s*•\s+/.test(line));
    const hasOrderedMarkers =
      selectedLines.length > 0 &&
      selectedLines.every((line) => /^\s*\d+\.\s+/.test(line));
    const selectionFontWeight = Number.parseInt(
      selectionStyle.fontWeight,
      10,
    );
    const inlineAncestors: HTMLElement[] = [];
    let inlineAncestor = selectionElement;

    while (inlineAncestor) {
      inlineAncestors.push(inlineAncestor);
      if (inlineAncestor === activeElement) break;
      inlineAncestor = inlineAncestor.parentElement;
    }

    const explicitlyFormattedElements = inlineAncestors;

    const hasExplicitBold = explicitlyFormattedElements.some((element) => {
      const fontWeight = element.style.fontWeight;
      const numericFontWeight = Number.parseInt(fontWeight, 10);

      return (
        element.matches("b,strong") ||
        fontWeight === "bold" ||
        (!Number.isNaN(numericFontWeight) && numericFontWeight >= 600)
      );
    });
    const hasExplicitItalic = explicitlyFormattedElements.some(
      (element) =>
        element.matches("i,em") || element.style.fontStyle === "italic",
    );
    const hasExplicitUnderline = explicitlyFormattedElements.some(
      (element) =>
        element.matches("u") ||
        element.style.textDecoration.includes("underline") ||
        element.style.textDecorationLine.includes("underline"),
    );

    setInlineCommandState({
      bold:
        selectedStyles.length > 0
          ? selectedStyles.every((style) => {
              const weight = Number.parseInt(style.fontWeight, 10);
              return (
                style.fontWeight === "bold" ||
                (!Number.isNaN(weight) && weight >= 600)
              );
            })
          : hasExplicitBold ||
            selectionStyle.fontWeight === "bold" ||
            (!Number.isNaN(selectionFontWeight) && selectionFontWeight >= 600),
      italic:
        selectedStyles.length > 0
          ? selectedStyles.every((style) => style.fontStyle === "italic")
          : hasExplicitItalic,
      underline:
        selectedStyles.length > 0
          ? selectedStyles.every(
              (style) =>
                style.textDecoration.includes("underline") ||
                style.textDecorationLine.includes("underline"),
            )
          : hasExplicitUnderline,
      unorderedList:
        hasUnorderedMarkers || queryState("insertUnorderedList"),
      orderedList: hasOrderedMarkers || queryState("insertOrderedList"),
      canUndo:
        inlineUndoRef.current.length > 0 ||
        queryEnabled("undo"),
      canRedo:
        inlineRedoRef.current.length > 0 ||
        queryEnabled("redo"),
    });
  };

  const runInlineCommand = (command: string, value?: string) => {
    const activeElement = activeEditableRef.current;
    if (!activeElement || isPreview) return;

    if (command === "undo" && inlineUndoRef.current.length) {
      const previousHtml = inlineUndoRef.current.at(-1);
      if (previousHtml === undefined) return;
      inlineUndoRef.current = inlineUndoRef.current.slice(0, -1);
      inlineRedoRef.current = [
        activeElement.innerHTML,
        ...inlineRedoRef.current.slice(0, 29),
      ];
      activeElement.innerHTML = previousHtml;
      selectInlineNodeContents(activeElement);
      syncInlineCommandState();
      updateInlineToolbarPosition();
      return;
    }

    if (command === "redo" && inlineRedoRef.current.length) {
      const nextHtml = inlineRedoRef.current[0];
      inlineRedoRef.current = inlineRedoRef.current.slice(1);
      inlineUndoRef.current = [
        ...inlineUndoRef.current.slice(-29),
        activeElement.innerHTML,
      ];
      activeElement.innerHTML = nextHtml;
      selectInlineNodeContents(activeElement);
      syncInlineCommandState();
      updateInlineToolbarPosition();
      return;
    }

    restoreInlineSelection();

    // Formatting toolbar actions should style the whole field when the caret
    // is collapsed; otherwise execCommand only affects future typing and the
    // visible change never gets persisted on blur.
    if (
      ["bold", "italic", "underline", "foreColor", "removeFormat"].includes(
        command,
      )
    ) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      if (!range || range.collapsed) {
        selectInlineNodeContents(activeElement);
      }
    }

    const handledDirectly = applyDirectInlineCommand(
      activeElement,
      command,
      value,
    );

    if (!handledDirectly) {
      // Browser fallback keeps collapsed-caret typing and native list behavior.
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, value);
    }

    if (command === "removeFormat") {
      setInlineFontSize(
        getNearestInlineFontSize(
          window.getComputedStyle(activeElement).fontSize,
        ),
      );
    }
    captureInlineSelection();
    syncInlineCommandState();
    updateInlineToolbarPosition();
    activeElement.focus();
  };

  const closeInlineLinkEditor = () => {
    showInlineLinkEditorRef.current = false;
    setShowInlineLinkEditor(false);
    setInlineLinkValue("");
  };

  const openInlineLinkEditor = () => {
    const activeElement = activeEditableRef.current;
    if (!activeElement || isPreview) return;

    restoreInlineSelection();

    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);

      if (range.collapsed) {
        range.selectNodeContents(activeElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    captureInlineSelection();

    const savedRange = inlineSelectionRef.current;
    const rangeElement = savedRange
      ? savedRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (savedRange.commonAncestorContainer as HTMLElement)
        : savedRange.commonAncestorContainer.parentElement
      : null;
    const existingAnchor =
      (rangeElement?.closest<HTMLAnchorElement>("a") ??
        activeElement.closest<HTMLAnchorElement>("a")) ||
      (activeElement.matches("a")
        ? (activeElement as HTMLAnchorElement)
        : activeElement.querySelector<HTMLAnchorElement>("a"));
    const existingHref = existingAnchor?.getAttribute("href")?.trim() ?? "";
    const normalizedHref = existingHref.toLowerCase();

    if (existingHref.startsWith("mailto:")) {
      setInlineLinkType("email");
      setInlineLinkValue(existingHref.slice(7));
    } else if (existingHref.startsWith("tel:")) {
      setInlineLinkType("phone");
      setInlineLinkValue(existingHref.slice(4));
    } else if (
      normalizedHref === "#page-blogs" ||
      normalizedHref.startsWith("#page-blog-")
    ) {
      setInlineLinkType("page");
      setInlineLinkValue(existingHref);
    } else if (normalizedHref.startsWith("#page-")) {
      setInlineLinkType("page");
      setInlineLinkValue(existingHref);
    } else if (existingHref.startsWith("#")) {
      setInlineLinkType("section");
      setInlineLinkValue(
        inlineSectionLinkOptions.some((option) => option.href === existingHref)
          ? existingHref
          : inlineSectionLinkOptions[0]?.href || existingHref,
      );
    } else if (/^https?:\/\//i.test(existingHref)) {
      setInlineLinkType("external");
      setInlineLinkValue(existingHref);
    } else {
      setInlineLinkType("page");
      setInlineLinkValue(
        existingHref ||
          inlinePageLinkOptions[0]?.href ||
          inlineBlogLinkOptions[0]?.href ||
          "#",
      );
    }

    // Set before state so blur from dialog focus cannot finish the edit first.
    showInlineLinkEditorRef.current = true;
    setShowInlineLinkEditor(true);
  };

  const applyLinkToInlineSelection = (
    activeElement: HTMLElement,
    href: string,
  ) => {
    restoreInlineSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    if (
      !activeElement.contains(range.startContainer) ||
      !activeElement.contains(range.endContainer)
    ) {
      range.selectNodeContents(activeElement);
    }

    if (range.collapsed) range.selectNodeContents(activeElement);

    const rangeElement =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;
    const existingAnchor = rangeElement?.closest<HTMLAnchorElement>("a");

    if (
      existingAnchor &&
      existingAnchor !== activeElement &&
      activeElement.contains(existingAnchor)
    ) {
      existingAnchor.setAttribute("href", href);
      const linkedRange = document.createRange();
      linkedRange.selectNodeContents(existingAnchor);
      inlineSelectionRef.current = linkedRange;
      return true;
    }

    const selectedContent = range.cloneContents();
    if (!(selectedContent.textContent ?? "").trim()) return false;

    const link = document.createElement("a");
    link.setAttribute("href", href);
    link.append(range.extractContents());
    range.insertNode(link);
    activeElement.normalize();

    const linkedRange = document.createRange();
    linkedRange.selectNodeContents(link);
    selection.removeAllRanges();
    selection.addRange(linkedRange);
    inlineSelectionRef.current = linkedRange.cloneRange();

    return true;
  };

  const applyInlineLink = () => {
    const value = inlineLinkValue.trim();
    if (!value) return;

    const activeElement = activeEditableRef.current;
    if (!activeElement) return;

    let href = value;

    if (inlineLinkType === "external" || inlineLinkType === "booking") {
      href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    }

    if (inlineLinkType === "email") {
      href = `mailto:${value.replace(/^mailto:/i, "")}`;
    }

    if (inlineLinkType === "phone") {
      href = `tel:${value.replace(/^tel:/i, "").replace(/\s+/g, "")}`;
    }

    if (inlineLinkType === "section") {
      href = value.startsWith("#") ? value : `#${value}`;
    }

    if (activeElement.matches("a")) {
      const oldHref = activeElement.getAttribute("href") ?? "";
      const linkText = getInlinePersistableText(activeElement);

      activeElement.setAttribute("href", href);
      closeInlineLinkEditor();
      finishInlineEdit(activeElement, true);

      if (oldHref !== href) {
        onInlineLinkEdit(oldHref, href, linkText);
      }
      return;
    }

    const linkApplied = applyLinkToInlineSelection(activeElement, href);
    if (!linkApplied) return;

    closeInlineLinkEditor();
    finishInlineEdit(activeElement, true);
  };

  const resetInlineLinks = () => {
    const activeElement = activeEditableRef.current;
    if (!activeElement) return;

    if (activeElement.matches("a")) {
      const oldHref = activeElement.getAttribute("href") ?? "";
      const linkText = getInlinePersistableText(activeElement);

      activeElement.setAttribute("href", "#");
      closeInlineLinkEditor();
      finishInlineEdit(activeElement, true);

      if (oldHref !== "#") {
        onInlineLinkEdit(oldHref, "#", linkText);
      }
      return;
    }

    const links = Array.from(
      activeElement.querySelectorAll<HTMLAnchorElement>("a"),
    );

    links.forEach((link) => {
      link.replaceWith(...Array.from(link.childNodes));
    });
    activeElement.normalize();
    closeInlineLinkEditor();
    finishInlineEdit(activeElement, true);
  };

  useEffect(() => {
    const dialog = showMediaEditor
      ? mediaEditorRef.current
      : showInlineLinkEditor
        ? inlineLinkEditorRef.current
        : null;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
    const focusFrame = window.requestAnimationFrame(() => {
      getFocusable()[0]?.focus();
    });
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (showMediaEditor) closeMediaEditor();
        else closeInlineLinkEditor();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1) ?? first;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleDialogKeyDown);
      previouslyFocused?.focus();
    };
    // Dialog callbacks intentionally operate on the currently open modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInlineLinkEditor, showMediaEditor]);

  const openTextColorPicker = () => {
    const activeElement = activeEditableRef.current;
    if (!activeElement || isPreview) return;

    captureInlineSelection();
    const selectionElement = getActiveInlineSelectionElement();
    const currentColor =
      window.getComputedStyle(selectionElement || activeElement).color ||
      "#000000";
    const match = currentColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)/i,
    );

    if (match) {
      const [, r, g, b] = match;
      const toHex = (value: string) =>
        Number(value).toString(16).padStart(2, "0");
      setInlineTextColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    } else {
      setInlineTextColor("#000000");
    }

    setShowInlineColorPicker((open) => !open);
  };

  const applyInlineTextColor = (color: string) => {
    if (!color) return;
    const normalized = color.startsWith("#") ? color : `#${color}`;
    setInlineTextColor(normalized);
    restoreInlineSelection();
    runInlineCommand("foreColor", normalized);
  };

  const handleTextColorChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    applyInlineTextColor(event.target.value);
  };

  const syncInlineFontSize = () => {
    const activeElement = activeEditableRef.current;
    if (!activeElement) return;

    const selectionElement = getActiveInlineSelectionElement();

    setInlineFontSize(
      getNearestInlineFontSize(
        window.getComputedStyle(selectionElement || activeElement).fontSize,
      ),
    );
  };

  const applyInlineFontSize = (size: string) => {
    const activeElement = activeEditableRef.current;
    if (!activeElement || isPreview) return;

    const requestedSize = Number.parseInt(size, 10);
    const safeSize = String(
      Math.min(
        MAX_INLINE_FONT_SIZE,
        Math.max(1, Number.isNaN(requestedSize) ? 16 : requestedSize),
      ),
    );

    restoreInlineSelection();
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!range || range.collapsed) {
      selectInlineNodeContents(activeElement);
    }

    runInlineCommand("fontSize", safeSize);
    setInlineFontSize(safeSize);
  };

  const handleAddComponent = (sectionType: string, variant?: string) => {
    setGeneratingComponent(variant || sectionType);
    window.setTimeout(() => {
      onAddSection(sectionType, variant);
      setGeneratingComponent(null);
      setShowAddPopup(false);
    }, 1600);
  };
  const databaseAddableLayouts = getAddableLayoutsForCategory(
    category,
    pageScope,
  );
  const homeAddableLayouts =
    pageScope === "page" && databaseAddableLayouts.length === 0
      ? getAddableLayoutsForCategory(category, "home")
      : [];
  const resolvedDatabaseLayouts =
    databaseAddableLayouts.length > 0
      ? databaseAddableLayouts
      : homeAddableLayouts;
  const addableLayouts: BuilderLayout[] = resolvedDatabaseLayouts.length
    ? resolvedDatabaseLayouts
    : getContentBundle().layouts.length === 0
      ? addableSectionCards.map((card, index) => ({
          id: card.variant,
          key: card.variant,
          name: card.title,
          sectionType: card.type,
          sectionNumber: index + 1,
          categorySlug: null,
          scope: "home",
          order: index + 1,
          status: "Active",
          description: card.description,
        }))
      : [];
  const normalizedAddSectionSearch = addSectionSearch.trim().toLowerCase();
  const filteredAddableLayouts = useMemo(() => {
    if (!normalizedAddSectionSearch) return addableLayouts;
    return addableLayouts.filter((layout) => {
      const haystack = [
        layout.name,
        layout.key,
        layout.sectionType,
        layout.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedAddSectionSearch);
    });
  }, [addableLayouts, normalizedAddSectionSearch]);
  const sectionName = label.charAt(0).toUpperCase() + label.slice(1);
  const canShowSectionAddButton =
    !lockCanvasEdit &&
    (forceShowAddButton ||
      !["topbar", "header", "footer"].includes(label.toLowerCase()));
  const shouldCenterToolbar = !canShowSectionAddButton;
  const normalizedMediaSearch = mediaSearch.trim().toLowerCase();
  const filteredMediaSources = mediaLibrarySources.filter((src) =>
    normalizedMediaSearch
      ? getMediaFileName(src).toLowerCase().includes(normalizedMediaSearch) ||
        src.toLowerCase().includes(normalizedMediaSearch)
      : true,
  );

  const finishInlineEdit = (element: HTMLElement, shouldSave: boolean) => {
    const oldText = originalTextRef.current;
    const rawNewText = getInlinePersistableText(element);
    const isEmptyText = !rawNewText;
    const newText = isEmptyText ? INLINE_EMPTY_TEXT_VALUE : rawNewText;
    const originalHtml = originalHtmlRef.current;
    const oldOccurrence = originalOccurrenceRef.current;
    const formatKey = originalFormatKeyRef.current;
    const isPlainTextEdit = isPlainTextInlineElement(element);
    const oldHtml = sanitizeInlineHtml(originalHtml);
    const newHtml = isPlainTextEdit
      ? newText
      : isEmptyText
        ? INLINE_EMPTY_TEXT_VALUE
        : sanitizeInlineHtml(element.innerHTML);
    const contentElement = contentRef.current;
    const newOccurrence = contentElement
      ? getInlineTextOccurrence(contentElement, element, newText)
      : originalOccurrenceRef.current;

    if (isEmptyText) {
      element.textContent = INLINE_EMPTY_TEXT_VALUE;
      element.setAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE, "true");
    } else {
      element.removeAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE);
      if (isPlainTextEdit) {
        element.textContent = newText;
      }
    }

    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
    element.classList.remove(...INLINE_HIGHLIGHT_CLASS.split(" "));
    activeEditableRef.current = null;
    originalTextRef.current = "";
    originalHtmlRef.current = "";
    originalFormatKeyRef.current = undefined;
    inlineUndoRef.current = [];
    inlineRedoRef.current = [];
    setIsInlineEditing(false);
    setIsRichInlineEditing(false);
    setIsContentEditing(false);
    showInlineLinkEditorRef.current = false;
    setShowInlineLinkEditor(false);
    setInlineLinkValue("");
    closeInlineToolbar();
    clearHoveredEditable();

    if (
      shouldSave &&
      oldText &&
      (isPlainTextEdit
        ? oldText !== newText
        : oldText !== newText || oldHtml !== newHtml)
    ) {
      releaseAppliedInlineTextFormat(element);
      onInlineTextEdit(
        oldText,
        newText,
        isPlainTextEdit
          ? null
          : hasMeaningfulInlineFormatting(newHtml)
            ? newHtml
            : null,
        oldOccurrence,
        newOccurrence,
        formatKey,
      );
    } else if (!shouldSave) {
      element.innerHTML = originalHtml || oldText;
      if (oldText === INLINE_EMPTY_TEXT_VALUE) {
        element.setAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE, "true");
      }
    }
  };

  useEffect(() => {
    if (!isInlineEditing) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const activeElement = activeEditableRef.current;

      if (!target || !activeElement) return;
      if (showInlineLinkEditorRef.current) return;
      if (activeElement.contains(target)) return;
      if (inlineToolbarRef.current?.contains(target)) return;
      if (inlineLinkEditorRef.current?.contains(target)) return;
      if (textColorInputRef.current === target) return;

      finishInlineEdit(activeElement, true);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsidePointerDown,
        true,
      );
    };
    // The listener intentionally captures the edit session that opened it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInlineEditing]);

  useEffect(() => {
    if (!isInlineEditing) return;

    let frame = 0;
    const schedulePositionUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateInlineToolbarPosition);
    };

    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
    };
  }, [isInlineEditing]);

  const startInlineEdit = (element: HTMLElement) => {
    if (activeEditableRef.current === element) return;

    if (activeEditableRef.current) {
      finishInlineEdit(activeEditableRef.current, true);
    }

    const isEmptyPlaceholder =
      element.getAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE) === "true";
    originalTextRef.current = isEmptyPlaceholder
      ? INLINE_EMPTY_TEXT_VALUE
      : getInlinePersistableText(element);
    originalHtmlRef.current = element.innerHTML;
    inlineUndoRef.current = [];
    inlineRedoRef.current = [];
    originalFormatKeyRef.current =
      element.dataset.editorInlineFormatKey ||
      element.querySelector<HTMLElement>("[data-editor-inline-format-key]")
        ?.dataset.editorInlineFormatKey;
    originalOccurrenceRef.current = contentRef.current
      ? getInlineTextOccurrence(
          contentRef.current,
          element,
          originalTextRef.current,
        )
      : 0;
    if (isEmptyPlaceholder) {
      element.innerHTML = "";
    }
  const isPlainTextEdit = isPlainTextInlineElement(element);
    activeEditableRef.current = element;
  setIsContentEditing(true);
    setIsInlineEditing(true);
  setIsRichInlineEditing(!isPlainTextEdit);
  clearHoveredEditable();

    element.setAttribute("contenteditable", "true");
    element.setAttribute("spellcheck", "false");
  element.classList.add(...INLINE_HIGHLIGHT_CLASS.split(" "));
    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  if (!isPlainTextEdit) {
    captureInlineSelection();
    syncInlineFontSize();
    syncInlineCommandState();
    window.requestAnimationFrame(() => {
      updateInlineToolbarPosition();
    });
  } else {
    closeInlineToolbar();
  }
  };

  const handleInlineTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;

    const target = event.target as HTMLElement;

    if (target.closest("[data-editor-toolbar]")) return;

    if (lockCanvasEdit) return;

    const mediaElement = target.closest<HTMLElement>("[data-editor-media]");
    const isCustomEditorElement = Boolean(
      target.closest("[data-custom-editor-element]"),
    );
    if (mediaElement && event.currentTarget.contains(mediaElement)) {
      if (isManagerBackedCardArea(mediaElement)) return;
      if (
        isCustomEditorElement &&
        mediaElement.dataset.customEditorOpen !== "true"
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      handleMediaElementClick(mediaElement);
      return;
    }

    if (target.closest("[data-editor-no-inline]")) return;

    const editableElement = resolveInlineEditableElement(
      event.currentTarget,
      target,
    );

    if (!editableElement || !event.currentTarget.contains(editableElement)) {
      return;
    }

    const text = getInlinePersistableText(editableElement);

    if (!text) return;

    event.preventDefault();
    event.stopPropagation();
    startInlineEdit(editableElement);
  };

  const handleInlineTextBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as Node | null;

    // Keep the edit session alive while the Call to Action dialog is open
    // (dialog focus often reports a null relatedTarget).
    if (showInlineLinkEditorRef.current) return;

    if (
      relatedTarget &&
      (inlineToolbarRef.current?.contains(relatedTarget) ||
        inlineLinkEditorRef.current?.contains(relatedTarget) ||
        relatedTarget === textColorInputRef.current)
    ) {
      return;
    }

    if (target === activeEditableRef.current) {
      finishInlineEdit(target, true);
    }
  };

  const handleInlineTextKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement;

    if (target !== activeEditableRef.current) return;

    if (event.key === "Enter") {
      event.preventDefault();

      const isHeadingOrParagraph = Boolean(
        target.matches(INLINE_MULTILINE_TEXT_SELECTOR) ||
          target.closest(INLINE_MULTILINE_TEXT_SELECTOR),
      );

      if (isHeadingOrParagraph && !event.nativeEvent.isComposing) {
        rememberInlineDomChange(target);

        const insertedLineBreak = document.execCommand(
          "insertLineBreak",
          false,
        );

        if (!insertedLineBreak) {
          const selection = window.getSelection();
          const range = selection?.rangeCount
            ? selection.getRangeAt(0)
            : null;

          if (range && target.contains(range.startContainer)) {
            range.deleteContents();
            const lineBreak = document.createElement("br");
            range.insertNode(lineBreak);
            range.setStartAfter(lineBreak);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }

        captureInlineSelection();
        syncInlineFontSize();
        syncInlineCommandState();
        updateInlineToolbarPosition();
        return;
      }

      finishInlineEdit(target, true);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      finishInlineEdit(target, false);
    }
  };

  const handleInlineTextInput = (
    event: React.FormEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement;
    if (target !== activeEditableRef.current) return;

    const hasText = target.innerText
      .replaceAll(INLINE_EMPTY_TEXT_VALUE, "")
      .trim();

    if (hasText) {
      target.removeAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE);
    } else {
      target.setAttribute(INLINE_EMPTY_TEXT_ATTRIBUTE, "true");
    }
  };

  const handleInlineTextMouseUp = () => {
    if (!isInlineEditing || !isRichInlineEditing) return;
    captureInlineSelection();
    syncInlineFontSize();
    syncInlineCommandState();
    updateInlineToolbarPosition();
  };

  const handleInlineTextKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== activeEditableRef.current || !isRichInlineEditing) {
      return;
    }
    captureInlineSelection();
    syncInlineFontSize();
    syncInlineCommandState();
    updateInlineToolbarPosition();
  };

  const handleInlineTextMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (isPreview || isInlineEditing) return;
    if (aiMediaBusy) return;
    if (lockCanvasEdit) return;

    const target = event.target as HTMLElement;

    if (target.closest("[data-editor-toolbar]")) return;

    if (target.closest("[data-custom-editor-element]")) {
      setHoveredEditable(null);
      setHoveredMedia(null);
      return;
    }

    const mediaElement = target.closest<HTMLElement>("[data-editor-media]");
    if (mediaElement && event.currentTarget.contains(mediaElement)) {
      if (isManagerBackedCardArea(mediaElement)) {
        setHoveredMedia(null);
        return;
      }
      setHoveredEditable(null);
      if (mediaElement.dataset.editorMediaType !== "video") {
        if (shouldHideMediaOverlay(label)) {
          setHoveredMedia(null);
        } else {
          updateHoveredMedia(mediaElement);
        }
      } else {
        setHoveredMedia(null);
      }
      return;
    }

    setHoveredMedia(null);

    if (target.closest("[data-editor-no-inline]")) return;

    const editableElement = resolveInlineEditableElement(
      event.currentTarget,
      target,
    );

    if (!editableElement || !event.currentTarget.contains(editableElement)) {
      setHoveredEditable(null);
      return;
    }

    const text = getInlinePersistableText(editableElement);

    if (!text) {
      setHoveredEditable(null);
      return;
    }

    setHoveredEditable(editableElement);
  };

  const handleInlineTextMouseLeave = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const next = event.relatedTarget;
    if (
      next instanceof Element &&
      next.closest("[data-editor-link-nav-overlay]")
    ) {
      return;
    }
    clearHoveredEditable();
    setHoveredMedia(null);
  };

  const handleMediaFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const pendingMedia = pendingMediaRef.current;

    if (!file || !pendingMedia) {
      if (pendingMedia?.mediaType === "video") setIsContentEditing(false);
      event.target.value = "";
      return;
    }

    const applySource = (source: string) => {
      if (pendingMedia.mediaType === "image" && showMediaEditor) {
        setSelectedMediaSrc(source);
        setSelectedMediaFileName(file.name);
        setMediaLibrarySources((current) =>
          Array.from(new Set([source, ...current])),
        );
        return;
      }

        onInlineMediaEdit(
          pendingMedia.oldSrc,
        source,
          pendingMedia.mediaType,
          file.name,
        pendingMedia.occurrence,
        pendingMedia.fieldHint,
        );
      pendingMediaRef.current = null;
    };

    setIsMediaUploading(true);
    setMediaUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/user/media", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };

      if (!response.ok || !data.url) {
        if (response.status === 401 && file.size <= 2 * 1024 * 1024) {
          const fallbackSource = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("Unable to read this file"));
            reader.onerror = () => reject(new Error("Unable to read this file"));
    reader.readAsDataURL(file);
          });
          applySource(fallbackSource);
          return;
        }

        throw new Error(data.message || "Unable to upload this file");
      }

      applySource(data.url);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : "Unable to upload this file",
      );
    } finally {
      setIsMediaUploading(false);
      if (pendingMedia.mediaType === "video") setIsContentEditing(false);
      event.target.value = "";
    }
  };

  const handleSectionMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;

    const sectionRect = sectionRef.current?.getBoundingClientRect();
    if (!sectionRect) return;

    setSectionHeight(sectionRect.height);

    const halfToolbarHeight = TOOLBAR_HEIGHT / 2;
    const padding = 12;
    const minY = halfToolbarHeight + padding;
    const maxY = Math.max(
      minY,
      sectionRect.height - halfToolbarHeight - padding,
    );
    const cursorY = event.clientY - sectionRect.top + TOOLBAR_CURSOR_GAP;

    setToolbarY(Math.min(Math.max(cursorY, minY), maxY));
  };

  const normalizedLabel = label.toLowerCase();
  const isCustomSection = normalizedLabel.replace(/[\s_-]+/g, "") === "customsection";
  const isBottomToolbar =
    !isCustomSection &&
    canShowSectionAddButton &&
    sectionHeight > 0 &&
    toolbarY >= sectionHeight - TOOLBAR_HEIGHT - BOTTOM_TOOLBAR_GAP;
  const sectionStackClass =
    isCustomSection
      ? ""
      : normalizedLabel === "topbar"
      ? "z-[130]"
      : normalizedLabel === "header"
        ? "z-[120]"
        : "z-0";
  const sectionPositionClass =
    stickyMode === "sticky" ? "sticky top-0" : "relative";

  const addControlButtons = (
    <>
      <div data-editor-toolbar className="relative">
      <button
        type="button"
        aria-label={`Add component after ${sectionName}`}
          aria-expanded={showSectionTypePopup}
        onClick={(event) => {
          event.stopPropagation();
            setShowSectionTypePopup((current) => !current);
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-500 bg-white text-slate-900 shadow-sm transition hover:scale-105 hover:bg-slate-100"
      >
        <Plus size={18} />
      </button>

      </div>
      {canMoveUp && (
        <button
          type="button"
          aria-label={`Move ${sectionName} up`}
          title={`Move ${sectionName} up`}
          onClick={(event) => {
            event.stopPropagation();
            onMoveUp?.();
          }}
          className="flex h-8 w-11 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-100 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <Play size={15} className="rotate-150" />
        </button>
      )}

      {canMoveDown && (
        <button
          type="button"
          aria-label={`Move ${sectionName} down`}
          title={`Move ${sectionName} down`}
          onClick={(event) => {
            event.stopPropagation();
            onMoveDown?.();
          }}
          className="flex h-8 w-11 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-100 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <Play size={15} className="rotate-90" />
        </button>
      )}
    </>
  );

  const editDeleteControls = (
    <>
      <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-gray-900">
        {sectionName}
      </span>

      <div
        className="flex shrink-0 items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-0.5"
        role="group"
        aria-label="Section toolbar position"
      >
        {(
          [
            { id: "left", label: "Left", Icon: AlignLeft },
            { id: "center", label: "Center", Icon: AlignCenter },
            { id: "right", label: "Right", Icon: AlignRight },
          ] as const
        ).map(({ id, label: alignLabel, Icon }) => {
          const active = sectionToolbarAlign === id;
          return (
            <button
              key={id}
              type="button"
              title={`Show toolbar ${alignLabel.toLowerCase()}`}
              aria-label={`Show toolbar ${alignLabel.toLowerCase()}`}
              aria-pressed={active}
              onClick={(event) => {
                event.stopPropagation();
                updateSectionToolbarAlign(id);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:bg-white/80 hover:text-slate-800"
              }`}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {onAiAssist && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!requireCorePlanOrGoToUpgrade()) return;
            onAiAssist();
          }}
          title={`AI Assist for ${sectionName}`}
          aria-label={`AI Assist for ${sectionName}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-300 bg-violet-50 text-violet-700 shadow-sm hover:bg-violet-100"
        >
          <Sparkles size={13} />
        </button>
      )}

      <button
        type="button"
        onClick={onEdit}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-gray-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
      >
        <Edit size={13} />
        Edit
      </button>

      {!["header", "footer"].includes(normalizedLabel) && !lockCanvasEdit && (
      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-red-300 bg-white px-3 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50"
      >
        <Trash size={13} />
        Delete
      </button>
      )}
    </>
  );

  const inlineCommandButtonClass = (
    active = false,
    disabled = false,
  ) =>
    `inline-flex h-7 w-7 shrink-0 items-center justify-center gap-1 rounded-full border px-0 text-[10px] font-medium leading-none tracking-tight whitespace-nowrap transition ${
      disabled
        ? "cursor-not-allowed border-transparent text-white/30"
        : active
          ? "border-blue-400/80 bg-blue-600 text-white shadow-sm"
          : "border-transparent text-white/90 hover:border-white/10 hover:bg-white/10"
    }`;

  return (
    <div
      ref={sectionRef}
      id={anchorId}
      data-section-id={anchorId}
      data-section-type={sectionType || label}
      className={`group ${isCustomSection ? "" : "isolate"} ${sectionPositionClass} ${sectionStackClass}`}
      onMouseMove={handleSectionMouseMove}
    >
      {!isPreview && (
        <style>{`
          [${INLINE_EMPTY_TEXT_ATTRIBUTE}="true"]:not([contenteditable="true"])::before,
          [${INLINE_EMPTY_TEXT_ATTRIBUTE}="true"][contenteditable="true"]::before {
            content: "Type here ..";
            color: #94a3b8;
            font-style: normal;
            opacity: 0.72;
          }

          [${INLINE_BUTTON_HOVER_ATTRIBUTE}="true"],
          [${INLINE_LINK_NAV_ATTRIBUTE}="true"] {
            position: relative !important;
            isolation: isolate;
          }

          [${INLINE_BUTTON_HOVER_ATTRIBUTE}="true"]::after {
            content: "✎";
            pointer-events: none;
            position: absolute;
            left: 50%;
            top: 50%;
            z-index: 10;
            display: flex;
            width: 2rem;
            height: 2rem;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
            border-radius: 9999px;
            background: white;
            color: #1e293b;
            font-size: 1rem;
            font-style: normal;
            line-height: 1;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.24);
          }
        `}</style>
      )}
      {!isPreview && (
        <input
          ref={mediaInputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          onChange={handleMediaFileChange}
        />
      )}
      {!isPreview &&
        !isCustomSection &&
        !isInlineEditing &&
        !hoveredMedia &&
        !showMediaEditor && (
        <div
          data-editor-toolbar
          className="pointer-events-none invisible absolute inset-0 z-40 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100"
        >
          {isBottomToolbar ? (
            <div
              className={`absolute bottom-3 flex w-max max-w-[min(96vw,720px)] items-center gap-3 ${
                sectionToolbarAlign === "left"
                  ? "left-3"
                  : sectionToolbarAlign === "right"
                    ? "right-3"
                    : "left-1/2 -translate-x-1/2"
              }`}
            >
              <div className="pointer-events-auto flex h-12 shrink-0 items-center gap-3 rounded-full border border-slate-400 bg-gray-100 px-4 shadow-lg">
                {addControlButtons}
              </div>

              <div className="pointer-events-auto flex h-12 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 shadow-lg">
                {editDeleteControls}
              </div>
            </div>
          ) : (
            <div
              className={`absolute left-0 right-0 flex -translate-y-1/2 py-0 ${
                sectionToolbarAlign === "left"
                  ? "justify-start pl-3"
                  : sectionToolbarAlign === "right"
                    ? "justify-end pr-3"
                    : "justify-center"
              }`}
              style={{ top: shouldCenterToolbar ? "50%" : toolbarY }}
            >
              <div
                className="pointer-events-auto flex h-10 max-w-[min(96vw,720px)] items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 shadow-lg"
              >
                {editDeleteControls}
              </div>
            </div>
          )}
        </div>
      )}

      {!isPreview &&
        canShowSectionAddButton &&
        !isBottomToolbar &&
        !isInlineEditing &&
        !hoveredMedia &&
        !showMediaEditor && (
        <div className="absolute bottom-3 left-1/2 z-[999] flex h-14 px-6 rounded-full gap-3 -translate-x-1/2 items-center justify-center bg-gray-100 border border-gray-500 opacity-0 transition-all duration-300 group-hover:opacity-100">
          {addControlButtons}
        </div>
      )}

      {!isPreview &&
        isRichInlineEditing &&
        !isPlainTextInlineElement(activeEditableRef.current) &&
        inlineToolbarPosition &&
        createPortal(
          <div
            ref={inlineToolbarRef}
            data-editor-toolbar
            className="fixed z-[10020] w-max max-w-[calc(100vw-1.5rem)]"
            style={{
              top: inlineToolbarPosition.top,
              left: inlineToolbarPosition.left,
              transform: "translateX(-50%)",
            }}
          >
            <div className="relative flex w-max flex-nowrap items-center gap-0.5 rounded-full border border-white/10 bg-slate-950/95 px-1.5 py-1 text-[10px] text-white shadow-[0_12px_40px_rgba(15,23,42,0.45)] ring-1 ring-black/20 backdrop-blur-md">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("bold")}
                className={inlineCommandButtonClass(inlineCommandState.bold)}
                aria-label="Bold"
                title="Bold"
                aria-pressed={inlineCommandState.bold}
              >
                <Bold size={12} />
              </button>

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("italic")}
                className={inlineCommandButtonClass(inlineCommandState.italic)}
                aria-label="Italic"
                title="Italic"
                aria-pressed={inlineCommandState.italic}
              >
                <Italic size={12} />
              </button>

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("underline")}
                className={inlineCommandButtonClass(
                  inlineCommandState.underline,
                )}
                aria-label="Underline"
                title="Underline"
                aria-pressed={inlineCommandState.underline}
              >
                <Underline size={12} />
              </button>

              <div className="relative shrink-0">
                <select
                  value={inlineFontSize}
                  onMouseDown={captureInlineSelection}
                  onChange={(event) => applyInlineFontSize(event.target.value)}
                  className="h-7 min-w-[3.25rem] appearance-none rounded-full border border-transparent bg-white/10 px-2 pr-5 text-[10px] font-medium text-white outline-none transition hover:bg-white/15"
                  aria-label="Font size"
                  title="Font size"
                >
                  {INLINE_FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size} className="text-slate-950">
                      {size}px
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={11}
                  className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-70"
                />
              </div>

              <span className="mx-0.5 h-4 w-px shrink-0 bg-white/15" />

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("insertUnorderedList")}
                className={inlineCommandButtonClass(
                  inlineCommandState.unorderedList,
                )}
                aria-label="Bullets"
                title="Bullets"
                aria-pressed={inlineCommandState.unorderedList}
              >
                <List size={12} />
              </button>

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("insertOrderedList")}
                className={inlineCommandButtonClass(
                  inlineCommandState.orderedList,
                )}
                aria-label="Numbered list"
                title="Numbered list"
                aria-pressed={inlineCommandState.orderedList}
              >
                <ListOrdered size={12} />
              </button>

              <span className="mx-0.5 h-4 w-px shrink-0 bg-white/15" />

              {(() => {
                const active = activeEditableRef.current;
                const target =
                  active && canShowGoToIcon(active)
                    ? resolveEditorLinkTarget(
                        findClosestHref(active),
                        getInlinePersistableText(active),
                        isChromeSection(label),
                      )
                    : null;
                if (!target) return null;
                return (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      const el = activeEditableRef.current;
                      if (el) finishInlineEdit(el, true);
                      goToResolvedLink(target);
                    }}
                    className={inlineCommandButtonClass(false)}
                    aria-label="Go to linked page"
                    title={
                      target.externalHref
                        ? "Open link"
                        : target.sectionHref
                          ? "Go to section"
                          : `Go to ${target.pageLabel || "page"}`
                    }
                  >
                    <ArrowUpRight size={12} />
                  </button>
                );
              })()}

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={openInlineLinkEditor}
                className={inlineCommandButtonClass(false)}
                aria-label="Link"
                title="Link"
              >
                <Link2 size={12} />
              </button>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={openTextColorPicker}
                  className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border px-2 text-[10px] transition ${
                    showInlineColorPicker
                      ? "border-blue-400/80 bg-blue-600 text-white shadow-sm"
                      : "border-transparent text-white/90 hover:border-white/10 hover:bg-white/10"
                  }`}
                  aria-label="Text color"
                  title="Text color"
                  aria-expanded={showInlineColorPicker}
                >
                  <Palette size={12} />
                  <span
                    className="h-1.5 w-1.5 rounded-full ring-1 ring-white/40"
                    style={{ backgroundColor: inlineTextColor }}
                  />
                </button>

                {showInlineColorPicker ? (
                  <div
                    className="absolute left-1/2 top-[calc(100%+0.5rem)] z-[10025] w-52 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.28)]"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-slate-700">
                        Text color
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowInlineColorPicker(false)}
                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close color picker"
                        title="Close"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                      {INLINE_TEXT_COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => applyInlineTextColor(color)}
                          className={`h-6 w-6 rounded-md border transition hover:scale-105 ${
                            inlineTextColor.toLowerCase() === color
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-slate-200"
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Use color ${color}`}
                          title={color}
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        ref={textColorInputRef}
                        type="color"
                        value={inlineTextColor}
                        onChange={handleTextColorChange}
                        className="h-8 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
                        aria-label="Custom text color"
                        title="Custom color"
                      />
                      <input
                        type="text"
                        value={inlineTextColor}
                        onChange={(event) => {
                          const next = event.target.value.trim();
                          setInlineTextColor(next);
                          if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(next)) {
                            applyInlineTextColor(next);
                          }
                        }}
                        className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-[11px] font-medium uppercase outline-none focus:border-blue-400"
                        aria-label="Hex color"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("removeFormat")}
                className={inlineCommandButtonClass(false)}
                aria-label="Clear formatting"
                title="Clear formatting"
              >
                <RemoveFormatting size={12} />
              </button>

              <span className="mx-0.5 h-4 w-px shrink-0 bg-white/15" />

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("undo")}
                disabled={!inlineCommandState.canUndo}
                className={inlineCommandButtonClass(
                  false,
                  !inlineCommandState.canUndo,
                )}
                aria-label="Undo"
                title={inlineCommandState.canUndo ? "Undo" : "Nothing to undo"}
              >
                <Undo2 size={12} />
              </button>

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runInlineCommand("redo")}
                disabled={!inlineCommandState.canRedo}
                className={inlineCommandButtonClass(
                  false,
                  !inlineCommandState.canRedo,
                )}
                aria-label="Redo"
                title={inlineCommandState.canRedo ? "Redo" : "Nothing to redo"}
              >
                <Redo2 size={12} />
              </button>

              <span className="mx-0.5 h-4 w-px shrink-0 bg-white/15" />

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const active = activeEditableRef.current;
                  if (active) finishInlineEdit(active, true);
                  else closeInlineToolbar();
                }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close toolbar"
                title="Close"
              >
                <X size={13} />
              </button>
            </div>
          </div>,
          document.body,
        )}

      {!isPreview &&
        showInlineLinkEditor &&
        createPortal(
          <div
            className="fixed inset-0 z-[10035] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-label="Call to Action link"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeInlineLinkEditor();
              }
            }}
          >
            <div
              ref={inlineLinkEditorRef}
              className="flex max-h-[min(88vh,620px)] w-[min(94vw,680px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.3)]"
            >
              <div className="px-6 pb-5 pt-3 sm:px-7">
                <div className="mx-auto h-1 w-10 rounded-full bg-slate-300" />
                <div className="mt-5 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Call to Action</h3>
                  <button
                    type="button"
                    onClick={closeInlineLinkEditor}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close link editor"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 sm:px-7">
                <p className="text-sm font-semibold text-slate-500">
                  Link Type
                </p>

                <div className="mt-3 flex gap-1 overflow-x-auto pb-2">
                  {INLINE_LINK_TYPES.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setInlineLinkType(item.type);
                        if (item.type === "page") {
                          setInlineLinkValue(
                            inlinePageLinkOptions[0]?.href ||
                              inlineBlogLinkOptions[0]?.href ||
                              "#",
                          );
                        } else if (item.type === "section") {
                          setInlineLinkValue(
                            inlineSectionLinkOptions[0]?.href || "#",
                          );
                        } else {
                          setInlineLinkValue("");
                        }
                      }}
                      className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        inlineLinkType === item.type
                          ? "bg-slate-200 text-slate-950"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                      aria-pressed={inlineLinkType === item.type}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <label className="mt-5 block text-sm font-semibold text-slate-500">
                  {inlineLinkType === "page"
                    ? "Page link"
                    : inlineLinkType === "external"
                      ? "External URL"
                      : inlineLinkType === "email"
                        ? "Email address"
                        : inlineLinkType === "phone"
                          ? "Phone number"
                          : inlineLinkType === "section"
                            ? "Page section"
                            : "Booking URL"}
                </label>

                {inlineLinkType === "page" ||
                inlineLinkType === "section" ? (
                  <div className="relative mt-2">
                    <select
                      value={inlineLinkValue}
                      onChange={(event) =>
                        setInlineLinkValue(event.target.value)
                      }
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      aria-label={
                        inlineLinkType === "page"
                          ? "Select page link"
                          : "Select page section"
                      }
                    >
                      <option value="">
                        {inlineLinkType === "page"
                          ? "Select a page"
                          : "Select a page section"}
                      </option>
                      {(inlineLinkType === "section"
                        ? inlineSectionLinkOptions
                        : [
                            ...inlinePageLinkOptions,
                            ...inlineBlogLinkOptions.filter(
                              (option) =>
                                !inlinePageLinkOptions.some(
                                  (page) => page.href === option.href,
                                ),
                            ),
                          ]
                      ).map((option) => (
                        <option
                          key={`${inlineLinkType}-${option.href}`}
                          value={option.href}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    {inlineLinkType === "section" &&
                    inlineSectionLinkOptions.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        No sections found on this page yet.
                      </p>
                    ) : null}
                    {inlineLinkType === "page" &&
                    inlinePageLinkOptions.length === 0 &&
                    inlineBlogLinkOptions.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        No pages found yet.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <input
                    type={inlineLinkType === "email" ? "email" : "text"}
                    value={inlineLinkValue}
                    onChange={(event) =>
                      setInlineLinkValue(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && inlineLinkValue.trim()) {
                        event.preventDefault();
                        applyInlineLink();
                      }
                    }}
                    placeholder={
                      inlineLinkType === "external"
                        ? "https://example.com"
                        : inlineLinkType === "email"
                          ? "hello@example.com"
                          : inlineLinkType === "phone"
                            ? "+91 98765 43210"
                            : "https://booking.example.com"
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={resetInlineLinks}
                  className="mr-auto rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Reset links
                </button>
                <button
                  type="button"
                  onClick={closeInlineLinkEditor}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!inlineLinkValue.trim()}
                  onClick={applyInlineLink}
                  className="rounded-full border border-slate-300 bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {!isPreview &&
        showMediaEditor &&
        createPortal(
          <div
            className="fixed inset-0 z-[10040] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${sectionName} image`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeMediaEditor();
            }}
          >
            <div
              ref={mediaEditorRef}
              className="flex max-h-[min(88vh,720px)] w-[min(94vw,760px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.3)]"
            >
              <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-6 sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Image editor
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    {sectionName} Image
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={openMediaUpload}
                  disabled={isMediaUploading}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Upload size={16} />
                  {isMediaUploading ? "Uploading..." : "Upload"}
                </button>
              </div>

              <div className="px-6 sm:px-7">
                {mediaUploadError && (
                  <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {mediaUploadError}
                  </p>
                )}
                <label className="flex h-11 items-center gap-3 rounded-full border border-slate-300 bg-slate-50 px-4 text-slate-500 focus-within:border-blue-500 focus-within:bg-white">
                  <Search size={17} />
                  <input
                    type="search"
                    value={mediaSearch}
                    onChange={(event) => setMediaSearch(event.target.value)}
                    placeholder="Search pre-uploaded images"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>

              <div className="mt-5 flex-1 overflow-y-auto px-6 pb-6 sm:px-7">
                {filteredMediaSources.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {filteredMediaSources.map((src, index) => {
                      const isSelected = selectedMediaSrc === src;

                      return (
                        <button
                          key={`${src.slice(0, 80)}-${index}`}
                          type="button"
                          onClick={() => {
                            setSelectedMediaSrc(src);
                            setSelectedMediaFileName(getMediaFileName(src));
                          }}
                          className={`group/image relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-slate-100 text-left transition ${
                            isSelected
                              ? "border-blue-600 ring-2 ring-blue-100"
                              : "border-transparent hover:border-slate-300"
                          }`}
                          aria-label={`Select ${getMediaFileName(src)}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={getMediaFileName(src)}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover/image:scale-[1.03]"
                          />
                          <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-7 text-xs font-medium text-white">
                            {getMediaFileName(src)}
                          </span>
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                              <Check size={16} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">
                    No matching images found
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={closeMediaEditor}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedMediaSrc || isMediaUploading}
                  onClick={applySelectedMedia}
                  className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body,
      )}

      {showDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
            <div className="pointer-events-auto w-[min(92vw,390px)] rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                Delete {sectionName}
              </p>

              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                Are you sure you want to delete {label} section?
              </h3>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showSectionTypePopup &&
        createPortal(
          <div
            className="fixed inset-0 z-[10002] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Choose section type"
            onClick={() => setShowSectionTypePopup(false)}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close section type popup"
                onClick={() => setShowSectionTypePopup(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={17} />
              </button>
              <p className="mb-4 px-9 text-center text-base font-bold text-slate-700">
                What type of section?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionTypePopup(false);
                    setShowAddPopup(true);
                  }}
                  className="flex h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-blue-300 bg-blue-50 px-3 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span aria-hidden="true" className="relative block h-6 w-6 before:absolute before:bottom-0 before:left-1/2 before:h-5 before:w-3 before:-translate-x-1/2 before:rounded-t-full before:border before:border-current after:absolute after:bottom-0 after:left-0 after:h-2.5 after:w-6 after:rounded-t-full after:border after:border-current" />
                  <span className="whitespace-nowrap">Ready Section</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionTypePopup(false);
                    setShowCustomSectionPopup(true);
                  }}
                  className="flex h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span aria-hidden="true" className="grid h-6 w-7 grid-cols-2 gap-1"><span className="rounded border border-current" /><span className="rounded border border-current" /></span>
                  <span className="whitespace-nowrap">Custom Section</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showAddPopup &&
        createPortal(
          <div
            className="fixed inset-0 z-[10002] flex flex-col bg-slate-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-section-title"
          >
            <header className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 id="add-section-title" className="text-xl font-bold text-slate-950">
                    Add section
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Choose a {category} section variant. Shared variants are available in every category.
                  </p>
                </div>
              <button
                type="button"
                aria-label="Close add component popup"
                onClick={() => setShowAddPopup(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
              >
                  <X size={20} />
              </button>
              </div>
              {addableLayouts.length > 0 ? (
                <div className="relative max-w-xl">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={addSectionSearch}
                    onChange={(event) => setAddSectionSearch(event.target.value)}
                    placeholder="Search by name, type, or key…"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ) : null}
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-8">
              {addableLayouts.length ? (
                !addSectionCardsReady ? (
                  <div className="flex min-h-[calc(100dvh-13rem)] items-center justify-center">
                    <EditorLoadingScreen variant="modal" message="" />
                  </div>
                ) : (
                  <>
                    <p className="mx-auto mb-5 max-w-7xl text-xs font-semibold text-slate-500">
                      Showing {filteredAddableLayouts.length} of {addableLayouts.length} variants
                      {normalizedAddSectionSearch ? ` for “${addSectionSearch.trim()}”` : ""}
                    </p>
                    {filteredAddableLayouts.length ? (
                      <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredAddableLayouts.map((layout) => (
                  <AddComponentCard
                            key={layout.id || layout.key}
                            layout={layout}
                            category={category}
                            onClick={() =>
                              handleAddComponent(layout.sectionType, layout.key)
                            }
                  />
                ))}
              </div>
                    ) : (
                      <div className="mx-auto flex min-h-[40vh] max-w-xl items-center justify-center text-center">
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-12">
                          <h3 className="text-lg font-bold text-slate-900">No matches</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Try another keyword or clear the search box.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center text-center">
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-12">
                    <h3 className="text-lg font-bold text-slate-900">No section variants available</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Add an active {category} or All categories layout from Custom Layouts.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}

      {showCustomSectionPopup && createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setShowCustomSectionPopup(false)}>
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex shrink-0 items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Custom section</p><h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">Choose a column layout</h2><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">After adding it, use the + inside each column for image, text, button or table.</p></div><button type="button" aria-label="Close custom section popup" onClick={() => setShowCustomSectionPopup(false)} className="shrink-0 rounded-full bg-slate-100 p-2"><X size={18}/></button></div>
            <div className="mt-5 grid min-h-0 flex-1 gap-3 overflow-y-auto overscroll-contain pr-1 sm:mt-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {CUSTOM_SECTION_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => {
                    onAddCustomSection(layout.id);
                    setShowCustomSectionPopup(false);
                  }}
                  className="rounded-2xl border border-slate-200 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div
                    className="grid h-28 gap-1.5 rounded-xl bg-slate-100 p-2"
                    style={{
                      gridTemplateColumns: layout.columns,
                      gridTemplateRows: layout.rows,
                      gridTemplateAreas: layout.areas,
                    }}
                  >
                    {Array.from({ length: layout.cellCount }, (_, index) => (
                      <span
                        key={index}
                        className="min-h-0 rounded-lg border border-dashed border-slate-400 bg-white"
                        style={{ gridArea: String.fromCharCode(97 + index) }}
                      />
                    ))}
                  </div>
                  <span className="mt-3 block text-xs font-bold leading-5 text-slate-900">
                    {layout.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>, document.body)}

      {generatingComponent &&
        createPortal(
          <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]" role="status" aria-live="polite">
            <div className="w-[min(92vw,420px)] rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <h3 className="mt-5 text-xl font-semibold text-slate-950">Generating component</h3>
              <p className="mt-2 text-sm text-slate-500">Preparing your {generatingComponent} section...</p>
            </div>
          </div>,
          document.body,
        )}

      <div
        ref={contentRef}
        className={`relative ${hoveredMedia ? "z-50" : "z-0"}`}
        data-editor-no-inline={lockCanvasEdit ? "true" : undefined}
        onClickCapture={handleInlineTextClick}
        onMouseUp={handleInlineTextMouseUp}
        onMouseMove={handleInlineTextMouseMove}
        onMouseLeave={handleInlineTextMouseLeave}
        onBlur={handleInlineTextBlur}
        onInput={handleInlineTextInput}
        onKeyDown={handleInlineTextKeyDown}
        onKeyUp={handleInlineTextKeyUp}
      >
        {!isPreview &&
          hoveredLinkNav &&
          !isInlineEditing &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              data-editor-toolbar
              data-editor-link-nav-overlay
              className="pointer-events-none fixed z-[10040] flex items-center justify-center"
              style={{
                top: hoveredLinkNav.top,
                left: hoveredLinkNav.left,
                width: hoveredLinkNav.width,
                height: hoveredLinkNav.height,
              }}
              onMouseLeave={(event) => {
                const next = event.relatedTarget;
                if (
                  next instanceof Node &&
                  hoveredEditableRef.current?.contains(next)
                ) {
                  return;
                }
                if (
                  next instanceof Element &&
                  next.closest("[data-editor-link-nav-overlay]")
                ) {
                  return;
                }
                clearHoveredEditable();
              }}
            >
              <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-white p-0.5 shadow-[0_8px_22px_rgba(15,23,42,0.24)]">
                <button
                  type="button"
                  title={
                    hoveredLinkNav.externalHref
                      ? "Open link"
                      : hoveredLinkNav.sectionHref
                        ? "Go to section"
                        : `Go to ${hoveredLinkNav.pageLabel || "page"}`
                  }
                  aria-label="Go to linked page"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    goToResolvedLink(hoveredLinkNav);
                    clearHoveredEditable();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100"
                >
                  <ArrowUpRight size={14} />
                </button>
                <button
                  type="button"
                  title="Edit"
                  aria-label="Edit link"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const editable = hoveredEditableRef.current;
                    if (editable) startInlineEdit(editable);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100"
                >
                  <Edit size={13} />
                </button>
              </div>
            </div>,
            document.body,
          )}

        {!isPreview && hoveredMedia && !showMediaEditor && (
          <div
            data-editor-toolbar
            className="pointer-events-none absolute z-[2000] flex items-center justify-center overflow-hidden bg-slate-950/45 transition-opacity duration-150"
            style={{
              top: hoveredMedia.top,
              left: hoveredMedia.left,
              width: hoveredMedia.width,
              height: hoveredMedia.height,
              borderRadius: hoveredMedia.borderRadius,
            }}
          >
            <div
              className={`pointer-events-auto inline-flex items-center ${
                hoveredMedia.width < 120 || hoveredMedia.height < 72
                  ? "gap-1.5"
                  : "gap-2"
              }`}
            >
              {!shouldHideAiMediaButton(label, hoveredMedia.fieldHint) ? (
                <button
                  type="button"
                  disabled={aiMediaBusy}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void replaceMediaWithAiOnline(hoveredMedia);
                  }}
                  className={`inline-flex items-center justify-center rounded-full bg-white font-semibold text-violet-700 shadow-[0_12px_35px_rgba(15,23,42,0.3)] transition hover:scale-105 hover:bg-violet-50 disabled:cursor-wait disabled:opacity-70 ${
                    hoveredMedia.width < 120 || hoveredMedia.height < 72
                      ? "h-8 w-8"
                      : "h-10 w-10"
                  }`}
                  aria-label="AI — change to related online image"
                  title="AI — change to related online image"
                >
                  {aiMediaBusy ? (
                    <Loader2
                      size={
                        hoveredMedia.width < 120 || hoveredMedia.height < 72
                          ? 14
                          : 16
                      }
                      className="animate-spin"
                    />
                  ) : (
                    <Sparkles
                      size={
                        hoveredMedia.width < 120 || hoveredMedia.height < 72
                          ? 14
                          : 16
                      }
                    />
                  )}
                </button>
              ) : null}
              <button
                type="button"
                disabled={aiMediaBusy}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openMediaEditor(
                    hoveredMedia.oldSrc,
                    hoveredMedia.occurrence,
                    hoveredMedia.fieldHint,
                  );
                }}
                className={`inline-flex items-center justify-center rounded-full bg-white font-semibold text-slate-800 shadow-[0_12px_35px_rgba(15,23,42,0.3)] transition hover:scale-105 hover:bg-slate-50 disabled:opacity-60 ${
                  hoveredMedia.width < 120 || hoveredMedia.height < 72
                    ? "h-8 w-8"
                    : "gap-2 px-5 py-2.5 text-sm"
                }`}
                aria-label="Edit image"
              >
                <Edit
                  size={
                    hoveredMedia.width < 120 || hoveredMedia.height < 72
                      ? 14
                      : 16
                  }
                />
                <span
                  className={
                    hoveredMedia.width < 120 || hoveredMedia.height < 72
                      ? "sr-only"
                      : undefined
                  }
                >
                  Edit
                </span>
              </button>
            </div>
          </div>
        )}

        <InlineTextFormattingProvider registry={formatRegistry}>
        {children}
        </InlineTextFormattingProvider>
      </div>
    </div>
  );
}

const SECTION_PREVIEW_PLACEHOLDER: Record<
  string,
  { label: string; gradient: string; accent: string }
> = {
  Banner: {
    label: "Banner",
    gradient: "from-slate-800 via-slate-700 to-slate-900",
    accent: "bg-amber-400/80",
  },
  About: {
    label: "About",
    gradient: "from-blue-700 via-blue-600 to-indigo-700",
    accent: "bg-sky-300/80",
  },
  Product: {
    label: "Services",
    gradient: "from-emerald-700 via-emerald-600 to-teal-700",
    accent: "bg-lime-300/80",
  },
  WhyChooseUs: {
    label: "Why choose us",
    gradient: "from-violet-700 via-purple-600 to-fuchsia-700",
    accent: "bg-violet-200/80",
  },
  Gallery: {
    label: "Gallery",
    gradient: "from-rose-700 via-pink-600 to-orange-600",
    accent: "bg-orange-200/80",
  },
  FormDetail: {
    label: "Form",
    gradient: "from-cyan-700 via-sky-600 to-blue-700",
    accent: "bg-cyan-200/80",
  },
  FAQ: {
    label: "FAQ",
    gradient: "from-indigo-700 via-blue-700 to-slate-800",
    accent: "bg-indigo-200/80",
  },
  Testimonial: {
    label: "Testimonials",
    gradient: "from-orange-700 via-amber-600 to-yellow-600",
    accent: "bg-yellow-200/80",
  },
};

function SectionPreviewPlaceholder({
  layout,
}: {
  layout: Pick<BuilderLayout, "name" | "sectionType" | "sectionNumber" | "key">;
}) {
  const theme =
    SECTION_PREVIEW_PLACEHOLDER[layout.sectionType] ?? {
      label: layout.sectionType,
      gradient: "from-slate-700 via-slate-600 to-slate-800",
      accent: "bg-white/30",
    };

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-br ${theme.gradient} p-4 text-white`}
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
          {theme.label}
        </span>
        <span className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
          V{layout.sectionNumber}
        </span>
      </div>
      <div className="space-y-2">
        <div className={`h-2.5 w-2/5 rounded-full ${theme.accent}`} />
        <div className="h-2 w-3/5 rounded-full bg-white/25" />
        <div className="h-2 w-2/5 rounded-full bg-white/20" />
        <p className="pt-1 text-sm font-bold text-white/95">{layout.name}</p>
        <p className="text-[11px] font-semibold text-white/70">{layout.key}</p>
      </div>
    </div>
  );
}

function AddComponentCard({
  layout,
  category,
  onClick,
}: {
  layout: BuilderLayout;
  category: string;
  onClick: () => void;
}) {
  const previewRef = useRef<HTMLElement>(null);
  const [shouldLoadPreview, setShouldLoadPreview] = useState(Boolean(layout.thumbnailUrl));
  const previewVars = useMemo(
    () => getTemplateVariables("template-1"),
    [],
  );
  const PreviewComponent = shouldLoadPreview
    ? resolveSectionComponent(layout.key)
    : undefined;
  const preview = useMemo(
    () =>
      shouldLoadPreview ? resolveLayoutPreview(layout.key, category) : null,
    [layout.key, category, shouldLoadPreview],
  );

  useEffect(() => {
    const element = previewRef.current;
    if (!element || shouldLoadPreview || layout.thumbnailUrl) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoadPreview(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoadPreview(true);
        observer.disconnect();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [layout.thumbnailUrl, shouldLoadPreview]);

  return (
    <article
      ref={previewRef}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-slate-200 bg-slate-100">
        {layout.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={layout.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : !shouldLoadPreview ? (
          <SectionPreviewPlaceholder layout={layout} />
        ) : PreviewComponent ? (
          <div
            className="pointer-events-none absolute left-0 top-0 h-[720px] w-[1280px] origin-top-left scale-[0.32] overflow-hidden bg-white"
            style={previewVars as CSSProperties}
          >
            <PreviewComponent data={preview?.data ?? {}} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-slate-400">
            {layout.name}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">
          {layout.categorySlug ? category : "All categories"}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-950">{layout.name}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {layout.sectionType} · {layout.key}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
            Variant {layout.sectionNumber}
          </span>
        </div>
        {layout.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">{layout.description}</p>
        ) : null}
        <button
          type="button"
          onClick={onClick}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-blue-600"
        >
          <Plus size={16} />
          Add section
    </button>
      </div>
    </article>
  );
}
