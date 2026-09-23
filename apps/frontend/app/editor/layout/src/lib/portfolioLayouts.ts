export type PortfolioLayoutOption = {
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

/** Portfolio listing page (/portfolio). */
export const PORTFOLIO_INDEX_LAYOUTS: PortfolioLayoutOption[] = [
  {
    id: "PortfolioPage-1",
    name: "Split intro + carousel",
    description:
      "Intro copy beside a side image, then a sliding row of portfolio cards.",
    preview: "split",
    image: "/bg1.jpg",
  },
  {
    id: "PortfolioPage-2",
    name: "Feature spotlight",
    description:
      "Bold heading with featured work in a clean card strip.",
    preview: "feature",
    image: "/bg2.jpg",
  },
  {
    id: "PortfolioPage-3",
    name: "Card showcase",
    description:
      "Portfolio cards front-and-center with category and short description.",
    preview: "cards",
    image: "/bg1.jpg",
  },
  {
    id: "PortfolioPage-4",
    name: "Grid catalog",
    description:
      "Compact grid of projects - ideal when you want to show many portfolio items.",
    preview: "grid",
    image: "/bg2.jpg",
  },
];

/** Individual portfolio detail page layouts. */
export const PORTFOLIO_DETAIL_LAYOUTS: PortfolioLayoutOption[] = [
  {
    id: "PortfolioDetail-1",
    name: "Full-bleed hero",
    description:
      "Edge-to-edge cover image with title overlay, then wide content below.",
    preview: "classic",
    image: "/bg1.jpg",
  },
  {
    id: "PortfolioDetail-2",
    name: "Split showcase",
    description:
      "Full-width half image / half story - no side gutters on the split.",
    preview: "editorial",
    image: "/bg2.jpg",
  },
  {
    id: "PortfolioDetail-3",
    name: "Cover hero",
    description:
      "Tall full-bleed photo with title overlay, then wide article body.",
    preview: "hero",
    image: "/bg1.jpg",
  },
  {
    id: "PortfolioDetail-4",
    name: "Intro + summary",
    description:
      "Wide header with image, full-width content, and sticky summary rail.",
    preview: "sidebar",
    image: "/bg2.jpg",
  },
  {
    id: "PortfolioDetail-5",
    name: "Editorial story",
    description:
      "Wide title block, edge-to-edge photo band, then wide reading content.",
    preview: "story",
    image: "/bg1.jpg",
  },
];

/** @deprecated use PORTFOLIO_INDEX_LAYOUTS */
export const PORTFOLIO_PAGE_LAYOUTS = PORTFOLIO_INDEX_LAYOUTS;

export const DEFAULT_PORTFOLIO_INDEX_LAYOUT = PORTFOLIO_INDEX_LAYOUTS[0].id;
export const DEFAULT_PORTFOLIO_DETAIL_LAYOUT = PORTFOLIO_DETAIL_LAYOUTS[0].id;
export const DEFAULT_PORTFOLIO_PAGE_LAYOUT = DEFAULT_PORTFOLIO_INDEX_LAYOUT;

export const normalizePortfolioIndexLayout = (value?: string | null) => {
  const id = value?.trim();
  return PORTFOLIO_INDEX_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_PORTFOLIO_INDEX_LAYOUT;
};

export const normalizePortfolioDetailLayout = (value?: string | null) => {
  const id = value?.trim();
  return PORTFOLIO_DETAIL_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_PORTFOLIO_DETAIL_LAYOUT;
};

export const normalizePortfolioPageLayout = normalizePortfolioIndexLayout;
