"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Briefcase, Check, ImagePlus, Loader2, Sparkles, User, Users } from "lucide-react";
import Image from "next/image";
import { ONBOARDING_MIN_DESCRIPTION_LENGTH } from "@/lib/onboardingDraft";
import { compressLogoFile } from "@/lib/applyOnboardingLogo";

type Category = "clients" | "myself" | "company";

type BusinessInfo = {
  audience: "" | Category;
  name: string;
  description: string;
  websiteRelated:
  | ""
  | "service-provider"
  | "products"
  | "blog"
  | "ngo"
  | "campaign-page";
  pageType: "" | "multi-page" | "single-page";
  email: string;
  mobile: string;
  address: string;
  includeDetails: boolean;
  hasLogo: "" | "yes" | "no";
  logoName: string;
  logoImage?: string;
};

type CategoryStepProps = {
  value: BusinessInfo;
  showErrors: boolean;
  onChange: (value: BusinessInfo) => void;
  /** Which create path the user picked before this form. */
  createPath?: "create-ai" | "create-custom" | "";
};

export const MIN_DESCRIPTION_LENGTH = ONBOARDING_MIN_DESCRIPTION_LENGTH;

const categories = [
  {
    id: "company",
    title: "My Company",
    subtitle: "Business",
    icon: Briefcase,
    labels: {
      name: "Business Name",
      desc: "Business Description",
      namePlaceholder: "Enter your business name",
      descPlaceholder: "Tell us what your business does...",
    },
    image: "/onboarding-company.png",
  },
  {
    id: "clients",
    title: "Clients",
    subtitle: "Agency",
    icon: Users,
    labels: {
      name: "Website Name",
      desc: "Description",
      namePlaceholder: "Enter client name",
      descPlaceholder: "Tell us about agency...",
    },
    image: "/onboarding-clients.png",
  },
  {
    id: "myself",
    title: "Myself",
    subtitle: "Individual",
    icon: User,
    labels: {
      name: "Website Name",
      desc: "Description",
      namePlaceholder: "Enter your website name",
      descPlaceholder: "Tell us about your brand...",
    },
    image: "/onboarding-myself.png",
  },
] as const;

const defaultLabels = {
  name: "Name",
  desc: "Description",
  namePlaceholder: "Enter name",
  descPlaceholder: "Tell us about your project...",
};

const websiteOptions = [
  { value: "service-provider", label: "Service Provider" },
  { value: "products", label: "Products" },
  { value: "blog", label: "Blog" },
  { value: "ngo", label: "NGO" },
  { value: "campaign-page", label: "Campaign Page" },
] as const;

const pageOptions = [
  { value: "multi-page", label: "Multi-page Site" },
  { value: "single-page", label: "Single-page Site" },
] as const;

