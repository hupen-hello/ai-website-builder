"use client";

import { Check } from "lucide-react";
import CategoryType from "@/components/sections/categorytype";
import {
  CREATE_AI_COLOR_PALETTES,
  CREATE_AI_FONTS,
} from "@/lib/create-ai-design-prefs";
import type { RedesignDesignPrefs } from "@/lib/redesign-design-prefs";

export type RedesignPrefsPhase = "category" | "pageType" | "color" | "font";

type Props = {
  phase: RedesignPrefsPhase;
  value: RedesignDesignPrefs;
  onChange: (next: RedesignDesignPrefs) => void;
};

const PHASE_META: Record<
  RedesignPrefsPhase,
  { step: string; title: string; hint: string }
> = {
  category: {
    step: "Redesign · Step 2",
    title: "Choose category",
    hint: "Pick the closest match — custom-layouts for this category power your home.",
  },
  pageType: {
    step: "Redesign · Step 3",
    title: "Single or multi page",
    hint: "Start with Home only, or open with multi-page slots ready.",
  },
  color: {
    step: "Redesign · Step 4",
    title: "Color palette",
    hint: "Theme colors for headers, buttons, and accents.",
  },
  font: {
    step: "Redesign · Step 5",
    title: "Font family",
    hint: "Heading + body pairing for a premium look.",
  },
};

export default function RedesignDesignPrefsStep({
  phase,
  value,
  onChange,
}: Props) {
  const meta = PHASE_META[phase];

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4 2xl:max-w-[1100px]">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#315ff4]">
          {meta.step}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {meta.title}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">{meta.hint}</p>
      </div>

      {phase === "category" && (
        <CategoryType
          selectedCategory={value.category}
          onCategoryChange={(category) => onChange({ ...value, category })}
          createPath="create-custom"
        />
      )}

      {phase === "pageType" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: "single-page" as const,
                  title: "Single page",
                  hint: "Home first — other nav links stay placeholders until you add pages",
                },
                {
                  id: "multi-page" as const,
                  title: "Multi page",
                  hint: "Home + ready page slots from the category template",
                },
              ] as const
            ).map((opt) => {
              const on = value.pageType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...value, pageType: opt.id })}
                  className={`relative rounded-xl border px-4 py-5 text-left transition ${
                    on
                      ? "border-[#315ff4] bg-blue-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {on && (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-[#315ff4] text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <div className="text-base font-semibold text-slate-900">
                    {opt.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{opt.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "color" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {CREATE_AI_COLOR_PALETTES.filter((p) => p.id !== "auto").map((p) => {
              const on = value.colorPalette === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...value, colorPalette: p.id })}
                  className={`relative rounded-xl border p-3 text-left transition ${
                    on
                      ? "border-[#315ff4] bg-blue-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {on && (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-[#315ff4] text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <div className="mb-2 flex gap-1">
                    {p.swatches.map((c) => (
                      <span
                        key={c}
                        className="h-6 flex-1 rounded-md border border-black/5"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {p.label}
                  </div>
                  <div className="text-[11px] text-slate-500">{p.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "font" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-6">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CREATE_AI_FONTS.filter((f) => f.id !== "auto").map((f) => {
              const on = value.fontFamily === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange({ ...value, fontFamily: f.id })}
                  className={`relative rounded-xl border px-3.5 py-3 text-left transition ${
                    on
                      ? "border-[#315ff4] bg-blue-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {on && (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-[#315ff4] text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <div className="text-lg font-semibold tracking-tight text-slate-900">
                    {f.sample}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-slate-700">
                    {f.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
