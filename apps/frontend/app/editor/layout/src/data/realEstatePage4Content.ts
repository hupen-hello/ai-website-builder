import categoryContentJson from "./categoryContent.json";
import type {
  AwardPage4Content,
  FaqPage4Content,
  GalleryPage4Content,
  IndustriesPage4Content,
  IndustryDetailPage4Content,
  BlogPage4Content,
  BlogDetailPage4Content,
  ContactPage4Content,
  EnquiryPage4Content,
  CareerPage4Content,
  CareerApplicationPage4Content,
  BrochurePage4Content,
  QuotePage4Content,
  MissionPage4Content,
  PartnerPage4Content,
  PricingPage4Content,
  ServicePage4Content,
  TeamPage4Content,
  TeamDetailPage4Content,
  PropertyGrid4Data,
  PropertyDetailPage4Content,
  TermsPage4Content,
  PrivacyLegalPage4Content,
  DisclaimerPage4Content,
  RefundPage4Content,
  CookiePage4Content,
  SitemapPage4Content,
  TestimonialPage4Content,
  VisionPage4Content,
} from "../types/realEstatePage4";

type VariantMap = Record<string, Record<string, unknown>>;

type CategoryContentShape = {
  categories: Record<
    string,
    {
      sections: Record<string, VariantMap>;
    }
  >;
};

const categoryContent = categoryContentJson as unknown as CategoryContentShape;

const getRealEstateVariants = (sectionKey: string): VariantMap =>
  categoryContent.categories.Realestate?.sections?.[sectionKey] ?? {};

const getVariant = <T>(variants: VariantMap, variantKey: string): T =>
  (variants[variantKey] ?? variants[`${variantKey}`] ?? {}) as T;

const v4 = (sectionKey: string) => `${sectionKey}-4`;

const fromSection = <T>(sectionKey: string, variantKey = v4(sectionKey)): T =>
  getVariant<T>(getRealEstateVariants(sectionKey), variantKey);

const crumb = () => fromSection("Breadcrumb");
const stats = () => fromSection("Stats");
const cta = () => fromSection("CtaBanner");

export const missionPage4Content: MissionPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateMission4: fromSection("Mission"),
  RealEstateStats3: stats(),
  RealEstateCtaBanner: cta(),
};

export const visionPage4Content: VisionPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateVision4: fromSection("Vision"),
  RealEstateStats3: stats(),
  RealEstateCtaBanner: cta(),
};

export const testimonialPage4Content: TestimonialPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateTestimonialPage4: fromSection("TestimonialPage"),
  RealEstateStats3: stats(),
  RealEstateCtaBanner: cta(),
};

export const galleryPage4Content: GalleryPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateGalleryPage4: fromSection("GalleryPage"),
  RealEstateStats3: stats(),
  RealEstateCtaBanner: cta(),
};

export const partnerPage4Content: PartnerPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstatePartnerPage4: fromSection("PartnerPage"),
  RealEstateCtaBanner: cta(),
};

export const awardPage4Content: AwardPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateAwardPage4: fromSection("AwardsPage"),
};

export const teamPage4Content: TeamPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateTeamPage4: fromSection("TeamPage"),
};

export const teamDetailPage4Content: TeamDetailPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateTeamDetailPage4: fromSection("TeamDetail"),
};

export const propertyGrid4Content: PropertyGrid4Data = fromSection("PropertyGrid");

export const propertyDetailPage4Content: PropertyDetailPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstatePropertyDetailPage4: fromSection("PropertyDetail"),
};

export const termsPage4Content: TermsPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateTermsPage4: fromSection("TermsPage"),
};

export const privacyPage4Content: PrivacyLegalPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstatePrivacyPage4: fromSection("PrivacyPage"),
};

export const disclaimerPage4Content: DisclaimerPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateDisclaimerPage4: fromSection("DisclaimerPage"),
};

export const refundPage4Content: RefundPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateRefundPage4: fromSection("RefundPolicyPage"),
};

export const cookiePage4Content: CookiePage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateCookiePage4: fromSection("CookiePolicyPage"),
};

export const sitemapPage4Content: SitemapPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateSitemapPage4: fromSection("SitemapPage"),
  RealEstateCtaBanner: cta(),
};

export const servicePage4Content: ServicePage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateServicePage4: fromSection("ServicePage"),
  RealEstateCtaBanner: cta(),
};

export const pricingPage4Content: PricingPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstatePricingPage4: fromSection("PricingPage"),
  RealEstatePricingTable4: fromSection("PricingTable"),
  RealEstatePricingHelpBanner4: fromSection("PricingHelp"),
  RealEstateCtaBanner: cta(),
};

