import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sections = path.join(root, "app/editor/layout/src/components/sections");
const srcEvento = path.join(sections, "evento");

const copies = [
  ["types.ts", "about/eventTypes.ts"],
  ["ui/SectionDivider.tsx", "about/EventSectionDivider.tsx"],
  ["ui/Breadcrumb.tsx", "breadcrumb/EventBreadcrumbNav.tsx"],
  ["header/HeaderEvent1.tsx", "header/EventHeader.tsx"],
  ["hero/HeroEvent1.tsx", "banner/EventBanner.tsx"],
  ["about/AboutEvent1.tsx", "about/EventAbout.tsx"],
  ["footer/FooterEvent1.tsx", "footer/EventFooter.tsx"],
  ["page-banner/PageBannerEvent1.tsx", "breadcrumb/EventBreadCrumb.tsx"],
  ["services/ServicesEvent1.tsx", "service/EventService.tsx"],
  ["service-detail/ServiceDetailEvent1.tsx", "service/EventServiceDetailPage.tsx"],
  ["testimonials/TestimonialsEvent1.tsx", "testimonial/EventTestimonial.tsx"],
  ["testimonials/TestimonialsEvent2.tsx", "testimonial/EventTestimonialPage.tsx"],
  ["blog/BlogEvent1.tsx", "blog/EventBlog.tsx"],
  ["blog-detail/BlogDetailEvent1.tsx", "blog/EventBlogDetailPage.tsx"],
  ["faqs/FaqsEvent1.tsx", "faq/EventFaq.tsx"],
  ["contact/ContactFormEvent1.tsx", "contact/EventContact.tsx"],
  ["contact/ContactMapEvent1.tsx", "contact/EventContactMap.tsx"],
  ["gallery/ImageGallery1.tsx", "gallery/EventGallery.tsx"],
  ["gallery/VideoGallery1.tsx", "gallery/EventVideoGallery.tsx"],
  ["events/EventsListEvent1.tsx", "event/EventList.tsx"],
  ["event-detail/EventDetailEvent1.tsx", "event/EventDetailPage.tsx"],
  ["mission/MissionEvent1.tsx", "mission-vision/EventMission.tsx"],
  ["vision/VisionEvent1.tsx", "mission-vision/EventVision.tsx"],
  ["mission-vision/MissionVisionEvent1.tsx", "mission-vision/EventMissionVision.tsx"],
  ["core-values/CoreValuesEvent1.tsx", "about/EventCoreValues.tsx"],
  ["our-story/OurStoryEvent1.tsx", "about/EventOurStory.tsx"],
  ["awards/AwardsEvent1.tsx", "awards/EventAwards.tsx"],
  ["our-team/OurTeamEvent1.tsx", "team/EventTeam.tsx"],
  ["team-detail/TeamDetailEvent1.tsx", "team/EventTeamDetailPage.tsx"],
  ["why-choose-us/WhyChooseUsEvent1.tsx", "whychooseus/EventWhyChooseUs.tsx"],
  ["partners/PartnersEvent1.tsx", "partner/EventPartner.tsx"],
  ["career/CareerEvent1.tsx", "career/EventCareer.tsx"],
  ["career-detail/CareerDetailEvent1.tsx", "career/EventCareerDetailPage.tsx"],
  ["get-a-quote/GetAQuoteEvent1.tsx", "quote/EventQuote.tsx"],
  ["legal/LegalEvent1.tsx", "legal/EventLegalPage.tsx"],
  ["sitemap/SitemapEvent1.tsx", "sitemap/EventSitemapPage.tsx"],
  ["error/Error404Event1.tsx", "error/EventErrorPage.tsx"],
  ["stats/StatsAltEvent1.tsx", "stats/EventStats.tsx"],
  ["stats/StatsBarEvent1.tsx", "stats/EventStatsBar.tsx"],
  ["milestones/MilestonesEvent1.tsx", "stats/EventMilestones.tsx"],
];

