export type TeamLayoutOption = {
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

/** Teams listing page (/teams). */
export const TEAM_INDEX_LAYOUTS: TeamLayoutOption[] = [
  {
    id: "TeamPage-1",
    name: "Split intro + carousel",
    description:
      "Intro copy beside a side image, then a sliding row of team cards.",
    preview: "split",
    image: "/bg1.jpg",
  },
  {
    id: "TeamPage-2",
    name: "Feature spotlight",
    description:
      "Bold heading with featured members in a clean card strip.",
    preview: "feature",
    image: "/bg2.jpg",
  },
  {
    id: "TeamPage-3",
    name: "Card showcase",
    description:
      "Team cards front-and-center with category and short description.",
    preview: "cards",
    image: "/bg1.jpg",
  },
  {
    id: "TeamPage-4",
    name: "Grid catalog",
    description:
      "Compact grid of people — ideal when you want to show many team members.",
    preview: "grid",
    image: "/bg2.jpg",
  },
];

/** Individual team member detail page layouts. */
export const TEAM_DETAIL_LAYOUTS: TeamLayoutOption[] = [
  {
    id: "TeamDetail-1",
    name: "Full-bleed hero",
    description:
      "Edge-to-edge cover image with title overlay, then wide content below.",
    preview: "classic",
    image: "/bg1.jpg",
  },
  {
    id: "TeamDetail-2",
    name: "Split showcase",
    description:
      "Full-width half image / half story - no side gutters on the split.",
    preview: "editorial",
    image: "/bg2.jpg",
  },
  {
    id: "TeamDetail-3",
    name: "Cover hero",
    description:
      "Tall full-bleed photo with title overlay, then wide article body.",
    preview: "hero",
    image: "/bg1.jpg",
  },
  {
    id: "TeamDetail-4",
    name: "Intro + summary",
    description:
      "Wide header with image, full-width content, and sticky summary rail.",
    preview: "sidebar",
    image: "/bg2.jpg",
  },
  {
    id: "TeamDetail-5",
    name: "Editorial story",
    description:
      "Wide title block, edge-to-edge photo band, then wide reading content.",
    preview: "story",
    image: "/bg1.jpg",
  },
];

/** @deprecated use TEAM_INDEX_LAYOUTS */
export const TEAM_PAGE_LAYOUTS = TEAM_INDEX_LAYOUTS;

export const DEFAULT_TEAM_INDEX_LAYOUT = TEAM_INDEX_LAYOUTS[0].id;
export const DEFAULT_TEAM_DETAIL_LAYOUT = TEAM_DETAIL_LAYOUTS[0].id;
export const DEFAULT_TEAM_PAGE_LAYOUT = DEFAULT_TEAM_INDEX_LAYOUT;

export const normalizeTeamIndexLayout = (value?: string | null) => {
  const id = value?.trim();
  return TEAM_INDEX_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_TEAM_INDEX_LAYOUT;
};

export const normalizeTeamDetailLayout = (value?: string | null) => {
  const id = value?.trim();
  return TEAM_DETAIL_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_TEAM_DETAIL_LAYOUT;
};

export const normalizeTeamPageLayout = normalizeTeamIndexLayout;
