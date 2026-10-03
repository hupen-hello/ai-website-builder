"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Edit,
  Lightbulb,
  Users,
  Calculator,
  Heart,
  UserCheck,
} from "lucide-react";
import { TeamDetailData } from "../about/eventTypes";
import { mergeEventData } from "../about/eventPageDefaults";
const Facebook = ({ size = 20, className = "" }) => (
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
const Linkedin = ({ size = 20, className = "" }) => (
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
const Instagram = ({ size = 20, className = "" }) => (
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
const getSkillIcon = (iconName: string) => {
  switch (iconName) {
    case "edit":
      return <Edit size={20} className="text-[#6b3c9b]" />;
    case "lightbulb":
      return <Lightbulb size={20} className="text-[#6b3c9b]" />;
    case "users":
      return <Users size={20} className="text-[#6b3c9b]" />;
    case "calculator":
      return <Calculator size={20} className="text-[#6b3c9b]" />;
    case "heart":
      return <Heart size={20} className="text-[#6b3c9b]" />;
    case "user-check":
      return <UserCheck size={20} className="text-[#6b3c9b]" />;
    default:
      return <User size={20} className="text-[#6b3c9b]" />;
  }
};
export default function TeamDetailEvent1({ data = {} }: SectionProps) {
  data = mergeEventData(data, "teamDetail", "TeamDetail", "TeamDetailEvent1");
  return (
    <section className="bg-white overflow-hidden pb-12">
      {" "}
      {/* Top Profile Section */}{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  pt-8 pb-10 border-b border-gray-100">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-10 lg:gap-16 items-center">
          {" "}
          {/* 1. Image */}{" "}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[320px] mx-auto lg:mx-0"
          >
            {" "}
            <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-xl border-4 border-white bg-gray-100">
              {" "}
              <img
                src={data.image}
                alt={data.name}
                className="w-full h-full object-cover"
              />{" "}
            </div>{" "}
          </motion.div>{" "}
          {/* 2. Intro Info */}{" "}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col text-center lg:text-left"
          >
            {" "}
            <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs uppercase mb-4 flex items-center justify-center lg:justify-start gap-4">
              {" "}
              {data.subtitle}{" "}
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
            </h5>{" "}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1a0b2e]  mb-2">
              {data.name}
            </h1>{" "}
            <h3 className="text-[#6b3c9b] font-bold tracking-widest text-sm uppercase mb-4">
              {data.role}
            </h3>{" "}
            <div className="w-2 h-2 rotate-45 bg-[#6b3c9b]/60 mx-auto lg:mx-0 mb-6"></div>
            <p className="text-slate-600 text-base leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
              {" "}
              {data.shortDescription}{" "}
            </p>{" "}
            {/* Social */}{" "}
            <div className="flex items-center justify-center lg:justify-start gap-4">
              {" "}
              <a
                href={data.social.facebook}
                className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6b3c9b] hover:border-[#6b3c9b] transition-colors"
              >
                {" "}
                <Facebook />{" "}
              </a>{" "}
              <a
                href={data.social.linkedin}
                className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6b3c9b] hover:border-[#6b3c9b] transition-colors"
              >
                {" "}
                <Linkedin />{" "}
              </a>{" "}
              <a
                href={data.social.instagram}
                className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6b3c9b] hover:border-[#6b3c9b] transition-colors"
              >
                {" "}
                <Instagram />{" "}
              </a>{" "}
            </div>{" "}
          </motion.div>{" "}
          {/* 3. Contact Details */}{" "}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-6 w-full max-w-[280px] mx-auto lg:mx-0 mt-8 lg:mt-0"
          >
            {" "}
            <div className="flex items-center gap-5">
              {" "}
              <div className="text-[#6b3c9b]">
                {" "}
                <User size={24} strokeWidth={1.5} />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-[#15072b] font-bold text-sm mb-1">
                  Experience
                </h4>{" "}
                <p className="text-slate-600 text-base leading-relaxed ">
                  {data.info.experience}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center gap-5">
              {" "}
              <div className="text-[#6b3c9b]">
                {" "}
                <Mail size={24} strokeWidth={1.5} />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-[#15072b] font-bold text-sm mb-1">
                  Email
                </h4>{" "}
                <p className="text-slate-600 text-base leading-relaxed ">
                  {data.info.email}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center gap-5">
              {" "}
              <div className="text-[#6b3c9b]">
                {" "}
                <Phone size={24} strokeWidth={1.5} />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-[#15072b] font-bold text-sm mb-1">
                  Phone
                </h4>{" "}
                <p className="text-slate-600 text-base leading-relaxed ">
                  {data.info.phone}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center gap-5">
              {" "}
              <div className="text-[#6b3c9b]">
                {" "}
                <MapPin size={24} strokeWidth={1.5} />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-[#15072b] font-bold text-sm mb-1">
                  Location
                </h4>{" "}
                <p className="text-slate-600 text-base leading-relaxed ">
                  {data.info.location}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </motion.div>{" "}
        </div>{" "}
      </div>{" "}
      {/* About & Education Section */}{" "}
      <div className="bg-[#fdfafb] py-12 lg:py-12 border-b border-gray-100">
        {" "}
        <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] ">
          {" "}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {" "}
              <h3 className="text-[#15072b] font-bold tracking-widest text-sm uppercase mb-6">
                {data.about.title}
              </h3>{" "}
              <div className="space-y-4 text-gray-500 leading-relaxed text-sm text-base">
                {" "}
                {data.about.description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}{" "}
              </div>{" "}
            </motion.div>{" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-[32px] p-8 p-12 shadow-[0_5px_30px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left"
            >
              {" "}
              <div className="w-24 h-24 shrink-0 rounded-full bg-[#fdfafb] border border-gray-100 flex items-center justify-center text-[#6b3c9b]">
                {" "}
                <GraduationCap size={40} strokeWidth={1.2} />{" "}
              </div>{" "}
              <div>
                {" "}
                <h3 className="text-[#15072b] font-bold tracking-widest text-sm uppercase mb-3">
                  {data.education.title}
                </h3>{" "}
                <h4 className="text-gray-700 font-semibold mb-1">
                  {data.education.degree}
                </h4>{" "}
                <p className="text-slate-600 text-base leading-relaxed mb-1">
                  {data.education.university}
                </p>{" "}
                <p className="text-[#6b3c9b] font-bold">
                  {data.education.year}
                </p>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Skills & Timeline */}{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  pt-16 lg:pt-24">
        {" "}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 gap-20">
          {" "}
          {/* Skills */}{" "}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {" "}
            <h3 className="text-[#15072b] font-bold tracking-widest text-sm uppercase mb-10">
              {data.skillsTitle}
            </h3>{" "}
            <div className="space-y-8">
              {" "}
              {data.skills.map((skill, idx) => (
                <div key={idx}>
                  {" "}
                  <div className="flex items-center justify-between mb-3">
                    {" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      {getSkillIcon(skill.icon)}{" "}
                      <span className="font-semibold text-gray-800 text-sm">
                        {skill.name}
                      </span>{" "}
                    </div>{" "}
                    <span className="text-[#6b3c9b] font-bold text-sm">
                      {skill.percentage}%
                    </span>{" "}
                  </div>{" "}
                  {/* Progress Bar */}{" "}
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    {" "}
                    <div
                      className="bg-[#6b3c9b] h-1.5 rounded-full relative"
                      style={{ width: `${skill.percentage}%` }}
                    ></div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </motion.div>{" "}
          {/* Timeline */}{" "}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {" "}
            <h3 className="text-[#15072b] font-bold tracking-widest text-sm uppercase mb-10">
              {data.experienceTitle}
            </h3>{" "}
            <div className="border-l border-gray-200 pl-8 space-y-10 relative">
              {" "}
              {data.experienceTimeline.map((item, idx) => (
                <div key={idx} className="relative">
                  {" "}
                  <div className="absolute -left-[42px] top-1 w-[20px] h-[20px] rounded-full bg-white border-[5px] border-[#6b3c9b]"></div>{" "}
                  <h5 className="text-[#6b3c9b] font-bold text-xs mb-2">
                    {item.period}
                  </h5>{" "}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3">
                    {" "}
                    <h4 className="text-[#15072b] font-bold text-base">
                      {item.role}
                    </h4>{" "}
                    <span className="hidden sm:inline-block text-gray-300">
                      |
                    </span>{" "}
                    <span className="text-gray-500 text-sm">
                      {item.company}
                    </span>{" "}
                  </div>{" "}
                  <p className="text-slate-600 text-base leading-relaxed ">
                    {" "}
                    {item.description}{" "}
                  </p>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </motion.div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
