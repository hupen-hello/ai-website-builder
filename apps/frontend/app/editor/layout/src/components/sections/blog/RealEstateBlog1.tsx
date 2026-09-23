"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaRegCalendarAlt } from "react-icons/fa";
import type { SectionProps } from "../../../types/section";
import { resolvePublishedPageHref } from "../../../lib/sectionScroll";
import { handleManagerCardClick } from "../../../lib/editorManagerCards";

type BlogPost = {
  title: string;
  excerpt: string;
  image: string;
  alt: string;
  date: string;
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

const getPosts = (value: unknown, siteBase?: string): BlogPost[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const title = getString(item.title);
    const image = getString(item.image);
    if (!title || !image) return [];

    const slug = getString(item.slug, slugify(title));
    const rawHref = getString(item.href);

    return [{
      title,
      excerpt: getString(
        item.excerpt,
        getString(item.desc, getString(item.body)),
      ),
      image,
      alt: getString(item.alt, title),
      date: getString(item.date),
      href: resolvePublishedPageHref(
        rawHref || `/blog/${slug}`,
        siteBase,
        { slug },
      ),
    }];
  });
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") ||
  src.startsWith("http://") ||
  src.startsWith("https://");

export default function RealEstateBlog1({ data = {}, editorMode = false }: SectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const siteBase =
    typeof data.publishedSiteBase === "string" ? data.publishedSiteBase : "";
  const posts = getPosts(data.blogItems, siteBase || undefined);
  const buttons = Array.isArray(data.buttons)
    ? data.buttons.filter(
        (button): button is { label: string; href: string } =>
          Boolean(
            button &&
              typeof button === "object" &&
              typeof button.label === "string" &&
              typeof button.href === "string",
          ),
      )
    : [];
  const viewAll = buttons[0];
  const readLabel = buttons[1]?.label || "Read more";

  if (!posts.length) return null;

  const scroll = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.8, 300),
      behavior: "smooth",
    });
  };

  return (
    <section id="real-estate-blog" className="bg-[#faf8f4] py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          {data.pretitle && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#c44536]">
              {getString(data.pretitle)}
            </p>
          )}
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#141414] md:text-[2.5rem]">
            {getString(data.title, "Latest insights from the market.")}
          </h2>
          {data.desc && (
            <p className="mt-4 text-sm leading-6 text-[#141414]/60 md:text-base">
              {getString(data.desc)}
            </p>
          )}
        </div>

        <div className="relative mt-10">
          <div
            ref={scrollerRef}
            data-box-layout-grid="carousel"
            data-editor-no-inline
            className="grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:auto-cols-[48%] lg:auto-cols-[calc((100%_-_3rem)/4)] [&::-webkit-scrollbar]:hidden"
          >
            {posts.map((post, index) => (
              <article
                key={`${post.title}-${index}`}
                className="group/blog-card flex snap-start flex-col overflow-hidden rounded-2xl border border-[#141414]/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#c44536]/30 hover:shadow-[0_18px_45px_rgba(20,20,20,0.09)]"
              >
                <Link
                  href={post.href}
                  className="flex h-full flex-col"
                  onClick={(event) => {
                    handleManagerCardClick(event, editorMode, "Blogs", {
                      href: post.href,
                      title: post.title,
                    });
                  }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#eee9e2]">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      sizes="(max-width: 640px) 86vw, (max-width: 1024px) 48vw, 25vw"
                      unoptimized={bypassImageOptimization(post.image)}
                      data-editor-media
                      data-editor-media-type="image"
                      data-editor-media-src={post.image}
                      className="object-cover transition duration-700 group-hover/blog-card:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {post.date && (
                      <p className="flex items-center gap-2 text-[11px] text-[#141414]/50">
                        <FaRegCalendarAlt className="text-[#c44536]" aria-hidden />
                        {post.date}
                      </p>
                    )}
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-[#141414] transition group-hover/blog-card:text-[#c44536]">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#141414]/60">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-semibold text-[#141414]">
                      {readLabel}
                      <FaArrowRight className="text-[9px] transition group-hover/blog-card:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {posts.length > 4 && (
            <>
              <button
                type="button"
                aria-label="Previous articles"
                onClick={() => scroll(-1)}
                className="absolute left-1 top-[30%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#141414] shadow-lg transition hover:bg-[#141414] hover:text-white"
              >
                <FaArrowLeft className="text-xs" />
              </button>
              <button
                type="button"
                aria-label="Next articles"
                onClick={() => scroll(1)}
                className="absolute right-1 top-[30%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#141414] shadow-lg transition hover:bg-[#141414] hover:text-white"
              >
                <FaArrowRight className="text-xs" />
              </button>
            </>
          )}
        </div>

        {viewAll && (
          <div className="mt-9 flex justify-center">
            <Link
              href={resolvePublishedPageHref(viewAll.href, siteBase || undefined)}
              className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c44536]"
            >
              {viewAll.label}
              <FaArrowRight className="text-[10px]" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
