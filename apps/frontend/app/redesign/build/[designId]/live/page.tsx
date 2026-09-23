"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import { sectionRegistry } from "@/app/editor/layout/src/lib/sectionRegistry";
import { PreviewProvider } from "@/app/editor/layout/src/components/context/PreviewContext";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";
import { readRedesignEditorSections } from "@/lib/build-redesign-home-sections";
import { readRedesignEditorPack } from "@/lib/redesign-editor-session";
import { getRedesignBuildPayload } from "@/lib/redesign-build-storage";
import { CREATE_AI_FONTS } from "@/lib/create-ai-design-prefs";
import EditorLoadingScreen from "@/app/editor/components/EditorLoadingScreen";

type SectionItem = {
  id: string;
  type: string;
  variant: string;
  data: Record<string, Record<string, unknown>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sectionData(section: SectionItem): Record<string, unknown> {
  const variantData =
    section.data?.[section.variant] ?? section.data?.[`${section.type}-1`];
  if (isRecord(variantData)) return variantData;
  if (isRecord(section.data)) return section.data as Record<string, unknown>;
  return {};
}

function LiveBrandedPreview() {
  const params = useParams();
  const searchParams = useSearchParams();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";
  const limitRaw = Number(searchParams.get("limit") || "0");
  const [liveLimit, setLiveLimit] = useState(
    Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 0,
  );
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [cssVars, setCssVars] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [fontHref, setFontHref] = useState("");

  useEffect(() => {
    if (designId) setActiveRedesignDesignId(designId);
  }, [designId]);

  useEffect(() => {
    if (Number.isFinite(limitRaw) && limitRaw > 0) {
      setLiveLimit((prev) => Math.max(prev, limitRaw));
    }
  }, [limitRaw]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; limit?: number } | null;
      if (!data || data.type !== "lestow-redesign-reveal-limit") return;
      const next = Number(data.limit);
      if (!Number.isFinite(next) || next <= 0) return;
      setLiveLimit((prev) => Math.max(prev, next));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      const packed = readRedesignEditorPack(designId);
      const home = readRedesignEditorSections(designId) || [];
      setSections(home as SectionItem[]);
      if (packed?.templateVariables) {
        setCssVars(packed.templateVariables);
      }
      const payload = getRedesignBuildPayload(designId);
      const fontId = (payload?.fontFamily || "").trim();
      const font =
        CREATE_AI_FONTS.find((f) => f.id === fontId) ||
        CREATE_AI_FONTS.find((f) => f.id === "syne-manrope");
      if (font?.google) {
        setFontHref(
          `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`,
        );
      }
      setReady(home.length > 0);
    };
    queueMicrotask(sync);
    const timer = window.setInterval(sync, 500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [designId]);

  useEffect(() => {
    if (!fontHref || typeof document === "undefined") return;
    const id = "lestow-redesign-live-font";
    let el = document.getElementById(id) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.id = id;
      el.rel = "stylesheet";
      document.head.appendChild(el);
    }
    el.href = fontHref;
  }, [fontHref]);

  const effectiveLimit = liveLimit > 0 ? liveLimit : limitRaw;

  const visible = useMemo(() => {
    if (!sections.length) return [];
    if (!Number.isFinite(effectiveLimit) || effectiveLimit <= 0) return sections;
    return sections.slice(0, Math.min(sections.length, effectiveLimit));
  }, [sections, effectiveLimit]);

  useEffect(() => {
    if (!ready || visible.length === 0) return;
    if (!Number.isFinite(effectiveLimit) || effectiveLimit <= 0) return;
    const last = visible[visible.length - 1];
    if (!last) return;
    const scrollToLast = () => {
      const el =
        document.querySelector(`[data-section-id="${last.id}"]`) ||
        document.querySelector(`[data-variant="${last.variant}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t1 = window.setTimeout(scrollToLast, 120);
    const t2 = window.setTimeout(scrollToLast, 420);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready, effectiveLimit, visible.length, visible[visible.length - 1]?.id]);

  if (!ready) {
    return <EditorLoadingScreen variant="embed" message="Preparing your redesign…" />;
  }

  return (
    <PreviewProvider initialCurrentPage="home">
      <main
        className="min-h-dvh bg-white text-slate-950"
        style={cssVars as CSSProperties}
        data-template-scroll
        data-lestow-redesign-live="1"
      >
        <style>{`
          @keyframes lestowRevealIn {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }
          [data-lestow-reveal] {
            animation: lestowRevealIn 0.55s ease both;
          }
        `}</style>
        {visible.map((section, index) => {
          const Component = sectionRegistry[section.variant];
          if (!Component) return null;
          const data = sectionData(section);
          const isNewest =
            effectiveLimit > 0 && index === visible.length - 1;
          return (
            <div
              key={section.id}
              id={`sec-${section.id}`}
              data-section-id={section.id}
              data-variant={section.variant}
              data-section-type={section.type}
              data-lestow-reveal={isNewest ? "1" : undefined}
              style={
                isNewest
                  ? { animationDelay: "40ms" }
                  : undefined
              }
            >
              <Component data={data} />
            </div>
          );
        })}
      </main>
    </PreviewProvider>
  );
}

export default function RedesignLivePreviewPage() {
  return (
    <Suspense
      fallback={<EditorLoadingScreen variant="embed" message="Loading preview…" />}
    >
      <LiveBrandedPreview />
    </Suspense>
  );
}
