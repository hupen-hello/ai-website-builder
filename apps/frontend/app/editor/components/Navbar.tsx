"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  Eye,
  ChevronRight,
  Download,
  Edit,
  SwatchBook,
  ChevronDown,
  EyeOff,
  Copy,
  ExternalLink,
  Globe2,
  Link2,
  LogOut,
  Rocket,
  Trash,
  UserRound,
  X,
  Check,
} from "lucide-react";
import { usePreview } from "../layout/src/components/context/PreviewContext";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import BrandLogo from "@/components/ui/brand-logo";
import ExportWebsiteModal, {
  type ExportWebsiteTarget,
} from "@/components/ExportWebsiteModal";
import {
  consumePostAuthAction,
  rememberEditorForAuthCancel,
  buildPlanPageUrl,
} from "@/lib/authReturn";
import PublishLoginModal from "@/components/auth/PublishLoginModal";
import {
  getUserActiveSiteId,
  getPublishedSiteUrl,
  hasPublishedSite,
  setPublishedSiteUrl,
  resolveEditorSiteId,
} from "@/lib/migrateGuestSite";
import { showAppAlert } from "@/lib/confirmDialog";
import { isRedesignEditorSearchParams } from "@/lib/is-redesign-editor";
import { readRedesignEditorPack } from "@/lib/redesign-editor-session";
import EditorPreviewModal from "./EditorPreviewModal";
import EditorLoadingScreen from "./EditorLoadingScreen";
import {
  buildTemplateCardPreviewUrl,
  buildTemplateComposePreviewUrl,
  getBuilderTemplate,
  getTemplatesForCategory,
  isSameBuilderTemplate,
  refreshCategoryContentFromApi,
  type BuilderTemplate,
} from "../layout/src/data/templateFlow";

const MAX_PAGE_ITEMS = 7;
const MAX_SINGLE_PAGE_DOCUMENT_PAGES = 5;
const MAX_DROPDOWN_ITEMS = 10;

type EditorLoginIntent =
  | "publish"
  | "dashboard"
  | "upgrade"
  | "settings"
  | "preview";

const EDITOR_LOGIN_COPY: Record<
  EditorLoginIntent,
  { title: string; description: string }
> = {
  publish: {
    title: "Login to publish your website",
    description: "Enter your email and we'll send a 6-digit login code.",
  },
  dashboard: {
    title: "Login to open Dashboard",
    description: "Enter your email and we'll send a 6-digit login code.",
  },
  upgrade: {
    title: "Login to upgrade your plan",
    description: "Enter your email and we'll send a 6-digit login code.",
  },
  settings: {
    title: "Login to open Settings",
    description: "Enter your email and we'll send a 6-digit login code.",
  },
  preview: {
    title: "Login to preview your website",
    description: "Enter your email and we'll send a 6-digit login code.",
  },
};

const createPageHref = (label: string, multiPage = false) => {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || slug === "home") return "#";
  return `${multiPage ? "#page-" : "#"}${slug}`;
};

const normalizePublishedSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getPublishedSlug = (url: string) => {
  if (!url) return "";
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) || "");
  } catch {
    return "";
  }
};

