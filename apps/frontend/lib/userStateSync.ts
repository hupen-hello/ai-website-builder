import { isExportAddonId } from "@/lib/userExports";

const SITE_SUBSCRIPTIONS_KEY = "css-ai-site-subscriptions";
const PURCHASED_ADDONS_KEY = "css-ai-user-addons";
const PURCHASED_DOMAINS_KEY = "css-ai-purchased-domains";
const DOMAIN_CONNECTIONS_KEY = "css-ai-domain-connections";
const STATE_OWNER_KEY = "css-ai-user-state-owner";

export type PersistedUserState = {
  siteSubscriptions: Record<string, unknown>;
  purchasedAddons: unknown[];
  purchasedDomains: unknown[];
  domainConnections: unknown[];
};

const EMPTY_STATE: PersistedUserState = {
  siteSubscriptions: {},
  purchasedAddons: [],
  purchasedDomains: [],
  domainConnections: [],
};

function safeParseRecord(raw: string | null) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function safeParseArray(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readPersistedUserStateFromLocal(): PersistedUserState {
  if (typeof window === "undefined") {
    return { ...EMPTY_STATE };
  }

  return {
    siteSubscriptions: safeParseRecord(localStorage.getItem(SITE_SUBSCRIPTIONS_KEY)),
    purchasedAddons: safeParseArray(localStorage.getItem(PURCHASED_ADDONS_KEY)),
    purchasedDomains: safeParseArray(localStorage.getItem(PURCHASED_DOMAINS_KEY)),
    domainConnections: safeParseArray(localStorage.getItem(DOMAIN_CONNECTIONS_KEY)),
  };
}

function writePersistedUserStateToLocal(state: PersistedUserState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SITE_SUBSCRIPTIONS_KEY, JSON.stringify(state.siteSubscriptions || {}));
  localStorage.setItem(PURCHASED_ADDONS_KEY, JSON.stringify(state.purchasedAddons || []));
  localStorage.setItem(PURCHASED_DOMAINS_KEY, JSON.stringify(state.purchasedDomains || []));
  localStorage.setItem(DOMAIN_CONNECTIONS_KEY, JSON.stringify(state.domainConnections || []));
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("css-ai-plan-updated"));
}

/** Clears billing/export cache so the next login cannot inherit another account. */
export function clearPersistedUserStateLocal() {
  if (typeof window === "undefined") return;
  writePersistedUserStateToLocal({ ...EMPTY_STATE });
  localStorage.removeItem(STATE_OWNER_KEY);
}

function hasAnyState(state: PersistedUserState) {
  return (
    Object.keys(state.siteSubscriptions || {}).length > 0 ||
    state.purchasedAddons.length > 0 ||
    state.purchasedDomains.length > 0 ||
    state.domainConnections.length > 0
  );
}

function statesEqual(a: PersistedUserState, b: PersistedUserState) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function fetchPersistedUserState() {
  const response = await fetch("/api/user/state", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to load saved billing state.");
  }
  const data = (await response.json()) as Partial<PersistedUserState>;
  return {
    siteSubscriptions:
      data.siteSubscriptions && typeof data.siteSubscriptions === "object"
        ? data.siteSubscriptions
        : {},
    purchasedAddons: Array.isArray(data.purchasedAddons) ? data.purchasedAddons : [],
    purchasedDomains: Array.isArray(data.purchasedDomains) ? data.purchasedDomains : [],
    domainConnections: Array.isArray(data.domainConnections) ? data.domainConnections : [],
  } satisfies PersistedUserState;
}

export async function savePersistedUserState(state?: PersistedUserState) {
  const payload = state || readPersistedUserStateFromLocal();
  const response = await fetch("/api/user/state", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Unable to save billing state.");
  }
  return (await response.json()) as PersistedUserState;
}

async function fetchOwnedSiteIds(): Promise<Set<string>> {
  try {
    const res = await fetch("/api/user/sites/mine", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return new Set();
    const data = (await res.json().catch(() => null)) as unknown;
    const list = Array.isArray(data)
      ? data
      : data &&
          typeof data === "object" &&
          Array.isArray((data as { sites?: unknown }).sites)
        ? (data as { sites: unknown[] }).sites
        : [];
    const ids = new Set<string>();
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const id = (item as { id?: unknown }).id;
      if (typeof id === "string" && id.trim()) ids.add(id.trim());
    }
    return ids;
  } catch {
    return new Set();
  }
}

/**
 * Drop export/plan rows tied to sites this user does not own
 * (happens when another account's localStorage was wrongly synced).
 */
