import type { ReactNode } from "react";
import { normalizePortfolioDetailLayout } from "../../../lib/portfolioLayouts";

export type PortfolioDetailContent = {
  title: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  layout?: string;
};

type PortfolioDetailArticleProps = {
  portfolioItem: PortfolioDetailContent;
  backSlot?: ReactNode;
};

const PAGE_SHELL =
  "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";

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
        className={`portfolio-detail-prose manager-detail-prose max-w-none text-slate-700 ${className}`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return (
    <div
      className={`whitespace-pre-wrap text-lg leading-8 text-slate-700 ${className}`}
    >
      {trimmed}
    </div>
  );
};

const BackRow = ({
  children,
  light = false,
}: {
  children?: ReactNode;
  light?: boolean;
}) => {
  if (!children) return null;
  return (
    <div
      className={`mb-6 sm:mb-8 ${light ? "[&_a]:text-white/90 [&_a]:hover:text-white" : ""}`}
    >
      {children}
    </div>
  );
};

export default function PortfolioDetailArticle({
  portfolioItem,
  backSlot,
}: PortfolioDetailArticleProps) {
  const layout = normalizePortfolioDetailLayout(portfolioItem.layout);
  const title = portfolioItem.title || "Untitled portfolio item";
  const category = portfolioItem.category?.trim() || "";
  const excerpt = portfolioItem.excerpt?.trim() || "";
  const content =
    portfolioItem.content?.trim() ||
    excerpt ||
    "No content has been added to this portfolio item yet.";
  const image = portfolioItem.image?.trim() || "/bg1.jpg";

  if (layout === "PortfolioDetail-2") {
    return (
      <article className="w-full bg-[#f4f7f6] text-slate-950">
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
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/45 via-transparent to-teal-900/15" />
              {category ? (
                <p className="absolute left-6 top-6 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-800 shadow-sm">
                  {category}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">
                Selected work
              </p>
              <h1 className="mt-3 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
                {title}
              </h1>
              {excerpt ? (
                <p className="mt-5 text-lg leading-8 text-slate-600 sm:text-xl">
                  {excerpt}
                </p>
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

  if (layout === "PortfolioDetail-3") {
    return (
      <article className="w-full bg-white text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <div className="relative isolate min-h-[min(58vh,520px)] overflow-hidden rounded-[1.75rem] bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/45 to-slate-950/90" />
            <div className="relative flex min-h-[min(58vh,520px)] flex-col justify-end px-6 pb-10 pt-16 sm:px-10 sm:pb-12">
              {category ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-teal-200">
                  {category}
                </p>
              ) : null}
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

  if (layout === "PortfolioDetail-4") {
    return (
      <article className="w-full bg-white text-slate-950">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#eef6f4_0%,#ffffff_100%)]">
          <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
            <BackRow>{backSlot}</BackRow>
            <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div>
                {category ? (
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">
                    {category}
                  </p>
                ) : null}
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
            <div className="border-l-2 border-teal-600 pl-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                At a glance
              </p>
              <p className="mt-3 text-xl font-bold text-slate-950">{title}</p>
              {category ? (
                <p className="mt-2 text-sm font-semibold text-teal-700">
                  {category}
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

  if (layout === "PortfolioDetail-5") {
    return (
      <article className="w-full bg-slate-50 text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          {category ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-teal-800">
              {category}
            </p>
          ) : null}
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {excerpt ? (
            <p className="mt-6 border-l-[3px] border-teal-700 pl-5 text-xl font-medium leading-9 text-slate-700 sm:text-2xl">
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
            {category ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-200">
                {category}
              </p>
            ) : null}
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
