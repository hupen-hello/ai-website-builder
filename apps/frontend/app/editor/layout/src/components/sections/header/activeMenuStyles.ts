import type { CSSProperties } from "react";

export type HeaderActiveMenuStyle =
  | "background"
  | "text-only"
  | "underline"
  | "curved-underline";

export const HEADER_ACTIVE_MENU_STYLE_OPTIONS: {
  value: HeaderActiveMenuStyle;
  label: string;
}[] = [
  { value: "background", label: "Background" },
  { value: "text-only", label: "Text only" },
  { value: "underline", label: "Underline" },
  { value: "curved-underline", label: "Curved line" },
];

export const DEFAULT_ACTIVE_MENU_LINE_GAP = 8;
export const DEFAULT_ACTIVE_MENU_PADDING = 8;

type ActiveMenuStyleOptions = {
  keepTextColor?: boolean;
  defaultTextColor?: string;
  lineGap?: number;
  menuPadding?: number;
};

export function getActiveMenuItemStyle(
  style: HeaderActiveMenuStyle | undefined,
  textColor: string,
  backgroundColor: string,
  options: ActiveMenuStyleOptions = {},
): CSSProperties {
  const resolvedStyle = style ?? "background";
  const keepTextColor = options.keepTextColor ?? false;
  const defaultTextColor = options.defaultTextColor ?? textColor;
  const activeTextColor = keepTextColor ? defaultTextColor : textColor;
  const lineColor = keepTextColor ? defaultTextColor : textColor;
  const lineGap = Math.max(
    0,
    options.lineGap ?? DEFAULT_ACTIVE_MENU_LINE_GAP,
  );
  const menuPadding = Math.max(
    0,
    options.menuPadding ?? DEFAULT_ACTIVE_MENU_PADDING,
  );

  switch (resolvedStyle) {
    case "text-only":
      return keepTextColor ? {} : { color: activeTextColor };
    case "underline":
      return {
        color: activeTextColor,
        backgroundColor: "transparent",
        borderBottom: `2px solid ${lineColor}`,
        borderRadius: 0,
        paddingBottom: `${lineGap}px`,
      };
    case "curved-underline":
      return {
        color: activeTextColor,
        backgroundColor: "transparent",
        boxShadow: `inset 0 -3px 0 ${lineColor}`,
        borderRadius: "9999px",
        paddingBottom: `${lineGap}px`,
      };
    case "background":
    default:
      return {
        color: activeTextColor,
        backgroundColor,
        padding: `${menuPadding}px`,
        borderRadius: "9999px",
      };
  }
}
