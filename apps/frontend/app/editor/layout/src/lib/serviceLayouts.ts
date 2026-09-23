export type ServiceLayoutOption = {
  id: string;
  name: string;
  description: string;
  preview:
    | "split"
    | "cards"
    | "feature"
    | "grid"
    | "classic"
    | "editorial"
    | "hero"
    | "sidebar"
    | "story";
  image: string;
};

/** Services listing page (/services) — ServicePage variants. */
export const SERVICE_INDEX_LAYOUTS: ServiceLayoutOption[] = [
  {
    id: "ServicePage-1",
    name: "Split intro + carousel",
    description:
      "Intro copy beside a side image, then a sliding row of service cards.",
    preview: "split",
    image: "/bg1.jpg",
  },
  {
    id: "ServicePage-2",
    name: "Feature spotlight",
    description:
      "Bold heading with featured services in a clean card strip.",
    preview: "feature",
    image: "/bg2.jpg",
  },
  {
    id: "ServicePage-3",
    name: "Card showcase",
    description:
      "Service cards front-and-center with category and short description.",
    preview: "cards",
    image: "/bg1.jpg",
  },
  {
    id: "ServicePage-4",
    name: "Grid catalog",
    description:
      "Compact grid of services — ideal when you offer many items.",
    preview: "grid",
    image: "/bg2.jpg",
  },
];

/** Individual service detail page layouts. */
export const SERVICE_DETAIL_LAYOUTS: ServiceLayoutOption[] = [
  {
    id: "ServiceDetail-1",
    name: "Full-bleed hero",
    description:
      "Edge-to-edge cover image with title overlay, then wide content below.",
    preview: "classic",
    image: "/bg1.jpg",
  },
  {
    id: "ServiceDetail-2",
    name: "Split showcase",
    description:
      "Full-width half image / half story — no side gutters on the split.",
    preview: "editorial",
    image: "/bg2.jpg",
  },
  {
    id: "ServiceDetail-3",
    name: "Cover hero",
    description:
      "Tall full-bleed photo with title overlay, then wide article body.",
    preview: "hero",
    image: "/bg1.jpg",
  },
  {
    id: "ServiceDetail-4",
    name: "Intro + summary",
    description:
      "Wide header with image, full-width content, and sticky summary rail.",
    preview: "sidebar",
    image: "/bg2.jpg",
  },
  {
    id: "ServiceDetail-5",
    name: "Editorial story",
    description:
      "Wide title block, edge-to-edge photo band, then wide reading content.",
    preview: "story",
    image: "/bg1.jpg",
  },
];

/** @deprecated use SERVICE_INDEX_LAYOUTS */
export const SERVICE_PAGE_LAYOUTS = SERVICE_INDEX_LAYOUTS;

export const DEFAULT_SERVICE_INDEX_LAYOUT = SERVICE_INDEX_LAYOUTS[0].id;
export const DEFAULT_SERVICE_DETAIL_LAYOUT = SERVICE_DETAIL_LAYOUTS[0].id;
export const DEFAULT_SERVICE_PAGE_LAYOUT = DEFAULT_SERVICE_INDEX_LAYOUT;

export const normalizeServiceIndexLayout = (value?: string | null) => {
  const id = value?.trim();
  return SERVICE_INDEX_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_SERVICE_INDEX_LAYOUT;
};

export const normalizeServiceDetailLayout = (value?: string | null) => {
  const id = value?.trim();
  return SERVICE_DETAIL_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_SERVICE_DETAIL_LAYOUT;
};

export const normalizeServicePageLayout = normalizeServiceIndexLayout;
