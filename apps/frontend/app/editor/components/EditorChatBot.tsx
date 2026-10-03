"use client";

import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  GripHorizontal,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { confirmDangerAction } from "@/lib/confirmDialog";
import { readEditorScopedOnboardingDraft } from "@/lib/onboardingDraft";
import { usePreview } from "../layout/src/components/context/PreviewContext";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  choices?: AiChoice[];
  createdAt?: number;
};

type SectionSnapshot = {
  editableFields?: string[];
  itemShapes?: Record<string, string[]>;
  id: string;
  type: string;
  variant: string;
  data?: Record<string, unknown>;
};

type AiAction = Record<string, unknown> & { type?: string };

type AiChoice = {
  id: string;
  label: string;
};

type PanelPos = { left: number; top: number };

type ChatSettings = {
  autoDeleteDays: number; // 0 = never
};

type BulkRewriteScope = "all-pages" | "home-page";
type BulkRewriteMode = "content-only" | "content-images";
type BulkRewriteSession = {
  scope?: BulkRewriteScope;
  mode?: BulkRewriteMode;
  brief?: string;
};

type StoredChatPayload = {
  messages: ChatMessage[];
  updatedAt: number;
  settings: ChatSettings;
};

const STARTER_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "I'm AI Assist. Tap a suggestion below, or ask me to create a page, edit content, or add blogs/services. On Ready sections you can change content and images — not the layout.",
  createdAt: Date.now(),
};

const BULK_SCOPE_CHOICES: AiChoice[] = [
  { id: "__bulk_scope__:all-pages", label: "All pages" },
  { id: "__bulk_scope__:home-page", label: "Only home page" },
];

const BULK_MODE_CHOICES: AiChoice[] = [
  { id: "__bulk_mode__:content-only", label: "Only content" },
  { id: "__bulk_mode__:content-images", label: "Content + images" },
];

const BULK_CONFIRM_CHOICES: AiChoice[] = [
  { id: "__bulk_confirm__:yes", label: "Yes, apply" },
  { id: "__bulk_confirm__:no", label: "No, cancel" },
];

type PromptChip = { id: string; label: string; prompt: string };

const chip = (id: string, label: string, prompt: string): PromptChip => ({
  id,
  label,
  prompt,
});

type ChipPageLink = {
  label?: string;
  kind?: string;
  hidden?: boolean;
  children?: ChipPageLink[];
};

function flattenChipPages(links: ChipPageLink[] = []): ChipPageLink[] {
  const out: ChipPageLink[] = [];
  for (const link of links) {
    out.push(link);
    if (Array.isArray(link.children) && link.children.length) {
      out.push(...flattenChipPages(link.children));
    }
  }
  return out;
}

function buildGlobalPromptChips(opts: {
  category?: string | null;
  isSinglePage?: boolean;
  pageLinks?: ChipPageLink[];
}): PromptChip[] {
  const catKey = normalizeCategoryChipKey(opts.category);
  const audience =
    catKey === "school"
      ? "school"
      : catKey === "realestate"
        ? "real estate"
        : catKey === "business"
          ? "business"
          : catKey === "hospital"
            ? "hospital"
            : "this website";

  const flat = flattenChipPages(opts.pageLinks || []);
  const navPages = flat.filter((page) => {
    if (page.hidden) return false;
    if (page.kind === "blog" || page.kind === "document") return false;
    const label = (page.label || "").trim();
    return Boolean(label);
  });
  const labelsLower = new Set(
    navPages.map((page) => (page.label || "").trim().toLowerCase()),
  );
  const hasPage = (name: string) => labelsLower.has(name.toLowerCase());

  const renamable = navPages.find((page) => {
    const label = (page.label || "").trim();
    if (!label) return false;
    if (/^home$/i.test(label)) return false;
    if (page.kind === "blogIndex") return false;
    if (/^blogs?$/i.test(label)) return false;
    return true;
  });

  const chips: PromptChip[] = [
    chip(
      "banner",
      "Banner update",
      "Update all banner content — title, tagline, and button",
    ),
    chip("seo", "Site SEO", "Set the site meta title and description"),
    chip("publish", "Publish", "Publish the site"),
    chip("theme", "Theme blue", "Set the primary color to blue"),
    chip("phone", "Phone", "Update the topbar phone number"),
    chip("brand", "Logo text", "Update the header logo text"),
    chip(
      "refresh",
      "Rewrite home",
      `Rewrite the full home page content for a ${audience}`,
    ),
    chip("list-sec", "Sections list", "How many sections are on the home page"),
    chip("section", "New section", "Add a new section"),
    chip("blogs", "3 blogs", "Add 3 blogs"),
  ];

  // Page create/rename only with real context — never invent missing pages.
  if (!opts.isSinglePage) {
    if (!hasPage("Contact") && !hasPage("Contact Us")) {
      chips.splice(
        1,
        0,
        chip("page", "New page", "Create a Contact page"),
      );
    } else if (!hasPage("Admissions")) {
      chips.splice(
        1,
        0,
        chip("page", "New page", "Create an Admissions page"),
      );
    } else {
      chips.splice(
        1,
        0,
        chip("page", "New page", "Create a new page named Careers"),
      );
    }
    if (renamable?.label) {
      const from = renamable.label.trim();
      const toCandidates = ["Support", "Info", "Overview", "Details"];
      const to =
        toCandidates.find((name) => !hasPage(name) && name.toLowerCase() !== from.toLowerCase()) ||
        `${from} Updated`;
      chips.push(
        chip("rename-page", "Rename page", `Rename the ${from} page to ${to}`),
      );
    }
  } else {
    chips.splice(
      1,
      0,
      chip("page", "Legal page", "Create a Privacy Policy page"),
    );
  }

  const extras = catKey ? CATEGORY_PROMPT_CHIPS[catKey] || [] : [];
  if (!extras.length) return chips;
  const seen = new Set(extras.map((row) => row.id));
  return [...extras, ...chips.filter((row) => !seen.has(row.id))];
}

const STRUCTURE_CHIPS: PromptChip[] = [
  chip("up", "Move up", "Move this section up"),
  chip("down", "Move down", "Move this section down"),
  chip("dup", "Duplicate", "Duplicate this section"),
  chip("del", "Delete section", "Delete this section"),
];

const HEADING_CHIP = chip(
  "heading",
  "Section title",
  "Change this section title",
);
const DESC_CHIP = chip(
  "desc",
  "Section text",
  "Rewrite this section description in about 200 words",
);
const IMAGE_CHIP = chip("image", "Image", "Change this section image");
const DESIGN_CHIP = chip(
  "design",
  "Best design",
  "Apply the best design for this section",
);
const BUTTON_CHIP = chip(
  "button",
  "Button text",
  "Set this section button text to Apply Now",
);
const TAGLINE_CHIP = chip(
  "tagline",
  "Tagline",
  "Change the small tagline above the title",
);

