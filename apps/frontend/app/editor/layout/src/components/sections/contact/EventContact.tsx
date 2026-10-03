"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Image from "next/image";
import { Phone, Mail, MapPin, User, Edit3, ArrowRight } from "lucide-react";
export interface ContactFormEvent1Props {
  data: {
    infoCard: {
      image: string;
      titlePart1: string;
      titleHighlight: string;
      titlePart2: string;
      contacts: { type: string; title: string; value: string }[];
    };
    formConfig: {
      subtitle: string;
      titlePart1: string;
      titleHighlight: string;
      description: string;
      fields: {
        name: string;
        placeholder: string;
        type: string;
        icon: string;
      }[];
      textarea: { name: string; placeholder: string; icon: string };
      submitText: string;
    };
  };
}
export default function ContactFormEvent1({ data }: ContactFormEvent1Props) {
  const { infoCard, formConfig } = data;
  const renderInfoIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="w-5 h-5 text-white" />;
      case "email":
        return <Mail className="w-5 h-5 text-white" />;
      case "location":
        return <MapPin className="w-5 h-5 text-white" />;
      default:
        return <MapPin className="w-5 h-5 text-white" />;
    }
  };
  const renderFormIcon = (icon: string) => {
    switch (icon) {
      case "user":
        return <User className="w-5 h-5 text-slate-400" />;
      case "phone":
        return <Phone className="w-5 h-5 text-slate-400" />;
      case "mail":
        return <Mail className="w-5 h-5 text-slate-400" />;
      case "edit":
        return <Edit3 className="w-5 h-5 text-slate-400" />;
      default:
        return null;
    }
  };
  return (
    <section className="py-12 bg-white">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="flex flex-col md:flex-row shadow-2xl rounded-[40px] overflow-hidden bg-white">
          {" "}
          {/* Left Info Card */}{" "}
          <div className="w-full md:w-[45%] bg-[#120a2a] text-white flex flex-col">
            {" "}
            <div className="relative w-full aspect-[4/3] md:aspect-auto flex-1 min-h-[300px]">
              {" "}
              <Image
                src={infoCard.image}
                alt="Contact Team"
                fill
                className="object-cover rounded-t-[40px] md:rounded-tr-none md:rounded-tl-[40px]"
              />{" "}
              <div className="absolute inset-0 bg-gradient-to-t from-[#120a2a] via-[#120a2a]/60 to-transparent"></div>{" "}
            </div>{" "}
            <div className="p-10 lg:p-14 relative z-10 bg-[#120a2a]">
              {" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  leading-tight mb-10">
                {" "}
                {infoCard.titlePart1}{" "}
                <span className="font-['Playfair_Display'] italic text-purple-400 font-normal">
                  {infoCard.titleHighlight}
                </span>{" "}
                {infoCard.titlePart2}{" "}
              </h2>{" "}
              <div className="space-y-8">
                {" "}
                {infoCard.contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-start gap-5">
                    {" "}
                    <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0 mt-1">
                      {" "}
                      {renderInfoIcon(contact.type)}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="text-lg font-bold mb-1">
                        {contact.title}
                      </h4>{" "}
                      <p className="text-slate-600 text-base leading-relaxed ">
                        {" "}
                        {contact.value}{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Right Form Card */}{" "}
          <div className="w-full md:w-[55%] p-10 lg:p-16 flex flex-col justify-center">
            {" "}
            {/* Header */}{" "}
            <div className="mb-10">
              {" "}
              <div className="flex items-center space-x-3 mb-4">
                {" "}
                <div className="w-1.5 h-1.5 rounded-full bg-purple-700"></div>{" "}
                <span className="text-purple-700 font-bold uppercase tracking-widest text-sm">
                  {" "}
                  {formConfig.subtitle}{" "}
                </span>{" "}
              </div>{" "}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0b2e]  leading-tight mb-4">
                {" "}
                {formConfig.titlePart1}{" "}
                <span className="font-['Playfair_Display'] italic text-purple-700 block mt-2">
                  {formConfig.titleHighlight}
                </span>{" "}
              </h2>{" "}
              <div className="flex items-center gap-1 mb-6">
                {" "}
                <div className="w-2 h-2 rotate-45 bg-purple-700"></div>{" "}
                <div className="w-1.5 h-1.5 rotate-45 bg-purple-400"></div>{" "}
              </div>{" "}
              <p className="text-slate-600 text-base leading-relaxed max-w-lg">
                {" "}
                {formConfig.description}{" "}
              </p>{" "}
            </div>{" "}
            {/* Form */}{" "}
            <form className="space-y-6">
              {" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {" "}
                {formConfig.fields.map((field, idx) => (
                  <div key={idx} className="relative">
                    {" "}
                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                      {" "}
                      {renderFormIcon(field.icon)}{" "}
                    </div>{" "}
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-slate-700 placeholder:text-slate-400"
                    />{" "}
                  </div>
                ))}{" "}
              </div>{" "}
              <div className="relative">
                {" "}
                <div className="absolute left-5 top-5">
                  {" "}
                  {renderFormIcon(formConfig.textarea.icon)}{" "}
                </div>{" "}
                <textarea
                  placeholder={formConfig.textarea.placeholder}
                  rows={5}
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-slate-700 placeholder:text-slate-400 resize-none"
                ></textarea>{" "}
              </div>{" "}
              <button
                type="button"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full transition-colors duration-300 inline-flex items-center justify-center -800 text-white hover:-900 transition-colors group w-full w-auto"
              >
                {" "}
                {formConfig.submitText}{" "}
                <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />{" "}
              </button>{" "}
            </form>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
