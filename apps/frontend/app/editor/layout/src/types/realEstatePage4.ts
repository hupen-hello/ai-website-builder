export type BreadCrumb4Data = {
  title?: string;
  subtitle?: string;
  name?: string;
  parentPage?: string;
  parentHref?: string;
  bgImage?: string;
  homeText?: string;
  homeHref?: string;
  accentColor?: string;
};

export type Stat3Item = {
  value: string;
  label: string;
  icon?: string;
};

export type Stats3Data = {
  stats?: Stat3Item[];
  accentColor?: string;
};

export type CtaBanner4Data = {
  title?: string;
  callLabel?: string;
  phoneNumber?: string;
  buttonText?: string;
  buttonLink?: string;
  accentColor?: string;
};

export type Mission4Value = {
  id?: string;
  title?: string;
  description?: string;
  desc?: string;
  icon?: string;
};

export type Mission4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  desc?: string;
  values?: Mission4Value[];
  accentColor?: string;
};

export type Vision4Feature = {
  accent?: string;
  title?: string;
  description?: string;
  desc?: string;
  icon?: string;
};

export type Vision4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  desc?: string;
  features?: Vision4Feature[];
  image?: string;
  imageTitle?: string;
  quote?: string;
  accentColor?: string;
};

export type TestimonialPage4Item = {
  id: string;
  name: string;
  location: string;
  text: string;
  image: string;
};

export type TestimonialPage4Data = {
  testimonials?: TestimonialPage4Item[];
  accentColor?: string;
};

export type GalleryPage4Item = {
  id: string;
  category?: string;
  image: string;
  title?: string;
};

export type GalleryPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  items?: GalleryPage4Item[];
  accentColor?: string;
};

export type PartnerPage4Item = {
  id: string;
  name: string;
  image: string;
};

export type PartnerPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  partners?: PartnerPage4Item[];
  accentColor?: string;
};

export type AwardPage4Item = {
  id: string;
  title: string;
  description: string;
  year: string;
  image: string;
};

export type AwardPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  awards?: AwardPage4Item[];
  accentColor?: string;
};

export type TeamPage4Details = {
  position?: string;
  email?: string;
  experience?: string;
  fax?: string;
  location?: string;
  phone?: string;
  practiceArea?: string;
};

export type TeamPage4Socials = {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
};

export type TeamPage4Member = {
  id: string;
  name: string;
  role: string;
  image: string;
  icon: string;
  details?: TeamPage4Details;
  socials?: TeamPage4Socials;
  bio?: string[];
};

export type TeamPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  team?: TeamPage4Member[];
  accentColor?: string;
};

export type ServicePage4Item = {
  id: string;
  title: string;
  image: string;
  icon: string;
};

export type ServicePage4Data = {
  readMoreLabel?: string;
  services?: ServicePage4Item[];
  accentColor?: string;
};

export type PricingPlan4 = {
  id: string;
  name: string;
  description: string;
  price: string;
  popular?: boolean;
  features: string[];
};

export type PricingPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  plans?: PricingPlan4[];
  accentColor?: string;
};

export type PricingTable4Row = {
  name: string;
  basic: boolean | string;
  standard: boolean | string;
  premium: boolean | string;
  ultimate: boolean | string;
  isPrice?: boolean;
};

export type PricingTable4Data = {
  title?: string;
  rows?: PricingTable4Row[];
  accentColor?: string;
};

export type PricingHelpBanner4Data = {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  accentColor?: string;
};

export type FaqPage4Item = {
  id: string;
  question: string;
  answer: string;
  image?: string;
};

export type FaqPage4Data = {
  faqList?: FaqPage4Item[];
  faqItems?: FaqPage4Item[];
  newsletterPretitle?: string;
  newsletterTitle?: string;
  newsletterPlaceholder?: string;
  sidebarImage?: string;
  sidebarImageAlt?: string;
  accentColor?: string;
};

