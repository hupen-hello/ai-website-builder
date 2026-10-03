"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { Target, Users, Diamond, Star, Sparkles, Quote } from "lucide-react";
import { MissionData } from "../about/eventTypes";
import { SectionDivider } from "../about/EventSectionDivider";
const getIcon = (iconName: string) => {
  switch (iconName.toLowerCase()) {
    case "target":
      return <Target size={24} className="text-[#32174d]" />;
    case "users":
      return <Users size={24} className="text-[#32174d]" />;
    case "diamond":
      return <Diamond size={24} className="text-[#32174d]" />;
    case "star":
      return <Star size={24} className="text-[#32174d]" />;
    default:
      return <Target size={24} className="text-[#32174d]" />;
  }
};
export default function MissionEvent1({ data = {} }: SectionProps) {
  return (
    <section className="py-12 lg:py-12 bg-[#faf9fc] overflow-hidden">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] ">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {" "}
          {/* Left Side: Content & Grid */}{" "}
          <div>
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              {" "}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-6">
                {" "}
                <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                  {" "}
                  <h5 className="text-[#32174d] font-semibold tracking-widest text-sm uppercase">
                    {" "}
                    {data.subtitle}{" "}
                  </h5>{" "}
                </div>{" "}
                <SectionDivider className="max-w-[200px]" />{" "}
              </div>{" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e] mb-6 leading-tight text-center lg:text-left">
                {" "}
                {data.titlePart1}{" "}
                <span className="italic text-[#32174d] font-light">
                  {data.titleHighlight}
                </span>{" "}
              </h2>{" "}
              <p className="text-slate-600 text-base leading-relaxed text-center lg:text-left ">
                {" "}
                {data.description}{" "}
              </p>{" "}
            </motion.div>{" "}
            <div className="grid sm:grid-cols-2 gap-8 gap-x-12 gap-y-10">
              {" "}
              {data.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                  className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4"
                >
                  {" "}
                  <div className="shrink-0 w-16 h-16 rounded-full border border-dashed border-[#32174d]/30 flex items-center justify-center bg-white shadow-sm relative group hover:border-[#32174d] transition-colors duration-300">
                    {" "}
                    {getIcon(feature.icon)}{" "}
                    <div className="absolute inset-0 rounded-full border border-[#32174d]/10 scale-110 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300" />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>{" "}
                    <p className="text-slate-600 text-base leading-relaxed ">
                      {" "}
                      {feature.description}{" "}
                    </p>{" "}
                  </div>{" "}
                </motion.div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          {/* Right Side: Image with Floating Quote */}{" "}
          <div className="relative mt-10 lg:mt-0">
            {" "}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-[2rem] overflow-hidden aspect-[4/5] lg:aspect-[3/4] w-full"
            >
              {" "}
              <img
                src={data.image}
                alt="Mission Showcase"
                className="w-full h-full object-cover"
              />{" "}
            </motion.div>{" "}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute -bottom-8 lg:-bottom-12 -left-4 lg:-left-12 right-4 lg:right-auto bg-[#32174d] rounded-3xl p-8 shadow-xl max-w-[400px] border border-white/10"
            >
              {" "}
              <div className="flex justify-between items-start mb-4">
                {" "}
                <Quote size={32} className="text-white/20" />{" "}
                <Sparkles size={24} className="text-white/40" />{" "}
              </div>{" "}
              <h4 className="text-xl lg:text-2xl font-serif text-white leading-tight">
                {" "}
                {data.quote.textPart1}{" "}
                <span className="italic text-purple-200 font-light">
                  {data.quote.textHighlight}
                </span>{" "}
                {data.quote.textPart2}{" "}
              </h4>{" "}
            </motion.div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
