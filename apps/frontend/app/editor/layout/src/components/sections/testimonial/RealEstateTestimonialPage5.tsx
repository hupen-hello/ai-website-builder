"use client";

import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type TestimonialItem = {
  id?: string;
  name?: string;
  role?: string;
  location?: string;
  content?: string;
  quote?: string;
  text?: string;
  image?: string;
  rating?: number;
};

const IMG = "/categories/realestate/template5";

const defaultTestimonials: TestimonialItem[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    role: "Homeowner",
    content:
      "The team transformed our outdated kitchen into a modern masterpiece. Their attention to detail and professionalism was outstanding from start to finish.",
    image: `${IMG}/hero_worker.png`,
    rating: 5,
  },
  {
    id: "2",
    name: "David Chen",
    role: "Property Investor",
    content:
      "I've worked with many contractors, but this company is by far the most reliable. They finished the commercial renovation two weeks ahead of schedule.",
    image: `${IMG}/kitchen_reno.png`,
    rating: 5,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Restaurant Owner",
    content:
      "Our restaurant needed a complete overhaul, and they delivered beyond our expectations. The new design is stunning and perfectly captures our brand.",
    image: `${IMG}/bathroom_reno.png`,
    rating: 4,
  },
  {
    id: "4",
    name: "Michael Harrison",
    role: "Homeowner",
    content:
      "They built our dream home from the ground up. The craftsmanship is impeccable, and they were incredibly transparent about costs throughout.",
    image: `${IMG}/office_reno.png`,
    rating: 5,
  },
  {
    id: "5",
    name: "Jessica Albright",
    role: "Office Manager",
    content:
      "The office renovation was seamless. They worked around our schedule to minimize disruption, and the result is a beautiful, productive workspace.",
    image: `${IMG}/outdoors_reno.png`,
    rating: 5,
  },
  {
    id: "6",
    name: "Robert Barnes",
    role: "Real Estate Agent",
    content:
      "I always recommend them to my clients for pre-sale renovations. They know exactly how to maximize property value with strategic upgrades.",
    image: `${IMG}/hero_worker.png`,
    rating: 5,
  },
  {
    id: "7",
    name: "Amanda Croft",
    role: "Homeowner",
    content:
      "Our bathroom remodel was completed beautifully. The crew was respectful, clean, and highly skilled. I couldn't be happier with the results.",
    image: `${IMG}/kitchen_reno.png`,
    rating: 4,
  },
  {
    id: "8",
    name: "Thomas Wright",
    role: "Business Owner",
    content:
      "The warehouse expansion project was handled with true professionalism. Safety was a top priority, and the structural integrity is top-notch.",
    image: `${IMG}/bathroom_reno.png`,
    rating: 5,
  },
  {
    id: "9",
    name: "Linda Martinez",
    role: "Homeowner",
    content:
      "From the initial design consultation to the final walkthrough, the experience was fantastic. They truly listened to our needs and delivered.",
    image: `${IMG}/office_reno.png`,
    rating: 5,
  },
];

function Stars({ rating = 5 }: { rating?: number }) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 5)));
  return (
    <div className="flex gap-0.5 text-[var(--accent)]" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? "opacity-100" : "opacity-30"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function RealEstateTestimonialPage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(
    data.pretitle || data.gridSubtitle || data.subtitle || "Clients Love Our Work",
  );
  const title = String(
    data.title || data.gridTitle || "What Our Clients Say",
  );
  const description = String(
    data.description ||
      data.gridDescription ||
      data.desc ||
      "We take pride in delivering exceptional results. Here's what our clients have to say about their experience working with us.",
  );

  const testimonials = (
    Array.isArray(data.testimonials) && data.testimonials.length
      ? data.testimonials
      : Array.isArray(data.testimonialItems) && data.testimonialItems.length
        ? data.testimonialItems
        : defaultTestimonials
  ) as TestimonialItem[];

  return (
    <section
      className="bg-[#f8f9fa] py-[30px] max-md:py-5"
      style={getAccentStyle(accent)}
      data-editor-section-label="testimonials"
      data-editor-fields="accentColor pretitle title description testimonials"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-6 text-center">
          <div
            className="mb-4 text-[0.9rem] font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="mb-6 font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          {description ? (
            <p
              className="mx-auto max-w-[600px] text-base text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          data-box-layout-grid="grid"
        >
          {testimonials.map((item, index) => {
            const name = String(item.name || "Client");
            const role = String(item.role || item.location || "");
            const text = String(item.content || item.quote || item.text || "");
            return (
              <article
                key={item.id || `${name}-${index}`}
                className="flex flex-col rounded-xl border border-black/5 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  className="mb-5 fill-[var(--accent)]"
                  aria-hidden="true"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p
                  className="mb-6 flex-1 text-[0.95rem] leading-relaxed font-medium text-[#444]"
                  data-editor-field="content"
                >
                  {text}
                </p>
                <div className="flex items-center gap-4 border-t border-black/5 pt-6">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <img
                      src={item.image || `${IMG}/hero_worker.png`}
                      alt={name}
                      className="h-full w-full object-cover"
                      data-editor-media="image"
                      data-editor-media-type="image"
                    />
                  </div>
                  <div>
                    <div
                      className="mb-1 text-[1.05rem] font-bold text-[#111]"
                      data-editor-field="name"
                    >
                      {name}
                    </div>
                    {role ? (
                      <div
                        className="mb-2 text-[0.85rem] text-[#666]"
                        data-editor-field="role"
                      >
                        {role}
                      </div>
                    ) : null}
                    <Stars rating={item.rating} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
