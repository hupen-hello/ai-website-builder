"use client"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionProps } from "../../../types/section"
import { getAccentStyle } from "../../../lib/accentStyle"

export default function RealEstateCtaBanner({ data: _data }: SectionProps) {
    const data = (_data || {}) as any;

    return (
        <section
            className="bg-[var(--accent)] text-white py-5 lg:py-6 relative overflow-hidden"
            style={getAccentStyle(data.accentColor)}
            data-editor-section-label="RealEstateCtaBanner"
            data-editor-fields="accentColor title callLabel phoneNumber buttonText buttonLink"
        >

            {/* Dark House shapes on the right */}
            <div className="absolute right-0 bottom-0 pointer-events-none h-full z-0 flex items-end overflow-hidden">
                <svg
                    height="100%"
                    viewBox="0 0 400 120"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-full w-[400px] object-cover origin-bottom-right"
                >
                    {/* Back light triangle */}
                    <path d="M180 120 L350 0 L400 0 L400 120 Z" fill="#084d59" />
                    {/* Middle darker triangle */}
                    <path d="M220 120 L400 20 L400 120 Z" fill="#06313a" />
                    {/* Front darkest triangle */}
                    <path d="M300 120 L400 60 L400 120 Z" fill="#041920" />
                </svg>
            </div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 max-w-7xl">

                {/* Left Side: Icon & Title */}
                <div className="flex items-center gap-4 lg:gap-6">
                    <div className="text-white shrink-0">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                            {/* First key */}
                            <path d="M9 8a4 4 0 1 0-8 0 4 4 0 0 0 8 0z" />
                            <path d="M8 10l8 8" />
                            <path d="M12 14l2-2" />
                            <path d="M14 16l2-2" />
                            {/* Second key overlapping */}
                            <path d="M12 5a3 3 0 1 0-6 0" strokeDasharray="2 2" opacity="0.6" />
                            <path d="M11 7l5 5" opacity="0.6" />
                            <path d="M14 10l1-1" opacity="0.6" />
                        </svg>
                    </div>

                    <h2
                        className="text-xl lg:text-2xl font-bold uppercase tracking-wider mt-1 whitespace-nowrap"
                        data-editor-field="title"
                    >
                        {String(data.title ?? "WANT TO BUY OR SELL A PROPERTY?")}
                    </h2>
                </div>

                {/* Right Side: Phone & Button */}
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">

                    <div className="h-10 w-px bg-white/30 hidden lg:block"></div>

                    <div className="flex flex-col justify-center text-center lg:text-left">
                        <p
                            className="text-[11px] lg:text-xs uppercase tracking-widest font-medium mb-0.5 opacity-90"
                            data-editor-field="callLabel"
                        >
                            {String(data.callLabel ?? "Call us today")}
                        </p>
                        <p
                            className="text-xl lg:text-[1.6rem] font-bold leading-none tracking-wide whitespace-nowrap"
                            data-editor-field="phoneNumber"
                        >
                            {String(data.phoneNumber ?? "555-555-5555")}
                        </p>
                    </div>

                    <Link href={String(data.buttonLink ?? "/template1/contact")}>
                        <button className="bg-transparent border border-white text-white hover:bg-white hover:text-[var(--accent)] uppercase font-bold tracking-wider px-6 py-2.5 text-[13px] flex items-center gap-2 transition-colors duration-300 lg:ml-2 rounded-sm whitespace-nowrap">
                            <span data-editor-field="buttonText">{String(data.buttonText ?? "GET IN TOUCH")}</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </Link>
                </div>

            </div>
        </section>
    )
}