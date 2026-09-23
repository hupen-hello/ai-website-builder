const ACTIVE_CREATE_AI_ID_KEY = "lestow-create-ai-active-id";

/** Short unique id for each Create-with-AI run (separate from redesign `rd_`). */
export function createCreateAiDesignId() {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `ca_${Date.now().toString(36)}_${rand}`;
}

export function setActiveCreateAiDesignId(designId: string) {
  if (typeof window === "undefined") return;
  const id = designId.trim();
  if (!id) return;
  window.sessionStorage.setItem(ACTIVE_CREATE_AI_ID_KEY, id);
  try {
    window.localStorage.setItem(ACTIVE_CREATE_AI_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getActiveCreateAiDesignId(): string | null {
  if (typeof window === "undefined") return null;
  const id =
    window.sessionStorage.getItem(ACTIVE_CREATE_AI_ID_KEY)?.trim() ||
    window.localStorage.getItem(ACTIVE_CREATE_AI_ID_KEY)?.trim();
  return id || null;
}

export function clearActiveCreateAiDesignId(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ACTIVE_CREATE_AI_ID_KEY);
    window.localStorage.removeItem(ACTIVE_CREATE_AI_ID_KEY);
  } catch {
    /* ignore */
  }
}

export function createAiStorageKey(baseKey: string, designId?: string | null) {
  const id = (designId || getActiveCreateAiDesignId() || "").trim();
  return id ? `${baseKey}:${id}` : baseKey;
}

export function isValidCreateAiDesignId(value: string) {
  return /^ca_[a-z0-9]+_[a-z0-9]+$/i.test(value.trim());
}
