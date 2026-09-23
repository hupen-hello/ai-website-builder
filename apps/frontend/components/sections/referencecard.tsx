"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Briefcase, Check, Loader2, Sparkles, User, Users } from "lucide-react";
import Image from "next/image";

type Category = "clients" | "myself" | "company";

type BusinessInfo = {
    audience: "" | Category;
    name: string;
    hasExistingSite: "" | "yes" | "no";
    domainName: string;
    domainVerified: boolean;
    referenceName: string;
    referenceVerified: boolean;
    vision: string;
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
};

type CategoryStepProps = {
    value: BusinessInfo;
    showErrors: boolean;
    onChange: (value: BusinessInfo) => void;
};

const categories = [
    {
        id: "clients",
        title: "Client",
        subtitle: "Agency",
        icon: Users,
        labels: {
            name: "Client Name",
            namePlaceholder: "Enter client website name",
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
            namePlaceholder: "Enter your website name",
        },
        image: "/onboarding-myself.png",
    },
    {
        id: "company",
        title: "My Company",
        subtitle: "Business",
        icon: Briefcase,
        labels: {
            name: "Business Name",
            namePlaceholder: "Enter your business name",
        },
        image: "/onboarding-company.png",
    },
] as const;

const defaultLabels = {
    name: "Website Name",
    namePlaceholder: "Enter website name",
};

const looksLikeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    try {
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        const { hostname } = new URL(withProtocol);
        return hostname.includes(".") && hostname.split(".").pop()!.length >= 2;
    } catch {
        return false;
    }
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
const isValidPhone = (phone: string) => /^\d{7,15}$/.test(phone);

