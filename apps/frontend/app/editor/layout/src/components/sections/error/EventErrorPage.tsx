"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mergeEventData } from "../about/eventPageDefaults";
export interface Error404Event1Props {
  data: {
    subtitle: string;
    titlePart1: string;
    titleHighlight: string;
    description: string;
    button: { text: string; href: string };
    errorNumber: string;
  };
}
export default function Error404Event1({ data }: Error404Event1Props) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "error",
    "Error404",
    "Error404Event1",
  ) as Error404Event1Props["data"];
  return (
    <section className="py-12 lg:py-24 bg-white relative overflow-hidden flex items-center justify-center min-h-[70vh] font-sans">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] relative z-10">
        {" "}
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-16 lg:gap-8">
          {" "}
          {/* Left Content */}{" "}
          <div className="w-full md:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            {" "}
            <h4 className="text-[#8e549e] font-bold uppercase tracking-widest text-xs mb-4">
              {" "}
              {data.subtitle}{" "}
            </h4>{" "}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#2a1b41] leading-[1.1] mb-6">
              {" "}
              {data.titlePart1} <br />{" "}
              <span className="text-[#3b2a5c]">{data.titleHighlight}</span>{" "}
            </h1>{" "}
            <div className="h-[2px] w-12 bg-slate-300 mb-6"></div>{" "}
            <p className="text-slate-600 text-base leading-relaxed max-w-sm mb-10">
              {" "}
              {data.description}{" "}
            </p>{" "}
            <Link
              href={data.button.href}
              className="inline-flex items-center justify-center px-8 py-4 bg-[#1a0b2e] text-white text-sm tracking-wider font-medium hover:bg-purple-900 transition-colors group"
            >
              {" "}
              <ArrowLeft className="w-4 h-4 mr-3 transform group-hover:-translate-x-1 transition-transform" />{" "}
              {data.button.text}{" "}
            </Link>{" "}
          </div>{" "}
          {/* Right Image/404 Graphic */}{" "}
          <div className="w-full md:w-1/2 flex justify-center lg:justify-end relative">
            {" "}
            <div className="relative w-full max-w-[700px] aspect-[5/4] flex items-center justify-center">
              {" "}
              {/* SVG Background Particles and Shadow */}{" "}
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                {" "}
                <svg
                  viewBox="0 0 500 400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full scale-[1.3] lg:scale-[1.5]"
                >
                  {" "}
                  {/* Ground Shadow */}{" "}
                  <ellipse cx="250" cy="310" rx="180" ry="15" fill="#f8edf8" />{" "}
                  {/* Particles */} {/* Top Left Open Circle */}{" "}
                  <circle
                    cx="100"
                    cy="110"
                    r="4.5"
                    stroke="#8e549e"
                    strokeWidth="1.5"
                  />{" "}
                  {/* Middle Left Parallel Lines */}{" "}
                  <path
                    d="M50 200L70 205"
                    stroke="#2a1b41"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  <path
                    d="M55 215L75 220"
                    stroke="#2a1b41"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  {/* Bottom Left Slash */}{" "}
                  <path
                    d="M90 280L100 260"
                    stroke="#8e549e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  {/* Top Middle Parallel Lines */}{" "}
                  <path
                    d="M360 80L370 65"
                    stroke="#2a1b41"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  <path
                    d="M370 85L380 70"
                    stroke="#2a1b41"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  {/* Top Right Solid Circle */}{" "}
                  <circle cx="430" cy="100" r="4" fill="#8e549e" />{" "}
                  {/* Right Middle Cross */}{" "}
                  <path
                    d="M425 150L435 160M435 150L425 160"
                    stroke="#d4b8d9"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  {/* Right Middle Slash */}{" "}
                  <path
                    d="M430 190L440 180"
                    stroke="#2a1b41"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  {/* Right Bottom Cross */}{" "}
                  <path
                    d="M440 220L448 228M448 220L440 228"
                    stroke="#8e549e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />{" "}
                  {/* Bottom Open Circle */}{" "}
                  <circle
                    cx="360"
                    cy="270"
                    r="4.5"
                    stroke="#8e549e"
                    strokeWidth="1.5"
                  />{" "}
                </svg>{" "}
              </div>{" "}
              {/* Huge 404 Text */}{" "}
              <div className="relative z-10 text-[200px] md:text-[280px] lg:text-[360px] font-medium text-[#2d114c] leading-none select-none tracking-tight">
                {" "}
                {data.errorNumber}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
