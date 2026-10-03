"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import {
  Binoculars,
  Award,
  Presentation,
  GraduationCap,
  TrendingUp,
  Users,
  CheckCircle2,
} from "lucide-react";
import { WhyChooseUsData } from "../about/eventTypes";
const getFeatureIcon = (iconName: string) => {
  switch (iconName) {
    case "binoculars":
      return <Binoculars size={28} className="text-white" />;
    case "award":
      return <Award size={28} className="text-white" />;
    default:
      return <Award size={28} className="text-white" />;
  }
};
const getTagIcon = (iconName: string) => {
  switch (iconName) {
    case "presentation":
      return <Presentation size={18} className="text-white" />;
    case "graduation-cap":
      return <GraduationCap size={18} className="text-white" />;
    case "trending-up":
      return <TrendingUp size={18} className="text-white" />;
    case "users":
      return <Users size={18} className="text-white" />;
    default:
      return <Users size={18} className="text-white" />;
  }
};
export default function WhyChooseUsEvent1({ data = {} }: SectionProps) {
  return (
    <section className="bg-white overflow-hidden py-8 relative">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {" "}
          {/* Left Content */}{" "}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            {" "}
            <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs sm:text-sm uppercase mb-4 flex items-center gap-4">
              {" "}
              {data.subtitle}{" "}
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
            </h5>{" "}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  text-[54px] mb-2 leading-[1.1] whitespace-pre-line">
              {" "}
              {data.titlePart1}{" "}
              <span className="italic text-[#6b3c9b] font-light block">
                {data.titleHighlight}
              </span>{" "}
            </h2>{" "}
            <div className="flex mb-8 mt-6">
              {" "}
              <div className="w-2 h-2 rotate-45 bg-[#6b3c9b]/60"></div>{" "}
            </div>{" "}
            <p className="text-slate-600 text-base leading-relaxed  mb-12">
              {" "}
              {data.description}{" "}
            </p>{" "}
            {/* Feature Blocks */}{" "}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
              {" "}
              {data.features.map((feature, idx) => (
                <div key={idx} className="flex flex-col">
                  {" "}
                  <div className="w-[68px] h-[68px] bg-[#6b3c9b] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6b3c9b]/20 mb-6 relative">
                    {" "}
                    {/* Decorative star shape inside icon background could be complex, we just use the icon */}{" "}
                    {getFeatureIcon(feature.icon)}{" "}
                    {/* Very subtle inner line decoration for accuracy */}{" "}
                    <div className="absolute inset-1 border border-white/20 rounded-xl"></div>{" "}
                  </div>{" "}
                  <h4 className="text-[#15072b] font-serif font-bold text-xl mb-3">
                    {feature.title}
                  </h4>{" "}
                  <p className="text-slate-600 text-base leading-relaxed ">
                    {feature.description}
                  </p>{" "}
                </div>
              ))}{" "}
            </div>{" "}
            {/* Bullet Points */}{" "}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              {" "}
              {data.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {" "}
                  <div className="mt-0.5 text-[#6b3c9b] shrink-0 bg-purple-50 rounded-full">
                    {" "}
                    <CheckCircle2
                      size={18}
                      className="fill-[#6b3c9b] text-white"
                    />{" "}
                  </div>{" "}
                  <span className="text-gray-600 text-sm font-medium leading-snug">
                    {bullet}
                  </span>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </motion.div>{" "}
          {/* Right Images */}{" "}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full h-[600px] lg:h-[750px] mt-10 lg:mt-0 pl-10"
          >
            {" "}
            {/* Main Image */}{" "}
            <div className="absolute top-0 right-0 w-[85%] h-[85%] rounded-[32px] overflow-hidden shadow-2xl">
              {" "}
              <img
                src={data.image1}
                alt="World Class Events"
                className="w-full h-full object-cover"
              />{" "}
              <div className="absolute inset-0 bg-[#6b3c9b]/10 mix-blend-multiply"></div>{" "}
            </div>{" "}
            {/* Secondary Overlapping Image */}{" "}
            <div className="absolute bottom-[2%] left-0 w-[55%] aspect-square rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[8px] border-white z-20 -rotate-3 transform origin-bottom-left transition-transform hover:-rotate-1 duration-500">
              {" "}
              <img
                src={data.image2}
                alt="Event Interaction"
                className="w-full h-full object-cover"
              />{" "}
            </div>{" "}
          </motion.div>{" "}
        </div>{" "}
        {/* Bottom Tags */}{" "}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 lg:mt-16 pt-8 border-t border-gray-100"
        >
          {" "}
          <div className="flex flex-nowrap justify-start lg:justify-center gap-4 lg:gap-6 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {" "}
            {data.tags.map((tag, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 bg-white rounded-full py-2.5 pl-2.5 pr-6 shadow-[0_5px_20px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-md transition-shadow cursor-default group"
              >
                {" "}
                <div className="w-10 h-10 rounded-full bg-[#6b3c9b] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {" "}
                  {getTagIcon(tag.icon)}{" "}
                </div>{" "}
                <span className="text-[#15072b] font-serif font-bold text-[15px] whitespace-nowrap">
                  {tag.text}
                </span>{" "}
                <div className="w-1.5 h-1.5 rotate-45 bg-[#6b3c9b]/40 ml-2"></div>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </motion.div>{" "}
      </div>{" "}
    </section>
  );
}
