"use client";
// Force hot reload
import React from "react";
import type { SectionProps } from "../../../types/section";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronRight,
} from "lucide-react";
interface FooterData {
  about: { description: string };
  contact: { address: string; phone: string; email: string; website: string };
  quickLinks: { label: string; href: string }[];
  servicesLinks: { label: string; href: string }[];
  usefulLinks: { label: string; href: string }[];
  newsletter: { title: string; description: string; placeholder: string };
  social: {
    facebook: string;
    twitter?: string;
    instagram: string;
    linkedin: string;
    youtube?: string;
  };
  copyright: string;
  bottomTagline?: string;
  designer?: string;
}
const Divider = () => (
  <div className="flex items-center w-full max-w-[140px] mb-6 mt-1">
    {" "}
    <div className="h-[1px] bg-white/20 flex-grow"></div>{" "}
    <div className="w-1.5 h-1.5 rotate-45 bg-[#9d5baf] mx-1.5"></div>{" "}
    <div className="h-[1px] bg-white/20 flex-grow"></div>{" "}
  </div>
);
const LineDivider = () => (
  <div className="h-[1px] w-full max-w-[140px] bg-white/20 mb-6 mt-1"></div>
);
export default function FooterEvent1({
  data,
  logoData,
}: {
  data?: Partial<FooterData>;
  logoData?: any;
}) {
  const about = data?.about || { description: "" };
  const contact = data?.contact || { address: "", phone: "", email: "", website: "" };
  const quickLinks = Array.isArray(data?.quickLinks) ? data.quickLinks : [];
  const servicesLinks = Array.isArray(data?.servicesLinks) ? data.servicesLinks : [];
  const usefulLinks = Array.isArray(data?.usefulLinks) ? data.usefulLinks : [];
  const newsletter = data?.newsletter || { title: "", description: "", placeholder: "" };
  const social = data?.social || { facebook: "#", instagram: "#", linkedin: "#" };
  const logoSrc = String(logoData?.logoImage || "/logo/logo-event.png");
  return (
    <footer className="bg-[#0b0410] text-white/70 font-sans relative overflow-hidden">
      {" "}
      {/* Background illustration (faint tent in the bottom right corner) */}{" "}
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[400px] opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to top, black, transparent)",
        }}
      >
        {" "}
      </div>{" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  pt-20 pb-6 relative z-10">
        {" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {" "}
          {/* About & Contact */}{" "}
          <div className="lg:col-span-3">
            {" "}
            <div className="flex items-start gap-4 mb-8">
              {" "}
              {/* Logo Approximation */}{" "}
              <Link href="/" className="flex items-center gap-4">
                {" "}
                <img
                  src={logoSrc}
                  alt="Event Logo"
                  className="h-16 w-auto object-contain brightness-0 invert opacity-90"
                  data-editor-media="logo"
                  data-editor-media-type="image"
                  data-editor-media-src={logoSrc}
                />{" "}
              </Link>{" "}
            </div>{" "}
            <p className="mb-8 leading-relaxed text-[13px] whitespace-pre-line text-white/80">
              {" "}
              {about.description}{" "}
            </p>{" "}
            <div className="h-[1px] w-[40px] bg-white/20 mb-8"></div>{" "}
            <div className="space-y-5 text-[13px]">
              {" "}
              <div className="flex gap-4">
                {" "}
                <div className="w-9 h-9 rounded-full border border-purple-900/50 flex items-center justify-center shrink-0 group hover:border-purple-500 transition-colors">
                  {" "}
                  <MapPin size={14} className="text-purple-400" />{" "}
                </div>{" "}
                <span className="leading-relaxed whitespace-pre-line text-white/80 pt-0.5">
                  {contact.address}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center gap-4">
                {" "}
                <div className="w-9 h-9 rounded-full border border-purple-900/50 flex items-center justify-center shrink-0 group hover:border-purple-500 transition-colors">
                  {" "}
                  <Phone size={14} className="text-purple-400" />{" "}
                </div>{" "}
                <a
                  href={`tel:${(contact.phone || "").replace(/[^0-9+]/g, "")}`}
                  className="hover:text-purple-300 transition-colors text-white/80 pt-0.5"
                >
                  {" "}
                  {contact.phone}{" "}
                </a>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Quick Links */}{" "}
          <div className="lg:col-span-2 ml-6 mt-4 lg:mt-0">
            {" "}
            <h4 className="text-white font-semibold tracking-[0.05em] text-[13px] mb-2 uppercase">
              {" "}
              Quick Links{" "}
            </h4>{" "}
            <Divider />{" "}
            <ul className="space-y-4">
              {" "}
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  {" "}
                  <Link
                    href={link.href}
                    className="text-[13px] text-white/80 hover:text-white transition-colors flex items-center gap-3 group"
                  >
                    {" "}
                    <ChevronRight
                      size={12}
                      className="text-[#9d5baf] group-hover:text-purple-400"
                    />{" "}
                    {link.label}{" "}
                  </Link>{" "}
                </li>
              ))}{" "}
            </ul>{" "}
          </div>{" "}
          {/* Our Services */}{" "}
          <div className="lg:col-span-2 mt-4 lg:mt-0">
            {" "}
            <h4 className="text-white font-semibold tracking-[0.05em] text-[13px] mb-2 uppercase">
              {" "}
              Our Services{" "}
            </h4>{" "}
            <Divider />{" "}
            <ul className="space-y-4">
              {" "}
              {servicesLinks.map((link, idx) => (
                <li key={idx}>
                  {" "}
                  <Link
                    href={link.href}
                    className="text-[13px] text-white/80 hover:text-white transition-colors flex items-center gap-3 group"
                  >
                    {" "}
                    <ChevronRight
                      size={12}
                      className="text-[#9d5baf] group-hover:text-purple-400"
                    />{" "}
                    {link.label}{" "}
                  </Link>{" "}
                </li>
              ))}{" "}
            </ul>{" "}
          </div>{" "}
          {/* Useful Links */}{" "}
          <div className="lg:col-span-2 mt-4 lg:mt-0">
            {" "}
            <h4 className="text-white font-semibold tracking-[0.05em] text-[13px] mb-2 uppercase">
              {" "}
              Useful Links{" "}
            </h4>{" "}
            <Divider />{" "}
            <ul className="space-y-4">
              {" "}
              {usefulLinks.map((link, idx) => (
                <li key={idx}>
                  {" "}
                  <Link
                    href={link.href}
                    className="text-[13px] text-white/80 hover:text-white transition-colors flex items-center gap-3 group"
                  >
                    {" "}
                    <ChevronRight
                      size={12}
                      className="text-[#9d5baf] group-hover:text-purple-400"
                    />{" "}
                    {link.label}{" "}
                  </Link>{" "}
                </li>
              ))}{" "}
            </ul>{" "}
          </div>{" "}
          {/* Stay Connected & Follow Us */}{" "}
          <div className="lg:col-span-3 mt-4 lg:mt-0">
            {" "}
            <h4 className="text-white font-semibold tracking-[0.05em] text-[13px] mb-2 uppercase">
              {" "}
              {newsletter.title}{" "}
            </h4>{" "}
            <LineDivider />{" "}
            <p className="text-[12px] mb-6 text-white/80 leading-relaxed pr-4">
              {" "}
              {newsletter.description}{" "}
            </p>{" "}
            <form
              className="flex rounded-md overflow-hidden mb-12 h-10 border border-white/20"
              onSubmit={(e) => e.preventDefault()}
            >
              {" "}
              <input
                type="email"
                placeholder={newsletter.placeholder}
                className="bg-transparent border-r-0 text-white text-[13px] px-4 flex-grow outline-none w-full placeholder:text-white/40 focus:border-[#9d5baf]/50 transition-colors"
              />{" "}
              <button
                type="submit"
                className="bg-[#9d5baf] hover:bg-[#8e529e] px-4 flex items-center justify-center transition-colors"
              >
                {" "}
                <ArrowRight size={16} className="text-white" />{" "}
              </button>{" "}
            </form>{" "}
            <LineDivider />{" "}
            <h4 className="text-white font-semibold tracking-[0.05em] text-[13px] mb-6 uppercase">
              {" "}
              Follow Us{" "}
            </h4>{" "}
            <div className="flex items-center gap-3">
              {" "}
              <Link
                href={social.facebook}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-[#9d5baf] hover:border-[#9d5baf] hover:text-white transition-colors"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>{" "}
              </Link>{" "}
              <Link
                href={social.instagram}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-[#9d5baf] hover:border-[#9d5baf] hover:text-white transition-colors"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>{" "}
              </Link>{" "}
              <Link
                href={social.linkedin}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-[#9d5baf] hover:border-[#9d5baf] hover:text-white transition-colors"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>{" "}
              </Link>{" "}
              {social.youtube && (
                <Link
                  href={social.youtube}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-[#9d5baf] hover:border-[#9d5baf] hover:text-white transition-colors"
                >
                  {" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>{" "}
                </Link>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Copyright Bar */}{" "}
      <div className="border-t border-white/10 bg-[#0d0714] relative z-10">
        {" "}
        <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]  py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {" "}
          <p className="text-[12px] text-white/60 tracking-wide">
            {" "}
            {data?.copyright}{" "}
          </p>{" "}
          {data?.bottomTagline && (
            <div className="flex items-center gap-4 hidden lg:flex">
              {" "}
              <div className="w-1.5 h-1.5 rotate-45 bg-[#9d5baf]"></div>{" "}
              <span className="font-serif italic text-white/70 text-[15px] tracking-wide">
                {" "}
                We Plan. We Design.{" "}
                <span className="text-[#9d5baf]">We Celebrate.</span>{" "}
              </span>{" "}
              <div className="w-1.5 h-1.5 rotate-45 bg-[#9d5baf]"></div>{" "}
            </div>
          )}{" "}
          <div className="flex items-center gap-1.5 text-[12px] text-white/60 tracking-wide">
            {" "}
            Designed with{" "}
            <Heart
              size={12}
              className="text-[#9d5baf] fill-[#9d5baf]"
            /> by{" "}
            <span className="text-white/80 font-medium">
              {data?.designer || "EVENTS STUDIO"}
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </footer>
  );
}
