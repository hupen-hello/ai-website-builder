import type {
  Block,
  BlockSection,
  LayoutComponentProps,
} from "../components/sections/types/section";
import type { SocialPlatformId } from "../lib/socialPlatforms";

export type {
  Block,
  BlockSection,
  SectionType,
  TextBlock,
  ImageBlock,
  VideoBlock,
  ButtonBlock,
  SliderBlock,
  CarouselBlock,
  CardBlock,
  ListBlock,
  MenuBlock,
  LogoBlock,
} from "../components/sections/types/section";

type MenuItem = {
  label: string;
  href: string;
  children?: MenuItem[];
  menuType?: "link" | "dropdown" | "mega";
};

export type SocialLinkData = {
  label: SocialPlatformId;
  href: string;
};

export type TopbarData = {
  topbarBackgroundType?: "solid" | "gradient";
  topbarBackgroundColor?: string;
  topbarGradientColor?: string;
  topbarTextColor?: string;
  text?: string[];
  phone?: string;
  email?: string;
  location?: string;
  socialLinks?: SocialLinkData[];
};

export type ButtonData = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
  icon?: "none" | "arrow-right" | "arrow-left" | "plus" | "phone" | "mail" | "external-link";
  iconPosition?: "before" | "after";
  openInNewTab?: boolean;
};

export type BannerSlideData = {
  image: string;
  video?: string;
  alt?: string;
  pretitle?: string;
  title: string;
  desc?: string;
  button?: ButtonData;
  buttons?: ButtonData[];
};

export const MAX_BANNER_SLIDE_BUTTONS = 3;

export function resolveBannerSlideButtons(
  slide?: Pick<BannerSlideData, "button" | "buttons"> | null,
  fallbackButtons?: ButtonData[],
  max = MAX_BANNER_SLIDE_BUTTONS,
): ButtonData[] {
  const usable = (items: ButtonData[] | undefined) =>
    (items ?? [])
      .filter((item) => Boolean(item && (item.label || item.href)))
      .slice(0, max);

  if (Array.isArray(slide?.buttons)) return usable(slide.buttons);

  const list: ButtonData[] = [];
  if (slide?.button && (slide.button.label || slide.button.href)) {
    list.push(slide.button);
  }
  const fallback = fallbackButtons ?? [];
  const start = list.length ? 1 : 0;
  for (let i = start; i < fallback.length && list.length < max; i += 1) {
    const item = fallback[i];
    if (item && (item.label || item.href)) list.push(item);
  }
  return list;
}

export type ProductImageData = {
  image: string;
  alt: string;
};

export type ProductFeatureData = {
  label: string;
  price: string;
};

export type ProductSlideData = {
  image: string;
  alt: string;
  link?: string;
  productTitle: string;
  productSubtitle: string;
  productInfoTitle: string;
  productInfoDesc: string;
  productFeatures: ProductFeatureData[];
  productTotalPrice: string;
  productShippingText: string;
  button?: ButtonData;
};

export type ProductCardData = {
  title: string;
  category: string;
  desc: string;
  image: string;
  alt?: string;
  imageTitle?: string;
  link?: string;
  /** URL slug for the service detail page (`/service/{slug}`). */
  slug?: string;
  /** Rich HTML body for the service (manager content editor). */
  content?: string;
  order?: number;
  /** When false the service is hidden on the published page. */
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  id?: string;
  /** Event-only fields (shared product card shape). */
  eventDate?: string;
  eventTime?: string;
  eventType?: "upcoming" | "past";
  /** Property-only fields (shared product card shape). */
  price?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqft?: string;
  propertyType?: string;
  listingType?: string;
  /** When true, new items can appear on home teasers. Existing home cards stay. */
  featured?: boolean;
  /** Amenity list — structured `{ name, icon }` or legacy comma-separated string. */
  amenities?:
    | string
    | Array<{
        name: string;
        icon?: string;
      }>;
  floorPlan?: string;
};

