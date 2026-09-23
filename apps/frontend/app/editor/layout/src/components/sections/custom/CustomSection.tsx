"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignVerticalSpaceBetween,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Columns,
  Copy,
  Ellipsis,
  ExternalLink,
  GripVertical,
  Images,
  Image as ImageIcon,
  Mail,
  Link2,
  Monitor,
  MoveHorizontal,
  Pencil,
  Phone,
  Plus,
  Minus,
  Bold,
  RectangleHorizontal,
  RotateCcw,
  Rows,
  Smartphone,
  StretchVertical,
  Table2,
  Tablet,
  Text,
  Trash2,
  Sparkles,
  Loader2,
  Upload,
  X,
  CircleHelp,
  ChevronDown,
  Heading2,
  Quote,
  Star,
  Settings,
} from "lucide-react";
import type { SectionProps } from "../../../types/section";
import { getCustomSectionLayout } from "../../../data/customSectionLayouts";
import CustomSectionRichTextEditor from "./CustomSectionRichTextEditor";
import ImageLibraryPicker from "../../builder/ImageLibraryPicker";
import { isEditorCorePlanActive } from "@/lib/userPlan";
import { rememberEditorForAuthCancel, buildPlanPageUrl } from "@/lib/authReturn";
import { resolveEditorSiteId } from "@/lib/migrateGuestSite";
import { useOptionalUserAuth } from "@/components/auth/UserAuthContext";
import { useRouter } from "next/navigation";

type TableCellAlign = "left" | "center" | "right";
type TableCell = {
  text: string;
  align?: TableCellAlign;
  bold?: boolean;
  color?: string;
};
type TableCellInput = string | TableCell;

type SliderSlide = {
  id: string;
  src: string;
  alt?: string;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type TestimonialItem = {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string;
  rating: number;
};

type CustomElement = {
  id: string;
  type: "text" | "image" | "button" | "table" | "slider" | "faq" | "heading" | "testimonial";
  value?: string;
  src?: string;
  rows?: TableCellInput[][];
  href?: string;
  align?: "left" | "center" | "right";
  imageStyle?: "cover" | "full" | "no-repeat";
  imageFullWidth?: boolean;
  imageBorderRadius?: number;
  imageBorderWidth?: number;
  imageBorderColor?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  slides?: SliderSlide[];
  sliderAutoplay?: boolean;
  sliderHeight?: number;
  /** How many cards visible at once: 1 = single, 2/3/4 = multi-card row. */
  sliderCardsPerView?: 1 | 2 | 3 | 4;
  /** When true, click on slide opens a full-screen popup. */
  sliderPopupOnClick?: boolean;
  faqItems?: FaqItem[];
  testimonialItems?: TestimonialItem[];
  /** Testimonial display: grid cards or sliding carousel. */
  testimonialLayout?: "grid" | "slider";
  /** Cards visible at once in testimonial grid/slider. */
  testimonialCardsPerView?: 1 | 2 | 3;
  /** Cards visible on mobile viewport. */
  testimonialMobileCardsPerView?: 1 | 2 | 3;
  /** Inner padding (px) for each testimonial card. */
  testimonialCardPadding?: number;
  /** Slider navigation style. */
  testimonialNav?: "arrow" | "bullet" | "both";
  /** Auto-advance testimonial slider. */
  testimonialAutoplay?: boolean;
  fontSize?: number;
  textColor?: string;
  /** Heading widget level: 1–6 (H1–H6). */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  tableBackgroundColor?: string;
  tableContentColor?: string;
  tablePadding?: number;
  tableMargin?: number;
  tableRowPadding?: number;
  tableColumnPadding?: number;
  tableCellPadding?: number;
  icon?: "none" | "arrow-right" | "arrow-left" | "plus" | "phone" | "mail" | "external-link";
  iconPosition?: "before" | "after";
  openInNewTab?: boolean;
  buttonVariant?: "primary" | "secondary";
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonHoverBackgroundColor?: string;
  buttonHoverTextColor?: string;
  buttonBorderRadius?: number;
};

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    question: "What is included?",
    answer: "Share a short answer about what customers get with this offer.",
  },
  {
    id: "faq-2",
    question: "How do I get started?",
    answer: "Explain the first step so visitors know exactly what to do next.",
  },
  {
    id: "faq-3",
    question: "Can I contact support?",
    answer: "Tell people how to reach you for help, booking, or more details.",
  },
];

const DEFAULT_TESTIMONIAL_ITEMS: TestimonialItem[] = [
  {
    id: "testimonial-1",
    name: "Aarav Mehta",
    role: "Founder, Studio North",
    quote:
      "The site made our work easier to understand and brought in better leads within the first week.",
    image: "/bg1.jpg",
    rating: 5,
  },
  {
    id: "testimonial-2",
    name: "Neha Kapoor",
    role: "Marketing Lead",
    quote:
      "Clean sections, fast pages, and the editor keeps the content simple for our whole team.",
    image: "/bg1.jpg",
    rating: 5,
  },
];

const DEFAULT_SLIDER_SLIDES: SliderSlide[] = [
  { id: "slide-1", src: "/bg1.jpg", alt: "Slide 1" },
  { id: "slide-2", src: "/bg1.jpg", alt: "Slide 2" },
  { id: "slide-3", src: "/bg1.jpg", alt: "Slide 3" },
];

type ColumnLayoutPreset = "column" | "row";
type ColumnContentAlignH = "left" | "center" | "right" | "stretch";
type ColumnContentAlignV = "top" | "center" | "bottom" | "between" | "stretch";
type ColumnSpacing = { top: number; right: number; bottom: number; left: number };
type ResponsiveDevice = "desktop" | "tablet" | "mobile";
type ResponsiveSpacing = Record<ResponsiveDevice, ColumnSpacing>;
type ColumnPanelTab = "layout" | "style" | "spacing" | "size";

const DEFAULT_COLUMN_PADDING: ColumnSpacing = { top: 16, right: 16, bottom: 16, left: 16 };
const DEFAULT_SECTION_PADDING: ColumnSpacing = { top: 48, right: 16, bottom: 48, left: 16 };
const DEFAULT_SECTION_MARGIN: ColumnSpacing = { top: 0, right: 0, bottom: 0, left: 0 };
/** Comfortable spacing restored by "Reset Section Spacing". */
const RESET_SECTION_PADDING: ResponsiveSpacing = {
  desktop: { top: 48, right: 16, bottom: 48, left: 16 },
  tablet: { top: 40, right: 16, bottom: 40, left: 16 },
  mobile: { top: 32, right: 16, bottom: 32, left: 16 },
};

const RESPONSIVE_DEVICE_OPTIONS = [
  { key: "desktop" as const, label: "Desktop", icon: Monitor },
  { key: "tablet" as const, label: "Tablet", icon: Tablet },
  { key: "mobile" as const, label: "Mobile", icon: Smartphone },
];

const isLegacySpacing = (value: unknown): value is ColumnSpacing =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  typeof (value as Record<string, unknown>).top === "number";

const parseSpacingSides = (
  record: Record<string, unknown>,
  fallback: ColumnSpacing,
): ColumnSpacing => ({
  top: typeof record.top === "number" ? record.top : fallback.top,
  right: typeof record.right === "number" ? record.right : fallback.right,
  bottom: typeof record.bottom === "number" ? record.bottom : fallback.bottom,
  left: typeof record.left === "number" ? record.left : fallback.left,
});

const parseResponsiveSpacing = (
  value: unknown,
  fallback: ColumnSpacing,
): ResponsiveSpacing => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    const base = { ...fallback };
    return { desktop: base, tablet: { ...base }, mobile: { ...base } };
  }
  const record = value as Record<string, unknown>;
  if (isLegacySpacing(record)) {
    const legacy = parseSpacingSides(record, fallback);
    return { desktop: legacy, tablet: { ...legacy }, mobile: { ...legacy } };
  }
  const desktop = parseSpacingSides(
    (record.desktop as Record<string, unknown>) || {},
    fallback,
  );
  return {
    desktop,
    tablet: parseSpacingSides(
      (record.tablet as Record<string, unknown>) || {},
      desktop,
    ),
    mobile: parseSpacingSides(
      (record.mobile as Record<string, unknown>) || {},
      desktop,
    ),
  };
};

const serializeResponsiveSpacing = (spacing: ResponsiveSpacing) => ({
  desktop: spacing.desktop,
  tablet: spacing.tablet,
  mobile: spacing.mobile,
});

const buildResponsiveSpacingCss = (
  className: string,
  padding: ResponsiveSpacing,
  margin: ResponsiveSpacing,
) => {
  const block = (pad: ColumnSpacing, mar: ColumnSpacing) =>
    `padding:${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px;margin:${mar.top}px ${mar.right}px ${mar.bottom}px ${mar.left}px;`;
  return [
    `.${className}{${block(padding.desktop, margin.desktop)}}`,
    `@media (max-width:1023px){.${className}{${block(padding.tablet, margin.tablet)}}}`,
    `@media (max-width:767px){.${className}{${block(padding.mobile, margin.mobile)}}}`,
  ].join("");
};

type CustomColumn = {
  id: string;
  elements?: CustomElement[];
  layoutPreset?: ColumnLayoutPreset;
  contentAlignH?: ColumnContentAlignH;
  contentAlignV?: ColumnContentAlignV;
  backgroundColor?: string;
  backgroundImage?: string;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
  elementGap?: number;
  padding?: ColumnSpacing;
  widthPercent?: number;
};
type Selection =
  | { kind: "section" }
  | { kind: "column"; columnIndex: number }
  | { kind: "element"; columnIndex: number; elementId: string; elementType: CustomElement["type"] }
  | null;

const buttonIcons = {
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  plus: Plus,
  phone: Phone,
  mail: Mail,
  "external-link": ExternalLink,
};

const toolbarButton =
  "flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30";

/** Theme tokens — custom sections inherit Theme Color / Theme Fonts. */
const THEME_FONT_BODY = "var(--font-body)";
const THEME_FONT_HEADING = "var(--font-heading)";
const THEME_FONT_BUTTON = "var(--font-button, var(--font-body))";
const THEME_PRIMARY_BG = "var(--primary-bg)";
const THEME_PRIMARY_TEXT = "var(--primary-text)";
const THEME_SECONDARY_BG = "var(--secondary-bg)";
const THEME_SECONDARY_TEXT = "var(--secondary-text)";

const normalizeColorToken = (value?: string) => (value || "").trim().toLowerCase();

/** Default surface colors that should follow Theme Color → Secondary. */
const isThemeLinkedSurface = (value?: string) => {
  const v = normalizeColorToken(value);
  return (
    !v ||
    v === "#ffffff" ||
    v === "#fff" ||
    v === "white" ||
    v === THEME_SECONDARY_BG
  );
};

/** Default body text colors that should follow Theme Color → Secondary text. */
const isThemeLinkedText = (value?: string) => {
  const v = normalizeColorToken(value);
  return (
    !v ||
    v === "#0f172a" ||
    v === "#000000" ||
    v === "#000" ||
    v === THEME_SECONDARY_TEXT
  );
};

const resolveThemeSurface = (value?: string) =>
  isThemeLinkedSurface(value) ? THEME_SECONDARY_BG : (value as string);

const resolveThemeText = (value?: string) =>
  isThemeLinkedText(value) ? THEME_SECONDARY_TEXT : (value as string);

const isThemeLinkedButtonBg = (value?: string) => {
  const v = normalizeColorToken(value);
  return !v || v === THEME_PRIMARY_BG;
};

const isThemeLinkedButtonText = (value?: string) => {
  const v = normalizeColorToken(value);
  return !v || v === THEME_PRIMARY_TEXT;
};

const getButtonAppearanceStyle = (element: CustomElement): CSSProperties => {
  const variant = element.buttonVariant ?? "primary";
  const borderRadius = element.buttonBorderRadius ?? 8;
  const backgroundColor = isThemeLinkedButtonBg(element.buttonBackgroundColor)
    ? THEME_PRIMARY_BG
    : element.buttonBackgroundColor || THEME_PRIMARY_BG;
  const textColor = isThemeLinkedButtonText(element.buttonTextColor)
    ? THEME_PRIMARY_TEXT
    : element.buttonTextColor || THEME_PRIMARY_TEXT;

  const hoverBackground =
    element.buttonHoverBackgroundColor?.trim() ||
    (variant === "secondary" ? backgroundColor : textColor);
  const hoverText =
    element.buttonHoverTextColor?.trim() ||
    (variant === "secondary" ? THEME_PRIMARY_TEXT : backgroundColor);

  const base: CSSProperties & Record<string, string | number> = {
    fontFamily: THEME_FONT_BUTTON,
    borderRadius,
    ["--btn-hover-bg"]: hoverBackground,
    ["--btn-hover-text"]: hoverText,
  };

  if (variant === "secondary") {
    return {
      ...base,
      backgroundColor: "transparent",
      color: isThemeLinkedButtonText(element.buttonTextColor)
        ? THEME_PRIMARY_BG
        : element.buttonTextColor || THEME_PRIMARY_BG,
      border: `2px solid ${backgroundColor}`,
    };
  }

  return {
    ...base,
    backgroundColor,
    color: textColor,
  };
};

/** Hex for `<input type="color">` when the live value is a CSS variable. */
const colorInputValue = (value?: string, fallback = "#ffffff") => {
  const v = (value || "").trim();
  return /^#[0-9a-f]{3,8}$/i.test(v) ? v : fallback;
};

const rgbToHex = (color: string) => {
  const trimmed = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  const match = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
  );
  if (!match) return "";
  const toHex = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
};

/** Resolve theme CSS vars (or hex) to a color-input-safe hex from the live site theme root. */
const resolveLiveThemeHex = (value: string | undefined, fallback: string) => {
  const direct = colorInputValue(value, "");
  if (direct) return direct;
  if (typeof document === "undefined") return fallback;
  const root =
    document.querySelector<HTMLElement>("[data-site-theme-root]") ||
    document.documentElement;
  const token = (value || "").trim() || fallback;
  const probe = document.createElement("span");
  probe.style.color = token;
  probe.style.display = "none";
  root.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return rgbToHex(computed) || fallback;
};


const defaultTextValue = "Click this text to edit your content.";
const DEFAULT_TABLE_ROWS: TableCell[][] = [
  [{ text: "Heading" }, { text: "Value" }],
  [{ text: "Item" }, { text: "Detail" }],
];

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const normalizeTableCell = (cell: TableCellInput | undefined | null): TableCell => {
  if (typeof cell === "string") return { text: cell };
  if (cell && typeof cell === "object") {
    return {
      text: typeof cell.text === "string" ? cell.text : "",
      align: cell.align === "center" || cell.align === "right" ? cell.align : "left",
      bold: cell.bold === true,
      color: typeof cell.color === "string" && cell.color ? cell.color : "#0f172a",
    };
  }
  return { text: "" };
};

const getTableRows = (rows?: TableCellInput[][]): TableCell[][] =>
  Array.isArray(rows) && rows.length > 0
    ? rows.map((row) =>
        Array.isArray(row) && row.length > 0
          ? row.map((cell) => normalizeTableCell(cell))
          : [{ text: "" }],
      )
    : structuredClone(DEFAULT_TABLE_ROWS);

const emptyTableCell = (): TableCell => ({
  text: "",
  align: "left",
  bold: false,
  color: "#0f172a",
});

const getTableCellStyle = (cell: TableCell): CSSProperties => ({
  textAlign: cell.align ?? "left",
  fontWeight: cell.bold ? 700 : undefined,
  color: resolveThemeText(cell.color),
});

const getTableWrapperStyle = (element: CustomElement): CSSProperties => ({
  margin: element.tableMargin ?? 0,
});

const getTableElementStyle = (element: CustomElement): CSSProperties => ({
  backgroundColor: resolveThemeSurface(element.tableBackgroundColor),
  padding: element.tablePadding ?? 0,
  boxSizing: "border-box",
});

const getTableTdStyle = (element: CustomElement, cell: TableCell): CSSProperties => {
  const cellPadding = element.tableCellPadding ?? 8;
  const rowPadding = element.tableRowPadding ?? 0;
  const columnPadding = element.tableColumnPadding ?? 0;
  return {
    ...getTableCellStyle(cell),
    color: resolveThemeText(element.tableContentColor || cell.color),
    paddingTop: cellPadding + rowPadding,
    paddingBottom: cellPadding + rowPadding,
    paddingLeft: cellPadding + columnPadding,
    paddingRight: cellPadding + columnPadding,
  };
};

function TableStylePanelEditor({
  backgroundColor,
  contentColor,
  padding,
  margin,
  rowPadding,
  columnPadding,
  cellPadding,
  onBackgroundColorChange,
  onContentColorChange,
  onPaddingChange,
  onMarginChange,
  onRowPaddingChange,
  onColumnPaddingChange,
  onCellPaddingChange,
}: {
  backgroundColor?: string;
  contentColor?: string;
  padding?: number;
  margin?: number;
  rowPadding?: number;
  columnPadding?: number;
  cellPadding?: number;
  onBackgroundColorChange: (color: string) => void;
  onContentColorChange: (color: string) => void;
  onPaddingChange: (value: number) => void;
  onMarginChange: (value: number) => void;
  onRowPaddingChange: (value: number) => void;
  onColumnPaddingChange: (value: number) => void;
  onCellPaddingChange: (value: number) => void;
}) {
  const currentBg = backgroundColor || "#ffffff";
  const currentContentColor = contentColor || "#0f172a";
  const currentPadding = padding ?? 0;
  const currentMargin = margin ?? 0;
  const currentRowPadding = rowPadding ?? 0;
  const currentColumnPadding = columnPadding ?? 0;
  const currentCellPadding = cellPadding ?? 8;
  const cellPadY = currentCellPadding + currentRowPadding;
  const cellPadX = currentCellPadding + currentColumnPadding;

  const slider = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    max = 48,
  ) => (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-800">{label}</p>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1"
        />
        <span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
          {value}px
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
        <span>Table background</span>
        <input
          type="color"
          value={currentBg}
          onChange={(event) => onBackgroundColorChange(event.target.value)}
          className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
        <span>Content color</span>
        <input
          type="color"
          value={currentContentColor}
          onChange={(event) => onContentColorChange(event.target.value)}
          className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
        />
      </label>

      <div className="space-y-5 border-t border-slate-200 pt-6">
        {slider("Table padding", currentPadding, onPaddingChange)}
        {slider("Table margin", currentMargin, onMarginChange)}
      </div>

      <div className="space-y-5 border-t border-slate-200 pt-6">
        {slider("Cell padding", currentCellPadding, onCellPaddingChange)}
        {slider("Row padding", currentRowPadding, onRowPaddingChange)}
        {slider("Column padding", currentColumnPadding, onColumnPaddingChange)}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Preview spacing
        </p>
        <div className="mt-3 rounded-xl bg-slate-200 p-3">
          <div
            className="relative rounded-lg border-2 border-dashed border-slate-400"
            style={{
              margin: Math.max(currentMargin, 4),
              padding: Math.max(currentPadding, 4),
              backgroundColor: resolveThemeSurface(currentBg),
            }}
          >
            <span className="absolute -top-2 left-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              margin {currentMargin}px
            </span>
            <span className="absolute left-2 top-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              padding {currentPadding}px
            </span>
            <div
              className="mt-5 rounded-md border border-slate-300 bg-white text-center text-xs font-semibold"
              style={{
                paddingTop: Math.max(cellPadY, 8),
                paddingBottom: Math.max(cellPadY, 8),
                paddingLeft: Math.max(cellPadX, 8),
                paddingRight: Math.max(cellPadX, 8),
                color: resolveThemeText(currentContentColor),
              }}
            >
              Cell content
              <p className="mt-1 text-[10px] font-medium text-slate-400">
                cell {currentCellPadding}px · row {currentRowPadding}px · col {currentColumnPadding}px
              </p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Gray area = outside · dashed box = table · white box = cell
        </p>
      </div>
    </div>
  );
}

