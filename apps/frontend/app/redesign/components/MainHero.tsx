"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  ExternalLink,
  FilePlus,
  History,
  Laptop,
  Maximize,
  Menu,
  Monitor,
  Moon,
  Pencil,
  Redo2,
  Sun,
  Smartphone,
  Undo2,
  X,
} from "lucide-react";

type MainHeroProps = {
  width: number;
  breakpoint: "Mobile" | "Tablet" | "Desktop";
  isDark: boolean;
  isCodePanelOpen: boolean;
  isElementPanelOpen: boolean;
  showCodeToggle: boolean;
  showElementToggle: boolean;
  onBreakpointChange: (breakpoint: "Mobile" | "Tablet" | "Desktop") => void;
  onThemeChange: (isDark: boolean) => void;
  onToggleCodePanel: () => void;
  onToggleElementPanel: () => void;
  onOpenCodePanel: () => void;
  isViewMode: boolean;
  onViewModeChange: (enabled: boolean) => void;
  onAddPage: () => void;
};

type PreviewMessage = {
  type: "redesign-code-panel-open" | "redesign-section-selected" | "redesign-element-selected";
  sectionId?: string;
  label?: string;
  html?: string;
  historyGroupId?: string;
};

type StoredSection = { sectionId: string; label: string; html: string };
type HistoryEntry = { before: StoredSection; after: StoredSection; groupId: string };
type RestorePoint = { id: string; timestamp: number; sections: Record<string, StoredSection> };

const RESTORE_STORAGE_KEY = "lestow-redesign-restore-points";
const RESTORE_INTERVAL_MS = 10 * 60 * 1000;
const MAX_HISTORY_ENTRIES = 100;
const MAX_RESTORE_POINTS = 24;
const EDITOR_MENU_EVENT = "redesign-editor-menu";

function createRestorePoint(sections: Record<string, StoredSection>): RestorePoint {
  const timestamp = Date.now();
  return {
    id: String(timestamp),
    timestamp,
    sections: JSON.parse(JSON.stringify(sections)) as Record<string, StoredSection>,
  };
}

function isRestorePointDue(lastTimestamp: number) {
  return Date.now() - lastTimestamp >= RESTORE_INTERVAL_MS;
}

