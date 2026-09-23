"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CircleHelp,
  Eye,
  EyeOff,
  Flag,
  FilePenLine,
  Filter,
  ListTree,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import ImageLibraryPicker from "../layout/src/components/builder/ImageLibraryPicker";
import CustomSectionRichTextEditor from "../layout/src/components/sections/custom/CustomSectionRichTextEditor";
import {
  AiFieldButton,
  FieldLabelWithAi,
  useManagerAiFields,
} from "./managerAi";
import { resolveCountryFlagImage } from "@/lib/countryFlags";

type ManagerTab = "section" | "countries" | "listings";

export type CountryServeItem = {
  id: string;
  name: string;
  flagImage: string;
  flagAlt?: string;
  order?: number;
  active?: boolean;
};

export type CountryServeListing = {
  id: string;
  title: string;
  category: string;
  countryId: string;
  desc: string;
  content?: string;
  image: string;
  alt?: string;
  link?: string;
  slug?: string;
  order?: number;
  active?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

export type CountriesServeState = {
  pretitle: string;
  title: string;
  desc: string;
  /** When false, section + /country/{slug} stay hidden on the live site. */
  websiteEnabled?: boolean;
  countriesServeItems: CountryServeItem[];
  countriesServeListings: CountryServeListing[];
};

type CountriesServeManagerProps = {
  onClose: () => void;
  siteId?: string;
};

const LIST_PAGE_SIZE = 5;

const stripHtmlPreview = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const createListingSlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueListingSlug = (
  preferred: string,
  listings: CountryServeListing[],
  excludeId?: string | null,
) => {
  const base = preferred || "listing";
  const taken = new Set(
    listings
      .filter((item) => item.id !== excludeId)
      .map((item) =>
        (item.slug || createListingSlug(item.title) || "").toLowerCase(),
      )
      .filter(Boolean),
  );
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};

const emptyCountry = (order = 1): CountryServeItem => ({
  id: `country-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  flagImage: "",
  flagAlt: "",
  order,
  active: true,
});

const emptyListing = (
  order = 1,
  country?: CountryServeItem | null,
): CountryServeListing => ({
  id: `listing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  category: country?.name || "",
  countryId: country?.id || "",
  desc: "",
  content: "",
  image: "",
  alt: "",
  link: "",
  slug: "",
  order,
  active: true,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
});

const emptyState = (): CountriesServeState => ({
  pretitle: "Global reach",
  title: "Countries We Serve",
  desc: "Professional services across India and worldwide.",
  websiteEnabled: true,
  countriesServeItems: [],
  countriesServeListings: [],
});

const tabItems: Array<{
  id: ManagerTab;
  label: string;
  icon: typeof Flag;
}> = [
  { id: "listings", label: "Listings", icon: ListTree },
  { id: "countries", label: "Countries", icon: Flag },
  { id: "section", label: "Section", icon: FilePenLine },
];

export default function CountriesServeManager({
  onClose,
  siteId,
}: CountriesServeManagerProps) {
  const [activeTab, setActiveTab] = useState<ManagerTab>("listings");
  const [ready, setReady] = useState(false);
  const [pageState, setPageState] = useState<CountriesServeState>(emptyState);
  const [countrySearch, setCountrySearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingFilterCountryId, setListingFilterCountryId] = useState("all");
  const [listingVisibility, setListingVisibility] = useState<
    "all" | "visible" | "hidden"
  >("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [listPage, setListPage] = useState(1);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const [showCountryComposer, setShowCountryComposer] = useState(false);
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);
  const [countryDraft, setCountryDraft] = useState<CountryServeItem>(
    emptyCountry(),
  );
  const [showFlagPicker, setShowFlagPicker] = useState(false);
  const [countryToDelete, setCountryToDelete] =
    useState<CountryServeItem | null>(null);

  const [showListingComposer, setShowListingComposer] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [listingDraft, setListingDraft] = useState<CountryServeListing>(
    emptyListing(),
  );
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const { aiFieldBusy, generateText, generateImage, requireCorePlanForAi } =
    useManagerAiFields({
      siteId,
      kind: "country",
      getTitle: () => listingDraft.title,
      getItem: () => ({
        title: listingDraft.title,
        desc: listingDraft.desc,
        content: listingDraft.content,
        category: listingDraft.category,
      }),
      getExisting: (field) =>
        field === "summary"
          ? listingDraft.desc
          : field === "content"
            ? listingDraft.content
            : listingDraft.seoDescription,
      onSummary: (text) =>
        setListingDraft((current) => ({ ...current, desc: text })),
      onContent: (html) =>
        setListingDraft((current) => ({ ...current, content: html })),
      onSeo: (seo) =>
        setListingDraft((current) => ({
          ...current,
          seoTitle: seo.seoTitle || current.seoTitle,
          seoDescription: seo.seoDescription || current.seoDescription,
          seoKeywords: seo.seoKeywords || current.seoKeywords,
        })),
      onImage: (url) =>
        setListingDraft((current) => ({
          ...current,
          image: url,
          alt: current.alt || current.title,
        })),
      imageHintParts: () => [
        listingDraft.title,
        listingDraft.category,
        "country service",
      ],
      avoidImageSrcs: () => [listingDraft.image].filter(Boolean),
    });
  const [listingToDelete, setListingToDelete] =
    useState<CountryServeListing | null>(null);

  const websiteEnabled = pageState.websiteEnabled !== false;

  const persist = useCallback((next: CountriesServeState) => {
    setPageState(next);
    window.dispatchEvent(
      new CustomEvent("ai-builder-countries-serve-update", {
        detail: next,
      }),
    );
  }, []);

  const setWebsiteEnabled = (enabled: boolean) => {
    persist({ ...pageState, websiteEnabled: enabled });
  };

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<CountriesServeState>).detail;
      if (!detail) return;
      setPageState({
        pretitle: detail.pretitle || "",
        title: detail.title || "Countries We Serve",
        desc: detail.desc || "",
        websiteEnabled: detail.websiteEnabled !== false,
        countriesServeItems: Array.isArray(detail.countriesServeItems)
          ? detail.countriesServeItems.map((item, index) => {
              const name = item.name || "";
              const existingFlag = (item.flagImage || "").trim();
              return {
                id:
                  item.id ||
                  `country-${index}-${Math.random().toString(36).slice(2, 7)}`,
                name,
                flagImage: existingFlag || resolveCountryFlagImage(name),
                flagAlt: item.flagAlt || name,
                order: item.order ?? index + 1,
                active: item.active !== false,
              };
            })
          : [],
        countriesServeListings: Array.isArray(detail.countriesServeListings)
          ? detail.countriesServeListings.map((item, index) => ({
              id:
                item.id ||
                `listing-${index}-${Math.random().toString(36).slice(2, 7)}`,
              title: item.title || "",
              category: item.category || "",
              countryId: item.countryId || "",
              desc: item.desc || "",
              content: item.content || "",
              image: item.image || "",
              alt: item.alt || "",
              link: item.link || "",
              slug: item.slug || "",
              order: item.order ?? index + 1,
              active: item.active !== false,
              seoTitle: item.seoTitle || "",
              seoDescription: item.seoDescription || "",
              seoKeywords: item.seoKeywords || "",
            }))
          : [],
      });
      setReady(true);
    };

    window.addEventListener("ai-builder-countries-serve-state", handleState);
    window.dispatchEvent(new CustomEvent("ai-builder-ensure-countries-serve"));
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("ai-builder-countries-serve-query"));
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "ai-builder-countries-serve-state",
        handleState,
      );
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showContentEditor) {
        setShowContentEditor(false);
        return;
      }
      if (showFlagPicker || showImagePicker) {
        setShowFlagPicker(false);
        setShowImagePicker(false);
        return;
      }
      if (showCountryComposer) {
        setShowCountryComposer(false);
        return;
      }
      if (showListingComposer) {
        setShowListingComposer(false);
        return;
      }
      if (countryToDelete || listingToDelete) {
        setCountryToDelete(null);
        setListingToDelete(null);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    countryToDelete,
    listingToDelete,
    onClose,
    showContentEditor,
    showCountryComposer,
    showFlagPicker,
    showImagePicker,
    showListingComposer,
  ]);

  const sortedCountries = useMemo(
    () =>
      [...pageState.countriesServeItems].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [pageState.countriesServeItems],
  );

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return sortedCountries;
    return sortedCountries.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  }, [countrySearch, sortedCountries]);

  const filteredListings = useMemo(() => {
    const query = listingSearch.trim().toLowerCase();
    const countryName =
      sortedCountries.find((c) => c.id === listingFilterCountryId)?.name || "";
    return [...pageState.countriesServeListings]
      .filter((item) => {
        if (
          listingFilterCountryId !== "all" &&
          item.countryId !== listingFilterCountryId &&
          item.category !== countryName
        ) {
          return false;
        }
        if (listingVisibility === "visible" && item.active === false) {
          return false;
        }
        if (listingVisibility === "hidden" && item.active !== false) {
          return false;
        }
        if (!query) return true;
        return [item.title, item.category, item.desc, item.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return sortNewest ? orderB - orderA : orderA - orderB;
      });
  }, [
    listingFilterCountryId,
    listingSearch,
    listingVisibility,
    pageState.countriesServeListings,
    sortNewest,
    sortedCountries,
  ]);

  useEffect(() => {
    setListPage(1);
  }, [listingSearch, listingFilterCountryId, listingVisibility, sortNewest]);

  useEffect(() => {
    setSelectedListingIds((current) =>
      current.filter((id) =>
        pageState.countriesServeListings.some((item) => item.id === id),
      ),
    );
  }, [pageState.countriesServeListings]);

  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredListings.length / LIST_PAGE_SIZE),
  );
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedListings = useMemo(() => {
    const start = (safeListPage - 1) * LIST_PAGE_SIZE;
    return filteredListings.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredListings, safeListPage]);

  const nextCountryOrder = useMemo(() => {
    const maxOrder = pageState.countriesServeItems.reduce(
      (max, item) => Math.max(max, item.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [pageState.countriesServeItems]);

  const nextListingOrder = useMemo(() => {
    const maxOrder = pageState.countriesServeListings.reduce(
      (max, item) => Math.max(max, item.order ?? 0),
      0,
    );
    return maxOrder + 1;
  }, [pageState.countriesServeListings]);

  const openCreateCountry = () => {
    setEditingCountryId(null);
    setCountryDraft(emptyCountry(nextCountryOrder));
    setShowCountryComposer(true);
  };

  const openEditCountry = (item: CountryServeItem) => {
    const name = item.name || "";
    const flagImage =
      (item.flagImage || "").trim() || resolveCountryFlagImage(name);
    setEditingCountryId(item.id);
    setCountryDraft({
      ...emptyCountry(1),
      ...item,
      name,
      flagImage,
      flagAlt: item.flagAlt || name,
      active: item.active !== false,
    });
    setShowCountryComposer(true);
  };

  const saveCountry = () => {
    const name = countryDraft.name.trim();
    if (!name) return;
    const manualFlag = (countryDraft.flagImage || "").trim();
    const nextItem: CountryServeItem = {
      ...countryDraft,
      name,
      flagImage: manualFlag || resolveCountryFlagImage(name),
      flagAlt: (countryDraft.flagAlt || name).trim(),
      order: Math.max(1, Number(countryDraft.order) || 1),
      active: countryDraft.active !== false,
    };

    const nextCountries = editingCountryId
      ? pageState.countriesServeItems.map((item) =>
          item.id === editingCountryId ? nextItem : item,
        )
      : [...pageState.countriesServeItems, nextItem];

    // Keep listing category labels in sync when country is renamed.
    const nextListings = pageState.countriesServeListings.map((listing) => {
      if (listing.countryId !== nextItem.id) return listing;
      return { ...listing, category: nextItem.name };
    });

    persist({
      ...pageState,
      countriesServeItems: nextCountries,
      countriesServeListings: nextListings,
    });
    setShowCountryComposer(false);
    setEditingCountryId(null);
  };

  const confirmDeleteCountry = () => {
    if (!countryToDelete) return;
    persist({
      ...pageState,
      countriesServeItems: pageState.countriesServeItems.filter(
        (item) => item.id !== countryToDelete.id,
      ),
      countriesServeListings: pageState.countriesServeListings.filter(
        (item) =>
          item.countryId !== countryToDelete.id &&
          item.category !== countryToDelete.name,
      ),
    });
    setCountryToDelete(null);
  };

  const openCreateListing = () => {
    const preferred =
      sortedCountries.find((c) => c.id === listingFilterCountryId) ||
      sortedCountries[0] ||
      null;
    setEditingListingId(null);
    setListingDraft(emptyListing(nextListingOrder, preferred));
    setShowListingComposer(true);
  };

  const openEditListing = (item: CountryServeListing) => {
    setEditingListingId(item.id);
    setListingDraft({
      ...emptyListing(1),
      ...item,
      active: item.active !== false,
    });
    setShowListingComposer(true);
  };

  const saveListing = () => {
    const title = listingDraft.title.trim();
    if (!title) return;

    const country =
      sortedCountries.find((item) => item.id === listingDraft.countryId) ||
      sortedCountries.find(
        (item) =>
          item.name.toLowerCase() ===
          (listingDraft.category || "").trim().toLowerCase(),
      ) ||
      null;

    const slug = uniqueListingSlug(
      createListingSlug(listingDraft.slug || title) ||
        `listing-${Date.now()}`,
      pageState.countriesServeListings,
      editingListingId,
    );

    const nextItem: CountryServeListing = {
      ...listingDraft,
      title,
      countryId: country?.id || listingDraft.countryId || "",
      category: country?.name || listingDraft.category.trim() || "",
      desc: listingDraft.desc.trim(),
      content: listingDraft.content || "",
      image: listingDraft.image.trim(),
      alt: listingDraft.alt?.trim() || title,
      link:
        (listingDraft.link || "").trim() === "#"
          ? ""
          : (listingDraft.link || "").trim(),
      slug,
      order: Math.max(1, Number(listingDraft.order) || 1),
      active: listingDraft.active !== false,
      seoTitle: listingDraft.seoTitle?.trim() || title,
      seoDescription:
        listingDraft.seoDescription?.trim() || listingDraft.desc.trim(),
      seoKeywords: listingDraft.seoKeywords?.trim() || "",
    };

    const nextListings = editingListingId
      ? pageState.countriesServeListings.map((item) =>
          item.id === editingListingId ? nextItem : item,
        )
      : [...pageState.countriesServeListings, nextItem];

    persist({ ...pageState, countriesServeListings: nextListings });
    setShowListingComposer(false);
    setEditingListingId(null);
  };

  const confirmDeleteListing = () => {
    if (!listingToDelete) return;
    persist({
      ...pageState,
      countriesServeListings: pageState.countriesServeListings.filter(
        (item) => item.id !== listingToDelete.id,
      ),
    });
    setListingToDelete(null);
  };

  const toggleListingActive = (listing: CountryServeListing) => {
    persist({
      ...pageState,
      countriesServeListings: pageState.countriesServeListings.map((item) =>
        item.id === listing.id
          ? { ...item, active: item.active === false }
          : item,
      ),
    });
  };

  const toggleSelectedListing = (id: string) => {
    setSelectedListingIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const selectAllVisibleListings = () => {
    const visibleIds = pagedListings.map((item) => item.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedListingIds.includes(id));
    setSelectedListingIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  };

  const confirmBulkDeleteListings = () => {
    if (selectedListingIds.length === 0) return;
    const remove = new Set(selectedListingIds);
    persist({
      ...pageState,
      countriesServeListings: pageState.countriesServeListings.filter(
        (item) => !remove.has(item.id),
      ),
    });
    setSelectedListingIds([]);
    setBulkDeleteConfirm(false);
  };

  const countryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const country of sortedCountries) {
      map.set(country.id, country.name);
    }
    return map;
  }, [sortedCountries]);

  const content = (
    <div
      className="fixed inset-0 z-[10050] flex min-h-0 flex-col bg-white text-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="countries-serve-manager-title"
    >
      <header className="flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Countries
          </p>
          <h1 id="countries-serve-manager-title" className="sr-only">
            Countries We Serve manager
          </h1>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <label
            className={`flex max-w-full cursor-pointer items-center gap-2.5 rounded-full border px-3 py-1.5 sm:px-4 ${
              websiteEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <span className="hidden text-xs font-semibold sm:inline">
              Show on website
            </span>
            <span className="text-xs font-semibold sm:hidden">Website</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={websiteEnabled}
              onChange={(event) => setWebsiteEnabled(event.target.checked)}
            />
            <span
              aria-hidden="true"
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                websiteEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  websiteEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setActiveTab("section")}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Countries help"
          >
            <CircleHelp size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close countries manager"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {!websiteEnabled ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-900 sm:px-7">
          Countries are hidden on the live website. Listings stay saved here —{" "}
          the section and{" "}
          <span className="font-semibold">/country/…</span> links will stay off
          until you turn{" "}
          <span className="font-semibold">Show on website</span> on, then
          republish.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="w-[116px] shrink-0 border-r border-slate-200 bg-white p-2 sm:w-[148px] sm:p-3">
          <nav className="space-y-1" aria-label="Countries manager sections">
            {tabItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  activeTab === id
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-white">
          {!ready ? (
            <p className="px-5 py-8 text-sm text-slate-500 sm:px-8">
              Loading…
            </p>
          ) : null}

          {ready && activeTab === "section" ? (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-2xl space-y-5">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Section
                  </h2>
                  <p className="mt-2 text-base text-slate-600">
                    Heading and description above the country columns.
                  </p>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pretitle
                  </span>
                  <input
                    value={pageState.pretitle}
                    onChange={(event) =>
                      persist({ ...pageState, pretitle: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Heading
                  </span>
                  <input
                    value={pageState.title}
                    onChange={(event) =>
                      persist({ ...pageState, title: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </span>
                  <textarea
                    value={pageState.desc}
                    onChange={(event) =>
                      persist({ ...pageState, desc: event.target.value })
                    }
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {ready && activeTab === "countries" ? (
            <section className="px-5 py-7 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-4xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                      Countries
                    </h2>
                    <p className="mt-2 text-base text-slate-600">
                      Add countries with flags. Listings are managed in the
                      Listings tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateCountry}
                    className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    Add country
                  </button>
                </div>

                <div className="mt-7 flex max-w-[330px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4">
                  <Search size={17} className="text-slate-400" />
                  <input
                    value={countrySearch}
                    onChange={(event) => setCountrySearch(event.target.value)}
                    placeholder="Search countries"
                    className="h-10 w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {filteredCountries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        No countries yet
                      </p>
                      <button
                        type="button"
                        onClick={openCreateCountry}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
                      >
                        <Plus size={16} />
                        Add first country
                      </button>
                    </div>
                  ) : (
                    filteredCountries.map((country) => {
                      const count = pageState.countriesServeListings.filter(
                        (listing) =>
                          listing.countryId === country.id ||
                          listing.category === country.name,
                      ).length;
                      return (
                        <div
                          key={country.id}
                          className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="relative h-8 w-11 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                            {country.flagImage ? (
                              <Image
                                src={country.flagImage}
                                alt={country.flagAlt || country.name}
                                fill
                                className="object-cover"
                                unoptimized={
                                  country.flagImage.startsWith("data:") ||
                                  country.flagImage.includes("flagcdn.com")
                                }
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-950">
                              {country.name || "Untitled country"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {count} listing{count === 1 ? "" : "s"} · Order{" "}
                              {country.order ?? 1}
                              {country.active === false ? " · Inactive" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditCountry(country)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setCountryToDelete(country)}
                              className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {ready && activeTab === "listings" ? (
            <section>
              <div className="border-b border-slate-100 px-5 py-7 sm:px-8 lg:px-10">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                      Listings
                    </h2>
                    <p className="mt-2 text-base text-slate-600">
                      Create, manage and organize your country listings.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="AI Assist — generate country listings"
                      aria-label="AI Assist"
                      onClick={() => {
                        if (!requireCorePlanForAi()) return;
                        window.dispatchEvent(
                          new CustomEvent("ai-builder-open-ai-assist", {
                            detail: {
                              source: "countries-serve-manager",
                              hint: "add country listings",
                            },
                          }),
                        );
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition hover:bg-blue-100 hover:text-blue-800"
                    >
                      <Sparkles size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={openCreateListing}
                      disabled={sortedCountries.length === 0}
                      className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
                    >
                      <Plus size={17} /> New Listing
                    </button>
                  </div>
                </div>

                {sortedCountries.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Add at least one country first, then create listings.
                  </div>
                ) : null}

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex h-10 w-full max-w-[330px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <Search size={17} />
                    <input
                      value={listingSearch}
                      onChange={(event) =>
                        setListingSearch(event.target.value)
                      }
                      placeholder="Search by title"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
                    <label className="flex items-center gap-1.5">
                      <Filter size={15} />
                      <select
                        value={listingVisibility}
                        onChange={(event) =>
                          setListingVisibility(
                            event.target.value as
                              | "all"
                              | "visible"
                              | "hidden",
                          )
                        }
                        className="bg-transparent outline-none"
                      >
                        <option value="all">All listings</option>
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </label>
                    <span className="text-slate-300">|</span>
                    <select
                      value={listingFilterCountryId}
                      onChange={(event) =>
                        setListingFilterCountryId(event.target.value)
                      }
                      className="max-w-[160px] bg-transparent outline-none"
                    >
                      <option value="all">All countries</option>
                      {sortedCountries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSortNewest((value) => !value)}
                      className="transition hover:text-slate-950"
                    >
                      {sortNewest
                        ? "Order (high first)"
                        : "Order (low first)"}
                    </button>
                  </div>
                </div>
              </div>

              {selectedListingIds.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3 sm:px-8 lg:px-10">
                  <p className="text-sm font-semibold text-red-800">
                    {selectedListingIds.length} listing
                    {selectedListingIds.length === 1 ? "" : "s"} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedListingIds([])}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkDeleteConfirm(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <div className="min-w-[860px]">
                  <div className="grid grid-cols-[42px_minmax(280px,1fr)_120px_100px_140px] items-center border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={
                        pagedListings.length > 0 &&
                        pagedListings.every((item) =>
                          selectedListingIds.includes(item.id),
                        )
                      }
                      onChange={selectAllVisibleListings}
                      aria-label="Select all listings on this page"
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span>Listings ({filteredListings.length})</span>
                    <span>Status</span>
                    <span>Order</span>
                    <span className="text-right">Actions</span>
                  </div>

                  {pagedListings.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        No listings yet
                      </p>
                      <button
                        type="button"
                        onClick={openCreateListing}
                        disabled={sortedCountries.length === 0}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                      >
                        <Plus size={16} />
                        Add first listing
                      </button>
                    </div>
                  ) : (
                    pagedListings.map((listing) => {
                      const isHidden = listing.active === false;
                      const countryLabel =
                        countryNameById.get(listing.countryId) ||
                        listing.category ||
                        "Unassigned";
                      return (
                        <div
                          key={listing.id}
                          className="grid min-h-[108px] grid-cols-[42px_minmax(280px,1fr)_120px_100px_140px] items-center border-b border-slate-200 px-6 py-4"
                        >
                          <input
                            type="checkbox"
                            checked={selectedListingIds.includes(listing.id)}
                            onChange={() => toggleSelectedListing(listing.id)}
                            aria-label={`Select ${listing.title || "listing"}`}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                              {listing.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={listing.image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {listing.title || "Untitled listing"}
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-500">
                                {countryLabel}
                                {listing.slug ? ` · /${listing.slug}` : ""}
                              </p>
                            </div>
                          </div>
                          <div>
                            <span
                              className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                                isHidden
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {isHidden ? "Hidden" : "Published"}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">
                            {listing.order ?? 1}
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditListing(listing)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Edit ${listing.title || "listing"}`}
                              title="Edit listing"
                            >
                              <FilePenLine size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleListingActive(listing)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={
                                isHidden
                                  ? `Show ${listing.title || "listing"}`
                                  : `Hide ${listing.title || "listing"}`
                              }
                              title={
                                isHidden ? "Show listing" : "Hide listing"
                              }
                            >
                              {isHidden ? (
                                <Eye size={16} />
                              ) : (
                                <EyeOff size={16} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setListingToDelete(listing)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label={`Delete ${listing.title || "listing"}`}
                              title="Delete listing"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {listTotalPages > 1 ? (
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 text-sm sm:px-8">
                  <button
                    type="button"
                    disabled={safeListPage <= 1}
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-slate-500">
                    {safeListPage} / {listTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safeListPage >= listTotalPages}
                    onClick={() =>
                      setListPage((p) => Math.min(listTotalPages, p + 1))
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
        </main>
      </div>

      {showCountryComposer
        ? createPortal(
            <div
              className="fixed inset-0 z-[10060] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setShowCountryComposer(false);
                }
              }}
            >
              <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                      {editingCountryId ? "Edit country" : "New country"}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-950">
                      Country & flag
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCountryComposer(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Country name
                    </span>
                    <input
                      value={countryDraft.name}
                      onChange={(event) => {
                        const name = event.target.value;
                        setCountryDraft((current) => {
                          const previousAuto =
                            resolveCountryFlagImage(current.name) || "";
                          const hadManualFlag =
                            Boolean(current.flagImage) &&
                            current.flagImage !== previousAuto;
                          return {
                            ...current,
                            name,
                            flagImage: hadManualFlag
                              ? current.flagImage
                              : resolveCountryFlagImage(name) ||
                                current.flagImage,
                            flagAlt: hadManualFlag
                              ? current.flagAlt
                              : name.trim() || current.flagAlt,
                          };
                        });
                      }}
                      className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="India"
                      autoFocus
                    />
                  </label>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Flag image
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-14 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                        {countryDraft.flagImage ? (
                          <Image
                            src={countryDraft.flagImage}
                            alt={countryDraft.flagAlt || countryDraft.name || "Flag"}
                            fill
                            className="object-cover"
                            unoptimized={
                              countryDraft.flagImage.startsWith("data:") ||
                              countryDraft.flagImage.includes("flagcdn.com")
                            }
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFlagPicker(true)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {countryDraft.flagImage ? "Change flag" : "Choose flag"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Order
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={countryDraft.order ?? 1}
                        onChange={(event) =>
                          setCountryDraft((current) => ({
                            ...current,
                            order: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                    <div>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCountryDraft((current) => ({
                              ...current,
                              active: true,
                            }))
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
                            countryDraft.active !== false
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Eye size={14} />
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCountryDraft((current) => ({
                              ...current,
                              active: false,
                            }))
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
                            countryDraft.active === false
                              ? "bg-slate-800 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <EyeOff size={14} />
                          Off
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCountryComposer(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveCountry}
                    disabled={!countryDraft.name.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  >
                    {editingCountryId ? "Save country" : "Add country"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showListingComposer
        ? createPortal(
            <div
              className="fixed inset-0 z-[10060] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setShowListingComposer(false);
                }
              }}
            >
              <div className="my-auto max-h-[calc(100dvh-2rem)] w-[min(96vw,920px)] overflow-y-auto rounded-3xl bg-white shadow-2xl">
                <header className="relative border-b border-slate-200 bg-slate-100 px-14 py-4 text-center">
                  <h3 className="text-2xl font-medium text-slate-950">
                    {editingListingId ? "Edit listing" : "Create new listing"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowListingComposer(false)}
                    className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-white"
                  >
                    <X size={18} />
                  </button>
                </header>

                <div className="mx-auto w-full max-w-[820px] space-y-5 px-6 py-7">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Title
                    </span>
                    <input
                      value={listingDraft.title}
                      onChange={(event) =>
                        setListingDraft((current) => ({
                          ...current,
                          title: event.target.value,
                          slug:
                            !current.slug ||
                            current.slug === createListingSlug(current.title)
                              ? createListingSlug(event.target.value)
                              : current.slug,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Logo Design in Delhi"
                      autoFocus
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      URL slug
                    </span>
                    <input
                      value={listingDraft.slug || ""}
                      onChange={(event) =>
                        setListingDraft((current) => ({
                          ...current,
                          slug: createListingSlug(event.target.value),
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="logo-design-delhi"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Detail page: /country/
                      {listingDraft.slug || "your-slug"}
                    </p>
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">
                        Country
                      </span>
                      <select
                        value={listingDraft.countryId || ""}
                        onChange={(event) => {
                          const country = sortedCountries.find(
                            (item) => item.id === event.target.value,
                          );
                          setListingDraft((current) => ({
                            ...current,
                            countryId: event.target.value,
                            category: country?.name || current.category,
                          }));
                        }}
                        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="" disabled>
                          Select country
                        </option>
                        {sortedCountries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-800">
                        Order
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={listingDraft.order ?? 1}
                        onChange={(event) =>
                          setListingDraft((current) => ({
                            ...current,
                            order: Math.max(
                              1,
                              Number(event.target.value) || 1,
                            ),
                          }))
                        }
                        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Status
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setListingDraft((current) => ({
                            ...current,
                            active: true,
                          }))
                        }
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                          listingDraft.active !== false
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Eye size={15} />
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setListingDraft((current) => ({
                            ...current,
                            active: false,
                          }))
                        }
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                          listingDraft.active === false
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <EyeOff size={15} />
                        Inactive
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <FieldLabelWithAi
                      label="Short description"
                      aiTitle="AI generate short description"
                      aiLoading={aiFieldBusy === "summary"}
                      onAiClick={() => generateText("summary")}
                    />
                    <textarea
                      value={listingDraft.desc}
                      onChange={(event) =>
                        setListingDraft((current) => ({
                          ...current,
                          desc: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Short summary for this listing"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800">
                      Link (optional)
                    </span>
                    <input
                      value={listingDraft.link || ""}
                      onChange={(event) =>
                        setListingDraft((current) => ({
                          ...current,
                          link: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                      placeholder="# or https://…"
                    />
                  </label>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">
                        Content
                      </span>
                      <div className="flex items-center gap-2">
                        <AiFieldButton
                          title="AI generate content"
                          loading={aiFieldBusy === "content"}
                          onClick={() => generateText("content")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowContentEditor(true)}
                          className="text-xs font-semibold text-blue-600"
                        >
                          Open editor
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowContentEditor(true)}
                      className="min-h-[72px] w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-left hover:border-blue-400"
                    >
                      {(listingDraft.content || "").trim() ? (
                        <div
                          className="line-clamp-2 prose prose-sm max-w-none text-slate-800 [&_p]:my-0"
                          dangerouslySetInnerHTML={{
                            __html: listingDraft.content || "",
                          }}
                        />
                      ) : (
                        <p className="text-sm text-slate-400">
                          Write full listing content… Click to open the rich
                          text editor.
                        </p>
                      )}
                      {(listingDraft.content || "").trim() ? (
                        <p className="mt-1.5 text-xs font-medium text-slate-500">
                          {
                            stripHtmlPreview(listingDraft.content || "")
                              .split(/\s+/)
                              .filter(Boolean).length
                          }{" "}
                          words · Click to edit
                        </p>
                      ) : null}
                    </button>
                  </div>

                  <div>
                    <FieldLabelWithAi
                      label="Image"
                      aiTitle="AI generate image"
                      aiLoading={aiFieldBusy === "image"}
                      onAiClick={() => generateImage()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowImagePicker(true)}
                      className="group relative grid h-[102px] w-[102px] place-items-center overflow-hidden rounded-md border border-dashed border-slate-500 bg-slate-50 text-slate-600 hover:border-blue-500"
                    >
                      {listingDraft.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={listingDraft.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-1 text-center text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100">
                            Change
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-1 text-sm">
                          <Plus size={22} />
                          Image
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Listing SEO
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Optional meta for this country listing.
                        </p>
                      </div>
                      <AiFieldButton
                        title="AI generate SEO meta"
                        loading={aiFieldBusy === "seo"}
                        onClick={() => generateText("seo")}
                      />
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                          SEO title
                        </span>
                        <input
                          value={listingDraft.seoTitle || ""}
                          onChange={(event) =>
                            setListingDraft((current) => ({
                              ...current,
                              seoTitle: event.target.value,
                            }))
                          }
                          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none"
                          placeholder="Defaults to listing title"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                          SEO description
                        </span>
                        <textarea
                          value={listingDraft.seoDescription || ""}
                          onChange={(event) =>
                            setListingDraft((current) => ({
                              ...current,
                              seoDescription: event.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                          SEO keywords
                        </span>
                        <input
                          value={listingDraft.seoKeywords || ""}
                          onChange={(event) =>
                            setListingDraft((current) => ({
                              ...current,
                              seoKeywords: event.target.value,
                            }))
                          }
                          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none"
                          placeholder="logo design, delhi, …"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowListingComposer(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveListing}
                      disabled={
                        !listingDraft.title.trim() || !listingDraft.countryId
                      }
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      {editingListingId ? "Save changes" : "Add listing"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <ImageLibraryPicker
        open={showFlagPicker}
        title="Country flag"
        initialValue={countryDraft.flagImage}
        onClose={() => setShowFlagPicker(false)}
        onSelect={(source, fileName) => {
          setCountryDraft((current) => ({
            ...current,
            flagImage: source,
            flagAlt: fileName || current.flagAlt || current.name,
          }));
          setShowFlagPicker(false);
        }}
      />

      <ImageLibraryPicker
        open={showImagePicker}
        title="Listing image"
        initialValue={listingDraft.image}
        onClose={() => setShowImagePicker(false)}
        onSelect={(source, fileName) => {
          setListingDraft((current) => ({
            ...current,
            image: source,
            alt: fileName || current.alt || current.title,
          }));
          setShowImagePicker(false);
        }}
      />

      {showContentEditor
        ? createPortal(
            <CustomSectionRichTextEditor
              open
              initialValue={listingDraft.content || ""}
              placeholder="Write the complete listing content..."
              overlayClassName="z-[10120]"
              onClose={() => setShowContentEditor(false)}
              onSave={(html) => {
                setListingDraft((current) => ({ ...current, content: html }));
                setShowContentEditor(false);
              }}
            />,
            document.body,
          )
        : null}

      {countryToDelete ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete country
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              Delete &quot;{countryToDelete.name}&quot; and its listings?
            </h3>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={confirmDeleteCountry}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setCountryToDelete(null)}
                className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkDeleteConfirm && selectedListingIds.length > 0 ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-listings-title"
            className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete listings
            </p>
            <h3
              id="bulk-delete-listings-title"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Delete {selectedListingIds.length} selected listing
              {selectedListingIds.length === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes them from Countries We Serve. You can’t undo this.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={confirmBulkDeleteListings}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {listingToDelete ? (
        <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Delete listing
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              Delete &quot;{listingToDelete.title}&quot;?
            </h3>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={confirmDeleteListing}
                className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return createPortal(content, document.body);
}
