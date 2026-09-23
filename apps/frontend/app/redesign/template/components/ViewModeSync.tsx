"use client";

import { useEffect } from "react";

function applyCompactNav(breakpoint?: string) {
  const html = document.documentElement;
  if (breakpoint) {
    html.setAttribute("data-redesign-breakpoint", breakpoint);
  }
  const bp = html.getAttribute("data-redesign-breakpoint") || "";
  const compact =
    bp === "Mobile" ||
    bp === "Tablet" ||
    (!bp && typeof window !== "undefined" && window.innerWidth < 1024);
  html.setAttribute("data-compact-nav", compact ? "1" : "0");
}

export default function ViewModeSync() {
  useEffect(() => {
    const applyViewMode = (enabled: boolean) => {
      document.documentElement.toggleAttribute("data-redesign-view-mode", enabled);
    };

    const handleMessage = (
      event: MessageEvent<{ type?: string; enabled?: boolean; breakpoint?: string }>,
    ) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "redesign-view-mode") {
        applyViewMode(Boolean(event.data.enabled));
        return;
      }
      if (event.data?.type === "redesign-breakpoint") {
        applyCompactNav(event.data.breakpoint);
      }
    };

    const onResize = () => applyCompactNav();

    applyCompactNav();
    window.addEventListener("message", handleMessage);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("resize", onResize);
      applyViewMode(false);
    };
  }, []);

  return (
    <style>{`
      html[data-redesign-view-mode] [data-section-toolbar],
      html[data-redesign-view-mode] [data-section-move-controls] {
        display: none !important;
      }
      html[data-redesign-view-mode] [data-editable-section] > [aria-hidden="true"] {
        display: none !important;
      }
      html[data-redesign-view-mode] [data-redesign-element-id] {
        outline: none !important;
      }
      html[data-redesign-view-mode] [data-text-format-toolbar] {
        display: none !important;
      }

      html[data-compact-nav="1"] header [data-redesign-main-nav],
      html[data-compact-nav="1"] header nav:not([data-mobile-menu]) {
        display: none !important;
      }
      html[data-compact-nav="1"] header [data-mobile-menu-toggle] {
        display: inline-flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      html:not([data-compact-nav="1"]) header [data-mobile-menu-toggle] {
        display: none !important;
        visibility: hidden !important;
      }
      html:not([data-compact-nav="1"]) header [data-mobile-menu],
      html:not([data-compact-nav="1"]) [data-mobile-menu] {
        display: none !important;
      }
      html[data-compact-nav="1"] [data-mobile-menu][data-open="true"] {
        display: flex !important;
        flex-direction: column !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin-top: 3.5rem !important;
        z-index: 400 !important;
        background: #fff !important;
        color: #0f172a !important;
        padding: 0.5rem 0.75rem 1rem !important;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22) !important;
        max-height: min(75vh, 560px) !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
      }
      html[data-compact-nav="1"] [data-mobile-menu][data-open="true"] a,
      html[data-compact-nav="1"] [data-mobile-menu][data-open="true"] button {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        color: #0f172a !important;
        padding: 0.75rem 0.5rem !important;
        border-bottom: 1px solid #e2e8f0 !important;
        white-space: normal !important;
      }
    `}</style>
  );
}
