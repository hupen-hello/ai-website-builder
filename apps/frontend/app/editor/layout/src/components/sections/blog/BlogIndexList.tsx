import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { normalizeBlogIndexLayout } from "../../../lib/blogLayouts";

export type BlogIndexItem = {
  href: string;
  label: string;
  image?: string;
  category?: string;
  shortDescription?: string;
  author?: string;
  createdAt?: string;
};

type BlogIndexListProps = {
  blogs: BlogIndexItem[];
  layout?: string;
  getHref: (blog: BlogIndexItem) => string;
  title?: string;
  subtitle?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
};

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
    No blog posts have been published yet.
  </div>
);

const IndexHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <section className="border-b border-slate-200 bg-white px-5 py-12 sm:py-16">
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent">
        Latest articles
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-slate-600">{subtitle}</p>
    </div>
  </section>
);

export default function BlogIndexList({
  blogs,
  layout,
  getHref,
  title = "Blogs",
  subtitle = "Insights, updates and useful stories from our team.",
}: BlogIndexListProps) {
  const resolved = normalizeBlogIndexLayout(layout);
  const [featured, ...rest] = blogs;

  if (resolved === "BlogIndex-2") {
    return (
      <div className="min-h-[60vh] bg-slate-50 text-slate-900">
        <IndexHeader title={title} subtitle={subtitle} />
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          {!blogs.length ? (
            <EmptyState />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
              {featured ? (
                <Link
                  href={getHref(featured)}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featured.image || "/bg1.jpg"}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-7">
                    <p className="text-xs font-bold uppercase tracking-wider theme-accent">
                      {featured.category || "General"}
                    </p>
                    <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">
                      {featured.label}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-base leading-7 text-slate-600">
                      {featured.shortDescription || "Read this blog post."}
                    </p>
                    {featured.author ? (
                      <p className="mt-4 text-sm font-semibold text-slate-500">
                        By {featured.author}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ) : null}
              <div className="space-y-4">
                {(rest.length ? rest : blogs.slice(1)).map((blog) => (
                  <Link
                    key={blog.href}
                    href={getHref(blog)}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200"
                  >
                    <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={blog.image || "/bg1.jpg"}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider theme-accent">
                        {blog.category || "General"}
                      </p>
                      <h3 className="mt-1 line-clamp-2 font-bold text-slate-950">
                        {blog.label}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {blog.shortDescription || "Read more"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (resolved === "BlogIndex-3") {
    return (
      <div className="min-h-[60vh] bg-white text-slate-900">
        <IndexHeader title={title} subtitle={subtitle} />
        <section className="mx-auto max-w-5xl space-y-5 px-5 py-10 sm:px-8">
          {!blogs.length ? (
            <EmptyState />
          ) : (
            blogs.map((blog) => (
              <Link
                key={blog.href}
                href={getHref(blog)}
                className="group flex flex-col gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-white sm:flex-row sm:items-center"
              >
                <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:aspect-auto sm:h-36 sm:w-56">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blog.image || "/bg1.jpg"}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider theme-accent">
                    <span>{blog.category || "General"}</span>
                    {formatDate(blog.createdAt) ? (
                      <span className="text-slate-400">
                        {formatDate(blog.createdAt)}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {blog.label}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {blog.shortDescription || "Read this blog post."}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    {blog.author ? `By ${blog.author}` : "Read article"}
                    <ArrowRight
                      size={14}
                      className="ml-1 inline-block align-[-2px]"
                    />
                  </p>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    );
  }

  if (resolved === "BlogIndex-4") {
    return (
      <div className="min-h-[60vh] bg-white text-slate-900">
        <IndexHeader title={title} subtitle={subtitle} />
        <section className="mx-auto max-w-3xl divide-y divide-slate-200 px-5 py-6 sm:px-8">
          {!blogs.length ? (
            <div className="py-8">
              <EmptyState />
            </div>
          ) : (
            blogs.map((blog) => (
              <Link
                key={blog.href}
                href={getHref(blog)}
                className="block py-8 transition hover:opacity-80"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] theme-accent">
                  {blog.category || "General"}
                  {blog.author ? ` · ${blog.author}` : ""}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {blog.label}
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {blog.shortDescription || "Read this blog post."}
                </p>
              </Link>
            ))
          )}
        </section>
      </div>
    );
  }

  if (resolved === "BlogIndex-5") {
    return (
      <div className="min-h-[60vh] bg-slate-950 text-white">
        <section className="border-b border-white/10 px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent">
              Latest articles
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-white/70">{subtitle}</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
          {!blogs.length ? (
            <div className="col-span-full rounded-2xl border border-dashed border-white/20 p-12 text-center text-white/60">
              No blog posts have been published yet.
            </div>
          ) : (
            blogs.map((blog) => (
              <Link
                key={blog.href}
                href={getHref(blog)}
                className="group relative isolate aspect-[4/5] overflow-hidden rounded-3xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blog.image || "/bg1.jpg"}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-[11px] font-bold uppercase tracking-wider theme-accent">
                    {blog.category || "General"}
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-snug">
                    {blog.label}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-white/75">
                    {blog.shortDescription || "Read this blog post."}
                  </p>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    );
  }

  // BlogIndex-1 card grid
  return (
    <div className="min-h-[60vh] bg-slate-50 text-slate-900">
      <IndexHeader title={title} subtitle={subtitle} />
      <section className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {!blogs.length ? (
          <div className="col-span-full">
            <EmptyState />
          </div>
        ) : (
          blogs.map((blog) => (
            <Link
              key={blog.href}
              href={getHref(blog)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blog.image || "/bg1.jpg"}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider theme-accent">
                  <span>{blog.category || "General"}</span>
                  <span className="text-slate-400">
                    {formatDate(blog.createdAt)}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-black leading-snug text-slate-950">
                  {blog.label}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {blog.shortDescription || "Read this blog post."}
                </p>
                {blog.author ? (
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    By {blog.author}
                  </p>
                ) : null}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-950">
                  Read article <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
