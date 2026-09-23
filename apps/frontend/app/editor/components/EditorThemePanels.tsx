"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Camera, Check, Eye, EyeOff, RotateCcw, Type, X } from "lucide-react";
import ImageLibraryPicker from "../layout/src/components/builder/ImageLibraryPicker";
import {
  usePreview,
  type EditorPanel,
} from "../layout/src/components/context/PreviewContext";
import { getPublishedSiteUrl } from "@/lib/migrateGuestSite";
import {
  ensureThemeGoogleFontsLoaded,
} from "../layout/src/lib/themeTokens";

const COLOR_FIELDS: { key: string; label: string }[] = [
  { key: "--primary-bg", label: "Primary" },
  { key: "--secondary-bg", label: "Secondary" },
  { key: "--header-bg", label: "Header" },
  { key: "--hero-bg", label: "Hero background" },
  { key: "--primary-text", label: "Primary text" },
  { key: "--secondary-text", label: "Secondary text" },
  { key: "--header-text", label: "Header text" },
  { key: "--hero-title", label: "Hero title" },
  { key: "--primary-link-bg", label: "Button background" },
  { key: "--primary-link-color", label: "Button text" },
  { key: "--secondary-link-bg", label: "Secondary button" },
  { key: "--blue-bg", label: "Accent" },
];

const subscribeToClientMount = () => () => {};

const COLOR_PRESETS = [
  {
    name: "Ocean",
    values: {
      "--primary-bg": "#00cadd",
      "--secondary-bg": "#ffffff",
      "--header-bg": "#245c6e",
      "--hero-bg": "#0b1220",
      "--primary-text": "#ffffff",
      "--secondary-text": "#0f172a",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#0f172a",
      "--secondary-link-bg": "#00cadd",
      "--blue-bg": "#0668ff",
    },
  },
  {
    name: "Crimson",
    values: {
      "--primary-bg": "#dc2626",
      "--secondary-bg": "#fff7f7",
      "--header-bg": "#7f1d1d",
      "--hero-bg": "#111827",
      "--primary-text": "#ffffff",
      "--secondary-text": "#111827",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#7f1d1d",
      "--secondary-link-bg": "#dc2626",
      "--blue-bg": "#ef4444",
    },
  },
  {
    name: "Forest",
    values: {
      "--primary-bg": "#059669",
      "--secondary-bg": "#f0fdf4",
      "--header-bg": "#064e3b",
      "--hero-bg": "#052e1c",
      "--primary-text": "#ffffff",
      "--secondary-text": "#052e1c",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#064e3b",
      "--secondary-link-bg": "#059669",
      "--blue-bg": "#10b981",
    },
  },
  {
    name: "Indigo",
    values: {
      "--primary-bg": "#4f46e5",
      "--secondary-bg": "#eef2ff",
      "--header-bg": "#312e81",
      "--hero-bg": "#0f172a",
      "--primary-text": "#ffffff",
      "--secondary-text": "#0f172a",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#312e81",
      "--secondary-link-bg": "#4f46e5",
      "--blue-bg": "#6366f1",
    },
  },
  {
    name: "Sunset",
    values: {
      "--primary-bg": "#ea580c",
      "--secondary-bg": "#fff7ed",
      "--header-bg": "#9a3412",
      "--hero-bg": "#1c1917",
      "--primary-text": "#ffffff",
      "--secondary-text": "#1c1917",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#9a3412",
      "--secondary-link-bg": "#ea580c",
      "--blue-bg": "#f97316",
    },
  },
  {
    name: "Slate",
    values: {
      "--primary-bg": "#475569",
      "--secondary-bg": "#f8fafc",
      "--header-bg": "#1e293b",
      "--hero-bg": "#0f172a",
      "--primary-text": "#ffffff",
      "--secondary-text": "#0f172a",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#1e293b",
      "--secondary-link-bg": "#475569",
      "--blue-bg": "#64748b",
    },
  },
  {
    name: "Rose",
    values: {
      "--primary-bg": "#e11d48",
      "--secondary-bg": "#fff1f2",
      "--header-bg": "#881337",
      "--hero-bg": "#18181b",
      "--primary-text": "#ffffff",
      "--secondary-text": "#18181b",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#881337",
      "--secondary-link-bg": "#e11d48",
      "--blue-bg": "#f43f5e",
    },
  },
  {
    name: "Gold",
    values: {
      "--primary-bg": "#ca8a04",
      "--secondary-bg": "#fefce8",
      "--header-bg": "#713f12",
      "--hero-bg": "#1c1917",
      "--primary-text": "#ffffff",
      "--secondary-text": "#1c1917",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#713f12",
      "--secondary-link-bg": "#ca8a04",
      "--blue-bg": "#eab308",
    },
  },
  {
    name: "Midnight",
    values: {
      "--primary-bg": "#2563eb",
      "--secondary-bg": "#f1f5f9",
      "--header-bg": "#0f172a",
      "--hero-bg": "#020617",
      "--primary-text": "#ffffff",
      "--secondary-text": "#0f172a",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#0f172a",
      "--secondary-link-bg": "#2563eb",
      "--blue-bg": "#3b82f6",
    },
  },
  {
    name: "Violet",
    values: {
      "--primary-bg": "#7c3aed",
      "--secondary-bg": "#f5f3ff",
      "--header-bg": "#4c1d95",
      "--hero-bg": "#1e1b4b",
      "--primary-text": "#ffffff",
      "--secondary-text": "#1e1b4b",
      "--header-text": "#ffffff",
      "--hero-title": "#ffffff",
      "--primary-link-bg": "#ffffff",
      "--primary-link-color": "#4c1d95",
      "--secondary-link-bg": "#7c3aed",
      "--blue-bg": "#8b5cf6",
    },
  },
];

