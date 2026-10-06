import type { SectionData, SectionItem } from "../types/section";

type RecordItem = Record<string, unknown>;

type PageLinkLike = {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
  image?: string;
  shortDescription?: string;
  slug?: string;
  createdAt?: string;
  featured?: boolean;
  showOnHome?: boolean;
  children?: PageLinkLike[];
};

const isRecord = (value: unknown): value is RecordItem =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

export const slugifyHomeItem = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const GENERIC_HREF_SLUGS = new Set([
  "properties",
  "property",
  "projects",
  "portfolio",
  "blog",
  "contact",
  "home",
]);

const slugFromHref = (href: string) => {
  const last =
    href
      .split("?")[0]
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean)
      .pop() || "";
  if (!last || GENERIC_HREF_SLUGS.has(last.toLowerCase())) return "";
  return last;
};

export const isShownOnHome = (item: RecordItem) => item.showOnHome !== false;

export const itemSlug = (item: RecordItem) =>
  text(item.slug) ||
  slugFromHref(text(item.href)) ||
  slugifyHomeItem(text(item.title, text(item.name, text(item.label))));

const readVariantData = (section?: SectionItem | null): RecordItem => {
  if (!section) return {};
  const variantData =
    section.data?.[section.variant] ??
    section.data?.[`${section.id}-1`] ??
    section.data?.[`${section.type}-1`];
  return isRecord(variantData) ? variantData : {};
};

const records = (value: unknown): RecordItem[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const isHomeFeedType = (
  section: SectionItem,
  type: string,
  variantPrefix: string,
) =>
  section.type === type ||
  String(section.id || "") === type ||
  String(section.variant || "").startsWith(variantPrefix);

const findLibraryItems = (
  sections: SectionItem[],
  type: string,
  variantPrefix: string,
  field = "productItems",
) => {
  const section = sections.find((item) =>
    isHomeFeedType(item, type, variantPrefix),
  );
  const data = readVariantData(section);
  const primary = records(data[field]).filter((item) => item.active !== false);
  if (primary.length) return primary;
  if (field === "productItems") {
    const fromEventItems = records(data.items)
      .filter((item) => item.active !== false)
      .map((item, index) => {
        const tags = Array.isArray(item.tags)
          ? item.tags.map((tag) => String(tag))
          : [];
        const title = text(item.title);
        return {
          ...item,
          title,
          image: text(item.image),
          desc: text(item.desc, text(item.description, tags.join(", "))),
          category: text(item.category, tags[0] || "Service"),
          slug: itemSlug(item) || slugifyHomeItem(title) || `service-${index + 1}`,
          active: true,
          showOnHome: item.showOnHome !== false,
        };
      });
    if (fromEventItems.length) return fromEventItems;
    const fromListings = records(data.listings).filter(
      (item) => item.active !== false,
    );
    if (fromListings.length) return fromListings;
    return records(data.projectItems).filter((item) => item.active !== false);
  }
  if (field === "blogItems") {
    return records(data.blogs)
      .filter((item) => item.active !== false)
      .map((item, index) => {
        const title = text(item.title, text(item.label));
        const slug =
          itemSlug(item) ||
          text(item.id) ||
          slugifyHomeItem(title) ||
          `blog-${index + 1}`;
        const date = [
          text(item.date),
          [text(item.dateLine1), text(item.dateLine2), text(item.dateLine3)]
            .filter(Boolean)
            .join(" "),
        ].find((value) => value.trim()) || "";
        return {
          ...item,
          title,
          image: text(item.image),
          excerpt: text(item.excerpt, text(item.desc, text(item.readTime))),
          category: text(item.category, "General"),
          slug,
          href: text(item.href, text(item.link, `/blog/${slug}`)),
          date,
          active: true,
        };
      });
  }
  return [];
};

const listingBadge = (item: RecordItem, fallback?: RecordItem) => {
  const listingType = text(
    item.listingType,
    text(fallback?.listingType),
  ).toLowerCase();
  const category = text(item.category, text(fallback?.category)).toLowerCase();
  if (listingType.includes("rent") || category.includes("rent")) return "For Rent";
  return "For Sale";
};

const normalizeListingFeatures = (
  value: unknown,
): Array<{ label: string; value: string }> => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((feature) => {
    if (!isRecord(feature)) return [];
    const label = text(feature.label);
    const featureValue = text(feature.value);
    if (!label || !featureValue) return [];
    return [{ label, value: featureValue }];
  });
};

