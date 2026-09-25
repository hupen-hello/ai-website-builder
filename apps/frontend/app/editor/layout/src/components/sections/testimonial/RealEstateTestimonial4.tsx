"use client"
import { useState, useEffect } from "react"
import { Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { SectionProps } from "../../../types/section"

export default function Testimonials({ data: _data }: SectionProps) {
    const data = (_data || {}) as any;
    const testimonials = Array.isArray(data.testimonials) ? data.testimonials : []
    const [currentIndex, setCurrentIndex] = useState(0)

    // Chunk testimonials into groups of 3
    const chunks = []
    for (let i = 0; i < testimonials.length; i += 3) {
        chunks.push(testimonials.slice(i, i + 3))
    }

    const nextTestimonial = () => {
        if (chunks.length > 0) {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % chunks.length)
        }
    }

    const prevTestimonial = () => {
        if (chunks.length > 0) {
            setCurrentIndex((prevIndex) => (prevIndex === 0 ? chunks.length - 1 : prevIndex - 1))
        }
    }

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (chunks.length <= 1) return; // Slider rok do agar items kam hain

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % chunks.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [chunks.length])

    return (
        <section
            className="py-8 md:py-12 bg-gray-50"
            data-editor-section-label="testimonials"
            data-editor-fields="title testimonials"
        >
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-16">
                    <h2
                        className="text-3xl font-bold uppercase tracking-widest text-secondary mb-4"
                        data-editor-field="title"
                    >
                        {String(data.title ?? "Our Clients Say")}
                    </h2>
                    <div className="w-16 h-1 bg-[#0a8296] mx-auto rounded-full" />
                </div>

                {chunks.length > 0 ? (
                    <div className="relative">
                        {/* Previous Button */}
                        <button
                            onClick={prevTestimonial}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-20 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-[#0a8296] hover:shadow-lg transition-all hidden md:flex"
                            aria-label="Previous Testimonial"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {/* Testimonial Cards Wrapper */}
                        <div className="overflow-hidden px-4 -mx-4 py-6 -my-6">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                            >
                                {chunks.map((chunk, index) => (
                                    <div key={`chunk-${index}`} className="w-full flex-shrink-0 px-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-box-layout-grid="grid">
                                            {chunk.map((testimonial: any) => (
                                                <div key={testimonial.id || Math.random()} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={String(testimonial.image ?? "")}
                                                            alt={String(testimonial.name ?? "Client Image")}
                                                            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-sm"
                                                            data-editor-media="image"
                                                            data-editor-media-type="image"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
                                                        <Quote className="w-8 h-8 text-[#4bc0d1] fill-[#4bc0d1] rotate-180 mb-3" />
                                                        <p
                                                            className="text-gray-700 text-sm md:text-[15px] leading-relaxed mb-6 font-medium"
                                                            data-editor-field="text"
                                                        >
                                                            {String(testimonial.text ?? "")}
                                                        </p>
                                                        <p
                                                            className="font-bold text-[15px] text-gray-900"
                                                            data-editor-field="name"
                                                        >
                                                            &ndash; {String(testimonial.name ?? "")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={nextTestimonial}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-20 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-[#0a8296] hover:shadow-lg transition-all hidden md:flex"
                            aria-label="Next Testimonial"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No testimonials available.</p>
                )}

                {/* Pagination dots */}
                {chunks.length > 1 && (
                    <div className="flex justify-center gap-2 mt-12">
                        {chunks.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-8 bg-[#0a8296]" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}