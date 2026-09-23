"use client";

import { Suspense, useEffect, useMemo, useState, CSSProperties } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { sectionRegistry } from "@/app/editor/layout/src/lib/sectionRegistry";
import {
  getTemplateVariables,
  refreshCategoryContentFromApi,
  resolveLayoutPreview,
} from "@/app/editor/layout/src/data/templateFlow";
import EditorLoadingScreen from "@/app/editor/components/EditorLoadingScreen";

function LayoutPreviewInner() {
  const params = useParams<{ key: string }>();
  const searchParams = useSearchParams();
  const variantKey = decodeURIComponent(params.key || "");
  const category = searchParams.get("category") || "Business";
  const isEmbedded = searchParams.get("embed") === "1";
  const cacheKey = searchParams.get("t") || "";
  const requestKey = `${variantKey}:${category}:${cacheKey}`;
  const [loadedContentKey, setLoadedContentKey] = useState<string | null>(null);
  const contentReady = loadedContentKey === requestKey;

  useEffect(() => {
    let cancelled = false;

    if (isEmbedded) {
      setLoadedContentKey(requestKey);
      void refreshCategoryContentFromApi().then(() => {
        if (!cancelled) setLoadedContentKey(requestKey);
      });
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      await refreshCategoryContentFromApi();
      if (!cancelled) setLoadedContentKey(requestKey);
    })();
    return () => {
      cancelled = true;
    };
  }, [requestKey, isEmbedded]);

  const preview = useMemo(
    () =>
      contentReady ? resolveLayoutPreview(variantKey, category) : null,
    [variantKey, category, contentReady],
  );
  const Component = sectionRegistry[variantKey];
  const cssVars = useMemo(
    () =>
      contentReady
        ? (getTemplateVariables("template-1") as CSSProperties)
        : ({} as CSSProperties),
    [contentReady],
  );

  useEffect(() => {
    if (!isEmbedded || !contentReady) return;
    window.parent.postMessage(
      {
        type: "ai-builder-layout-preview-ready",
        src: `${window.location.pathname}${window.location.search}`,
      },
      window.location.origin,
    );
  }, [contentReady, isEmbedded, requestKey]);

  if (!contentReady) {
    return isEmbedded ? (
      <EditorLoadingScreen variant="embed" />
    ) : (
      <EditorLoadingScreen message="Loading content…" />
    );
  }

  if (!Component) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-8 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Unknown layout
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{variantKey}</h1>
          <p className="mt-2 text-sm text-slate-500">
            This key is not in sectionRegistry.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${isEmbedded ? "h-dvh overflow-hidden" : "min-h-dvh"} bg-white`}
      style={cssVars}
    >
      {!isEmbedded ? (
        <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Layout preview · {category}
            </p>
            <p className="text-sm font-bold text-slate-900">
              {variantKey}
              {preview ? (
                <span className="ml-2 font-medium text-slate-500">
                  · {preview.sectionType}
                </span>
              ) : null}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            Category content
          </span>
        </div>
        </div>
      ) : null}

      <div className="w-full overflow-hidden">
        <Component data={preview?.data} />
      </div>
    </main>
  );
}

function LayoutPreviewSuspenseFallback() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get("embed") === "1";
  return isEmbedded ? (
    <EditorLoadingScreen variant="embed" />
  ) : (
    <EditorLoadingScreen message="Loading preview…" />
  );
}

export default function LayoutPreviewPage() {
  return (
    <Suspense fallback={<LayoutPreviewSuspenseFallback />}>
      <LayoutPreviewInner />
    </Suspense>
  );
}
