"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import { getPageLabelFromHref, scrollTemplateToTop } from "../../../lib/previewNav";
import type { RealEstateHome5Blog } from "../../../types/realEstateHome5";

export default function RealEstateBlog5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const posts = (Array.isArray(data.blogItems)
    ? data.blogItems
    : Array.isArray(data.blogs)
      ? data.blogs
      : []) as RealEstateHome5Blog[];
  const readMore = String(data.readMoreText || data.buttons?.[0]?.label || "Read More");

  const postHref = (post: RealEstateHome5Blog) =>
    String(post.href || `${data.detailBasePath || "/blogs"}/${post.id || ""}`);

  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  return (
    <section
      className="border-t border-[#eaeaea] bg-[#f9f9f9] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor pretitle title blogItems readMoreText"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="mb-12 text-center">
          <div className="mb-4 font-semibold tracking-[0.1em] text-[var(--accent)] uppercase">
            {String(data.pretitle || data.subtitle || "Latest News")}
          </div>
          <h2 className="font-extrabold text-[#333]">{String(data.title || "Our Latest Blogs")}</h2>
          <div className="mx-auto mt-4 flex items-center justify-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-xl bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3" data-box-layout-grid="grid">
          {posts.slice(0, 3).map((post) => {
            const href = postHref(post);
            const excerpt = String(post.excerpt || "");
            return (
              <div key={post.title} className="flex flex-col overflow-hidden rounded-lg bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition hover:-translate-y-2">
                <div className="h-[250px] overflow-hidden">
                  <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex gap-4 text-[0.85rem] text-[#666]">
                    <span>{post.date}</span>
                    <span>{post.author}</span>
                  </div>
                  <h3 className="mb-4 text-[1.3rem] leading-snug">
                    <Link href={href} onClick={(event) => handleNavigate(event, href, post.title)} className="hover:text-[var(--accent)]">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mb-6 flex-1 text-[#666]">
                    {excerpt.length > 100 ? `${excerpt.slice(0, 100)}...` : excerpt}
                  </p>
                  <Link href={href} onClick={(event) => handleNavigate(event, href, post.title)} className="inline-flex items-center gap-2 font-semibold text-[var(--accent)]">
                    {readMore}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