export type MissionPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateMission4: Mission4Data;
  RealEstateStats3: Stats3Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type TestimonialPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateTestimonialPage4: TestimonialPage4Data;
  RealEstateStats3: Stats3Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type GalleryPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateGalleryPage4: GalleryPage4Data;
  RealEstateStats3: Stats3Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type PartnerPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstatePartnerPage4: PartnerPage4Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type AwardPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateAwardPage4: AwardPage4Data;
};

export type TeamPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateTeamPage4: TeamPage4Data;
};

export type TeamDetailServiceCard4 = {
  id?: string;
  icon?: string;
  title: string;
  description?: string;
};

export type TeamDetailPage4Data = {
  id?: string;
  name?: string;
  role?: string;
  image?: string;
  bio?: string[];
  details?: TeamPage4Details;
  serviceCards?: TeamDetailServiceCard4[];
  accentColor?: string;
};

export type TeamDetailPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateTeamDetailPage4: TeamDetailPage4Data;
};

export type PropertyGrid4Item = {
  id: string;
  title: string;
  address?: string;
  price?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  image?: string;
};

export type PropertyGrid4Data = {
  hideTitle?: boolean;
  hideButton?: boolean;
  properties?: PropertyGrid4Item[];
  accentColor?: string;
};

export type PropertyStat4 = {
  id?: string;
  icon?: string;
  value: string;
  label: string;
};

export type PropertyGalleryImage4 = {
  id?: string;
  image: string;
};

export type PropertyAmenity4 = {
  id?: string;
  label: string;
};

export type PropertyOverviewItem4 = {
  id?: string;
  label: string;
  value: string;
};

export type PropertyDetailPage4Data = {
  id?: string;
  title?: string;
  address?: string;
  price?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  image?: string;
  statusLabel?: string;
  shareLabel?: string;
  saveLabel?: string;
  extraPhotosCount?: string;
  extraPhotosLabel?: string;
  descriptionTitle?: string;
  description?: string;
  description2?: string;
  amenitiesTitle?: string;
  locationTitle?: string;
  mapImage?: string;
  formTitle?: string;
  formDescription?: string;
  formSubmitLabel?: string;
  overviewTitle?: string;
  helpTitle?: string;
  helpDescription?: string;
  helpPhone?: string;
  galleryImages?: PropertyGalleryImage4[];
  stats?: PropertyStat4[];
  amenities?: PropertyAmenity4[];
  overviewItems?: PropertyOverviewItem4[];
  formFields?: EnquiryField4[];
  accentColor?: string;
};

export type PropertyDetailPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstatePropertyDetailPage4: PropertyDetailPage4Data;
};

export type LegalSection4 = {
  id?: string;
  title: string;
  icon?: string;
  content: string;
};

export type LegalPage4Data = {
  title?: string;
  onThisPageTitle?: string;
  helpTitle?: string;
  helpDescription?: string;
  helpButtonLabel?: string;
  helpHref?: string;
  legalSections?: LegalSection4[];
  accentColor?: string;
};

export type TermsPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateTermsPage4: LegalPage4Data;
};

export type PrivacyLegalPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstatePrivacyPage4: LegalPage4Data;
};

export type DisclaimerPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateDisclaimerPage4: LegalPage4Data;
};

export type RefundPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateRefundPage4: LegalPage4Data;
};

export type CookiePage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateCookiePage4: LegalPage4Data;
};

export type SitemapLink4 = {
  label: string;
  href?: string;
};

export type SitemapGroup4 = {
  id?: string;
  title: string;
  icon?: string;
  links?: SitemapLink4[];
};

export type SitemapPage4Data = {
  title?: string;
  description?: string;
  groups?: SitemapGroup4[];
  accentColor?: string;
};

