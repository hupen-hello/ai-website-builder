export type BlogLayoutOption = {
  id: string;
  name: string;
  description: string;
  /** CSS mock used on the layout picker card */
  preview:
    | "grid"
    | "magazine"
    | "list"
    | "minimal"
    | "overlay"
    | "classic"
    | "editorial"
    | "hero"
    | "sidebar"
    | "story";
  image: string;
};

/** Listing page (/blogs) — uses image, title, category, short description, author */
export const BLOG_INDEX_LAYOUTS: BlogLayoutOption[] = [
  {
    id: "BlogIndex-1",
    name: "Card grid",
    description:
      "Image cards with category, title and short description in a 3-column grid.",
    preview: "grid",
    image: "/bg1.jpg",
  },
  {
    id: "BlogIndex-2",
    name: "Magazine feature",
    description:
      "Large featured post plus a stacked list — ideal when one story leads.",
    preview: "magazine",
    image: "/bg2.jpg",
  },
  {
    id: "BlogIndex-3",
    name: "Horizontal rows",
    description:
      "Wide rows with thumbnail, category, title, author and short description.",
    preview: "list",
    image: "/bg1.jpg",
  },
  {
    id: "BlogIndex-4",
    name: "Minimal digest",
    description:
      "Clean text-first list with category, title, author and short description.",
    preview: "minimal",
    image: "/bg2.jpg",
  },
  {
    id: "BlogIndex-5",
    name: "Overlay covers",
    description:
      "Full-bleed image covers with title and category overlaid on the photo.",
    preview: "overlay",
    image: "/bg1.jpg",
  },
];

/** Post detail page — uses title, author, category, image, short + long description */
export const BLOG_DETAIL_LAYOUTS: BlogLayoutOption[] = [
  {
    id: "BlogPage-1",
    name: "Full-bleed hero",
    description:
      "Wide cover image with title overlay, then article body in the same width.",
    preview: "classic",
    image: "/bg1.jpg",
  },
  {
    id: "BlogPage-2",
    name: "Split showcase",
    description:
      "Half photo / half story panel — category, title, author, then rich content.",
    preview: "editorial",
    image: "/bg2.jpg",
  },
  {
    id: "BlogPage-3",
    name: "Cover hero",
    description:
      "Tall cover photo with title overlay, then wide reading content below.",
    preview: "hero",
    image: "/bg1.jpg",
  },
  {
    id: "BlogPage-4",
    name: "Intro + summary",
    description:
      "Wide header with image, article body, and sticky ‘about this post’ rail.",
    preview: "sidebar",
    image: "/bg2.jpg",
  },
  {
    id: "BlogPage-5",
    name: "Editorial story",
    description:
      "Bold title, author bar, lead quote, wide photo, then long content.",
    preview: "story",
    image: "/bg1.jpg",
  },
];

export const DEFAULT_BLOG_INDEX_LAYOUT = BLOG_INDEX_LAYOUTS[0].id;
export const DEFAULT_BLOG_DETAIL_LAYOUT = BLOG_DETAIL_LAYOUTS[0].id;

export const normalizeBlogIndexLayout = (value?: string | null) => {
  const id = value?.trim();
  return BLOG_INDEX_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_BLOG_INDEX_LAYOUT;
};

export const normalizeBlogDetailLayout = (value?: string | null) => {
  const id = value?.trim();
  if (BLOG_DETAIL_LAYOUTS.some((layout) => layout.id === id)) {
    return id as string;
  }
  // Legacy aliases
  if (id === "BlogPage-2") return "BlogPage-2";
  return DEFAULT_BLOG_DETAIL_LAYOUT;
};
