"use client";

import React from "react";
import Link from "next/link";
import PropertyCard from "./PropertyCard";
import type { SectionProps } from "../../../types/section";

export default function PropertyGrid1({ data = {} }: SectionProps) {
  const properties = (data.properties as any[]) || [];
  const hideTitle = data.hideTitle || false;
  const hideButton = data.hideButton || false;
  const limit = data.limit as number | undefined;
  
  const displayProperties = limit ? properties.slice(0, limit) : properties;

  return (
    <section className={`pb-8 md:pb-12 bg-white ${hideTitle ? 'pt-12 md:pt-16' : 'pt-0 md:pt-0'}`} data-editor-section-label="propertyGrid" data-editor-fields="hideTitle hideButton properties">
      <div className="container mx-auto px-4">
        {!hideTitle && (
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold uppercase tracking-widest text-secondary mb-4">Top Listings</h2>
            <div className="w-16 h-1 bg-[#0a8296] mx-auto rounded-full" />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayProperties.map((property: any) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        
        {!hideButton && (
          <div className="flex justify-center">
            <Link href="/template4/properties">
              <button className="border-2 border-[#0a8296] text-[#0a8296] hover:bg-[#0a8296] hover:text-white px-10 h-12 tracking-wider font-semibold uppercase rounded transition-colors">
                Show All Listings
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
