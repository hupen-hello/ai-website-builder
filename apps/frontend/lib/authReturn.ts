import { getLastEditorUrl } from "@/lib/migrateGuestSite";

export const AUTH_RETURN_URL_KEY = "css-ai-private-editor-return-url";
export const AUTH_CANCEL_URL_KEY = "css-ai-auth-cancel-url";
export const POST_AUTH_ACTION_KEY = "css-ai-post-auth-action";
export const POST_AUTH_PANEL_KEY = "css-ai-post-auth-panel";
export const PLAN_RETURN_URL_KEY = "css-ai-plan-return-url";
export const PLAN_SUCCESS_MESSAGE_KEY = "css-ai-plan-success-message";

export type PostAuthAction = "publish";
export type PostAuthPanel = "settings";

function currentPathWithSearch() {
  return `${window.location.pathname}${window.location.search}`;
}

function isAllowedAppPath(target: string) {
  return (
    target.startsWith("/editor") ||
    target.startsWith("/user/") ||
    target.startsWith("/preview") ||
    target.startsWith("/published/") ||
    target === "/"
  );
}

/** Pages guests can return to when closing auth (never /user/* — causes auth loops). */
function isGuestCancelPath(target: string) {
  if (!target || target.startsWith("/auth") || target.startsWith("/user/")) {
    return false;
  }
  return (
    target.startsWith("/editor") ||
    target.startsWith("/preview") ||
    target.startsWith("/published/") ||
    target === "/"
  );
}

export function saveAuthReturnUrl(url?: string) {
  if (typeof window === "undefined") return;
  const target = url || currentPathWithSearch();
  if (isAllowedAppPath(target)) {
    sessionStorage.setItem(AUTH_RETURN_URL_KEY, target);
  }
}

/** Where Close should go if the user dismisses auth without logging in. */
export function saveAuthCancelUrl(url?: string) {
  if (typeof window === "undefined") return;
  const target = url || currentPathWithSearch();
  if (!isGuestCancelPath(target)) return;
  sessionStorage.setItem(AUTH_CANCEL_URL_KEY, target);
}

/**
 * Remember the current editor URL before leaving for /user/plan (upgrade).
 * Auth Close can then restore the editor instead of home.
 */
export function rememberEditorForAuthCancel() {
  if (typeof window === "undefined") return;
  const current = currentPathWithSearch();
  if (current.startsWith("/editor")) {
    saveAuthCancelUrl(current);
    rememberPlanReturnUrl(current);
  }
}

export function rememberPlanReturnUrl(url?: string) {
  if (typeof window === "undefined") return;
  const target = url || currentPathWithSearch();
  if (!target.startsWith("/editor")) return;
  sessionStorage.setItem(PLAN_RETURN_URL_KEY, target);
  localStorage.setItem(PLAN_RETURN_URL_KEY, target);
}

export function buildPlanPageUrl(siteId?: string | null) {
  const params = new URLSearchParams();
  if (siteId) params.set("siteId", siteId);
  if (typeof window !== "undefined") {
    const current = currentPathWithSearch();
    if (current.startsWith("/editor")) {
      rememberPlanReturnUrl(current);
      params.set("return", current);
    }
  }
  const qs = params.toString();
  return qs ? `/user/plan?${qs}` : "/user/plan";
}

export function resolvePlanReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get("return");
  if (fromQuery?.startsWith("/editor")) return fromQuery;
  const stored =
    sessionStorage.getItem(PLAN_RETURN_URL_KEY) ||
    localStorage.getItem(PLAN_RETURN_URL_KEY);
  if (stored?.startsWith("/editor")) return stored;
  return null;
}

export function consumePlanReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = resolvePlanReturnUrl();
  sessionStorage.removeItem(PLAN_RETURN_URL_KEY);
  localStorage.removeItem(PLAN_RETURN_URL_KEY);
  return url;
}

export function setPlanSuccessMessage(message: string) {
  if (typeof window === "undefined") return;
  const text = message.trim();
  if (!text) return;
  sessionStorage.setItem(PLAN_SUCCESS_MESSAGE_KEY, text);
  localStorage.setItem(PLAN_SUCCESS_MESSAGE_KEY, text);
}

