'use client';

import React, { useState } from 'react';
import { BlogsData } from './applianceTypes';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { ApplianceLink as Link } from "./ApplianceLink";
import { handleManagerCardClick } from "../../../lib/editorManagerCards";

export const BlogsSection = ({ data, isListingPage = false, editorMode }: { data?: BlogsData, isListingPage?: boolean, editorMode?: boolean }) => {
  const [visibleCount, setVisibleCount] = useState(3);

  if (!data || !data.blogs) return null;

  const blogs = data.blogs.filter((blog) => isListingPage || (blog as { showOnHome?: boolean }).showOnHome !== false);
  const visibleBlogs = blogs.slice(0, isListingPage ? visibleCount : 3);
  const hasMore = visibleCount < blogs.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  return (
    <section className="w-full py-16 lg:py-12 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#f0f7ff] to-white opacity-80" />

      {/* Optional soft background shapes to mimic the design curve */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#e0f0ff] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 opacity-60 z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#e8f4ff] rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 opacity-60 z-0" />

      <div className="max-w-[1250px] mx-auto px-4 md:px-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 lg:mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-[2px] bg-[#70b5f9]" />
            <h4 className="text-[var(--color-accent)] font-bold text-xs sm:text-sm tracking-widest uppercase">
              {data.subtitle}
            </h4>
            <div className="w-12 h-[2px] bg-[#70b5f9]" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-[46px] font-extrabold text-[var(--color-primary)] leading-tight mb-4">
            {data.title1} <span className="text-[var(--color-accent)]">{data.title2}</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-[15px] sm:text-base leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {visibleBlogs.map((blog) => (
            <div
              key={blog.id}
              data-editor-no-inline="true"
              className="relative bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col group border border-[#f0f4f9]"
            >
              <Link
                href={blog.url}
                className="absolute inset-0 z-20"
                onClick={(event) =>
                  handleManagerCardClick(event, editorMode, "Blogs", {
                    id: blog.id,
                    slug: blog.id,
                    title: blog.title,
                    href: blog.url,
                    image: blog.image,
                  })
                }
              >
                <span className="absolute inset-0" aria-hidden="true" />
              </Link>
              {/* Image Area */}
              <Link href={blog.url} className="relative h-[220px] sm:h-[240px] w-full overflow-hidden block p-3 pb-0">
                <div className="w-full h-full relative rounded-[16px] overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Category Badge over image */}
                  <div className="absolute top-4 left-4 bg-[#007bff] text-white px-3 py-1.5 rounded-full shadow-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 z-10">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="12px" width="12px" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
                    {blog.category}
                  </div>
                </div>
              </Link>

              {/* Content Area */}
              <div className="p-6 md:p-8 pt-5 flex flex-col flex-grow bg-white relative z-10">
                <div className="flex items-center gap-2 text-gray-400 text-[13px] font-medium mb-3">
                  <FaCalendarAlt className="text-[#007bff]" />
                  <span>{blog.date}</span>
                </div>
                
                <Link href={blog.url} className="group-hover:text-[#007bff] transition-colors duration-300">
                  <h3 className="text-[19px] font-extrabold text-[#051838] leading-snug mb-3 line-clamp-2">
                    {blog.title}
                  </h3>
                </Link>
                
                <p className="text-gray-500 text-[14px] leading-relaxed mb-6 flex-grow line-clamp-3">
                  {blog.description}
                </p>
                
                <Link
                  href={blog.url}
                  className="text-[#007bff] font-bold text-[14px] flex items-center gap-2 mt-auto w-fit group/link"
                >
                  Read More
                  <FaArrowRight className="text-[12px] group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {!isListingPage && data.button && (
          <div className="mt-12 flex justify-center">
            <Link
              href={data.button.url}
              className="inline-flex items-center gap-3 bg-[var(--color-accent)] hover:bg-blue-600 text-white font-bold py-3.5 px-8 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {data.button.text.replace('->', '').trim()}
              <FaArrowRight className="text-[13px]" />
            </Link>
          </div>
        )}

        {/* Load More Button */}
        {isListingPage && hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center gap-3 bg-[var(--color-accent)] hover:bg-blue-600 text-white font-bold py-3.5 px-8 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Load More
              <FaArrowRight className="text-[13px]" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