export type WhyChooseUsItemData = {
  title: string;
  desc: string;
  icon?: string;
  stat?: string;
  image?: string;
};

export type GalleryItemData = {
  id?: string;
  image: string;
  alt?: string;
  title?: string;
  desc?: string;
  category?: string;
  order?: number;
  active?: boolean;
};

/** Full listing item under Countries We Serve (Service/Blog-style fields). */
export type CountryServeListingData = {
  id?: string;
  title: string;
  /** Country name used for grouping (like service category). */
  category?: string;
  /** Stable link to a country row id. */
  countryId?: string;
  desc?: string;
  content?: string;
  image?: string;
  alt?: string;
  link?: string;
  slug?: string;
  order?: number;
  active?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

/** Country column (flag + name only). Listings live in countriesServeListings. */
export type CountryServeItemData = {
  id?: string;
  name: string;
  flagImage: string;
  flagAlt?: string;
  order?: number;
  active?: boolean;
  /** @deprecated Migrated into countriesServeListings. */
  items?: CountryServeListingData[];
};

export type FormFieldData = {
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  placeholder?: string;
  fullWidth?: boolean;
};

export type FaqItemData = {
  question: string;
  answer: string;
};

export type TestimonialItemData = {
  name: string;
  role: string;
  quote: string;
  image?: string;
  rating?: string;
};

export type FooterSocialData = {
  label: SocialPlatformId;
  href: string;
};

export type FooterLinkData = {
  label: string;
  href: string;
  /** When true, link is kept in data but not shown on the site. */
  hidden?: boolean;
};

export type FooterColumnData = {
  title: string;
  links: FooterLinkData[];
  /** When true, whole column is kept in data but not shown on the site. */
  hidden?: boolean;
};

export type FooterContactData = {
  location: string;
  email: string;
  phone: string;
};

export type SectionData = {
  [field: string]: unknown;

  hiddenContentFields?: string[];
  topbarType?: "scroll" | "sticky";
  topbarBackgroundType?: "solid" | "gradient";
  topbarBackgroundColor?: string;
  topbarGradientColor?: string;
  topbarTextColor?: string;
  text?: string[];
  phone?: string;
  email?: string;
  location?: string;
  socialLinks?: SocialLinkData[];

  logo?: string;
  logoImage?: string;
  logoImageTitle?: string;
  menu?: MenuItem[];
  buttons?: ButtonData[];

  headerBackgroundType?: "solid" | "gradient";
  headerType?: "scroll" | "sticky";
  headerBackgroundColor?: string;
  headerGradientColor?: string;
  headerTextColor?: string;
  headerActiveTextColor?: string;
  headerActiveBackgroundColor?: string;
  headerActiveMenuStyle?:
    | "background"
    | "text-only"
    | "underline"
    | "curved-underline";
  headerActiveKeepTextColor?: boolean;
  headerActiveLineGap?: number;
  headerActiveMenuPadding?: number;

  pretitle?: string;
  title?: string;
  subtitle?: string;

  backgroundImage?: string;
  backgroundImageTitle?: string;
  backgroundVideo?: string;
  bannerBackgroundMode?: "image" | "video" | "solid" | "gradient";
  bannerBackgroundColor?: string;
  bannerGradientColor?: string;
  bannerHeight?: number;
  bannerSlides?: BannerSlideData[];

  eyebrowColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  overlayColor?: string;

  desc?: string;
  desc2?: string;

  buttonBackground?: string;
  buttonColor?: string;

  length?: number;
  sideImage?: string;
  sideImageTitle?: string;
  philosophyTitle?: string;
  philosophyDesc?: string;

  productImages?: ProductImageData[];
  productTitle?: string;
  productSubtitle?: string;
  productInfoTitle?: string;
  productInfoDesc?: string;
  productFeatures?: ProductFeatureData[];
  productTotalPrice?: string;
  productShippingText?: string;
  serviceSlides?: ProductSlideData[];
  /** @deprecated use serviceSlides */
  productSlides?: ProductSlideData[];
  productSectionTitle?: string;
  productItems?: ProductCardData[];
  /** Services index layout id (`ServicePage-1` …). */
  layout?: string;
  /** Default service detail layout id (`ServiceDetail-1` …). */
  detailLayout?: string;
  /**
   * Published base path for service detail links, e.g. `/published/{siteId}/service`.
   * Injected by the published renderer — cards link to `{base}/{slug}`.
   */
  serviceDetailBase?: string;
  /**
   * Published base path for country listing detail links,
   * e.g. `/published/{siteId}/country`.
   */
  countriesServeDetailBase?: string;
  /**
   * Published base path for event detail links, e.g. `/published/{siteId}/event`.
   */
  eventDetailBase?: string;
  /**
   * Published base path for property detail links, e.g. `/published/{siteId}/property`.
   */
  propertyDetailBase?: string;
  /**
   * Published base path for portfolio detail links, e.g. `/published/{siteId}/portfolio`.
   */
  portfolioDetailBase?: string;
  /** Published site root, e.g. `/published/{siteId}`. */
  publishedSiteBase?: string;
  homeHref?: string;
  propertiesHref?: string;
  projectsHref?: string;

  whyChooseUsItems?: WhyChooseUsItemData[];
  features?: Array<{
    title: string;
    desc?: string;
    icon?: string;
    image?: string;
  }>;
  galleryItems?: GalleryItemData[];
  /** Countries We Serve columns (flag + name). */
  countriesServeItems?: CountryServeItemData[];
  /** Countries We Serve listings (full manager fields, grouped by country). */
  countriesServeListings?: CountryServeListingData[];
  /**
   * When false, the Countries We Serve section and `/country/{slug}` detail
   * routes stay hidden on the published site. Defaults to true.
   */
  countriesServeWebsiteEnabled?: boolean;
  formFields?: FormFieldData[];
  formSubmitLabel?: string;
  faqItems?: FaqItemData[];
  testimonialItems?: TestimonialItemData[];

  footerBackgroundType?: "solid" | "gradient";
  footerBackgroundColor?: string;
  footerGradientColor?: string;
  footerTextColor?: string;
  footerMutedTextColor?: string;
  footerSocialLinks?: FooterSocialData[];
  footerColumns?: FooterColumnData[];
  footerContact?: FooterContactData;
  footerLegalLinks?: FooterLinkData[];
  whatsappLink?: string;
  callLink?: string;
  floatingItems?: Array<{
    id: string;
    label: string;
    href?: string;
    icon?: string;
    active?: boolean;
    side?: "left" | "right";
  }>;
  copyrightText?: string;
  /** Paid Remove Branding add-on — hide the locked Lestow copyright. */
  removeBranding?: boolean;
  legalTitle?: string;
  contactLabel?: string;
  officeLabel?: string;
  disclaimerTitle?: string;
  disclaimerText?: string;
  successMessage?: string;
  successTitle?: string;
  successButtonLabel?: string;
  formPretitle?: string;
  formTitle?: string;
  promises?: string[];
  stats?: Array<{ value?: string; label?: string }>;
  contact?: Partial<FooterContactData>;
};

export type LeadCaptureContext = {
  siteSlug: string;
  formName: string;
  formSection: string;
  formPage?: string;
};

export type SectionProps = {
  data?: SectionData;
  editorMode?: boolean;
  leadCapture?: LeadCaptureContext;
} & Partial<LayoutComponentProps> & {
    blocks?: Block[];
    section?: BlockSection;
  };

export type SectionItem = {
  id?: string;
  page?: string;
  type: string;
  variant: string;
  data: Record<string, SectionData>;
};

export type SelectedConfig = {
  templateId: string;
  sections: SectionItem[];
};
