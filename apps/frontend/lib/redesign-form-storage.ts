/** Local draft for Redesign onboarding only — never write create-ai / create-custom keys. */

import {
  defaultRedesignDesignPrefs,
  type RedesignDesignPrefs,
  type RedesignPageType,
} from "@/lib/redesign-design-prefs";
import type {
  CreateAiColorPaletteId,
  CreateAiFontId,
} from "@/lib/create-ai-design-prefs";

export type RedesignFormDraft = {
  v: 1;
  updatedAt: number;
  redesignStep: number;
  audience: "" | "clients" | "myself" | "company";
  name: string;
  hasExistingSite: "" | "yes" | "no";
  domainName: string;
  domainVerified: boolean;
  referenceName: string;
  referenceVerified: boolean;
  vision: string;
  description: string;
  websiteRelated:
    | ""
    | "service-provider"
    | "products"
    | "blog"
    | "ngo"
    | "campaign-page";
  pageType: "" | "multi-page" | "single-page";
  email: string;
  mobile: string;
  address: string;
  includeDetails: boolean;
  hasLogo: "" | "yes" | "no";
  logoName: string;
  /** Category / page type / color / font from prefs steps */
  prefs: RedesignDesignPrefs;
};

export const REDESIGN_FORM_STORAGE_KEY = "css-ai-redesign-form-draft";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const defaultRedesignFormDraft = (): Omit<
  RedesignFormDraft,
  "v" | "updatedAt"
> => ({
  redesignStep: 0,
  audience: "clients",
  name: "",
  hasExistingSite: "yes",
  domainName: "",
  domainVerified: false,
  referenceName: "",
  referenceVerified: false,
  vision: "",
  description: "",
  websiteRelated: "products",
  pageType: "single-page",
  email: "",
  mobile: "",
  address: "",
  includeDetails: false,
  hasLogo: "no",
  logoName: "",
  prefs: defaultRedesignDesignPrefs(),
});

function normalizePrefs(raw: unknown): RedesignDesignPrefs {
  const defaults = defaultRedesignDesignPrefs();
  if (!raw || typeof raw !== "object") return defaults;
  const p = raw as Partial<RedesignDesignPrefs>;
  return {
    category:
      typeof p.category === "string" && p.category.trim()
        ? p.category
        : defaults.category,
    pageType:
      p.pageType === "single-page" || p.pageType === "multi-page"
        ? (p.pageType as RedesignPageType)
        : defaults.pageType,
    colorPalette: (p.colorPalette as CreateAiColorPaletteId) || defaults.colorPalette,
    fontFamily: (p.fontFamily as CreateAiFontId) || defaults.fontFamily,
  };
}

function normalizeDraft(raw: unknown): RedesignFormDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<RedesignFormDraft>;
  const defaults = defaultRedesignFormDraft();
  return {
    v: 1,
    updatedAt:
      typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    redesignStep:
      typeof data.redesignStep === "number" && data.redesignStep >= 0
        ? Math.min(4, Math.floor(data.redesignStep))
        : 0,
    audience: data.audience || defaults.audience,
    name: typeof data.name === "string" ? data.name : "",
    hasExistingSite: data.hasExistingSite || defaults.hasExistingSite,
    domainName: typeof data.domainName === "string" ? data.domainName : "",
    domainVerified: Boolean(data.domainVerified),
    referenceName:
      typeof data.referenceName === "string" ? data.referenceName : "",
    referenceVerified: Boolean(data.referenceVerified),
    vision: typeof data.vision === "string" ? data.vision : "",
    description: typeof data.description === "string" ? data.description : "",
    websiteRelated: data.websiteRelated || defaults.websiteRelated,
    pageType: data.pageType || defaults.pageType,
    email: typeof data.email === "string" ? data.email : "",
    mobile: typeof data.mobile === "string" ? data.mobile : "",
    address: typeof data.address === "string" ? data.address : "",
    includeDetails: Boolean(data.includeDetails),
    hasLogo: data.hasLogo || defaults.hasLogo,
    logoName: typeof data.logoName === "string" ? data.logoName : "",
    prefs: normalizePrefs(data.prefs),
  };
}

export function hasMeaningfulRedesignProgress(
  draft: Pick<
    RedesignFormDraft,
    "name" | "vision" | "domainName" | "referenceName" | "email" | "redesignStep"
  >,
) {
  return Boolean(
    draft.redesignStep > 0 ||
      draft.name.trim() ||
      draft.vision.trim() ||
      draft.domainName.trim() ||
      draft.referenceName.trim() ||
      draft.email.trim(),
  );
}

export function saveRedesignFormDraft(
  draft: Omit<RedesignFormDraft, "v" | "updatedAt">,
) {
  if (typeof window === "undefined") return;
  if (!hasMeaningfulRedesignProgress(draft)) return;
  try {
    const payload: RedesignFormDraft = {
      v: 1,
      updatedAt: Date.now(),
      ...draft,
      prefs: normalizePrefs(draft.prefs),
    };
    window.localStorage.setItem(
      REDESIGN_FORM_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    /* ignore quota */
  }
}

export function readRedesignFormDraft(): RedesignFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REDESIGN_FORM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = normalizeDraft(JSON.parse(raw));
    if (!parsed) return null;
    if (Date.now() - parsed.updatedAt > TTL_MS) {
      window.localStorage.removeItem(REDESIGN_FORM_STORAGE_KEY);
      return null;
    }
    if (!hasMeaningfulRedesignProgress(parsed)) {
      window.localStorage.removeItem(REDESIGN_FORM_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearRedesignFormDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REDESIGN_FORM_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
