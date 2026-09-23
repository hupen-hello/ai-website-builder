export type GalleryLayoutOption = {
  id: string;
  name: string;
  description: string;
  preview: "plain" | "slider" | "grid" | "tabs" | "random";
  image: string;
};

/** Gallery listing page (/gallery) — no detail pages. */
export const GALLERY_INDEX_LAYOUTS: GalleryLayoutOption[] = [
  {
    id: "GalleryPage-1",
    name: "Plain",
    description:
      "Clean uniform grid with simple captions — ideal for a straightforward photo wall.",
    preview: "plain",
    image: "/bg1.jpg",
  },
  {
    id: "GalleryPage-2",
    name: "Slider",
    description:
      "Full-width carousel with prev/next controls for a focused slideshow.",
    preview: "slider",
    image: "/bg2.jpg",
  },
  {
    id: "GalleryPage-3",
    name: "Grid",
    description:
      "Equal-size tiles in a balanced multi-column grid.",
    preview: "grid",
    image: "/bg1.jpg",
  },
  {
    id: "GalleryPage-4",
    name: "Tab wise",
    description:
      "Category tabs filter the gallery so visitors browse by group.",
    preview: "tabs",
    image: "/bg2.jpg",
  },
  {
    id: "GalleryPage-5",
    name: "Random",
    description:
      "Mixed small and large tiles in a masonry-style collage.",
    preview: "random",
    image: "/bg1.jpg",
  },
];

export const DEFAULT_GALLERY_INDEX_LAYOUT = GALLERY_INDEX_LAYOUTS[0].id;

export const normalizeGalleryIndexLayout = (value?: string | null) => {
  const id = value?.trim();
  return GALLERY_INDEX_LAYOUTS.some((layout) => layout.id === id)
    ? (id as string)
    : DEFAULT_GALLERY_INDEX_LAYOUT;
};

export const normalizeGalleryPageLayout = normalizeGalleryIndexLayout;
