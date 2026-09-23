/**
 * Blog posts live in pageLinks (kind: "blog") and as BlogPage sections.
 * If pageLinks records are lost but BlogPage sections or template blogItems remain,
 * rebuild the links so /blogs and the Blog manager stay in sync with saved content.
 */

type BlogLinkLike = {
  label: string;
  href: string;
  kind?: string;
  hidden?: boolean;
  layout?: string;
  author?: string;
  image?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  category?: string;
  createdAt?: string;
  children?: BlogLinkLike[];
};

type BlogSectionLike = {
  type?: string;
  page?: string;
  variant?: string;
  data?: Record<string, Record<string, unknown> | undefined>;
};

const flattenLinks = <T extends { children?: T[] }>(links: T[]): T[] =>
  links.flatMap((link) => [link, ...flattenLinks(link.children || [])]);

const normalizeHref = (href?: string) => (href || "").trim().toLowerCase();

const isBlogPostPageSlug = (page?: string) => {
  const slug = (page || "").trim().toLowerCase();
  if (!slug) return false;
  // Index / reserved — not individual posts
  if (slug === "blog" || slug === "blogs") return false;
  return true;
};

const blogSlugFromSectionPage = (page: string) => {
  const normalized = page.trim().toLowerCase();
  if (normalized.startsWith("blog-") && normalized.length > "blog-".length) {
    return normalized.slice("blog-".length);
  }
  return normalized;
};

const blogSlugFromHref = (href?: string) => {
  const normalized = normalizeHref(href);
  if (!normalized.startsWith("#page-")) return "";
  return blogSlugFromSectionPage(normalized.slice("#page-".length));
};

const slugifyBlogTitle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type BlogItemLike = {
  title?: string;
  label?: string;
  href?: string;
  slug?: string;
  image?: string;
  excerpt?: string;
  desc?: string;
  body?: string;
  content?: string;
  date?: string;
  category?: string;
  author?: string;
};

const slugFromBlogItem = (item: BlogItemLike) => {
  const explicit = (item.slug || "").trim();
  if (explicit) return blogSlugFromSectionPage(explicit);

  const href = (item.href || "").trim();
  if (href) {
    const last =
      href
        .split("?")[0]
        .replace(/\/+$/, "")
        .split("/")
        .filter(Boolean)
        .pop() || "";
    if (last && !["blog", "blogs"].includes(last.toLowerCase())) return last;
  }

  const title = (item.title || item.label || "").trim();
  return title ? slugifyBlogTitle(title) : "";
};

const isHomeBlogSection = (section: BlogSectionLike) =>
  section.type === "Blog" && !(section.page || "").trim();

const isBlogListingSection = (section: BlogSectionLike) => {
  if (section.type !== "BlogPage") return false;
  const page = (section.page || "").trim().toLowerCase();
  return page === "blog" || page === "blogs";
};

const readBlogItemsFromSection = (section: BlogSectionLike): BlogItemLike[] => {
  const data = section.data || {};
  const variant = section.variant;
  const variantKeys = [
    variant,
    "Blog-5",
    "Blog-1",
    "BlogPage-1",
    "BlogPage-6",
    ...Object.keys(data),
  ].filter(Boolean) as string[];

  const seenKeys = new Set<string>();
  for (const key of variantKeys) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const variantData = data[key];
    if (!variantData || typeof variantData !== "object") continue;
    const raw =
      (variantData as Record<string, unknown>).blogItems ??
      (variantData as Record<string, unknown>).galleryItems;
    if (!Array.isArray(raw)) continue;
    const items = raw.filter(
      (entry): entry is BlogItemLike =>
        Boolean(entry) && typeof entry === "object",
    );
    if (items.length) return items;
  }
  return [];
};

const blogItemToLink = (item: BlogItemLike): BlogLinkLike | null => {
  const title = (item.title || item.label || "").trim();
  if (!title) return null;

  const slug = slugFromBlogItem(item);
  if (!slug) return null;

  const excerpt = (item.excerpt || item.desc || "").trim();
  const content = (item.body || item.content || excerpt).trim();

  return {
    label: title,
    href: `#page-blog-${slug}`,
    kind: "blog",
    hidden: false,
    slug,
    layout: "BlogPage-1",
    author: item.author?.trim() || "Website author",
    image: typeof item.image === "string" ? item.image : undefined,
    shortDescription: excerpt || undefined,
    longDescription: content || undefined,
    category: item.category?.trim() || "General",
    createdAt: item.date?.trim() || undefined,
  };
};

const readSectionData = (section: BlogSectionLike) => {
  const data = section.data || {};
  const variant = section.variant || "BlogPage-1";
  const variantData =
    data[variant] ||
    data["BlogPage-1"] ||
    data["BlogPage-2"] ||
    data["BlogPage-3"] ||
    Object.values(data)[0];
  return variantData && typeof variantData === "object" ? variantData : {};
};

export function recoverBlogPageLinksFromSections<T extends BlogLinkLike>(
  pageLinks: T[],
  sections: BlogSectionLike[] | undefined,
): T[] {
  const existingHrefs = new Set<string>();
  const existingSlugs = new Set<string>();

  for (const link of flattenLinks(pageLinks)) {
    if (link.kind !== "blog") continue;
    existingHrefs.add(normalizeHref(link.href));
    const slug = (link.slug || blogSlugFromHref(link.href)).trim().toLowerCase();
    if (slug) existingSlugs.add(slug);
  }

  const recovered: T[] = [];

  const rememberBlogLink = (link: BlogLinkLike) => {
    const slug = (link.slug || blogSlugFromHref(link.href)).trim().toLowerCase();
    if (slug && existingSlugs.has(slug)) return false;
    const hrefKey = normalizeHref(link.href);
    if (existingHrefs.has(hrefKey)) return false;
    recovered.push(link as T);
    existingHrefs.add(hrefKey);
    if (slug) existingSlugs.add(slug);
    return true;
  };

  for (const section of sections || []) {
    if (section.type !== "BlogPage") continue;
    const page = (section.page || "").trim();
    if (!isBlogPostPageSlug(page)) continue;

    const href = `#page-${page}`;
    if (existingHrefs.has(normalizeHref(href))) continue;

    const data = readSectionData(section);
    const title =
      (typeof data.title === "string" && data.title.trim()) ||
      blogSlugFromSectionPage(page) ||
      "Untitled post";
    const layout =
      (typeof data.layout === "string" && data.layout) ||
      section.variant ||
      "BlogPage-1";

    rememberBlogLink({
      label: title,
      href,
      kind: "blog",
      hidden: false,
      slug: blogSlugFromSectionPage(page),
      layout,
      author: typeof data.author === "string" ? data.author : undefined,
      image: typeof data.image === "string" ? data.image : undefined,
      shortDescription:
        typeof data.excerpt === "string" ? data.excerpt : undefined,
      longDescription:
        typeof data.content === "string" ? data.content : undefined,
      category: typeof data.category === "string" ? data.category : undefined,
    });
  }

  for (const section of sections || []) {
    if (!isHomeBlogSection(section) && !isBlogListingSection(section)) continue;
    for (const item of readBlogItemsFromSection(section)) {
      const link = blogItemToLink(item);
      if (link) rememberBlogLink(link);
    }
  }

  if (!recovered.length) return pageLinks;
  return [...pageLinks, ...recovered];
}
