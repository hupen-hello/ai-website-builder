"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Image from "next/image";
import Link from "next/link";
import { Handshake, Users, ArrowRight } from "lucide-react";
export interface PartnersEvent1Props {
  data: {
    subtitle: string;
    titlePart1: string;
    titleHighlight: string;
    titlePart2: string;
    description: string;
    categories: { name: string; partners: { name: string; logo: string }[] }[];
    cta: {
      title: string;
      description: string;
      buttonText: string;
      buttonLink: string;
    };
  };
}
export default function PartnersEvent1({ data }: PartnersEvent1Props) {
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
        {/* Partners Categories */}{" "}
        <div className="max-w-6xl mx-auto space-y-16">
          {" "}
          {data.categories.map((category, idx) => (
            <div key={idx}>
              {" "}
              {/* Category Divider Title */}{" "}
              <div className="flex items-center justify-center mb-10">
                {" "}
                <div className="h-[1px] flex-grow max-w-[200px] bg-slate-200"></div>{" "}
                <h3 className="mx-6 text-sm font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {" "}
                  {category.name}{" "}
                </h3>{" "}
                <div className="h-[1px] flex-grow max-w-[200px] bg-slate-200"></div>{" "}
              </div>{" "}
              {/* Grid */}{" "}
              <div
                className={`grid gap-4 ${category.partners.length === 5 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"}`}
              >
                {" "}
                {category.partners.map((partner, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex items-center justify-center aspect-[2/1] group"
                  >
                    {" "}
                    <div className="relative w-full h-full opacity-70 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0">
                      {" "}
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        fill
                        className="object-contain"
                      />{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
        {/* Call to Action Banner */}{" "}
        <div className="max-w-5xl mx-auto mt-20">
          {" "}
          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 md:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {" "}
            <div className="flex items-center space-x-6 text-center lg:text-left">
              {" "}
              <div className="hidden lg:flex flex-shrink-0 w-16 h-16 rounded-full bg-white shadow-sm items-center justify-center text-purple-700">
                {" "}
                <Users className="w-8 h-8" />{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  {data.cta.title}
                </h4>{" "}
                <p className="text-slate-600 text-base leading-relaxed ">
                  {data.cta.description}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex-shrink-0 w-full md:w-auto">
              {" "}
              <Link
                href={data.cta.buttonLink}
                className="flex items-center justify-center w-full md:w-auto px-6 md:px-8 py-3.5 bg-white border border-purple-200 text-purple-700 font-medium rounded-full hover:bg-purple-50 hover:border-purple-300 transition-colors group"
              >
                {" "}
                {data.cta.buttonText}{" "}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />{" "}
              </Link>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
