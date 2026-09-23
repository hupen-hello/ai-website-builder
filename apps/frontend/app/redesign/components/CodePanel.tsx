"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, ChevronDown, ChevronUp, Copy, Minus, Plus } from "lucide-react";

export type CodePanelSize = "Mobile" | "Tablet" | "Desktop";

export type OpenedCodeSection = {
  id: string;
  label: string;
  html: string;
};

type CodePanelProps = {
  width: number;
  size: CodePanelSize;
  onSizeChange: (size: CodePanelSize) => void;
  openedSection?: OpenedCodeSection | null;
};

type SectionMessage = {
  type: "redesign-code-panel-open" | "redesign-section-deleted";
  sectionId: string;
  label: string;
  html?: string;
};

const EMPTY_SECTION_HTML = "<!-- Click the Code button on a section to view its HTML. -->";

function formatHtml(html: string) {
  const lines = html.trim().replace(/>\s*</g, ">\n<").split("\n");
  let depth = 0;

  return lines.map((line) => {
    const trimmed = line.trim();
    const isClosing = /^<\//.test(trimmed);
    const isVoid = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(trimmed);
    const isSelfClosing = /\/>$/.test(trimmed);
    const closesOnLine = /^<([\w-]+)\b[^>]*>.*<\/\1>$/.test(trimmed);

    if (isClosing) depth = Math.max(0, depth - 1);
    const formatted = `${"  ".repeat(depth)}${trimmed}`;
    if (!isClosing && !isVoid && !isSelfClosing && !closesOnLine && /^<[^!/][^>]*>$/.test(trimmed)) depth += 1;
    return formatted;
  }).join("\n");
}

function highlightHtml(html: string) {
  const tokens: React.ReactNode[] = [];
  const tokenPattern = /(<!--[\s\S]*?-->)|(<\/?)([\w-]+)|([\w:-]+)(?=\s*=)|("[^"\n]*"|'[^'\n]*')|(\/?>)|(&[\w#]+;)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(html)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(html.slice(lastIndex, match.index));
    }

    const key = `${match.index}-${tokens.length}`;

    if (match[1]) {
      tokens.push(<span key={key} className="text-[#6a9955]">{match[1]}</span>);
    } else if (match[2] && match[3]) {
      tokens.push(
        <span key={`${key}-bracket`} className="text-[#808080]">{match[2]}</span>,
        <span key={`${key}-tag`} className="text-[#569cd6]">{match[3]}</span>,
      );
    } else if (match[4]) {
      tokens.push(<span key={key} className="text-[#9cdcfe]">{match[4]}</span>);
    } else if (match[5]) {
      tokens.push(<span key={key} className="text-[#ce9178]">{match[5]}</span>);
    } else if (match[6]) {
      tokens.push(<span key={key} className="text-[#808080]">{match[6]}</span>);
    } else {
      tokens.push(<span key={key} className="text-[#c586c0]">{match[7]}</span>);
    }

    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < html.length) tokens.push(html.slice(lastIndex));
  return tokens;
}

