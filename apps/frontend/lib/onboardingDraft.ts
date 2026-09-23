/** Lightweight local draft for guest onboarding (no login). */

import {
  getEditorDraftEditorUrl,
  hasEditorDraftFor,
  readNewestCustomEditorDraft,
  readNewestRedesignEditorDraft,
} from "./editorDraft";
import {
  defaultOnboardingPagesSelection,
  normalizeOnboardingPagesSelection,
  type OnboardingPagesSelection,
} from "./onboardingPages";
import { getActiveRedesignDesignId } from "./redesign-design-id";
import { readRedesignEditorPack } from "./redesign-editor-session";
import { readRedesignEditorSections } from "./build-redesign-home-sections";
import { getLastEditorUrl } from "./migrateGuestSite";
import { getCreateAiPayload } from "./create-ai-storage";

/** Resume URL when redesign already seeded the visual editor. */
function resolveRedesignEditorUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const activeId = (getActiveRedesignDesignId() || "").trim();
    let pack = readRedesignEditorPack(activeId || null);
    // Tab restored without session: prefer unscoped pack, then newest rd_ editor draft.
    if (!pack?.designId) {
      pack = readRedesignEditorPack(null);
    }
    const fromDraft = readNewestRedesignEditorDraft();
    const designId = (
      pack?.designId ||
      activeId ||
      fromDraft?.siteId ||
      ""
    ).trim();
    const last = getLastEditorUrl("redesign");
    if (last.startsWith("/editor") && /[?&](?:designId|siteId)=rd_/i.test(last)) {
      if (
        !designId ||
        last.includes(`designId=${designId}`) ||
        last.includes(`siteId=${designId}`)
      ) {
        return last;
      }
    }
    if (!designId || !/^rd_/i.test(designId)) return null;
    const sections = readRedesignEditorSections(designId);
    const hasSections = Array.isArray(sections) && sections.length > 0;
    if (!hasSections && !pack && !fromDraft) return null;
    const params = new URLSearchParams({ designId });
    if (pack?.domain) params.set("domain", pack.domain);
    if (pack?.businessName) params.set("businessName", pack.businessName);
    return `/editor?${params.toString()}`;
  } catch {
    return null;
  }
}

/** Keep in sync with categorystep.MIN_DESCRIPTION_LENGTH */
export const ONBOARDING_MIN_DESCRIPTION_LENGTH = 0;

export type OnboardingAudience = "" | "clients" | "myself" | "company";

export type OnboardingWebsiteRelated =
  | ""
  | "service-provider"
  | "products"
  | "blog"
  | "ngo"
  | "campaign-page";

export type OnboardingBusinessInfo = {
  audience: OnboardingAudience;
  name: string;
  description: string;
  websiteRelated: OnboardingWebsiteRelated;
  pageType: "" | "multi-page" | "single-page";
  email: string;
  mobile: string;
  address: string;
  includeDetails: boolean;
  hasLogo: "" | "yes" | "no";
  logoName: string;
  /** Compressed data URL used across every theme header/footer */
  logoImage: string;
};

export const defaultOnboardingBusinessInfo = (): OnboardingBusinessInfo => ({
  audience: "company",
  name: "",
  description: "",
  websiteRelated: "service-provider",
  pageType: "single-page",
  email: "",
  mobile: "",
  address: "",
  includeDetails: false,
  hasLogo: "no",
  logoName: "",
  logoImage: "",
});

/** Three product flows — each has its own localStorage key. */
export type OnboardingCreatePath = "create-ai" | "create-custom" | "redesign";

export type OnboardingDraft = {
  v: 1;
  updatedAt: number;
  step: number;
  businessInfo: OnboardingBusinessInfo;
  selectedCategory: string;
  selectedTemplateId: string | null;
  showMonitor: boolean;
  /** Header/footer page picks after template Use */
  pagesSelection?: OnboardingPagesSelection;
  /** Flow owner — never mix keys across paths */
  createPath?: OnboardingCreatePath;
  /** Active Create-with-AI studio id (`ca_…`) */
  createAiDesignId?: string;
};

const LEGACY_STORAGE_KEY = "css-ai-onboarding-draft";
const STORAGE_KEYS: Record<OnboardingCreatePath, string> = {
  "create-ai": "css-ai-onboarding-draft-create-ai",
  "create-custom": "css-ai-onboarding-draft-create-custom",
  redesign: "css-ai-onboarding-draft-redesign",
};
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function storageKeyFor(path: OnboardingCreatePath): string {
  return STORAGE_KEYS[path];
}