/** Map editor page label/href → published path segment (Home → ""). */
const getPublishedPathForPage = (
  pageLabel: string,
  links: Array<{ label: string; href: string; kind?: string }>,
) => {
  const label = (pageLabel || "Home").trim();
  if (!label || label.toLowerCase() === "home") return "";

  const match = links.find(
    (link) => link.label.trim().toLowerCase() === label.toLowerCase(),
  );
  const href = (match?.href || "").trim().toLowerCase();
  if (href.startsWith("#page-")) {
    let slug = decodeURIComponent(href.slice("#page-".length)).replace(
      /^\/+|\/+$/g,
      "",
    );
    if (slug === "service") slug = "services";
    if (slug === "event") slug = "events";
    if (slug === "property") slug = "properties";
    if (slug === "team") slug = "teams";
    if (slug === "blog") slug = "blogs";
    if (slug.startsWith("blog-")) {
      return `blog/${slug.slice("blog-".length)}`;
    }
    return slug;
  }

  return normalizePublishedSlug(label);
};

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Navbar({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designId = (searchParams.get("designId") || "").trim();
  const redesignPack = designId.startsWith("rd_")
    ? readRedesignEditorPack(designId)
    : null;
  const currentTemplateId =
    searchParams.get("templateId") ||
    redesignPack?.templateId ||
    "template-1";
  const currentCategory =
    searchParams.get("category") || redesignPack?.category || "Realestate";
  const isRedesignEditor = isRedesignEditorSearchParams(searchParams);
  const templateType = getBuilderTemplate(
    currentTemplateId,
    redesignPack?.category || currentCategory,
  ).type;
  // Redesign multipage comes from onboarding prefs — template may still be Single Page.
  const isMultiPageTemplate =
    redesignPack?.pageType === "multi-page" ||
    templateType === "Multiple Pages Website";
  const isSinglePageTemplate = isRedesignEditor
    ? redesignPack?.pageType !== "multi-page"
    : templateType === "Single Page Website";
  const [open, setOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    currentPage,
    pageLinks,
    setCurrentPage,
    setPageLinks,
    setEditorPanel,
  } = usePreview();
  const [showPopup, setShowPopup] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [pageToRename, setPageToRename] = useState<string | null>(null);
  const [renamePageName, setRenamePageName] = useState("");
  const [expandedPageLabel, setExpandedPageLabel] = useState<string | null>(
    null,
  );
  const [dropdownParentForNew, setDropdownParentForNew] = useState<
    string | null
  >(null);
  const [newDropdownName, setNewDropdownName] = useState("");
  const [dropdownToDelete, setDropdownToDelete] = useState<{
    parentLabel: string;
    childIndex: number;
    childLabel: string;
  } | null>(null);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportWebsiteTarget | null>(
    null,
  );
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPublishedPopup, setShowPublishedPopup] = useState(false);
  const [showDomainsPopup, setShowDomainsPopup] = useState(false);
  const [isEditingPublishedUrl, setIsEditingPublishedUrl] = useState(false);
  const [publishedSlugDraft, setPublishedSlugDraft] = useState("");
  const [publishedUrlError, setPublishedUrlError] = useState("");
  const [publishedUrlSaved, setPublishedUrlSaved] = useState(false);
  const [isSavingPublishedUrl, setIsSavingPublishedUrl] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [showThemesPopup, setShowThemesPopup] = useState(false);
  const [categoryTemplates, setCategoryTemplates] = useState<BuilderTemplate[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [themesError, setThemesError] = useState("");
  const [applyingTemplateId, setApplyingTemplateId] = useState("");
  const [themePreviewTemplate, setThemePreviewTemplate] =
    useState<BuilderTemplate | null>(null);
  const { user, loading: authLoading, logout } = useUserAuth();
  const [loginIntent, setLoginIntent] = useState<EditorLoginIntent | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    if (isSinglePageTemplate) setOpen(false);
    void (async () => {
      await refreshCategoryContentFromApi();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTemplateId, isSinglePageTemplate]);

  // Single Page editor only switches Home + legal/document pages.
  useEffect(() => {
    if (!isSinglePageTemplate) return;
    const onDocumentPage = pageLinks.some(
      (page) => page.kind === "document" && page.label === currentPage,
    );
    if (currentPage !== "Home" && !onDocumentPage) {
      setCurrentPage("Home");
    }
  }, [
    currentPage,
    isSinglePageTemplate,
    pageLinks,
    setCurrentPage,
  ]);

  const displayPublishedUrl = publishedUrl.replace(/^https?:\/\//, "");

  const openThemesPopup = async () => {
    setShowThemesPopup(true);
    setThemesLoading(true);
    setThemesError("");
    setApplyingTemplateId("");
    setThemePreviewTemplate(null);
    setOpen(false);
    setShowUserMenu(false);

    try {
      await refreshCategoryContentFromApi();
      // Keep the same website type: single-page users only see single-page themes
      // (and multi-page users only see multi-page themes).
      const templates = getTemplatesForCategory(currentCategory).filter(
        (template) => template.type === templateType,
      );
      setCategoryTemplates(
        [...templates].sort((left, right) => {
          if (isSameBuilderTemplate(left.id, currentTemplateId, currentCategory))
            return -1;
          if (isSameBuilderTemplate(right.id, currentTemplateId, currentCategory))
            return 1;
          return left.numericId - right.numericId;
        }),
      );
    } catch (error) {
      setThemesError(
        error instanceof Error ? error.message : "Unable to load themes",
      );
    } finally {
      setThemesLoading(false);
    }
  };

  const requestThemeChange = (nextTemplateId: string) => {
    if (isRedesignEditor) return;
    if (nextTemplateId === currentTemplateId || applyingTemplateId) return;
    setApplyingTemplateId(nextTemplateId);
    setThemesError("");
    window.dispatchEvent(
      new CustomEvent("ai-builder-theme-change-request", {
        detail: { templateId: nextTemplateId },
      }),
    );
  };

  useEffect(() => {
    const handleThemeChangeSuccess = () => {
      setShowThemesPopup(false);
      setApplyingTemplateId("");
    };
    const handleThemeChangeFailed = (event: Event) => {
      const message = (
        event as CustomEvent<{ message?: string }>
      ).detail?.message;
      setThemesError(message || "Unable to apply this theme");
      setApplyingTemplateId("");
    };

    window.addEventListener(
      "ai-builder-theme-change-success",
      handleThemeChangeSuccess,
    );
    window.addEventListener(
      "ai-builder-theme-change-failed",
      handleThemeChangeFailed,
    );
    return () => {
      window.removeEventListener(
        "ai-builder-theme-change-success",
        handleThemeChangeSuccess,
      );
      window.removeEventListener(
        "ai-builder-theme-change-failed",
        handleThemeChangeFailed,
      );
    };
  }, []);

  useEffect(() => {
    if (!showThemesPopup) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !applyingTemplateId) {
        setShowThemesPopup(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [applyingTemplateId, showThemesPopup]);

  const requestPreview = () => {
    if (!user) {
      setShowPreviewModal(false);
      setLoginIntent("preview");
      return;
    }
    setShowPreviewModal(true);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewSrc("");
    setOpen(false);
    setShowUserMenu(false);
    window.dispatchEvent(new CustomEvent("ai-builder-preview-request"));
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    setPreviewLoading(false);
    setPreviewError("");
  };

  useEffect(() => {
    const handlePreviewReady = (event: Event) => {
      const siteId = (event as CustomEvent<{ siteId?: string }>).detail?.siteId;
      if (!siteId) {
        setPreviewLoading(false);
        setPreviewError("Website preview could not be prepared");
        return;
      }

      const params = new URLSearchParams({
        siteId,
        t: Date.now().toString(),
      });
      setPreviewSrc(`/editor/preview?${params.toString()}`);
      setPreviewLoading(false);
      setPreviewError("");
    };

    const handlePreviewFailed = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail
        ?.message;
      if (/login is required/i.test(message || "")) {
        setShowPreviewModal(false);
        setPreviewLoading(false);
        setPreviewError("");
        setLoginIntent("preview");
        return;
      }
      setPreviewLoading(false);
      setPreviewError(message || "Unable to prepare website preview");
    };

    window.addEventListener("ai-builder-preview-ready", handlePreviewReady);
    window.addEventListener("ai-builder-preview-failed", handlePreviewFailed);
    return () => {
      window.removeEventListener(
        "ai-builder-preview-ready",
        handlePreviewReady,
      );
      window.removeEventListener(
        "ai-builder-preview-failed",
        handlePreviewFailed,
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrateTimeout = window.setTimeout(async () => {
      const querySiteId = new URLSearchParams(window.location.search).get(
        "siteId",
      );
      const activeSiteId = querySiteId || getUserActiveSiteId();

      if (activeSiteId) {
        try {
          const response = await fetch(`/api/user/sites/${activeSiteId}`, {
            credentials: "include",
            cache: "no-store",
          });
          const site = (await response.json().catch(() => ({}))) as {
            slug?: string;
            published?: boolean;
            title?: string;
          };

          if (cancelled) return;
          if (response.ok && site.published && site.slug) {
            const siteUrl = `${window.location.origin}/published/${site.slug}`;
            setPublishedUrl(siteUrl);
            setPublishedSiteUrl(siteUrl);
            setIsAlreadyPublished(true);
            setExportTarget({
              id: activeSiteId,
              title: site.title,
              slug: site.slug,
            });
          } else {
            setPublishedUrl("");
            setIsAlreadyPublished(false);
            setExportTarget(null);
          }
          return;
        } catch {
          if (cancelled) return;
          setPublishedUrl("");
          setIsAlreadyPublished(false);
          setExportTarget(null);
          return;
        }
      }

      const savedUrl = getPublishedSiteUrl();
      if (savedUrl) {
        setPublishedUrl(savedUrl);
        setIsAlreadyPublished(hasPublishedSite());
        const fallbackSiteId = getUserActiveSiteId();
        const slug = getPublishedSlug(savedUrl);
        if (fallbackSiteId && slug) {
          setExportTarget((current) => ({
            id: fallbackSiteId,
            title: current?.title,
            slug,
          }));
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(hydrateTimeout);
    };
  }, []);

  useEffect(() => {
    const handlePublished = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      const url = detail?.url;

      if (!url) return;

      setPublishedSiteUrl(url);
      setPublishedUrl(url);
      setIsAlreadyPublished(true);
      setIsEditingPublishedUrl(false);
      setPublishedUrlError("");
      setPublishedUrlSaved(false);
      setShowPublishedPopup(true);
      setShowCopiedMessage(false);

      const querySiteId = new URLSearchParams(window.location.search).get(
        "siteId",
      );
      const activeSiteId = querySiteId || getUserActiveSiteId();
      const slug = getPublishedSlug(url);
      if (activeSiteId && slug) {
        setExportTarget((current) => ({
          id: activeSiteId,
          title: current?.title,
          slug,
        }));
      }
    };

    const handleLoginRequired = () => {
      setLoginIntent("publish");
    };

    const handleEditorLoginRequired = (event: Event) => {
      const intent = (event as CustomEvent<{ intent?: EditorLoginIntent }>)
        .detail?.intent;
      if (
        intent === "dashboard" ||
        intent === "upgrade" ||
        intent === "publish" ||
        intent === "settings" ||
        intent === "preview"
      ) {
        setLoginIntent(intent);
      }
    };

    const handlePublishFailed = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      void showAppAlert({
        title: "Publish failed",
        text: detail?.message || "Unable to publish your website",
        icon: "error",
      });
    };

    window.addEventListener("ai-builder-published", handlePublished);
    window.addEventListener(
      "ai-builder-publish-login-required",
      handleLoginRequired,
    );
    window.addEventListener(
      "ai-builder-login-required",
      handleEditorLoginRequired,
    );
    window.addEventListener("ai-builder-publish-failed", handlePublishFailed);

    return () => {
      window.removeEventListener("ai-builder-published", handlePublished);
      window.removeEventListener(
        "ai-builder-publish-login-required",
        handleLoginRequired,
      );
      window.removeEventListener(
        "ai-builder-login-required",
        handleEditorLoginRequired,
      );
      window.removeEventListener(
        "ai-builder-publish-failed",
        handlePublishFailed,
      );
    };
  }, []);

  const handlePublish = async () => {
    if (authLoading) return;

    if (!user) {
      setLoginIntent("publish");
      return;
    }

    window.dispatchEvent(new CustomEvent("ai-builder-publish-request"));
  };

  const handleLoginAuthenticated = () => {
    const intent = loginIntent;
    setLoginIntent(null);
    if (intent === "publish") {
      window.dispatchEvent(new CustomEvent("ai-builder-publish-request"));
      return;
    }
    if (intent === "settings") {
      setEditorPanel("settings");
      return;
    }
    if (intent === "preview") {
      setShowPreviewModal(true);
      setPreviewLoading(true);
      setPreviewError("");
      setPreviewSrc("");
      window.dispatchEvent(new CustomEvent("ai-builder-preview-request"));
      return;
    }
    if (intent === "upgrade") {
      rememberEditorForAuthCancel();
      router.push(buildPlanPageUrl(resolveEditorSiteId()));
      return;
    }
    if (intent === "dashboard") {
      router.push("/user/dashboard");
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    const action = consumePostAuthAction();
    if (action === "publish") {
      window.dispatchEvent(new CustomEvent("ai-builder-publish-request"));
    }
  }, [authLoading, user]);

  const handleCopyPublishedUrl = async () => {
    if (!publishedUrl) return;

    try {
      await window.navigator.clipboard.writeText(publishedUrl);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = publishedUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }

    setShowCopiedMessage(true);
  };

  const handleStartPublishedUrlEdit = () => {
    if (!publishedUrl) {
      setPublishedUrlError("Publish your website before editing its URL.");
      return;
    }

    setPublishedSlugDraft(getPublishedSlug(publishedUrl));
    setPublishedUrlError("");
    setPublishedUrlSaved(false);
    setIsEditingPublishedUrl(true);
  };

  const handleSavePublishedUrl = async () => {
    if (isSavingPublishedUrl) return;

    const slug = normalizePublishedSlug(publishedSlugDraft);
    if (slug.length < 3 || slug.length > 60) {
      setPublishedUrlError("Use 3 to 60 letters, numbers, or hyphens.");
      return;
    }

    const querySiteId = new URLSearchParams(window.location.search).get(
      "siteId",
    );
    const activeSiteId = querySiteId || getUserActiveSiteId();
    if (!activeSiteId) {
      setPublishedUrlError("Website not found. Publish it once and try again.");
      return;
    }

    setIsSavingPublishedUrl(true);
    setPublishedUrlError("");
    setPublishedUrlSaved(false);

    try {
      const response = await fetch(`/api/user/sites/${activeSiteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        slug?: string;
        message?: string;
      };
      if (!response.ok || !data.slug) {
        throw new Error(data.message || "Unable to update website URL");
      }

      const nextUrl = `${window.location.origin}/published/${data.slug}`;
      setPublishedUrl(nextUrl);
      setPublishedSiteUrl(nextUrl);
      setPublishedSlugDraft(data.slug);
      setExportTarget((current) =>
        current
          ? { ...current, slug: data.slug }
          : {
              id: activeSiteId,
              slug: data.slug,
            },
      );
      setIsEditingPublishedUrl(false);
      setPublishedUrlSaved(true);
    } catch (error) {
      setPublishedUrlError(
        error instanceof Error
          ? error.message
          : "Unable to update website URL",
      );
    } finally {
      setIsSavingPublishedUrl(false);
    }
  };

  useEffect(() => {
    if (!showCopiedMessage) return;

    const timeout = window.setTimeout(() => {
      setShowCopiedMessage(false);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [showCopiedMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
      if (
        !(target instanceof Element) ||
        !target.closest("[data-user-menu]")
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userInitial = (user?.name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    window.location.assign("/auth");
  };

  const handleEditPage = (page: string) => {
    setOpen(false);
    setCurrentPage(page);
  };

  const handleDeletePage = (page: string) => {
    setOpen(false);
    setPageToDelete(page);
  };

  const openAddDropdownPopup = (page: string) => {
    const parentPage = pageLinks.find((item) => item.label === page);
    if ((parentPage?.children?.length ?? 0) >= MAX_DROPDOWN_ITEMS) return;

    setDropdownParentForNew(page);
    setNewDropdownName("");
    setExpandedPageLabel(page);
  };

  const closeDropdownPopup = () => {
    setDropdownParentForNew(null);
    setNewDropdownName("");
  };

  const handleCreateDropdownLink = () => {
    if (!dropdownParentForNew || !newDropdownName.trim()) return;

    const trimmedDropdownName = newDropdownName.trim();

    setPageLinks(
      pageLinks.map((item) => {
        if (item.label !== dropdownParentForNew) return item;

        const children = item.children ?? [];
        if (children.length >= MAX_DROPDOWN_ITEMS) return item;

        return {
          ...item,
          children: [
            ...children,
            {
              label: trimmedDropdownName,
              href: createPageHref(trimmedDropdownName, isMultiPageTemplate),
            },
          ],
        };
      }),
    );
    window.dispatchEvent(
      new CustomEvent("ai-builder-page-added", {
        detail: {
          label: trimmedDropdownName,
          href: createPageHref(trimmedDropdownName, isMultiPageTemplate),
        },
      }),
    );
    setCurrentPage(trimmedDropdownName);
    setExpandedPageLabel(dropdownParentForNew);
    closeDropdownPopup();
  };

  const handleConfirmDeleteDropdown = () => {
    if (!dropdownToDelete) return;

    const removedLink = pageLinks
      .find((item) => item.label === dropdownToDelete.parentLabel)
      ?.children?.[dropdownToDelete.childIndex];

    setPageLinks(
      pageLinks.map((item) => {
        if (item.label !== dropdownToDelete.parentLabel) return item;

        const nextChildren = (item.children ?? []).filter(
          (_, index) => index !== dropdownToDelete.childIndex,
        );

        return {
          ...item,
          children: nextChildren.length ? nextChildren : undefined,
        };
      }),
    );
    if (currentPage === dropdownToDelete.childLabel) {
      setCurrentPage(dropdownToDelete.parentLabel);
    }
    if (removedLink) {
      window.dispatchEvent(
        new CustomEvent("ai-builder-page-removed", {
          detail: removedLink,
        }),
      );
    }
    setDropdownToDelete(null);
  };

  const handleConfirmDeletePage = () => {
    if (!pageToDelete) return;

    const removedLink = pageLinks.find((item) => item.label === pageToDelete);
    if (!removedLink) {
      setPageToDelete(null);
      return;
    }

    const removingBlogIndex =
      removedLink.kind === "blogIndex" ||
      removedLink.href.trim().toLowerCase() === "#page-blogs" ||
      removedLink.label.trim().toLowerCase() === "blogs" ||
      removedLink.label.trim().toLowerCase() === "blog";

    // Pages delete never removes blog posts — only the Blogs index/nav page.
    const nextLinks = pageLinks.filter((item) => {
      if (item.kind === "blog") return true;
      if (removingBlogIndex) {
        const href = item.href.trim().toLowerCase();
        const label = item.label.trim().toLowerCase();
        return !(
          item.kind === "blogIndex" ||
          href === "#page-blogs" ||
          label === "blogs" ||
          label === "blog"
        );
      }
      return item.label !== pageToDelete;
    });
    setPageLinks(nextLinks);

    if (currentPage === pageToDelete) {
      if (isSinglePageTemplate || removedLink.kind === "document") {
        setCurrentPage("Home");
      } else {
        const nextPage = nextLinks.find(
          (item) => item.kind !== "blog" && item.label !== pageToDelete,
        );
        setCurrentPage(nextPage?.label ?? "Home");
      }
    }

    window.dispatchEvent(
      new CustomEvent("ai-builder-page-removed", {
        detail: removingBlogIndex
          ? {
              ...removedLink,
              kind: "blogIndex" as const,
              href: removedLink.href || "#page-blogs",
              label: removedLink.label || "Blogs",
            }
          : removedLink,
      }),
    );

    setPageToDelete(null);
  };

  const closePagePopup = () => {
    setShowPopup(false);
    setNewPageName("");
  };

  const closeRenamePopup = () => {
    setPageToRename(null);
    setRenamePageName("");
  };

  const addNewPage = () => {
    setShowPopup(true);
    setOpen(false);
  };

  const openRenamePage = (label: string) => {
    setPageToRename(label);
    setRenamePageName(label);
    setOpen(false);
  };

  const handleRenamePage = () => {
    if (!pageToRename) return;
    const trimmedName = renamePageName.trim();
    if (!trimmedName) return;

    const normalizedName = trimmedName.toLowerCase();
    if (normalizedName === "home") return;

    const alreadyExists = pageLinks.some(
      (page) =>
        page.label !== pageToRename &&
        page.label.trim().toLowerCase() === normalizedName,
    );
    if (alreadyExists) return;

    const oldLink = pageLinks.find((page) => page.label === pageToRename);
    if (!oldLink) return;

    const isBlogIndex =
      oldLink.kind === "blogIndex" ||
      oldLink.href.trim().toLowerCase() === "#page-blogs" ||
      pageToRename.trim().toLowerCase() === "blogs" ||
      pageToRename.trim().toLowerCase() === "blogss";

    if (normalizedName === "blogs" && !isBlogIndex) return;

    const newHref = isBlogIndex
      ? "#page-blogs"
      : createPageHref(trimmedName, true);
    const nextLinks = pageLinks.map((page) =>
      page.label === pageToRename
        ? {
            ...page,
            label: trimmedName,
            href: newHref,
            ...(newHref === "#page-blogs" ? { kind: "blogIndex" as const } : {}),
          }
        : page,
    );

    window.dispatchEvent(
      new CustomEvent("ai-builder-page-renamed", {
        detail: {
          oldLabel: pageToRename,
          newLabel: trimmedName,
          oldHref: oldLink.href,
          newHref,
          kind: oldLink.kind,
        },
      }),
    );

    setPageLinks(nextLinks);
    if (currentPage === pageToRename) {
      setCurrentPage(trimmedName);
    }
    closeRenamePopup();
  };

  const handleCreatePage = () => {
    if (!newPageName.trim()) return;

    const trimmedPageName = newPageName.trim();
    const normalizedPageName = trimmedPageName.toLowerCase();
    const documentPages = pageLinks.filter((page) => page.kind === "document");
    const pageCountForLimit = isSinglePageTemplate
      ? documentPages.length
      : pageLinks.filter((page) => page.kind !== "blog").length;
    const maxPages = isSinglePageTemplate
      ? MAX_SINGLE_PAGE_DOCUMENT_PAGES
      : MAX_PAGE_ITEMS;

    if (pageCountForLimit >= maxPages) return;

    const alreadyExists = pageLinks.some(
      (page) => page.label.trim().toLowerCase() === normalizedPageName,
    );

    if (alreadyExists) return;

    // Single-page extras are real inner pages (#page-*) so Privacy/Terms can
    // live beside the scrolling home site without replacing it.
    const href = createPageHref(trimmedPageName, true);
    const nextPage = {
      label: trimmedPageName,
      href,
      ...(isSinglePageTemplate ? { kind: "document" as const } : {}),
    };

    setPageLinks([...pageLinks, nextPage]);
    setCurrentPage(trimmedPageName);
    window.dispatchEvent(
      new CustomEvent("ai-builder-page-added", {
        detail: {
          label: trimmedPageName,
          href,
          ...(isSinglePageTemplate ? { kind: "document" as const } : {}),
        },
      }),
    );

    setNewPageName("");
    setShowPopup(false);
  };

  const singlePageSwitcherLinks = [
    { label: "Home", href: "#", kind: undefined as "document" | undefined },
    ...pageLinks.filter((page) => page.kind === "document"),
  ];

  const multiPageSwitcherLinks = pageLinks.filter(
    (page) => page.kind !== "blog",
  );

  const canAddMorePages = isSinglePageTemplate
    ? pageLinks.filter((page) => page.kind === "document").length <
      MAX_SINGLE_PAGE_DOCUMENT_PAGES
    : multiPageSwitcherLinks.length < MAX_PAGE_ITEMS;

  const pageSwitcherLabel = isRedesignEditor
    ? "Pages :"
    : isSinglePageTemplate
      ? "Single Page :"
      : "Multi Pages :";

  const openPublishedPagePreview = () => {
    const siteBase = (publishedUrl || getPublishedSiteUrl() || "").replace(
      /\/$/,
      "",
    );
    if (!siteBase) {
      void showAppAlert({
        title: "Preview unavailable",
        text: "Publish your website first to preview the live page.",
        icon: "info",
      });
      return;
    }

    const pagePath = getPublishedPathForPage(currentPage || "Home", pageLinks);
    const url = pagePath ? `${siteBase}/${pagePath}` : siteBase;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <header className="fixed left-0 top-0 z-[9000] flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur transition-all duration-300">
      <div className="flex justify-between items-center w-full ">
        <div className="flex items-center gap-4 sm:gap-5">
          <Link href="/" aria-label="Go to home" className="flex items-center">
            <BrandLogo />
          </Link>

          <div ref={dropdownRef} className="relative z-[100]">
            <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-50/80 px-4 py-1 shadow-sm transition-all duration-300 hover:border-slate-400 hover:bg-white">
              <span className="text-md font-medium text-gray-900">
                {pageSwitcherLabel}
              </span>

              {isSinglePageTemplate ? (
                <button
                  type="button"
                  onClick={() => setOpen((prev) => !prev)}
                  className="flex h-8 min-w-[30px] items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-sm font-medium text-gray-800 shadow-sm transition-all duration-300 hover:border-slate-400 hover:shadow"
                >
                  {currentPage === "Home" ||
                  !pageLinks.some(
                    (page) =>
                      page.kind === "document" && page.label === currentPage,
                  )
                    ? "Home"
                    : currentPage}

                  <ChevronDown
                    size={20}
                    className={`text-slate-600 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen((prev) => !prev)}
                  className="flex h-8 min-w-[30px] items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-sm font-medium text-gray-800 shadow-sm transition-all duration-300 hover:border-slate-400 hover:shadow"
                >
                  {currentPage || "Home"}

                  <ChevronDown
                    size={20}
                    className={`text-slate-600 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={openPublishedPagePreview}
                className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-white hover:text-slate-900"
                aria-label={`Preview ${currentPage || "Home"} on published website`}
                title="Preview this page on live website"
              >
                <Eye size={16} />
              </button>
            </div>

            {open && isSinglePageTemplate && (
              <div className="absolute -right-30 top-[50px] z-[9010] min-w-56 overflow-visible border-2 border-slate-200 bg-white shadow-2xl animate-editor-pop">
                <p className="border-b border-slate-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Single page · Home + legal
                </p>
                {singlePageSwitcherLinks.map((page) => {
                  const isHome = page.label === "Home";
                  const isActive = isHome
                    ? currentPage === "Home" ||
                      !pageLinks.some(
                        (link) =>
                          link.kind === "document" &&
                          link.label === currentPage,
                      )
                    : currentPage === page.label;

                  return (
                    <div
                      key={`${page.label}-${page.href}`}
                      className={`flex h-12 w-full items-center border-b border-slate-200 ${
                        isActive ? "bg-blue-50 text-blue-700" : "text-slate-800"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(page.label);
                          setOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 px-4 text-left text-sm font-semibold hover:bg-slate-50/80"
                      >
                        <ChevronRight size={15} />
                        <span className="truncate">{page.label}</span>
                      </button>
                      {!isHome ? (
                        <div className="mr-2 flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openRenamePage(page.label);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            aria-label={`Rename ${page.label}`}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeletePage(page.label);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${page.label}`}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addNewPage}
                  disabled={!canAddMorePages}
                  className={`flex h-12 w-full items-center gap-2 px-4 text-left text-sm font-semibold ${
                    canAddMorePages
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                >
                  + Add page (Privacy, Terms…)
                </button>
              </div>
            )}

            {open && isMultiPageTemplate && (
              <div className="absolute -right-30 top-[50px] z-[9010] overflow-hidden border-2 border-slate-200 bg-white shadow-2xl animate-editor-pop">
                <p className="border-b border-slate-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Multi pages
                </p>
                <div className="max-h-[30rem] overflow-y-auto overscroll-contain">
                  {multiPageSwitcherLinks.map((page) => (
                    <button
                      key={`${page.label}-${page.href}`}
                      type="button"
                      onClick={() => {
                        setCurrentPage(page.label);
                        setOpen(false);
                      }}
                      className={`flex h-12 min-w-56 items-center gap-2 border-b border-slate-200 px-4 text-left text-sm font-semibold last:border-b-0 hover:bg-slate-50 ${currentPage === page.label ? "bg-blue-50 text-blue-700" : "text-slate-800"}`}
                    >
                      <ChevronRight size={15} />
                      <span className="truncate">{page.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden items-center md:flex">
          <nav className="hidden items-center gap-6 p-2 md:flex">
            {!isRedesignEditor ? (
              <button
                type="button"
                onClick={openThemesPopup}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
              >
                <SwatchBook size="20" className="text-gray-600" />
                Themes
              </button>
            ) : null}

            <button
              type="button"
              onClick={requestPreview}
              aria-pressed={showPreviewModal}
              className={`flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.97] ${
                showPreviewModal
                  ? "border-slate-400 bg-slate-200 text-slate-800"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-md"
              }`}
            >
              {showPreviewModal ? <EyeOff size={17} /> : <Eye size={17} />}
              Preview Website
            </button>
            {isAlreadyPublished && exportTarget ? (
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-md"
              >
                <Download size={16} />
                Export Website
              </button>
            ) : null}
            <button
              type="button"
              onClick={handlePublish}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-600 hover:shadow-md"
            >
              <Rocket size={16} />
              {isAlreadyPublished ? "Republish" : "Publish"}
            </button>

            {user ? (
              <UserAccountButton
                open={showUserMenu}
                onToggle={() => setShowUserMenu((prev) => !prev)}
                onLogout={handleLogout}
                initial={userInitial}
                avatarUrl={user.avatarUrl}
                name={user.name}
                email={user.email}
              />
            ) : null}
          </nav>
        </div>
      </div>
      <div className="md:hidden flex items-center gap-3">
        <button
          type="button"
          onClick={requestPreview}
          aria-pressed={showPreviewModal}
          className={`flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.97] ${
            showPreviewModal
              ? "border-slate-400 bg-slate-200 text-slate-800"
              : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-md"
          }`}
        >
          {showPreviewModal ? <EyeOff size={17} /> : <Eye size={17} />}
          Preview Website
        </button>
        {user ? (
          <UserAccountButton
            open={showUserMenu}
            onToggle={() => setShowUserMenu((prev) => !prev)}
            onLogout={handleLogout}
            initial={userInitial}
            avatarUrl={user.avatarUrl}
            name={user.name}
            email={user.email}
            compact
          />
        ) : null}
        <button className="cursor-pointer" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
      </div>

      {!isRedesignEditor && showThemesPopup &&
        createPortal(
          <div
            className="fixed inset-0 z-[10020] flex bg-[#f3f4f6] animate-editor-fade"
            role="dialog"
            aria-modal="true"
            aria-labelledby="themes-dialog-title"
          >
            <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
              <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-3 shadow-sm sm:px-8">
                <div>
                  <h2
                    id="themes-dialog-title"
                    className="text-lg font-extrabold text-slate-950"
                  >
                    Themes
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Choose a {currentCategory} theme. Your content and URL stay unchanged.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close themes"
                  disabled={Boolean(applyingTemplateId)}
                  onClick={() => setShowThemesPopup(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-8 lg:p-10">
                <div className="mx-auto w-full max-w-7xl">
                {themesLoading ? (
                  <EditorLoadingScreen
                    variant="modal"
                    message="Loading themes…"
                  />
                ) : themesError && categoryTemplates.length === 0 ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
                    {themesError}
                  </div>
                ) : categoryTemplates.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    No themes are available for this category yet.
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryTemplates.map((template) => {
                      const isCurrent = isSameBuilderTemplate(
                        template.id,
                        currentTemplateId,
                        currentCategory,
                      );
                      const isApplying = applyingTemplateId === template.id;
                      const previewImage =
                        template.image || template.previewimage || "/haelli.png";
                      const cardPreviewUrl = buildTemplateCardPreviewUrl(
                        template,
                        currentCategory,
                      );

                      return (
                        <article
                          key={template.id}
                          className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                            isCurrent
                              ? "border-blue-500 ring-2 ring-blue-100"
                              : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                          }`}
                        >
                          <ThemeCardPreview
                            previewUrl={cardPreviewUrl}
                            previewImage={previewImage}
                            title={template.title}
                            isCurrent={isCurrent}
                          />
                          <div className="p-4">
                            <h3 className="truncate text-base font-bold text-slate-950">
                              {template.title}
                            </h3>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {template.type}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={Boolean(applyingTemplateId)}
                                onClick={() => setThemePreviewTemplate(template)}
                                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                              >
                                <Eye size={15} />
                                View theme
                              </button>
                              <button
                                type="button"
                                disabled={isCurrent || Boolean(applyingTemplateId)}
                                onClick={() => requestThemeChange(template.id)}
                                className={`flex h-10 items-center justify-center rounded-xl px-2 text-sm font-bold transition ${
                                  isCurrent
                                    ? "cursor-default bg-blue-50 text-blue-700"
                                    : "bg-slate-950 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-55"
                                }`}
                              >
                                {isCurrent
                                  ? "Current theme"
                                  : isApplying
                                    ? "Applying..."
                                    : "Use this theme"}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {themesError && categoryTemplates.length > 0 ? (
                  <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {themesError}
                  </p>
                ) : null}
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )}

      {showPopup &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px] animate-editor-fade"
            onClick={closePagePopup}
          >
            <button
              type="button"
              aria-label="Close page popup"
              onClick={closePagePopup}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
            >
              ×
            </button>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleCreatePage();
              }}
              onClick={(event) => event.stopPropagation()}
              className="flex w-[min(92vw,440px)] items-center gap-2 animate-editor-pop"
            >
              <input
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder={
                  isSinglePageTemplate
                    ? "e.g. Privacy Policy, Terms"
                    : "Enter page name"
                }
                autoFocus
                className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none shadow-lg focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={!canAddMorePages}
                className={`h-11 shrink-0 rounded-md px-5 text-sm font-semibold text-white shadow-lg ${
                  canAddMorePages
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "cursor-not-allowed bg-blue-300"
                }`}
              >
                Enter
              </button>
            </form>
          </div>,
          document.body,
        )}

      {pageToRename &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px] animate-editor-fade"
            onClick={closeRenamePopup}
          >
            <button
              type="button"
              aria-label="Close rename popup"
              onClick={closeRenamePopup}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
            >
              ×
            </button>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleRenamePage();
              }}
              onClick={(event) => event.stopPropagation()}
              className="flex w-[min(92vw,440px)] flex-col gap-3 animate-editor-pop"
            >
              <p className="text-sm font-semibold text-white drop-shadow">
                Rename “{pageToRename}”
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={renamePageName}
                  onChange={(e) => setRenamePageName(e.target.value)}
                  placeholder="New page name"
                  autoFocus
                  className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none shadow-lg focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!renamePageName.trim()}
                  className={`h-11 shrink-0 rounded-md px-5 text-sm font-semibold text-white shadow-lg ${
                    renamePageName.trim()
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "cursor-not-allowed bg-blue-300"
                  }`}
                >
                  Save
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {dropdownParentForNew &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px] animate-editor-fade"
            onClick={closeDropdownPopup}
          >
            <button
              type="button"
              aria-label="Close dropdown popup"
              onClick={closeDropdownPopup}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
            >
              ×
            </button>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleCreateDropdownLink();
              }}
              onClick={(event) => event.stopPropagation()}
              className="flex w-[min(92vw,440px)] items-center gap-2 animate-editor-pop"
            >
              <input
                type="text"
                value={newDropdownName}
                onChange={(e) => setNewDropdownName(e.target.value)}
                placeholder="Enter page name"
                autoFocus
                className="h-11 min-w-0 flex-1 rounded-md border border-blue-500 bg-white px-3 text-sm text-slate-900 outline-none shadow-lg"
              />

              <button
                type="submit"
                disabled={!newDropdownName.trim()}
                className={`h-11 shrink-0 rounded-md px-5 text-sm font-semibold text-white shadow-lg ${
                  newDropdownName.trim()
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "cursor-not-allowed bg-blue-300"
                }`}
              >
                Enter
              </button>
            </form>
          </div>,
          document.body,
        )}

      {pageToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
            <div className="pointer-events-auto w-[min(92vw,390px)] rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                Delete {pageToDelete}
              </p>

              <h3 className="mt-2 text-xl font-semibold leading-7 text-slate-950">
                Are you sure you want to delete {pageToDelete} button?
              </h3>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDeletePage}
                  className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes
                </button>

                <button
                  type="button"
                  onClick={() => setPageToDelete(null)}
                  className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {dropdownToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
            <div className="pointer-events-auto w-[min(92vw,390px)] rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                Delete {dropdownToDelete.childLabel}
              </p>

              <h3 className="mt-2 text-xl font-semibold leading-7 text-slate-950">
                Are you sure you want to delete {dropdownToDelete.childLabel}{" "}
                button?
              </h3>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDeleteDropdown}
                  className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes
                </button>

                <button
                  type="button"
                  onClick={() => setDropdownToDelete(null)}
                  className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showPublishedPopup &&
        publishedUrl &&
        createPortal(
          <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 animate-editor-fade">
            <button
              type="button"
              aria-label="Close published dialog"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setShowPublishedPopup(false)}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white px-6 pb-7 pt-10 text-center shadow-2xl animate-editor-pop">
              <button
                type="button"
                aria-label="Close published popup"
                onClick={() => setShowPublishedPopup(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center">
                <span
                  className="flex h-[59px] w-[59px] items-center justify-center rounded-full" style={{ backgroundColor: "#116dff" }}
                  aria-hidden="true"
                >
                  <Check
                    size={32}
                    strokeWidth={2.5}
                    className="text-white"
                  />
                </span>

                <h2 className="mt-5 text-[28px] font-bold leading-tight tracking-tight text-slate-950">
                  Congratulations
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  Your site is published!
                </p>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Website URL
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-blue-600"
                  >
                    {displayPublishedUrl}
                  </a>
                  <button
                    type="button"
                    aria-label="Copy published URL"
                    onClick={handleCopyPublishedUrl}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-900"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {showCopiedMessage ? (
                <p
                  className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
                  role="status"
                  aria-live="polite"
                >
                  Link copied
                </p>
              ) : null}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90" style={{ backgroundColor: "#116dff" }}
                >
                  <ExternalLink size={16} />
                  Open site
                </a>
                <button
                  type="button"
                  onClick={() => setShowDomainsPopup(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  <Link2 size={16} />
                  Custom domain
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showDomainsPopup &&
        createPortal(
          <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4 animate-editor-fade">
            <button
              type="button"
              aria-label="Close domains dialog"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setShowDomainsPopup(false)}
            />

            <section className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-950 shadow-2xl animate-editor-pop sm:p-8">
              <button
                type="button"
                aria-label="Close domains popup"
                onClick={() => setShowDomainsPopup(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <X size={20} />
              </button>

              <div className="pr-8 text-center sm:text-left">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:mx-0">
                  <Globe2 size={22} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Domains
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Publish your project to custom domains.
                </p>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current website URL
                </p>
                {isEditingPublishedUrl ? (
                  <form
                    className="mt-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleSavePublishedUrl();
                    }}
                  >
                    <div className="flex min-w-0 items-center rounded-xl border border-blue-400 bg-white px-3 shadow-sm ring-2 ring-blue-100 focus-within:border-blue-600">
                      <span className="shrink-0 whitespace-nowrap text-sm text-slate-500">
                        {displayPublishedUrl.replace(/[^/]*$/, "")}
                      </span>
                      <input
                        autoFocus
                        type="text"
                        value={publishedSlugDraft}
                        maxLength={60}
                        aria-label="Website URL"
                        aria-invalid={Boolean(publishedUrlError)}
                        onChange={(event) => {
                          setPublishedSlugDraft(
                            event.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")
                              .replace(/-{2,}/g, "-")
                              .slice(0, 60),
                          );
                          setPublishedUrlError("");
                          setPublishedUrlSaved(false);
                        }}
                        className="min-w-[8rem] flex-1 bg-transparent py-3 text-sm font-semibold text-slate-950 outline-none"
                        placeholder="my-website"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Use 3-60 lowercase letters, numbers, or hyphens. The old
                      link will stop working after this change.
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSavingPublishedUrl}
                        onClick={() => {
                          setIsEditingPublishedUrl(false);
                          setPublishedUrlError("");
                        }}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingPublishedUrl}
                        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingPublishedUrl ? "Saving..." : "Save URL"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
                        <Globe2 size={16} />
                      </span>
                      <a
                        href={publishedUrl || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 truncate text-sm font-medium text-slate-900 hover:text-blue-600"
                      >
                        {displayPublishedUrl ||
                          publishedUrl ||
                          "Publish first to generate a URL"}
                      </a>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {publishedUrl ? (
                        <a
                          href={publishedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
                        >
                          <ExternalLink size={14} />
                          Open
                        </a>
                      ) : null}
                      <button
                        type="button"
                        disabled={!publishedUrl}
                        onClick={handleStartPublishedUrlEdit}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit URL
                      </button>
                    </div>
                  </div>
                )}

                {publishedUrlError ? (
                  <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
                    {publishedUrlError}
                  </p>
                ) : null}
                {publishedUrlSaved ? (
                  <p
                    className="mt-3 text-sm font-semibold text-emerald-700"
                    role="status"
                  >
                    Website URL updated successfully.
                  </p>
                ) : null}
              </div>

              <div className="mt-7">
                <h3 className="text-lg font-bold text-slate-950">
                  Custom domains
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Connect or buy domains for this project.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        Buy a new domain{" "}
                        <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                          Pro
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Buy and automatically connect a new domain in CSS
                        Founder.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          "getsparkbuild.com",
                          "showcasespark.com",
                          "sparkdev.dev",
                        ].map((domain) => (
                          <button
                            key={domain}
                            type="button"
                            className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            {domain}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/user/domains")}
                      className="shrink-0 self-start rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: "#116dff" }}
                    >
                      Buy new domain
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        Connect third party domain{" "}
                        <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                          Pro
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Connect a domain you already own from any provider.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const activeSiteId = getUserActiveSiteId();
                        router.push(
                          activeSiteId
                            ? `/user/domains?view=connect&siteId=${encodeURIComponent(activeSiteId)}`
                            : "/user/domains?view=connect",
                        );
                      }}
                      className="shrink-0 self-start rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    >
                      Connect third party domain
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                Open docs <ExternalLink size={14} />
              </button>
            </section>
          </div>,
          document.body,
        )}

      <EditorPreviewModal
        open={Boolean(themePreviewTemplate)}
        src={
          themePreviewTemplate
            ? buildTemplateComposePreviewUrl(
                themePreviewTemplate,
                currentCategory,
              ) || ""
            : ""
        }
        loading={false}
        error=""
        onClose={() => setThemePreviewTemplate(null)}
        onRetry={() => undefined}
        onUseTheme={
          themePreviewTemplate
            ? () => {
                if (
                  isSameBuilderTemplate(
                    themePreviewTemplate.id,
                    currentTemplateId,
                    currentCategory,
                  )
                )
                  return;
                const templateId = themePreviewTemplate.id;
                setThemePreviewTemplate(null);
                requestThemeChange(templateId);
              }
            : undefined
        }
        useThemeLabel={
          themePreviewTemplate &&
          isSameBuilderTemplate(
            themePreviewTemplate.id,
            currentTemplateId,
            currentCategory,
          )
            ? "Current theme"
            : applyingTemplateId === themePreviewTemplate?.id
              ? "Applying..."
              : "Use this theme"
        }
        useThemeDisabled={
          Boolean(
            themePreviewTemplate &&
              isSameBuilderTemplate(
                themePreviewTemplate.id,
                currentTemplateId,
                currentCategory,
              ),
          ) || Boolean(applyingTemplateId)
        }
        useThemeLoading={
          Boolean(applyingTemplateId) &&
          applyingTemplateId === themePreviewTemplate?.id
        }
      />

      <EditorPreviewModal
        open={showPreviewModal}
        src={previewSrc}
        loading={previewLoading}
        error={previewError}
        publishedUrl={isAlreadyPublished ? publishedUrl : undefined}
        onClose={closePreview}
        onRetry={requestPreview}
      />

      <ExportWebsiteModal
        open={showExportModal}
        site={exportTarget}
        onClose={() => setShowExportModal(false)}
      />

      <PublishLoginModal
        open={Boolean(loginIntent)}
        title={loginIntent ? EDITOR_LOGIN_COPY[loginIntent].title : undefined}
        description={
          loginIntent ? EDITOR_LOGIN_COPY[loginIntent].description : undefined
        }
        onClose={() => setLoginIntent(null)}
        onAuthenticated={handleLoginAuthenticated}
      />

    </header>
  );
}

