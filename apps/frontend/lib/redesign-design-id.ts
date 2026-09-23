const ACTIVE_REDESIGN_ID_KEY = "lestow-redesign-active-id";

/** Short unique id for each redesign run (URL segment). */
export function createRedesignDesignId() {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `rd_${Date.now().toString(36)}_${rand}`;
}

export function setActiveRedesignDesignId(designId: string) {
  if (typeof window === "undefined") return;
  const id = designId.trim();
  if (!id) return;
  window.sessionStorage.setItem(ACTIVE_REDESIGN_ID_KEY, id);
  try {
    window.localStorage.setItem(ACTIVE_REDESIGN_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getActiveRedesignDesignId(): string | null {
  if (typeof window === "undefined") return null;
  const id =
    window.sessionStorage.getItem(ACTIVE_REDESIGN_ID_KEY)?.trim() ||
    window.localStorage.getItem(ACTIVE_REDESIGN_ID_KEY)?.trim();
  return id || null;
}

export function clearActiveRedesignDesignId(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ACTIVE_REDESIGN_ID_KEY);
    window.localStorage.removeItem(ACTIVE_REDESIGN_ID_KEY);
  } catch {
    /* ignore */
  }
}

export function redesignStorageKey(baseKey: string, designId?: string | null) {
  const id = (designId || getActiveRedesignDesignId() || "").trim();
  return id ? `${baseKey}:${id}` : baseKey;
}

export function isValidRedesignDesignId(value: string) {
  return /^rd_[a-z0-9]+_[a-z0-9]+$/i.test(value.trim());
}
