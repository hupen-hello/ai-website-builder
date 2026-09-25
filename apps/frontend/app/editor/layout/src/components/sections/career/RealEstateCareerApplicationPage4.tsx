"use client";

import type { ElementType } from "react";
import { useState } from "react";
import {
  BadgeDollarSign,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  Upload,
  User,
  Users,
} from "lucide-react";
import {
  careerApplicationPage4Content,
  careerPage4Content,
} from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  CareerApplication4Data,
  CareerFeature4Item,
  EnquiryField4,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  User,
  Briefcase,
  GraduationCap,
  FileText,
  TrendingUp,
  Users,
  BadgeDollarSign,
  Heart,
};

const defaultFields: EnquiryField4[] = [
  { label: "Full Name *", name: "fullName", type: "text", placeholder: "Enter your full name" },
  { label: "Email Address *", name: "email", type: "email", placeholder: "Enter your email address" },
  { label: "Phone Number *", name: "phone", type: "tel", placeholder: "Enter your phone number" },
  { label: "Alternate Number", name: "alternate", type: "tel", placeholder: "Enter alternate number" },
  {
    label: "Current Location *",
    name: "location",
    type: "select",
    placeholder: "Select your location",
    options: "Beverly Hills, CA, Los Angeles, CA, Southern California",
  },
  {
    label: "Notice Period *",
    name: "notice",
    type: "select",
    placeholder: "Select notice period",
    options: "Immediate, 15 Days, 30 Days",
  },
  { label: "LinkedIn Profile", name: "linkedin", type: "text", placeholder: "https://linkedin.com/in/yourprofile" },
  { label: "Portfolio / Website (if any)", name: "website", type: "text", placeholder: "https://yourwebsite.com" },
];

const defaultReasons: CareerFeature4Item[] = [
  {
    id: "growth",
    icon: "TrendingUp",
    title: "Growth Opportunities",
    description: "We invest in your growth and career development.",
  },
  {
    id: "culture",
    icon: "Users",
    title: "Collaborative Culture",
    description: "Be part of a supportive and inclusive team.",
  },
  {
    id: "benefits",
    icon: "BadgeDollarSign",
    title: "Competitive Benefits",
    description: "Enjoy attractive compensation and employee benefits.",
  },
  {
    id: "balance",
    icon: "Heart",
    title: "Work-Life Balance",
    description: "We value your time and personal well-being.",
  },
];

