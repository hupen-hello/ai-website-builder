"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Image from "next/image";
import Link from "next/link";
import { Folder, Clock, ArrowRight } from "lucide-react";
export interface BlogEvent1Props {
  data: {
    subtitle: string;
    titlePart1: string;
    titleHighlight: string;
    description: string;
    blogs: {
      image: string;
      dateLine1: string;
      dateLine2: string;
      dateLine3: string;
      category: string;
      readTime: string;
      title: string;
      link: string;
    }[];
  };
}
export default function BlogEvent1({ data }: BlogEvent1Props) {
  return (
    <section className="py-12 bg-[#faf8fd]">
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
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  leading-tight mb-6">
            {" "}
            {data.titlePart1}{" "}
            <span className="font-['Playfair_Display'] italic text-purple-800 block mt-2">
              {" "}
              {data.titleHighlight}{" "}
            </span>{" "}
          </h2>{" "}
          <p className="text-slate-600 text-base leading-relaxed max-w-xl mx-auto">
            {" "}
            {data.description}{" "}
          </p>{" "}
        </div>{" "}
        {/* Blog Grid */}{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {" "}
          {data.blogs.map((blog, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              {" "}
              {/* Image Container */}{" "}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {" "}
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />{" "}
                {/* Date Badge */}{" "}
                <div className="absolute top-4 left-4 bg-[#3b157b]/95 backdrop-blur-sm text-white px-3 py-2 rounded-xl flex flex-col items-center justify-center text-center shadow-lg border border-white/10 z-10">
                  {" "}
                  <span className="text-lg font-bold leading-none mb-1">
                    {blog.dateLine1}
                  </span>{" "}
                  <span className="text-[10px] font-semibold uppercase tracking-wider leading-none mb-0.5">
                    {blog.dateLine2}
                  </span>{" "}
                  <span className="text-[10px] font-semibold opacity-80 leading-none">
                    {blog.dateLine3}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
              {/* Content Container */}{" "}
              <div className="p-6 flex flex-col flex-grow">
                {" "}
                {/* Meta Info */}{" "}
                <div className="flex items-center text-xs text-slate-500 font-medium mb-4">
                  {" "}
                  <div className="flex items-center">
                    {" "}
                    <Folder className="w-3.5 h-3.5 mr-1.5 text-purple-400" />{" "}
                    {blog.category}{" "}
                  </div>{" "}
                  <div className="mx-3 text-slate-300">|</div>{" "}
                  <div className="flex items-center">
                    {" "}
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-purple-400" />{" "}
                    {blog.readTime}{" "}
                  </div>{" "}
                </div>{" "}
                {/* Title */}{" "}
                <h3 className="text-xl font-serif font-bold text-slate-900 leading-snug mb-6 group-hover:text-purple-700 transition-colors">
                  {" "}
                  <Link href={blog.link} className="focus:outline-none">
                    {" "}
                    <span
                      className="absolute inset-0"
                      aria-hidden="true"
                    />{" "}
                    {blog.title}{" "}
                  </Link>{" "}
                </h3>{" "}
                {/* Footer Link */}{" "}
                <div className="mt-auto">
                  {" "}
                  <Link
                    href={blog.link}
                    className="inline-flex items-center text-sm font-bold text-[#3b157b] group-hover:text-purple-600 transition-colors relative z-10"
                  >
                    {" "}
                    Read More{" "}
                    <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />{" "}
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