const formatListingArea = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/sq\.?\s*ft|sqft/i.test(trimmed)) return trimmed;
  return `${trimmed} sq.ft`;
};

const hasStructuredPropertySpecs = (item: RecordItem) =>
  "bedrooms" in item ||
  "areaSqft" in item ||
  "bathrooms" in item ||
  "parking" in item;

const buildPropertyListingFeatures = (
  item: RecordItem,
  fallback?: RecordItem,
): Array<{ label: string; value: string }> => {
  if (hasStructuredPropertySpecs(item)) {
    return [
      text(item.bedrooms)
        ? { label: "Bedrooms", value: text(item.bedrooms) }
        : null,
      text(item.areaSqft)
        ? { label: "Area", value: formatListingArea(text(item.areaSqft)) }
        : null,
      text(item.bathrooms)
        ? { label: "Bathrooms", value: text(item.bathrooms) }
        : null,
      text(item.parking)
        ? { label: "Parking", value: text(item.parking) }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }

  const explicit = normalizeListingFeatures(item.features);
  if (explicit.length) return explicit;
  return normalizeListingFeatures(fallback?.features);
};

export const mapPropertyToListing = (
  item: RecordItem,
  fallback?: RecordItem,
) => {
  const galleryFrom = (row?: RecordItem) => {
    if (!row || !Array.isArray(row.gallery)) return [] as string[];
    return row.gallery
      .flatMap((entry) => {
        if (typeof entry === "string" && entry.trim()) return [entry.trim()];
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const image = (entry as { image?: unknown }).image;
          if (typeof image === "string" && image.trim()) return [image.trim()];
        }
        return [];
      })
      .filter(Boolean);
  };
  const gallery = galleryFrom(item);
  const fallbackGallery = galleryFrom(fallback);
  return {
  ...fallback,
  ...item,
  title: text(item.title, text(fallback?.title)),
  image: text(item.image, text(fallback?.image)),
  alt: text(item.alt, text(fallback?.alt, text(item.title))),
  subtitle: text(
    item.subtitle,
    text(
      fallback?.subtitle,
      [text(item.bedrooms), text(item.propertyType)]
        .filter(Boolean)
        .join(" • "),
    ),
  ),
  description: text(
    item.description,
    text(item.desc, text(fallback?.description, text(fallback?.desc))),
  ),
  desc: text(item.desc, text(fallback?.desc, text(item.description))),
  price: text(item.price, text(fallback?.price)),
  statusText: text(item.statusText, text(fallback?.statusText)),
  location: text(
    item.location,
    text(item.address, text(fallback?.location, text(fallback?.address))),
  ),
  category: listingBadge(item, fallback),
  slug: itemSlug(item) || itemSlug(fallback || {}),
  href: propertyHref(item, fallback),
  features: buildPropertyListingFeatures(item, fallback),
  gallery: gallery.length ? gallery : fallbackGallery,
  };
};

const propertyHref = (item: RecordItem, fallback?: RecordItem) => {
  const href = text(item.href);
  const hrefSlug = slugFromHref(href);
  if (href && hrefSlug) return href;
  const fallbackHref = text(fallback?.href);
  const fallbackSlug = slugFromHref(fallbackHref);
  if (fallbackHref && fallbackSlug) return fallbackHref;
  const slug = itemSlug(item) || itemSlug(fallback || {});
  return slug ? `/properties/${slug}` : "/properties";
};

export const mapPortfolioToProject = (
  item: RecordItem,
  fallback?: RecordItem,
) => {
  const slug = itemSlug(item) || itemSlug(fallback || {});
  return {
    ...fallback,
    ...item,
    title: text(item.title, text(fallback?.title)),
    desc: text(item.desc, text(fallback?.desc)),
    image: text(item.image, text(fallback?.image)),
    alt: text(item.alt, text(fallback?.alt, text(item.title))),
    status: text(item.status, text(fallback?.status)),
    location: text(item.location, text(fallback?.location)),
    category: text(item.category, text(fallback?.category, "Residential")),
    slug,
    href: text(item.href) || text(fallback?.href) || `/projects/${slug}`,
  };
};