/** Per section-type chips — only actions that actually apply. */
const SECTION_TYPE_PROMPT_CHIPS: Record<string, PromptChip[]> = {
  Topbar: [
    chip("tb-phone", "Phone", "Set the topbar phone number to +91 98765 43210"),
    chip("tb-email", "Email", "Set the topbar email to hello@school.com"),
    chip("tb-loc", "Location", "Set the topbar location to India"),
  ],
  Header: [
    chip("hd-brand", "Logo text", "Set the header logo text to CSS Founder"),
    chip("hd-btn", "Header button", "Set the header button text to Apply Now"),
  ],
  Footer: [
    chip(
      "ft-menu",
      "Menu column title",
      "Change the first footer menu column title (like Best School or Sections)",
    ),
    chip(
      "ft-about",
      "About text",
      "Update the about text under the footer logo",
    ),
    chip(
      "ft-contact",
      "Contact details",
      "Set the footer contact email to hello@school.com",
    ),
  ],
  Breadcrumb: [
    chip("bc-title", "Breadcrumb title", "Change the breadcrumb page title"),
  ],
  Banner: [
    chip("heading", "Hero title", "Change the banner hero title"),
    TAGLINE_CHIP,
    chip(
      "desc",
      "Hero text",
      "Rewrite the banner description in about 200 words",
    ),
    chip("button", "CTA button", "Set the banner button text to Apply Now"),
    chip("image", "Background image", "Change the banner background image"),
    ...STRUCTURE_CHIPS,
  ],
  About: [
    chip("heading", "About title", "Change the About section title"),
    chip(
      "desc",
      "About text",
      "Rewrite the About description in about 200 words",
    ),
    chip("image", "About image", "Change the About section image"),
    ...STRUCTURE_CHIPS,
  ],
  Product: [
    chip("heading", "Services title", "Change this services/product section title"),
    chip(
      "desc",
      "Services text",
      "Rewrite this services/product description in about 200 words",
    ),
    chip("image", "Services image", "Change this services/product section image"),
    ...STRUCTURE_CHIPS,
  ],
  WhyChooseUs: [
    chip("heading", "Why title", "Change the Why Choose Us title"),
    chip(
      "desc",
      "Why text",
      "Rewrite the Why Choose Us description in about 200 words",
    ),
    chip("image", "Why image", "Change the Why Choose Us image"),
    ...STRUCTURE_CHIPS,
  ],
  Gallery: [
    chip("heading", "Gallery title", "Change the Gallery section title"),
    chip(
      "desc",
      "Gallery text",
      "Rewrite the Gallery description in about 200 words",
    ),
    chip("image", "Gallery image", "Change a Gallery section image"),
    ...STRUCTURE_CHIPS,
  ],
  CountriesServe: [
    chip("heading", "Countries title", "Change the Countries We Serve title"),
    chip(
      "desc",
      "Countries text",
      "Rewrite the Countries We Serve description in about 200 words",
    ),
    ...STRUCTURE_CHIPS,
  ],
  FormDetail: [
    chip("heading", "Form title", "Change the form section title"),
    chip(
      "desc",
      "Form text",
      "Rewrite the form section description in about 200 words",
    ),
    ...STRUCTURE_CHIPS,
  ],
  FAQ: [
    chip("heading", "FAQ title", "Change the FAQ section title"),
    chip("faq-add", "Add questions", "Add 5 questions to this FAQ section"),
    ...STRUCTURE_CHIPS,
  ],
  Testimonial: [
    chip("heading", "Testimonials title", "Change the Testimonials section title"),
    chip(
      "desc",
      "Testimonials text",
      "Rewrite the Testimonials description in about 200 words",
    ),
    chip("image", "Client image", "Change a testimonial/client image"),
    ...STRUCTURE_CHIPS,
  ],
  CustomSection: [
    chip("heading", "Heading", "Change this custom section heading"),
    chip(
      "desc",
      "Text",
      "Rewrite this custom section text in about 200 words",
    ),
    BUTTON_CHIP,
    IMAGE_CHIP,
    DESIGN_CHIP,
    ...STRUCTURE_CHIPS,
  ],
  AboutPage: [
    chip("heading", "Page title", "Change this About page title"),
    chip(
      "desc",
      "Page text",
      "Rewrite this About page description in about 200 words",
    ),
    chip("image", "Page image", "Change this About page image"),
    ...STRUCTURE_CHIPS,
  ],
  ContactPage: [
    chip("heading", "Page title", "Change this Contact page title"),
    chip(
      "desc",
      "Page text",
      "Rewrite this Contact page description in about 200 words",
    ),
    ...STRUCTURE_CHIPS,
  ],
  GalleryPage: [
    chip("heading", "Page title", "Change this Gallery page title"),
    chip(
      "desc",
      "Page text",
      "Rewrite this Gallery page description in about 200 words",
    ),
    chip("image", "Page image", "Change this Gallery page image"),
    ...STRUCTURE_CHIPS,
  ],
  ServicePage: [
    chip("heading", "Page title", "Change this Services page title"),
    chip(
      "desc",
      "Page text",
      "Rewrite this Services page description in about 200 words",
    ),
    ...STRUCTURE_CHIPS,
  ],
  BlogPage: [
    chip("heading", "Post title", "Change this blog post title"),
    chip(
      "desc",
      "Post text",
      "Rewrite this blog post description in about 200 words",
    ),
    chip("image", "Post image", "Change this blog post image"),
  ],
  EventPage: [
    chip("heading", "Event title", "Change this event title"),
    chip(
      "desc",
      "Event text",
      "Rewrite this event description in about 200 words",
    ),
    chip("image", "Event image", "Change this event image"),
  ],
  PropertyPage: [
    chip("heading", "Property title", "Change this property title"),
    chip(
      "desc",
      "Property text",
      "Rewrite this property description in about 200 words",
    ),
    chip("image", "Property image", "Change this property image"),
  ],
  PortfolioPage: [
    chip("heading", "Project title", "Change this portfolio project title"),
    chip(
      "desc",
      "Project text",
      "Rewrite this portfolio project description in about 200 words",
    ),
    chip("image", "Project image", "Change this portfolio project image"),
  ],
  TeamPage: [
    chip("heading", "Member name", "Change this team member name/title"),
    chip(
      "desc",
      "Member bio",
      "Rewrite this team member bio in about 200 words",
    ),
    chip("image", "Member photo", "Change this team member photo"),
  ],
};

/** Fallback only when section type is unknown — still no fake “Best design”. */
const SECTION_PROMPT_CHIPS_FALLBACK: PromptChip[] = [
  HEADING_CHIP,
  DESC_CHIP,
  IMAGE_CHIP,
  ...STRUCTURE_CHIPS,
];

const MASTER_PROMPT_CHIPS: Record<string, PromptChip[]> = {
  blog: [
    { id: "b3", label: "3 blogs", prompt: "Add 3 blogs" },
    {
      id: "btopics",
      label: "Topics",
      prompt: "blogs: STEM, Sports, Admissions",
    },
    {
      id: "brename",
      label: "Rename",
      prompt: "Rename an existing blog — type: Old Title to New Title",
    },
  ],
  service: [
    { id: "s3", label: "3 services", prompt: "Add 3 services" },
    {
      id: "stopics",
      label: "Topics",
      prompt: "services: Consulting, Support, Training",
    },
    {
      id: "sdel",
      label: "Delete",
      prompt: "Delete a service — type the exact service title to remove",
    },
  ],
  gallery: [
    { id: "g4", label: "4 items", prompt: "Add 4 gallery items" },
    {
      id: "gtopics",
      label: "Topics",
      prompt: "gallery: Campus, Events, Sports",
    },
  ],
  team: [
    { id: "t3", label: "3 members", prompt: "Add 3 team members" },
    {
      id: "ttopics",
      label: "Roles",
      prompt: "team: Principal, Counselor, Coach",
    },
  ],
  portfolio: [
    { id: "p3", label: "3 projects", prompt: "Add 3 portfolio items" },
  ],
  event: [
    { id: "e3", label: "3 events", prompt: "Add 3 events" },
    {
      id: "etopics",
      label: "Topics",
      prompt: "events: Open House, Sports Day, Workshop",
    },
  ],
  property: [
    { id: "pr2", label: "2 properties", prompt: "Add 2 properties" },
    {
      id: "prtopics",
      label: "Topics",
      prompt: "properties: Lakeview Villa, City Apartment",
    },
  ],
  country: [
    {
      id: "c5",
      label: "India listings",
      prompt: "Add 5 listings in India",
    },
    {
      id: "cuae",
      label: "UAE listings",
      prompt: "Add 3 listings in UAE",
    },
    {
      id: "cfix",
      label: "Fix name",
      prompt: "Rename Austrealia to Australia",
    },
  ],
};

const CATEGORY_PROMPT_CHIPS: Record<string, PromptChip[]> = {
  school: [
    {
      id: "sch-banner",
      label: "School banner",
      prompt:
        "Update all banner content — school admissions title, tagline, Apply Now button",
    },
    {
      id: "sch-blogs",
      label: "School blogs",
      prompt: "Add 3 blogs — STEM, Sports, Admissions",
    },
    {
      id: "sch-refresh",
      label: "School rewrite",
      prompt: "Rewrite the full home page content for a school",
    },
  ],
  realestate: [
    {
      id: "re-banner",
      label: "Property banner",
      prompt:
        "Update all banner content — property listings title and View Properties button",
    },
    {
      id: "re-props",
      label: "2 properties",
      prompt: "Add 2 properties — Lakeview Villa, City Apartment",
    },
    {
      id: "re-refresh",
      label: "Realty rewrite",
      prompt: "Rewrite the full home page content for real estate",
    },
  ],
  business: [
    {
      id: "biz-banner",
      label: "Business banner",
      prompt:
        "Update all banner content — business growth title and Get Started button",
    },
    {
      id: "biz-svc",
      label: "3 services",
      prompt: "Add 3 services — Consulting, Support, Training",
    },
    {
      id: "biz-refresh",
      label: "Biz rewrite",
      prompt: "Rewrite the full home page content for a business",
    },
  ],
  hospital: [
    {
      id: "hosp-banner",
      label: "Care banner",
      prompt:
        "Update all banner content — hospital care title and Book Appointment button",
    },
    {
      id: "hosp-refresh",
      label: "Care rewrite",
      prompt: "Rewrite the full home page content for a hospital",
    },
  ],
};

