"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Bed, Bath, Square, Search, Tag, ChevronLeft, ChevronRight } from "lucide-react"
import { SectionProps } from "../../../types/section"

const ITEMS_PER_PAGE = 6
const propertyTypes = ["All", "Apartment", "Villa", "Builder Floor", "Studio"]

interface RealEstatePropertyCatalog1Props extends SectionProps {
  defaultCategory?: string
}

export default function RealEstatePropertyCatalog3({ 
  data = {}, defaultCategory = "All" }: RealEstatePropertyCatalog1Props) {
  const propertyListings = Array.isArray(data.propertyListings) ? data.propertyListings : (Array.isArray(data) ? data : [])

  const [typeFilter, setTypeFilter] = useState("All")
  const [catFilter, setCatFilter] = useState(defaultCategory)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")

  const filtered = propertyListings.filter((p: any) => {
    const matchType = typeFilter === "All" || p.propertyType === typeFilter
    const matchCat = catFilter === "All" || p.category === catFilter
    const title = String(p.title ?? "")
    const location = String(p.location ?? "")
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase())
    return matchType && matchCat && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const visible = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <section className="py-20 bg-white" data-editor-section-label="propertyCatalog" data-editor-fields="propertyListings">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Filters */}
        <div className="bg-[#f8f6f2] rounded-2xl p-5 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "For Sale", "For Rent"].map(cat => (
              <button key={cat} onClick={() => { setCatFilter(cat); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${catFilter === cat ? "bg-[#c9a96e] text-white" : "bg-white text-gray-600 hover:bg-[#c9a96e]/10"}`}>
                {cat}
              </button>
            ))}
            <span className="w-px h-6 bg-gray-200 self-center" />
            {propertyTypes.map(type => (
              <button key={type} onClick={() => { setTypeFilter(type); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${typeFilter === type ? "bg-[#1a2332] text-white" : "bg-white text-gray-600 hover:bg-[#1a2332]/10"}`}>
                {type}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm outline-none focus:border-[#c9a96e] w-44 bg-white transition-colors" />
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7" data-box-layout-grid="grid">
            {visible.map((p: any) => (
              <Link key={p.slug} href={`/realstate/template1/property/${p.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 block">
                <div className="relative h-56 overflow-hidden">
                  <img src={String(p.image ?? "")} alt={String(p.title ?? "")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    data-editor-media="image" data-editor-media-type="image" />
                  <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${p.category === "For Sale" ? "bg-[#1a2332]" : "bg-[#c9a96e]"} text-white`}>
                    <Tag className="w-3 h-3" /> <span data-editor-field="category">{String(p.category ?? "")}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#c9a96e]" /> <span data-editor-field="location">{String(p.location ?? "")}</span>
                    <span className="ml-auto text-[10px] bg-[#f8f6f2] px-2 py-0.5 rounded" data-editor-field="propertyType">{String(p.propertyType ?? "")}</span>
                  </div>
                  <h3 className="font-bold text-[#1a2332] text-lg mb-1 group-hover:text-[#c9a96e] transition-colors" data-editor-field="title">{String(p.title ?? "")}</h3>
                  <p className="text-gray-500 text-sm mb-4" data-editor-field="subtitle">{String(p.subtitle ?? "")}</p>
                  <div className="flex items-center gap-5 text-xs text-gray-500 py-4 border-t border-gray-100 mb-4">
                    <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-[#c9a96e]" /> <span data-editor-field="beds">{String(p.beds ?? "")}</span> Beds</span>
                    <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-[#c9a96e]" /> <span data-editor-field="baths">{String(p.baths ?? "")}</span> Baths</span>
                    <span className="flex items-center gap-1.5"><Square className="w-4 h-4 text-[#c9a96e]" /> <span data-editor-field="area">{String(p.area ?? "")}</span></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#c9a96e] font-bold text-xl" data-editor-field="price">{String(p.price ?? "")}</span>
                    <span className="text-xs text-[#1a2332] font-semibold" data-editor-field="statusText">{String(p.statusText ?? "")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">No properties match your filters.</div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#c9a96e] disabled:opacity-40 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${currentPage === i + 1 ? "bg-[#c9a96e] text-white" : "border border-gray-200 hover:border-[#c9a96e]"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#c9a96e] disabled:opacity-40 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
