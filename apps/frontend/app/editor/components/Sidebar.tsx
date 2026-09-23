"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  House,
  Palette,
  Type,
  SearchCheck,
  Settings2,
  LogOut,
  FileText,
  Monitor,
  Layers3,
  ArrowRight,
  X,
  Plus,
  CircleHelp,
  Menu,
  Newspaper,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Users,
  Images,
  Flag,
  Edit,
  Trash,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  usePreview,
  type PageLink,
} from "../layout/src/components/context/PreviewContext";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import { consumePostAuthPanel, rememberEditorForAuthCancel, buildPlanPageUrl } from "@/lib/authReturn";
import { resolveEditorSiteId } from "@/lib/migrateGuestSite";
import { applyPendingCoreIfNeeded, isEditorCorePlanActive } from "@/lib/userPlan";
import EditorThemePanels from "./EditorThemePanels";
import EditorChatBot from "./EditorChatBot";
import BlogManager, { type NewBlogPostInput } from "./BlogManager";
import ServiceManager from "./ServiceManager";
import EventManager from "./EventManager";
import PortfolioManager from "./PortfolioManager";
import TeamManager from "./TeamManager";
import GalleryManager from "./GalleryManager";
import CountriesServeManager from "./CountriesServeManager";
import PropertyManager from "./PropertyManager";
import { getBuilderTemplate } from "../layout/src/data/templateFlow";
import { isRedesignEditorSearchParams } from "@/lib/is-redesign-editor";
import { readRedesignEditorPack } from "@/lib/redesign-editor-session";

const createPageHref = (label: string, multiPage = false) => {
  const slug = label.trim().toLowerCase().replace(/\s+/g, "-");

  return slug === "home" ? "#" : `${multiPage ? "#page-" : "#"}${slug}`;
};

const isBlogIndexPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    link.kind === "blogIndex" ||
    href === "#page-blogs" ||
    href === "#page-blog" ||
    href === "#blogs" ||
    label === "blogs" ||
    label === "blog"
  );
};

const toBlogSlugFromInput = (value?: string) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const uniqueBlogSlug = (
  links: PageLink[],
  baseSlug: string,
  excludeHref?: string,
) => {
  let slug = baseSlug || "post";
  let suffix = 2;
  while (
    links.some(
      (page) =>
        page.href !== excludeHref && page.href === `#page-blog-${slug}`,
    )
  ) {
    slug = `${baseSlug || "post"}-${suffix++}`;
  }
  return slug;
};

const sidebarItems = [
  {
    label: "Dashboard",
    icon: House,
  },
  { label: "Pages", icon: FileText, children: [] as PageItem[] },
  { label: "Nav Menu", icon: Menu },
  { label: "Blogs", icon: Newspaper },
  { label: "Services", icon: Briefcase },
  { label: "Events", icon: CalendarDays },
  { label: "Portfolio", icon: BriefcaseBusiness },
  { label: "Gallery", icon: Images },
  { label: "Countries", icon: Flag },
  { label: "Teams", icon: Users },
  { label: "Properties", icon: Building2 },
  {
    label: "Theme Color",
    icon: Palette,
  },
  {
    label: "Theme Fonts",
    icon: Type,
  },
  {
    label: "Page SEO",
    icon: SearchCheck,
    children: [
      { label: "Meta Tags", icon: FileText, panel: "seo-meta" as const },
      { label: "Open Graph", icon: Monitor, panel: "seo-og" as const },
      { label: "Schema Markup", icon: Layers3, panel: "seo-schema" as const },
      { label: "Sitemap", icon: FileText, panel: "seo-sitemap" as const },
      { label: "Robots.txt", icon: FileText, panel: "seo-robots" as const },
    ],
  },
  {
    label: "Settings",
    icon: Settings2,
  },
  {
    label: "Help",
    icon: CircleHelp,
  },
  {
    label: "Logout",
    icon: LogOut,
  },
];

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
};