export default function ReferenceCard({
    value,
    showErrors,
    onChange,
}: CategoryStepProps) {
    const [selected, setSelected] = useState<"" | Category>(value.audience);
    const [checkingUrl, setCheckingUrl] = useState(false);
    const [urlErrors, setUrlErrors] = useState<{ domain?: string }>({});
    const [generatingVision, setGeneratingVision] = useState(false);
    const [visionAiError, setVisionAiError] = useState("");
    const visionAreaRef = useRef<HTMLTextAreaElement>(null);
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const active = categories.find((item) => item.id === selected);
    const labels = active?.labels ?? defaultLabels;
    const showContactDetails = value.includeDetails;

    const hasAudienceError = showErrors && !value.audience;
    const hasNameError = showErrors && !value.name.trim();
    const hasVisionError = showErrors && !value.vision.trim();
    const hasDomainRequiredError = showErrors && !value.domainName.trim();
    const hasDomainVerificationError =
      showErrors && Boolean(value.domainName.trim()) && !value.domainVerified;
    const hasEmailError = showErrors && value.includeDetails && !isValidEmail(value.email);
    const hasMobileError = showErrors && value.includeDetails && !isValidPhone(value.mobile);
    const hasAddressError = showErrors && value.includeDetails && !value.address.trim();
    const domainError = urlErrors.domain || (hasDomainRequiredError
        ? "Domain Link is required."
        : hasDomainVerificationError
            ? "Check this URL before continuing."
            : undefined);

    const updateBusinessInfo = (nextValue: Partial<BusinessInfo>) => {
        onChange({
          ...valueRef.current,
          hasExistingSite: "yes",
          referenceName: "",
          referenceVerified: false,
          ...nextValue,
        });
    };

    const generateVisionWithAi = async () => {
        if (generatingVision) return;
        setVisionAiError("");

        const current = valueRef.current;
        if (!current.name.trim() && !current.domainName.trim()) {
            setVisionAiError("Enter a name or domain link first, then generate.");
            return;
        }

        setGeneratingVision(true);
        try {
            const res = await fetch("/api/ai/generate-vision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: current.name,
                    domainUrl: current.domainName,
                    referenceUrl: "",
                    audience: current.audience,
                    existingVision: current.vision,
                }),
            });
            const data = (await res.json().catch(() => ({}))) as {
                vision?: string;
                message?: string;
                fallback?: boolean;
            };
            if (!res.ok || !data.vision?.trim()) {
                setVisionAiError(
                    data.message || "Unable to generate vision. Try again.",
                );
                return;
            }
            updateBusinessInfo({ vision: data.vision.trim() });
            if (data.fallback && data.message) {
                setVisionAiError(data.message);
            }
        } catch {
            setVisionAiError("Unable to generate vision. Try again.");
        } finally {
            setGeneratingVision(false);
        }
    };

    const checkUrl = useCallback(async (urlOverride?: string, signal?: AbortSignal) => {
        const current = valueRef.current;
        const url = urlOverride ?? current.domainName;

        if (!url.trim()) {
            setUrlErrors((errors) => ({ ...errors, domain: "Enter a URL before checking." }));
            onChange({ ...current, domainVerified: false });
            return;
        }

        setCheckingUrl(true);
        setUrlErrors((errors) => ({ ...errors, domain: undefined }));

        try {
            const response = await fetch("/api/check-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
                signal,
            });
            const result = await response.json() as { valid?: boolean; normalizedUrl?: string; message?: string };

            if (!response.ok || !result.valid) {
                onChange({ ...valueRef.current, domainVerified: false });
                setUrlErrors((errors) => ({
                    ...errors,
                    domain: result.message || "This URL could not be reached.",
                }));
                return;
            }

            onChange({
                ...valueRef.current,
                domainVerified: true,
                domainName: result.normalizedUrl || url,
                hasExistingSite: "yes",
                referenceName: "",
                referenceVerified: false,
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            onChange({ ...valueRef.current, domainVerified: false });
            setUrlErrors((errors) => ({ ...errors, domain: "Unable to check this URL. Try again." }));
        } finally {
            if (!signal?.aborted) setCheckingUrl(false);
        }
    }, [onChange]);

    useEffect(() => {
        const url = value.domainName.trim();
        if (!looksLikeUrl(url)) {
            queueMicrotask(() => setCheckingUrl(false));
            return;
        }
        if (value.domainVerified) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void checkUrl(url, controller.signal);
        }, 700);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [value.domainName, value.domainVerified, checkUrl]);

    return (
        <section className="relative mx-auto max-h-[calc(100dvh-156px)] w-full origin-center overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(23,38,76,.08)]">
            <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-8 2xl:px-9">
                <div>
                    <div className="flex shrink-0 justify-center items-center gap-3 border-slate-200 pb-5">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold tracking-[-.035em] text-[#08132f] sm:text-2xl">
                                {"Let's"} start with your business{" "}
                                <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                                  Redesign existing website
                                </span>
                            </h2>
                            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                Enter your live domain — we pull logo, images, content, and menu from that site only.
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
                                        className={`group relative flex min-h-[70px] md:min-h-[82px] items-center justify-start gap-3 overflow-hidden rounded-lg border px-3 pr-14 text-left transition-all duration-500 ease-out active:scale-[.985] sm:px-4 sm:pr-[74px] 2xl:min-h-[90px] 2xl:px-5 2xl:pr-24 ${isActive
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
                            className="mt-5 grid items-start gap-y-5 2xl:mt-10 2xl:gap-y-6"
                            onSubmit={(event) => event.preventDefault()}
                        >
                            <div className="grid min-w-0 grid-cols-1 content-start items-end gap-x-3 gap-y-5 sm:grid-cols-2 2xl:gap-y-6">
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

                                <FieldLabel
                                    label="Existing website URL"
                                    error={domainError}
                                >
                                    <div className="relative">
                                        <input
                                            value={value.domainName}
                                            onChange={(event) => {
                                                updateBusinessInfo({ domainName: event.target.value, domainVerified: false });
                                                setUrlErrors((current) => ({ ...current, domain: undefined }));
                                            }}
                                            onBlur={() => {
                                                if (looksLikeUrl(value.domainName) && !value.domainVerified) {
                                                    void checkUrl();
                                                }
                                            }}
                                            type="url"
                                            placeholder="https://your-website.com"
                                            className={`${fieldClass(Boolean(domainError))} pr-28`}
                                        />
                                        <UrlCheckerButton
                                            checking={checkingUrl}
                                            verified={value.domainVerified}
                                            disabled={!value.domainName.trim()}
                                            onClick={() => void checkUrl()}
                                        />
                                    </div>
                                </FieldLabel>
                            </div>

                            <div className="grid min-w-0 grid-cols-1 content-start gap-2 text-[15px] font-medium text-[#08132f] 2xl:text-[17px]">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="block leading-normal">
                                            Your vision for the website
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => void generateVisionWithAi()}
                                            disabled={generatingVision}
                                            title={
                                                value.name.trim() || value.domainName.trim()
                                                    ? "Generate vision with AI"
                                                    : "Add a name or domain, then generate"
                                            }
                                            aria-label="Generate vision with AI"
                                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-wait disabled:opacity-70 2xl:h-9 2xl:text-xs"
                                        >
                                            {generatingVision ? (
                                                <Loader2 size={13} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={13} />
                                            )}
                                            Generate
                                        </button>
                                    </div>
                                    <div className="min-w-0">
                                        <textarea
                                            ref={visionAreaRef}
                                            value={value.vision}
                                            onChange={(event) => {
                                                setVisionAiError("");
                                                updateBusinessInfo({ vision: event.target.value });
                                            }}
                                            placeholder="Describe your vision for the website"
                                            rows={4}
                                            className={visionFieldClass(hasVisionError)}
                                        />
                                    </div>
                                    {visionAiError && <ErrorLine message={visionAiError} />}
                                    {hasVisionError && (
                                        <ErrorLine message="This field is required." />
                                    )}
                            </div>

                            {showContactDetails && (
                                <div className="min-w-0 animate-onboarding-swap space-y-3">
                                    <p className="text-[15px] font-semibold leading-snug text-[#08132f] 2xl:text-[17px]">
                                        These details will be used on your website.
                                    </p>
                                    <div className="grid min-w-0 grid-cols-1 content-start gap-3 md:grid-cols-3">
                                    <FieldLabel
                                        label="Email ID"
                                        error={
                                            hasEmailError
                                                ? value.email.trim()
                                                    ? "Enter a valid email address."
                                                    : "Email is required."
                                                : undefined
                                        }
                                    >
                                        <input
                                            type="email"
                                            value={value.email}
                                            onChange={(event) =>
                                                updateBusinessInfo({
                                                    email: event.target.value,
                                                })
                                            }
                                            placeholder="you@example.com"
                                            className={fieldClass(hasEmailError)}
                                        />
                                    </FieldLabel>

                                    <FieldLabel
                                        label="Number"
                                        error={
                                            hasMobileError
                                                ? value.mobile
                                                    ? "Enter a valid 7–15 digit number."
                                                    : "Number is required."
                                                : undefined
                                        }
                                    >
                                        <input
                                            type="tel"
                                            value={value.mobile}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            onChange={(event) =>
                                                updateBusinessInfo({
                                                    mobile: event.target.value.replace(/\D/g, ""),
                                                })
                                            }
                                            placeholder="Your number"
                                            className={fieldClass(hasMobileError)}
                                        />
                                    </FieldLabel>

                                    <FieldLabel
                                        label="Address"
                                        error={
                                            hasAddressError ? "Address is required." : undefined
                                        }
                                    >
                                        <input
                                            type="text"
                                            value={value.address}
                                            onChange={(event) =>
                                                updateBusinessInfo({
                                                    address: event.target.value,
                                                })
                                            }
                                            placeholder="Street, city, country"
                                            className={fieldClass(hasAddressError)}
                                        />
                                    </FieldLabel>
                                    </div>
                                </div>
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

const visionFieldClass = (hasError: boolean) =>
    `h-11 min-h-11 w-full min-w-0 resize-y rounded-lg border bg-white px-3 py-2.5 text-[14px] leading-5 text-[#08132f] outline-none transition placeholder:text-[13px] placeholder:text-slate-400 focus:border-[#315ff4] focus:ring-3 focus:ring-blue-100/70 2xl:h-14 2xl:min-h-14 2xl:px-4 2xl:text-base 2xl:placeholder:text-[15px] ${hasError ? "border-red-400" : "border-slate-200"}`;

function UrlCheckerButton({
    checking,
    verified,
    disabled,
    onClick,
    className,
}: {
    checking: boolean;
    verified: boolean;
    disabled: boolean;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            disabled={disabled || checking}
            onClick={onClick}
            className={`absolute right-1.5 h-8 rounded-md px-3 text-[11px] font-semibold transition 2xl:h-10 2xl:text-xs ${className ?? "top-1/2 -translate-y-1/2"} ${verified
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                }`}
        >
            {checking ? "Checking..." : verified ? "Checked" : "URL Checker"}
        </button>
    );
}

function FieldLabel({
    label,
    children,
    compact = false,
    fill = false,
    error,
}: {
    label: React.ReactNode;
    children: React.ReactNode;
    compact?: boolean;
    fill?: boolean;
    error?: string;
}) {
    return (
        <label
            className={`grid min-w-0 content-start ${fill ? "h-full grid-rows-[auto_minmax(0,1fr)]" : ""} ${compact ? "gap-1.5" : "gap-2"} text-[15px] font-medium text-[#08132f] 2xl:text-[17px]`}
        >
            <span className="block leading-normal">{label}</span>
            <div className={`min-w-0 ${fill ? "h-full" : ""}`}>{children}</div>
            {error && <ErrorLine message={error} />}
        </label>
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
