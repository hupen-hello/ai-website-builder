"use client";
import React, { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake,
  Sparkles,
  Palette,
  Star,
  Diamond,
  CalendarCheck,
  Award,
  Heart,
  Gem,
  Briefcase,
  Users,
  Gift,
  Plane,
  Music,
  Building2,
  Layout,
  ArrowRight,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Calendar,
  PenLine,
  ChevronDown,
} from "lucide-react";
import { ServiceDetailData } from "../about/eventTypes";
import { mergeEventData } from "../about/eventPageDefaults";

const getIcon = (iconName: string, props: any = {}) => {
  switch (iconName) {
    case "heart-handshake":
      return <HeartHandshake {...props} />;
    case "sparkles":
      return <Sparkles {...props} />;
    case "palette":
      return <Palette {...props} />;
    case "star":
      return <Star {...props} />;
    case "diamond":
      return <Diamond {...props} />;
    case "calendar-check":
      return <CalendarCheck {...props} />;
    case "award":
      return <Award {...props} />;
    case "heart":
      return <Heart {...props} />;
    case "rings":
      return <Gem {...props} />;
    case "briefcase":
      return <Briefcase {...props} />;
    case "users":
      return <Users {...props} />;
    case "cake":
      return <Gift {...props} />;
    case "plane":
      return <Plane {...props} />;
    case "music":
      return <Music {...props} />;
    case "building":
      return <Building2 {...props} />;
    case "layout":
      return <Layout {...props} />;
    default:
      return (
        <Briefcase {...props} />
      ); /* default to briefcase for dynamic services */
  }
};
export default function EventServiceDetailPage({
  data = {},
}: SectionProps) {
  data = mergeEventData(
    data,
    "serviceDetail",
    "ServiceDetail",
    "ServiceDetailEvent1",
  );
  const typed = data as ServiceDetailData & { services?: { title?: string }[] };
  const servicesList =
    typed.sidebar?.services ||
    typed.services ||
    [];
  // Track which service is active
  const [activeIndex, setActiveIndex] = useState(0);
  const activeService = servicesList[activeIndex];
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
            {/* Header Content */}{" "}
            <motion.div
              key={`header-${activeIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              {" "}
              <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs uppercase mb-6 flex items-center gap-4">
                {" "}
                {data.subtitle}{" "}
                <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
              </h5>{" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  mb-6">
                {" "}
                {activeService.title}{" "}
              </h2>{" "}
              <div className="flex items-center gap-3 mb-6">
                {" "}
                <div className="w-2 h-2 rotate-45 bg-[#6b3c9b]/60"></div>{" "}
                <div className="w-full h-px bg-gray-100 flex-1 max-w-sm"></div>{" "}
              </div>{" "}
              <p className="text-slate-600 text-base leading-relaxed  max-w-2xl">
                {" "}
                {data.shortDescription}{" "}
              </p>{" "}
            </motion.div>{" "}
            {/* Top 4 Features */}{" "}
            <div className="flex flex-wrap gap-6 mb-12">
              {" "}
              {data.topFeatures.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="flex items-center gap-4"
                >
                  {" "}
                  <div className="w-12 h-12 bg-[#321654] rounded-full flex items-center justify-center text-white shrink-0">
                    {" "}
                    {getIcon(feature.icon, { size: 20 })}{" "}
                  </div>{" "}
                  <span className="text-sm font-bold text-[#15072b] leading-tight whitespace-pre-line">
                    {" "}
                    {feature.title}{" "}
                  </span>{" "}
                </motion.div>
              ))}{" "}
            </div>{" "}
            {/* Main Image */}{" "}
            <AnimatePresence mode="wait">
              {" "}
              <motion.div
                key={`img-${activeIndex}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl overflow-hidden mb-16 shadow-xl"
              >
                {" "}
                <img
                  src={activeService.image}
                  alt={activeService.title}
                  className="w-full h-[500px] object-cover"
                />{" "}
              </motion.div>{" "}
            </AnimatePresence>{" "}
            {/* Overview */}{" "}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {" "}
              <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs uppercase mb-4 flex items-center gap-4">
                {" "}
                {data.overviewSubtitle}{" "}
                <span className="w-8 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
              </h5>{" "}
              <h3 className="text-3xl md:text-[34px] font-serif text-[#15072b] mb-8 leading-snug max-w-xl">
                {" "}
                {data.overviewTitle}{" "}
              </h3>{" "}
              <div className="space-y-6 text-gray-500 text-sm md:text-[15px] leading-relaxed mb-12">
                {" "}
                {data.overviewDescription.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}{" "}
              </div>{" "}
              {/* Overview Features Grid */}{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                {" "}
                {data.overviewFeatures.map((feature, idx) => (
                  <div key={idx} className="flex gap-5">
                    {" "}
                    <div className="w-14 h-14 bg-[#321654] rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#321654]/20">
                      {" "}
                      {getIcon(feature.icon, {
                        size: 24,
                        strokeWidth: 1.5,
                      })}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-bold text-[#15072b] text-[17px] mb-2">
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
          </div>{" "}
          {/* Sidebar (Right Column) */}{" "}
          <div className="w-full lg:w-[35%] flex flex-col gap-10 sticky top-24 h-fit">
            {" "}
            {/* Widget 1: Services List */}{" "}
            <div className="bg-[#f9f9fb] rounded-3xl p-8 border border-gray-100">
              {" "}
              <h5 className="text-[#15072b] font-bold tracking-[0.1em] text-sm uppercase mb-6 flex items-center gap-4">
                {" "}
                {data.sidebar.servicesTitle}{" "}
                <span className="w-8 h-[2px] bg-[#6b3c9b]/40"></span>{" "}
              </h5>{" "}
              <div className="flex flex-col gap-3">
                {" "}
                {servicesList.map((svc, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl font-medium text-[15px] transition-all duration-300 border ${isActive ? "bg-[#321654] text-white border-[#321654] shadow-lg scale-[1.02]" : "bg-white text-gray-600 border-gray-100 hover:border-[#6b3c9b] hover:text-[#6b3c9b] hover:shadow-md"}`}
                    >
                      {" "}
                      <div className="flex items-center gap-4 text-left">
                        {" "}
                        {/* We use a generic icon mapped from the title or just a generic briefcase/star */}{" "}
                        <div
                          className={isActive ? "text-white" : "text-gray-400"}
                        >
                          {" "}
                          {idx % 2 === 0 ? (
                            <Briefcase size={18} />
                          ) : (
                            <Users size={18} />
                          )}{" "}
                        </div>{" "}
                        <span className="leading-tight">{svc.title}</span>{" "}
                      </div>{" "}
                      <ArrowRight
                        size={16}
                        className={isActive ? "text-white" : "text-gray-300"}
                      />{" "}
                    </button>
                  );
                })}{" "}
              </div>{" "}
            </div>{" "}
            {/* Widget 2: Why Choose Us */}{" "}
            <div className="bg-[#321654] rounded-3xl p-8 text-white shadow-xl">
              {" "}
              <h5 className="font-bold tracking-[0.1em] text-sm uppercase mb-6 flex items-center justify-between">
                {" "}
                {data.sidebar.whyChooseTitle}{" "}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  {" "}
                  <div className="w-1.5 h-1.5 rotate-45 bg-white"></div>{" "}
                </div>{" "}
              </h5>{" "}
              <div className="flex flex-col gap-4">
                {" "}
                {data.sidebar.whyChoosePoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {" "}
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[#6b3c9b] flex items-center justify-center shrink-0">
                      {" "}
                      <CheckCircle2
                        size={12}
                        className="text-white fill-[#6b3c9b]"
                      />{" "}
                    </div>{" "}
                    <span className="text-gray-300 text-sm leading-snug">
                      {point}
                    </span>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {/* Widget 3: Enquiry Form */}{" "}
            <div className="bg-[#f9f9fb] rounded-3xl p-8 border border-gray-100">
              {" "}
              <h5 className="text-[#15072b] font-bold tracking-[0.1em] text-sm uppercase mb-4">
                {" "}
                {data.sidebar.enquiryTitle}{" "}
              </h5>{" "}
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                {" "}
                {data.sidebar.enquiryDescription}{" "}
              </p>{" "}
              <form className="flex flex-col gap-4">
                {" "}
                <div className="relative">
                  {" "}
                  <User
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />{" "}
                  <input
                    type="text"
                    placeholder="Your Name*"
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
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />{" "}
                  <select className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors appearance-none text-gray-500">
                    {" "}
                    <option value="">Event Type*</option>{" "}
                    <option value="wedding">Wedding</option>{" "}
                    <option value="corporate">Corporate</option>{" "}
                  </select>{" "}
                </div>{" "}
                <div className="relative">
                  {" "}
                  <Calendar
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />{" "}
                  <input
                    type="text"
                    placeholder="Event Date*"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors"
                  />{" "}
                </div>{" "}
                <div className="relative mt-2">
                  {" "}
                  <PenLine
                    size={16}
                    className="absolute left-4 top-4 text-gray-400"
                  />{" "}
                  <textarea
                    rows={3}
                    placeholder="Tell us more about your event..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#6b3c9b] transition-colors resize-none"
                  ></textarea>{" "}
                </div>{" "}
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 uppercase tracking-wider mt-2"
                >
                  {" "}
                  Send Enquiry <ArrowRight size={18} />{" "}
                </button>{" "}
              </form>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
