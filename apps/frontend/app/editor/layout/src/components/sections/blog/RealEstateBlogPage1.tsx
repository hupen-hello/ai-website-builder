"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import RealEstateBreadCrumb1 from "../breadcrumb/RealEstateBreadCrumb1";
import { RealEstatePagination } from "../buy-a-property/RealEstateProperty1";
import useCardPagination from "../types/useCardPagination";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

type BlogItem = {
  title: string;
  image: string;
  alt?: string;
  date?: string;
  href?: string;
  excerpt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isRemoteImage = (src: string) => /^https?:\/\//i.test(src);

const getBlogItems = (value: unknown): BlogItem[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) && typeof item.title === "string" && typeof item.image === "string"
          ? [{
              title: item.title,
              image: item.image,
              alt: typeof item.alt === "string" ? item.alt : undefined,
              date: typeof item.date === "string" ? item.date : undefined,
              href: (() => {
                const href = typeof item.href === "string" ? item.href : "";
                const path = href.split("?")[0].replace(/\/+$/, "").toLowerCase();
                const slug = item.title
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                if (slug && (!href || path === "" || path === "/blog" || path === "/blogs")) {
                  return `/blog/${slug}`;
                }
                return href || (slug ? `/blog/${slug}` : undefined);
              })(),
              excerpt: typeof item.excerpt === "string" ? item.excerpt : typeof item.body === "string" ? item.body : undefined,
            }]
          : [],
      )
    : [];

export default function RealEstateBlogPage1({ data = {}, editorMode = false }: SectionProps) {
  const posts = useMemo(
    () => getBlogItems(data.blogItems ?? data.galleryItems),
    [data.blogItems, data.galleryItems],
  );
  const postsField =
    data.blogItems !== undefined ? "blogItems" : "galleryItems";
  const {
    currentPage: page,
    itemsPerPage,
    totalPages,
    setCurrentPage,
  } = useCardPagination({
    itemCount: posts.length,
    boxesPerRow: data.boxesPerRow,
    fallbackColumns: 4,
  });
  const visiblePosts = posts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const changePage = (nextPage: number) => {
    setCurrentPage(nextPage);
    document.getElementById("realestate-blog-posts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pub = (href: string) => publishedHrefFromData(href, data);

  return (
    <main className="bg-white text-[#141414]">
      <RealEstateBreadCrumb1
        pretitle={data.pretitle ?? "Blog & insights"}
        title={data.title ?? "Latest insights from the market."}
        desc={data.desc ?? "Practical guides and market notes for buyers, renters, homeowners, and investors."}
      />

      <section
        data-editor-section-label="Blog Posts"
        data-editor-fields={`postsPretitle postsTitle ${postsField} readArticleLabel`}
        id="realestate-blog-posts"
        className="scroll-mt-8 px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-5">
            <div>
            <p data-editor-field="postsPretitle" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a4472f]">{typeof data.postsPretitle === "string" ? data.postsPretitle : "Market journal"}</p>
            <h2 data-editor-field="postsTitle" className="mt-3 text-3xl font-medium tracking-[-0.03em] md:text-4xl">{typeof data.postsTitle === "string" ? data.postsTitle : "Stories to guide your next move."}</h2>
            </div>
            <p className="hidden text-sm text-[#141414]/50 sm:block">{posts.length} articles</p>
          </div>

          <div data-box-layout-grid="grid" className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visiblePosts.map((post, index) => (
              <Link
                href={pub(post.href ?? "/blog")}
                key={`${post.title}-${index}`}
                className="group flex min-h-full flex-col overflow-hidden rounded-[1.15rem] border border-[#141414]/10 bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(20,20,20,0.08)]"
                onClick={(event) => {
                  if (!editorMode) return;
                  event.preventDefault();
                  event.stopPropagation();
                  try {
                    window.sessionStorage.setItem(
                      "ai-builder-open-manager-item:Blogs",
                      JSON.stringify({ href: post.href ?? "/blog" }),
                    );
                  } catch {
                    /* ignore storage errors */
                  }
                  window.dispatchEvent(
                    new CustomEvent("ai-builder-open-manager", {
                      detail: { manager: "Blogs" },
                    }),
                  );
                }}
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-[#eee9df]">
                  <Image src={post.image} alt={post.alt ?? post.title} fill priority={page === 1 && index < 4} unoptimized={isRemoteImage(post.image)} className="object-cover transition duration-700 group-hover:scale-[1.04]" sizes="(max-width: 640px) 100vw, 25vw" data-editor-media data-editor-media-type="image" data-editor-media-src={post.image} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {post.date && <p className="flex items-center gap-2 text-[11px] font-medium text-[#141414]/45"><CalendarDays size={13} className="text-[#a4472f]" />{post.date}</p>}
                  <h3 className="mt-3 text-lg font-semibold leading-snug">{post.title}</h3>
                  {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#141414]/60">{post.excerpt}</p>}
                <span data-editor-field="readArticleLabel" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold transition group-hover:text-[#a4472f]">{typeof data.readArticleLabel === "string" ? data.readArticleLabel : "Read article"} <ArrowRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>

          <RealEstatePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        </div>
      </section>
    </main>
  );
}
