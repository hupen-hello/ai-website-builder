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

type BlogPost = {
  id?: string;
  title?: string;
  image?: string;
  date?: string;
  author?: string;
  excerpt?: string;
  comments?: number | string;
  categoryId?: string;
  href?: string;
};

type BlogCategory = {
  id?: string;
  title?: string;
  count?: string | number;
};

const IMG = "/categories/realestate/template5";

const defaultPosts: BlogPost[] = [
  {
    id: "top-10-interior-design-trends-for-2026",
    title: "Top 10 Interior Design Trends for 2026",
    image: `${IMG}/team1.jpg`,
    date: "Aug 10, 2026",
    author: "Admin",
    excerpt: "Discover the latest trends in interior design.",
    comments: 3,
    categoryId: "interior-design",
  },
  {
    id: "how-to-increase-your-property-value",
    title: "How to Increase Your Property Value",
    image: `${IMG}/team3.jpg`,
    date: "Aug 12, 2026",
    author: "Admin",
    excerpt: "Simple renovations that add massive value.",
    comments: 3,
    categoryId: "real-estate",
  },
  {
    id: "sustainable-architecture-innovations",
    title: "Sustainable Architecture Innovations",
    image: `${IMG}/team4.jpg`,
    date: "Aug 15, 2026",
    author: "Admin",
    excerpt: "Building for the future with green tech.",
    comments: 3,
    categoryId: "architecture",
  },
];

const defaultCategories: BlogCategory[] = [
  { id: "interior-design", title: "Interior Design", count: "12" },
  { id: "architecture", title: "Architecture", count: "08" },
  { id: "construction-tips", title: "Construction Tips", count: "15" },
  { id: "real-estate", title: "Real Estate", count: "05" },
  { id: "market-trends", title: "Market Trends", count: "09" },
];

