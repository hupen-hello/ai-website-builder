import type { ReactNode } from "react";
import { normalizeEventDetailLayout } from "../../../lib/eventLayouts";

export type EventDetailContent = {
  title: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  layout?: string;
  eventDate?: string;
  eventTime?: string;
  eventType?: "upcoming" | "past";
};

type EventDetailArticleProps = {
  eventItem: EventDetailContent;
  backSlot?: ReactNode;
};

const PAGE_SHELL =
  "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";

const stripHtmlText = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const HtmlOrText = ({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) => {
  const trimmed = value.trim();
  if (!trimmed || !stripHtmlText(trimmed)) return null;
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return (
      <div
        className={`event-detail-prose manager-detail-prose max-w-none text-slate-700 ${className}`}
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

const EventMeta = ({
  category,
  eventType,
  eventDate,
  eventTime,
  light = false,
}: {
  category?: string;
  eventType?: "upcoming" | "past";
  eventDate?: string;
  eventTime?: string;
  light?: boolean;
}) => {
  const typeLabel = eventType === "past" ? "Past Event" : "Upcoming";
  const when = [eventDate, eventTime].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {category ? (
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
            light ? "text-teal-200" : "text-teal-700"
          }`}
        >
          {category}
        </span>
      ) : null}
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
          eventType === "past"
            ? light
              ? "bg-white/15 text-white/80"
              : "bg-slate-200 text-slate-600"
            : light
              ? "bg-emerald-400/20 text-emerald-100"
              : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {typeLabel}
      </span>
      {when ? (
        <span
          className={`text-sm font-semibold ${
            light ? "text-white/75" : "text-slate-500"
          }`}
        >
          {when}
        </span>
      ) : null}
    </div>
  );
};

export default function EventDetailArticle({
  eventItem,
  backSlot,
}: EventDetailArticleProps) {
  const layout = normalizeEventDetailLayout(eventItem.layout);
  const title = eventItem.title || "Untitled event";
  const category = eventItem.category?.trim() || "";
  const excerpt = eventItem.excerpt?.trim() || "";
  const rawContent = eventItem.content?.trim() || "";
  const hasBody = Boolean(stripHtmlText(rawContent));
  const content =
    (hasBody ? rawContent : "") ||
    excerpt ||
    "No content has been added to this event yet.";
  const showExcerpt =
    Boolean(excerpt) && stripHtmlText(content) !== stripHtmlText(excerpt);
  const image = eventItem.image?.trim() || "/bg1.jpg";
  const eventType = eventItem.eventType === "past" ? "past" : "upcoming";
  const eventDate = eventItem.eventDate?.trim() || "";
  const eventTime = eventItem.eventTime?.trim() || "";

  // EventDetail-2 — Split (no overflow clip on the story column)
  if (layout === "EventDetail-2") {
    return (
      <article className="w-full bg-[#f4f7f6] text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <div className="rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid lg:grid-cols-2">
            <div className="relative min-h-[280px] overflow-hidden rounded-t-[1.75rem] bg-slate-200 sm:min-h-[360px] lg:min-h-full lg:rounded-l-[1.75rem] lg:rounded-tr-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/45 via-transparent to-teal-900/15" />
            </div>
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
              <EventMeta
                category={category}
                eventType={eventType}
                eventDate={eventDate}
                eventTime={eventTime}
              />
              <h1 className="mt-3 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
                {title}
              </h1>
              {showExcerpt ? (
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

  // EventDetail-3 — Cover image same width as content
  if (layout === "EventDetail-3") {
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
              <EventMeta
                category={category}
                eventType={eventType}
                eventDate={eventDate}
                eventTime={eventTime}
                light
              />
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              {showExcerpt ? (
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

  // EventDetail-4 — Intro + summary
  if (layout === "EventDetail-4") {
    return (
      <article className="w-full bg-white text-slate-950">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#eef6f4_0%,#ffffff_100%)]">
          <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
            <BackRow>{backSlot}</BackRow>
            <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div>
                <EventMeta
                  category={category}
                  eventType={eventType}
                  eventDate={eventDate}
                  eventTime={eventTime}
                />
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                {showExcerpt ? (
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
              <div className="mt-3">
                <EventMeta
                  category={category}
                  eventType={eventType}
                  eventDate={eventDate}
                  eventTime={eventTime}
                />
              </div>
              {excerpt ? (
                <p className="mt-4 text-sm leading-6 text-slate-600">{excerpt}</p>
              ) : null}
            </div>
          </aside>
        </div>
      </article>
    );
  }

  // EventDetail-5 — Title, image, content
  if (layout === "EventDetail-5") {
    return (
      <article className="w-full bg-slate-50 text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <EventMeta
            category={category}
            eventType={eventType}
            eventDate={eventDate}
            eventTime={eventTime}
          />
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {showExcerpt ? (
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

  // EventDetail-1 — Hero image + full content below
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
            <EventMeta
              category={category}
              eventType={eventType}
              eventDate={eventDate}
              eventTime={eventTime}
              light
            />
            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {showExcerpt ? (
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
