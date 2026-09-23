import { selectedConfig } from "./selectedConfig";
import categoryContentJson from "./categoryContent.json";
import type { SectionData, SectionItem, SelectedConfig } from "../types/section";

export type CategoryKey = string;

export type BuilderTemplate = {
  id: string;
  numericId: number;
  title: string;
  type: "Single Page Website" | "Multiple Pages Website";
  image?: string | null;
  previewimage?: string | null;
  preview_description?: string | null;
  prebuilt_pages: number;
  pages?: Array<{ id: string; label: string; sectionType: string }> | null;
  /** When set, home canvas order follows this list (template-1 style). */
  homeSectionOrder?: string[] | null;
  sectionVariants: Record<string, string>;
  variables?: Record<string, string>;
  status?: string;
};

export type CategoryMeta = {
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  templates: string[];
};

export type BuilderLayout = {
  id: string;
  key: string;
  name: string;
  sectionType: string;
  sectionNumber: number;
  categorySlug?: string | null;
  scope: "home" | "page" | string;
  order: number;
  status?: string;
  thumbnailUrl?: string | null;
  description?: string | null;
};

type SectionContentMap = Partial<Record<string, Record<string, unknown>>>;

type CategoryContentRecord = {
  templates: BuilderTemplate[];
  layouts: BuilderLayout[];
  common: SectionContentMap;
  categories: Record<
    string,
    {
      templates: string[];
      sections: SectionContentMap;
      description?: string | null;
      icon?: string | null;
      slug?: string;
      status?: string;
    }
  >;
};

/** Mutable store: starts from JSON, can be replaced by Postgres bundle */
let categoryContent: CategoryContentRecord = {
  ...(structuredClone(categoryContentJson) as unknown as Omit<
    CategoryContentRecord,
    "layouts"
  >),
  layouts: [],
};

let inFlightBundleRefresh: Promise<boolean> | null = null;
let bundleLastRefreshAt = 0;
const BUNDLE_REFRESH_TTL_MS = 60_000;

/** Frozen JSON skins — API bundle must not overwrite premium -5/-6 variants. */
const jsonBuilderTemplates = (
  structuredClone(categoryContentJson) as unknown as CategoryContentRecord
).templates;

const mergeRemoteTemplates = (remote: BuilderTemplate[]) => {
  const jsonById = new Map(jsonBuilderTemplates.map((item) => [item.id, item]));
  const remoteIds = new Set(remote.map((item) => item.id));
  const merged = remote.map((item) => {
    const local = jsonById.get(item.id);
    if (!local) return item;
    return {
      ...item,
      title: local.title,
      type: local.type,
      pages: local.pages || item.pages,
      homeSectionOrder: local.homeSectionOrder || item.homeSectionOrder,
      sectionVariants: local.sectionVariants,
      variables: local.variables || item.variables,
      preview_description: local.preview_description || item.preview_description,
    };
  });
  return [
    ...merged,
    ...jsonBuilderTemplates.filter((item) => !remoteIds.has(item.id)),
  ];
};

export const applyContentBundle = (
  bundle: Partial<CategoryContentRecord> | null | undefined,
) => {
  if (!bundle) return;
  categoryContent = {
    templates: Array.isArray(bundle.templates)
      ? mergeRemoteTemplates(bundle.templates as BuilderTemplate[])
      : categoryContent.templates,
    layouts: Array.isArray(bundle.layouts)
      ? (bundle.layouts as BuilderLayout[])
      : categoryContent.layouts,
    common:
      bundle.common && typeof bundle.common === "object"
        ? (bundle.common as SectionContentMap)
        : categoryContent.common,
    categories:
      bundle.categories && typeof bundle.categories === "object"
        ? (bundle.categories as CategoryContentRecord["categories"])
        : categoryContent.categories,
  };
};

export const getContentBundle = () => categoryContent;

export async function refreshCategoryContentFromApi(signal?: AbortSignal) {
  const base =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  if (inFlightBundleRefresh) {
    return inFlightBundleRefresh;
  }

  if (
    Date.now() - bundleLastRefreshAt < BUNDLE_REFRESH_TTL_MS &&
    categoryContent.layouts.length > 0
  ) {
    return true;
  }

  inFlightBundleRefresh = (async () => {
    try {
      const res = await fetch(`${base}/contents/bundle`, {
        cache: "no-store",
        signal,
      });
      if (!res.ok) return false;
      const data = (await res.json()) as Partial<CategoryContentRecord>;
      applyContentBundle(data);
      bundleLastRefreshAt = Date.now();
      return true;
    } catch {
      return false;
    } finally {
      inFlightBundleRefresh = null;
    }
  })();

  return inFlightBundleRefresh;
}

export const getBuilderTemplates = () => categoryContent.templates;

/** @deprecated Prefer getBuilderTemplates() — kept for compatibility */
export const builderTemplates = categoryContent.templates;

export const getCategoryNamesWithContent = () =>
  Object.keys(categoryContent.categories);

/** Categories available for user onboarding (from DB bundle / JSON) */
export const getCategoriesForOnboarding = (): CategoryMeta[] =>
  Object.entries(categoryContent.categories).map(([name, pack]) => ({
    name,
    slug: pack.slug,
    description: pack.description,
    icon: pack.icon,
    templates: Array.isArray(pack.templates) ? pack.templates : [],
  }));

export const hasCategoryContent = (category: string) =>
  Boolean(categoryContent.categories[category]);

export const getTemplateIdsForCategory = (category: string) => {
  const keys = categoryContent.categories[category]?.templates ?? [];
  return Array.isArray(keys) ? keys : [];
};

export const getTemplatesForCategory = (category: string) => {
  const templateIds = getTemplateIdsForCategory(category);
  const templates = getBuilderTemplates().filter(
    (template) => !template.status || template.status === "Active",
  );

  return templates.filter((template) => templateIds.includes(template.id));
};

const LOCKED_LAYOUT_TYPES = new Set(["Topbar", "Header", "Footer"]);

/** Active database variants available to the current category and page scope. */
export const getAddableLayoutsForCategory = (
  category: string,
  scope: "home" | "page" = "home",
) => {
  const categorySlug = categoryContent.categories[category]?.slug
    ?.trim()
    .toLowerCase();

  return categoryContent.layouts
    .filter((layout) => !layout.status || layout.status === "Active")
    .filter((layout) => !LOCKED_LAYOUT_TYPES.has(layout.sectionType))
    .filter((layout) => !layout.categorySlug || layout.categorySlug.toLowerCase() === categorySlug)
    .filter((layout) => (layout.scope || "home") === scope)
    .sort(
      (left, right) =>
        left.order - right.order ||
        left.sectionType.localeCompare(right.sectionType) ||
        left.sectionNumber - right.sectionNumber,
    );
};

/** Active database layout variants assigned to this category (plus shared variants). */
export const getSectionLayoutsForCategory = (
  category: string,
  sectionTypes: string | string[],
  scope: "home" | "page" = "home",
) => {
  const categorySlug = categoryContent.categories[category]?.slug
    ?.trim()
    .toLowerCase();
  const allowedTypes = new Set(
    (Array.isArray(sectionTypes) ? sectionTypes : [sectionTypes]).map((type) =>
      type.trim().toLowerCase(),
    ),
  );

  return categoryContent.layouts
    .filter((layout) => !layout.status || layout.status === "Active")
    .filter((layout) => allowedTypes.has(layout.sectionType.trim().toLowerCase()))
    .filter(
      (layout) =>
        !layout.categorySlug ||
        layout.categorySlug.trim().toLowerCase() === categorySlug,
    )
    .filter((layout) => (layout.scope || "home") === scope)
    .sort(
      (left, right) =>
        left.order - right.order ||
        left.sectionNumber - right.sectionNumber ||
        left.name.localeCompare(right.name),
  );
};

export const addableSectionCards = [
  {
    type: "Banner",
    variant: "Banner-1",
    title: "Banner",
    description: "Image hero section",
  },
  {
    type: "About",
    variant: "About-1",
    title: "About",
    description: "Company intro section",
  },
  {
    type: "Product",
    variant: "Product-2",
    title: "Services",
    description: "Service cards section",
  },
  {
    type: "WhyChooseUs",
    variant: "WhyChooseUs-1",
    title: "Why choose us",
    description: "Trust points section",
  },
  {
    type: "Gallery",
    variant: "Gallery-1",
    title: "Gallery",
    description: "Image showcase section",
  },
  {
    type: "FormDetail",
    variant: "FormDetail-1",
    title: "Form",
    description: "Lead detail section",
  },
  {
    type: "FAQ",
    variant: "FAQ-1",
    title: "FAQ",
    description: "Question answer section",
  },
  {
    type: "Testimonial",
    variant: "Testimonial-1",
    title: "Our Clients",
    description: "Client reviews section",
  },
  {
    type: "CountriesServe",
    variant: "CountriesServe-1",
    title: "Countries We Serve",
    description: "Countries with flags and city listings",
  },
  {
    type: "Features",
    variant: "Features-5",
    title: "Features",
    description: "Realestate feature strip",
  },
  {
    type: "Highlight",
    variant: "Highlight-5",
    title: "Highlight",
    description: "Property type highlights",
  },
  {
    type: "Featured",
    variant: "Featured-5",
    title: "Featured listings",
    description: "Featured property carousel",
  },
  {
    type: "LatestProject",
    variant: "LatestProject-5",
    title: "Latest projects",
    description: "Recently delivered projects",
  },
  {
    type: "Cities",
    variant: "Cities-5",
    title: "Portfolio",
    description: "Project portfolio grid",
  },
  {
    type: "FeaturedDev",
    variant: "FeaturedDev-5",
    title: "Featured developers",
    description: "Developer partner logos",
  },
  {
    type: "Process",
    variant: "Process-5",
    title: "Property process",
    description: "Buy / sell process steps",
  },
  {
    type: "Awards",
    variant: "Awards-5",
    title: "Awards",
    description: "Recognition and awards",
  },
  {
    type: "Stats",
    variant: "Stats-5",
    title: "Company stats",
    description: "Key metrics strip",
  },
  {
    type: "Blog",
    variant: "Blog-5",
    title: "Blog",
    description: "Latest insights",
  },
  {
    type: "Contact",
    variant: "Contact-5",
    title: "Contact",
    description: "Realestate contact / enquiry",
  },
  {
    type: "InvestmentOpportunities",
    variant: "InvestmentOpportunities-5",
    title: "Investment opportunities",
    description: "Investment listings",
  },
] as const;