function normalizeCategoryChipKey(category?: string | null): string {
  const value = (category || "").trim().toLowerCase();
  if (!value) return "";
  if (value.includes("school") || value.includes("educat")) return "school";
  if (value.includes("real") || value.includes("propert")) return "realestate";
  if (value.includes("business") || value.includes("corporate"))
    return "business";
  if (value.includes("hospital") || value.includes("health") || value.includes("clinic"))
    return "hospital";
  return "";
}

function normalizeSectionChipKey(sectionType?: string | null): string {
  const raw = (sectionType || "").trim();
  if (!raw) return "";
  if (SECTION_TYPE_PROMPT_CHIPS[raw]) return raw;
  const lower = raw.toLowerCase();
  const aliases: Array<{ key: string; match: RegExp }> = [
    { key: "Topbar", match: /^topbar/ },
    { key: "Header", match: /^header/ },
    { key: "Footer", match: /^footer/ },
    { key: "Breadcrumb", match: /^breadcrumb/ },
    { key: "Banner", match: /^banner/ },
    { key: "About", match: /^about(?!page)/ },
    { key: "AboutPage", match: /^aboutpage/ },
    { key: "Product", match: /^(product|service)(?!page)/ },
    { key: "WhyChooseUs", match: /^whychoose/ },
    { key: "Gallery", match: /^gallery(?!page)/ },
    { key: "GalleryPage", match: /^gallerypage/ },
    { key: "CountriesServe", match: /^countries/ },
    { key: "FormDetail", match: /^form/ },
    { key: "FAQ", match: /^faq/ },
    { key: "Testimonial", match: /^testimonial|^client/ },
    { key: "CustomSection", match: /^custom/ },
    { key: "ContactPage", match: /^contact/ },
    { key: "ServicePage", match: /^servicepage/ },
    { key: "BlogPage", match: /^blogpage|^blogindex/ },
    { key: "EventPage", match: /^event/ },
    { key: "PropertyPage", match: /^propert/ },
    { key: "PortfolioPage", match: /^portfolio/ },
    { key: "TeamPage", match: /^team/ },
  ];
  for (const entry of aliases) {
    if (entry.match.test(lower)) return entry.key;
  }
  return "";
}

function getSuggestedPromptChips(
  focusSectionId?: string | null,
  category?: string | null,
  focusSectionType?: string | null,
  options?: {
    isSinglePage?: boolean;
    pageLinks?: ChipPageLink[];
  },
): PromptChip[] {
  const focus = typeof focusSectionId === "string" ? focusSectionId.trim() : "";
  if (!focus) {
    return buildGlobalPromptChips({
      category,
      isSinglePage: Boolean(options?.isSinglePage),
      pageLinks: options?.pageLinks || [],
    });
  }
  const masterKind = MASTER_FOCUS_KIND[focus];
  if (masterKind && MASTER_PROMPT_CHIPS[masterKind]) {
    return MASTER_PROMPT_CHIPS[masterKind];
  }
  if (isMasterManagerFocus(focus)) return [];

  const typeKey =
    normalizeSectionChipKey(focusSectionType) ||
    normalizeSectionChipKey(focus);
  if (typeKey && SECTION_TYPE_PROMPT_CHIPS[typeKey]) {
    return SECTION_TYPE_PROMPT_CHIPS[typeKey];
  }
  return SECTION_PROMPT_CHIPS_FALLBACK;
}

/** Map manager open-hint → concrete beginner prompt (prefill only). */
function mapAssistHintToPrompt(
  hint: string,
  focusSectionId?: string | null,
): string {
  const value = hint.trim().toLowerCase();
  if (!value) return "";
  const masterKind = focusSectionId
    ? MASTER_FOCUS_KIND[focusSectionId.trim()] || ""
    : "";
  if (value.includes("blog")) return "Add 3 blogs";
  if (value.includes("service")) return "Add 3 services";
  if (value.includes("gallery")) return "Add 4 gallery items";
  if (value.includes("team")) return "Add 3 team members";
  if (value.includes("portfolio")) return "Add 3 portfolio items";
  if (value.includes("event")) return "Add 3 events";
  if (value.includes("propert")) return "Add 2 properties";
  if (value.includes("country") || value.includes("listing")) {
    return masterKind === "country"
      ? "Add 5 listings in India"
      : "Add 3 country listings";
  }
  return "";
}

const DEFAULT_SETTINGS: ChatSettings = {
  autoDeleteDays: 7,
};

