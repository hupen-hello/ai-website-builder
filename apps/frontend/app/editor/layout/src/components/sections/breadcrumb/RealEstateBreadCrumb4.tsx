"use client"
import Link from "next/link"
import { SectionProps } from "../../../types/section"
import { getAccentStyle } from "../../../lib/accentStyle"
import { resolveMediaSrc } from "../../../lib/resolveMediaSrc"

export default function RealEstateBreadCrumb4({ data: _data }: SectionProps) {
    const data = (_data || {}) as Record<string, unknown>;

    const title = String(data.name || data.title || "Page Title");
    const subtitle = data.subtitle ? String(data.subtitle) : "";
    const parentPage = data.parentPage ? String(data.parentPage) : "";
    const parentHref = data.parentHref ? String(data.parentHref) : "";
    const bgImage = resolveMediaSrc(
        data.bgImage || data.backgroundImage,
        1,
    );
    const homeHref = String(data.homeHref ?? "/");
    const homeText = String(data.homeText || data.homeLabel || "Home");

    return (
        <section
            className="relative h-[250px] md:h-[300px] flex items-center justify-center bg-secondary overflow-hidden"
            style={getAccentStyle(typeof data.accentColor === "string" ? data.accentColor : undefined)}
            data-editor-section-label="pageHeader"
            data-editor-fields="accentColor title subtitle parentPage parentHref bgImage homeText homeHref"
        >
            <div
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
                style={{ backgroundImage: `url('${bgImage}')` }}
                data-editor-media="bgImage"
                data-editor-media-type="image"
            />
            <div className="absolute inset-0 z-10 bg-secondary/60" />

            <div className="container mx-auto px-4 relative z-20 text-center text-white flex flex-col items-center">
                <h1
                    className="text-4xl md:text-5xl font-bold mb-3"
                    data-editor-field="title"
                >
                    {title}
                </h1>

                <div className="flex items-center gap-2 text-sm font-medium mb-4 opacity-80">
                    <Link href={homeHref} className="hover:text-[var(--accent)] transition-colors" data-editor-field="homeText">
                        {homeText}
                    </Link>

                    {parentPage && parentHref && (
                        <>
                            <span>/</span>
                            <Link href={parentHref} className="hover:text-[var(--accent)] transition-colors" data-editor-field="parentPage">
                                {parentPage}
                            </Link>
                        </>
                    )}

                    <span>/</span>
                    <span className="text-[var(--accent)]" data-editor-field="title">
                        {title}
                    </span>
                </div>
                {subtitle ? (
                    <p
                        className="max-w-2xl text-sm font-medium tracking-wide text-white/80 md:text-base"
                        data-editor-field="subtitle"
                    >
                        {subtitle}
                    </p>
                ) : null}
            </div>
        </section>
    )
}
