"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Image from "next/image";
import { MessageSquareQuote, Star, ShieldCheck, Quote } from "lucide-react";
import { mergeEventData } from "../about/eventPageDefaults";
export interface TestimonialsEvent2Props {
  data: {
    subtitle: string;
    titlePart1: string;
    titleHighlight: string;
    titlePart2: string;
    description: string;
    trustBadgeText1: string;
    trustBadgeHighlight: string;
    trustBadgeText2: string;
    reviews: {
      text: string;
      author: string;
      role: string;
      rating: number;
      image: string;
    }[];
  };
}
export default function TestimonialsEvent2({ data }: TestimonialsEvent2Props) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "testimonials",
    "Testimonials",
    "TestimonialsEvent2",
  ) as TestimonialsEvent2Props["data"];
  return (
    <section className="py-12 bg-slate-50 relative overflow-hidden">
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
            {data.titlePart2}{" "}
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
        {/* Cards Grid */}{" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12 items-center">
          {" "}
          {data.reviews.map((review, idx) => {
            const isActive = idx === 1;
            return (
              <div
                key={idx}
                className={`relative p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between ${isActive ? "bg-[#331175] text-white shadow-2xl scale-105 z-10 min-h-[420px]" : "bg-white text-slate-800 shadow-xl min-h-[380px]"}`}
              >
                {" "}
                {/* Top Quote Icon Background */}{" "}
                <div className="absolute top-6 right-6 opacity-10">
                  {" "}
                  <Quote
                    className={`w-16 h-16 rotate-180 ${isActive ? "text-white" : "text-purple-700"}`}
                    fill="currentColor"
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  {/* Stars */}{" "}
                  <div className="flex space-x-1 mb-6">
                    {" "}
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-700"}`}
                        fill="currentColor"
                      />
                    ))}{" "}
                  </div>{" "}
                  {/* Text */}{" "}
                  <p
                    className={`text-lg leading-relaxed mb-8 relative z-10 ${isActive ? "text-white/90" : "text-slate-600"}`}
                  >
                    {" "}
                    “{review.text}”{" "}
                  </p>{" "}
                </div>{" "}
                <div className="mt-auto">
                  {" "}
                  {/* Separator */}{" "}
                  <div
                    className={`w-12 h-[2px] mb-6 ${isActive ? "bg-white/20" : "bg-purple-100"}`}
                  ></div>{" "}
                  {/* Author Info */}{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <div className="flex items-center space-x-4">
                      {" "}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-md">
                        {" "}
                        <Image
                          src={review.image}
                          alt={review.author}
                          fill
                          className="object-cover"
                        />{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <h4
                          className={`font-semibold ${isActive ? "text-white" : "text-slate-900"}`}
                        >
                          {" "}
                          {review.author}{" "}
                        </h4>{" "}
                        <p
                          className={`text-sm ${isActive ? "text-purple-200" : "text-slate-500"}`}
                        >
                          {" "}
                          {review.role}{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Bottom Quote Circle */}{" "}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive ? "border-white bg-white/10" : "border-purple-200 bg-white"}`}
                    >
                      {" "}
                      <Quote
                        className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-700"}`}
                        fill="currentColor"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
        {/* Pagination Dots */}{" "}
        <div className="flex justify-center space-x-2 mb-16">
          {" "}
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>{" "}
          <div className="w-2 h-2 rounded-full bg-purple-700"></div>{" "}
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>{" "}
        </div>{" "}
        {/* Trust Badge */}{" "}
        <div className="flex justify-center">
          {" "}
          <div className="inline-flex items-center space-x-3 bg-white px-6 py-3 rounded-full shadow-md border border-slate-100">
            {" "}
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              {" "}
              <ShieldCheck className="w-4 h-4 text-purple-700" />{" "}
            </div>{" "}
            <p className="text-slate-600 text-base leading-relaxed ">
              {" "}
              {data.trustBadgeText1}{" "}
              <span className="font-semibold text-purple-700">
                {data.trustBadgeHighlight}
              </span>{" "}
              {data.trustBadgeText2}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
