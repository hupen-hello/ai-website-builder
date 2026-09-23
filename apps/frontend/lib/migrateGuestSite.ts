import { readEditorDraft } from "./editorDraft";
import { clearOnboardingDraft, readOnboardingDraft } from "./onboardingDraft";
import {
  hasManualSeoInConfig,
  normalizeSiteSeoConfig,
  type SiteSeoConfig,
} from "./siteSeo";
import {
  readSiteTaxonomiesFromLocal,
  type SiteTaxonomies,
} from "./siteTaxonomies";

export type GuestSiteCreatePath = "create-ai" | "create-custom" | "redesign";

export const USER_ACTIVE_SITE_ID_KEY = "user_active_site_id";
export const USER_PUBLISHED_URL_KEY = "user_published_site_url";
export const USER_LAST_EDITOR_URL_KEY = "user_last_editor_url";

export type GuestSitePayload = {
  templateId: string;
  category: string;
  clientUpdatedAt?: number;
  pageLinks: unknown[];
  sections: unknown[];
  templateVariables: Record<string, string>;
  businessInfo?: {
    audience?: string;
    name?: string;
    description?: string;
  } | null;
  seo?: SiteSeoConfig | null;
  taxonomies?: SiteTaxonomies | null;
  /** Builder flow for admin analytics — stamped on migrate/save. */
  createPath?: GuestSiteCreatePath;
  /** Redesign / Create-AI guest design key (rd_… / ca_…). */
  designId?: string | null;
};

function looksLikeRedesignContext(siteId?: string | null): boolean {
  if (siteId && /^rd_/i.test(siteId)) return true;
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("redesign") === "1") return true;
    const designId = (params.get("designId") || "").trim();
    if (/^rd_/i.test(designId)) return true;
    if (/^rd_/i.test((params.get("siteId") || "").trim())) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function resolveDesignIdFromContext(siteId?: string | null): string {
  if (siteId && /^rd_/i.test(siteId)) return siteId;
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    const designId = (params.get("designId") || "").trim();
    if (/^rd_/i.test(designId)) return designId;
  } catch {
    /* ignore */
  }
  return "";
}

function hasTaxonomyPayload(taxonomies: SiteTaxonomies | null | undefined) {
  if (!taxonomies) return false;
  return Object.values(taxonomies).some(
    (value) => Array.isArray(value) && value.length > 0,
  );
}

export function collectGuestSitePayload(
  overrides?: Partial<GuestSitePayload>,
  siteId?: string | null,
): GuestSitePayload | null {
  const editorDraft = readEditorDraft(undefined, undefined, siteId);
  const redesignContext = looksLikeRedesignContext(siteId);
  const onboardingDraft = redesignContext
    ? readOnboardingDraft("redesign") || readOnboardingDraft()
    : readOnboardingDraft("create-custom") || readOnboardingDraft();

  const templateId =
    overrides?.templateId ||
    editorDraft?.templateId ||
    onboardingDraft?.selectedTemplateId ||
    "";
  const category =
    overrides?.category ||
    editorDraft?.category ||
    onboardingDraft?.selectedCategory ||
    "";

  const sections = overrides?.sections ?? editorDraft?.sections ?? [];
  if (!templateId || !category || !Array.isArray(sections) || !sections.length) {
    return null;
  }

  const draftPath = onboardingDraft?.createPath;
  const createPath: GuestSiteCreatePath =
    overrides?.createPath === "create-ai" ||
    overrides?.createPath === "create-custom" ||
    overrides?.createPath === "redesign"
      ? overrides.createPath
      : draftPath === "create-ai" ||
          draftPath === "create-custom" ||
          draftPath === "redesign"
        ? draftPath
        : redesignContext
          ? "redesign"
          : "create-custom";

  const designId =
    (typeof overrides?.designId === "string" && overrides.designId.trim()) ||
    resolveDesignIdFromContext(siteId) ||
    "";

  const payload: GuestSitePayload = {
    templateId,
    category,
    clientUpdatedAt: overrides?.clientUpdatedAt ?? Date.now(),
    pageLinks: overrides?.pageLinks ?? editorDraft?.pageLinks ?? [],
    sections,
    templateVariables:
      overrides?.templateVariables ??
      editorDraft?.templateVariables ??
      {},
    businessInfo:
      overrides?.businessInfo ??
      onboardingDraft?.businessInfo ??
      null,
    createPath,
    ...(designId ? { designId } : {}),
  };

  // SEO rules:
  // - omit key → backend keeps previous SEO (content autosave)
  // - non-empty → save those fields
  // - explicit empty/null from SEO panel → clear stored SEO
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, "seo")) {
    if (overrides.seo != null && hasManualSeoInConfig(overrides.seo)) {
      payload.seo = normalizeSiteSeoConfig(overrides.seo);
    } else {
      payload.seo = null;
    }
  } else if (hasManualSeoInConfig(editorDraft?.seo)) {
    payload.seo = normalizeSiteSeoConfig(editorDraft?.seo);
  }

  if (overrides && Object.prototype.hasOwnProperty.call(overrides, "taxonomies")) {
    payload.taxonomies = overrides.taxonomies ?? null;
  } else {
    const fromLocal = readSiteTaxonomiesFromLocal(siteId);
    if (hasTaxonomyPayload(fromLocal)) {
      payload.taxonomies = fromLocal;
    }
  }

  return payload;
}

