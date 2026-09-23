"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import { rememberEditorForAuthCancel, buildPlanPageUrl } from "@/lib/authReturn";
import { resolveEditorSiteId } from "@/lib/migrateGuestSite";
import { isEditorCorePlanActive } from "@/lib/userPlan";

export type ManagerAiKind =
  | "service"
  | "blog"
  | "portfolio"
  | "event"
  | "team"
  | "gallery"
  | "country";

export type ManagerAiTextField = "summary" | "content" | "seo";
export type ManagerAiBusyField = ManagerAiTextField | "image";

export type ManagerAiItem = {
  title?: string;
  desc?: string;
  content?: string;
  category?: string;
  author?: string;
};

const IMAGE_CATEGORY: Record<ManagerAiKind, string> = {
  service: "business",
  blog: "business",
  portfolio: "business",
  event: "business",
  team: "business",
  gallery: "business",
  country: "business",
};

export const AiFieldButton = ({
  title,
  loading,
  onClick,
}: {
  title: string;
  loading?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={loading}
    onClick={onClick}
    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? (
      <Loader2 size={14} className="animate-spin" />
    ) : (
      <Sparkles size={14} />
    )}
  </button>
);

export const FieldLabelWithAi = ({
  label,
  aiTitle,
  aiLoading,
  onAiClick,
}: {
  label: string;
  aiTitle: string;
  aiLoading?: boolean;
  onAiClick: () => void;
}) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <span className="text-sm font-semibold text-slate-800">{label}</span>
    <AiFieldButton title={aiTitle} loading={aiLoading} onClick={onAiClick} />
  </div>
);

export function useManagerAiPlan(siteId?: string) {
  const router = useRouter();
  const { user } = useUserAuth();

  const requireCorePlanForAi = useCallback(() => {
    const activeSiteId = siteId || resolveEditorSiteId();
    if (isEditorCorePlanActive(activeSiteId)) return true;
    rememberEditorForAuthCancel();
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("ai-builder-login-required", {
          detail: { intent: "upgrade" },
        }),
      );
      return false;
    }
    router.push(buildPlanPageUrl(activeSiteId));
    return false;
  }, [router, siteId, user]);

  return { requireCorePlanForAi };
}

export function useManagerAiFields(options: {
  siteId?: string;
  kind: ManagerAiKind;
  getTitle: () => string;
  getItem: () => ManagerAiItem;
  getExisting?: (field: ManagerAiTextField) => string | undefined;
  onSummary: (text: string) => void;
  onContent?: (html: string) => void;
  onSeo?: (value: {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
  }) => void;
  onImage?: (url: string) => void;
  imageHintParts?: () => string[];
  avoidImageSrcs?: () => string[];
}) {
  const { requireCorePlanForAi } = useManagerAiPlan(options.siteId);
  const [aiFieldBusy, setAiFieldBusy] = useState<ManagerAiBusyField | null>(
    null,
  );

  const generateText = useCallback(
    async (field: ManagerAiTextField) => {
      if (!options.getTitle().trim()) return;
      if (!requireCorePlanForAi()) return;
      setAiFieldBusy(field);
      try {
        const response = await fetch("/api/ai/manager-field", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: options.kind,
            field,
            item: options.getItem(),
            existing: options.getExisting?.(field),
          }),
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          text?: string;
          seoTitle?: string;
          seoDescription?: string;
          seoKeywords?: string;
        };
        if (field === "summary" && data.text) options.onSummary(data.text);
        if (field === "content" && data.text) options.onContent?.(data.text);
        if (field === "seo") {
          options.onSeo?.({
            seoTitle: data.seoTitle || "",
            seoDescription: data.seoDescription || "",
            seoKeywords: data.seoKeywords || "",
          });
        }
      } catch {
        /* keep current text on failure */
      } finally {
        setAiFieldBusy(null);
      }
    },
    [options, requireCorePlanForAi],
  );

  const generateImage = useCallback(async () => {
    if (!options.getTitle().trim()) return;
    if (!requireCorePlanForAi()) return;
    if (!options.onImage) return;
    setAiFieldBusy("image");
    try {
      let locale = "en-IN";
      let timeZone = "Asia/Kolkata";
      try {
        locale = navigator.language || locale;
        timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
      } catch {
        // keep defaults
      }
      const response = await fetch("/api/ai/related-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: IMAGE_CATEGORY[options.kind],
          locale,
          timeZone,
          hint: (options.imageHintParts?.() || [])
            .filter(Boolean)
            .join(" ")
            .slice(0, 240),
          avoidSrc: options.avoidImageSrcs?.()[0],
          avoidSrcs: options.avoidImageSrcs?.() || [],
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { url?: string };
      const nextSrc = typeof data.url === "string" ? data.url.trim() : "";
      if (nextSrc) options.onImage(nextSrc);
    } catch {
      /* keep current image on failure */
    } finally {
      setAiFieldBusy(null);
    }
  }, [options, requireCorePlanForAi]);

  return {
    aiFieldBusy,
    generateText,
    generateImage,
    requireCorePlanForAi,
  };
}
