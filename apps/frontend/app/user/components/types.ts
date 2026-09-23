export type UserSite = {
  id: string;
  title: string;
  slug: string;
  status: string;
  templateId: string | null;
  category: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt: string;
  pageCount?: number;
  isMultiPage?: boolean;
  /** redesign | create-custom | create-ai */
  flow?: string;
  flowLabel?: string;
  createPath?: string | null;
  designId?: string | null;
  /** Virtual Create-AI design card (not a Site row) */
  kind?: "site" | "create-ai";
};

export type SiteFilter = "all" | "published" | "draft";

export const CARD_GRADIENTS = [
  "linear-gradient(135deg,#2563eb 0%,#4f46e5 48%,#7c3aed 100%)",
  "linear-gradient(135deg,#0891b2 0%,#0284c7 48%,#2563eb 100%)",
  "linear-gradient(135deg,#0f766e 0%,#059669 48%,#16a34a 100%)",
  "linear-gradient(135deg,#ea580c 0%,#e11d48 48%,#9333ea 100%)",
];

export function getSitePreviewGradient(index: number) {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

export function formatRelativeUpdatedAt(updatedAt: string) {
  const updated = new Date(updatedAt);
  const diffMs = Date.now() - updated.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (!Number.isFinite(diffHours) || diffHours < 1) {
    return "Edited recently";
  }
  if (diffHours < 24) {
    return `Edited ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Edited yesterday";
  }
  if (diffDays < 7) {
    return `Edited ${diffDays} days ago`;
  }

  return `Edited ${updated.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

export function formatSiteDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