export default function MainHero({ width, breakpoint, isDark, isCodePanelOpen, isElementPanelOpen, showCodeToggle, showElementToggle, onBreakpointChange, onThemeChange, onToggleCodePanel, onToggleElementPanel, onOpenCodePanel, isViewMode, onViewModeChange, onAddPage }: MainHeroProps) {
  const params = useParams();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";
  const previewHref = designId
    ? `/redesign/${designId}/preview`
    : "/redesign/template";
  const templateSrc = designId
    ? isViewMode
      ? `/redesign/${designId}/preview`
      : `/redesign/${designId}/template`
    : "/redesign/template";
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const restoreMenuRef = useRef<HTMLDivElement>(null);
  const pageMenuRef = useRef<HTMLDivElement>(null);
  const [pages] = useState<string[]>(["index.html"]);
  const [currentPage, setCurrentPage] = useState("index.html");
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedRestorePointId, setSelectedRestorePointId] = useState<string | null>(null);
  const currentSectionsRef = useRef<Record<string, StoredSection>>({});
  const undoStackRef = useRef<HistoryEntry[]>([]);
  const redoStackRef = useRef<HistoryEntry[]>([]);
  const restorePointsRef = useRef<RestorePoint[]>([]);
  const hasChangesSinceStoreRef = useRef(false);
  const lastRestoreTimestampRef = useRef(0);
  const frameWidth = breakpoint === "Mobile" ? "390px" : breakpoint === "Tablet" ? "820px" : "100%";

  const syncHistoryCounts = () => {
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  };

  const saveRestorePoint = () => {
    const sections = currentSectionsRef.current;
    if (!Object.keys(sections).length) return;

    const point = createRestorePoint(sections);
    const nextPoints = [point, ...restorePointsRef.current].slice(0, MAX_RESTORE_POINTS);
    restorePointsRef.current = nextPoints;
    lastRestoreTimestampRef.current = point.timestamp;
    setRestorePoints(nextPoints);
    localStorage.setItem(RESTORE_STORAGE_KEY, JSON.stringify(nextPoints));
    hasChangesSinceStoreRef.current = false;
  };

  const notifyUnsavedChanges = () => {
    window.dispatchEvent(new CustomEvent("redesign-unsaved-changes"));
  };

  const recordSectionChange = (next: StoredSection, historyGroupId?: string) => {
    const previous = currentSectionsRef.current[next.sectionId];
    if (!previous) {
      currentSectionsRef.current[next.sectionId] = next;
      notifyUnsavedChanges();
      return;
    }
    if (previous.html === next.html) return;

    if (!restorePointsRef.current.length) saveRestorePoint();
    const groupId = historyGroupId || `section:${next.sectionId}`;
    const lastEntry = undoStackRef.current[undoStackRef.current.length - 1];
    if (lastEntry?.groupId === groupId) {
      undoStackRef.current = [
        ...undoStackRef.current.slice(0, -1),
        { before: lastEntry.before, after: next, groupId },
      ];
    } else {
      undoStackRef.current = [...undoStackRef.current, { before: previous, after: next, groupId }].slice(-MAX_HISTORY_ENTRIES);
    }
    redoStackRef.current = [];
    currentSectionsRef.current[next.sectionId] = next;
    hasChangesSinceStoreRef.current = true;
    syncHistoryCounts();
    notifyUnsavedChanges();
  };

  const applyStoredSection = (section: StoredSection) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "redesign-section-update", ...section },
      window.location.origin,
    );
    window.dispatchEvent(new CustomEvent("redesign-history-section", { detail: section }));
  };

  const undo = () => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    redoStackRef.current.push(entry);
    currentSectionsRef.current[entry.before.sectionId] = entry.before;
    applyStoredSection(entry.before);
    hasChangesSinceStoreRef.current = true;
    syncHistoryCounts();
    window.dispatchEvent(new CustomEvent("redesign-history-applied"));
  };

  const redo = () => {
    const entry = redoStackRef.current.pop();
    if (!entry) return;
    undoStackRef.current.push(entry);
    currentSectionsRef.current[entry.after.sectionId] = entry.after;
    applyStoredSection(entry.after);
    hasChangesSinceStoreRef.current = true;
    syncHistoryCounts();
    window.dispatchEvent(new CustomEvent("redesign-history-applied"));
  };

  const restore = (point: RestorePoint) => {
    Object.values(point.sections).forEach(applyStoredSection);
    currentSectionsRef.current = JSON.parse(JSON.stringify(point.sections)) as Record<string, StoredSection>;
    undoStackRef.current = [];
    redoStackRef.current = [];
    syncHistoryCounts();
    setIsRestoreOpen(false);
    setSelectedRestorePointId(null);
    window.dispatchEvent(new CustomEvent("redesign-history-applied"));
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(RESTORE_STORAGE_KEY) ?? "[]") as RestorePoint[];
        const validPoints = Array.isArray(saved) ? saved.slice(0, MAX_RESTORE_POINTS) : [];
        restorePointsRef.current = validPoints;
        lastRestoreTimestampRef.current = validPoints[0]?.timestamp ?? 0;
        setRestorePoints(validPoints);
      } catch {
        localStorage.removeItem(RESTORE_STORAGE_KEY);
      }
    }, 0);

    const interval = window.setInterval(() => {
      if (
        hasChangesSinceStoreRef.current &&
        isRestorePointDue(lastRestoreTimestampRef.current)
      ) {
        saveRestorePoint();
      }
    }, 60 * 1000);
    return () => {
      window.clearTimeout(loadTimer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleSectionUpdate = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          sectionId: string;
          label: string;
          html: string;
          historyGroupId?: string;
        }>
      ).detail;

      recordSectionChange(detail, detail.historyGroupId ?? `code:${detail.sectionId}`);

      iframeRef.current?.contentWindow?.postMessage(
        { type: "redesign-section-update", ...detail },
        window.location.origin,
      );
    };

    window.addEventListener("redesign-update-section", handleSectionUpdate);
    return () =>
      window.removeEventListener("redesign-update-section", handleSectionUpdate);
    // History functions operate on refs so this listener remains stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleElementUpdate = (event: Event) => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "redesign-element-update", ...(event as CustomEvent<Record<string, unknown>>).detail },
        window.location.origin,
      );
    };

    const handleSelectionClear = () => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "redesign-clear-element-selection", sectionId: "all" },
        window.location.origin,
      );
    };

    const handlePrimaryElementRequest = () => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "redesign-request-primary-element", sectionId: "all" },
        window.location.origin,
      );
    };

    window.addEventListener("redesign-update-element", handleElementUpdate);
    window.addEventListener("redesign-clear-element-selection", handleSelectionClear);
    window.addEventListener("redesign-request-primary-element", handlePrimaryElementRequest);
    return () => {
      window.removeEventListener("redesign-update-element", handleElementUpdate);
      window.removeEventListener("redesign-clear-element-selection", handleSelectionClear);
      window.removeEventListener("redesign-request-primary-element", handlePrimaryElementRequest);
    };
  }, []);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "redesign-code-panel-open") {
        onOpenCodePanel();
      }
      if (
        (event.data?.type === "redesign-section-selected" || event.data?.type === "redesign-element-selected") &&
        event.data.sectionId && event.data.label && typeof event.data.html === "string"
      ) {
        const section = {
          sectionId: event.data.sectionId,
          label: event.data.label,
          html: event.data.html,
        };
        if (event.data.type === "redesign-element-selected" && !currentSectionsRef.current[section.sectionId]) {
          currentSectionsRef.current[section.sectionId] = section;
        } else {
          recordSectionChange(section, event.data.historyGroupId);
        }
      }
    };

    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
    // History functions operate on refs; the open callback is the only reactive dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onOpenCodePanel]);

  useEffect(() => {
    const closeIfOtherMenu = (event: Event) => {
      const menu = (event as CustomEvent<string>).detail;
      if (menu !== "restore") setIsRestoreOpen(false);
      if (menu !== "page") {
        setIsPageMenuOpen(false);
      }
    };
    window.addEventListener(EDITOR_MENU_EVENT, closeIfOtherMenu);
    return () => window.removeEventListener(EDITOR_MENU_EVENT, closeIfOtherMenu);
  }, []);

  useEffect(() => {
    if (!isRestoreOpen) return;

    const closeOnOutside = (event: Event) => {
      const target = event.target as Node | null;
      if (target && restoreMenuRef.current?.contains(target)) return;
      setIsRestoreOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    const frameDocument = iframeRef.current?.contentDocument;
    frameDocument?.addEventListener("mousedown", closeOnOutside);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      frameDocument?.removeEventListener("mousedown", closeOnOutside);
    };
  }, [isRestoreOpen]);

  useEffect(() => {
    if (!isPageMenuOpen) return;

    const closeOnOutside = (event: Event) => {
      const target = event.target as Node | null;
      if (target && pageMenuRef.current?.contains(target)) return;
      setIsPageMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    const frameDocument = iframeRef.current?.contentDocument;
    frameDocument?.addEventListener("mousedown", closeOnOutside);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      frameDocument?.removeEventListener("mousedown", closeOnOutside);
    };
  }, [isPageMenuOpen]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "redesign-view-mode", enabled: isViewMode },
      window.location.origin,
    );
  }, [isViewMode]);

  useEffect(() => {
    const sendBreakpoint = () => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "redesign-breakpoint", breakpoint },
        window.location.origin,
      );
    };
    sendBreakpoint();
    // Re-send after load in case iframe wasn't ready.
    const id = window.setTimeout(sendBreakpoint, 400);
    return () => window.clearTimeout(id);
  }, [breakpoint]);

  return (
    <section
      data-redesign-main-hero
      style={{ width: `${width}%` }}
      className={`flex min-w-0 shrink-0 flex-col transition-colors lg:order-2 ${isDark ? "bg-[#202226]" : "bg-slate-100"}`}
    >
      <div className={`relative z-20 flex h-12 shrink-0 items-center justify-between overflow-visible border-b px-3 transition-colors ${isDark ? "border-white/10 bg-[#222222]" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center gap-1">
          {!isViewMode && showCodeToggle && (
            <button
              type="button"
              aria-label={isCodePanelOpen ? "Hide code panel" : "Show code panel"}
              aria-pressed={isCodePanelOpen}
              title={isCodePanelOpen ? "Hide code panel" : "Show code panel"}
              onClick={onToggleCodePanel}
              className={`rounded-md p-2 transition ${isCodePanelOpen
                ? isDark ? "bg-[#3a3a3a] text-cyan-300" : "bg-slate-200 text-slate-900"
                : isDark ? "bg-transparent text-slate-500 hover:text-slate-300" : "bg-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              {isCodePanelOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
        <div className="hidden">
          <div className="flex items-center rounded-lg border border-white/10 bg-black/20 p-0.5 text-xs">
            <button className="rounded-md bg-white/10 px-3 py-1.5 font-semibold text-white shadow-sm">
              Preview
            </button>
            <button className="px-3 py-1.5 text-slate-500 transition hover:text-slate-200">
              Manage
            </button>
          </div>
        </div>

        <div className="absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5">
          <div ref={pageMenuRef} className="relative flex">
            <div
              className={`flex h-8 max-w-[11.5rem] items-center rounded-md border pl-2 text-xs font-medium ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-200"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <FilePlus size={14} className="mr-1.5 shrink-0 opacity-80" />
              <span className="truncate pr-1">{currentPage}</span>
              <button
                type="button"
                aria-label="Open page menu"
                aria-expanded={isPageMenuOpen}
                onClick={() => {
                  setIsPageMenuOpen((current) => {
                    const next = !current;
                    if (next) window.dispatchEvent(new CustomEvent(EDITOR_MENU_EVENT, { detail: "page" }));
                    return next;
                  });
                }}
                className={`grid h-8 w-7 shrink-0 place-items-center rounded-r-md ${
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ChevronDown size={12} />
              </button>
            </div>
            {isPageMenuOpen && (
              <div
                className={`absolute left-0 top-[calc(100%+6px)] z-[80] w-52 rounded-xl border p-2 shadow-2xl ${
                  isDark ? "border-white/10 bg-[#1b1d21] text-white" : "border-slate-200 bg-white text-slate-900"
                }`}
                onMouseDown={(event) => event.stopPropagation()}
              >
                {pages.length > 1 && (
                  <div className="mb-1 max-h-36 overflow-y-auto">
                    {pages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => {
                          setCurrentPage(page);
                          setIsPageMenuOpen(false);
                        }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium ${
                          page === currentPage
                            ? isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"
                            : isDark ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsPageMenuOpen(false);
                    onAddPage();
                  }}
                  className="flex h-8 w-full items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-500"
                >
                  Add a page
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-pressed={isViewMode}
            onClick={() => onViewModeChange(!isViewMode)}
            className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition ${
              isViewMode
                ? isDark
                  ? "border-white/10 bg-white/10 text-white"
                  : "border-slate-200 bg-slate-100 text-slate-900"
                : isDark
                  ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isViewMode ? <Pencil size={14} /> : <EyeOff size={14} />}
            {isViewMode ? "Edit mode" : "View mode"}
          </button>

          {isViewMode && (
            <div className="flex items-center gap-1" aria-label="Preview size">
              {([
                ["Desktop", Monitor],
                ["Tablet", Laptop],
                ["Mobile", Smartphone],
              ] as const).map(([size, Icon]) => (
                <button
                  key={size}
                  type="button"
                  aria-label={`${size} preview`}
                  aria-pressed={breakpoint === size}
                  title={`${size} preview`}
                  onClick={() => onBreakpointChange(size)}
                  className={`rounded-md p-2 transition ${breakpoint === size
                    ? isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900"
                    : isDark ? "text-slate-500 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                  <Icon size={16} />
                </button>
              ))}
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                aria-label="Open preview in browser"
                title="Open preview in browser"
                className={`rounded-md p-2 transition ${isDark ? "text-slate-500 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 ${isViewMode ? "hidden" : ""}`}>
          <button
            type="button"
            disabled={undoCount === 0}
            onClick={undo}
            aria-label="Undo"
            title="Undo"
            className="rounded-md p-2 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            disabled={redoCount === 0}
            onClick={redo}
            aria-label="Redo"
            title="Redo"
            className="rounded-md p-2 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Redo2 size={15} />
          </button>
          <div ref={restoreMenuRef} className="relative">
            <button
              type="button"
              disabled={restorePoints.length === 0}
              onClick={() => {
                setIsRestoreOpen((current) => {
                  const next = !current;
                  if (next) window.dispatchEvent(new CustomEvent(EDITOR_MENU_EVENT, { detail: "restore" }));
                  return next;
                });
                setSelectedRestorePointId(null);
              }}
              aria-label="Restore history"
              aria-expanded={isRestoreOpen}
              title="Restore history"
              className={`rounded-md p-2 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${isRestoreOpen ? "bg-white/10 text-white" : ""}`}
            >
              <History size={15} />
            </button>
            {isRestoreOpen && (
              <div className={`absolute right-0 top-10 z-[60] flex w-64 max-h-[min(22rem,calc(100vh-7rem))] flex-col overflow-hidden rounded-xl border shadow-2xl ${isDark ? "border-white/10 bg-[#1b1d21] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
                <div className={`shrink-0 border-b px-3 py-2 text-xs font-bold ${isDark ? "border-white/10" : "border-slate-200"}`}>
                  Restore history
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                  {restorePoints.map((point) => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => setSelectedRestorePointId(point.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${selectedRestorePointId === point.id
                        ? isDark ? "bg-blue-500/20 text-blue-200" : "bg-blue-50 text-blue-700"
                        : isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                        }`}
                    >
                      <History size={13} className="text-slate-500" />
                      <span className="text-sm font-semibold">
                        {new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </button>
                  ))}
                </div>
                <div className={`shrink-0 border-t p-2 ${isDark ? "border-white/10" : "border-slate-200"}`}>
                  <button
                    type="button"
                    disabled={!selectedRestorePointId}
                    onClick={() => {
                      const point = restorePoints.find((item) => item.id === selectedRestorePointId);
                      if (point) restore(point);
                    }}
                    className="h-9 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Restore
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label={isDark ? "Use light preview" : "Use dark preview"}
            title={isDark ? "Light mode" : "Dark mode"}
            onClick={() => onThemeChange(!isDark)}
            className={`rounded-md p-2 transition ${isDark ? "bg-white/10 text-amber-300" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            aria-label="Fullscreen preview"
            onClick={() => iframeRef.current?.requestFullscreen()}
            className="rounded-md p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"
          >
            <Maximize size={15} />
          </button>
          {showElementToggle || !isViewMode ? (
            <button
              type="button"
              aria-label={isElementPanelOpen ? "Hide settings panel" : "Show settings panel"}
              aria-pressed={isElementPanelOpen}
              title={isElementPanelOpen ? "Hide settings panel" : "Show Content panel"}
              onClick={onToggleElementPanel}
              className={`rounded-md p-2 transition ${isElementPanelOpen
                ? isDark ? "bg-[#3a3a3a] text-cyan-300" : "bg-slate-200 text-slate-900"
                : isDark ? "bg-transparent text-slate-500 hover:text-slate-300" : "bg-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              {isElementPanelOpen ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          ) : null}
        </div>
      </div>

      <div className={`relative flex min-h-0 flex-1 justify-center overflow-hidden p-2 transition-colors ${isDark ? "bg-[#292c31]" : "bg-slate-100"}`}>
        <iframe
          key={`${designId}:${templateSrc}`}
          ref={iframeRef}
          src={templateSrc}
          title="Redesign website preview"
          data-preview-breakpoint={breakpoint}
          scrolling="yes"
          onLoad={() => {
            const win = iframeRef.current?.contentWindow;
            if (!win) return;
            win.postMessage(
              { type: "redesign-view-mode", enabled: isViewMode },
              window.location.origin,
            );
            win.postMessage(
              { type: "redesign-breakpoint", breakpoint },
              window.location.origin,
            );
          }}
          style={{ width: frameWidth }}
          className="h-full max-w-full rounded-md border border-black/60 bg-white shadow-2xl transition-[width] duration-300"
        />
      </div>
    </section>
  );
}