const mapPortfolioToCity = (item: RecordItem, fallback?: RecordItem) => {
  const slug = itemSlug(item) || itemSlug(fallback || {});
  const title = text(
    item.title,
    text(item.name, text(fallback?.name, text(fallback?.title))),
  );
  return {
    ...fallback,
    ...item,
    name: title,
    title,
    desc: text(item.desc, text(fallback?.desc)),
    image: text(item.image, text(fallback?.image)),
    alt: text(item.alt, text(fallback?.alt, title)),
    listingsLabel: text(
      item.listingsLabel,
      text(item.category, text(fallback?.listingsLabel, text(fallback?.category))),
    ),
    category: text(item.category, text(fallback?.category, "Residential")),
    location: text(item.location, text(fallback?.location, text(item.address))),
    region: text(item.region, text(fallback?.region, text(item.location))),
    href: text(item.href) || text(fallback?.href) || `/projects/${slug}`,
    slug,
  };
};

const mapBlogToEventCard = (item: RecordItem, fallback?: RecordItem) => {
  const title = text(item.title, text(item.label, text(fallback?.title)));
  const slug = itemSlug(item) || itemSlug(fallback || {}) || slugifyHomeItem(title);
  const date = text(item.date, text(item.createdAt, text(fallback?.date)));
  const dateParts = date.split(/\s+/).filter(Boolean);
  return {
    ...fallback,
    ...item,
    id: text(item.id, text(fallback?.id, slug)),
    image: text(item.image, text(fallback?.image)),
    dateLine1: text(item.dateLine1, text(fallback?.dateLine1, dateParts[0] || "")),
    dateLine2: text(item.dateLine2, text(fallback?.dateLine2, dateParts[1] || "")),
    dateLine3: text(item.dateLine3, text(fallback?.dateLine3, dateParts[2] || "")),
    category: text(item.category, text(fallback?.category, "General")),
    readTime: text(item.readTime, text(fallback?.readTime, "5 Min Read")),
    title,
    link: text(item.link, text(item.href, text(fallback?.link, `/blog/${slug}`))),
  };
};

const mapBlogToHomePost = (item: RecordItem, fallback?: RecordItem) => {
  const title = text(item.title, text(item.label, text(fallback?.title)));
  const slug = itemSlug(item) || itemSlug(fallback || {}) || slugifyHomeItem(title);
  return {
    ...fallback,
    ...item,
    title,
    excerpt: text(
      item.excerpt,
      text(item.shortDescription, text(item.desc, text(fallback?.excerpt))),
    ),
    image: text(item.image, text(fallback?.image)),
    alt: text(item.alt, text(fallback?.alt, title)),
    date: text(item.date, text(item.createdAt, text(fallback?.date))),
    href: text(item.href) || text(fallback?.href) || `/blog/${slug}`,
    slug,
  };
};

const mergeFeed = (
  localItems: RecordItem[],
  libraryItems: RecordItem[],
  mapItem: (item: RecordItem, fallback?: RecordItem) => RecordItem,
  appendFeaturedExtras = false,
) => {
  if (!libraryItems.length) return localItems;

  const bySlug = new Map(
    libraryItems
      .map((item) => [itemSlug(item), item] as const)
      .filter(([slug]) => slug),
  );
  const used = new Set<string>();
  const merged = localItems.map((local) => {
    const slug = itemSlug(local);
    const hit = slug ? bySlug.get(slug) : undefined;
    if (hit) {
      used.add(slug);
      return mapItem(hit, local);
    }
    return local;
  });

  if (!appendFeaturedExtras) return merged;

  const extras = libraryItems.filter((item) => {
    const slug = itemSlug(item);
    return Boolean(slug) && !used.has(slug) && item.featured === true;
  });

  return extras.length ? [...merged, ...extras.map((item) => mapItem(item))] : merged;
};

const mapLibraryToLocalList = (
  libraryItems: RecordItem[],
  localItems: RecordItem[],
  mapItem: (item: RecordItem, fallback?: RecordItem) => RecordItem,
) => {
  if (!libraryItems.length) return localItems;
  const localBySlug = new Map(
    localItems
      .map((item) => [itemSlug(item), item] as const)
      .filter(([slug]) => slug),
  );
  return libraryItems.map((item) =>
    mapItem(item, localBySlug.get(itemSlug(item))),
  );
};

const blogRecordsFromLinks = (pageLinks: PageLinkLike[] = []) => {
  const flatten = (links: PageLinkLike[]): PageLinkLike[] =>
    links.flatMap((link) => [link, ...flatten(link.children ?? [])]);
  return flatten(pageLinks)
    .filter((link) => link.kind === "blog" && link.hidden !== true)
    .map((link) => ({
      title: text(link.label),
      label: text(link.label),
      href: text(link.href),
      image: text(link.image),
      shortDescription: text(link.shortDescription),
      slug: text(link.slug) || slugFromHref(text(link.href)) || slugifyHomeItem(text(link.label)),
      createdAt: text(link.createdAt),
      featured: link.featured === true,
      showOnHome: link.showOnHome !== false,
    }));
};