export default function RealEstateBlogPage5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const byLabel = String(data.byLabel || "By");
  const commentsLabel = String(data.commentsLabel || "Comments");
  const readMoreText = String(data.readMoreText || "READ MORE +");
  const nextPageLabel = String(data.nextPageLabel || "»");
  const categoriesTitle = String(data.categoriesTitle || "Categories");
  const recentPostsTitle = String(data.recentPostsTitle || "Recent Posts");
  const detailBase = String(data.detailBasePath || "/blogs").replace(/\/$/, "");
  const listingUrl = String(data.listingUrl || "/blogs");
  const itemsPerPage = Math.max(1, Number(data.itemsPerPage) || 6);

  const posts = (
    Array.isArray(data.blogPosts) && data.blogPosts.length
      ? data.blogPosts
      : Array.isArray(data.blogs) && data.blogs.length
        ? data.blogs
        : defaultPosts
  ) as BlogPost[];

  const categories = (
    Array.isArray(data.categories) && data.categories.length
      ? data.categories
      : defaultCategories
  ) as BlogCategory[];

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return posts;
    const matched = posts.filter(
      (post) => String(post.categoryId || "") === activeCategory,
    );
    return matched.length ? matched : posts;
  }, [activeCategory, posts]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const currentPosts = filteredPosts.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  const postHref = (post: BlogPost) =>
    String(post.href || `${detailBase}/${post.id || ""}`);

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
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="blog"
      data-editor-fields="accentColor byLabel commentsLabel readMoreText nextPageLabel categoriesTitle recentPostsTitle detailBasePath blogPosts categories"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-10 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-8">
            {currentPosts.map((post, index) => {
              const href = postHref(post);
              const title = String(post.title || `Post ${index + 1}`);
              return (
                <article
                  key={String(post.id || title)}
                  className="border-b border-[#eaeaea] pb-[60px] last:border-b-0"
                >
                  <div className="relative mb-6 h-[400px] overflow-hidden rounded-lg max-md:h-[240px]">
                    <img
                      src={String(post.image || `${IMG}/kitchen_reno.png`)}
                      alt={title}
                      className="h-full w-full object-cover"
                      data-editor-media="image"
                      data-editor-media-type="image"
                    />
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-6 text-[0.9rem] text-[#666]">
                    <div className="inline-flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {byLabel} {String(post.author || "Admin")}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {String(post.date || "")}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {String(post.comments ?? 0)} {commentsLabel}
                    </div>
                  </div>

                  <h2 className="mb-4 text-[1.75rem] font-bold text-[#333] max-md:text-[1.35rem]">
                    <Link
                      href={href}
                      onClick={(event) => handleNavigate(event, href, title)}
                      className="text-inherit no-underline hover:text-[var(--accent)]"
                      data-editor-field="title"
                    >
                      {title}
                    </Link>
                  </h2>
                  <div className="mb-8 flex items-center gap-1.5">
                    <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
                    <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  </div>
                  <p
                    className="mb-6 text-[1.05rem] leading-[1.6] text-[#666]"
                    data-editor-field="excerpt"
                  >
                    {String(post.excerpt || "")}
                  </p>
                  <Link
                    href={href}
                    onClick={(event) => handleNavigate(event, href, title)}
                    className="inline-flex items-center justify-center rounded bg-[var(--accent)] px-7 py-3.5 text-[0.95rem] font-medium text-white no-underline transition hover:-translate-y-0.5 hover:brightness-95 max-md:px-4 max-md:py-2"
                    data-editor-field="readMoreText"
                  >
                    {readMoreText}
                  </Link>
                </article>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="mt-[60px] flex gap-2">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const isActive = pageNumber === safePage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`h-10 w-10 border text-sm ${
                      isActive
                        ? "border-transparent bg-[var(--accent)] text-white"
                        : "border-[#eaeaea] bg-white text-[#333]"
                    }`}
                  >
                    {String(pageNumber).padStart(2, "0")}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={safePage === totalPages}
                className="h-10 w-10 border border-[#eaeaea] bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {nextPageLabel}
              </button>
            </div>
          ) : null}
        </div>

        <aside className="sticky top-[120px] w-[350px] shrink-0 max-md:static max-md:w-full">
          <div className="rounded-lg border border-[#eaeaea] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3
              className="mb-2 text-[1.2rem] font-bold tracking-[0.05em] text-[#333] uppercase"
              data-editor-field="categoriesTitle"
            >
              {categoriesTitle}
            </h3>
            <div className="mb-6 h-0.5 w-10 bg-[var(--accent)]" />
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {categories.map((category) => {
                const id = String(category.id || "");
                const title = String(category.title || "Category");
                const isActive = activeCategory === id;
                return (
                  <li key={id || title}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory((prev) => (prev === id ? null : id));
                        setPage(1);
                      }}
                      className={`flex w-full items-center justify-between border-0 bg-transparent p-0 text-left text-[0.95rem] ${
                        isActive ? "text-[var(--accent)]" : "text-[#666]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent)]">
                        <span className="text-[var(--accent)]">»</span>
                        {title}
                      </span>
                      {category.count != null ? (
                        <span>({String(category.count)})</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-10 rounded-lg border border-[#eaeaea] bg-white p-8">
            <h3
              className="mb-2 text-[1.2rem] font-bold tracking-[0.05em] text-[#333] uppercase"
              data-editor-field="recentPostsTitle"
            >
              {recentPostsTitle}
            </h3>
            <div className="mb-6 h-0.5 w-10 bg-[var(--accent)]" />
            <div className="flex flex-col gap-5">
              {posts.slice(0, 3).map((post) => {
                const href = postHref(post);
                const title = String(post.title || "Post");
                const shortTitle =
                  title.length > 40 ? `${title.slice(0, 40)}...` : title;
                return (
                  <Link
                    key={String(post.id || title)}
                    href={href}
                    onClick={(event) => handleNavigate(event, href, title)}
                    className="flex items-center gap-4 text-inherit no-underline"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded">
                      <img
                        src={String(post.image || `${IMG}/kitchen_reno.png`)}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-[var(--accent)]">
                        {String(post.date || "")}
                      </div>
                      <h4 className="text-[0.95rem] leading-[1.4] text-[#333]">
                        {shortTitle}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <span className="sr-only">{listingUrl}</span>
        </aside>
      </div>
    </section>
  );
}
