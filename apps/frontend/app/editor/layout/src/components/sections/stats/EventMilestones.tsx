"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { CalendarCheck, Smile, Users, Award } from "lucide-react";
interface MilestoneItem {
  icon: string;
  value: string;
  label: string;
}
const getIcon = (iconName: string) => {
  switch (iconName) {
    case "calendar-check":
      return (
        <CalendarCheck size={32} strokeWidth={1.2} className="text-white/90" />
      );
    case "smile":
      return <Smile size={32} strokeWidth={1.2} className="text-white/90" />;
    case "users":
      return <Users size={32} strokeWidth={1.2} className="text-white/90" />;
    case "award":
      return <Award size={32} strokeWidth={1.2} className="text-white/90" />;
    default:
      return <Award size={32} strokeWidth={1.2} className="text-white/90" />;
  }
};
export default function MilestonesEvent1({ data = {} }: SectionProps) {
  return (
    <section className="py-12 lg:py-12 bg-[#0d0414] relative overflow-hidden">
      {" "}
      {/* Background Decor */}{" "}
      <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />{" "}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0414]/95 via-[#1f0933]/80 to-[#0d0414]/95" />{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  relative z-10">
        {" "}
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-16 gap-0">
          {" "}
          {data.map((item, idx) => (
            <React.Fragment key={idx}>
              {" "}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex flex-col items-center justify-center text-center w-full w-auto"
              >
                {" "}
                {/* Icon Container with offset arc */}{" "}
                <div className="relative mb-8 flex justify-center items-center w-[100px] h-[100px]">
                  {" "}
                  {/* Purple swoosh arc SVG */}{" "}
                  <div className="absolute inset-0 z-0 flex justify-center items-center">
                    {" "}
                    <svg
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {" "}
                      <path
                        d="M 6 50 A 44 44 0 0 0 61.4 92.5"
                        stroke="#a068dd"
                        strokeWidth="1.5"
                        fill="none"
                      />{" "}
                      <circle
                        cx="6"
                        cy="50"
                        r="2.5"
                        fill="#0d0414"
                        stroke="#a068dd"
                        strokeWidth="1.5"
                      />{" "}
                      <circle
                        cx="61.4"
                        cy="92.5"
                        r="2.5"
                        fill="#0d0414"
                        stroke="#a068dd"
                        strokeWidth="1.5"
                      />{" "}
                    </svg>{" "}
                  </div>{" "}
                  {/* Main Circle */}{" "}
                  <div className="h-[76px] w-[76px] rounded-full border border-white/40 flex items-center justify-center bg-transparent relative z-10">
                    {" "}
                    {getIcon(item.icon)}{" "}
                  </div>{" "}
                </div>{" "}
                <h3 className="text-4xl text-[44px] font-serif text-white mb-3">
                  {item.value}
                </h3>{" "}
                <p className="text-[11px] text-[#c29af0] font-semibold uppercase tracking-[0.15em] mb-4">
                  {item.label}
                </p>{" "}
                {/* Horizontal divider below label */}{" "}
                <div className="flex items-center opacity-60">
                  {" "}
                  <div className="h-[1px] w-12 bg-white/30" />{" "}
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#a068dd]" />{" "}
                  <div className="h-[1px] w-12 bg-white/30" />{" "}
                </div>{" "}
              </motion.div>{" "}
              {/* Vertical Divider for Desktop */}{" "}
              {idx !== data.length - 1 && (
                <div className="hidden lg:flex flex-col items-center justify-center h-full opacity-60 mt-4">
                  {" "}
                  <div className="w-[1px] h-[80px] bg-white/30" />{" "}
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#a068dd]" />{" "}
                  <div className="w-[1px] h-[80px] bg-white/30" />{" "}
                </div>
              )}{" "}
            </React.Fragment>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
