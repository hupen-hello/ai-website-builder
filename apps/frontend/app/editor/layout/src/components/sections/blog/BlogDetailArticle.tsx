import type { ReactNode } from "react";
import { normalizeBlogDetailLayout } from "../../../lib/blogLayouts";

export type BlogDetailContent = {
  title: string;
  author?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  layout?: string;
};

type BlogDetailArticleProps = {
  post: BlogDetailContent;
  backSlot?: ReactNode;
};

const PAGE_SHELL = "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";

const MetaRow = ({
  author,
  category,
  light = false,
}: {
  author?: string;
  category?: string;
  light?: boolean;
}) => {
  if (!author && !category) return null;
  return (
    <p
      className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold ${
        light ? "text-white/80" : "text-slate-500"
      }`}
    >
      {category ? (
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            light
              ? "bg-white/15 text-white"
              : "theme-accent-soft"
          }`}
        >
          {category}
        </span>
      ) : null}
      {author ? <span>By {author}</span> : null}
    </p>
  );
};

const HtmlOrText = ({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return (
      <div
        className={`blog-detail-prose manager-detail-prose theme-prose max-w-none text-left text-slate-700 ${className}`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return (
    <div
      className={`whitespace-pre-wrap text-left text-lg leading-8 text-slate-700 ${className}`}
    >
      {trimmed}
    </div>
  );
};

const BackRow = ({ children }: { children?: ReactNode }) => {
  if (!children) return null;
  return <div className="mb-6 sm:mb-8">{children}</div>;
};

export default function BlogDetailArticle({
  post,
  backSlot,
}: BlogDetailArticleProps) {
  const layout = normalizeBlogDetailLayout(post.layout);
  const title = post.title || "Untitled post";
  const author = post.author?.trim() || "";
  const category = post.category?.trim() || "";
  const excerpt = post.excerpt?.trim() || "";
  const content =
    post.content?.trim() ||
    excerpt ||
    "No content has been added to this post yet.";
  const image = post.image?.trim() || "/bg1.jpg";

  // BlogPage-2 — Split showcase
  if (layout === "BlogPage-2") {
    return (
      <article className="w-full bg-slate-50 text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid lg:min-h-[560px] lg:grid-cols-2">
            <div className="relative min-h-[280px] bg-slate-200 sm:min-h-[360px] lg:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 via-transparent to-blue-900/10" />
              {category ? (
                <p className="absolute left-6 top-6 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] theme-accent shadow-sm">
                  {category}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] theme-accent">
                Article
              </p>
              <h1 className="mt-3 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
                {title}
              </h1>
              {author ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  By {author}
                </p>
              ) : null}
              {excerpt ? (
                <p className="mt-5 text-lg leading-8 text-slate-600">{excerpt}</p>
              ) : null}
              <div className="mt-8 border-t border-slate-200 pt-8">
                <HtmlOrText value={content} />
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // BlogPage-3 — Cover hero (contained)
  if (layout === "BlogPage-3") {
    return (
      <article className="w-full bg-white text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <div className="relative isolate min-h-[min(58vh,520px)] overflow-hidden rounded-[1.75rem] bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/45 to-slate-950/90" />
            <div className="relative flex min-h-[min(58vh,520px)] flex-col justify-end px-6 pb-10 pt-16 sm:px-10 sm:pb-12">
              <MetaRow author={author} category={category || "Blog"} light />
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              {excerpt ? (
                <p className="mt-4 max-w-3xl text-lg leading-8 text-white/85 sm:text-xl">
                  {excerpt}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-12 sm:mt-14">
            <HtmlOrText value={content} />
          </div>
        </div>
      </article>
    );
  }

  // BlogPage-4 — Intro + sticky summary
  if (layout === "BlogPage-4") {
    return (
      <article className="w-full bg-white text-slate-950">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)]">
          <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
            <BackRow>{backSlot}</BackRow>
            <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div>
                <MetaRow author={author} category={category} />
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                {excerpt ? (
                  <p className="mt-5 text-xl font-medium leading-9 text-slate-600">
                    {excerpt}
                  </p>
                ) : null}
              </div>
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[1.5rem] shadow-[0_20px_60px_rgba(15,23,42,0.12)] lg:aspect-[5/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className={`${PAGE_SHELL} grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16`}
        >
          <HtmlOrText value={content} />
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border-l-2 theme-accent-border-l pl-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                About this post
              </p>
              <p className="mt-3 text-xl font-bold text-slate-950">{title}</p>
              {category ? (
                <p className="mt-2 text-sm font-semibold theme-accent">
                  {category}
                </p>
              ) : null}
              {author ? (
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  By {author}
                </p>
              ) : null}
              {excerpt ? (
                <p className="mt-4 text-sm leading-6 text-slate-600">{excerpt}</p>
              ) : null}
            </div>
          </aside>
        </div>
      </article>
    );
  }

  // BlogPage-5 — Editorial story
  if (layout === "BlogPage-5") {
    return (
      <article className="w-full bg-slate-50 text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          {category ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] theme-accent">
              {category}
            </p>
          ) : null}
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {author ? (
            <div className="mt-6 flex items-center gap-3 border-y border-slate-200 py-4 text-sm font-semibold text-slate-600">
              <span className="theme-btn grid h-10 w-10 place-items-center rounded-full text-sm font-bold">
                {author.slice(0, 1).toUpperCase()}
              </span>
              <span>Written by {author}</span>
            </div>
          ) : null}
          {excerpt ? (
            <p className="mt-6 border-l-[3px] theme-accent-border-l pl-5 text-xl font-medium leading-9 text-slate-700 sm:text-2xl">
              {excerpt}
            </p>
          ) : null}
          <div className="relative mt-10 aspect-[21/9] w-full overflow-hidden rounded-2xl sm:mt-12 sm:aspect-[2.4/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-12 sm:mt-14">
            <HtmlOrText value={content} />
          </div>
        </div>
      </article>
    );
  }

  // BlogPage-1 — Hero image + body (default)
  return (
    <article className="w-full bg-white text-slate-950">
      <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
        <BackRow>{backSlot}</BackRow>
        <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="aspect-[16/7] w-full object-cover sm:aspect-[2.4/1] lg:aspect-[2.8/1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-8 pt-20 sm:px-10 sm:pb-10">
            <MetaRow author={author} category={category || "Blog"} light />
            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {excerpt ? (
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/85 sm:text-xl">
                {excerpt}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-12 sm:mt-14">
          <HtmlOrText value={content} />
        </div>
      </div>
    </article>
  );
}