const normalizeThemeColor = (value?: string) => {
  const normalized = (value || "").trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    const [, r, g, b] = normalized;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return normalized;
};

const isColorPresetActive = (
  preset: (typeof COLOR_PRESETS)[number],
  variables: Record<string, string>,
) =>
  Object.entries(preset.values).every(
    ([key, value]) =>
      normalizeThemeColor(variables[key]) === normalizeThemeColor(value),
  );

const FONT_FAMILIES = [
  {
    id: "inter",
    label: "Inter",
    value: '"Inter", "Segoe UI", sans-serif',
  },
  {
    id: "system",
    label: "System UI",
    value: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  {
    id: "georgia",
    label: "Georgia",
    value: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "playfair",
    label: "Playfair Display",
    value: '"Playfair Display", Georgia, serif',
  },
  {
    id: "source-sans",
    label: "Source Sans 3",
    value: '"Source Sans 3", "Segoe UI", sans-serif',
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    value: '"Space Grotesk", "Segoe UI", sans-serif',
  },
  {
    id: "ibm-plex",
    label: "IBM Plex Sans",
    value: '"IBM Plex Sans", "Segoe UI", sans-serif',
  },
  {
    id: "nunito",
    label: "Nunito",
    value: '"Nunito", "Segoe UI", sans-serif',
  },
  {
    id: "poppins",
    label: "Poppins",
    value: '"Poppins", "Segoe UI", sans-serif',
  },
  {
    id: "montserrat",
    label: "Montserrat",
    value: '"Montserrat", "Segoe UI", sans-serif',
  },
  {
    id: "roboto",
    label: "Roboto",
    value: 'Roboto, "Segoe UI", sans-serif',
  },
  {
    id: "lato",
    label: "Lato",
    value: 'Lato, "Segoe UI", sans-serif',
  },
  {
    id: "open-sans",
    label: "Open Sans",
    value: '"Open Sans", "Segoe UI", sans-serif',
  },
  {
    id: "merriweather",
    label: "Merriweather",
    value: 'Merriweather, Georgia, serif',
  },
] as const;

const FONT_OPTIONS = [
  {
    id: "modern",
    label: "Modern Sans",
    heading: '"Inter", "Segoe UI", sans-serif',
    body: '"Inter", "Segoe UI", sans-serif',
    button: '"Inter", "Segoe UI", sans-serif',
  },
  {
    id: "classic",
    label: "Classic Serif",
    heading: 'Georgia, "Times New Roman", serif',
    body: 'Georgia, "Times New Roman", serif',
    button: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "elegant",
    label: "Elegant Mix",
    heading: '"Playfair Display", Georgia, serif',
    body: '"Source Sans 3", "Segoe UI", sans-serif',
    button: '"Source Sans 3", "Segoe UI", sans-serif',
  },
  {
    id: "tech",
    label: "Tech Mono",
    heading: '"Space Grotesk", "Segoe UI", sans-serif',
    body: '"IBM Plex Sans", "Segoe UI", sans-serif',
    button: '"Space Grotesk", "Segoe UI", sans-serif',
  },
  {
    id: "friendly",
    label: "Friendly Rounded",
    heading: '"Nunito", "Segoe UI", sans-serif',
    body: '"Nunito", "Segoe UI", sans-serif',
    button: '"Nunito", "Segoe UI", sans-serif',
  },
];

const DEFAULT_FONT_HEADING = FONT_FAMILIES[0].value;
const DEFAULT_FONT_BODY = FONT_FAMILIES[0].value;
const DEFAULT_FONT_BUTTON = FONT_FAMILIES[0].value;

const DEFAULT_THEME_FONTS: Record<string, string> = {
  "--font-heading": FONT_OPTIONS[0].heading,
  "--font-body": FONT_OPTIONS[0].body,
  "--font-button": FONT_OPTIONS[0].button,
  fontFamily: FONT_OPTIONS[0].body,
};

const FONT_BASELINE_KEYS = [
  "--font-heading",
  "--font-body",
  "--font-button",
  "fontFamily",
] as const;

const matchFontFamilyId = (value?: string) => {
  const normalized = (value || "").trim();
  if (!normalized) return FONT_FAMILIES[0].id;
  const match = FONT_FAMILIES.find((font) => font.value === normalized);
  return match?.id ?? FONT_FAMILIES[0].id;
};

const fontFamilyValueById = (id: string) =>
  FONT_FAMILIES.find((font) => font.id === id)?.value ?? DEFAULT_FONT_BODY;

function panelTitle(panel: EditorPanel) {
  if (panel === "theme-color") return "Theme Color";
  if (panel === "theme-fonts") return "Theme Fonts";
  if (panel === "settings") return "Settings";
  if (panel === "seo-meta") return "Meta Tags";
  if (panel === "seo-og") return "Open Graph";
  if (panel === "seo-schema") return "Schema Markup";
  if (panel === "seo-sitemap") return "Sitemap";
  if (panel === "seo-robots") return "Robots.txt";
  return "";
}

function toColorInputValue(value?: string) {
  if (!value) return "#000000";
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
}

export default function EditorThemePanels() {
  const {
    editorPanel,
    setEditorPanel,
    themeVariables,
    setThemeVariables,
    patchThemeVariable,
    siteSeo,
    patchSiteSeo,
    globalSeo,
    patchGlobalSeo,
    currentPage,
  } = usePreview();
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    () => true,
    () => false,
  );
  const baselineColorsRef = useRef<Record<string, string>>({});
  const baselineFontsRef = useRef<Record<string, string>>({});
  const publishedUrl =
    typeof window !== "undefined" ? getPublishedSiteUrl() : null;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";


  useEffect(() => {
    if (!editorPanel) return;
    if (
      editorPanel === "theme-color" &&
      !Object.keys(baselineColorsRef.current).length
    ) {
      const snapshot: Record<string, string> = {};
      for (const field of COLOR_FIELDS) {
        snapshot[field.key] = themeVariables[field.key] || "";
      }
      baselineColorsRef.current = snapshot;
    }
    if (
      editorPanel === "theme-fonts" &&
      !Object.keys(baselineFontsRef.current).length
    ) {
      const snapshot: Record<string, string> = {};
      for (const key of FONT_BASELINE_KEYS) {
        snapshot[key] = themeVariables[key] || DEFAULT_THEME_FONTS[key] || "";
      }
      baselineFontsRef.current = snapshot;
    }
  }, [editorPanel, themeVariables]);

  useEffect(() => {
    ensureThemeGoogleFontsLoaded();
  }, []);

  const selectedFontId = useMemo(() => {
    const heading = themeVariables["--font-heading"] || "";
    const body = themeVariables["--font-body"] || "";
    const button =
      themeVariables["--font-button"] ||
      themeVariables["--font-body"] ||
      "";
    const match = FONT_OPTIONS.find(
      (font) =>
        font.heading === heading &&
        font.body === body &&
        font.button === button,
    );
    return match?.id ?? null;
  }, [themeVariables]);

  const selectedColorPresetName = useMemo(() => {
    const match = COLOR_PRESETS.find((preset) =>
      isColorPresetActive(preset, themeVariables),
    );
    return match?.name ?? null;
  }, [themeVariables]);

  const headingFontId = useMemo(
    () => matchFontFamilyId(themeVariables["--font-heading"]),
    [themeVariables],
  );
  const bodyFontId = useMemo(
    () => matchFontFamilyId(themeVariables["--font-body"]),
    [themeVariables],
  );
  const buttonFontId = useMemo(
    () =>
      matchFontFamilyId(
        themeVariables["--font-button"] || themeVariables["--font-body"],
      ),
    [themeVariables],
  );

  const patchFontRole = (
    role: "heading" | "body" | "button",
    fontId: string,
  ) => {
    const value = fontFamilyValueById(fontId);
    if (role === "heading") {
      setThemeVariables({
        ...themeVariables,
        "--font-heading": value,
      });
      return;
    }
    if (role === "body") {
      setThemeVariables({
        ...themeVariables,
        "--font-body": value,
        fontFamily: value,
      });
      return;
    }
    setThemeVariables({
      ...themeVariables,
      "--font-button": value,
    });
  };

  const resetThemeFonts = () => {
    setThemeVariables({
      ...themeVariables,
      ...baselineFontsRef.current,
    });
  };

  const applyDefaultThemeFonts = () => {
    setThemeVariables({
      ...themeVariables,
      ...DEFAULT_THEME_FONTS,
    });
  };

  const [seoSaving, setSeoSaving] = useState(false);
  const [mediaPicker, setMediaPicker] = useState<"favicon" | "logo" | null>(
    null,
  );
  const [brandLogo, setBrandLogo] = useState("");
  const isSeoPanel = Boolean(editorPanel?.startsWith("seo-"));

  useEffect(() => {
    if (editorPanel !== "settings") return;
    const handleLogo = (event: Event) => {
      const detail = (event as CustomEvent<{ logoImage?: string }>).detail;
      setBrandLogo(typeof detail?.logoImage === "string" ? detail.logoImage : "");
    };
    window.addEventListener("ai-builder-brand-logo", handleLogo);
    window.dispatchEvent(new CustomEvent("ai-builder-brand-logo-request"));
    return () => {
      window.removeEventListener("ai-builder-brand-logo", handleLogo);
    };
  }, [editorPanel]);

  if (!mounted || !editorPanel) return null;

  const close = () => setEditorPanel(null);

  const saveSeo = async () => {
    setSeoSaving(true);
    window.dispatchEvent(new CustomEvent("ai-builder-seo-save"));
    window.setTimeout(() => setSeoSaving(false), 1800);
  };


  return createPortal(
    <>
    <div className="fixed inset-0 z-[10040] flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={close}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-editor-pop">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Editor
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {panelTitle(editorPanel)}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {editorPanel === "theme-color" ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">Presets</p>
                <p className="mt-1 text-xs text-slate-500">
                  Quick color themes for your whole website.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {COLOR_PRESETS.map((preset) => {
                    const active = selectedColorPresetName === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setThemeVariables({
                            ...themeVariables,
                            ...preset.values,
                          })
                        }
                        className={`relative rounded-2xl border p-3 text-left transition ${
                          active
                            ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-200"
                            : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                        }`}
                      >
                        {active ? (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check size={12} />
                          </span>
                        ) : null}
                        <div className="flex gap-1">
                          {[
                            preset.values["--primary-bg"],
                            preset.values["--header-bg"],
                            preset.values["--hero-bg"],
                            preset.values["--blue-bg"],
                          ].map((color) => (
                            <span
                              key={`${preset.name}-${color}`}
                              className="h-5 w-5 rounded-full border border-black/5"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {preset.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Custom colors
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fine-tune individual theme tokens.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setThemeVariables({
                        ...themeVariables,
                        ...baselineColorsRef.current,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {COLOR_FIELDS.map((field) => {
                    const value = themeVariables[field.key] || "#000000";
                    return (
                      <label
                        key={field.key}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-800">
                            {field.label}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {field.key}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <input
                            type="color"
                            value={toColorInputValue(value)}
                            onChange={(event) =>
                              patchThemeVariable(field.key, event.target.value)
                            }
                            className="h-9 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(event) =>
                              patchThemeVariable(field.key, event.target.value)
                            }
                            className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
                          />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {editorPanel === "theme-fonts" ? (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">
                Set separate font families for headings, paragraphs, and
                buttons across your site.
              </p>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Font families
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={applyDefaultThemeFonts}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      onClick={resetThemeFonts}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>
                  </div>
                </div>

                {(
                  [
                    {
                      id: "heading" as const,
                      label: "Heading",
                      hint: "Titles and section headlines",
                      value: headingFontId,
                      preview:
                        themeVariables["--font-heading"] || DEFAULT_FONT_HEADING,
                    },
                    {
                      id: "body" as const,
                      label: "Paragraph",
                      hint: "Body text and descriptions",
                      value: bodyFontId,
                      preview:
                        themeVariables["--font-body"] || DEFAULT_FONT_BODY,
                    },
                    {
                      id: "button" as const,
                      label: "Button",
                      hint: "Buttons and call-to-action labels",
                      value: buttonFontId,
                      preview:
                        themeVariables["--font-button"] ||
                        themeVariables["--font-body"] ||
                        DEFAULT_FONT_BUTTON,
                    },
                  ] as const
                ).map((field) => (
                  <label key={field.id} className="block space-y-2">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">
                        {field.label}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {field.hint}
                      </span>
                    </span>
                    <select
                      value={field.value}
                      onChange={(event) =>
                        patchFontRole(field.id, event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      style={{ fontFamily: field.preview }}
                    >
                      {FONT_FAMILIES.map((font) => (
                        <option
                          key={font.id}
                          value={font.id}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </option>
                      ))}
                    </select>
                    <p
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      style={{ fontFamily: field.preview }}
                    >
                      {field.id === "heading"
                        ? "Heading preview Aa"
                        : field.id === "button"
                          ? "Button label"
                          : "The quick brown fox jumps over the lazy dog."}
                    </p>
                  </label>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Quick presets
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Apply a ready-made combination to all three roles at once.
                </p>
                <div className="mt-3 space-y-3">
                  {FONT_OPTIONS.map((font) => {
                    const active = selectedFontId === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() =>
                          setThemeVariables({
                            ...themeVariables,
                            "--font-heading": font.heading,
                            "--font-body": font.body,
                            "--font-button": font.button,
                            fontFamily: font.body,
                          })
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-200"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className="text-lg font-bold text-slate-950"
                              style={{ fontFamily: font.heading }}
                            >
                              {font.label}
                            </p>
                            <p
                              className="mt-1 text-sm text-slate-600"
                              style={{ fontFamily: font.body }}
                            >
                              Paragraph · The quick brown fox jumps over the
                              lazy dog.
                            </p>
                            <span
                              className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                              style={{ fontFamily: font.button }}
                            >
                              Button
                            </span>
                          </div>
                          {active ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                              <Check size={14} />
                            </span>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <Type size={14} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {editorPanel === "settings" ? (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Site-wide brand and tracking. These apply to every page.
              </p>
              <div className="rounded-2xl border border-slate-200 p-4">
                <span className="block text-xs font-semibold text-slate-600">
                  Favicon
                </span>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                  Browser tab icon. Square PNG, ICO, or SVG works best.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {globalSeo.favicon ? (
                      <img
                        src={globalSeo.favicon}
                        alt="Favicon preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Camera size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPicker("favicon")}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {globalSeo.favicon ? "Change" : "Upload"}
                    </button>
                    {globalSeo.favicon ? (
                      <button
                        type="button"
                        onClick={() => patchGlobalSeo({ favicon: "" })}
                        className="rounded-full border border-red-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <span className="block text-xs font-semibold text-slate-600">
                  Logo
                </span>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                  Shown in the header and footer on every page.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-28 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {brandLogo ? (
                      <img
                        src={brandLogo}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-2 text-center text-[10px] font-semibold text-slate-400">
                        No logo
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPicker("logo")}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {brandLogo ? "Change" : "Upload"}
                    </button>
                    {brandLogo ? (
                      <button
                        type="button"
                        onClick={() => {
                          setBrandLogo("");
                          window.dispatchEvent(
                            new CustomEvent("ai-builder-set-brand-logo", {
                              detail: { logoImage: "", logoImageTitle: "" },
                            }),
                          );
                        }}
                        className="rounded-full border border-red-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Google Analytics
                </span>
                <input
                  type="text"
                  value={globalSeo.googleAnalyticsId || ""}
                  onChange={(e) =>
                    patchGlobalSeo({ googleAnalyticsId: e.target.value.trim() })
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
                <span className="mt-1 block text-[11px] text-slate-400">
                  Measurement ID from Google Analytics (starts with G-). Added
                  to the published website.
                </span>
              </label>
            </div>
          ) : null}

          {editorPanel === "seo-meta" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Editing SEO for{" "}
                <span className="font-semibold text-slate-900">
                  {currentPage || "Home"}
                </span>
                . Blank fields use auto values from your business name and
                description. Fill these to override.
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Meta title
                </span>
                <input
                  type="text"
                  value={siteSeo.metaTitle || ""}
                  onChange={(e) => patchSiteSeo({ metaTitle: e.target.value })}
                  placeholder="Page title for Google"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Meta description
                </span>
                <textarea
                  value={siteSeo.metaDescription || ""}
                  onChange={(e) =>
                    patchSiteSeo({ metaDescription: e.target.value })
                  }
                  rows={4}
                  placeholder="Short summary shown in search results"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Keywords
                </span>
                <input
                  type="text"
                  value={siteSeo.metaKeywords || ""}
                  onChange={(e) =>
                    patchSiteSeo({ metaKeywords: e.target.value })
                  }
                  placeholder="business, services, city"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
                <span className="mt-1 block text-[11px] text-slate-400">
                  Comma-separated
                </span>
              </label>
            </div>
          ) : null}

          {editorPanel === "seo-og" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Open Graph for{" "}
                <span className="font-semibold text-slate-900">
                  {currentPage || "Home"}
                </span>
                . Controls how this page looks when shared on social apps.
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  OG title
                </span>
                <input
                  type="text"
                  value={siteSeo.ogTitle || ""}
                  onChange={(e) => patchSiteSeo({ ogTitle: e.target.value })}
                  placeholder="Defaults to meta title"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  OG description
                </span>
                <textarea
                  value={siteSeo.ogDescription || ""}
                  onChange={(e) =>
                    patchSiteSeo({ ogDescription: e.target.value })
                  }
                  rows={3}
                  placeholder="Defaults to meta description"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  OG image URL
                </span>
                <input
                  type="url"
                  value={siteSeo.ogImage || ""}
                  onChange={(e) => patchSiteSeo({ ogImage: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
                <span className="mt-1 block text-[11px] text-slate-400">
                  Leave blank to use your banner/hero image
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  OG type
                </span>
                <select
                  value={siteSeo.ogType || "website"}
                  onChange={(e) => patchSiteSeo({ ogType: e.target.value })}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="website">website</option>
                  <option value="article">article</option>
                  <option value="business.business">business</option>
                </select>
              </label>
            </div>
          ) : null}

          {editorPanel === "seo-schema" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Structured data for Google. Pick a type, or paste custom
                JSON-LD.
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Schema type
                </span>
                <select
                  value={globalSeo.schemaType || "Organization"}
                  onChange={(e) => patchGlobalSeo({ schemaType: e.target.value })}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="Organization">Organization</option>
                  <option value="LocalBusiness">LocalBusiness</option>
                  <option value="ProfessionalService">
                    ProfessionalService
                  </option>
                  <option value="Store">Store</option>
                  <option value="Restaurant">Restaurant</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Custom JSON-LD (optional)
                </span>
                <textarea
                  value={globalSeo.schemaJson || ""}
                  onChange={(e) => patchGlobalSeo({ schemaJson: e.target.value })}
                  rows={10}
                  placeholder='{"@context":"https://schema.org","@type":"Organization",...}'
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs outline-none focus:border-blue-400"
                />
                <span className="mt-1 block text-[11px] text-slate-400">
                  If valid JSON is pasted, it replaces the auto-generated schema
                </span>
              </label>
            </div>
          ) : null}

          {editorPanel === "seo-sitemap" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Your published URL is included in the app sitemap automatically.
              </p>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={globalSeo.sitemapEnabled !== false}
                  onChange={(e) =>
                    patchGlobalSeo({ sitemapEnabled: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Include site in sitemap.xml
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Turn off if you do not want search engines listing this site
                    from the sitemap.
                  </span>
                </span>
              </label>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sitemap URL
                </p>
                <a
                  href={`${origin}/sitemap.xml`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-sm font-medium text-blue-600 hover:underline"
                >
                  {origin}/sitemap.xml
                </a>
                {publishedUrl ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Live page: {publishedUrl.replace(/^https?:\/\//, "")}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Publish once to add your live URL to the sitemap.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {editorPanel === "seo-robots" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Control indexing for this published page. App robots.txt still
                blocks /editor and /api.
              </p>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={globalSeo.robotsIndex !== false}
                  onChange={(e) =>
                    patchGlobalSeo({ robotsIndex: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Allow indexing (index)
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Uncheck to add noindex on the published page.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={globalSeo.robotsFollow !== false}
                  onChange={(e) =>
                    patchGlobalSeo({ robotsFollow: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Allow following links (follow)
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Uncheck to add nofollow on the published page.
                  </span>
                </span>
              </label>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Robots.txt
                </p>
                <a
                  href={`${origin}/robots.txt`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-sm font-medium text-blue-600 hover:underline"
                >
                  {origin}/robots.txt
                </a>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
            {isSeoPanel || editorPanel === "settings" ? (
              <button
                type="button"
                onClick={() => {
                  void saveSeo();
                }}
                disabled={seoSaving}
                className="w-full rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
                style={{ backgroundColor: "#116dff" }}
              >
                {seoSaving
                  ? "Saving..."
                  : editorPanel === "settings"
                    ? "Save settings"
                    : "Save SEO"}
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="w-full rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: "#116dff" }}
              >
                Done
              </button>
            )}
          </div>
      </aside>
    </div>
    <ImageLibraryPicker
      open={Boolean(mediaPicker)}
      title={mediaPicker === "logo" ? "Website logo" : "Website favicon"}
      initialValue={
        mediaPicker === "logo" ? brandLogo : globalSeo.favicon || ""
      }
      onClose={() => setMediaPicker(null)}
      onSelect={(source, fileName) => {
        if (mediaPicker === "logo") {
          setBrandLogo(source);
          window.dispatchEvent(
            new CustomEvent("ai-builder-set-brand-logo", {
              detail: { logoImage: source, logoImageTitle: fileName || "Logo" },
            }),
          );
        } else {
          patchGlobalSeo({ favicon: source });
        }
        setMediaPicker(null);
      }}
    />
    </>,
    document.body,
  );
}

function ProfileEditForm({
  user,
  updateProfile,
  uploadAvatar,
}: {
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  updateProfile: (input: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const initial = (user.name || user.email || "U").trim().charAt(0).toUpperCase();

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingAvatar(true);
    setError("");
    setMessage("");
    try {
      await uploadAvatar(file);
      setMessage("Profile photo updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateProfile({
        name,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Profile updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Profile photo
        </p>
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-2xl font-bold text-white transition hover:opacity-90 disabled:opacity-70"
            aria-label="Change profile photo"
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/50 py-1 text-white">
              <Camera size={14} />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-600">
              JPG, PNG, WEBP, or GIF. Max 2MB.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-70"
            >
              {uploadingAvatar ? "Uploading..." : "Change photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Edit profile
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Update your name or password. Email cannot be changed.
        </p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Email
          </span>
          <input
            type="email"
            value={user.email}
            readOnly
            disabled
            className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Change password
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Leave blank if you do not want to change it.
        </p>

        <label className="relative mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Current password
          </span>
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Required only for new password"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((prev) => !prev)}
            className="absolute right-3 top-[34px] flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </label>

        <label className="relative mt-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            New password
          </span>
          <input
            type={showNew ? "text" : "password"}
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={() => setShowNew((prev) => !prev)}
            className="absolute right-3 top-[34px] flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </label>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm font-medium text-emerald-600">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        style={{ backgroundColor: "#116dff" }}
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
