"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import {
  User,
  Edit,
  Users,
  Headphones,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { OurTeamData } from "../about/eventTypes";
import { handleManagerCardClick } from "../../../lib/editorManagerCards";
const Facebook = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {" "}
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>{" "}
  </svg>
);
const Linkedin = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {" "}
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>{" "}
    <rect x="2" y="9" width="4" height="12"></rect>{" "}
    <circle cx="4" cy="4" r="2"></circle>{" "}
  </svg>
);
const Instagram = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {" "}
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>{" "}
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>{" "}
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>{" "}
  </svg>
);
const getIcon = (iconName: string) => {
  switch (iconName) {
    case "user":
      return <User size={20} className="text-white" />;
    case "edit":
      return <Edit size={20} className="text-white" />;
    case "users":
      return <Users size={20} className="text-white" />;
    case "headphones":
      return <Headphones size={20} className="text-white" />;
    default:
      return <User size={20} className="text-white" />;
  }
};
export default function OurTeamEvent1({ data = {}, editorMode }: SectionProps) {
  const rawMembers = Array.isArray(data.members) ? data.members : [];
  const usedSlugs = new Set<string>();
  const members = rawMembers.map((member: Record<string, unknown>, index: number) => {
    const name = String(member.name || member.title || "");
    const base =
      String(member.slug || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `team-${index + 1}`;
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    usedSlugs.add(slug);
    return {
      ...member,
      name,
      slug,
      href: `#master-detail/team/${encodeURIComponent(slug)}`,
    };
  });
  return (
    <section className="py-12 lg:py-12 bg-[#fdfafb] relative overflow-hidden">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  ]">
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
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]   mb-2 leading-tight">
            {" "}
            {data.titlePart1.trim()}{" "}
            <span className="italic text-[#6b3c9b] ml-2">
              {data.titleHighlight}
            </span>{" "}
          </h2>{" "}
          <div className="flex justify-center mb-6 mt-4">
            {" "}
            <div className="w-2.5 h-2.5 rotate-45 bg-[#6b3c9b]"></div>{" "}
          </div>{" "}
          <p className="text-slate-600 text-base leading-relaxed  max-w-xl mx-auto">
            {" "}
            {data.description}{" "}
          </p>{" "}
        </motion.div>{" "}
        {/* Team Grid with Arrows */}{" "}
        <div className="relative flex items-center">
          {" "}
          {/* Left Arrow (Visual only for layout match) */}
          <button className="hidden lg:flex absolute -left-4 xl:-left-12 z-20 w-12 h-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-[#6b3c9b] hover:bg-[#6b3c9b] hover:text-white transition-colors duration-300">
            {" "}
            <ArrowLeft size={20} />{" "}
          </button>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 w-full z-10 px-4 xl:px-0">
            {" "}
            {members.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                data-editor-no-inline="true"
                className="flex flex-col bg-white rounded-[32px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(107,60,155,0.1)] transition-all duration-500 pb-8 group relative cursor-pointer"
              >
                {" "}
                <a
                  href={member.href}
                  className="absolute inset-0 z-30"
                  aria-label={member.name}
                  onClick={(event) => {
                    handleManagerCardClick(event, editorMode, "Teams", {
                      id: typeof member.id === "string" ? member.id : undefined,
                      slug: member.slug,
                      title: member.name,
                    });
                  }}
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                </a>
                {/* Image Section */}{" "}
                <div className="p-[14px] relative pointer-events-none z-10">
                  {" "}
                  <div className="relative w-full aspect-[4/5] rounded-tl-[60px] rounded-tr-[20px] rounded-bl-[12px] rounded-br-[12px] overflow-hidden bg-gray-100 z-10 border-t-[5px] border-l-[5px] border-[#6b3c9b]">
                    {" "}
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />{" "}
                  </div>{" "}
                  {/* Floating Icon Badge */}{" "}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[46px] h-[46px] bg-[#6b3c9b] rounded-full flex items-center justify-center shadow-lg border-[3px] border-white z-20">
                    {" "}
                    {getIcon(member.icon)}{" "}
                  </div>{" "}
                </div>{" "}
                {/* Content Section */}{" "}
                <div className="flex flex-col items-center text-center px-6 mt-10 pointer-events-none z-10">
                  {" "}
                  <h3 className="text-[#15072b] font-serif font-bold text-2xl mb-3">
                    {member.name}
                  </h3>{" "}
                  <div className="w-2 h-2 rotate-45 bg-[#6b3c9b]/60 mb-3"></div>{" "}
                  <span className="text-[#6b3c9b] font-bold text-[11px] tracking-widest uppercase mb-4">
                    {member.role}
                  </span>{" "}
                  <p className="text-slate-600 text-base leading-relaxed mb-8 h-12 flex items-center justify-center">
                    {" "}
                    {member.description}{" "}
                  </p>{" "}
                  {/* Social Icons */}{" "}
                  <div className="flex items-center justify-center gap-3 relative z-20 pointer-events-auto">
                    {" "}
                    <a
                      href={member.social.facebook}
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6b3c9b] hover:border-[#6b3c9b] transition-colors"
                    >
                      {" "}
                      <Facebook size={14} />{" "}
                    </a>{" "}
                    <a
                      href={member.social.linkedin}
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6b3c9b] hover:border-[#6b3c9b] transition-colors"
                    >
                      {" "}
                      <Linkedin size={14} />{" "}
                    </a>{" "}
                    <a
                      href={member.social.instagram}
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6b3c9b] hover:border-[#6b3c9b] transition-colors"
                    >
                      {" "}
                      <Instagram size={14} />{" "}
                    </a>{" "}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Right Arrow (Visual only) */}
          <button className="hidden lg:flex absolute -right-4 xl:-right-12 z-20 w-12 h-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-[#6b3c9b] hover:bg-[#6b3c9b] hover:text-white transition-colors duration-300">
            {" "}
            <ArrowRight size={20} />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
