"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import BuiltSiteProvider, {
  useBuiltSiteSections,
  useBuiltSiteTheme,
} from "./components/BuiltSiteProvider";
import TemplateFlatSite from "./components/TemplateFlatSite";
import FontCatalog from "./components/FontCatalog";
import ViewModeSync from "./components/ViewModeSync";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";
import { finalizeRedesignSections } from "@/lib/redesign-single-page";

function TemplateSections() {
  const sections = useBuiltSiteSections();
  const theme = useBuiltSiteTheme();
  const composeUrl = (theme?.composePreviewUrl || "").trim();
  const libraryMode =
    theme?.buildMode === "template-library" || Boolean(composeUrl);

  const items = useMemo(
    () => {
      if (libraryMode && composeUrl) return undefined;
      if (!sections?.items?.length) return undefined;
      // Never re-finalize clone documents — Tailwind normalize / footer repair breaks CSS.
      if (
        sections.items.some((item) => /data-lestow-clone-doc/i.test(item.html || "")) ||
        theme?.buildMode?.includes("clone")
      ) {
        return sections.items;
      }
      return finalizeRedesignSections(sections.items, theme?.sectionPlan, {
        brandName: theme?.brandName,
        description: theme?.description,
        logoImage: theme?.logoImage,
        contentImages: theme?.contentImages,
        navItems: theme?.categories?.length ? theme.categories : theme?.navItems,
        contactPhone: theme?.contactPhone,
        contactEmail: theme?.contactEmail,
        contactAddress: theme?.contactAddress,
        referenceSiteName: theme?.referenceSiteName,
        referenceUrl: theme?.referenceUrl,
      });
    },
    [libraryMode, composeUrl, sections?.items, theme?.sectionPlan, theme?.brandName, theme?.description, theme?.logoImage, theme?.contentImages, theme?.categories, theme?.navItems, theme?.contactPhone, theme?.contactEmail, theme?.contactAddress, theme?.referenceSiteName, theme?.referenceUrl, theme?.buildMode],
  );

  if (libraryMode && composeUrl) {
    const libraryLabel = [
      theme?.templateCategory || "Library",
      theme?.templateId || "template",
    ].join(" · ");
    return (
      <div className="redesign-template-scrollbars relative min-h-screen bg-white text-slate-950">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 text-xs backdrop-blur">
          <p className="min-w-0 truncate font-medium text-slate-700">
            Building from uploaded UI library —{" "}
            <span className="font-semibold text-slate-900">{libraryLabel}</span>
          </p>
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Template design
          </span>
        </div>
        <iframe
          title="Uploaded template library preview"
          src={composeUrl}
          className="block h-[calc(100vh-44px)] w-full border-0 bg-white"
        />
      </div>
    );
  }

  if (items?.length) {
    return <TemplateFlatSite items={items} />;
  }

  return (
    <div className="redesign-template-scrollbars flex min-h-screen items-center justify-center bg-white px-6 text-center text-slate-950">
      <div className="max-w-lg space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {theme?.brandName || "Your redesign"}
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          No template sections loaded yet. Go back through Redesign onboarding
          (domain → category) so we can assemble uploaded library components with
          your site data.
        </p>
      </div>
    </div>
  );
}

/** Editable redesign canvas — never falls back to the old Atlassian demo chrome. */
export default function TemplatePage() {
  const params = useParams();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";

  useEffect(() => {
    if (designId) setActiveRedesignDesignId(designId);
  }, [designId]);

  return (
    <FontCatalog>
      <BuiltSiteProvider designId={designId}>
        <div data-export="page" data-framework="nextjs-tailwind" className="min-h-screen">
          <ViewModeSync />
          <TemplateSections />
        </div>
      </BuiltSiteProvider>
    </FontCatalog>
  );
}
