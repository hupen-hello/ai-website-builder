"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import {
  Diamond,
  ShieldCheck,
  Handshake,
  Users,
  Clock,
  Heart,
} from "lucide-react";
import { CoreValuesData } from "./eventTypes";
import { mergeEventData } from "./eventPageDefaults";
const getIcon = (iconName: string) => {
  switch (iconName) {
    case "diamond":
      return <Diamond size={24} className="text-purple-900" />;
    case "award-badge":
      return <ShieldCheck size={24} className="text-purple-900" />;
    case "handshake":
      return <Handshake size={24} className="text-purple-900" />;
    case "users":
      return <Users size={24} className="text-purple-900" />;
    case "clock":
      return <Clock size={24} className="text-purple-900" />;
    case "heart":
      return <Heart size={24} className="text-purple-900" />;
    default:
      return <Diamond size={24} className="text-purple-900" />;
  }
};
export default function CoreValuesEvent1({ data = {} }: SectionProps) {
  data = mergeEventData(data, "coreValues", "CoreValues", "CoreValuesEvent1");
  return (
    <section className="py-12 lg:py-12 bg-white overflow-hidden relative">
      {" "}
      {/* Background Decor */}{" "}
      <div className="absolute top-10 left-10 w-32 h-32 opacity-5 pointer-events-none">
        {" "}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          className="w-full h-full text-purple-900"
        >
          {" "}
          <path
            d="M50 0L55 45L100 50L55 55L50 100L45 55L0 50L45 45L50 0Z"
            fill="currentColor"
          />{" "}
        </svg>{" "}
      </div>{" "}
      <div className="absolute bottom-20 right-10 w-24 h-24 opacity-5 pointer-events-none">
        {" "}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          className="w-full h-full text-purple-900"
        >
          {" "}
          <path
            d="M50 0L55 45L100 50L55 55L50 100L45 55L0 50L45 45L50 0Z"
            fill="currentColor"
          />{" "}
        </svg>{" "}
      </div>{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  relative z-10">
        {" "}
        {/* Header */}{" "}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          {" "}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-4 mb-5"
          >
            {" "}
            <div className="h-[1px] w-12 bg-[#32174d]/30" />{" "}
            <span className="text-[#32174d] font-bold tracking-[0.25em] text-[10px] text-[11px] uppercase">
              {" "}
              {data.subtitle}{" "}
            </span>{" "}
            <div className="h-[1px] w-12 bg-[#32174d]/30" />{" "}
          </motion.div>{" "}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-serif text-gray-900 mb-6"
          >
            {" "}
            {data.title}{" "}
            <span className="italic text-[#32174d] font-light">
              {data.highlight}
            </span>{" "}
          </motion.h2>{" "}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-sm text-base leading-relaxed max-w-2xl"
          >
            {" "}
            {data.description}{" "}
          </motion.p>{" "}
        </div>{" "}
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {" "}
          {/* Values Grid */}
          <div className="col-span-1 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {" "}
            {(data.values || []).map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_2px_15px_rgb(0,0,0,0.03)] hover:border-purple-200 hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] transition-all duration-300 group"
              >
                {" "}
                <div className="w-14 h-14 rounded-full bg-[#faf9fc] flex items-center justify-center mb-5 group-hover:bg-purple-50 transition-colors duration-300 border border-purple-50">
                  {" "}
                  {getIcon(item.icon)}{" "}
                </div>{" "}
                <h4 className="text-[17px] font-bold text-gray-900 mb-2">
                  {item.title}
                </h4>{" "}
                <p className="text-slate-600 text-base leading-relaxed ">
                  {" "}
                  {item.description}{" "}
                </p>{" "}
              </motion.div>
            ))}{" "}
          </div>{" "}
          {/* Right Image */}{" "}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-4 h-full hidden lg:block"
          >
            {" "}
            <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden relative">
              {" "}
              <img
                src={data.image}
                alt="Our Values"
                className="w-full h-full object-cover absolute inset-0"
              />{" "}
            </div>{" "}
          </motion.div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
