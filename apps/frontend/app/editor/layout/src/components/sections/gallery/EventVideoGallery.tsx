"use client";
import React, { useState } from "react";
import type { SectionProps } from "../../../types/section";
import {
  Video,
  LayoutGrid,
  Heart,
  Briefcase,
  Users,
  Award,
  Presentation,
  Play,
  MoreVertical,
} from "lucide-react";
import { mergeEventData } from "../about/eventPageDefaults";
export interface VideoGallery1Props {
  data: {
    subtitle: string;
    titlePart1: string;
    titleHighlight: string;
    description: string;
    tabs: string[];
    videos: {
      thumbnail: string;
      title: string;
      duration: string;
      category: string;
    }[];
  };
}
const getTabIcon = (tab: string) => {
  switch (tab) {
    case "All Videos":
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
export default function VideoGallery1({ data }: VideoGallery1Props) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "videos",
    "VideoGallery",
    "VideoGallery1",
  ) as VideoGallery1Props["data"];
  const tabs = data.tabs || [];
  const videos = data.videos || [];
  const [activeTab, setActiveTab] = useState(tabs[0] || "All Videos");
  const filteredVideos = videos.filter(
    (vid) => activeTab === "All Videos" || vid.category === activeTab,
  );
  return (
    <section className="py-12 bg-slate-50">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {" "}
          {filteredVideos.map((vid, idx) => (
            <div
              key={idx}
              className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer"
            >
              {" "}
              <img
                src={vid.thumbnail}
                alt={vid.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300"></div>{" "}
              {/* Play Button */}{" "}
              <div className="absolute inset-0 flex items-center justify-center">
                {" "}
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                  {" "}
                  <Play className="w-6 h-6 text-purple-700 ml-1" />{" "}
                </div>{" "}
              </div>{" "}
              {/* Bottom Info */}{" "}
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent">
                {" "}
                <div>
                  {" "}
                  <h4 className="text-white font-medium mb-1">
                    {vid.title}
                  </h4>{" "}
                </div>{" "}
                <div className="flex items-center space-x-3">
                  {" "}
                  <span className="text-white/90 text-sm font-medium bg-black/40 px-2 py-1 rounded">
                    {" "}
                    {vid.duration}{" "}
                  </span>{" "}
                  <button className="text-white hover:text-purple-300 transition-colors">
                    {" "}
                    <MoreVertical className="w-5 h-5" />{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
