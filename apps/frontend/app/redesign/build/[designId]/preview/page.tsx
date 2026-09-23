"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  getBuiltSiteSections,
  getBuiltSiteTheme,
  type BuiltSiteSectionsHtml,
  type BuiltSiteTheme,
} from "@/lib/built-site-theme";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";
import BuildingOverlay from "./components/BuildingOverlay";
import LiveBuildFeed from "./components/LiveBuildFeed";
import PreviewSkeleton from "./components/PreviewSkeleton";

function BuildPreviewContent() {
  const params = useParams();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";
  const searchParams = useSearchParams();
  const step = Number(searchParams.get("step") ?? "0");
  const streaming = searchParams.get("live") === "1" || step < 5;
  const [theme, setTheme] = useState<BuiltSiteTheme | null>(null);
  const [sections, setSections] = useState<BuiltSiteSectionsHtml | null>(null);

  useEffect(() => {
    if (designId) setActiveRedesignDesignId(designId);
  }, [designId]);

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      setTheme(getBuiltSiteTheme(designId));
      setSections(getBuiltSiteSections(designId));
    };
    queueMicrotask(sync);
    const timer = window.setInterval(sync, 400);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [step, designId]);

  if (theme?.composePreviewUrl) {
    return (
      <div className="relative h-full min-h-full overflow-hidden bg-white">
        <iframe
          title="Template library compose preview"
          src={theme.composePreviewUrl}
          className="block h-full min-h-[70vh] w-full border-0 bg-white"
        />
        {streaming ? (
          <div className="absolute bottom-3 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 px-3">
            <LiveBuildFeed designId={designId} compact className="shadow-2xl" />
          </div>
        ) : null}
      </div>
    );
  }

  const items = sections?.items || [];

  if (items.length && !/data-lestow-template-library/i.test(items[0]?.html || "")) {
    const visible =
      step >= 5 || step <= 0
        ? items
        : items.slice(0, Math.max(1, Math.min(items.length, step)));
    const cloneHtml = visible.find((item) =>
      /data-lestow-clone-doc/i.test(item.html || ""),
    )?.html;

    if (cloneHtml) {
      return (
        <div className="relative h-full min-h-full overflow-hidden bg-white">
          <iframe
            title="Lestow clone preview"
            srcDoc={cloneHtml}
            className="block h-full min-h-[70vh] w-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
          {streaming ? (
            <div className="absolute bottom-3 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 px-3">
              <LiveBuildFeed designId={designId} compact className="shadow-2xl" />
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="relative h-full min-h-full overflow-auto bg-white text-slate-950">
        {visible.map((item, index) => (
          <div key={`${item.id}-${index}`} className="relative">
            <div dangerouslySetInnerHTML={{ __html: item.html }} />
            {streaming && index === visible.length - 1 && step < 5 && (
              <BuildingOverlay label={`Lestow: ${item.label}…`} />
            )}
          </div>
        ))}
        {streaming ? (
          <div className="sticky bottom-3 z-20 mx-auto max-w-xl px-3 pb-3">
            <LiveBuildFeed designId={designId} compact className="shadow-2xl" />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <PreviewSkeleton
      designId={designId}
      message={
        theme?.buildMode === "template-library"
          ? "Assembling uploaded template components with your brand…"
          : theme
            ? "Building layout from your domain data — watch the live feed…"
            : "Reading domain content — live progress below…"
      }
    />
  );
}

export default function BuildPreviewPage() {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <BuildPreviewContent />
    </Suspense>
  );
}
