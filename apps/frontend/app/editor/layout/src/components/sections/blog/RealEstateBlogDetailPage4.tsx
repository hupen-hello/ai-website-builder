"use client";

import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import {
  blogPage4Content,
  blogDetailPage4Content,
} from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  BlogDetailPage4Data,
  BlogPage4Post,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const FALLBACK_IMAGE =
  "/categories/realestate/template4/unsplash-d3b2de36.jpg";

const DEFAULT_BODY = `{excerpt}

**Lorem Ipsum**

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

**Duis Aute Irure**

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

export default function RealEstateBlogDetailPage4({
  data = {},
}: SectionProps) {
  const authored = blogDetailPage4Content.RealEstateBlogDetailPage4;
  const listingPosts = blogPage4Content.RealEstateBlogPage4.blogPosts ?? [];
  const content: BlogDetailPage4Data = {
    ...authored,
    ...(data as BlogDetailPage4Data),
  };
  const fallbackImage = content.fallbackImage ?? FALLBACK_IMAGE;
  const excerpt = content.excerpt || content.description || "";
  const rawBody = (
    content.body || DEFAULT_BODY.replace("{excerpt}", excerpt)
  ).trim();
  const paragraphs = rawBody.split("\n\n").filter(Boolean);
  const recentPosts: BlogPage4Post[] = listingPosts
    .filter((post) => post.id !== content.id)
    .slice(0, 4);

  return (
    <section
      className="min-h-screen bg-[#f8f6f2] py-12 md:py-20"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="blogDetail"
      data-editor-fields="accentColor image title badge category date author readTime excerpt body recentPostsTitle newsletterTitle newsletterDescription newsletterPlaceholder newsletterButtonText"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-10">
              <div className="mb-8">
                <div
                  className="mb-4 inline-block rounded-md bg-teal-50 px-3 py-1.5 text-xs font-bold tracking-wider text-[var(--accent)] uppercase"
                  data-editor-field="category"
                >
                  {content.badge || content.category || "News"}
                </div>
                <h1
                  className="mb-6 text-3xl leading-tight font-extrabold text-[#1a2332] md:text-4xl"
                  data-editor-field="title"
                >
                  {content.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[var(--accent)]" />
                    <span data-editor-field="author">
                      {content.author || "Admin"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[var(--accent)]" />
                    <span data-editor-field="date">{content.date}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--accent)]" />
                    <span data-editor-field="readTime">
                      {content.readTime ?? "5 min read"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="relative mb-10 h-[300px] w-full overflow-hidden rounded-xl md:h-[450px]">
                <img
                  src={content.image || fallbackImage}
                  alt={content.title ?? ""}
                  className="h-full w-full object-cover"
                  data-editor-media="image"
                  data-editor-media-type="image"
                />
              </div>

              <div className="prose max-w-none">
                {paragraphs.map((paragraph, index) => {
                  const isHeading =
                    paragraph.startsWith("**") && paragraph.endsWith("**");
                  if (isHeading) {
                    return (
                      <h3
                        key={`${paragraph}-${index}`}
                        className="mt-8 mb-3 text-xl font-bold text-[#1a2332]"
                      >
                        {paragraph.replace(/\*\*/g, "")}
                      </h3>
                    );
                  }
                  return (
                    <p
                      key={`${paragraph}-${index}`}
                      className="mb-5 leading-relaxed text-gray-600 md:text-lg"
                      data-editor-field={index === 0 ? "excerpt" : "body"}
                    >
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </article>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <h3
                className="mb-6 border-b border-gray-100 pb-4 text-xl font-bold text-[#1a2332]"
                data-editor-field="recentPostsTitle"
              >
                {content.recentPostsTitle ?? "Recent Posts"}
              </h3>

              <div className="flex flex-col gap-6">
                {recentPosts.map((recentPost) => (
                  <Link
                    key={recentPost.id}
                    href={`/template4/blog/${recentPost.id}`}
                    className="group flex items-start gap-4"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={recentPost.image || fallbackImage}
                        alt={recentPost.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="mb-1 block text-[10px] font-bold tracking-wider text-[var(--accent)] uppercase">
                        {recentPost.badge || recentPost.category || "News"}
                      </span>
                      <h4 className="mb-2 line-clamp-2 text-sm leading-tight font-bold text-[#1a2332] transition-colors group-hover:text-[var(--accent)]">
                        {recentPost.title}
                      </h4>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" /> {recentPost.date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <form
                  className="rounded-xl bg-[#f8f6f2] p-6 text-center"
                  onSubmit={(event) => event.preventDefault()}
                >
                  <h4
                    className="mb-2 font-bold text-[#1a2332]"
                    data-editor-field="newsletterTitle"
                  >
                    {content.newsletterTitle ?? "Subscribe to Our Newsletter"}
                  </h4>
                  <p
                    className="mb-4 text-xs text-gray-500"
                    data-editor-field="newsletterDescription"
                  >
                    {content.newsletterDescription ??
                      "Get the latest news directly in your inbox."}
                  </p>
                  <input
                    type="email"
                    placeholder={
                      content.newsletterPlaceholder ?? "Your email address"
                    }
                    className="mb-3 w-full rounded-lg border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-[var(--accent)] focus:ring-[var(--accent)]"
                    data-editor-field="newsletterPlaceholder"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#1a2332] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[var(--accent)]"
                    data-editor-field="newsletterButtonText"
                  >
                    {content.newsletterButtonText ?? "Subscribe"}
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
