"use client";

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
  comments?: number | string;
  blockquote?: { text?: string; author?: string };
  extraImage1?: string;
  extraImage1Alt?: string;
  extraImage2?: string;
  extraImage2Alt?: string;
  href?: string;
};

type BlogCategory = {
  id?: string;
  title?: string;
  count?: string | number;
};

const IMG = "/categories/realestate/template5";

const defaultCategories: BlogCategory[] = [
  { id: "interior-design", title: "Interior Design", count: "12" },
  { id: "architecture", title: "Architecture", count: "08" },
  { id: "construction-tips", title: "Construction Tips", count: "15" },
  { id: "real-estate", title: "Real Estate", count: "05" },
  { id: "market-trends", title: "Market Trends", count: "09" },
];

export default function RealEstateBlogDetailPage5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const title = String(data.title || "Blog Details");
  const image = String(data.image || `${IMG}/team1.jpg`);
  const author = String(data.author || "Admin");
  const date = String(data.date || "Aug 10, 2026");
  const comments = String(data.comments ?? 3);
  const authorPrefix = String(data.authorPrefix || data.byLabel || "By");
  const commentsLabel = String(data.commentsLabel || "Comments");
  const categoriesTitle = String(data.categoriesTitle || "Categories");
  const recentPostsTitle = String(data.recentPostsTitle || "Recent Posts");
  const detailBase = String(data.detailBasePath || "/blogs").replace(/\/$/, "");
  const listingUrl = String(data.listingUrl || "/blogs");

  const paragraph1 = String(
    data.paragraph1 ||
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
  );
  const paragraph2 = String(
    data.paragraph2 ||
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
  );
  const paragraph3 = String(
    data.paragraph3 ||
      "All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures.",
  );

  const blockquote =
    data.blockquote && typeof data.blockquote === "object"
      ? (data.blockquote as { text?: string; author?: string })
      : {
          text: String(
            data.blockquoteText ||
              "When a builder builds a house, he is building his life. The heart of a home is a space of love, comfort, and shared moments.",
          ),
          author: String(data.blockquoteAuthor || "JOHN DOE"),
        };

  const extraImage1 = String(data.extraImage1 || `${IMG}/office_reno.png`);
  const extraImage1Alt = String(data.extraImage1Alt || "Construction 1");
  const extraImage2 = String(data.extraImage2 || `${IMG}/outdoors_reno.png`);
  const extraImage2Alt = String(data.extraImage2Alt || "Construction 2");

  const recentPosts = (
    Array.isArray(data.blogPosts) && data.blogPosts.length
      ? data.blogPosts
      : Array.isArray(data.recentPosts) && data.recentPosts.length
        ? data.recentPosts
        : [
            {
              id: "top-10-interior-design-trends-for-2026",
              title: "Top 10 Interior Design Trends for 2026",
              image: `${IMG}/team1.jpg`,
              date: "Aug 10, 2026",
            },
            {
              id: "how-to-increase-your-property-value",
              title: "How to Increase Your Property Value",
              image: `${IMG}/team3.jpg`,
              date: "Aug 12, 2026",
            },
            {
              id: "sustainable-architecture-innovations",
              title: "Sustainable Architecture Innovations",
              image: `${IMG}/team4.jpg`,
              date: "Aug 15, 2026",
            },
          ]
  ) as BlogPost[];

  const categories = (
    Array.isArray(data.categories) && data.categories.length
      ? data.categories
      : defaultCategories
  ) as BlogCategory[];

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
      data-editor-section-label="blogDetail"
      data-editor-fields="accentColor title image author date comments authorPrefix commentsLabel paragraph1 paragraph2 paragraph3 blockquote extraImage1 extraImage2 categoriesTitle recentPostsTitle"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-10 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
        <div className="min-w-0 flex-1">
          <div className="mb-8 h-[500px] overflow-hidden rounded-lg max-md:h-[280px]">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              data-editor-media="image"
              data-editor-media-type="image"
              data-editor-field="image"
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-6 border-b border-[#eaeaea] pb-6 text-[0.9rem] text-[#666] max-md:flex-col max-md:items-stretch max-md:gap-4">
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
              <span data-editor-field="author">
                {authorPrefix} {author}
              </span>
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
              <span data-editor-field="date">{date}</span>
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
              <span data-editor-field="comments">
                {comments} {commentsLabel}
              </span>
            </div>
          </div>

          <h1
            className="mb-6 text-[2.5rem] leading-[1.2] font-bold text-[#333] max-md:text-[1.75rem]"
            data-editor-field="title"
          >
            {title}
          </h1>

          <div className="mb-6 text-[1.05rem] leading-[1.8] text-[#666]">
            <p className="mb-6" data-editor-field="paragraph1">
              {paragraph1}
            </p>

            <blockquote className="relative my-10 rounded-r-lg border-l-4 border-[var(--accent)] bg-[#f8f9fa] p-10">
              <div className="absolute top-5 left-5 text-[var(--accent)] opacity-20">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p
                className="relative z-[2] pl-5 text-[1.25rem] leading-[1.6] text-[#333] italic"
                data-editor-field="blockquoteText"
              >
                {String(blockquote.text || "")}
              </p>
              <div className="mt-4 pl-5">
                <span
                  className="inline-flex items-center justify-center rounded bg-[var(--accent)] px-4 py-2 text-[0.8rem] font-medium tracking-[0.05em] text-white"
                  data-editor-field="blockquoteAuthor"
                >
                  {String(blockquote.author || "JOHN DOE")}
                </span>
              </div>
            </blockquote>

            <p className="mb-6" data-editor-field="paragraph2">
              {paragraph2}
            </p>

            <div className="mb-6 grid grid-cols-2 gap-6 max-md:grid-cols-1">
              <img
                src={extraImage1}
                alt={extraImage1Alt}
                className="w-full rounded-lg"
                data-editor-media="image"
                data-editor-media-type="image"
                data-editor-field="extraImage1"
              />
              <img
                src={extraImage2}
                alt={extraImage2Alt}
                className="w-full rounded-lg"
                data-editor-media="image"
                data-editor-media-type="image"
                data-editor-field="extraImage2"
              />
            </div>

            <p data-editor-field="paragraph3">{paragraph3}</p>
          </div>
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
                const titleLabel = String(category.title || "Category");
                return (
                  <li key={String(category.id || titleLabel)}>
                    <Link
                      href={listingUrl}
                      onClick={(event) =>
                        handleNavigate(event, listingUrl, "Blogs")
                      }
                      className="flex items-center justify-between text-[0.95rem] text-[#666] no-underline"
                    >
                      <span className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent)]">
                        <span className="text-[var(--accent)]">»</span>
                        {titleLabel}
                      </span>
                      {category.count != null ? (
                        <span>({String(category.count)})</span>
                      ) : null}
                    </Link>
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
              {recentPosts.slice(0, 3).map((post) => {
                const href = String(
                  post.href || `${detailBase}/${post.id || ""}`,
                );
                const postTitle = String(post.title || "Post");
                const shortTitle =
                  postTitle.length > 40
                    ? `${postTitle.slice(0, 40)}...`
                    : postTitle;
                return (
                  <Link
                    key={String(post.id || postTitle)}
                    href={href}
                    onClick={(event) =>
                      handleNavigate(event, href, postTitle)
                    }
                    className="flex items-center gap-4 text-inherit no-underline"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded">
                      <img
                        src={String(post.image || `${IMG}/kitchen_reno.png`)}
                        alt={postTitle}
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
        </aside>
      </div>
    </section>
  );
}
