"use client";

import { useMemo, useState } from "react";
import {
  HEADER_MENU_LIMIT,
  footerSelectionKey,
  getThemeFooterCatalog,
  getThemeMenuCatalog,
} from "@/lib/onboardingPages";
import type { OnboardingBusinessInfo } from "@/lib/onboardingDraft";

type PageSelectionProps = {
  templateId: string | null;
  pageType: OnboardingBusinessInfo["pageType"];
  selectedPages: string[];
  onChange: (pages: string[]) => void;
};

const selectionKey = (location: "header" | "footer", pageId: string) =>
  `${location}:${pageId}`;

export default function PageSelection({
  templateId,
  pageType,
  selectedPages,
  onChange,
}: PageSelectionProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const headerMenuItems = useMemo(
    () => getThemeMenuCatalog(templateId, pageType),
    [templateId, pageType],
  );
  const footerColumns = useMemo(
    () => getThemeFooterCatalog(templateId, pageType),
    [templateId, pageType],
  );

  const selectedHeaderCount = headerMenuItems.filter((item) =>
    selectedPages.includes(selectionKey("header", item.id)),
  ).length;

  const togglePage = (pageId: string) => {
    if (selectedPages.includes(pageId)) {
      onChange(selectedPages.filter((id) => id !== pageId));
      return;
    }
    const isTopLevelHeader = headerMenuItems.some(
      (item) => selectionKey("header", item.id) === pageId,
    );
    if (
      isTopLevelHeader &&
      selectedHeaderCount >= HEADER_MENU_LIMIT &&
      pageId !== "header:home"
    ) {
      return;
    }
    onChange([...selectedPages, pageId]);
  };

  return (
    <div className="w-full">
      <section className="onboarding-responsive-scroll relative mx-auto max-h-[calc(100dvh-156px)] w-full overflow-x-hidden overflow-y-auto rounded-[18px] border border-[#dce4f2] bg-[#fbfcff] shadow-[0_22px_70px_rgba(0,10,27,.08)] lg:max-h-none lg:overflow-visible">
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6 2xl:px-10">
          <div className="border-b border-[#e4e9f2] pb-5 text-center">
            <h2 className="text-2xl font-semibold leading-tight tracking-[-.025em] text-[#000a1b]">
              Choose pages for your website
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#526079]">
              Only pages available in your selected theme are listed. Pick what
              should appear in the header menu and footer.
            </p>
          </div>

          <div className="pt-5">
            <div className="flex items-end justify-between gap-3">
              <SectionTitle>Header menu</SectionTitle>
              <p className="text-[11px] font-medium text-[#526079]">
                {selectedHeaderCount} of {HEADER_MENU_LIMIT} used
              </p>
            </div>

            <nav
              aria-label="Header menu page selection"
              className="mt-3 grid min-w-0 grid-cols-2 gap-3 overflow-visible pb-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            >
              {headerMenuItems.map((item) => {
                const pageId = selectionKey("header", item.id);
                const isSelected = selectedPages.includes(pageId);
                const isOpen = openDropdown === item.id;
                const hasDropdown = Boolean(item.dropdown?.length);
                const headerFull =
                  !isSelected &&
                  selectedHeaderCount >= HEADER_MENU_LIMIT &&
                  item.id !== "home";
                const hasSelectedDropdownItem =
                  item.dropdown?.some((option) =>
                    selectedPages.includes(selectionKey("header", option.id)),
                  ) ?? false;

                return (
                  <div key={item.id} className="relative min-w-0">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      disabled={item.id === "home" || headerFull}
                      onClick={() => {
                        if (item.id === "home" || headerFull) return;
                        togglePage(pageId);
                        if (isSelected && isOpen) setOpenDropdown(null);
                      }}
                      className={`relative flex h-[60px] w-full items-center justify-center rounded-xl border px-4 text-center transition duration-200 ${
                        hasDropdown ? "pr-14" : ""
                      } ${
                        isSelected
                          ? "border-[#053bee] bg-[#f0f4ff] text-[#053bee] shadow-[0_4px_14px_rgba(5,59,238,.06)]"
                          : "border-[#ccd8ef] bg-white text-[#000a1b] hover:border-[#ccd8ef] hover:bg-white hover:text-[#053bee]"
                      } ${item.id === "home" ? "cursor-default" : ""}`}
                    >
                      <span className="max-w-full truncate text-sm font-medium leading-none">
                        {item.label}
                      </span>
                    </button>

                    {hasDropdown && (
                      <>
                        <button
                          type="button"
                          disabled={!isSelected}
                          aria-expanded={isOpen}
                          aria-label={`Choose ${item.label} dropdown pages`}
                          onClick={() =>
                            setOpenDropdown(isOpen ? null : item.id)
                          }
                          className={`absolute right-3 top-1/2 z-10 grid size-6 -translate-y-1/2 place-items-center rounded-full text-white transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#053bee] focus-visible:ring-offset-2 ${
                            !isSelected
                              ? "cursor-not-allowed bg-[#d5dceb] shadow-none"
                              : hasSelectedDropdownItem
                                ? "bg-[#053bee] shadow-[0_6px_16px_rgba(5,59,238,.24)] hover:scale-105 hover:bg-[#053bee]"
                                : "bg-[#aebce0] shadow-[0_4px_12px_rgba(100,116,160,.14)] hover:scale-105 hover:bg-[#053bee]"
                          } ${isOpen ? "rotate-45" : ""}`}
                        >
                          <span className="absolute h-px w-2 bg-current" />
                          <span className="absolute h-2 w-px bg-current" />
                        </button>

                        {isOpen && (
                          <div className="absolute left-1/2 top-[76px] z-30 w-52 -translate-x-1/2 rounded-xl border border-[#dce4f2] bg-white p-2.5 text-sm text-black shadow-[0_18px_45px_rgba(0,10,27,.16)]">
                            {item.dropdown.map((option) => {
                              const optionId = selectionKey(
                                "header",
                                option.id,
                              );
                              return (
                                <SelectionLink
                                  key={option.id}
                                  label={option.label}
                                  selected={selectedPages.includes(optionId)}
                                  onClick={() => togglePage(optionId)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </nav>

            {headerMenuItems.length <= 1 && (
              <p className="mt-3 text-xs text-slate-500">
                This theme has limited menu sections. Pick another theme if you
                need more pages.
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-[#e4e9f2] pt-5">
            <SectionTitle>Footer links</SectionTitle>

            <div
              className={`mt-3 grid gap-3 sm:grid-cols-2 ${
                footerColumns.length >= 5
                  ? "lg:grid-cols-5"
                  : footerColumns.length === 4
                    ? "lg:grid-cols-4"
                    : "lg:grid-cols-3"
              }`}
            >
              {footerColumns.map((column) => (
                <FooterGroup key={column.id} title={column.title}>
                  {column.links.map((link) => {
                    const key = footerSelectionKey(column.id, link.id);
                    return (
                      <SelectionLink
                        key={key}
                        label={link.label}
                        selected={selectedPages.includes(key)}
                        onClick={() => togglePage(key)}
                      />
                    );
                  })}
                </FooterGroup>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[.12em] text-[#053bee]">
      {children}
    </h3>
  );
}

function FooterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-[150px] rounded-xl border border-[#dce4f2] bg-white px-4 py-4 shadow-[0_6px_22px_rgba(0,10,27,.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#bdcbe3] hover:shadow-[0_10px_28px_rgba(0,10,27,.06)]">
      <h4 className="mb-2.5 border-b border-[#edf0f5] pb-2.5 text-xs font-semibold leading-none text-[#000a1b]">
        {title}
      </h4>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function SelectionLink({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group mb-1 flex min-h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 text-left !text-[16px] leading-none transition hover:bg-[#f0f4ff] hover:text-[#053bee] ${
        selected ? "bg-[#f0f4ff] font-medium text-[#053bee]" : "text-[#000a1b]"
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span
        className={`grid size-3.5 shrink-0 place-items-center rounded border transition ${
          selected
            ? "border-[#053bee] bg-[#285aff] text-white"
            : "border-[#9aa6b9] bg-white group-hover:border-[#053bee]"
        }`}
        aria-hidden="true"
      >
        {selected && (
          <svg
            viewBox="0 0 12 12"
            className="size-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m2.25 6.25 2.2 2.2 5.3-5.3" />
          </svg>
        )}
      </span>
    </button>
  );
}
