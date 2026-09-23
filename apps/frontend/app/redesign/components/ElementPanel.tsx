"use client";

import { ChevronDown, Image as ImageIcon, Type, X } from "lucide-react";

export type SelectedElement = {
  sectionId: string;
  elementId: string;
  kind: "text" | "image";
  tagName: string;
  text?: string;
  src?: string;
  alt?: string;
  fontFamily: string;
  fontSize: string;
  color: string;
  textTransform: "none" | "uppercase" | "lowercase";
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
};

type SpacingKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft";

type ElementChanges = Partial<Pick<
  SelectedElement,
  "text" | "src" | "alt" | "fontFamily" | "fontSize" | "color" | "textTransform" | SpacingKey
>>;

type ElementPanelProps = {
  selection: SelectedElement | null;
  width: number;
  isDark: boolean;
  onChange: (selection: SelectedElement) => void;
  onClose: () => void;
};

const FONT_OPTIONS = [
  '"WF Visual Sans Variable", Arial, sans-serif',
  "Arial, sans-serif",
  "Georgia, serif",
  "Inter, sans-serif",
  "Roboto, sans-serif",
  '"Open Sans", sans-serif',
  "Lato, sans-serif",
  "Montserrat, sans-serif",
  "Poppins, sans-serif",
  "Nunito, sans-serif",
  "Raleway, sans-serif",
  '"Source Sans 3", sans-serif',
  "Oswald, sans-serif",
  "Merriweather, serif",
  '"Playfair Display", serif',
  "Times New Roman, serif",
  "ui-monospace, monospace",
];

const FONT_SIZES = [...Array.from({ length: 24 }, (_, index) => 5 + index * 4), 100];

const SPACING_SIDES = ["Top", "Right", "Bottom", "Left"] as const;

const toSpacingValue = (value: string) => {
  const numeric = parseFloat(value);
  return Number.isFinite(numeric) ? String(Math.round(numeric)) : "0";
};

