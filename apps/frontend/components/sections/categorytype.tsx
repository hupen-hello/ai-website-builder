"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  FileText,
  ShoppingCart,
  Home,
  GraduationCap,
  Heart,
  ShoppingBag,
  Gamepad2,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  fetchOnboardingCategories,
  filterOnboardingCategories,
  preferCategoriesWithContent,
  type OnboardingCategory,
} from "@/lib/onboardingCategories";
import type { OnboardingWebsiteRelated } from "@/lib/onboardingDraft";
import {
  getCategoriesForOnboarding,
  getTemplatesForCategory,
} from "@/app/editor/layout/src/data/templateFlow";

const ICON_BY_KEY: Record<string, LucideIcon> = {
  business: Briefcase,
  portfolio: FileText,
  ecommerce: ShoppingCart,
  realestate: Home,
  school: GraduationCap,
  hospitals: Heart,
  hospital: Heart,
  fashion: ShoppingBag,
  games: Gamepad2,
  financial: Briefcase,
  briefcase: Briefcase,
  home: Home,
  house: Home,
  "graduation-cap": GraduationCap,
  "badge-check": Briefcase,
  hammer: Briefcase,
  "calendar-days": Briefcase,
  sparkles: Heart,
  "heart-pulse": Heart,
  plane: Briefcase,
  landmark: Briefcase,
  car: Briefcase,
  "paw-print": Heart,
  ellipsis: Briefcase,
};

function resolveIcon(name: string, icon?: string | null): LucideIcon {
  const raw = (icon || name || "").toLowerCase();
  const cleaned = raw
    .replace(/^lucide[:\-]?/, "")
    .replace(/\s+/g, "")
    .replace(/_/g, "-");
  return ICON_BY_KEY[cleaned] || ICON_BY_KEY[name.toLowerCase()] || Briefcase;
}

type CategoryCard = {
  title: string;
  desc: string;
  icon: LucideIcon;
  slug: string;
};

function toCards(categories: OnboardingCategory[]): CategoryCard[] {
  return categories.map((cat) => ({
    title: cat.name,
    slug: cat.slug,
    desc:
      cat.description?.trim() || `Build a ${cat.name.toLowerCase()} website`,
    icon: resolveIcon(cat.name, cat.icon),
  }));
}

type CategoryTypeProps = {
  selectedCategory: string;
  websiteRelated?: OnboardingWebsiteRelated | "";
  onCategoryChange: (category: string) => void;
  createPath?: "create-ai" | "create-custom" | "";
};

