export type EventLayoutOption = {
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

/** Events listing page (/events) — ServicePage variants. */
export const EVENT_INDEX_LAYOUTS: EventLayoutOption[] = [
  {
    id: "EventPage-1",
    name: "Split intro + carousel",
    description:
      "Intro copy beside a side image, then a sliding row of event cards.",
    preview: "split",
    image: "/bg1.jpg",
  },
  {
    id: "EventPage-2",
    name: "Feature spotlight",
    description:
      "Bold heading with featured events in a clean card strip.",
    preview: "feature",
    image: "/bg2.jpg",
  },
  {
    id: "EventPage-3",
    name: "Card showcase",
    description:
      "Event cards front-and-center with category and short description.",
    preview: "cards",
    image: "/bg1.jpg",
  },
  {
    id: "EventPage-4",
    name: "Grid catalog",
    description:
      "Compact grid of services — ideal when you offer many events.",
    preview: "grid",
    image: "/bg2.jpg",
  },
];

/** Individual event detail page layouts. */
export const EVENT_DETAIL_LAYOUTS: EventLayoutOption[] = [
  {
    id: "EventDetail-1",
    name: "Full-bleed hero",
    description:
      "Edge-to-edge cover image with title overlay, then wide content below.",
    preview: "classic",
    image: "/bg1.jpg",
  },
  {
    id: "EventDetail-2",
    name: "Split showcase",
    description:
      "Full-width half image / half story — no side gutters on the split.",
    preview: "editorial",
    image: "/bg2.jpg",
  },
  {
    id: "EventDetail-3",
    name: "Cover hero",
    description:
      "Tall full-bleed photo with title overlay, then wide article body.",
    preview: "hero",
    image: "/bg1.jpg",
  },
  {
    id: "EventDetail-4",
    name: "Intro + summary",
    description:
      "Wide header with image, full-width content, and sticky summary rail.",
    preview: "sidebar",
    image: "/bg2.jpg",
  },
  {
    id: "EventDetail-5",
    name: "Editorial story",
    description:
      "Wide title block, edge-to-edge photo band, then wide reading content.",
    preview: "story",
    image: "/bg1.jpg",
  },
];

/** @deprecated use EVENT_INDEX_LAYOUTS */
export const EVENT_PAGE_LAYOUTS = EVENT_INDEX_LAYOUTS;

export const DEFAULT_EVENT_INDEX_LAYOUT = EVENT_INDEX_LAYOUTS[0].id;
export const DEFAULT_EVENT_DETAIL_LAYOUT = EVENT_DETAIL_LAYOUTS[0].id;
export const DEFAULT_EVENT_PAGE_LAYOUT = DEFAULT_EVENT_INDEX_LAYOUT;

export const normalizeEventIndexLayout = (value?: string | null) => {
  const id = value?.trim();
  return EVENT_INDEX_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_EVENT_INDEX_LAYOUT;
};

export const normalizeEventDetailLayout = (value?: string | null) => {
  const id = value?.trim();
  return EVENT_DETAIL_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_EVENT_DETAIL_LAYOUT;
};

export const normalizeEventPageLayout = normalizeEventIndexLayout;
