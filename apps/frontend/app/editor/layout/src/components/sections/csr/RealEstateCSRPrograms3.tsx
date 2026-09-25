import { Home, GraduationCap, BookOpen, Leaf } from "lucide-react"
import { SectionProps } from "../../../types/section"

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="w-6 h-6" />,
  GraduationCap: <GraduationCap className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
  Leaf: <Leaf className="w-6 h-6" />,
}

export default function RealEstateCSRPrograms3({ data: _data }: SectionProps) {
  
  const data = (_data || {}) as any;
const programs = Array.isArray(data.programs) ? data.programs : []

  return (
    <section className="py-20 bg-[#f8f6f2]" data-editor-section-label="csrPrograms" data-editor-fields="pretitle title programs">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-14">
          <p className="text-[#c9a96e] font-bold text-xs tracking-widest uppercase mb-3" data-editor-field="pretitle">{String(data.pretitle ?? "")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2332]" data-editor-field="title">{String(data.title ?? "")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-box-layout-grid="grid">
          {programs.map((prog: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center text-[#c9a96e] mb-5 group-hover:bg-[#c9a96e] group-hover:text-white transition-all">
                {iconMap[prog.icon] ?? <Home className="w-6 h-6" />}
              </div>
              <h3 className="font-bold text-[#1a2332] mb-2" data-editor-field="title">{String(prog.title ?? "")}</h3>
              <p className="text-gray-500 text-sm leading-relaxed" data-editor-field="desc">{String(prog.desc ?? "")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