export function consumePlanSuccessMessage(): string | null {
  if (typeof window === "undefined") return null;
  const message =
    sessionStorage.getItem(PLAN_SUCCESS_MESSAGE_KEY) ||
    localStorage.getItem(PLAN_SUCCESS_MESSAGE_KEY);
  sessionStorage.removeItem(PLAN_SUCCESS_MESSAGE_KEY);
  localStorage.removeItem(PLAN_SUCCESS_MESSAGE_KEY);
  return message?.trim() || null;
}

export function peekAuthReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_RETURN_URL_KEY);
}

export function consumeAuthReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
  sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
  return url;
}

export function peekAuthCancelUrl(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_CANCEL_URL_KEY);
}

export function consumeAuthCancelUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = sessionStorage.getItem(AUTH_CANCEL_URL_KEY);
  sessionStorage.removeItem(AUTH_CANCEL_URL_KEY);
  return url;
}

export function setPostAuthAction(action: PostAuthAction) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(POST_AUTH_ACTION_KEY, action);
}

export function consumePostAuthAction(): PostAuthAction | null {
  if (typeof window === "undefined") return null;
  const action = sessionStorage.getItem(POST_AUTH_ACTION_KEY);
  sessionStorage.removeItem(POST_AUTH_ACTION_KEY);
  return action === "publish" ? "publish" : null;
}

export function clearPostAuthAction() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(POST_AUTH_ACTION_KEY);
}

export function setPostAuthPanel(panel: PostAuthPanel) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(POST_AUTH_PANEL_KEY, panel);
}

export function consumePostAuthPanel(): PostAuthPanel | null {
  if (typeof window === "undefined") return null;
  const panel = sessionStorage.getItem(POST_AUTH_PANEL_KEY);
  sessionStorage.removeItem(POST_AUTH_PANEL_KEY);
  return panel === "settings" ? "settings" : null;
}

export function clearPostAuthPanel() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(POST_AUTH_PANEL_KEY);
}

export function redirectToAuth(options?: {
  returnUrl?: string;
  action?: PostAuthAction;
  panel?: PostAuthPanel;
}) {
  const current = currentPathWithSearch();

  // Remember a guest-safe page for Close. Never store /user/* (auth loop).
  if (isGuestCancelPath(current)) {
    saveAuthCancelUrl(current);
  } else if (!peekAuthCancelUrl()) {
    const returnUrl = options?.returnUrl || peekAuthReturnUrl();
    if (returnUrl && isGuestCancelPath(returnUrl)) {
      saveAuthCancelUrl(returnUrl);
    } else {
      const lastEditor = getLastEditorUrl();
      if (lastEditor && isGuestCancelPath(lastEditor)) {
        saveAuthCancelUrl(lastEditor);
      }
    }
  }

  saveAuthReturnUrl(options?.returnUrl);
  if (options?.action) {
    setPostAuthAction(options.action);
  }
  if (options?.panel) {
    setPostAuthPanel(options.panel);
  }
  window.location.assign("/auth");
}

export function resolvePostAuthDestination(returnUrl: string | null): string {
  if (returnUrl?.startsWith("/editor") || returnUrl?.startsWith("/user/")) {
    return returnUrl;
  }
  return "/user/dashboard";
}

/** Close without login → guest-safe page (editor / home), never /user/*. */
export function resolveAuthCancelDestination(): string {
  const cancelUrl = consumeAuthCancelUrl();
  if (cancelUrl && isGuestCancelPath(cancelUrl)) {
    clearPostAuthAction();
    clearPostAuthPanel();
    return cancelUrl;
  }

  const returnUrl = peekAuthReturnUrl();
  if (returnUrl && isGuestCancelPath(returnUrl)) {
    clearPostAuthAction();
    clearPostAuthPanel();
    return returnUrl;
  }

  const lastEditor = getLastEditorUrl();
  if (lastEditor && isGuestCancelPath(lastEditor)) {
    clearPostAuthAction();
    clearPostAuthPanel();
    return lastEditor;
  }

  clearPostAuthAction();
  clearPostAuthPanel();
  return "/";
}
