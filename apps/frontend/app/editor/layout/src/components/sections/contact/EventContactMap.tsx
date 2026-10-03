"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { mergeEventData } from "../about/eventPageDefaults";
export interface ContactMapEvent1Props {
  data: {
    mapEmbedUrl: string;
    card: {
      title: string;
      address: string;
      linkText: string;
      linkHref: string;
    };
  };
}
export default function ContactMapEvent1({ data }: ContactMapEvent1Props) {
  data = mergeEventData(
    (data || {}) as Record<string, unknown>,
    "map",
    "ContactMap",
    "ContactMapEvent1",
  ) as ContactMapEvent1Props["data"];
  const { mapEmbedUrl, card } = data;
  return (
    <section className="pb-20 bg-white">
      {" "}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        {" "}
        <div className="relative w-full h-[400px] lg:h-[500px] rounded-[40px] overflow-hidden shadow-sm bg-slate-100">
          {" "}
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full grayscale-[20%] contrast-125 opacity-90"
          ></iframe>{" "}
          {/* Overlay Card */}{" "}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 lg:left-12 max-w-[320px] bg-white rounded-3xl p-8 shadow-2xl">
            {" "}
            <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-white mb-6 shadow-md">
              {" "}
              <MapPin className="w-5 h-5" />{" "}
            </div>{" "}
            <h3 className="text-2xl font-serif font-bold text-purple-900 mb-4">
              {" "}
              {card.title}{" "}
            </h3>{" "}
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              {" "}
              {card.address}{" "}
            </p>{" "}
            <Link
              href={card.linkHref}
              className="inline-flex items-center text-purple-700 font-bold hover:text-purple-800 transition-colors group"
            >
              {" "}
              {card.linkText}{" "}
              <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />{" "}
            </Link>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
