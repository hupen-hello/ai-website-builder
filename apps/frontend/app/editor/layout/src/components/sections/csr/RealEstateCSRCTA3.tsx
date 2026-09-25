import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionProps } from "../../../types/section"

export default function RealEstateCSRCTA3({ data: _data }: SectionProps) {
  
  const data = (_data || {}) as any;
return (
    <section className="py-20 bg-[#1a2332]" data-editor-section-label="csrCTA" data-editor-fields="title desc button">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-white mb-4" data-editor-field="title">{String(data.title ?? "")}</h2>
        <p className="text-gray-400 mb-8 text-sm" data-editor-field="desc">{String(data.desc ?? "")}</p>
        <Link href={String(data.button?.href ?? "#")}
          className="inline-flex items-center gap-2 bg-[#c9a96e] hover:bg-[#b8966a] text-white px-8 py-4 rounded-xl font-semibold transition-all">
          <span data-editor-field="button.label">{String(data.button?.label ?? "")}</span> <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
