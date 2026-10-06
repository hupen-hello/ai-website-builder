"use client";
import React, { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { SectionDivider } from "../about/EventSectionDivider";
import InlineRichText from "../../builder/InlineRichText";
interface Review {
  text: string;
  author: string;
  role: string;
  rating: number;
  image: string;
}
interface TestimonialsData {
  subtitle: string;
  title: string;
  description: string;
  reviews: Review[];
}
export default function TestimonialsEvent1({
  data,
}: {
  data?: TestimonialsData;
}) {
  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const nextReview = () => {
    if (!reviews.length) return;
    setDirection(1);
    setCurrentIndex((prev) =>
      prev === reviews.length - 1 ? 0 : prev + 1,
    );
  };
  const prevReview = () => {
    if (!reviews.length) return;
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? reviews.length - 1 : prev - 1,
    );
  };
  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };
  return (
    <section className="py-12 lg:py-12 bg-white overflow-hidden">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] ">
        {" "}
        {/* Centered Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs sm:text-sm uppercase flex items-center justify-center gap-6">
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>
              <span data-editor-inline-format-key="event-testimonial:subtitle">
                <InlineRichText value={String(data?.subtitle || "")} formatKey="event-testimonial:subtitle" />
              </span>
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>
            </h5>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1a0b2e] leading-[1.2]"
            data-editor-inline-format-key="event-testimonial:title"
          >
            <InlineRichText value={String(data?.title || "")} formatKey="event-testimonial:title" />
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {" "}
          {/* Left Content */}{" "}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="col-span-1 lg:col-span-5 pr-0 lg:pr-8"
          >
            {" "}
            <p className="text-slate-600 text-base leading-relaxed mb-10 border-l-2 border-purple-200 pl-4" data-editor-inline-format-key="event-testimonial:description">
              <InlineRichText value={String(data?.description || "")} formatKey="event-testimonial:description" />
            </p>{" "}
            <div className="flex gap-4">
              {" "}
              <button
                onClick={prevReview}
                className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-900 hover:text-purple-900 transition-colors"
              >
                {" "}
                <ArrowLeft size={18} />{" "}
              </button>{" "}
              <button
                onClick={nextReview}
                className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-900 hover:text-purple-900 transition-colors"
              >
                {" "}
                <ArrowRight size={18} />{" "}
              </button>{" "}
            </div>{" "}
          </motion.div>{" "}
          {/* Right Content - Review Card */}{" "}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="col-span-1 lg:col-span-7 relative mt-8 lg:mt-0"
          >
            {" "}
            {/* Background pattern */}{" "}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
              {" "}
              <div className="grid grid-cols-4 gap-2">
                {" "}
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-purple-900 rounded-full"
                  />
                ))}{" "}
              </div>{" "}
            </div>{" "}
            <div className="bg-white border border-purple-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative z-10 overflow-hidden min-h-[380px] flex items-center">
              {" "}
              {reviews[currentIndex] ? (
              <AnimatePresence mode="wait" custom={direction}>
                {" "}
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="w-full p-8 p-12"
                >
                  {" "}
                  <div className="flex mb-6">
                    {" "}
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < reviews[currentIndex].rating
                            ? "fill-purple-900 text-purple-900"
                            : "text-gray-300"
                        }
                      />
                    ))}{" "}
                  </div>{" "}
                  <p className="text-slate-600 text-base leading-relaxed  italic mb-10 relative" data-editor-inline-format-key={`event-testimonial:${currentIndex}:text`}>
                    {" "}
                    <Quote
                      size={40}
                      className="absolute -top-6 -left-6 text-purple-100 -z-10 rotate-180"
                    />
                    <InlineRichText value={String(reviews[currentIndex].text || "")} formatKey={`event-testimonial:${currentIndex}:text`} />
                    <Quote
                      size={20}
                      className="inline ml-2 text-purple-900 align-top"
                    />{" "}
                  </p>{" "}
                  <div className="flex items-center gap-4">
                    {" "}
                    <img
                      src={reviews[currentIndex].image}
                      alt={reviews[currentIndex].author}
                      className="w-16 h-16 rounded-full object-cover shadow-md"
                      data-editor-media
                      data-editor-media-type="image"
                      data-editor-media-src={reviews[currentIndex].image}
                    />{" "}
                    <div>
                      {" "}
                      <h4 className="font-bold text-gray-900 text-lg" data-editor-inline-format-key={`event-testimonial:${currentIndex}:author`}>
                        <InlineRichText value={String(reviews[currentIndex].author || "")} formatKey={`event-testimonial:${currentIndex}:author`} />
                      </h4>{" "}
                      <p className="text-slate-600 text-base leading-relaxed uppercase tracking-wider">
                        {reviews[currentIndex].role}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </motion.div>{" "}
              </AnimatePresence>
              ) : null}{" "}
            </div>{" "}
          </motion.div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
