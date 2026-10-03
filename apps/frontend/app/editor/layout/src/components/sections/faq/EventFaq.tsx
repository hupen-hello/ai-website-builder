"use client";
import React, { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { MessageCircleQuestion, Plus, Minus } from "lucide-react";
export interface FaqsEvent1Props {
  data: {
    subtitle: string;
    titlePart1: string;
    titleHighlight: string;
    description: string;
    faqs: { question: string; answer: string }[];
  };
}
export default function FaqsEvent1({ data }: FaqsEvent1Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return (
    <section className="py-12 bg-white">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        {/* Header */}{" "}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {" "}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {" "}
            <div className="h-[1px] w-8 bg-purple-300"></div>{" "}
            <div className="w-1.5 h-1.5 rotate-45 bg-purple-700"></div>{" "}
            <span className="text-purple-900 font-bold uppercase tracking-[0.2em] text-sm">
              {" "}
              {data.subtitle}{" "}
            </span>{" "}
            <div className="w-1.5 h-1.5 rotate-45 bg-purple-700"></div>{" "}
            <div className="h-[1px] w-8 bg-purple-300"></div>{" "}
          </div>{" "}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  mb-6">
            {" "}
            {data.titlePart1}{" "}
            <span className="font-['Playfair_Display'] italic text-purple-700">
              {data.titleHighlight}
            </span>{" "}
          </h2>{" "}
          <div className="flex items-center justify-center mb-6">
            {" "}
            <div className="h-[1px] w-12 bg-purple-200"></div>{" "}
            <div className="w-2 h-2 rotate-45 border border-purple-300 mx-2 bg-purple-700"></div>{" "}
            <div className="h-[1px] w-12 bg-purple-200"></div>{" "}
          </div>{" "}
          <p className="text-slate-600 text-base leading-relaxed ">
            {" "}
            {data.description}{" "}
          </p>{" "}
        </div>{" "}
        {/* FAQs Accordion */}{" "}
        <div className="max-w-4xl mx-auto space-y-4">
          {" "}
          {data.faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? "bg-[#faf8fd] border border-[#f3eefe] border-l-4 border-l-purple-700 shadow-sm" : "bg-white border border-slate-200 hover:border-purple-200"}`}
              >
                {" "}
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  {" "}
                  <span
                    className={`text-lg text-xl pr-6 ${isOpen ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}
                  >
                    {" "}
                    {faq.question}{" "}
                  </span>{" "}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen ? "bg-purple-700 text-white" : "border border-purple-300 text-purple-700 bg-white"}`}
                  >
                    {" "}
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}{" "}
                  </div>{" "}
                </button>{" "}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  {" "}
                  <div className="p-6 pt-0 text-slate-600 text-lg leading-relaxed">
                    {" "}
                    {faq.answer}{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