function ButtonStylePanelEditor({
  variant = "primary",
  backgroundColor,
  textColor,
  hoverBackgroundColor,
  hoverTextColor,
  borderRadius = 8,
  onVariantChange,
  onBackgroundColorChange,
  onTextColorChange,
  onHoverBackgroundColorChange,
  onHoverTextColorChange,
  onBorderRadiusChange,
  onResetColors,
}: {
  variant?: CustomElement["buttonVariant"];
  backgroundColor?: string;
  textColor?: string;
  hoverBackgroundColor?: string;
  hoverTextColor?: string;
  borderRadius?: number;
  onVariantChange: (variant: CustomElement["buttonVariant"]) => void;
  onBackgroundColorChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
  onHoverBackgroundColorChange: (color: string) => void;
  onHoverTextColorChange: (color: string) => void;
  onBorderRadiusChange: (value: number) => void;
  onResetColors: () => void;
}) {
  const isSecondary = variant === "secondary";
  const followingTheme =
    isThemeLinkedButtonBg(backgroundColor) &&
    isThemeLinkedButtonText(textColor);
  const [bgPicker, setBgPicker] = useState("#4f46e5");
  const [textPicker, setTextPicker] = useState("#ffffff");
  const [hoverBgPicker, setHoverBgPicker] = useState("#312e81");
  const [hoverTextPicker, setHoverTextPicker] = useState("#ffffff");

  useEffect(() => {
    const resolvedBg = resolveLiveThemeHex(
      isThemeLinkedButtonBg(backgroundColor)
        ? THEME_PRIMARY_BG
        : backgroundColor,
      "#4f46e5",
    );
    const resolvedText = resolveLiveThemeHex(
      isThemeLinkedButtonText(textColor)
        ? isSecondary
          ? THEME_PRIMARY_BG
          : THEME_PRIMARY_TEXT
        : textColor,
      "#ffffff",
    );
    setBgPicker(resolvedBg);
    setTextPicker(resolvedText);
    setHoverBgPicker(
      resolveLiveThemeHex(
        hoverBackgroundColor?.trim()
          ? hoverBackgroundColor
          : isSecondary
            ? isThemeLinkedButtonBg(backgroundColor)
              ? THEME_PRIMARY_BG
              : backgroundColor
            : isThemeLinkedButtonText(textColor)
              ? THEME_PRIMARY_TEXT
              : textColor,
        isSecondary ? resolvedBg : resolvedText,
      ),
    );
    setHoverTextPicker(
      resolveLiveThemeHex(
        hoverTextColor?.trim()
          ? hoverTextColor
          : isSecondary
            ? THEME_PRIMARY_TEXT
            : isThemeLinkedButtonBg(backgroundColor)
              ? THEME_PRIMARY_BG
              : backgroundColor,
        isSecondary ? "#ffffff" : resolvedBg,
      ),
    );
  }, [
    backgroundColor,
    textColor,
    hoverBackgroundColor,
    hoverTextColor,
    isSecondary,
  ]);

  return (
    <div className="space-y-6">
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Variant
        <select
          value={variant ?? "primary"}
          onChange={(event) =>
            onVariantChange(event.target.value as CustomElement["buttonVariant"])
          }
          className="h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500"
        >
          <option value="primary">Primary (filled)</option>
          <option value="secondary">Secondary (outline)</option>
        </select>
      </label>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onResetColors}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          <RotateCcw size={14} />
          Use theme colors
        </button>
        <p className="text-xs text-slate-500">
          {followingTheme ? "Following Theme Color" : "Custom colors"}
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
        <span>{isSecondary ? "Border color" : "Background"}</span>
        <input
          type="color"
          value={bgPicker}
          onChange={(event) => onBackgroundColorChange(event.target.value)}
          className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
        <span>Text color</span>
        <input
          type="color"
          value={textPicker}
          onChange={(event) => onTextColorChange(event.target.value)}
          className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
        />
      </label>

      <div className="space-y-4 border-t border-slate-200 pt-5">
        <p className="text-sm font-semibold text-slate-800">Hover state</p>
        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
          <span>Hover background</span>
          <input
            type="color"
            value={hoverBgPicker}
            onChange={(event) =>
              onHoverBackgroundColorChange(event.target.value)
            }
            className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
          <span>Hover text color</span>
          <input
            type="color"
            value={hoverTextPicker}
            onChange={(event) => onHoverTextColorChange(event.target.value)}
            className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
          />
        </label>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-800">Corner radius</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="32"
            value={borderRadius}
            onChange={(event) => onBorderRadiusChange(Number(event.target.value))}
            className="min-w-0 flex-1"
          />
          <span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
            {borderRadius}px
          </span>
        </div>
      </div>
    </div>
  );
}

const IMAGE_STYLE_OPTIONS = [
  { id: "cover", label: "Cover" },
  { id: "full", label: "Full image" },
  { id: "no-repeat", label: "No repeat" },
] as const;

const getImageDisplayClassName = (
  style: CustomElement["imageStyle"] = "cover",
  fullWidth = false,
  hasCustomHeight = false,
) => {
  const widthClass = fullWidth ? "w-full" : "w-auto max-w-full";
  const base = `inline-block ${widthClass}`;
  if (style === "full") {
    return `${base} ${hasCustomHeight ? "object-contain" : "h-48 object-contain"}`;
  }
  if (style === "no-repeat") {
    return `${base} ${hasCustomHeight ? "object-none" : "h-auto max-h-96 object-none"}`;
  }
  return `${base} ${hasCustomHeight ? "object-cover" : "h-48 object-cover"}`;
};

const getImageDisplayStyle = (element: Pick<
  CustomElement,
  | "imageBorderRadius"
  | "imageBorderWidth"
  | "imageBorderColor"
  | "imageWidth"
  | "imageHeight"
  | "imageFullWidth"
>): CSSProperties => {
  const borderWidth = element.imageBorderWidth ?? 0;
  const widthPercent = element.imageWidth;
  const height = element.imageHeight;
  const hasCustomWidth = typeof widthPercent === "number" && widthPercent > 0;

  return {
    borderRadius: element.imageBorderRadius ?? 12,
    borderWidth: borderWidth > 0 ? borderWidth : undefined,
    borderColor: borderWidth > 0 ? (element.imageBorderColor ?? "#000000") : undefined,
    borderStyle: borderWidth > 0 ? "solid" : undefined,
    width: element.imageFullWidth
      ? "100%"
      : hasCustomWidth
        ? `${widthPercent}%`
        : undefined,
    height: typeof height === "number" && height > 0 ? height : undefined,
    maxWidth: "100%",
    boxSizing: "border-box",
  };
};

