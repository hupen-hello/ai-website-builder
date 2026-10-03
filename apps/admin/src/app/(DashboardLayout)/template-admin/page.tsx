"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { swalConfirm, swalError, swalSuccess } from "@/lib/swal";

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

const HOME_SECTIONS = [
  "Topbar",
  "Header",
  "Banner",
  "Features",
  "Highlight",
  "Featured",
  "LatestProject",
  "Cities",
  "About",
  "Product",
  "WhyChooseUs",
  "FeaturedDev",
  "FeaturedDevelopers",
  "PropertySearch",
  "PropertyGrid",
  "Process",
  "Gallery",
  "FormDetail",
  "Awards",
  "Stats",
  "Blog",
  "FAQ",
  "Testimonial",
  "Contact",
  "CtaBanner",
  "Team",
  "MissionVision",
  "InvestmentOpportunities",
  "Footer",
];

const PAGE_SECTIONS = [
  "AboutPage",
  "ServicePage",
  "EventPage",
  "PropertyPage",
  "PortfolioPage",
  "TeamPage",
  "GalleryPage",
  "ContactPage",
  "AwardsPage",
  "MissionPage",
  "VisionPage",
  "CsrPage",
  "CareerPage",
  "RentPage",
  "BuyPropertyPage",
  "BlogPage",
  "BlogDetail",
  "SitemapPage",
  "PrivacyPage",
  "TermsPage",
  "DisclaimerPage",
  "CookiePolicyPage",
  "RefundPolicyPage",
  "CustomPage",
  "TestimonialPage",
  "PartnerPage",
  "TeamDetail",
  "CareerJobs",
  "CareerCta",
  "CareerApplication",
  "EnquiryPage",
  "BrochurePage",
  "QuotePage",
  "CsrPrograms",
  "CsrCta",
  "ContactMap",
  "ContactFeatures",
  "PricingPage",
  "PricingTable",
  "PricingHelp",
  "FaqPage",
  "IndustriesPage",
  "WhyPartner",
  "IndustryDetail",
  "PropertyDetail",
  "ProjectDetail",
  "PageBanner",
  "PackagePage",
  "ServiceDetail",
  "PropertyGrid",
];

const PAGE_BODIES_WITH_OWN_BREADCRUMB = new Set([
  "AboutPage-5",
  "AboutPage-6",
  "ServicePage-5",
  "ServicePage-6",
  "GalleryPage-6",
  "ContactPage-5",
  "ContactPage-6",
  "PropertyPage-5",
  "PropertyPage-6",
  "PortfolioPage-5",
  "PortfolioPage-6",
  "AwardsPage-5",
  "AwardsPage-6",
  "MissionPage-5",
  "MissionPage-6",
  "CsrPage-5",
  "CsrPage-6",
  "CareerPage-5",
  "CareerPage-6",
  "RentPage-5",
  "RentPage-6",
  "BuyPropertyPage-5",
  "BuyPropertyPage-6",
  "BlogPage-6",
  "SitemapPage-5",
  "SitemapPage-6",
  "PrivacyPage-5",
  "PrivacyPage-6",
  "TermsPage-5",
  "TermsPage-6",
  "DisclaimerPage-5",
  "DisclaimerPage-6",
  "CookiePolicyPage-5",
  "CookiePolicyPage-6",
  "RefundPolicyPage-5",
  "RefundPolicyPage-6",
  "CustomPage-1",
  "CustomPage-2",
  "CustomPage-3",
  "CustomPage-4",
  "CustomPage-5",
  "CustomPage-6",
]);

/** Shared on every inner page (multi-page templates) */
const INNER_PAGE_CHROME = ["Breadcrumb"];

/** Home chrome + page body, Footer last so inner pages wrap correctly */
const SECTION_ORDER = [
  "Topbar",
  "Header",
  "Breadcrumb",
  "Banner",
  "Features",
  "Highlight",
  "Featured",
  "LatestProject",
  "Cities",
  "About",
  "Product",
  "WhyChooseUs",
  "FeaturedDev",
  "FeaturedDevelopers",
  "PropertySearch",
  "PropertyGrid",
  "Process",
  "Gallery",
  "FormDetail",
  "Awards",
  "Stats",
  "Blog",
  "FAQ",
  "Testimonial",
  "Contact",
  "CtaBanner",
  "Team",
  "MissionVision",
  "InvestmentOpportunities",
  "CountriesServe",
  ...PAGE_SECTIONS,
  "Footer",
];

type TemplatePage = {
  id: string;
  label: string;
  sectionType: string;
  submenu?: boolean;
};

const DESKTOP_PREVIEW_WIDTH = 1280;

