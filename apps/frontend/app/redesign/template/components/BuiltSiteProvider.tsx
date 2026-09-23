"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getBuiltSiteSections,
  getBuiltSiteTheme,
  type BuiltSiteSectionsHtml,
  type BuiltSiteTheme,
  builtSiteCssVariables,
} from "@/lib/built-site-theme";

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
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<BuiltSiteTheme | null>(null);
  const [sections, setSections] = useState<BuiltSiteSectionsHtml | null>(null);

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      setTheme(getBuiltSiteTheme());
      setSections(getBuiltSiteSections());
    };
    queueMicrotask(sync);
    const timer = window.setInterval(sync, 800);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <BuiltSiteContext.Provider value={{ theme, sections }}>
      <div style={theme ? builtSiteCssVariables(theme) : undefined}>{children}</div>
    </BuiltSiteContext.Provider>
  );
}