function mergeSubscriptionMaps(
  local: Record<string, unknown>,
  backend: Record<string, unknown>,
) {
  const merged: Record<string, unknown> = { ...backend };
  for (const [siteId, value] of Object.entries(local || {})) {
    if (!value || typeof value !== "object") continue;
    const existing = merged[siteId];
    if (!existing || typeof existing !== "object") {
      merged[siteId] = value;
      continue;
    }
    const localAt =
      Date.parse(String((value as { upgradedAt?: unknown }).upgradedAt || "")) ||
      0;
    const backendAt =
      Date.parse(
        String((existing as { upgradedAt?: unknown }).upgradedAt || ""),
      ) || 0;
    if (localAt >= backendAt) merged[siteId] = value;
  }
  return merged;
}

async function sanitizeStateForOwnedSites(
  state: PersistedUserState,
): Promise<PersistedUserState> {
  const owned = await fetchOwnedSiteIds();
  if (owned.size === 0) return state;

  const pendingSiteId = (() => {
    if (typeof window === "undefined") return "";
    try {
      const raw =
        sessionStorage.getItem("css-ai-pending-core-apply") ||
        localStorage.getItem("css-ai-pending-core-apply");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { siteId?: unknown };
      return typeof parsed.siteId === "string" ? parsed.siteId.trim() : "";
    } catch {
      return "";
    }
  })();

  const nextSubscriptions: Record<string, unknown> = {};
  for (const [siteId, value] of Object.entries(state.siteSubscriptions || {})) {
    if (owned.has(siteId) || (pendingSiteId && siteId === pendingSiteId)) {
      nextSubscriptions[siteId] = value;
    }
  }

  const nextAddons = (state.purchasedAddons || []).filter((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const row = item as Record<string, unknown>;
    const siteId = typeof row.siteId === "string" ? row.siteId.trim() : "";
    if (!siteId) {
      // Site-less rows: keep non-export addons only
      return !isExportAddonId(row.addonId);
    }
    return owned.has(siteId);
  });

  const nextDomains = (state.purchasedDomains || []).filter((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const siteId = (item as { siteId?: unknown }).siteId;
    if (typeof siteId !== "string" || !siteId.trim()) return true;
    return owned.has(siteId.trim());
  });

  return {
    siteSubscriptions: nextSubscriptions,
    purchasedAddons: nextAddons,
    purchasedDomains: nextDomains,
    domainConnections: Array.isArray(state.domainConnections)
      ? state.domainConnections
      : [],
  };
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let userStateHydrated = false;

export function queueUserStateSync() {
  if (typeof window === "undefined") return;
  // Avoid pushing empty local cache before login hydrate finishes (would wipe DB).
  if (!userStateHydrated) return;
  if (syncTimeout) window.clearTimeout(syncTimeout);
  syncTimeout = window.setTimeout(() => {
    void savePersistedUserState().catch(() => undefined);
  }, 150);
}

export async function flushUserStateSync() {
  if (typeof window === "undefined") return;
  userStateHydrated = true;
  if (syncTimeout) {
    window.clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  await savePersistedUserState().catch(() => undefined);
}

export function resetUserStateHydration() {
  userStateHydrated = false;
}

export async function hydratePersistedUserState(userId?: string) {
  if (typeof window === "undefined") return;

  const ownerId = userId?.trim() || "";
  const previousOwner = localStorage.getItem(STATE_OWNER_KEY) || "";
  const localState = readPersistedUserStateFromLocal();
  const backendState = await fetchPersistedUserState();

  let nextState: PersistedUserState;

  if (hasAnyState(backendState)) {
    nextState = {
      ...backendState,
      siteSubscriptions: mergeSubscriptionMaps(
        localState.siteSubscriptions,
        backendState.siteSubscriptions,
      ),
    };
  } else if (
    ownerId &&
    previousOwner === ownerId &&
    hasAnyState(localState)
  ) {
    // Same user refreshed before backend write landed — safe to re-upload.
    nextState = localState;
    await savePersistedUserState(localState).catch(() => undefined);
  } else {
    // New / different user must not inherit another browser account's purchases.
    nextState = { ...EMPTY_STATE };
  }

  nextState = await sanitizeStateForOwnedSites(nextState);
  writePersistedUserStateToLocal(nextState);

  if (ownerId) {
    localStorage.setItem(STATE_OWNER_KEY, ownerId);
  }

  // Persist cleanup if we stripped foreign export rows already saved on backend.
  if (hasAnyState(backendState) && !statesEqual(backendState, nextState)) {
    await savePersistedUserState(nextState).catch(() => undefined);
  }

  userStateHydrated = true;
}