const AUTO_DELETE_OPTIONS = [
  { value: 0, label: "Never" },
  { value: 1, label: "1 day" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
] as const;

const PANEL_WIDTH_DESKTOP = 380;
const PANEL_WIDTH_COLLAPSED = 400;
const PANEL_WIDTH_MOBILE = 400;

function storageKey(siteId?: string, sectionId?: string | null) {
  const base = `css-ai-assist-chat:${siteId?.trim() || "draft"}`;
  const focus = typeof sectionId === "string" ? sectionId.trim() : "";
  return focus ? `${base}:section:${focus}` : base;
}

function sectionStarterMessage(
  label: string,
  sectionType?: string | null,
): ChatMessage {
  const normalized = label.trim().toLowerCase();
  const typeKey = normalizeSectionChipKey(sectionType || label);
  if (normalized === "blogs" || normalized === "blog") {
    return {
      id: `welcome-master-blog-${Date.now()}`,
      role: "assistant",
      text: "This chat is for Blogs only. How many posts do you need? Example: Add 3 blogs — each post topic-wise 500+ words with a different image.",
      createdAt: Date.now(),
    };
  }
  if (normalized === "events" || normalized === "event") {
    return {
      id: `welcome-master-event-${Date.now()}`,
      role: "assistant",
      text: "This chat is for Events only. How many events? Example: Add 3 events — or topics: events: Open House, Sports Day, Workshop.",
      createdAt: Date.now(),
    };
  }
  if (normalized === "property" || normalized === "properties") {
    return {
      id: `welcome-master-property-${Date.now()}`,
      role: "assistant",
      text: "This chat is for Property only. How many listings? Example: Add 2 properties — or: properties: Lakeview Villa, City Apartment.",
      createdAt: Date.now(),
    };
  }
  if (normalized === "countries" || normalized === "country") {
    return {
      id: `welcome-master-country-${Date.now()}`,
      role: "assistant",
      text: "This chat is for Countries only. Example: Add 5 listings in India — or fix a typo: Rename Austrealia to Australia.",
      createdAt: Date.now(),
    };
  }
  if (
    normalized === "services" ||
    normalized === "service" ||
    normalized === "gallery" ||
    normalized === "teams" ||
    normalized === "team" ||
    normalized === "portfolio"
  ) {
    return {
      id: `welcome-master-${normalized}-${Date.now()}`,
      role: "assistant",
      text: `This chat is for ${label} only. How many items? Example: Add 3 ${normalized}.`,
      createdAt: Date.now(),
    };
  }

  if (typeKey === "Footer") {
    return {
      id: `welcome-section-footer-${Date.now()}`,
      role: "assistant",
      text: 'Focused on Footer. You can change: logo/brand text, about text under the logo, menu column titles (like "Best School" or "Sections"), and contact details. There is no single "footer heading" — menu titles are column titles.',
      createdAt: Date.now(),
    };
  }
  if (typeKey === "Header") {
    return {
      id: `welcome-section-header-${Date.now()}`,
      role: "assistant",
      text: "Focused on Header. You can change logo/brand text and header button labels. Menu links are managed from Nav Menu.",
      createdAt: Date.now(),
    };
  }
  if (typeKey === "Topbar") {
    return {
      id: `welcome-section-topbar-${Date.now()}`,
      role: "assistant",
      text: "Focused on Topbar. You can change phone, email, and location shown at the top.",
      createdAt: Date.now(),
    };
  }
  if (typeKey === "Banner") {
    return {
      id: `welcome-section-banner-${Date.now()}`,
      role: "assistant",
      text: "Focused on Banner. You can change the hero title, tagline, description, CTA button, and background image — or move/duplicate/delete this section.",
      createdAt: Date.now(),
    };
  }
  if (typeKey === "Product") {
    return {
      id: `welcome-section-product-${Date.now()}`,
      role: "assistant",
      text: "Focused on this Services/Product section. You can change its title, description, and image — or move/duplicate/delete this section.",
      createdAt: Date.now(),
    };
  }
  if (typeKey === "FAQ") {
    return {
      id: `welcome-section-faq-${Date.now()}`,
      role: "assistant",
      text: "Focused on FAQ. You can change the FAQ title, add questions, or move/duplicate/delete this section.",
      createdAt: Date.now(),
    };
  }

  const display = label.trim() || typeKey || "this section";
  return {
    id: `welcome-section-${Date.now()}`,
    role: "assistant",
    text: `Focused on "${display}" only. Tell me what to change for this section (title, text, image, or layout actions). Other sections won't change.`,
    createdAt: Date.now(),
  };
}

const MASTER_FOCUS_KIND: Record<string, string> = {
  __master_blog__: "blog",
  __master_service__: "service",
  __master_gallery__: "gallery",
  __master_team__: "team",
  __master_portfolio__: "portfolio",
  __master_event__: "event",
  __master_property__: "property",
  __master_countries__: "country",
};

function isMasterManagerFocus(focusSectionId?: string | null): boolean {
  const focus = typeof focusSectionId === "string" ? focusSectionId.trim() : "";
  return (
    focus.startsWith("__master_") &&
    focus.endsWith("__") &&
    focus.length > "__master__".length
  );
}

function constrainActionsToSection(
  actions: AiAction[],
  focusSectionId?: string | null,
): AiAction[] {
  const focus = typeof focusSectionId === "string" ? focusSectionId.trim() : "";
  if (!focus) return actions;
  const allowed: AiAction[] = [];
  const masterKind = MASTER_FOCUS_KIND[focus];
  for (const action of actions) {
    const type = typeof action.type === "string" ? action.type : "";
    // Manager AI: only matching master-item creates (+ country rename)
    if (masterKind) {
      if (type === "addMasterItems") {
        allowed.push({
          ...action,
          type: "addMasterItems",
          master: masterKind,
        } as AiAction);
      } else if (type === "renameCountry" && masterKind === "country") {
        allowed.push(action);
      } else if (type === "renameMasterItem") {
        allowed.push({
          ...action,
          type: "renameMasterItem",
          master: masterKind,
        } as AiAction);
      } else if (type === "deleteMasterItem") {
        allowed.push({
          ...action,
          type: "deleteMasterItem",
          master: masterKind,
        } as AiAction);
      } else if (
        type === "setSiteSeo" ||
        type === "publishSite" ||
        type === "setThemeColors" ||
        type === "renamePage" ||
        type === "refreshHomeContent"
      ) {
        // Site-wide actions stay available even from manager chat.
        allowed.push(action);
      } else if (type === "patch") {
        const hint =
          typeof (action as { sectionHint?: unknown }).sectionHint === "string"
            ? String((action as { sectionHint?: string }).sectionHint)
            : "";
        if (/^(Topbar|Header)\b/i.test(hint)) {
          allowed.push(action);
        }
      }
      continue;
    }
    if (isMasterManagerFocus(focus)) {
      // Events / Property etc. — no apply path yet
      continue;
    }
    if (type === "patch") {
      const hint =
        typeof (action as { sectionHint?: unknown }).sectionHint === "string"
          ? String((action as { sectionHint?: string }).sectionHint)
          : "";
      // Topbar contact + Header brand are site chrome — keep their target.
      if (/^(Topbar|Header)\b/i.test(hint)) {
        allowed.push(action);
      } else {
        allowed.push({ ...action, sectionHint: focus });
      }
      continue;
    }
    if (type === "deleteSection" || type === "moveSection" || type === "duplicateSection") {
      allowed.push({ ...action, sectionHint: focus });
      continue;
    }
    // Nav / page actions are site-wide — keep them even in section-scoped chat.
    if (
      type === "placePageInNav" ||
      type === "addPage" ||
      type === "addBreadcrumb" ||
      type === "deletePage" ||
      type === "setSiteSeo" ||
      type === "publishSite" ||
      type === "setThemeColors" ||
      type === "renamePage" ||
      type === "refreshHomeContent"
    ) {
      allowed.push(action);
    }
    // Section-scoped chat: no add section / master items elsewhere
  }
  return allowed;
}

function panelWidth(mobile?: boolean, sidebarCollapsed?: boolean) {
  if (mobile) return Math.min(window.innerWidth - 24, PANEL_WIDTH_MOBILE);
  return sidebarCollapsed ? PANEL_WIDTH_COLLAPSED : PANEL_WIDTH_DESKTOP;
}

function panelHeight() {
  return Math.min(560, Math.round(window.innerHeight * 0.72));
}

function defaultPanelPos(
  mobile?: boolean,
  sidebarCollapsed?: boolean,
  preferRight = false,
): PanelPos {
  const width = panelWidth(mobile, sidebarCollapsed);
  const height = panelHeight();
  if (mobile) {
    return {
      left: Math.max(12, Math.round((window.innerWidth - width) / 2)),
      top: Math.max(12, window.innerHeight - height - 80),
    };
  }
  if (preferRight) {
    return {
      left: Math.max(8, window.innerWidth - width - 24),
      top: Math.max(80, Math.round((window.innerHeight - height) / 2)),
    };
  }
  return {
    left: sidebarCollapsed ? 56 : 8,
    top: Math.max(12, window.innerHeight - height - 124),
  };
}

function clampPos(pos: PanelPos, width: number, height: number): PanelPos {
  const maxLeft = Math.max(8, window.innerWidth - width - 8);
  const maxTop = Math.max(8, window.innerHeight - height - 8);
  return {
    left: Math.min(Math.max(8, pos.left), maxLeft),
    top: Math.min(Math.max(8, pos.top), maxTop),
  };
}

function loadStoredChat(
  siteId?: string,
  sectionId?: string | null,
  sectionLabel?: string,
  sectionType?: string | null,
): StoredChatPayload {
  const starter = sectionId
    ? sectionStarterMessage(sectionLabel || "this section", sectionType)
    : { ...STARTER_MESSAGE, createdAt: Date.now() };

  if (typeof window === "undefined") {
    return {
      messages: [starter],
      updatedAt: Date.now(),
      settings: DEFAULT_SETTINGS,
    };
  }

  try {
    const raw = window.localStorage.getItem(storageKey(siteId, sectionId));
    if (!raw) {
      return {
        messages: [starter],
        updatedAt: Date.now(),
        settings: DEFAULT_SETTINGS,
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoredChatPayload>;
    const settings: ChatSettings = {
      autoDeleteDays:
        typeof parsed.settings?.autoDeleteDays === "number"
          ? parsed.settings.autoDeleteDays
          : DEFAULT_SETTINGS.autoDeleteDays,
    };
    const updatedAt =
      typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now();

    if (
      settings.autoDeleteDays > 0 &&
      Date.now() - updatedAt > settings.autoDeleteDays * 24 * 60 * 60 * 1000
    ) {
      const fresh: StoredChatPayload = {
        messages: [starter],
        updatedAt: Date.now(),
        settings,
      };
      window.localStorage.setItem(
        storageKey(siteId, sectionId),
        JSON.stringify(fresh),
      );
      return fresh;
    }

    const messages = Array.isArray(parsed.messages)
      ? parsed.messages
          .filter(
            (row) =>
              row &&
              typeof row.id === "string" &&
              (row.role === "user" || row.role === "assistant") &&
              typeof row.text === "string",
          )
          .map((row) => ({
            id: row.id,
            role: row.role,
            text: row.text,
            choices: Array.isArray(row.choices) ? row.choices : undefined,
            createdAt:
              typeof row.createdAt === "number" ? row.createdAt : updatedAt,
          }))
      : [];

    return {
      messages: messages.length ? messages : [starter],
      updatedAt,
      settings,
    };
  } catch {
    return {
      messages: [starter],
      updatedAt: Date.now(),
      settings: DEFAULT_SETTINGS,
    };
  }
}

function saveStoredChat(
  siteId: string | undefined,
  messages: ChatMessage[],
  settings: ChatSettings,
  sectionId?: string | null,
) {
  if (typeof window === "undefined") return;
  const payload: StoredChatPayload = {
    messages: messages.map((row) => ({
      ...row,
      // Don't persist stale choice chips forever
      choices: undefined,
      createdAt: row.createdAt || Date.now(),
    })),
    updatedAt: Date.now(),
    settings,
  };
  try {
    window.localStorage.setItem(
      storageKey(siteId, sectionId),
      JSON.stringify(payload),
    );
  } catch {
    // quota / private mode
  }
}

function waitForAssistContext(timeoutMs = 2000): Promise<{
  sections: SectionSnapshot[];
  themeVariables: Record<string, string>;
}> {
  return waitForAssistContextFor({}, timeoutMs);
}

function waitForAssistContextFor(
  options: { pageLabel?: string; allPages?: boolean },
  timeoutMs = 2000,
): Promise<{
  sections: SectionSnapshot[];
  themeVariables: Record<string, string>;
}> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resolve({ sections: [], themeVariables: {} });
    }, timeoutMs);

    const onState = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          sections?: SectionSnapshot[];
          themeVariables?: Record<string, string>;
        }>
      ).detail;
      cleanup();
      resolve({
        sections: Array.isArray(detail?.sections) ? detail.sections : [],
        themeVariables:
          detail?.themeVariables && typeof detail.themeVariables === "object"
            ? detail.themeVariables
            : {},
      });
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("ai-builder-ai-sections-state", onState);
    };

    window.addEventListener("ai-builder-ai-sections-state", onState);
    window.dispatchEvent(
      new CustomEvent("ai-builder-ai-query-sections", {
        detail: {
          ...(options.pageLabel ? { pageLabel: options.pageLabel } : {}),
          ...(options.allPages ? { allPages: true } : {}),
        },
      }),
    );
  });
}