const cloneSections = (sections: SectionItem[]) =>
  structuredClone(sections) as SectionItem[];

const applyBannerVariantDefaults = (
  variant: string,
  data: Record<string, unknown>,
) => {
  const sourceImage =
    typeof data.backgroundImage === "string" ? data.backgroundImage : "/bg1.jpg";
  const sourceVideo =
    typeof data.backgroundVideo === "string"
      ? data.backgroundVideo
      : "/video.mp4";
  const sourceSlides = Array.isArray(data.bannerSlides)
    ? data.bannerSlides
    : [];

  if (variant === "Banner-1") {
    return {
      ...data,
      bannerBackgroundMode: "image",
      backgroundImage: sourceImage,
    };
  }

  if (variant === "Banner-2") {
    return {
      ...data,
      bannerBackgroundMode: "video",
      backgroundVideo: sourceVideo,
      backgroundImage: sourceImage,
    };
  }

  if (variant === "Banner-3") {
    return {
      ...data,
      bannerSlides: sourceSlides,
    };
  }

  if (variant === "Banner-4") {
    return {
      ...data,
      bannerSlides: sourceSlides.length
        ? sourceSlides.map((slide) =>
            typeof slide === "object" && slide !== null && !Array.isArray(slide)
              ? {
                  ...slide,
                  image:
                    typeof (slide as { image?: unknown }).image === "string"
                      ? (slide as { image: string }).image
                      : sourceImage,
                  video:
                    typeof (slide as { video?: unknown }).video === "string"
                      ? (slide as { video: string }).video
                      : sourceVideo,
                }
              : slide,
          )
        : [],
    };
  }

  return data;
};

const VARIANT_KEY_RE = /^[A-Za-z][A-Za-z0-9]*-\d+$/;

const isVariantKeyedMap = (
  pack: unknown,
): boolean => {
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) return false;
  return Object.keys(pack).some((k) => VARIANT_KEY_RE.test(k));
};

const sharedFieldsFromPack = (
  pack: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  if (!pack) return {};
  if (!isVariantKeyedMap(pack)) return { ...pack };
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(pack)) {
    if (!VARIANT_KEY_RE.test(key)) out[key] = value;
  }
  return out;
};

/** Resolve content for one layout variant (supports legacy flat + per-variant maps) */
export const resolveVariantContent = (
  pack: Record<string, unknown> | undefined | null,
  variantKey: string,
): Record<string, unknown> => {
  if (!pack || typeof pack !== "object") return {};
  if (isVariantKeyedMap(pack)) {
    const specific = pack[variantKey];
    const fromKey =
      specific && typeof specific === "object" && !Array.isArray(specific)
        ? (specific as Record<string, unknown>)
        : null;
    return {
      ...sharedFieldsFromPack(pack),
      ...(fromKey || {}),
    };
  }
  return { ...pack };
};

/**
 * Seed sometimes wrote formFields/productItems as " " (string).
 * That crashes .map() in section components and blanks admin template cards.
 */
const SECTION_LIST_KEYS = [
  "formFields",
  "productItems",
  "galleryItems",
  "faqItems",
  "whyChooseUsItems",
  "testimonialItems",
  "bannerSlides",
  "menu",
  "buttons",
  "stats",
  "teamMembers",
  "pricingPlans",
  "processSteps",
  "countriesServeItems",
] as const;

function sanitizeSectionListFields(
  data: Record<string, unknown>,
  defaults: Record<string, unknown> = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of SECTION_LIST_KEYS) {
    if (!(key in out) && !(key in defaults)) continue;
    if (!Array.isArray(out[key])) {
      out[key] = Array.isArray(defaults[key]) ? defaults[key] : [];
    }
  }
  return out;
}

const fallbackVariantData = (
  data: Record<string, unknown>,
  variantKey: string,
  sectionType: string,
): Record<string, unknown> => {
  const direct = data[variantKey];
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }
  const suffix = Number(variantKey.match(/-(\d+)$/)?.[1] || 0);
  if (suffix >= 5) return {};
  const generic = data[`${sectionType}-1`] || data[`${sectionType}-2`];
  if (generic && typeof generic === "object" && !Array.isArray(generic)) {
    return generic as Record<string, unknown>;
  }
  return {};
};

const mergeCategoryData = (
  section: SectionItem,
  category: string,
): SectionItem => {
  const commonPack = categoryContent.common[section.type] as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections?.[
    section.type
  ] as Record<string, unknown> | undefined;

  const defaultsByVariant = createDefaultSectionData(section.type, category);

  let nextData = Object.fromEntries(
    Object.keys(section.data).map((variant) => {
      const merged = sanitizeSectionListFields(
        {
          ...resolveVariantContent(commonPack, variant),
          ...resolveVariantContent(categoryPack, variant),
        },
        (defaultsByVariant[variant] ||
          defaultsByVariant[`${section.type}-1`] ||
          Object.values(defaultsByVariant)[0] ||
          {}) as Record<string, unknown>,
      );

      if (!Object.keys(merged).length) {
        return [variant, {} as SectionData];
      }

      return [
      variant,
      section.type === "Banner"
          ? applyBannerVariantDefaults(variant, merged)
          : (merged as SectionData),
      ];
    }),
  ) as SectionItem["data"];

  // Templates like business-4 set Header-4 / Topbar-4, but the shell config
  // often only ships *-1/*-2 data keys. Seed the active variant so the editor
  // popup can read/write the same content the canvas falls back to.
  if (!nextData[section.variant]) {
    const fallback = fallbackVariantData(
      nextData as Record<string, unknown>,
      section.variant,
      section.type,
    );
    if (Object.keys(fallback).length) {
      nextData = {
        ...nextData,
        [section.variant]: { ...(fallback as SectionData) },
      };
    }
  }

  return { ...section, data: nextData };
};

