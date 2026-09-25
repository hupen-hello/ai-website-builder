import { SectionProps } from "../../../types/section"

export default function RealEstateCSRImpactSection3({ data: _data }: SectionProps) {
  
  const data = (_data || {}) as any;
const stats = Array.isArray(data.stats) ? data.stats : []

  return (
    <section className="py-20 bg-white" data-editor-section-label="csrImpact" data-editor-fields="pretitle title desc stats image imageAlt">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#c9a96e] font-bold text-xs tracking-widest uppercase mb-3" data-editor-field="pretitle">{String(data.pretitle ?? "")}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a2332] mb-5" data-editor-field="title">{String(data.title ?? "")}</h2>
            <p className="text-gray-600 leading-relaxed mb-10" data-editor-field="desc">{String(data.desc ?? "")}</p>
            <div className="grid grid-cols-2 gap-6" data-box-layout-grid="grid">
              {stats.map((s: any, i: number) => (
                <div key={i} className="bg-[#f8f6f2] rounded-2xl p-6">
                  <div className="text-3xl font-bold text-[#c9a96e] mb-1" data-editor-field="value">{String(s.value ?? "")}</div>
                  <div className="text-sm text-gray-500" data-editor-field="label">{String(s.label ?? "")}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden h-[420px] shadow-2xl">
            <img src={String(data.image ?? "")} alt={String(data.imageAlt ?? "")} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
              data-editor-media="image" data-editor-media-type="image" />
          </div>
        </div>
      </div>
    </section>
  )
}