function SpacingFields({
  prefix,
  selection,
  isDark,
  onChange,
}: {
  prefix: "margin" | "padding";
  selection: SelectedElement;
  isDark: boolean;
  onChange: (key: SpacingKey, value: string) => void;
}) {
  const inputClass = `h-8 w-full min-w-0 rounded-md border px-1 text-center text-[11px] outline-none focus:border-blue-500 ${
    isDark ? "border-white/10 bg-[#17191d] text-slate-100" : "border-slate-200 bg-white text-slate-900"
  }`;

  return (
    <div className="mt-2 grid grid-cols-4 gap-1">
      {SPACING_SIDES.map((side) => {
        const key = `${prefix}${side}` as SpacingKey;
        return (
          <label key={key} className={`min-w-0 text-center text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {side[0]}
            <input
              type="number"
              inputMode="numeric"
              aria-label={`${prefix} ${side.toLowerCase()}`}
              value={toSpacingValue(selection[key] ?? "0px")}
              onChange={(event) => {
                const next = event.target.value;
                onChange(key, next === "" ? "0px" : `${next}px`);
              }}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        );
      })}
    </div>
  );
}

export default function ElementPanel({ selection, width, isDark, onChange, onClose }: ElementPanelProps) {
  const updateElement = (changes: ElementChanges) => {
    if (!selection) return;
    onChange({ ...selection, ...changes });
    window.dispatchEvent(
      new CustomEvent("redesign-update-element", {
        detail: {
          sectionId: selection.sectionId,
          elementId: selection.elementId,
          changes,
        },
      }),
    );
  };

  const currentFontIsListed = selection ? FONT_OPTIONS.includes(selection.fontFamily) : false;
  const currentFontSizeIsListed = selection ? FONT_SIZES.some((size) => `${size}px` === selection.fontSize) : false;
  const fieldClass = `mt-2 w-full rounded-md border px-3 text-sm outline-none focus:border-blue-500 ${isDark ? "border-white/10 bg-[#17191d] text-slate-100" : "border-slate-200 bg-white text-slate-900"}`;

  return (
    <aside
      data-redesign-element-panel
      style={{ width: `${width}%` }}
      className={`flex min-w-0 shrink-0 flex-col overflow-y-auto border-l transition-colors lg:order-3 ${isDark ? "border-white/10 bg-[#1b1d21] text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
      aria-label="Selected element settings"
    >
      <div className={`flex h-12 shrink-0 items-center justify-between border-b px-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>
        <div className="flex items-center gap-2 text-sm font-bold">
          {selection ? (selection.kind === "image" ? <ImageIcon size={16} /> : <Type size={16} />) : <Type size={16} />}
          {selection ? (selection.kind === "image" ? "Image" : "Content") : "Content"}
        </div>
        <button type="button" onClick={onClose} aria-label="Close element settings" className={`rounded-md p-1.5 text-slate-500 transition ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-slate-100 hover:text-slate-900"}`}>
          <X size={17} />
        </button>
      </div>

      {!selection ? (
        <div className={`p-6 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Click any heading, paragraph, or image in the preview to edit it here.
        </div>
      ) : (
      <div className="p-3">
        <div className={`mb-4 flex items-center gap-2 border-b pb-3 text-xs font-bold ${isDark ? "border-white/10 text-slate-200" : "border-slate-200 text-slate-800"}`}>
          <ChevronDown size={14} />
          Content
          <span className="ml-auto rounded bg-slate-100 px-2 py-1 font-mono text-[10px] uppercase text-slate-500">{selection.tagName}</span>
        </div>

        {selection.kind === "image" ? (
          <>
            <div className={`mb-4 overflow-hidden rounded-lg border ${isDark ? "border-white/10 bg-[#17191d]" : "border-slate-200 bg-slate-50"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selection.src} alt={selection.alt || "Selected image"} className="h-36 w-full object-contain" />
            </div>
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition ${isDark ? "border-white/15 bg-[#17191d] hover:bg-[#202330]" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}`}>
              <span className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Upload image
              </span>
              <span className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                PNG, JPG, or WEBP
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => updateElement({ src: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <label className={`mt-4 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Alt text
              <input value={selection.alt ?? ""} onChange={(event) => updateElement({ alt: event.target.value })} className={`${fieldClass} h-10`} />
            </label>
          </>
        ) : (
          <>
            <label className={`block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Text
              <textarea
                key={selection.elementId}
                value={selection.text ?? ""}
                onChange={(event) => updateElement({ text: event.target.value })}
                rows={4}
                className={`${fieldClass} resize-none p-2.5 ${isDark ? "bg-[#202330]" : "bg-[#f0f2ff]"}`}
              />
            </label>

            <div className={`mt-4 text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Text case
              <div className={`mt-2 grid grid-cols-3 gap-1 rounded-lg border p-[6px] ${isDark ? "border-white/10 bg-[#17191d]" : "border-slate-200 bg-slate-50"}`}>
                {([
                  ["none", "Normal"],
                  ["uppercase", "UPPERCASE"],
                  ["lowercase", "lowercase"],
                ] as const).map(([value, title]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateElement({ textTransform: value })}
                    className={`rounded-md py-2 text-[10px] font-semibold transition ${selection.textTransform === value
                      ? "bg-blue-600 text-white shadow-sm"
                      : isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            <label className={`mt-4 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Font family
              <select value={selection.fontFamily} onChange={(event) => updateElement({ fontFamily: event.target.value })} className={`${fieldClass} h-9 text-xs`}>
                {!currentFontIsListed && <option value={selection.fontFamily} >{selection.fontFamily}</option>}
                {FONT_OPTIONS.map((font) => <option key={font} value={font} >{font.split(",")[0]}</option>)}
              </select>
            </label>

            <div className="mt-4 grid grid-cols-[1fr_52px] gap-3">
              <label className={`block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Font size
                <select value={selection.fontSize} onChange={(event) => updateElement({ fontSize: event.target.value })} className={`${fieldClass} h-9 text-xs`}>
                  {!currentFontSizeIsListed && <option value={selection.fontSize}>{selection.fontSize}</option>}
                  {FONT_SIZES.map((size) => <option key={size} value={`${size}px`}>{size}px</option>)}
                </select>
              </label>
              <label className={`block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Color
                <input type="color" value={selection.color} onChange={(event) => updateElement({ color: event.target.value })} className={`mt-2 h-10 w-full cursor-pointer rounded-md border p-1 ${isDark ? "border-white/10 bg-[#17191d]" : "border-slate-200 bg-white"}`} />
              </label>
            </div>
          </>
        )}

        <div className={`mt-5 flex items-center gap-2 border-b pb-3 text-xs font-bold ${isDark ? "border-white/10 text-slate-200" : "border-slate-200 text-slate-800"}`}>
          <ChevronDown size={14} />
          Spacing
        </div>

        <div className={`mt-4 text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          Margin
          <SpacingFields
            prefix="margin"
            selection={selection}
            isDark={isDark}
            onChange={(key, value) => updateElement({ [key]: value })}
          />
        </div>

        <div className={`mt-4 text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          Padding
          <SpacingFields
            prefix="padding"
            selection={selection}
            isDark={isDark}
            onChange={(key, value) => updateElement({ [key]: value })}
          />
        </div>
      </div>
      )}
    </aside>
  );
}