export type SitemapPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateSitemapPage4: SitemapPage4Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type ServicePage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateServicePage4: ServicePage4Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type PricingPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstatePricingPage4: PricingPage4Data;
  RealEstatePricingTable4: PricingTable4Data;
  RealEstatePricingHelpBanner4: PricingHelpBanner4Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type VisionPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateVision4: Vision4Data;
  RealEstateStats3: Stats3Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type FaqPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateFaqPage4: FaqPage4Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type IndustryPage4Item = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  image: string;
  icon?: string;
};

export type IndustriesPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  learnMoreLabel?: string;
  industries?: IndustryPage4Item[];
  accentColor?: string;
};

export type WhyPartner4Item = {
  id?: string;
  icon?: string;
  title: string;
  description: string;
};

export type WhyPartner4Data = {
  title?: string;
  reasons?: WhyPartner4Item[];
  accentColor?: string;
};

export type IndustryDetailPage4Data = {
  name?: string;
  title?: string;
  image?: string;
  description?: string;
  aboutPretitle?: string;
  headingSuffix?: string;
  body?: string;
  quote?: string;
  accentColor?: string;
};

export type IndustriesPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateIndustriesPage4: IndustriesPage4Data;
  RealEstateWhyPartner4: WhyPartner4Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type IndustryDetailPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateIndustryDetailPage4: IndustryDetailPage4Data;
  RealEstateWhyPartner4: WhyPartner4Data;
  RealEstateCtaBanner: CtaBanner4Data;
};

export type BlogPage4Post = {
  id: string;
  title: string;
  excerpt?: string;
  description?: string;
  date: string;
  category?: string;
  badge?: string;
  author?: string;
  image: string;
  body?: string;
};

export type BlogPage4Data = {
  pretitle?: string;
  title?: string;
  readMoreLabel?: string;
  searchPlaceholder?: string;
  featuredImage?: string;
  featuredBadge?: string;
  featuredTitle?: string;
  featuredDescription?: string;
  featuredButtonText?: string;
  featuredButtonLink?: string;
  recentPostsTitle?: string;
  categoriesTitle?: string;
  allPostsLabel?: string;
  clearFilterLabel?: string;
  emptyMessage?: string;
  fallbackImage?: string;
  blogPosts?: BlogPage4Post[];
  accentColor?: string;
};

export type BlogDetailPage4Data = {
  id?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  date?: string;
  category?: string;
  badge?: string;
  author?: string;
  image?: string;
  body?: string;
  readTime?: string;
  recentPostsTitle?: string;
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  fallbackImage?: string;
  accentColor?: string;
};

export type BlogPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateBlogPage4: BlogPage4Data;
};

export type BlogDetailPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateBlogDetailPage4: BlogDetailPage4Data;
};

export type ContactForm4Subject = {
  value: string;
  label: string;
};

export type ContactForm4InfoItem = {
  id?: string;
  icon?: string;
  title: string;
  content: string;
};

export type ContactForm4Data = {
  title?: string;
  desc?: string;
  description?: string;
  formSubmitLabel?: string;
  formFields?: { label: string; type?: "text" | "email" | "tel" | "textarea"; placeholder?: string }[];
  phone?: string;
  email?: string;
  location?: string;
  hours?: string;
  privacyText?: string;
  sidebarTitle?: string;
  locationTitle?: string;
  phoneTitle?: string;
  emailTitle?: string;
  hoursTitle?: string;
  accentColor?: string;
};

export type ContactMap4Data = {
  mapEmbed?: string;
  overlayTitle?: string;
  overlayDescription?: string;
  directionsLabel?: string;
  directionsLink?: string;
  accentColor?: string;
};

export type ContactFeature4Item = {
  id?: string;
  icon?: string;
  title: string;
  description?: string;
  desc?: string;
};

export type ContactFeatures4Data = {
  features?: ContactFeature4Item[];
  accentColor?: string;
};

export type ContactPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateFormDetail4: ContactForm4Data;
  RealEstateContactMap4: ContactMap4Data;
  RealEstateContactFeatures4: ContactFeatures4Data;
};

