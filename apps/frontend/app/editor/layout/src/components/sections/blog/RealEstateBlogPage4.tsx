"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
} from "lucide-react";
import { blogPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  BlogPage4Data,
  BlogPage4Post,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const POSTS_PER_PAGE = 3;
const FALLBACK_IMAGE =
  "/categories/realestate/template4/unsplash-d3b2de36.jpg";

const getCategories = (posts: BlogPage4Post[]) => {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const name = post.category || post.badge;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
};

export default function RealEstateBlogPage4({ data = {} }: SectionProps) {
  const authored = blogPage4Content.RealEstateBlogPage4;
  const content: BlogPage4Data = {
    ...authored,
    ...(data as BlogPage4Data),
  };
  const posts = content.blogPosts?.length
    ? content.blogPosts
    : (authored.blogPosts ?? []);
  const fallbackImage = content.fallbackImage ?? FALLBACK_IMAGE;
  const categories = getCategories(posts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = selectedCategory
        ? post.category === selectedCategory || post.badge === selectedCategory
        : true;
      const haystack = `${post.title} ${post.excerpt ?? ""} ${post.description ?? ""}`.toLowerCase();
      const matchesSearch = query ? haystack.includes(query) : true;
      return matchesCategory && matchesSearch;
    });
  }, [posts, searchQuery, selectedCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const currentPosts = filteredPosts.slice(
    (safePage - 1) * POSTS_PER_PAGE,
    safePage * POSTS_PER_PAGE,
  );

  const handleCategorySelect = (categoryName: string | null) => {
    setSelectedCategory(categoryName);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const scroller = document.querySelector<HTMLElement>(
      "[data-template-scroll]",
    );
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="blog"
      data-editor-fields="accentColor pretitle title readMoreLabel searchPlaceholder featuredImage featuredBadge featuredTitle featuredDescription featuredButtonText featuredButtonLink recentPostsTitle categoriesTitle allPostsLabel clearFilterLabel emptyMessage blogPosts"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="lg:w-2/3">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <p
                  className="mb-2 text-sm font-bold tracking-wider text-[var(--accent)] uppercase"
                  data-editor-field="pretitle"
                >
                  {content.pretitle ?? "Our News"}
                </p>
                <h2 className="text-3xl font-bold text-secondary md:text-4xl">
                  {selectedCategory
                    ? `${selectedCategory} News`
                    : (content.title ?? "Latest News & Insights")}
                </h2>
              </div>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => handleCategorySelect(null)}
                  className="text-sm font-semibold text-[var(--accent)] hover:underline"
                  data-editor-field="clearFilterLabel"
                >
                  {content.clearFilterLabel ?? "Clear Filter"}
                </button>
              )}
            </div>

            {currentPosts.length > 0 ? (
              <div className="space-y-8" data-box-layout-grid="stack">
                {currentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-md md:flex-row md:gap-8"
                  >
                    <div className="relative min-h-[250px] shrink-0 overflow-hidden md:w-2/5">
                      <img
                        src={post.image || fallbackImage}
                        alt={post.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        data-editor-media="image"
                        data-editor-media-type="image"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                      <span
                        className="mb-4 inline-block w-fit rounded bg-teal-50 px-3 py-1 text-xs font-bold tracking-wider text-[var(--accent)]"
                        data-editor-field="category"
                      >
                        {post.badge || post.category}
                      </span>
                      <h3 className="mb-3 text-2xl leading-snug font-bold text-secondary">
                        <Link
                          href={`/template4/blog/${post.id}`}
                          className="transition-colors hover:text-[var(--accent)]"
                          data-editor-field="title"
                        >
                          {post.title}
                        </Link>
                      </h3>

                      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 md:gap-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span data-editor-field="date">{post.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          By{" "}
                          <span data-editor-field="author">
                            {post.author || "Admin"}
                          </span>
                        </div>
                      </div>

                      <p
                        className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-600"
                        data-editor-field="excerpt"
                      >
                        {post.description || post.excerpt}
                      </p>

                      <Link
                        href={`/template4/blog/${post.id}`}
                        className="mt-auto inline-flex items-center gap-1 text-sm font-bold tracking-wider text-[var(--accent)] uppercase transition-colors hover:opacity-80"
                      >
                        <span data-editor-field="readMoreLabel">
                          {content.readMoreLabel ?? "Read More"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 py-10 text-center md:py-14">
                <p
                  className="text-lg text-gray-500"
                  data-editor-field="emptyMessage"
                >
                  {content.emptyMessage ?? "No posts found for this category."}
                </p>
                <button
                  type="button"
                  onClick={() => handleCategorySelect(null)}
                  className="mt-4 font-semibold text-[var(--accent)] hover:underline"
                >
                  {content.allPostsLabel ?? "View All Posts"}
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(safePage - 1)}
                  disabled={safePage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                        safePage === pageNumber
                          ? "bg-[var(--accent)] text-white hover:opacity-90"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handlePageChange(safePage + 1)}
                  disabled={safePage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-10 lg:w-1/3">
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                setCurrentPage(1);
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder={content.searchPlaceholder ?? "Search news..."}
                className="w-full rounded-full border border-gray-200 bg-white py-3.5 pr-12 pl-6 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                data-editor-field="searchPlaceholder"
              />
              <button
                type="submit"
                className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors hover:opacity-90"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            <div className="group relative h-96 overflow-hidden rounded-2xl text-white shadow-lg">
              <img
                src={
                  content.featuredImage ??
                  "/categories/realestate/template4/unsplash-3f53554c.jpg"
                }
                alt={content.featuredTitle ?? "Featured Property"}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                data-editor-media="featuredImage"
                data-editor-media-type="image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <span
                  className="mb-4 inline-block w-fit rounded bg-white/20 px-3 py-1 text-xs font-bold tracking-wider text-white backdrop-blur-sm"
                  data-editor-field="featuredBadge"
                >
                  {content.featuredBadge ?? "FEATURED"}
                </span>
                <h3
                  className="mb-4 text-3xl leading-tight font-bold whitespace-pre-line"
                  data-editor-field="featuredTitle"
                >
                  {content.featuredTitle ?? "Find Your Dream Property"}
                </h3>
                <p
                  className="mb-6 text-sm leading-relaxed text-gray-300"
                  data-editor-field="featuredDescription"
                >
                  {content.featuredDescription ??
                    "Can't find what you want in our listings? Let us know what you're looking for and we'll help you find the house of your dreams."}
                </p>
                <Link
                  href={content.featuredButtonLink ?? "/template4/contact"}
                  className="inline-flex w-fit items-center gap-2 rounded bg-[var(--accent)] px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:opacity-90"
                >
                  <span data-editor-field="featuredButtonText">
                    {content.featuredButtonText ?? "CONTACT US"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div>
              <h4
                className="mb-6 border-b border-gray-200 pb-3 text-lg font-bold tracking-wider text-secondary uppercase"
                data-editor-field="recentPostsTitle"
              >
                {content.recentPostsTitle ?? "Recent Posts"}
              </h4>
              <div className="space-y-4">
                {posts.slice(0, 4).map((post) => (
                  <Link
                    key={post.id}
                    href={`/template4/blog/${post.id}`}
                    className="group flex cursor-pointer gap-4"
                  >
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
                      <img
                        src={post.image || fallbackImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div>
                      <h5 className="mb-1 line-clamp-2 text-sm leading-snug font-bold text-secondary transition-colors group-hover:text-[var(--accent)]">
                        {post.title}
                      </h5>
                      <span className="text-xs font-medium text-gray-400">
                        {post.date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4
                className="mb-6 border-b border-gray-200 pb-3 text-lg font-bold tracking-wider text-secondary uppercase"
                data-editor-field="categoriesTitle"
              >
                {content.categoriesTitle ?? "Categories"}
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(null)}
                    className="group flex w-full items-center justify-between text-left"
                  >
                    <span
                      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                        selectedCategory === null
                          ? "text-[var(--accent)]"
                          : "text-gray-600 group-hover:text-[var(--accent)]"
                      }`}
                    >
                      <ChevronRight
                        className={`h-4 w-4 ${
                          selectedCategory === null
                            ? "text-[var(--accent)]"
                            : "text-gray-400 group-hover:text-[var(--accent)]"
                        }`}
                      />
                      {content.allPostsLabel ?? "All Posts"}
                    </span>
                    <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-400 transition-colors group-hover:bg-teal-50 group-hover:text-[var(--accent)]">
                      {posts.length}
                    </span>
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.name}>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(category.name)}
                      className="group flex w-full items-center justify-between text-left"
                    >
                      <span
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                          selectedCategory === category.name
                            ? "text-[var(--accent)]"
                            : "text-gray-600 group-hover:text-[var(--accent)]"
                        }`}
                      >
                        <ChevronRight
                          className={`h-4 w-4 ${
                            selectedCategory === category.name
                              ? "text-[var(--accent)]"
                              : "text-gray-400 group-hover:text-[var(--accent)]"
                          }`}
                        />
                        {category.name}
                      </span>
                      <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-400 transition-colors group-hover:bg-teal-50 group-hover:text-[var(--accent)]">
                        {category.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