function normalizeCreatePath(raw: unknown): OnboardingCreatePath | undefined {
  if (raw === "create-ai" || raw === "create-custom" || raw === "redesign") {
    return raw;
  }
  return undefined;
}

function normalizeBusinessInfo(raw: unknown): OnboardingBusinessInfo {
  const defaults = defaultOnboardingBusinessInfo();
  if (!raw || typeof raw !== "object") return defaults;
  const info = raw as Partial<OnboardingBusinessInfo>;
  return {
    audience: info.audience || defaults.audience,
    name: typeof info.name === "string" ? info.name : "",
    description: typeof info.description === "string" ? info.description : "",
    websiteRelated: info.websiteRelated || defaults.websiteRelated,
    pageType: info.pageType || defaults.pageType,
    email: typeof info.email === "string" ? info.email : "",
    mobile: typeof info.mobile === "string" ? info.mobile : "",
    address: typeof info.address === "string" ? info.address : "",
    includeDetails: Boolean(info.includeDetails),
    hasLogo: info.hasLogo || defaults.hasLogo,
    logoName: typeof info.logoName === "string" ? info.logoName : "",
    logoImage: typeof (info as { logoImage?: unknown }).logoImage === "string"
      ? String((info as { logoImage?: string }).logoImage)
      : "",
  };
}

export function hasMeaningfulOnboardingProgress(
  draft: Omit<OnboardingDraft, "v" | "updatedAt">,
): boolean {
  return (
    Boolean(draft.businessInfo.name.trim()) ||
    Boolean(draft.businessInfo.description.trim()) ||
    Boolean(draft.selectedTemplateId) ||
    draft.showMonitor ||
    draft.step > 0
  );
}

function isValidDraft(raw: unknown): raw is OnboardingDraft {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as OnboardingDraft;
  return (
    d.v === 1 &&
    typeof d.updatedAt === "number" &&
    typeof d.step === "number" &&
    d.step >= 0 &&
    d.step <= 3 &&
    d.businessInfo &&
    typeof d.businessInfo === "object" &&
    typeof (d.businessInfo as { name?: unknown }).name === "string" &&
    typeof (d.businessInfo as { description?: unknown }).description ===
      "string" &&
    typeof d.selectedCategory === "string" &&
    (d.selectedTemplateId === null || typeof d.selectedTemplateId === "string") &&
    typeof d.showMonitor === "boolean"
  );
}

function parseDraftRaw(raw: string, key: string): OnboardingDraft | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidDraft(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.updatedAt > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    const normalized: OnboardingDraft = {
      ...parsed,
      businessInfo: normalizeBusinessInfo(parsed.businessInfo),
      pagesSelection: normalizeOnboardingPagesSelection(
        (parsed as { pagesSelection?: unknown }).pagesSelection,
        parsed.selectedTemplateId,
        normalizeBusinessInfo(parsed.businessInfo).pageType,
      ),
      createPath: normalizeCreatePath(
        (parsed as { createPath?: unknown }).createPath,
      ),
      createAiDesignId:
        typeof (parsed as { createAiDesignId?: unknown }).createAiDesignId ===
        "string"
          ? String((parsed as { createAiDesignId: string }).createAiDesignId)
          : undefined,
    };
    if (!hasMeaningfulOnboardingProgress(normalized)) {
      localStorage.removeItem(key);
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

/** One-time move from shared legacy key into the correct path key. */
function migrateLegacyDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const draft = parseDraftRaw(raw, LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    if (!draft) return null;
    const path =
      normalizeCreatePath(draft.createPath) ||
      (draft.createAiDesignId && /^ca_/i.test(draft.createAiDesignId)
        ? "create-ai"
        : "create-custom");
    const migrated = { ...draft, createPath: path };
    localStorage.setItem(storageKeyFor(path), JSON.stringify(migrated));
    return migrated;
  } catch {
    return null;
  }
}

function readDraftAt(path: OnboardingCreatePath): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const key = storageKeyFor(path);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft = parseDraftRaw(raw, key);
    if (!draft) return null;
    return { ...draft, createPath: path };
  } catch {
    return null;
  }
}

/** Newest draft across all three flows (create-ai / create-custom / redesign). */
export function readNewestOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  migrateLegacyDraft();
  return newestDraft([
    readDraftAt("create-ai"),
    readDraftAt("create-custom"),
    readDraftAt("redesign"),
  ]);
}

