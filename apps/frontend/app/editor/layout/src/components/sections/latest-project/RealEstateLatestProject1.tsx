"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import type { SectionProps } from "../../../types/section";
import { resolvePublishedListingHref } from "../../../lib/sectionScroll";
import {
  handleManagerCardClick,
  slugFromListingHref,
} from "../../../lib/editorManagerCards";

type ProjectItem = {
    title: string;
    desc: string;
    image: string;
    alt: string;
    status?: string;
    location?: string;
    href: string;
};

type ProjectButton = {
    label: string;
    href: string;
};

const getString = (value: unknown, fallback = "") =>
    typeof value === "string" ? value : fallback;

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const getProjectItems = (
    value: unknown,
    detailBase?: string,
): ProjectItem[] => {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item) => {
        if (!item || typeof item !== "object") return [];

        const project = item as Record<string, unknown>;
        const title = getString(project.title);
        const image = getString(project.image);

        if (!title || !image) return [];

        const slug = getString(project.slug, slugify(title));

        return [
            {
                title,
                image,
                alt: getString(project.alt, title),
                desc: getString(project.desc, getString(project.description)),
                status: getString(project.status) || undefined,
                location: getString(project.location) || undefined,
                href: (() => {
                    const href = getString(project.href);
                    const path = href.split("?")[0].replace(/\/+$/, "").toLowerCase();
                    if (
                        slug &&
                        (!href ||
                            path === "" ||
                            path === "/projects" ||
                            path === "/project" ||
                            path === "/portfolio" ||
                            /^\/(projects|project|portfolio)\/[^/]+$/.test(path))
                    ) {
                        return detailBase ? `${detailBase}/${slug}` : `/projects/${slug}`;
                    }
                    return detailBase && slug ? `${detailBase}/${slug}` : href || `/projects/${slug}`;
                })(),
            },
        ];
    });
};

const getProjectButton = (value: unknown): ProjectButton | null => {
    if (!value || typeof value !== "object") return null;

    const button = value as Record<string, unknown>;
    const label = getString(button.label);
    const href = getString(button.href);

    return label && href ? { label, href } : null;
};

const bypassImageOptimization = (src: string) =>
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://");

export default function RealEstateLatestProject1({
    data = {},
    editorMode = false,
}: SectionProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const portfolioDetailBase =
        typeof data.portfolioDetailBase === "string"
            ? data.portfolioDetailBase.trim()
            : "";
    const items = getProjectItems(data.projectItems, portfolioDetailBase || undefined);
    const button = getProjectButton(data.button);
    const projectHref = (href: string) =>
        resolvePublishedListingHref(href, portfolioDetailBase || undefined);

    const scroll = (direction: -1 | 1) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        scroller.scrollBy({
            left: direction * Math.max(scroller.clientWidth * 0.8, 280),
            behavior: "smooth",
        });
    };

    if (!items.length) return null;

    return (
        <section
            id="latest-projects"
            data-boxes-per-row={data.boxesPerRow}
            className="bg-[#faf8f4] py-12 md:py-16"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-10">
                <div className="mx-auto max-w-2xl text-center">
                    {data.pretitle && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c44536]">
                            {data.pretitle}
                        </p>
                    )}
                    {data.title && (
                        <h2 className="mt-3 text-[2rem] font-semibold leading-tight text-[#141414] md:text-[2.5rem]">
                            {data.title}
                        </h2>
                    )}
                    {data.desc && (
                        <p className="mt-3 text-sm leading-relaxed text-[#141414]/65 md:text-base">
                            {data.desc}
                        </p>
                    )}
                </div>

                <div className="relative mt-10">
                    <div
                        ref={scrollerRef}
                        data-box-layout-grid="carousel"
                        data-editor-no-inline
                        data-editor-card-fields="image status location title desc href"
                        className="grid snap-x snap-mandatory auto-cols-[84%] grid-flow-col gap-4 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[47%] lg:auto-cols-[calc((100%_-_3rem)/4)] [&::-webkit-scrollbar]:hidden"
                    >
                        {items.map((item, index) => (
                            <Link
                                key={`${item.title}-${index}`}
                                href={projectHref(item.href)}
                                className="group flex h-full min-w-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#141414]/10 bg-white transition hover:border-[#141414]/20 hover:shadow-[0_20px_50px_rgba(20,20,20,0.08)]"
                                onClick={(event) => {
                                    handleManagerCardClick(event, editorMode, "Portfolio", {
                                        slug: slugFromListingHref(item.href, "projects"),
                                        href: item.href,
                                        title: item.title,
                                    });
                                }}
                            >
                                <div className="relative aspect-[4/3] overflow-hidden bg-[#f3efe8]">
                                    <Image
                                        src={item.image}
                                        alt={item.alt}
                                        fill
                                        sizes="(max-width: 640px) 84vw, (max-width: 1024px) 47vw, 25vw"
                                        unoptimized={bypassImageOptimization(item.image)}
                                        data-editor-media
                                        data-editor-media-type="image"
                                        data-editor-media-src={item.image}
                                        className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                                    />
                                    {item.status && (
                                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#141414]">
                                            {item.status}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col p-4">
                                    {item.location && (
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c44536]">
                                            {item.location}
                                        </p>
                                    )}
                                    <h3 className="mt-2 text-base font-semibold text-[#141414] transition group-hover:text-[#c44536]">
                                        {item.title}
                                    </h3>
                                    {item.desc && (
                                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#141414]/65">
                                            {item.desc}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    <button
                        type="button"
                        aria-label="Previous projects"
                        onClick={() => scroll(-1)}
                        className="absolute left-1 top-[30%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#141414] shadow-lg transition hover:scale-105 hover:bg-[#141414] hover:text-white"
                    >
                        <FaArrowLeft className="text-xs" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next projects"
                        onClick={() => scroll(1)}
                        className="absolute right-1 top-[30%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#141414] shadow-lg transition hover:scale-105 hover:bg-[#141414] hover:text-white"
                    >
                        <FaArrowRight className="text-xs" />
                    </button>
                </div>

                {button && (
                    <div className="mt-8 flex justify-center">
                        <Link
                            href={projectHref(button.href)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#141414]/90"
                        >
                            {button.label}
                            <FaArrowRight className="text-[10px]" aria-hidden />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
