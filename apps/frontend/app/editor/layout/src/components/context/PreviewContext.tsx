"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_SITE_SEO,
  getGlobalSeo,
  getPageSeo,
  normalizeSiteSeoConfig,
  patchGlobalSeo as mergeGlobalSeo,
  patchPageSeo as mergePageSeo,
  type SiteSeoConfig,
  type SiteSeoSettings,
} from "@/lib/siteSeo";
import {
  activateFlowPreviewStorage,
  detectEditorPreviewFlow,
  LEGACY_CURRENT_PAGE_KEY,
  LEGACY_PAGE_LINKS_KEY,
  mirrorActiveFlowCurrentPage,
  mirrorActiveFlowPageLinks,
} from "@/lib/flowPreviewStorage";

export type PageLink = {
  label: string;
  href: string;
  children?: PageLink[];
  /** Nav item presentation: plain link, dropdown, or mega menu */
  menuType?: "link" | "dropdown" | "mega";
  kind?: "page" | "blogIndex" | "blog" | "document";
  hidden?: boolean;
  layout?: string;
  author?: string;
  image?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt?: string;
  order?: number;
};

export type EditorPanel =
  | "theme-color"
  | "theme-fonts"
  | "settings"
  | "seo-meta"
  | "seo-og"
  | "seo-schema"
  | "seo-sitemap"
  | "seo-robots"
  | null;

const defaultPageLinks: PageLink[] = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];
const currentPageStorageKey = LEGACY_CURRENT_PAGE_KEY;
const pageLinksStorageKey = LEGACY_PAGE_LINKS_KEY;

function pageLinkLabels(links: PageLink[]): Set<string> {
  const labels = new Set<string>();
  const walk = (items: PageLink[]) => {
    for (const item of items) {
      const label = (item.label || "").trim();
      if (label) labels.add(label.toLowerCase());
      if (item.children?.length) walk(item.children);
    }
  };
  walk(links);
  return labels;
}

/** Keep localStorage under quota — never persist heavy blog bodies / data-URLs. */
const slimPageLinkForStorage = (link: PageLink): PageLink => {
  const image =
    typeof link.image === "string" &&
    link.image.length > 0 &&
    link.image.length < 500 &&
    !link.image.startsWith("data:")
      ? link.image
      : undefined;

  return {
    label: link.label,
    href: link.href,
    menuType: link.menuType,
    kind: link.kind,
    hidden: link.hidden,
    layout: link.layout,
    author: link.author,
    image,
    slug: link.slug,
    shortDescription: link.shortDescription
      ? link.shortDescription.slice(0, 400)
      : undefined,
    category: link.category,
    seoTitle: link.seoTitle,
    seoDescription: link.seoDescription
      ? link.seoDescription.slice(0, 300)
      : undefined,
    seoKeywords: link.seoKeywords,
    createdAt: link.createdAt,
    order: link.order,
    children: link.children?.map(slimPageLinkForStorage),
  };
};

const getStoredCurrentPage = () => {
  if (typeof window === "undefined") return "Home";
  try {
    // Activate the URL's flow before first read so redesign/custom don't share page.
    activateFlowPreviewStorage(detectEditorPreviewFlow());
    const stored = window.localStorage.getItem(currentPageStorageKey)?.trim();
    return stored || "Home";
  } catch {
    return "Home";
  }
};

const getStoredPageLinks = () => {
  if (typeof window === "undefined") return defaultPageLinks;

  try {
    activateFlowPreviewStorage(detectEditorPreviewFlow());
  } catch {
    /* ignore */
  }

  const storedValue = window.localStorage.getItem(pageLinksStorageKey);
  if (!storedValue) return defaultPageLinks;

  try {
    const parsedValue = JSON.parse(storedValue) as PageLink[];

    return Array.isArray(parsedValue) && parsedValue.length
      ? parsedValue
      : defaultPageLinks;
  } catch {
    return defaultPageLinks;
  }
};

type PreviewContextType = {
  isPreview: boolean;
  viewportMode: "desktop" | "mobile";
  currentPage: string;
  pageLinks: PageLink[];
  themeVariables: Record<string, string>;
  /** Meta / OG for the active editor page */
  siteSeo: SiteSeoSettings;
  /** Site-wide SEO (schema, sitemap, robots) */
  globalSeo: SiteSeoSettings;
  siteSeoConfig: SiteSeoConfig;
  editorPanel: EditorPanel;
  isContentEditing: boolean;
  /** Optional RealEstate catalog filters (imported layouts). */
  activePropertyType?: string;
  setActivePropertyType?: (value: string) => void;
  activePortfolioFilter?: string;
  setActivePortfolioFilter?: (value: string) => void;
  activeRentalTab?: "all" | "sale" | "rent";
  setActiveRentalTab?: (value: "all" | "sale" | "rent") => void;
  activeRentalPage?: number;
  setActiveRentalPage?: (value: number) => void;
  setActiveRentalItemsPerPage?: (value: number) => void;
  setViewportMode: (mode: "desktop" | "mobile") => void;
  setCurrentPage: (page: string) => void;
  setPageLinks: (links: PageLink[]) => void;
  setThemeVariables: (vars: Record<string, string>) => void;
  patchThemeVariable: (key: string, value: string) => void;
  setSiteSeoConfig: (config: unknown) => void;
  /** @deprecated use setSiteSeoConfig */
  setSiteSeo: (seo: SiteSeoSettings) => void;
  patchSiteSeo: (patch: Partial<SiteSeoSettings>) => void;
  patchGlobalSeo: (patch: Partial<SiteSeoSettings>) => void;
  setEditorPanel: (panel: EditorPanel) => void;
  setIsContentEditing: (editing: boolean) => void;
  togglePreview: () => void;
};

