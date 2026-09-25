import { SectionProps } from "../../../types/section"

export default function RealEstateProjectCatalog3({ data: _data }: SectionProps) {
  
  const data = (_data || {}) as any;
const projects = Array.isArray(data.projects) ? data.projects : []

  return (
    <section className="py-20 bg-white" data-editor-section-label="projectCatalog" data-editor-fields="pretitle title desc projects">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-[#c9a96e] font-bold text-xs tracking-widest uppercase mb-3" data-editor-field="pretitle">{String(data.pretitle ?? "")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2332]" data-editor-field="title">{String(data.title ?? "")}</h2>
          <p className="text-gray-500 mt-3 text-sm max-w-xl mx-auto" data-editor-field="desc">{String(data.desc ?? "")}</p>
        </div>

        {/* Project grid from latestProjects data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7" data-box-layout-grid="grid">
          {projects.map((project: any) => (
            <div key={project.slug}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative h-52 overflow-hidden">
                <img src={String(project.image ?? "")} alt={String(project.alt ?? "")}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                  data-editor-media="image" data-editor-media-type="image" />
                <div className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full ${
                  project.status === "New Launch" ? "bg-emerald-100 text-emerald-700" :
                  project.status === "Under Construction" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  <span data-editor-field="status">{String(project.status ?? "")}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-[#1a2332] text-lg mb-1" data-editor-field="title">{String(project.title ?? "")}</h3>
                <p className="text-xs text-gray-500 mb-2"><span data-editor-field="developer">{String(project.developer ?? "")}</span> · <span data-editor-field="type">{String(project.type ?? "")}</span></p>
                <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                  <span className="text-[#c9a96e]">📍</span> <span data-editor-field="location">{String(project.location ?? "")}</span>
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Starting from</p>
                    <p className="text-[#c9a96e] font-bold" data-editor-field="price">{String(project.price ?? "")}</p>
                  </div>
                  <span className="text-xs text-gray-400" data-editor-field="units">{String(project.units ?? "")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