const parseOptions = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function RealEstateCareerApplicationPage4({
  data = {},
}: SectionProps) {
  const authored = careerApplicationPage4Content.RealEstateCareerApplicationPage4;
  const listingJobs = careerPage4Content.RealEstateCareerJobs4.jobs ?? [];
  const content: CareerApplication4Data = {
    ...authored,
    ...(data as CareerApplication4Data),
  };
  const matchedJob =
    listingJobs.find((job) => job.id === content.id) ?? listingJobs[0];
  const job = {
    title: content.title ?? matchedJob?.title ?? "Open Role",
    department: content.department ?? matchedJob?.department ?? "Team",
    location: content.location ?? matchedJob?.location ?? "Beverly Hills, CA",
    experience: content.experience ?? matchedJob?.experience ?? "2-4 Years",
    type: content.type ?? matchedJob?.type ?? "Full-time",
    posted: content.posted ?? matchedJob?.posted ?? "Today",
  };
  const fields = content.formFields?.length
    ? content.formFields
    : (authored.formFields ?? defaultFields);
  const reasons = content.reasons?.length
    ? content.reasons
    : (authored.reasons ?? defaultReasons);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 pb-10"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="careerApplication"
      data-editor-fields="accentColor title department location experience type posted formTitle formDescription submitLabel resumeLabel resumeHint resumeButtonLabel jobDetailsTitle whyJoinTitle helpTitle helpDescription helpEmail helpPhone successTitle successDescription closeLabel formFields reasons"
    >
      <div className="container mx-auto mt-12 max-w-6xl px-4">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full lg:w-2/3">
            <form
              className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="mb-8 border-b border-gray-100 pb-6">
                <h3
                  className="mb-2 text-xl font-bold text-secondary"
                  data-editor-field="formTitle"
                >
                  {content.formTitle ?? "Personal Information"}
                </h3>
                <p
                  className="text-[14px] text-gray-500"
                  data-editor-field="formDescription"
                >
                  {content.formDescription ?? "Please provide your personal details."}
                </p>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {fields.map((field) => {
                  const options = parseOptions(field.options);

                  return (
                    <div key={field.name ?? field.label}>
                      <label className="mb-2 block text-[13px] font-bold text-secondary">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select className="h-12 w-full appearance-none rounded border border-gray-200 bg-white px-4 text-[14px] focus:border-[var(--accent)] focus:outline-none">
                          <option value="">
                            {field.placeholder ?? "Select an option"}
                          </option>
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            field.type === "email"
                              ? "email"
                              : field.type === "tel"
                                ? "tel"
                                : "text"
                          }
                          placeholder={field.placeholder}
                          className="h-12 w-full rounded border border-gray-200 px-4 text-[14px] focus:border-[var(--accent)] focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mb-8">
                <label
                  className="mb-2 block text-[13px] font-bold text-secondary"
                  data-editor-field="resumeLabel"
                >
                  {content.resumeLabel ?? "Current Resume *"}
                </label>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                  <Upload className="mb-3 h-8 w-8 text-gray-400" />
                  <p className="mb-2 text-[14px] text-gray-500">
                    Drag & drop your file here
                  </p>
                  <p className="mb-4 text-[12px] text-gray-400">or</p>
                  <button
                    type="button"
                    className="rounded bg-[var(--accent)] px-6 py-2 text-[13px] font-medium text-white hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
                    data-editor-field="resumeButtonLabel"
                  >
                    {content.resumeButtonLabel ?? "Choose File"}
                  </button>
                </div>
                <p
                  className="mt-2 text-[11px] text-gray-400"
                  data-editor-field="resumeHint"
                >
                  {content.resumeHint ??
                    "Supported formats: PDF, DOC, DOCX (Max size: 5MB)"}
                </p>
              </div>

              <button
                type="submit"
                className="rounded bg-[var(--accent)] px-6 py-3 text-[14px] font-medium text-white hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
                data-editor-field="submitLabel"
              >
                {content.submitLabel ?? "Submit"}
              </button>
            </form>
          </div>

          <div className="flex w-full flex-col gap-6 lg:w-1/3">
            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h3
                className="mb-6 border-b border-gray-100 pb-4 text-lg font-bold text-secondary"
                data-editor-field="jobDetailsTitle"
              >
                {content.jobDetailsTitle ?? "Job Details"}
              </h3>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-[#e6f2f4] text-[var(--accent)]">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h4
                  className="text-[15px] leading-tight font-bold text-secondary"
                  data-editor-field="title"
                >
                  {job.title}
                </h4>
              </div>
              <div className="space-y-6">
                {[
                  { icon: Building2, label: "Department", value: job.department, field: "department" },
                  { icon: MapPin, label: "Location", value: job.location, field: "location" },
                  { icon: Clock, label: "Experience", value: job.experience, field: "experience" },
                  { icon: Briefcase, label: "Job Type", value: job.type, field: "type" },
                  { icon: CalendarDays, label: "Posted On", value: job.posted, field: "posted" },
                ].map((item) => (
                  <div key={item.field} className="flex items-start gap-4">
                    <item.icon className="mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="mb-0.5 text-[12px] text-gray-500">
                        {item.label}
                      </p>
                      <p
                        className="text-[14px] font-medium text-secondary"
                        data-editor-field={item.field}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h3
                className="mb-6 text-lg font-bold text-secondary"
                data-editor-field="whyJoinTitle"
              >
                {content.whyJoinTitle ?? "Why Join Us?"}
              </h3>
              <div className="space-y-6">
                {reasons.map((reason) => {
                  const Icon =
                    (reason.icon ? iconMap[reason.icon] : null) || TrendingUp;

                  return (
                    <div
                      key={reason.id ?? reason.title}
                      className="flex items-start gap-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-100 text-[var(--accent)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h5
                          className="mb-1 text-[13px] font-bold text-secondary"
                          data-editor-field="title"
                        >
                          {reason.title}
                        </h5>
                        <p
                          className="text-[12px] text-gray-500"
                          data-editor-field="description"
                        >
                          {reason.description ?? reason.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-xl border border-[#e6f2f4] bg-[#f8fafa] p-6 md:flex-row">
          <div className="flex flex-1 items-center gap-4 md:border-r md:border-gray-200 md:pr-6 lg:pr-12">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#e6f2f4] bg-white">
              <Mail className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <div>
              <h4
                className="text-[15px] font-bold text-secondary"
                data-editor-field="helpTitle"
              >
                {content.helpTitle ?? "Need Help?"}
              </h4>
              <p
                className="text-[13px] text-gray-500"
                data-editor-field="helpDescription"
              >
                {content.helpDescription ??
                  "If you have any questions while applying, feel free to reach out to our HR team."}
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-end gap-6 text-[14px] font-medium text-secondary sm:flex-row md:pl-4 lg:pl-8">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--accent)]" />
              <span data-editor-field="helpEmail">
                {content.helpEmail ?? "careers@example.com"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--accent)]" />
              <span data-editor-field="helpPhone">
                {content.helpPhone ?? "+01 98765 43210"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isSubmitted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3
              className="mb-2 text-2xl font-bold text-secondary"
              data-editor-field="successTitle"
            >
              {content.successTitle ?? "Application Submitted!"}
            </h3>
            <p
              className="mb-6 text-gray-500"
              data-editor-field="successDescription"
            >
              {content.successDescription ??
                `Thank you for applying. We have received your application for the ${job.title} position and will get back to you soon.`}
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="w-full rounded bg-[var(--accent)] px-6 py-2 font-medium text-white hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
              data-editor-field="closeLabel"
            >
              {content.closeLabel ?? "Close"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
