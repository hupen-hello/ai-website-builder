export type PropertyLayoutOption = {
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

/** Properties listing page (/properties). */
export const PROPERTY_INDEX_LAYOUTS: PropertyLayoutOption[] = [
  {
    id: "PropertyPage-1",
    name: "Split intro + carousel",
    description:
      "Intro copy beside a side image, then a sliding row of property cards.",
    preview: "split",
    image: "/bg1.jpg",
  },
  {
    id: "PropertyPage-2",
    name: "Feature spotlight",
    description:
      "Bold heading with featured listings in a clean card strip.",
    preview: "feature",
    image: "/bg2.jpg",
  },
  {
    id: "PropertyPage-3",
    name: "Card showcase",
    description:
      "Property cards front-and-center with type, price and short description.",
    preview: "cards",
    image: "/bg1.jpg",
  },
  {
    id: "PropertyPage-4",
    name: "Grid catalog",
    description:
      "Compact grid of listings — ideal when you have many properties.",
    preview: "grid",
    image: "/bg2.jpg",
  },
];

/** Individual property detail page layouts. */
export const PROPERTY_DETAIL_LAYOUTS: PropertyLayoutOption[] = [
  {
    id: "PropertyDetail-1",
    name: "Full-bleed hero",
    description:
      "Edge-to-edge cover image with title overlay, then wide content below.",
    preview: "classic",
    image: "/bg1.jpg",
  },
  {
    id: "PropertyDetail-2",
    name: "Split showcase",
    description:
      "Full-width half image / half story — no side gutters on the split.",
    preview: "editorial",
    image: "/bg2.jpg",
  },
  {
    id: "PropertyDetail-3",
    name: "Cover hero",
    description:
      "Tall full-bleed photo with title overlay, then wide article body.",
    preview: "hero",
    image: "/bg1.jpg",
  },
  {
    id: "PropertyDetail-4",
    name: "Intro + summary",
    description:
      "Wide header with image, full-width content, and sticky summary rail.",
    preview: "sidebar",
    image: "/bg2.jpg",
  },
  {
    id: "PropertyDetail-5",
    name: "Editorial story",
    description:
      "Wide title block, edge-to-edge photo band, then wide reading content.",
    preview: "story",
    image: "/bg1.jpg",
  },
];

/** @deprecated use PROPERTY_INDEX_LAYOUTS */
export const PROPERTY_PAGE_LAYOUTS = PROPERTY_INDEX_LAYOUTS;

export const DEFAULT_PROPERTY_INDEX_LAYOUT = PROPERTY_INDEX_LAYOUTS[0].id;
export const DEFAULT_PROPERTY_DETAIL_LAYOUT = PROPERTY_DETAIL_LAYOUTS[0].id;
export const DEFAULT_PROPERTY_PAGE_LAYOUT = DEFAULT_PROPERTY_INDEX_LAYOUT;

export const normalizePropertyIndexLayout = (value?: string | null) => {
  const id = value?.trim();
  return PROPERTY_INDEX_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_PROPERTY_INDEX_LAYOUT;
};

export const normalizePropertyDetailLayout = (value?: string | null) => {
  const id = value?.trim();
  return PROPERTY_DETAIL_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_PROPERTY_DETAIL_LAYOUT;
};

export const normalizePropertyPageLayout = normalizePropertyIndexLayout;
