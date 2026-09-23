"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import React, { useState } from "react";
import { SectionProps } from "./../../../types/section";
import { getBlock, getBlocksByType, resolveSectionBlocks } from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";
import InlineRichText from "../../builder/InlineRichText";
import EditorRemoteImage from "../../EditorRemoteImage";
import { useOptionalPreview } from "../../context/PreviewContext";
import { useActiveMenu } from "./useActiveMenu";
import { getActiveMenuItemStyle } from "./activeMenuStyles";
import {
  scrollTemplateToTop,
  scrollToSectionHref,
  navigatePublishedPageHref,
  navigatePublishedBlogs,
  navigateEditorMasterDetailHref,
  navigateEditorMasterGroupHref,
  getRoutedPageSlugFromHref,
  getPublishedSiteBasePath,
  isPublishedSpecialContentRoute,
} from "../../../lib/sectionScroll";

export default function HeaderTwo({
  data = {},
  blocks,
  editorMode,
}: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const logo = getBlock(resolvedBlocks, "logo");
  const menu = getBlock(resolvedBlocks, "menu");
  const buttonBlocks = getBlocksByType(resolvedBlocks, "button");
  const headerSolidColor = data.headerBackgroundColor ?? "var(--header-bg)";
  const headerGradientColor =
    data.headerGradientColor ?? "var(--blue-bg, #0668ff)";
  const headerBackground =
    data.headerBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${headerSolidColor}, ${headerGradientColor})`
      : headerSolidColor;
  const headerTextColor = data.headerTextColor ?? "var(--header-text)";
  const activeMenuTextColor = data.headerActiveTextColor ?? "#ffffff";
  const activeMenuBackgroundColor =
    data.headerActiveBackgroundColor ?? "#2563eb";
  const activeMenuStyle = data.headerActiveMenuStyle ?? "background";
  const activeMenuStyleProps = (isItemActive: boolean) =>
    isItemActive
      ? getActiveMenuItemStyle(
          activeMenuStyle,
          activeMenuTextColor,
          activeMenuBackgroundColor,
          {
            keepTextColor: data.headerActiveKeepTextColor ?? false,
            defaultTextColor: headerTextColor,
            lineGap: data.headerActiveLineGap,
            menuPadding: data.headerActiveMenuPadding,
          },
        )
      : undefined;
  const [open, setOpen] = useState(false);
  const preview = useOptionalPreview();
  const { activeLabel, isActive, setActiveLabel } = useActiveMenu({
    items: menu?.items ?? [],
    currentPage: preview?.currentPage ?? "Home",
    pageLinks: preview?.pageLinks ?? [],
  });
  const handlePageClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    const trimmedHref = href.trim();
    if (
      /^(tel:|mailto:|sms:)/i.test(trimmedHref) ||
      /^https?:\/\//i.test(trimmedHref)
    ) {
      setOpen(false);
      return;
    }
    event.preventDefault();
    if (/^javascript:/i.test(trimmedHref)) {
      setOpen(false);
      return;
    }
    setActiveLabel(label);
    const isPublishedBlogLink =
      window.location.pathname.startsWith("/published/") &&
      (trimmedHref.toLowerCase() === "#page-blogs" ||
        /\/blogs\/?$/i.test(trimmedHref) ||
        label.trim().toLowerCase() === "blogs");
    if (isPublishedBlogLink) {
      navigatePublishedBlogs();
      return;
    }
    if (navigateEditorMasterDetailHref(href)) {
      setOpen(false);
      return;
    }
    if (navigateEditorMasterGroupHref(href)) {
      setOpen(false);
      return;
    }
    if (
      preview &&
      trimmedHref.toLowerCase().startsWith("#page-blog-")
    ) {
      const blogPage = preview.pageLinks.find(
        (item) =>
          item.kind === "blog" &&
          item.href.trim().toLowerCase() === trimmedHref.toLowerCase(),
      );
      if (blogPage) {
        preview.setCurrentPage(blogPage.label);
        setOpen(false);
        scrollTemplateToTop();
        return;
      }
    }
    const publishedBase = getPublishedSiteBasePath();
    const isHomeClick =
      label.trim().toLowerCase() === "home" ||
      !trimmedHref ||
      trimmedHref === "#" ||
      (Boolean(publishedBase) &&
        trimmedHref.replace(/\/+$/, "") === publishedBase);
    if (
      isHomeClick &&
      window.location.pathname.startsWith("/published/") &&
      getPublishedSiteBasePath() &&
      window.location.pathname.replace(/\/+$/, "") !==
        getPublishedSiteBasePath()
    ) {
      if (isPublishedSpecialContentRoute() || !preview) {
        window.location.assign(getPublishedSiteBasePath());
        return;
      }
      preview.setCurrentPage("Home");
      setOpen(false);
      scrollTemplateToTop();
      return;
    }
    if (navigatePublishedPageHref(href)) {
      return;
    }
    const isRoutedPageHref = Boolean(getRoutedPageSlugFromHref(href));
    if (
      isRoutedPageHref &&
      preview &&
      !isPublishedSpecialContentRoute()
    ) {
      preview.setCurrentPage(label || "Home");
      setOpen(false);
      scrollTemplateToTop();
      return;
    }
    const previewHref = preview?.pageLinks.find(
      (item) =>
        item.kind !== "blog" &&
        item.label.trim().toLowerCase() === label.trim().toLowerCase(),
    )?.href;
    const preferredHref =
      (!href.trim() || href.trim() === "#") &&
      label.trim().toLowerCase() !== "home" &&
      previewHref
        ? previewHref
        : href;
    if (navigatePublishedPageHref(preferredHref)) {
      return;
    }
    const isPublishedBlogRoute =
      window.location.pathname.startsWith("/published/") &&
      /\/(?:blogs|blog)(?:\/|$)/i.test(window.location.pathname);
    const normalizedPreferredHref = preferredHref.trim();
    if (
      isPublishedBlogRoute &&
      (!normalizedPreferredHref || normalizedPreferredHref.startsWith("#"))
    ) {
      const sitePath = getPublishedSiteBasePath();
      const sectionHash =
        !normalizedPreferredHref || normalizedPreferredHref === "#"
          ? ""
          : normalizedPreferredHref;
      window.location.assign(`${sitePath}${sectionHash}`);
      return;
    }
    const onNestedPublishedPath =
      Boolean(publishedBase) &&
      window.location.pathname.replace(/\/+$/, "") !== publishedBase;
    if (
      onNestedPublishedPath &&
      normalizedPreferredHref.startsWith("#") &&
      !getRoutedPageSlugFromHref(normalizedPreferredHref)
    ) {
      window.location.assign(
        `${publishedBase}${
          normalizedPreferredHref === "#" ? "" : normalizedPreferredHref
        }`,
      );
      return;
    }
    if (
      scrollToSectionHref(preferredHref) ||
      (previewHref !== preferredHref &&
        Boolean(previewHref) &&
        scrollToSectionHref(previewHref as string))
    ) {
      setOpen(false);
      return;
    }
    if (preview) {
      setOpen(false);
      return;
    }
  };
  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setActiveLabel("Home");
    if (window.location.pathname.startsWith("/published/")) {
      const sitePath = getPublishedSiteBasePath();
      if (
        sitePath &&
        window.location.pathname.replace(/\/+$/, "") !== sitePath
      ) {
        if (isPublishedSpecialContentRoute() || !preview) {
          window.location.assign(sitePath);
          return;
        }
        preview.setCurrentPage("Home");
        setOpen(false);
        scrollTemplateToTop();
        return;
      }
    }
    if (scrollToSectionHref("#")) {
      setOpen(false);
      preview?.setCurrentPage("Home");
      return;
    }
    preview?.setCurrentPage("Home");
    setOpen(false);
    scrollTemplateToTop();
  };

  return (
    <header
      className="relative z-[70] flex min-h-16 w-full items-center px-4 shadow-sm transition-all duration-500"
      style={
        {
          background: headerBackground,
          "--header-text": headerTextColor,
        } as React.CSSProperties
      }
    >
      <div className="flex w-full items-center justify-between gap-4">
        <Link
          href="#"
          onClick={handleLogoClick}
          className="relative shrink-0 text-(--header-text) transition-opacity duration-300 hover:opacity-80"
        >
          {data.logoImage ? (
            <EditorRemoteImage
              src={data.logoImage}
              alt={data.logoImageTitle ?? logo?.text ?? "Logo"}
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={data.logoImage}
              width={150}
              height={48}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span
              className="text-base font-bold sm:text-lg"
              data-editor-inline-format-key="header:logo"
            >
              <InlineRichText
                value={
                  (typeof data.logo === "string" && data.logo) ||
                  logo?.text ||
                  "Logo"
                }
                formatKey="header:logo"
              />
            </span>
          )}
        </Link>

        <nav className="hidden min-w-0 max-w-[min(100%,52rem)] flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1 overflow-hidden lg:flex lg:gap-x-4">
          {(menu?.items ?? []).map((item, itemIndex) => {
            const hasDropdown = !!item.children?.length;
            const isMega = item.menuType === "mega" && hasDropdown;
            const itemIsActive = isActive(item);
            const itemFormatKey = `block:menu:item:${itemIndex}:label`;

            return (
              <div key={`nav-${itemIndex}-${item.href}-${item.label}`} className="group/item relative z-[1] shrink-0 hover:z-[90] focus-within:z-[90]">
                <Link
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    if (
                      editorMode &&
                      (event.target as HTMLElement).closest(
                        "[data-editor-inline-format-key]",
                      )
                    ) {
                      return;
                    }
                    handlePageClick(event, item.href, item.label);
                  }}
                  aria-current={itemIsActive ? "page" : undefined}
                  data-editor-inline-format-key={itemFormatKey}
                  data-editor-inline-plain-text="true"
                  className="flex max-w-[9.5rem] items-center gap-1 truncate rounded-full px-2 py-1 text-sm text-(--header-text) transition-all duration-300 hover:bg-white/10 hover:opacity-90 lg:text-[15px]"
                  style={activeMenuStyleProps(itemIsActive)}
                >
                  <span className="inline-flex items-center">{item.label}</span>
                  {hasDropdown && (
                    <ChevronDown
                      size={15}
                      className="transition-transform duration-200 group-hover/item:rotate-180"
                    />
                  )}
                </Link>

                {hasDropdown && (
                  <div
                    className={`invisible absolute top-full z-[1000] pt-2 opacity-0 transition-all duration-200 group-hover/item:visible group-hover/item:opacity-100 group-focus-within/item:visible group-focus-within/item:opacity-100 ${
                      isMega
                        ? "left-1/2 w-[min(92vw,720px)] -translate-x-1/2"
                        : "left-0"
                    }`}
                  >
                    <div
                      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${
                        isMega
                          ? "grid max-h-[min(70vh,420px)] grid-cols-2 gap-1 overflow-y-auto p-3 sm:grid-cols-3"
                          : "max-h-[min(60vh,360px)] min-w-52 overflow-y-auto py-2"
                      }`}
                    >
                      {item.children?.map((child, childIndex) => {
                        const childFormatKey = `block:menu:item:${itemIndex}:child:${childIndex}:label`;
                        const childIsActive =
                          child.label.trim().toLowerCase() ===
                          activeLabel.trim().toLowerCase();

                        return (
                          <Link
                            key={`${child.label}-${childIndex}`}
                            href={child.href}
                            onClick={(event) => {
                              event.preventDefault();
                              if (
                                editorMode &&
                                (event.target as HTMLElement).closest(
                                  "[data-editor-inline-format-key]",
                                )
                              ) {
                                return;
                              }
                              handlePageClick(event, child.href, child.label);
                            }}
                            aria-current={childIsActive ? "page" : undefined}
                            data-editor-inline-format-key={childFormatKey}
                            data-editor-inline-plain-text="true"
                            className={`block text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100 ${
                              isMega
                                ? "rounded-lg px-3 py-3"
                                : "whitespace-nowrap px-4 py-2"
                            }`}
                            style={activeMenuStyleProps(childIsActive)}
                          >
                            <span className="inline-flex items-center font-medium">
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!!buttonBlocks.length && (
          <div className="hidden items-center gap-2 lg:flex">
            {buttonBlocks.map((button) => (
              <BlockRenderer
                key={button.id}
                block={button}
                className="rounded-md bg-(--primary-link-bg) px-4 py-2 text-sm font-medium text-(--primary-link-color) transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="cursor-pointer text-(--header-text) transition-opacity duration-300 hover:opacity-80 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="absolute left-0 top-16 z-[1000] w-full border-t px-4 py-4 shadow-lg animate-editor-fade lg:hidden"
          style={{ background: headerBackground }}
        >
          <nav className="flex flex-col gap-3">
            {(menu?.items ?? []).map((item, itemIndex) => {
              const hasDropdown = !!item.children?.length;
              const itemIsActive = isActive(item);
              const itemFormatKey = `block:menu:item:${itemIndex}:label`;

              return (
                <div key={`nav-m-${itemIndex}-${item.href}-${item.label}`} className="flex flex-col gap-2">
                  <Link
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault();
                      if (
                        editorMode &&
                        (event.target as HTMLElement).closest(
                          "[data-editor-inline-format-key]",
                        )
                      ) {
                        return;
                      }
                      handlePageClick(event, item.href, item.label);
                      setOpen(false);
                    }}
                    aria-current={itemIsActive ? "page" : undefined}
                    data-editor-inline-format-key={itemFormatKey}
                    data-editor-inline-plain-text="true"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-(--header-text)"
                    style={activeMenuStyleProps(itemIsActive)}
                  >
                    <span className="inline-flex items-center">{item.label}</span>
                    {hasDropdown && <ChevronDown size={15} />}
                  </Link>

                  {hasDropdown && (
                    <div className="ml-4 flex flex-col gap-1 border-l pl-3">
                      {item.children?.map((child, childIndex) => {
                        const childFormatKey = `block:menu:item:${itemIndex}:child:${childIndex}:label`;
                        const childIsActive =
                          child.label.trim().toLowerCase() ===
                          activeLabel.trim().toLowerCase();

                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={(event) => {
                              event.preventDefault();
                              if (
                                editorMode &&
                                (event.target as HTMLElement).closest(
                                  "[data-editor-inline-format-key]",
                                )
                              ) {
                                return;
                              }
                              handlePageClick(event, child.href, child.label);
                              setOpen(false);
                            }}
                            aria-current={childIsActive ? "page" : undefined}
                            data-editor-inline-format-key={childFormatKey}
                            data-editor-inline-plain-text="true"
                            className="rounded-lg px-3 py-2 text-sm text-(--header-text)/80"
                            style={activeMenuStyleProps(childIsActive)}
                          >
                            <span className="inline-flex items-center">
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {!!buttonBlocks.length &&
              buttonBlocks.map((button) => (
                <BlockRenderer
                  key={button.id}
                  block={button}
                  className="mt-2 inline-flex w-fit rounded-md bg-(--primary-link-bg) px-4 py-2 text-sm font-medium text-(--primary-link-color) transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                />
              ))}
          </nav>
        </div>
      )}
    </header>
  );
}
