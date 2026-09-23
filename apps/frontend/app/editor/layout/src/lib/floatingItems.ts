export type FloatingItemId = "whatsapp" | "call" | "backToTop" | string;

export type FloatingItemIcon =
  | "whatsapp"
  | "phone"
  | "arrow-up"
  | "chevron-up"
  | "chevrons-up"
  | "circle-arrow-up"
  | "mail"
  | "message"
  | "external-link";

export type FloatingItemSide = "left" | "right";

export type FloatingItemData = {
  id: FloatingItemId;
  label: string;
  href?: string;
  icon: FloatingItemIcon;
  active: boolean;
  side: FloatingItemSide;
};

export const FLOATING_ITEM_ICON_OPTIONS: Array<{
  value: FloatingItemIcon;
  label: string;
}> = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone" },
  { value: "arrow-up", label: "Arrow up" },
  { value: "chevron-up", label: "Chevron up" },
  { value: "chevrons-up", label: "Double chevron up" },
  { value: "circle-arrow-up", label: "Circle arrow up" },
  { value: "mail", label: "Mail" },
  { value: "message", label: "Message" },
  { value: "external-link", label: "External link" },
];

const BACK_TO_TOP_ICONS: FloatingItemIcon[] = [
  "arrow-up",
  "chevron-up",
  "chevrons-up",
  "circle-arrow-up",
];

const WHATSAPP_ICONS: FloatingItemIcon[] = ["whatsapp", "message"];
const CALL_ICONS: FloatingItemIcon[] = ["phone", "message"];
const GENERIC_ICONS: FloatingItemIcon[] = [
  "external-link",
  "mail",
  "message",
  "phone",
  "whatsapp",
  "arrow-up",
];

export const getFloatingItemIconOptions = (itemId: string) => {
  const allowed =
    itemId === "backToTop"
      ? BACK_TO_TOP_ICONS
      : itemId === "whatsapp"
        ? WHATSAPP_ICONS
        : itemId === "call"
          ? CALL_ICONS
          : GENERIC_ICONS;

  return FLOATING_ITEM_ICON_OPTIONS.filter((option) =>
    allowed.includes(option.value),
  );
};

export const DEFAULT_WHATSAPP_LINK =
  "https://api.whatsapp.com/send?phone=962786336414";
export const DEFAULT_CALL_LINK = "tel:+919876543210";

const DEFAULT_FLOATING_ITEMS: FloatingItemData[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: DEFAULT_WHATSAPP_LINK,
    icon: "whatsapp",
    active: true,
    side: "left",
  },
  {
    id: "call",
    label: "Call",
    href: DEFAULT_CALL_LINK,
    icon: "phone",
    active: true,
    side: "left",
  },
  {
    id: "backToTop",
    label: "Back to top",
    href: "",
    icon: "arrow-up",
    active: true,
    side: "right",
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeIcon = (
  value: unknown,
  itemId: string,
  fallback: FloatingItemIcon,
): FloatingItemIcon => {
  const icon = typeof value === "string" ? value : "";
  const allowed = getFloatingItemIconOptions(itemId).map((option) => option.value);
  if (allowed.includes(icon as FloatingItemIcon)) {
    return icon as FloatingItemIcon;
  }
  return fallback;
};

const normalizeFloatingItem = (
  item: unknown,
  index: number,
): FloatingItemData | null => {
  if (!isRecord(item)) return null;
  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id.trim()
      : `floating-${index + 1}`;
  const label =
    typeof item.label === "string" && item.label.trim()
      ? item.label.trim()
      : id === "backToTop"
        ? "Back to top"
        : id === "whatsapp"
          ? "WhatsApp"
          : id === "call"
            ? "Call"
            : `Item ${index + 1}`;
  const defaultIcon: FloatingItemIcon =
    id === "whatsapp"
      ? "whatsapp"
      : id === "call"
        ? "phone"
        : id === "backToTop"
          ? "arrow-up"
          : "external-link";

  return {
    id,
    label,
    href: typeof item.href === "string" ? item.href : "",
    icon: normalizeIcon(item.icon, id, defaultIcon),
    active: item.active !== false,
    side: item.side === "right" ? "right" : "left",
  };
};

export const getFloatingItems = (
  footerData?: {
    floatingItems?: unknown;
    whatsappLink?: string;
    callLink?: string;
  } | null,
): FloatingItemData[] => {
  const rawItems = footerData?.floatingItems;
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems
      .map((item, index) => normalizeFloatingItem(item, index))
      .filter((item): item is FloatingItemData => Boolean(item));
  }

  const whatsappHref =
    typeof footerData?.whatsappLink === "string" ? footerData.whatsappLink : "";
  const callHref =
    typeof footerData?.callLink === "string" ? footerData.callLink : "";

  return [
    {
      ...DEFAULT_FLOATING_ITEMS[0],
      href: whatsappHref || DEFAULT_WHATSAPP_LINK,
      active: Boolean(whatsappHref),
    },
    {
      ...DEFAULT_FLOATING_ITEMS[1],
      href: callHref || DEFAULT_CALL_LINK,
      active: Boolean(callHref),
    },
    { ...DEFAULT_FLOATING_ITEMS[2] },
  ];
};

export const syncLegacyFloatingLinks = (items: FloatingItemData[]) => {
  const whatsapp = items.find((item) => item.id === "whatsapp");
  const call = items.find((item) => item.id === "call");

  return {
    whatsappLink:
      whatsapp && whatsapp.active && whatsapp.href.trim()
        ? whatsapp.href.trim()
        : "",
    callLink:
      call && call.active && call.href.trim() ? call.href.trim() : "",
  };
};

export const getActiveFloatingItems = (
  footerData?: {
    floatingItems?: unknown;
    whatsappLink?: string;
    callLink?: string;
  } | null,
) => getFloatingItems(footerData).filter((item) => item.active);
