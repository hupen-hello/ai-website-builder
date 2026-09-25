"use client";

import { Target, Eye } from "lucide-react";
import { resolveMediaSrc } from "../../../lib/resolveMediaSrc";

export interface MissionVisionData {
  missionPretitle?: string;
  missionMainTitle?: string;
  missionMainDesc?: string;
  missionImage?: string;
  missionImageTitle?: string;
  missionTitle?: string;
  missionDesc?: string;
  visionTitle?: string;
  visionDesc?: string;
  [key: string]: any;
}

export default function RealEstateMissionVision4({ data = {} }: SectionProps) {
  const typedData = data as MissionVisionData;

  return (
    <section className="py-8 md:py-12 bg-white relative overflow-hidden" data-editor-section-label="Mission & Vision">
      <div className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 opacity-50 z-0 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots-mv" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle fill="#0a8296" cx="2" cy="2" r="1.5"></circle>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dots-mv)"></rect>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[#0a8296] font-semibold tracking-wider uppercase mb-4" data-editor-field="missionPretitle">
            {typedData.missionPretitle || "Our Mission & Vision"}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4" data-editor-field="missionMainTitle">
            {typedData.missionMainTitle || "Our Commitment. Your Future."}
          </h2>
          <p className="text-gray-500" data-editor-field="missionMainDesc">
            {typedData.missionMainDesc || "We are committed to delivering exceptional real estate experiences built on trust, integrity, and a passion for excellence."}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2">
            <div className="relative">
              <img
                src={resolveMediaSrc(
                  typedData.missionImage,
                  4,
                )}
                alt={typedData.missionImageTitle || "Luxury Home Mission"}
                className="rounded-3xl shadow-xl w-full"
                data-editor-media="missionImage"
                data-editor-media-type="image"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#0a8296] rounded-xl -z-10" />
            </div>
          </div>

          <div className="lg:w-1/2 space-y-8">
            <div className="flex gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-teal-200 transition-colors">
              <div className="w-16 h-16 rounded-xl bg-[#0a8296] text-white flex items-center justify-center shrink-0 shadow-lg shadow-teal-900/20">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary mb-2 uppercase tracking-wide" data-editor-field="missionTitle">
                  {typedData.missionTitle || "Our Mission"}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm" data-editor-field="missionDesc">
                  {typedData.missionDesc || "To deliver a seamless and refined buying and selling experience. We stand out from the rest with our standards of integrity, expertise and sophistication."}
                </p>
              </div>
            </div>

            <div className="flex gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-teal-200 transition-colors">
              <div className="w-16 h-16 rounded-xl bg-[#0a8296] text-white flex items-center justify-center shrink-0 shadow-lg shadow-teal-900/20">
                <Eye className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary mb-2 uppercase tracking-wide" data-editor-field="visionTitle">
                  {typedData.visionTitle || "Our Vision"}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm" data-editor-field="visionDesc">
                  {typedData.visionDesc || "To be the most trusted and innovative real estate company, inspiring better lives and stronger communities through every property we represent."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