export type EnquiryField4 = {
  label: string;
  name?: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  icon?: string;
  options?: string;
  fullWidth?: boolean;
};

export type EnquiryOption4 = {
  id?: string;
  label: string;
};

export type EnquiryMethod4 = {
  id?: string;
  icon?: string;
  label: string;
};

export type EnquiryPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  expertTitle?: string;
  expertDescription?: string;
  formTitle?: string;
  formSubmitLabel?: string;
  contactMethodLabel?: string;
  consentText?: string;
  privacyLabel?: string;
  privacyHref?: string;
  termsLabel?: string;
  termsHref?: string;
  features?: ContactFeature4Item[];
  highlights?: ContactFeature4Item[];
  formFields?: EnquiryField4[];
  contactMethods?: EnquiryMethod4[];
  accentColor?: string;
};

export type EnquiryPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateEnquiryPage4: EnquiryPage4Data;
};

export type CareerFeature4Item = {
  id?: string;
  icon?: string;
  title: string;
  description?: string;
  desc?: string;
};

export type CareerPage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  features?: CareerFeature4Item[];
  accentColor?: string;
};

export type CareerJob4 = {
  id: string;
  title: string;
  department: string;
  location: string;
  experience: string;
  type: string;
  posted: string;
};

export type CareerJobs4Data = {
  title?: string;
  description?: string;
  applyLabel?: string;
  jobs?: CareerJob4[];
  accentColor?: string;
};

export type CareerCta4Data = {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  email?: string;
  accentColor?: string;
};

export type CareerPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateCareerPage4: CareerPage4Data;
  RealEstateCareerJobs4: CareerJobs4Data;
  RealEstateCareerCta4: CareerCta4Data;
};

export type CareerApplication4Data = {
  id?: string;
  title?: string;
  department?: string;
  location?: string;
  experience?: string;
  type?: string;
  posted?: string;
  formTitle?: string;
  formDescription?: string;
  submitLabel?: string;
  resumeLabel?: string;
  resumeHint?: string;
  resumeButtonLabel?: string;
  jobDetailsTitle?: string;
  whyJoinTitle?: string;
  helpTitle?: string;
  helpDescription?: string;
  helpEmail?: string;
  helpPhone?: string;
  successTitle?: string;
  successDescription?: string;
  closeLabel?: string;
  formFields?: EnquiryField4[];
  reasons?: CareerFeature4Item[];
  accentColor?: string;
};

export type CareerApplicationPage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateCareerApplicationPage4: CareerApplication4Data;
};

export type BrochurePage4Item = {
  id: string;
  title: string;
  description?: string;
  image: string;
  pages: number | string;
  size?: string;
  file?: string;
};

export type BrochurePage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  formatLabel?: string;
  downloadLabel?: string;
  brochures?: BrochurePage4Item[];
  accentColor?: string;
};

export type BrochurePage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateBrochurePage4: BrochurePage4Data;
};

export type QuoteStep4Item = {
  id?: string;
  num: string;
  icon?: string;
  title: string;
  description?: string;
  desc?: string;
};

export type QuotePage4Data = {
  pretitle?: string;
  title?: string;
  description?: string;
  formSubmitLabel?: string;
  contactMethodLabel?: string;
  consentText?: string;
  privacyLabel?: string;
  privacyHref?: string;
  termsLabel?: string;
  termsHref?: string;
  featuresTitle?: string;
  howItWorksPretitle?: string;
  features?: ContactFeature4Item[];
  formFields?: EnquiryField4[];
  contactMethods?: EnquiryMethod4[];
  steps?: QuoteStep4Item[];
  accentColor?: string;
};

export type QuotePage4Content = {
  RealEstateBreadCrumb4: BreadCrumb4Data;
  RealEstateQuotePage4: QuotePage4Data;
};
