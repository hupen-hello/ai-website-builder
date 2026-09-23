"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  Crown,
  Download,
  Edit3,
  Eye,
  FileStack,
  Globe2,
  Info,
  Layers3,
  Loader2,
  MoreVertical,
  PencilLine,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import ExportWebsiteModal from "@/components/ExportWebsiteModal";
import { isCorePlanActive } from "@/lib/userPlan";
import { getBuilderTemplate } from "@/app/editor/layout/src/data/templateFlow";
import TemplateActions from "../template-actions";
import {
  formatRelativeUpdatedAt,
  formatSiteDateTime,
  getSitePreviewGradient,
  type UserSite,
} from "../types";

const COLOR_PRESET_HINTS: Array<{ name: string; primary: string }> = [
  { name: "Ocean", primary: "#00cadd" },
  { name: "Crimson", primary: "#dc2626" },
  { name: "Forest", primary: "#059669" },
  { name: "Indigo", primary: "#4f46e5" },
  { name: "Sunset", primary: "#ea580c" },
  { name: "Slate", primary: "#475569" },
  { name: "Rose", primary: "#e11d48" },
  { name: "Gold", primary: "#ca8a04" },
  { name: "Midnight", primary: "#2563eb" },
  { name: "Violet", primary: "#7c3aed" },
];

function normalizeHexColor(value?: string | null) {
  const raw = value?.trim().toLowerCase() || "";
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return "";
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  return raw;
}

function resolveColorPresetName(variables?: Record<string, string> | null) {
  const primary = normalizeHexColor(variables?.["--primary-bg"]);
  if (!primary) return null;
  return (
    COLOR_PRESET_HINTS.find((preset) => preset.primary === primary)?.name || null
  );
}

function resolveThemeLabel(templateId?: string | null) {
  const template = getBuilderTemplate(templateId);
  const title = template?.title?.trim();
  if (title) return title;
  if (templateId?.trim()) return templateId.trim();
  return "Default theme";
}

type WebsitesTabProps = {
  sites: UserSite[];
  loading: boolean;
  searchQuery: string;
  statusFilter: "all" | "published" | "draft";
  openingSiteId: string | null;
  deletingSiteId: string | null;
  renamingSiteId: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "published" | "draft") => void;
  onEdit: (site: UserSite) => void;
  onDelete: (site: UserSite) => void;
  onRename: (site: UserSite, title: string) => Promise<void>;
};

