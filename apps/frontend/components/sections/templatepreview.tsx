"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, CheckCircle2, Eye, Search, X } from "lucide-react";
import EditorPreviewModal from "@/app/editor/components/EditorPreviewModal";
import EditorLoadingScreen from "@/app/editor/components/EditorLoadingScreen";
import {
  buildTemplateCardPreviewUrl,
  buildTemplateComposePreviewUrl,
  getTemplatePages,
  getTemplatesForCategory,
  hasCategoryContent,
  type BuilderTemplate,
} from "@/app/editor/layout/src/data/templateFlow";

function getTemplatePageCount(template: BuilderTemplate) {
  if (template.type !== "Multiple Pages Website") return 1;
  const variants = template.sectionVariants || {};
  const innerPages = getTemplatePages(template).filter(
    (page) => variants[page.sectionType],
  );
  return 1 + innerPages.length;
}

type TemplatePreviewProps = {
  selectedCategory: string;
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string | null) => void;
  showMonitor: boolean;
  onShowMonitorChange: (open: boolean) => void;
  businessName?: string;
  /** single-page | multi-page — filters themes by template type */
  pageType?: "" | "multi-page" | "single-page";
  /** Opens editor with the viewed theme (from View preview CTA). */
  onOpenEditorWithTheme?: (templateId: string) => void;
  openingEditor?: boolean;
};

function matchesPageType(
  template: BuilderTemplate,
  pageType?: "" | "multi-page" | "single-page",
) {
  if (!pageType) return true;
  if (pageType === "single-page") {
    return template.type === "Single Page Website";
  }
  if (pageType === "multi-page") {
    return template.type === "Multiple Pages Website";
  }
  return true;
}

