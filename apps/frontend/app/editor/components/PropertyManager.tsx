"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FilePenLine,
  Home,
  KeyRound,
  LayoutTemplate,
  Plus,
  Search,
  Settings2,
  Tags,
  Trash2,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import ImageLibraryPicker from "../layout/src/components/builder/ImageLibraryPicker";
import CustomSectionRichTextEditor from "../layout/src/components/sections/custom/CustomSectionRichTextEditor";
import { usePreview } from "../layout/src/components/context/PreviewContext";
import {
  getPageSeo,
  patchPageSeo,
  type SiteSeoSettings,
} from "@/lib/siteSeo";
import {
  DEFAULT_PROPERTY_DETAIL_LAYOUT,
  DEFAULT_PROPERTY_INDEX_LAYOUT,
  normalizePropertyDetailLayout,
  normalizePropertyIndexLayout,
  PROPERTY_DETAIL_LAYOUTS,
  PROPERTY_INDEX_LAYOUTS,
  type PropertyLayoutOption,
} from "../layout/src/lib/propertyLayouts";
import {
  DEFAULT_PROPERTY_AMENITY_ICON,
  getPropertyAmenityIcon,
  getPropertyAmenityOption,
  parsePropertyAmenities,
  PROPERTY_AMENITY_OPTIONS,
  serializePropertyAmenities,
  type PropertyAmenity,
} from "../layout/src/lib/propertyAmenities";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import { isEditorCorePlanActive } from "@/lib/userPlan";
import { rememberEditorForAuthCancel, buildPlanPageUrl } from "@/lib/authReturn";
import { resolveEditorSiteId } from "@/lib/migrateGuestSite";

type PropertyTab =
  | "properties"
  | "categories"
  | "propertyTypes"
  | "listingTypes"
  | "templates"
  | "seo";
type LayoutPane = "index" | "detail";
type ImagePickerTarget = "image" | "floorPlan" | "gallery";
type PropertyAiField = "summary" | "content" | "seo" | "image" | "gallery";

const DEFAULT_PROPERTY_CATEGORY = "Residential";
const LIST_PAGE_SIZE = 5;

export type PropertyOption = {
  value: string;
  label: string;
};

export type PropertyItem = {
  id: string;
  title: string;
  category: string;
  desc: string;
  content?: string;
  image: string;
  alt?: string;
  /** Detail page URL slug (`/property/{slug}`). Auto-filled from title when empty. */
  slug?: string;
  order?: number;
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  /** Display price, e.g. `₹85 Lakh`. */
  price?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqft?: string;
  /** Covered / open parking count or label for listing cards. */
  parking?: string;
  propertyType?: string;
  listingType?: string;
  /** Line under the title on featured cards, e.g. `4 BHK VILLA • PURI`. */
  subtitle?: string;
  /** Badge on featured cards, e.g. `Ready for visit`. */
  statusText?: string;
  /** When true, this property can appear on home teasers. */
  featured?: boolean;
  /** Structured amenities with icons (legacy comma strings still load). */
  amenities?: PropertyAmenity[] | string;
  /** Floor plan image URL. */
  floorPlan?: string;
  /** Extra detail-page photos (carousel / gallery). */
  gallery?: string[];
};

/** @deprecated Use string property type slugs from managed options. */
export type PropertyTypeValue = string;

/** @deprecated Use string listing type slugs from managed options. */
export type ListingTypeValue = string;

const DEFAULT_PROPERTY_TYPE = "apartment";
const DEFAULT_LISTING_TYPE = "sale";

const DEFAULT_PROPERTY_TYPE_OPTIONS: PropertyOption[] = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "house", label: "House" },
  { value: "plot", label: "Plot" },
  { value: "commercial", label: "Commercial" },
  { value: "office", label: "Office" },
];

const DEFAULT_LISTING_TYPE_OPTIONS: PropertyOption[] = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
];

const formatOptionSlugLabel = (value: string) =>
  value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizePropertyTypeValue = (
  value: string | null | undefined,
  options: PropertyOption[],
) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return DEFAULT_PROPERTY_TYPE;
  if (options.some((option) => option.value === trimmed)) return trimmed;
  const byLabel = options.find(
    (option) => option.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byLabel) return byLabel.value;
  return DEFAULT_PROPERTY_TYPE;
};

const normalizeListingTypeValue = (
  value: string | null | undefined,
  options: PropertyOption[],
) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return DEFAULT_LISTING_TYPE;
  if (options.some((option) => option.value === trimmed)) return trimmed;
  const byLabel = options.find(
    (option) => option.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byLabel) return byLabel.value;
  return DEFAULT_LISTING_TYPE;
};

const propertyTypeLabelFor = (
  value: string | null | undefined,
  options: PropertyOption[],
) => {
  const normalized = normalizePropertyTypeValue(value, options);
  return (
    options.find((option) => option.value === normalized)?.label ||
    formatOptionSlugLabel(normalized)
  );
};

const listingTypeLabelFor = (
  value: string | null | undefined,
  options: PropertyOption[],
) => {
  const normalized = normalizeListingTypeValue(value, options);
  return (
    options.find((option) => option.value === normalized)?.label ||
    formatOptionSlugLabel(normalized)
  );
};

const createPropertySlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueOptionValue = (
  label: string,
  options: PropertyOption[],
  excludeValue?: string | null,
) => {
  const base = createPropertySlug(label) || "option";
  const taken = new Set(
    options
      .filter((option) => option.value !== excludeValue)
      .map((option) => option.value.toLowerCase()),
  );
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};

const mergePropertyOptions = (
  stored: PropertyOption[],
  defaults: PropertyOption[],
  fromProperties: string[],
) => {
  const next = [...defaults];
  const seen = new Set(defaults.map((option) => option.value));
  for (const option of stored) {
    if (!option.value || seen.has(option.value)) continue;
    next.push(option);
    seen.add(option.value);
  }
  for (const raw of fromProperties) {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    next.push({ value: trimmed, label: formatOptionSlugLabel(trimmed) });
    seen.add(trimmed);
  }
  return next;
};

const uniquePropertySlug = (
  preferred: string,
  properties: PropertyItem[],
  excludeId?: string | null,
) => {
  const base = preferred || "property";
  const taken = new Set(
    properties
      .filter((item) => item.id !== excludeId)
      .map((item) =>
        (item.slug || createPropertySlug(item.title) || "").toLowerCase(),
      )
      .filter(Boolean),
  );
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};

export type PropertyPageState = {
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
  properties: PropertyItem[];
};

type PropertyManagerProps = {
  onClose: () => void;
  siteId?: string;
  preserveNavigation?: boolean;
};

const PROPERTY_PAGE_SEO_KEY = "Properties";

const isPropertiesPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    href === "#page-property" ||
    href === "#page-properties" ||
    label === "property" ||
    label === "properties"
  );
};

const stripHtmlPreview = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const tabItems: Array<{
  id: PropertyTab;
  label: string;
  icon: typeof Building2;
}> = [
  { id: "properties", label: "Listings", icon: Building2 },
  { id: "categories", label: "Groups", icon: Tags },
  { id: "propertyTypes", label: "Home types", icon: Home },
  { id: "listingTypes", label: "Sale / Rent", icon: KeyRound },
  { id: "templates", label: "Layouts", icon: LayoutTemplate },
  { id: "seo", label: "SEO", icon: Settings2 },
];

