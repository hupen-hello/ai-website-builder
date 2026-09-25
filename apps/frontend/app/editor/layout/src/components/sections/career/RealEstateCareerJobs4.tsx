"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Clock, MapPin } from "lucide-react";
import { careerPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  CareerJob4,
  CareerJobs4Data,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const JOBS_PER_PAGE = 5;

const defaultJobs: CareerJob4[] = [
  {
    id: "interior-designer",
    title: "Interior Designer",
    department: "Design",
    location: "Beverly Hills, CA",
    experience: "3-5 Years",
    type: "Full-time",
    posted: "Aug 4, 2024",
  },
  {
    id: "sales-advisor",
    title: "Sales Advisor",
    department: "Sales",
    location: "Los Angeles, CA",
    experience: "2-4 Years",
    type: "Full-time",
    posted: "Jul 28, 2024",
  },
  {
    id: "site-supervisor",
    title: "Site Supervisor",
    department: "Operations",
    location: "Southern California",
    experience: "4-6 Years",
    type: "Full-time",
    posted: "Jul 15, 2024",
  },
];

export default function RealEstateCareerJobs4({ data = {} }: SectionProps) {
  const authored = careerPage4Content.RealEstateCareerJobs4;
  const content: CareerJobs4Data = {
    ...authored,
    ...(data as CareerJobs4Data),
  };
  const jobs = content.jobs?.length ? content.jobs : (authored.jobs ?? defaultJobs);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const currentJobs = jobs.slice(
    (safePage - 1) * JOBS_PER_PAGE,
    safePage * JOBS_PER_PAGE,
  );

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="careerJobs"
      data-editor-fields="accentColor title description applyLabel jobs"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-gray-100 bg-[#f8fafa] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] lg:p-10">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2
                className="mb-2 text-3xl font-bold text-secondary"
                data-editor-field="title"
              >
                {content.title ?? "Open Positions"}
              </h2>
              <p
                className="text-[14px] text-gray-500"
                data-editor-field="description"
              >
                {content.description ??
                  "Find the right opportunity and be a part of our journey."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {currentJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col justify-between gap-6 rounded-lg border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md lg:flex-row lg:items-center lg:px-8"
              >
                <div className="w-full lg:w-1/4">
                  <h3
                    className="text-[15px] font-bold text-secondary"
                    data-editor-field="title"
                  >
                    {job.title}
                  </h3>
                </div>

                <div className="flex w-full flex-wrap items-center gap-6 lg:w-1/2 lg:flex-nowrap lg:gap-12">
                  <div className="flex items-center gap-2 text-[14px] text-gray-500">
                    <Briefcase className="h-4 w-4 text-[var(--accent)]" />
                    <span data-editor-field="department">{job.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] text-gray-500">
                    <MapPin className="h-4 w-4 text-[var(--accent)]" />
                    <span data-editor-field="location">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] text-gray-500">
                    <Clock className="h-4 w-4 text-[var(--accent)]" />
                    <span data-editor-field="experience">{job.experience}</span>
                  </div>
                </div>

                <div className="w-full lg:w-auto">
                  <Link
                    href={`/template4/careers/${job.id}`}
                    className="inline-block w-full rounded bg-[var(--accent)] px-8 py-2.5 text-center text-[14px] font-medium text-white transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)] lg:w-auto"
                    data-editor-field="applyLabel"
                  >
                    {content.applyLabel ?? "Apply Now"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setCurrentPage(number)}
                    className={`rounded-md px-4 py-2 ${
                      safePage === number
                        ? "bg-[var(--accent)] text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {number}
                  </button>
                ),
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