const createDefaultSectionData = (
  sectionType: string,
  category: string = "School",
): Record<string, SectionData> => {
  if (sectionType === "WhyChooseUs") {
    const data: SectionData = {
      pretitle: "Why choose us",
      title: "A better experience from first click.",
      desc: "Use category-specific proof points to help visitors trust your business faster.",
      whyChooseUsItems: [
        {
          title: "Clear guidance",
          desc: "Helpful details and simple next steps for every visitor.",
          stat: "01",
        },
        {
          title: "Trusted process",
          desc: "A focused flow designed around the user decision journey.",
          stat: "02",
        },
        {
          title: "Fast response",
          desc: "Make it easy for people to enquire, compare, and act.",
          stat: "03",
        },
      ],
    };

    return {
      "WhyChooseUs-1": data,
      "WhyChooseUs-2": data,
      "WhyChooseUs-3": data,
      "WhyChooseUs-4": data,
      "WhyChooseUs-5": data,
      "WhyChooseUs-6": data,
    };
  }

  if (sectionType === "CTA") {
    const data: SectionData = {
      pretitle: "Start your search",
      title: "Let us help you find the right next move.",
      buttons: [
        { label: "Browse properties", href: "/buy-a-property" },
        { label: "Contact us", href: "/contact", secondary: true },
      ],
    };

    return { "CTA-5": data };
  }

  if (sectionType === "Gallery") {
    const data: SectionData = {
      pretitle: "Gallery",
      title: "Explore the experience",
      desc: "A visual section powered by the selected category media.",
      galleryItems: [
        { image: "/bg1.jpg", alt: "Gallery image one", title: "View one" },
        { image: "/bg2.jpg", alt: "Gallery image two", title: "View two" },
        { image: "/blackbay.png", alt: "Gallery image three", title: "View three" },
        { image: "/shaye.png", alt: "Gallery image four", title: "View four" },
      ],
    };

    return {
      "Gallery-1": data,
      "Gallery-2": data,
      "Gallery-3": data,
      "Gallery-4": data,
      "Gallery-5": data,
      "Gallery-6": data,
      "Gallery-7": data,
      "Gallery-8": data,
    };
  }

  if (sectionType === "FormDetail") {
    const data: SectionData = {
      pretitle: "Contact",
      title: "Tell us what you need.",
      desc: "Capture enquiries with a simple editable form section.",
      formSubmitLabel: "Send enquiry",
      formFields: [
        { label: "Name", type: "text", placeholder: "Your name" },
        { label: "Email", type: "email", placeholder: "you@example.com" },
        { label: "Message", type: "textarea", placeholder: "Tell us what you need" },
      ],
    };

    return {
      "FormDetail-1": data,
      "FormDetail-2": data,
      "FormDetail-3": data,
      "FormDetail-4": data,
      "FormDetail-5": data,
      "FormDetail-6": data,
    };
  }

  if (sectionType === "FAQ") {
    const data: SectionData = {
      pretitle: "FAQ",
      title: "Frequently asked questions",
      faqItems: [
        {
          question: "How quickly can we start?",
          answer: "You can start as soon as the basic details are ready.",
        },
        {
          question: "Can this content be changed?",
          answer: "Yes, text and media can be customized from the editor data.",
        },
        {
          question: "Does this match the selected category?",
          answer: "Yes, inserted sections merge with the active category JSON.",
        },
      ],
    };

    return {
      "FAQ-1": data,
      "FAQ-2": data,
      "FAQ-3": data,
      "FAQ-4": data,
      "FAQ-5": data,
      "FAQ-6": data,
    };
  }

  if (sectionType === "Testimonial") {
    const data: SectionData = {
      pretitle: "Our clients",
      title: "Trusted by people who care about results.",
      desc: "Use real customer feedback to build trust with new visitors.",
      testimonialItems: [
        {
          name: "Aarav Mehta",
          role: "Founder, Studio North",
          quote:
            "The site made our work easier to understand and brought in better leads within the first week.",
          image: "/bg1.jpg",
          rating: "5.0",
        },
        {
          name: "Neha Kapoor",
          role: "Marketing Lead",
          quote:
            "Clean sections, fast pages, and the editor keeps the content simple for our whole team.",
          image: "/bg2.jpg",
          rating: "4.9",
        },
        {
          name: "Rahul Verma",
          role: "Operations Head",
          quote:
            "We finally have a website that looks premium and still feels practical to update.",
          image: "/blackbay.png",
          rating: "5.0",
        },
        {
          name: "Isha Malhotra",
          role: "Creative Director",
          quote:
            "The layouts gave our brand a sharper story and made every service easier to browse.",
          image: "/shaye.png",
          rating: "4.8",
        },
        {
          name: "Kabir Anand",
          role: "Product Manager",
          quote:
            "We could test different sections quickly without losing the polished look of the page.",
          image: "/stylam.png",
          rating: "4.7",
        },
        {
          name: "Sara Khan",
          role: "Business Owner",
          quote:
            "Visitors understand what we offer faster, and enquiries feel more relevant now.",
          image: "/prod2.jpg",
          rating: "5.0",
        },
      ],
    };

    return {
      "Testimonial-1": data,
      "Testimonial-2": data,
      "Testimonial-3": data,
      "Testimonial-5": data,
      "Testimonial-6": data,
    };
  }

  if (sectionType === "CountriesServe") {
    const categoryKey = category
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    const topicKey =
      categoryKey.includes("realestate") ||
      categoryKey.includes("property") ||
      categoryKey.includes("estate")
        ? "realestate"
        : categoryKey.includes("business") ||
            categoryKey.includes("corporate") ||
            categoryKey.includes("agency")
          ? "business"
          : "school";

    const topicsByCategory: Record<string, string[]> = {
      school: [
        "Admissions Open",
        "Campus Tour",
        "Day Boarding",
        "Nursery Admissions",
        "CBSE Curriculum",
        "Parent Orientation",
        "After School Care",
        "STEM Programs",
        "Sports Academy",
        "Scholarship Support",
      ],
      business: [
        "Business Consulting",
        "Corporate Training",
        "Market Expansion",
        "Local Partnerships",
        "Client Success",
        "Franchise Support",
        "Sales Enablement",
        "Office Solutions",
        "Growth Strategy",
        "Account Management",
      ],
      realestate: [
        "Property Consultation",
        "Home Buying Guide",
        "Rental Support",
        "Investment Advisory",
        "Site Visits",
        "Luxury Listings",
        "Commercial Spaces",
        "Resale Homes",
        "New Projects",
        "NRI Property Desk",
      ],
    };
    const topics = topicsByCategory[topicKey] || topicsByCategory.school;

    const titlesFor = (cities: string[]) =>
      cities.map(
        (city, index) => `${topics[index % topics.length]} in ${city}`,
      );

    const makeListings = (
      countryId: string,
      countryName: string,
      titles: string[],
    ) =>
      titles.map((title, index) => ({
        id: `${countryId}-listing-${index + 1}`,
        title,
        category: countryName,
        countryId,
        desc:
          topicKey === "school"
            ? `${title} — admissions and campus support for families.`
            : topicKey === "realestate"
              ? `${title} — local property guidance for buyers and renters.`
              : `${title} — local business support for clients.`,
        content: "",
        image: "",
        alt: title,
        link: "",
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-"),
        order: index + 1,
        active: true,
        seoTitle: title,
        seoDescription:
          topicKey === "school"
            ? `${title} — admissions and campus support for families.`
            : topicKey === "realestate"
              ? `${title} — local property guidance for buyers and renters.`
              : `${title} — local business support for clients.`,
        seoKeywords: "",
      }));

    const countries = [
      {
        id: "country-in",
        name: "India",
        flagImage: "https://flagcdn.com/w80/in.png",
        flagAlt: "India",
        order: 1,
        active: true,
        titles: titlesFor([
          "Delhi",
          "Noida",
          "Gurgaon",
          "Mumbai",
          "Bangalore",
        ]),
      },
      {
        id: "country-ae",
        name: "UAE",
        flagImage: "https://flagcdn.com/w80/ae.png",
        flagAlt: "UAE",
        order: 2,
        active: true,
        titles: titlesFor(["Dubai", "Abu Dhabi", "Sharjah", "AL Ain"]),
      },
      {
        id: "country-qa",
        name: "Qatar",
        flagImage: "https://flagcdn.com/w80/qa.png",
        flagAlt: "Qatar",
        order: 3,
        active: true,
        titles: titlesFor(["Doha", "Al Rayyan", "Al Wakrah"]),
      },
      {
        id: "country-sg",
        name: "Singapore",
        flagImage: "https://flagcdn.com/w80/sg.png",
        flagAlt: "Singapore",
        order: 4,
        active: true,
        titles: titlesFor(["Downtown", "Orchard", "Marina Bay"]),
      },
      {
        id: "country-ie",
        name: "Ireland",
        flagImage: "https://flagcdn.com/w80/ie.png",
        flagAlt: "Ireland",
        order: 5,
        active: true,
        titles: titlesFor(["Dublin", "Cork", "Galway"]),
      },
    ];

    const sectionCopy =
      topicKey === "school"
        ? {
            pretitle: "Global reach",
            title: "Countries We Serve",
            desc: "Admissions and campus support across India and worldwide — find local guidance in cities near you.",
          }
        : topicKey === "realestate"
          ? {
              pretitle: "Global reach",
              title: "Countries We Serve",
              desc: "Property guidance across India and worldwide — find local support in cities near you.",
            }
          : {
              pretitle: "Global reach",
              title: "Countries We Serve",
              desc: "Business support across India and worldwide — find local partners in cities near you.",
            };

    const data: SectionData = {
      ...sectionCopy,
      countriesServeWebsiteEnabled: false,
      countriesServeItems: countries.map(
        ({ titles: _titles, ...country }) => country,
      ),
      countriesServeListings: countries.flatMap((country) =>
        makeListings(country.id, country.name, country.titles),
      ),
    };

    return {
      "CountriesServe-1": data,
      "CountriesServe-2": data,
      "CountriesServe-3": data,
      "CountriesServe-4": data,
    };
  }

  return {};
};

export const createAddableSection = (
  sectionType: string,
  category: string,
  requestedVariant?: string,
): SectionItem | null => {
  const libraryCard = addableSectionCards.find(
    (item) => item.type === sectionType,
  );
  const variant = requestedVariant || libraryCard?.variant;
  const preview = variant ? resolveLayoutPreview(variant, category) : null;
  const baseSection =
    cloneSections(selectedConfig.sections).find(
      (section) => section.type === sectionType,
    ) ??
    (libraryCard
      ? {
          type: libraryCard.type,
          variant: libraryCard.variant,
          data: createDefaultSectionData(libraryCard.type, category),
        }
      : preview && variant
        ? {
            type: sectionType,
            variant,
            data: { [variant]: preview.data },
        }
      : null);

  if (!baseSection || !variant) return null;

  const data = preview
    ? { ...baseSection.data, [variant]: preview.data }
    : baseSection.data;

  return mergeCategoryData(
    {
      ...baseSection,
      id: `${sectionType}-${Date.now()}`,
      variant,
      data,
    },
    category,
  );
};

export const createAboutPageSection = (category: string): SectionItem => {
  const commonPack = categoryContent.common.AboutPage as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections
    ?.AboutPage as Record<string, unknown> | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  return {
    id: "AboutPage",
    page: "about",
    type: "About",
    variant: "AboutPage-1",
    data: {
      "AboutPage-1": forVariant("AboutPage-1"),
      "AboutPage-2": forVariant("AboutPage-2"),
      "AboutPage-3": forVariant("AboutPage-3"),
      "AboutPage-4": forVariant("AboutPage-4"),
      "AboutPage-5": forVariant("AboutPage-5"),
      "AboutPage-6": forVariant("AboutPage-6"),
    },
  };
};

