"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Link from "next/link";
import {
  Briefcase,
  Megaphone,
  PenTool,
  Settings,
  TrendingUp,
  Award,
  Star,
  Heart,
  Shield,
  Users,
  Mail,
  MapPin,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
export interface CareerEvent1Props {
  data: {
    mainContent: {
      title: string;
      description: string;
      filters: { label: string; options: string[] }[];
      jobs: {
        title: string;
        type: string;
        department: string;
        location: string;
        experience: string;
        description: string;
        icon: string;
      }[];
    };
    sidebar: {
      whyWorkWithUs: {
        title: string;
        items: { title: string; description: string; icon: string }[];
      };
      coreValues: {
        title: string;
        items: { title: string; description: string; icon: string }[];
      };
      contact: { title: string; email: string; icon: string };
    };
  };
}
const getIcon = (iconName: string, className: string = "w-5 h-5") => {
  switch (iconName) {
    case "briefcase":
      return <Briefcase className={className} />;
    case "megaphone":
      return <Megaphone className={className} />;
    case "pen-tool":
      return <PenTool className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "trending-up":
      return <TrendingUp className={className} />;
    case "award":
      return <Award className={className} />;
    case "star":
      return <Star className={className} />;
    case "heart":
      return <Heart className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "users":
      return <Users className={className} />;
    case "mail":
      return <Mail className={className} />;
    default:
      return <Briefcase className={className} />;
  }
};
export default function CareerEvent1({ data }: CareerEvent1Props) {
  const { mainContent, sidebar } = data;
  return (
    <section className="py-12 bg-slate-50">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {" "}
          {/* Main Content (Left Column) */}{" "}
          <div className="lg:col-span-2">
            {" "}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  mb-4">
              {" "}
              {mainContent.title}{" "}
            </h2>{" "}
            <p className="text-slate-600 text-base leading-relaxed mb-10">
              {" "}
              {mainContent.description}{" "}
            </p>{" "}
            {/* Job Listings */}{" "}
            <div className="space-y-6">
              {" "}
              {mainContent.jobs.map((job, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-200 transition-all group"
                >
                  {" "}
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    {" "}
                    {/* Icon */}{" "}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition-colors duration-300">
                      {" "}
                      {getIcon(job.icon, "w-8 h-8")}{" "}
                    </div>{" "}
                    {/* Content */}{" "}
                    <div className="flex-grow">
                      {" "}
                      <div className="flex flex-col md:flex-row items-center justify-between mb-2">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <h3 className="text-xl font-bold text-slate-900">
                            {job.title}
                          </h3>{" "}
                          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                            {" "}
                            {job.type}{" "}
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                      <p className="text-slate-600 text-base leading-relaxed mb-4">
                        {job.department}
                      </p>{" "}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium mb-4">
                        {" "}
                        <div className="flex items-center">
                          {" "}
                          <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />{" "}
                          {job.location}{" "}
                        </div>{" "}
                        <div className="text-slate-300">•</div>{" "}
                        <div className="flex items-center">
                          {" "}
                          <Briefcase className="w-4 h-4 mr-1.5 text-slate-400" />{" "}
                          {job.experience}{" "}
                        </div>{" "}
                      </div>{" "}
                      <p className="text-slate-600 text-base leading-relaxed mb-6 line-clamp-2 md:line-clamp-none">
                        {" "}
                        {job.description}{" "}
                      </p>{" "}
                    </div>{" "}
                    {/* Action Button */}{" "}
                    <div className="flex-shrink-0 self-center w-full md:w-auto">
                      {" "}
                      <Link href="/career-detail" className="block text-center md:inline-block w-full md:w-auto px-6 py-2.5 border-2 border-purple-200 text-purple-700 font-semibold rounded-full hover:bg-purple-50 transition-colors">
                        {" "}
                        View Details{" "}
                      </Link>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          {/* Sidebar (Right Column) */}{" "}
          <div className="lg:col-span-1 space-y-8 sticky top-24 self-start">
            {" "}
            {/* Why Work With Us */}{" "}
            <div className="bg-[#2a1b4d] rounded-2xl p-8 text-white shadow-lg">
              {" "}
              <h3 className="text-xl font-bold mb-8">
                {sidebar.whyWorkWithUs.title}
              </h3>{" "}
              <div className="space-y-6">
                {" "}
                {sidebar.whyWorkWithUs.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    {" "}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      {" "}
                      {getIcon(item.icon, "w-5 h-5 text-purple-200")}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-bold text-white mb-1 text-sm">
                        {item.title}
                      </h4>{" "}
                      <p className="text-slate-600 text-base leading-relaxed text-white/70">
                        {item.description}
                      </p>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {/* Our Core Values */}{" "}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              {" "}
              <h3 className="text-xl font-bold text-slate-900 mb-8">
                {sidebar.coreValues.title}
              </h3>{" "}
              <div className="space-y-6">
                {" "}
                {sidebar.coreValues.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    {" "}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                      {" "}
                      {getIcon(item.icon, "w-5 h-5 text-purple-700")}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-bold text-slate-900 mb-1 text-sm">
                        {item.title}
                      </h4>{" "}
                      <p className="text-slate-600 text-base leading-relaxed ">
                        {item.description}
                      </p>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {/* Contact */}{" "}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex items-start gap-4 shadow-sm">
              {" "}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-700 shadow-sm">
                {" "}
                {getIcon(sidebar.contact.icon, "w-5 h-5")}{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  {sidebar.contact.title}
                </h4>{" "}
                <a
                  href={`mailto:${sidebar.contact.email}`}
                  className="text-purple-700 font-semibold text-sm hover:underline"
                >
                  {" "}
                  {sidebar.contact.email}{" "}
                </a>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
