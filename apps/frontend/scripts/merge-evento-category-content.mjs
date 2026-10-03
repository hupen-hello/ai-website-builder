import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const categoryPath = path.join(
  root,
  "app/editor/layout/src/data/categoryContent.json",
);
const eventPath = path.join(root, "app/editor/layout/src/data/eventContent.json");

const category = JSON.parse(fs.readFileSync(categoryPath, "utf8"));
const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
const pack = event.categories.Event.sections;

function variantOf(section, key) {
  return pack[section]?.variants?.[key] ?? {};
}

const template = {
  id: "template-evento-1",
  numericId: 15,
  title: "Event · Evenha Multi-page",
  type: "Multiple Pages Website",
  image: "/haelli.png",
  previewimage: "/haellipreview.png",
  preview_description: "Evenha Evento theme — all GitHub pages, same design.",
  prebuilt_pages: 32,
  sectionVariants: {
    Header: "Header-9",
    Banner: "Banner-9",
    About: "About-9",
    Product: "Product-9",
    Testimonial: "Testimonial-9",
    Blog: "Blog-9",
    Footer: "Footer-9",
    Breadcrumb: "Breadcrumb-9",
    Stats: "Stats-9",
    MissionVision: "MissionVision-9",
    CoreValues: "CoreValues-9",
    AboutPage: "AboutPage-9",
    MissionPage: "MissionPage-9",
    VisionPage: "VisionPage-9",
    OurStoryPage: "OurStoryPage-9",
    AwardsPage: "AwardsPage-9",
    TeamPage: "TeamPage-9",
    TeamDetail: "TeamDetail-9",
    WhyChooseUs: "WhyChooseUs-9",
    ServicePage: "ServicePage-9",
    ServiceDetail: "ServiceDetail-9",
    EventPage: "EventPage-9",
    EventDetail: "EventDetail-9",
    GalleryPage: "GalleryPage-9",
    VideoGallery: "VideoGallery-9",
    TestimonialPage: "TestimonialPage-9",
    PartnerPage: "PartnerPage-9",
    FaqPage: "FaqPage-9",
    CareerPage: "CareerPage-9",
    CareerDetail: "CareerDetail-9",
    QuotePage: "QuotePage-9",
    BlogPage: "BlogPage-9",
    BlogDetail: "BlogDetail-9",
    ContactPage: "ContactPage-9",
    ContactMap: "ContactMap-9",
    TermsPage: "TermsPage-9",
    PrivacyPage: "PrivacyPage-9",
    DisclaimerPage: "DisclaimerPage-9",
    RefundPolicyPage: "RefundPolicyPage-9",
    CookiePolicyPage: "CookiePolicyPage-9",
    SitemapPage: "SitemapPage-9",
    ErrorPage: "ErrorPage-9",
  },
  variables: {
    "--primary-bg": "#2b1049",
    "--primary-text": "#ffffff",
    "--secondary-bg": "#ffffff",
    "--secondary-text": "#15072b",
    "--header-bg": "#ffffff",
    "--header-text": "#15072b",
    "--hero-bg": "#1a052b",
    "--hero-title": "#ffffff",
    "--accent": "#6b3c9b",
  },
  homeSectionOrder: [
    "Header",
    "Banner",
    "About",
    "Product",
    "Testimonial",
    "Blog",
    "Footer",
  ],
  pages: [
    { id: "about-us", label: "About Us", sectionType: "AboutPage" },
    { id: "mission", label: "Mission", sectionType: "MissionPage" },
    { id: "vision", label: "Vision", sectionType: "VisionPage" },
    { id: "our-story", label: "Our Story", sectionType: "OurStoryPage" },
    { id: "awards", label: "Awards", sectionType: "AwardsPage" },
    { id: "our-team", label: "Our Team", sectionType: "TeamPage" },
    { id: "team-detail", label: "Team Detail", sectionType: "TeamDetail" },
    { id: "why-choose-us", label: "Why Choose Us", sectionType: "WhyChooseUs" },
    { id: "services", label: "Services", sectionType: "ServicePage" },
    { id: "services-detail", label: "Service Detail", sectionType: "ServiceDetail" },
    { id: "event", label: "Events", sectionType: "EventPage" },
    { id: "event-detail", label: "Event Detail", sectionType: "EventDetail" },
    { id: "gallery", label: "Gallery", sectionType: "GalleryPage" },
    { id: "testimonials", label: "Testimonials", sectionType: "TestimonialPage" },
    { id: "partners", label: "Partners", sectionType: "PartnerPage" },
    { id: "faqs", label: "FAQs", sectionType: "FaqPage" },
    { id: "career", label: "Career", sectionType: "CareerPage" },
    { id: "career-detail", label: "Career Detail", sectionType: "CareerDetail" },
    { id: "get-a-quote", label: "Get a Quote", sectionType: "QuotePage" },
    { id: "blog", label: "Blog", sectionType: "BlogPage" },
    { id: "blog-detail", label: "Blog Detail", sectionType: "BlogDetail" },
    { id: "contact", label: "Contact", sectionType: "ContactPage" },
    { id: "terms-conditions", label: "Terms", sectionType: "TermsPage" },
    { id: "privacy-policy", label: "Privacy", sectionType: "PrivacyPage" },
    { id: "disclaimer", label: "Disclaimer", sectionType: "DisclaimerPage" },
    { id: "refund-cancellation", label: "Refund", sectionType: "RefundPolicyPage" },
    { id: "cookies-policy", label: "Cookies", sectionType: "CookiePolicyPage" },
    { id: "sitemap", label: "Sitemap", sectionType: "SitemapPage" },
    { id: "404", label: "404", sectionType: "ErrorPage" },
  ],
  pageCompanions: {
    "about-us": ["Breadcrumb", "MissionVision", "CoreValues", "Stats"],
    mission: ["Breadcrumb"],
    vision: ["Breadcrumb"],
    "our-story": ["Breadcrumb"],
    awards: ["Breadcrumb"],
    "our-team": ["Breadcrumb"],
    "team-detail": ["Breadcrumb"],
    "why-choose-us": ["Breadcrumb"],
    services: ["Breadcrumb"],
    "services-detail": ["Breadcrumb"],
    event: ["Breadcrumb"],
    "event-detail": ["Breadcrumb"],
    gallery: ["Breadcrumb", "VideoGallery"],
    testimonials: ["Breadcrumb"],
    partners: ["Breadcrumb"],
    faqs: ["Breadcrumb"],
    career: ["Breadcrumb"],
    "career-detail": ["Breadcrumb"],
    "get-a-quote": ["Breadcrumb"],
    blog: ["Breadcrumb"],
    "blog-detail": ["Breadcrumb"],
    contact: ["Breadcrumb", "ContactMap"],
    "terms-conditions": ["Breadcrumb"],
    "privacy-policy": ["Breadcrumb"],
    disclaimer: ["Breadcrumb"],
    "refund-cancellation": ["Breadcrumb"],
    "cookies-policy": ["Breadcrumb"],
    sitemap: ["Breadcrumb"],
    "404": ["Breadcrumb"],
  },
};

