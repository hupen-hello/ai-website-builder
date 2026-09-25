import type { CSSProperties } from "react";

export const DEFAULT_ACCENT = "#0a8296";

export const getAccentStyle = (color?: string): CSSProperties =>
  ({
    "--accent": color || DEFAULT_ACCENT,
  }) as CSSProperties;

export const getAccentColor = (
  data: Record<string, unknown> | undefined,
) =>
  typeof data?.accentColor === "string" && data.accentColor.trim()
    ? data.accentColor
    : DEFAULT_ACCENT;