function waitForSections(timeoutMs = 2000): Promise<SectionSnapshot[]> {
  return waitForAssistContext(timeoutMs).then((ctx) => ctx.sections);
}

function waitForApplyResult(timeoutMs = 20000): Promise<{
  ok: boolean;
  message: string;
}> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resolve({ ok: false, message: "Editor apply timeout." });
    }, timeoutMs);

    const onResult = (event: Event) => {
      const detail = (event as CustomEvent<{ ok?: boolean; message?: string }>)
        .detail;
      cleanup();
      resolve({
        ok: Boolean(detail?.ok),
        message: detail?.message || (detail?.ok ? "Done." : "Failed."),
      });
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("ai-builder-ai-action-result", onResult);
    };

    window.addEventListener("ai-builder-ai-action-result", onResult);
  });
}

async function runOpenAiAssist(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  pendingChoices: AiChoice[],
  category?: string,
  focusSection?: {
    sectionId: string;
    sectionType: string;
    label: string;
  } | null,
  isSinglePageTemplate = false,
  currentPage?: string,
  pageLabels: string[] = [],
  contextOptions?: { pageLabel?: string; allPages?: boolean },
): Promise<{ text: string; choices: AiChoice[] }> {
  const { sections, themeVariables } = await waitForAssistContextFor(
    contextOptions || {},
  );
  let locale = "en";
  let timeZone = "";
  try {
    locale = navigator.language || "en";
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    // ignore
  }
  const categoryLabel = (category || "").trim() || "Website";
  const focusId = focusSection?.sectionId?.trim() || "";
  const scopedMessage = focusId
    ? `[SECTION_FOCUS|${focusId}|${focusSection?.sectionType || ""}|${focusSection?.label || ""}]\n${message}`
    : message;

  const response = await fetch("/api/ai/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: scopedMessage,
      sections,
      themeVariables,
      history,
      pendingChoices,
      focusSectionId: focusId || undefined,
      focusSectionType: focusSection?.sectionType || undefined,
      siteContext: `CSS Founder website editor · category: ${categoryLabel}`,
      category: categoryLabel,
      isSinglePageTemplate,
      currentPage: currentPage || undefined,
      pageLabels: pageLabels.slice(0, 40),
      locale,
      timeZone,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
    reply?: string;
    actions?: AiAction[];
    choices?: AiChoice[];
  };

  if (!response.ok) {
    if (data.code === "MISSING_API_KEY") {
      return {
        text: "API key is missing. Add OPENAI_API_KEY in apps/frontend/.env.local and restart the frontend.",
        choices: [],
      };
    }
    if (typeof data.reply === "string" && data.reply.trim()) {
      return {
        text: data.reply,
        choices: Array.isArray(data.choices) ? data.choices : [],
      };
    }
    return {
      text: data.message || "AI request failed. Please try again.",
      choices: Array.isArray(data.choices) ? data.choices : [],
    };
  }

  const actions = constrainActionsToSection(
    Array.isArray(data.actions) ? data.actions : [],
    focusId,
  );
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const reply = (data.reply || "").trim();

  if (!actions.length) {
    return {
      text:
        reply ||
        (focusId
          ? "Is section ke liye kya change chahiye? (text, image, design)"
          : "Tell me what you'd like to change next."),
      choices,
    };
  }

  const resultPromise = waitForApplyResult();
  window.dispatchEvent(
    new CustomEvent("ai-builder-ai-apply-actions", {
      detail: { actions },
    }),
  );
  const applied = await resultPromise;

  if (reply && applied.message) {
    return { text: `${reply}\n\n${applied.message}`, choices };
  }
  return {
    text: reply || applied.message || "Changes applied.",
    choices,
  };
}

function isBulkRewriteRequest(text: string) {
  const q = text.trim().toLowerCase();
  if (!q) return false;
  const hasPages =
    /\b(all|sare|saare|sabhi|sab|pure|poore)\s+pages?\b/.test(q) ||
    /\bsare\s+page\b/.test(q) ||
    /\bsabhi\s+page\b/.test(q) ||
    /\ball\s+page\b/.test(q);
  const hasRewrite =
    /\b(content|copy|text|image|images|rewrite|change|update|badlo|badal|kro|karo)\b/.test(
      q,
    );
  return hasPages && hasRewrite;
}

function parseBulkScopeChoice(text: string): BulkRewriteScope | null {
  const raw = text.trim().toLowerCase();
  if (raw === "__bulk_scope__:all-pages") return "all-pages";
  if (raw === "__bulk_scope__:home-page") return "home-page";
  if (
    /\b(all|sare|saare|sabhi|sab|pure|poore)\s+pages?\b/.test(raw) ||
    /\bsare\s+page\b/.test(raw)
  ) {
    return "all-pages";
  }
  if (/\b(home|homepage|home page|only home)\b/.test(raw)) {
    return "home-page";
  }
  return null;
}

function parseBulkModeChoice(text: string): BulkRewriteMode | null {
  const raw = text.trim().toLowerCase();
  if (raw === "__bulk_mode__:content-only") return "content-only";
  if (raw === "__bulk_mode__:content-images") return "content-images";
  if (/\b(content\s*\+\s*images|content and images)\b/.test(raw)) {
    return "content-images";
  }
  if (
    /\b(images|photos|image bhi|images bhi)\b/.test(raw) &&
    /\b(content|text|copy)\b/.test(raw)
  ) {
    return "content-images";
  }
  if (/\bonly content\b/.test(raw) || /\bkeval content\b/.test(raw)) {
    return "content-only";
  }
  if (/\bcontent\b/.test(raw) && !/\bimages?\b/.test(raw)) {
    return "content-only";
  }
  return null;
}

function parseBulkConfirm(text: string): boolean | null {
  const raw = text.trim().toLowerCase();
  if (raw === "__bulk_confirm__:yes") return true;
  if (raw === "__bulk_confirm__:no") return false;
  if (/^(yes|haan|ha|ok|okay|confirm|apply|karo|krdo)$/i.test(raw)) return true;
  if (/^(no|cancel|mat|nahi|nahin)$/i.test(raw)) return false;
  return null;
}

function getBulkTargetPages(pageLinks: ChipPageLink[], scope: BulkRewriteScope) {
  if (scope === "home-page") return ["Home"];
  const labels = flattenChipPages(pageLinks)
    .filter((page) => {
      if (page.hidden) return false;
      if (page.kind === "blog") return false;
      const label = (page.label || "").trim();
      return Boolean(label);
    })
    .map((page) => (page.label || "").trim());
  return Array.from(new Set(["Home", ...labels]));
}

