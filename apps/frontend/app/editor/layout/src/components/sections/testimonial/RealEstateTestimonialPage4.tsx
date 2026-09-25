"use client";

import { Quote, Star } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import type {
  TestimonialPage4Data,
  TestimonialPage4Item,
} from "../../../types/realEstatePage4";
import { testimonialPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";

export default function RealEstateTestimonialPage4({
  data = {},
}: SectionProps) {
  const authored = testimonialPage4Content.RealEstateTestimonialPage4;
  const content: TestimonialPage4Data = {
    ...authored,
    ...(data as TestimonialPage4Data),
  };
  const testimonials: TestimonialPage4Item[] = content.testimonials?.length
    ? content.testimonials
    : (authored.testimonials ?? []);

  return (
    <section
      className="bg-[#f8f7f5] py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="testimonials"
      data-editor-fields="accentColor testimonials"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div
          className="grid grid-cols-1 gap-8 lg:grid-cols-2"
          data-box-layout-grid="grid"
        >
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="group relative flex flex-col items-center gap-6 rounded-[40px] bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-stretch sm:gap-8 sm:p-8"
            >
              <div className="relative h-[180px] w-[140px] shrink-0 sm:h-[200px] sm:w-[160px]">
                <div className="h-full w-full overflow-hidden rounded-[32px]">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    data-editor-media="image"
                    data-editor-media-type="image"
                  />
                </div>
                <div className="absolute bottom-4 left-1/2 flex w-max -translate-x-1/2 items-center justify-center gap-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm"
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center py-2 sm:pr-8">
                <p
                  className="mb-6 text-[15px] leading-relaxed text-gray-500 sm:text-base"
                  data-editor-field="text"
                >
                  &ldquo; {testimonial.text} &rdquo;
                </p>
                <div className="mb-6 h-px w-full bg-gray-200" />
                <div>
                  <h3
                    className="mb-1 text-xl font-bold text-secondary"
                    data-editor-field="name"
                  >
                    {testimonial.name}
                  </h3>
                  <p
                    className="text-sm text-gray-500"
                    data-editor-field="location"
                  >
                    {testimonial.location}
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-2 -right-2 rounded-full bg-[#f8f7f5] p-3 sm:p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#222222] shadow-md sm:h-14 sm:w-14">
                  <Quote className="h-5 w-5 fill-white text-white sm:h-6 sm:w-6" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
