import {
  getActiveRedesignDesignId,
  redesignStorageKey,
} from "@/lib/redesign-design-id";

export type RedesignFeedEvent = {
  id: string;
  at: number;
  tone?: "info" | "work" | "ok" | "warn";
  title: string;
  detail?: string;
};

const FEED_KEY = "lestow-redesign-build-feed";
const FEED_START_KEY = "lestow-redesign-build-feed-start";
const FEED_EVENT = "lestow-redesign-build-feed";

/** Typical full redesign (capture + Lestow vision + gap fill). Often 6–10 min. */
export const REDESIGN_ESTIMATE_MS = 2 * 60 * 1000;

function key(designId?: string | null) {
  return redesignStorageKey(FEED_KEY, designId);
}

function startKey(designId?: string | null) {
  return redesignStorageKey(FEED_START_KEY, designId);
}

export function clearRedesignBuildFeed(designId?: string | null) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key(designId));
  window.sessionStorage.setItem(startKey(designId), String(Date.now()));
  window.dispatchEvent(new CustomEvent(FEED_EVENT, { detail: { designId } }));
}

export function getRedesignBuildStartedAt(designId?: string | null): number {
  if (typeof window === "undefined") return Date.now();
  const raw = window.sessionStorage.getItem(startKey(designId));
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  const now = Date.now();
  window.sessionStorage.setItem(startKey(designId), String(now));
  return now;
}

export function readRedesignBuildFeed(designId?: string | null): RedesignFeedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(key(designId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RedesignFeedEvent[];
    return Array.isArray(parsed) ? parsed.slice(-80) : [];
  } catch {
    return [];
  }
}

export function pushRedesignBuildFeed(
  event: Omit<RedesignFeedEvent, "id" | "at"> & { id?: string },
  designId?: string | null,
) {
  if (typeof window === "undefined") return;
  const id = (designId || getActiveRedesignDesignId() || "").trim();
  const next: RedesignFeedEvent = {
    id: event.id || `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    tone: event.tone || "info",
    title: event.title,
    detail: event.detail,
  };
  const prev = readRedesignBuildFeed(id);
  const last = prev[prev.length - 1];
  if (last && last.title === next.title && last.detail === next.detail) return;
  const list = [...prev, next].slice(-80);
  window.sessionStorage.setItem(key(id), JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(FEED_EVENT, { detail: { designId: id } }));
}

export function subscribeRedesignBuildFeed(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(FEED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(FEED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Soft tips while Lestow runs — must NOT sound like finished work. */
export const LIVE_FEED_TICKS = [
  {
    title: "Reading your live domain",
    detail: "Lestow pulls layout structure, then fills your logo, copy, and contact from that site.",
  },
  {
    title: "Your assets stay yours",
    detail: "We use logo, photos, phone, and content from your existing domain — not another site.",
  },
  {
    title: "Footer uses your contact",
    detail: "Address / phone / email from your domain extract only.",
  },
] as const;
