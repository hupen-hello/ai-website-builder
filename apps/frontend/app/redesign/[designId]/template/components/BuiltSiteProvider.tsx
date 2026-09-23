"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getBuiltSiteSections,
  getBuiltSiteTheme,
  hydrateBuiltSiteSections,
  mirrorBuiltSiteCache,
  type BuiltSiteSectionsHtml,
  type BuiltSiteTheme,
  builtSiteCssVariables,
} from "@/lib/built-site-theme";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";
import { REDESIGN_SECTIONS_UPDATED_EVENT } from "@/lib/redesign-preview-runtime";

function sectionsFingerprint(sections: BuiltSiteSectionsHtml | null) {
  if (!sections?.items?.length) return "";
  return sections.items.map((item) => `${item.id}:${item.html.length}:${item.label}`).join("|");
}

function themeFingerprint(theme: BuiltSiteTheme | null) {
  if (!theme) return "";
  return `${theme.brandName}|${theme.sectionPlan?.length || 0}`;
}

type BuiltSiteContextValue = {
  theme: BuiltSiteTheme | null;
  sections: BuiltSiteSectionsHtml | null;
};

const BuiltSiteContext = createContext<BuiltSiteContextValue>({
  theme: null,
  sections: null,
});

export function useBuiltSiteTheme() {
  return useContext(BuiltSiteContext).theme;
}

export function useBuiltSiteSections() {
  return useContext(BuiltSiteContext).sections;
}

export default function BuiltSiteProvider({
  children,
  designId,
}: {
  children: React.ReactNode;
  designId?: string;
}) {
  const [theme, setTheme] = useState<BuiltSiteTheme | null>(null);
  const [sections, setSections] = useState<BuiltSiteSectionsHtml | null>(null);

  useEffect(() => {
    let active = true;
    let lastSectionsKey = "";
    let lastThemeKey = "";
    if (designId) setActiveRedesignDesignId(designId);
    const sync = async () => {
      if (!active) return;
      mirrorBuiltSiteCache(designId);
      const nextTheme = getBuiltSiteTheme(designId);
      let nextSections = getBuiltSiteSections(designId);
      if (!nextSections?.items?.length) {
        nextSections = await hydrateBuiltSiteSections(designId);
      }
      if (!active) return;
      const nextThemeKey = themeFingerprint(nextTheme);
      const nextSectionsKey = sectionsFingerprint(nextSections);

      if (nextThemeKey !== lastThemeKey) {
        lastThemeKey = nextThemeKey;
        setTheme(nextTheme);
      }
      if (nextSectionsKey !== lastSectionsKey) {
        lastSectionsKey = nextSectionsKey;
        setSections(nextSections);
        window.dispatchEvent(new CustomEvent(REDESIGN_SECTIONS_UPDATED_EVENT));
      }
    };
    queueMicrotask(() => {
      void sync();
    });
    const timer = window.setInterval(() => {
      void sync();
    }, 2000);

    // Dev: dump current design once so local agents can inspect quality issues.
    let dumped = false;
    const dumpTimer = window.setTimeout(() => {
      if (dumped || process.env.NODE_ENV === "production") return;
      void (async () => {
        const snapTheme = getBuiltSiteTheme(designId);
        const snapSections =
          getBuiltSiteSections(designId) || (await hydrateBuiltSiteSections(designId));
        if (!snapSections?.items?.length) return;
        dumped = true;
        void fetch("/api/debug/redesign-snapshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            designId: designId || null,
            theme: snapTheme,
            sections: snapSections,
          }),
        }).catch(() => {});
      })();
    }, 1200);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearTimeout(dumpTimer);
    };
  }, [designId]);

  return (
    <BuiltSiteContext.Provider value={{ theme, sections }}>
      <div style={theme ? builtSiteCssVariables(theme) : undefined}>{children}</div>
    </BuiltSiteContext.Provider>
  );
}
