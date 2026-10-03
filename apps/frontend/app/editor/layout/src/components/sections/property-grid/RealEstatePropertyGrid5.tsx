"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type PropertyItem = {
  id?: string;
  title?: string;
  price?: string;
  location?: string;
  address?: string;
  image?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  rating?: string;
  category?: string;
};

const IMG = "/categories/realestate/template5";

const defaultProperties: PropertyItem[] = [
  {
    id: "modern-villa",
    title: "Modern Villa",
    price: "$1,200,000",
    location: "New York",
    address: "10765 Hillshire Ave, Baton Rouge, LA 70810, USA",
    image: `${IMG}/kitchen_reno.png`,
    beds: 4,
    baths: 3,
    sqft: 3500,
    rating: "5.0(30)",
    category: "Residential",
  },
  {
    id: "luxury-apartment",
    title: "Luxury Apartment",
    price: "$850,000",
    location: "Los Angeles",
    address: "10765 Hillshire Ave, Baton Rouge, LA 70810, USA",
    image: `${IMG}/bathroom_reno.png`,
    beds: 3,
    baths: 2,
    sqft: 2100,
    rating: "5.0(30)",
    category: "Residential",
  },
  {
    id: "cozy-cottage",
    title: "Cozy Cottage",
    price: "$450,000",
    location: "Austin",
    address: "10765 Hillshire Ave, Baton Rouge, LA 70810, USA",
    image: `${IMG}/office_reno.png`,
    beds: 2,
    baths: 1,
    sqft: 1200,
    rating: "5.0(30)",
    category: "Residential",
  },
  {
    id: "penthouse-suite",
    title: "Penthouse Suite",
    price: "$2,500,000",
    location: "Miami",
    address: "10765 Hillshire Ave, Baton Rouge, LA 70810, USA",
    image: `${IMG}/outdoors_reno.png`,
    beds: 5,
    baths: 4,
    sqft: 5000,
    rating: "5.0(30)",
    category: "Residential",
  },
  {
    id: "suburban-home",
    title: "Suburban Home",
    price: "$600,000",
    location: "Chicago",
    address: "10765 Hillshire Ave, Baton Rouge, LA 70810, USA",
    image: `${IMG}/hero_worker.png`,
    beds: 4,
    baths: 2.5,
    sqft: 2800,
    rating: "5.0(30)",
    category: "Residential",
  },
];

