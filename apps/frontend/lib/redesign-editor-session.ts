/** Redesign editor session — keeps templateId/category off the public URL. */

export type RedesignEditorPack = {
  designId: string;
  templateId: string;
  category: string;
  /** Layout keys from custom-layouts (sectionType → layout key / variant) */
  sectionVariants: Record<string, string>;
  domain?: string;
  businessName?: string;
  pickedBy?: "ai" | "heuristic";
  /** Color/font CSS vars from redesign prefs step */
  templateVariables?: Record<string, string>;
  pageType?: "single-page" | "multi-page";
  savedAt: number;
};

const KEY = "lestow-redesign-editor-pack";

export function saveRedesignEditorPack(pack: RedesignEditorPack) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(pack);
    window.localStorage.setItem(KEY, raw);
    window.sessionStorage.setItem(KEY, raw);
    if (pack.designId) {
      window.localStorage.setItem(`${KEY}:${pack.designId}`, raw);
      window.sessionStorage.setItem(`${KEY}:${pack.designId}`, raw);
    }
  } catch {
    /* quota */
  }
}

export function readRedesignEditorPack(
  designId?: string | null,
): RedesignEditorPack | null {
  if (typeof window === "undefined") return null;
  try {
    const id = (designId || "").trim();
    const raw =
      (id && window.localStorage.getItem(`${KEY}:${id}`)) ||
      (id && window.sessionStorage.getItem(`${KEY}:${id}`)) ||
      (!id
        ? window.localStorage.getItem(KEY) || window.sessionStorage.getItem(KEY)
        : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RedesignEditorPack;
    if (!parsed?.templateId || !parsed?.category) return null;
    if (id && parsed.designId && parsed.designId !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAllRedesignEditorPacks(): void {
  if (typeof window === "undefined") return;
  try {
    const stores = [window.localStorage, window.sessionStorage];
    for (const store of stores) {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && key.startsWith(KEY)) keys.push(key);
      }
      for (const key of keys) store.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
