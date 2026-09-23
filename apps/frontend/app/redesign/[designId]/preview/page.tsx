"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import BuiltSiteProvider, {
  useBuiltSiteSections,
  useBuiltSiteTheme,
} from "../template/components/BuiltSiteProvider";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";
import { finalizeRedesignSections } from "@/lib/redesign-single-page";

function PreviewSite() {
  const sections = useBuiltSiteSections();
  const theme = useBuiltSiteTheme();
  const items = useMemo(
    () => {
      if (!sections?.items?.length) return undefined;
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
    [sections?.items, theme?.sectionPlan, theme?.brandName, theme?.description, theme?.logoImage, theme?.contentImages, theme?.categories, theme?.navItems, theme?.contactPhone, theme?.contactEmail, theme?.contactAddress, theme?.referenceSiteName, theme?.referenceUrl, theme?.buildMode],
  );

  const pageHtml = useMemo(
    () => (items?.length ? items.map((item) => item.html).join("\n") : ""),
    [items],
  );
  const isClone = useMemo(
    () =>
      Boolean(theme?.buildMode?.includes("clone")) ||
      /data-lestow-clone-doc/i.test(pageHtml),
    [theme?.buildMode, pageHtml],
  );

  if (!items?.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-slate-950">
        <div className="max-w-lg space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {theme?.brandName || "Your redesign"}
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            No sections loaded. Open the editor and complete the build first.
          </p>
        </div>
      </div>
    );
  }

  return isClone ? (
    <iframe
      title="Lestow clone preview"
      srcDoc={pageHtml}
      className="block min-h-screen w-full border-0 bg-white"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
    />
  ) : (
    <div
      className="min-h-screen bg-white text-slate-950"
      dangerouslySetInnerHTML={{ __html: pageHtml }}
    />
  );
}

/** Clean browser preview — same output as HTML export, no editor chrome. */
export default function RedesignPreviewPage() {
  const params = useParams();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";

  useEffect(() => {
    if (designId) setActiveRedesignDesignId(designId);
  }, [designId]);

  return (
    <BuiltSiteProvider designId={designId}>
      <PreviewSite />
    </BuiltSiteProvider>
  );
}
