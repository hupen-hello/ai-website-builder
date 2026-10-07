export interface Feature {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface AboutUsData {
  subtitle?: string;
  subtitle2?: string;
  title1?: string;
  title2?: string;
  description?: string;
  features: Feature[];
  phone?: string;
  imageMain?: string;
  yearsOfService?: string;
  yearsText?: string;
  button?: {text: string, url: string};
}

export interface TopBarData {
  phoneLabel?: string;
  phoneValue?: string;
  emailValue?: string;
  followLabel?: string;
  socialLinks?: Array<{id: string, icon: string, url: string}>;
}

export interface HeaderData {
  logo?: string;
  logoAlt?: string;
  contactInfoLeft?: Array<{id: string, icon: string, label: string, value: string}>;
  contactInfoRight?: Array<{id: string, icon: string, label: string, value: string}>;
  navLinksLeft?: Array<{id: string, label: string, url: string, subLinks?: Array<{id: string, label: string, url: string}>}>;
  navLinksRight?: Array<{id: string, label: string, url: string, subLinks?: Array<{id: string, label: string, url: string}>}>;
  contactButton?: {text: string, url: string, icon: string};
}

export interface HeroData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  title3?: string;
  description?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  button?: {text: string, url: string};
}

export interface ServicesData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  title3?: string;
  description?: string;
  button?: {text: string, url: string};
  services: Array<{id: string, title: string, description: string, image: string, icon: string, url: string}>;
}

export interface ServiceDetailData {
  id: string;
  subtitle?: string;
  title1?: string;
  title2?: string;
  images?: {main: string, small1: string, small2: string};
  descriptions?: string[];
  features?: Feature[];
  typesTitle1?: string;
  typesTitle2?: string;
  types?: Array<{id: string, image: string, title: string, description: string}>;
  sidebar?: any;
  description?: string;
  imageMain?: string;
  overviewTitle?: string;
  overviewText?: string[];
  overviewImage?: string;
  processTitle?: string;
  processSteps?: Array<{id: string, number: string, title: string, description: string}>;
  faqTitle?: string;
  faqs?: Array<{id: string, question: string, answer: string}>;
}

export interface ContactData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  description?: string;
  form?: {
    title?: string;
    description?: string;
    buttonText?: string;
  };
  contactInfo?: {
    title?: string;
    description?: string;
    phoneTitle?: string;
    phone?: string;
    phoneDesc?: string;
    emailTitle?: string;
    email?: string;
    emailDesc?: string;
    addressTitle?: string;
    address?: string;
  };
  technicianImage?: string;
  map?: {
    url?: string;
    boxTitle?: string;
    boxAddress?: string;
    buttonText?: string;
  };
}
export interface BlogItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  date: string;
  url: string;
  detail?: any;
}

export interface BlogsData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  description?: string;
  blogs?: BlogItem[];
  button?: { text: string; url: string };
}
export interface TeamData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  description?: string;
  members: Array<{id: string, name: string, role: string, image: string, phone?: string, linkedin?: string}>;
}
export interface TestimonialsData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  description?: string;
  bgImage?: string;
  testimonials: Array<{id: string, name: string, role?: string, avatar: string, quote: string, location?: string, rating: number}>;
}

export interface EnquiryData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  description?: string;
  features: Feature[];
  form: { title1?: string, title2?: string, description?: string, fields?: any[], buttonText: string, servicesList?: string[] };
}
export interface GalleryData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  description?: string;
  images: Array<{id: string, image: string, alt: string, title: string}>;
}
export interface AchievementData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  title3?: string;
  description?: string;
  bgImage?: string;
  achievements: Array<any>;
}
export interface FaqData {
  subtitle?: string;
  title1?: string;
  title2?: string;
  description?: string;
  image?: string;
  faqs: Array<{id: string, question: string, answer: string}>;
}

export interface FooterData {
  logoAlt?: string;
  brandTitle?: string;
  copyrightText?: string;
  description?: string;
  hoursTitle?: string;
  hoursDays?: string;
  hours: string;
  socialLinks: Array<{id: string, icon: string, url: string}>;
  quickLinks: Array<{id: string, label: string, url: string}>;
  servicesLinks: Array<{id: string, label: string, url: string}>;
  contactInfo: {address: string, phone: string, email: string};
  instagram?: string[];
  satisfactionTitle?: string;
  satisfactionDesc?: string;
  quickLinksTitle?: string;
  getInTouchTitle?: string;
  callNowText?: string;
  emailReplyText?: string;
  servicesTitle?: string;
  stayConnectedTitle?: string;
  stayConnectedDesc?: string;
  newsletterTitle?: string;
  newsletterDesc?: string;
  badge1?: string;
  badge2?: string;
  badge3?: string;
}

export interface BreadcrumbData {
  title: string;
  paths: Array<{label: string, url?: string}>;
  bgImage?: string;
}

export interface HVACTemplateData {
  common?: {
    globalUI?: Record<string, string>;
    Footer?: FooterData;
    aboutBreadcrumb?: BreadcrumbData;
    servicesBreadcrumb?: BreadcrumbData;
    serviceDetailBreadcrumb?: BreadcrumbData;
    blogBreadcrumb?: BreadcrumbData;
    blogDetailBreadcrumb?: BreadcrumbData;
    contactBreadcrumb?: BreadcrumbData;
    enquiryBreadcrumb?: BreadcrumbData;
    galleryBreadcrumb?: BreadcrumbData;
  };
  categories?: {
    HVAC?: {
      sections?: {
        TopBar?: { variants: { [key: string]: TopBarData } };
        Header?: { variants: { [key: string]: HeaderData } };
        Hero?: { variants: { [key: string]: HeroData } };
        AboutUs?: { variants: { [key: string]: AboutUsData } };
        AboutFirm?: { variants: { [key: string]: AboutUsData } };
        Services?: { variants: { [key: string]: ServicesData } };
        ServiceDetail?: { variants: { [key: string]: ServiceDetailData } };
        Achievement?: { variants: { [key: string]: AchievementData } };
        Blogs?: { variants: { [key: string]: BlogsData } };
        Testimonials?: { variants: { [key: string]: TestimonialsData } };
        Team?: { variants: { [key: string]: TeamData } };
        Gallery?: { variants: { [key: string]: GalleryData } };
        Faq?: { variants: { [key: string]: FaqData } };
        Enquiry?: { variants: { [key: string]: EnquiryData } };
        Contact?: { variants: { [key: string]: ContactData } };
      }
    };
    Plumbing?: {
      sections?: {
        TopBar?: { variants: { [key: string]: TopBarData } };
        Header?: { variants: { [key: string]: HeaderData } };
        Hero?: { variants: { [key: string]: HeroData } };
        AboutUs?: { variants: { [key: string]: AboutUsData } };
        AboutFirm?: { variants: { [key: string]: AboutUsData } };
        Services?: { variants: { [key: string]: ServicesData } };
        ServiceDetail?: { variants: { [key: string]: ServiceDetailData } };
        Achievement?: { variants: { [key: string]: AchievementData } };
        Blogs?: { variants: { [key: string]: BlogsData } };
        Testimonials?: { variants: { [key: string]: TestimonialsData } };
        Team?: { variants: { [key: string]: TeamData } };
        Gallery?: { variants: { [key: string]: GalleryData } };
        Faq?: { variants: { [key: string]: FaqData } };
        Enquiry?: { variants: { [key: string]: EnquiryData } };
        Contact?: { variants: { [key: string]: ContactData } };
      }
    };
  }
}

export type PlumbingTemplateData = HVACTemplateData;
