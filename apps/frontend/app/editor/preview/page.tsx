"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PublishedSiteClient from "../../published/[siteId]/PublishedSiteClient";
import type { PublishedSitePayload } from "@/lib/publishedSeo";

type PrivateSiteResponse = {
  id?: string;
  title?: string;
  slug?: string;
  templateId?: string;
  category?: string;
  publishedAt?: string | null;
  updatedAt?: string;
  config?: {
    templateId?: string;
    category?: string;
    pageLinks?: unknown[];
    sections?: unknown[];
    templateVariables?: Record<string, string>;
    businessInfo?: PublishedSitePayload["businessInfo"];
    seo?: PublishedSitePayload["seo"];
  };
};

function EditorPreviewContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId") || "";
  const [payload, setPayload] = useState<PublishedSitePayload | null>(null);
  const [loading, setLoading] = useState(Boolean(siteId));
  const [error, setError] = useState(
    siteId ? "" : "Website preview is unavailable",
  );

  useEffect(() => {
    if (!siteId) return;
    const controller = new AbortController();

    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/user/sites/${siteId}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const site = (await response.json().catch(() => ({}))) as PrivateSiteResponse & {
          message?: string;
        };
        const config = site.config;

        if (
          !response.ok ||
          !site.id ||
          !site.templateId ||
          !site.category ||
          !config ||
          !Array.isArray(config.sections)
        ) {
          throw new Error(site.message || "Unable to load website preview");
        }

        setPayload({
          id: site.id,
          title: site.title,
          slug: site.slug,
          templateId: config.templateId || site.templateId,
          category: config.category || site.category,
          pageLinks: Array.isArray(config.pageLinks)
            ? (config.pageLinks as PublishedSitePayload["pageLinks"])
            : [],
          sections: Array.isArray(config.sections)
            ? (config.sections as PublishedSitePayload["sections"])
            : [],
          templateVariables: config.templateVariables || {},
          businessInfo: config.businessInfo || null,
          seo: config.seo || null,
          publishedAt:
            site.publishedAt || site.updatedAt || new Date().toISOString(),
          updatedAt: site.updatedAt,
        });
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load website preview",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadPreview();
    return () => controller.abort();
  }, [siteId]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white text-slate-600">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Loading preview...
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-5">
        <div className="rounded-2xl border border-red-100 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-900">Preview unavailable</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  return <PublishedSiteClient siteId={siteId} initialPayload={payload} />;
}

export default function EditorPreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-white" aria-label="Loading preview" />
      }
    >
      <EditorPreviewContent />
    </Suspense>
  );
}
