"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { Star, Sparkles } from "lucide-react";
import { AwardsData } from "../about/eventTypes";
export default function AwardsEvent1({ data = {} }: SectionProps) {
  return (
    <section className="py-12 lg:py-12 bg-[#fdfafb] relative overflow-hidden border-t border-gray-100">
      {" "}
      {/* Decorative elements */}{" "}
      <div className="absolute top-32 left-10 lg:left-24 text-[#b9a5ce] opacity-30">
        {" "}
        <Sparkles size={80} strokeWidth={0.5} />{" "}
      </div>{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  relative z-10">
        {" "}
        {/* Header */}{" "}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          {" "}
          <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs sm:text-sm uppercase mb-6 flex items-center justify-center gap-6">
            {" "}
            <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
            {data.subtitle}{" "}
            <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
          </h5>{" "}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  mb-2 leading-tight">
            {" "}
            {data.titlePart1.trim()}{" "}
          </h2>{" "}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  italic mb-6 leading-tight">
            {" "}
            {data.titleHighlight}{" "}
          </h2>{" "}
          <div className="flex justify-center mb-6">
            {" "}
            <div className="w-2.5 h-2.5 rotate-45 bg-[#6b3c9b]"></div>{" "}
          </div>{" "}
          <p className="text-slate-600 text-base leading-relaxed  max-w-xl mx-auto">
            {" "}
            {data.description}{" "}
          </p>{" "}
        </motion.div>{" "}
        {/* Awards Grid */}{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 xl:gap-5 justify-center">
          {" "}
          {data.awards.map((award, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="flex flex-col h-full bg-white rounded-3xl p-2.5 pb-8 shadow-[0_5px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(107,60,155,0.08)] transition-all duration-500"
            >
              {" "}
              {/* Image Section */}{" "}
              <div className="relative w-full aspect-[4/5] rounded-[18px] overflow-hidden mb-6 bg-[#160a2b] shadow-inner flex items-center justify-center">
                {" "}
                {/* Ribbon Badge */}{" "}
                <div
                  className="absolute top-0 left-4 bg-[#6b3c9b] text-white w-10 flex items-start justify-center pt-3 pb-5 z-20 drop-shadow-md"
                  style={{
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
                  }}
                >
                  {" "}
                  <Star size={16} className="fill-white text-white" />{" "}
                </div>{" "}
                <img
                  src={award.image}
                  alt={award.title}
                  className="w-full h-full object-cover opacity-90 transition-all duration-700 hover:scale-105"
                />{" "}
              </div>{" "}
              {/* Content Section */}{" "}
              <div className="flex flex-col flex-grow items-center text-center px-3">
                {" "}
                <div className="w-2 h-2 rotate-45 bg-[#6b3c9b]/60 mb-3"></div>{" "}
                <span className="text-[#6b3c9b] font-serif font-bold text-lg mb-2">
                  {award.year}
                </span>{" "}
                <h3 className="text-[#15072b] font-serif font-semibold text-[17px] mb-3 leading-snug">
                  {award.title}
                </h3>{" "}
                <p className="text-slate-600 text-base leading-relaxed mt-auto px-1">
                  {" "}
                  {award.description}{" "}
                </p>{" "}
              </div>{" "}
            </motion.div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
