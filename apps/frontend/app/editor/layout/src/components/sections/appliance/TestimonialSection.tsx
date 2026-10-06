'use client';
import React, { useRef, useState } from 'react';
import { TestimonialsData } from './applianceTypes';
import { FaChevronLeft, FaChevronRight, FaStar, FaMapMarkerAlt, FaQuoteRight } from 'react-icons/fa';

export const TestimonialSection = ({ data }: { data?: TestimonialsData }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!data || !data.testimonials) return null;

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      if (activeIndex === 0) {
        // Loop to end
        scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
      } else {
        scrollToIndex(activeIndex - 1);
      }
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // If we've reached the end of the scrollable area
      if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 10) {
        scrollToIndex(0); // Loop back to start
      } else {
        scrollToIndex(activeIndex + 1);
      }
    }
  };

  // Determine number of dots (approximate based on total items, for simplicity we show dots for every item)
  const dots = Array.from({ length: Math.max(1, data.testimonials.length - 2) }); // Assuming showing 3 items roughly

  return (
    <section className="w-full py-16 lg:py-12 relative bg-white overflow-hidden">
      {/* Background shapes or image (wrapped to prevent scrollbars) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {data.bgImage ? (
          <img src={data.bgImage} alt="Testimonials Background" className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#f0f7ff] to-white opacity-80" />
            <div className="absolute top-0 left-[-20%] w-[800px] h-[800px] bg-[#e0f0ff] rounded-full blur-[120px] opacity-60" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#e8f4ff] rounded-full blur-[100px] opacity-60" />
          </>
        )}
      </div>

      <div className="max-w-[1350px] mx-auto px-12 md:px-20 lg:px-24 relative z-10">

        {/* Section Header */}
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

        {/* Slider Container with side arrows */}
        <div className="relative group">

          {/* Side Arrows */}
          <button
            onClick={scrollLeft}
            className="flex absolute left-[-45px] md:left-[-70px] lg:left-[-80px] top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--color-accent)] text-white items-center justify-center shadow-lg hover:bg-blue-600 transition-colors z-20"
          >
            <FaChevronLeft />
          </button>

          <button
            onClick={scrollRight}
            className="flex absolute right-[-45px] md:right-[-70px] lg:right-[-80px] top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--color-accent)] text-white items-center justify-center shadow-lg hover:bg-blue-600 transition-colors z-20"
          >
            <FaChevronRight />
          </button>

          {/* Cards Wrapper */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {data.testimonials.map((testi) => (
              <div
                key={testi.id}
                className="relative bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-8 flex-shrink-0 w-[100%] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-center flex flex-col overflow-hidden"
              >
                {/* Background Quote Mark */}
                <FaQuoteRight className="absolute top-6 right-6 text-7xl text-blue-50 opacity-50 z-0 pointer-events-none" />

                {/* Card Header (Avatar + Info) */}
                <div className="flex items-center gap-5 mb-6 relative z-10">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-50 p-1 flex-shrink-0">
                    <img src={testi.avatar} alt={testi.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    {/* Stars */}
                    <div className="flex gap-1 text-[#ffb400] mb-2">
                      {[...Array(testi.rating)].map((_, i) => (
                        <FaStar key={i} size={14} />
                      ))}
                    </div>
                    <h4 className="font-extrabold text-[var(--color-primary)] text-[17px] mb-1 leading-tight">{testi.name}</h4>
                    <p className="text-[var(--color-accent)] text-[13px] font-semibold flex items-center gap-1.5">
                      <FaMapMarkerAlt />
                      {testi.location}
                    </p>
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-gray-500 text-[15px] leading-relaxed relative z-10 flex-grow">
                  "{testi.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {dots.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`rounded-full transition-all duration-300 ${activeIndex === i
                  ? 'w-3 h-3 bg-[var(--color-accent)]'
                  : 'w-2.5 h-2.5 bg-blue-100 hover:bg-blue-200'
                }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
