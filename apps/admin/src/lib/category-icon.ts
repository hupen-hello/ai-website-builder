/** Normalize class / name to Iconify id, e.g. lucide-briefcase → lucide:briefcase */
export function toIconifyName(value?: string | null): string {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";

  // Already iconify: "lucide:briefcase" or "solar:briefcase-bold"
  if (raw.includes(":")) return raw;

  // "lucide lucide-briefcase" → take last lucide-* token
  const parts = raw.split(/\s+/);
  const lucideClass = parts.find((p) => p.startsWith("lucide-") && p !== "lucide");
  if (lucideClass) {
    return `lucide:${lucideClass.replace(/^lucide-/, "")}`;
  }

  // "lucide-briefcase"
  if (raw.startsWith("lucide-")) {
    return `lucide:${raw.replace(/^lucide-/, "")}`;
  }

  // bare name → assume lucide
  return `lucide:${raw}`;
}
