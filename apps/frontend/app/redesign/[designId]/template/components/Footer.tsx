"use client";

import { useBuiltSiteSections, useBuiltSiteTheme } from "./BuiltSiteProvider";
import AiSectionHtml from "./AiSectionHtml";

export default function Footer() {
  const theme = useBuiltSiteTheme();
  const sections = useBuiltSiteSections();

  return (
    <AiSectionHtml
      html={sections?.footer}
      fallback={
        <footer
          className="px-6 py-10 text-slate-300 lg:px-10"
          style={{
            backgroundColor: theme?.primaryColor || "#101214",
            fontFamily: theme?.fontFamily,
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <span className="font-black tracking-wider text-white">
              {(theme?.brandName || "Brand").toUpperCase()}
            </span>
            <p className="text-sm text-white/75">
              {theme?.tagline || "Build what comes next, together."}
            </p>
          </div>
        </footer>
      }
    />
  );
}