function buildBulkRewritePrompt(
  pageLabel: string,
  mode: BulkRewriteMode,
  brief: string,
  category?: string,
) {
  const safeBrief = brief && brief.trim().length > 0
    ? brief.trim()
    : "Infer tone/style from the current site's existing copy and keep brand identity consistent.";
  const pageText = /^home$/i.test(pageLabel) ? "home page" : `${pageLabel} page`;
  const categoryKey = (category || "").trim().toLowerCase();
  const imageNote = mode === "content-images"
    ? " Also replace images (backgroundImage, sideImage) with new relevant stock image URLs."
    : " Keep existing images unchanged.";
  const categoryInstruction =
    categoryKey === "realestate" || categoryKey === "real estate"
      ? ` This is a REAL ESTATE website. All rewritten copy must stay strictly in real-estate context only: properties, homes, flats, villas, plots, pricing, amenities, neighborhoods, site visits, possession, verified listings, investment, buyers, sellers, and contact/booking inquiries. Never write generic company, agency, software, design, marketing, or digital services content. On About pages, write about the real-estate brand, market expertise, property advisory, local area knowledge, and customer support for buyers/investors.`
      : "";
  return `CRITICAL INSTRUCTION: Emit ONLY "patch" type actions. No addSection, duplicateSection, addCustomSection, deleteSection, or moveSection allowed.

For EVERY content section on this ${pageText}, emit ONE patch action with:
- "type": "patch"
- "sectionHint": the section id (from sections array)
- "fields": object with rewritten values for ALL text fields present in that section's editableFields/data

Rewrite these fields wherever they exist: title, pretitle, desc, buttonLabel, subtitle, paragraph, heading, tagline, items[].title, items[].desc, faqItems[].question, faqItems[].answer, serviceSlides[].title, serviceSlides[].desc, productItems[].title, productItems[].desc, features[].title, features[].desc, stats[].label, stats[].value, testimonials[].quote, testimonials[].name.
${imageNote}
Generate fresh, unique, professional content relevant to the business. Each section's content must be different from current text.${categoryInstruction} Skip Header, Topbar, Footer, Breadcrumb sections.

Business brief: ${safeBrief}`;
}

function getExistingBusinessBrief() {
  const draft = readEditorScopedOnboardingDraft();
  const info = draft?.businessInfo;
  if (!info) return "";
  const parts = [
    info.name ? `Business name: ${info.name}` : "",
    info.websiteRelated ? `Business type: ${info.websiteRelated}` : "",
    info.description ? `Description: ${info.description}` : "",
    info.audience ? `Audience: ${info.audience}` : "",
    info.address ? `Address/location: ${info.address}` : "",
    info.email ? `Email: ${info.email}` : "",
    info.mobile ? `Phone: ${info.mobile}` : "",
  ].filter(Boolean);
  return parts.join(" | ");
}

function bulkChoiceLabel(text: string) {
  const raw = text.trim().toLowerCase();
  if (raw === "__bulk_scope__:all-pages") return "All pages";
  if (raw === "__bulk_scope__:home-page") return "Only home page";
  if (raw === "__bulk_mode__:content-only") return "Only content";
  if (raw === "__bulk_mode__:content-images") return "Content + images";
  if (raw === "__bulk_confirm__:yes") return "Yes, apply";
  if (raw === "__bulk_confirm__:no") return "No, cancel";
  return text;
}