export const createGalleryPageSection = (category: string): SectionItem => {
  const galleryCommon = categoryContent.common.Gallery as
    | Record<string, unknown>
    | undefined;
  const galleryCat = categoryContent.categories[category]?.sections?.Gallery as
    | Record<string, unknown>
    | undefined;
  const pageCommon = categoryContent.common.GalleryPage as
    | Record<string, unknown>
    | undefined;
  const pageCat = categoryContent.categories[category]?.sections?.GalleryPage as
    | Record<string, unknown>
    | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(galleryCommon, key),
      ...resolveVariantContent(galleryCat, key),
      ...resolveVariantContent(pageCommon, key),
      ...resolveVariantContent(pageCat, key),
    }) as SectionData;

  return {
    id: "GalleryPage",
    page: "gallery",
    type: "Gallery",
    variant: "GalleryPage-1",
    data: {
      "GalleryPage-1": forVariant("GalleryPage-1"),
      "GalleryPage-2": forVariant("GalleryPage-2"),
      "GalleryPage-3": forVariant("GalleryPage-3"),
      "GalleryPage-4": forVariant("GalleryPage-4"),
      "GalleryPage-5": forVariant("GalleryPage-5"),
    },
  };
};

export const createServicePageSection = (category: string): SectionItem => {
  const commonPack = categoryContent.common.ServicePage as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections
    ?.ServicePage as Record<string, unknown> | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  return {
    id: "ServicePage",
    page: "service",
    type: "Service",
    variant: "ServicePage-1",
    data: {
      "ServicePage-1": forVariant("ServicePage-1"),
      "ServicePage-2": forVariant("ServicePage-2"),
      "ServicePage-3": forVariant("ServicePage-3"),
      "ServicePage-4": forVariant("ServicePage-4"),
      "ServicePage-5": forVariant("ServicePage-5"),
      "ServicePage-6": forVariant("ServicePage-6"),
    },
  };
};

export const createEventPageSection = (category: string): SectionItem => {
  const commonPack = categoryContent.common.EventPage as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections
    ?.EventPage as Record<string, unknown> | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  return {
    id: "EventPage",
    page: "events",
    type: "Event",
    variant: "EventPage-1",
    data: {
      "EventPage-1": forVariant("EventPage-1"),
      "EventPage-2": forVariant("EventPage-2"),
      "EventPage-3": forVariant("EventPage-3"),
      "EventPage-4": forVariant("EventPage-4"),
    },
  };
};

export const createPropertyPageSection = (category: string): SectionItem => {
  const commonPack = categoryContent.common.PropertyPage as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections
    ?.PropertyPage as Record<string, unknown> | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  return {
    id: "PropertyPage",
    page: "properties",
    type: "Property",
    variant: "PropertyPage-1",
    data: {
      "PropertyPage-1": forVariant("PropertyPage-1"),
      "PropertyPage-2": forVariant("PropertyPage-2"),
      "PropertyPage-3": forVariant("PropertyPage-3"),
      "PropertyPage-4": forVariant("PropertyPage-4"),
      "PropertyPage-5": forVariant("PropertyPage-5"),
      "PropertyPage-6": forVariant("PropertyPage-6"),
    },
  };
};

export const createPortfolioPageSection = (
  category: string,
  pageSlug = "portfolio",
): SectionItem => {
  const commonPack = categoryContent.common.PortfolioPage as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections
    ?.PortfolioPage as Record<string, unknown> | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  const slug =
    pageSlug.trim().toLowerCase().replace(/\s+/g, "-") || "portfolio";

  return {
    id: "PortfolioPage",
    page: slug,
    type: "Portfolio",
    variant: "PortfolioPage-1",
    data: {
      "PortfolioPage-1": forVariant("PortfolioPage-1"),
      "PortfolioPage-2": forVariant("PortfolioPage-2"),
      "PortfolioPage-3": forVariant("PortfolioPage-3"),
      "PortfolioPage-4": forVariant("PortfolioPage-4"),
      "PortfolioPage-5": forVariant("PortfolioPage-5"),
      "PortfolioPage-6": forVariant("PortfolioPage-6"),
    },
  };
};

export const createTeamPageSection = (category: string): SectionItem => {
  const commonPack = categoryContent.common.TeamPage as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections
    ?.TeamPage as Record<string, unknown> | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  return {
    id: "TeamPage",
    page: "teams",
    type: "Team",
    variant: "TeamPage-1",
    data: {
      "TeamPage-1": forVariant("TeamPage-1"),
      "TeamPage-2": forVariant("TeamPage-2"),
      "TeamPage-3": forVariant("TeamPage-3"),
      "TeamPage-4": forVariant("TeamPage-4"),
    },
  };
};

export const createTypedPageSection = (
  sectionType: string,
  category: string,
  pageId?: string,
  variant?: string,
): SectionItem => {
  const commonPack = categoryContent.common[sectionType] as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections?.[
    sectionType
  ] as Record<string, unknown> | undefined;
  const activeVariant = variant || `${sectionType}-5`;
  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  return {
    id: sectionType,
    page:
      pageId ||
      sectionType.replace(/Page$/i, "").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
    type: sectionType,
    variant: activeVariant,
    data: {
      [activeVariant]: forVariant(activeVariant),
    },
  };
};

export const createContactPageSection = (category: string): SectionItem => {
  const commonPack = categoryContent.common.ContactPage as
    | Record<string, unknown>
    | undefined;
  const categoryPack = categoryContent.categories[category]?.sections
    ?.ContactPage as Record<string, unknown> | undefined;

  const forVariant = (key: string) =>
    ({
      ...resolveVariantContent(commonPack, key),
      ...resolveVariantContent(categoryPack, key),
    }) as SectionData;

  return {
    id: "ContactPage",
    page: "contact",
    type: "Contact",
    variant: "ContactPage-1",
    data: {
      "ContactPage-1": forVariant("ContactPage-1"),
      "ContactPage-2": forVariant("ContactPage-2"),
      "ContactPage-3": forVariant("ContactPage-3"),
      "ContactPage-4": forVariant("ContactPage-4"),
    },
  };
};

export const createCustomPageSection = (
  category: string,
  pageLabel: string,
): SectionItem => {
  const trimmedLabel = pageLabel.trim() || "Page";
  const pageSlug = trimmedLabel.toLowerCase().replace(/\s+/g, "-");
  const categoryAboutPack = categoryContent.categories[category]?.sections
    ?.About as Record<string, unknown> | undefined;
  const categoryAboutData = resolveVariantContent(
    categoryAboutPack,
    "About-1",
  );
  const customCommon = categoryContent.common.CustomPage as
    | Record<string, unknown>
    | undefined;
  const customCat = categoryContent.categories[category]?.sections
    ?.CustomPage as Record<string, unknown> | undefined;
  const customMerged = {
    ...resolveVariantContent(customCommon, "CustomPage-1"),
    ...resolveVariantContent(customCat, "CustomPage-1"),
  };
  const pageData = {
    ...customMerged,
    sideImage:
      customMerged.sideImage ??
      categoryAboutData?.sideImage ??
      categoryAboutData?.backgroundImage ??
      customCommon?.sideImage,
    // Content follows the page name — no generic "Demo content" copy.
    pretitle: trimmedLabel,
    title: trimmedLabel,
    desc: `Welcome to our ${trimmedLabel} page. Here you will find clear information about ${trimmedLabel}, what we offer, and how it can help you take the next step.`,
    desc2: `Explore ${trimmedLabel} in more detail — key points, benefits, and practical guidance. Reach out if you want help tailored to your needs.`,
    sideImageTitle: `${trimmedLabel} image`,
  } as SectionData;

  return {
    id: `CustomPage-${pageSlug}`,
    page: pageSlug,
    type: "About",
    variant: "AboutPage-2",
    data: {
      "AboutPage-1": pageData,
      "AboutPage-2": pageData,
      "AboutPage-3": pageData,
    },
  };
};

/** Breadcrumb for a custom / AI-created inner page (title = page name). */
export const createCustomPageBreadcrumb = (
  category: string,
  pageLabel: string,
  options?: {
    variant?: string;
    templateId?: string | null;
  },
): SectionItem => {
  const trimmedLabel = pageLabel.trim() || "Page";
  const pageSlug = trimmedLabel.toLowerCase().replace(/\s+/g, "-");
  const template = getBuilderTemplate(options?.templateId, category);
  const breadcrumbVariant =
    (typeof options?.variant === "string" && options.variant.trim()) ||
    template.sectionVariants?.Breadcrumb ||
    "Breadcrumb-1";
  const categoryKey =
    categoryContent.categories[category] != null
      ? category
      : Object.keys(categoryContent.categories)[0] || "Business";
  const commonBreadcrumb = categoryContent.common.Breadcrumb as
    | Record<string, unknown>
    | undefined;
  const categoryBreadcrumb = categoryContent.categories[categoryKey]?.sections
    ?.Breadcrumb as Record<string, unknown> | undefined;
  const previewData = {
    ...resolveVariantContent(commonBreadcrumb, breadcrumbVariant),
    ...resolveVariantContent(categoryBreadcrumb, breadcrumbVariant),
  };
  return {
    id: `Breadcrumb-${pageSlug}`,
    page: pageSlug,
    type: "Breadcrumb",
    variant: breadcrumbVariant,
    data: {
      [breadcrumbVariant]: {
        ...previewData,
        title: trimmedLabel,
        homeLabel:
          (typeof previewData.homeLabel === "string" && previewData.homeLabel) ||
          "Home",
      } as SectionData,
    },
  };
};