function UserAccountButton({
  open,
  onToggle,
  onLogout,
  initial,
  avatarUrl,
  name,
  email,
  compact = false,
}: {
  open: boolean;
  onToggle: () => void;
  onLogout: () => void;
  initial: string;
  avatarUrl?: string | null;
  name?: string | null;
  email: string;
  compact?: boolean;
}) {
  return (
    <div className="relative" data-user-menu>
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={onToggle}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        title={name || email}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial || <UserRound size={16} />
        )}
      </button>

      {open ? (
        <div
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-[10010] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${
            compact ? "w-56" : "w-64"
          }`}
        >
          <div
            className={`border-b border-slate-100 ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
          >
            <p className="truncate text-sm font-semibold text-slate-900">
              {name || "Your account"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className={`flex w-full items-center gap-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${
              compact ? "px-3 py-2.5" : "px-4 py-3"
            }`}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ThemeCardPreview({
  previewUrl,
  previewImage,
  title,
  isCurrent,
}: {
  previewUrl: string | null;
  previewImage: string;
  title: string;
  isCurrent: boolean;
}) {
  const [previewReady, setPreviewReady] = useState(!previewUrl);

  useEffect(() => {
    if (!previewUrl) {
      setPreviewReady(true);
      return;
    }

    setPreviewReady(false);

    const expectedSrc = (() => {
      try {
        const url = new URL(previewUrl, window.location.origin);
        return `${url.pathname}${url.search}`;
      } catch {
        return previewUrl;
      }
    })();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ai-builder-compose-preview-ready") return;
      if (event.data?.src !== expectedSrc) return;
      setPreviewReady(true);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [previewUrl]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
      {previewUrl ? (
        <>
          {!previewReady ? <EditorLoadingScreen variant="card" /> : null}
          <iframe
            key={previewUrl}
            src={previewUrl}
            title={`${title} live preview`}
            loading="lazy"
            tabIndex={-1}
            onLoad={() => setPreviewReady(true)}
            className={`pointer-events-none absolute left-0 top-0 border-0 bg-white transition-opacity duration-200 ${
              previewReady ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: "400%",
              height: "400%",
              transform: "scale(0.25)",
              transformOrigin: "top left",
            }}
          />
        </>
      ) : (
        <>
          {!previewReady ? <EditorLoadingScreen variant="card" /> : null}
          <Image
            src={previewImage}
            alt={`${title} preview`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-opacity duration-200 ${
              previewReady ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setPreviewReady(true)}
          />
        </>
      )}
      {isCurrent ? (
        <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          <Check size={13} /> Current theme
        </span>
      ) : null}
    </div>
  );
}
