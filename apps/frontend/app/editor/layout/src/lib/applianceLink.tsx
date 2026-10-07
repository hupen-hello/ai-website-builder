"use client";

import React from "react";
import { useOptionalPreview } from "../components/context/PreviewContext";
import { scrollTemplateToTop } from "./previewNav";

type PageRule = {
  test: (path: string) => boolean;
  label: string;
};

const PAGE_RULES: PageRule[] = [
  { test: (path) => path === "/" || path === "", label: "Home" },
  { test: (path) => path === "/about", label: "About Us" },
  { test: (path) => path === "/services", label: "Services" },
  { test: (path) => path.startsWith("/services/"), label: "Service Detail" },
  { test: (path) => path === "/gallery", label: "Gallery" },
  { test: (path) => path === "/blog", label: "Blog" },
  { test: (path) => path.startsWith("/blog/"), label: "Blog Detail" },
  { test: (path) => path === "/contact", label: "Contact" },
  { test: (path) => path === "/enquiry", label: "Enquiry" },
];

const normalizePath = (href: string) => {
  const path = String(href || "/").split("?")[0].split("#")[0] || "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
};

export const applianceHrefToLabel = (href: string) => {
  const path = normalizePath(href);
  return PAGE_RULES.find((rule) => rule.test(path))?.label || null;
};

export function useAppliancePathname() {
  const preview = useOptionalPreview();
  const current = preview?.currentPage?.trim().toLowerCase() || "";
  if (!preview || current === "home") return "/";
  if (current === "about us") return "/about";
  if (current === "services") return "/services";
  if (current === "service detail") return "/services/detail";
  if (current === "gallery") return "/gallery";
  if (current === "blog" || current === "our blogs") return "/blog";
  if (current === "blog detail") return "/blog/detail";
  if (current === "contact") return "/contact";
  if (current === "enquiry") return "/enquiry";
  return "/";
}

const editorPageHref = (label: string, fallback: string) => {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || slug === "home") return fallback;
  return `#page-${slug}`;
};

export function ApplianceLink({
  href,
  onClick,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const preview = useOptionalPreview();
  const label = applianceHrefToLabel(String(href || ""));
  const renderedHref =
    preview && label ? editorPageHref(label, href) : href;
  return (
    <a
      href={renderedHref}
      {...rest}
      data-editor-nav-link={preview ? "true" : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !preview) return;
        if (!label) return;
        event.preventDefault();
        preview.setCurrentPage(label);
        scrollTemplateToTop();
      }}
    >
      {children}
    </a>
  );
}
