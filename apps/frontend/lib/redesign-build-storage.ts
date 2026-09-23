import {
  getActiveRedesignDesignId,
  redesignStorageKey,
  setActiveRedesignDesignId,
} from "@/lib/redesign-design-id";

export const REDESIGN_BUILD_STORAGE_KEY = "lestow-redesign-build";

export type RedesignBuildPayload = {
  websiteName: string;
  domainName: string;
  referenceName: string;
  vision: string;
  designId?: string;
  /** Uploaded template store — required for domain→component fill path */
  category?: string;
  templateId?: string;
  audience?: "" | "clients" | "myself" | "company";
  websiteRelated?:
    | ""
    | "service-provider"
    | "products"
    | "blog"
    | "ngo"
    | "campaign-page";
  pageType?: "" | "multi-page" | "single-page";
  colorPalette?: string;
  fontFamily?: string;
  email?: string;
  mobile?: string;
  address?: string;
};

export function saveRedesignBuildPayload(
  payload: RedesignBuildPayload,
  designId?: string,
) {
  if (typeof window === "undefined") return;
  const id = (designId || payload.designId || getActiveRedesignDesignId() || "").trim();
  if (id) setActiveRedesignDesignId(id);
  const next = { ...payload, ...(id ? { designId: id } : {}) };
  window.sessionStorage.setItem(
    redesignStorageKey(REDESIGN_BUILD_STORAGE_KEY, id || null),
    JSON.stringify(next),
  );
}

export function getRedesignBuildPayload(designId?: string): RedesignBuildPayload | null {
  if (typeof window === "undefined") return null;

  try {
    const id = (designId || getActiveRedesignDesignId() || "").trim();
    const scoped = window.sessionStorage.getItem(
      redesignStorageKey(REDESIGN_BUILD_STORAGE_KEY, id || null),
    );
    const raw =
      scoped ||
      (!id ? window.sessionStorage.getItem(REDESIGN_BUILD_STORAGE_KEY) : null);
    if (!raw) return null;
    return JSON.parse(raw) as RedesignBuildPayload;
  } catch {
    return null;
  }
}