export const faqPage4Content: FaqPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateFaqPage4: fromSection("FaqPage"),
  RealEstateCtaBanner: cta(),
};

export const industriesPage4Content: IndustriesPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateIndustriesPage4: fromSection("IndustriesPage"),
  RealEstateWhyPartner4: fromSection("WhyPartner"),
  RealEstateCtaBanner: cta(),
};

export const industryDetailPage4Content: IndustryDetailPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateIndustryDetailPage4: fromSection("IndustryDetail"),
  RealEstateWhyPartner4: fromSection("WhyPartner"),
  RealEstateCtaBanner: cta(),
};

export const blogPage4Content: BlogPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateBlogPage4: fromSection("BlogPage"),
};

export const blogDetailPage4Content: BlogDetailPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateBlogDetailPage4: fromSection("BlogDetail"),
};

export const contactPage4Content: ContactPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateFormDetail4: fromSection("FormDetail"),
  RealEstateContactMap4: fromSection("ContactMap"),
  RealEstateContactFeatures4: fromSection("ContactFeatures"),
};

export const enquiryPage4Content: EnquiryPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateEnquiryPage4: fromSection("EnquiryPage"),
};

export const careerPage4Content: CareerPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateCareerPage4: fromSection("CareerPage"),
  RealEstateCareerJobs4: fromSection("CareerJobs"),
  RealEstateCareerCta4: fromSection("CareerCta"),
};

export const careerApplicationPage4Content: CareerApplicationPage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateCareerApplicationPage4: fromSection("CareerApplication"),
};

export const brochurePage4Content: BrochurePage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateBrochurePage4: fromSection("BrochurePage"),
};

export const quotePage4Content: QuotePage4Content = {
  RealEstateBreadCrumb4: crumb(),
  RealEstateQuotePage4: fromSection("QuotePage"),
};

export const breadCrumb4Fields = [
  "accentColor",
  "title",
  "subtitle",
  "parentPage",
  "parentHref",
  "bgImage",
  "homeText",
  "homeHref",
] as const;

export const mission4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "values",
] as const;

export const vision4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "features",
  "image",
  "imageTitle",
  "quote",
] as const;

export const testimonialPage4Fields = ["accentColor", "testimonials"] as const;

export const galleryPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "items",
] as const;

export const partnerPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "partners",
] as const;

export const awardPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "awards",
] as const;

export const teamPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "team",
] as const;

export const teamDetailPage4Fields = [
  "accentColor",
  "name",
  "role",
  "image",
  "bio",
  "details",
  "serviceCards",
] as const;

export const servicePage4Fields = [
  "accentColor",
  "readMoreLabel",
  "services",
] as const;

export const pricingPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "buttonLabel",
  "plans",
] as const;

export const pricingTable4Fields = ["accentColor", "title", "rows"] as const;

export const pricingHelpBanner4Fields = [
  "accentColor",
  "title",
  "description",
  "buttonText",
  "buttonLink",
] as const;

export const stats3Fields = ["accentColor", "stats"] as const;

export const ctaBanner4Fields = [
  "accentColor",
  "title",
  "callLabel",
  "phoneNumber",
  "buttonText",
  "buttonLink",
] as const;

export const faqPage4Fields = [
  "accentColor",
  "faqList",
  "newsletterPretitle",
  "newsletterTitle",
  "newsletterPlaceholder",
  "sidebarImage",
  "sidebarImageAlt",
] as const;

export const industriesPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "learnMoreLabel",
  "industries",
] as const;

export const whyPartner4Fields = ["accentColor", "title", "reasons"] as const;

export const industryDetailPage4Fields = [
  "accentColor",
  "image",
  "name",
  "aboutPretitle",
  "headingSuffix",
  "description",
  "body",
  "quote",
] as const;

export const blogPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "readMoreLabel",
  "searchPlaceholder",
  "featuredImage",
  "featuredBadge",
  "featuredTitle",
  "featuredDescription",
  "featuredButtonText",
  "featuredButtonLink",
  "recentPostsTitle",
  "categoriesTitle",
  "allPostsLabel",
  "clearFilterLabel",
  "emptyMessage",
  "blogPosts",
] as const;

export const blogDetailPage4Fields = [
  "accentColor",
  "image",
  "title",
  "badge",
  "category",
  "date",
  "author",
  "readTime",
  "excerpt",
  "body",
  "recentPostsTitle",
  "newsletterTitle",
  "newsletterDescription",
  "newsletterPlaceholder",
  "newsletterButtonText",
] as const;