if (!category.templates.some((t) => t.id === "template-evento-1")) {
  category.templates.push(template);
} else {
  category.templates = category.templates.map((t) =>
    t.id === "template-evento-1" ? template : t,
  );
}

const header = event.common?.Header || {};
const footer = event.common?.Footer || {};
const legal = pack.Legal?.variants || {};

const sections = {
  Header: {
    "Header-9": {
      logo: header.logo || {},
      navLinks: header.navLinks || [],
      topbar: header.topbar || {},
      ctaText: header.ctaText,
      ctaLink: header.ctaLink,
    },
  },
  Banner: { "Banner-9": variantOf("Hero", "HeroEvent1") },
  About: { "About-9": variantOf("About", "AboutEvent1") },
  Product: { "Product-9": variantOf("Services", "ServicesEvent1") },
  Testimonial: { "Testimonial-9": variantOf("Testimonials", "TestimonialsEvent1") },
  Blog: { "Blog-9": variantOf("Blog", "BlogEvent1") },
  Footer: { "Footer-9": footer },
  Breadcrumb: { "Breadcrumb-9": variantOf("PageBanner", "PageBannerEvent1") },
  Stats: { "Stats-9": { stats: variantOf("Stats", "StatsAltEvent1") } },
  MissionVision: { "MissionVision-9": variantOf("MissionVision", "MissionVisionEvent1") },
  CoreValues: { "CoreValues-9": variantOf("CoreValues", "CoreValuesEvent1") },
  AboutPage: { "AboutPage-9": variantOf("About", "AboutEvent1") },
  MissionPage: { "MissionPage-9": variantOf("Mission", "MissionEvent1") },
  VisionPage: { "VisionPage-9": variantOf("Vision", "VisionEvent1") },
  OurStoryPage: { "OurStoryPage-9": variantOf("OurStory", "OurStoryEvent1") },
  AwardsPage: { "AwardsPage-9": variantOf("Awards", "AwardsEvent1") },
  TeamPage: { "TeamPage-9": variantOf("OurTeam", "OurTeamEvent1") },
  TeamDetail: { "TeamDetail-9": variantOf("TeamDetail", "TeamDetailEvent1") },
  WhyChooseUs: { "WhyChooseUs-9": variantOf("WhyChooseUs", "WhyChooseUsEvent1") },
  ServicePage: { "ServicePage-9": variantOf("Services", "ServicesEvent1") },
  ServiceDetail: { "ServiceDetail-9": variantOf("ServiceDetail", "ServiceDetailEvent1") },
  EventPage: { "EventPage-9": variantOf("EventsList", "EventsListEvent1") },
  EventDetail: { "EventDetail-9": variantOf("EventDetail", "EventDetailEvent1") },
  GalleryPage: { "GalleryPage-9": variantOf("ImageGallery", "ImageGallery1") },
  VideoGallery: { "VideoGallery-9": variantOf("VideoGallery", "VideoGallery1") },
  TestimonialPage: {
    "TestimonialPage-9": variantOf("Testimonials", "TestimonialsEvent2"),
  },
  PartnerPage: { "PartnerPage-9": variantOf("Partners", "PartnersEvent1") },
  FaqPage: { "FaqPage-9": variantOf("Faqs", "FaqsEvent1") },
  CareerPage: { "CareerPage-9": variantOf("Career", "CareerEvent1") },
  CareerDetail: { "CareerDetail-9": variantOf("CareerDetail", "CareerDetailEvent1") },
  QuotePage: { "QuotePage-9": variantOf("GetAQuote", "GetAQuoteEvent1") },
  BlogPage: { "BlogPage-9": variantOf("Blog", "BlogEvent1") },
  BlogDetail: { "BlogDetail-9": variantOf("BlogDetail", "BlogDetailEvent1") },
  ContactPage: { "ContactPage-9": variantOf("ContactForm", "ContactFormEvent1") },
  ContactMap: { "ContactMap-9": variantOf("ContactMap", "ContactMapEvent1") },
  TermsPage: { "TermsPage-9": legal.TermsEvent1 || {} },
  PrivacyPage: { "PrivacyPage-9": legal.PrivacyEvent1 || {} },
  DisclaimerPage: { "DisclaimerPage-9": legal.DisclaimerEvent1 || {} },
  RefundPolicyPage: { "RefundPolicyPage-9": legal.RefundEvent1 || {} },
  CookiePolicyPage: { "CookiePolicyPage-9": legal.CookiesEvent1 || {} },
  SitemapPage: { "SitemapPage-9": variantOf("Sitemap", "SitemapEvent1") },
  ErrorPage: { "ErrorPage-9": variantOf("Error404", "Error404Event1") },
};

sections.About["AboutPage-9"] = sections.AboutPage["AboutPage-9"];
sections.Service = { "ServicePage-9": sections.ServicePage["ServicePage-9"] };
sections.Event = { "EventPage-9": sections.EventPage["EventPage-9"] };
sections.Gallery = { "GalleryPage-9": sections.GalleryPage["GalleryPage-9"] };
sections.Contact = { "ContactPage-9": sections.ContactPage["ContactPage-9"] };

category.categories["Event Services"] = {
  slug: "event-services",
  icon: "calendar-days",
  description: "Build an events website",
  templates: ["template-evento-1"],
  sections,
};

fs.writeFileSync(categoryPath, JSON.stringify(category, null, 2) + "\n");
console.log("merged Event Services into categoryContent.json");
