"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import {
  Eye,
  Lightbulb,
  Users,
  Flag,
  Sparkles,
  Diamond,
  Quote,
} from "lucide-react";
import { VisionData } from "../about/eventTypes";
import { SectionDivider } from "../about/EventSectionDivider";
const getIcon = (iconName: string) => {
  switch (iconName.toLowerCase()) {
    case "eye":
      return <Eye size={24} className="text-[#32174d]" />;
    case "lightbulb":
      return <Lightbulb size={24} className="text-[#32174d]" />;
    case "users":
      return <Users size={24} className="text-[#32174d]" />;
    case "flag":
      return <Flag size={24} className="text-[#32174d]" />;
    default:
      return <Eye size={24} className="text-[#32174d]" />;
  }
};
export default function VisionEvent1({ data = {} }: SectionProps) {
  return (
    <section className="py-12 lg:py-12 bg-white overflow-hidden">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] ">
        {" "}
        <div className="grid xl:grid-cols-[1.2fr_1fr] gap-16 lg:gap-20 items-center mb-16 lg:mb-24">
          {" "}
          {/* Left Side: Content & Features */}{" "}
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
              <div className="flex flex-col items-center xl:items-start text-center xl:text-left mb-6">
                {" "}
                <div className="flex items-center gap-2 mb-4 justify-center xl:justify-start">
                  {" "}
                  <h5 className="text-[#32174d] font-semibold tracking-widest text-sm uppercase">
                    {" "}
                    {data.subtitle}{" "}
                  </h5>{" "}
                </div>{" "}
                <SectionDivider className="max-w-[200px]" />{" "}
              </div>{" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e] mb-6 leading-tight text-center xl:text-left">
                {" "}
                {data.titlePart1}{" "}
                <span className="italic text-[#32174d] font-light block mt-2">
                  {data.titleHighlight}
                </span>{" "}
              </h2>{" "}
              <div className="flex justify-center xl:justify-start mb-6">
                {" "}
                <Sparkles size={20} className="text-[#32174d]" />{" "}
              </div>{" "}
              <p className="text-slate-600 text-base leading-relaxed text-center xl:text-left mb-12">
                {" "}
                {data.description}{" "}
              </p>{" "}
            </motion.div>{" "}
            {/* Horizontal Features Grid */}{" "}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              {" "}
              {data.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                  className={`flex flex-col items-center text-center gap-4 relative ${idx !== data.features.length - 1 ? "md:after:content-[''] after:absolute after:w-[1px] after:h-[70%] after:bg-gray-200 after:-right-4 after:top-[15%]" : ""} ${idx % 2 === 0 ? "max-md:after:content-[''] max-md:after:absolute max-md:after:w-[1px] max-md:after:h-[70%] max-md:after:bg-gray-200 max-md:after:-right-3 max-md:after:top-[15%]" : ""}`}
                >
                  {" "}
                  <div className="shrink-0 w-16 h-16 rounded-full border border-dashed border-[#32174d]/30 flex items-center justify-center bg-white shadow-sm relative group hover:border-[#32174d] transition-colors duration-300">
                    {" "}
                    {getIcon(feature.icon)}{" "}
                    <div className="absolute inset-0 rounded-full border border-[#32174d]/10 scale-110 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300" />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>{" "}
                    <div className="w-8 h-[1px] bg-gray-300 mx-auto my-3"></div>{" "}
                    <p className="text-slate-600 text-base leading-relaxed text-xs">
                      {" "}
                      {feature.description}{" "}
                    </p>{" "}
                  </div>{" "}
                </motion.div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          {/* Right Side: Image with Decorative Border */}{" "}
          <div className="relative mt-12 xl:mt-0 px-4 lg:px-8 xl:px-0">
            {" "}
            {/* Decorative Offset Border */}{" "}
            <motion.div
              initial={{ opacity: 0, x: -20, y: -20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="absolute -top-6 lg:-top-8 -left-2 lg:-left-6 w-full h-full border-t-[3px] border-l-[3px] border-[#32174d] rounded-tl-[80px] lg:rounded-tl-[120px] rounded-br-[80px] lg:rounded-br-[120px] z-0"
            ></motion.div>{" "}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-tl-[80px] lg:rounded-tl-[120px] rounded-br-[80px] lg:rounded-br-[120px] overflow-hidden aspect-[4/3] xl:aspect-[4/5] w-full shadow-2xl z-10"
            >
              {" "}
              <img
                src={data.image}
                alt="Vision Showcase"
                className="w-full h-full object-cover"
              />{" "}
            </motion.div>{" "}
            {/* Top Right Sparkle */}{" "}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -top-4 lg:-top-6 -right-4 lg:-right-6 z-20 text-[#32174d]"
            >
              {" "}
              <Sparkles size={40} className="stroke-1" />{" "}
            </motion.div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Bottom Quote Banner */}{" "}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full bg-[#f8f5fc] rounded-3xl p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 justify-center border border-purple-50 shadow-sm"
        >
          {" "}
          <div className="absolute left-4 lg:left-10 text-[#32174d] opacity-50">
            {" "}
            <Sparkles size={32} />{" "}
          </div>{" "}
          <div className="absolute right-4 lg:right-10 text-[#32174d] opacity-50">
            {" "}
            <Sparkles size={32} />{" "}
          </div>{" "}
          <div className="flex-shrink-0 w-20 h-20 bg-[#32174d] rounded-full flex items-center justify-center text-white relative shadow-lg z-10">
            {" "}
            <Diamond size={32} />{" "}
            <div className="absolute inset-0 border border-white/20 rounded-full m-1 border-dashed"></div>{" "}
            {/* Connecting line on desktop */}{" "}
            <div className="hidden lg:block absolute top-1/2 -right-8 w-8 h-[1px] bg-[#32174d]/20"></div>{" "}
          </div>{" "}
          <div className="flex items-start gap-4 z-10 text-center lg:text-left max-w-3xl">
            {" "}
            <Quote
              size={40}
              className="text-[#32174d] opacity-80 shrink-0 hidden lg:block"
            />{" "}
            <h3 className="text-xl md:text-2xl lg:text-3xl font-serif text-[#32174d] leading-relaxed">
              {" "}
              {data.quote.text
                .split("redefine celebrations")
                .map((part, i, arr) =>
                  i === 0 ? (
                    <React.Fragment key={i}>
                      {" "}
                      {part}{" "}
                      <span className="font-semibold">
                        redefine celebrations
                      </span>{" "}
                    </React.Fragment>
                  ) : (
                    <span key={i} className="italic font-light">
                      {part}
                    </span>
                  ),
                )}{" "}
            </h3>{" "}
            <Quote
              size={40}
              className="text-[#32174d] opacity-80 shrink-0 hidden lg:block rotate-180 self-end mb-2"
            />{" "}
          </div>{" "}
        </motion.div>{" "}
      </div>{" "}
    </section>
  );
}
