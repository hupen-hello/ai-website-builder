"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import {
  CheckCircle2,
  Users,
  Megaphone,
  PenTool,
  TrendingUp,
  Clock,
  Send,
  ArrowRight,
  CloudUpload,
} from "lucide-react";
import Link from "next/link";
import { mergeEventData } from "../about/eventPageDefaults";
export interface CareerDetailEvent1Props {
  data: {
    mainContent: {
      aboutRole: { title: string; description: string[] };
      responsibilities: { title: string; items: string[] };
      requirements: { title: string; items: string[] };
      preferredSkills: {
        title: string;
        items: { title: string; icon: string }[];
      };
      cta: {
        title: string;
        description: string;
        buttonText: string;
        buttonLink: string;
      };
    };
    sidebar: {
      form: {
        title: string;
        fields: {
          label: string;
          placeholder: string;
          type: string;
          required?: boolean;
          options?: string[];
          description?: string;
        }[];
        submitText: string;
      };
    };
  };
}
const getIcon = (iconName: string, className: string = "w-5 h-5") => {
  switch (iconName) {
    case "users":
      return <Users className={className} />;
    case "megaphone":
      return <Megaphone className={className} />;
    case "pen-tool":
      return <PenTool className={className} />;
    case "trending-up":
      return <TrendingUp className={className} />;
    case "clock":
      return <Clock className={className} />;
    default:
      return <CheckCircle2 className={className} />;
  }
};
export default function CareerDetailEvent1({ data }: CareerDetailEvent1Props) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "careerDetail",
    "CareerDetail",
    "CareerDetailEvent1",
  ) as CareerDetailEvent1Props["data"];
  const { mainContent, sidebar } = data;
  return (
    <section className="py-12 bg-white">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 gap-16">
          {" "}
          {/* Main Content (Left Column) */}{" "}
          <div className="lg:col-span-2 space-y-12">
            {" "}
            {/* About the Role */}{" "}
            <div>
              {" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e] mb-4 relative inline-block">
                {" "}
                {mainContent.aboutRole.title}{" "}
                <div className="absolute -bottom-2 left-0 w-1/2 h-[3px] bg-purple-600 rounded-full"></div>{" "}
              </h2>{" "}
              <div className="mt-8 space-y-4">
                {" "}
                {mainContent.aboutRole.description.map((para, idx) => (
                  <p key={idx} className="text-slate-600 leading-relaxed">
                    {" "}
                    {para}{" "}
                  </p>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {/* Key Responsibilities */}{" "}
            <div>
              {" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e] mb-4 relative inline-block">
                {" "}
                {mainContent.responsibilities.title}{" "}
                <div className="absolute -bottom-2 left-0 w-1/2 h-[3px] bg-purple-600 rounded-full"></div>{" "}
              </h2>{" "}
              <ul className="mt-8 space-y-4">
                {" "}
                {mainContent.responsibilities.items.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    {" "}
                    <CheckCircle2
                      className="w-5 h-5 text-purple-700 mr-3 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      stroke="white"
                    />{" "}
                    <span className="text-slate-700 font-medium">
                      {item}
                    </span>{" "}
                  </li>
                ))}{" "}
              </ul>{" "}
            </div>{" "}
            {/* Requirements */}{" "}
            <div>
              {" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e] mb-4 relative inline-block">
                {" "}
                {mainContent.requirements.title}{" "}
                <div className="absolute -bottom-2 left-0 w-1/2 h-[3px] bg-purple-600 rounded-full"></div>{" "}
              </h2>{" "}
              <ul className="mt-8 space-y-4">
                {" "}
                {mainContent.requirements.items.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    {" "}
                    <CheckCircle2 className="w-5 h-5 text-purple-700 mr-3 mt-0.5 flex-shrink-0" />{" "}
                    <span className="text-slate-700 font-medium">
                      {item}
                    </span>{" "}
                  </li>
                ))}{" "}
              </ul>{" "}
            </div>{" "}
            {/* Preferred Skills */}{" "}
            <div>
              {" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e] mb-8 relative inline-block">
                {" "}
                {mainContent.preferredSkills.title}{" "}
                <div className="absolute -bottom-2 left-0 w-1/2 h-[3px] bg-purple-600 rounded-full"></div>{" "}
              </h2>{" "}
              <div className="flex flex-wrap gap-6 justify-between mt-4">
                {" "}
                {mainContent.preferredSkills.items.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center w-[120px]"
                  >
                    {" "}
                    <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                      {" "}
                      {getIcon(skill.icon, "w-6 h-6 text-purple-700")}{" "}
                    </div>{" "}
                    <span className="text-sm font-bold text-slate-800 leading-tight">
                      {" "}
                      {skill.title}{" "}
                    </span>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {/* Call to Action */}{" "}
            <div className="bg-[#f7f4fd] border border-purple-100 rounded-2xl p-6 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              {" "}
              <div className="flex items-center gap-4 text-center lg:text-left">
                {" "}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#ebdfff] flex items-center justify-center">
                  {" "}
                  <Send className="w-6 h-6 text-purple-700" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                    {mainContent.cta.title}
                  </h4>{" "}
                  <p className="text-slate-600 text-base leading-relaxed ">
                    {mainContent.cta.description}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <Link
                href={mainContent.cta.buttonLink}
                className="flex-shrink-0 flex items-center justify-center px-6 py-2.5 bg-white border border-purple-200 text-purple-700 font-bold rounded-full hover:bg-purple-50 transition-colors text-sm group"
              >
                {" "}
                {mainContent.cta.buttonText}{" "}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />{" "}
              </Link>{" "}
            </div>{" "}
          </div>{" "}
          {/* Sidebar (Right Column) - Application Form */}{" "}
          <div className="lg:col-span-1">
            {" "}
            <div className="bg-[#faf8fd] rounded-2xl p-8 border border-purple-50 sticky top-24 self-start">
              {" "}
              <h3 className="text-2xl font-serif font-bold text-[#2a1b4d] mb-8 relative inline-block">
                {" "}
                {sidebar.form.title}{" "}
                <div className="absolute -bottom-2 left-0 w-1/2 h-[3px] bg-purple-600 rounded-full"></div>{" "}
              </h3>{" "}
              <form className="space-y-6">
                {" "}
                {sidebar.form.fields.map((field, idx) => (
                  <div key={idx}>
                    {" "}
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      {" "}
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}{" "}
                    </label>{" "}
                    {field.type === "textarea" ? (
                      <textarea
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-700 transition-colors resize-none"
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-700 transition-colors appearance-none cursor-pointer"
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
                    ) : field.type === "file" ? (
                      <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 flex flex-col items-center justify-center bg-white hover:bg-purple-50/50 transition-colors cursor-pointer text-center group">
                        {" "}
                        <CloudUpload className="w-8 h-8 text-purple-400 mb-2 group-hover:text-purple-600 transition-colors" />{" "}
                        <p className="text-slate-600 text-base leading-relaxed font-medium mb-1">
                          {" "}
                          <span className="text-purple-700 font-bold">
                            {field.placeholder}
                          </span>{" "}
                          or drag and drop{" "}
                        </p>{" "}
                        <p className="text-slate-600 text-base leading-relaxed text-xs font-medium">
                          {" "}
                          {field.description}{" "}
                        </p>{" "}
                        <input
                          type="file"
                          className="hidden"
                          required={field.required}
                        />{" "}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-700 transition-colors"
                      />
                    )}{" "}
                  </div>
                ))}{" "}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 w-full -900 text-white hover:-800 transition-colors mt-4"
                >
                  {" "}
                  {sidebar.form.submitText}{" "}
                </button>{" "}
              </form>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