export function clearUserActiveSiteId() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(USER_ACTIVE_SITE_ID_KEY);
    localStorage.removeItem(USER_ACTIVE_SITE_ID_KEY);
    sessionStorage.removeItem(USER_PUBLISHED_URL_KEY);
    localStorage.removeItem(USER_PUBLISHED_URL_KEY);
    sessionStorage.removeItem(USER_LAST_EDITOR_URL_KEY);
    localStorage.removeItem(USER_LAST_EDITOR_URL_KEY);
    sessionStorage.removeItem(`${USER_LAST_EDITOR_URL_KEY}:redesign`);
    localStorage.removeItem(`${USER_LAST_EDITOR_URL_KEY}:redesign`);
    sessionStorage.removeItem(`${USER_LAST_EDITOR_URL_KEY}:create-custom`);
    localStorage.removeItem(`${USER_LAST_EDITOR_URL_KEY}:create-custom`);
  }
}

export function getPublishedSiteUrl(): string | null {
  if (typeof window === "undefined") return null;
  return (
    sessionStorage.getItem(USER_PUBLISHED_URL_KEY) ||
    localStorage.getItem(USER_PUBLISHED_URL_KEY)
  );
}

export function setPublishedSiteUrl(url: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_PUBLISHED_URL_KEY, url);
  localStorage.setItem(USER_PUBLISHED_URL_KEY, url);
}

export function hasPublishedSite(): boolean {
  return Boolean(getPublishedSiteUrl() && getUserActiveSiteId());
}

export function setLastEditorUrl(url: string) {
  if (typeof window === "undefined") return;
  if (!url.startsWith("/editor")) return;
  sessionStorage.setItem(USER_LAST_EDITOR_URL_KEY, url);
  localStorage.setItem(USER_LAST_EDITOR_URL_KEY, url);
  try {
    if (/[?&](?:designId|siteId)=rd_/i.test(url)) {
      sessionStorage.setItem(`${USER_LAST_EDITOR_URL_KEY}:redesign`, url);
      localStorage.setItem(`${USER_LAST_EDITOR_URL_KEY}:redesign`, url);
    } else {
      sessionStorage.setItem(`${USER_LAST_EDITOR_URL_KEY}:create-custom`, url);
      localStorage.setItem(`${USER_LAST_EDITOR_URL_KEY}:create-custom`, url);
    }
  } catch {
    /* ignore */
  }
}