export const contactForm4Fields = [
  "accentColor",
  "title",
  "desc",
  "formSubmitLabel",
  "privacyText",
  "sidebarTitle",
  "locationTitle",
  "location",
  "phoneTitle",
  "phone",
  "emailTitle",
  "email",
  "hoursTitle",
  "hours",
  "formFields",
] as const;

export const contactMap4Fields = [
  "accentColor",
  "mapEmbed",
  "overlayTitle",
  "overlayDescription",
  "directionsLabel",
  "directionsLink",
] as const;

export const contactFeatures4Fields = ["accentColor", "features"] as const;

export const enquiryPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "image",
  "expertTitle",
  "expertDescription",
  "formTitle",
  "formSubmitLabel",
  "contactMethodLabel",
  "consentText",
  "privacyLabel",
  "privacyHref",
  "termsLabel",
  "termsHref",
  "features",
  "highlights",
  "formFields",
  "contactMethods",
] as const;

export const careerPage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "features",
] as const;

export const careerJobs4Fields = [
  "accentColor",
  "title",
  "description",
  "applyLabel",
  "jobs",
] as const;

export const careerCta4Fields = [
  "accentColor",
  "title",
  "subtitle",
  "description",
  "buttonText",
  "buttonLink",
  "email",
] as const;

export const careerApplication4Fields = [
  "accentColor",
  "title",
  "department",
  "location",
  "experience",
  "type",
  "posted",
  "formTitle",
  "formDescription",
  "submitLabel",
  "resumeLabel",
  "resumeHint",
  "resumeButtonLabel",
  "jobDetailsTitle",
  "whyJoinTitle",
  "helpTitle",
  "helpDescription",
  "helpEmail",
  "helpPhone",
  "successTitle",
  "successDescription",
  "closeLabel",
  "formFields",
  "reasons",
] as const;

export const brochurePage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "formatLabel",
  "downloadLabel",
  "brochures",
] as const;

export const propertyDetailPage4Fields = [
  "accentColor",
  "title",
  "address",
  "price",
  "statusLabel",
  "shareLabel",
  "saveLabel",
  "extraPhotosCount",
  "extraPhotosLabel",
  "descriptionTitle",
  "description",
  "description2",
  "amenitiesTitle",
  "locationTitle",
  "mapImage",
  "formTitle",
  "formDescription",
  "formSubmitLabel",
  "overviewTitle",
  "helpTitle",
  "helpDescription",
  "helpPhone",
  "galleryImages",
  "stats",
  "amenities",
  "overviewItems",
  "formFields",
] as const;

export const legalPage4Fields = [
  "accentColor",
  "title",
  "onThisPageTitle",
  "helpTitle",
  "helpDescription",
  "helpButtonLabel",
  "helpHref",
  "legalSections",
] as const;

export const sitemapPage4Fields = [
  "accentColor",
  "title",
  "description",
  "groups",
] as const;

export const quotePage4Fields = [
  "accentColor",
  "pretitle",
  "title",
  "description",
  "formSubmitLabel",
  "contactMethodLabel",
  "consentText",
  "privacyLabel",
  "privacyHref",
  "termsLabel",
  "termsHref",
  "featuresTitle",
  "howItWorksPretitle",
  "features",
  "formFields",
  "contactMethods",
  "steps",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pickFields = (
  source: Record<string, unknown>,
  fields: readonly string[],
) =>
  Object.fromEntries(
    fields
      .filter((field) => source[field] !== undefined)
      .map((field) => [field, source[field]]),
  );

// A page wrapper receives one blob for the whole route, so each child only gets
// the fields it owns, plus anything stored under its own component name.
export const resolveChildData = <T>(
  engineData: Record<string, unknown>,
  variantKey: string,
  authored: T,
  ownedFields: readonly string[],
): T => {
  const alias = variantKey
    .replace(/^RealEstate/, "")
    .replace(/Page4$/, "Page-4")
    .replace(/4$/, "-4")
    .replace(/3$/, "-4")
    .replace(/CtaBanner$/, "CtaBanner-4")
    .replace(/BreadCrumb-4$/, "Breadcrumb-4")
    .replace(/Stats-4$/, "Stats-4");
  const scoped =
    engineData[variantKey] ??
    engineData[alias] ??
    engineData[`${alias.replace(/^-/, "")}`];

  return {
    ...authored,
    ...pickFields(engineData, ownedFields),
    ...(isRecord(scoped) ? scoped : {}),
  } as T;
};
