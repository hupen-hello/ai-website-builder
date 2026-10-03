"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ServicesData } from "../about/eventTypes";
export default function ServicesEvent1({ data = {} }: SectionProps) {
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="py-12 lg:py-12 bg-white relative">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  ]">
        {" "}
        {/* Section Header */}{" "}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8 lg:mb-12">
          {" "}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            {" "}
            <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs sm:text-sm uppercase flex items-center justify-center gap-6">
              {" "}
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
              {data.subtitle}{" "}
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
            </h5>{" "}
          </motion.div>{" "}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif leading-[1.15] mb-6 text-[#15072b]"
          >
            {" "}
            {String(data.title || "").split(".").map((part, i, arr) => {
              if (!part.trim()) return null;
              return (
                <React.Fragment key={i}>
                  {" "}
                  {i === 0 ? (
                    <span className="font-medium">{part}. </span>
                  ) : (
                    <span className="italic text-[#6b3c9b] font-normal">
                      {part}.
                    </span>
                  )}{" "}
                </React.Fragment>
              );
            })}{" "}
          </motion.h2>{" "}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto"
          >
            {" "}
            {data.description}{" "}
          </motion.p>{" "}
        </div>{" "}
        {/* Services Grid */}{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {" "}
          {items.slice(0, 6).map((item, idx) => (
            <Link href="/services-detail" key={idx} className="block group">
              {" "}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
                className="relative bg-[#0d0417] overflow-hidden h-[440px] rounded-tl-[40px] rounded-br-[80px]"
              >
                {" "}
                {/* Background Image */}{" "}
                <div className="absolute inset-0 w-full h-[75%] transition-transform duration-700 group-hover:scale-110">
                  {" "}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-90"
                  />{" "}
                  <div className="absolute inset-0 bg-[#6b3c9b]/10 mix-blend-multiply"></div>{" "}
                </div>{" "}
                {/* Content White Box */}{" "}
                <div className="absolute bottom-5 left-5 right-5 bg-white rounded-tl-[32px] rounded-br-[40px] p-6 pt-10 z-10">
                  {" "}
                  {/* Centered Purple Icon Button */}{" "}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-[#321654] text-white flex items-center justify-center rounded-[14px] shadow-lg group-hover:bg-[#6b3c9b] transition-colors duration-300">
                    {" "}
                    <ArrowUpRight
                      size={24}
                      className="transition-transform duration-500 group-hover:rotate-[360deg]"
                    />{" "}
                  </div>{" "}
                  <h3 className="text-xl font-bold text-[#15072b] leading-snug mb-3">
                    {" "}
                    {item.title}{" "}
                  </h3>{" "}
                  <p className="text-slate-600 text-base leading-relaxed font-medium">
                    {" "}
                    {item.tags.join(", ")}{" "}
                  </p>{" "}
                </div>{" "}
              </motion.div>{" "}
            </Link>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