const isRentItem = (item: RecordItem) => {
  const listingType = text(item.listingType).toLowerCase();
  const category = text(item.category).toLowerCase();
  return listingType.includes("rent") || category.includes("rent");
};

const mapServiceToEventItem = (item: RecordItem, fallback?: RecordItem) => {
  const title = text(
    item.title,
    text(item.productTitle, text(fallback?.title, text(fallback?.productTitle))),
  );
  const fallbackTags = Array.isArray(fallback?.tags)
    ? fallback.tags.map((tag) => String(tag))
    : [];
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag))
    : text(item.category)
      ? [text(item.category)]
      : fallbackTags;
  return {
    ...fallback,
    ...item,
    title,
    image: text(item.image, text(fallback?.image)),
    tags,
    description: text(
      item.description,
      text(item.desc, text(item.productInfoDesc, text(fallback?.description))),
    ),
    slug: itemSlug(item) || slugifyHomeItem(title),
  };
};

const mapServiceToSlide = (item: RecordItem, fallback?: RecordItem) => {
  const title = text(
    item.title,
    text(item.productTitle, text(fallback?.productTitle, text(fallback?.title))),
  );
  const fallbackFeatures = Array.isArray(item.productFeatures)
    ? item.productFeatures
    : Array.isArray(fallback?.productFeatures)
      ? fallback.productFeatures
      : [];
  return {
    ...fallback,
    ...item,
    image: text(item.image, text(fallback?.image)),
    alt: text(item.alt, text(fallback?.alt, title)),
    productTitle: title,
    productSubtitle: text(
      item.productSubtitle,
      text(item.category, text(fallback?.productSubtitle, "Service")),
    ),
    productInfoTitle: text(item.productInfoTitle, title),
    productInfoDesc: text(
      item.productInfoDesc,
      text(item.desc, text(fallback?.productInfoDesc, text(fallback?.desc))),
    ),
    productFeatures: fallbackFeatures,
    productTotalPrice: text(
      item.productTotalPrice,
      text(fallback?.productTotalPrice),
    ),
    productShippingText: text(
      item.productShippingText,
      text(fallback?.productShippingText),
    ),
  };
};

const slidesToLibraryItems = (slides: RecordItem[]) =>
  slides.map((item, index) => ({
    ...item,
    title: text(item.title, text(item.productTitle)),
    desc: text(item.desc, text(item.productInfoDesc)),
    category: text(item.category, text(item.productSubtitle, "Service")),
    slug: itemSlug(item) || slugifyHomeItem(text(item.productTitle)),
    order: typeof item.order === "number" ? item.order : index + 1,
    active: item.active !== false,
  }));

