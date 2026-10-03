"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { OurStoryData } from "./eventTypes";
export default function OurStoryEvent1({ data = {} }: SectionProps) {
  return (
    <section className="py-12 lg:py-12 bg-white overflow-hidden relative">
      {" "}
      {/* Decorative background circle */}{" "}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#fdfafb] rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  relative z-10">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {" "}
          {/* Text & Timeline Content */}{" "}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col"
          >
            {" "}
            <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-sm uppercase mb-4 flex items-center gap-4">
              {" "}
              {data.subtitle}{" "}
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
            </h5>{" "}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]   mb-6 leading-tight">
              {" "}
              {data.titlePart1}{" "}
              <span className="italic text-[#6b3c9b] block mt-1">
                {data.titleHighlight}
              </span>{" "}
            </h2>{" "}
            <p className="text-slate-600 text-base leading-relaxed  mb-12">
              {" "}
              {data.description}{" "}
            </p>{" "}
            {/* Timeline */}{" "}
            <div className="space-y-8 pl-4 border-l-2 border-[#6b3c9b]/20 relative">
              {" "}
              {data.timeline.map((item, idx) => (
                <div key={idx} className="relative">
                  {" "}
                  {/* Timeline dot */}
                  <div className="absolute -left-[25px] top-1.5 w-4 h-4 bg-white border-[3px] border-[#6b3c9b] rounded-full shadow-md"></div>
                  <div className="flex flex-col md:flex-row items-baseline gap-2 md:gap-6 mb-2">
                    {" "}
                    <span className="text-2xl font-serif font-bold text-[#6b3c9b] min-w-[80px]">
                      {" "}
                      {item.year}{" "}
                    </span>{" "}
                    <h4 className="text-xl font-semibold text-[#15072b]">
                      {" "}
                      {item.title}{" "}
                    </h4>{" "}
                  </div>{" "}
                  <p className="text-slate-600 text-base leading-relaxed pl-[104px] ">
                    {" "}
                    {item.description}{" "}
                  </p>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </motion.div>{" "}
          {/* Image Collage */}{" "}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] lg:h-[700px] w-full"
          >
            {" "}
            {/* Primary Large Image */}{" "}
            <div className="absolute top-0 right-0 w-[85%] h-[75%] rounded-3xl overflow-hidden shadow-2xl">
              {" "}
              <img
                src={data.image1}
                alt="Our Story Primary"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
              />{" "}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#15072b]/40 to-transparent"></div>{" "}
            </div>{" "}
            {/* Secondary Smaller Image */}{" "}
            <div className="absolute bottom-0 left-0 w-[60%] h-[50%] rounded-3xl overflow-hidden shadow-2xl border-8 border-white z-20">
              {" "}
              <img
                src={data.image2}
                alt="Our Story Secondary"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
              />{" "}
            </div>{" "}
            {/* Experience Badge */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 lg:-translate-x-1/2 z-30 bg-white p-4 lg:p-6 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center w-32 h-32 lg:w-40 lg:h-40 border-4 border-[#fdfafb]">
              {" "}
              <span className="text-4xl lg:text-5xl font-serif font-bold text-[#6b3c9b] mb-1">
                {" "}
                {data.experienceYears}{" "}
              </span>{" "}
              <span className="text-xs lg:text-sm font-semibold tracking-wider text-[#15072b] uppercase text-center">
                {" "}
                Years of
                <br />
                Experience{" "}
              </span>{" "}
            </div>{" "}
          </motion.div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
