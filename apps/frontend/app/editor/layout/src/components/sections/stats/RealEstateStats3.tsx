"use client"

import { useEffect, useRef, useState } from "react"
import { SectionProps } from "../../../types/section"
import { getAccentStyle } from "../../../lib/accentStyle"
import { WebsiteIcon } from "../../../lib/websiteIcons"

function useCountUp(target: string, isVisible: boolean) {
  const [count, setCount] = useState("0")
  useEffect(() => {
    if (!isVisible) return
    const num = parseFloat(target.replace(/[^0-9.]/g, ""))
    const suffix = target.replace(/[0-9.]/g, "")
    if (isNaN(num)) { setCount(target); return }
    const duration = 1800
    const steps = 60
    const increment = num / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, num)
      setCount(Number.isInteger(num) ? `${Math.round(current)}${suffix}` : `${current.toFixed(1)}${suffix}`)
      if (step >= steps) { setCount(target); clearInterval(timer) }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isVisible, target])
  return count
}

function StatItem({ stat, isVisible }: { stat: any, isVisible: boolean }) {
  const count = useCountUp(String(stat.value ?? "0"), isVisible)
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] flex items-center justify-center text-[var(--accent)] mb-4 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300">
        {stat.icon ? (
          <WebsiteIcon name={stat.icon} className="w-8 h-8" />
        ) : (
          <WebsiteIcon name="Star" className="w-8 h-8" />
        )}
      </div>
      <div className="text-4xl font-bold text-[#1a2332] mb-1" data-editor-field="value">{count}</div>
      <div className="text-gray-500 text-sm font-medium" data-editor-field="label">{String(stat.label ?? "")}</div>
    </div>
  )
}

export default function RealEstateStats3({ data: _data }: SectionProps) {
  const data = (_data || {}) as any;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const defaultStats = [
    { value: "2500+", label: "Properties Listed", icon: "Building2" },
    { value: "98%", label: "Happy Clients", icon: "Users" },
    { value: "15+", label: "Years Experience", icon: "Award" },
    { value: "4.9", label: "Client Rating", icon: "Star" },
  ];

  const rawStats = Array.isArray(data)
    ? data
    : Array.isArray(data?.stats) && data.stats.length > 0
    ? data.stats
    : defaultStats;

  const stats = rawStats;

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.disconnect() }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      className="py-20 bg-[#f8f6f2]"
      ref={ref}
      style={getAccentStyle(data.accentColor || "#c9a96e")}
      data-editor-section-label="stats"
      data-editor-fields="accentColor stats"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8" data-box-layout-grid="grid">
          {stats.map((stat: any, i: number) => (
            <StatItem key={i} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}
