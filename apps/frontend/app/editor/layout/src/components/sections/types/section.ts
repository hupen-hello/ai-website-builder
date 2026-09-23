import type { ComponentType } from "react";

export type SectionType =
  | "banner"
  | "about"
  | "header"
  | "footer"
  | "product"
  | "topbar"
  | "testimonial";

export type MenuItem = {
  label: string;
  href: string;
  children?: MenuItem[];
  menuType?: "link" | "dropdown" | "mega";
};

export type BlockBase = {
  id: string;
  role?: string;
};

export type TextBlock = BlockBase & {
  type: "text";
  content: string;
};

export type ImageBlock = BlockBase & {
  type: "image";
  src: string;
  alt?: string;
  title?: string;
  fill?: boolean;
  priority?: boolean;
};

export type VideoBlock = BlockBase & {
  type: "video";
  src: string;
  poster?: string;
};

export type ButtonBlock = BlockBase & {
  type: "button";
  label: string;
  href: string;
  variant?: "primary" | "secondary";
  icon?: "none" | "arrow-right" | "arrow-left" | "plus" | "phone" | "mail" | "external-link";
  iconPosition?: "before" | "after";
  openInNewTab?: boolean;
};

export type SliderBlock = BlockBase & {
  type: "slider";
  items: Block[];
};

export type CarouselBlock = BlockBase & {
  type: "carousel";
  items: Block[];
};

export type CardBlock = BlockBase & {
  type: "card";
  title?: string;
  category?: string;
  desc?: string;
  image?: string;
  alt?: string;
  link?: string;
  blocks?: Block[];
};

export type ListBlock = BlockBase & {
  type: "list";
  title?: string;
  items: Array<string | MenuItem>;
};

export type MenuBlock = BlockBase & {
  type: "menu";
  items: MenuItem[];
};

export type LogoBlock = BlockBase & {
  type: "logo";
  text: string;
  href: string;
};

export type Block =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | ButtonBlock
  | SliderBlock
  | CarouselBlock
  | CardBlock
  | ListBlock
  | MenuBlock
  | LogoBlock;

export type BlockSection = {
  id: string;
  type: SectionType;
  layoutId: string;
  blocks: Block[];
};

export type LayoutComponentProps = {
  section?: BlockSection;
  blocks?: Block[];
  data?: Record<string, unknown>;
};

export type LayoutComponent = ComponentType<LayoutComponentProps>;

export const getBlocksByType = <T extends Block["type"]>(
  blocks: readonly Block[] | readonly { type: string }[],
  type: T,
) =>
  (blocks as Block[]).filter(
    (block): block is Extract<Block, { type: T }> => block.type === type,
  );

export const getBlock = <T extends Block["type"]>(
  blocks: readonly Block[] | readonly { type: string }[],
  type: T,
  role?: string,
) =>
  (blocks as Block[]).find(
    (block): block is Extract<Block, { type: T }> =>
      block.type === type && (!role || block.role === role),
  );

