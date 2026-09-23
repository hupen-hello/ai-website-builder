"use client";

import { Check } from "lucide-react";
import {
  CREATE_AI_COLOR_PALETTES,
  CREATE_AI_FONTS,
  type CreateAiDesignPrefs,
} from "@/lib/create-ai-design-prefs";

export type CreateAiPrefsPhase = "color" | "font" | "header";

export const CREATE_AI_PREFS_PHASES: CreateAiPrefsPhase[] = [
  "color",
  "font",
  "header",
];

type Props = {
  phase: CreateAiPrefsPhase;
  value: CreateAiDesignPrefs;
  onChange: (next: CreateAiDesignPrefs) => void;
};

const PHASE_META: Record<
  CreateAiPrefsPhase,
  { step: string; title: string; hint: string }
> = {
  color: {
    step: "Create with AI · Step 2",
    title: "Color palette",
    hint: "Choose a direction — or Surprise me. AI will follow this on first generate.",
  },
  font: {
    step: "Create with AI · Step 3",
    title: "Font family",
    hint: "Heading + body pairing for a premium feel.",
  },
  header: {
    step: "Create with AI · Step 4",
    title: "Header options",
    hint: "Top bar and sticky header for a polished chrome.",
  },
};

export default function CreateAiDesignPrefsStep({
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

      {phase === "color" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {CREATE_AI_COLOR_PALETTES.map((p) => {
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
            {CREATE_AI_FONTS.map((f) => {
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

      {phase === "header" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <YesNoCard
              title="Top bar"
              hint="Thin strip above header (phone / email)"
              value={value.topBar}
              onChange={(topBar) => onChange({ ...value, topBar })}
            />
            <YesNoCard
              title="Sticky header"
              hint="Header stays fixed while scrolling"
              value={value.stickyHeader}
              onChange={(stickyHeader) => onChange({ ...value, stickyHeader })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function YesNoCard({
  title,
  hint,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <p className="mb-3 mt-0.5 text-xs text-slate-500">{hint}</p>
      <div className="flex gap-2">
        {(
          [
            { v: true, label: "Yes" },
            { v: false, label: "No" },
          ] as const
        ).map((opt) => {
          const on = value === opt.v;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.v)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                on
                  ? "border-[#315ff4] bg-[#315ff4] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