type PageItem = {
  label: string;
  icon: typeof FileText;
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] bg-black/30 md:hidden">
          <aside className="relative flex h-full w-64 flex-col border-r border-black bg-white">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-black px-4">
              <span className="underline">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <SidebarContent
                collapsed={false}
                mobile
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      <aside
        className={`fixed left-0 top-14 z-[200] hidden h-[calc(100vh-3.5rem)] overflow-visible border-r border-gray-200 bg-white transition-all duration-300 md:block ${
          collapsed ? "w-12" : "w-40"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
        />

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-1/2 z-[210] flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black bg-black text-white shadow-md"
        >
          <ArrowRight
            size={18}
            className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
          />
        </button>
      </aside>

      <EditorThemePanels />
    </>
  );
}

function SidebarContent({
  collapsed,
  onNavigate,
  mobile = false,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designId = (searchParams.get("designId") || "").trim();
  const redesignPack = designId.startsWith("rd_")
    ? readRedesignEditorPack(designId)
    : null;
  const resolvedTemplateId =
    searchParams.get("templateId") ||
    redesignPack?.templateId ||
    "template-1";
  const category = (
    searchParams.get("category") ||
    redesignPack?.category ||
    ""
  )
    .trim()
    .toLowerCase();
  const templateMeta = getBuilderTemplate(
    resolvedTemplateId,
    redesignPack?.category || searchParams.get("category"),
  );
  // Redesign multipage is chosen in onboarding prefs — template type alone may still be Single Page.
  const isMultiPageTemplate =
    redesignPack?.pageType === "multi-page" ||
    templateMeta.type === "Multiple Pages Website";
  const isRedesignEditor = isRedesignEditorSearchParams(searchParams);
  const isRealestateCategory =
    category === "realestate" || category === "real-estate" || category === "real estate";
  const { logout, user, loading: authLoading } = useUserAuth();
  const { setEditorPanel, editorPanel } = usePreview();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState(0);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showCountriesModal, setShowCountriesModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [chatFocusSection, setChatFocusSection] = useState<{
    sectionId: string;
    sectionType: string;
    label: string;
  } | null>(null);
  const [chatAssistHint, setChatAssistHint] = useState<string | null>(null);
  const [hasCorePlan, setHasCorePlan] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageToRename, setPageToRename] = useState<string | null>(null);
  const [renamePageName, setRenamePageName] = useState("");
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogLayout, setBlogLayout] = useState("BlogPage-1");
  const { currentPage, pageLinks, setCurrentPage, setPageLinks } = usePreview();
  const siteId = searchParams.get("siteId") || "";

  const refreshPlanStatus = () => {
    applyPendingCoreIfNeeded(siteId);
    setHasCorePlan(isEditorCorePlanActive(siteId));
  };

  useEffect(() => {
    refreshPlanStatus();
    const onFocus = () => refreshPlanStatus();
    const onPlanUpdated = () => refreshPlanStatus();
    const onStorage = (event: StorageEvent) => {
      if (
        !event.key ||
        event.key === "css-ai-site-subscriptions" ||
        event.key === "css-ai-user-subscription"
      ) {
        refreshPlanStatus();
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("css-ai-plan-updated", onPlanUpdated);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("css-ai-plan-updated", onPlanUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  useEffect(() => {
    if (!hasCorePlan) setShowChatBot(false);
  }, [hasCorePlan]);

  useEffect(() => {
    const onOpenSectionChat = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          sectionId?: string;
          sectionType?: string;
          label?: string;
        }>
      ).detail;
      const sectionId =
        typeof detail?.sectionId === "string" ? detail.sectionId.trim() : "";
      if (!sectionId) return;
      if (!hasCorePlan) {
        if (!user) {
          window.dispatchEvent(
            new CustomEvent("ai-builder-login-required", {
              detail: { intent: "upgrade" },
            }),
          );
          return;
        }
        const planUrl = buildPlanPageUrl(siteId || resolveEditorSiteId());
        rememberEditorForAuthCancel();
        router.push(planUrl);
        return;
      }
      setChatFocusSection({
        sectionId,
        sectionType:
          typeof detail?.sectionType === "string" && detail.sectionType.trim()
            ? detail.sectionType.trim()
            : "Section",
        label:
          typeof detail?.label === "string" && detail.label.trim()
            ? detail.label.trim()
            : "Section",
      });
      setChatAssistHint(null);
      setShowChatBot(true);
    };
    window.addEventListener(
      "ai-builder-open-section-chat",
      onOpenSectionChat as EventListener,
    );
    return () => {
      window.removeEventListener(
        "ai-builder-open-section-chat",
        onOpenSectionChat as EventListener,
      );
    };
  }, [hasCorePlan, router, siteId, user]);

  useEffect(() => {
    const onOpenAiAssist = (event: Event) => {
      if (!hasCorePlan) {
        if (!user) {
          window.dispatchEvent(
            new CustomEvent("ai-builder-login-required", {
              detail: { intent: "upgrade" },
            }),
          );
          return;
        }
        const planUrl = buildPlanPageUrl(siteId || resolveEditorSiteId());
        rememberEditorForAuthCancel();
        router.push(planUrl);
        return;
      }
      const detail = (
        event as CustomEvent<{ source?: string; hint?: string }>
      ).detail;
      const masterFocusBySource: Record<
        string,
        { sectionId: string; sectionType: string; label: string }
      > = {
        "blog-manager": {
          sectionId: "__master_blog__",
          sectionType: "MasterBlog",
          label: "Blogs",
        },
        "service-manager": {
          sectionId: "__master_service__",
          sectionType: "MasterService",
          label: "Services",
        },
        "gallery-manager": {
          sectionId: "__master_gallery__",
          sectionType: "MasterGallery",
          label: "Gallery",
        },
        "team-manager": {
          sectionId: "__master_team__",
          sectionType: "MasterTeam",
          label: "Teams",
        },
        "portfolio-manager": {
          sectionId: "__master_portfolio__",
          sectionType: "MasterPortfolio",
          label: "Portfolio",
        },
        "event-manager": {
          sectionId: "__master_event__",
          sectionType: "MasterEvent",
          label: "Events",
        },
        "property-manager": {
          sectionId: "__master_property__",
          sectionType: "MasterProperty",
          label: "Property",
        },
        "countries-serve-manager": {
          sectionId: "__master_countries__",
          sectionType: "MasterCountries",
          label: "Countries",
        },
      };
      const masterFocus =
        detail?.source && masterFocusBySource[detail.source]
          ? masterFocusBySource[detail.source]
          : null;
      setChatFocusSection(masterFocus);
      setChatAssistHint(
        typeof detail?.hint === "string" && detail.hint.trim()
          ? detail.hint.trim()
          : null,
      );
      setShowChatBot(true);
    };
    window.addEventListener(
      "ai-builder-open-ai-assist",
      onOpenAiAssist as EventListener,
    );
    return () => {
      window.removeEventListener(
        "ai-builder-open-ai-assist",
        onOpenAiAssist as EventListener,
      );
    };
  }, [hasCorePlan, router, siteId, user]);

  const blogPages = useMemo(
    () => pageLinks.filter((page) => page.kind === "blog"),
    [pageLinks],
  );
  const blogIndexLayout = useMemo(() => {
    const indexLink = pageLinks.find(
      (page) =>
        page.kind === "blogIndex" ||
        page.href.trim().toLowerCase() === "#page-blogs",
    );
    return indexLink?.layout || "BlogIndex-1";
  }, [pageLinks]);

  const blogsWebsiteEnabled = useMemo(() => {
    const indexLink = pageLinks.find(isBlogIndexPageLink);
    return Boolean(indexLink && !indexLink.hidden);
  }, [pageLinks]);

  const setBlogsWebsiteEnabled = (enabled: boolean) => {
    const hasIndex = pageLinks.some(isBlogIndexPageLink);
    if (enabled) {
      const nextLinks = hasIndex
        ? pageLinks.map((page) =>
            isBlogIndexPageLink(page)
              ? {
                  ...page,
                  kind: "blogIndex" as const,
                  href: "#page-blogs",
                  label: page.label || "Blogs",
                  hidden: false,
                  layout: page.layout || blogIndexLayout || "BlogIndex-1",
                }
              : page,
          )
        : [
            ...pageLinks,
            {
              label: "Blogs",
              href: "#page-blogs",
              kind: "blogIndex" as const,
              layout: blogIndexLayout || "BlogIndex-1",
              hidden: false,
            },
          ];
      setPageLinks(nextLinks);
      window.dispatchEvent(
        new CustomEvent("ai-builder-blogs-website-visibility", {
          detail: { enabled: true },
        }),
      );
      return;
    }

    if (hasIndex) {
      setPageLinks(
        pageLinks.map((page) =>
          isBlogIndexPageLink(page)
            ? {
                ...page,
                kind: "blogIndex" as const,
                href: "#page-blogs",
                hidden: true,
              }
            : page,
        ),
      );
    }
    window.dispatchEvent(
      new CustomEvent("ai-builder-blogs-website-visibility", {
        detail: { enabled: false },
      }),
    );
  };

  const setBlogIndexLayout = (layoutId: string) => {
    window.dispatchEvent(
      new CustomEvent("ai-builder-blog-layout-changed", {
        detail: { kind: "index", layout: layoutId },
      }),
    );
    const hasIndex = pageLinks.some(
      (page) =>
        page.kind === "blogIndex" ||
        page.href.trim().toLowerCase() === "#page-blogs",
    );
    // Never recreate a deleted Blogs page from the templates tab — posts stay.
    if (!hasIndex) return;
    setPageLinks(
      pageLinks.map((page) =>
        page.kind === "blogIndex" ||
        page.href.trim().toLowerCase() === "#page-blogs"
          ? { ...page, kind: "blogIndex" as const, layout: layoutId }
          : page,
      ),
    );
  };

  const setBlogDetailLayout = (layoutId: string) => {
    window.dispatchEvent(
      new CustomEvent("ai-builder-blog-layout-changed", {
        detail: { kind: "detail", layout: layoutId },
      }),
    );
    setBlogLayout(layoutId);
    setPageLinks(
      pageLinks.map((page) =>
        page.kind === "blog" ? { ...page, layout: layoutId } : page,
      ),
    );
    pageLinks
      .filter((page) => page.kind === "blog")
      .forEach((blog) => {
        window.dispatchEvent(
          new CustomEvent("ai-builder-blog-updated", {
            detail: { href: blog.href, layout: layoutId },
          }),
        );
      });
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    const panel = consumePostAuthPanel();
    if (panel === "settings") {
      setEditorPanel("settings");
    }
  }, [authLoading, setEditorPanel, user]);

  const multiPageList = pageLinks.filter((page) => page.kind !== "blog");
  const pageItems = multiPageList.map((page) => ({
    label: page.label,
    icon: FileText,
  }));
  const updatedSidebarItems = sidebarItems
    .filter((item) => {
      if (item.label === "Logout" && !user) return false;
      if (item.label === "Pages") return isMultiPageTemplate;
      // Redesign: no template theme marketplace / theme skin panels
      if (
        isRedesignEditor &&
        (item.label === "Theme Color" || item.label === "Theme Fonts")
      ) {
        return false;
      }
      // Single Page Website: hide multi-page-only managers (Countries stays available)
      if (
        !isMultiPageTemplate &&
        ["Services", "Events", "Portfolio", "Gallery", "Teams", "Properties"].includes(
          item.label,
        )
      ) {
        return false;
      }
      // Properties only for Realestate category
      if (item.label === "Properties" && !isRealestateCategory) {
        return false;
      }
      return true;
    })
    .map((item) =>
      item.label === "Pages" ? { ...item, children: pageItems } : item,
    );

  const isHomePage = (page: { label: string; href?: string }) => {
    const href = (page.href || "").trim().toLowerCase();
    return page.label.trim().toLowerCase() === "home" || href === "#";
  };

  const openRenamePage = (label: string) => {
    setPageToRename(label);
    setRenamePageName(label);
  };

  const closeRenamePopup = () => {
    setPageToRename(null);
    setRenamePageName("");
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
    if (!oldLink || isHomePage(oldLink)) return;

    // Allow Blogss → Blogs for the blog index; block other pages taking "blogs".
    if (
      normalizedName === "blogs" &&
      !isBlogIndexPageLink(oldLink) &&
      oldLink.href.trim().toLowerCase() !== "#page-blogs"
    ) {
      return;
    }

    const newHref =
      oldLink.kind === "blogIndex" ||
      oldLink.href.trim().toLowerCase() === "#page-blogs" ||
      normalizedName === "blogs"
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

  const handleConfirmDeletePage = () => {
    if (!pageToDelete) return;

    const removedLink = pageLinks.find((item) => item.label === pageToDelete);
    if (!removedLink || isHomePage(removedLink)) {
      setPageToDelete(null);
      return;
    }

    // Pages delete never removes blog posts — only the Blogs index/nav page.
    const removingBlogIndex = isBlogIndexPageLink(removedLink);
    const nextLinks = pageLinks.filter((item) => {
      if (item.kind === "blog") return true;
      if (removingBlogIndex) return !isBlogIndexPageLink(item);
      return item.label !== pageToDelete;
    });
    setPageLinks(nextLinks);

    if (currentPage === pageToDelete) {
      const nextPage = nextLinks.find(
        (item) => item.kind !== "blog" && item.label !== pageToDelete,
      );
      setCurrentPage(nextPage?.label ?? "Home");
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

  const activeItem = updatedSidebarItems.find(
    (item) => item.label === openItem,
  );

  const navigateToBlogsEditorPage = () => {
    const indexLink = pageLinks.find(isBlogIndexPageLink);
    if (indexLink) {
      setCurrentPage(indexLink.label || "Blogs");
      return;
    }
    setPageLinks([
      ...pageLinks,
      {
        label: "Blogs",
        href: "#page-blogs",
        kind: "blogIndex" as const,
        layout: blogIndexLayout || "BlogIndex-1",
        hidden: false,
      },
    ]);
    window.dispatchEvent(
      new CustomEvent("ai-builder-blogs-website-visibility", {
        detail: { enabled: true },
      }),
    );
    setCurrentPage("Blogs");
  };

  const managerReturnRef = useRef<{ page: string; scrollTop: number } | null>(
    null,
  );
  const [managerPreserveNavigation, setManagerPreserveNavigation] =
    useState(false);

  const captureManagerReturnPoint = () => {
    const scrollContainer = document.querySelector<HTMLElement>(
      "[data-template-scroll]",
    );
    managerReturnRef.current = {
      page: currentPage,
      scrollTop: scrollContainer?.scrollTop ?? window.scrollY,
    };
    setManagerPreserveNavigation(true);
  };

  const restoreManagerReturnPoint = () => {
    setManagerPreserveNavigation(false);
    const saved = managerReturnRef.current;
    managerReturnRef.current = null;
    if (!saved) return;
    setCurrentPage(saved.page);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const scrollContainer = document.querySelector<HTMLElement>(
          "[data-template-scroll]",
        );
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: saved.scrollTop, behavior: "auto" });
          return;
        }
        window.scrollTo({ top: saved.scrollTop, behavior: "auto" });
      });
    });
  };

  const closeManagerModal = (setter: (value: boolean) => void) => {
    setter(false);
    restoreManagerReturnPoint();
  };

  useEffect(() => {
    const onOpenManager = (event: Event) => {
      const detail = (
        event as CustomEvent<{ manager?: string; preservePage?: boolean }>
      ).detail;
      const manager = detail?.manager;
      if (!manager || typeof manager !== "string") return;
      onNavigate?.();
      if (detail?.preservePage) {
        captureManagerReturnPoint();
      } else {
        managerReturnRef.current = null;
        setManagerPreserveNavigation(false);
      }
      if (manager === "Blogs") {
        if (!detail?.preservePage) {
          navigateToBlogsEditorPage();
        }
        setShowBlogModal(true);
        return;
      }
      if (manager === "Services") {
        setShowServiceModal(true);
        return;
      }
      if (manager === "Events") {
        setShowEventModal(true);
        return;
      }
      if (manager === "Properties") {
        setShowPropertyModal(true);
        return;
      }
      if (manager === "Portfolio") {
        setShowPortfolioModal(true);
        return;
      }
      if (manager === "Teams") {
        setShowTeamModal(true);
        return;
      }
      if (manager === "Gallery") {
        setShowGalleryModal(true);
        return;
      }
      if (manager === "Countries") {
        setShowCountriesModal(true);
      }
    };
    window.addEventListener("ai-builder-open-manager", onOpenManager);
    return () =>
      window.removeEventListener("ai-builder-open-manager", onOpenManager);
    // navigateToBlogsEditorPage closes over latest pageLinks/blogIndexLayout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNavigate, pageLinks, blogIndexLayout, currentPage]);

  const handleSidebarClick = async (
    label: string,
    hasChildren: boolean,
    offsetTop: number,
  ) => {
    if (hasChildren) {
      setDropdownAnchor(offsetTop);
      setOpenItem(openItem === label ? null : label);
      return;
    }

    setOpenItem(null);

    if (label === "Dashboard") {
      onNavigate?.();
      if (!user) {
        window.dispatchEvent(
          new CustomEvent("ai-builder-login-required", {
            detail: { intent: "dashboard" },
          }),
        );
        return;
      }
      router.push("/user/dashboard");
      return;
    }

    if (label === "Theme Color") {
      if (isRedesignEditor) return;
      onNavigate?.();
      setEditorPanel("theme-color");
      return;
    }

    if (label === "Theme Fonts") {
      if (isRedesignEditor) return;
      onNavigate?.();
      setEditorPanel("theme-fonts");
      return;
    }

    if (label === "Nav Menu") {
      onNavigate?.();
      window.dispatchEvent(new Event("ai-builder-open-navigation-menu"));
      return;
    }

    if (label === "Blogs") {
      onNavigate?.();
      navigateToBlogsEditorPage();
      setShowBlogModal(true);
      return;
    }

    if (label === "Services") {
      onNavigate?.();
      setShowServiceModal(true);
      return;
    }

    if (label === "Events") {
      onNavigate?.();
      setShowEventModal(true);
      return;
    }

    if (label === "Properties") {
      onNavigate?.();
      setShowPropertyModal(true);
      return;
    }

    if (label === "Portfolio") {
      onNavigate?.();
      setShowPortfolioModal(true);
      return;
    }

    if (label === "Teams") {
      onNavigate?.();
      setShowTeamModal(true);
      return;
    }

    if (label === "Gallery") {
      onNavigate?.();
      setShowGalleryModal(true);
      return;
    }

    if (label === "Countries") {
      onNavigate?.();
      setShowCountriesModal(true);
      return;
    }

    if (label === "Settings") {
      onNavigate?.();
      if (!user) {
        window.dispatchEvent(
          new CustomEvent("ai-builder-login-required", {
            detail: { intent: "settings" },
          }),
        );
        return;
      }
      setEditorPanel("settings");
      return;
    }

    if (label === "Help") {
      onNavigate?.();
      setShowHelpModal(true);
      return;
    }

    if (label === "Upgrade") {
      onNavigate?.();
      const planUrl = buildPlanPageUrl(siteId || resolveEditorSiteId());
      if (!user) {
        window.dispatchEvent(
          new CustomEvent("ai-builder-login-required", {
            detail: { intent: "upgrade" },
          }),
        );
        return;
      }
      rememberEditorForAuthCancel();
      router.push(planUrl);
      return;
    }

    if (label === "AI Assist") {
      onNavigate?.();
      setChatFocusSection(null);
      setChatAssistHint(null);
      setShowChatBot((current) => !current);
      return;
    }

    if (label === "Logout") {
      onNavigate?.();
      await logout();
      router.push("/");
      return;
    }
  };

  const handleAddPage = () => {
    if (!pageName.trim()) return;
    const trimmedPageName = pageName.trim();
    const normalizedPageName = trimmedPageName.toLowerCase();
    const alreadyExists = pageLinks.some(
      (page) => page.label.trim().toLowerCase() === normalizedPageName,
    );

    if (!alreadyExists) {
      const href = createPageHref(trimmedPageName, isMultiPageTemplate);
      setPageLinks([...pageLinks, { label: trimmedPageName, href }]);
      window.dispatchEvent(
        new CustomEvent("ai-builder-page-added", {
          detail: {
            label: trimmedPageName,
            href,
          },
        }),
      );
    }

    setCurrentPage(trimmedPageName);

    setPageName("");
    setShowPageModal(false);
    setOpenItem("Pages");
  };

  const handleAddBlog = (input: NewBlogPostInput) => {
    const title = input.title.trim();
    if (!title) return;
    const baseSlug =
      toBlogSlugFromInput(input.slug) ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
      "post";
    const slug = uniqueBlogSlug(pageLinks, baseSlug);
    const blog = {
      label: title,
      href: `#page-blog-${slug}`,
      kind: "blog" as const,
      slug,
      layout: input.layout,
      author: input.author,
      image: input.image,
      shortDescription: input.shortDescription,
      longDescription: input.longDescription,
      category: input.category,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      createdAt:
        input.createdAt ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      order: input.order,
      hidden: input.hidden,
    };
    const hasBlogPosts = pageLinks.some((page) => page.kind === "blog");
    const hasBlogsNavigation = pageLinks.some(
      (page) =>
        page.kind === "blogIndex" ||
        (page.kind !== "blog" &&
          (page.href.trim().toLowerCase() === "#page-blogs" ||
            page.label.trim().toLowerCase() === "blogs")),
    );
    const nextLinks =
      !hasBlogPosts && !hasBlogsNavigation
        ? [
            ...pageLinks,
            {
              label: "Blogs",
              href: "#page-blogs",
              kind: "blogIndex" as const,
              layout: blogIndexLayout || "BlogIndex-1",
            },
          ]
        : pageLinks;

    // The index link and the post records deliberately remain separate. Removing
    // "Blogs" from navigation must never remove the user's saved posts.
    setPageLinks([...nextLinks, blog]);
    setBlogTitle("");
    setBlogLayout(input.layout);
  };

  const updateBlog = (href: string, patch: Partial<PageLink>) => {
    setPageLinks(
      pageLinks.map((page) => {
        if (page.href !== href) return page;

        const next = { ...page, ...patch };
        if (typeof patch.slug === "string" && patch.slug.trim()) {
          const slug = uniqueBlogSlug(
            pageLinks,
            toBlogSlugFromInput(patch.slug) || "post",
            href,
          );
          next.slug = slug;
          next.href = `#page-blog-${slug}`;
        }
        return next;
      }),
    );
    window.dispatchEvent(
      new CustomEvent("ai-builder-blog-updated", { detail: { href, ...patch } }),
    );
  };

  const deleteBlog = (blog: (typeof pageLinks)[number]) => {
    setPageLinks((current) =>
      current.filter((page) => page.href !== blog.href),
    );
    window.dispatchEvent(
      new CustomEvent("ai-builder-page-removed", {
        detail: {
          label: blog.label,
          href: blog.href,
          kind: "blog" as const,
        },
      }),
    );
  };

  const deleteBlogs = (blogsToRemove: Array<(typeof pageLinks)[number]>) => {
    if (!blogsToRemove.length) return;
    const hrefSet = new Set(blogsToRemove.map((blog) => blog.href));
    setPageLinks((current) =>
      current.filter((page) => !hrefSet.has(page.href)),
    );
    for (const blog of blogsToRemove) {
      window.dispatchEvent(
        new CustomEvent("ai-builder-page-removed", {
          detail: {
            label: blog.label,
            href: blog.href,
            kind: "blog" as const,
          },
        }),
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenItem(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const flyoutRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !dropdownRef.current) return;
      const rootHeight = dropdownRef.current.clientHeight;
      const menuHeight = node.offsetHeight;
      const buttonHeight = 40;
      const spaceBelow = rootHeight - dropdownAnchor - 8;
      const shouldOpenUp =
        openItem === "Page SEO" || menuHeight > spaceBelow;
      const nextTop = shouldOpenUp
        ? dropdownAnchor + buttonHeight - menuHeight
        : dropdownAnchor;
      node.style.top = `${Math.min(
        Math.max(8, nextTop),
        Math.max(8, rootHeight - menuHeight - 8),
      )}px`;
    },
    [openItem, dropdownAnchor],
  );

  const pinnedLabels = new Set(["Settings", "Help", "Logout"]);
  const navItems = updatedSidebarItems.filter(
    (item) => !pinnedLabels.has(item.label),
  );
  const pinnedItems = updatedSidebarItems.filter((item) =>
    pinnedLabels.has(item.label),
  );

  const renderSidebarButton = (
    item: (typeof updatedSidebarItems)[number],
  ) => {
    const Icon = item.icon;
    const hasChildren = !!item.children?.length;
    const isLogout = item.label.toLowerCase() === "logout";
    const isActive =
      (item.label === "Theme Color" && editorPanel === "theme-color") ||
      (item.label === "Theme Fonts" && editorPanel === "theme-fonts") ||
      (item.label === "Settings" && editorPanel === "settings") ||
      (item.label === "Page SEO" &&
        !!editorPanel &&
        editorPanel.startsWith("seo-"));

    return (
      <button
        key={item.label}
        type="button"
        onClick={(event) => {
          const root = dropdownRef.current;
          const top = root
            ? event.currentTarget.getBoundingClientRect().top -
              root.getBoundingClientRect().top
            : event.currentTarget.offsetTop;
          void handleSidebarClick(item.label, hasChildren, top);
        }}
        className={`group flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
          isLogout
            ? "bg-red-200 py-3 text-lg text-red-500 hover:bg-red-700 hover:text-white"
            : isActive
              ? "bg-blue-50 text-blue-700"
              : "bg-white text-gray-500 hover:bg-gray-200"
        }`}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <Icon
            size={16}
            className={
              isLogout
                ? "text-red-500 group-hover:text-white"
                : "text-gray-600"
            }
          />
        </span>

        {!collapsed && (
          <>
            <span
              className={`text-sm ${
                isLogout
                  ? "text-red-700 group-hover:text-white"
                  : "text-gray-700"
              }`}
            >
              {item.label}
            </span>

            {hasChildren && (
              <ArrowRight
                size={16}
                className="ml-auto shrink-0 text-gray-700"
              />
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      <div
        ref={dropdownRef}
        className="relative flex h-full min-h-0 flex-col overflow-visible p-2"
      >
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-2 [scrollbar-width:thin]">
          {navItems.map((item) => renderSidebarButton(item))}
        </div>

        <div className="mt-2 shrink-0 space-y-1 border-t border-gray-100 pt-2">
          {pinnedItems
            .filter((item) => item.label !== "Logout")
            .map((item) => renderSidebarButton(item))}

          {/* Upgrade (Starter) ↔ AI Assist (Core premium) */}
          <button
            type="button"
            onClick={() =>
              void handleSidebarClick(
                hasCorePlan ? "AI Assist" : "Upgrade",
                false,
                0,
              )
            }
            className={`group flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
              hasCorePlan
                ? showChatBot
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
            }`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              {hasCorePlan ? (
                <Sparkles
                  size={16}
                  className={showChatBot ? "text-white" : "text-zinc-700"}
                />
              ) : (
                <Rocket size={16} className="text-white" />
              )}
            </span>
            {!collapsed ? (
              <span
                className={`text-sm font-medium ${
                  hasCorePlan
                    ? showChatBot
                      ? "text-white"
                      : "text-zinc-800"
                    : "text-white"
                }`}
              >
                {hasCorePlan ? "AI Assist" : "Upgrade"}
              </span>
            ) : null}
          </button>

          {pinnedItems
            .filter((item) => item.label === "Logout")
            .map((item) => renderSidebarButton(item))}
        </div>

        {activeItem?.children && (
          <div
            ref={flyoutRef}
            className={`absolute left-full z-[220] ml-2 max-h-[calc(100%-16px)] overflow-y-auto rounded border border-gray-300 bg-white p-2 shadow-xl ${
              activeItem.label === "Pages" ? "w-60 md:w-56" : "w-52 md:w-48"
            }`}
          >
            <button
              onClick={() => setOpenItem(null)}
              className="absolute right-1 top-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 pt-5">
              {activeItem.label === "Pages" ? (
                <>
                  <div className="max-h-[20rem] space-y-1 overflow-y-auto overscroll-contain pr-0.5">
                    {multiPageList.map((page) => {
                      const isHome = isHomePage(page);
                      const isActive = currentPage === page.label;

                      return (
                        <div
                          key={`${page.label}-${page.href}`}
                          className={`flex w-full items-center rounded-md ${
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-50/50 hover:bg-gray-200"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPage(page.label);
                              setOpenItem(null);
                              onNavigate?.();
                            }}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-2 text-left"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                              <FileText size={15} />
                            </span>
                            <span className="truncate text-sm">{page.label}</span>
                          </button>
                          {!isHome ? (
                            <div className="mr-1 flex shrink-0 items-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openRenamePage(page.label);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-800"
                                aria-label={`Rename ${page.label}`}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPageToDelete(page.label);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                                aria-label={`Delete ${page.label}`}
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPageModal(true)}
                    className="mt-2 flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    <Plus size={15} />
                    Add More
                  </button>
                </>
              ) : (
                activeItem.children.map((child, index) => {
                  const Icon = child.icon;
                  const panel =
                    "panel" in child
                      ? (child.panel as
                          | "seo-meta"
                          | "seo-og"
                          | "seo-schema"
                          | "seo-sitemap"
                          | "seo-robots"
                          | undefined)
                      : undefined;
                  const childActive = panel && editorPanel === panel;

                  return (
                    <button
                      key={`${child.label}-${index}`}
                      type="button"
                      onClick={() => {
                        if (panel) {
                          setEditorPanel(panel);
                          setOpenItem(null);
                          onNavigate?.();
                          return;
                        }
                      }}
                      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left ${
                        childActive
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-50/50 hover:bg-gray-200"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                        <Icon size={15} />
                      </span>

                      <span className="text-sm">{child.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showPageModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px]"
          onClick={() => setShowPageModal(false)}
        >
          <div
            className="w-[90%] max-w-md rounded-xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Add New Page
              </h2>

              <button
                onClick={() => setShowPageModal(false)}
                className="cursor-pointer rounded-full bg-gray-100 p-1 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <input
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              placeholder="Enter page name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            />

            <button
              onClick={handleAddPage}
              className="mt-4 w-full cursor-pointer rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Page
            </button>
          </div>
        </div>
      )}

      {pageToRename && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
          onClick={closeRenamePopup}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleRenamePage();
            }}
            onClick={(event) => event.stopPropagation()}
            className="w-[90%] max-w-md rounded-xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Rename “{pageToRename}”
              </h2>
              <button
                type="button"
                onClick={closeRenamePopup}
                className="cursor-pointer rounded-full bg-gray-100 p-1 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>
            <input
              value={renamePageName}
              onChange={(e) => setRenamePageName(e.target.value)}
              placeholder="New page name"
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              disabled={!renamePageName.trim()}
              className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${
                renamePageName.trim()
                  ? "cursor-pointer bg-black hover:bg-gray-800"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              Save
            </button>
          </form>
        </div>
      )}

      {pageToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete {pageToDelete}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              Are you sure you want to delete “{pageToDelete}”?
            </h3>
            {(pageToDelete.trim().toLowerCase() === "blogs" ||
              pageToDelete.trim().toLowerCase() === "blog" ||
              pageLinks.some(
                (page) =>
                  page.label === pageToDelete && isBlogIndexPageLink(page),
              )) && (
              <p className="mt-2 text-sm text-slate-600">
                Blog posts will stay saved. Only the Blogs page and menu link
                are removed.
              </p>
            )}
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
        </div>
      )}

      {showHelpModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editor-help-title"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <CircleHelp size={20} />
                </span>
                <div>
                  <h2
                    id="editor-help-title"
                    className="text-lg font-semibold text-slate-950"
                  >
                    Editor Help
                  </h2>
                  <p className="text-sm text-slate-500">
                    Quick tips for editing your website.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                aria-label="Close help"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p className="rounded-xl bg-slate-50 px-4 py-3">
                Click any text to edit it and open the formatting toolbar.
              </p>
              <p className="rounded-xl bg-slate-50 px-4 py-3">
                Hover an image or button to reveal its edit control.
              </p>
              <p className="rounded-xl bg-slate-50 px-4 py-3">
                Your content changes are saved automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <EditorChatBot
        open={showChatBot && hasCorePlan}
        onClose={() => {
          setShowChatBot(false);
          setChatFocusSection(null);
          setChatAssistHint(null);
        }}
        sidebarCollapsed={collapsed}
        mobile={mobile}
        siteId={siteId || "draft"}
        category={searchParams.get("category") || undefined}
        isSinglePageTemplate={!isMultiPageTemplate}
        focusSection={chatFocusSection}
        initialHint={chatAssistHint}
      />

      {showBlogModal && (
        <BlogManager
          blogs={blogPages}
          siteId={searchParams.get("siteId") || "draft"}
          authorName={user?.name || user?.email || "Website author"}
          draftTitle={blogTitle}
          draftLayout={blogLayout}
          indexLayout={blogIndexLayout}
          blogsWebsiteEnabled={blogsWebsiteEnabled}
          onBlogsWebsiteEnabledChange={setBlogsWebsiteEnabled}
          onDraftTitleChange={setBlogTitle}
          onDraftLayoutChange={setBlogLayout}
          onIndexLayoutChange={setBlogIndexLayout}
          onApplyDetailLayout={setBlogDetailLayout}
          onAddBlog={handleAddBlog}
          onUpdateBlog={updateBlog}
          onDeleteBlog={deleteBlog}
          onDeleteBlogs={deleteBlogs}
          onClose={() => closeManagerModal(setShowBlogModal)}
        />
      )}

      {showServiceModal && (
        <ServiceManager
          siteId={searchParams.get("siteId") || "draft"}
          preserveNavigation={managerPreserveNavigation}
          onClose={() => closeManagerModal(setShowServiceModal)}
        />
      )}

      {showEventModal && (
        <EventManager
          siteId={searchParams.get("siteId") || "draft"}
          onClose={() => closeManagerModal(setShowEventModal)}
        />
      )}

      {showPropertyModal && (
        <PropertyManager
          siteId={searchParams.get("siteId") || "draft"}
          preserveNavigation={managerPreserveNavigation}
          onClose={() => closeManagerModal(setShowPropertyModal)}
        />
      )}

      {showPortfolioModal && (
        <PortfolioManager
          siteId={searchParams.get("siteId") || "draft"}
          preserveNavigation={managerPreserveNavigation}
          onClose={() => closeManagerModal(setShowPortfolioModal)}
        />
      )}

      {showTeamModal && (
        <TeamManager
          siteId={searchParams.get("siteId") || "draft"}
          onClose={() => closeManagerModal(setShowTeamModal)}
        />
      )}

      {showGalleryModal && (
        <GalleryManager
          siteId={searchParams.get("siteId") || "draft"}
          onClose={() => closeManagerModal(setShowGalleryModal)}
        />
      )}

      {showCountriesModal && (
        <CountriesServeManager
          siteId={searchParams.get("siteId") || "draft"}
          onClose={() => closeManagerModal(setShowCountriesModal)}
        />
      )}
    </>
  );
}