export const getTextBlockByRole = (
  blocks: readonly Block[] | readonly { type: string }[],
  role: string,
) => getBlock(blocks, "text", role);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const toMenuItems = (value: unknown): MenuItem[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((item) => {
        const menuType =
          item.menuType === "dropdown" || item.menuType === "mega"
            ? item.menuType
            : item.menuType === "link"
              ? "link"
              : undefined;
        const children = toMenuItems(item.children);
        return {
          label: toStringValue(item.label) ?? "",
          href: toStringValue(item.href) ?? "#",
          menuType:
            menuType ??
            (children.length ? ("dropdown" as const) : ("link" as const)),
          children: children.length ? children : undefined,
        };
      })
    : [];

export const legacyDataToBlocks = (data?: Record<string, unknown>): Block[] => {
  if (!data) return [];

  const blocks: Block[] = [];
  const pushText = (role: string, content: unknown) => {
    const value = toStringValue(content);
    if (value) blocks.push({ id: `${role}-text`, type: "text", role, content: value });
  };

  pushText("announcement", Array.isArray(data.text) ? data.text.join(" ") : data.text);
  pushText("pretitle", data.pretitle);
  pushText("heading", data.title ?? data.productTitle ?? data.productSectionTitle);
  pushText("subheading", data.subtitle ?? data.productSubtitle);
  pushText("paragraph", data.desc ?? data.productInfoDesc);
  pushText("paragraph-secondary", data.desc2 ?? data.philosophyDesc);
  pushText("philosophy-heading", data.philosophyTitle);
  pushText("phone", data.phone);
  pushText("email", data.email);
  pushText("location", data.location);
  pushText("price", data.productTotalPrice);
  pushText("shipping", data.productShippingText);

  const logo = toStringValue(data.logo);
  if (logo) blocks.push({ id: "logo", type: "logo", text: logo, href: "/" });

  const logoImage = toStringValue(data.logoImage);
  if (logoImage) {
    blocks.push({
      id: "image-logo",
      type: "image",
      role: "logo",
      src: logoImage,
      alt: toStringValue(data.logoImageTitle) ?? logo ?? "",
    });
  }

  const menu = toMenuItems(data.menu);
  if (menu.length) blocks.push({ id: "menu", type: "menu", items: menu });

  const buttons = Array.isArray(data.buttons) ? data.buttons : [];
  buttons.filter(isRecord).forEach((button, index) => {
    const label = toStringValue(button.label);
    if (!label) return;

    blocks.push({
      id: `button-${index + 1}`,
      type: "button",
      label,
      href: toStringValue(button.href) ?? "#",
      variant: button.variant === "secondary" ? "secondary" : "primary",
      icon:
        button.icon === "arrow-right" ||
        button.icon === "arrow-left" ||
        button.icon === "plus" ||
        button.icon === "phone" ||
        button.icon === "mail" ||
        button.icon === "external-link"
          ? button.icon
          : "none",
      iconPosition: button.iconPosition === "before" ? "before" : "after",
      openInNewTab: button.openInNewTab === true,
    });
  });

  const backgroundImage = toStringValue(data.backgroundImage);
  if (backgroundImage) {
    blocks.push({
      id: "image-background",
      type: "image",
      role: "background",
      src: backgroundImage,
      alt: toStringValue(data.backgroundImageTitle) ?? "",
      fill: true,
    });
  }

  const sideImage = toStringValue(data.sideImage);
  if (sideImage) {
    blocks.push({
      id: "image-side",
      type: "image",
      role: "side",
      src: sideImage,
      alt: toStringValue(data.sideImageTitle) ?? "",
      fill: true,
    });
  }

  const backgroundVideo = toStringValue(data.backgroundVideo);
  if (backgroundVideo) {
    blocks.push({ id: "video-background", type: "video", role: "background", src: backgroundVideo });
  }

  const bannerSlides = Array.isArray(data.bannerSlides) ? data.bannerSlides : [];
  if (bannerSlides.length) {
    blocks.push({
      id: "banner-slider",
      type: "carousel",
      role: "banner-slider",
      items: bannerSlides.filter(isRecord).map((slide, index) => {
        const button = isRecord(slide.button) ? slide.button : undefined;
        const buttonLabel = button ? toStringValue(button.label) : undefined;
        const buttonHref = button ? toStringValue(button.href) : undefined;

        return {
          id: `banner-slide-${index + 1}`,
          type: "card",
          role: "slide",
          title: toStringValue(slide.title),
          desc: toStringValue(slide.desc),
          image: toStringValue(slide.image),
          alt: toStringValue(slide.alt),
          blocks:
            buttonLabel || buttonHref
              ? [
                  {
                    id: `banner-slide-button-${index + 1}`,
                    type: "button",
                    label: buttonLabel ?? "",
                    href: buttonHref ?? "#",
                    variant: button?.variant === "secondary" ? "secondary" : "primary",
                  },
                ]
              : undefined,
        };
      }),
    });
  }

  const productItems = Array.isArray(data.productItems) ? data.productItems : [];
  productItems.filter(isRecord).forEach((card, index) => {
    blocks.push({
      id: `card-${index + 1}`,
      type: "card",
      title: toStringValue(card.title),
      category: toStringValue(card.category),
      desc: toStringValue(card.desc),
      image: toStringValue(card.image),
      alt: toStringValue(card.alt) ?? toStringValue(card.imageTitle),
      link: toStringValue(card.link),
    });
  });

  const productSlides = Array.isArray(data.serviceSlides)
    ? data.serviceSlides
    : Array.isArray(data.productSlides)
      ? data.productSlides
      : [];
  productSlides.filter(isRecord).forEach((slide, index) => {
    blocks.push({
      id: `slide-card-${index + 1}`,
      type: "card",
      role: "slide",
      title: toStringValue(slide.productTitle),
      category: toStringValue(slide.productSubtitle),
      desc: toStringValue(slide.productInfoDesc),
      image: toStringValue(slide.image),
      alt: toStringValue(slide.alt),
      link: toStringValue(slide.link),
    });
  });

  const features = Array.isArray(data.productFeatures) ? data.productFeatures : [];
  if (features.length) {
    blocks.push({
      id: "features",
      type: "list",
      role: "features",
      items: features.filter(isRecord).map((item) => ({
        label: toStringValue(item.label) ?? "",
        href: toStringValue(item.price) ?? "",
      })),
    });
  }

  const footerColumns = Array.isArray(data.footerColumns) ? data.footerColumns : [];
  footerColumns
    .filter(isRecord)
    .filter((column) => column.hidden !== true)
    .forEach((column, index) => {
      const links = Array.isArray(column.links)
        ? column.links.filter(
            (link) => isRecord(link) && link.hidden !== true,
          )
        : [];
      blocks.push({
        id: `footer-column-${index + 1}`,
        type: "list",
        role: "footer-column",
        title: toStringValue(column.title),
        items: toMenuItems(links),
      });
    });

  const footerLegalLinks = Array.isArray(data.footerLegalLinks)
    ? data.footerLegalLinks
    : [];
  if (footerLegalLinks.length) {
    blocks.push({
      id: "footer-legal",
      type: "list",
      role: "legal",
      items: toMenuItems(footerLegalLinks),
    });
  }

  const footerSocialLinks = Array.isArray(data.footerSocialLinks)
    ? data.footerSocialLinks
    : Array.isArray(data.socialLinks)
      ? data.socialLinks
      : [];
  footerSocialLinks.filter(isRecord).forEach((social, index) => {
    const label = toStringValue(social.label);
    if (!label) return;

    blocks.push({
      id: `social-button-${index + 1}`,
      type: "button",
      role: "social",
      label,
      href: toStringValue(social.href) ?? "#",
    });
  });

  return blocks;
};

export const resolveSectionBlocks = ({
  blocks,
  data,
}: {
  blocks?: Block[];
  data?: Record<string, unknown>;
}) => {
  const base = blocks?.length ? blocks : legacyDataToBlocks(data);
  // data.menu is the live source of truth (AI / nav editor). Overlay it onto
  // any stored menu block so stale blocks cannot hide submenu updates.
  if (!data || !Array.isArray(data.menu)) return base;
  const menuFromData = toMenuItems(data.menu);
  let found = false;
  const next = base.map((block) => {
    if (block.type !== "menu") return block;
    found = true;
    return { ...block, items: menuFromData };
  });
  // Even an empty menu must overlay — otherwise deleted items remain in blocks.
  if (found) return next;
  if (!menuFromData.length) return base;
  return [...next, { id: "menu", type: "menu", items: menuFromData }];
};
