import { clearAllEditorDrafts, readAnyEditorDraft } from "./editorDraft";
import {
  clearOnboardingDraft,
  readNewestOnboardingDraft,
  readOnboardingDraft,
} from "./onboardingDraft";
import { clearOnboardingNavSnapshot } from "./onboardingNavSnapshot";
import { clearRedesignFormDraft } from "./redesign-form-storage";
import { clearAllFlowPreviewStorage } from "./flowPreviewStorage";
import { clearAllCreateAiStorage, getCreateAiPayload } from "./create-ai-storage";
import { clearActiveCreateAiDesignId, getActiveCreateAiDesignId } from "./create-ai-design-id";
import { clearActiveRedesignDesignId, getActiveRedesignDesignId } from "./redesign-design-id";
import {
  clearAllRedesignEditorPacks,
  readRedesignEditorPack,
} from "./redesign-editor-session";
import { clearAllRedesignEditorSections } from "./build-redesign-home-sections";
import { clearAllRedesignEditorThemes } from "./apply-redesign-domain";
import {
  USER_LAST_EDITOR_URL_KEY,
  clearUserActiveSiteId,
} from "./migrateGuestSite";

/** Remove all guest progress across Redesign / Create-AI / Create-Custom. */
export function resetGuestWebsiteProgress(): void {
  if (typeof window === "undefined") return;
  clearOnboardingDraft();
  clearRedesignFormDraft();
  clearAllEditorDrafts();
  clearOnboardingNavSnapshot();
  clearAllFlowPreviewStorage();
  clearAllCreateAiStorage();
  clearActiveCreateAiDesignId();
  clearActiveRedesignDesignId();
  clearAllRedesignEditorPacks();
  clearAllRedesignEditorSections();
  clearAllRedesignEditorThemes();
  clearUserActiveSiteId();
  try {
    window.localStorage.removeItem(USER_LAST_EDITOR_URL_KEY);
    window.sessionStorage.removeItem(USER_LAST_EDITOR_URL_KEY);
    window.localStorage.removeItem(`${USER_LAST_EDITOR_URL_KEY}:redesign`);
    window.sessionStorage.removeItem(`${USER_LAST_EDITOR_URL_KEY}:redesign`);
    window.localStorage.removeItem(`${USER_LAST_EDITOR_URL_KEY}:create-custom`);
    window.sessionStorage.removeItem(
      `${USER_LAST_EDITOR_URL_KEY}:create-custom`,
    );
    window.sessionStorage.removeItem("onboardingBusinessInfo");
    window.sessionStorage.removeItem("css-ai-onboarding-page-links-ready");
    window.sessionStorage.removeItem("css-ai-onboarding-menu-subset");
    window.sessionStorage.removeItem("css-ai-apply-onboarding-header");
    window.sessionStorage.removeItem("css-ai-redesign-domain-stamp");
    window.sessionStorage.removeItem("css-ai-sync-header-from-onboarding");
    window.sessionStorage.removeItem("lestow-redesign-build");
    window.localStorage.removeItem("lestow-create-ai-active-id");
    window.localStorage.removeItem("lestow-redesign-active-id");
    // Redesign build feed / payload leftovers
    const sessKeys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (
        key &&
        (key.startsWith("lestow-redesign-") ||
          key.startsWith("lestow-create-ai-"))
      ) {
        sessKeys.push(key);
      }
    }
    for (const key of sessKeys) window.sessionStorage.removeItem(key);
    const localKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.startsWith("lestow-redesign-") ||
          key.startsWith("lestow-create-ai-") ||
          key.startsWith("css-ai-onboarding-draft"))
      ) {
        localKeys.push(key);
      }
    }
    for (const key of localKeys) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function hasAnyGuestProgress(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (readNewestOnboardingDraft() || readAnyEditorDraft()) return true;
    if (window.localStorage.getItem("css-ai-redesign-form-draft")) return true;
    if (getCreateAiPayload(getActiveCreateAiDesignId() || undefined)) return true;
    if (readRedesignEditorPack(getActiveRedesignDesignId())) return true;
    if (readOnboardingDraft("create-ai")) return true;
    if (readOnboardingDraft("create-custom")) return true;
    if (readOnboardingDraft("redesign")) return true;
    // Durable Create-AI payload without active session id
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("lestow-create-ai-payload")) return true;
    }
    return false;
  } catch {
    return false;
  }
}