const PreviewContext = createContext<PreviewContextType | null>(null);

export function PreviewProvider({
  children,
  initialCurrentPage,
  initialPageLinks,
}: {
  children: React.ReactNode;
  initialCurrentPage?: string;
  initialPageLinks?: PageLink[];
}) {
  const searchParams = useSearchParams();
  const flowKey = detectEditorPreviewFlow(
    searchParams ? `?${searchParams.toString()}` : undefined,
  );
  const [isPreview, setIsPreview] = useState(false);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [currentPage, setCurrentPage] = useState(
    () => initialCurrentPage || getStoredCurrentPage(),
  );
  const [pageLinks, setPageLinks] = useState<PageLink[]>(
    () => initialPageLinks || getStoredPageLinks(),
  );
  const [themeVariables, setThemeVariablesState] = useState<
    Record<string, string>
  >({});
  const [siteSeoConfig, setSiteSeoConfigState] = useState<SiteSeoConfig>({
    ...DEFAULT_SITE_SEO,
    pages: {},
  });
  const [editorPanel, setEditorPanel] = useState<EditorPanel>(null);
  const [isContentEditing, setIsContentEditing] = useState(false);

  const siteSeo = useMemo(
    () => getPageSeo(siteSeoConfig, currentPage),
    [siteSeoConfig, currentPage],
  );
  const globalSeo = useMemo(
    () => getGlobalSeo(siteSeoConfig),
    [siteSeoConfig],
  );

  const setThemeVariables = useCallback((vars: Record<string, string>) => {
    setThemeVariablesState(vars);
  }, []);

  const patchThemeVariable = useCallback((key: string, value: string) => {
    setThemeVariablesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setSiteSeoConfig = useCallback((config: unknown) => {
    setSiteSeoConfigState(normalizeSiteSeoConfig(config));
  }, []);

  const setSiteSeo = useCallback((seo: SiteSeoSettings) => {
    setSiteSeoConfigState(normalizeSiteSeoConfig(seo));
  }, []);

  const patchSiteSeo = useCallback(
    (patch: Partial<SiteSeoSettings>) => {
      setSiteSeoConfigState((prev) => mergePageSeo(prev, currentPage, patch));
    },
    [currentPage],
  );

  const patchGlobalSeo = useCallback((patch: Partial<SiteSeoSettings>) => {
    setSiteSeoConfigState((prev) => mergeGlobalSeo(prev, patch));
  }, []);

  const popstateNavigatingRef = useRef(false);

  const setCurrentPageWithHistory = useCallback(
    (page: string) => {
      setCurrentPage(page);
      if (typeof window !== "undefined" && !popstateNavigatingRef.current) {
        window.history.pushState({ editorPage: page }, "", window.location.href);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = (e: PopStateEvent) => {
      const page = e.state?.editorPage;
      if (typeof page === "string") {
        popstateNavigatingRef.current = true;
        setCurrentPage(page);
        // Reset after current event loop so subsequent user clicks are not blocked
        setTimeout(() => { popstateNavigatingRef.current = false; }, 0);
      }
    };
    // Seed initial state so first back works
    if (!window.history.state?.editorPage) {
      window.history.replaceState(
        { ...window.history.state, editorPage: currentPage },
        "",
        window.location.href,
      );
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mirrorActiveFlowCurrentPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const slimLinks = pageLinks.map(slimPageLinkForStorage);
    mirrorActiveFlowPageLinks(slimLinks);
  }, [pageLinks]);

  // Drop stale page from another flow (e.g. Redesign "Pricing" → Custom).
  useEffect(() => {
    if (!pageLinks.length) return;
    const labels = pageLinkLabels(pageLinks);
    const current = (currentPage || "").trim().toLowerCase();
    if (!current || current === "home") return;
    if (labels.has(current)) return;
    setCurrentPage("Home");
  }, [pageLinks, currentPage]);

  // When URL switches redesign ↔ custom without remounting the provider, re-activate.
  useEffect(() => {
    activateFlowPreviewStorage(flowKey);
    try {
      const raw = window.localStorage.getItem(pageLinksStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PageLink[];
        if (Array.isArray(parsed) && parsed.length) {
          setPageLinks(parsed);
        }
      }
      const page =
        window.localStorage.getItem(currentPageStorageKey)?.trim() || "Home";
      setCurrentPage(page);
    } catch {
      /* ignore */
    }
  }, [flowKey]);

  return (
    <PreviewContext.Provider
      value={{
        isPreview,
        viewportMode,
        currentPage,
        pageLinks,
        themeVariables,
        siteSeo,
        globalSeo,
        siteSeoConfig,
        editorPanel,
        isContentEditing,
        setViewportMode,
        setCurrentPage: setCurrentPageWithHistory,
        setPageLinks,
        setThemeVariables,
        patchThemeVariable,
        setSiteSeoConfig,
        setSiteSeo,
        patchSiteSeo,
        patchGlobalSeo,
        setEditorPanel,
        setIsContentEditing,
        togglePreview: () => setIsPreview((prev) => !prev),
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);

  if (!context) {
    throw new Error("usePreview must be used inside PreviewProvider");
  }

  return context;
}

export function useOptionalPreview() {
  return useContext(PreviewContext);
}

export function useEditorContentPaused() {
  return useContext(PreviewContext)?.isContentEditing ?? false;
}