export function getLastEditorUrl(flow?: "redesign" | "create-custom"): string {
  if (typeof window === "undefined") return "/editor";

  if (flow) {
    const scoped =
      sessionStorage.getItem(`${USER_LAST_EDITOR_URL_KEY}:${flow}`) ||
      localStorage.getItem(`${USER_LAST_EDITOR_URL_KEY}:${flow}`);
    if (scoped && scoped.startsWith("/editor")) return scoped;
  }

  const saved =
    sessionStorage.getItem(USER_LAST_EDITOR_URL_KEY) ||
    localStorage.getItem(USER_LAST_EDITOR_URL_KEY);
  if (saved && saved.startsWith("/editor")) return saved;

  const draft = readEditorDraft();
  if (draft?.templateId && draft?.category) {
    const params = new URLSearchParams({
      templateId: draft.templateId,
      category: draft.category,
    });
    const siteId = getUserActiveSiteId();
    if (siteId) params.set("siteId", siteId);
    return `/editor?${params.toString()}`;
  }

  return "/editor";
}

export function getUserActiveSiteId() {
  if (typeof window === "undefined") return null;
  return (
    sessionStorage.getItem(USER_ACTIVE_SITE_ID_KEY) ||
    localStorage.getItem(USER_ACTIVE_SITE_ID_KEY)
  );
}

export function setUserActiveSiteId(siteId: string) {
  if (typeof window === "undefined" || !siteId) return;
  sessionStorage.setItem(USER_ACTIVE_SITE_ID_KEY, siteId);
  localStorage.setItem(USER_ACTIVE_SITE_ID_KEY, siteId);
}

export function resolveEditorSiteId() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("siteId")?.trim();
  if (fromUrl) return fromUrl;
  const draft = readEditorDraft(
    params.get("templateId") || undefined,
    params.get("category") || undefined,
  );
  if (draft?.siteId?.trim()) return draft.siteId.trim();
  return getUserActiveSiteId() || "";
}

export async function migrateGuestSiteToDatabase(
  payload?: Partial<GuestSitePayload>,
  options?: { siteId?: string | null },
): Promise<{ siteId: string; slug: string }> {
  const storedSiteId = options?.siteId || getUserActiveSiteId() || undefined;
  const config = collectGuestSitePayload(payload, storedSiteId);
  if (!config) {
    throw new Error(
      "No site content to save. Finish editing your template first.",
    );
  }

  const attemptMigrate = async (siteId?: string) => {
    // Never send the auto "{Category} Website" title on updates — that was
    // overwriting names set via My Websites → Rename.
    const createTitle =
      config.businessInfo?.name?.trim() || `${config.category} Website`;

    const res = await fetch("/api/user/sites/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...(siteId ? {} : { title: createTitle }),
        templateId: config.templateId,
        category: config.category,
        siteId: siteId || undefined,
        config,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      id?: string;
      slug?: string;
    };
    return { res, data, status: res.status };
  };

  let { res, data, status } = await attemptMigrate(storedSiteId || undefined);

  if (
    !res.ok &&
    storedSiteId &&
    (res.status === 403 || res.status === 404 || res.status >= 500)
  ) {
    clearUserActiveSiteId();
    ({ res, data, status } = await attemptMigrate(undefined));
  }

  if (!res.ok) {
    const msg = typeof data.message === "string" ? data.message : "";
    throw new Error(msg || `Unable to save site (HTTP ${status})`);
  }

  if (!data.id || !data.slug) {
    throw new Error("Invalid site response from server");
  }

  setUserActiveSiteId(data.id);
  return { siteId: data.id, slug: data.slug };
}

export function clearGuestProgressAfterDbSave() {
  // Keep the editor draft + active site id so Ctrl+F5 / Dashboard → Editor
  // still restores the latest republished design.
  clearOnboardingDraft();
  try {
    sessionStorage.removeItem("onboardingBusinessInfo");
  } catch {
    /* ignore */
  }
}
