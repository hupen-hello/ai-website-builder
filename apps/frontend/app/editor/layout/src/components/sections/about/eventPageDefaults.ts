import eventContent from "../../../data/eventContent.json";

type VariantBag = Record<string, Record<string, unknown>>;

export function mediaUrl(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    for (const key of ["src", "url", "image", "thumbnail"]) {
      const nested = row[key];
      if (typeof nested === "string" && nested.trim()) return nested.trim();
    }
  }
  return "";
}

export function eventVariant(
  section: string,
  key: string,
): Record<string, unknown> {
  const pack = (
    eventContent as unknown as {
      categories: {
        Event: { sections: Record<string, { variants?: VariantBag }> };
      };
    }
  ).categories.Event.sections[section]?.variants?.[key];
  if (Array.isArray(pack)) return { stats: pack };
  return pack && typeof pack === "object" ? { ...pack } : {};
}

export function mergeEventData(
  data: Record<string, unknown> | undefined,
  nestedKey: string,
  section: string,
  variant: string,
  useRoot = true,
): any {
  const source = data && typeof data === "object" ? data : {};
  const nestedRaw = source[nestedKey];
  const nested =
    nestedRaw && typeof nestedRaw === "object" && !Array.isArray(nestedRaw)
      ? (nestedRaw as Record<string, unknown>)
      : {};
  const defaults = eventVariant(section, variant);
  if (!useRoot) return { ...defaults, ...nested };
  const picked: Record<string, unknown> = {};
  Object.keys(defaults).forEach((key) => {
    const value = source[key];
    const fallback = defaults[key];
    if (
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }
    if (
      Array.isArray(fallback) &&
      Array.isArray(value) &&
      fallback[0] &&
      typeof fallback[0] === "object" &&
      typeof value[0] !== "object"
    ) {
      return;
    }
    if (
      Array.isArray(fallback) &&
      Array.isArray(value) &&
      typeof fallback[0] === "string" &&
      typeof value[0] === "object"
    ) {
      const mapped = value.map((item) => mediaUrl(item)).filter(Boolean);
      if (mapped.length) picked[key] = mapped;
      return;
    }
    picked[key] = value;
  });
  return { ...defaults, ...picked, ...nested };
}