/** Overlay manager library items onto home / listing skins without changing section chrome. */
export const overlayManagerHomeFeed = (
  section: SectionItem,
  sections: SectionItem[],
  pageLinks: PageLinkLike[] = [],
): Partial<SectionData> => {
  const data = readVariantData(section);
  const ownProducts = records(data.productItems).filter(
    (item) => item.active !== false,
  );
  const properties =
    ownProducts.length &&
    (isHomeFeedType(section, "PropertyPage", "PropertyPage-") ||
      isHomeFeedType(section, "BuyPropertyPage", "BuyPropertyPage-") ||
      isHomeFeedType(section, "RentPage", "RentPage-"))
      ? ownProducts
      : findLibraryItems(sections, "PropertyPage", "PropertyPage-");
  const projects =
    ownProducts.length && isHomeFeedType(section, "PortfolioPage", "PortfolioPage-")
      ? ownProducts
      : findLibraryItems(sections, "PortfolioPage", "PortfolioPage-");
  const blogPageItems = findLibraryItems(
    sections,
    "BlogPage",
    "BlogPage-",
    "blogItems",
  );
  const blogLibrary = blogPageItems.length
    ? blogPageItems
    : blogRecordsFromLinks(pageLinks);

  if (
    section.type === "Highlight" ||
    String(section.variant || "").startsWith("Highlight-")
  ) {
    const categories = mergeFeed(
      records(data.categories),
      properties,
      mapPropertyToListing,
      true,
    );
    return categories.length ? { categories } : {};
  }

  if (section.type === "Featured" || String(section.variant || "").startsWith("Featured-")) {
    const listings = mergeFeed(
      records(data.listings),
      properties,
      mapPropertyToListing,
      true,
    );
    return listings.length ? { listings } : {};
  }

  if (
    section.type === "LatestProject" ||
    String(section.variant || "").startsWith("LatestProject-")
  ) {
    const projectItems = mergeFeed(
      records(data.projectItems),
      projects,
      mapPortfolioToProject,
      true,
    );
    return projectItems.length ? { projectItems } : {};
  }

  if (section.type === "Cities" || String(section.variant || "").startsWith("Cities-")) {
    const cities = mergeFeed(
      records(data.cities),
      projects,
      mapPortfolioToCity,
      false,
    );
    return cities.length ? { cities } : {};
  }

  if (section.type === "Blog" && !section.page) {
    const localBlogs = records(data.blogs);
    const source = (blogLibrary.length ? blogLibrary : localBlogs).filter(
      isShownOnHome,
    );
    const blogItems = mergeFeed(
      records(data.blogItems),
      source,
      mapBlogToHomePost,
      true,
    );
    const eventBlogs = mapLibraryToLocalList(source, localBlogs, mapBlogToEventCard);
    const isEventBlog = String(section.variant || "").startsWith("Blog-9");
    if (isEventBlog) {
      if (eventBlogs.length) {
        return { blogs: eventBlogs, ...(blogItems.length ? { blogItems } : {}) };
      }
      if (localBlogs.length) return { blogs: localBlogs };
    }
    return blogItems.length ? { blogItems } : {};
  }

  if (
    isHomeFeedType(section, "BlogPage", "BlogPage-") &&
    ["", "blog", "blogs"].includes(String(section.page || "").trim().toLowerCase())
  ) {
    const localBlogs = records(data.blogs);
    const source = blogLibrary.length ? blogLibrary : localBlogs;
    const eventBlogs = mapLibraryToLocalList(source, localBlogs, mapBlogToEventCard);
    if (String(section.variant || "").startsWith("BlogPage-9") && eventBlogs.length) {
      return { blogs: eventBlogs };
    }
  }

  if (
    isHomeFeedType(section, "PropertyPage", "PropertyPage-") ||
    isHomeFeedType(section, "BuyPropertyPage", "BuyPropertyPage-") ||
    isHomeFeedType(section, "RentPage", "RentPage-")
  ) {
    const filtered = isHomeFeedType(section, "RentPage", "RentPage-")
      ? properties.filter(isRentItem)
      : isHomeFeedType(section, "BuyPropertyPage", "BuyPropertyPage-")
        ? properties.filter((item) => !isRentItem(item))
        : properties;
    const listings = mapLibraryToLocalList(
      filtered,
      records(data.listings),
      mapPropertyToListing,
    );
    return listings.length ? { listings } : {};
  }

  if (isHomeFeedType(section, "ServicePage", "ServicePage-")) {
    const localSlides = records(data.productSlides).length
      ? records(data.productSlides)
      : records(data.serviceSlides);
    const library = ownProducts.length
      ? ownProducts
      : findLibraryItems(sections, "ServicePage", "ServicePage-").length
        ? findLibraryItems(sections, "ServicePage", "ServicePage-")
        : slidesToLibraryItems(localSlides);
    const productSlides = mapLibraryToLocalList(
      library,
      localSlides,
      mapServiceToSlide,
    );
    const items = mapLibraryToLocalList(
      library,
      records(data.items),
      mapServiceToEventItem,
    );
    if (!productSlides.length && !items.length && !library.length) return {};
    return {
      ...(productSlides.length
        ? { productSlides, serviceSlides: productSlides }
        : {}),
      ...(library.length ? { productItems: library } : {}),
      ...(items.length ? { items } : {}),
    };
  }

  if (
    section.type === "Product" &&
    !section.page &&
    (String(section.variant || "").startsWith("Product-9") ||
      String(section.id || "") === "Product")
  ) {
    const localItems = records(data.items);
    const library = findLibraryItems(
      sections,
      "ServicePage",
      "ServicePage-",
    ).filter(isShownOnHome);
    const source = library.length ? library : localItems.filter(isShownOnHome);
    const items = mapLibraryToLocalList(
      source,
      localItems,
      mapServiceToEventItem,
    );
    if (!source.length && !items.length) return { items: [] };
    return {
      ...(source.length ? { productItems: source } : {}),
      items,
    };
  }

  if (isHomeFeedType(section, "PortfolioPage", "PortfolioPage-")) {
    const projectItems = mapLibraryToLocalList(
      projects,
      records(data.projectItems),
      mapPortfolioToProject,
    );
    return projectItems.length ? { projectItems } : {};
  }

  return {};
};

