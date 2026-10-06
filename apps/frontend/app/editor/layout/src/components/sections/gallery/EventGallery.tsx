"use client";
import React, { useState } from "react";
import type { SectionProps } from "../../../types/section";
import {
  ImageIcon,
  LayoutGrid,
  Heart,
  Briefcase,
  Users,
  Award,
  Presentation,
  RefreshCcw,
} from "lucide-react";
import { mergeEventData, eventVariant, mediaUrl } from "../about/eventPageDefaults";
import { handleManagerCardClick } from "../../../lib/editorManagerCards";

type GalleryImage = {
  src: string;
  category: string;
  id?: string;
  title?: string;
};

function normalizeImages(images: unknown): GalleryImage[] {
  const list = Array.isArray(images)
    ? images
    : images && typeof images === "object"
      ? Object.values(images as Record<string, unknown>)
      : [];
  return list
    .map((img) => {
      if (typeof img === "string") {
        return { src: img, category: "All Events" };
      }
      if (img && typeof img === "object") {
        const row = img as Record<string, unknown>;
        const src = mediaUrl(row);
        if (!src) return null;
        return {
          src,
          category: String(row.category || "All Events"),
          id: typeof row.id === "string" ? row.id : undefined,
          title:
            typeof row.title === "string" && row.title.trim()
              ? row.title
              : typeof row.alt === "string"
                ? row.alt
                : "",
        };
      }
      return null;
    })
    .filter((img): img is GalleryImage => Boolean(img));
}

export interface ImageGallery1Props {
  data: {
    subtitle: string;
    titlePart1: string;
    titleHighlight: string;
    titlePart2: string;
    titleHighlight2: string;
    description: string;
    tabs: string[];
    images: { src: string; category: string }[];
  };
}
const getTabIcon = (tab: string) => {
  switch (tab) {
    case "All Events":
      return <LayoutGrid className="w-4 h-4 mr-2" />;
    case "Weddings":
      return <Heart className="w-4 h-4 mr-2" />;
    case "Corporate Events":
      return <Briefcase className="w-4 h-4 mr-2" />;
    case "Conferences":
      return <Users className="w-4 h-4 mr-2" />;
    case "Social Events":
      return <Users className="w-4 h-4 mr-2" />;
    case "Award Ceremonies":
      return <Award className="w-4 h-4 mr-2" />;
    case "Exhibitions":
      return <Presentation className="w-4 h-4 mr-2" />;
    default:
      return null;
  }
};
export default function ImageGallery1({
  data,
  editorMode,
}: ImageGallery1Props & { editorMode?: boolean }) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "gallery",
    "ImageGallery",
    "ImageGallery1",
  ) as ImageGallery1Props["data"];
  const tabs = Array.isArray(data.tabs) ? data.tabs : [];
  let images = normalizeImages(data.images);
  if (!images.length) {
    images = normalizeImages(
      eventVariant("ImageGallery", "ImageGallery1").images,
    );
  }
  const [activeTab, setActiveTab] = useState(tabs[0] || "All Events");
  const filteredImages = images.filter(
    (img) => activeTab === "All Events" || img.category === activeTab,
  );
  return (
    <section className="py-12 bg-white">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        {/* Header */}{" "}
        <div className="text-center max-w-3xl mx-auto mb-12">
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
            <span className="font-['Playfair_Display'] italic text-purple-700">
              {data.titleHighlight2}
            </span>{" "}
          </h2>{" "}
          <div className="flex items-center justify-center mb-6">
            {" "}
            <div className="h-[1px] w-12 bg-purple-200"></div>{" "}
            <div className="w-2 h-2 rotate-45 border border-purple-300 mx-2"></div>{" "}
            <div className="h-[1px] w-12 bg-purple-200"></div>{" "}
          </div>{" "}
          <p className="text-slate-600 text-base leading-relaxed ">
            {" "}
            {data.description}{" "}
          </p>{" "}
        </div>{" "}
        {/* Tabs */}{" "}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {" "}
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center px-6 py-3 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "bg-purple-700 text-white shadow-lg shadow-purple-200" : "bg-white text-slate-600 border border-slate-200 hover:border-purple-300 hover:text-purple-700"}`}
            >
              {" "}
              {getTabIcon(tab)} {tab}{" "}
            </button>
          ))}{" "}
        </div>{" "}
        {/* Grid */}{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {" "}
          {filteredImages.map((img, idx) => (
            <div
              key={idx}
              data-editor-no-inline="true"
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer"
            >
              <button
                type="button"
                aria-label={img.title || img.category}
                className="absolute inset-0 z-20 cursor-pointer"
                onClick={(event) =>
                  handleManagerCardClick(event, editorMode, "Gallery", {
                    id: img.id,
                    title: img.title || img.category,
                    image: img.src,
                  })
                }
              >
                <span className="absolute inset-0" aria-hidden="true" />
              </button>
              {" "}
              <img
                src={img.src}
                alt={img.category}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />{" "}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                {" "}
                <span className="text-white font-medium px-4 py-2 border border-white/50 rounded-full backdrop-blur-sm">
                  {" "}
                  {img.category}{" "}
                </span>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
        {/* Load More */}{" "}
        <div className="text-center">
          {" "}
          <button className="inline-flex items-center px-8 py-3 rounded-full border border-purple-200 text-purple-700 font-medium hover:bg-purple-50 transition-colors">
            {" "}
            Load More Photos <RefreshCcw className="w-4 h-4 ml-2" />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
