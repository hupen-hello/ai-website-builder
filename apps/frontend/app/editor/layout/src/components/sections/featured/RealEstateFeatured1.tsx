"use client";

import { useRef } from "react";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import type { SectionProps } from "../../../types/section";
import RealEstateImageCard1 from "./RealEstateImageCard1";
import {
    handleManagerCardClick,
    slugFromListingHref,
} from "../../../lib/editorManagerCards";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

type FeaturedProperty = {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    alt: string;
    price: string;
    statusText?: string;
    category: string;
    href: string;
    slug: string;
};

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const propertyDetailHref = (href: string, slug: string, detailBase?: string) => {
    const path = href.split("?")[0].replace(/\/+$/, "").toLowerCase();
    if (!slug) return detailBase || href || "/properties";
    if (
        !href ||
        path === "" ||
        path === "/properties" ||
        path === "/property" ||
        /^\/(properties|property)\/[^/]+$/.test(path)
    ) {
        return detailBase ? `${detailBase}/${slug}` : `/properties/${slug}`;
    }
    return href;
};

const getString = (value: unknown, fallback = "") =>
    typeof value === "string" ? value : fallback;

const getFeaturedProperties = (value: unknown, detailBase?: string): FeaturedProperty[] => {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item) => {
        if (!item || typeof item !== "object") return [];

        const property = item as Record<string, unknown>;
        const title = getString(property.title);
        const image = getString(property.image);

        if (!title || !image) return [];

        const slug = getString(property.slug, slugify(title));

        return [
            {
                title,
                image,
                alt: getString(property.alt, title),
                subtitle: getString(property.subtitle),
                description: getString(property.description, getString(property.desc)),
                price: getString(property.price),
                statusText: getString(property.statusText) || undefined,
                category: getString(property.category, "Listing"),
                href: propertyDetailHref(getString(property.href), slug, detailBase),
                slug,
            },
        ];
    });
};

function FeaturedCard({
    property,
    editorMode,
}: {
    property: FeaturedProperty;
    editorMode?: boolean;
}) {
    return (
        <RealEstateImageCard1
            href={property.href}
            image={property.image}
            alt={property.alt}
            cardClassName="rounded-2xl"
            imageSizes="(max-width: 640px) 82vw, (max-width: 1024px) 45vw, 300px"
            contentClassName="flex flex-1 flex-col p-4"
            onClick={(event) => {
                handleManagerCardClick(event, editorMode, "Properties", {
                    slug:
                        property.slug ||
                        slugFromListingHref(property.href, "properties"),
                    href: property.href,
                    title: property.title,
                });
            }}
            imageOverlay={
                <>
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#141414]">
                        {property.category}
                    </span>
                    {property.statusText && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#141414]/85 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                            {property.statusText}
                        </span>
                    )}
                </>
            }
        >

            {property.subtitle && (
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#c44536]">
                    {property.subtitle}
                </p>
            )}
            <h3 className="mt-1.5 text-base font-semibold leading-snug text-[#141414] transition group-hover:text-[#c44536]">
                {property.title}
            </h3>
            {property.description && (
                <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-[#141414]/65">
                    {property.description}
                </p>
            )}

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#141414]/8 pt-4">
                <p className="text-base font-semibold text-[#141414]">
                    {property.price}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#141414] underline underline-offset-4 transition hover:opacity-70">
                    View details
                    <FaArrowRight className="text-[9px]" aria-hidden />
                </span>
            </div>
        </RealEstateImageCard1>
    );
}

export default function RealEstateFeatured1({
    data = {},
    editorMode = false,
}: SectionProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const detailBase = typeof data.propertyDetailBase === "string" ? data.propertyDetailBase : undefined;
    const listings = getFeaturedProperties(data.listings, detailBase);
    const seeAllHref = publishedHrefFromData(
        detailBase ? detailBase.replace(/\/property$/, "/properties") : "/properties",
        data,
    );
    const subtitle = getString(data.subtitle);
    const sectionTitle = getString(data.sectionTitle, getString(data.title));
    const description = getString(data.description, getString(data.desc));

    const scroll = (direction: -1 | 1) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        scroller.scrollBy({
            left: direction * Math.max(scroller.clientWidth * 0.8, 280),
            behavior: "smooth",
        });
    };

    if (!listings.length) return null;

    return (
        <section className="bg-white py-7 md:py-8">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-10">
                <div className="mx-auto max-w-2xl text-center">
                    {subtitle && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c44536]">
                            {subtitle}
                        </p>
                    )}
                    {sectionTitle && (
                        <h2 className="mt-3 text-[2rem] font-semibold leading-tight text-[#141414] md:text-[2.5rem]">
                            {sectionTitle}
                        </h2>
                    )}
                    {description && (
                        <p className="mt-3 text-sm leading-relaxed text-[#141414]/65 md:text-base">
                            {description}
                        </p>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-2 md:mt-10">
                    <button
                        type="button"
                        aria-label="Previous properties"
                        onClick={() => scroll(-1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#141414]/15 text-[#141414] transition hover:bg-[#141414] hover:text-white"
                    >
                        <FaArrowLeft className="text-xs" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next properties"
                        onClick={() => scroll(1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#141414]/15 text-[#141414] transition hover:bg-[#141414] hover:text-white"
                    >
                        <FaArrowRight className="text-xs" />
                    </button>
                </div>

                <div
                    ref={scrollerRef}
                    data-box-layout-grid="carousel"
                    data-editor-no-inline
                    className="mt-4 grid snap-x snap-mandatory auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[46%] lg:auto-cols-[calc((100%-2rem)/3)] [&::-webkit-scrollbar]:hidden"
                >
                    {listings.map((property, index) => (
                        <div
                            key={`${property.title}-${index}`}
                            className="min-w-0 snap-start"
                        >
                            <FeaturedCard property={property} editorMode={editorMode} />
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center">
                    <Link
                        href={seeAllHref}
                        className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#141414]/90"
                    >
                        See all properties
                        <FaArrowRight className="text-[10px]" aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    );
}