const upsertLibraryItems = (library: RecordItem[], incoming: RecordItem[]) => {
  const next = [...library];
  incoming.forEach((item, index) => {
    const slug = itemSlug(item);
    if (!slug) return;
    const matchIndex = next.findIndex((entry) => itemSlug(entry) === slug);
    if (matchIndex >= 0) {
      if (item.featured === true && next[matchIndex].featured !== true) {
        next[matchIndex] = { ...next[matchIndex], featured: true };
      }
      return;
    }
    next.push({
      id: text(item.id, `card-${slug}`),
      ...item,
      slug,
      title: text(item.title, text(item.name)),
      desc: text(item.desc, text(item.description)),
      active: item.active !== false,
      featured: item.featured === true,
      order: typeof item.order === "number" ? item.order : next.length + index + 1,
    });
  });
  return next;
};

const patchLibrarySection = (
  sections: SectionItem[],
  type: string,
  variantPrefix: string,
  incoming: RecordItem[],
): SectionItem[] => {
  if (!incoming.length) return sections;
  return sections.map((section) => {
    if (!isHomeFeedType(section, type, variantPrefix)) return section;
    const current = readVariantData(section);
    const existing = records(current.productItems).length
      ? records(current.productItems)
      : records(current.listings).length
        ? records(current.listings)
        : records(current.projectItems);
    const merged = upsertLibraryItems(existing, incoming);
    return {
      ...section,
      data: {
        ...section.data,
        [section.variant]: {
          ...current,
          productItems: merged,
        },
      },
    };
  });
};

/** Copy home / listing cards into Property / Portfolio libraries so Manager can edit them. */
export const syncHomeCardsIntoManagers = (sections: SectionItem[]): SectionItem[] => {
  const featured = sections.find((section) => section.type === "Featured");
  const latest = sections.find((section) => section.type === "LatestProject");
  const cities = sections.find((section) => section.type === "Cities");
  const propertyPage = sections.find((section) =>
    isHomeFeedType(section, "PropertyPage", "PropertyPage-"),
  );
  const portfolioPage = sections.find((section) =>
    isHomeFeedType(section, "PortfolioPage", "PortfolioPage-"),
  );
  const servicePage = sections.find((section) =>
    isHomeFeedType(section, "ServicePage", "ServicePage-"),
  );

  let next = sections;
  next = patchLibrarySection(next, "PropertyPage", "PropertyPage-", [
    ...records(readVariantData(propertyPage).listings),
    ...records(readVariantData(featured).listings).map((item) => ({
      ...item,
      desc: text(item.desc, text(item.description)),
      listingType: listingBadge(item).toLowerCase().includes("rent")
        ? "rent"
        : "sale",
      featured: true,
    })),
  ]);
  next = patchLibrarySection(next, "PortfolioPage", "PortfolioPage-", [
    ...records(readVariantData(portfolioPage).projectItems),
    ...records(readVariantData(latest).projectItems).map((item) => ({
      ...item,
      featured: true,
    })),
    ...records(readVariantData(cities).cities).map((item) => ({
      ...item,
      title: text(item.title, text(item.name)),
    })),
  ]);
  const serviceData = readVariantData(servicePage);
  const productHome = sections.find(
    (section) => section.type === "Product" && !section.page,
  );
  const productHomeData = readVariantData(productHome);
  const eventItemsToLibrary = (value: unknown) =>
    records(value).map((item, index) => {
      const tags = Array.isArray(item.tags)
        ? item.tags.map((tag) => String(tag))
        : [];
      const title = text(item.title);
      return {
        ...item,
        title,
        image: text(item.image),
        desc: text(item.desc, text(item.description, tags.join(", "))),
        category: text(item.category, tags[0] || "Service"),
        slug: itemSlug(item) || slugifyHomeItem(title) || `service-${index + 1}`,
        active: item.active !== false,
      };
    });
  next = patchLibrarySection(next, "ServicePage", "ServicePage-", [
    ...records(serviceData.productItems),
    ...eventItemsToLibrary(serviceData.items),
    ...eventItemsToLibrary(productHomeData.items),
    ...records(productHomeData.productItems),
    ...slidesToLibraryItems(records(serviceData.productSlides)),
    ...slidesToLibraryItems(records(serviceData.serviceSlides)),
  ]);
  return next;
};