export default function CategoryType({
  selectedCategory,
  websiteRelated = "",
  onCategoryChange,
  createPath = "",
}: CategoryTypeProps) {
  const [selected, setSelected] = useState(selectedCategory);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiCategories, setApiCategories] = useState<OnboardingCategory[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastAutoResetKey = useRef("");

  useEffect(() => {
    setSelected(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      const remote = await fetchOnboardingCategories(controller.signal);
      if (cancelled) return;

      if (remote.length > 0) {
        setApiCategories(remote);
      } else {
        // Fallback if API is down: keep template-content categories.
        setApiCategories(
          getCategoriesForOnboarding().map((cat, index) => ({
            id: cat.slug || cat.name,
            order: index + 1,
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase(),
            icon: cat.icon,
            description: cat.description,
            status: "Active",
          })),
        );
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const relatedCategories = useMemo(() => {
    // Filter by website type (NGO / products / …). Create-AI skips template/theme shrink only.
    const related = filterOnboardingCategories(apiCategories, websiteRelated);
    if (createPath === "create-ai") {
      return related;
    }
    const contentWithThemes = getCategoriesForOnboarding()
      .filter((cat) => getTemplatesForCategory(cat.name).length > 0)
      .map((cat) => ({
        name: cat.name,
        slug: cat.slug,
      }));
    return preferCategoriesWithContent(related, contentWithThemes);
  }, [apiCategories, websiteRelated, createPath]);

  const availableTypes = useMemo(
    () => toCards(relatedCategories),
    [relatedCategories],
  );

  // When site-type changes, keep selection only if it still belongs in the list.
  useEffect(() => {
    if (loading || availableTypes.length === 0) return;
    const key = `${websiteRelated}::${availableTypes.map((item) => item.title).join("|")}`;
    if (lastAutoResetKey.current === key) return;
    lastAutoResetKey.current = key;

    const stillValid = availableTypes.some((item) => item.title === selected);
    if (!stillValid) {
      const next = availableTypes[0]?.title || "";
      setSelected(next);
      onCategoryChange(next);
    }
  }, [availableTypes, loading, onCategoryChange, selected, websiteRelated]);

  const filteredTypes = useMemo(() => {
    if (!search.trim()) return availableTypes;
    const query = search.toLowerCase();
    return availableTypes.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query),
    );
  }, [search, availableTypes]);

  const handleSelect = (title: string) => {
    setSelected(title);
    onCategoryChange(title);
    setOpen(false);
  };

  const handleAllItems = () => {
    setSelected("");
    onCategoryChange("");
    setSearch("");
    setOpen(false);
  };

  const dropdownLabel = selected || "Popular Categories";

  return (
    <div className="w-full">
      <section className="onboarding-responsive-scroll relative mx-auto w-full overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(23,38,76,.08)]">
        <div className="flex max-h-[calc(100dvh-156px)] flex-col px-4 py-5 sm:px-6 lg:max-h-none lg:px-7 lg:py-6 2xl:px-9">
          <div className="flex shrink-0 items-start gap-3 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-xl font-semibold tracking-[-.035em] text-[#08132f] sm:text-2xl">
                Choose your website category
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {createPath === "create-ai"
                  ? "Categories match your website type. AI builds from your details — no template picking."
                  : "Select the closest match, then choose a custom template."}
              </p>
            </div>
          </div>

          <div className="relative z-20 mt-5 flex shrink-0 flex-col gap-3 md:flex-row">
            <div className="relative flex flex-1 items-center">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search for a category (e.g., Realestate, Education)..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-sm text-[#08132f] outline-none transition placeholder:text-slate-400 focus:border-[#315ff4] focus:ring-3 focus:ring-blue-100/70"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#315ff4] sm:right-5"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div ref={dropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex h-11 w-full cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 text-sm font-medium transition md:w-[210px] ${
                  open
                    ? "border-[#315ff4] bg-blue-50 text-[#315ff4] ring-3 ring-blue-100/70"
                    : "border-slate-200 bg-white text-[#08132f] hover:border-blue-300"
                }`}
              >
                <span className="truncate">{dropdownLabel}</span>
                {open ? (
                  <ChevronUp className="shrink-0" size={16} />
                ) : (
                  <ChevronDown className="shrink-0" size={16} />
                )}
              </button>

              {open && (
                <div className="absolute right-0 z-[80] mt-2 max-h-[min(20rem,50vh)] w-full overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-2 shadow-[0_18px_45px_rgba(25,60,150,.16)] md:w-[240px]">
                  <button
                    type="button"
                    onClick={handleAllItems}
                    className={`block w-full px-5 py-2 text-left text-sm transition hover:bg-blue-50 hover:text-[#315ff4] ${
                      selected === ""
                        ? "bg-blue-50 font-bold text-[#315ff4]"
                        : "font-semibold text-slate-900"
                    }`}
                  >
                    All Items
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {availableTypes.map((item) => (
                    <button
                      key={item.slug || item.title}
                      type="button"
                      onClick={() => handleSelect(item.title)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-2 text-left text-sm transition hover:bg-blue-50 hover:text-[#315ff4] ${
                        selected === item.title
                          ? "bg-blue-50 font-bold text-[#315ff4]"
                          : "text-slate-700"
                      }`}
                    >
                      <span>{item.title}</span>
                      {selected === item.title && (
                        <Check size={14} strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 min-h-0 flex-1 px-1 pt-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin text-[#315ff4]" />
                Loading categories…
              </div>
            ) : (
              <>
                {/* 4 per row, 2 rows visible — remaining categories scroll inside */}
                <div className="max-h-[calc((90px*2)+0.75rem)] overflow-x-hidden overflow-y-auto overscroll-contain pr-1 sm:max-h-[calc((96px*2)+1rem)]">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    {filteredTypes.map((item) => {
                      const Icon = item.icon;
                      const isActive = selected === item.title;

                      return (
                        <button
                          key={item.slug || item.title}
                          type="button"
                          onClick={() => handleSelect(item.title)}
                          className={`group relative h-[90px] cursor-pointer overflow-hidden rounded-lg border p-4 text-left transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(49,95,244,.1)] sm:h-24 ${
                            isActive
                              ? "border-[#315ff4] bg-blue-50/50 text-[#08132f] shadow-[0_8px_24px_rgba(49,95,244,.1)] ring-1 ring-[#315ff4]"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute right-3 top-3 z-10 flex size-5 items-center justify-center rounded-full bg-[#315ff4] text-white shadow">
                              <Check size={15} />
                            </span>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-base font-semibold text-[#08132f]">
                              {item.title}
                            </h3>

                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-8 sm:w-8 ${
                                isActive
                                  ? "bg-white text-[#315ff4] shadow-sm"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              <Icon size={14} />
                            </div>
                          </div>

                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                            {item.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredTypes.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No category found
                    {websiteRelated ? " for this website type" : ""}.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
