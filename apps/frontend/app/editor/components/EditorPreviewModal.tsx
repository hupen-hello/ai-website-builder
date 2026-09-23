"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { redirectToAuth } from "@/lib/authReturn";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  LaptopMinimal,
  Loader2,
  LogIn,
  RefreshCw,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";

type PreviewMode = "all" | "desktop" | "tablet" | "mobile";
type FrameId = "mobile" | "tablet" | "desktop";

type PreviewFrame = {
  id: FrameId;
  label: string;
  viewportWidth: number;
  displayWidth: number;
  displayHeight: number;
};

type PreviewFrameConfig = {
  id: FrameId;
  label: string;
  viewportWidth: number;
  all: { displayWidth: number; displayHeight: number };
  single: { displayWidth: number; displayHeight: number };
};

type EditorPreviewModalProps = {
  open: boolean;
  src: string;
  loading: boolean;
  error: string;
  publishedUrl?: string;
  onClose: () => void;
  onRetry: () => void;
  /** Optional CTA — e.g. onboarding template view → open editor */
  useThemeLabel?: string;
  onUseTheme?: () => void;
  useThemeDisabled?: boolean;
  useThemeLoading?: boolean;
};

const previewFrameConfigs: PreviewFrameConfig[] = [
  {
    id: "mobile",
    label: "Mobile",
    viewportWidth: 390,
    all: { displayWidth: 214, displayHeight: 490 },
    single: { displayWidth: 400, displayHeight: 866 },
  },
  {
    id: "tablet",
    label: "Tablet",
    viewportWidth: 768,
    all: { displayWidth: 460, displayHeight: 640 },
    single: { displayWidth: 820, displayHeight: 1090 },
  },
  {
    id: "desktop",
    label: "Desktop",
    viewportWidth: 1440,
    all: { displayWidth: 880, displayHeight: 640 },
    single: { displayWidth: 980, displayHeight: 720 },
  },
];

function toPreviewFrame(
  config: PreviewFrameConfig,
  size: { displayWidth: number; displayHeight: number },
): PreviewFrame {
  return {
    id: config.id,
    label: config.label,
    viewportWidth: config.viewportWidth,
    displayWidth: size.displayWidth,
    displayHeight: size.displayHeight,
  };
}

function getAllPreviewFrames(): PreviewFrame[] {
  return previewFrameConfigs.map((config) =>
    toPreviewFrame(config, config.all),
  );
}

function getFrameOuterSize(frame: PreviewFrame) {
  const bezel = 6;
  const label = 34;
  const stand = frame.id === "desktop" ? 23 : 0;

  return {
    width: frame.displayWidth + bezel,
    height: frame.displayHeight + bezel + stand + label,
  };
}

function computeSingleFrameSize(
  config: PreviewFrameConfig,
  availableWidth: number,
  availableHeight: number,
): { displayWidth: number; displayHeight: number } {
  const aspect = config.single.displayHeight / config.single.displayWidth;
  const maxWidth = Math.min(availableWidth * 0.96, config.single.displayWidth);
  const maxHeight = availableHeight * 0.92;

  let width = maxWidth;
  let height = width * aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height / aspect;
  }

  width = Math.max(width, config.all.displayWidth);
  height = Math.max(height, config.all.displayHeight);

  return {
    displayWidth: Math.round(width),
    displayHeight: Math.round(height),
  };
}

const modeOptions: Array<{
  id: PreviewMode;
  label: string;
  Icon?: typeof Smartphone;
}> = [
  { id: "all", label: "All screens" },
  { id: "mobile", label: "Mobile", Icon: Smartphone },
  { id: "tablet", label: "Tablet", Icon: Tablet },
  { id: "desktop", label: "Desktop", Icon: LaptopMinimal },
];