export default function EditorChatBot({
  open,
  onClose,
  sidebarCollapsed,
  mobile,
  siteId,
  category,
  isSinglePageTemplate = false,
  focusSection = null,
  initialHint = null,
}: {
  open: boolean;
  onClose: () => void;
  sidebarCollapsed: boolean;
  mobile?: boolean;
  siteId?: string;
  category?: string;
  isSinglePageTemplate?: boolean;
  focusSection?: {
    sectionId: string;
    sectionType: string;
    label: string;
  } | null;
  /** Manager hint — prefills input only, never auto-sends. */
  initialHint?: string | null;
}) {
  const { currentPage, pageLinks } = usePreview();
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE]);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingLabel, setSendingLabel] = useState("Applying on page…");
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [dragging, setDragging] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const messagesRef = useRef(messages);
  const settingsRef = useRef(settings);
  const bulkRewriteRef = useRef<BulkRewriteSession>({});
  const focusSectionId = focusSection?.sectionId || null;
  const focusSectionLabel = focusSection?.label || "";
  const focusSectionType = focusSection?.sectionType || "";
  const hintAppliedRef = useRef<string>("");
  const dragRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  useEffect(() => {
    setHydrated(false);
    const stored = loadStoredChat(
      siteId,
      focusSectionId,
      focusSectionLabel,
      focusSectionType,
    );
    setMessages(stored.messages);
    setSettings(stored.settings);
    setHydrated(true);
  }, [siteId, focusSectionId, focusSectionLabel, focusSectionType]);

  // Prefill from manager hint only — never auto-send (user confirms with Send).
  useEffect(() => {
    if (!open) {
      hintAppliedRef.current = "";
      return;
    }
    const hint = (initialHint || "").trim();
    if (!hint) return;
    const key = `${focusSectionId || "global"}:${hint}`;
    if (hintAppliedRef.current === key) return;
    const mapped = mapAssistHintToPrompt(hint, focusSectionId);
    if (!mapped) return;
    hintAppliedRef.current = key;
    setDraft(mapped);
    queueMicrotask(() => inputRef.current?.focus());
  }, [open, initialHint, focusSectionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!hydrated) return;
    saveStoredChat(siteId, messages, settings, focusSectionId);
  }, [messages, settings, siteId, hydrated, focusSectionId]);

  useEffect(() => {
    if (!open) return;
    const preferRight = isMasterManagerFocus(focusSectionId);
    setPos((current) => {
      // Re-anchor when opening manager AI so it isn't stuck under the modal.
      if (preferRight || !current) {
        return defaultPanelPos(mobile, sidebarCollapsed, preferRight);
      }
      const width = panelWidth(mobile, sidebarCollapsed);
      const height = panelHeight();
      return clampPos(current, width, height);
    });
  }, [open, mobile, sidebarCollapsed, focusSectionId]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      setPos((current) => {
        if (!current)
          return defaultPanelPos(
            mobile,
            sidebarCollapsed,
            isMasterManagerFocus(focusSectionId),
          );
        return clampPos(
          current,
          panelWidth(mobile, sidebarCollapsed),
          panelHeight(),
        );
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, mobile, sidebarCollapsed, focusSectionId]);

  useEffect(() => {
    if (!open || showSettings) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open, showSettings]);

  useEffect(() => {
    if (!open || showSettings) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, showSettings]);

  if (!open || !pos) return null;

  const width = mobile
    ? Math.min(
        typeof window !== "undefined" ? window.innerWidth - 24 : PANEL_WIDTH_MOBILE,
        PANEL_WIDTH_MOBILE,
      )
    : sidebarCollapsed
      ? PANEL_WIDTH_COLLAPSED
      : PANEL_WIDTH_DESKTOP;

  const clearChat = () => {
    const next = [
      focusSectionId
        ? sectionStarterMessage(
            focusSectionLabel || "this section",
            focusSectionType,
          )
        : {
            ...STARTER_MESSAGE,
            createdAt: Date.now(),
            id: `welcome-${Date.now()}`,
          },
    ];
    setMessages(next);
    saveStoredChat(siteId, next, settingsRef.current, focusSectionId);
  };

  const deleteMessage = (id: string) => {
    setMessages((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length
        ? next
        : [{ ...STARTER_MESSAGE, createdAt: Date.now(), id: `welcome-${Date.now()}` }];
    });
  };

  const updateAutoDeleteDays = (days: number) => {
    setSettings((current) => ({ ...current, autoDeleteDays: days }));
  };

  const send = async (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text || sending) return;

    const history = messagesRef.current
      .filter((row) => !row.id.startsWith("welcome"))
      .map((row) => ({
        role: row.role,
        content: row.text,
      }));
    const pendingChoices =
      [...messagesRef.current]
        .reverse()
        .find((row) => row.choices?.length)?.choices || [];

    const appendAssistant = (
      userText: string,
      assistantText: string,
      choices?: AiChoice[],
    ) => {
      setMessages((current) => [
        ...current.map((row) =>
          row.choices?.length ? { ...row, choices: undefined } : row,
        ),
        { id: `u-${Date.now()}`, role: "user", text: userText, createdAt: Date.now() },
        {
          id: `a-${Date.now() + 1}`,
          role: "assistant",
          text: assistantText,
          choices,
          createdAt: Date.now() + 1,
        },
      ]);
      setDraft("");
    };

    if (!focusSection) {
      const bulkPending = pendingChoices.some((choice) =>
        choice.id.startsWith("__bulk_"),
      );
      if (isBulkRewriteRequest(text) || bulkPending) {
        const session = bulkRewriteRef.current;
        const scope = parseBulkScopeChoice(text);
        const mode = parseBulkModeChoice(text);
        const confirm = parseBulkConfirm(text);

        if (!bulkPending && isBulkRewriteRequest(text)) {
          bulkRewriteRef.current = {};
          setMessages((current) => [
            ...current.map((row) =>
              row.choices?.length ? { ...row, choices: undefined } : row,
            ),
            { id: `u-${Date.now()}`, role: "user", text: bulkChoiceLabel(text), createdAt: Date.now() },
            {
              id: `a-${Date.now() + 1}`,
              role: "assistant",
              text: "Sure. Kya change karna hai?\n\n1. All pages\n2. Only home page",
              choices: BULK_SCOPE_CHOICES,
              createdAt: Date.now() + 1,
            },
          ]);
          setDraft("");
          return;
        }

        if (!session.scope) {
          if (!scope) {
            appendAssistant(
              bulkChoiceLabel(text),
              "Pehle batao: All pages ya only home page?",
              BULK_SCOPE_CHOICES,
            );
            return;
          }
          session.scope = scope;
          setMessages((current) => [
            ...current.map((row) =>
              row.choices?.length ? { ...row, choices: undefined } : row,
            ),
            { id: `u-${Date.now()}`, role: "user", text: bulkChoiceLabel(text), createdAt: Date.now() },
            {
              id: `a-${Date.now() + 1}`,
              role: "assistant",
              text: "Theek hai. Kya update karna hai?\n\n1. Only content\n2. Content + images",
              choices: BULK_MODE_CHOICES,
              createdAt: Date.now() + 1,
            },
          ]);
          setDraft("");
          return;
        }

        if (!session.mode) {
          if (!mode) {
            appendAssistant(
              bulkChoiceLabel(text),
              "Batao: only content ya content + images?",
              BULK_MODE_CHOICES,
            );
            return;
          }
          session.mode = mode;
          const existingBrief = getExistingBusinessBrief();
          session.brief = existingBrief || "";
          const targetPages = getBulkTargetPages(
            flattenChipPages(pageLinks as ChipPageLink[]),
            session.scope,
          );
          setMessages((current) => [
            ...current.map((row) =>
              row.choices?.length ? { ...row, choices: undefined } : row,
            ),
            { id: `u-${Date.now()}`, role: "user", text: bulkChoiceLabel(text), createdAt: Date.now() },
            {
              id: `a-${Date.now() + 1}`,
              role: "assistant",
              text: `Confirm karun?\n\nPages: ${
                session.scope === "all-pages" ? "All pages" : "Only home page"
              }\nTarget pages: ${targetPages.join(", ")}\nMode: ${
                session.mode === "content-images" ? "Content + images" : "Only content"
              }`,
              choices: BULK_CONFIRM_CHOICES,
              createdAt: Date.now() + 1,
            },
          ]);
          setDraft("");
          return;
        }

        if (
          confirm === null &&
          text.trim() &&
          !text.startsWith("__bulk_confirm__")
        ) {
          // User can optionally provide extra instruction for rewriting.
          session.brief = [session.brief, text].filter(Boolean).join(" | ");
          const scopeLabel =
            session.scope === "all-pages" ? "All pages" : "Only home page";
          const modeLabel =
            session.mode === "content-images"
              ? "Content + images"
              : "Only content";
          const targetPages = getBulkTargetPages(
            flattenChipPages(pageLinks as ChipPageLink[]),
            session.scope,
          );
          setMessages((current) => [
            ...current.map((row) =>
              row.choices?.length ? { ...row, choices: undefined } : row,
            ),
            { id: `u-${Date.now()}`, role: "user", text: bulkChoiceLabel(text), createdAt: Date.now() },
            {
              id: `a-${Date.now() + 1}`,
              role: "assistant",
              text: `Confirm karun?\n\nPages: ${scopeLabel}\nTarget pages: ${targetPages.join(", ")}\nMode: ${modeLabel}`,
              choices: BULK_CONFIRM_CHOICES,
              createdAt: Date.now() + 1,
            },
          ]);
          setDraft("");
          return;
        }

        if (confirm === null && text.trim() && !text.startsWith("__bulk_confirm__:")) {
          session.brief = [session.brief, text].filter(Boolean).join(" | ");
          const scopeLabel =
            session.scope === "all-pages" ? "All pages" : "Only home page";
          const modeLabel =
            session.mode === "content-images"
              ? "Content + images"
              : "Only content";
          const targetPages = getBulkTargetPages(
            flattenChipPages(pageLinks as ChipPageLink[]),
            session.scope,
          );
          setMessages((current) => [
            ...current.map((row) =>
              row.choices?.length ? { ...row, choices: undefined } : row,
            ),
            { id: `u-${Date.now()}`, role: "user", text: bulkChoiceLabel(text), createdAt: Date.now() },
            {
              id: `a-${Date.now() + 1}`,
              role: "assistant",
              text: `Confirm karun?\n\nPages: ${scopeLabel}\nTarget pages: ${targetPages.join(", ")}\nMode: ${modeLabel}`,
              choices: BULK_CONFIRM_CHOICES,
              createdAt: Date.now() + 1,
            },
          ]);
          setDraft("");
          return;
        }

        if (confirm === false) {
          bulkRewriteRef.current = {};
          setMessages((current) => [
            ...current.map((row) =>
              row.choices?.length ? { ...row, choices: undefined } : row,
            ),
            { id: `u-${Date.now()}`, role: "user", text: bulkChoiceLabel(text), createdAt: Date.now() },
            {
              id: `a-${Date.now() + 1}`,
              role: "assistant",
              text: "Bulk rewrite cancel kar diya.",
              createdAt: Date.now() + 1,
            },
          ]);
          setDraft("");
          return;
        }

        if (confirm !== true) {
          appendAssistant(
            bulkChoiceLabel(text),
            "Confirm karo to main apply kar doon.",
            BULK_CONFIRM_CHOICES,
          );
          return;
        }

        const targetPages = getBulkTargetPages(
          flattenChipPages(pageLinks as ChipPageLink[]),
          session.scope,
        );
        setMessages((current) => [
          ...current.map((row) =>
            row.choices?.length ? { ...row, choices: undefined } : row,
          ),
          { id: `u-${Date.now()}`, role: "user", text: bulkChoiceLabel(text), createdAt: Date.now() },
        ]);
        setDraft("");
        setSending(true);
        try {
          const results: string[] = [];
          for (let index = 0; index < targetPages.length; index += 1) {
            const pageLabel = targetPages[index];
            setSendingLabel(
              `Applying ${index + 1}/${targetPages.length}: ${pageLabel}…`,
            );
            const prompt = buildBulkRewritePrompt(
              pageLabel,
              session.mode,
              session.brief ?? "",
              category,
            );
            const result = await runOpenAiAssist(
              prompt,
              [],
              [],
              category,
              null,
              isSinglePageTemplate,
              /^home$/i.test(pageLabel) ? "home" : pageLabel,
              flattenChipPages(pageLinks as ChipPageLink[])
                .map((page) => (page.label || "").trim())
                .filter(Boolean),
              {
                pageLabel: /^home$/i.test(pageLabel) ? "home" : pageLabel,
              },
            );
            results.push(`${pageLabel}: ${result.text}`);
          }
          setMessages((current) => [
            ...current,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: `Bulk rewrite complete for ${targetPages.length} page(s).\n\n${results.join("\n\n")}`,
              createdAt: Date.now(),
            },
          ]);
        } catch (error) {
          setMessages((current) => [
            ...current,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text:
                error instanceof Error
                  ? error.message
                  : "Bulk rewrite failed. Please try again.",
              createdAt: Date.now(),
            },
          ]);
        } finally {
          bulkRewriteRef.current = {};
          setSending(false);
          setSendingLabel("Applying on page…");
        }
        return;
      }
    }

    setMessages((current) => [
      ...current.map((row) =>
        row.choices?.length ? { ...row, choices: undefined } : row,
      ),
      { id: `u-${Date.now()}`, role: "user", text, createdAt: Date.now() },
    ]);
    setDraft("");
    setSending(true);
    setSendingLabel("Applying on page…");

    try {
      const result = await runOpenAiAssist(
        text,
        history,
        pendingChoices,
        category,
        focusSection,
        isSinglePageTemplate,
        currentPage || undefined,
        flattenChipPages(pageLinks as ChipPageLink[])
          .map((page) => (page.label || "").trim())
          .filter(Boolean),
      );
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: result.text,
          choices: result.choices,
          createdAt: Date.now(),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "AI Assist failed. Please try again.",
          choices: [
            { id: "ready", label: "Ready Section" },
            { id: "custom", label: "Custom Section" },
          ],
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    void send();
  };

  const onDragHandlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const panel = panelRef.current;
    if (!panel) return;
    event.preventDefault();
    panel.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startLeft: pos.left,
      startTop: pos.top,
    };
    setDragging(true);
  };

  const onPanelPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = clampPos(
      {
        left: drag.startLeft + (event.clientX - drag.originX),
        top: drag.startTop + (event.clientY - drag.originY),
      },
      panelRef.current?.offsetWidth || width,
      panelRef.current?.offsetHeight || panelHeight(),
    );
    setPos(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      panelRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  };

  const latestChoices =
    [...messages].reverse().find((row) => row.choices?.length)?.choices || [];
  const visibleLatestChoices = latestChoices.filter(
    (choice) =>
      Boolean(choice.label?.trim()) &&
      !choice.id.startsWith("__master_create__:") &&
      !choice.id.startsWith("__master_submenu_mode__:"),
  );
  const suggestedChips = getSuggestedPromptChips(
    focusSectionId,
    category,
    focusSectionType,
    {
      isSinglePage: isSinglePageTemplate,
      pageLinks: pageLinks as ChipPageLink[],
    },
  );
  // Keep Try these available after chat — user can fold/unfold to reuse.
  const showSuggestionChips =
    !showSettings && suggestedChips.length > 0;

  const panel = (
    <aside
      ref={panelRef}
      className="pointer-events-auto fixed z-[10200] flex h-[min(560px,72vh)] flex-col overflow-hidden rounded-[22px] border border-zinc-200/80 bg-[#f4f5f7] text-zinc-900 shadow-[0_24px_64px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.06)]"
      style={{
        left: pos.left,
        top: pos.top,
        width,
        touchAction: dragging ? "none" : "auto",
      }}
      role="dialog"
      aria-label="AI Assist"
      onPointerMove={onPanelPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className={`flex shrink-0 cursor-grab items-center gap-2.5 border-b border-zinc-200/70 bg-white/95 px-3.5 py-3 backdrop-blur-md active:cursor-grabbing ${
          dragging ? "cursor-grabbing" : ""
        }`}
        onPointerDown={onDragHandlePointerDown}
      >
        <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 text-white shadow-md shadow-violet-500/30">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1 select-none">
          <p className="truncate text-[13px] font-semibold tracking-tight text-zinc-900">
            {showSettings
              ? "Chat settings"
              : focusSectionId
                ? `AI · ${focusSectionLabel || "Section"}`
                : "AI Assist"}
          </p>
          <p className="truncate text-[11px] text-zinc-500">
            {showSettings
              ? "Save · delete · auto-clear"
              : focusSectionId && MASTER_FOCUS_KIND[focusSectionId]
                ? `${focusSectionLabel || "Items"} only — create with AI`
                : "Describe changes — I’ll edit the site"}
          </p>
        </div>
        <span className="text-zinc-300" aria-hidden="true">
          <GripHorizontal size={18} />
        </span>
        {showSettings ? (
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="grid size-8 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Back to chat"
          >
            <ArrowLeft size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="grid size-8 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Open chat settings"
          >
            <Settings size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Close AI Assist"
        >
          <X size={15} />
        </button>
      </div>

      {showSettings ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f4f5f7] px-3.5 py-3.5 [scrollbar-width:thin]">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
            <p className="text-[12px] font-semibold text-zinc-900">Saved chats</p>
            <p className="mt-1.5 text-[11px] leading-4 text-zinc-500">
              All messages for this site stay saved in this browser until you
              delete them or auto-delete runs.
            </p>
            <p className="mt-2.5 text-[11px] font-medium text-zinc-400">
              {messages.filter((row) => !row.id.startsWith("welcome")).length}{" "}
              saved messages
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
            <p className="text-[12px] font-semibold text-zinc-900">
              Auto-delete after
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-zinc-500">
              Chat history is cleared automatically after the selected time.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {AUTO_DELETE_OPTIONS.map((option) => {
                const active = settings.autoDeleteDays === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateAutoDeleteDays(option.value)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                      active
                        ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
                        : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
            <p className="text-[12px] font-semibold text-zinc-900">
              Delete chat
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-zinc-500">
              Remove the full conversation for this site. You can also delete
              single messages from the chat list.
            </p>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const ok = await confirmDangerAction({
                    title: "Delete chat history?",
                    text: "Delete all AI Assist chat messages for this site?",
                    confirmButtonText: "Yes, delete",
                  });
                  if (!ok) return;
                  clearChat();
                  setShowSettings(false);
                })();
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={14} />
              Delete all chats
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f4f5f7] px-3.5 py-3.5 [scrollbar-width:thin]"
          >
            {messages.map((message) => (
              <div key={message.id} className="group/msg space-y-2">
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="relative max-w-[88%]">
                    {message.role === "assistant" ? (
                      <div className="mb-1.5 flex items-center gap-1.5 pl-0.5">
                        <span className="grid size-5 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                          <Sparkles size={10} />
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                          Assist
                        </span>
                      </div>
                    ) : null}
                    <div
                      className={`whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-[1.5] ${
                        message.role === "user"
                          ? "rounded-[18px] rounded-br-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                          : "rounded-[18px] rounded-bl-md border border-zinc-200/90 bg-white text-zinc-800 shadow-sm"
                      }`}
                    >
                      {message.text}
                    </div>
                    {!message.id.startsWith("welcome") ? (
                      <button
                        type="button"
                        onClick={() => deleteMessage(message.id)}
                        className="absolute -right-1 -top-1 hidden size-6 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 opacity-0 shadow transition hover:text-red-500 group-hover/msg:grid group-hover/msg:opacity-100"
                        aria-label="Delete message"
                        title="Delete message"
                      >
                        <Trash2 size={11} />
                      </button>
                    ) : null}
                  </div>
                </div>
                {message.choices?.length ? (
                  <div className="flex flex-wrap gap-2 pl-0.5">
                    {message.choices
                      .filter(
                        (choice) =>
                          Boolean(choice.label?.trim()) &&
                          !choice.id.startsWith("__master_create__:") &&
                          !choice.id.startsWith("__master_submenu_mode__:"),
                      )
                      .map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={sending}
                        onClick={() => void send(choice.id || choice.label)}
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {sending ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-[18px] rounded-bl-md border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-[12px] font-medium text-violet-700 shadow-sm">
                  <span className="flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:300ms]" />
                  </span>
                  {sendingLabel}
                </div>
              </div>
            ) : null}
          </div>

          {visibleLatestChoices.length && !sending ? (
            <div className="border-t border-zinc-200/80 bg-white/90 px-3.5 py-2.5 backdrop-blur-sm">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Choose
              </p>
              <div className="flex flex-wrap gap-2">
                {visibleLatestChoices.map((choice) => (
                  <button
                    key={`bar-${choice.id}`}
                    type="button"
                    onClick={() => void send(choice.id || choice.label)}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {showSuggestionChips ? (
            <div className="border-t border-zinc-200/80 bg-white/90 px-3.5 py-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setSuggestionsExpanded((open) => !open)}
                className="mb-0 flex w-full items-center justify-between gap-2 rounded-lg py-0.5 text-left transition hover:bg-zinc-50"
                aria-expanded={suggestionsExpanded}
                aria-controls="ai-assist-try-these"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Try these
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                  {suggestionsExpanded ? "Hide" : "Show"}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      suggestionsExpanded ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>
              {suggestionsExpanded ? (
                <div
                  id="ai-assist-try-these"
                  className="mt-2 max-h-[calc(2*1.875rem+0.5rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]"
                >
                  <div className="flex flex-wrap gap-2">
                    {suggestedChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        disabled={sending}
                        onClick={() => {
                          // Prefill only — user taps Send (safer than auto-run).
                          setDraft(chip.prompt);
                          queueMicrotask(() => inputRef.current?.focus());
                        }}
                        className="h-[1.875rem] shrink-0 rounded-full border border-zinc-200 bg-white px-3 text-[11px] font-medium leading-none text-zinc-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <form
            onSubmit={onSubmit}
            className="shrink-0 border-t border-zinc-200/80 bg-white px-3.5 py-3"
          >
            <div className="relative rounded-[18px] border border-zinc-200 bg-[#f4f5f7] px-3.5 py-2.5 pr-12 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder="Type what you want to change…"
                className="max-h-28 min-h-[40px] w-full resize-none bg-transparent text-[13px] leading-5 text-zinc-800 outline-none placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </>
      )}
    </aside>
  );

  // Portal to body so chat stacks above Blog/Service manager modals (those also portal to body).
  if (typeof document === "undefined") return panel;
  return createPortal(panel, document.body);
}
