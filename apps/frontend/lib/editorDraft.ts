/** Guest editor draft — template selection + section edits on this device. */

import type { SiteSeoConfig } from "./siteSeo";

export type EditorDraftPageLink = {
  label: string;
  href: string;
  children?: EditorDraftPageLink[];
  kind?: "page" | "blogIndex" | "blog";
  hidden?: boolean;
  layout?: string;
  author?: string;
  image?: string;
};

export type EditorDraft = {
  v: 1;
  updatedAt: number;
  /** True only while this device has a user change that may not be in DB yet. */
  pendingSync?: boolean;
  siteId?: string;
  templateId: string;
  category: string;
  sections: unknown[];
  pageLinks: EditorDraftPageLink[];
  templateVariables?: Record<string, string>;
  seo?: SiteSeoConfig;
};

const STORAGE_KEY = "css-ai-editor-draft";
const SITE_STORAGE_PREFIX = `${STORAGE_KEY}:site:`;
const REVISION_PREFIX = "css-ai-editor-revisions";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const IDB_NAME = "css-ai-editor";
const IDB_STORE = "drafts";

const getStorageKey = (siteId?: string | null) =>
  siteId ? `${SITE_STORAGE_PREFIX}${encodeURIComponent(siteId)}` : STORAGE_KEY;

function isValidDraft(raw: unknown): raw is EditorDraft {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as EditorDraft;
  return (
    d.v === 1 &&
    typeof d.updatedAt === "number" &&
    (d.siteId === undefined || typeof d.siteId === "string") &&
    typeof d.templateId === "string" &&
    d.templateId.length > 0 &&
    typeof d.category === "string" &&
    d.category.length > 0 &&
    Array.isArray(d.sections) &&
    d.sections.length > 0 &&
    Array.isArray(d.pageLinks)
  );
}

function sameTemplate(draft: EditorDraft, templateId?: string | null) {
  if (!templateId) return true;
  return draft.templateId === templateId;
}

function sameCategory(draft: EditorDraft, category?: string | null) {
  if (!category) return true;
  return draft.category.trim().toLowerCase() === category.trim().toLowerCase();
}

function isFreshDraft(draft: EditorDraft) {
  return Date.now() - draft.updatedAt <= TTL_MS;
}

function parseStoredDraft(raw: string | null): EditorDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidDraft(parsed) || !isFreshDraft(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function draftMatches(
  draft: EditorDraft,
  templateId?: string | null,
  category?: string | null,
  siteId?: string | null,
) {
  if (siteId && draft.siteId !== siteId) return false;
  if (!sameTemplate(draft, templateId)) return false;
  if (!sameCategory(draft, category)) return false;
  return true;
}

function clearRevisionKeys() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(REVISION_PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function writeLocalStorageDraft(key: string, serialized: string) {
  localStorage.setItem(key, serialized);
}

function persistLocalStorageDraft(key: string, payload: EditorDraft) {
  const serialized = JSON.stringify(payload);
  try {
    writeLocalStorageDraft(key, serialized);
    return;
  } catch {
    /* quota */
  }
  clearRevisionKeys();
  try {
    writeLocalStorageDraft(key, serialized);
    return;
  } catch {
    /* still full */
  }
  try {
    localStorage.removeItem("ai-builder-page-links");
    localStorage.removeItem("ai-builder-current-page");
  } catch {
    /* ignore */
  }
  try {
    writeLocalStorageDraft(key, serialized);
  } catch {
    /* IndexedDB still holds the copy */
  }
}

function openDraftDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeDraftToIdb(key: string, payload: EditorDraft) {
  const db = await openDraftDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(payload, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      try {
        db.close();
      } catch {
        /* ignore */
      }
      resolve();
    }
  });
}

async function readDraftFromIdb(key: string): Promise<EditorDraft | null> {
  const db = await openDraftDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => {
        const value = isValidDraft(req.result) && isFreshDraft(req.result)
          ? req.result
          : null;
        db.close();
        resolve(value);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      try {
        db.close();
      } catch {
        /* ignore */
      }
      resolve(null);
    }
  });
}

async function deleteDraftFromIdb(key: string) {
  const db = await openDraftDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      try {
        db.close();
      } catch {
        /* ignore */
      }
      resolve();
    }
  });
}

function readLocalStorageDraft(siteId?: string | null): EditorDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const storageKey = getStorageKey(siteId);
    const parsed = parseStoredDraft(localStorage.getItem(storageKey));
    if (!parsed) return null;
    if (siteId && parsed.siteId !== siteId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readEditorDraft(
  templateId?: string | null,
  category?: string | null,
  siteId?: string | null,
): EditorDraft | null {
  const parsed = readLocalStorageDraft(siteId);
  if (!parsed) return null;
  if (!draftMatches(parsed, templateId, category, siteId)) return null;
  return parsed;
}

function listStoredEditorDrafts(): EditorDraft[] {
  if (typeof window === "undefined") return [];
  const drafts: EditorDraft[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_KEY)) continue;
      const parsed = parseStoredDraft(localStorage.getItem(key));
      if (parsed) drafts.push(parsed);
    }
  } catch {
    /* ignore */
  }
  return drafts;
}

function newestEditorDraft(
  drafts: EditorDraft[],
  predicate?: (draft: EditorDraft) => boolean,
): EditorDraft | null {
  let best: EditorDraft | null = null;
  for (const draft of drafts) {
    if (predicate && !predicate(draft)) continue;
    if (!best || draft.updatedAt > best.updatedAt) best = draft;
  }
  return best;
}

