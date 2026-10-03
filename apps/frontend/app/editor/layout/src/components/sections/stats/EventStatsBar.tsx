"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { Users, Heart } from "lucide-react";
interface StatItem {
  icon: string;
  value: string;
  label: string;
}
const getIcon = (iconName: string) => {
  switch (iconName) {
    case "party":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-300"
        >
          {" "}
          <path d="M14 6L8 16l-3-3 6-10 3 3z" />
          <path d="m14 6 5.5 5.5-2.5 2.5-5.5-5.5z" />
          <path d="m8 16 3-3" />
          <path d="m5 13-3 3" />
          <path d="m2 22 3-3" />
          <path d="m18 14 3-3" />
          <path d="m22 22-3-3" />{" "}
        </svg>
      );
    case "users":
      return <Users size={32} strokeWidth={1.5} className="text-purple-300" />;
    case "calendar-star":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-300"
        >
          {" "}
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="m12 13 1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z" />{" "}
        </svg>
      );
    case "heart":
      return <Heart size={32} strokeWidth={1.5} className="text-purple-300" />;
    default:
      return <Heart size={32} strokeWidth={1.5} className="text-purple-300" />;
  }
};
export default function StatsBarEvent1({
  data,
}: {
  data: StatItem[] | { items?: StatItem[] };
}) {
  const stats = Array.isArray(data) ? data : (data?.items ?? []);
  return (
    <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] relative -mt-14 -mt-20 z-20 ">
      {" "}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#2a133f]/80 backdrop-blur-md rounded-2xl shadow-2xl py-6 px-4 px-12 border border-white/20"
      >
        {" "}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 divide-x divide-white/20">
          {" "}
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-5 ${idx === 0 ? "" : "pl-4 pl-8"}`}
            >
              {" "}
              <div className="shrink-0 flex items-center justify-center">
                {" "}
                {getIcon(stat.icon)}{" "}
              </div>{" "}
              <div className="flex flex-col text-left">
                {" "}
                <h3 className="text-2xl text-[28px] font-bold text-white leading-none mb-1">
                  {stat.value}
                </h3>{" "}
                <p className="text-xs text-[13px] text-white/80 font-normal">
                  {stat.label}
                </p>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </motion.div>{" "}
    </div>
  );
}