export default function RealEstatePropertyGrid5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const searchLabel = String(data.searchLabel || "Search Properties");
  const searchPlaceholder = String(data.searchPlaceholder || "Search...");
  const categoryLabel = String(data.categoryLabel || "Categories");
  const locationLabel = String(data.locationLabel || "Location");
  const buttonText = String(data.buttonText || "Apply Now");
  const priceLabel = String(data.priceLabel || "Price");
  const ratingLabel = String(data.ratingLabel || "Rating");
  const bedsLabel = String(data.bedsLabel || "Beds");
  const bathsLabel = String(data.bathsLabel || "Baths");
  const sqftSuffix = String(data.sqftSuffix || "sqf");
  const detailBase = String(data.detailBasePath || "/properties").replace(
    /\/$/,
    "",
  );

  const properties = (
    Array.isArray(data.properties) && data.properties.length
      ? data.properties
      : defaultProperties
  ) as PropertyItem[];

  const categoryOptions = (
    Array.isArray(data.categoryOptions) && data.categoryOptions.length
      ? data.categoryOptions
      : Array.from(
          new Set(
            properties
              .map((item) => String(item.category || "").trim())
              .filter(Boolean),
          ),
        )
  ).map(String);
  const locationOptions = (
    Array.isArray(data.locationOptions) && data.locationOptions.length
      ? data.locationOptions
      : Array.from(
          new Set(
            properties
              .map((item) => String(item.location || "").trim())
              .filter(Boolean),
          ),
        )
  ).map(String);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [applied, setApplied] = useState({
    query: "",
    category: "",
    location: "",
  });

  const filtered = useMemo(() => {
    const q = applied.query.trim().toLowerCase();
    return properties.filter((property) => {
      const haystack = [
        property.title,
        property.address,
        property.location,
        property.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesCategory =
        !applied.category ||
        String(property.category || "").toLowerCase() ===
          applied.category.toLowerCase();
      const matchesLocation =
        !applied.location ||
        String(property.location || "").toLowerCase() ===
          applied.location.toLowerCase();
      return matchesQuery && matchesCategory && matchesLocation;
    });
  }, [applied, properties]);

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  return (
    <section
      className="bg-[#f8f9fa] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="propertyGrid"
      data-editor-fields="accentColor searchLabel searchPlaceholder categoryLabel locationLabel buttonText properties categoryOptions locationOptions detailBasePath"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-8 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
        <aside className="sticky top-[120px] h-fit w-[300px] shrink-0 rounded-lg border border-[#eaeaea] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] max-md:static max-md:w-full">
          <div className="mb-6">
            <label className="mb-2 block text-[0.85rem] font-semibold text-[#333]">
              {searchLabel}
            </label>
            <div className="relative">
              <svg
                className="absolute top-3 left-3 text-[#666]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded border border-[#eaeaea] py-2.5 pr-3 pl-9 text-[0.95rem] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[0.85rem] font-semibold text-[#333]">
              {categoryLabel}
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded border border-[#eaeaea] bg-white px-3 py-2.5 text-[0.95rem] outline-none focus:border-[var(--accent)]"
            >
              <option value="">All</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-[0.85rem] font-semibold text-[#333]">
              {locationLabel}
            </label>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full rounded border border-[#eaeaea] bg-white px-3 py-2.5 text-[0.95rem] outline-none focus:border-[var(--accent)]"
            >
              <option value="">All</option>
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              setApplied({
                query,
                category,
                location,
              })
            }
            className="inline-flex w-full items-center justify-center rounded bg-[var(--accent)] px-4 py-3 text-[0.95rem] font-semibold text-white transition-colors hover:brightness-95"
            data-editor-field="buttonText"
          >
            {buttonText}
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <div
            className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2"
            data-box-layout-grid="grid"
          >
            {filtered.map((property, index) => {
              const href = `${detailBase}/${property.id || ""}`;
              const label = String(
                property.title || property.address || "Property",
              );
              return (
                <Link
                  key={property.id || `${label}-${index}`}
                  href={href}
                  onClick={(event) => handleNavigate(event, href, label)}
                  className="block overflow-hidden rounded-lg border border-[#eaeaea] bg-white text-inherit no-underline shadow-[0_4px_15px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1"
                >
                  <div className="relative h-[220px]">
                    <img
                      src={property.image || `${IMG}/kitchen_reno.png`}
                      alt={label}
                      className="h-full w-full object-cover"
                      data-editor-media="image"
                      data-editor-media-type="image"
                    />
                    <div className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#ccc] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="#f5f5f5"
                        stroke="#ccc"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3
                      className="mb-6 text-[1.05rem] leading-relaxed font-medium text-[#333]"
                      data-editor-field="address"
                    >
                      {property.address || property.title}
                    </h3>
                    <div className="mb-6 flex items-center justify-between border-b border-[#eaeaea] pb-6 text-[0.85rem] text-[#333]">
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                        {property.sqft}
                        {sqftSuffix}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        {property.beds} {bedsLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M3 12h18M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6M10 6v6M14 6v6M10 6h4" />
                        </svg>
                        {property.baths} {bathsLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="mb-1 text-[0.85rem] text-[#666]">
                          {priceLabel}
                        </div>
                        <div
                          className="text-[1.1rem] font-bold text-[#111]"
                          data-editor-field="price"
                        >
                          {property.price}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[0.85rem] text-[#666]">
                          {ratingLabel}
                        </div>
                        <div className="flex items-center gap-1 text-[#ffb300]">
                          ★★★★★
                          <span className="text-[0.85rem] font-medium text-[#111]">
                            {property.rating || "5.0(30)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
