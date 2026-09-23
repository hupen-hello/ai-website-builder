"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  REDESIGN_EXPORT_EXTRA_CSS,
  REDESIGN_PREVIEW_BASE_CSS,
  REDESIGN_SECTIONS_UPDATED_EVENT,
  initRedesignPreviewInteractions,
} from "@/lib/redesign-preview-runtime";
import { REDESIGN_SEAMLESS_LAYOUT_CSS } from "@/lib/redesign-section-layout";

type TailwindGlobal = {
  config?: Record<string, unknown>;
  refresh?: () => void;
};

type RedesignPreviewRuntimeProps = {
  /** Editor template watches DOM edits; preview only boots once per content change. */
  watchDom?: boolean;
};

function applyTailwindConfig() {
  const tw = (window as Window & { tailwind?: TailwindGlobal }).tailwind;
  if (!tw) return false;
  tw.config = {
    theme: {
      extend: {
        colors: {
          primary: {
            50: "#eff6ff",
            100: "#dbeafe",
            200: "#bfdbfe",
            300: "#93c5fd",
            400: "#60a5fa",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
            800: "#1e40af",
            900: "#1e3a8a",
            950: "#0a2540",
          },
          accent: { 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706" },
        },
        fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      },
    },
  };
  tw.refresh?.();
  return true;
}

export default function RedesignPreviewRuntime({ watchDom = true }: RedesignPreviewRuntimeProps) {
  const timerRef = useRef<number | null>(null);
  const bootedRef = useRef(false);
  const [skipTailwind, setSkipTailwind] = useState(false);

  useEffect(() => {
    try {
      const keys = Object.keys(window.sessionStorage);
      const themeKey = keys.find((k) => k.includes("lestow-redesign-built-site"));
      if (!themeKey) return;
      const raw = window.sessionStorage.getItem(themeKey);
      if (!raw) return;
      const theme = JSON.parse(raw) as { buildMode?: string };
      if (theme?.buildMode?.includes("clone")) setSkipTailwind(true);
    } catch {
      /* ignore */
    }
  }, []);

  const bootInteractions = useCallback((refreshTailwind = false) => {
    initRedesignPreviewInteractions();
    if (refreshTailwind && !skipTailwind) {
      const tw = (window as Window & { tailwind?: TailwindGlobal }).tailwind;
      tw?.refresh?.();
    }
  }, [skipTailwind]);

  const onTailwindReady = useCallback(() => {
    if (skipTailwind) return;
    applyTailwindConfig();
    bootInteractions(true);
    bootedRef.current = true;
  }, [bootInteractions, skipTailwind]);

  useEffect(() => {
    const onSectionsUpdated = () => {
      window.requestAnimationFrame(() => bootInteractions(true));
    };
    window.addEventListener(REDESIGN_SECTIONS_UPDATED_EVENT, onSectionsUpdated);

    if (!skipTailwind && applyTailwindConfig()) {
      bootInteractions(true);
      bootedRef.current = true;
    } else if (skipTailwind) {
      bootInteractions(false);
      bootedRef.current = true;
    }

    let obs: MutationObserver | null = null;
    if (watchDom) {
      obs = new MutationObserver(() => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => bootInteractions(), 500);
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener(REDESIGN_SECTIONS_UPDATED_EVENT, onSectionsUpdated);
      obs?.disconnect();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [bootInteractions, watchDom, skipTailwind]);

  return (
    <>
      {!skipTailwind ? (
        <Script
          src="https://cdn.tailwindcss.com"
          strategy="afterInteractive"
          onLoad={onTailwindReady}
        />
      ) : null}
      {!skipTailwind ? (
        <style
          dangerouslySetInnerHTML={{
            __html: `${REDESIGN_PREVIEW_BASE_CSS}\n${REDESIGN_SEAMLESS_LAYOUT_CSS}\n${REDESIGN_EXPORT_EXTRA_CSS}`,
          }}
        />
      ) : null}
    </>
  );
}
