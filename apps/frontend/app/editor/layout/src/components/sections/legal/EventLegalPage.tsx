"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { mergeEventData } from "../about/eventPageDefaults";
export interface LegalEvent1Props {
  data: {
    sidebarLinks: { label: string; href: string }[];
    lastUpdated: string;
    intro: string;
    sections: { number: string; title: string; content: string }[];
    callout: { text: string; linkText: string; linkHref: string };
  };
}
export default function LegalEvent1({ data }: LegalEvent1Props) {
  const pathname = usePathname();
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "legal",
    "Legal",
    "TermsEvent1",
  ) as LegalEvent1Props["data"];
  return (
    <section className="py-12 lg:py-12 bg-white">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16">
          {" "}
          {/* Sidebar */}{" "}
          <div className="w-full md:w-1/4 flex-shrink-0">
            {" "}
            <div className="sticky top-28 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              {" "}
              <nav className="flex flex-col">
                {" "}
                {(data.sidebarLinks || []).map((link, idx) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={idx}
                      href={link.href}
                      className={`px-6 md:px-8 py-4 md:py-5 text-base md:text-lg font-medium transition-colors border-l-4 ${isActive ? "bg-[#faf8fd] text-purple-700 border-purple-700" : "text-slate-600 hover:bg-slate-50 border-transparent hover:text-slate-900"}`}
                    >
                      {" "}
                      {link.label}{" "}
                    </Link>
                  );
                })}{" "}
              </nav>{" "}
            </div>{" "}
          </div>{" "}
          {/* Main Content */}{" "}
          <div className="w-full md:w-3/4">
            {" "}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-12">
              {" "}
              {/* Header Info */}{" "}
              <div className="mb-10 space-y-6">
                {" "}
                <p className="text-slate-600 text-base leading-relaxed font-bold">
                  {" "}
                  <span className="text-purple-700">Last Updated:</span>{" "}
                  {data.lastUpdated}{" "}
                </p>{" "}
                <p className="text-slate-600 text-base leading-relaxed ">
                  {" "}
                  {data.intro}{" "}
                </p>{" "}
              </div>{" "}
              {/* Sections List */}{" "}
              <div className="space-y-10">
                {" "}
                {data.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-10 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    {" "}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold shadow-sm">
                      {" "}
                      {section.number}{" "}
                    </div>{" "}
                    <div className="space-y-3">
                      {" "}
                      <h3 className="text-xl font-serif font-bold text-purple-900">
                        {" "}
                        {section.title}{" "}
                      </h3>{" "}
                      <p className="text-slate-600 text-base leading-relaxed ">
                        {" "}
                        {section.content}{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
              {/* Callout Box */}{" "}
              <div className="mt-12 bg-[#faf8fd] rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                {" "}
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-900 flex items-center justify-center text-white">
                  {" "}
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />{" "}
                </div>{" "}
                <p className="text-slate-600 text-base leading-relaxed font-medium">
                  {" "}
                  {data.callout.text.split(data.callout.linkText)[0]}{" "}
                  <Link
                    href={data.callout.linkHref}
                    className="text-purple-700 font-bold hover:underline"
                  >
                    {" "}
                    {data.callout.linkText}{" "}
                  </Link>{" "}
                  {data.callout.text.split(data.callout.linkText)[1]}{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
