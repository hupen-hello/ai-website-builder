import {
  createAiStorageKey,
  getActiveCreateAiDesignId,
  setActiveCreateAiDesignId,
} from "@/lib/create-ai-design-id";
import type { CreateAiDesignPrefs } from "@/lib/create-ai-design-prefs";

export const CREATE_AI_PAYLOAD_KEY = "lestow-create-ai-payload";
export const CREATE_AI_SITE_KEY = "lestow-create-ai-site";
export const CREATE_AI_CHAT_KEY = "lestow-create-ai-chat";

function writeCreateAiStore(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / private */
  }
}

function readCreateAiStore(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
    );
  } catch {
    return null;
  }
}

function removeCreateAiStoreKey(store: Storage, key: string) {
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

export type CreateAiPayload = {
  designId: string;
  brandName: string;
  description: string;
  category: string;
  websiteRelated: string;
  pageType: string;
  audience: string;
  email?: string;
  mobile?: string;
  address?: string;
  hasLogo?: string;
  logoImage?: string;
  /** Optional design prefs from Create-AI onboarding step */
  designPrefs?: CreateAiDesignPrefs;
};

export type CreateAiPage = {
  id: string;
  label: string;
  html: string;
};

export type CreateAiSite = {
  pages: CreateAiPage[];
  activePageId: string;
};

export function saveCreateAiPayload(payload: CreateAiPayload, designId?: string) {
  if (typeof window === "undefined") return;
  const id = (designId || payload.designId || getActiveCreateAiDesignId() || "").trim();
  if (id) setActiveCreateAiDesignId(id);
  const next = { ...payload, ...(id ? { designId: id } : {}) };
  writeCreateAiStore(
    createAiStorageKey(CREATE_AI_PAYLOAD_KEY, id || null),
    JSON.stringify(next),
  );
  void import("@/lib/create-ai-design-sync").then((mod) => {
    mod.scheduleCreateAiDesignSync(id);
  });
}

export function getCreateAiPayload(designId?: string): CreateAiPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const id = (designId || getActiveCreateAiDesignId() || "").trim();
    const raw = readCreateAiStore(
      createAiStorageKey(CREATE_AI_PAYLOAD_KEY, id || null),
    );
    if (!raw) return null;
    return JSON.parse(raw) as CreateAiPayload;
  } catch {
    return null;
  }
}

export function saveCreateAiSite(site: CreateAiSite, designId?: string) {
  if (typeof window === "undefined") return;
  const id = (designId || getActiveCreateAiDesignId() || "").trim();
  try {
    writeCreateAiStore(
      createAiStorageKey(CREATE_AI_SITE_KEY, id || null),
      JSON.stringify(site),
    );
  } catch {
    /* quota */
  }
  void import("@/lib/create-ai-design-sync").then((mod) => {
    mod.scheduleCreateAiDesignSync(id);
  });
}

export function getCreateAiSite(designId?: string): CreateAiSite | null {
  if (typeof window === "undefined") return null;
  try {
    const id = (designId || getActiveCreateAiDesignId() || "").trim();
    const raw = readCreateAiStore(
      createAiStorageKey(CREATE_AI_SITE_KEY, id || null),
    );
    if (raw) return JSON.parse(raw) as CreateAiSite;

    // Migrate older single-html saves
    const legacy = readCreateAiStore(
      createAiStorageKey("lestow-create-ai-html", id || null),
    );
    if (legacy) {
      const migrated: CreateAiSite = {
        pages: [{ id: "home", label: "Home", html: legacy }],
        activePageId: "home",
      };
      saveCreateAiSite(migrated, id);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

/** @deprecated prefer saveCreateAiSite — kept for one-shot home html writes */
export function saveCreateAiHtml(html: string, designId?: string) {
  const existing = getCreateAiSite(designId);
  const home = existing?.pages.find((p) => p.id === "home");
  const pages = existing?.pages?.length
    ? existing.pages.map((p) =>
        p.id === (existing.activePageId || "home") ? { ...p, html } : p,
      )
    : [{ id: "home", label: "Home", html }];
  saveCreateAiSite(
    {
      pages,
      activePageId: existing?.activePageId || "home",
    },
    designId,
  );
  if (!home && pages[0]) {
    /* ensure home exists */
  }
}

export function getCreateAiHtml(designId?: string): string {
  const site = getCreateAiSite(designId);
  if (!site?.pages?.length) return "";
  const active =
    site.pages.find((p) => p.id === site.activePageId) || site.pages[0];
  return active?.html || "";
}

export type CreateAiStoredChatMessage = {
  role: "user" | "assistant";
  content: string;
  at?: number;
  imagePreviews?: string[];
};

/** Guest + refresh: chat always in localStorage. Logged-in sync also pushes to DB. */
export function saveCreateAiChat(
  messages: CreateAiStoredChatMessage[],
  designId?: string,
) {
  if (typeof window === "undefined") return;
  const id = (designId || getActiveCreateAiDesignId() || "").trim();
  if (!id) return;
  const slim = (messages || [])
    .filter((m) => m?.role && typeof m.content === "string")
    .slice(-40)
    .map((m) => ({
      role: m.role,
      content: String(m.content || "").slice(0, 4000),
      at: typeof m.at === "number" ? m.at : Date.now(),
      ...(Array.isArray(m.imagePreviews) && m.imagePreviews.length
        ? { imagePreviews: m.imagePreviews.slice(0, 2).map((u) => String(u).slice(0, 200_000)) }
        : {}),
    }));
  writeCreateAiStore(
    createAiStorageKey(CREATE_AI_CHAT_KEY, id),
    JSON.stringify(slim),
  );
  void import("@/lib/create-ai-design-sync").then((mod) => {
    mod.scheduleCreateAiDesignSync(id);
  });
}

export function getCreateAiChat(
  designId?: string,
): CreateAiStoredChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const id = (designId || getActiveCreateAiDesignId() || "").trim();
    const raw = readCreateAiStore(
      createAiStorageKey(CREATE_AI_CHAT_KEY, id || null),
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CreateAiStoredChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isMultiPageType(pageType?: string) {
  return /multi/i.test(pageType || "");
}

/** Clear all Create-AI session + durable payloads/sites for Start fresh. */
export function clearAllCreateAiStorage(): void {
  if (typeof window === "undefined") return;
  const prefixes = [
    CREATE_AI_PAYLOAD_KEY,
    CREATE_AI_SITE_KEY,
    CREATE_AI_CHAT_KEY,
    "lestow-create-ai-html",
  ];
  const sweep = (store: Storage) => {
    const keys: string[] = [];
    try {
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && prefixes.some((p) => key.startsWith(p))) keys.push(key);
      }
    } catch {
      return;
    }
    for (const key of keys) removeCreateAiStoreKey(store, key);
  };
  try {
    sweep(window.sessionStorage);
    sweep(window.localStorage);
  } catch {
    /* ignore */
  }
}
