'use client';
import type { SectionProps } from "../../../types/section";
import React, { useState, useEffect } from 'react';
import { GalleryData } from "../../../lib/applianceTypes";
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { handleManagerCardClick } from "../../../lib/editorManagerCards";

export const GallerySection = ({ data, editorMode }: { data?: GalleryData, editorMode?: boolean }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Handle keyboard navigation (escape to close, arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const handleNext = () => {
    if (data?.images) {
      setSelectedIndex((prev) => (prev === null ? null : (prev + 1) % data.images.length));
    }
  };

  const handlePrev = () => {
    if (data?.images) {
      setSelectedIndex((prev) => (prev === null ? null : (prev - 1 + data.images.length) % data.images.length));
    }
  };

  if (!data) return null;

  return (
    <section className="w-full py-16 lg:py-12 bg-white">
      <div className="max-w-[1250px] mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-[1px] w-12 bg-[var(--color-accent)]"></span>
            <span className="text-[var(--color-accent)] font-bold text-sm tracking-widest uppercase">{data.subtitle}</span>
            <span className="h-[1px] w-12 bg-[var(--color-accent)]"></span>
          </div>
          <h2 className="text-4xl md:text-[42px] font-extrabold text-[var(--color-primary)] mb-4">
            {data.title1} <span className="text-[var(--color-accent)]">{data.title2}</span>
          </h2>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[240px]">
          {data.images.map((item, index) => {
            const isLarge = index === 0;
            return (
              <div
                key={item.id}
                data-editor-no-inline="true"
                onClick={() => {
                  if (!editorMode) setSelectedIndex(index);
                }}
                className={`group relative rounded-[16px] overflow-hidden cursor-pointer ${isLarge ? 'row-span-2 sm:row-span-2' : 'row-span-1'}`}
              >
                <button
                  type="button"
                  className="absolute inset-0 z-20 cursor-pointer"
                  onClick={(event) => {
                    if (editorMode) {
                      handleManagerCardClick(event, true, "Gallery", {
                        id: item.id,
                        title: item.title || item.alt,
                        image: item.image,
                      });
                      return;
                    }
                    setSelectedIndex(index);
                  }}
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                </button>
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                   <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm text-white transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                   </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow-md pointer-events-none">
                  <h4 className="font-bold text-[var(--color-primary)] text-[13px] md:text-[14px]">
                    {item.title}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <button 
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 md:top-10 md:right-10 text-white/70 hover:text-white transition-colors text-3xl z-50 p-2"
          >
            <FaTimes />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 md:left-10 text-white/70 hover:text-white bg-black/50 hover:bg-black p-3 md:p-4 rounded-full transition-all text-2xl z-50"
          >
            <FaChevronLeft />
          </button>
          
          <div 
            className="relative w-full max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={data.images[selectedIndex].image} 
              alt={data.images[selectedIndex].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-[-40px] left-0 right-0 text-center">
               <h3 className="text-white font-semibold text-lg">{data.images[selectedIndex].title}</h3>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 md:right-10 text-white/70 hover:text-white bg-black/50 hover:bg-black p-3 md:p-4 rounded-full transition-all text-2xl z-50"
          >
            <FaChevronRight />
          </button>
          
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setSelectedIndex(null)}
          ></div>
        </div>
      )}
    </section>
  );
};

export default function ServiceGalleryPage({ data = {}, editorMode }: SectionProps) {
  return <GallerySection data={data as never} editorMode={editorMode} />;
}

