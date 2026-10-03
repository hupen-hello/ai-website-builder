"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { Target, Eye, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { MissionVisionData } from "../about/eventTypes";
import { mergeEventData } from "../about/eventPageDefaults";
const getIcon = (iconName: string) => {
  switch (iconName) {
    case "target":
      return <Target size={24} className="text-purple-900" />;
    case "eye":
      return <Eye size={24} className="text-purple-900" />;
    case "award":
      return <Award size={24} className="text-purple-900" />;
    default:
      return <Target size={24} className="text-purple-900" />;
  }
};
export default function MissionVisionEvent1({
  data,
}: {
  data: MissionVisionData;
}) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "missionVision",
    "MissionVision",
    "MissionVisionEvent1",
  ) as MissionVisionData;
  return (
    <section className="py-12 lg:py-12 bg-[#faf9fc] overflow-hidden">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] ">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {" "}
          {/* Left Side: Tabs/List */}{" "}
          <div className="flex flex-col gap-10">
            {" "}
            {(data.tabs || []).map((tab, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex gap-6 items-start"
              >
                {" "}
                <div className="shrink-0 w-16 h-16 rounded-full border border-purple-100 flex items-center justify-center bg-[#faf9fc] relative group hover:border-purple-300 transition-colors duration-300">
                  {" "}
                  <div className="text-purple-900 group-hover:scale-110 transition-transform duration-300">
                    {" "}
                    {getIcon(tab.icon)}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="pt-1">
                  {" "}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tab.title}
                  </h3>{" "}
                  <p className="text-slate-600 text-base leading-relaxed ">
                    {" "}
                    {tab.description}{" "}
                  </p>{" "}
                </div>{" "}
              </motion.div>
            ))}{" "}
          </div>{" "}
          {/* Right Side: Featured Card & Image */}{" "}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden lg:flex flex-col md:flex-row h-full min-h-[450px]"
          >
            {" "}
            {/* Text Side */}{" "}
            <div className="w-full md:w-1/2 p-10 p-12 flex flex-col justify-center items-center text-center">
              {" "}
              <div className="flex justify-center mb-6">
                {" "}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[#32174d]"
                >
                  {" "}
                  <path
                    d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z"
                    fill="currentColor"
                  />{" "}
                </svg>{" "}
              </div>{" "}
              <h4 className="text-[26px] text-3xl font-serif text-gray-900 leading-tight mb-6">
                {" "}
                {data.featured.title} <br />{" "}
                <span className="italic text-[#32174d] font-light">
                  {data.featured.subtitle}
                </span>{" "}
              </h4>{" "}
              <p className="text-slate-600 text-base leading-relaxed mb-8">
                {" "}
                {data.featured.description}{" "}
              </p>{" "}
              <div className="flex justify-center mt-auto">
                {" "}
                <Link
                  href={data.featured.buttonLink}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-full text-gray-800 font-semibold text-[13px] tracking-widest hover:border-purple-900 hover:text-purple-900 transition-all duration-300 uppercase"
                >
                  {" "}
                  {data.featured.buttonText} <ArrowRight size={16} />{" "}
                </Link>{" "}
              </div>{" "}
            </div>{" "}
            {/* Image Side */}{" "}
            <div className="w-full md:w-1/2 min-h-[300px] min-h-full h-full relative">
              {" "}
              <img
                src={data.featured.image}
                alt="Event Decoration"
                className="w-full h-full object-cover absolute inset-0"
              />{" "}
            </div>{" "}
          </motion.div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
