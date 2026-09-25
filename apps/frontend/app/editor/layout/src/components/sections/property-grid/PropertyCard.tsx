"use client";

import React from "react";
import Link from "next/link";
import { Bed, Bath, Square, MapPin } from "lucide-react";

export interface Property {
  id: string
  title: string
  address: string
  price: string
  beds: number
  baths: number
  sqft: number
  image: string
}

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <Link href={`/template4/properties/${property.id}`} className="block group h-full">
      <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl border border-gray-100 flex flex-col h-full">
        <div className="relative h-64 overflow-hidden shrink-0">
          <img 
            data-editor-media="image"
          data-editor-media-type="image"
          src={property.image} 
            alt={property.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          <div className="absolute bottom-4 left-4 bg-[#0a8296] text-white px-4 py-1.5 font-bold rounded-sm shadow-md">
            {property.price}
          </div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold uppercase text-secondary mb-2 group-hover:text-[#0a8296] transition-colors" data-editor-field="title">{property.title}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-6">
            <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate">{property.address}</span>
          </p>
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 text-sm font-semibold text-secondary">
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-[#0a8296]" /> {property.beds} Beds
            </div>
            <div className="flex items-center gap-2">
              <Bath className="w-5 h-5 text-[#0a8296]" /> {property.baths} Baths
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-5 h-5 text-[#0a8296]" /> {property.sqft} Sq Ft
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
