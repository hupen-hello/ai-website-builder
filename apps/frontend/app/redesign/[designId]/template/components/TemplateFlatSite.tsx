"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BuiltSiteSectionItem } from "@/lib/built-site-theme";
import { initRedesignPreviewInteractions } from "@/lib/redesign-preview-runtime";
import EditableSection from "./EditableSection";

function listFlatSectionRoots(root: HTMLElement): HTMLElement[] {
  const direct = [...root.children].filter(
    (node): node is HTMLElement => node instanceof HTMLElement && node.tagName !== "STYLE",
  );
  if (direct.length >= 2) return direct;
  const scoped = [
    ...root.querySelectorAll<HTMLElement>(
      ":scope > header, :scope > section, :scope > footer, :scope > main, :scope > nav, :scope > article, :scope > div",
    ),
  ];
  if (scoped.length >= 2) return scoped;
  return [...root.querySelectorAll<HTMLElement>("[data-section-id]")];
}

function syncFlatSectionAnchors(root: HTMLElement, items: { id: string }[]) {
  const roots = listFlatSectionRoots(root);
  items.forEach((item, index) => {
    const byId =
      root.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(item.id)}"]`) ||
      root.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`);
    const node = byId || roots[index];
    if (!node) return;
    node.id = item.id;
    node.setAttribute("data-section-id", item.id);
    if (!node.style.scrollMarginTop) node.style.scrollMarginTop = "5.5rem";
  });
}

function isCloneDoc(items: BuiltSiteSectionItem[]) {
  return items.some(
    (item) =>
      /data-lestow-clone-doc/i.test(item.html || "") ||
      /data-lestow-clone=["']true["']/i.test(item.html || ""),
  );
}

/** Edit canvas — same flat HTML as export/preview, toolbars as overlays. */
export default function TemplateFlatSite({ items }: { items: BuiltSiteSectionItem[] }) {
  const siteRef = useRef<HTMLDivElement>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [domEpoch, setDomEpoch] = useState(0);
  const cloneMode = useMemo(() => isCloneDoc(items), [items]);
  const pageHtml = useMemo(() => items.map((item) => item.html).join("\n"), [items]);
  const cloneSrcDoc = useMemo(() => {
    if (!cloneMode) return "";
    const doc = items.find((item) => /data-lestow-clone-doc/i.test(item.html || ""));
    return (doc?.html || pageHtml).trim();
  }, [cloneMode, items, pageHtml]);

  const bindSiteRef = (node: HTMLDivElement | null) => {
    siteRef.current = node;
    if (node && items.length && !cloneMode) syncFlatSectionAnchors(node, items);
  };

  useEffect(() => {
    if (cloneMode || !pageHtml.trim()) return;
    const frame = window.requestAnimationFrame(() => {
      const root = siteRef.current;
      if (root) syncFlatSectionAnchors(root, items);
      initRedesignPreviewInteractions();
      (window as Window & { tailwind?: { refresh?: () => void } }).tailwind?.refresh?.();
      setDomEpoch((n) => n + 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageHtml, items, cloneMode]);

  useEffect(() => {
    if (cloneMode) return;
    const host = siteRef.current?.parentElement;
    if (!host || !pageHtml.trim()) return;

    const resolveHoveredId = (target: Element | null) => {
      if (!target) return null;
      const overlay = target.closest("[data-editable-section]");
      if (overlay instanceof HTMLElement) {
        return overlay.getAttribute("data-editable-section");
      }
      const root = siteRef.current;
      if (!root || !root.contains(target)) return null;
      const section = target.closest("[data-section-id]");
      if (section instanceof HTMLElement && root.contains(section)) {
        return section.getAttribute("data-section-id");
      }
      return null;
    };

    const onMove = (event: MouseEvent) => {
      const next = resolveHoveredId(event.target instanceof Element ? event.target : null);
      setHoveredSectionId((current) => (current === next ? current : next));
    };

    const onLeave = (event: MouseEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Element && host.contains(next)) return;
      setHoveredSectionId(null);
    };

    host.addEventListener("mousemove", onMove);
    host.addEventListener("mouseleave", onLeave);
    return () => {
      host.removeEventListener("mousemove", onMove);
      host.removeEventListener("mouseleave", onLeave);
    };
  }, [pageHtml, items, cloneMode]);

  // Clone docs must render in an isolated iframe — parent Tailwind preflight destroys reference CSS.
  if (cloneMode && cloneSrcDoc) {
    return (
      <div className="relative min-h-screen bg-white">
        <iframe
          title="Lestow clone preview"
          srcDoc={cloneSrcDoc}
          className="block h-[min(100vh,1200px)] min-h-screen w-full border-0 bg-white"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    );
  }

  return (
    <div className="redesign-template-scrollbars relative min-h-screen bg-white text-slate-950">
      <div ref={bindSiteRef} data-redesign-flat-site dangerouslySetInnerHTML={{ __html: pageHtml }} />
      {items.map((item, index) => (
        <EditableSection
          key={item.id}
          id={item.id}
          label={item.label}
          sectionIndex={index}
          isHovered={hoveredSectionId === item.id}
          flatRootRef={siteRef}
          flatDomEpoch={domEpoch}
          defaultSelected={index === 0}
        />
      ))}
    </div>
  );
}
