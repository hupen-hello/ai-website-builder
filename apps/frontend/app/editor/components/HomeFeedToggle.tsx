"use client";

import { Eye, EyeOff } from "lucide-react";

type HomeFeedToggleProps = {
  on: boolean;
  onChange: (next: boolean) => void;
  name: string;
};

export const isShownOnHome = (value?: boolean | null) => value !== false;

export default function HomeFeedToggle({
  on,
  onChange,
  name,
}: HomeFeedToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-label={`${name} on Home: ${on ? "Active" : "Inactive"}`}
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
        on ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {on ? <Eye size={12} /> : <EyeOff size={12} />}
      {on ? "Active" : "Inactive"}
    </button>
  );
}