function DesktopPreviewFrame({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = size.w > 0 ? size.w / DESKTOP_PREVIEW_WIDTH : 1;

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-white">
      <iframe
        title={title}
        src={src}
        className="border-0 bg-white origin-top-left"
        style={{
          width: DESKTOP_PREVIEW_WIDTH,
          height: scale > 0 ? Math.max(size.h / scale, 800) : 800,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

const DEFAULT_MULTI_PAGES: TemplatePage[] = [
  { id: "about", label: "About", sectionType: "AboutPage" },
  { id: "services", label: "Services", sectionType: "ServicePage" },
  { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
  { id: "contact", label: "Contact", sectionType: "ContactPage" },
];

function slugifyPageId(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function snapshotBuilder(data: {
  title: string;
  key: string;
  numericId: number;
  type: string;
  previewDescription: string;
  pages: TemplatePage[];
  sectionVariants: Record<string, string>;
  homeSectionOrder?: string[];
  categories: string[];
  status: string;
}) {
  return JSON.stringify({
    title: data.title,
    key: data.key,
    numericId: data.numericId,
    type: data.type,
    previewDescription: data.previewDescription,
    pages: data.pages,
    sectionVariants: data.sectionVariants,
    homeSectionOrder: data.homeSectionOrder || [],
    categories: data.categories,
    status: data.status,
  });
}

const LOCKED_HOME_SECTIONS = new Set(["Topbar", "Header", "Footer"]);

function mergeHomeSectionOrder(order?: string[] | null) {
  const seen = new Set<string>();
  const middle: string[] = [];
  const source =
    Array.isArray(order) && order.length ? order : HOME_SECTIONS;
  for (const type of source) {
    if (!HOME_SECTIONS.includes(type) || seen.has(type)) continue;
    seen.add(type);
    if (LOCKED_HOME_SECTIONS.has(type)) continue;
    middle.push(type);
  }
  for (const type of HOME_SECTIONS) {
    if (seen.has(type) || LOCKED_HOME_SECTIONS.has(type)) continue;
    middle.push(type);
  }
  const next: string[] = [];
  if (HOME_SECTIONS.includes("Topbar")) next.push("Topbar");
  if (HOME_SECTIONS.includes("Header")) next.push("Header");
  next.push(...middle);
  if (HOME_SECTIONS.includes("Footer")) next.push("Footer");
  return next;
}

function normalizePages(raw: unknown): TemplatePage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === "object")
    .map((p) => {
      const row = p as Record<string, unknown>;
      const label = String(row.label || "").trim();
      const id = String(row.id || slugifyPageId(label) || "").trim();
      const sectionType = String(row.sectionType || "CustomPage").trim();
      return {
        id,
        label,
        sectionType,
        submenu: row.submenu === true,
      };
    })
    .filter((p) => p.id && p.label);
}

/** UI labels — Product section shown as Service */
const SECTION_TYPE_LABELS: Record<string, string> = {
  Product: "Service",
  AboutPage: "About Page",
  ServicePage: "Service Page",
  GalleryPage: "Gallery Page",
  ContactPage: "Contact Page",
  CustomPage: "Custom Page",
  Breadcrumb: "Breadcrumb",
  WhyChooseUs: "Why Choose Us",
  FormDetail: "Form Detail",
  PropertySearch: "Property Search",
  PropertyGrid: "Property Grid",
  FeaturedDevelopers: "Featured Developers",
  CtaBanner: "CTA Banner",
  MissionVision: "Mission & Vision",
  PageBanner: "Page Banner",
  BlogDetail: "Blog Detail",
  VisionPage: "Vision Page",
  TestimonialPage: "Testimonials Page",
  PartnerPage: "Partners Page",
  TeamDetail: "Team Detail",
  CareerJobs: "Career Jobs",
  CareerCta: "Career CTA",
  EnquiryPage: "Enquiry Page",
  BrochurePage: "Brochure Page",
  QuotePage: "Quote Page",
  PricingPage: "Pricing Page",
  PricingTable: "Pricing Table",
  PricingHelp: "Pricing Help",
  FaqPage: "FAQ Page",
  IndustriesPage: "Industries Page",
  WhyPartner: "Why Partner",
  PropertyDetail: "Property Detail",
  ProjectDetail: "Project Detail",
  PackagePage: "Package Page",
  ServiceDetail: "Service Detail",
};

function sectionTypeLabel(type: string) {
  return SECTION_TYPE_LABELS[type] || type;
}

const DISTINCT_VARIANT_6 = new Set(["BlogPage", "GalleryPage"]);

const REALESTATE_LAYOUT_NAMES: Record<string, string> = {
  "BlogPage-6": "Realestate Blog Page",
  "GalleryPage-6": "Realestate Gallery Page",
  "CustomPage-1": "Custom Page 1",
  "CustomPage-2": "Custom Page 2",
  "CustomPage-3": "Custom Page 3",
  "CustomPage-4": "Custom Page 4",
  "CustomPage-5": "Custom Page 5",
};

function fallbackPageLayouts(sectionType: string): LayoutRow[] {
  if (!PAGE_SECTIONS.includes(sectionType) && sectionType !== "Breadcrumb") {
    return [];
  }
  const numbers =
    sectionType === "CustomPage"
      ? [1, 2, 3, 4, 5]
      : DISTINCT_VARIANT_6.has(sectionType)
        ? [4, 5, 6]
        : [4, 5];
  return numbers.map((n) => {
    const key = `${sectionType}-${n}`;
    return {
      _id: key,
      key,
      name:
        REALESTATE_LAYOUT_NAMES[key] ||
        (DISTINCT_VARIANT_6.has(sectionType)
          ? `${sectionTypeLabel(sectionType)} ${n === 5 ? "1" : "2"}`
          : sectionType === "CustomPage"
            ? `Custom Page ${n}`
            : sectionTypeLabel(sectionType)),
      sectionType,
    };
  });
}

function uniqueSectionLayouts(
  sectionType: string,
  rows: LayoutRow[],
): LayoutRow[] {
  const prefix = `${sectionType}-`;
  const byKey = new Map<string, LayoutRow>();
  for (const row of rows) {
    if (row.sectionType !== sectionType && !row.key.startsWith(prefix)) continue;
    if (!byKey.has(row.key)) {
      byKey.set(row.key, {
        ...row,
        name: REALESTATE_LAYOUT_NAMES[row.key] || row.name,
      });
    }
  }
  let list = Array.from(byKey.values());
  if (!DISTINCT_VARIANT_6.has(sectionType)) {
    const hasFive = list.some((row) => row.key === `${sectionType}-5`);
    if (hasFive) {
      list = list.filter((row) => row.key !== `${sectionType}-6`);
    }
  }
  return list.sort((a, b) => a.key.localeCompare(b.key));
}

function preferredLayoutKey(
  sectionType: string,
  options: LayoutRow[],
  templateNumericId?: number,
) {
  if (sectionType === "CustomPage") {
    const customN = templateNumericId
      ? options.find((row) => row.key === `CustomPage-${templateNumericId}`)
      : null;
    return (
      customN?.key ||
      options.find((row) => row.key === "CustomPage-1")?.key ||
      options[0]?.key ||
      ""
    );
  }
  const byTemplate =
    templateNumericId != null && templateNumericId > 0
      ? options.find(
          (row) => row.key === `${sectionType}-${templateNumericId}`,
        )
      : undefined;
  return (
    byTemplate?.key ||
    options.find((row) => row.key === `${sectionType}-5`)?.key ||
    options[0]?.key ||
    ""
  );
}

const TEMPLATE_TYPES = [
  "Single Page Website",
  "Multiple Pages Website",
];

type LayoutRow = {
  _id: string;
  key: string;
  name: string;
  sectionType: string;
  scope?: string;
};

type TemplateRow = {
  _id: string;
  id?: string;
  key: string;
  numericId: number;
  title: string;
  type: string;
  image?: string | null;
  previewImage?: string | null;
  previewDescription?: string | null;
  prebuiltPages?: number;
  pages?: TemplatePage[] | null;
  homeSectionOrder?: string[] | null;
  sectionVariants: Record<string, string>;
  variables?: Record<string, string> | null;
  order?: number;
  status?: string;
  updatedAt?: string;
};

type CategoryContentRow = {
  _id: string;
  id?: string;
  categorySlug: string;
  categoryName: string;
  templateKeys: string[];
  sections?: unknown;
};

const emptyBuilder = {
  _id: "",
  key: "",
  numericId: 0,
  title: "",
  type: TEMPLATE_TYPES[0],
  image: "",
  previewImage: "",
  previewDescription: "",
  prebuiltPages: 0,
  sectionVariants: {} as Record<string, string>,
  homeSectionOrder: [] as string[],
  pages: [] as TemplatePage[],
  categories: [] as string[],
  status: "Active",
};

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [layouts, setLayouts] = useState<LayoutRow[]>([]);
  const [categoryContents, setCategoryContents] = useState<
    CategoryContentRow[]
  >([]);
  const [adminCategories, setAdminCategories] = useState<
    { name?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderData, setBuilderData] = useState(emptyBuilder);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRow | null>(
    null,
  );

  const [fullPageTemplate, setFullPageTemplate] = useState<TemplateRow | null>(
    null,
  );
  /** When set, right panel shows one layout; otherwise full selected stack */
  const [builderFocusKey, setBuilderFocusKey] = useState<string | null>(null);
  const [builderPreviewTick, setBuilderPreviewTick] = useState(0);
  const [newPageLabel, setNewPageLabel] = useState("");
  /** "home" | page.id — which page is being configured */
  const [activeBuilderPageId, setActiveBuilderPageId] = useState("home");
  const [pinnedSectionTypes, setPinnedSectionTypes] = useState<string[]>([]);
  const [builderDirty, setBuilderDirty] = useState(false);
  const builderSnapshotRef = useRef("");

  const categoriesForTemplate = (templateKey: string) =>
    categoryContents
      .filter((c) => (c.templateKeys || []).includes(templateKey))
      .map((c) => c.categoryName);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [tempRes, layRes, catRes, adminCatRes] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/layouts"),
        fetch("/api/contents/categories"),
        fetch("/api/categories"),
      ]);

      if (tempRes.ok) {
        const data = await tempRes.json();
        setTemplates(Array.isArray(data) ? data : []);
      }

      if (layRes.ok) {
        const data = await layRes.json();
        setLayouts(Array.isArray(data) ? data : []);
      }

      if (catRes.ok) {
        const data = await catRes.json();
        setCategoryContents(
          Array.isArray(data)
            ? data.map((row: any) => ({
                ...row,
                templateKeys: Array.isArray(row.templateKeys)
                  ? row.templateKeys
                  : [],
              }))
            : [],
        );
      }

      if (adminCatRes.ok) {
        const data = await adminCatRes.json();
        setAdminCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      await swalError("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const layoutsBySection = useMemo(() => {
    const groups: Record<string, LayoutRow[]> = {};
    const add = (type: string, layout: LayoutRow) => {
      if (!groups[type]) groups[type] = [];
      if (groups[type].some((row) => row.key === layout.key)) return;
      groups[type].push(layout);
    };
    for (const layout of layouts) {
      add(layout.sectionType, layout);
      const fromKey = layout.key.replace(/-\d+$/, "");
      if (fromKey && fromKey !== layout.sectionType) add(fromKey, layout);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.key.localeCompare(b.key));
    }
    return groups;
  }, [layouts]);

  const sectionTypesOrdered = useMemo(() => {
    const isMulti = builderData.type === "Multiple Pages Website";
    if (!isMulti || activeBuilderPageId === "home") {
      return mergeHomeSectionOrder(builderData.homeSectionOrder);
    }
    const page = (builderData.pages || []).find(
      (p) => p.id === activeBuilderPageId,
    );
    return page?.sectionType ? [...INNER_PAGE_CHROME, page.sectionType] : [];
  }, [
    builderData.type,
    builderData.pages,
    builderData.homeSectionOrder,
    activeBuilderPageId,
  ]);

  const activeBuilderPageLabel = useMemo(() => {
    if (activeBuilderPageId === "home") return "Home";
    const page = (builderData.pages || []).find(
      (p) => p.id === activeBuilderPageId,
    );
    return page?.label || "Page";
  }, [activeBuilderPageId, builderData.pages]);

  const selectBuilderPage = (pageId: string) => {
    setActiveBuilderPageId(pageId);
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
  };

  /** Drop page-only variants when switching to Single Page */
  const setBuilderType = (type: string) => {
    setBuilderData((prev) => {
      const nextVariants = { ...prev.sectionVariants };
      if (type === "Single Page Website") {
        for (const page of [...PAGE_SECTIONS, ...INNER_PAGE_CHROME]) {
          delete nextVariants[page];
        }
        return {
          ...prev,
          type,
          sectionVariants: nextVariants,
          pages: [],
          prebuiltPages: 0,
        };
      }
      const pages =
        prev.pages && prev.pages.length ? prev.pages : DEFAULT_MULTI_PAGES;
      if (!nextVariants.Breadcrumb) {
        nextVariants.Breadcrumb = "Breadcrumb-1";
      }
      return {
        ...prev,
        type,
        pages,
        prebuiltPages: pages.length + 1, // + Home
      };
    });
    setActiveBuilderPageId("home");
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
  };

  const addBuilderPage = () => {
    const label = newPageLabel.trim();
    if (!label) {
      void swalError("Page name required");
      return;
    }
    const id = slugifyPageId(label);
    if (!id) {
      void swalError("Invalid page name");
      return;
    }
    setBuilderData((prev) => {
      const pages = [...(prev.pages || [])];
      if (pages.some((p) => p.id === id) || id === "home") {
        void swalError("Page already exists");
        return prev;
      }
      pages.push({ id, label, sectionType: "CustomPage" });
      return {
        ...prev,
        pages,
        prebuiltPages: pages.length + 1,
      };
    });
    setNewPageLabel("");
    setActiveBuilderPageId(id);
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
  };

  const updateBuilderPage = (
    pageId: string,
    patch: Partial<TemplatePage>,
  ) => {
    setBuilderData((prev) => {
      const pages = (prev.pages || []).map((p) => {
        if (p.id !== pageId) return p;
        const next = { ...p, ...patch };
        if (patch.label && !patch.id) {
          next.id = slugifyPageId(patch.label) || p.id;
        }
        return next;
      });
      return { ...prev, pages, prebuiltPages: pages.length + 1 };
    });
  };

  const removeBuilderPage = (pageId: string) => {
    setBuilderData((prev) => {
      const removed = (prev.pages || []).find((p) => p.id === pageId);
      const pages = (prev.pages || []).filter((p) => p.id !== pageId);
      const nextVariants = { ...prev.sectionVariants };
      if (
        removed &&
        !pages.some((p) => p.sectionType === removed.sectionType)
      ) {
        delete nextVariants[removed.sectionType];
      }
      return {
        ...prev,
        pages,
        sectionVariants: nextVariants,
        prebuiltPages: pages.length + 1,
      };
    });
    setActiveBuilderPageId((curr) => (curr === pageId ? "home" : curr));
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
  };

  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    for (const row of adminCategories) {
      const name = String(row.name || "").trim();
      if (name) names.add(name);
    }
    for (const row of categoryContents) {
      const name = String(row.categoryName || "").trim();
      if (name) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [adminCategories, categoryContents]);

  const nextNumericId = useMemo(() => {
    if (!templates.length) return 1;
    return Math.max(...templates.map((t) => t.numericId || 0)) + 1;
  }, [templates]);

  const slugifyKey = (title: string) => {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base ? `template-${base}` : "";
  };

  const setBuilderCategory = (name: string) => {
    setBuilderData((prev) => ({
      ...prev,
      categories: [name],
    }));
  };

  const syncTemplateCategories = async (
    templateKey: string,
    selectedNames: string[],
  ) => {
    // Exactly one category owns a template
    const sole = selectedNames[0] ? [selectedNames[0]] : [];
    for (const row of categoryContents) {
      const current = Array.isArray(row.templateKeys)
        ? [...row.templateKeys]
        : [];
      const shouldHave = sole.includes(row.categoryName);
      const has = current.includes(templateKey);
      if (shouldHave === has) continue;

      const nextKeys = shouldHave
        ? [...current.filter((k) => k !== templateKey), templateKey]
        : current.filter((k) => k !== templateKey);

      const res = await fetch("/api/contents/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: row._id || row.id,
          templateKeys: nextKeys,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error || `Failed to update category ${row.categoryName}`,
        );
      }
    }
  };

  const openBuilder = () => {
    const defaultCategory = categoryNames[0] ? [categoryNames[0]] : [];
    const slug = (defaultCategory[0] || "template")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const next = {
      ...emptyBuilder,
      numericId: nextNumericId,
      key: `template-${slug}-${nextNumericId}`,
      title: defaultCategory[0]
        ? `${defaultCategory[0]} · New Template`
        : "",
      categories: defaultCategory,
      pages: [],
    };
    setBuilderData(next);
    setNewPageLabel("");
    setActiveBuilderPageId("home");
    setPinnedSectionTypes([]);
    builderSnapshotRef.current = snapshotBuilder(next);
    setBuilderDirty(false);
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
    setIsBuilderOpen(true);
  };

  const openEditBuilder = (template: TemplateRow) => {
    const pages = normalizePages(template.pages);
    const isMulti = template.type === "Multiple Pages Website";
    const next = {
      _id: template._id || template.id || "",
      key: template.key,
      numericId: template.numericId,
      title: template.title,
      type: template.type,
      image: template.image || "",
      previewImage: template.previewImage || "",
      previewDescription: template.previewDescription || "",
      prebuiltPages: template.prebuiltPages ?? 0,
      sectionVariants: { ...(template.sectionVariants || {}) },
      homeSectionOrder: mergeHomeSectionOrder(template.homeSectionOrder),
      pages: isMulti
        ? pages.length
          ? pages
          : DEFAULT_MULTI_PAGES
        : [],
      categories: (() => {
        const cats = categoriesForTemplate(template.key);
        return cats[0] ? [cats[0]] : [];
      })(),
      status: template.status || "Active",
    };
    setBuilderData(next);
    setNewPageLabel("");
    setActiveBuilderPageId("home");
    setPinnedSectionTypes([]);
    builderSnapshotRef.current = snapshotBuilder(next);
    setBuilderDirty(false);
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
    setIsBuilderOpen(true);
  };

  const closeBuilder = async () => {
    if (builderDirty) {
      const result = await swalConfirm(
        "Unsaved changes will be lost.",
        "Leave without saving?",
      );
      if (!result.isConfirmed) return;
    }
    setIsBuilderOpen(false);
    setBuilderDirty(false);
  };

  const handleSaveTemplate = async () => {
    const latest = builderData;

    if (!latest.title.trim() || !latest.key.trim()) {
      await swalError("Title and key are required");
      return;
    }
    if (latest.categories.length !== 1) {
      await swalError("Select exactly one category (template is unique per category)");
      return;
    }
    if (Object.keys(latest.sectionVariants).length === 0) {
      await swalError("Select at least one section layout");
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = !!latest._id;
      const previousKey = isEditing
        ? templates.find((t) => (t._id || t.id) === latest._id)?.key
        : null;
      const templateKey = latest.key.trim();

      const payload = {
        ...(isEditing ? { _id: latest._id } : {}),
        key: templateKey,
        numericId: latest.numericId || nextNumericId,
        title: latest.title.trim(),
        type: latest.type,
        image: latest.image.trim() || null,
        previewImage: latest.previewImage.trim() || null,
        previewDescription: latest.previewDescription.trim() || null,
        prebuiltPages:
          latest.type === "Multiple Pages Website"
            ? (latest.pages?.length || 0) + 1
            : Number(latest.prebuiltPages) || 0,
        pages:
          latest.type === "Multiple Pages Website"
            ? latest.pages || []
            : null,
        sectionVariants: latest.sectionVariants,
        homeSectionOrder: mergeHomeSectionOrder(latest.homeSectionOrder),
        status: latest.status,
      };

      const res = await fetch("/api/templates", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await swalError(data.error || data.message || "Failed to save template");
        return;
      }

      const saved = data.template as TemplateRow | undefined;
      if (saved) {
        setTemplates((prev) => {
          const id = saved._id || saved.id;
          const exists = prev.some((t) => (t._id || t.id) === id);
          if (exists) {
            return prev.map((t) =>
              (t._id || t.id) === id ? { ...t, ...saved } : t,
            );
          }
          return [saved, ...prev];
        });
      }

      // If key renamed, drop old key from all categories first
      if (previousKey && previousKey !== templateKey) {
        await syncTemplateCategories(previousKey, []);
      }
      await syncTemplateCategories(templateKey, latest.categories);

      await swalSuccess(isEditing ? "Template updated" : "Template created");
      builderSnapshotRef.current = snapshotBuilder(latest);
      setBuilderDirty(false);
      setIsBuilderOpen(false);
      await fetchAllData();
    } catch (error: any) {
      console.error("Error saving template:", error);
      await swalError(error?.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    const id = selectedTemplate._id || selectedTemplate.id;
    try {
      await syncTemplateCategories(selectedTemplate.key, []);

      const res = await fetch(`/api/templates?id=${encodeURIComponent(id!)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await swalError(data.error || "Failed to delete template");
        return;
      }
      await swalSuccess("Template deleted");
      setIsDeleteOpen(false);
      setSelectedTemplate(null);
      await fetchAllData();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      await swalError(error?.message || "Failed to delete template");
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const title = (t.title || "").toLowerCase();
    const key = (t.key || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = title.includes(q) || key.includes(q);

    const matchesCategory =
      filterCategory === "All" ||
      categoriesForTemplate(t.key).includes(filterCategory);

    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (!isBuilderOpen) return;
    setBuilderDirty(
      snapshotBuilder(builderData) !== builderSnapshotRef.current,
    );
  }, [builderData, isBuilderOpen]);

  const selectVariant = (sectionType: string, layoutKey: string) => {
    setBuilderData((prev) => ({
      ...prev,
      sectionVariants: {
        ...prev.sectionVariants,
        [sectionType]: layoutKey,
      },
    }));
    setPinnedSectionTypes((prev) => prev.filter((type) => type !== sectionType));
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
  };

  useEffect(() => {
    if (!isBuilderOpen) return;
    if (builderData.type !== "Multiple Pages Website") return;
    if (activeBuilderPageId === "home") return;
    const page = (builderData.pages || []).find(
      (p) => p.id === activeBuilderPageId,
    );
    if (!page?.sectionType) return;

    const needed = [page.sectionType, ...INNER_PAGE_CHROME];
    const patch: Record<string, string> = {};
    for (const sectionType of needed) {
      if (pinnedSectionTypes.includes(sectionType)) continue;
      const options = uniqueSectionLayouts(sectionType, [
        ...(layoutsBySection[sectionType] || []),
        ...fallbackPageLayouts(sectionType),
      ]);
      const current = builderData.sectionVariants[sectionType];
      if (current && options.some((row) => row.key === current)) continue;
      const next = preferredLayoutKey(
        sectionType,
        options,
        builderData.numericId,
      );
      if (next) patch[sectionType] = next;
    }
    if (!Object.keys(patch).length) return;

    setBuilderData((prev) => ({
      ...prev,
      sectionVariants: { ...prev.sectionVariants, ...patch },
    }));
    setBuilderPreviewTick((t) => t + 1);
  }, [
    isBuilderOpen,
    activeBuilderPageId,
    builderData.type,
    builderData.pages,
    builderData.sectionVariants,
    layoutsBySection,
    pinnedSectionTypes,
  ]);

  const clearVariant = (sectionType: string) => {
    setBuilderData((prev) => {
      const next = { ...prev.sectionVariants };
      delete next[sectionType];
      return { ...prev, sectionVariants: next };
    });
    setPinnedSectionTypes((prev) =>
      prev.includes(sectionType) ? prev : [...prev, sectionType],
    );
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
  };

  const moveHomeSection = (sectionType: string, direction: -1 | 1) => {
    if (LOCKED_HOME_SECTIONS.has(sectionType)) return;
    const visible = sectionTypesOrdered.filter(
      (type) =>
        !LOCKED_HOME_SECTIONS.has(type) &&
        (Boolean(builderData.sectionVariants[type]) ||
          pinnedSectionTypes.includes(type)),
    );
    const from = visible.indexOf(sectionType);
    const swapWith = visible[from + direction];
    if (from < 0 || !swapWith) return;

    const order = mergeHomeSectionOrder(builderData.homeSectionOrder);
    const a = order.indexOf(sectionType);
    const b = order.indexOf(swapWith);
    if (a < 0 || b < 0) return;
    const next = [...order];
    next[a] = order[b];
    next[b] = order[a];
    setBuilderData((prev) => ({ ...prev, homeSectionOrder: next }));
    setBuilderPreviewTick((t) => t + 1);
  };

  const addHomeSectionAfter = (afterType: string, newType: string) => {
    if (!newType) return;
    setPinnedSectionTypes((prev) =>
      prev.includes(newType) ? prev : [...prev, newType],
    );
    const order = mergeHomeSectionOrder(builderData.homeSectionOrder).filter(
      (type) => type !== newType,
    );
    let afterIndex = order.indexOf(afterType === "Topbar" ? "Header" : afterType);
    if (afterIndex < 0) afterIndex = order.indexOf("Header");
    let insertAt = afterIndex + 1;
    const footerAt = order.indexOf("Footer");
    if (afterType === "Footer" || (footerAt >= 0 && insertAt > footerAt)) {
      insertAt = footerAt >= 0 ? footerAt : order.length;
    }
    order.splice(Math.max(insertAt, 0), 0, newType);
    setBuilderData((prev) => ({
      ...prev,
      homeSectionOrder: mergeHomeSectionOrder(order),
    }));
    setBuilderPreviewTick((t) => t + 1);
  };

  const removeHomeSection = (sectionType: string) => {
    if (LOCKED_HOME_SECTIONS.has(sectionType)) return;
    setBuilderData((prev) => {
      const next = { ...prev.sectionVariants };
      delete next[sectionType];
      return { ...prev, sectionVariants: next };
    });
    setPinnedSectionTypes((prev) => prev.filter((type) => type !== sectionType));
    setBuilderFocusKey(null);
    setBuilderPreviewTick((t) => t + 1);
  };

  const buildComposeUrl = (
    variants: Record<string, string> | undefined,
    categoryName?: string,
  ) => {
    const selected = variants || {};
    const keys = Object.values(selected).filter(Boolean) as string[];
    if (!keys.length) return null;
    const qs = new URLSearchParams();
    qs.set("variants", keys.join(","));
    qs.set(
      "category",
      categoryName ||
        builderData.categories[0] ||
        categoryNames[0] ||
        "Business",
    );
    qs.set("chrome", "0");
    return `${FRONTEND_URL}/preview/compose?${qs.toString()}`;
  };

  const builderCategoryName =
    builderData.categories[0] || categoryNames[0] || "Business";

  const variantsCsv = (variants: Record<string, string>) =>
    (Object.values(variants).filter(Boolean) as string[]).join(",");

  /** Shared chrome (Topbar/Header/Footer) + optional page body */
  const pageVariantsFor = (
    source: Record<string, string>,
    pageBodyType?: string,
    pageBodyKey?: string,
    homeSectionOrder?: string[] | null,
  ): Record<string, string> => {
    const next: Record<string, string> = {};
    if (pageBodyType && pageBodyKey) {
      if (source.Topbar) next.Topbar = source.Topbar;
      if (source.Header) next.Header = source.Header;
      next.Breadcrumb = source.Breadcrumb || "Breadcrumb-1";
      next[pageBodyType] = pageBodyKey;
      if (source.Footer) next.Footer = source.Footer;
      return next;
    }
    const order =
      Array.isArray(homeSectionOrder) && homeSectionOrder.length
        ? homeSectionOrder
        : HOME_SECTIONS;
    for (const section of order) {
      if (source[section]) next[section] = source[section];
    }
    return next;
  };

  /** Site preview URL — Single = home sections only; Multi = pages + header nav */
  const buildTemplateSitePreviewUrl = (
    template: TemplateRow,
    options?: { pageId?: string },
  ) => {
    const category =
      categoriesForTemplate(template.key)[0] || categoryNames[0] || "Business";
    const variants = template.sectionVariants || {};
    const isMulti = template.type === "Multiple Pages Website";
    const pages = normalizePages(template.pages);
    const effectivePages =
      isMulti && pages.length ? pages : isMulti ? DEFAULT_MULTI_PAGES : [];

    if (!isMulti) {
      const homeOnly = pageVariantsFor(
        variants,
        undefined,
        undefined,
        template.homeSectionOrder,
      );
      return buildComposeUrl(homeOnly, category);
    }

    const qs = new URLSearchParams();
    qs.set("category", category);
    qs.set("nav", "1");
    qs.set("page", options?.pageId || "home");

    const homeCsv = variantsCsv(
      pageVariantsFor(
        variants,
        undefined,
        undefined,
        template.homeSectionOrder,
      ),
    );
    if (!homeCsv) return null;
    qs.append("p", `home~Home~${homeCsv}`);

    effectivePages.forEach((page, index) => {
      const layoutKey = variants[page.sectionType];
      if (!layoutKey) return;
      const csv = variantsCsv(
        pageVariantsFor(variants, page.sectionType, layoutKey),
      );
      if (!csv) return;
      qs.append(
        "p",
        `${page.id || `page-${index}`}~${page.label || page.id}~${csv}`,
      );
    });

    return `${FRONTEND_URL}/preview/compose?${qs.toString()}`;
  };

  /** Card thumbnail — same rules as full preview (home for multi-page) */
  const buildTemplateCardPreviewUrl = (template: TemplateRow) =>
    buildTemplateSitePreviewUrl(template, { pageId: "home" });

  /** Open tab: all pages with clickable nav */
  const builderOpenTabUrl = (() => {
    const draftAsTemplate: TemplateRow = {
      _id: builderData._id,
      key: builderData.key,
      numericId: builderData.numericId,
      title: builderData.title,
      type: builderData.type,
      sectionVariants: builderData.sectionVariants,
      homeSectionOrder: builderData.homeSectionOrder,
      pages: builderData.pages,
      prebuiltPages: builderData.prebuiltPages,
    };
    return buildTemplateSitePreviewUrl(draftAsTemplate, {
      pageId:
        builderData.type === "Multiple Pages Website" &&
        activeBuilderPageId !== "home"
          ? activeBuilderPageId
          : "home",
    });
  })();

  /** Preview follows the page currently being edited */
  const builderPreviewUrl = (() => {
    const tick = `t=${builderPreviewTick}`;
    const isMulti = builderData.type === "Multiple Pages Website";
    const editingHome = !isMulti || activeBuilderPageId === "home";
    const source = builderData.sectionVariants;

    if (editingHome) {
      const url = buildComposeUrl(
        pageVariantsFor(
          source,
          undefined,
          undefined,
          builderData.homeSectionOrder,
        ),
        builderCategoryName,
      );
      return url ? `${url}&${tick}` : null;
    }

    const page = (builderData.pages || []).find(
      (p) => p.id === activeBuilderPageId,
    );
    if (!page) return null;
    const pageOptions = uniqueSectionLayouts(page.sectionType, [
      ...(layoutsBySection[page.sectionType] || []),
      ...fallbackPageLayouts(page.sectionType),
    ]);
    const savedLayout = source[page.sectionType];
    const validSaved = pageOptions.some((row) => row.key === savedLayout)
      ? savedLayout
      : "";
    const pageLayout =
      validSaved ||
      (pinnedSectionTypes.includes(page.sectionType)
        ? ""
        : preferredLayoutKey(
            page.sectionType,
            pageOptions,
            builderData.numericId,
          ));
    if (!pageLayout) return null;

    const url = buildComposeUrl(
      pageVariantsFor(
        { ...source, [page.sectionType]: pageLayout },
        page.sectionType,
        pageLayout,
      ),
      builderCategoryName,
    );
    if (!url) return null;
    const title = encodeURIComponent(page.label || page.id);
    return `${url}&title=${title}&${tick}`;
  })();

  const fullPagePreviewUrl = fullPageTemplate
    ? buildTemplateSitePreviewUrl(fullPageTemplate)
    : null;

  return (
    <>
      {isBuilderOpen ? (
        <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
          <div className="shrink-0 sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-2xl bg-white/95 dark:bg-[#0b0b0b]/95 px-1 py-1 backdrop-blur">
            <div>
              <button
                type="button"
                onClick={() => void closeBuilder()}
                className="text-[12px] font-semibold text-gray-500 hover:text-[#e53935] mb-1 flex items-center gap-1"
              >
                <Icon icon="solar:arrow-left-linear" width={16} />
                Back to templates
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[22px] font-bold text-gray-900 dark:text-white">
                  {builderData._id ? "Edit Template" : "Add Template"}
                </h2>
                {builderDirty ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Unsaved
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Saved
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Pick a layout per section — live preview updates on the right
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void closeBuilder()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving || !builderDirty}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#e53935] hover:bg-[#c22028] disabled:opacity-50 text-white shadow-lg"
              >
                {isSaving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] gap-4">
            <CardBox className="p-5 overflow-y-auto bg-white dark:bg-[#0b0b0b] border border-gray-100 dark:border-white/5 rounded-2xl space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={builderData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setBuilderData((prev) => ({
                        ...prev,
                        title,
                        key: prev._id
                          ? prev.key
                          : slugifyKey(title) || prev.key,
                      }));
                    }}
                    className="w-full bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                    placeholder="Classic Image"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Key
                  </label>
                  <input
                    type="text"
                    value={builderData.key}
                    onChange={(e) =>
                      setBuilderData({ ...builderData, key: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                    placeholder="template-1"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Type
                  </label>
                  <select
                    value={builderData.type}
                    onChange={(e) => setBuilderType(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                  >
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Numeric ID
                  </label>
                  <input
                    type="number"
                    value={builderData.numericId}
                    onChange={(e) =>
                      setBuilderData({
                        ...builderData,
                        numericId: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Category{" "}
                  <span className="font-medium text-gray-400">(one only)</span>
                </label>
                {categoryNames.length === 0 ? (
                  <p className="text-xs text-amber-600">
                    No category content found. Run db:seed:templates first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categoryNames.map((name) => {
                      const active = builderData.categories[0] === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setBuilderCategory(name);
                            setBuilderPreviewTick((t) => t + 1);
                          }}
                          className={`px-3 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                            active
                              ? "bg-[#e53935] border-[#e53935] text-white"
                              : "bg-gray-50 dark:bg-[#171717] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#e53935]/50"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={builderData.previewDescription}
                  onChange={(e) =>
                    setBuilderData({
                      ...builderData,
                      previewDescription: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935] resize-none"
                  placeholder="Short description for this template"
                />
              </div>

              {builderData.type === "Multiple Pages Website" && (
                <div>
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">
                      Pages
                    </h4>
                    <span className="text-[11px] font-semibold text-gray-500">
                      Click a page to edit its layout
                    </span>
                  </div>

                  <div className="mb-3 rounded-xl border border-[#e53935]/30 bg-red-50/80 dark:bg-[#e53935]/10 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#e53935]">
                      Editing page
                    </p>
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white">
                      {activeBuilderPageLabel}
                      {activeBuilderPageId !== "home" && (
                        <span className="ml-2 text-[11px] font-semibold text-gray-500">
                          ·{" "}
                          {sectionTypeLabel(
                            (builderData.pages || []).find(
                              (p) => p.id === activeBuilderPageId,
                            )?.sectionType || "CustomPage",
                          )}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2 mb-3">
                    <button
                      type="button"
                      onClick={() => selectBuilderPage("home")}
                      className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        activeBuilderPageId === "home"
                          ? "border-[#e53935] bg-red-50 dark:bg-[#e53935]/15 ring-1 ring-[#e53935]/40"
                          : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#171717] hover:border-[#e53935]/40"
                      }`}
                    >
                      <span className="text-[12px] font-bold text-gray-800 dark:text-gray-100 flex-1">
                        Home
                      </span>
                      {activeBuilderPageId === "home" ? (
                        <span className="text-[10px] font-bold uppercase text-[#e53935]">
                          Editing
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          default
                        </span>
                      )}
                    </button>
                    {(builderData.pages || []).map((page) => {
                      const active = activeBuilderPageId === page.id;
                      const layoutKey =
                        builderData.sectionVariants[page.sectionType] || "";
                      const isSubmenu = page.submenu === true;
                      return (
                        <div
                          key={page.id}
                          className={`rounded-xl border p-2.5 transition-all ${
                            isSubmenu ? "ml-6" : ""
                          } ${
                            active
                              ? "border-[#e53935] bg-red-50/50 dark:bg-[#e53935]/10 ring-1 ring-[#e53935]/40"
                              : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b0b0b]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectBuilderPage(page.id)}
                            className="w-full flex items-center gap-2 mb-2 text-left"
                          >
                            <span className="text-[12px] font-bold text-gray-800 dark:text-gray-100 flex-1">
                              {isSubmenu ? (
                                <span className="mr-1 text-gray-400">↳</span>
                              ) : null}
                              {page.label || "Untitled"}
                            </span>
                            {active ? (
                              <span className="text-[10px] font-bold uppercase text-[#e53935]">
                                Editing
                              </span>
                            ) : layoutKey ? (
                              <span className="text-[10px] font-mono text-gray-400">
                                {layoutKey}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase text-amber-600">
                                No layout
                              </span>
                            )}
                          </button>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <input
                              type="text"
                              value={page.label}
                              onChange={(e) =>
                                updateBuilderPage(page.id, {
                                  label: e.target.value,
                                })
                              }
                              onFocus={() => selectBuilderPage(page.id)}
                              className="flex-1 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                            />
                            <select
                              value={page.sectionType}
                              onChange={(e) => {
                                updateBuilderPage(page.id, {
                                  sectionType: e.target.value,
                                });
                                selectBuilderPage(page.id);
                              }}
                              onFocus={() => selectBuilderPage(page.id)}
                              className="sm:w-[160px] bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-lg px-2 py-2 text-[12px] font-semibold text-gray-800 dark:text-gray-100"
                            >
                              {PAGE_SECTIONS.map((st) => (
                                <option key={st} value={st}>
                                  {sectionTypeLabel(st)}
                                </option>
                              ))}
                            </select>
                            <label className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSubmenu}
                                onChange={(e) =>
                                  updateBuilderPage(page.id, {
                                    submenu: e.target.checked,
                                  })
                                }
                                className="rounded border-gray-300 text-[#e53935] focus:ring-[#e53935]"
                              />
                              Submenu
                            </label>
                            <button
                              type="button"
                              onClick={() => removeBuilderPage(page.id)}
                              className="px-3 py-2 rounded-lg text-[11px] font-bold text-red-500 border border-red-200 dark:border-red-500/30"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPageLabel}
                      onChange={(e) => setNewPageLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addBuilderPage();
                        }
                      }}
                      placeholder="New page name (e.g. Pricing)"
                      className="flex-1 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                    />
                    <button
                      type="button"
                      onClick={addBuilderPage}
                      className="px-4 py-2.5 rounded-xl text-[12px] font-bold bg-[#e53935] text-white shrink-0"
                    >
                      + Add page
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">
                    {builderData.type === "Multiple Pages Website"
                      ? `Layouts · ${activeBuilderPageLabel}`
                      : "Section variants"}
                  </h4>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {activeBuilderPageId === "home"
                      ? "Home sections"
                      : "This page layout only"}
                  </span>
                </div>
                <div className="space-y-3">
                  {sectionTypesOrdered
                    .filter((sectionType) => {
                      const isHomeList =
                        !builderData.type.startsWith("Multiple") ||
                        activeBuilderPageId === "home";
                      if (!isHomeList) return true;
                      return (
                        Boolean(builderData.sectionVariants[sectionType]) ||
                        pinnedSectionTypes.includes(sectionType)
                      );
                    })
                    .map((sectionType, sectionIndex, visibleTypes) => {
                    const options = uniqueSectionLayouts(sectionType, [
                      ...(layoutsBySection[sectionType] || []),
                      ...fallbackPageLayouts(sectionType),
                    ]);
                    const selectedKey =
                      options.some(
                        (row) =>
                          row.key ===
                          (builderData.sectionVariants[sectionType] || ""),
                      )
                        ? builderData.sectionVariants[sectionType] || ""
                        : "";
                    const isHomeLayouts =
                      !builderData.type.startsWith("Multiple") ||
                      activeBuilderPageId === "home";
                    const canReorderHome =
                      isHomeLayouts && !LOCKED_HOME_SECTIONS.has(sectionType);
                    const availableToAdd = sectionTypesOrdered.filter(
                      (type) =>
                        !builderData.sectionVariants[type] &&
                        !pinnedSectionTypes.includes(type),
                    );
                    const canAddAfter =
                      isHomeLayouts &&
                      !LOCKED_HOME_SECTIONS.has(sectionType) &&
                      availableToAdd.length > 0;
                    const canRemoveHome =
                      isHomeLayouts && !LOCKED_HOME_SECTIONS.has(sectionType);
                    const movableTypes = visibleTypes.filter(
                      (type) => !LOCKED_HOME_SECTIONS.has(type),
                    );
                    const movableIndex = movableTypes.indexOf(sectionType);
                    const isPageBody = PAGE_SECTIONS.includes(sectionType);
                    const isInnerChrome = INNER_PAGE_CHROME.includes(sectionType);
                    const scopeLabel = isPageBody
                      ? "page body"
                      : isInnerChrome
                        ? "inner"
                        : "home";

                    return (
                      <div
                        key={sectionType}
                        className="rounded-xl border border-gray-200 dark:border-white/10 p-3"
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            {sectionTypeLabel(sectionType)}
                            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500">
                              {scopeLabel}
                            </span>
                          </label>
                          {(canReorderHome || canAddAfter || canRemoveHome) && (
                            <div className="flex items-center gap-1">
                              {canReorderHome ? (
                                <>
                                  <button
                                    type="button"
                                    aria-label={`Move ${sectionTypeLabel(sectionType)} up`}
                                    disabled={movableIndex <= 0}
                                    onClick={() => moveHomeSection(sectionType, -1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:border-[#e53935]/50 hover:text-[#e53935] disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Icon icon="solar:alt-arrow-up-linear" width={14} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Move ${sectionTypeLabel(sectionType)} down`}
                                    disabled={
                                      movableIndex < 0 ||
                                      movableIndex === movableTypes.length - 1
                                    }
                                    onClick={() => moveHomeSection(sectionType, 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:border-[#e53935]/50 hover:text-[#e53935] disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Icon icon="solar:alt-arrow-down-linear" width={14} />
                                  </button>
                                </>
                              ) : null}
                              {canAddAfter ? (
                                <select
                                  value=""
                                  aria-label={`Add section after ${sectionTypeLabel(sectionType)}`}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    if (!next) return;
                                    addHomeSectionAfter(sectionType, next);
                                  }}
                                  className="max-w-[140px] rounded-lg border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:border-white/20 dark:bg-[#171717] dark:text-gray-300"
                                >
                                  <option value="">+ Add</option>
                                  {availableToAdd.map((type) => (
                                    <option key={type} value={type}>
                                      {sectionTypeLabel(type)}
                                    </option>
                                  ))}
                                </select>
                              ) : null}
                              {canRemoveHome ? (
                                <button
                                  type="button"
                                  aria-label={`Remove ${sectionTypeLabel(sectionType)}`}
                                  onClick={() => removeHomeSection(sectionType)}
                                  className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          )}
                          {selectedKey ? (
                            <span className="text-[10px] font-mono text-gray-400">
                              {selectedKey}
                            </span>
                          ) : null}
                        </div>
                        {options.length === 0 ? (
                          <p className="text-xs text-amber-600">
                            No layouts for {sectionTypeLabel(sectionType)}.
                          </p>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            {selectedKey && (
                              <button
                                type="button"
                                onClick={() => clearVariant(sectionType)}
                                className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-semibold border border-dashed border-gray-300 dark:border-white/20 text-gray-500 whitespace-nowrap"
                              >
                                Clear
                              </button>
                            )}
                            <select
                              value={selectedKey}
                              onChange={(e) => {
                                const next = e.target.value;
                                if (!next) clearVariant(sectionType);
                                else selectVariant(sectionType, next);
                              }}
                              className="min-w-0 flex-1 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#e53935]"
                            >
                              <option value="">Select layout…</option>
                              {options.map((layout) => (
                                <option key={layout.key} value={layout.key}>
                                  {layout.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardBox>

            <CardBox className="p-4 flex flex-col h-full min-h-[420px] xl:min-h-0 overflow-hidden bg-white dark:bg-[#0b0b0b] border border-gray-100 dark:border-white/5 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">
                    Live preview · {activeBuilderPageLabel}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {builderPreviewUrl
                      ? activeBuilderPageId === "home" ||
                        builderData.type !== "Multiple Pages Website"
                        ? "Showing Home page"
                        : `${activeBuilderPageLabel} · shared Header & Footer`
                      : "Select a layout to preview this page"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {builderOpenTabUrl && (
                    <a
                      href={builderOpenTabUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-600 hover:underline"
                    >
                      Open tab
                    </a>
                  )}
                </div>
              </div>
              <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 bg-white dark:bg-[#171717] min-h-0">
                {builderPreviewUrl ? (
                  <DesktopPreviewFrame
                    key={builderPreviewUrl}
                    title={`Preview ${activeBuilderPageLabel}`}
                    src={builderPreviewUrl}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 px-6 text-center">
                    <Icon icon="solar:gallery-wide-bold-duotone" width={36} />
                    <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                      No preview for {activeBuilderPageLabel}
                    </p>
                    <p className="text-[11px]">
                      Pick a layout for this page on the left
                    </p>
                  </div>
                )}
              </div>
            </CardBox>
          </div>
        </div>
      ) : (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="shrink-0 z-10 flex flex-col gap-5 pb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-[22px] font-bold text-gray-900 dark:text-white">
                Templates Management
              </h2>
              <p className="text-[12px] text-gray-500 mt-1">
                Each template is unique to one category (4 per category). Section
                variants are managed in Custom Layouts.
              </p>
            </div>
            <button
              onClick={openBuilder}
              className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c22028] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg"
            >
              <Icon icon="solar:magic-stick-3-bold-duotone" width={18} /> Add
              New Template
            </button>
          </div>

          <CardBox className="bg-white dark:bg-[#0b0b0b]/80 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-md">
                <Icon
                  icon="solar:magnifer-linear"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  width={18}
                />
                <input
                  type="text"
                  placeholder="Search by title or key..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-800 dark:text-white focus:outline-none focus:border-[#e53935] transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[13px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap">
                  Category:
                </span>
                <div className="relative w-full sm:w-[220px]">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-[14px] font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#e53935] cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {categoryNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Icon
                    icon="solar:alt-arrow-down-bold"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    width={14}
                  />
                </div>
              </div>
            </div>
          </CardBox>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 relative z-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-full min-h-[300px]">
              <Icon
                icon="solar:spinner-bold-duotone"
                className="animate-spin text-[#e53935] text-4xl"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => {
                  const topPreviewUrl = buildTemplateCardPreviewUrl(template);
                  const variantCount = Object.keys(
                    template.sectionVariants || {},
                  ).length;

                  return (
                    <div
                      key={template._id || template.key}
                      className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden group hover:shadow-xl transition-all relative flex flex-col h-full"
                    >
                      <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => {
                            const url = buildTemplateSitePreviewUrl(template);
                            if (!url) {
                              void swalError(
                                "This template has no section variants to preview",
                              );
                              return;
                            }
                            setFullPageTemplate(template);
                          }}
                          className="w-8 h-8 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-sky-500 hover:bg-sky-50 shadow-sm transition-all"
                          title="Full page preview"
                        >
                          <Icon icon="solar:eye-bold-duotone" width={18} />
                        </button>
                        <button
                          onClick={() => openEditBuilder(template)}
                          className="w-8 h-8 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 shadow-sm transition-all"
                          title="Edit"
                        >
                          <Icon icon="solar:pen-bold-duotone" width={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsDeleteOpen(true);
                          }}
                          className="w-8 h-8 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-[#e53935] hover:bg-red-50 shadow-sm transition-all"
                          title="Delete"
                        >
                          <Icon
                            icon="solar:trash-bin-trash-bold-duotone"
                            width={18}
                          />
                        </button>
                      </div>

                      <div className="h-[180px] bg-gray-100 dark:bg-white/5 relative overflow-hidden shrink-0">
                        {topPreviewUrl ? (
                          <iframe
                            key={topPreviewUrl}
                            title={`Top preview ${template.key}`}
                            src={topPreviewUrl}
                            className="pointer-events-none absolute left-0 top-0 border-0 origin-top-left bg-white"
                            style={{
                              width: 1280,
                              height: 720,
                              transform: "scale(0.28)",
                              transformOrigin: "top left",
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400 font-semibold px-4 text-center">
                            Select Topbar / Header / Banner
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col gap-2">
                          <h4 className="font-bold text-gray-900 dark:text-white text-[16px] truncate">
                          {template.title}
                          </h4>
                        <code className="text-[11px] font-semibold text-[#e53935] bg-red-50 dark:bg-[#e53935]/10 px-2 py-0.5 rounded w-max">
                          {template.key}
                        </code>
                        <p className="text-gray-500 text-sm">
                          {template.type} · {variantCount} sections
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {categoriesForTemplate(template.key).length > 0 ? (
                            categoriesForTemplate(template.key).map((name) => (
                              <span
                                key={name}
                                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-amber-600">
                              No category
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-gray-500">
                    <Icon
                      icon="solar:folder-error-bold-duotone"
                      width={40}
                    className="opacity-50 mb-4"
                    />
                  <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
                    No templates found
                  </h4>
                  <p className="text-sm">
                    Try changing search/filter or seed templates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {fullPageTemplate && fullPagePreviewUrl && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6">
          <div className="bg-white dark:bg-[#171717] w-full max-w-6xl h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center gap-3 p-4 border-b border-gray-100 dark:border-white/5 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {fullPageTemplate.title}
                </h3>
                <p className="text-[12px] text-gray-500 font-mono truncate">
                  {fullPageTemplate.key} · {fullPageTemplate.type}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={fullPagePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <Icon icon="solar:square-top-down-bold-duotone" width={16} />
                  Open tab
                </a>
                <button
                  onClick={() => setFullPageTemplate(null)}
                  className="text-gray-400 hover:text-[#e53935]"
                  title="Close"
                >
                  <Icon icon="solar:close-circle-bold" width={26} />
                </button>
              </div>
            </div>
            <iframe
              title={`Full page ${fullPageTemplate.key}`}
              src={fullPagePreviewUrl}
              className="w-full flex-1 bg-white border-0"
                      />
                    </div>
                    </div>
      )}

      {isDeleteOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#171717] w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl">
            <Icon
              icon="solar:trash-bin-trash-bold-duotone"
              className="text-[#e53935] mx-auto text-5xl mb-4"
            />
            <h3 className="text-xl font-bold dark:text-white mb-2">
              Delete Template?
            </h3>
            <p className="text-sm text-gray-500">{selectedTemplate.title}</p>
            <p className="text-xs font-mono text-gray-400 mb-4">
              {selectedTemplate.key}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/10 font-bold dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                className="flex-1 py-3 rounded-xl bg-[#e53935] text-white font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplatesPage;