function TemplateCardIframePreview({
  previewUrl,
  fallbackImage,
  title,
}: {
  previewUrl: string | null;
  fallbackImage: string;
  title: string;
}) {
  const [previewReady, setPreviewReady] = useState(!previewUrl);

  useEffect(() => {
    if (!previewUrl) {
      setPreviewReady(true);
      return;
    }

    setPreviewReady(false);

    const expectedSrc = (() => {
      try {
        const url = new URL(previewUrl, window.location.origin);
        return `${url.pathname}${url.search}`;
      } catch {
        return previewUrl;
      }
    })();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ai-builder-compose-preview-ready") return;
      if (event.data?.src !== expectedSrc) return;
      setPreviewReady(true);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [previewUrl]);

  return (
    <div className="relative overflow-hidden rounded-[14px] bg-slate-100 ring-1 ring-black/5">
      <div className="flex h-7 items-center gap-1.5 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50 px-3">
        <span className="size-1.5 rounded-full bg-[#ff5f57]" />
        <span className="size-1.5 rounded-full bg-[#febc2e]" />
        <span className="size-1.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 h-3.5 flex-1 rounded-full bg-slate-100/90" />
      </div>
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {previewUrl ? (
          <>
            {!previewReady ? <EditorLoadingScreen variant="card" /> : null}
            <iframe
              key={previewUrl}
              src={previewUrl}
              title={`${title} live preview`}
              loading="lazy"
              tabIndex={-1}
              onLoad={() => setPreviewReady(true)}
              className={`pointer-events-none absolute left-0 top-0 border-0 bg-white transition-opacity duration-300 ${
                previewReady ? "opacity-100" : "opacity-0"
              }`}
              style={{
                width: "400%",
                height: "400%",
                transform: "scale(0.25)",
                transformOrigin: "top left",
              }}
            />
          </>
        ) : (
          <Image
            src={fallbackImage}
            alt={title}
            width={480}
            height={260}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}

export default function Templatepreview({
  selectedCategory,
  selectedTemplateId,
  onTemplateSelect,
  onShowMonitorChange,
  pageType,
  onOpenEditorWithTheme,
  openingEditor = false,
}: TemplatePreviewProps) {
  const [search, setSearch] = useState("");
  const [viewTemplateId, setViewTemplateId] = useState<string | null>(null);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);

  const availableTemplates = useMemo(() => {
    if (!selectedCategory) return [];
    return getTemplatesForCategory(selectedCategory).filter((template) =>
      matchesPageType(template, pageType),
    );
  }, [pageType, selectedCategory]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const stillValid = availableTemplates.some(
      (template) => template.id === selectedTemplateId,
    );
    if (!stillValid) {
      onTemplateSelect(null);
      onShowMonitorChange(false);
    }
  }, [
    availableTemplates,
    onShowMonitorChange,
    onTemplateSelect,
    selectedTemplateId,
  ]);

  const viewTemplate = useMemo(
    () =>
      viewTemplateId
        ? (availableTemplates.find((item) => item.id === viewTemplateId) ??
          null)
        : null,
    [availableTemplates, viewTemplateId],
  );

  const viewPreviewUrl = useMemo(() => {
    if (!viewTemplate) return null;
    return buildTemplateComposePreviewUrl(viewTemplate, selectedCategory);
  }, [viewTemplate, selectedCategory, previewReloadKey]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = viewTemplateId ? "hidden" : "";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewTemplateId]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return availableTemplates.filter((item) => {
      const matchesSearch =
        !query ||
        `${selectedCategory} ${item.title}`.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        selectedCategory.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [availableTemplates, search, selectedCategory]);

  const pageTypeLabel =
    pageType === "multi-page"
      ? "multi-page"
      : pageType === "single-page"
        ? "single-page"
        : "";

  const clearSearch = () => {
    setSearch("");
  };

  const openViewPreview = (template: BuilderTemplate) => {
    setViewTemplateId(template.id);
  };

  const closeViewPreview = () => {
    setViewTemplateId(null);
  };

  const handleUseTemplate = (template: BuilderTemplate) => {
    if (onOpenEditorWithTheme) {
      onOpenEditorWithTheme(template.id);
      return;
    }
    onTemplateSelect(template.id);
    onShowMonitorChange(true);
  };

  return (
    <div className="w-full">
      <section className="onboarding-responsive-scroll relative mx-auto max-h-[calc(100dvh-156px)] w-full overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(23,38,76,.08)] lg:max-h-none lg:overflow-visible">
        <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-6 2xl:px-9">
          <div className="flex shrink-0 items-start gap-3 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-xl font-semibold tracking-[-.035em] text-[#08132f] sm:text-2xl">
                Pick a {pageTypeLabel ? `${pageTypeLabel} ` : ""}look for your{" "}
                {selectedCategory || "website"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {pageType === "multi-page"
                  ? "Showing multi-page themes only — matching your site type choice."
                  : pageType === "single-page"
                    ? "Showing single-page themes only — matching your site type choice."
                    : "Preview a direction, then make every section and detail your own."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex shrink-0">
            <div className="relative flex flex-1 items-center">
              <span className="pointer-events-none absolute left-3.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg bg-slate-50 text-slate-500 sm:left-4">
                <Search size={16} strokeWidth={2.2} />
              </span>

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                type="text"
                placeholder="Search theme by name and category"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-[3.25rem] pr-12 text-sm text-[#08132f] outline-none transition placeholder:text-slate-400 focus:border-[#315ff4] focus:ring-4 focus:ring-blue-100/70"
              />

              {search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#315ff4] sm:right-3.5"
                  aria-label="Clear search"
                >
                  <X size={16} strokeWidth={2.2} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex-1 px-0.5 pt-1">
            <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {filteredTemplates.map((item) => {
                const isActive = selectedTemplateId === item.id;
                const cardPreviewUrl = buildTemplateCardPreviewUrl(
                  item,
                  selectedCategory,
                  3,
                );
                const sectionCount = Object.keys(
                  item.sectionVariants || {},
                ).length;
                const pageCount = getTemplatePageCount(item);

                return (
                  <article
                    key={item.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
                      isActive
                        ? "border-[#315ff4] shadow-[0_14px_36px_rgba(49,95,244,0.18)] ring-2 ring-[#315ff4]/25"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    <div className="relative p-2.5 pb-0">
                      <TemplateCardIframePreview
                        previewUrl={cardPreviewUrl}
                        fallbackImage={
                          item.previewimage || item.image || "/haelli.png"
                        }
                        title={item.title}
                      />

                      <div className="pointer-events-none absolute inset-2.5 z-10 overflow-hidden rounded-[14px]">
                        <div className="absolute inset-0 bg-[#08132f]/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="absolute inset-0 flex items-center justify-center p-3">
                          <div className="pointer-events-auto flex translate-y-2 scale-[0.98] items-center gap-1.5 rounded-2xl border border-white/55 bg-white/22 p-1.5 opacity-0 shadow-[0_14px_32px_rgba(8,19,47,0.28)] backdrop-blur-md transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openViewPreview(item);
                              }}
                              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[12px] font-semibold text-[#08132f] shadow-sm transition hover:bg-slate-50 active:scale-[0.97]"
                              aria-label={`View ${item.title}`}
                            >
                              <span className="grid size-6 place-items-center rounded-lg bg-slate-100 text-[#08132f]">
                                <Eye size={14} strokeWidth={2.2} />
                              </span>
                              View
                            </button>
                            <button
                              type="button"
                              disabled={openingEditor}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleUseTemplate(item);
                              }}
                              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#315ff4] px-4 text-[12px] font-semibold text-white shadow-[0_6px_16px_rgba(49,95,244,0.4)] transition hover:bg-[#244fe0] active:scale-[0.97] disabled:cursor-wait disabled:opacity-70"
                              aria-label={`Use ${item.title}`}
                            >
                              <span className="grid size-6 place-items-center rounded-lg bg-white/20 text-white">
                                <CheckCircle2 size={14} strokeWidth={2.2} />
                              </span>
                              Use theme
                            </button>
                          </div>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="absolute left-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-[#315ff4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                          <Check size={11} strokeWidth={3} />
                          Selected
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-3 px-4 pb-4 pt-3.5">
                      <div>
                        <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#08132f]">
                          {item.title}
                        </h3>
                        <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
                          {item.type}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
                          {sectionCount} sections
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
                          {pageCount} {pageCount === 1 ? "page" : "pages"}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <span className="inline-flex items-center rounded-md bg-[#08132f] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          {selectedCategory}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200/80">
                  <Search size={24} strokeWidth={1.8} />
                </span>
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#08132f]">
                  {search.trim()
                    ? "No themes match your search"
                    : selectedCategory && !hasCategoryContent(selectedCategory)
                      ? "No themes in this category"
                      : pageType
                        ? `No ${pageTypeLabel} themes found`
                        : "No themes found"}
                </p>
                <p className="mt-1.5 max-w-md text-sm text-slate-500">
                  {search.trim()
                    ? `Nothing matched “${search.trim()}”. Try another name or clear the search.`
                    : selectedCategory && !hasCategoryContent(selectedCategory)
                      ? "No JSON data found for this category."
                      : pageType
                        ? `No ${pageTypeLabel} themes for ${selectedCategory}. Go back and try the other site type, or pick another category.`
                        : "Try a different search or category."}
                </p>
                {search.trim() ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#08132f] px-4 text-sm font-semibold text-white transition hover:bg-[#315ff4]"
                  >
                    <X size={15} />
                    Clear search
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      <EditorPreviewModal
        open={Boolean(viewTemplateId)}
        src={viewPreviewUrl || ""}
        loading={false}
        error={
          viewTemplateId && !viewPreviewUrl ? "Preview unavailable" : ""
        }
        onClose={closeViewPreview}
        onRetry={() => setPreviewReloadKey((key) => key + 1)}
        onUseTheme={
          viewTemplate && onOpenEditorWithTheme
            ? () => onOpenEditorWithTheme(viewTemplate.id)
            : undefined
        }
        useThemeLoading={openingEditor}
      />
    </div>
  );
}
