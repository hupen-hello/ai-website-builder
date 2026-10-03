"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Image from "next/image";
import Link from "next/link";
import { Quote, Search, ChevronRight } from "lucide-react";
import { mergeEventData } from "../about/eventPageDefaults";
export interface BlogDetailEvent1Props {
  data: {
    mainContent: {
      heroImage: string;
      category: string;
      date: string;
      title: string;
      intro: string;
      sections: {
        type: "text" | "image-text" | "quote";
        title?: string;
        content: string | string[];
        image?: string;
      }[];
      tags: string[];
    };
    sidebar: {
      title: string;
      posts: { title: string; date: string; image: string; link: string }[];
      categories?: {
        title: string;
        items: { name: string; count: number; link: string }[];
      };
      search?: { placeholder: string };
      sidebarTags?: { title: string; items: string[] };
    };
  };
}
export default function BlogDetailEvent1({ data }: BlogDetailEvent1Props) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "blogDetail",
    "BlogDetail",
    "BlogDetailEvent1",
  ) as BlogDetailEvent1Props["data"];
  const { mainContent, sidebar } = data;
  return (
    <section className="py-12 lg:py-12 bg-white">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {" "}
          {/* Main Content (Left Column) */}{" "}
          <div className="lg:col-span-2 space-y-10">
            {" "}
            {/* Hero Image */}{" "}
            <div className="relative w-full aspect-[21/9] lg:aspect-[2/1] rounded-3xl overflow-hidden shadow-sm">
              {" "}
              <Image
                src={mainContent.heroImage}
                alt={mainContent.title}
                fill
                className="object-cover"
              />{" "}
            </div>{" "}
            {/* Meta & Title */}{" "}
            <div>
              {" "}
              <div className="flex items-center text-sm font-bold uppercase tracking-wider mb-4">
                {" "}
                <span className="text-purple-700">
                  {mainContent.category}
                </span>{" "}
                <span className="mx-3 text-slate-300">•</span>{" "}
                <span className="text-slate-500 font-medium normal-case tracking-normal">
                  {mainContent.date}
                </span>{" "}
              </div>{" "}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1a0b2e]   leading-tight mb-6">
                {" "}
                {mainContent.title}{" "}
              </h1>{" "}
              <p className="text-slate-600 text-base leading-relaxed ">
                {" "}
                {mainContent.intro}{" "}
              </p>{" "}
            </div>{" "}
            {/* Dynamic Sections */}{" "}
            <div className="space-y-12">
              {" "}
              {mainContent.sections.map((section, idx) => {
                if (section.type === "text") {
                  return (
                    <div key={idx} className="space-y-4">
                      {" "}
                      {section.title && (
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e] mb-6">
                          {" "}
                          {section.title}{" "}
                        </h2>
                      )}{" "}
                      {Array.isArray(section.content) ? (
                        section.content.map((para, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-slate-600 leading-relaxed"
                          >
                            {" "}
                            {para}{" "}
                          </p>
                        ))
                      ) : (
                        <p className="text-slate-600 text-base leading-relaxed ">
                          {section.content}
                        </p>
                      )}{" "}
                    </div>
                  );
                }
                if (section.type === "image-text") {
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                    >
                      {" "}
                      {section.image && (
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
                          {" "}
                          <Image
                            src={section.image}
                            alt={section.title || "Section Image"}
                            fill
                            className="object-cover"
                          />{" "}
                        </div>
                      )}{" "}
                      <div className="space-y-4">
                        {" "}
                        {section.title && (
                          <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                            {" "}
                            {section.title}{" "}
                          </h3>
                        )}{" "}
                        {Array.isArray(section.content) ? (
                          section.content.map((para, pIdx) => (
                            <p
                              key={pIdx}
                              className="text-slate-600 leading-relaxed"
                            >
                              {" "}
                              {para}{" "}
                            </p>
                          ))
                        ) : (
                          <p className="text-slate-600 text-base leading-relaxed ">
                            {section.content}
                          </p>
                        )}{" "}
                      </div>{" "}
                    </div>
                  );
                }
                if (section.type === "quote") {
                  return (
                    <div
                      key={idx}
                      className="bg-[#faf8fd] rounded-r-2xl border-l-4 border-purple-600 p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center gap-6"
                    >
                      {" "}
                      <Quote
                        className="w-16 h-16 text-purple-300 flex-shrink-0 rotate-180"
                        fill="currentColor"
                      />{" "}
                      <p className="text-xl md:text-2xl font-serif font-bold text-purple-900 leading-snug italic">
                        {" "}
                        {section.content}{" "}
                      </p>{" "}
                    </div>
                  );
                }
                return null;
              })}{" "}
            </div>{" "}
            {/* Tags Section */}{" "}
            <div className="pt-8 border-t border-slate-100 flex flex-wrap items-center gap-4">
              {" "}
              <span className="font-bold text-slate-900">Tags:</span>{" "}
              {mainContent.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-full border border-purple-100 bg-white text-purple-700 text-sm font-medium shadow-sm hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  {" "}
                  {tag}{" "}
                </span>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          {/* Sidebar (Right Column) */}{" "}
          <div className="lg:col-span-1">
            {" "}
            <div className="sticky top-24">
              {" "}
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                {" "}
                {sidebar.title}{" "}
              </h3>{" "}
              <div className="w-12 h-[3px] bg-purple-500 rounded-full mb-8"></div>{" "}
              <div className="space-y-6">
                {" "}
                {sidebar.posts.map((post, idx) => (
                  <Link
                    key={idx}
                    href={post.link}
                    className="flex items-center gap-4 group"
                  >
                    {" "}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-slate-100">
                      {" "}
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />{" "}
                    </div>{" "}
                    <div className="flex flex-col">
                      {" "}
                      <h4 className="text-[15px] font-bold text-slate-800 leading-snug mb-2 group-hover:text-purple-700 transition-colors line-clamp-2">
                        {" "}
                        {post.title}{" "}
                      </h4>{" "}
                      <span className="text-xs text-slate-500 font-medium">
                        {" "}
                        {post.date}{" "}
                      </span>{" "}
                    </div>{" "}
                  </Link>
                ))}{" "}
              </div>{" "}
              {/* Search Widget */}{" "}
              {sidebar.search && (
                <div className="mt-12">
                  {" "}
                  <div className="relative">
                    {" "}
                    <input
                      type="text"
                      placeholder={sidebar.search.placeholder}
                      className="w-full pl-5 pr-12 py-4 bg-[#faf8fd] border border-purple-100 rounded-2xl focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-colors text-slate-700"
                    />{" "}
                    <button className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 -700 text-white flex items-center justify-center hover:-800 transition-colors">
                      {" "}
                      <Search className="w-5 h-5" />{" "}
                    </button>{" "}
                  </div>{" "}
                </div>
              )}{" "}
              {/* Categories Widget */}{" "}
              {sidebar.categories && (
                <div className="mt-12">
                  {" "}
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                    {" "}
                    {sidebar.categories.title}{" "}
                  </h3>{" "}
                  <div className="w-12 h-[3px] bg-purple-500 rounded-full mb-8"></div>{" "}
                  <ul className="space-y-3">
                    {" "}
                    {sidebar.categories.items.map((cat, idx) => (
                      <li key={idx}>
                        {" "}
                        <Link
                          href={cat.link}
                          className="flex items-center justify-between group py-2 border-b border-slate-100 last:border-0"
                        >
                          {" "}
                          <div className="flex items-center text-slate-600 group-hover:text-purple-700 transition-colors">
                            {" "}
                            <ChevronRight className="w-4 h-4 mr-2 text-purple-300 group-hover:text-purple-600 transition-colors" />{" "}
                            <span className="font-medium">{cat.name}</span>{" "}
                          </div>{" "}
                          <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full group-hover:bg-purple-700 group-hover:text-white transition-colors">
                            {" "}
                            {cat.count}{" "}
                          </span>{" "}
                        </Link>{" "}
                      </li>
                    ))}{" "}
                  </ul>{" "}
                </div>
              )}{" "}
              {/* Tags Widget */}{" "}
              {sidebar.sidebarTags && (
                <div className="mt-12">
                  {" "}
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                    {" "}
                    {sidebar.sidebarTags.title}{" "}
                  </h3>{" "}
                  <div className="w-12 h-[3px] bg-purple-500 rounded-full mb-8"></div>{" "}
                  <div className="flex flex-wrap gap-2">
                    {" "}
                    {sidebar.sidebarTags.items.map((tag, idx) => (
                      <Link
                        key={idx}
                        href="#"
                        className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 text-slate-600 border border-purple-50 hover:-700 hover:text-white hover:border-purple-700 transition-all"
                      >
                        {" "}
                        {tag}{" "}
                      </Link>
                    ))}{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
