"use client";
import React, { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Clock,
  ArrowRight,
  User,
  Mail,
  Phone,
  ChevronDown,
  Users,
  Ticket,
  Globe,
  PartyPopper,
  Music4,
  Utensils,
} from "lucide-react";
import { EventDetailData } from "../about/eventTypes";
import { mergeEventData } from "../about/eventPageDefaults";

// Custom Social Icons since they are removed from newer lucide-react versions

const FacebookIcon = ({ size = 24, className = "" }) => (
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
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const LinkedinIcon = ({ size = 24, className = "" }) => (
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
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const TwitterIcon = ({ size = 24, className = "" }) => (
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
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
const getIcon = (iconName: string, props: any = {}) => {
  switch (iconName) {
    case "party-popper":
      return <PartyPopper {...props} />;
    case "music-4":
      return <Music4 {...props} />;
    case "utensils":
      return <Utensils {...props} />;
    case "users":
      return <Users {...props} />;
    case "calendar-days":
      return <CalendarDays {...props} />;
    case "clock":
      return <Clock {...props} />;
    case "map-pin":
      return <MapPin {...props} />;
    case "ticket":
      return <Ticket {...props} />;
    case "globe":
      return <Globe {...props} />;
    default:
      return <PartyPopper {...props} />;
  }
};
export default function EventDetailPage({
  data = {},
}: SectionProps) {
  data = mergeEventData(
    data,
    "eventDetail",
    "EventDetail",
    "EventDetailEvent1",
  );
  const typed = data as EventDetailData & {
    events?: Array<{
      title?: string;
      image?: string;
      location?: string;
      time?: string;
    }>;
    eventId?: string;
  };
  const eventsList = Array.isArray(typed.events) ? typed.events : [];
  const eventId = typed.eventId;
  const eventIdNum = eventId ? parseInt(eventId, 10) : null;
  const specificEvent =
    eventIdNum && eventIdNum > 0 && eventIdNum <= eventsList.length
      ? eventsList[eventIdNum - 1]
      : null;
  const title = String(specificEvent?.title || typed.defaultTitle || "");
  const image = specificEvent?.image || typed.defaultImage;
  const dateStr = typed.defaultDate;
  const locationStr = specificEvent?.location || typed.defaultLocation;
  const timeStr = specificEvent?.time || typed.defaultTime;
  // Split title to highlight the second word if possible
  const titleWords = title.split("");
  const titlePart1 = titleWords[0] || "";
  const titleHighlight = titleWords[1] || "";
  const titlePart2 = titleWords.slice(2).join("");
  const [openScheduleId, setOpenScheduleId] = useState<number | null>(0);
  return (
    <section className="bg-white py-12 lg:py-12">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  ]">
        {" "}
        <div className="flex flex-col md:flex-row gap-12 gap-16">
          {" "}
          {/* Main Content (Left Column) */}{" "}
          <div className="w-full lg:w-[65%]">
            {" "}
            {/* Header */}{" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              {" "}
              <div className="flex items-center gap-2 bg-[#f4effa] px-3 py-1.5 rounded-md w-fit mb-6">
                {" "}
                <CalendarDays size={16} className="text-[#6b3c9b]" />{" "}
                <span className="text-[#6b3c9b] font-bold text-[13px] uppercase tracking-wide">
                  {" "}
                  {data.badge}{" "}
                </span>{" "}
              </div>{" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  text-[54px] mb-8 leading-[1.1]">
                {" "}
                {titlePart1}{" "}
                <span className="italic text-[#6b3c9b] font-normal">
                  {titleHighlight}
                </span>{" "}
                {titlePart2}{" "}
              </h2>{" "}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-gray-600 text-sm font-medium mb-10">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <CalendarDays size={18} className="text-[#6b3c9b]" />{" "}
                  <span>{dateStr}</span>{" "}
                </div>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <MapPin size={18} className="text-[#6b3c9b]" />{" "}
                  <span>{locationStr}</span>{" "}
                </div>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <Clock size={18} className="text-[#6b3c9b]" />{" "}
                  <span>{timeStr}</span>{" "}
                </div>{" "}
              </div>{" "}
              {/* Main Image */}{" "}
              <div className="rounded-3xl overflow-hidden shadow-xl mb-12 h-[300px] h-[450px]">
                {" "}
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />{" "}
              </div>{" "}
            </motion.div>{" "}
            {/* Overview */}{" "}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              {" "}
              <h3 className="text-[22px] font-bold text-[#321654] mb-4">
                {" "}
                {data.overviewTitle}{" "}
              </h3>{" "}
              <div className="w-full h-px bg-gray-100 mb-6">
                {" "}
                <div className="w-16 h-[2px] bg-[#6b3c9b]"></div>{" "}
              </div>{" "}
              <p className="text-slate-600 text-base leading-relaxed mb-10">
                {" "}
                {data.overviewDescription}{" "}
              </p>{" "}
              {/* Features Horizontal */}{" "}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {" "}
                {data.features.map((feature, idx) => (
                  <div key={idx} className="flex flex-col gap-3">
                    {" "}
                    <div className="w-12 h-12 rounded-xl bg-[#f4effa] flex items-center justify-center text-[#6b3c9b]">
                      {" "}
                      {getIcon(feature.icon, {
                        size: 24,
                        strokeWidth: 1.5,
                      })}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-bold text-[#15072b] text-[14px] mb-1 leading-tight">
                        {feature.title}
                      </h4>{" "}
                      <p className="text-slate-600 text-base leading-relaxed ">
                        {feature.description}
                      </p>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </motion.div>{" "}
            {/* Event Schedule */}{" "}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {" "}
              <h3 className="text-[22px] font-bold text-[#321654] mb-4">
                {" "}
                {data.scheduleTitle}{" "}
              </h3>{" "}
              <div className="w-full h-px bg-gray-100 mb-8">
                {" "}
                <div className="w-16 h-[2px] bg-[#6b3c9b]"></div>{" "}
              </div>{" "}
              <div className="flex flex-col gap-4">
                {" "}
                {data.schedule.map((item, idx) => {
                  const isOpen = openScheduleId === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300"
                    >
                      {" "}
                      <button
                        onClick={() => setOpenScheduleId(isOpen ? null : idx)}
                        className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${isOpen ? "bg-[#f4effa]" : "bg-white hover:bg-gray-50"}`}
                      >
                        {" "}
                        <div className="flex items-center gap-6">
                          {" "}
                          <div className="flex flex-col items-center justify-center text-center min-w-[50px]">
                            {" "}
                            <span className="text-[28px] font-bold text-[#321654] leading-none">
                              {item.dateNum}
                            </span>{" "}
                            <span className="text-[12px] font-bold text-[#15072b] uppercase">
                              {item.dateMonth}
                            </span>{" "}
                          </div>{" "}
                          <div className="hidden sm:block w-px h-12 bg-gray-200"></div>{" "}
                          <div className="hidden lg:flex flex-col items-start min-w-[80px]">
                            {" "}
                            <span className="text-sm font-bold text-[#15072b]">
                              {item.day}
                            </span>{" "}
                          </div>{" "}
                          <div className="flex flex-col gap-1">
                            {" "}
                            <span className="font-bold text-[#15072b] text-[15px]">
                              {item.title}
                            </span>{" "}
                            <span className="text-gray-500 text-[13px]">
                              {item.description}
                            </span>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-6">
                          {" "}
                          <div className="hidden lg:flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-sm font-medium text-[#6b3c9b]">
                            {" "}
                            {item.time}{" "}
                          </div>{" "}
                          <ChevronDown
                            size={20}
                            className={`text-[#6b3c9b] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          />{" "}
                        </div>{" "}
                      </button>{" "}
                      {/* Detailed Content inside accordion could go here if needed. Right now we just have a small toggle effect. */}{" "}
                      <AnimatePresence>
                        {" "}
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white px-5 pb-5 pt-2"
                          >
                            {" "}
                            <div className="lg:hidden lg:flex items-center gap-2 text-sm font-medium text-[#6b3c9b] mb-2">
                              {" "}
                              <Clock size={14} /> {item.time}{" "}
                            </div>{" "}
                            <p className="text-slate-600 text-base leading-relaxed ">
                              Join us for the {item.title.toLowerCase()}. Please
                              arrive 15 minutes early.
                            </p>{" "}
                          </motion.div>
                        )}{" "}
                      </AnimatePresence>{" "}
                    </div>
                  );
                })}{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
          {/* Sidebar (Right Column) */}{" "}
          <div className="w-full lg:w-[35%] flex flex-col gap-8 sticky top-24 h-fit">
            {" "}
            {/* Widget 1: Register Form */}{" "}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
              {" "}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#6b3c9b]/5 rounded-bl-[100px] pointer-events-none"></div>{" "}
              <h4 className="text-[22px] font-bold text-[#321654] mb-3 relative z-10">
                {" "}
                {data.sidebar.registerTitle}{" "}
              </h4>{" "}
              <p className="text-slate-600 text-base leading-relaxed mb-6 relative z-10">
                {" "}
                {data.sidebar.registerDescription}{" "}
              </p>{" "}
              <form className="flex flex-col gap-4 relative z-10">
                {" "}
                <div className="relative">
                  {" "}
                  <User
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />{" "}
                  <input
                    type="text"
                    placeholder="Full Name*"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors"
                  />{" "}
                </div>{" "}
                <div className="relative">
                  {" "}
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />{" "}
                  <input
                    type="email"
                    placeholder="Email Address*"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors"
                  />{" "}
                </div>{" "}
                <div className="relative">
                  {" "}
                  <Phone
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />{" "}
                  <input
                    type="tel"
                    placeholder="Phone Number*"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors"
                  />{" "}
                </div>{" "}
                <div className="relative">
                  {" "}
                  <Users
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />{" "}
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />{" "}
                  <select className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors appearance-none text-gray-500">
                    {" "}
                    <option value="">Number of Attendees</option>{" "}
                    <option value="1">1</option> <option value="2">2</option>{" "}
                    <option value="3">3</option>{" "}
                    <option value="4+">4+</option>{" "}
                  </select>{" "}
                </div>{" "}
                <div className="relative mt-2">
                  {" "}
                  <textarea
                    rows={4}
                    placeholder="Additional Message"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors resize-none"
                  ></textarea>{" "}
                </div>{" "}
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 w-full text-white .5 tracking-wider flex items-center justify-center gap-3 hover: transition-colors mt-2 shadow-lg shadow-[#421d6e]/20 group"
                >
                  {" "}
                  Register Now{" "}
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />{" "}
                </button>{" "}
              </form>{" "}
            </div>{" "}
            {/* Widget 2: Event Details */}{" "}
            <div className="bg-[#f9f5ff] rounded-[32px] p-8 border border-[#e8dcf5]">
              {" "}
              <h4 className="text-[18px] font-bold text-[#321654] mb-6 pb-4 border-b border-[#e8dcf5]">
                {" "}
                {data.sidebar.detailsTitle}{" "}
              </h4>{" "}
              <div className="flex flex-col gap-6 mb-8">
                {" "}
                {data.sidebar.details.map((detail, idx) => (
                  <div key={idx} className="flex gap-4">
                    {" "}
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#6b3c9b] shrink-0 shadow-sm border border-[#e8dcf5]">
                      {" "}
                      {getIcon(detail.icon, { size: 18 })}{" "}
                    </div>{" "}
                    <div className="flex flex-col gap-1">
                      {" "}
                      <span className="text-[12px] font-bold text-[#15072b] uppercase tracking-wide">
                        {detail.label}
                      </span>{" "}
                      <span className="text-[13px] text-gray-600 leading-snug whitespace-pre-line">
                        {detail.value}
                      </span>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
              {/* Share */}{" "}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-[#e8dcf5]">
                {" "}
                <span className="text-[13px] font-bold text-[#15072b]">
                  {data.sidebar.shareTitle}
                </span>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <button className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 w-8 h-8 flex items-center justify-center text-[#6b3c9b] hover: hover:text-white transition-colors border border-[#e8dcf5]">
                    {" "}
                    <FacebookIcon size={14} />{" "}
                  </button>{" "}
                  <button className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 w-8 h-8 flex items-center justify-center text-[#6b3c9b] hover: hover:text-white transition-colors border border-[#e8dcf5]">
                    {" "}
                    <LinkedinIcon size={14} />{" "}
                  </button>{" "}
                  <button className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 w-8 h-8 flex items-center justify-center text-[#6b3c9b] hover: hover:text-white transition-colors border border-[#e8dcf5]">
                    {" "}
                    <TwitterIcon size={14} />{" "}
                  </button>{" "}
                  <button className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 w-8 h-8 flex items-center justify-center text-[#6b3c9b] hover: hover:text-white transition-colors border border-[#e8dcf5]">
                    {" "}
                    <Mail size={14} />{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
