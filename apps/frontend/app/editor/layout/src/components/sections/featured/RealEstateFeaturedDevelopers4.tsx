"use client"

import { SectionProps } from "../../../types/section"

export default function RealEstateFeaturedDevelopers4({ data: _data }: SectionProps) {
    const data = (_data || {}) as any;
    const items = Array.isArray(data.items) ? data.items : [];

    return (
        <section
            className="py-12 md:py-16 bg-[#f8f6f2] border-t border-b border-gray-100"
            data-editor-section-label="partners"
            data-editor-fields="title partners"
        >
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2
                        className="text-2xl font-bold uppercase tracking-widest text-secondary mb-3"
                        data-editor-field="title"
                    >
                        {String(data.title ?? "Our Partners")}
                    </h2>
                    <div className="w-12 h-1 bg-[#0a8296] mx-auto rounded-full" />
                </div>

                <div
                    className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-opacity"
                    data-box-layout-grid="grid"
                >
                    {items.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="w-32 md:w-48 lg:w-56 h-32 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 overflow-hidden"
                        >
                            <img
                                src={String(item.logo ?? "/images/logos/logo1.png")}
                                alt={String(item.name ?? "Partner Logo")}
                                className="w-full h-full object-contain scale-[1.7] mix-blend-multiply"
                                data-editor-media="image"
                                data-editor-media-type="image"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}