function rewrite(content, destRel) {
  let next = content;
  next = next.replaceAll('from "../ui/SectionDivider"', 'from "../about/EventSectionDivider"');
  next = next.replaceAll("from '../ui/SectionDivider'", 'from "../about/EventSectionDivider"');
  next = next.replaceAll('from "../ui/Breadcrumb"', 'from "./EventBreadcrumbNav"');
  next = next.replaceAll('from "../types"', 'from "../about/eventTypes"');
  next = next.replaceAll("from '../types'", 'from "../about/eventTypes"');
  next = next.replaceAll(
    'import appData from "../../../../data/eventContent.json";',
    "",
  );
  if (destRel.startsWith("about/") && destRel !== "about/EventSectionDivider.tsx") {
    next = next.replaceAll('from "../about/EventSectionDivider"', 'from "./EventSectionDivider"');
    next = next.replaceAll('from "../about/eventTypes"', 'from "./eventTypes"');
  }
  if (destRel.startsWith("breadcrumb/")) {
    next = next.replaceAll('from "../about/eventTypes"', 'from "../about/eventTypes"');
  }
  if (!next.includes("SectionProps") && next.includes("export default function")) {
    next = next.replace(
      'from "react";',
      'from "react";\nimport type { SectionProps } from "../../../types/section";',
    );
    next = next.replace(
      /export default function (\w+)\(\{\s*data\s*\}:\s*\{[^}]*\}\)/,
      "export default function $1({ data = {} }: SectionProps)",
    );
    next = next.replace(
      /export default function (\w+)\(\{\s*data\s*\}:\s*[A-Za-z]+\s*\)/,
      "export default function $1({ data = {} }: SectionProps)",
    );
  }
  return next;
}

for (const [from, to] of copies) {
  const src = path.join(srcEvento, from);
  const dest = path.join(sections, to);
  if (!fs.existsSync(src)) {
    console.warn("missing", from);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const rewritten = rewrite(fs.readFileSync(src, "utf8"), to);
  fs.writeFileSync(dest, rewritten);
  console.log("wrote", to);
}

const pages = [
  ["about/EventAboutPage.tsx", "EventAbout", "./EventAbout"],
  ["service/EventServicePage.tsx", "EventService", "./EventService"],
  ["gallery/EventGalleryPage.tsx", "EventGallery", "./EventGallery"],
  ["faq/EventFaqPage.tsx", "EventFaq", "./EventFaq"],
  ["contact/EventContactPage.tsx", "EventContact", "./EventContact"],
  ["blog/EventBlogPage.tsx", "EventBlog", "./EventBlog"],
  ["event/EventPage.tsx", "EventList", "./EventList"],
  ["mission-vision/EventMissionPage.tsx", "EventMission", "./EventMission"],
  ["mission-vision/EventVisionPage.tsx", "EventVision", "./EventVision"],
  ["about/EventOurStoryPage.tsx", "EventOurStory", "./EventOurStory"],
  ["awards/EventAwardsPage.tsx", "EventAwards", "./EventAwards"],
  ["team/EventTeamPage.tsx", "EventTeam", "./EventTeam"],
  ["whychooseus/EventWhyChooseUsPage.tsx", "EventWhyChooseUs", "./EventWhyChooseUs"],
  ["partner/EventPartnerPage.tsx", "EventPartner", "./EventPartner"],
  ["career/EventCareerPage.tsx", "EventCareer", "./EventCareer"],
  ["quote/EventQuotePage.tsx", "EventQuote", "./EventQuote"],
];

for (const [file, name, imp] of pages) {
  const dest = path.join(sections, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(
    dest,
    `"use client";\n\nimport type { SectionProps } from "../../../types/section";\nimport ${name} from "${imp}";\n\nexport default function ${name}Page({ data = {} }: SectionProps) {\n  return <${name} data={data} />;\n}\n`,
  );
  console.log("page", file);
}

console.log("done copies");
