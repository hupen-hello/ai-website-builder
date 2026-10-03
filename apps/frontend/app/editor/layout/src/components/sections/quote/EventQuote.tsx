"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import {
  Clock,
  Award,
  Shield,
  Headphones,
  User,
  Mail,
  PhoneCall,
  Calendar,
  DollarSign,
  PenTool,
  Send,
  FileEdit,
  Phone,
} from "lucide-react";
import Image from "next/image";
export interface GetAQuoteEvent1Props {
  data: {
    mainContent: {
      subtitle: string;
      titlePart1: string;
      titleHighlight: string;
      description: string;
      features: { title: string; description: string; icon: string }[];
    };
    form: {
      fields: {
        label: string;
        placeholder: string;
        type: string;
        icon: string;
        required?: boolean;
        options?: string[];
      }[];
      submitText: string;
    };
    contactBanner: {
      title: string;
      description: string;
      phone: string;
      bgImage: string;
    };
  };
}
const getIcon = (iconName: string, className: string = "w-5 h-5") => {
  switch (iconName) {
    case "clock":
      return <Clock className={className} />;
    case "award":
      return <Award className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "headphones":
      return <Headphones className={className} />;
    case "user":
      return <User className={className} />;
    case "mail":
      return <Mail className={className} />;
    case "phone":
      return <Phone className={className} />;
    case "calendar":
      return <Calendar className={className} />;
    case "dollar-sign":
      return <DollarSign className={className} />;
    case "pen-tool":
      return <PenTool className={className} />;
    default:
      return <Clock className={className} />;
  }
};
export default function GetAQuoteEvent1({ data }: GetAQuoteEvent1Props) {
  const { mainContent, form, contactBanner } = data;
  return (
    <section className="relative overflow-hidden bg-[#faf8fd] pt-24 pb-12">
      {" "}
      {/* Decorative Background Elements */}{" "}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[80%] rounded-full bg-gradient-to-bl from-purple-200/40 to-transparent blur-3xl -z-10"></div>{" "}
      <div className="absolute top-20 left-10 w-24 h-24 bg-dots-pattern opacity-10"></div>{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start mb-20">
          {" "}
          {/* Left Column: Text & Features */}{" "}
          <div className="lg:pr-12">
            {" "}
            {/* Subtitle */}{" "}
            <div className="flex items-center space-x-4 mb-6">
              {" "}
              <div className="h-[1px] w-8 bg-purple-300"></div>{" "}
              <div className="w-1.5 h-1.5 rotate-45 bg-purple-700"></div>{" "}
              <span className="text-purple-900 font-bold uppercase tracking-[0.2em] text-sm">
                {" "}
                {mainContent.subtitle}{" "}
              </span>{" "}
              <div className="w-1.5 h-1.5 rotate-45 bg-purple-700"></div>{" "}
              <div className="h-[1px] w-8 bg-purple-300"></div>{" "}
            </div>{" "}
            {/* Title */}{" "}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]   leading-tight mb-6">
              {" "}
              {mainContent.titlePart1}{" "}
              <span className="font-['Playfair_Display'] italic text-purple-800 block mt-2">
                {" "}
                {mainContent.titleHighlight}{" "}
              </span>{" "}
            </h2>{" "}
            <div className="w-12 h-1 bg-purple-700 mb-6"></div>{" "}
            <p className="text-slate-600 text-base leading-relaxed mb-12 max-w-lg">
              {" "}
              {mainContent.description}{" "}
            </p>{" "}
            {/* Features Grid */}{" "}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {" "}
              {mainContent.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center sm:items-start text-center sm:text-left"
                >
                  {" "}
                  <div className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center mb-4 border border-purple-200">
                    {" "}
                    {getIcon(feature.icon, "w-8 h-8 text-[#4a1c7c]")}{" "}
                  </div>{" "}
                  <h4 className="font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h4>{" "}
                  <p className="text-slate-600 text-base leading-relaxed max-w-[150px]">
                    {feature.description}
                  </p>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          {/* Right Column: Form Card */}{" "}
          <div className="relative">
            {" "}
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 lg:p-10 border border-slate-100 relative z-10 pt-16 mt-8 lg:mt-0">
              {" "}
              {/* Floating Top Icon */}{" "}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-[#4a1c7c] text-white flex items-center justify-center shadow-lg border-4 border-white">
                {" "}
                <FileEdit className="w-8 h-8" />{" "}
              </div>{" "}
              <form className="space-y-6">
                {" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {" "}
                  {form.fields.map((field, idx) => {
                    const isTextarea = field.type === "textarea";
                    const isFullWidth = isTextarea;
                    return (
                      <div
                        key={idx}
                        className={isFullWidth ? "md:col-span-2" : ""}
                      >
                        {" "}
                        <label className="block text-sm font-bold text-slate-800 mb-2">
                          {" "}
                          {field.label}{" "}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}{" "}
                        </label>{" "}
                        <div className="relative">
                          {" "}
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                            {" "}
                            {getIcon(
                              field.icon,
                              isTextarea
                                ? "w-5 h-5 absolute top-0 mt-3.5 -translate-y-0 text-purple-400"
                                : "w-5 h-5 text-purple-400",
                            )}{" "}
                          </div>{" "}
                          {isTextarea ? (
                            <textarea
                              placeholder={field.placeholder}
                              required={field.required}
                              rows={4}
                              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-700 transition-colors resize-none"
                            />
                          ) : field.type === "select" ? (
                            <select
                              required={field.required}
                              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-700 transition-colors appearance-none cursor-pointer"
                              defaultValue=""
                            >
                              {" "}
                              <option value="" disabled>
                                {field.placeholder}
                              </option>{" "}
                              {field.options?.map((opt, oIdx) => (
                                <option key={oIdx} value={opt}>
                                  {opt}
                                </option>
                              ))}{" "}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-700 transition-colors"
                            />
                          )}{" "}
                        </div>{" "}
                      </div>
                    );
                  })}{" "}
                </div>{" "}
                <button
                  className="w-full inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-all duration-300 group shadow-md"
                >
                  {" "}
                  <Send className="w-5 h-5 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />{" "}
                  {form.submitText}{" "}
                </button>{" "}
              </form>{" "}
            </div>{" "}
            {/* Decorative dots behind the card */}{" "}
            <div className="hidden lg:block absolute -right-6 -bottom-6 w-32 h-32 bg-dots-pattern opacity-10 -z-10"></div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Contact Banner */}{" "}
        <div className="relative rounded-3xl overflow-hidden shadow-xl bg-[#2a1147]">
          {" "}
          {/* Background Image with Overlay */}{" "}
          <div className="absolute inset-0 z-0">
            {" "}
            <Image
              src={contactBanner.bgImage}
              alt="Event Background"
              fill
              className="object-cover opacity-20 mix-blend-luminosity"
            />{" "}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2a1147] via-[#2a1147]/90 to-transparent"></div>{" "}
          </div>{" "}
          <div className="relative z-10 p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {" "}
            <div className="flex items-center gap-6">
              {" "}
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white flex items-center justify-center">
                {" "}
                <PhoneCall className="w-8 h-8 text-[#4a1c7c]" />{" "}
              </div>{" "}
              <div>
                {" "}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  {contactBanner.title}
                </h3>{" "}
                <p className="text-purple-200">
                  {contactBanner.description}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="text-center md:text-right">
              {" "}
              <span className="text-2xl md:text-4xl font-bold text-white tracking-wide">
                {" "}
                {contactBanner.phone}{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <style
        dangerouslySetInnerHTML={{
          __html: ` .bg-dots-pattern { background-image: radial-gradient(circle, #4a1c7c 2px, transparent 2px); background-size: 16px 16px; } `,
        }}
      />{" "}
    </section>
  );
}