function isRedesignEditorDraft(draft: EditorDraft) {
  return Boolean(draft.siteId && /^rd_/i.test(draft.siteId));
}

/** Latest editor draft regardless of template (for home resume) */
export function readAnyEditorDraft(): EditorDraft | null {
  return newestEditorDraft(listStoredEditorDrafts());
}

/** Guest / custom template editor draft (excludes redesign rd_ slots). */
export function readNewestCustomEditorDraft(): EditorDraft | null {
  return newestEditorDraft(
    listStoredEditorDrafts(),
    (draft) => !isRedesignEditorDraft(draft),
  );
}

/** Redesign designId-scoped editor draft. */
export function readNewestRedesignEditorDraft(): EditorDraft | null {
  return newestEditorDraft(listStoredEditorDrafts(), isRedesignEditorDraft);
}

function pickBestDraft(
  drafts: Array<EditorDraft | null>,
  templateId?: string | null,
  category?: string | null,
  siteId?: string | null,
) {
  const valid = drafts.filter((draft): draft is EditorDraft => Boolean(draft));
  if (!valid.length) return null;
  const exact = valid.find((draft) =>
    draftMatches(draft, templateId, category, siteId),
  );
  if (exact) return exact;
  const sameTpl = valid.find((draft) => sameTemplate(draft, templateId));
  return sameTpl || (!siteId ? valid[0] : null);
}

/** Async hydrate — IndexedDB first, then localStorage. Use on editor boot. */
export async function loadEditorDraft(
  templateId?: string | null,
  category?: string | null,
  siteId?: string | null,
): Promise<EditorDraft | null> {
  if (typeof window === "undefined") return null;
  const key = getStorageKey(siteId);
  const fromIdb = await readDraftFromIdb(key);
  const fromLs = readLocalStorageDraft(siteId);
  return pickBestDraft([fromIdb, fromLs], templateId, category, siteId);
}

export function saveEditorDraft(
  draft: Omit<EditorDraft, "v" | "updatedAt"> & {
    updatedAt?: number;
  },
): void {
  if (typeof window === "undefined") return;
  const { updatedAt, ...draftData } = draft;
  const payload: EditorDraft = {
    v: 1,
    ...draftData,
    updatedAt:
      typeof updatedAt === "number" && Number.isFinite(updatedAt)
        ? updatedAt
        : Date.now(),
    pendingSync: draftData.pendingSync ?? true,
  };
  const key = getStorageKey(draft.siteId);
  persistLocalStorageDraft(key, payload);
  void writeDraftToIdb(key, payload);
}

export function clearEditorDraft(siteId?: string | null): void {
  if (typeof window === "undefined") return;
  const key = getStorageKey(siteId);
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  void deleteDraftFromIdb(key);
}

/** Remove every redesign (rd_) site-scoped editor draft without touching custom. */
export function clearRedesignSiteEditorDrafts(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(SITE_STORAGE_PREFIX)) continue;
      try {
        const siteId = decodeURIComponent(key.slice(SITE_STORAGE_PREFIX.length));
        if (/^rd_/i.test(siteId)) keys.push(key);
      } catch {
        /* ignore bad key */
      }
    }
    for (const key of keys) {
      localStorage.removeItem(key);
      void deleteDraftFromIdb(key);
    }
  } catch {
    /* ignore */
  }
}

async function clearAllDraftsFromIdb(): Promise<void> {
  const db = await openDraftDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      try {
        db.close();
      } catch {
        /* ignore */
      }
      resolve();
    }
  });
}

/** Wipe every editor draft slot (global + site:/rd_/ca_ scoped). */
export function clearAllEditorDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  void clearAllDraftsFromIdb();
}

/** Move the legacy/global draft into its active site's isolated storage slot. */
export function moveEditorDraftToSite(siteId: string): void {
  const draft = readEditorDraft();
  if (!draft) return;

  const existing = readEditorDraft(draft.templateId, draft.category, siteId);
  if (!existing || draft.updatedAt > existing.updatedAt) {
    saveEditorDraft({
      siteId,
      templateId: draft.templateId,
      category: draft.category,
      sections: draft.sections,
      pageLinks: draft.pageLinks,
      templateVariables: draft.templateVariables,
      seo: draft.seo,
    });
  }

  clearEditorDraft();
}

export function getEditorDraftEditorUrl(): string | null {
  const draft =
    readNewestCustomEditorDraft() || readNewestRedesignEditorDraft();
  if (!draft) return null;
  const siteId = (draft.siteId || "").trim();
  if (/^rd_/i.test(siteId)) {
    return `/editor?${new URLSearchParams({ designId: siteId }).toString()}`;
  }
  const params = new URLSearchParams({
    templateId: draft.templateId,
    category: draft.category,
  });
  if (siteId) params.set("siteId", siteId);
  return `/editor?${params.toString()}`;
}

export function hasEditorDraftFor(
  templateId: string | null | undefined,
  category: string | null | undefined,
): boolean {
  if (!templateId || !category) return false;
  if (readEditorDraft(templateId, category)) return true;
  return Boolean(
    newestEditorDraft(
      listStoredEditorDrafts(),
      (draft) =>
        !isRedesignEditorDraft(draft) &&
        draftMatches(draft, templateId, category),
    ),
  );
}