function ImageStylePanelEditor({
  imageSrc,
  imageStyle,
  align,
  fullWidth = false,
  borderRadius = 12,
  borderWidth = 0,
  borderColor = "#000000",
  imageWidth,
  imageHeight,
  onStyleChange,
  onAlignChange,
  onFullWidthChange,
  onBorderRadiusChange,
  onBorderWidthChange,
  onBorderColorChange,
  onWidthChange,
  onHeightChange,
}: {
  imageSrc: string;
  imageStyle: CustomElement["imageStyle"];
  align?: CustomElement["align"];
  fullWidth?: boolean;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  onStyleChange: (style: NonNullable<CustomElement["imageStyle"]>) => void;
  onAlignChange: (align: NonNullable<CustomElement["align"]>) => void;
  onFullWidthChange: (fullWidth: boolean) => void;
  onBorderRadiusChange: (value: number) => void;
  onBorderWidthChange: (value: number) => void;
  onBorderColorChange: (color: string) => void;
  onWidthChange: (value: number | null) => void;
  onHeightChange: (value: number | null) => void;
}) {
  const currentStyle = imageStyle ?? "cover";
  const currentAlign = align ?? "left";
  const widthAuto = !fullWidth && !(typeof imageWidth === "number" && imageWidth > 0);
  const heightAuto = !(typeof imageHeight === "number" && imageHeight > 0);
  const currentWidth = typeof imageWidth === "number" && imageWidth > 0 ? imageWidth : 60;
  const currentHeight = typeof imageHeight === "number" && imageHeight > 0 ? imageHeight : 192;
  const sizeLabel = `${fullWidth ? "100%" : widthAuto ? "Auto" : `${currentWidth}%`} × ${heightAuto ? "Auto" : `${currentHeight}px`}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Preview
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-3">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Image style preview"
              className="h-36 w-full max-w-[220px] object-cover"
              style={{
                borderRadius,
                borderWidth: borderWidth > 0 ? borderWidth : undefined,
                borderColor: borderWidth > 0 ? borderColor : undefined,
                borderStyle: borderWidth > 0 ? "solid" : undefined,
                boxSizing: "border-box",
              }}
            />
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-slate-500">
            Size: {sizeLabel}
          </p>
          <p className="mt-1 text-center text-[11px] text-slate-400">
            Preview size stays fixed. Live image updates on the page.
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Display style
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Choose how this image fits inside the column.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {IMAGE_STYLE_OPTIONS.map((option) => {
            const active = currentStyle === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onStyleChange(option.id)}
                className={`grid gap-2 rounded-xl border px-3 py-3 text-center transition ${
                  active
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border-2 ${
                    active ? "border-blue-600 bg-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {option.id === "cover" ? (
                    <span className={`block h-1 w-6 rounded-full ${active ? "bg-blue-600" : "bg-slate-400"}`} />
                  ) : option.id === "full" ? (
                    <span className={`block h-7 w-7 rounded-md ${active ? "bg-blue-600" : "bg-slate-400"}`} />
                  ) : (
                    <span className={`block h-3 w-3 rounded-sm ${active ? "bg-blue-600" : "bg-slate-400"}`} />
                  )}
                </span>
                <span className="text-xs font-semibold leading-tight">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <p className="mb-3 text-sm font-semibold text-slate-800">Alignment</p>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1 rounded-xl bg-slate-100 p-1.5">
            {(["left", "center", "right"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onAlignChange(option)}
                className={`flex h-10 flex-1 items-center justify-center rounded-lg transition ${
                  currentAlign === option
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title={`Align ${option}`}
                aria-label={`Align ${option}`}
                aria-pressed={currentAlign === option}
              >
                {option === "left" ? (
                  <AlignLeft size={18} />
                ) : option === "center" ? (
                  <AlignCenter size={18} />
                ) : (
                  <AlignRight size={18} />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onFullWidthChange(!fullWidth)}
            className={`flex h-[3.25rem] w-14 items-center justify-center rounded-xl transition ${
              fullWidth
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Full width"
            aria-label="Full width"
            aria-pressed={fullWidth}
          >
            <MoveHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-5 border-t border-slate-200 pt-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-800">Corner radius</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="48"
              value={borderRadius}
              onChange={(event) => onBorderRadiusChange(Number(event.target.value))}
              className="min-w-0 flex-1"
            />
            <span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
              {borderRadius}px
            </span>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-800">Border</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="20"
              value={borderWidth}
              onChange={(event) => onBorderWidthChange(Number(event.target.value))}
              className="min-w-0 flex-1"
            />
            <span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
              {borderWidth}px
            </span>
            <input
              type="color"
              value={borderColor}
              onChange={(event) => onBorderColorChange(event.target.value)}
              className="h-9 w-10 rounded-full border border-slate-200 bg-white p-1"
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">Width</p>
            <button
              type="button"
              onClick={() => {
                if (fullWidth) onFullWidthChange(false);
                onWidthChange(widthAuto ? 60 : null);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                widthAuto
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Auto
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="20"
              max="100"
              value={fullWidth ? 100 : currentWidth}
              disabled={fullWidth || widthAuto}
              onChange={(event) => onWidthChange(Number(event.target.value))}
              className="min-w-0 flex-1 disabled:opacity-40"
            />
            <span className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
              {fullWidth ? "100%" : widthAuto ? "Auto" : `${currentWidth}%`}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">Height</p>
            <button
              type="button"
              onClick={() => onHeightChange(heightAuto ? 192 : null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                heightAuto
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Auto
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="80"
              max="600"
              step="8"
              value={currentHeight}
              disabled={heightAuto}
              onChange={(event) => onHeightChange(Number(event.target.value))}
              className="min-w-0 flex-1 disabled:opacity-40"
            />
            <span className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
              {heightAuto ? "Auto" : `${currentHeight}px`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const COLUMN_ALIGN_H_OPTIONS = [
  { id: "left" as const, icon: AlignLeft, label: "Align left" },
  { id: "center" as const, icon: AlignCenter, label: "Align center" },
  { id: "right" as const, icon: AlignRight, label: "Align right" },
  { id: "stretch" as const, icon: MoveHorizontal, label: "Stretch horizontally" },
];

function TableEditorPanelEditor({
  rows,
  onRowsChange,
}: {
  rows: TableCellInput[][];
  onRowsChange: (rows: TableCell[][]) => void;
}) {
  const safeRows = getTableRows(rows);
  const columnCount = Math.max(1, ...safeRows.map((row) => row.length));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });

  const padRow = (row: TableCell[]) => {
    const padded = [...row];
    while (padded.length < columnCount) padded.push(emptyTableCell());
    return padded;
  };

  const withPaddedRows = () => safeRows.map((row) => padRow(row));

  const updateCellText = (rowIndex: number, cellIndex: number, text: string) => {
    const next = withPaddedRows();
    next[rowIndex][cellIndex] = { ...next[rowIndex][cellIndex], text };
    onRowsChange(next);
  };

  const updateSelectedFormat = (patch: Partial<TableCell>) => {
    const next = withPaddedRows();
    const { row, col } = selectedCell;
    if (!next[row]?.[col]) return;
    next[row][col] = { ...next[row][col], ...patch };
    onRowsChange(next);
  };

  const addRow = () => {
    onRowsChange([
      ...withPaddedRows(),
      Array.from({ length: columnCount }, () => emptyTableCell()),
    ]);
  };

  const removeRow = (rowIndex: number) => {
    if (safeRows.length <= 1) return;
    onRowsChange(safeRows.filter((_, index) => index !== rowIndex));
    if (selectedCell.row >= safeRows.length - 1) {
      setSelectedCell((current) => ({ ...current, row: Math.max(0, safeRows.length - 2) }));
    }
  };

  const addColumn = () => {
    onRowsChange(withPaddedRows().map((row) => [...row, emptyTableCell()]));
  };

  const removeColumn = (cellIndex: number) => {
    if (columnCount <= 1) return;
    onRowsChange(
      withPaddedRows().map((row) => row.filter((_, index) => index !== cellIndex)),
    );
    if (selectedCell.col >= columnCount - 1) {
      setSelectedCell((current) => ({ ...current, col: Math.max(0, columnCount - 2) }));
    }
  };

  const activeCell = withPaddedRows()[selectedCell.row]?.[selectedCell.col] ?? emptyTableCell();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus size={14} /> Add row
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus size={14} /> Add column
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Selected cell format
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
            {(["left", "center", "right"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateSelectedFormat({ align: option })}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                  (activeCell.align ?? "left") === option
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
                title={`Align ${option}`}
                aria-label={`Align ${option}`}
                aria-pressed={(activeCell.align ?? "left") === option}
              >
                {option === "left" ? (
                  <AlignLeft size={15} />
                ) : option === "center" ? (
                  <AlignCenter size={15} />
                ) : (
                  <AlignRight size={15} />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => updateSelectedFormat({ bold: !activeCell.bold })}
            className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition ${
              activeCell.bold
                ? "bg-blue-50 text-blue-700 ring-blue-200"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100"
            }`}
            title="Bold"
            aria-label="Bold"
            aria-pressed={activeCell.bold === true}
          >
            <Bold size={15} />
          </button>

          <label className="flex h-9 items-center gap-2 rounded-lg bg-white px-2 ring-1 ring-slate-200">
            <span className="text-xs font-semibold text-slate-500">Color</span>
            <input
              type="color"
              value={activeCell.color || "#0f172a"}
              onChange={(event) => updateSelectedFormat({ color: event.target.value })}
              className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Click a cell, then set alignment, bold, or color.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              {Array.from({ length: columnCount }, (_, cellIndex) => (
                <th key={cellIndex} className="border-b border-slate-200 px-2 py-2 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Col {cellIndex + 1}
                    </span>
                    <button
                      type="button"
                      disabled={columnCount <= 1}
                      onClick={() => removeColumn(cellIndex)}
                      className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      title="Remove column"
                      aria-label={`Remove column ${cellIndex + 1}`}
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-12 border-b border-slate-200 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, rowIndex) => {
              const padded = padRow(row);
              return (
                <tr key={rowIndex}>
                  {padded.map((cell, cellIndex) => {
                    const isSelected =
                      selectedCell.row === rowIndex && selectedCell.col === cellIndex;
                    return (
                      <td key={cellIndex} className="border-b border-slate-100 p-2 align-top">
                        <input
                          value={cell.text}
                          onFocus={() => setSelectedCell({ row: rowIndex, col: cellIndex })}
                          onClick={() => setSelectedCell({ row: rowIndex, col: cellIndex })}
                          onChange={(event) =>
                            updateCellText(rowIndex, cellIndex, event.target.value)
                          }
                          className={`h-10 w-full min-w-[7rem] rounded-lg border px-2 text-sm outline-none ${
                            isSelected
                              ? "border-blue-500 ring-2 ring-blue-100"
                              : "border-slate-200 focus:border-blue-500"
                          }`}
                          style={getTableCellStyle(cell)}
                        />
                      </td>
                    );
                  })}
                  <td className="border-b border-slate-100 p-2">
                    <button
                      type="button"
                      disabled={safeRows.length <= 1}
                      onClick={() => removeRow(rowIndex)}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      title="Remove row"
                      aria-label={`Remove row ${rowIndex + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Edit cell text, then use alignment, bold, and color for the selected cell.
      </p>
    </div>
  );
}

const COLUMN_ALIGN_V_OPTIONS = [
  { id: "top" as const, icon: AlignStartVertical, label: "Align top" },
  { id: "center" as const, icon: AlignCenterVertical, label: "Align middle" },
  { id: "bottom" as const, icon: AlignEndVertical, label: "Align bottom" },
  { id: "between" as const, icon: AlignVerticalSpaceBetween, label: "Distribute vertically" },
  { id: "stretch" as const, icon: StretchVertical, label: "Stretch vertically" },
];

const mapColumnHorizontalFlex = (align: ColumnContentAlignH) =>
  ({ left: "flex-start", center: "center", right: "flex-end", stretch: "stretch" })[align];

const mapColumnVerticalFlex = (align: ColumnContentAlignV) =>
  ({ top: "flex-start", center: "center", bottom: "flex-end", between: "space-between", stretch: "stretch" })[align];

const getColumnPadding = (column: CustomColumn): ColumnSpacing => {
  const value = column.padding;
  if (!value) return DEFAULT_COLUMN_PADDING;
  return {
    top: typeof value.top === "number" ? value.top : DEFAULT_COLUMN_PADDING.top,
    right: typeof value.right === "number" ? value.right : DEFAULT_COLUMN_PADDING.right,
    bottom: typeof value.bottom === "number" ? value.bottom : DEFAULT_COLUMN_PADDING.bottom,
    left: typeof value.left === "number" ? value.left : DEFAULT_COLUMN_PADDING.left,
  };
};

const MAX_CUSTOM_COLUMNS = 6;
const COLUMN_WIDTH_MIN = 10;
const ROW_COLUMN_LAYOUT_IDS = new Set([
  "two-columns",
  "three-columns",
  "four-columns",
  "five-columns",
  "six-columns",
]);

const supportsColumnWidthResize = (layoutId: string | undefined, columnCount: number) => {
  if (columnCount <= 1) return false;
  if (!layoutId) return true;
  return ROW_COLUMN_LAYOUT_IDS.has(layoutId);
};

const getColumnWidthPercents = (columns: CustomColumn[]): number[] => {
  const count = columns.length;
  const defaultShare = 100 / count;
  const hasCustomWidth = columns.some((column) => typeof column.widthPercent === "number");
  if (!hasCustomWidth) {
    return columns.map(() => defaultShare);
  }
  const raw = columns.map((column) => column.widthPercent ?? defaultShare);
  const total = raw.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return columns.map(() => defaultShare);
  return raw.map((value) => (value / total) * 100);
};

const getColumnWidthLimits = (columnCount: number) => {
  if (columnCount <= 1) return { min: 100, max: 100 };
  const min = COLUMN_WIDTH_MIN;
  const max = 100 - min * (columnCount - 1);
  return { min, max: Math.max(min, max) };
};

const computeRedistributedColumnWidths = (
  columns: CustomColumn[],
  columnIndex: number,
  newWidth: number,
): number[] => {
  const count = columns.length;
  if (count <= 1) return [100];

  const { min, max } = getColumnWidthLimits(count);
  const clamped = Math.min(max, Math.max(min, newWidth));
  const current = getColumnWidthPercents(columns);
  const otherIndices = columns.map((_, index) => index).filter((index) => index !== columnIndex);
  const remaining = 100 - clamped;
  const otherTotal = otherIndices.reduce((sum, index) => sum + current[index], 0);

  return columns.map((_, index) => {
    if (index === columnIndex) return clamped;
    if (otherTotal <= 0) return remaining / otherIndices.length;
    return (current[index] / otherTotal) * remaining;
  });
};

const getColumnGridTemplateColumns = (
  columns: CustomColumn[],
  layoutId?: string,
) => {
  const count = columns.length;
  if (!supportsColumnWidthResize(layoutId, count)) {
    return null;
  }
  const widths = getColumnWidthPercents(columns);
  return widths.map((width) => `minmax(0, ${width}fr)`).join(" ");
};

const getColumnCellStyle = (
  column: CustomColumn,
  gridArea?: string,
): CSSProperties => {
  const padding = getColumnPadding(column);
  const borderWidth = column.borderWidth ?? 0;

  return {
    gridArea,
    backgroundColor: column.backgroundColor
      ? resolveThemeSurface(column.backgroundColor)
      : undefined,
    backgroundImage: column.backgroundImage ? `url(${column.backgroundImage})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    borderRadius: column.cornerRadius ?? 0,
    borderWidth: borderWidth > 0 ? borderWidth : undefined,
    borderColor: borderWidth > 0 ? (column.borderColor ?? "#000000") : undefined,
    borderStyle: borderWidth > 0 ? "solid" : undefined,
    boxShadow: column.shadow
      ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
      : undefined,
    paddingTop: padding.top,
    paddingRight: padding.right,
    paddingBottom: padding.bottom,
    paddingLeft: padding.left,
    boxSizing: "border-box",
  };
};

const getColumnContentStyle = (column: CustomColumn): CSSProperties => {
  const preset = column.layoutPreset ?? "column";
  const horizontal = column.contentAlignH ?? "left";
  const vertical = column.contentAlignV ?? "top";
  const horizontalFlex = mapColumnHorizontalFlex(horizontal);
  const verticalFlex = mapColumnVerticalFlex(vertical);
  const gap = column.elementGap ?? 16;

  if (preset === "row") {
    return {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: horizontalFlex,
      alignItems: vertical === "between" ? "stretch" : verticalFlex,
      alignContent: vertical === "between" ? "space-between" : undefined,
      minHeight: "100%",
      gap,
    };
  }

  return {
    display: "flex",
    flexDirection: "column",
    alignItems: horizontalFlex,
    justifyContent: verticalFlex,
    minHeight: "100%",
    gap,
  };
};

function ColumnLayoutPanelEditor({
  layoutPreset,
  contentAlignH,
  contentAlignV,
  onPresetChange,
  onAlignHChange,
  onAlignVChange,
}: {
  layoutPreset?: ColumnLayoutPreset;
  contentAlignH?: ColumnContentAlignH;
  contentAlignV?: ColumnContentAlignV;
  onPresetChange: (preset: ColumnLayoutPreset) => void;
  onAlignHChange: (align: ColumnContentAlignH) => void;
  onAlignVChange: (align: ColumnContentAlignV) => void;
}) {
  const currentPreset = layoutPreset ?? "column";
  const currentAlignH = contentAlignH ?? "left";
  const currentAlignV = contentAlignV ?? "top";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-800">Presets</p>
        <div className="mt-3 flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() => onPresetChange("column")}
            className={`flex h-10 w-12 items-center justify-center rounded-lg transition ${
              currentPreset === "column"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Stack content vertically"
            aria-label="Column layout"
            aria-pressed={currentPreset === "column"}
          >
            <Columns size={18} />
          </button>
          <button
            type="button"
            onClick={() => onPresetChange("row")}
            className={`flex h-10 w-12 items-center justify-center rounded-lg transition ${
              currentPreset === "row"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Arrange content horizontally"
            aria-label="Row layout"
            aria-pressed={currentPreset === "row"}
          >
            <Rows size={18} />
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-slate-800">Content alignment</p>
        <div className="mt-3 flex w-full max-w-xs items-center gap-1 rounded-xl bg-slate-100 p-1.5">
          {COLUMN_ALIGN_H_OPTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onAlignHChange(id)}
              className={`flex h-10 flex-1 items-center justify-center rounded-lg transition ${
                currentAlignH === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title={label}
              aria-label={label}
              aria-pressed={currentAlignH === id}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
        <div className="mt-3 flex w-full max-w-xs items-center gap-1 rounded-xl bg-slate-100 p-1.5">
          {COLUMN_ALIGN_V_OPTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onAlignVChange(id)}
              className={`flex h-10 flex-1 items-center justify-center rounded-lg transition ${
                currentAlignV === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title={label}
              aria-label={label}
              aria-pressed={currentAlignV === id}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColumnStylePanelEditor({
  backgroundColor,
  backgroundImage,
  cornerRadius,
  borderWidth,
  borderColor,
  shadow,
  styleTab,
  onStyleTabChange,
  onBackgroundColorChange,
  onBackgroundImageChange,
  onCornerRadiusChange,
  onBorderWidthChange,
  onBorderColorChange,
  onShadowChange,
  onOpenImagePicker,
}: {
  backgroundColor?: string;
  backgroundImage?: string;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
  styleTab: "color" | "image";
  onStyleTabChange: (tab: "color" | "image") => void;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundImageChange: (url: string) => void;
  onCornerRadiusChange: (value: number) => void;
  onBorderWidthChange: (value: number) => void;
  onBorderColorChange: (color: string) => void;
  onShadowChange: (enabled: boolean) => void;
  onOpenImagePicker: () => void;
}) {
  const currentColor = backgroundColor || "#ffffff";
  const currentRadius = cornerRadius ?? 0;
  const currentBorderWidth = borderWidth ?? 0;
  const currentBorderColor = borderColor ?? "#000000";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => onStyleTabChange("color")}
          className={`border-b-2 px-3 py-2 text-sm font-semibold ${
            styleTab === "color"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500"
          }`}
        >
          Color
        </button>
        <button
          type="button"
          onClick={() => onStyleTabChange("image")}
          className={`border-b-2 px-3 py-2 text-sm font-semibold ${
            styleTab === "image"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500"
          }`}
        >
          Image
        </button>
      </div>

      {styleTab === "color" ? (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Background color</span>
          <input
            type="color"
            value={currentColor}
            onChange={(event) =>
              onBackgroundColorChange(event.target.value)
            }
            className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Background image</span>
            <button
              type="button"
              onClick={onOpenImagePicker}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              <Upload size={16} />
              Upload
            </button>
          </div>

          {backgroundImage ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backgroundImage}
                alt="Column background preview"
                className="h-36 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              No background image selected
            </div>
          )}

          <label className="grid gap-2 text-sm">
            <span>Image URL</span>
            <input
              value={backgroundImage ?? ""}
              onChange={(event) => onBackgroundImageChange(event.target.value)}
              placeholder="/uploads/image.jpg"
              className="h-10 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500"
            />
          </label>

          {backgroundImage ? (
            <button
              type="button"
              onClick={() => onBackgroundImageChange("")}
              className="text-sm font-semibold text-red-600 transition hover:text-red-700"
            >
              Remove background image
            </button>
          ) : null}
        </div>
      )}

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-3 text-sm">Corner radius</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="48"
            value={currentRadius}
            onChange={(event) => onCornerRadiusChange(Number(event.target.value))}
            className="min-w-0 flex-1"
          />
          <span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
            {currentRadius}px
          </span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-3 text-sm">Border</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="20"
            value={currentBorderWidth}
            onChange={(event) => onBorderWidthChange(Number(event.target.value))}
            className="min-w-0 flex-1"
          />
          <span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
            {currentBorderWidth}px
          </span>
          <input
            type="color"
            value={currentBorderColor}
            onChange={(event) => onBorderColorChange(event.target.value)}
            className="h-9 w-10 rounded-full border border-slate-200 bg-white p-1"
          />
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
        <span>Shadow</span>
        <input
          type="checkbox"
          checked={shadow === true}
          onChange={(event) => onShadowChange(event.target.checked)}
          className="h-5 w-5 accent-blue-600"
        />
      </label>
    </div>
  );
}

function ColumnSpacingPanelEditor({
  elementGap,
  padding,
  paddingLinked,
  onElementGapChange,
  onPaddingChange,
  onPaddingLinkedChange,
  onReset,
}: {
  elementGap: number;
  padding: ColumnSpacing;
  paddingLinked: boolean;
  onElementGapChange: (value: number) => void;
  onPaddingChange: (side: keyof ColumnSpacing, value: number) => void;
  onPaddingLinkedChange: (linked: boolean) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      <label className="grid gap-2 text-sm">
        <span>Spacing between elements</span>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="64"
            value={elementGap}
            onChange={(event) => onElementGapChange(Number(event.target.value))}
            className="min-w-0 flex-1"
          />
          <span className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
            {elementGap}px
          </span>
        </div>
      </label>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Padding (inner spacing)</p>
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 px-8 py-6">
          <label className="absolute left-1/2 top-2 grid -translate-x-1/2 gap-0.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Top</span>
            <input
              type="number"
              min="0"
              max="240"
              value={padding.top}
              onChange={(event) => onPaddingChange("top", Number(event.target.value))}
              className="h-8 w-14 rounded-md border border-slate-200 bg-white px-1 text-center text-xs outline-none focus:border-blue-500"
            />
          </label>
          <label className="absolute bottom-2 left-1/2 grid -translate-x-1/2 gap-0.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bottom</span>
            <input
              type="number"
              min="0"
              max="240"
              value={padding.bottom}
              onChange={(event) => onPaddingChange("bottom", Number(event.target.value))}
              className="h-8 w-14 rounded-md border border-slate-200 bg-white px-1 text-center text-xs outline-none focus:border-blue-500"
            />
          </label>
          <label className="absolute left-2 top-1/2 grid -translate-y-1/2 gap-0.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Left</span>
            <input
              type="number"
              min="0"
              max="240"
              value={padding.left}
              onChange={(event) => onPaddingChange("left", Number(event.target.value))}
              className="h-8 w-14 rounded-md border border-slate-200 bg-white px-1 text-center text-xs outline-none focus:border-blue-500"
            />
          </label>
          <label className="absolute right-2 top-1/2 grid -translate-y-1/2 gap-0.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Right</span>
            <input
              type="number"
              min="0"
              max="240"
              value={padding.right}
              onChange={(event) => onPaddingChange("right", Number(event.target.value))}
              className="h-8 w-14 rounded-md border border-slate-200 bg-white px-1 text-center text-xs outline-none focus:border-blue-500"
            />
          </label>
          <div className="flex min-h-28 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
            <button
              type="button"
              onClick={() => onPaddingLinkedChange(!paddingLinked)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                paddingLinked
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-800"
              }`}
              title={paddingLinked ? "Unlink padding sides" : "Link padding sides"}
              aria-label={paddingLinked ? "Unlink padding sides" : "Link padding sides"}
              aria-pressed={paddingLinked}
            >
              <Link2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <RotateCcw size={15} />
        Reset Column Spacing
      </button>
    </div>
  );
}

function ColumnSizePanelEditor({
  widthPercent,
  minWidth,
  maxWidth,
  disabled = false,
  onWidthChange,
}: {
  widthPercent: number;
  minWidth: number;
  maxWidth: number;
  disabled?: boolean;
  onWidthChange: (value: number) => void;
}) {
  const displayWidth = Math.round(widthPercent);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-800">Size</p>
        {disabled ? (
          <p className="mt-3 text-sm text-slate-500">
            Width controls are available when this section has multiple columns in a row.
          </p>
        ) : (
          <label className="mt-3 grid gap-2 text-sm">
            <span>Width</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={minWidth}
                max={maxWidth}
                value={displayWidth}
                onChange={(event) => onWidthChange(Number(event.target.value))}
                className="min-w-0 flex-1"
              />
              <span className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm">
                {displayWidth}%
              </span>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}

type SectionPanel = "settings" | "spacing" | "style";

let retainedSectionPanel: { sectionId: string; panel: SectionPanel } | null = null;

const sectionPanelStorageKey = (sectionId: string) => `ai-builder:custom-section-panel:${sectionId || "current"}`;

function rememberSectionPanel(sectionId: string, panel: SectionPanel | null) {
  retainedSectionPanel = panel ? { sectionId, panel } : null;
  if (typeof window === "undefined") return;
  const key = sectionPanelStorageKey(sectionId);
  if (!panel) {
    window.sessionStorage.removeItem(key);
    return;
  }
  window.sessionStorage.setItem(key, JSON.stringify({ panel, updatedAt: Date.now() }));
}

function getRememberedSectionPanel(sectionId: string): SectionPanel | null {
  if (retainedSectionPanel?.sectionId === sectionId) return retainedSectionPanel.panel;
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(sectionPanelStorageKey(sectionId)) || "null") as { panel?: SectionPanel; updatedAt?: number } | null;
    if (!stored?.panel || !stored.updatedAt || Date.now() - stored.updatedAt > 10_000) return null;
    if (!(["settings", "spacing", "style"] as SectionPanel[]).includes(stored.panel)) return null;
    retainedSectionPanel = { sectionId, panel: stored.panel };
    return stored.panel;
  } catch {
    return null;
  }
}

function SpacingNumberInput({ value, onCommit }: { value: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = (raw: string) => {
    const parsed = Number(raw);
    const nextValue = Number.isFinite(parsed) ? Math.min(240, Math.max(0, parsed)) : value;
    setDraft(String(nextValue));
    if (nextValue !== value) onCommit(nextValue);
  };

  return <div className="flex items-center rounded-lg border border-slate-200 px-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
    <input
      type="number"
      min="0"
      max="240"
      value={draft}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        // Apply immediately so typing 0 actually removes padding (not only on blur).
        if (next.trim() === "") return;
        const parsed = Number(next);
        if (!Number.isFinite(parsed)) return;
        const clamped = Math.min(240, Math.max(0, parsed));
        if (clamped !== value) onCommit(clamped);
      }}
      onBlur={() => commitDraft(draft)}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
      className="h-9 min-w-0 flex-1 outline-none"
    />
    <span>px</span>
  </div>;
}

function SectionSettingsEditor({
  name,
  cssClass,
  htmlId,
  visibility,
  onSave,
}: {
  name: string;
  cssClass: string;
  htmlId: string;
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftClass, setDraftClass] = useState(cssClass);
  const [draftId, setDraftId] = useState(htmlId);
  const [draftVisibility, setDraftVisibility] = useState(visibility);

  const deviceOptions = [
    { key: "desktop" as const, label: "Desktop", icon: Monitor },
    { key: "tablet" as const, label: "Tablet", icon: Tablet },
    { key: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  return <div className="space-y-5">
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>Section name</span>
      <input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Section" className="h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      <span className="text-xs font-normal text-slate-500">This name is shown only inside the editor.</span>
    </label>
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>Section class</span>
      <input value={draftClass} onChange={(event) => setDraftClass(event.target.value)} placeholder="e.g. featured-section" className="h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      <span className="text-xs font-normal text-slate-500">Add one or more CSS classes separated by spaces.</span>
    </label>
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>Section ID</span>
      <input value={draftId} onChange={(event) => setDraftId(event.target.value)} placeholder="e.g. featured-services" className="h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      <span className="text-xs font-normal text-slate-500">Use this ID for menu links such as #featured-services.</span>
    </label>
    <div className="border-t border-slate-200 pt-5">
      <p className="text-sm font-semibold text-slate-700">Show section on devices</p>
      <p className="mt-1 text-xs text-slate-500">Choose where this section will be visible.</p>
      <div className="mt-3 space-y-3">
        {deviceOptions.map(({ key, label, icon: DeviceIcon }) => <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 transition hover:border-blue-300">
          <span className="flex items-center gap-3 text-sm font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><DeviceIcon size={18}/></span>{label}</span>
          <input type="checkbox" checked={draftVisibility[key]} onChange={(event) => setDraftVisibility((current) => ({ ...current, [key]: event.target.checked }))} className="h-5 w-5 accent-blue-600" />
        </label>)}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onSave({
        sectionName: draftName.trim() || "Section",
        sectionCssClass: draftClass.trim(),
        sectionHtmlId: draftId.trim().replace(/^#/, "").replace(/\s+/g, "-"),
        sectionVisibility: draftVisibility,
      })}
      className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
    >
      Apply settings
    </button>
  </div>;
}

function normalizeSliderSlides(value: unknown): SliderSlide[] {
  if (!Array.isArray(value) || !value.length) {
    return DEFAULT_SLIDER_SLIDES.map((slide) => ({ ...slide }));
  }
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const src = typeof row.src === "string" && row.src.trim() ? row.src : "";
      if (!src) return null;
      return {
        id:
          typeof row.id === "string" && row.id.trim()
            ? row.id
            : `slide-${index + 1}`,
        src,
        alt: typeof row.alt === "string" ? row.alt : `Slide ${index + 1}`,
      };
    })
    .filter(Boolean) as SliderSlide[];
}

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
type HeadingLevel = (typeof HEADING_LEVELS)[number];

const HEADING_LEVEL_SIZES: Record<HeadingLevel, number> = {
  1: 36,
  2: 28,
  3: 24,
  4: 22,
  5: 20,
  6: 18,
};

const getHeadingLevel = (value: unknown): HeadingLevel => {
  const n = typeof value === "number" ? value : Number(value);
  if (n >= 1 && n <= 6) return n as HeadingLevel;
  // Legacy Heading 7 → treat as H6
  if (n === 7) return 6;
  return 2;
};

const getHeadingFontSize = (
  fontSize: unknown,
  headingLevel?: unknown,
) => {
  const n = typeof fontSize === "number" ? fontSize : Number(fontSize);
  if (Number.isFinite(n) && n >= 14 && n <= 96) return Math.round(n);
  return HEADING_LEVEL_SIZES[getHeadingLevel(headingLevel)];
};

const DEFAULT_HEADING_TEXT_COLOR = "#0f172a";

const getHeadingTextColor = (value: unknown) => {
  if (typeof value !== "string") return DEFAULT_HEADING_TEXT_COLOR;
  const color = value.trim();
  if (!color) return DEFAULT_HEADING_TEXT_COLOR;
  // Theme primary-text is often white — headings stay dark by default
  if (color === THEME_PRIMARY_TEXT || color === "var(--primary-text)") {
    return DEFAULT_HEADING_TEXT_COLOR;
  }
  return color;
};

const stripToPlainText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function normalizeFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [...DEFAULT_FAQ_ITEMS];
  const items = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const question =
        typeof row.question === "string" ? row.question.trim() : "";
      const answer = typeof row.answer === "string" ? row.answer.trim() : "";
      if (!question && !answer) return null;
      return {
        id:
          typeof row.id === "string" && row.id.trim()
            ? row.id
            : `faq-${index + 1}`,
        question: question || `Question ${index + 1}`,
        answer: answer || "Add an answer here.",
      };
    })
    .filter(Boolean) as FaqItem[];
  return items.length ? items : [...DEFAULT_FAQ_ITEMS];
}

function CustomElementFaq({
  element,
}: {
  element: CustomElement;
}) {
  const items = normalizeFaqItems(element.faqItems);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    setOpenIndex(0);
  }, [items.length, element.id]);

  if (!items.length) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
        Add FAQ questions
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-2" data-export-faq>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            data-export-faq-item
            data-export-faq-open={isOpen ? "true" : "false"}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-900"
              data-export-faq-trigger
            >
              <span className="min-w-0 flex-1 break-words">{item.question}</span>
              <ChevronDown
                size={16}
                data-export-faq-chevron
                className={`shrink-0 text-slate-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              data-export-faq-panel
              className={`grid transition-all duration-300 ease-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function normalizeTestimonialItems(value: unknown): TestimonialItem[] {
  if (!Array.isArray(value)) return [...DEFAULT_TESTIMONIAL_ITEMS];
  const items = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const quote = typeof row.quote === "string" ? row.quote.trim() : "";
      if (!name && !quote) return null;
      const ratingRaw =
        typeof row.rating === "number"
          ? row.rating
          : Number(typeof row.rating === "string" ? row.rating : 5);
      return {
        id:
          typeof row.id === "string" && row.id.trim()
            ? row.id
            : `testimonial-${index + 1}`,
        name: name || `Customer ${index + 1}`,
        role:
          typeof row.role === "string" && row.role.trim()
            ? row.role.trim()
            : "Customer",
        quote: quote || "Add a short testimonial quote here.",
        image:
          typeof row.image === "string" && row.image.trim()
            ? row.image.trim()
            : "/bg1.jpg",
        rating: Math.max(1, Math.min(5, Math.round(ratingRaw) || 5)),
      };
    })
    .filter(Boolean) as TestimonialItem[];
  return items.length ? items : [...DEFAULT_TESTIMONIAL_ITEMS];
}

const getTestimonialLayout = (value: unknown): "grid" | "slider" =>
  value === "slider" ? "slider" : "grid";

const getTestimonialCardsPerView = (value: unknown): 1 | 2 | 3 => {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 1 || n === 2 || n === 3) return n;
  return 2;
};

const getTestimonialMobileCardsPerView = (value: unknown): 1 | 2 | 3 => {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 1 || n === 2 || n === 3) return n;
  return 1;
};

const getTestimonialCardPadding = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 16;
  return Math.min(48, Math.max(4, Math.round(n)));
};

const getTestimonialNav = (
  value: unknown,
): "arrow" | "bullet" | "both" => {
  if (value === "arrow" || value === "bullet" || value === "both") return value;
  return "arrow";
};

function useIsMobileViewport(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [breakpointPx]);
  return isMobile;
}

function useViewportSpacingDevice(): ResponsiveDevice {
  const [device, setDevice] = useState<ResponsiveDevice>("desktop");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const width = window.innerWidth;
      if (width <= 767) setDevice("mobile");
      else if (width <= 1023) setDevice("tablet");
      else setDevice("desktop");
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return device;
}

function TestimonialCard({
  item,
  padding,
}: {
  item: TestimonialItem;
  padding: number;
}) {
  return (
    <article
      className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={{ padding }}
    >
      <div className="mb-3 flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <Star
            key={`${item.id}-star-${starIndex}`}
            size={14}
            className={
              starIndex < item.rating
                ? "fill-amber-400 text-amber-400"
                : "text-slate-200"
            }
          />
        ))}
      </div>
      <Quote size={18} className="mb-2 text-slate-300" />
      <p className="text-sm leading-6 text-slate-700">{item.quote}</p>
      <div className="mt-4 flex items-center gap-3">
        <img
          src={item.image || "/bg1.jpg"}
          alt={item.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {item.name}
          </p>
          <p className="truncate text-xs text-slate-500">{item.role}</p>
        </div>
      </div>
    </article>
  );
}

function CustomElementTestimonial({
  element,
  editorMode,
}: {
  element: CustomElement;
  editorMode: boolean;
}) {
  const items = normalizeTestimonialItems(element.testimonialItems);
  const layout = getTestimonialLayout(element.testimonialLayout);
  const desktopCards = getTestimonialCardsPerView(
    element.testimonialCardsPerView,
  );
  const mobileCards = getTestimonialMobileCardsPerView(
    element.testimonialMobileCardsPerView,
  );
  const cardPadding = getTestimonialCardPadding(element.testimonialCardPadding);
  const isMobile = useIsMobileViewport(640);
  const cardsPerView = isMobile ? mobileCards : desktopCards;
  const nav = getTestimonialNav(element.testimonialNav);
  const autoplay = element.testimonialAutoplay === true;
  const showArrows = nav === "arrow" || nav === "both";
  const showBullets = nav === "bullet" || nav === "both";
  const maxStart = Math.max(0, items.length - cardsPerView);
  // Keep nav in DOM if either breakpoint can slide (HTML export has no React resize).
  const canSlideSomewhere =
    items.length > Math.min(desktopCards, mobileCards);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [items.length, cardsPerView, layout, element.id]);

  useEffect(() => {
    if (
      layout !== "slider" ||
      !autoplay ||
      items.length <= cardsPerView ||
      editorMode
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current >= maxStart ? 0 : current + 1));
    }, 4000);
    return () => window.clearInterval(timer);
  }, [
    layout,
    autoplay,
    items.length,
    cardsPerView,
    maxStart,
    editorMode,
    element.id,
  ]);

  if (!items.length) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
        Add testimonials
      </div>
    );
  }

  if (layout === "grid") {
    const gridCols =
      cardsPerView === 1
        ? "grid-cols-1"
        : cardsPerView === 2
          ? "grid-cols-2"
          : "grid-cols-3";
    return (
      <div className={`grid w-full max-w-full gap-3 ${gridCols}`}>
        {items.map((item) => (
          <TestimonialCard
            key={item.id}
            item={item}
            padding={cardPadding}
          />
        ))}
      </div>
    );
  }

  const start = Math.min(Math.max(0, index), maxStart);
  const pageCount = Math.max(1, items.length - Math.min(desktopCards, mobileCards) + 1);
  const gapPx = 12;

  return (
    <div
      className="relative w-full max-w-full"
      data-export-testimonial-slider
      data-cards-per-view={String(cardsPerView)}
      data-cards-per-view-desktop={String(desktopCards)}
      data-cards-per-view-mobile={String(mobileCards)}
      data-gap={String(gapPx)}
      data-autoplay={autoplay ? "1" : "0"}
      data-item-count={String(items.length)}
    >
      <div className="w-full overflow-hidden">
        <div
          className="flex w-full transition-transform duration-500 ease-out will-change-transform"
          data-export-testimonial-track
          style={{
            gap: gapPx,
            transform: `translateX(calc(-${start} * ((100% + ${gapPx}px) / ${cardsPerView})))`,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="min-w-0 shrink-0 grow-0"
              data-export-testimonial-card
              style={{
                width: `calc((100% - ${(cardsPerView - 1) * gapPx}px) / ${cardsPerView})`,
              }}
            >
              <TestimonialCard item={item} padding={cardPadding} />
            </div>
          ))}
        </div>
      </div>

      {showArrows && canSlideSomewhere ? (
        <>
          <button
            type="button"
            aria-label="Previous testimonials"
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) =>
                current <= 0 ? maxStart : current - 1,
              );
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next testimonials"
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) =>
                current >= maxStart ? 0 : current + 1,
              );
            }}
          >
            <ArrowRight size={16} />
          </button>
        </>
      ) : null}

      {showBullets && canSlideSomewhere ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, page) => (
            <button
              key={`testimonial-dot-${page}`}
              type="button"
              data-export-testimonial-dot
              aria-label={`Go to page ${page + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                page === start
                  ? "bg-slate-800"
                  : "bg-slate-300 hover:bg-slate-400"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                setIndex(page);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getSliderCardsPerView(value: unknown): 1 | 2 | 3 | 4 {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 2 || n === 3 || n === 4) return n;
  return 1;
}

function resizeSliderSlides(
  value: unknown,
  count: number,
): SliderSlide[] {
  const safeCount = Math.min(8, Math.max(1, count));
  const current = normalizeSliderSlides(value);
  if (current.length === safeCount) return current;
  if (current.length > safeCount) return current.slice(0, safeCount);
  const next = [...current];
  while (next.length < safeCount) {
    const fallback =
      DEFAULT_SLIDER_SLIDES[next.length % DEFAULT_SLIDER_SLIDES.length];
    next.push({
      id: `slide-${Date.now()}-${next.length + 1}`,
      src: fallback?.src || "/bg1.jpg",
      alt: `Slide ${next.length + 1}`,
    });
  }
  return next;
}

function CustomElementSlider({
  element,
  editorMode,
}: {
  element: CustomElement;
  editorMode: boolean;
}) {
  const slides = normalizeSliderSlides(element.slides);
  const cardsPerView = getSliderCardsPerView(element.sliderCardsPerView);
  const height =
    typeof element.sliderHeight === "number" && element.sliderHeight > 120
      ? element.sliderHeight
      : 320;
  const autoplay = element.sliderAutoplay !== false;
  const popupOnClick = element.sliderPopupOnClick === true;
  const maxStart = Math.max(0, slides.length - cardsPerView);
  const [index, setIndex] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length, cardsPerView, element.id]);

  useEffect(() => {
    if (!autoplay || slides.length <= cardsPerView || editorMode || popupOpen) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current >= maxStart ? 0 : current + 1));
    }, 4000);
    return () => window.clearInterval(timer);
  }, [
    autoplay,
    slides.length,
    cardsPerView,
    maxStart,
    editorMode,
    element.id,
    popupOpen,
  ]);

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopupOpen(false);
      if (event.key === "ArrowLeft" && slides.length > 1) {
        setPopupIndex(
          (current) => (current - 1 + slides.length) % slides.length,
        );
      }
      if (event.key === "ArrowRight" && slides.length > 1) {
        setPopupIndex((current) => (current + 1) % slides.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupOpen, slides.length]);

  const start = Math.min(Math.max(0, index), maxStart);
  const visible = slides.slice(start, start + cardsPerView);
  const gapPx = cardsPerView > 1 ? 12 : 0;

  if (!slides.length) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
        Add slides to this slider
      </div>
    );
  }

  const openPopupAt = (slideIndex: number) => {
    if (!popupOnClick) return;
    setPopupIndex(slideIndex);
    setPopupOpen(true);
  };

  return (
    <>
      <div
        className="relative w-full"
        data-export-slider
        data-cards-per-view={String(cardsPerView)}
        data-autoplay={autoplay ? "1" : "0"}
        data-slider-height={String(height)}
        data-slides={JSON.stringify(
          slides.map((slide) => ({
            src: slide.src,
            alt: slide.alt || "",
          })),
        )}
      >
        <div
          className="grid w-full"
          data-export-slider-grid
          style={{
            gridTemplateColumns: `repeat(${cardsPerView}, minmax(0, 1fr))`,
            gap: gapPx,
          }}
        >
          {visible.map((slide, visibleIndex) => {
            const absoluteIndex = start + visibleIndex;
            return (
              <button
                key={slide.id}
                type="button"
                className={`relative overflow-hidden rounded-xl bg-slate-900 p-0 text-left ${
                  popupOnClick ? "cursor-zoom-in" : "cursor-default"
                }`}
                onClick={(event) => {
                  if (!popupOnClick) return;
                  event.stopPropagation();
                  openPopupAt(absoluteIndex);
                }}
                aria-label={
                  popupOnClick
                    ? `Open image ${absoluteIndex + 1}`
                    : `Slide ${absoluteIndex + 1}`
                }
              >
                <img
                  src={slide.src}
                  alt={slide.alt || `Slide ${absoluteIndex + 1}`}
                  data-editor-media
                  data-editor-media-type="image"
                  data-editor-media-src={slide.src}
                  className="h-full w-full object-cover"
                  style={{ height }}
                />
              </button>
            );
          })}
        </div>

        {slides.length > cardsPerView ? (
          <>
            <button
              type="button"
              aria-label="Previous cards"
              disabled={start <= 0}
              className="absolute left-2 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 disabled:opacity-30"
              onClick={(event) => {
                event.stopPropagation();
                setIndex((current) => Math.max(0, current - 1));
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next cards"
              disabled={start >= maxStart}
              className="absolute right-2 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 disabled:opacity-30"
              onClick={(event) => {
                event.stopPropagation();
                setIndex((current) => Math.min(maxStart, current + 1));
              }}
            >
              <ArrowRight size={16} />
            </button>
            <div className="mt-3 flex justify-center gap-1.5">
              {Array.from({ length: maxStart + 1 }, (_, pageIndex) => (
                <button
                  key={`page-${pageIndex}`}
                  type="button"
                  data-export-slider-dot
                  aria-label={`Go to position ${pageIndex + 1}`}
                  className={`h-2 w-2 rounded-full transition ${
                    pageIndex === start ? "bg-slate-800" : "bg-slate-300"
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIndex(pageIndex);
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {popupOpen && popupOnClick
        ? createPortal(
            <div
              className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/80 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Slider image popup"
              onClick={() => setPopupOpen(false)}
            >
              <button
                type="button"
                aria-label="Close popup"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                onClick={() => setPopupOpen(false)}
              >
                <X size={20} />
              </button>
              {slides.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous slide"
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPopupIndex(
                        (current) =>
                          (current - 1 + slides.length) % slides.length,
                      );
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next slide"
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPopupIndex(
                        (current) => (current + 1) % slides.length,
                      );
                    }}
                  >
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : null}
              <img
                src={slides[popupIndex]?.src || slides[0].src}
                alt={slides[popupIndex]?.alt || "Slider"}
                className="max-h-[90vh] max-w-[min(96vw,1100px)] rounded-lg object-contain shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default function CustomSection({ data, editorMode = false }: SectionProps) {
  const router = useRouter();
  const user = useOptionalUserAuth()?.user;
  const safeData = data ?? {};
  const columns = (Array.isArray(safeData.columns) ? safeData.columns : []) as CustomColumn[];
  const selectedLayout = getCustomSectionLayout(typeof safeData.layout === "string" ? safeData.layout : undefined);
  const sectionId = typeof safeData.customSectionId === "string" ? safeData.customSectionId : "";

  /** AI features only — Core plan required; others go to plans. */
  const requireCorePlanOrGoToUpgrade = () => {
    const siteId = resolveEditorSiteId();
    if (isEditorCorePlanActive(siteId)) return true;
    rememberEditorForAuthCancel();
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("ai-builder-login-required", {
          detail: { intent: "upgrade" },
        }),
      );
      return false;
    }
    router.push(buildPlanPageUrl(siteId));
    return false;
  };
  const restoredPanel = retainedSectionPanel?.sectionId === sectionId ? retainedSectionPanel.panel : null;
  const [selection, setSelection] = useState<Selection>(() => restoredPanel ? { kind: "section" } : null);
  const [openColumn, setOpenColumn] = useState<number | null>(null);
  const [moreMenu, setMoreMenu] = useState<string | null>(null);
  const [editingButton, setEditingButton] = useState<string | null>(null);
  const [richTextEditor, setRichTextEditor] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [tableStylePanelId, setTableStylePanelId] = useState<string | null>(null);
  const [buttonStylePanelId, setButtonStylePanelId] = useState<string | null>(null);
  const [imageStylePanelId, setImageStylePanelId] = useState<string | null>(null);
  const [imageLinkPanelId, setImageLinkPanelId] = useState<string | null>(null);
  const [aiImageBusyId, setAiImageBusyId] = useState<string | null>(null);
  const [sliderEditorId, setSliderEditorId] = useState<string | null>(null);
  const [faqEditorId, setFaqEditorId] = useState<string | null>(null);
  const [testimonialEditorId, setTestimonialEditorId] = useState<string | null>(null);
  const [testimonialSettingsId, setTestimonialSettingsId] = useState<string | null>(null);
  const [columnPanel, setColumnPanel] = useState<{ index: number; tab: ColumnPanelTab } | null>(null);
  const [columnStyleTab, setColumnStyleTab] = useState<"color" | "image">("color");
  const [columnPaddingLinked, setColumnPaddingLinked] = useState(true);
  const [showColumnBackgroundImagePicker, setShowColumnBackgroundImagePicker] = useState(false);
  const [sectionPanel, setSectionPanel] = useState<SectionPanel | null>(restoredPanel);
  const [showBackgroundImagePicker, setShowBackgroundImagePicker] = useState(false);
  const [styleTab, setStyleTab] = useState<"color" | "image">("color");
  const [paddingLinked, setPaddingLinked] = useState(true);
  const [marginLinked, setMarginLinked] = useState(true);
  const [spacingDevice, setSpacingDevice] = useState<ResponsiveDevice>("desktop");
  const viewportSpacingDevice = useViewportSpacingDevice();
  const sectionRef = useRef<HTMLElement>(null);
  const imageRefs = useRef(new Map<string, HTMLImageElement>());

  useEffect(() => {
    if (sectionPanel) return;
    const timer = window.setTimeout(() => {
      const recoveredPanel = getRememberedSectionPanel(sectionId);
      if (!recoveredPanel) return;
      setSelection({ kind: "section" });
      setSectionPanel(recoveredPanel);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sectionId, sectionPanel]);

  const closeSectionPanel = () => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
  };

  const closeImageStylePanel = () => {
    setImageStylePanelId(null);
  };

  const openSliderEditor = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setFaqEditorId(null);
    setTestimonialEditorId(null);
    setTestimonialSettingsId(null);
    setSliderEditorId((current) => (current === elementId ? null : elementId));
  };

  const closeSliderEditor = () => setSliderEditorId(null);

  const openFaqEditor = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setSliderEditorId(null);
    setTestimonialEditorId(null);
    setTestimonialSettingsId(null);
    setFaqEditorId((current) => (current === elementId ? null : elementId));
  };

  const closeFaqEditor = () => setFaqEditorId(null);

  const openTestimonialEditor = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setSliderEditorId(null);
    setFaqEditorId(null);
    setTestimonialSettingsId(null);
    setTestimonialEditorId((current) =>
      current === elementId ? null : elementId,
    );
  };

  const closeTestimonialEditor = () => setTestimonialEditorId(null);

  const openTestimonialSettings = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setSliderEditorId(null);
    setFaqEditorId(null);
    setTestimonialEditorId(null);
    setTestimonialSettingsId((current) =>
      current === elementId ? null : elementId,
    );
  };

  const closeTestimonialSettings = () => setTestimonialSettingsId(null);

  const closeButtonStylePanel = () => {
    setButtonStylePanelId(null);
  };

  const closeImageLinkPanel = () => {
    setImageLinkPanelId(null);
  };

  const closeColumnPanel = () => {
    setColumnPanel(null);
  };

  const closeAddContentPanel = () => {
    setOpenColumn(null);
  };

  const openImageStylePanel = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setImageLinkPanelId(null);
    setImageStylePanelId(elementId);
  };

  const openImageLinkPanel = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setImageStylePanelId(null);
    setImageLinkPanelId((current) => (current === elementId ? null : elementId));
  };

  const openColumnPanel = (columnIndex: number, tab: ColumnPanelTab) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setColumnPanel({ index: columnIndex, tab });
  };

  const openAddContentPanel = (columnIndex: number) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setSelection({ kind: "column", columnIndex });
    setOpenColumn((current) => (current === columnIndex ? null : columnIndex));
  };

  const closeButtonEditorPanel = () => {
    setEditingButton(null);
  };

  const openButtonEditorPanel = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setEditingButton((current) => (current === elementId ? null : elementId));
  };

  const closeTableEditorPanel = () => {
    setEditingTable(null);
  };

  const openTableEditorPanel = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setEditingTable((current) => (current === elementId ? null : elementId));
  };

  const closeTableStylePanel = () => {
    setTableStylePanelId(null);
  };

  const openTableStylePanel = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setButtonStylePanelId(null);
    setEditingTable(null);
    setTableStylePanelId((current) => (current === elementId ? null : elementId));
  };

  const openButtonStylePanel = (elementId: string) => {
    rememberSectionPanel(sectionId, null);
    setSectionPanel(null);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId((current) => (current === elementId ? null : elementId));
  };

  const toggleSectionPanel = (panel: SectionPanel) => {
    const nextPanel = sectionPanel === panel ? null : panel;
    rememberSectionPanel(sectionId, nextPanel);
    setImageStylePanelId(null);
    setImageLinkPanelId(null);
    setColumnPanel(null);
    setOpenColumn(null);
    setEditingButton(null);
    setEditingTable(null);
    setTableStylePanelId(null);
    setButtonStylePanelId(null);
    setSliderEditorId(null);
    setSectionPanel(nextPanel);
  };

  useEffect(() => {
    if (!selection) return;
    const closeSelection = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-custom-section-panel]")) return;
      if (target?.closest("[data-custom-image-style-panel]")) return;
      if (target?.closest("[data-custom-image-link-panel]")) return;
      if (target?.closest("[data-custom-column-layout-panel]")) return;
      if (target?.closest("[data-custom-add-content-panel]")) return;
      if (target?.closest("[data-custom-slider-editor-panel]")) return;
      if (target?.closest("[data-custom-faq-editor-panel]")) return;
      if (target?.closest("[data-custom-testimonial-editor-panel]")) return;
      if (target?.closest("[data-custom-testimonial-settings-panel]")) return;
      if (target?.closest("[data-custom-button-editor-panel]")) return;
      if (target?.closest("[data-custom-table-editor-panel]")) return;
      if (target?.closest("[data-custom-table-style-panel]")) return;
      if (target?.closest("[data-custom-button-style-panel]")) return;
      if (!sectionRef.current?.contains(event.target as Node)) {
        setSelection(null);
        setOpenColumn(null);
        setEditingButton(null);
        setEditingTable(null);
        setTableStylePanelId(null);
        setButtonStylePanelId(null);
        setImageStylePanelId(null);
        setImageLinkPanelId(null);
        setMoreMenu(null);
      }
    };
    document.addEventListener("pointerdown", closeSelection);
    return () => document.removeEventListener("pointerdown", closeSelection);
  }, [selection]);

  useEffect(() => {
    if (!sectionPanel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        rememberSectionPanel(sectionId, null);
        setSectionPanel(null);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [sectionPanel, sectionId]);

  useEffect(() => {
    if (!imageStylePanelId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeImageStylePanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [imageStylePanelId]);

  useEffect(() => {
    if (!imageLinkPanelId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeImageLinkPanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [imageLinkPanelId]);

  useEffect(() => {
    if (!columnPanel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeColumnPanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [columnPanel]);

  useEffect(() => {
    if (openColumn === null) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAddContentPanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [openColumn]);

  useEffect(() => {
    if (!editingButton) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeButtonEditorPanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [editingButton]);

  useEffect(() => {
    if (!editingTable) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTableEditorPanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [editingTable]);

  useEffect(() => {
    if (!tableStylePanelId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTableStylePanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [tableStylePanelId]);

  useEffect(() => {
    if (!buttonStylePanelId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeButtonStylePanel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [buttonStylePanelId]);

  useEffect(() => {
    if (!sliderEditorId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSliderEditorId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [sliderEditorId]);

  useEffect(() => {
    if (!faqEditorId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFaqEditorId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [faqEditorId]);

  useEffect(() => {
    if (!testimonialEditorId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTestimonialEditor();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [testimonialEditorId]);

  useEffect(() => {
    if (!testimonialSettingsId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTestimonialSettings();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [testimonialSettingsId]);

  const updateElement = (elementId: string, patch: Partial<CustomElement>) => {
    window.dispatchEvent(new CustomEvent("ai-builder-custom-element-updated", { detail: { sectionId, elementId, patch } }));
  };

  const updateSectionSettings = (patch: Record<string, unknown>) => {
    if (sectionPanel) rememberSectionPanel(sectionId, sectionPanel);
    window.dispatchEvent(new CustomEvent("ai-builder-custom-section-updated", { detail: { sectionId, patch } }));
  };

  const updateColumn = (columnIndex: number, patch: Partial<CustomColumn>) => {
    window.dispatchEvent(new CustomEvent("ai-builder-custom-column-updated", {
      detail: { sectionId, columnIndex, patch },
    }));
  };

  const setColumnWidth = (columnIndex: number, newWidth: number) => {
    const widths = computeRedistributedColumnWidths(columns, columnIndex, newWidth);
    window.dispatchEvent(new CustomEvent("ai-builder-custom-column-widths-updated", {
      detail: { sectionId, widths },
    }));
  };

  const runElementAction = (
    columnIndex: number,
    elementId: string,
    action: "move-up" | "move-down" | "duplicate" | "delete",
  ) => {
    window.dispatchEvent(new CustomEvent("ai-builder-custom-element-action", { detail: { sectionId, columnIndex, elementId, action } }));
    setMoreMenu(null);
    if (action === "delete") {
      if (elementId === imageStylePanelId) closeImageStylePanel();
      if (elementId === imageLinkPanelId) closeImageLinkPanel();
      if (elementId === editingButton) closeButtonEditorPanel();
      if (elementId === editingTable) closeTableEditorPanel();
      if (elementId === tableStylePanelId) closeTableStylePanel();
      if (elementId === buttonStylePanelId) closeButtonStylePanel();
      if (elementId === sliderEditorId) setSliderEditorId(null);
      if (elementId === faqEditorId) setFaqEditorId(null);
      if (elementId === testimonialEditorId) closeTestimonialEditor();
      if (elementId === testimonialSettingsId) closeTestimonialSettings();
      setSelection({ kind: "column", columnIndex });
    }
  };

  const runColumnAction = (
    columnIndex: number,
    action: "move-left" | "move-right" | "add" | "duplicate" | "delete" | "clear",
  ) => {
    window.dispatchEvent(new CustomEvent("ai-builder-custom-column-action", { detail: { sectionId, columnIndex, action } }));
    setMoreMenu(null);
    if (action === "delete") {
      if (columnPanel?.index === columnIndex) closeColumnPanel();
      if (openColumn === columnIndex) closeAddContentPanel();
      setSelection(null);
    }
  };

  const runSectionAction = (action: "move-up" | "move-down" | "duplicate" | "delete") => {
    window.dispatchEvent(new CustomEvent("ai-builder-custom-section-action", { detail: { sectionId, action } }));
    setMoreMenu(null);
    if (action === "delete") setSelection(null);
  };

  const openColumnRef = useRef<number | null>(null);
  useEffect(() => {
    openColumnRef.current = openColumn;
  }, [openColumn]);

  const addElement = (columnIndex: number, type: CustomElement["type"]) => {
    if (typeof columnIndex !== "number" || columnIndex < 0) return;
    const resolvedSectionId =
      (typeof sectionId === "string" && sectionId.trim()) ||
      (typeof safeData.customSectionId === "string"
        ? safeData.customSectionId.trim()
        : "");
    if (!resolvedSectionId) return;
    window.dispatchEvent(
      new CustomEvent("ai-builder-custom-element-added", {
        detail: {
          sectionId: resolvedSectionId,
          columnIndex,
          type,
        },
      }),
    );
    closeAddContentPanel();
  };

  const openImageEditor = (elementId: string) => {
    const image = imageRefs.current.get(elementId);
    if (!image) return;
    image.dataset.customEditorOpen = "true";
    image.click();
    delete image.dataset.customEditorOpen;
  };

  const replaceImageWithAiOnline = async (
    elementId: string,
    columnIndex: number,
    currentSrc?: string,
  ) => {
    if (!requireCorePlanOrGoToUpgrade()) return;
    if (aiImageBusyId) return;
    setAiImageBusyId(elementId);
    try {
      const column = columns[columnIndex];
      const hint = (column?.elements || [])
        .filter(
          (item) =>
            (item.type === "heading" || item.type === "text") &&
            typeof item.value === "string" &&
            item.value.trim(),
        )
        .map((item) => String(item.value).replace(/<[^>]+>/g, " ").trim())
        .filter(Boolean)
        .slice(0, 4)
        .join(" ")
        .slice(0, 220);
      const category =
        new URLSearchParams(window.location.search).get("category") || "";
      let locale = "en-IN";
      let timeZone = "Asia/Kolkata";
      try {
        locale = navigator.language || locale;
        timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
      } catch {
        // keep defaults
      }
      const response = await fetch("/api/ai/related-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          locale,
          timeZone,
          hint:
            hint ||
            `custom ${columnIndex} ${elementId.slice(0, 8)} ${Date.now() % 1000}`,
          avoidSrc: currentSrc || "",
          avoidSrcs: (columns || [])
            .flatMap((col) => col.elements || [])
            .filter((el) => el.type === "image" && typeof el.src === "string")
            .map((el) => String(el.src))
            .filter(Boolean)
            .slice(0, 24),
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { url?: string };
      if (typeof data.url === "string" && data.url.trim()) {
        updateElement(elementId, { src: data.url.trim() });
      }
    } catch {
      /* keep current image on failure */
    } finally {
      setAiImageBusyId(null);
    }
  };

  const selectionToolbar = (
    label: string,
    children: React.ReactNode,
    menuKey: string,
    onClear?: () => void,
    options?: { showGrip?: boolean; showMore?: boolean },
  ) => (
    <div data-editor-toolbar className="absolute left-0 top-0 z-[60] flex w-max max-w-[calc(100vw-2rem)] -translate-y-full flex-col items-start" onClick={(event) => event.stopPropagation()}>
      <span className="shrink-0 whitespace-nowrap rounded-t-md bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-sm">›&nbsp; {label}</span>
      <div className="flex h-10 w-max max-w-[calc(100vw-2rem)] items-center gap-0.5 overflow-x-auto rounded-r-lg rounded-bl-lg border border-slate-200 bg-white px-1.5 shadow-xl">
        {options?.showGrip !== false && <span className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-slate-300"><GripVertical size={14}/></span>}
        {children}
        {options?.showMore !== false && <div className="relative shrink-0">
          <button type="button" className={toolbarButton} aria-label={`More ${label} options`} onClick={() => setMoreMenu(moreMenu === menuKey ? null : menuKey)}><Ellipsis size={18}/></button>
          {moreMenu === menuKey && (
            <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-xl">
              {onClear && <button type="button" onClick={onClear} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100">Clear content</button>}
              <button type="button" onClick={() => { setSelection(null); setMoreMenu(null); }} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100">Deselect</button>
            </div>
          )}
        </div>}
      </div>
    </div>
  );

  const responsiveSectionPadding = parseResponsiveSpacing(
    safeData.sectionPadding,
    DEFAULT_SECTION_PADDING,
  );
  const responsiveSectionMargin = parseResponsiveSpacing(
    safeData.sectionMargin,
    DEFAULT_SECTION_MARGIN,
  );
  const activeSectionPadding = responsiveSectionPadding[spacingDevice];
  const activeSectionMargin = responsiveSectionMargin[spacingDevice];
  // Live site follows viewport breakpoint; editor follows the Spacing device tab.
  const appliedSectionPadding =
    responsiveSectionPadding[editorMode ? spacingDevice : viewportSpacingDevice];
  const appliedSectionMargin =
    responsiveSectionMargin[editorMode ? spacingDevice : viewportSpacingDevice];
  const columnGap = typeof safeData.columnGap === "number" ? safeData.columnGap : 2;
  const contentWidth = safeData.contentWidth === "full" ? "full" : "container";
  const sectionBackgroundColor = typeof safeData.sectionBackgroundColor === "string" ? safeData.sectionBackgroundColor : "#ffffff";
  const sectionBackgroundImage = typeof safeData.sectionBackgroundImage === "string" ? safeData.sectionBackgroundImage : "";
  const sectionBorderWidth = typeof safeData.sectionBorderWidth === "number" ? safeData.sectionBorderWidth : 0;
  const sectionBorderColor = typeof safeData.sectionBorderColor === "string" ? safeData.sectionBorderColor : "#000000";
  const sectionName = typeof safeData.sectionName === "string" && safeData.sectionName.trim() ? safeData.sectionName.trim() : "Section";
  const sectionCssClass = typeof safeData.sectionCssClass === "string" ? safeData.sectionCssClass.trim() : "";
  const sectionHtmlId = typeof safeData.sectionHtmlId === "string" ? safeData.sectionHtmlId.trim() : "";
  const spacingScopeClass = `custom-section-spacing-${(sectionId || sectionHtmlId || "section").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const responsiveSpacingCss = buildResponsiveSpacingCss(
    spacingScopeClass,
    responsiveSectionPadding,
    responsiveSectionMargin,
  );
  const visibilityValue = typeof safeData.sectionVisibility === "object" && safeData.sectionVisibility !== null && !Array.isArray(safeData.sectionVisibility)
    ? safeData.sectionVisibility as Record<string, unknown>
    : {};
  const sectionVisibility = {
    desktop: visibilityValue.desktop !== false,
    tablet: visibilityValue.tablet !== false,
    mobile: visibilityValue.mobile !== false,
  };
  const safeClassNames = sectionCssClass.split(/\s+/).filter((name) => /^[A-Za-z_-][A-Za-z0-9_-]*$/.test(name)).join(" ");
  const visibilityClasses = editorMode ? "" : [
    !sectionVisibility.desktop ? "custom-section-hide-desktop" : "",
    !sectionVisibility.tablet ? "custom-section-hide-tablet" : "",
    !sectionVisibility.mobile ? "custom-section-hide-mobile" : "",
  ].filter(Boolean).join(" ");

  const changePadding = (side: keyof ColumnSpacing, value: number) => {
    const current = responsiveSectionPadding[spacingDevice];
    const nextSide = paddingLinked
      ? { top: value, right: value, bottom: value, left: value }
      : { ...current, [side]: value };
    const next: ResponsiveSpacing = {
      ...responsiveSectionPadding,
      [spacingDevice]: nextSide,
    };
    const isZeroed =
      nextSide.top === 0 &&
      nextSide.right === 0 &&
      nextSide.bottom === 0 &&
      nextSide.left === 0;
    (["desktop", "tablet", "mobile"] as const).forEach((device) => {
      if (device === spacingDevice) return;
      const other = responsiveSectionPadding[device];
      if (
        isZeroed ||
        (other.top === current.top &&
          other.right === current.right &&
          other.bottom === current.bottom &&
          other.left === current.left)
      ) {
        next[device] = nextSide;
      }
    });
    updateSectionSettings({
      sectionPadding: serializeResponsiveSpacing(next),
    });
  };

  const changeMargin = (side: keyof ColumnSpacing, value: number) => {
    const current = responsiveSectionMargin[spacingDevice];
    const nextSide = marginLinked
      ? { top: value, right: value, bottom: value, left: value }
      : { ...current, [side]: value };
    const next: ResponsiveSpacing = {
      ...responsiveSectionMargin,
      [spacingDevice]: nextSide,
    };
    const isZeroed =
      nextSide.top === 0 &&
      nextSide.right === 0 &&
      nextSide.bottom === 0 &&
      nextSide.left === 0;
    (["desktop", "tablet", "mobile"] as const).forEach((device) => {
      if (device === spacingDevice) return;
      const other = responsiveSectionMargin[device];
      if (
        isZeroed ||
        (other.top === current.top &&
          other.right === current.right &&
          other.bottom === current.bottom &&
          other.left === current.left)
      ) {
        next[device] = nextSide;
      }
    });
    updateSectionSettings({
      sectionMargin: serializeResponsiveSpacing(next),
    });
  };

  const activeImageStyleElement = imageStylePanelId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === imageStylePanelId && element.type === "image",
        )
    : undefined;

  const activeImageLinkElement = imageLinkPanelId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === imageLinkPanelId && element.type === "image",
        )
    : undefined;

  const activeSliderElement = sliderEditorId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === sliderEditorId && element.type === "slider",
        )
    : undefined;

  const activeFaqElement = faqEditorId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === faqEditorId && element.type === "faq",
        )
    : undefined;

  const activeTestimonialElement = testimonialEditorId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === testimonialEditorId &&
            element.type === "testimonial",
        )
    : undefined;

  const activeTestimonialSettingsElement = testimonialSettingsId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === testimonialSettingsId &&
            element.type === "testimonial",
        )
    : undefined;

  const activeEditingButton = editingButton
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === editingButton && element.type === "button",
        )
    : undefined;

  const activeEditingTable = editingTable
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === editingTable && element.type === "table",
        )
    : undefined;

  const activeTableStyleElement = tableStylePanelId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === tableStylePanelId && element.type === "table",
        )
    : undefined;

  const activeButtonStyleElement = buttonStylePanelId
    ? columns
        .flatMap((column) => column.elements ?? [])
        .find(
          (element): element is CustomElement =>
            element.id === buttonStylePanelId && element.type === "button",
        )
    : undefined;

  const activeColumnPanel = columnPanel !== null
    ? columns[columnPanel.index]
    : undefined;

  const changeColumnPadding = (
    columnIndex: number,
    column: CustomColumn,
    side: keyof ColumnSpacing,
    value: number,
  ) => {
    const current = getColumnPadding(column);
    const next = columnPaddingLinked
      ? { top: value, right: value, bottom: value, left: value }
      : { ...current, [side]: value };
    updateColumn(columnIndex, { padding: next });
  };

  const columnPanelTitle = columnPanel?.tab === "style"
    ? "Style"
    : columnPanel?.tab === "spacing"
      ? "Spacing"
      : columnPanel?.tab === "size"
        ? "Size"
        : "Layout";

  const layoutId = typeof safeData.layout === "string" ? safeData.layout : undefined;
  const columnWidthPercents = getColumnWidthPercents(columns);
  const columnWidthLimits = getColumnWidthLimits(columns.length);
  const customGridColumns = getColumnGridTemplateColumns(columns, layoutId);
  const canResizeColumnWidth = supportsColumnWidthResize(layoutId, columns.length);

  return (
    <section
      ref={sectionRef}
      data-custom-section-name={sectionName}
      data-custom-section-html-id={sectionHtmlId || undefined}
      onClick={(event) => {
        if (editorMode && event.currentTarget === event.target) setSelection({ kind: "section" });
      }}
      className={`relative overflow-visible ${spacingScopeClass} ${safeClassNames} ${visibilityClasses} ${editorMode && selection?.kind === "section" ? "outline outline-2 outline-blue-500" : ""}`}
      style={{
        backgroundColor: resolveThemeSurface(sectionBackgroundColor),
        backgroundImage: sectionBackgroundImage ? `url(${sectionBackgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderWidth: sectionBorderWidth,
        borderColor: sectionBorderColor,
        borderStyle: sectionBorderWidth > 0 ? "solid" : undefined,
        boxSizing: "border-box",
        fontFamily: THEME_FONT_BODY,
        color: THEME_SECONDARY_TEXT,
        // Inline spacing wins over the generated class, so setting 0 actually removes space.
        paddingTop: appliedSectionPadding.top,
        paddingRight: appliedSectionPadding.right,
        paddingBottom: appliedSectionPadding.bottom,
        paddingLeft: appliedSectionPadding.left,
        marginTop: appliedSectionMargin.top,
        marginRight: appliedSectionMargin.right,
        marginBottom: appliedSectionMargin.bottom,
        marginLeft: appliedSectionMargin.left,
      }}
    >
      <style>{`${responsiveSpacingCss} @media (max-width: 767px) { .custom-section-layout-grid { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto !important; grid-template-areas: none !important; } .custom-section-layout-grid > [data-custom-section-cell] { grid-area: auto !important; } .custom-section-hide-mobile { display: none !important; } } @media (min-width: 768px) and (max-width: 1023px) { .custom-section-hide-tablet { display: none !important; } } @media (min-width: 1024px) { .custom-section-hide-desktop { display: none !important; } } .custom-section-rich-text-preview { font-family: ${THEME_FONT_BODY}; color: ${THEME_SECONDARY_TEXT}; overflow-wrap: anywhere; word-break: break-word; max-width: 100%; } .custom-section-rich-text-preview * { overflow-wrap: anywhere; word-break: break-word; max-width: 100%; } .custom-section-text-block, .custom-section-heading-block { overflow-wrap: anywhere; word-break: break-word; max-width: 100%; min-width: 0; } .custom-section-layout-grid > [data-custom-section-cell] { min-width: 0; max-width: 100%; } .custom-section-rich-text-preview h1, .custom-section-rich-text-preview h2, .custom-section-rich-text-preview h3, .custom-section-rich-text-preview h4, .custom-section-rich-text-preview h5, .custom-section-rich-text-preview h6 { font-family: ${THEME_FONT_HEADING}; font-weight: 700; line-height: 1.25; } .custom-section-rich-text-preview h1 { font-size: 1.75rem; margin: 1.25em 0 0.5em; } .custom-section-rich-text-preview h2 { font-size: 1.4rem; margin: 1.4em 0 0.5em; } .custom-section-rich-text-preview h3 { font-size: 1.2rem; margin: 1.25em 0 0.45em; } .custom-section-rich-text-preview h4, .custom-section-rich-text-preview h5, .custom-section-rich-text-preview h6 { font-size: 1.1rem; margin: 1.1em 0 0.4em; } .custom-section-rich-text-preview ul { list-style: disc; padding-left: 1.25rem; } .custom-section-rich-text-preview ol { list-style: decimal; padding-left: 1.25rem; } .custom-section-rich-text-preview blockquote { border-left: 3px solid #cbd5e1; margin: 0.75rem 0; padding-left: 0.875rem; color: #475569; } .custom-section-rich-text-preview pre { background: #f8fafc; border-radius: 0.5rem; padding: 0.75rem 1rem; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; } .custom-section-rich-text-preview table { border-collapse: collapse; width: 100%; } .custom-section-rich-text-preview td, .custom-section-rich-text-preview th { border: 1px solid #cbd5e1; padding: 0.5rem; } .custom-section-btn { transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, filter 0.2s ease; } .custom-section-btn:hover { background-color: var(--btn-hover-bg) !important; color: var(--btn-hover-text) !important; border-color: var(--btn-hover-bg) !important; }`}</style>

      {editorMode && selection?.kind === "section" && selectionToolbar(sectionName, <>
        <button
          type="button"
          className={`${toolbarButton} text-violet-700 hover:bg-violet-50`}
          title={`AI Assist for ${sectionName}`}
          onClick={() => {
            if (!requireCorePlanOrGoToUpgrade()) return;
            window.dispatchEvent(
              new CustomEvent("ai-builder-open-section-chat", {
                detail: {
                  sectionId: sectionId || safeData.customSectionId,
                  sectionType: "CustomSection",
                  label: sectionName,
                },
              }),
            );
          }}
        >
          <Sparkles size={16} />
        </button>
        <button type="button" className={toolbarButton} title="Section settings" onClick={() => toggleSectionPanel("settings")}><Pencil size={16}/></button>
        <button type="button" className={toolbarButton} title="Section spacing" onClick={() => toggleSectionPanel("spacing")}>Spacing</button>
        <button type="button" className={toolbarButton} title="Section style" onClick={() => toggleSectionPanel("style")}>Style</button>
        <button type="button" className={toolbarButton} title="Duplicate section" onClick={() => runSectionAction("duplicate")}><Copy size={16}/></button>
        <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete section" onClick={() => runSectionAction("delete")}><Trash2 size={16}/></button>
      </>, "section", undefined, { showGrip: false, showMore: false })}

      {editorMode && selection?.kind === "section" && sectionPanel && createPortal(
        <div
          data-custom-section-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-section-panel-title"
          onClick={closeSectionPanel}
        >
        <aside data-editor-toolbar onClick={(event) => event.stopPropagation()} className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">
          <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Section editor</p>
              <h3 id="custom-section-panel-title" className="mt-1 text-2xl font-bold tracking-tight">{sectionPanel === "settings" ? "Section settings" : sectionPanel === "spacing" ? "Spacing" : "Style"}</h3>
              <p className="mt-1 text-sm text-slate-500">Customize this custom section.</p>
            </div>
            <button type="button" aria-label="Close section panel" onClick={closeSectionPanel} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X size={18}/></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {sectionPanel === "settings" ? <SectionSettingsEditor
            name={sectionName}
            cssClass={sectionCssClass}
            htmlId={sectionHtmlId}
            visibility={sectionVisibility}
            onSave={(patch) => {
              updateSectionSettings(patch);
              closeSectionPanel();
            }}
          /> : sectionPanel === "spacing" ? <div className="space-y-5">
            <div className="grid gap-2 text-sm"><span>Content width</span><div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => updateSectionSettings({ contentWidth: "container" })} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${contentWidth === "container" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Container</button><button type="button" onClick={() => updateSectionSettings({ contentWidth: "full" })} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${contentWidth === "full" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Full width</button></div></div>
            <label className="grid gap-2 text-sm"><span>Spacing between columns</span><div className="flex items-center gap-3"><input type="range" min="0" max="12" step="0.5" value={columnGap} onChange={(event) => updateSectionSettings({ columnGap: Number(event.target.value) })} className="min-w-0 flex-1"/><span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center">{columnGap}%</span></div></label>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
              {RESPONSIVE_DEVICE_OPTIONS.map(({ key, label, icon: DeviceIcon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSpacingDevice(key)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    spacingDevice === key
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <DeviceIcon size={14} />
                  {label}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm">Padding (inner spacing)</span><button type="button" onClick={() => setPaddingLinked((current) => !current)} className={`rounded-full px-3 py-1 text-xs font-semibold ${paddingLinked ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{paddingLinked ? "Linked" : "Unlinked"}</button></div>
              <div className="grid grid-cols-2 gap-3">
                {(["top", "right", "bottom", "left"] as const).map((side) => <label key={side} className="grid gap-1 text-xs capitalize text-slate-500">{side}<SpacingNumberInput key={`${spacingDevice}-${side}-${activeSectionPadding[side]}`} value={activeSectionPadding[side]} onCommit={(value) => changePadding(side, value)}/></label>)}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm">Margin (outer spacing)</span><button type="button" onClick={() => setMarginLinked((current) => !current)} className={`rounded-full px-3 py-1 text-xs font-semibold ${marginLinked ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{marginLinked ? "Linked" : "Unlinked"}</button></div>
              <div className="grid grid-cols-2 gap-3">
                {(["top", "right", "bottom", "left"] as const).map((side) => <label key={side} className="grid gap-1 text-xs capitalize text-slate-500">{side}<SpacingNumberInput key={`${spacingDevice}-${side}-${activeSectionMargin[side]}`} value={activeSectionMargin[side]} onCommit={(value) => changeMargin(side, value)}/></label>)}
              </div>
            </div>
            <button type="button" onClick={() => updateSectionSettings({ columnGap: 2, sectionPadding: serializeResponsiveSpacing(RESET_SECTION_PADDING), sectionMargin: serializeResponsiveSpacing({ desktop: DEFAULT_SECTION_MARGIN, tablet: { ...DEFAULT_SECTION_MARGIN }, mobile: { ...DEFAULT_SECTION_MARGIN } }) })} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={15}/>Reset Section Spacing</button>
          </div> : <div className="space-y-5">
            <div className="grid grid-cols-2 border-b border-slate-200"><button type="button" onClick={() => setStyleTab("color")} className={`border-b-2 px-3 py-2 text-sm font-semibold ${styleTab === "color" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"}`}>Color</button><button type="button" onClick={() => setStyleTab("image")} className={`border-b-2 px-3 py-2 text-sm font-semibold ${styleTab === "image" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"}`}>Image</button></div>
            {styleTab === "color" ? (
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Background color</span>
                <input
                  type="color"
                  value={colorInputValue(sectionBackgroundColor)}
                  onChange={(event) =>
                    updateSectionSettings({
                      sectionBackgroundColor: event.target.value,
                      sectionBackgroundImage: "",
                    })
                  }
                  className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    Background image
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBackgroundImagePicker(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Upload size={16} />
                    Upload
                  </button>
                </div>

                {sectionBackgroundImage ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sectionBackgroundImage}
                      alt="Section background preview"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                    No background image selected
                  </div>
                )}

                <label className="grid gap-2 text-sm">
                  <span>Image URL</span>
                  <input
                    value={sectionBackgroundImage}
                    onChange={(event) =>
                      updateSectionSettings({
                        sectionBackgroundImage: event.target.value,
                        sectionBackgroundColor: sectionBackgroundColor,
                      })
                    }
                    placeholder="/uploads/image.jpg"
                    className="h-10 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500"
                  />
                </label>

                {sectionBackgroundImage ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateSectionSettings({ sectionBackgroundImage: "" })
                    }
                    className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                  >
                    Remove background image
                  </button>
                ) : null}
              </div>
            )}
            <div className="border-t border-slate-200 pt-4"><p className="mb-3 text-sm">Border</p><div className="flex items-center gap-3"><input type="range" min="0" max="20" value={sectionBorderWidth} onChange={(event) => updateSectionSettings({ sectionBorderWidth: Number(event.target.value) })} className="min-w-0 flex-1"/><span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center">{sectionBorderWidth}px</span><input type="color" value={sectionBorderColor} onChange={(event) => updateSectionSettings({ sectionBorderColor: event.target.value })} className="h-9 w-10 rounded-full border border-slate-200 bg-white p-1"/></div></div>
          </div>}
          </div>
        </aside>
        </div>,
        document.body,
      )}

      <div
        className={`custom-section-layout-grid grid w-full overflow-visible ${contentWidth === "full" ? "max-w-none" : "mx-auto max-w-7xl"}`}
        style={selectedLayout ? {
          gridTemplateColumns: customGridColumns ?? selectedLayout.columns,
          gridTemplateRows: selectedLayout.rows,
          gridTemplateAreas: selectedLayout.areas,
          gap: `${columnGap}%`,
        } : {
          gridTemplateColumns: customGridColumns ?? `repeat(${Math.max(1, columns.length)}, minmax(0, 1fr))`,
          gap: `${columnGap}%`,
        }}
      >
        {columns.map((column, columnIndex) => {
          const isSelectedColumn = editorMode && selection?.kind === "column" && selection.columnIndex === columnIndex;
          const hasColumnContent = (column.elements?.length ?? 0) > 0;
          return (
            <div
              key={column.id}
              data-custom-section-cell
              onClick={(event) => { if (!editorMode) return; event.stopPropagation(); setSelection({ kind: "column", columnIndex }); }}
              className={`relative min-w-0 max-w-full overflow-visible rounded-sm bg-transparent transition ${
                editorMode && !hasColumnContent ? "min-h-48" : "min-h-0"
              } ${
                isSelectedColumn
                  ? "z-30 ring-1 ring-blue-500"
                  : editorMode
                    ? "border border-dashed border-slate-300 hover:border-blue-300"
                    : "border border-transparent"
              }`}
              style={getColumnCellStyle(
                column,
                selectedLayout ? String.fromCharCode(97 + columnIndex) : undefined,
              )}
            >
              {isSelectedColumn && selectionToolbar("Column", <>
                <button type="button" className={toolbarButton} disabled={columnIndex === 0} title="Move column left" onClick={() => runColumnAction(columnIndex, "move-left")}><ArrowLeft size={16}/></button>
                <button type="button" className={toolbarButton} disabled={columnIndex === columns.length - 1} title="Move column right" onClick={() => runColumnAction(columnIndex, "move-right")}><ArrowRight size={16}/></button>
                <button type="button" className={toolbarButton} disabled={columns.length >= MAX_CUSTOM_COLUMNS} title="Add column" onClick={() => runColumnAction(columnIndex, "add")}><Plus size={17}/></button>
                <button type="button" className={toolbarButton} disabled={columns.length >= MAX_CUSTOM_COLUMNS} title="Duplicate column" onClick={() => runColumnAction(columnIndex, "duplicate")}><Copy size={16}/></button>
                <button
                  type="button"
                  className={`${toolbarButton} px-3 ${columnPanel?.index === columnIndex && columnPanel.tab === "layout" ? "bg-slate-100 text-slate-900" : ""}`}
                  title="Column layout"
                  onClick={(event) => {
                    event.stopPropagation();
                    openColumnPanel(columnIndex, "layout");
                  }}
                >
                  Layout
                </button>
                <button
                  type="button"
                  className={`${toolbarButton} px-3 ${columnPanel?.index === columnIndex && columnPanel.tab === "style" ? "bg-slate-100 text-slate-900" : ""}`}
                  title="Column style"
                  onClick={(event) => {
                    event.stopPropagation();
                    openColumnPanel(columnIndex, "style");
                  }}
                >
                  Style
                </button>
                <button
                  type="button"
                  className={`${toolbarButton} px-3 ${columnPanel?.index === columnIndex && columnPanel.tab === "spacing" ? "bg-slate-100 text-slate-900" : ""}`}
                  title="Column spacing"
                  onClick={(event) => {
                    event.stopPropagation();
                    openColumnPanel(columnIndex, "spacing");
                  }}
                >
                  Spacing
                </button>
                <button
                  type="button"
                  className={`${toolbarButton} px-3 ${columnPanel?.index === columnIndex && columnPanel.tab === "size" ? "bg-slate-100 text-slate-900" : ""}`}
                  title="Column size"
                  onClick={(event) => {
                    event.stopPropagation();
                    openColumnPanel(columnIndex, "size");
                  }}
                >
                  Size
                </button>
                <button type="button" className={`${toolbarButton} hover:text-red-600`} disabled={columns.length <= 1} title="Delete column" onClick={() => runColumnAction(columnIndex, "delete")}><Trash2 size={16}/></button>
              </>, `column-${columnIndex}`, undefined, { showGrip: false, showMore: false })}

              <div
                style={getColumnContentStyle(column)}
                className={
                  editorMode && hasColumnContent ? "pb-6" : undefined
                }
              >
                {(column.elements ?? []).map((element, elementIndex) => {
                  // Index in key guards against duplicate element.id from AI patches.
                  const elementRenderKey = `${columnIndex}-${elementIndex}-${element.id || "el"}`;
                  const isSelectedElement = editorMode && selection?.kind === "element" && selection.elementId === element.id;
                  const selectElement = (event: React.MouseEvent) => {
                    if (!editorMode) return;
                    event.stopPropagation();
                    setSelection({ kind: "element", columnIndex, elementId: element.id, elementType: element.type });
                  };
                  const commonActions = <>
                    <button type="button" className={toolbarButton} disabled={elementIndex === 0} title="Move up" onClick={() => runElementAction(columnIndex, element.id, "move-up")}><ArrowUp size={16}/></button>
                    <button type="button" className={toolbarButton} disabled={elementIndex === (column.elements?.length ?? 0) - 1} title="Move down" onClick={() => runElementAction(columnIndex, element.id, "move-down")}><ArrowDown size={16}/></button>
                    <button type="button" className={toolbarButton} title="Duplicate" onClick={() => runElementAction(columnIndex, element.id, "duplicate")}><Copy size={16}/></button>
                    <button type="button" className={toolbarButton} title="Change alignment" onClick={() => updateElement(element.id, { align: element.align === "center" ? "right" : element.align === "right" ? "left" : "center" })}><AlignLeft size={16}/></button>
                    <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete" onClick={() => runElementAction(columnIndex, element.id, "delete")}><Trash2 size={16}/></button>
                  </>;

                  if (element.type === "testimonial") {
                    const testimonialActions = (
                      <>
                        <button
                          type="button"
                          className={`${toolbarButton} px-3 ${testimonialEditorId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                          title="Edit testimonials"
                          onClick={(event) => {
                            event.stopPropagation();
                            openTestimonialEditor(element.id);
                          }}
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button type="button" className={toolbarButton} disabled={elementIndex === 0} title="Move up" onClick={() => runElementAction(columnIndex, element.id, "move-up")}><ArrowUp size={16}/></button>
                        <button type="button" className={toolbarButton} disabled={elementIndex === (column.elements?.length ?? 0) - 1} title="Move down" onClick={() => runElementAction(columnIndex, element.id, "move-down")}><ArrowDown size={16}/></button>
                        <button type="button" className={toolbarButton} title="Duplicate" onClick={() => runElementAction(columnIndex, element.id, "duplicate")}><Copy size={16}/></button>
                        <button
                          type="button"
                          className={`${toolbarButton} px-3 ${testimonialSettingsId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                          title="Testimonial settings"
                          onClick={(event) => {
                            event.stopPropagation();
                            openTestimonialSettings(element.id);
                          }}
                        >
                          <Settings size={15} />
                        </button>
                        <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete" onClick={() => runElementAction(columnIndex, element.id, "delete")}><Trash2 size={16}/></button>
                      </>
                    );
                    return (
                      <div
                        key={elementRenderKey}
                        data-custom-editor-element
                        data-editor-no-inline
                        onClick={selectElement}
                        className={`relative w-full max-w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`}
                      >
                        {isSelectedElement &&
                          selectionToolbar(
                            "Testimonial",
                            testimonialActions,
                            `element-${element.id}`,
                            undefined,
                            { showGrip: false, showMore: false },
                          )}
                        <CustomElementTestimonial
                          element={element}
                          editorMode={Boolean(editorMode)}
                        />
                      </div>
                    );
                  }

                  if (element.type === "faq") {
                    const faqActions = (
                      <>
                        <button
                          type="button"
                          className={`${toolbarButton} px-3 ${faqEditorId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                          title="Edit FAQ"
                          onClick={(event) => {
                            event.stopPropagation();
                            openFaqEditor(element.id);
                          }}
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        {commonActions}
                      </>
                    );
                    return (
                      <div
                        key={elementRenderKey}
                        data-custom-editor-element
                        data-editor-no-inline
                        onClick={selectElement}
                        className={`relative w-full max-w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`}
                      >
                        {isSelectedElement &&
                          selectionToolbar(
                            "FAQ",
                            faqActions,
                            `element-${element.id}`,
                            undefined,
                            { showGrip: false, showMore: false },
                          )}
                        <CustomElementFaq element={element} />
                    </div>
                  );
                  }

                  if (element.type === "slider") {
                    const sliderActions = (
                      <>
                        <button
                          type="button"
                          className={`${toolbarButton} px-3 ${sliderEditorId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                          title="Edit slider"
                          onClick={(event) => {
                            event.stopPropagation();
                            openSliderEditor(element.id);
                          }}
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        {commonActions}
                      </>
                    );
                    return (
                      <div
                        key={elementRenderKey}
                        data-custom-editor-element
                        data-editor-no-inline
                        onClick={selectElement}
                        className={`relative w-full max-w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`}
                      >
                        {isSelectedElement &&
                          selectionToolbar(
                            "Slider",
                            sliderActions,
                            `element-${element.id}`,
                            undefined,
                            { showGrip: false, showMore: false },
                          )}
                        <CustomElementSlider
                          element={element}
                          editorMode={Boolean(editorMode)}
                        />
                      </div>
                    );
                  }

                  if (element.type === "image") {
                    const imageStyle = element.imageStyle ?? "cover";
                    const hasLink = Boolean(element.href && element.href !== "#");
                    const imageNode = (
                      <img
                        ref={(node) => { if (node) imageRefs.current.set(element.id, node); else imageRefs.current.delete(element.id); }}
                        src={element.src || "/bg1.jpg"}
                        alt="Custom content"
                        data-editor-media
                        data-editor-media-type="image"
                        data-editor-media-src={element.src || "/bg1.jpg"}
                        className={getImageDisplayClassName(
                          imageStyle,
                          element.imageFullWidth,
                          typeof element.imageHeight === "number" && element.imageHeight > 0,
                        )}
                        style={getImageDisplayStyle(element)}
                      />
                    );
                    const imageActions = <>
                      <button type="button" className={toolbarButton} disabled={elementIndex === 0} title="Move up" onClick={() => runElementAction(columnIndex, element.id, "move-up")}><ArrowUp size={16}/></button>
                      <button type="button" className={toolbarButton} disabled={elementIndex === (column.elements?.length ?? 0) - 1} title="Move down" onClick={() => runElementAction(columnIndex, element.id, "move-down")}><ArrowDown size={16}/></button>
                      <button type="button" className={toolbarButton} title="Duplicate" onClick={() => runElementAction(columnIndex, element.id, "duplicate")}><Copy size={16}/></button>
                      <button
                        type="button"
                        className={`${toolbarButton} px-3 ${imageLinkPanelId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                        title="Add link"
                        onClick={(event) => {
                          event.stopPropagation();
                          openImageLinkPanel(element.id);
                        }}
                      >
                        <Link2 size={15} /> Link
                      </button>
                      <button
                        type="button"
                        className={`${toolbarButton} px-3 ${imageStylePanelId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                        title="Image style"
                        onClick={(event) => {
                          event.stopPropagation();
                          openImageStylePanel(element.id);
                        }}
                      >
                        Style
                      </button>
                      <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete" onClick={() => runElementAction(columnIndex, element.id, "delete")}><Trash2 size={16}/></button>
                    </>;

                    return (
                    <div key={elementRenderKey} data-custom-editor-element data-editor-no-inline onClick={selectElement} className={`relative w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`} style={{ textAlign: element.align ?? "left" }}>
                      {isSelectedElement && selectionToolbar("Image", <>
                        <button
                          type="button"
                          className={`${toolbarButton} text-violet-700 hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60`}
                          title="AI — change to related online image"
                          disabled={aiImageBusyId === element.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void replaceImageWithAiOnline(
                              element.id,
                              columnIndex,
                              element.src,
                            );
                          }}
                        >
                          {aiImageBusyId === element.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Sparkles size={15} />
                          )}
                        </button>
                        <button type="button" className={toolbarButton} title="Change Image" onClick={() => openImageEditor(element.id)}><Pencil size={15}/> Change Image</button>
                        {imageActions}
                      </>, `element-${element.id}`, undefined, { showGrip: false, showMore: false })}
                      {hasLink ? (
                        <a
                          href={element.href}
                          onClick={(event) => editorMode && event.preventDefault()}
                          target={element.openInNewTab ? "_blank" : undefined}
                          rel={element.openInNewTab ? "noopener noreferrer" : undefined}
                          className="inline-block max-w-full"
                        >
                          {imageNode}
                        </a>
                      ) : (
                        imageNode
                      )}
                    </div>
                  );
                  }

                  if (element.type === "button") {
                    const Icon = element.icon && element.icon !== "none" ? buttonIcons[element.icon] : null;
                    const icon = Icon ? <Icon aria-hidden="true" size={16}/> : null;
                    const buttonActions = <>
                      <button
                        type="button"
                        className={`${toolbarButton} ${editingButton === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                        title="Edit button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openButtonEditorPanel(element.id);
                        }}
                      >
                        <Pencil size={16}/>
                      </button>
                      <button
                        type="button"
                        className={`${toolbarButton} px-3 ${buttonStylePanelId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                        title="Button style"
                        onClick={(event) => {
                          event.stopPropagation();
                          openButtonStylePanel(element.id);
                        }}
                      >
                        Style
                      </button>
                      <button type="button" className={toolbarButton} disabled={elementIndex === 0} title="Move up" onClick={() => runElementAction(columnIndex, element.id, "move-up")}><ArrowUp size={16}/></button>
                      <button type="button" className={toolbarButton} disabled={elementIndex === (column.elements?.length ?? 0) - 1} title="Move down" onClick={() => runElementAction(columnIndex, element.id, "move-down")}><ArrowDown size={16}/></button>
                      <button type="button" className={toolbarButton} title="Duplicate" onClick={() => runElementAction(columnIndex, element.id, "duplicate")}><Copy size={16}/></button>
                      <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete" onClick={() => runElementAction(columnIndex, element.id, "delete")}><Trash2 size={16}/></button>
                    </>;
                    return (
                      <div
                        key={elementRenderKey}
                        data-custom-editor-element
                        data-editor-no-inline
                        onClick={selectElement}
                        className={`relative w-full max-w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`}
                        style={{ textAlign: element.align ?? "left" }}
                      >
                        {isSelectedElement && selectionToolbar("Button", buttonActions, `element-${element.id}`, undefined, { showGrip: false, showMore: false })}
                        <a
                          href={element.href || "#"}
                          onClick={(event) => editorMode && event.preventDefault()}
                          target={element.openInNewTab ? "_blank" : undefined}
                          rel={element.openInNewTab ? "noopener noreferrer" : undefined}
                          className="custom-section-btn inline-flex max-w-full items-center gap-2 break-words rounded-lg px-5 py-3 font-semibold"
                          style={getButtonAppearanceStyle(element)}
                        >
                          {element.iconPosition === "before" ? icon : null}{element.value || "Button"}{element.iconPosition !== "before" ? icon : null}
                        </a>
                      </div>
                    );
                  }

                  if (element.type === "table") {
                    const tableActions = <>
                      <button
                        type="button"
                        className={`${toolbarButton} px-3 ${editingTable === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                        title="Edit Table"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTableEditorPanel(element.id);
                        }}
                      >
                        <Pencil size={15} /> Edit Table
                      </button>
                      <button
                        type="button"
                        className={`${toolbarButton} px-3 ${tableStylePanelId === element.id ? "bg-slate-100 text-slate-900" : ""}`}
                        title="Table style"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTableStylePanel(element.id);
                        }}
                      >
                        Style
                      </button>
                      <button type="button" className={toolbarButton} disabled={elementIndex === 0} title="Move up" onClick={() => runElementAction(columnIndex, element.id, "move-up")}><ArrowUp size={16}/></button>
                      <button type="button" className={toolbarButton} disabled={elementIndex === (column.elements?.length ?? 0) - 1} title="Move down" onClick={() => runElementAction(columnIndex, element.id, "move-down")}><ArrowDown size={16}/></button>
                      <button type="button" className={toolbarButton} title="Duplicate" onClick={() => runElementAction(columnIndex, element.id, "duplicate")}><Copy size={16}/></button>
                      <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete" onClick={() => runElementAction(columnIndex, element.id, "delete")}><Trash2 size={16}/></button>
                    </>;
                    return (
                      <div key={elementRenderKey} data-custom-editor-element data-editor-no-inline onClick={selectElement} className={`relative w-full max-w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`} style={getTableWrapperStyle(element)}>
                        {isSelectedElement && selectionToolbar("Table", tableActions, `element-${element.id}`, undefined, { showGrip: false, showMore: false })}
                        <div className="w-full overflow-x-auto rounded-lg" style={getTableElementStyle(element)}>
                          <table className="w-full table-fixed border-collapse text-sm">
                            <tbody>
                              {getTableRows(element.rows).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="break-words border border-slate-300 align-top"
                                      style={getTableTdStyle(element, cell)}
                                    >
                                      {cell.text}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                    </div>
                  );
                  }

                  if (element.type === "heading") {
                    const headingLevel = getHeadingLevel(element.headingLevel);
                    const headingSize = getHeadingFontSize(
                      element.fontSize,
                      headingLevel,
                    );
                    const headingColor = getHeadingTextColor(element.textColor);
                    const headingPlain = stripToPlainText(
                      element.value || "",
                    ) || "Add a heading";
                    const HeadingTag =
                      `h${headingLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
                    const headingActions = <>
                      <label
                        className={`${toolbarButton} gap-1 px-2`}
                        title="Heading level"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold uppercase text-slate-400">Type</span>
                        <select
                          value={headingLevel}
                          onChange={(event) => {
                            const level = getHeadingLevel(
                              Number(event.target.value),
                            );
                            updateElement(element.id, {
                              headingLevel: level,
                              fontSize: HEADING_LEVEL_SIZES[level],
                            });
                          }}
                          className="max-w-[6.5rem] rounded-md border-0 bg-transparent py-0.5 text-xs font-semibold text-slate-700 outline-none"
                        >
                          {HEADING_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              Heading {level}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label
                        className={`${toolbarButton} gap-1 px-2`}
                        title="Font size"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold uppercase text-slate-400">Size</span>
                        <select
                          value={headingSize}
                          onChange={(event) =>
                            updateElement(element.id, {
                              fontSize: Number(event.target.value),
                            })
                          }
                          className="max-w-[4.5rem] rounded-md border-0 bg-transparent py-0.5 text-xs font-semibold text-slate-700 outline-none"
                        >
                          {Array.from(
                            new Set([
                              ...Object.values(HEADING_LEVEL_SIZES),
                              headingSize,
                              16,
                              18,
                              36,
                              60,
                            ]),
                          )
                            .sort((a, b) => a - b)
                            .map((size) => (
                              <option key={size} value={size}>
                                {size}px
                              </option>
                            ))}
                        </select>
                      </label>
                      <label
                        className={`${toolbarButton} gap-1 px-2`}
                        title="Font color"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold uppercase text-slate-400">Color</span>
                        <input
                          type="color"
                          value={
                            headingColor.startsWith("#") &&
                            headingColor.length >= 4
                              ? headingColor
                              : DEFAULT_HEADING_TEXT_COLOR
                          }
                          onChange={(event) =>
                            updateElement(element.id, {
                              textColor: event.target.value,
                            })
                          }
                          className="h-5 w-5 cursor-pointer rounded border border-slate-200 bg-white p-0"
                        />
                      </label>
                      <button type="button" className={toolbarButton} disabled={elementIndex === 0} title="Move up" onClick={() => runElementAction(columnIndex, element.id, "move-up")}><ArrowUp size={16}/></button>
                      <button type="button" className={toolbarButton} disabled={elementIndex === (column.elements?.length ?? 0) - 1} title="Move down" onClick={() => runElementAction(columnIndex, element.id, "move-down")}><ArrowDown size={16}/></button>
                      <button type="button" className={toolbarButton} title="Duplicate" onClick={() => runElementAction(columnIndex, element.id, "duplicate")}><Copy size={16}/></button>
                      <button type="button" className={toolbarButton} title="Change alignment" onClick={() => updateElement(element.id, { align: element.align === "center" ? "right" : element.align === "right" ? "left" : "center" })}><AlignLeft size={16}/></button>
                      <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete" onClick={() => runElementAction(columnIndex, element.id, "delete")}><Trash2 size={16}/></button>
                    </>;
                  return (
                      <div
                        key={elementRenderKey}
                        data-custom-editor-element
                        data-editor-no-inline
                        onClick={selectElement}
                        className={`relative w-full min-w-0 max-w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`}
                      >
                        {isSelectedElement &&
                          selectionToolbar(
                            "Heading",
                            headingActions,
                            `element-${element.id}`,
                            undefined,
                            { showGrip: false, showMore: false },
                          )}
                        <HeadingTag
                          data-custom-text-id={element.id}
                          contentEditable={Boolean(editorMode)}
                          suppressContentEditableWarning
                          ref={(node: HTMLElement | null) => {
                            if (!node) return;
                            if (document.activeElement === node) return;
                            if (node.textContent !== headingPlain) {
                              node.textContent = headingPlain;
                            }
                          }}
                          onClick={(event) => {
                            if (!editorMode) return;
                            event.stopPropagation();
                            setSelection({
                              kind: "element",
                              columnIndex,
                              elementId: element.id,
                              elementType: "heading",
                            });
                          }}
                          onBlur={(event) => {
                            if (!editorMode) return;
                            const next = (
                              event.currentTarget.textContent || ""
                            )
                              .replace(/\u00a0/g, " ")
                              .trim();
                            if (next === headingPlain) return;
                            updateElement(element.id, {
                              value: next || "Add a heading",
                            });
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              event.currentTarget.blur();
                            }
                          }}
                          className="custom-section-heading-block m-0 max-w-full min-w-0 break-words font-bold tracking-tight outline-none [overflow-wrap:anywhere]"
                          style={{
                            textAlign: element.align ?? "left",
                            color: headingColor,
                            fontFamily: THEME_FONT_HEADING,
                            fontSize: `${headingSize}px`,
                            lineHeight: 1.25,
                            minHeight: "1.2em",
                          }}
                        />
                      </div>
                    );
                  }

                  const textBlockActions = <>
                    <button
                      type="button"
                      className={toolbarButton}
                      title="Edit text"
                      onClick={() =>
                        setRichTextEditor({
                          id: element.id,
                          value: element.value || "",
                        })
                      }
                    >
                      <Pencil size={15} /> Edit Text
                    </button>
                    <button type="button" className={toolbarButton} disabled={elementIndex === 0} title="Move up" onClick={() => runElementAction(columnIndex, element.id, "move-up")}><ArrowUp size={16}/></button>
                    <button type="button" className={toolbarButton} disabled={elementIndex === (column.elements?.length ?? 0) - 1} title="Move down" onClick={() => runElementAction(columnIndex, element.id, "move-down")}><ArrowDown size={16}/></button>
                    <button type="button" className={toolbarButton} title="Duplicate" onClick={() => runElementAction(columnIndex, element.id, "duplicate")}><Copy size={16}/></button>
                    <button type="button" className={`${toolbarButton} hover:text-red-600`} title="Delete" onClick={() => runElementAction(columnIndex, element.id, "delete")}><Trash2 size={16}/></button>
                  </>;

                  return (
                    <div key={elementRenderKey} data-custom-editor-element data-editor-no-inline onClick={selectElement} className={`relative min-w-0 max-w-full ${isSelectedElement ? "outline outline-2 outline-blue-500" : ""}`}>
                      {isSelectedElement && selectionToolbar("Text Block", textBlockActions, `element-${element.id}`, undefined, { showGrip: false, showMore: false })}
                      {looksLikeHtml(element.value || "") ? (
                        <div
                          data-custom-text-id={element.id}
                          className="custom-section-rich-text-preview custom-section-text-block max-w-full min-w-0 break-words text-base leading-7 [overflow-wrap:anywhere]"
                          style={{
                            color: THEME_SECONDARY_TEXT,
                            fontFamily: THEME_FONT_BODY,
                          }}
                          dangerouslySetInnerHTML={{ __html: element.value || "" }}
                        />
                      ) : (
                        <p
                          data-custom-text-id={element.id}
                          className="custom-section-text-block max-w-full min-w-0 break-words text-base leading-7 [overflow-wrap:anywhere]"
                          style={{
                            textAlign: element.align ?? "left",
                            color: THEME_SECONDARY_TEXT,
                            fontFamily: THEME_FONT_BODY,
                          }}
                        >
                          {element.value || defaultTextValue}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {editorMode && (
                <button
                  data-editor-toolbar
                  type="button"
                  aria-label="Add content to column"
                  onClick={(event) => {
                    event.stopPropagation();
                    openAddContentPanel(columnIndex);
                  }}
                  className={`${
                    (column.elements ?? []).length === 0
                      ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      : "absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-1/2"
                  } flex h-10 w-10 items-center justify-center rounded-full border border-blue-300 bg-blue-500 text-white shadow transition hover:scale-105 hover:bg-blue-600 ${openColumn === columnIndex ? "ring-2 ring-blue-300 ring-offset-2" : ""}`}
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editorMode && openColumn !== null && createPortal(
        <div
          data-custom-add-content-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-add-content-panel-title"
          onClick={closeAddContentPanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Column editor
                </p>
                <h3 id="custom-add-content-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Add content
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose what to add to this column.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close add content panel"
                onClick={closeAddContentPanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(
                  [
                    { type: "image" as const, label: "Image", description: "Add a photo or graphic", icon: ImageIcon },
                    { type: "slider" as const, label: "Image slider", description: "Add a multi-image carousel", icon: Images },
                    { type: "faq" as const, label: "FAQ", description: "Add accordion questions & answers", icon: CircleHelp },
                    { type: "testimonial" as const, label: "Testimonial", description: "Add customer reviews & quotes", icon: Quote },
                    { type: "heading" as const, label: "Heading", description: "Add a section title", icon: Heading2 },
                    { type: "text" as const, label: "Text editor", description: "Write and format text", icon: Text },
                    { type: "button" as const, label: "Button", description: "Add a call-to-action", icon: RectangleHorizontal },
                    { type: "table" as const, label: "Table", description: "Add rows and columns", icon: Table2 },
                  ] as const
                ).map(({ type, label, description, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const columnIndex =
                        openColumnRef.current ?? openColumn;
                      if (typeof columnIndex !== "number") return;
                      addElement(columnIndex, type);
                    }}
                    className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeAddContentPanel}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && columnPanel !== null && activeColumnPanel && createPortal(
        <div
          data-custom-column-layout-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-column-panel-title"
          onClick={closeColumnPanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Column editor
                </p>
                <h3 id="custom-column-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  {columnPanelTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {columnPanel.tab === "layout"
                    ? "Control how content is arranged inside this column."
                    : columnPanel.tab === "style"
                      ? "Customize the column background, border, and shadow."
                      : columnPanel.tab === "spacing"
                        ? "Adjust padding and spacing between elements."
                        : "Set the column width."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close column panel"
                onClick={closeColumnPanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {columnPanel.tab === "layout" ? (
                <ColumnLayoutPanelEditor
                  layoutPreset={activeColumnPanel.layoutPreset}
                  contentAlignH={activeColumnPanel.contentAlignH}
                  contentAlignV={activeColumnPanel.contentAlignV}
                  onPresetChange={(layoutPreset) =>
                    updateColumn(columnPanel.index, { layoutPreset })
                  }
                  onAlignHChange={(contentAlignH) =>
                    updateColumn(columnPanel.index, { contentAlignH })
                  }
                  onAlignVChange={(contentAlignV) =>
                    updateColumn(columnPanel.index, { contentAlignV })
                  }
                />
              ) : columnPanel.tab === "style" ? (
                <ColumnStylePanelEditor
                  backgroundColor={activeColumnPanel.backgroundColor}
                  backgroundImage={activeColumnPanel.backgroundImage}
                  cornerRadius={activeColumnPanel.cornerRadius}
                  borderWidth={activeColumnPanel.borderWidth}
                  borderColor={activeColumnPanel.borderColor}
                  shadow={activeColumnPanel.shadow}
                  styleTab={columnStyleTab}
                  onStyleTabChange={setColumnStyleTab}
                  onBackgroundColorChange={(backgroundColor) =>
                    updateColumn(columnPanel.index, {
                      backgroundColor,
                      backgroundImage: "",
                    })
                  }
                  onBackgroundImageChange={(backgroundImage) =>
                    updateColumn(columnPanel.index, { backgroundImage })
                  }
                  onCornerRadiusChange={(cornerRadius) =>
                    updateColumn(columnPanel.index, { cornerRadius })
                  }
                  onBorderWidthChange={(borderWidth) =>
                    updateColumn(columnPanel.index, { borderWidth })
                  }
                  onBorderColorChange={(borderColor) =>
                    updateColumn(columnPanel.index, { borderColor })
                  }
                  onShadowChange={(shadow) =>
                    updateColumn(columnPanel.index, { shadow })
                  }
                  onOpenImagePicker={() => setShowColumnBackgroundImagePicker(true)}
                />
              ) : columnPanel.tab === "spacing" ? (
                <ColumnSpacingPanelEditor
                  elementGap={activeColumnPanel.elementGap ?? 16}
                  padding={getColumnPadding(activeColumnPanel)}
                  paddingLinked={columnPaddingLinked}
                  onElementGapChange={(elementGap) =>
                    updateColumn(columnPanel.index, { elementGap })
                  }
                  onPaddingChange={(side, value) =>
                    changeColumnPadding(columnPanel.index, activeColumnPanel, side, value)
                  }
                  onPaddingLinkedChange={setColumnPaddingLinked}
                  onReset={() =>
                    updateColumn(columnPanel.index, {
                      elementGap: 16,
                      padding: DEFAULT_COLUMN_PADDING,
                    })
                  }
                />
              ) : (
                <ColumnSizePanelEditor
                  widthPercent={columnPanel ? columnWidthPercents[columnPanel.index] ?? 100 : 100}
                  minWidth={columnWidthLimits.min}
                  maxWidth={columnWidthLimits.max}
                  disabled={!canResizeColumnWidth}
                  onWidthChange={(widthPercent) =>
                    columnPanel && setColumnWidth(columnPanel.index, widthPercent)
                  }
                />
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeColumnPanel}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && tableStylePanelId && activeTableStyleElement && createPortal(
        <div
          data-custom-table-style-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-table-style-panel-title"
          onClick={closeTableStylePanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Table editor
                </p>
                <h3 id="custom-table-style-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Style
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Customize table background, padding, and margin.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close table style panel"
                onClick={closeTableStylePanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <TableStylePanelEditor
                backgroundColor={activeTableStyleElement.tableBackgroundColor}
                contentColor={activeTableStyleElement.tableContentColor}
                padding={activeTableStyleElement.tablePadding}
                margin={activeTableStyleElement.tableMargin}
                rowPadding={activeTableStyleElement.tableRowPadding}
                columnPadding={activeTableStyleElement.tableColumnPadding}
                cellPadding={activeTableStyleElement.tableCellPadding}
                onBackgroundColorChange={(tableBackgroundColor) =>
                  updateElement(activeTableStyleElement.id, { tableBackgroundColor })
                }
                onContentColorChange={(tableContentColor) =>
                  updateElement(activeTableStyleElement.id, {
                    tableContentColor,
                    rows: getTableRows(activeTableStyleElement.rows).map((row) =>
                      row.map((cell) => ({ ...cell, color: tableContentColor })),
                    ),
                  })
                }
                onPaddingChange={(tablePadding) =>
                  updateElement(activeTableStyleElement.id, { tablePadding })
                }
                onMarginChange={(tableMargin) =>
                  updateElement(activeTableStyleElement.id, { tableMargin })
                }
                onRowPaddingChange={(tableRowPadding) =>
                  updateElement(activeTableStyleElement.id, { tableRowPadding })
                }
                onColumnPaddingChange={(tableColumnPadding) =>
                  updateElement(activeTableStyleElement.id, { tableColumnPadding })
                }
                onCellPaddingChange={(tableCellPadding) =>
                  updateElement(activeTableStyleElement.id, { tableCellPadding })
                }
              />
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeTableStylePanel}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && editingTable && activeEditingTable && createPortal(
        <div
          data-custom-table-editor-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-table-editor-panel-title"
          onClick={closeTableEditorPanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(96vw,640px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Table editor
                </p>
                <h3 id="custom-table-editor-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Edit Table
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Edit cells and add or remove rows and columns.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close table editor"
                onClick={closeTableEditorPanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <TableEditorPanelEditor
                rows={getTableRows(activeEditingTable.rows)}
                onRowsChange={(rows) =>
                  updateElement(activeEditingTable.id, { rows })
                }
              />
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeTableEditorPanel}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && buttonStylePanelId && activeButtonStyleElement && createPortal(
        <div
          data-custom-button-style-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-button-style-panel-title"
          onClick={closeButtonStylePanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Button editor
                </p>
                <h3 id="custom-button-style-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Style
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose variant, colors, hover colors, and corner radius.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close button style panel"
                onClick={closeButtonStylePanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ButtonStylePanelEditor
                variant={activeButtonStyleElement.buttonVariant}
                backgroundColor={activeButtonStyleElement.buttonBackgroundColor}
                textColor={activeButtonStyleElement.buttonTextColor}
                hoverBackgroundColor={
                  activeButtonStyleElement.buttonHoverBackgroundColor
                }
                hoverTextColor={activeButtonStyleElement.buttonHoverTextColor}
                borderRadius={activeButtonStyleElement.buttonBorderRadius ?? 8}
                onVariantChange={(buttonVariant) =>
                  updateElement(activeButtonStyleElement.id, { buttonVariant })
                }
                onBackgroundColorChange={(buttonBackgroundColor) =>
                  updateElement(activeButtonStyleElement.id, { buttonBackgroundColor })
                }
                onTextColorChange={(buttonTextColor) =>
                  updateElement(activeButtonStyleElement.id, { buttonTextColor })
                }
                onHoverBackgroundColorChange={(buttonHoverBackgroundColor) =>
                  updateElement(activeButtonStyleElement.id, {
                    buttonHoverBackgroundColor,
                  })
                }
                onHoverTextColorChange={(buttonHoverTextColor) =>
                  updateElement(activeButtonStyleElement.id, {
                    buttonHoverTextColor,
                  })
                }
                onBorderRadiusChange={(buttonBorderRadius) =>
                  updateElement(activeButtonStyleElement.id, { buttonBorderRadius })
                }
                onResetColors={() =>
                  updateElement(activeButtonStyleElement.id, {
                    buttonBackgroundColor: undefined,
                    buttonTextColor: undefined,
                    buttonHoverBackgroundColor: undefined,
                    buttonHoverTextColor: undefined,
                  })
                }
              />
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeButtonStylePanel}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && editingButton && activeEditingButton && createPortal(
        <div
          data-custom-button-editor-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-button-editor-panel-title"
          onClick={closeButtonEditorPanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Button editor
                </p>
                <h3 id="custom-button-editor-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Edit button
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update the button text, link, and icon.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close button editor"
                onClick={closeButtonEditorPanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Button text
                <input
                  value={activeEditingButton.value || ""}
                  onChange={(event) =>
                    updateElement(activeEditingButton.id, { value: event.target.value })
                  }
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Link
                <input
                  value={activeEditingButton.href || "#"}
                  onChange={(event) =>
                    updateElement(activeEditingButton.id, { href: event.target.value })
                  }
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-800">
                  Icon
                  <select
                    value={activeEditingButton.icon || "none"}
                    onChange={(event) =>
                      updateElement(activeEditingButton.id, {
                        icon: event.target.value as CustomElement["icon"],
                      })
                    }
                    className="h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500"
                  >
                    <option value="none">No icon</option>
                    <option value="arrow-right">Arrow right</option>
                    <option value="arrow-left">Arrow left</option>
                    <option value="plus">Plus</option>
                    <option value="phone">Phone</option>
                    <option value="mail">Mail</option>
                    <option value="external-link">External link</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-800">
                  Position
                  <select
                    value={activeEditingButton.iconPosition || "after"}
                    onChange={(event) =>
                      updateElement(activeEditingButton.id, {
                        iconPosition: event.target.value as CustomElement["iconPosition"],
                      })
                    }
                    className="h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500"
                  >
                    <option value="before">Before</option>
                    <option value="after">After</option>
                  </select>
                </label>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-800">Alignment</p>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1.5">
                  {(["left", "center", "right"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateElement(activeEditingButton.id, { align: option })}
                      className={`flex h-10 flex-1 items-center justify-center rounded-lg transition ${
                        (activeEditingButton.align ?? "left") === option
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title={`Align ${option}`}
                      aria-label={`Align ${option}`}
                      aria-pressed={(activeEditingButton.align ?? "left") === option}
                    >
                      {option === "left" ? (
                        <AlignLeft size={18} />
                      ) : option === "center" ? (
                        <AlignCenter size={18} />
                      ) : (
                        <AlignRight size={18} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={activeEditingButton.openInNewTab === true}
                  onChange={(event) =>
                    updateElement(activeEditingButton.id, {
                      openInNewTab: event.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-blue-600"
                />
                Open in new tab
              </label>
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeButtonEditorPanel}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && imageLinkPanelId && activeImageLinkElement && createPortal(
        <div
          data-custom-image-link-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-image-link-panel-title"
          onClick={closeImageLinkPanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Image editor
                </p>
                <h3 id="custom-image-link-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Link
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Make this image clickable with a URL.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close image link panel"
                onClick={closeImageLinkPanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Link URL
                <input
                  value={activeImageLinkElement.href && activeImageLinkElement.href !== "#" ? activeImageLinkElement.href : ""}
                  onChange={(event) =>
                    updateElement(activeImageLinkElement.id, {
                      href: event.target.value.trim(),
                    })
                  }
                  placeholder="https://example.com"
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={activeImageLinkElement.openInNewTab === true}
                  onChange={(event) =>
                    updateElement(activeImageLinkElement.id, {
                      openInNewTab: event.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-blue-600"
                />
                Open in new tab
              </label>

              {activeImageLinkElement.href && activeImageLinkElement.href !== "#" ? (
                <button
                  type="button"
                  onClick={() =>
                    updateElement(activeImageLinkElement.id, {
                      href: "",
                      openInNewTab: false,
                    })
                  }
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                >
                  Remove link
                </button>
              ) : null}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeImageLinkPanel}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && imageStylePanelId && activeImageStyleElement && createPortal(
        <div
          data-custom-image-style-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-image-style-panel-title"
          onClick={closeImageStylePanel}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Image editor
                </p>
                <h3 id="custom-image-style-panel-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Style
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Customize how this image appears in the section.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close image style panel"
                onClick={closeImageStylePanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ImageStylePanelEditor
                imageSrc={activeImageStyleElement.src || "/bg1.jpg"}
                imageStyle={activeImageStyleElement.imageStyle}
                align={activeImageStyleElement.align}
                fullWidth={activeImageStyleElement.imageFullWidth}
                borderRadius={activeImageStyleElement.imageBorderRadius ?? 12}
                borderWidth={activeImageStyleElement.imageBorderWidth ?? 0}
                borderColor={activeImageStyleElement.imageBorderColor ?? "#000000"}
                imageWidth={activeImageStyleElement.imageWidth}
                imageHeight={activeImageStyleElement.imageHeight}
                onStyleChange={(style) =>
                  updateElement(activeImageStyleElement.id, { imageStyle: style })
                }
                onAlignChange={(align) =>
                  updateElement(activeImageStyleElement.id, { align })
                }
                onFullWidthChange={(imageFullWidth) =>
                  updateElement(activeImageStyleElement.id, {
                    imageFullWidth,
                    ...(imageFullWidth
                      ? { imageWidth: 100 }
                      : { imageWidth: null }),
                  })
                }
                onBorderRadiusChange={(imageBorderRadius) =>
                  updateElement(activeImageStyleElement.id, { imageBorderRadius })
                }
                onBorderWidthChange={(imageBorderWidth) =>
                  updateElement(activeImageStyleElement.id, { imageBorderWidth })
                }
                onBorderColorChange={(imageBorderColor) =>
                  updateElement(activeImageStyleElement.id, { imageBorderColor })
                }
                onWidthChange={(imageWidth) =>
                  updateElement(activeImageStyleElement.id, {
                    imageWidth,
                    imageFullWidth: typeof imageWidth === "number" && imageWidth >= 100,
                  })
                }
                onHeightChange={(imageHeight) =>
                  updateElement(activeImageStyleElement.id, { imageHeight })
                }
              />
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeImageStylePanel}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && richTextEditor && createPortal(
        <CustomSectionRichTextEditor
          open
          initialValue={richTextEditor.value}
          onClose={() => setRichTextEditor(null)}
          onSave={(html) => {
            updateElement(richTextEditor.id, { value: html });
            setRichTextEditor(null);
          }}
        />,
        document.body,
      )}

      {editorMode && sliderEditorId && activeSliderElement && createPortal(
        <div
          data-custom-slider-editor-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-slider-editor-title"
          onClick={closeSliderEditor}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Slider editor
                </p>
                <h3 id="custom-slider-editor-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Image slider
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add, replace, or remove slides.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close slider editor"
                onClick={closeSliderEditor}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  Cards per view
                </p>
                <p className="text-xs text-slate-500">
                  1 = single card, 2 = do cards ek saath, 3/4 = teen/char cards
                  ek row mein.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as const).map((count) => {
                    const activeCount = getSliderCardsPerView(
                      activeSliderElement.sliderCardsPerView,
                    );
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          const currentSlides = normalizeSliderSlides(
                            activeSliderElement.slides,
                          );
                          updateElement(activeSliderElement.id, {
                            sliderCardsPerView: count,
                            // Ensure enough images exist for the chosen layout
                            slides:
                              currentSlides.length < count
                                ? resizeSliderSlides(currentSlides, count)
                                : currentSlides,
                          });
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                          activeCount === count
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                Autoplay
                <input
                  type="checkbox"
                  checked={activeSliderElement.sliderAutoplay !== false}
                  onChange={(event) =>
                    updateElement(activeSliderElement.id, {
                      sliderAutoplay: event.target.checked,
                    })
                  }
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                Click image → popup
                <input
                  type="checkbox"
                  checked={activeSliderElement.sliderPopupOnClick === true}
                  onChange={(event) =>
                    updateElement(activeSliderElement.id, {
                      sliderPopupOnClick: event.target.checked,
                    })
                  }
                />
              </label>
              <p className="-mt-2 text-xs text-slate-500">
                On hone pe image click se full-screen popup khulega. Off hone pe
                sirf slider chalega.
              </p>

              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Height ({activeSliderElement.sliderHeight ?? 320}px)
                <input
                  type="range"
                  min={180}
                  max={560}
                  value={activeSliderElement.sliderHeight ?? 320}
                  onChange={(event) =>
                    updateElement(activeSliderElement.id, {
                      sliderHeight: Number(event.target.value),
                    })
                  }
                />
              </label>

              {normalizeSliderSlides(activeSliderElement.slides).map(
                (slide, slideIndex) => (
                <div
                  key={slide.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Image {slideIndex + 1}
                    </p>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      title="Remove image"
                      disabled={
                        normalizeSliderSlides(activeSliderElement.slides)
                          .length <=
                        getSliderCardsPerView(
                          activeSliderElement.sliderCardsPerView,
                        )
                      }
                      onClick={() => {
                        const minKeep = getSliderCardsPerView(
                          activeSliderElement.sliderCardsPerView,
                        );
                        const next = normalizeSliderSlides(
                          activeSliderElement.slides,
                        ).filter((item) => item.id !== slide.id);
                        updateElement(activeSliderElement.id, {
                          slides: resizeSliderSlides(
                            next,
                            Math.max(minKeep, next.length),
                          ),
                        });
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <img
                    src={slide.src}
                    alt={slide.alt || `Slide ${slideIndex + 1}`}
                    className="mb-3 h-28 w-full rounded-xl object-cover"
                  />
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Image URL
                    <input
                      type="text"
                      value={slide.src}
                      onChange={(event) => {
                        const next = normalizeSliderSlides(activeSliderElement.slides).map(
                          (item) =>
                            item.id === slide.id
                              ? { ...item, src: event.target.value }
                              : item,
                        );
                        updateElement(activeSliderElement.id, { slides: next });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50">
                    <Upload size={14} />
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const src = typeof reader.result === "string" ? reader.result : "";
                          if (!src) return;
                          const next = normalizeSliderSlides(activeSliderElement.slides).map(
                            (item) =>
                              item.id === slide.id ? { ...item, src } : item,
                          );
                          updateElement(activeSliderElement.id, { slides: next });
                        };
                        reader.readAsDataURL(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              ))}

              {normalizeSliderSlides(activeSliderElement.slides).length < 8 ? (
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => {
                    const current = normalizeSliderSlides(
                      activeSliderElement.slides,
                    );
                    updateElement(activeSliderElement.id, {
                      slides: resizeSliderSlides(current, current.length + 1),
                    });
                  }}
                >
                  <Plus size={16} /> Add image
                </button>
              ) : (
                <p className="text-center text-xs text-slate-400">
                  Maximum 8 images
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeSliderEditor}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && faqEditorId && activeFaqElement && createPortal(
        <div
          data-custom-faq-editor-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-faq-editor-title"
          onClick={closeFaqEditor}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  FAQ editor
                </p>
                <h3 id="custom-faq-editor-title" className="mt-1 text-2xl font-bold tracking-tight">
                  FAQ accordion
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add, edit, or remove questions and answers.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close FAQ editor"
                onClick={closeFaqEditor}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {normalizeFaqItems(activeFaqElement.faqItems).map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Question {index + 1}
                    </p>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      title="Remove question"
                      disabled={normalizeFaqItems(activeFaqElement.faqItems).length <= 1}
                      onClick={() => {
                        const next = normalizeFaqItems(activeFaqElement.faqItems).filter(
                          (row) => row.id !== item.id,
                        );
                        updateElement(activeFaqElement.id, {
                          faqItems: next.length ? next : [...DEFAULT_FAQ_ITEMS],
                        });
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Question
                    <input
                      type="text"
                      value={item.question}
                      onChange={(event) => {
                        const next = normalizeFaqItems(activeFaqElement.faqItems).map(
                          (row) =>
                            row.id === item.id
                              ? { ...row, question: event.target.value }
                              : row,
                        );
                        updateElement(activeFaqElement.id, { faqItems: next });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                    Answer
                    <textarea
                      value={item.answer}
                      rows={3}
                      onChange={(event) => {
                        const next = normalizeFaqItems(activeFaqElement.faqItems).map(
                          (row) =>
                            row.id === item.id
                              ? { ...row, answer: event.target.value }
                              : row,
                        );
                        updateElement(activeFaqElement.id, { faqItems: next });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                </div>
              ))}

              {normalizeFaqItems(activeFaqElement.faqItems).length < 20 ? (
                <button
                  type="button"
                  onClick={() => {
                    const current = normalizeFaqItems(activeFaqElement.faqItems);
                    updateElement(activeFaqElement.id, {
                      faqItems: [
                        ...current,
                        {
                          id: `faq-${Date.now()}-${current.length + 1}`,
                          question: `Question ${current.length + 1}`,
                          answer: "Add an answer here.",
                        },
                      ],
                    });
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <Plus size={16} /> Add question
                </button>
              ) : (
                <p className="text-center text-xs text-slate-400">
                  Maximum 20 questions
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeFaqEditor}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode && testimonialEditorId && activeTestimonialElement && createPortal(
        <div
          data-custom-testimonial-editor-panel
          className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-testimonial-editor-title"
          onClick={closeTestimonialEditor}
        >
          <aside
            data-editor-toolbar
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-[min(92vw,440px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Testimonial editor
                </p>
                <h3
                  id="custom-testimonial-editor-title"
                  className="mt-1 text-2xl font-bold tracking-tight"
                >
                  Customer reviews
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add, edit, or remove testimonials.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close testimonial editor"
                onClick={closeTestimonialEditor}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {normalizeTestimonialItems(
                activeTestimonialElement.testimonialItems,
              ).map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Review {index + 1}
                    </p>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      title="Remove review"
                      disabled={
                        normalizeTestimonialItems(
                          activeTestimonialElement.testimonialItems,
                        ).length <= 1
                      }
                      onClick={() => {
                        const next = normalizeTestimonialItems(
                          activeTestimonialElement.testimonialItems,
                        ).filter((row) => row.id !== item.id);
                        updateElement(activeTestimonialElement.id, {
                          testimonialItems: next.length
                            ? next
                            : [...DEFAULT_TESTIMONIAL_ITEMS],
                        });
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Name
                    <input
                      type="text"
                      value={item.name}
                      onChange={(event) => {
                        const next = normalizeTestimonialItems(
                          activeTestimonialElement.testimonialItems,
                        ).map((row) =>
                          row.id === item.id
                            ? { ...row, name: event.target.value }
                            : row,
                        );
                        updateElement(activeTestimonialElement.id, {
                          testimonialItems: next,
                        });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                    Role
                    <input
                      type="text"
                      value={item.role}
                      onChange={(event) => {
                        const next = normalizeTestimonialItems(
                          activeTestimonialElement.testimonialItems,
                        ).map((row) =>
                          row.id === item.id
                            ? { ...row, role: event.target.value }
                            : row,
                        );
                        updateElement(activeTestimonialElement.id, {
                          testimonialItems: next,
                        });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                    Quote
                    <textarea
                      value={item.quote}
                      rows={3}
                      onChange={(event) => {
                        const next = normalizeTestimonialItems(
                          activeTestimonialElement.testimonialItems,
                        ).map((row) =>
                          row.id === item.id
                            ? { ...row, quote: event.target.value }
                            : row,
                        );
                        updateElement(activeTestimonialElement.id, {
                          testimonialItems: next,
                        });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                    Image URL
                    <input
                      type="text"
                      value={item.image}
                      onChange={(event) => {
                        const next = normalizeTestimonialItems(
                          activeTestimonialElement.testimonialItems,
                        ).map((row) =>
                          row.id === item.id
                            ? { ...row, image: event.target.value }
                            : row,
                        );
                        updateElement(activeTestimonialElement.id, {
                          testimonialItems: next,
                        });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                    Rating
                    <select
                      value={item.rating}
                      onChange={(event) => {
                        const next = normalizeTestimonialItems(
                          activeTestimonialElement.testimonialItems,
                        ).map((row) =>
                          row.id === item.id
                            ? {
                                ...row,
                                rating: Math.max(
                                  1,
                                  Math.min(5, Number(event.target.value) || 5),
                                ),
                              }
                            : row,
                        );
                        updateElement(activeTestimonialElement.id, {
                          testimonialItems: next,
                        });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-blue-500"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} star{rating > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}

              {normalizeTestimonialItems(
                activeTestimonialElement.testimonialItems,
              ).length < 12 ? (
                <button
                  type="button"
                  onClick={() => {
                    const current = normalizeTestimonialItems(
                      activeTestimonialElement.testimonialItems,
                    );
                    updateElement(activeTestimonialElement.id, {
                      testimonialItems: [
                        ...current,
                        {
                          id: `testimonial-${Date.now()}-${current.length + 1}`,
                          name: `Customer ${current.length + 1}`,
                          role: "Customer",
                          quote: "Add a short testimonial quote here.",
                          image: "/bg1.jpg",
                          rating: 5,
                        },
                      ],
                    });
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <Plus size={16} /> Add review
                </button>
              ) : (
                <p className="text-center text-xs text-slate-400">
                  Maximum 12 reviews
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeTestimonialEditor}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {editorMode &&
        testimonialSettingsId &&
        activeTestimonialSettingsElement &&
        createPortal(
          <div
            data-custom-testimonial-settings-panel
            className="fixed inset-0 z-[10020] bg-slate-950/45 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-testimonial-settings-title"
            onClick={closeTestimonialSettings}
          >
            <aside
              data-editor-toolbar
              onClick={(event) => event.stopPropagation()}
              className="absolute inset-y-0 right-0 flex w-[min(92vw,400px)] flex-col bg-white text-slate-800 shadow-[-24px_0_70px_rgba(15,23,42,0.22)]"
            >
              <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Testimonial settings
                  </p>
                  <h3
                    id="custom-testimonial-settings-title"
                    className="mt-1 text-2xl font-bold tracking-tight"
                  >
                    Layout &amp; display
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Grid or slider, cards, navigation, and auto slide.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close testimonial settings"
                  onClick={closeTestimonialSettings}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Layout style
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "grid" as const, label: "Testimonial grid" },
                        { value: "slider" as const, label: "Slider" },
                      ] as const
                    ).map((option) => {
                      const active = getTestimonialLayout(
                        activeTestimonialSettingsElement.testimonialLayout,
                      );
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            updateElement(activeTestimonialSettingsElement.id, {
                              testimonialLayout: option.value,
                            })
                          }
                          className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                            active === option.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Card count
                  </p>
                  <p className="text-xs text-slate-500">
                    Desktop / tablet — cards in one row / view.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map((count) => {
                      const active = getTestimonialCardsPerView(
                        activeTestimonialSettingsElement.testimonialCardsPerView,
                      );
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() =>
                            updateElement(activeTestimonialSettingsElement.id, {
                              testimonialCardsPerView: count,
                            })
                          }
                          className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                            active === count
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                          }`}
                        >
                          {count} card{count > 1 ? "s" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Mobile card count
                  </p>
                  <p className="text-xs text-slate-500">
                    Phone width (&lt; 640px) pe kitne cards dikhen.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map((count) => {
                      const active = getTestimonialMobileCardsPerView(
                        activeTestimonialSettingsElement.testimonialMobileCardsPerView,
                      );
                      return (
                        <button
                          key={`mobile-${count}`}
                          type="button"
                          onClick={() =>
                            updateElement(activeTestimonialSettingsElement.id, {
                              testimonialMobileCardsPerView: count,
                            })
                          }
                          className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                            active === count
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                          }`}
                        >
                          {count} card{count > 1 ? "s" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-slate-800">
                  <span>Card padding</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={4}
                      max={48}
                      step={1}
                      value={getTestimonialCardPadding(
                        activeTestimonialSettingsElement.testimonialCardPadding,
                      )}
                      onChange={(event) =>
                        updateElement(activeTestimonialSettingsElement.id, {
                          testimonialCardPadding: Number(event.target.value),
                        })
                      }
                      className="min-w-0 flex-1"
                    />
                    <span className="w-14 rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-bold text-slate-700">
                      {getTestimonialCardPadding(
                        activeTestimonialSettingsElement.testimonialCardPadding,
                      )}
                      px
                    </span>
                  </div>
                </label>

                {getTestimonialLayout(
                  activeTestimonialSettingsElement.testimonialLayout,
                ) === "slider" ? (
                  <>
                    <div className="grid gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Navigation
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { value: "arrow" as const, label: "Arrow" },
                            { value: "bullet" as const, label: "Bullet" },
                          ] as const
                        ).map((option) => {
                          const active = getTestimonialNav(
                            activeTestimonialSettingsElement.testimonialNav,
                          );
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                updateElement(
                                  activeTestimonialSettingsElement.id,
                                  {
                                    testimonialNav: option.value,
                                  },
                                )
                              }
                              className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                                active === option.value
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Auto slide
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { value: true, label: "Yes" },
                            { value: false, label: "No" },
                          ] as const
                        ).map((option) => {
                          const active =
                            activeTestimonialSettingsElement.testimonialAutoplay ===
                            true;
                          return (
                            <button
                              key={String(option.value)}
                              type="button"
                              onClick={() =>
                                updateElement(
                                  activeTestimonialSettingsElement.id,
                                  {
                                    testimonialAutoplay: option.value,
                                  },
                                )
                              }
                              className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                                active === option.value
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500">
                        Auto slide runs on the live site (paused while editing).
                      </p>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="border-t border-slate-200 px-6 py-5">
                <button
                  type="button"
                  onClick={closeTestimonialSettings}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </aside>
          </div>,
          document.body,
        )}

      <ImageLibraryPicker
        open={showBackgroundImagePicker}
        title="Section background image"
        initialValue={sectionBackgroundImage}
        onClose={() => setShowBackgroundImagePicker(false)}
        onSelect={(source) => {
          updateSectionSettings({
            sectionBackgroundImage: source,
            sectionBackgroundColor: "#ffffff",
          });
          setShowBackgroundImagePicker(false);
        }}
      />

      <ImageLibraryPicker
        open={showColumnBackgroundImagePicker && columnPanel !== null}
        title="Column background image"
        initialValue={activeColumnPanel?.backgroundImage ?? ""}
        onClose={() => setShowColumnBackgroundImagePicker(false)}
        onSelect={(source) => {
          if (columnPanel !== null) {
            updateColumn(columnPanel.index, { backgroundImage: source });
          }
          setShowColumnBackgroundImagePicker(false);
        }}
      />
    </section>
  );
}
