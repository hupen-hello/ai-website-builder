export interface Breadcrumb {
  label: string;
  href: string;
}

export interface PageBannerData {
  title: string;
  breadcrumbs: Breadcrumb[];
  bgImage: string;
}

export interface Tab {
  icon: string;
  title: string;
  description: string;
}

export interface Featured {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image: string;
}

export interface MissionVisionData {
  tabs: Tab[];
  featured: Featured;
}

export interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

export interface CoreValuesData {
  subtitle: string;
  title: string;
  highlight: string;
  description: string;
  image: string;
  values: ValueItem[];
}

export interface StatItem {
  icon: string;
  value: string;
  label: string;
}

export interface AboutData {
  subtitle: string;
  title: string;
  description1: string;
  description2: string;
  cursiveText: string;
  images: string[];
  experienceBadge: {
    value: string;
    text: string;
  };
}

// You can add more types for Hero, Services, Blog, etc. here

export interface MissionFeature {
  icon: string;
  title: string;
  description: string;
}

export interface MissionData {
  subtitle: string;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  features: MissionFeature[];
  image: string;
  quote: {
    textPart1: string;
    textHighlight: string;
    textPart2: string;
  };
}

export interface VisionFeature {
  icon: string;
  title: string;
  description: string;
}

export interface VisionData {
  subtitle: string;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  features: VisionFeature[];
  image: string;
  quote: {
    text: string;
  };
}

export interface AwardItem {
  year: string;
  title: string;
  description: string;
  image: string;
}

export interface AwardsData {
  subtitle: string;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  awards: AwardItem[];
}

export interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

export interface OurStoryData {
  subtitle: string;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  timeline: TimelineItem[];
  image1: string;
  image2: string;
  experienceYears: string;
}

export interface TeamSocial {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  icon: string;
  social: TeamSocial;
}

export interface OurTeamData {
  subtitle: string;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  members: TeamMember[];
}

export interface SkillItem {
  name: string;
  percentage: number;
  icon: string;
}

export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  description: string;
}

export interface TeamDetailData {
  subtitle: string;
  name: string;
  role: string;
  shortDescription: string;
  image: string;
  social: TeamSocial;
  info: {
    experience: string;
    email: string;
    phone: string;
    location: string;
  };
  about: {
    title: string;
    description: string[];
  };
  education: {
    title: string;
    degree: string;
    university: string;
    year: string;
  };
  skillsTitle: string;
  skills: SkillItem[];
  experienceTitle: string;
  experienceTimeline: ExperienceItem[];
}

export interface FeatureBlock {
  icon: string;
  title: string;
  description: string;
}

export interface TagItem {
  icon: string;
  text: string;
}

export interface WhyChooseUsData {
  subtitle: string;
  titlePart1: string;
  titleHighlight: string;
  description: string;
  features: FeatureBlock[];
  bullets: string[];
  image1: string;
  image2: string;
  tags: TagItem[];
}

export interface ServiceItem {
  title: string;
  tags: string[];
  image: string;
}

export interface ServicesData {
  subtitle: string;
  title: string;
  description: string;
  items: ServiceItem[];
  ctaText?: string;
}

export interface ServiceDetailFeature {
  icon: string;
  title: string;
  description?: string;
}

export interface ServiceDetailSidebarItem {
  title: string;
  icon: string;
  isActive?: boolean;
}

export interface ServiceDetailData {
  subtitle: string;
  title: string;
  shortDescription: string;
  topFeatures: ServiceDetailFeature[];
  image: string;
  overviewSubtitle: string;
  overviewTitle: string;
  overviewDescription: string[];
  overviewFeatures: ServiceDetailFeature[];
  sidebar: {
    servicesTitle: string;
    services: ServiceDetailSidebarItem[];
    whyChooseTitle: string;
    whyChoosePoints: string[];
    enquiryTitle: string;
    enquiryDescription: string;
  };
}

export interface EventListItem {
  date: string;
  month: string;
  image: string;
  title: string;
  description: string;
  location: string;
  time: string;
  link: string;
}

export interface EventsListData {
  badge: string;
  titlePart1: string;
  titleHighlight: string;
  titlePart2: string;
  description: string;
  events: EventListItem[];
}

export interface EventScheduleItem {
  dateNum: string;
  dateMonth: string;
  day: string;
  title: string;
  description: string;
  time: string;
}

export interface EventDetailFeature {
  icon: string;
  title: string;
  description: string;
}

export interface EventDetailInfo {
  icon: string;
  label: string;
  value: string;
}

export interface EventDetailData {
  badge: string;
  defaultTitle: string;
  defaultImage: string;
  defaultDate: string;
  defaultLocation: string;
  defaultTime: string;
  overviewTitle: string;
  overviewDescription: string;
  features: EventDetailFeature[];
  scheduleTitle: string;
  schedule: EventScheduleItem[];
  sidebar: {
    registerTitle: string;
    registerDescription: string;
    detailsTitle: string;
    details: EventDetailInfo[];
    shareTitle: string;
  };
}