const FieldNote = ({ children }: { children: ReactNode }) => (
  <p className="mt-1.5 text-xs leading-5 text-slate-500">{children}</p>
);

const FormSection = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) => (
  <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
    <div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      {note ? <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p> : null}
    </div>
    {children}
  </section>
);

const AiFieldButton = ({
  title,
  loading,
  onClick,
}: {
  title: string;
  loading?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={loading}
    onClick={onClick}
    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? (
      <Loader2 size={14} className="animate-spin" />
    ) : (
      <Sparkles size={14} />
    )}
  </button>
);

const FieldLabelWithAi = ({
  label,
  aiTitle,
  aiLoading,
  onAiClick,
}: {
  label: string;
  aiTitle: string;
  aiLoading?: boolean;
  onAiClick: () => void;
}) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <span className="text-sm font-semibold text-slate-800">{label}</span>
    <AiFieldButton title={aiTitle} loading={aiLoading} onClick={onAiClick} />
  </div>
);

const emptyProperty = (
  order = 1,
  detailLayout = DEFAULT_PROPERTY_DETAIL_LAYOUT,
): PropertyItem => ({
  id: `property-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  category: DEFAULT_PROPERTY_CATEGORY,
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
  price: "",
  address: "",
  bedrooms: "",
  bathrooms: "",
  areaSqft: "",
  parking: "",
  propertyType: DEFAULT_PROPERTY_TYPE,
  listingType: DEFAULT_LISTING_TYPE,
  subtitle: "",
  statusText: "",
  amenities: [],
  featured: false,
  floorPlan: "",
  gallery: [],
});

const emptyPageState = (): PropertyPageState => ({
  pretitle: "Our Properties",
  title: "Homes and spaces worth moving for",
  subtitle: "Featured listings",
  desc: "Showcase apartments, villas, plots, and commercial spaces with full details.",
  desc2: "",
  sideImage: "/bg1.jpg",
  sideImageTitle: "Properties",
  productSectionTitle: "All properties",
  layout: DEFAULT_PROPERTY_INDEX_LAYOUT,
  detailLayout: DEFAULT_PROPERTY_DETAIL_LAYOUT,
  properties: [],
});

const LayoutPreviewMock = ({ layout }: { layout: PropertyLayoutOption }) => {
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
            <p className="mt-2 text-xl font-bold">Property detail</p>
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

export default function PropertyManager({
  onClose,
  siteId = "draft",
  preserveNavigation = false,
}: PropertyManagerProps) {
  const router = useRouter();
  const { user } = useUserAuth();
  const { siteSeoConfig, setSiteSeoConfig, pageLinks, setPageLinks } =
    usePreview();

  const requireCorePlanForAi = () => {
    const activeSiteId = siteId || resolveEditorSiteId();
    if (isEditorCorePlanActive(activeSiteId)) return true;
    rememberEditorForAuthCancel();
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("ai-builder-login-required", {
          detail: { intent: "upgrade" },
        }),
      );
      return false;
    }
    router.push(buildPlanPageUrl(activeSiteId));
    return false;
  };
  const propertiesWebsiteEnabled = useMemo(() => {
    const link = pageLinks.find(isPropertiesPageLink);
    return Boolean(link && !link.hidden);
  }, [pageLinks]);

  const setPropertiesWebsiteEnabled = (enabled: boolean) => {
    if (enabled) {
      const hasLink = pageLinks.some(isPropertiesPageLink);
      setPageLinks(
        hasLink
          ? pageLinks.map((page) =>
              isPropertiesPageLink(page)
                ? {
                    ...page,
                    label: page.label || "Properties",
                    href: page.href || "#page-properties",
                    hidden: false,
                  }
                : page,
            )
          : [
              ...pageLinks,
              {
                label: "Properties",
                href: "#page-properties",
                hidden: false,
              },
            ],
      );
      window.dispatchEvent(new CustomEvent("ai-builder-ensure-property-page"));
      window.dispatchEvent(
        new CustomEvent("ai-builder-properties-website-visibility", {
          detail: { enabled: true },
        }),
      );
      return;
    }

    setPageLinks(
      pageLinks.map((page) =>
        isPropertiesPageLink(page) ? { ...page, hidden: true } : page,
      ),
    );
    window.dispatchEvent(
      new CustomEvent("ai-builder-properties-website-visibility", {
        detail: { enabled: false },
      }),
    );
  };

  const propertySeo = useMemo(
    () => getPageSeo(siteSeoConfig, PROPERTY_PAGE_SEO_KEY),
    [siteSeoConfig],
  );
  const patchPropertySeo = (patch: Partial<SiteSeoSettings>) => {
    setSiteSeoConfig(patchPageSeo(siteSeoConfig, PROPERTY_PAGE_SEO_KEY, patch));
  };

  const [activeTab, setActiveTab] = useState<PropertyTab>("properties");
  const [layoutPane, setLayoutPane] = useState<LayoutPane>("index");
  const [ready, setReady] = useState(false);
  const [pageState, setPageState] = useState<PropertyPageState>(emptyPageState);
  const [localIndexLayout, setLocalIndexLayout] = useState(
    DEFAULT_PROPERTY_INDEX_LAYOUT,
  );
  const [localDetailLayout, setLocalDetailLayout] = useState(
    DEFAULT_PROPERTY_DETAIL_LAYOUT,
  );
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PropertyItem>(emptyProperty());
  const [imagePickerTarget, setImagePickerTarget] =
    useState<ImagePickerTarget | null>(null);
  const [galleryPickerIndex, setGalleryPickerIndex] = useState<number | null>(
    null,
  );
  const [aiFieldBusy, setAiFieldBusy] = useState<PropertyAiField | null>(null);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [categories, setCategories] = useState<string[]>([
    DEFAULT_PROPERTY_CATEGORY,
  ]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyItem | null>(
    null,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [amenityDraftName, setAmenityDraftName] = useState("");
  const [amenityDraftIcon, setAmenityDraftIcon] = useState(
    DEFAULT_PROPERTY_AMENITY_ICON,
  );
  const [seoDraft, setSeoDraft] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [seoSaveState, setSeoSaveState] = useState<"idle" | "saved">("idle");
  const categoryStorageKey = `ai-builder-property-categories:${siteId}`;
  const propertyTypeStorageKey = `ai-builder-property-types:${siteId}`;
  const listingTypeStorageKey = `ai-builder-property-listing-types:${siteId}`;
  const [propertyTypes, setPropertyTypes] = useState<PropertyOption[]>(
    DEFAULT_PROPERTY_TYPE_OPTIONS,
  );
  const [listingTypes, setListingTypes] = useState<PropertyOption[]>(
    DEFAULT_LISTING_TYPE_OPTIONS,
  );
  const [propertyTypesReady, setPropertyTypesReady] = useState(false);
  const [listingTypesReady, setListingTypesReady] = useState(false);
  const [propertyTypeName, setPropertyTypeName] = useState("");
  const [listingTypeName, setListingTypeName] = useState("");
  const [editingPropertyType, setEditingPropertyType] = useState<string | null>(
    null,
  );
  const [editPropertyTypeLabel, setEditPropertyTypeLabel] = useState("");
  const [editingListingType, setEditingListingType] = useState<string | null>(
    null,
  );
  const [editListingTypeLabel, setEditListingTypeLabel] = useState("");

  useEffect(() => {
    if (activeTab !== "seo") return;
    setSeoDraft({
      metaTitle: propertySeo.metaTitle || "",
      metaDescription: propertySeo.metaDescription || "",
      metaKeywords: propertySeo.metaKeywords || "",
    });
    setSeoSaveState("idle");
    // Rehydrate only when opening the SEO tab — not after Save (keeps "Saved" feedback).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [activeTab]);

  const savePropertySeo = () => {
    patchPropertySeo({
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

  const persistPropertyTypes = (next: PropertyOption[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(propertyTypeStorageKey, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  };

  const readStoredPropertyTypes = () => {
    if (typeof window === "undefined") return [] as PropertyOption[];
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(propertyTypeStorageKey) || "[]",
      ) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item): item is PropertyOption =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as PropertyOption).value === "string" &&
            typeof (item as PropertyOption).label === "string",
        )
        .map((item) => ({
          value: item.value.trim(),
          label: item.label.trim(),
        }))
        .filter((item) => item.value && item.label);
    } catch {
      return [];
    }
  };

  const persistListingTypes = (next: PropertyOption[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(listingTypeStorageKey, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  };

  const readStoredListingTypes = () => {
    if (typeof window === "undefined") return [] as PropertyOption[];
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(listingTypeStorageKey) || "[]",
      ) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item): item is PropertyOption =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as PropertyOption).value === "string" &&
            typeof (item as PropertyOption).label === "string",
        )
        .map((item) => ({
          value: item.value.trim(),
          label: item.label.trim(),
        }))
        .filter((item) => item.value && item.label);
    } catch {
      return [];
    }
  };

  const propertyCategoriesKey = useMemo(
    () =>
      Array.from(
        new Set(
          pageState.properties
            .map((item) =>
              (item.category || DEFAULT_PROPERTY_CATEGORY).trim(),
            )
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [pageState.properties],
  );

  const propertyTypeValuesKey = useMemo(
    () =>
      Array.from(
        new Set(
          pageState.properties
            .map((item) => (item.propertyType || "").trim())
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [pageState.properties],
  );

  const listingTypeValuesKey = useMemo(
    () =>
      Array.from(
        new Set(
          pageState.properties
            .map((item) => (item.listingType || "").trim())
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .join("\0"),
    [pageState.properties],
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
      if (imagePickerTarget) {
        setImagePickerTarget(null);
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
  }, [onClose, showComposer, showContentEditor, imagePickerTarget]);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<PropertyPageState>).detail;
      if (!detail) return;
      const layout = normalizePropertyIndexLayout(detail.layout);
      const detailLayout = normalizePropertyDetailLayout(detail.detailLayout);
      setPageState({
        ...emptyPageState(),
        ...detail,
        layout,
        detailLayout,
        properties: Array.isArray(detail.properties) ? detail.properties : [],
      });
      setLocalIndexLayout(layout);
      setLocalDetailLayout(detailLayout);
      setReady(true);
    };

    window.addEventListener("ai-builder-property-page-state", handleState);
    window.dispatchEvent(
      new CustomEvent("ai-builder-ensure-property-page", {
        detail: { navigate: !preserveNavigation },
      }),
    );
    // Query after ensure can patch sectionsRef, so the list is not wiped by a stale snapshot.
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("ai-builder-property-page-query"));
    }, 0);

    return () => {
      window.removeEventListener("ai-builder-property-page-state", handleState);
    };
  }, [preserveNavigation]);

  // Hydrate categories once per site — never let the initial default wipe storage.
  useEffect(() => {
    setCategoriesReady(false);
    const saved = readStoredCategories();
    const fromProperties = propertyCategoriesKey
      ? propertyCategoriesKey.split("\0")
      : [];
    const next = Array.from(
      new Set([DEFAULT_PROPERTY_CATEGORY, ...saved, ...fromProperties]),
    );
    setCategories(next);
    setCategoriesReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- site key only
  }, [categoryStorageKey]);

  // When properties gain categories, merge them in without dropping custom ones.
  useEffect(() => {
    if (!categoriesReady) return;
    const fromProperties = propertyCategoriesKey
      ? propertyCategoriesKey.split("\0")
      : [];
    if (!fromProperties.length) return;

    setCategories((current) => {
      const next = Array.from(new Set([...current, ...fromProperties]));
      const unchanged =
        next.length === current.length &&
        next.every((category) => current.includes(category));
      return unchanged ? current : next;
    });
  }, [propertyCategoriesKey, categoriesReady]);

  useEffect(() => {
    if (!categoriesReady) return;
    persistCategories(categories);
  }, [categories, categoriesReady, categoryStorageKey]);

  useEffect(() => {
    setPropertyTypesReady(false);
    const saved = readStoredPropertyTypes();
    const fromProperties = propertyTypeValuesKey
      ? propertyTypeValuesKey.split("\0")
      : [];
    setPropertyTypes(
      mergePropertyOptions(
        saved,
        DEFAULT_PROPERTY_TYPE_OPTIONS,
        fromProperties,
      ),
    );
    setPropertyTypesReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- site key only
  }, [propertyTypeStorageKey]);

  useEffect(() => {
    if (!propertyTypesReady) return;
    const fromProperties = propertyTypeValuesKey
      ? propertyTypeValuesKey.split("\0")
      : [];
    if (!fromProperties.length) return;
    setPropertyTypes((current) => {
      const next = mergePropertyOptions(
        current,
        DEFAULT_PROPERTY_TYPE_OPTIONS,
        fromProperties,
      );
      const unchanged =
        next.length === current.length &&
        next.every(
          (option, index) =>
            option.value === current[index]?.value &&
            option.label === current[index]?.label,
        );
      return unchanged ? current : next;
    });
  }, [propertyTypeValuesKey, propertyTypesReady]);

  useEffect(() => {
    if (!propertyTypesReady) return;
    persistPropertyTypes(propertyTypes);
  }, [propertyTypes, propertyTypesReady, propertyTypeStorageKey]);

  useEffect(() => {
    setListingTypesReady(false);
    const saved = readStoredListingTypes();
    const fromProperties = listingTypeValuesKey
      ? listingTypeValuesKey.split("\0")
      : [];
    setListingTypes(
      mergePropertyOptions(
        saved,
        DEFAULT_LISTING_TYPE_OPTIONS,
        fromProperties,
      ),
    );
    setListingTypesReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- site key only
  }, [listingTypeStorageKey]);

  useEffect(() => {
    if (!listingTypesReady) return;
    const fromProperties = listingTypeValuesKey
      ? listingTypeValuesKey.split("\0")
      : [];
    if (!fromProperties.length) return;
    setListingTypes((current) => {
      const next = mergePropertyOptions(
        current,
        DEFAULT_LISTING_TYPE_OPTIONS,
        fromProperties,
      );
      const unchanged =
        next.length === current.length &&
        next.every(
          (option, index) =>
            option.value === current[index]?.value &&
            option.label === current[index]?.label,
        );
      return unchanged ? current : next;
    });
  }, [listingTypeValuesKey, listingTypesReady]);

  useEffect(() => {
    if (!listingTypesReady) return;
    persistListingTypes(listingTypes);
  }, [listingTypes, listingTypesReady, listingTypeStorageKey]);

  const persist = (next: PropertyPageState) => {
    const withLayout = {
      ...next,
      layout: normalizePropertyIndexLayout(next.layout || localIndexLayout),
      detailLayout: normalizePropertyDetailLayout(
        next.detailLayout || localDetailLayout,
      ),
    };
    setPageState(withLayout);
    window.dispatchEvent(
      new CustomEvent("ai-builder-property-page-update", { detail: withLayout }),
    );
  };

  const applyIndexLayout = (layoutId: string) => {
    const layout = normalizePropertyIndexLayout(layoutId);
    setLocalIndexLayout(layout);
    persist({ ...pageState, layout });
  };

  const applyDetailLayout = (layoutId: string) => {
    const detailLayout = normalizePropertyDetailLayout(layoutId);
    setLocalDetailLayout(detailLayout);
    persist({
      ...pageState,
      detailLayout,
      properties: pageState.properties.map((item) => ({
        ...item,
        layout: detailLayout,
      })),
    });
  };

  const nextDefaultOrder = useMemo(() => {
    const maxOrder = pageState.properties.reduce(
      (max, propertyItem) => Math.max(max, propertyItem.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [pageState.properties]);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...pageState.properties].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    if (!query) return sorted;
    return sorted.filter((propertyItem) =>
      [
        propertyItem.title,
        propertyItem.category,
        propertyItem.desc,
        propertyItem.address || "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [pageState.properties, search]);

  const propertyAiContext = (propertyItem: PropertyItem) => ({
    title: propertyItem.title,
    desc: propertyItem.desc,
    content: propertyItem.content,
    price: propertyItem.price,
    address: propertyItem.address,
    bedrooms: propertyItem.bedrooms,
    bathrooms: propertyItem.bathrooms,
    areaSqft: propertyItem.areaSqft,
    parking: propertyItem.parking,
    propertyType: propertyItem.propertyType,
    listingType: propertyItem.listingType,
    subtitle: propertyItem.subtitle,
    statusText: propertyItem.statusText,
    amenities: parsePropertyAmenities(propertyItem.amenities).map(
      (item) => item.name,
    ),
  });

  const generatePropertyImage = async (
    field: Extract<PropertyAiField, "image" | "gallery">,
    hintParts: string[],
    avoidSrcs: string[] = [],
  ) => {
    if (!draft.title.trim()) return;
    if (!requireCorePlanForAi()) return;
    setAiFieldBusy(field);
    try {
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
          category: "realestate",
          locale,
          timeZone,
          hint: hintParts.filter(Boolean).join(" ").slice(0, 240),
          avoidSrc: avoidSrcs[0],
          avoidSrcs,
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { url?: string };
      const nextSrc = typeof data.url === "string" ? data.url.trim() : "";
      if (!nextSrc) return;

      setDraft((current) => {
        if (field === "image") {
          return { ...current, image: nextSrc, alt: current.alt || current.title };
        }
        const gallery = [...(current.gallery || [])];
        gallery.push(nextSrc);
        return { ...current, gallery };
      });
    } catch {
      /* keep current image on failure */
    } finally {
      setAiFieldBusy(null);
    }
  };

  const generatePropertyText = async (
    field: Extract<PropertyAiField, "summary" | "content" | "seo">,
  ) => {
    if (!draft.title.trim()) return;
    if (!requireCorePlanForAi()) return;
    setAiFieldBusy(field);
    try {
      const response = await fetch("/api/ai/property-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          property: propertyAiContext(draft),
          existing:
            field === "summary"
              ? draft.desc
              : field === "content"
                ? draft.content
                : draft.seoDescription,
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        text?: string;
        seoTitle?: string;
        seoDescription?: string;
        seoKeywords?: string;
      };

      setDraft((current) => {
        if (field === "summary" && data.text) {
          return { ...current, desc: data.text };
        }
        if (field === "content" && data.text) {
          return { ...current, content: data.text };
        }
        if (field === "seo") {
          return {
            ...current,
            seoTitle: data.seoTitle || current.seoTitle,
            seoDescription: data.seoDescription || current.seoDescription,
            seoKeywords: data.seoKeywords || current.seoKeywords,
          };
        }
        return current;
      });
    } catch {
      /* keep current text on failure */
    } finally {
      setAiFieldBusy(null);
    }
  };

  useEffect(() => {
    setListPage(1);
  }, [search]);

  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / LIST_PAGE_SIZE),
  );
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedProperties = useMemo(() => {
    const start = (safeListPage - 1) * LIST_PAGE_SIZE;
    return filteredProperties.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredProperties, safeListPage]);

  useEffect(() => {
    if (listPage !== safeListPage) setListPage(safeListPage);
  }, [listPage, safeListPage]);

  const openCreate = () => {
    setEditingId(null);
    const created = emptyProperty(nextDefaultOrder, localDetailLayout);
    created.category = categories[0] || DEFAULT_PROPERTY_CATEGORY;
    created.propertyType =
      propertyTypes[0]?.value || DEFAULT_PROPERTY_TYPE;
    created.listingType = listingTypes[0]?.value || DEFAULT_LISTING_TYPE;
    setDraft(created);
    setAmenityDraftName("");
    setAmenityDraftIcon(DEFAULT_PROPERTY_AMENITY_ICON);
    setShowComposer(true);
  };

  const openEdit = (propertyItem: PropertyItem) => {
    setEditingId(propertyItem.id);
    setDraft({
      ...emptyProperty(1, localDetailLayout),
      ...propertyItem,
      content: propertyItem.content || "",
      slug: propertyItem.slug || createPropertySlug(propertyItem.title),
      order: propertyItem.order ?? 1,
      active: propertyItem.active !== false,
      layout: propertyItem.layout || localDetailLayout,
      seoTitle: propertyItem.seoTitle || "",
      seoDescription: propertyItem.seoDescription || "",
      seoKeywords: propertyItem.seoKeywords || "",
      price: propertyItem.price || "",
      address: propertyItem.address || "",
      bedrooms: propertyItem.bedrooms || "",
      bathrooms: propertyItem.bathrooms || "",
      areaSqft: propertyItem.areaSqft || "",
      parking: propertyItem.parking || "",
      propertyType: normalizePropertyTypeValue(
        propertyItem.propertyType,
        propertyTypes,
      ),
      listingType: normalizeListingTypeValue(
        propertyItem.listingType,
        listingTypes,
      ),
      subtitle: propertyItem.subtitle || "",
      statusText: propertyItem.statusText || "",
      amenities: parsePropertyAmenities(propertyItem.amenities),
      floorPlan: propertyItem.floorPlan || "",
      gallery: Array.isArray(propertyItem.gallery)
        ? propertyItem.gallery.filter(Boolean)
        : [],
    });
    setAmenityDraftName("");
    setAmenityDraftIcon(DEFAULT_PROPERTY_AMENITY_ICON);
    setShowComposer(true);
  };

  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;
    const STORAGE_KEY = "ai-builder-open-manager-item:Properties";
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    window.sessionStorage.removeItem(STORAGE_KEY);

    try {
      const payload = JSON.parse(raw) as
        | { slug?: string; href?: string }
        | unknown;
      const slug = typeof (payload as any)?.slug === "string" ? (payload as any).slug : undefined;
      const found =
        slug ? pageState.properties.find((p) => p.slug === slug) : undefined;
      if (found) {
        setActiveTab("properties");
        openEdit(found);
      }
    } catch {
      // ignore malformed storage payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pageState.properties]);

  const closeComposer = () => {
    setShowComposer(false);
    setEditingId(null);
    setAmenityDraftName("");
    setAmenityDraftIcon(DEFAULT_PROPERTY_AMENITY_ICON);
    setShowContentEditor(false);
    setDraft(emptyProperty());
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
      const renamedProperties = pageState.properties.map((propertyItem) =>
        (propertyItem.category || DEFAULT_PROPERTY_CATEGORY) === editingCategory
          ? { ...propertyItem, category: nextName }
          : propertyItem,
      );
      persist({ ...pageState, properties: renamedProperties });
      if (
        (draft.category || DEFAULT_PROPERTY_CATEGORY) === editingCategory
      ) {
        setDraft((current) => ({ ...current, category: nextName }));
      }
    }

    cancelEditCategory();
  };

  const addPropertyType = () => {
    const label = propertyTypeName.trim();
    if (!label) return;
    setPropertyTypes((current) => {
      if (
        current.some(
          (option) => option.label.toLowerCase() === label.toLowerCase(),
        )
      ) {
        return current;
      }
      const next = [
        ...current,
        { value: uniqueOptionValue(label, current), label },
      ];
      persistPropertyTypes(next);
      return next;
    });
    setPropertyTypeName("");
  };

  const startEditPropertyType = (value: string) => {
    const match = propertyTypes.find((option) => option.value === value);
    if (!match) return;
    setEditingPropertyType(value);
    setEditPropertyTypeLabel(match.label);
  };

  const cancelEditPropertyType = () => {
    setEditingPropertyType(null);
    setEditPropertyTypeLabel("");
  };

  const saveEditPropertyType = () => {
    if (!editingPropertyType) return;
    const nextLabel = editPropertyTypeLabel.trim();
    if (!nextLabel) return;
    const duplicate = propertyTypes.some(
      (option) =>
        option.value !== editingPropertyType &&
        option.label.toLowerCase() === nextLabel.toLowerCase(),
    );
    if (duplicate) return;

    setPropertyTypes((current) => {
      const next = current.map((option) =>
        option.value === editingPropertyType
          ? { ...option, label: nextLabel }
          : option,
      );
      persistPropertyTypes(next);
      return next;
    });
    cancelEditPropertyType();
  };

  const addListingType = () => {
    const label = listingTypeName.trim();
    if (!label) return;
    setListingTypes((current) => {
      if (
        current.some(
          (option) => option.label.toLowerCase() === label.toLowerCase(),
        )
      ) {
        return current;
      }
      const next = [
        ...current,
        { value: uniqueOptionValue(label, current), label },
      ];
      persistListingTypes(next);
      return next;
    });
    setListingTypeName("");
  };

  const startEditListingType = (value: string) => {
    const match = listingTypes.find((option) => option.value === value);
    if (!match) return;
    setEditingListingType(value);
    setEditListingTypeLabel(match.label);
  };

  const cancelEditListingType = () => {
    setEditingListingType(null);
    setEditListingTypeLabel("");
  };

  const saveEditListingType = () => {
    if (!editingListingType) return;
    const nextLabel = editListingTypeLabel.trim();
    if (!nextLabel) return;
    const duplicate = listingTypes.some(
      (option) =>
        option.value !== editingListingType &&
        option.label.toLowerCase() === nextLabel.toLowerCase(),
    );
    if (duplicate) return;

    setListingTypes((current) => {
      const next = current.map((option) =>
        option.value === editingListingType
          ? { ...option, label: nextLabel }
          : option,
      );
      persistListingTypes(next);
      return next;
    });
    cancelEditListingType();
  };

  const saveProperty = () => {
    const title = draft.title.trim();
    if (!title) return;

    const slug = uniquePropertySlug(
      createPropertySlug(draft.slug || title) || `property-${Date.now()}`,
      pageState.properties,
      editingId,
    );

    const nextItem: PropertyItem = {
      ...draft,
      title,
      category: draft.category.trim() || DEFAULT_PROPERTY_CATEGORY,
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
      price: draft.price?.trim() || "",
      address: draft.address?.trim() || "",
      bedrooms: draft.bedrooms?.trim() || "",
      bathrooms: draft.bathrooms?.trim() || "",
      areaSqft: draft.areaSqft?.trim() || "",
      parking: draft.parking?.trim() || "",
      propertyType: normalizePropertyTypeValue(draft.propertyType, propertyTypes),
      listingType: normalizeListingTypeValue(draft.listingType, listingTypes),
      subtitle: draft.subtitle?.trim() || "",
      statusText: draft.statusText?.trim() || "",
      amenities: serializePropertyAmenities(
        parsePropertyAmenities(draft.amenities),
      ),
      floorPlan: draft.floorPlan?.trim() || "",
      gallery: (draft.gallery || []).map((item) => item.trim()).filter(Boolean),
      featured: draft.featured === true,
    };

    const properties = editingId
      ? pageState.properties.map((item) =>
          item.id === editingId ? nextItem : item,
        )
      : [...pageState.properties, nextItem];

    const withLayout = {
      ...pageState,
      properties,
      layout: normalizePropertyIndexLayout(pageState.layout || localIndexLayout),
      detailLayout: normalizePropertyDetailLayout(
        pageState.detailLayout || localDetailLayout,
      ),
    };

    setPageState(withLayout);
    queueMicrotask(() => {
      window.dispatchEvent(
        new CustomEvent("ai-builder-property-page-update", {
          detail: withLayout,
        }),
      );
    });
    closeComposer();
  };

  const deleteProperty = (id: string) => {
    const withLayout = {
      ...pageState,
      properties: pageState.properties.filter((item) => item.id !== id),
      layout: normalizePropertyIndexLayout(pageState.layout || localIndexLayout),
      detailLayout: normalizePropertyDetailLayout(
        pageState.detailLayout || localDetailLayout,
      ),
    };
    setPageState(withLayout);
    queueMicrotask(() => {
      window.dispatchEvent(
        new CustomEvent("ai-builder-property-page-update", {
          detail: withLayout,
        }),
      );
    });
  };

  const deletePropertiesByIds = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    const withLayout = {
      ...pageState,
      properties: pageState.properties.filter((item) => !idSet.has(item.id)),
      layout: normalizePropertyIndexLayout(pageState.layout || localIndexLayout),
      detailLayout: normalizePropertyDetailLayout(
        pageState.detailLayout || localDetailLayout,
      ),
    };
    setPageState(withLayout);
    queueMicrotask(() => {
      window.dispatchEvent(
        new CustomEvent("ai-builder-property-page-update", {
          detail: withLayout,
        }),
      );
    });
    setSelected([]);
  };

  const confirmDeleteProperty = () => {
    if (!propertyToDelete) return;
    deleteProperty(propertyToDelete.id);
    setSelected((current) =>
      current.filter((id) => id !== propertyToDelete.id),
    );
    setPropertyToDelete(null);
  };

  const content = (
    <div
      className="fixed inset-0 z-[10050] flex min-h-0 flex-col bg-white text-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-manager-title"
    >
      <header className="flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Properties
          </p>
          <h1 id="property-manager-title" className="sr-only">
            Property page manager
          </h1>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <label
            className={`flex max-w-full cursor-pointer items-center gap-2.5 rounded-full border px-3 py-1.5 sm:px-4 ${
              propertiesWebsiteEnabled
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
              checked={propertiesWebsiteEnabled}
              onChange={(event) =>
                setPropertiesWebsiteEnabled(event.target.checked)
              }
            />
            <span
              aria-hidden="true"
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                propertiesWebsiteEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  propertiesWebsiteEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Property page help"
          >
            <CircleHelp size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close property manager"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {!propertiesWebsiteEnabled ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-900 sm:px-7">
          Properties are hidden on the live website. Items stay saved here —{" "}
          <span className="font-semibold">/properties</span> and detail links
          will show 404 until you turn{" "}
          <span className="font-semibold">Show on website</span> on, then
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
              Loading property page…
            </div>
          ) : null}

          {ready && activeTab === "properties" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Property listings
                  </h2>
                  <p className="mt-2 max-w-2xl text-base text-slate-600">
                    Add homes here. The same listing can show on For Sale / For
                    Rent pages, and on the homepage if you mark it featured.
                    Your website theme keeps its own card design.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="AI Assist — generate properties"
                    aria-label="AI Assist"
                    onClick={() => {
                      if (!requireCorePlanForAi()) return;
                      window.dispatchEvent(
                        new CustomEvent("ai-builder-open-ai-assist", {
                          detail: {
                            source: "property-manager",
                            hint: "add properties",
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
                    New listing
                  </button>
                </div>
              </div>

              <div className="mt-6 flex max-w-md items-center gap-2 rounded-xl border border-slate-300 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search properties"
                  className="h-11 w-full bg-transparent text-sm outline-none"
                />
              </div>

              {selected.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">
                    {selected.length} propert
                    {selected.length === 1 ? "y" : "ies"} selected
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
                <div className="grid grid-cols-[42px_minmax(180px,1.3fr)_100px_120px_120px_70px_90px_100px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <input
                    type="checkbox"
                    checked={
                      pagedProperties.length > 0 &&
                      pagedProperties.every((item) =>
                        selected.includes(item.id),
                      )
                    }
                    onChange={() => {
                      const ids = pagedProperties.map((item) => item.id);
                      const allSelected = ids.every((id) =>
                        selected.includes(id),
                      );
                      setSelected((current) =>
                        allSelected
                          ? current.filter((id) => !ids.includes(id))
                          : Array.from(new Set([...current, ...ids])),
                      );
                    }}
                    aria-label="Select all properties on this page"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>Property</span>
                  <span>Listing</span>
                  <span>Type</span>
                  <span>Price</span>
                  <span>Order</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                {pagedProperties.map((item) => {
                  const isActive = item.active !== false;
                  const isRent =
                    normalizeListingTypeValue(item.listingType, listingTypes) ===
                    "rent";
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[42px_minmax(180px,1.3fr)_100px_120px_120px_70px_90px_100px] items-center border-b border-slate-200 px-5 py-4 last:border-b-0"
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
                            {item.address || item.desc || "No location yet"}
                          </p>
                          {item.featured === true ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                              <Home size={11} /> Also on homepage
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          isRent ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        {listingTypeLabelFor(item.listingType, listingTypes)}
                      </span>
                      <span className="text-sm text-slate-600">
                        {propertyTypeLabelFor(item.propertyType, propertyTypes)}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {item.price || "—"}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {item.order ?? "—"}
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
                        {isActive ? "Visible" : "Hidden"}
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
                          onClick={() => setPropertyToDelete(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredProperties.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-slate-500">
                    No listings yet. Add a home to show it on For Sale / For
                    Rent pages.
                  </div>
                )}

                {filteredProperties.length > LIST_PAGE_SIZE ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                    <p className="text-sm text-slate-600">
                      Showing {(safeListPage - 1) * LIST_PAGE_SIZE + 1}–
                      {Math.min(
                        safeListPage * LIST_PAGE_SIZE,
                        filteredProperties.length,
                      )}{" "}
                      of {filteredProperties.length}
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
                Groups
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Optional labels such as Residential or Commercial. This does not
                decide Sale vs Rent — use Sale / Rent for that.
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
                  placeholder="e.g. Residential"
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
                  const used = pageState.properties.some(
                    (item) =>
                      (item.category || DEFAULT_PROPERTY_CATEGORY) ===
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
                            {category === DEFAULT_PROPERTY_CATEGORY ? (
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

          {ready && activeTab === "propertyTypes" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Home types
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Apartment, Villa, Plot, and similar. Visitors use these in
                listing filters.
              </p>
              <form
                className="mt-7 flex max-w-xl gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  addPropertyType();
                }}
              >
                <input
                  value={propertyTypeName}
                  onChange={(event) => setPropertyTypeName(event.target.value)}
                  placeholder="e.g. Apartment"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!propertyTypeName.trim()}
                  className="rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add type
                </button>
              </form>
              <div className="mt-6 max-w-xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {propertyTypes.map((option) => {
                  const used = pageState.properties.some(
                    (item) =>
                      normalizePropertyTypeValue(
                        item.propertyType,
                        propertyTypes,
                      ) === option.value,
                  );
                  const isEditingType = editingPropertyType === option.value;

                  return (
                    <div
                      key={option.value}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      {isEditingType ? (
                        <form
                          className="flex min-w-0 flex-1 items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            saveEditPropertyType();
                          }}
                        >
                          <Home size={16} className="shrink-0 text-blue-600" />
                          <input
                            autoFocus
                            value={editPropertyTypeLabel}
                            onChange={(event) =>
                              setEditPropertyTypeLabel(event.target.value)
                            }
                            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            aria-label={`Rename ${option.label}`}
                          />
                          <button
                            type="submit"
                            disabled={!editPropertyTypeLabel.trim()}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPropertyType}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-800">
                            <Home size={16} className="shrink-0 text-blue-600" />
                            <span className="truncate">{option.label}</span>
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditPropertyType(option.value)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Edit ${option.label}`}
                              title="Edit property type"
                            >
                              <FilePenLine size={15} />
                            </button>
                            {option.value === DEFAULT_PROPERTY_TYPE ? (
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
                                  setPropertyTypes((current) => {
                                    const next = current.filter(
                                      (item) => item.value !== option.value,
                                    );
                                    persistPropertyTypes(next);
                                    return next;
                                  })
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${option.label}`}
                                title="Delete property type"
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

          {ready && activeTab === "listingTypes" && (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Sale or Rent
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                This is what visitors see as the badge (For Sale / For Rent) and
                which listing page the property appears on.
              </p>
              <form
                className="mt-7 flex max-w-xl gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  addListingType();
                }}
              >
                <input
                  value={listingTypeName}
                  onChange={(event) => setListingTypeName(event.target.value)}
                  placeholder="e.g. For Sale"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!listingTypeName.trim()}
                  className="rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add type
                </button>
              </form>
              <div className="mt-6 max-w-xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {listingTypes.map((option) => {
                  const used = pageState.properties.some(
                    (item) =>
                      normalizeListingTypeValue(
                        item.listingType,
                        listingTypes,
                      ) === option.value,
                  );
                  const isEditingType = editingListingType === option.value;

                  return (
                    <div
                      key={option.value}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      {isEditingType ? (
                        <form
                          className="flex min-w-0 flex-1 items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            saveEditListingType();
                          }}
                        >
                          <KeyRound
                            size={16}
                            className="shrink-0 text-blue-600"
                          />
                          <input
                            autoFocus
                            value={editListingTypeLabel}
                            onChange={(event) =>
                              setEditListingTypeLabel(event.target.value)
                            }
                            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            aria-label={`Rename ${option.label}`}
                          />
                          <button
                            type="submit"
                            disabled={!editListingTypeLabel.trim()}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditListingType}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-800">
                            <KeyRound
                              size={16}
                              className="shrink-0 text-blue-600"
                            />
                            <span className="truncate">{option.label}</span>
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditListingType(option.value)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Edit ${option.label}`}
                              title="Edit listing type"
                            >
                              <FilePenLine size={15} />
                            </button>
                            {option.value === DEFAULT_LISTING_TYPE ? (
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
                                  setListingTypes((current) => {
                                    const next = current.filter(
                                      (item) => item.value !== option.value,
                                    );
                                    persistListingTypes(next);
                                    return next;
                                  })
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${option.label}`}
                                title="Delete listing type"
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
                  Page layouts
                </h2>
                <p className="mt-2 max-w-2xl text-base text-slate-600">
                  These layouts apply to standard property pages (1–4). Premium
                  website themes keep their own design — picking a layout here
                  does not restyle those cards.
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
                  Properties
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

              <p className="mt-5 text-sm text-slate-500">
                {layoutPane === "index"
                  ? "Listing page layout for standard templates. Your current theme skin stays as-is."
                  : "Detail page layout for standard templates. Your current theme skin stays as-is."}
              </p>

              <div className="mt-6 grid w-full gap-7 md:grid-cols-2 xl:grid-cols-3">
                {(layoutPane === "index"
                  ? PROPERTY_INDEX_LAYOUTS
                  : PROPERTY_DETAIL_LAYOUTS
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
                          alt={`${layout.name} property layout preview`}
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
                Property page SEO
              </h2>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Meta tags for the Properties page. Each property can also have
                its own SEO in the add/edit form.
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
                    placeholder="Properties page title for Google"
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
                    placeholder="properties, apartments, villas, …"
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={savePropertySeo}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Check size={16} />
                    {seoSaveState === "saved" ? "Saved" : "Save SEO"}
                  </button>
                  {seoSaveState === "saved" ? (
                    <span className="text-sm font-medium text-emerald-600">
                      Property page SEO updated.
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
                  {editingId ? "Edit listing" : "Add a listing"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update text, photos, and sale/rent here. The website theme
                  keeps its own look.
                </p>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="mx-auto w-full max-w-[820px] space-y-5 px-6 py-7">
                <FormSection
                  title="Basic info"
                  note="Name and photo visitors see first on listing cards."
                >
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Property name
                  </span>
                  <input
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        title: event.target.value,
                        slug:
                          !current.slug ||
                          current.slug === createPropertySlug(current.title)
                            ? createPropertySlug(event.target.value)
                            : current.slug,
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Gaur Cascades"
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-800">
                    Page URL
                  </span>
                  <input
                    value={draft.slug || ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        slug: createPropertySlug(event.target.value),
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="gaur-cascades"
                  />
                  <FieldNote>
                    Opens as /properties/{draft.slug || "your-page-name"}
                  </FieldNote>
                </label>
                </FormSection>

                <FormSection
                  title="Where it appears"
                  note="Sale / Rent decides the listing page. Home type is the filter. Group is only for your organisation."
                >
                <div className="grid gap-5 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Sale or Rent
                    </span>
                    <select
                      value={normalizeListingTypeValue(
                        draft.listingType,
                        listingTypes,
                      )}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          listingType: normalizeListingTypeValue(
                            event.target.value,
                            listingTypes,
                          ),
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {listingTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldNote>Badge and which listing page to use.</FieldNote>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Home type
                    </span>
                    <select
                      value={normalizePropertyTypeValue(
                        draft.propertyType,
                        propertyTypes,
                      )}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          propertyType: normalizePropertyTypeValue(
                            event.target.value,
                            propertyTypes,
                          ),
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {propertyTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldNote>Apartment, Villa, Plot… used in filters.</FieldNote>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Group
                    </span>
                    <select
                      value={
                        categories.includes(draft.category) ||
                        Boolean(draft.category)
                          ? draft.category || DEFAULT_PROPERTY_CATEGORY
                          : categories[0] || DEFAULT_PROPERTY_CATEGORY
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
                    <FieldNote>e.g. Residential — not Sale vs Rent.</FieldNote>
                  </label>
                </div>
                </FormSection>

                <FormSection
                  title="Listing card"
                  note="Price, location, and summary shown on For Sale / For Rent cards."
                >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Price
                    </span>
                    <input
                      value={draft.price || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="₹85 Lakh"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Location
                    </span>
                    <input
                      value={draft.address || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Bandra West, Mumbai"
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Card line
                    </span>
                    <input
                      value={draft.subtitle || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          subtitle: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="4 BHK Villa • Puri"
                    />
                    <FieldNote>Shown above the title on featured cards.</FieldNote>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Card badge
                    </span>
                    <input
                      value={draft.statusText || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          statusText: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Ready for visit"
                    />
                    <FieldNote>e.g. New listing, Available now.</FieldNote>
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Bedrooms
                    </span>
                    <input
                      value={draft.bedrooms || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          bedrooms: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="3"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Bathrooms
                    </span>
                    <input
                      value={draft.bathrooms || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          bathrooms: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="2"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Area (sqft)
                    </span>
                    <input
                      value={draft.areaSqft || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          areaSqft: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="1450"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Parking
                    </span>
                    <input
                      value={draft.parking || ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          parking: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="2"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Display order
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
                    Website visibility
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
                      Visible
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
                      Hidden
                    </button>
                  </div>
                  <FieldNote>
                    Hidden listings stay saved here but do not show on the
                    website.
                  </FieldNote>
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
                        Turn on for homepage property sections. Leave off for
                        listing pages only.
                      </span>
                    </span>
                  </label>
                </div>

                <label className="block">
                  <FieldLabelWithAi
                    label="Short summary"
                    aiTitle="AI generate short summary"
                    aiLoading={aiFieldBusy === "summary"}
                    onAiClick={() => generatePropertyText("summary")}
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
                    placeholder="One or two lines on the listing card"
                  />
                  <FieldNote>Shown on listing cards, not the long story.</FieldNote>
                </label>
                </FormSection>

                <FormSection
                  title="Property page"
                  note="Amenities, full story, and photos for the individual property page."
                >
                <div className="space-y-3">
                  <span className="block text-sm font-semibold text-slate-800">
                    Amenities
                  </span>
                  <FieldNote>
                    Shown on the property detail page. Leave empty to hide this
                    block.
                  </FieldNote>

                  {parsePropertyAmenities(draft.amenities).length ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {parsePropertyAmenities(draft.amenities).map(
                        (amenity, index) => {
                          const Icon = getPropertyAmenityIcon(amenity.icon);
                          return (
                            <li
                              key={`${amenity.name}-${amenity.icon}-${index}`}
                              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
                                <Icon size={15} strokeWidth={2.25} />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                                {amenity.name}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraft((current) => ({
                                    ...current,
                                    amenities: parsePropertyAmenities(
                                      current.amenities,
                                    ).filter((_, itemIndex) => itemIndex !== index),
                                  }))
                                }
                                className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                aria-label={`Remove ${amenity.name}`}
                              >
                                <X size={14} />
                              </button>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  ) : null}

                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">
                        Amenity Name <span className="text-rose-500">*</span>
                      </span>
                      <input
                        value={amenityDraftName}
                        onChange={(event) =>
                          setAmenityDraftName(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          const name = amenityDraftName.trim();
                          if (!name) return;
                          setDraft((current) => ({
                            ...current,
                            amenities: [
                              ...parsePropertyAmenities(current.amenities),
                              {
                                name,
                                icon:
                                  amenityDraftIcon ||
                                  DEFAULT_PROPERTY_AMENITY_ICON,
                              },
                            ],
                          }));
                          setAmenityDraftName("");
                        }}
                        className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="e.g. Club House, Swimming Pool, High Speed Lifts"
                      />
                    </label>

                    <div>
                      <span className="mb-2 block text-sm font-semibold text-slate-800">
                        Select Amenity Icon
                      </span>
                      <div className="mb-2 flex items-center gap-2.5">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-200 bg-blue-50 text-blue-600">
                          {(() => {
                            const Icon = getPropertyAmenityIcon(amenityDraftIcon);
                            return <Icon size={18} strokeWidth={2.25} />;
                          })()}
                        </span>
                        <p className="min-w-0 flex-1 text-sm font-medium text-slate-700">
                          {getPropertyAmenityOption(amenityDraftIcon).label}
                        </p>
                      </div>
                      <div className="max-h-44 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                          {PROPERTY_AMENITY_OPTIONS.map((option) => {
                            const Icon = option.Icon;
                            const selected = amenityDraftIcon === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                title={option.label}
                                onClick={() => {
                                  setAmenityDraftIcon(option.id);
                                  if (!amenityDraftName.trim()) {
                                    setAmenityDraftName(option.label);
                                  }
                                }}
                                className={`grid aspect-square place-items-center rounded-md border transition ${
                                  selected
                                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200"
                                    : "border-transparent bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                }`}
                              >
                                <Icon size={16} strokeWidth={2.25} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <span className="mt-1.5 block text-xs text-slate-500">
                        {PROPERTY_AMENITY_OPTIONS.length} icons — click to
                        select.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const name = amenityDraftName.trim();
                        if (!name) return;
                        setDraft((current) => ({
                          ...current,
                          amenities: [
                            ...parsePropertyAmenities(current.amenities),
                            {
                              name,
                              icon:
                                amenityDraftIcon ||
                                DEFAULT_PROPERTY_AMENITY_ICON,
                            },
                          ],
                        }));
                        setAmenityDraftName("");
                      }}
                      disabled={!amenityDraftName.trim()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={15} />
                      Add amenity
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">
                      Full details
                    </span>
                    <div className="flex items-center gap-2">
                      <AiFieldButton
                        title="AI generate full details"
                        loading={aiFieldBusy === "content"}
                        onClick={() => generatePropertyText("content")}
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
                        Write the full property story. Shown on the detail page.
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabelWithAi
                      label="Main photo"
                      aiTitle="AI generate main photo"
                      aiLoading={aiFieldBusy === "image"}
                      onAiClick={() =>
                        generatePropertyImage(
                          "image",
                          [
                            draft.title,
                            draft.propertyType,
                            draft.subtitle,
                            draft.address,
                            "main property photo exterior interior",
                          ],
                          [draft.image, ...(draft.gallery || [])],
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setImagePickerTarget("image")}
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

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Floor plan (optional)
                    </span>
                    <button
                      type="button"
                      onClick={() => setImagePickerTarget("floorPlan")}
                      className="group relative grid h-[102px] w-[102px] place-items-center overflow-hidden rounded-md border border-dashed border-slate-500 bg-slate-50 text-slate-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {draft.floorPlan ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={draft.floorPlan}
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
                          Plan
                        </span>
                      )}
                    </button>
                    {draft.floorPlan ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({ ...current, floorPlan: "" }))
                        }
                        className="mt-2 text-xs font-semibold text-slate-500 transition hover:text-red-600"
                      >
                        Remove floor plan
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <FieldLabelWithAi
                    label="Gallery"
                    aiTitle="AI add gallery photo"
                    aiLoading={aiFieldBusy === "gallery"}
                    onAiClick={() =>
                      generatePropertyImage(
                        "gallery",
                        [
                          draft.title,
                          draft.propertyType,
                          draft.subtitle,
                          draft.address,
                          "property gallery room view",
                        ],
                        [draft.image, ...(draft.gallery || [])],
                      )
                    }
                  />
                  <FieldNote>
                    Extra photos for the property detail carousel. Main photo is
                    always included on the page.
                  </FieldNote>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {(draft.gallery || []).map((src, index) => (
                      <div key={`${src}-${index}`} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryPickerIndex(index);
                            setImagePickerTarget("gallery");
                          }}
                          className="group relative grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-md border border-slate-300 bg-slate-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-1 text-center text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                            Change
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              gallery: (current.gallery || []).filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:text-red-600"
                          aria-label="Remove gallery photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryPickerIndex(null);
                        setImagePickerTarget("gallery");
                      }}
                      className="grid h-[88px] w-[88px] place-items-center rounded-md border border-dashed border-slate-400 bg-white text-slate-500 transition hover:border-blue-500 hover:text-blue-700"
                    >
                      <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                        <Plus size={18} />
                        Add
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Search listing (optional)
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Google title and summary for this one property. Leave blank
                        to use the name and short summary.
                      </p>
                    </div>
                    <AiFieldButton
                      title="AI generate SEO meta"
                      loading={aiFieldBusy === "seo"}
                      onClick={() => generatePropertyText("seo")}
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
                        placeholder="Defaults to property title"
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
                        placeholder="apartment, sea view, 3 bhk, …"
                      />
                    </label>
                  </div>
                </div>
                </FormSection>
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
                  onClick={saveProperty}
                  disabled={!draft.title.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {editingId ? "Save listing" : "Add listing"}
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
              placeholder="Write the full property story for the detail page..."
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
        open={imagePickerTarget !== null}
        title={
          imagePickerTarget === "floorPlan"
            ? "Floor plan image"
            : imagePickerTarget === "gallery"
              ? "Gallery photo"
              : "Property image"
        }
        initialValue={
          imagePickerTarget === "floorPlan"
            ? draft.floorPlan
            : imagePickerTarget === "gallery"
              ? draft.gallery?.[galleryPickerIndex ?? -1] || ""
              : draft.image
        }
        onClose={() => {
          setImagePickerTarget(null);
          setGalleryPickerIndex(null);
        }}
        onSelect={(source, fileName) => {
          setDraft((current) => {
            if (imagePickerTarget === "floorPlan") {
              return { ...current, floorPlan: source };
            }
            if (imagePickerTarget === "gallery") {
              const gallery = [...(current.gallery || [])];
              if (
                galleryPickerIndex !== null &&
                galleryPickerIndex >= 0 &&
                galleryPickerIndex < gallery.length
              ) {
                gallery[galleryPickerIndex] = source;
              } else {
                gallery.push(source);
              }
              return { ...current, gallery };
            }
            return {
              ...current,
              image: source,
              alt: fileName || current.alt || current.title,
            };
          });
          setImagePickerTarget(null);
          setGalleryPickerIndex(null);
        }}
      />

      {propertyToDelete ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-property-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete property
            </p>
            <h3
              id="delete-property-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Are you sure you want to delete “
              {propertyToDelete.title.trim() || "this property"}”?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes it from the Properties page. You can’t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={confirmDeleteProperty}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
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
            aria-labelledby="bulk-delete-property-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete properties
            </p>
            <h3
              id="bulk-delete-property-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Delete {selected.length} selected propert
              {selected.length === 1 ? "y" : "ies"}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes them from the Properties page. You can&apos;t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  deletePropertiesByIds(selected);
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