export default function CodePanel({ width, size, onSizeChange, openedSection }: CodePanelProps) {
  const highlightedCodeRef = useRef<HTMLPreElement>(null);
  const [section, setSection] = useState({
    id: openedSection?.id ?? "",
    label: openedSection?.label ?? "Section",
    html: openedSection?.html ? formatHtml(openedSection.html) : EMPTY_SECTION_HTML,
  });
  const [openedKey, setOpenedKey] = useState(
    openedSection?.html ? `${openedSection.id}::${openedSection.html}` : "",
  );
  const [copied, setCopied] = useState(false);
  const [codeFontSize, setCodeFontSize] = useState(15);
  const [agentMessage, setAgentMessage] = useState("");
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const highlightedHtml = useMemo(() => highlightHtml(section.html), [section.html]);
  const nextOpenedKey = openedSection?.html ? `${openedSection.id}::${openedSection.html}` : "";
  if (openedSection?.html && nextOpenedKey !== openedKey) {
    setOpenedKey(nextOpenedKey);
    setSection({
      id: openedSection.id,
      label: openedSection.label,
      html: formatHtml(openedSection.html),
    });
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent<SectionMessage>) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data;

      if (message?.type === "redesign-code-panel-open" && message.html) {
        setSection({ id: message.sectionId, label: message.label, html: formatHtml(message.html) });
      }

      if (message?.type === "redesign-section-deleted") {
        setSection((current) => {
          if (message.sectionId !== current.id) return current;
          return {
            ...current,
            html: `<!-- ${message.label} section was deleted from the preview. -->`,
          };
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const handleHistorySection = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionId: string; label: string; html: string }>).detail;
      if (!detail || detail.sectionId !== section.id) return;
      setSection((current) => ({ ...current, label: detail.label, html: formatHtml(detail.html) }));
    };

    window.addEventListener("redesign-history-section", handleHistorySection);
    return () => window.removeEventListener("redesign-history-section", handleHistorySection);
  }, [section.id]);

  const updatePreview = (html: string) => {
    window.dispatchEvent(
      new CustomEvent("redesign-update-section", {
        detail: {
          sectionId: section.id,
          label: section.label,
          html,
        },
      }),
    );
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(section.html);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const applyCode = () => {
    updatePreview(section.html);
  };

  const saveAndFormatCode = () => {
    const formattedHtml = formatHtml(section.html);
    setSection((current) => ({ ...current, html: formattedHtml }));
    updatePreview(formattedHtml);
  };

  return (
    <aside data-redesign-code-panel style={{ width: `${width}%` }} className="flex min-w-0 shrink-0 flex-col overflow-hidden bg-[#222222] text-white transition-colors lg:order-1">
      <div className="hidden h-12 shrink-0 items-center border-b border-white/[0.06] px-4 lg:flex">
        <div className="flex items-center rounded-md border border-white/10 bg-white/[0.04] p-0.5">
          {(["Mobile", "Tablet", "Desktop"] as const).map((panelSize) => (
            <button
              key={panelSize}
              type="button"
              aria-label={`${panelSize} code panel width`}
              aria-pressed={size === panelSize}
              onClick={() => onSizeChange(panelSize)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${size === panelSize
                ? "bg-white/15 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-200"
                }`}
            >
              {panelSize}
            </button>
          ))}
        </div>
      </div>
      {/* <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Code2 size={16} className="shrink-0 text-[#55d6be]" />
          <span className="truncate text-sm font-semibold text-white">index.html</span>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${hasChanges ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"}`}>
            {hasChanges ? "Unsaved" : "Selected"}
          </span>
        </div>

      </div> */}

      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#222222] px-4">
        <span className="truncate pr-3 text-sm text-slate-100">
          {section.id ? section.label : "Section"}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <div className="mr-1 flex h-7 items-center rounded-md border border-white/10 text-slate-400">
            <button
              type="button"
              aria-label="Decrease code font size"
              onClick={() => setCodeFontSize((size) => Math.max(10, size - 1))}
              className="flex h-full w-7 items-center justify-center transition hover:bg-white/10 hover:text-white"
            >
              <Minus size={12} />
            </button>
            <span className="w-9 text-center text-[11px] tabular-nums">{codeFontSize}px</span>
            <button
              type="button"
              aria-label="Increase code font size"
              onClick={() => setCodeFontSize((size) => Math.min(24, size + 1))}
              className="flex h-full w-7 items-center justify-center transition hover:bg-white/10 hover:text-white"
            >
              <Plus size={12} />
            </button>
          </div>
          <button type="button" onClick={copyCode} className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[14px] text-slate-400 transition hover:bg-white/10 hover:text-white">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>


      <div className="relative min-h-0 flex-1 bg-[#222222]">
        <pre
          ref={highlightedCodeRef}
          aria-hidden="true"
          style={{ fontSize: `${codeFontSize}px`, lineHeight: 1.6, tabSize: 2 }}
          className="redesign-code-editor pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap px-4 py-4 text-[#d4d4d4]"
        >
          {highlightedHtml}
        </pre>
        <textarea
          value={section.html}
          onChange={(event) => {
            const html = event.target.value;
            setSection((current) => ({ ...current, html }));
            updatePreview(html);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
              event.preventDefault();
              saveAndFormatCode();
              return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              applyCode();
            }
          }}
          wrap="soft"
          spellCheck={false}
          aria-label={`${section.label} HTML code`}
          style={{ fontSize: `${codeFontSize}px`, lineHeight: 1.6, tabSize: 2 }}
          onScroll={(event) => {
            if (!highlightedCodeRef.current) return;
            highlightedCodeRef.current.scrollTop = event.currentTarget.scrollTop;
            highlightedCodeRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }}
          className="redesign-code-editor relative z-10 h-full w-full resize-none overflow-y-auto overflow-x-hidden whitespace-pre-wrap border-0 bg-transparent px-4 py-4 text-transparent caret-white outline-none selection:bg-blue-500/40"
        />
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#222222] p-3">
        <div className="rounded-xl border border-cyan-300/20 bg-[#111315] p-2 shadow-[0_0_0_3px_rgba(34,211,238,0.10)]">
          <button
            type="button"
            aria-expanded={isAgentOpen}
            aria-controls="lestow-agent-composer"
            onClick={() => setIsAgentOpen((current) => !current)}
            className="flex h-8 w-full items-center gap-2 px-1 text-left text-xs font-semibold text-cyan-300 lg:hidden"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/10">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
            </span>
            Lestow AI Agent...
            <span className="ml-auto rounded-md p-1 text-slate-400">
              {isAgentOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </span>
          </button>
          <div className="hidden h-8 items-center gap-2 px-1 text-xs font-semibold text-cyan-300 lg:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/10">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
            </span>
            Lestow AI Agent...
          </div>
          <form
            id="lestow-agent-composer"
            className={`${isAgentOpen ? "block" : "hidden"} relative mt-1 lg:block`}
            onSubmit={(event) => {
              event.preventDefault();
              if (!agentMessage.trim()) return;
              setAgentMessage("");
            }}
          >
            <textarea
              value={agentMessage}
              onChange={(event) => setAgentMessage(event.target.value)}
              aria-label="Start Prompting..."
              placeholder="Start Prompting..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0c0d0f] px-3 py-3 pr-14 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-300/30"
            />
            <button
              type="submit"
              disabled={!agentMessage.trim()}
              aria-label="Send message"
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
