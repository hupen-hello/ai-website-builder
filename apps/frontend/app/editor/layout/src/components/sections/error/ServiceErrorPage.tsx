"use client";

import React from "react";
import type { SectionProps } from "../../../types/section";
import { ApplianceLink } from "../../../lib/applianceLink";
import { FaArrowLeft } from "react-icons/fa";

export default function ServiceErrorPage({ data = {} }: SectionProps) {
  const title = String(data.title || "Oops! Page Not Found");
  const description = String(
    data.description ||
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
  );
  return (
    <section className="w-full flex-grow py-20 md:py-32 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl md:text-9xl font-extrabold text-[var(--color-primary)] mb-4 drop-shadow-sm">
        404
      </h1>
      <h2 className="text-2xl md:text-4xl font-bold text-[var(--color-primary)] mb-6">
        {title}
      </h2>
      <p className="text-gray-500 mb-10 max-w-lg text-sm md:text-base leading-relaxed">
        {description}
      </p>
      <ApplianceLink
        href="/"
        className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-white font-bold py-4 px-8 rounded-xl transition-colors text-sm shadow-md"
      >
        <FaArrowLeft />
        Back to Home
      </ApplianceLink>
    </section>
  );
}
