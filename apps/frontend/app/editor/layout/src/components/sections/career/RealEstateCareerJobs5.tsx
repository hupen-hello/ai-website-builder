"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type JobItem = {
  id?: string;
  title?: string;
  desc?: string;
  description?: string;
  location?: string;
  jobType?: string;
  type?: string;
  department?: string;
  experience?: string;
  education?: string;
  posted?: string;
  postedOn?: string;
  deadline?: string;
};

type SelectOption = { value?: string; label?: string };

const defaultJobs: JobItem[] = [
  {
    id: "job1",
    title: "Senior Architect",
    desc: "Lead our design team on major projects.",
    location: "New York",
    jobType: "Full Time",
    department: "Design",
    experience: "5+ Years",
    education: "Master in Architecture",
    postedOn: "Aug 01, 2026",
    deadline: "Sep 01, 2026",
  },
  {
    id: "job2",
    title: "Interior Designer",
    desc: "Create stunning interior spaces for our clients.",
    location: "Los Angeles",
    jobType: "Full Time",
    department: "Design",
    experience: "3+ Years",
    education: "Bachelor in Design",
    postedOn: "Aug 03, 2026",
    deadline: "Sep 03, 2026",
  },
];

const defaultExperienceOptions: SelectOption[] = [
  { value: "0-2", label: "0-2 Years" },
  { value: "3-5", label: "3-5 Years" },
  { value: "5+", label: "5+ Years" },
];

const defaultNoticeOptions: SelectOption[] = [
  { value: "immediate", label: "Immediate" },
  { value: "15days", label: "15 Days" },
  { value: "1month", label: "1 Month" },
];

const inputClass =
  "w-full rounded border border-[#eaeaea] bg-white px-3 py-3 text-[0.95rem] text-[#333] outline-none focus:border-[var(--accent)]";

function BriefcaseIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export default function RealEstateCareerJobs5({ data = {} }: SectionProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [activeJob, setActiveJob] = useState<JobItem | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(data.pretitle || data.tagline || "OPEN POSITIONS");
  const title = String(data.title || "Join Our Growing Team");
  const description = String(data.description || "");
  const applyLabel = String(data.applyLabel || data.applyText || "Apply Now");

  const pageTitle = String(
    data.applyPageTitle || data.pageTitle || "Apply for Position",
  );
  const pageDescription = String(
    data.applyPageDescription ||
      data.pageDescription ||
      "Fill out the form below to apply for the position.",
  );
  const personalInfoLabel = String(
    data.personalInfoLabel || "Personal Information",
  );
  const professionalInfoLabel = String(
    data.professionalInfoLabel || "Professional Information",
  );
  const fullNameLabel = String(data.fullNameLabel || "Full Name");
  const fullNamePlaceholder = String(
    data.fullNamePlaceholder || "Enter your full name",
  );
  const emailLabel = String(data.emailLabel || "Email Address");
  const emailPlaceholder = String(
    data.emailPlaceholder || "Enter your email address",
  );
  const phoneLabel = String(data.phoneLabel || "Phone Number");
  const phonePlaceholder = String(
    data.phonePlaceholder || "Enter your phone number",
  );
  const locationLabel = String(data.locationLabel || "Location");
  const locationPlaceholder = String(
    data.locationPlaceholder || "Enter your current location",
  );
  const currentPositionLabel = String(
    data.currentPositionLabel || "Current Position",
  );
  const currentPositionPlaceholder = String(
    data.currentPositionPlaceholder || "Enter your current position",
  );
  const totalExperienceLabel = String(
    data.totalExperienceLabel || "Total Experience",
  );
  const experiencePlaceholder = String(
    data.experiencePlaceholder || "Select experience",
  );
  const noticePeriodLabel = String(data.noticePeriodLabel || "Notice Period");
  const noticePeriodPlaceholder = String(
    data.noticePeriodPlaceholder || "Select notice period",
  );
  const uploadResumeLabel = String(data.uploadResumeLabel || "Upload Resume");
  const uploadInstruction = String(
    data.uploadInstruction || "Click to upload your resume",
  );
  const uploadFormats = String(
    data.uploadFormats || "PDF, DOC, DOCX (Max. 5MB)",
  );
  const coverLetterLabel = String(data.coverLetterLabel || "Cover Letter");
  const coverLetterPlaceholder = String(
    data.coverLetterPlaceholder ||
      "Write a few lines about yourself and why you are a good fit for this role...",
  );
  const submitButtonText = String(
    data.submitButtonText || "Submit Application",
  );
  const submittingText = String(data.submittingText || "Submitting...");
  const successMessage = String(
    data.successMessage || "Application submitted successfully!",
  );

  const sidebarLabels = {
    department: String(data.departmentLabel || "Department"),
    jobType: String(data.jobTypeLabel || "Job Type"),
    experience: String(data.experienceLabel || "Experience"),
    education: String(data.educationLabel || "Education"),
    postedOn: String(data.postedOnLabel || "Posted On"),
    deadline: String(data.deadlineLabel || "Application Deadline"),
  };

  const experienceOptions = (
    Array.isArray(data.experienceOptions) && data.experienceOptions.length
      ? data.experienceOptions
      : defaultExperienceOptions
  ) as SelectOption[];
  const noticePeriodOptions = (
    Array.isArray(data.noticePeriodOptions) && data.noticePeriodOptions.length
      ? data.noticePeriodOptions
      : defaultNoticeOptions
  ) as SelectOption[];

  const jobs = (
    Array.isArray(data.jobs) && data.jobs.length
      ? data.jobs
      : Array.isArray(data.careers) && data.careers.length
        ? data.careers
        : defaultJobs
  ) as JobItem[];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeJob) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeJob]);

  const openModal = (job: JobItem) => {
    setActiveJob(job);
    setResumeName("");
    setSubmitting(false);
    setSuccess(false);
  };

  const closeModal = () => {
    setActiveJob(null);
    setResumeName("");
    setSubmitting(false);
    setSuccess(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 600);
  };

  const activeJobType = String(
    activeJob?.jobType || activeJob?.type || "Full Time",
  );
  const activeJobDesc = String(
    activeJob?.desc || activeJob?.description || "",
  );
  const sidebarRows = activeJob
    ? [
        { label: sidebarLabels.department, value: activeJob.department },
        { label: sidebarLabels.jobType, value: activeJobType },
        { label: sidebarLabels.experience, value: activeJob.experience },
        { label: sidebarLabels.education, value: activeJob.education },
        {
          label: sidebarLabels.postedOn,
          value: activeJob.postedOn || activeJob.posted,
        },
        { label: sidebarLabels.deadline, value: activeJob.deadline },
      ].filter((row) => row.value)
    : [];

  return (
    <section
      className="bg-[#fafafa] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="openPositions"
      data-editor-fields="accentColor pretitle title description applyLabel jobs applyPageTitle applyPageDescription personalInfoLabel professionalInfoLabel fullNameLabel emailLabel phoneLabel locationLabel currentPositionLabel totalExperienceLabel noticePeriodLabel uploadResumeLabel coverLetterLabel submitButtonText successMessage"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-8 text-center">
          <div
            className="mb-4 text-[0.9rem] font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="m-0 font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="mx-auto mt-4 mb-2 flex items-center justify-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          {description ? (
            <p
              className="mx-auto mt-4 max-w-2xl text-base text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
          {jobs.map((job) => {
            const jobTitle = String(job.title || "Position");
            const jobType = String(job.jobType || job.type || "Full Time");
            const jobDesc = String(job.desc || job.description || "");
            return (
              <article
                key={job.id || jobTitle}
                className="flex items-center justify-between gap-6 rounded-lg border border-[#eaeaea] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] max-md:flex-col max-md:items-start max-md:gap-6 max-md:p-6"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                    <BriefcaseIcon />
                  </div>
                  <div>
                    <h3
                      className="mb-2 text-[1.25rem] font-bold text-[#333]"
                      data-editor-field="title"
                    >
                      {jobTitle}
                    </h3>
                    {jobDesc ? (
                      <p
                        className="m-0 max-w-[400px] text-[0.95rem] text-[#666]"
                        data-editor-field="desc"
                      >
                        {jobDesc}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-10 max-md:w-full max-md:flex-col max-md:items-start max-md:gap-6">
                  <div>
                    {job.location ? (
                      <div className="mb-2 flex items-center gap-2 text-[0.9rem] text-[#666] last:mb-0">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span data-editor-field="location">{job.location}</span>
                      </div>
                    ) : null}
                    <div className="mb-0 flex items-center gap-2 text-[0.9rem] text-[#666]">
                      <BriefcaseIcon size={16} />
                      <span data-editor-field="type">{jobType}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal(job)}
                    className="inline-flex items-center justify-center rounded border border-[var(--accent)] bg-transparent px-8 py-3 text-[0.95rem] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                    data-editor-field="applyLabel"
                  >
                    {applyLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {mounted &&
        activeJob &&
        createPortal(
          <div
            className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
            style={getAccentStyle(accent)}
            role="presentation"
            onClick={closeModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative my-4 w-full max-w-[1100px] rounded-lg bg-[#f8f9fa] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#eaeaea] bg-white px-6 py-5 max-md:px-4">
                <div>
                  <h2
                    id={titleId}
                    className="m-0 text-[1.5rem] font-bold text-[#333]"
                    data-editor-field="applyPageTitle"
                  >
                    {pageTitle}
                  </h2>
                  <p
                    className="mt-2 mb-0 text-[0.95rem] text-[#666]"
                    data-editor-field="applyPageDescription"
                  >
                    {pageDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close apply form"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eaeaea] bg-white text-[#666] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-10 p-6 max-md:flex-col max-md:gap-6 max-md:p-4">
                <aside className="w-[350px] shrink-0 rounded-lg border border-[#eaeaea] bg-white p-8 max-md:w-full max-md:p-6">
                  <div className="mb-8 border-b border-[#eaeaea] pb-8 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                      <BriefcaseIcon size={32} />
                    </div>
                    <h3
                      className="mb-4 text-[1.5rem] font-bold text-[#333]"
                      data-editor-field="title"
                    >
                      {activeJob.title}
                    </h3>
                    <div className="mb-6 flex items-center justify-center gap-4 text-[0.9rem] text-[#666]">
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseIcon size={14} />
                        {activeJobType}
                      </span>
                      {activeJob.location ? (
                        <span className="inline-flex items-center gap-1.5">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {activeJob.location}
                        </span>
                      ) : null}
                    </div>
                    {activeJobDesc ? (
                      <p className="m-0 text-left text-[0.9rem] leading-relaxed text-[#666]">
                        {activeJobDesc}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-6">
                    {sidebarRows.map((row) => (
                      <div key={row.label} className="flex gap-4">
                        <div>
                          <div className="mb-1 text-[0.9rem] font-semibold text-[#333]">
                            {row.label}
                          </div>
                          <div className="text-[0.9rem] text-[#666]">
                            {row.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="min-w-0 flex-1 rounded-lg border border-[#eaeaea] bg-white p-10 max-md:p-6">
                  {success ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p
                        className="m-0 text-lg font-semibold text-[#333]"
                        data-editor-field="successMessage"
                      >
                        {successMessage}
                      </p>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="mt-6 inline-flex rounded bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <h3
                        className="mb-6 border-b border-[#eaeaea] pb-4 text-[1.25rem] font-bold text-[#333]"
                        data-editor-field="personalInfoLabel"
                      >
                        {personalInfoLabel}
                      </h3>
                      <div className="mb-6 flex flex-col gap-5">
                        <label className="block">
                          <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                            {fullNameLabel}{" "}
                            <span className="text-[var(--accent)]">*</span>
                          </span>
                          <input
                            required
                            type="text"
                            placeholder={fullNamePlaceholder}
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                            {emailLabel}{" "}
                            <span className="text-[var(--accent)]">*</span>
                          </span>
                          <input
                            required
                            type="email"
                            placeholder={emailPlaceholder}
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                            {phoneLabel}{" "}
                            <span className="text-[var(--accent)]">*</span>
                          </span>
                          <input
                            required
                            type="tel"
                            placeholder={phonePlaceholder}
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                            {locationLabel}{" "}
                            <span className="text-[var(--accent)]">*</span>
                          </span>
                          <input
                            required
                            type="text"
                            placeholder={locationPlaceholder}
                            className={inputClass}
                          />
                        </label>
                      </div>

                      <h3
                        className="mb-6 border-b border-[#eaeaea] pb-4 text-[1.25rem] font-bold text-[#333]"
                        data-editor-field="professionalInfoLabel"
                      >
                        {professionalInfoLabel}
                      </h3>
                      <div className="mb-6 flex flex-col gap-5">
                        <div className="flex gap-5 max-md:flex-col">
                          <label className="block flex-1">
                            <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                              {currentPositionLabel}
                            </span>
                            <input
                              type="text"
                              placeholder={currentPositionPlaceholder}
                              className={inputClass}
                            />
                          </label>
                          <label className="block flex-1">
                            <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                              {totalExperienceLabel}{" "}
                              <span className="text-[var(--accent)]">*</span>
                            </span>
                            <select required className={inputClass} defaultValue="">
                              <option value="" disabled>
                                {experiencePlaceholder}
                              </option>
                              {experienceOptions.map((option) => (
                                <option
                                  key={option.value || option.label}
                                  value={option.value || option.label}
                                >
                                  {option.label || option.value}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="block w-1/2 max-md:w-full">
                          <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                            {noticePeriodLabel}
                          </span>
                          <select className={inputClass} defaultValue="">
                            <option value="" disabled>
                              {noticePeriodPlaceholder}
                            </option>
                            {noticePeriodOptions.map((option) => (
                              <option
                                key={option.value || option.label}
                                value={option.value || option.label}
                              >
                                {option.label || option.value}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div>
                          <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                            {uploadResumeLabel}{" "}
                            <span className="text-[var(--accent)]">*</span>
                          </span>
                          <label className="block cursor-pointer rounded border-2 border-dashed border-[#eaeaea] bg-[#fafafa] px-4 py-8 text-center transition-colors hover:border-[var(--accent)]">
                            <input
                              required={!resumeName}
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                setResumeName(file?.name || "");
                              }}
                            />
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#666"
                              strokeWidth="1.5"
                              className="mx-auto mb-3"
                              aria-hidden="true"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <div className="text-[0.95rem] font-medium text-[#333]">
                              {resumeName || uploadInstruction}
                            </div>
                            <div className="mt-1 text-[0.8rem] text-[#888]">
                              {uploadFormats}
                            </div>
                          </label>
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
                            {coverLetterLabel}
                          </span>
                          <textarea
                            rows={5}
                            placeholder={coverLetterPlaceholder}
                            className={`${inputClass} resize-y`}
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded bg-[var(--accent)] px-8 py-3.5 text-[0.95rem] font-semibold text-white transition-opacity disabled:opacity-70"
                        data-editor-field="submitButtonText"
                      >
                        {submitting ? submittingText : submitButtonText}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