function DeviceFrame({
  frame,
  screen,
}: {
  frame: PreviewFrame;
  screen: ReactNode;
}) {
  const screenBox = (
    <div
      className="overflow-hidden bg-white leading-[0]"
      style={{ width: frame.displayWidth, height: frame.displayHeight }}
    >
      {screen}
    </div>
  );

  if (frame.id === "mobile") {
    return (
      <div className="flex flex-col items-center">
        <div
          className="relative rounded-[1.65rem] bg-[#4266f7] p-[2px] shadow-[0_18px_44px_rgba(66,102,247,0.24),0_10px_22px_rgba(8,19,47,0.12)] ring-1 ring-[#4266f7]/18"
          style={{ width: frame.displayWidth + 6 }}
        >
          <span className="absolute -left-[1px] top-[92px] h-7 w-[2px] rounded-l-sm bg-[#3656d9]" />
          <span className="absolute -left-[1px] top-[124px] h-11 w-[2px] rounded-l-sm bg-[#3656d9]" />
          <span className="absolute -right-[1px] top-[108px] h-14 w-[2px] rounded-r-sm bg-[#3656d9]" />

          <div className="relative overflow-hidden rounded-[1.45rem] ring-1 ring-[#4266f7]/24">
            {screenBox}
            <span className="pointer-events-none absolute inset-x-5 top-0 z-10 h-5 rounded-b-full bg-white/20 blur-md" />
            <span className="pointer-events-none absolute left-1/2 top-[7px] z-10 h-[14px] w-[54px] -translate-x-1/2 rounded-full bg-[#08132f]/90" />
            <span className="pointer-events-none absolute bottom-[7px] left-1/2 z-10 h-[4px] w-[32%] min-w-[54px] max-w-[88px] -translate-x-1/2 rounded-full bg-[#08132f]/25" />
          </div>
        </div>
        <span className="mt-3 rounded-full bg-[#4266f7]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4266f7]">
          {frame.label}
        </span>
      </div>
    );
  }

  if (frame.id === "tablet") {
    return (
      <div className="flex flex-col items-center">
        <div className="relative rounded-[1.25rem] bg-[#4266f7] p-[2px] shadow-[0_18px_44px_rgba(66,102,247,0.22),0_10px_22px_rgba(8,19,47,0.1)] ring-1 ring-[#4266f7]/18">
          <div className="relative overflow-hidden rounded-[1.05rem] ring-1 ring-[#4266f7]/22">
            {screenBox}
            <span className="pointer-events-none absolute inset-x-8 top-0 z-10 h-5 rounded-b-full bg-white/18 blur-md" />
            <span className="pointer-events-none absolute left-1/2 top-2.5 z-10 size-1.5 -translate-x-1/2 rounded-full bg-white/60 ring-1 ring-white/35" />
          </div>
        </div>
        <span className="mt-3 rounded-full bg-[#4266f7]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4266f7]">
          {frame.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden rounded-t-[14px] bg-[#4266f7] p-[2px] shadow-[0_18px_44px_rgba(66,102,247,0.22),0_10px_22px_rgba(8,19,47,0.1)] ring-1 ring-[#4266f7]/18"
        style={{ width: frame.displayWidth + 6 }}
      >
        <div className="relative overflow-hidden rounded-t-[11px] ring-1 ring-[#4266f7]/24">
          {screenBox}
          <span className="pointer-events-none absolute inset-x-14 top-0 z-10 h-5 rounded-b-full bg-white/16 blur-md" />
          <span className="pointer-events-none absolute left-1/2 top-2 z-10 size-1.5 -translate-x-1/2 rounded-full bg-white/60 ring-1 ring-white/35" />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="h-[14px] w-[38px] rounded-b-sm bg-gradient-to-b from-[#5a7af8] to-[#3156ea] shadow-[0_8px_18px_rgba(66,102,247,0.18)]" />
        <div className="h-[4px] w-[112px] rounded-full bg-[#4266f7]/18 shadow-[0_6px_14px_rgba(66,102,247,0.14)] ring-1 ring-[#4266f7]/10" />
      </div>
      <span className="mt-3 rounded-full bg-[#4266f7]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4266f7]">
        {frame.label}
      </span>
    </div>
  );
}

export default function EditorPreviewModal({
  open,
  src,
  loading,
  error,
  publishedUrl,
  onClose,
  onRetry,
  useThemeLabel = "Use this theme",
  onUseTheme,
  useThemeDisabled = false,
  useThemeLoading = false,
}: EditorPreviewModalProps) {
  const [mode, setMode] = useState<PreviewMode>("all");
  const [zoom, setZoom] = useState(100);
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  const [resolvedFrames, setResolvedFrames] = useState<PreviewFrame[]>(() =>
    getAllPreviewFrames(),
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const displayPublishedUrl = publishedUrl
    ? publishedUrl.replace(/^https?:\/\//, "")
    : "";

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const copyPublishedUrl = async () => {
    if (!publishedUrl) return;
    try {
      await window.navigator.clipboard.writeText(publishedUrl);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = publishedUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  const isSingleMode = mode !== "all";
  const visibleFrames =
    mode === "all"
      ? resolvedFrames
      : resolvedFrames.filter((frame) => frame.id === mode);

  useLayoutEffect(() => {
    if (!open) return;

    const updateFit = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const availableWidth = viewport.clientWidth - 32;
      const availableHeight = viewport.clientHeight - 32;
      if (availableWidth <= 0 || availableHeight <= 0) return;

      if (mode === "all") {
        setResolvedFrames(getAllPreviewFrames());

        const row = rowRef.current;
        if (!row) return;

        const neededWidth = row.scrollWidth;
        if (neededWidth <= 0) return;

        const nextScale =
          neededWidth > availableWidth
            ? Math.max(0.62, availableWidth / neededWidth)
            : 1;

        setFitScale((current) =>
          Math.abs(current - nextScale) < 0.01 ? current : nextScale,
        );
        return;
      }

      const config = previewFrameConfigs.find((item) => item.id === mode);
      if (!config) return;

      const frame = toPreviewFrame(
        config,
        computeSingleFrameSize(config, availableWidth, availableHeight),
      );
      setResolvedFrames([frame]);

      const outer = getFrameOuterSize(frame);
      const widthScale = availableWidth / outer.width;
      const heightScale = availableHeight / outer.height;
      const nextScale = Math.min(widthScale, heightScale, 1);

      setFitScale((current) =>
        Math.abs(current - nextScale) < 0.01 ? current : nextScale,
      );
    };

    updateFit();
    const observer = new ResizeObserver(updateFit);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (rowRef.current) observer.observe(rowRef.current);

    return () => observer.disconnect();
  }, [open, mode, zoom]);

  if (!open) return null;

  const combinedScale = fitScale * (zoom / 100);

  return createPortal(
    <section
      className="fixed inset-0 z-[11000] flex items-center justify-center p-4 sm:p-5 md:p-6"
      style={{
        background:
          "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.7) 0%, transparent 32%), radial-gradient(circle at 80% 20%, rgba(186,230,253,0.5) 0%, transparent 28%), linear-gradient(165deg, #e0f2fe 0%, #bae6fd 50%, #93c5fd 100%)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-preview-title"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute bottom-[12%] right-[10%] h-52 w-52 rounded-full bg-[#315ff4]/10 blur-3xl" />
      </div>

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/88 shadow-[0_30px_90px_rgba(49,95,244,0.18)] backdrop-blur-2xl">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315ff4]">
              Lestow
            </p>
            <h2
              id="editor-preview-title"
              className="text-base font-semibold tracking-[-0.02em] text-[#08132f] sm:text-lg"
            >
              See your site on every screen
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-slate-100/80 p-1">
              {modeOptions.map((option) => {
                const Icon = option.Icon;
                const isActive = mode === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMode(option.id)}
                    aria-pressed={isActive}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                      isActive
                        ? "bg-white text-[#08132f] shadow-sm ring-1 ring-[#08132f]"
                        : "text-slate-500 hover:text-[#08132f]"
                    }`}
                  >
                    {Icon ? <Icon size={13} strokeWidth={2} /> : null}
                    {option.label}
                  </button>
                );
              })}
            </div>

            <select
              aria-label="Preview zoom"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-8 rounded-lg border-0 bg-slate-100/80 px-2.5 text-xs font-semibold text-[#08132f] outline-none focus:ring-2 focus:ring-[#315ff4]/30"
            >
              {[70, 80, 90, 100].map((value) => (
                <option key={value} value={value}>
                  {value}%
                </option>
              ))}
            </select>

            <button
              type="button"
              title="Reload preview"
              aria-label="Reload preview"
              disabled={!src || loading}
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 text-xs font-semibold text-[#08132f] transition hover:bg-slate-200/80 disabled:opacity-40"
            >
              <RefreshCw size={13} />
              Reload
            </button>

            {onUseTheme ? (
              <button
                type="button"
                disabled={useThemeDisabled || useThemeLoading}
                onClick={onUseTheme}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#315ff4] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#08132f] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <CheckCircle2 size={14} />
                {useThemeLoading ? "Opening..." : useThemeLabel}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#08132f] text-white transition hover:bg-[#315ff4]"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        <div
          ref={viewportRef}
          className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]"
        >
          {loading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-[#08132f] shadow-lg ring-1 ring-slate-200/70">
                <Loader2 size={18} className="animate-spin text-[#315ff4]" />
                Loading preview…
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-5">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200/70">
                <p className="font-bold text-[#08132f]">Preview could not load</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#315ff4] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#08132f]"
                  >
                    <RefreshCw size={16} />
                    Try again
                  </button>
                  {/login is required/i.test(error) ? (
                    <button
                      type="button"
                      onClick={() => redirectToAuth()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#08132f] transition hover:border-[#315ff4]/35 hover:bg-slate-50"
                    >
                      <LogIn size={16} />
                      Login
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div
            className={`flex h-full w-full justify-center overflow-hidden px-4 pb-8 pt-6 sm:px-6 ${
              isSingleMode ? "items-center" : "items-end"
            }`}
          >
            <div
              ref={rowRef}
              className={`flex justify-center gap-6 md:gap-10 ${
                isSingleMode ? "items-center" : "items-end"
              }`}
              style={{
                transform: `scale(${combinedScale})`,
                transformOrigin: isSingleMode ? "center center" : "bottom center",
              }}
            >
            {visibleFrames.map((frame) => {
              const deviceScale = frame.displayWidth / frame.viewportWidth;
              const viewportHeight = Math.round(
                frame.displayHeight / deviceScale,
              );

            const screen = (
              <div className="relative h-full w-full overflow-hidden bg-white leading-[0]">
                {src ? (
                  <iframe
                    key={`${frame.id}-${reloadKey}-${src}`}
                    src={src}
                    title={`${frame.label} website preview`}
                    className="absolute left-0 top-0 block border-0 bg-white"
                    style={{
                      width: frame.viewportWidth,
                      height: viewportHeight,
                      transform: `scale(${deviceScale})`,
                      transformOrigin: "top left",
                    }}
                  />
                ) : null}
                </div>
              );

              return (
                <DeviceFrame key={frame.id} frame={frame} screen={screen} />
              );
            })}
            </div>
          </div>
        </div>

        {publishedUrl ? (
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-slate-200/70 bg-white/80 px-4 py-3 sm:gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#315ff4]">
              Live link
            </span>
            <span
              className="max-w-[min(55vw,36rem)] truncate text-sm font-semibold text-[#08132f]"
              title={publishedUrl}
            >
              {displayPublishedUrl}
            </span>
            <button
              type="button"
              onClick={() => void copyPublishedUrl()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 text-xs font-bold text-[#08132f] transition hover:bg-slate-200"
            >
              {copied ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#08132f] transition hover:bg-slate-200"
              aria-label="Open live website"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        ) : null}
      </div>
    </section>,
    document.body,
  );
}