const countPlainWords = (text: string) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** Manager-style ~500 word HTML body with short h2 headings for a custom page. */
export const buildCustomPageLongContentHtml = (
  pageLabel: string,
  category = "Business",
): string => {
  const topic = pageLabel.trim() || "Page";
  const categoryLabel = category.trim() || "Business";
  const minWords = 500;
  const targetWords = 550;

  const headings = [
    `Why ${topic} matters`,
    `How ${topic} works`,
    `What you can expect`,
    `Practical next steps`,
  ].map((heading) => {
    const words = heading.trim().split(/\s+/).filter(Boolean);
    return words.length <= 5 ? heading : words.slice(0, 5).join(" ");
  });

  const sections: Array<{ heading: string; paragraphs: string[] }> = [
    {
      heading: headings[0],
      paragraphs: [
        `${topic} is a focused page created for a ${categoryLabel} website audience. This section explains why the topic matters, who it helps, and how visitors can take the next step with confidence.`,
        `People looking for ${topic} usually want clear guidance, practical examples, and trustworthy details. Here we cover the purpose of ${topic}, the outcomes you can expect, and the approach that keeps quality consistent from first contact to delivery.`,
      ],
    },
    {
      heading: headings[1],
      paragraphs: [
        `In the context of ${categoryLabel}, ${topic} connects everyday needs with a structured plan. Visitors learn what is included, what makes this offering different, and how the experience is designed for real-world results rather than generic promises.`,
        `A strong page on ${topic} starts with understanding the audience. Families, students, clients, and partners each bring different questions. This content answers those questions in plain language while keeping a professional tone that fits the brand.`,
        `Implementation matters as much as inspiration. For ${topic}, we outline the steps, timelines, and checkpoints that keep work organized. That includes discovery, planning, delivery, review, and ongoing support so improvements continue after launch.`,
      ],
    },
    {
      heading: headings[2],
      paragraphs: [
        `Quality for ${topic} also means measurable progress. Clear goals, simple reporting, and honest communication help stakeholders see value early. When people understand the process, they engage more and recommend the experience to others.`,
        `Community and culture strengthen ${topic}. Stories, testimonials, and practical tips show how similar visitors succeeded. These examples turn abstract benefits into concrete moments people can picture for themselves.`,
        `Accessibility and clarity remain priorities throughout this page. Content about ${topic} should be easy to scan on mobile, useful for first-time readers, and detailed enough for anyone comparing options seriously.`,
      ],
    },
    {
      heading: headings[3],
      paragraphs: [
        `Next steps for ${topic} are intentionally simple: explore related pages, speak with the team, or start an inquiry. The goal is momentum — move from curiosity to action without friction or confusion.`,
        `Ultimately, ${topic} represents a commitment to thoughtful ${categoryLabel} experiences. By combining expertise, care, and transparent communication, this page gives visitors everything they need to decide with confidence.`,
      ],
    },
  ];

  const intro = `<p>${topic} brings clear value for ${categoryLabel} visitors who want practical information, trustworthy guidance, and a confident next step. This detailed section is written to be easy to scan while still covering the details people compare before they decide.</p>`;

  const buildHtml = () =>
    [
      intro,
      ...sections.flatMap((section) => [
        `<h2>${section.heading}</h2>`,
        ...section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`),
      ]),
    ].join("\n");

  let html = buildHtml();
  let guard = 0;
  while (countPlainWords(html) < minWords && guard < 12) {
    sections[sections.length - 1].paragraphs.push(
      `Additional depth on ${topic}: practical checklists, common mistakes to avoid, recommended resources, and FAQs that appear during research. Visitors comparing alternatives for ${topic} benefit from transparent cues, eligibility notes, and contact paths that remove guesswork. Every paragraph reinforces how ${categoryLabel} standards shape delivery, safety, and long-term value around ${topic}.`,
    );
    html = buildHtml();
    guard += 1;
  }

  while (countPlainWords(html) < minWords) {
    html += `\n<p>${topic} continues to deliver relevant insights for ${categoryLabel} audiences seeking dependable information, clear benefits, and a confident next step.</p>`;
  }

  if (countPlainWords(html) > targetWords + 80) {
    const parts = html.split(/(?=<h2>)/i);
    while (
      parts.length > 4 &&
      countPlainWords(parts.join("")) > targetWords + 40
    ) {
      parts.pop();
    }
    html = parts.join("").trim() || html;
  }

  return html.trim();
};

/**
 * Long-form detail section placed after the custom page hero —
 * heading + ~500 word HTML body (same pattern as manager item pages).
 */
export const createCustomPageDetailSection = (
  category: string,
  pageLabel: string,
): SectionItem => {
  const trimmedLabel = pageLabel.trim() || "Page";
  const pageSlug = trimmedLabel.toLowerCase().replace(/\s+/g, "-");
  const sectionId = `CustomPageDetail-${pageSlug}`;
  const columnId = `column-${pageSlug}-detail`;
  const longHtml = buildCustomPageLongContentHtml(trimmedLabel, category);

  return {
    id: sectionId,
    page: pageSlug,
    type: "CustomSection",
    variant: "CustomSection-1",
    data: {
      "CustomSection-1": {
        customSectionId: sectionId,
        sectionName: `${trimmedLabel} details`,
        layout: "single",
        contentWidth: "container",
        columnGap: 2,
        sectionBackgroundColor: "#ffffff",
        sectionPadding: {
          desktop: { top: 56, right: 24, bottom: 64, left: 24 },
          tablet: { top: 44, right: 20, bottom: 52, left: 20 },
          mobile: { top: 36, right: 16, bottom: 44, left: 16 },
        },
        columns: [
          {
            id: columnId,
            contentAlignH: "left",
            contentAlignV: "top",
            elements: [
              {
                id: `heading-${pageSlug}-detail`,
                type: "heading",
                value: `About ${trimmedLabel}`,
                align: "left",
                textColor: "#0f172a",
                // Match manager detail title scale (not huge H1/H2 defaults).
                headingLevel: 3,
                fontSize: 24,
              },
              {
                id: `text-${pageSlug}-detail`,
                type: "text",
                value: longHtml,
                align: "left",
                textColor: "#334155",
              },
            ],
          },
        ],
      } as SectionData,
    },
  };
};

export const getBuilderTemplate = (
  templateId?: string | null,
  category?: string | null,
) => {
  const templates = getBuilderTemplates();
  const requested = (templateId || "").trim();
  const categoryKey = (category || "").trim().toLowerCase();
  const isRealestate =
    categoryKey === "realestate" || categoryKey === "real-estate";

  // Legacy Vercel URLs used template-1/2; map Realestate to premium imports.
  if (isRealestate && requested === "template-1") {
    const premium = templates.find((t) => t.id === "template-realestate-5");
    if (premium) return premium;
  }
  if (isRealestate && requested === "template-2") {
    const premium = templates.find((t) => t.id === "template-realestate-6");
    if (premium) return premium;
  }

  return templates.find((template) => template.id === requested) ?? templates[0];
};

export const isSameBuilderTemplate = (
  left?: string | null,
  right?: string | null,
  category?: string | null,
) => {
  const alias = (value?: string | null) => {
    const requested = (value || "").trim();
    if (!requested) return "";
    const categoryKey = (category || "").trim().toLowerCase();
    const isRealestate =
      categoryKey === "realestate" || categoryKey === "real-estate";
    if (isRealestate && requested === "template-1") return "template-realestate-5";
    if (isRealestate && requested === "template-2") return "template-realestate-6";
    return requested;
  };
  const a = alias(left);
  const b = alias(right);
  return Boolean(a) && a === b;
};

const TEMPLATE_VARIANT_ALIAS: Record<string, string> = {
  Property: "PropertyPage",
  Service: "ServicePage",
  Portfolio: "PortfolioPage",
  Event: "EventPage",
  Team: "TeamPage",
  Gallery: "GalleryPage",
  Contact: "ContactPage",
  Blog: "BlogPage",
};

const MANAGER_THEME_LOCK_TYPES = new Set([
  "Property",
  "PropertyPage",
  "BuyPropertyPage",
  "RentPage",
  "Service",
  "ServicePage",
  "Event",
  "EventPage",
  "Portfolio",
  "PortfolioPage",
  "Team",
  "TeamPage",
  "Gallery",
  "GalleryPage",
  "Blog",
  "BlogPage",
]);

/** Honor editor layout picks. Only block manager 1-4 from replacing a premium -5+ skin. */
export const resolveTemplateSectionVariant = (
  section: { type?: string; id?: string; variant: string },
  template?: { sectionVariants?: Record<string, string> } | null,
) => {
  const current = section.variant;
  const variants = template?.sectionVariants;
  if (!variants) return current;
  const type = String(section.type || "");
  const id = String(section.id || "");
  const expected =
    variants[type] ||
    variants[id] ||
    variants[TEMPLATE_VARIANT_ALIAS[type] || ""] ||
    variants[TEMPLATE_VARIANT_ALIAS[id] || ""];
  if (!expected) return current;
  if (!current || current === expected) return expected;

  const isManagerType =
    MANAGER_THEME_LOCK_TYPES.has(type) || MANAGER_THEME_LOCK_TYPES.has(id);
  if (
    isManagerType &&
    /-(?:[5-9]|\d{2,})$/.test(expected) &&
    /-[1-4]$/.test(current)
  ) {
    return expected;
  }
  return current;
};

/** Manager 1-4 layout picker must not overwrite theme-locked variants (-5, -6, ...). */
export const keepThemeLockedVariant = (
  currentVariant: string,
  requestedLayout?: string,
) => {
  if (/-(?:[5-9]|\d{2,})$/.test(currentVariant)) return currentVariant;
  if (requestedLayout && /-[1-4]$/.test(requestedLayout)) return requestedLayout;
  return currentVariant;
};

/** Topbar-4 is the light bar: white background, dark text. */
export const TOPBAR_LAYOUT_SKINS: Record<
  string,
  {
    topbarBackgroundType: "solid";
    topbarBackgroundColor: string;
    topbarTextColor: string;
  }
> = {
  "Topbar-4": {
    topbarBackgroundType: "solid",
    topbarBackgroundColor: "#ffffff",
    topbarTextColor: "#0f172a",
  },
};

export const withTopbarLayoutSkin = <T extends Record<string, unknown>>(
  variant: string,
  data: T,
): T => {
  const skin = TOPBAR_LAYOUT_SKINS[variant];
  if (!skin) return data;
  return { ...data, ...skin };
};

export const applyTopbarLayoutSkins = <
  T extends { type?: string; data?: Record<string, Record<string, unknown>> },
>(
  sections: T[],
): T[] => {
  let changed = false;
  const next = sections.map((section) => {
    if (section.type !== "Topbar" || !section.data) return section;
    let data = section.data;
    let sectionChanged = false;
    Object.entries(TOPBAR_LAYOUT_SKINS).forEach(([variant, skin]) => {
      const current = data[variant];
      if (!current) return;
      if (
        current.topbarBackgroundColor === skin.topbarBackgroundColor &&
        current.topbarTextColor === skin.topbarTextColor
      ) {
        return;
      }
      data = {
        ...data,
        [variant]: { ...current, ...skin },
      };
      sectionChanged = true;
    });
    if (!sectionChanged) return section;
    changed = true;
    return { ...section, data };
  });
  return changed ? next : sections;
};

export const getTemplateVariables = (
  templateId?: string | null,
  category?: string | null,
) => {
  const templates = getBuilderTemplates();
  const template = getBuilderTemplate(templateId, category);
  const variables = template.variables ?? templates[0]?.variables ?? {};

  return Object.fromEntries(
    Object.entries(variables).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
};

const HOME_SECTIONS_PREVIEW = [
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
  "Process",
  "Gallery",
  "FormDetail",
  "Awards",
  "Stats",
  "Blog",
  "FAQ",
  "Testimonial",
  "Contact",
  "InvestmentOpportunities",
  "CountriesServe",
  "Footer",
] as const;

const SINGLE_PAGE_SCROLL_MENU: Partial<
  Record<string, { label: string; href: string }>
> = {
  Banner: { label: "Home", href: "#" },
  Features: { label: "Features", href: "#features" },
  Highlight: { label: "Explore", href: "#highlight" },
  Featured: { label: "Featured", href: "#featured" },
  LatestProject: { label: "Projects", href: "#latest-projects" },
  Cities: { label: "Cities", href: "#cities" },
  About: { label: "About", href: "#about" },
  Product: { label: "Services", href: "#services" },
  WhyChooseUs: { label: "Why Choose Us", href: "#why-choose-us" },
  FeaturedDev: { label: "Developers", href: "#featured-developers" },
  Process: { label: "Process", href: "#process" },
  Gallery: { label: "Gallery", href: "#gallery" },
  FormDetail: { label: "Contact", href: "#contact" },
  Awards: { label: "Awards", href: "#awards" },
  Stats: { label: "Stats", href: "#stats" },
  Blog: { label: "Blog", href: "#blog" },
  FAQ: { label: "FAQ", href: "#faq" },
  Testimonial: { label: "Testimonials", href: "#testimonials" },
  Contact: { label: "Contact", href: "#contact" },
  InvestmentOpportunities: {
    label: "Invest",
    href: "#investment-opportunities",
  },
  CountriesServe: { label: "Countries", href: "#countries-we-serve" },
};

/** Keep header readable on long premium homes (template-1 style). */
const SINGLE_PAGE_PRIMARY_NAV = [
  "Banner",
  "LatestProject",
  "Cities",
  "WhyChooseUs",
  "Blog",
  "FAQ",
  "Contact",
] as const;

const buildSinglePageTemplateMenu = (template: BuilderTemplate) => {
  const longHome =
    Array.isArray(template.homeSectionOrder) &&
    template.homeSectionOrder.length > 10;

  const order = longHome
    ? SINGLE_PAGE_PRIMARY_NAV.filter(
        (sectionType) => Boolean(template.sectionVariants[sectionType]),
      )
    : Array.isArray(template.homeSectionOrder) &&
        template.homeSectionOrder.length
      ? template.homeSectionOrder
      : [...HOME_SECTIONS_PREVIEW];

  const seenHrefs = new Set<string>();
  return order.flatMap((sectionType) => {
    const menuItem = SINGLE_PAGE_SCROLL_MENU[sectionType];
    if (!menuItem || !template.sectionVariants[sectionType]) return [];
    const hrefKey = menuItem.href.trim().toLowerCase();
    if (seenHrefs.has(hrefKey)) return [];
    seenHrefs.add(hrefKey);
    return [{ ...menuItem }];
  });
};

/** Public helper — curated header nav for long single-page premium templates. */
export const getSinglePageTemplateMenu = (template: BuilderTemplate) =>
  buildSinglePageTemplateMenu(template);

const SECTION_ORDER_PREVIEW = [
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
  "Process",
  "Gallery",
  "FormDetail",
  "Awards",
  "Stats",
  "Blog",
  "FAQ",
  "Testimonial",
  "Contact",
  "InvestmentOpportunities",
  "CountriesServe",
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
  "MissionValues",
  "CsrPage",
  "CsrPrograms",
  "CareerPage",
  "CareerJobs",
  "RentPage",
  "BuyPropertyPage",
  "BlogPage",
  "SitemapPage",
  "PrivacyPage",
  "TermsPage",
  "DisclaimerPage",
  "CookiePolicyPage",
  "RefundPolicyPage",
  "CustomPage",
  "Footer",
] as const;

/** Split Breadcrumb sections are the site-wide template; page bodies no longer keep a private banner. */
const PAGE_BODIES_WITH_OWN_BREADCRUMB = new Set<string>([]);

export function pageBodyHasOwnBreadcrumb(pageBodyKey?: string) {
  return Boolean(pageBodyKey && PAGE_BODIES_WITH_OWN_BREADCRUMB.has(pageBodyKey));
}

const PAGE_SHELL_TYPES_FOR_BREADCRUMB = new Set([
  "Topbar",
  "Header",
  "Footer",
  "CountriesServe",
  "Breadcrumb",
]);

/** Theme skins that already embed a banner must not also render a leftover Breadcrumb. */
export function dropExtraPageBreadcrumbs<
  T extends { type?: string; id?: string; variant?: string },
>(
  sections: T[],
  template?: { sectionVariants?: Record<string, string> } | null,
): T[] {
  const bodyHasOwn = sections.some((section) => {
    if (!section.type || PAGE_SHELL_TYPES_FOR_BREADCRUMB.has(section.type)) {
      return false;
    }
    const variant = section.variant || "";
    return (
      pageBodyHasOwnBreadcrumb(variant) ||
      pageBodyHasOwnBreadcrumb(
        resolveTemplateSectionVariant(
          { type: section.type, id: section.id, variant },
          template,
        ),
      )
    );
  });
  if (!bodyHasOwn) return sections;
  return sections.filter(
    (section) =>
      section.type !== "Breadcrumb" &&
      !String(section.variant || "").startsWith("Breadcrumb-"),
  );
}

/** Keep Topbar/Header first and Footer last so page bodies never render after the footer. */
export function orderChromeSections<T extends { type?: string }>(sections: T[]): T[] {
  const topbar: T[] = [];
  const header: T[] = [];
  const body: T[] = [];
  const countries: T[] = [];
  const footer: T[] = [];
  sections.forEach((section) => {
    const type = section.type || "";
    if (type === "Topbar") topbar.push(section);
    else if (type === "Header") header.push(section);
    else if (type === "CountriesServe") countries.push(section);
    else if (type === "Footer") footer.push(section);
    else body.push(section);
  });
  return [...topbar, ...header, ...body, ...countries, ...footer];
}

const DEFAULT_MULTI_PAGES = [
  { id: "about", label: "About", sectionType: "AboutPage" },
  { id: "services", label: "Services", sectionType: "ServicePage" },
  { id: "events", label: "Events", sectionType: "EventPage" },
  { id: "properties", label: "Properties", sectionType: "PropertyPage" },
  { id: "portfolio", label: "Portfolio", sectionType: "PortfolioPage" },
  { id: "teams", label: "Teams", sectionType: "TeamPage" },
  { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
  { id: "contact", label: "Contact", sectionType: "ContactPage" },
];

const PROPERTY_PAGE_TYPES = new Set([
  "PropertyPage",
  "BuyPropertyPage",
  "RentPage",
]);

const isRealestateTemplate = (template: BuilderTemplate) =>
  /realestate|real-estate/i.test(`${template.id || ""} ${template.title || ""}`);

/** Canonical page list shared by compose preview and the live editor. */
export const getTemplatePages = (template: BuilderTemplate) => {
  const listed =
    Array.isArray(template.pages) && template.pages.length
      ? template.pages
      : template.type === "Multiple Pages Website"
        ? DEFAULT_MULTI_PAGES
        : [];
  if (!listed.length) return listed;

  const variants = template.sectionVariants || {};
  const hasAnyPageVariant = Object.keys(variants).some(
    (key) => key.endsWith("Page") && key !== "CustomPage",
  );
  const realestate = isRealestateTemplate(template);

  return listed.filter((page) => {
    if (hasAnyPageVariant && !variants[page.sectionType]) return false;
    if (
      !realestate &&
      (PROPERTY_PAGE_TYPES.has(page.sectionType) ||
        page.id === "properties" ||
        page.id === "buy-a-property" ||
        page.id === "rent")
    ) {
      return false;
    }
    return true;
  });
};

export type ThemeManagerKey =
  | "blogs"
  | "services"
  | "events"
  | "properties"
  | "portfolio"
  | "teams"
  | "gallery"
  | "countries";

const slugifyTemplatePageId = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "-");

/** Which manager modules the current theme actually ships as pages / home sections. */
export const getThemeManagerVisibility = (
  templateId?: string | null,
  category?: string | null,
): Record<ThemeManagerKey, boolean> => {
  const template = getBuilderTemplate(templateId, category);
  const pages = getTemplatePages(template);
  const ids = new Set(pages.map((page) => slugifyTemplatePageId(page.id)));
  const types = new Set(pages.map((page) => page.sectionType));
  const home = new Set(template.homeSectionOrder || []);

  const has = (
    pageIds: string[],
    sectionTypes: string[],
    homeTypes: string[] = [],
  ) =>
    pageIds.some((id) => ids.has(id)) ||
    sectionTypes.some((type) => types.has(type)) ||
    homeTypes.some((type) => home.has(type));

  return {
    blogs: has(["blog", "blogs"], ["BlogPage"]),
    services: has(["service", "services"], ["ServicePage"]),
    events: has(["event", "events"], ["EventPage"]),
    properties: has(
      ["property", "properties", "buy-a-property", "rent"],
      ["PropertyPage", "BuyPropertyPage", "RentPage"],
    ),
    portfolio: has(
      ["portfolio", "portfolios", "project", "projects"],
      ["PortfolioPage"],
    ),
    teams: has(["team", "teams"], ["TeamPage"]),
    gallery: has(["gallery"], ["GalleryPage"]),
    countries: has(
      ["countries", "countries-we-serve"],
      ["CountriesServe"],
      ["CountriesServe"],
    ),
  };
};

/** Theme portfolio listing nav — Realestate uses /projects, others /portfolio. */
export const resolveThemePortfolioNavLink = (
  templateId?: string | null,
  category?: string | null,
): { label: string; href: string; slug: string; path: string } => {
  const template = getBuilderTemplate(templateId, category);
  const pages = getTemplatePages(template);
  const page =
    pages.find((item) => {
      const id = slugifyTemplatePageId(item.id);
      return (
        item.sectionType === "PortfolioPage" ||
        id === "portfolio" ||
        id === "portfolios" ||
        id === "projects" ||
        id === "project"
      );
    }) || null;
  const slug = page
    ? slugifyTemplatePageId(page.id)
    : "portfolio";
  const label =
    page?.label ||
    (slug === "projects" || slug === "project" ? "Projects" : "Portfolio");
  return {
    slug,
    label,
    href: `#page-${slug}`,
    path: `/${slug}`,
  };
};

/**
 * Home canvas only shows sections without `page`. Theme inner-page bodies
 * (AboutPage, DisclaimerPage, …) and leftover Breadcrumb must not sit there.
 */
export const scopeTemplatePageBodies = (
  sections: SectionItem[],
  templateId?: string | null,
  category: string = "Realestate",
): SectionItem[] => {
  const template = getBuilderTemplate(templateId, category);
  const homeTypes = new Set(
    Array.isArray(template.homeSectionOrder) && template.homeSectionOrder.length
      ? template.homeSectionOrder
      : [],
  );
  if (!homeTypes.size) return sections;

  const pageIdByType = new Map(
    getTemplatePages(template).map((page) => [page.sectionType, page.id]),
  );

  return sections.flatMap((section) => {
    if (section.page) return [section];
    if (section.type === "Breadcrumb" && !homeTypes.has("Breadcrumb")) {
      return [];
    }
    const pageId = pageIdByType.get(section.type);
    if (pageId && !homeTypes.has(section.type)) {
      return [
        {
          ...section,
          id: section.id || section.type,
          page: pageId,
        },
      ];
    }
    return [section];
  });
};

function variantsToCsv(variants: Record<string, string>) {
  const ordered = SECTION_ORDER_PREVIEW.map((s) => variants[s]).filter(
    Boolean,
  ) as string[];
  const extras = Object.entries(variants)
    .filter(
      ([type]) => !(SECTION_ORDER_PREVIEW as readonly string[]).includes(type),
    )
    .map(([, key]) => key);
  return [...ordered, ...extras].join(",");
}

function pageVariantsFor(
  source: Record<string, string>,
  pageBodyType?: string,
  pageBodyKey?: string,
  homeSectionOrder?: string[] | null,
): Record<string, string> {
  const next: Record<string, string> = {};
  if (pageBodyType && pageBodyKey) {
    if (source.Topbar) next.Topbar = source.Topbar;
    if (source.Header) next.Header = source.Header;
    next.Breadcrumb = source.Breadcrumb || "Breadcrumb-1";
    next[pageBodyType] = pageBodyKey;
    if (pageBodyType === "MissionPage") {
      next.MissionValues = source.MissionValues || "MissionValues-5";
    }
    if (pageBodyType === "CsrPage") {
      next.CsrPrograms = source.CsrPrograms || "CsrPrograms-5";
    }
    if (pageBodyType === "CareerPage") {
      next.CareerJobs = source.CareerJobs || "CareerJobs-5";
    }
    if (pageBodyType === "AboutPage") {
      next.Stats = source.Stats || "Stats-5";
      next.CTA = source.CTA || "CTA-5";
    }
    if (source.Footer) next.Footer = source.Footer;
    return next;
  }
  const order =
    Array.isArray(homeSectionOrder) && homeSectionOrder.length
      ? homeSectionOrder
      : [...HOME_SECTIONS_PREVIEW];
  for (const section of order) {
    if (source[section]) next[section] = source[section];
  }
  return next;
}

/** Full-page compose preview URL for onboarding monitor / open tab */
export const buildTemplateComposePreviewUrl = (
  template: BuilderTemplate,
  category: string,
): string | null => {
  const variants = template.sectionVariants || {};
  const isMulti = template.type === "Multiple Pages Website";
  const pages = getTemplatePages(template);

  if (!isMulti) {
    const csv = variantsToCsv(
      pageVariantsFor(variants, undefined, undefined, template.homeSectionOrder),
    );
    if (!csv) return null;
    const qs = new URLSearchParams({
      variants: csv,
      category,
      chrome: "0",
      templateId: template.id,
    });
    return `/preview/compose?${qs.toString()}`;
  }

  const qs = new URLSearchParams();
  qs.set("category", category);
  qs.set("nav", "1");
  qs.set("page", "home");
  qs.set("chrome", "0");
  qs.set("templateId", template.id);

  const homeCsv = variantsToCsv(
    pageVariantsFor(variants, undefined, undefined, template.homeSectionOrder),
  );
  if (!homeCsv) return null;
  qs.append("p", `home~Home~${homeCsv}`);

  pages.forEach((page, index) => {
    const layoutKey = variants[page.sectionType];
    if (!layoutKey) return;
    const csv = variantsToCsv(
      pageVariantsFor(variants, page.sectionType, layoutKey),
    );
    if (!csv) return;
    qs.append(
      "p",
      `${page.id || `page-${index}`}~${page.label || page.id}~${csv}`,
    );
  });

  return `/preview/compose?${qs.toString()}`;
};

/**
 * Compact card preview: home page top N sections only (no Footer / inner pages).
 * Used in onboarding theme cards as a scaled iframe.
 * Skips Topbar so Header + Banner + next content section fill the card.
 * `card=1` tells compose to prefer still images over autoplay video.
 * Multi-page themes keep a real page menu via `nav=1` (home renders limited sections).
 */
export const buildTemplateCardPreviewUrl = (
  template: BuilderTemplate,
  category: string,
  sectionLimit = 3,
): string | null => {
  const variants = template.sectionVariants || {};
  const home = pageVariantsFor(
    variants,
    undefined,
    undefined,
    template.homeSectionOrder,
  );
  const limited: Record<string, string> = {};

  for (const sectionType of SECTION_ORDER_PREVIEW) {
    if (sectionType === "Footer" || sectionType === "Topbar") continue;
    if (!home[sectionType]) continue;
    limited[sectionType] = home[sectionType];
    if (Object.keys(limited).length >= sectionLimit) break;
  }

  const homeCsv = variantsToCsv(limited);
  if (!homeCsv) return null;

  const isMulti = template.type === "Multiple Pages Website";
  const qs = new URLSearchParams({
    category,
    chrome: "0",
    card: "1",
    templateId: template.id,
  });

  if (!isMulti) {
    qs.set("variants", homeCsv);
    return `/preview/compose?${qs.toString()}`;
  }

  qs.set("nav", "1");
  qs.set("page", "home");
  qs.append("p", `home~Home~${homeCsv}`);

  getTemplatePages(template).forEach((page, index) => {
    const layoutKey = variants[page.sectionType];
    if (!layoutKey) return;
    // Menu-only stubs — card stays on home, so page body variants are unused.
    qs.append(
      "p",
      `${page.id || `page-${index}`}~${page.label || page.id}~Header-1,${layoutKey}`,
    );
  });

  return `/preview/compose?${qs.toString()}`;
};

/** Resolve preview content by registry key using category JSON (not smilecare defaults) */
export const resolveLayoutPreview = (
  variantKey: string,
  category: string = "Business",
): { sectionType: string; data: SectionData } | null => {
  const match = variantKey.match(/^(.+)-(\d+)$/);
  if (!match) return null;

  const sectionType = match[1];
  const categoryKey =
    categoryContent.categories[category] != null
      ? category
      : Object.keys(categoryContent.categories)[0] || "Business";

  if (sectionType === "AboutPage") {
    const section = createAboutPageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["AboutPage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "GalleryPage") {
    const section = createGalleryPageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["GalleryPage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "ServicePage") {
    const section = createServicePageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["ServicePage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "EventPage") {
    const section = createEventPageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["EventPage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "PropertyPage") {
    const section = createPropertyPageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["PropertyPage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "PortfolioPage") {
    const section = createPortfolioPageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["PortfolioPage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "TeamPage") {
    const section = createTeamPageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["TeamPage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "ContactPage") {
    const section = createContactPageSection(categoryKey);
    return {
      sectionType,
      data:
        section.data[variantKey] ??
        section.data["ContactPage-1"] ??
        ({} as SectionData),
    };
  }

  if (sectionType === "CustomPage") {
    const customCommon = categoryContent.common.CustomPage as
      | Record<string, unknown>
      | undefined;
    const customCat = categoryContent.categories[categoryKey]?.sections
      ?.CustomPage as Record<string, unknown> | undefined;
    const data = {
      ...resolveVariantContent(customCommon, variantKey),
      ...resolveVariantContent(customCat, variantKey),
    } as SectionData;
    return { sectionType, data };
  }

  if (sectionType !== "CustomPage" && sectionType.endsWith("Page")) {
    const commonPack = categoryContent.common[sectionType] as
      | Record<string, unknown>
      | undefined;
    const categoryPack = categoryContent.categories[categoryKey]?.sections?.[
      sectionType
    ] as Record<string, unknown> | undefined;
    const data = {
      ...resolveVariantContent(commonPack, variantKey),
      ...resolveVariantContent(categoryPack, variantKey),
    } as SectionData;
    return { sectionType, data };
  }

  const fromSelected = selectedConfig.sections.find(
    (section) => section.type === sectionType,
  );
  const defaults = createDefaultSectionData(sectionType, categoryKey);
  const baseData: Record<string, SectionData> = {
    ...(Object.keys(defaults).length ? defaults : {}),
    ...(fromSelected?.data ?? {}),
  };

  if (!Object.keys(baseData).length) {
    baseData[variantKey] = {} as SectionData;
  } else if (!baseData[variantKey]) {
    baseData[variantKey] =
      baseData[`${sectionType}-1`] ??
      (Object.values(baseData)[0] as SectionData) ??
      ({} as SectionData);
  }

  const merged = mergeCategoryData(
    {
      type: sectionType,
      variant: variantKey,
      data: baseData,
    },
    categoryKey,
  );

  const data = sanitizeSectionListFields(
    (merged.data[variantKey] ??
      fallbackVariantData(
        merged.data as Record<string, unknown>,
        variantKey,
        sectionType,
      )) as Record<string, unknown>,
    (defaults[variantKey] ||
      defaults[`${sectionType}-1`] ||
      Object.values(defaults)[0] ||
      {}) as Record<string, unknown>,
  ) as SectionData;

  return { sectionType, data };
};

export const buildSelectedConfig = (
  templateId?: string | null,
  category: string = "Realestate",
): SelectedConfig => {
  const builderTemplate = getBuilderTemplate(templateId, category);
  const baseSections = cloneSections(selectedConfig.sections);
  const baseByType = new Map(baseSections.map((section) => [section.type, section]));

  const makeSection = (sectionType: string, variant: string): SectionItem => {
    const base = baseByType.get(sectionType);
    const data =
      base?.data && Object.keys(base.data).length
        ? cloneSections([base])[0].data
        : createDefaultSectionData(sectionType, category);

    // Ensure active variant key exists so mergeCategoryData can fill content.
    if (!data[variant]) {
      const fallback = fallbackVariantData(
        data as Record<string, unknown>,
        variant,
        sectionType,
      );
      data[variant] = { ...(fallback as SectionData) };
    }
    if (data[variant]) {
      data[variant] = withTopbarLayoutSkin(
        variant,
        data[variant] as Record<string, unknown>,
      ) as SectionData;
    }

    if (sectionType === "CountriesServe" && data[variant]) {
      data[variant] = {
        ...data[variant],
        countriesServeWebsiteEnabled: true,
      };
    }

    return {
      type: sectionType,
      variant,
      data,
    };
  };

  let templateSections: SectionItem[];

  if (
    Array.isArray(builderTemplate.homeSectionOrder) &&
    builderTemplate.homeSectionOrder.length
  ) {
    const homeTypes = builderTemplate.homeSectionOrder.filter(
      (sectionType) => Boolean(builderTemplate.sectionVariants[sectionType]),
    );
    const homeSections = homeTypes.map((sectionType) =>
      makeSection(sectionType, builderTemplate.sectionVariants[sectionType]),
    );
    // Inner pages live in sectionVariants but must not render on Home.
    // Home visibility is `!section.page` — give each page body its slug.
    const extras = getTemplatePages(builderTemplate).flatMap((page) => {
      const variant = builderTemplate.sectionVariants[page.sectionType];
      if (!variant || homeTypes.includes(page.sectionType)) return [];
      const pageBody = {
        ...makeSection(page.sectionType, variant),
        id: page.sectionType,
        page: page.id,
      };
      const companions: SectionItem[] = [];
      if (page.sectionType === "MissionPage") {
        const valuesVariant =
          builderTemplate.sectionVariants.MissionValues || "MissionValues-5";
        companions.push({
          ...makeSection("MissionValues", valuesVariant),
          id: "MissionValues",
          page: page.id,
        });
      }
      if (page.sectionType === "CsrPage") {
        const programsVariant =
          builderTemplate.sectionVariants.CsrPrograms || "CsrPrograms-5";
        companions.push({
          ...makeSection("CsrPrograms", programsVariant),
          id: "CsrPrograms",
          page: page.id,
        });
      }
      if (page.sectionType === "CareerPage") {
        const jobsVariant =
          builderTemplate.sectionVariants.CareerJobs || "CareerJobs-5";
        companions.push({
          ...makeSection("CareerJobs", jobsVariant),
          id: "CareerJobs",
          page: page.id,
        });
      }
      if (page.sectionType === "AboutPage") {
        const statsVariant =
          builderTemplate.sectionVariants.Stats || "Stats-5";
        const statsSection = makeSection("Stats", statsVariant);
        companions.push({
          ...statsSection,
          id: `Stats-${page.id}`,
          page: page.id,
          data: {
            ...statsSection.data,
            [statsVariant]: {
              ...(statsSection.data?.[statsVariant] || {}),
              statsStyle: "light",
            },
          },
        });
        const ctaVariant = builderTemplate.sectionVariants.CTA || "CTA-5";
        companions.push({
          ...makeSection("CTA", ctaVariant),
          id: `CTA-${page.id}`,
          page: page.id,
        });
      }
      return [pageBody, ...companions];
    });

    const footerIndex = homeSections.findIndex(
    (section) => section.type === "Footer",
  );
    templateSections =
    footerIndex === -1
        ? [...homeSections, ...extras]
        : [
            ...homeSections.slice(0, footerIndex),
            ...extras,
            ...homeSections.slice(footerIndex),
          ];
  } else {
    const pageBodyTypes = new Set(
      getTemplatePages(builderTemplate).map((page) => page.sectionType),
    );
    const variantTypes = Object.keys(builderTemplate.sectionVariants);
    const homeTypes = [
      ...SECTION_ORDER_PREVIEW.filter(
        (sectionType) =>
          variantTypes.includes(sectionType) &&
          sectionType !== "Breadcrumb" &&
          !pageBodyTypes.has(sectionType),
      ),
      ...variantTypes.filter(
        (sectionType) =>
          !(SECTION_ORDER_PREVIEW as readonly string[]).includes(sectionType) &&
          sectionType !== "Breadcrumb" &&
          !pageBodyTypes.has(sectionType),
      ),
    ];
    const homeSections = homeTypes.map((sectionType) =>
      makeSection(sectionType, builderTemplate.sectionVariants[sectionType]),
    );
    const extras = getTemplatePages(builderTemplate).flatMap((page) => {
      const variant = builderTemplate.sectionVariants[page.sectionType];
      if (!variant || homeTypes.includes(page.sectionType)) return [];
      return [
        {
          ...makeSection(page.sectionType, variant),
          id: page.sectionType,
          page: page.id,
        },
      ];
    });
    const footerIndex = homeSections.findIndex(
      (section) => section.type === "Footer",
    );
    templateSections =
      footerIndex === -1
        ? [...homeSections, ...extras]
        : [
            ...homeSections.slice(0, footerIndex),
            ...extras,
            ...homeSections.slice(footerIndex),
          ];
  }

  const resolvedSections = templateSections.map((section) => {
    const variant = builderTemplate.sectionVariants[section.type] ?? section.variant;

    return mergeCategoryData({ ...section, variant }, category);
  });
  const singlePageMenu =
    builderTemplate.type === "Single Page Website"
      ? buildSinglePageTemplateMenu(builderTemplate)
      : [];
  const sections = singlePageMenu.length
    ? resolvedSections.map((section) => {
        if (section.type !== "Header") return section;
        const activeData = section.data[section.variant];
        if (!activeData) return section;

        return {
          ...section,
          data: {
            ...section.data,
            [section.variant]: {
              ...activeData,
              menu: singlePageMenu,
            },
          },
        };
      })
    : resolvedSections;

  return {
    templateId: builderTemplate.id,
    sections,
  };
};
