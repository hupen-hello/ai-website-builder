"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { contactPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { ContactMap4Data } from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const DEFAULT_MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d105677.34842186847!2d-118.4907106!3d34.0658428!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bc04d6d147ab%3A0xd6c7c379fd081ed1!2sBeverly%20Hills%2C%20CA!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus";

export default function RealEstateContactMap4({ data = {} }: SectionProps) {
  const authored = contactPage4Content.RealEstateContactMap4;
  const content: ContactMap4Data = {
    ...authored,
    ...(data as ContactMap4Data),
  };

  return (
    <section
      className="bg-gray-50 pb-16"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="contactMap"
      data-editor-fields="accentColor mapEmbed overlayTitle overlayDescription directionsLabel directionsLink"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="relative h-[400px] overflow-hidden rounded-xl border border-gray-200">
          <iframe
            src={content.mapEmbed ?? DEFAULT_MAP_EMBED}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={content.overlayTitle ?? "Office location map"}
            className="absolute inset-0 contrast-125 opacity-60 mix-blend-multiply grayscale"
            data-editor-field="mapEmbed"
          />

          <div className="pointer-events-none absolute inset-0 bg-[var(--accent)]/5 mix-blend-color" />

          <div className="absolute top-1/2 right-8 z-10 hidden w-full max-w-sm -translate-y-1/2 rounded-xl bg-white p-8 shadow-lg md:block md:right-16">
            <h3
              className="mb-3 text-xl font-bold text-secondary"
              data-editor-field="overlayTitle"
            >
              {content.overlayTitle ?? "Visit Our Office"}
            </h3>
            <p
              className="mb-6 text-[14px] leading-relaxed text-gray-500"
              data-editor-field="overlayDescription"
            >
              {content.overlayDescription ??
                "We'd love to meet you in person. Feel free to visit our office."}
            </p>
            <Link
              href={content.directionsLink ?? "#"}
              className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
            >
              <span data-editor-field="directionsLabel">Get Directions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