export default function CategoryStep({
  value,
  showErrors,
  onChange,
  createPath = "",
}: CategoryStepProps) {
  const [selected, setSelected] = useState<"" | Category>(value.audience);
  const [logoPreview, setLogoPreview] = useState(value.logoImage || "");
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [descriptionAiError, setDescriptionAiError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const isAiPath = createPath === "create-ai";
  const pathLabel = isAiPath ? "With AI" : "With Custom design";
  const pathHint = isAiPath
    ? "You chose Create with AI — share a few details and we will generate your site."
    : "You chose Create with custom design — share a few details, then pick a template.";

  useEffect(() => {
    setLogoPreview(value.logoImage || "");
  }, [value.logoImage]);

  // Create with AI: fewer questions — soft-default site type + logo.
  useEffect(() => {
    if (!isAiPath) return;
    const next: Partial<BusinessInfo> = {};
    if (!value.websiteRelated) next.websiteRelated = "service-provider";
    if (!value.hasLogo) next.hasLogo = "no";
    if (!value.pageType) next.pageType = "single-page";
    if (Object.keys(next).length) onChange({ ...value, ...next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiPath]);

  useEffect(() => {
    if (
      value.websiteRelated === "campaign-page" &&
      value.pageType === "multi-page"
    ) {
      onChange({ ...value, pageType: "single-page" });
    }
    // Only correct invalid campaign + multi-page combos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.websiteRelated, value.pageType]);

  const isCampaignPage = value.websiteRelated === "campaign-page";
  const pageTypeOptions = pageOptions.map((option) => ({
    ...option,
    disabled: isCampaignPage && option.value === "multi-page",
  }));

  const active = categories.find((item) => item.id === selected);
  const labels = active?.labels ?? defaultLabels;
  const hasAudienceError = showErrors && !value.audience;
  const hasNameError = showErrors && !value.name.trim();
  const descriptionLength = value.description.trim().length;
  const hasDescriptionError =
    showErrors && descriptionLength < MIN_DESCRIPTION_LENGTH;
  const hasWebsiteError =
    showErrors && !isAiPath && !value.websiteRelated;
  const hasPageTypeError = showErrors && !value.pageType;
  const hasEmailError =
    showErrors && value.includeDetails && !value.email.trim();
  const hasMobileError =
    showErrors && value.includeDetails && !value.mobile.trim();
  const hasAddressError =
    showErrors && value.includeDetails && !value.address.trim();
  const hasLogoError = showErrors && !isAiPath && !value.hasLogo;
  const hasLogoUploadError =
    showErrors &&
    value.hasLogo === "yes" &&
    (!value.logoName || !value.logoImage);

  const updateBusinessInfo = (nextValue: Partial<BusinessInfo>) => {
    onChange({ ...value, ...nextValue });
  };

  const handleGenerateDescription = async () => {
    if (generatingDescription) return;
    setDescriptionAiError("");

    if (!value.name.trim()) {
      setDescriptionAiError("Enter a website name first, then generate.");
      return;
    }

    setGeneratingDescription(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: value.name,
          audience: value.audience,
          websiteRelated: value.websiteRelated,
          pageType: value.pageType,
          existingDescription: value.description,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        description?: string;
        message?: string;
        fallback?: boolean;
      };
      if (!res.ok || !data.description?.trim()) {
        setDescriptionAiError(
          data.message || "Unable to generate description. Try again.",
        );
        return;
      }
      updateBusinessInfo({ description: data.description.trim().slice(0, 300) });
      if (data.fallback && data.message) {
        setDescriptionAiError(data.message);
      }
    } catch {
      setDescriptionAiError("Unable to generate description. Try again.");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    void (async () => {
      try {
        const compressed = await compressLogoFile(file);
        setLogoPreview(compressed.dataUrl);
        updateBusinessInfo({
          hasLogo: "yes",
          logoName: compressed.fileName,
          logoImage: compressed.dataUrl,
        });
      } catch {
        updateBusinessInfo({ logoName: "", logoImage: "" });
        setLogoPreview("");
      } finally {
        setLogoUploading(false);
        event.target.value = "";
      }
    })();
  };

  return (
    <section className="relative mx-auto max-h-[calc(100dvh-156px)] w-full origin-center overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(23,38,76,.08)]">
      <div
        className={
          isAiPath
            ? "px-4 py-4 sm:px-6 lg:px-7 lg:py-5 2xl:px-9"
            : "px-4 py-5 sm:px-6 lg:px-7 lg:py-8 2xl:px-9"
        }
      >
        <div>
          <div
            className={
              isAiPath
                ? "flex shrink-0 justify-center items-center gap-3 border-slate-200 pb-6 sm:pb-7"
                : "flex shrink-0 justify-center items-center gap-3 border-slate-200 pb-5"
            }
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-[-.035em] text-[#08132f] sm:text-2xl">
                {"Let's"} start with your business{" "}
                <span
                  className={
                    isAiPath
                      ? "bg-gradient-to-r from-violet-500 to-indigo-600 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent"
                  }
                >
                  {pathLabel}
                </span>
              </h2>
              <p
                className={
                  isAiPath
                    ? "mt-2 text-xs text-slate-500 sm:text-sm"
                    : "mt-1 text-xs text-slate-500 sm:text-sm"
                }
              >
                {pathHint}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5 2xl:gap-3">
              {categories.map((item) => {
                const Icon = item.icon;
                const isActive = selected === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelected(item.id);
                      updateBusinessInfo({ audience: item.id });
                    }}
                    className={`group relative flex items-center justify-start gap-3 overflow-hidden rounded-lg border px-3 pr-14 text-left transition-all duration-500 ease-out active:scale-[.985] sm:px-4 sm:pr-[74px] ${isAiPath ? "min-h-[58px] md:min-h-[64px] 2xl:min-h-[70px] 2xl:px-5 2xl:pr-20" : "min-h-[70px] md:min-h-[82px] 2xl:min-h-[90px] 2xl:px-5 2xl:pr-24"} ${isActive
                      ? "border-[#315ff4] bg-blue-50/40 text-[#10182d] shadow-[0_8px_24px_rgba(49,95,244,.1)] ring-1 ring-[#315ff4]"
                      : hasAudienceError
                        ? "border-blue-400 bg-white text-[#08132f]"
                        : "border-slate-200 bg-white text-[#08132f] hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                  >
                    <span
                      className={`hidden md:grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-500 2xl:size-11 ${isActive ? "bg-white text-[#315ff4] shadow-sm" : "bg-slate-50 text-slate-500"}`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-medium sm:text-[12px] 2xl:text-[18px]">
                        {item.title}
                      </strong>
                      <small className="text-[12px] text-slate-400 sm:block 2xl:text-xs">
                        {item.subtitle}
                      </small>
                    </span>
                    <span
                      className={`hidden md:block pointer-events-none absolute -bottom-1 right-1 h-[54px] w-[72px] transition-all duration-500 ease-out sm:right-2 2xl:h-[68px] 2xl:w-[90px] ${isActive
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-1 scale-90 opacity-55 grayscale-[25%]"
                        }`}
                    >
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="72px"
                        className="scale-150 object-contain"
                      />
                    </span>
                    {isActive && (
                      <span className="absolute right-2 top-2 z-10 grid size-4 place-items-center rounded-full bg-[#315ff4] text-white transition-all duration-300">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {hasAudienceError && (
              <ErrorLine message="Please choose who this website is for." />
            )}

            <form
              className={
                isAiPath
                  ? "mt-4 grid items-start gap-y-3 2xl:mt-6 2xl:gap-y-4"
                  : "mt-5 grid items-start gap-y-5 2xl:mt-10 2xl:gap-y-10"
              }
              onSubmit={(event) => event.preventDefault()}
            >
              {isAiPath ? (
                <>
                  <div className="grid min-w-0 grid-cols-1 content-start items-stretch gap-3 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
                    <FieldLabel
                      label={labels.name}
                      compact
                      className="h-full"
                      error={
                        hasNameError ? "This field is required." : undefined
                      }
                    >
                      <input
                        value={value.name}
                        onChange={(event) =>
                          updateBusinessInfo({ name: event.target.value })
                        }
                        type="text"
                        placeholder={labels.namePlaceholder}
                        className={`${fieldClass(hasNameError, true)} !h-9`}
                      />
                    </FieldLabel>
                    <RadioGroup
                      legend="What kind of site do you need?"
                      name="page-type"
                      value={value.pageType}
                      options={pageTypeOptions}
                      hasError={hasPageTypeError}
                      onChange={(pageType) => updateBusinessInfo({ pageType })}
                      compact
                      equalHeight
                    />
                  </div>

                  <div className="grid min-w-0 content-start gap-1.5">
                    <p className="text-[14px] font-medium text-[#08132f] 2xl:text-[15px]">
                      Logo{" "}
                      <span className="font-normal text-slate-400">
                        (optional)
                      </span>
                    </p>
                    <LogoUpload
                      fileName={value.logoName}
                      preview={logoPreview}
                      hasError={hasLogoUploadError}
                      uploading={logoUploading}
                      onChange={handleLogoChange}
                      compact
                    />
                  </div>

                  <DescriptionField
                    label={`${labels.desc} *`}
                    value={value.description}
                    placeholder={labels.descPlaceholder}
                    hasError={hasDescriptionError}
                    errorMessage={`Please enter at least ${MIN_DESCRIPTION_LENGTH} characters (${MIN_DESCRIPTION_LENGTH - descriptionLength} more needed).`}
                    aiError={descriptionAiError}
                    generating={generatingDescription}
                    onGenerate={() => void handleGenerateDescription()}
                    canGenerate={Boolean(value.name.trim())}
                    compact
                    onChange={(description) => {
                      setDescriptionAiError("");
                      updateBusinessInfo({ description });
                    }}
                  />

                  {!value.includeDetails ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateBusinessInfo({ includeDetails: true })
                      }
                      className="inline-flex h-8 w-fit max-w-full items-center gap-1.5 justify-self-start rounded-md px-1 text-[13px] font-medium text-[#315ff4] transition hover:text-blue-800"
                    >
                      <span className="text-md leading-none">+</span>
                      Add more details
                      <span className="hidden font-normal text-slate-400 sm:inline">
                        — these will be used on your website
                      </span>
                    </button>
                  ) : (
                    <div className="relative grid animate-onboarding-swap gap-2 pt-1 sm:grid-cols-2 md:grid-cols-[1fr_1fr_1.2fr]">
                      <button
                        type="button"
                        aria-label="Close additional details"
                        title="Close additional details"
                        onClick={() =>
                          updateBusinessInfo({ includeDetails: false })
                        }
                        className="absolute right-0 top-0 z-10 grid size-6 place-items-center rounded-full bg-[#315ff4] text-base font-medium leading-none text-white shadow-[0_6px_16px_rgba(49,95,244,.3)] transition-all duration-200 hover:rotate-90 hover:bg-[#244bd5]"
                      >
                        ×
                      </button>
                      <FieldLabel
                        label="Email ID"
                        compact
                        error={
                          hasEmailError ? "Email is required." : undefined
                        }
                      >
                        <input
                          type="email"
                          value={value.email}
                          onChange={(event) =>
                            updateBusinessInfo({ email: event.target.value })
                          }
                          placeholder="you@example.com"
                          className={fieldClass(hasEmailError, true)}
                        />
                      </FieldLabel>
                      <FieldLabel
                        label="Mobile number"
                        compact
                        error={
                          hasMobileError
                            ? "Mobile number is required."
                            : undefined
                        }
                      >
                        <input
                          type="tel"
                          value={value.mobile}
                          onChange={(event) =>
                            updateBusinessInfo({ mobile: event.target.value })
                          }
                          placeholder="Your number"
                          className={fieldClass(hasMobileError, true)}
                        />
                      </FieldLabel>
                      <FieldLabel
                        label="Business address"
                        compact
                        error={
                          hasAddressError ? "Address is required." : undefined
                        }
                      >
                        <input
                          type="text"
                          value={value.address}
                          onChange={(event) =>
                            updateBusinessInfo({ address: event.target.value })
                          }
                          placeholder="Street, city, country"
                          className={fieldClass(hasAddressError, true)}
                        />
                      </FieldLabel>
                    </div>
                  )}
                </>
              ) : (
                <>
              <div className="grid min-w-0 grid-cols-1 content-start gap-3 sm:grid-cols-2">
                <FieldLabel
                  label={labels.name}
                  error={hasNameError ? "This field is required." : undefined}
                >
                  <input
                    value={value.name}
                    onChange={(event) =>
                      updateBusinessInfo({ name: event.target.value })
                    }
                    type="text"
                    placeholder={labels.namePlaceholder}
                    className={fieldClass(hasNameError)}
                  />
                </FieldLabel>

                  <DescriptionField
                    label={labels.desc}
                    value={value.description}
                    placeholder={labels.descPlaceholder}
                    hasError={hasDescriptionError}
                    errorMessage={`Please enter at least ${MIN_DESCRIPTION_LENGTH} characters (${MIN_DESCRIPTION_LENGTH - descriptionLength} more needed).`}
                    aiError={descriptionAiError}
                    generating={generatingDescription}
                    onGenerate={() => void handleGenerateDescription()}
                    canGenerate={Boolean(value.name.trim())}
                    onChange={(description) => {
                      setDescriptionAiError("");
                      updateBusinessInfo({ description });
                    }}
                  />
              </div>

              <div className="grid min-w-0 grid-cols-1 content-start items-start gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,.8fr)_minmax(0,.72fr)] 2xl:gap-y-6">
                  <div className="order-1 col-span-1 md:col-span-2 xl:col-span-1">
                    <RadioGroup
                      legend="What is your website related to?"
                      name="website-related"
                      value={value.websiteRelated}
                      options={websiteOptions}
                      hasError={hasWebsiteError}
                      onChange={(websiteRelated) =>
                        updateBusinessInfo({
                          websiteRelated,
                          ...(websiteRelated === "campaign-page"
                            ? { pageType: "single-page" as const }
                            : {}),
                        })
                      }
                    />
                  </div>
                <div className="order-2 grid content-start gap-2">
                  <RadioGroup
                    legend="What kind of site do you need?"
                    name="page-type"
                    value={value.pageType}
                    options={pageTypeOptions}
                    hasError={hasPageTypeError}
                    onChange={(pageType) => updateBusinessInfo({ pageType })}
                  />
                  {isCampaignPage && (
                    <p className="text-[11px] text-slate-400">
                      Campaign pages use a single-page site only.
                    </p>
                  )}
                </div>

                {value.includeDetails && (
                  <div className="order-5 relative col-span-1 mt-3.5 grid animate-onboarding-swap gap-2 pt-1 sm:col-span-2 xl:col-span-3 xl:grid-cols-[1fr_1fr_1.2fr]">
                    <button
                      type="button"
                      aria-label="Close additional details"
                      title="Close additional details"
                      onClick={() =>
                        updateBusinessInfo({ includeDetails: false })
                      }
                      className="absolute right-0 top-0 z-10 grid size-6 place-items-center rounded-full bg-[#315ff4] text-base font-medium leading-none text-white shadow-[0_6px_16px_rgba(49,95,244,.3)] transition-all duration-200 hover:rotate-90 hover:bg-[#244bd5]"
                    >
                      ×
                    </button>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:contents">
                      <FieldLabel
                        label="Email ID"
                        compact
                        error={hasEmailError ? "Email is required." : undefined}
                      >
                        <input
                          type="email"
                          value={value.email}
                          onChange={(event) =>
                            updateBusinessInfo({ email: event.target.value })
                          }
                          placeholder="you@example.com"
                          className={fieldClass(hasEmailError, true)}
                        />
                      </FieldLabel>
                      <FieldLabel
                        label="Mobile number"
                        compact
                        error={
                          hasMobileError
                            ? "Mobile number is required."
                            : undefined
                        }
                      >
                        <input
                          type="tel"
                          value={value.mobile}
                          onChange={(event) =>
                            updateBusinessInfo({ mobile: event.target.value })
                          }
                          placeholder="Your number"
                          className={fieldClass(hasMobileError, true)}
                        />
                      </FieldLabel>
                    </div>
                    <FieldLabel
                      label="Business address"
                      compact
                      error={
                        hasAddressError ? "Address is required." : undefined
                      }
                    >
                      <input
                        type="text"
                        value={value.address}
                        onChange={(event) =>
                          updateBusinessInfo({ address: event.target.value })
                        }
                        placeholder="Street, city, country"
                        className={fieldClass(hasAddressError, true)}
                      />
                    </FieldLabel>
                  </div>
                )}

                <div className="order-3 col-span-1 grid min-w-0 content-start gap-2 xl:col-start-3 xl:row-start-1">
                      <RadioGroup
                        legend="Do you already have a logo?"
                        name="has-logo"
                        value={value.hasLogo}
                        options={[
                          { value: "yes", label: "Yes, I do" },
                          { value: "no", label: "Not yet" },
                        ]}
                        hasError={hasLogoError}
                        onChange={(hasLogo) =>
                          updateBusinessInfo({
                            hasLogo,
                            ...(hasLogo !== "yes"
                              ? { logoName: "", logoImage: "" }
                              : {}),
                          })
                        }
                      />

                      {value.hasLogo === "yes" && (
                        <div className="animate-onboarding-swap">
                          <LogoUpload
                            fileName={value.logoName}
                            preview={logoPreview}
                            hasError={hasLogoUploadError}
                            uploading={logoUploading}
                            onChange={handleLogoChange}
                          />
                        </div>
                      )}
                </div>

                {!value.includeDetails && (
                  <button
                    type="button"
                    onClick={() => updateBusinessInfo({ includeDetails: true })}
                    className="order-4 col-span-1 inline-flex h-8 w-fit max-w-full items-center gap-2 justify-self-start rounded-md px-1 text-[13px] font-medium text-[#315ff4] transition hover:text-blue-800 md:col-span-2 xl:col-span-3 2xl:text-[15px]"
                  >
                    <span className="text-md leading-none">+</span>
                    Add more details
                    <span className="hidden font-normal text-slate-400 sm:inline">
                      — these will be used on your website
                    </span>
                  </button>
                )}
              </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
const fieldClass = (hasError: boolean, compact = false) =>
  `${compact ? "h-10 2xl:h-11" : "h-11 2xl:h-14"} min-w-0 w-full rounded-lg border bg-white px-3 text-[14px] leading-5 text-[#08132f] outline-none transition placeholder:text-[13px] placeholder:text-slate-400 focus:border-[#315ff4] focus:ring-3 focus:ring-blue-100/70 2xl:px-4 2xl:text-base 2xl:placeholder:text-[15px] ${hasError ? "border-red-400" : "border-slate-200"}`;

function DescriptionField({
  label,
  value,
  placeholder,
  hasError,
  errorMessage,
  aiError,
  generating,
  canGenerate,
  onGenerate,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  hasError: boolean;
  errorMessage: string;
  aiError: string;
  generating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid min-w-0 w-full content-start font-medium text-[#08132f] ${compact ? "gap-1.5 text-[14px] 2xl:text-[15px]" : "gap-2 text-[15px] 2xl:text-[17px]"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="block leading-normal">{label}</span>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          title={
            canGenerate
              ? "Generate description with AI"
              : "Enter website name first"
          }
          aria-label="Generate description with AI"
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-wait disabled:opacity-70"
        >
          {generating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          Generate
        </button>
      </div>
      <div className="relative min-w-0">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          rows={compact ? 2 : 3}
          minLength={MIN_DESCRIPTION_LENGTH}
          maxLength={300}
          placeholder={placeholder}
          className={`${fieldClass(hasError)} !h-auto ${compact ? "min-h-[52px] py-2 pb-6" : "min-h-[88px] py-2.5 pb-7"} resize-none`}
        />
        <span className="pointer-events-none absolute bottom-1.5 right-2.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {value.length}/300
        </span>
      </div>
      {hasError ? (
        <ErrorLine message={errorMessage} />
      ) : aiError ? (
        <p className="text-[11px] font-medium text-amber-700">{aiError}</p>
      ) : compact ? null : (
        <p className="text-[11px] font-normal text-slate-400">
          Required. Add a name, then tap Generate to draft your description.
        </p>
      )}
    </div>
  );
}

function FieldLabel({
  label,
  children,
  compact = false,
  error,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <label
      className={`grid min-w-0 content-start ${compact ? "gap-1.5" : "gap-2"} text-[15px] font-medium text-[#08132f] 2xl:text-[17px] ${className}`}
    >
      <span className="block leading-normal">{label}</span>
      <div className="min-w-0">{children}</div>
      {error && <ErrorLine message={error} />}
    </label>
  );
}

function LogoUpload({
  fileName,
  preview,
  hasError,
  uploading = false,
  onChange,
  compact = false,
}: {
  fileName: string;
  preview: string;
  hasError: boolean;
  uploading?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`block cursor-pointer rounded-lg border bg-white text-[#08132f] transition-all duration-300 ease-out hover:border-blue-300 focus-within:border-[#315ff4] focus-within:ring-2 focus-within:ring-blue-100 ${compact ? "p-1.5" : "p-2"} ${hasError ? "border-red-400" : "border-slate-200"
        }`}
    >
      <div className="flex items-center gap-2">
        {preview ? (
          <div
            className={`relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${compact ? "size-9" : "size-11"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-contain" />
          </div>
        ) : (
          <span
            className={`grid place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400 ${compact ? "size-9" : "size-11"}`}
          >
            {uploading ? (
              <Loader2 size={compact ? 14 : 16} className="animate-spin" />
            ) : (
              <ImagePlus size={compact ? 14 : 16} />
            )}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[#08132f]">
            {uploading
              ? "Uploading logo..."
              : fileName || "Upload your logo"}
          </p>
          {!compact && (
            <p className="text-[11px] text-slate-400">
              Used in header &amp; footer for every theme
            </p>
          )}
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChange}
        disabled={uploading}
      />
      {hasError && <ErrorLine message="Please choose your logo image." />}
    </label>
  );
}

function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  hasError,
  onChange,
  compact = false,
  equalHeight = false,
}: {
  legend: string;
  name: string;
  value: T | "";
  options: readonly { value: T; label: string; disabled?: boolean }[];
  hasError: boolean;
  onChange: (value: T) => void;
  compact?: boolean;
  equalHeight?: boolean;
}) {
  return (
    <fieldset className={equalHeight ? "flex h-full min-w-0 flex-col" : undefined}>
      <legend
        className={`font-medium text-[#08132f] ${compact ? "mb-1.5 text-[14px] 2xl:text-[15px]" : "mb-2 text-[15px] 2xl:mb-3 2xl:text-[17px]"}`}
      >
        {legend}
      </legend>
      <div
        className={`flex min-w-0 flex-wrap ${compact ? "gap-1.5" : "gap-2"} ${equalHeight ? "flex-1 items-stretch" : ""}`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = Boolean(option.disabled);

          return (
            <label
              key={option.value}
              title={
                isDisabled
                  ? "Not available for Campaign Page"
                  : undefined
              }
              aria-disabled={isDisabled}
              className={`whitespace-nowrap rounded-lg border font-medium transition ${equalHeight ? "inline-flex flex-1 items-center justify-center" : ""} ${compact ? (equalHeight ? "h-9 px-2 text-[11px] sm:text-[12px]" : "px-2.5 py-1.5 text-[12px]") : "px-3 py-2 text-[13px] 2xl:px-4 2xl:py-2.5 2xl:text-[15px]"} ${
                isDisabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70"
                  : isSelected
                    ? "cursor-pointer border-[#315ff4] bg-blue-50 text-[#315ff4] active:scale-[.97]"
                    : hasError
                      ? "cursor-pointer border-red-400 bg-white text-slate-700 active:scale-[.97]"
                      : "cursor-pointer border-blue-100 bg-white text-slate-700 shadow-sm hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 active:scale-[.97]"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => {
                  if (isDisabled) return;
                  onChange(option.value);
                }}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {hasError && <ErrorLine message="Please select an option." />}
    </fieldset>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <span
      role="alert"
      className="mt-1 flex items-center gap-1.5 text-[11px] font-medium leading-none text-red-500 animate-onboarding-swap"
    >
      <span className="h-px w-3 shrink-0 bg-red-500" aria-hidden="true" />
      {message}
    </span>
  );
}