/**
 * Read a flow-specific draft. Without `path`, returns the newest path draft.
 * Never prefers active rd_ over a newer create-ai/custom draft.
 */
export function readOnboardingDraft(
  path?: OnboardingCreatePath,
): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  migrateLegacyDraft();

  if (path) return readDraftAt(path);
  return readNewestOnboardingDraft();
}

export function saveOnboardingDraft(
  draft: Omit<OnboardingDraft, "v" | "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  if (!hasMeaningfulOnboardingProgress(draft)) {
    return;
  }
  const path = normalizeCreatePath(draft.createPath);
  if (!path) {
    // Refuse silent writes into create-custom — callers must set createPath.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[onboardingDraft] saveOnboardingDraft called without createPath — skipped",
      );
    }
    return;
  }
  try {
    const payload: OnboardingDraft = {
      v: 1,
      updatedAt: Date.now(),
      ...draft,
      createPath: path,
      businessInfo: normalizeBusinessInfo(draft.businessInfo),
      pagesSelection: normalizeOnboardingPagesSelection(
        draft.pagesSelection,
        draft.selectedTemplateId,
        normalizeBusinessInfo(draft.businessInfo).pageType,
      ),
      // Only Create-AI owns studio id
      createAiDesignId:
        path === "create-ai" ? draft.createAiDesignId : undefined,
    };
    localStorage.setItem(storageKeyFor(path), JSON.stringify(payload));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearOnboardingDraft(path?: OnboardingCreatePath): void {
  if (typeof window === "undefined") return;
  try {
    if (path) {
      localStorage.removeItem(storageKeyFor(path));
      return;
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    (Object.keys(STORAGE_KEYS) as OnboardingCreatePath[]).forEach((p) => {
      localStorage.removeItem(storageKeyFor(p));
    });
  } catch {
    /* ignore */
  }
}

function newestDraft(
  drafts: Array<OnboardingDraft | null>,
): OnboardingDraft | null {
  let best: OnboardingDraft | null = null;
  for (const d of drafts) {
    if (!d) continue;
    if (!best || d.updatedAt > best.updatedAt) best = d;
  }
  return best;
}

/** Short label for landing “Continue” button */
export function getOnboardingDraftSummary(): {
  name: string;
  category: string;
  step: number;
  hasTemplate: boolean;
  hasEditorEdits: boolean;
  editorUrl: string | null;
  templateId: string | null;
  /** Resume Create-with-AI studio (separate from template editor) */
  createAiUrl: string | null;
  createPath?: OnboardingCreatePath;
} | null {
  migrateLegacyDraft();
  const createAiDraft = readDraftAt("create-ai");
  const customDraft = readDraftAt("create-custom");
  const redesignDraft = readDraftAt("redesign");
  const draft = newestDraft([createAiDraft, customDraft, redesignDraft]);
  const customEditorDraft = readNewestCustomEditorDraft();
  const redesignEditorDraft = readNewestRedesignEditorDraft();
  const editorDraft = customEditorDraft || redesignEditorDraft;

  const redesignEditorUrlEarly = resolveRedesignEditorUrl();
  if (!draft && !editorDraft && !redesignEditorUrlEarly) return null;

  // Orphan editor draft: infer flow from siteId so modal isn't ambiguous.
  const inferredPath: OnboardingCreatePath | undefined = draft?.createPath
    ? draft.createPath
    : redesignEditorDraft || redesignEditorUrlEarly
      ? "redesign"
      : customEditorDraft
        ? "create-custom"
        : undefined;

  const rawName = draft?.businessInfo.name.trim() || "";
  const name = rawName || "Your website";

  const category =
    draft?.selectedCategory ||
    customEditorDraft?.category ||
    redesignEditorDraft?.category ||
    "";
  const templateId =
    draft?.selectedTemplateId ||
    customEditorDraft?.templateId ||
    redesignEditorDraft?.templateId ||
    null;

  const path = inferredPath;
  const createAiId =
    (createAiDraft?.createAiDesignId || "").trim() ||
    (typeof window !== "undefined"
      ? (
          window.sessionStorage.getItem("lestow-create-ai-active-id") ||
          window.localStorage.getItem("lestow-create-ai-active-id") ||
          ""
        ).trim()
      : "");
  let createAiUrl: string | null = null;
  // Only link studio when payload still exists (session or durable local mirror).
  if (
    path === "create-ai" &&
    createAiId &&
    /^ca_/i.test(createAiId) &&
    getCreateAiPayload(createAiId)
  ) {
    createAiUrl = `/create-ai/${createAiId}`;
  }

  const redesignEditorUrl =
    path === "redesign"
      ? redesignEditorUrlEarly || resolveRedesignEditorUrl()
      : null;
  const hasRedesignEditor = Boolean(redesignEditorUrl);

  const hasCustomEditorEdits =
    path === "create-custom"
      ? Boolean(
          customEditorDraft ||
            (templateId && category && hasEditorDraftFor(templateId, category)),
        )
      : false;

  let editorUrl: string | null = null;
  if (path === "create-ai") {
    editorUrl = null;
  } else if (path === "redesign") {
    editorUrl = redesignEditorUrl;
  } else if (hasCustomEditorEdits) {
    editorUrl =
      (customEditorDraft
        ? `/editor?${new URLSearchParams({
            templateId: customEditorDraft.templateId,
            category: customEditorDraft.category,
            ...(customEditorDraft.siteId
              ? { siteId: customEditorDraft.siteId }
              : {}),
          }).toString()}`
        : null) ||
      getEditorDraftEditorUrl() ||
      (templateId && category
        ? `/editor?${new URLSearchParams({ templateId, category }).toString()}`
        : null);
  } else if (path === "create-custom" && templateId && category) {
    editorUrl = `/editor?${new URLSearchParams({ templateId, category }).toString()}`;
  }

  // Pack-only redesign (onboarding mirror missing) still shows resume.
  if (!draft && path === "redesign" && redesignEditorUrl) {
    return {
      name: name || "Your website",
      category,
      step: 2,
      hasTemplate: Boolean(templateId),
      hasEditorEdits: true,
      editorUrl: redesignEditorUrl,
      templateId,
      createAiUrl: null,
      createPath: "redesign",
    };
  }

  if (!draft && !editorDraft && !createAiUrl && !editorUrl) return null;

  return {
    name: name || "Your website",
    category,
    step: draft?.step ?? 2,
    hasTemplate: Boolean(templateId),
    hasEditorEdits:
      path === "redesign"
        ? hasRedesignEditor
        : path === "create-ai"
          ? false
          : Boolean(editorUrl),
    editorUrl,
    templateId,
    createAiUrl,
    createPath: path,
  };
}

export function getOnboardingBusinessName(): string {
  return (
    readEditorScopedOnboardingDraft()?.businessInfo.name.trim() ||
    readOnboardingDraft()?.businessInfo.name.trim() ||
    ""
  );
}

/**
 * Same rules as the onboarding step-0 Continue button. Description may be
 * empty when MIN length is 0 — do not require a non-empty string here or the
 * editor guard will bounce guests back to `/` after template select.
 */
export function isOnboardingBusinessInfoComplete(
  info: OnboardingBusinessInfo,
): boolean {
  if (
    info.websiteRelated === "campaign-page" &&
    info.pageType === "multi-page"
  ) {
    return false;
  }
  return Boolean(
    info.audience &&
      info.name.trim() &&
      info.description.trim().length >= ONBOARDING_MIN_DESCRIPTION_LENGTH &&
      info.websiteRelated &&
      info.pageType &&
      (!info.includeDetails ||
        (info.email.trim() && info.mobile.trim() && info.address.trim())) &&
      info.hasLogo &&
      (info.hasLogo !== "yes" || (info.logoName && info.logoImage)),
  );
}

/**
 * A guest editor URL is valid only after the matching onboarding flow reached
 * its template preview. This prevents manually typed template URLs from
 * skipping required business and category steps.
 */
export function canOpenEditorFromOnboarding(
  templateId: string,
  category: string,
): boolean {
  const draft = readOnboardingDraft("create-custom");
  if (!draft) return false;

  return (
    draft.selectedTemplateId === templateId &&
    draft.selectedCategory === category &&
    draft.showMonitor
  );
}

/** Draft for the editor currently open (rd_ → redesign, else create-custom). */
export function readEditorScopedOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const siteId = (
      new URLSearchParams(window.location.search).get("siteId") || ""
    ).trim();
    if (/^rd_/i.test(siteId)) return readOnboardingDraft("redesign");
  } catch {
    /* ignore */
  }
  return readOnboardingDraft("create-custom");
}
