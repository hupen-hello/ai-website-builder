export type UserSite = {
  id: string;
  title: string;
  slug: string;
  status: string;
  templateId: string | null;
  category: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export type SiteFilter = "all" | "published" | "draft";

export const CARD_GRADIENTS = [
  "linear-gradient(135deg,#2563eb 0%,#4f46e5 48%,#7c3aed 100%)",
  "linear-gradient(135deg,#0891b2 0%,#0284c7 48%,#2563eb 100%)",
  "linear-gradient(135deg,#0f766e 0%,#059669 48%,#16a34a 100%)",
  "linear-gradient(135deg,#ea580c 0%,#e11d48 48%,#9333ea 100%)",
];

export const PREVIEW_FALLBACK_IMAGES = [
  "/blackbaypreview.png",
  "/haellipreview.png",
  "/shayepreview.png",
  "/stylampreview.png",
];

export function getSitePreviewImage(index: number) {
  return PREVIEW_FALLBACK_IMAGES[index % PREVIEW_FALLBACK_IMAGES.length];
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