function WebsiteOverviewModal({
  site,
  hasCore,
  onClose,
}: {
  site: UserSite;
  hasCore: boolean;
  onClose: () => void;
}) {
  const [loadingPages, setLoadingPages] = useState(false);
  const [pageNames, setPageNames] = useState<string[]>([]);
  const [detail, setDetail] = useState<{
    pageCount?: number;
    isMultiPage?: boolean;
    createdAt?: string;
    templateId?: string | null;
    colorPreset?: string | null;
    primaryColor?: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPages(true);

    void (async () => {
      try {
        const res = await fetch(`/api/user/sites/${site.id}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          createdAt?: string;
          pageCount?: number;
          isMultiPage?: boolean;
          templateId?: string | null;
          config?: {
            templateId?: string | null;
            templateVariables?: Record<string, string> | null;
            pageLinks?: Array<{
              label?: string;
              kind?: string;
              hidden?: boolean;
              children?: Array<{ label?: string; kind?: string; hidden?: boolean }>;
            }>;
          };
        };
        if (cancelled) return;

        const variables = data.config?.templateVariables || null;
        setDetail({
          createdAt: data.createdAt,
          pageCount: data.pageCount,
          isMultiPage: data.isMultiPage,
          templateId: data.config?.templateId || data.templateId || site.templateId,
          colorPreset: resolveColorPresetName(variables),
          primaryColor: normalizeHexColor(variables?.["--primary-bg"]) || null,
        });

        const links = Array.isArray(data.config?.pageLinks)
          ? data.config.pageLinks
          : [];
        const names: string[] = [];
        const pushName = (label?: string, kind?: string, hidden?: boolean) => {
          if (hidden) return;
          if (kind === "blog") return;
          const trimmed = label?.trim();
          if (!trimmed) return;
          if (!names.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
            names.push(trimmed);
          }
        };
        for (const link of links) {
          pushName(link.label, link.kind, link.hidden);
          for (const child of link.children || []) {
            pushName(child.label, child.kind, child.hidden);
          }
        }
        if (!names.some((item) => item.toLowerCase() === "home")) {
          names.unshift("Home");
        }
        setPageNames(names);
      } catch {
        // Keep list summary if detail fetch fails.
      } finally {
        if (!cancelled) setLoadingPages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [site.id, site.templateId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const createdAt = detail?.createdAt || site.createdAt;
  const pageCount = Math.max(
    1,
    detail?.pageCount ?? site.pageCount ?? (pageNames.length || 1),
  );
  const isMultiPage = detail?.isMultiPage ?? site.isMultiPage ?? false;
  const structureLabel = isMultiPage ? "Multi-page" : "Single page";
  const themeTemplate = getBuilderTemplate(
    detail?.templateId || site.templateId,
  );
  const themeLabel = resolveThemeLabel(detail?.templateId || site.templateId);
  const colorLabel =
    detail?.colorPreset ||
    (detail?.primaryColor ? `Custom (${detail.primaryColor})` : "Default colors");

  const rows = [
    {
      label: "Started",
      value: formatSiteDateTime(createdAt),
      hint: createdAt ? "When this website was created" : "Start date unavailable",
    },
    {
      label: "Last activity",
      value: formatSiteDateTime(site.updatedAt),
      hint: formatRelativeUpdatedAt(site.updatedAt),
    },
    {
      label: "Category",
      value: site.category?.trim() || "Website",
    },
    {
      label: "Theme",
      value: themeLabel,
      hint: themeTemplate?.type || undefined,
    },
    {
      label: "Color theme",
      value: colorLabel,
    },
    {
      label: "Structure",
      value: structureLabel,
    },
    {
      label: "Pages",
      value: `${pageCount} page${pageCount === 1 ? "" : "s"}`,
    },
    {
      label: "Status",
      value: site.published ? "Published" : "Draft",
      hint: site.publishedAt
        ? `Published ${formatSiteDateTime(site.publishedAt)}`
        : undefined,
    },
    {
      label: "Plan",
      value: hasCore ? "Core" : "Starter",
    },
    {
      label: "URL",
      value:
        site.published && site.slug
          ? `/published/${site.slug}`
          : "Not published yet",
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close website overview"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`site-overview-${site.id}`}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,.3)]"
      >
        <div className="border-b border-zinc-100 px-5 py-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <Info size={20} />
          </span>
          <h2
            id={`site-overview-${site.id}`}
            className="mt-3 truncate px-6 text-lg font-bold text-zinc-950"
          >
            {site.title || "Untitled website"}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            Full website overview
          </p>
        </div>

        <div className="max-h-[min(60vh,420px)] space-y-2 overflow-y-auto px-5 py-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                  {row.label}
                </p>
                <p className="mt-0.5 break-all text-sm font-semibold text-zinc-900">
                  {row.value}
                </p>
                {row.hint ? (
                  <p className="mt-0.5 text-[11px] text-zinc-500">{row.hint}</p>
                ) : null}
              </div>
              {row.label === "Structure" ? (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-100">
                  {isMultiPage ? <FileStack size={15} /> : <Layers3 size={15} />}
                </span>
              ) : row.label === "Color theme" && detail?.primaryColor ? (
                <span
                  className="mt-1 size-8 shrink-0 rounded-lg ring-1 ring-zinc-200"
                  style={{ background: detail.primaryColor }}
                  title={detail.primaryColor}
                />
              ) : row.label === "Last activity" || row.label === "Started" ? (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-white text-zinc-500 ring-1 ring-zinc-200">
                  <CalendarClock size={15} />
                </span>
              ) : null}
            </div>
          ))}

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Page list
            </p>
            {loadingPages ? (
              <p className="mt-1.5 inline-flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 size={12} className="animate-spin" />
                Loading pages...
              </p>
            ) : pageNames.length > 0 ? (
              <p className="mt-1.5 text-sm font-medium leading-6 text-zinc-800">
                {pageNames.join(" · ")}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-500">Home</p>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WebsiteCardMenu({
  site,
  hasCore,
  disabled,
  onRename,
  onExportWebsite,
}: {
  site: UserSite;
  hasCore: boolean;
  disabled?: boolean;
  onRename: () => void;
  onExportWebsite: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const siteName = site.title?.trim() || "Untitled website";

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 168;
      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.max(8, rect.right - menuWidth),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 10060,
            }}
            className="min-w-[168px] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
          >
            {!hasCore && site.published ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    `/user/plan?siteId=${encodeURIComponent(site.id)}`,
                  );
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <Sparkles size={14} />
                Plan Upgrade
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onRename();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <PencilLine size={14} />
              Website Rename
            </button>
            {site.published && site.slug ? (
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onExportWebsite();
                  window.setTimeout(() => setOpen(false), 0);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <Download size={14} />
                Export Website
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={rootRef} className="relative z-30 shrink-0">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-label={`More options for ${siteName}`}
          aria-expanded={open}
          aria-haspopup="menu"
          title="More options"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          className="relative z-30 grid size-8 cursor-pointer place-items-center rounded-lg border border-transparent bg-white text-zinc-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MoreVertical size={16} />
        </button>
      </div>
      {menu}
    </>
  );
}

export default function WebsitesTab({
  sites,
  loading,
  searchQuery,
  statusFilter,
  openingSiteId,
  deletingSiteId,
  renamingSiteId,
  onSearchChange,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onRename,
}: WebsitesTabProps) {
  const [siteToRename, setSiteToRename] = useState<UserSite | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState("");
  const [exportSite, setExportSite] = useState<UserSite | null>(null);
  const [overviewSite, setOverviewSite] = useState<UserSite | null>(null);
  const [previewSignals, setPreviewSignals] = useState<Record<string, number>>(
    {},
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredSites = sites.filter((site) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? site.published : !site.published);
    const matchesSearch =
      !normalizedSearch ||
      [site.title, site.category, site.slug].some((value) =>
        value?.toLowerCase().includes(normalizedSearch),
      );

    return matchesStatus && matchesSearch;
  });

  const openRename = (site: UserSite) => {
    setRenameError("");
    setRenameSuccess("");
    setRenameValue(site.title?.trim() || "");
    setSiteToRename(site);
  };

  const closeRename = () => {
    if (savingRename || renamingSiteId) return;
    setSiteToRename(null);
    setRenameError("");
  };

  const submitRename = async () => {
    if (!siteToRename || savingRename) return;

    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Enter a website name.");
      return;
    }

    setRenameError("");
    setSavingRename(true);
    try {
      await onRename(siteToRename, trimmed);
      setSiteToRename(null);
      setRenameSuccess(`Website renamed to "${trimmed}" successfully.`);
    } catch (error) {
      setRenameError(
        error instanceof Error ? error.message : "Unable to rename website.",
      );
    } finally {
      setSavingRename(false);
    }
  };

  useEffect(() => {
    if (!renameSuccess) return;
    const timeout = window.setTimeout(() => setRenameSuccess(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [renameSuccess]);

  const openExportModal = (site: UserSite) => {
    setExportSite(site);
  };

  const stats = useMemo(() => {
    const published = sites.filter((site) => site.published).length;
    return {
      total: sites.length,
      published,
      draft: sites.length - published,
      core: sites.filter((site) => isCorePlanActive(site.id)).length,
    };
  }, [sites]);

  const isFiltering =
    Boolean(normalizedSearch) || statusFilter !== "all";

  return (
    <section className="relative min-h-full overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
      <div className="pointer-events-none absolute -left-16 top-8 size-64 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 size-72 rounded-full bg-indigo-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1320px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-blue-700 shadow-sm">
              <Layers3 size={12} /> Your websites
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              My Websites
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-5 text-zinc-500 sm:text-sm">
              Manage drafts and published sites — edit, preview, rename, or
              upgrade to Core.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Total
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-950">
              {loading ? "—" : stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Published
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-700">
              {loading ? "—" : stats.published}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Drafts
            </p>
            <p className="mt-1 text-lg font-bold text-amber-700">
              {loading ? "—" : stats.draft}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Core plan
            </p>
            <p className="mt-1 text-lg font-bold text-blue-700">
              {loading ? "—" : stats.core}
            </p>
          </div>
      </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(24,39,75,.07)]">
          <div className="border-b border-zinc-100 bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/40 px-3 py-2.5 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">
              Search & filter
            </p>
          </div>
          <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:p-4">
            <label className="relative flex h-11 min-w-0 flex-1 items-center">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 text-zinc-400"
              />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by name, category, or slug..."
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </label>
            <div className="relative sm:w-44">
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(
              event.target.value as "all" | "published" | "draft",
            )
          }
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 pr-9 text-sm font-medium text-zinc-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          aria-label="Filter websites by status"
        >
          <option value="all">All sites</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>
        </div>

        {renameSuccess ? (
          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 sm:text-sm">
            {renameSuccess}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 sm:text-base">
              All websites
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {loading
                ? "Loading your websites..."
                : isFiltering
                  ? `${filteredSites.length} match your filters`
                  : `${sites.length} website${sites.length === 1 ? "" : "s"} in your workspace`}
            </p>
          </div>
          {!loading && filteredSites.length > 0 ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100">
              {filteredSites.length} shown
            </span>
          ) : null}
      </div>

      {loading ? (
          <div className="mt-4 flex flex-col items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white py-14 shadow-sm">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <p className="text-sm text-zinc-500">Loading websites...</p>
        </div>
      ) : filteredSites.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
            <Globe2 size={28} className="mx-auto text-zinc-300" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-zinc-700">
              {sites.length === 0
                ? "No websites yet"
                : "No matching websites"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
          {sites.length === 0
                ? "Create your first website from the dashboard to get started."
                : "Try a different search term or filter."}
            </p>
        </div>
      ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site, index) => {
            const previewHref = site.published
              ? `/published/${site.slug}`
              : null;
            const hasCore = isCorePlanActive(site.id);

            return (
              <article
                key={site.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-44 overflow-hidden bg-zinc-100 sm:h-48">
                  <div
                    className="absolute inset-0 transition duration-500 group-hover:scale-[1.02]"
                    style={{ background: getSitePreviewGradient(index) }}
                  />
                  <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        site.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {site.published ? "Published" : "Draft"}
                    </span>
                    {site.flowLabel || site.flow ? (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        {site.flowLabel || site.flow}
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        hasCore
                          ? "bg-blue-600 text-white"
                          : "bg-white/90 text-zinc-600"
                      }`}
                    >
                      {hasCore ? <Crown size={10} /> : null}
                      {hasCore ? "Core" : "Starter"}
                    </span>
                  </div>
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2 bg-zinc-950/45 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(site)}
                      disabled={openingSiteId === site.id || deletingSiteId === site.id}
                      className="flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-zinc-900 shadow-lg transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-70"
                    >
                      <Edit3 size={14} />
                      {openingSiteId === site.id ? "Opening..." : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewSignals((current) => ({
                          ...current,
                          [site.id]: (current[site.id] || 0) + 1,
                        }))
                      }
                      disabled={!previewHref}
                      className="flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-zinc-950 px-3.5 text-xs font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(site)}
                      disabled={Boolean(deletingSiteId) || openingSiteId === site.id}
                      className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 text-xs font-semibold text-red-600 shadow-lg transition hover:bg-red-50 disabled:opacity-70"
                    >
                      <Trash2 size={14} />
                      {deletingSiteId === site.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
                <div className="relative z-30 flex min-h-[68px] items-center gap-3 bg-white p-3.5 sm:p-4">
                  <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Globe2 size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-zinc-900 group-hover:text-blue-700">
                      {site.title || "Untitled website"}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {site.published && site.slug
                        ? `/published/${site.slug}`
                        : site.category || "Website"}
                    </p>
                  </div>
                  <div className="relative z-30 flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`Overview for ${site.title || "Untitled website"}`}
                      title="Website overview"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOverviewSite(site);
                      }}
                      className="relative z-30 grid size-8 cursor-pointer place-items-center rounded-lg border border-transparent bg-white text-zinc-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Info size={16} />
                    </button>
                    <WebsiteCardMenu
                      site={site}
                      hasCore={hasCore}
                      disabled={Boolean(savingRename || renamingSiteId)}
                      onRename={() => openRename(site)}
                      onExportWebsite={() => openExportModal(site)}
                    />
                  <TemplateActions
                    name={site.title || "Untitled website"}
                    previewHref={previewHref}
                    onEdit={() => onEdit(site)}
                    onDelete={() => onDelete(site)}
                    editing={openingSiteId === site.id}
                    deleting={deletingSiteId === site.id}
                      showOverlay={false}
                      openPreviewSignal={previewSignals[site.id] || 0}
                  />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Hover a card for quick actions
            </p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              Edit, preview, or delete from the overlay. Use the info icon for a
              full overview, and the menu for rename, Export Website, and Core
              plan upgrade.
            </p>
          </div>
        </div>
      </div>

      <ExportWebsiteModal
        open={Boolean(exportSite)}
        site={exportSite}
        onClose={() => setExportSite(null)}
      />

      {overviewSite && typeof document !== "undefined" ? (
        <WebsiteOverviewModal
          site={overviewSite}
          hasCore={isCorePlanActive(overviewSite.id)}
          onClose={() => setOverviewSite(null)}
        />
      ) : null}

      {siteToRename && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Close rename dialog"
                className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
                onClick={closeRename}
              />
              <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,.3)]">
                <div className="border-b border-zinc-100 px-5 py-4 text-center">
                  <button
                    type="button"
                    onClick={closeRename}
                    disabled={Boolean(savingRename || renamingSiteId)}
                    className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-60"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                  <span className="mx-auto grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                    <PencilLine size={20} />
                  </span>
                  <h2 className="mt-3 text-lg font-bold text-zinc-950">
                    Rename website
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                    Update the display name for this website.
                  </p>
                </div>

                <div className="px-5 py-4">
                  <label className="block text-left">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                      Website name
                    </span>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      maxLength={80}
                      autoFocus
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      placeholder="Enter website name"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void submitRename();
                        }
                      }}
                    />
                  </label>

                  {renameError ? (
                    <p className="mt-2.5 text-xs text-red-600 sm:text-sm">
                      {renameError}
                    </p>
                  ) : null}
                </div>

                <div className="flex gap-2.5 border-t border-zinc-100 px-5 py-4">
                  <button
                    type="button"
                    disabled={Boolean(savingRename || renamingSiteId)}
                    onClick={closeRename}
                    className="h-10 flex-1 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingRename || Boolean(renamingSiteId) || !renameValue.trim()}
                    onClick={() => void submitRename()}
                    className="h-10 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {savingRename || renamingSiteId ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save name"
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
