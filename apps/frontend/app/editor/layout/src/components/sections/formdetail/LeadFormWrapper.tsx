"use client";

import { FormEvent, useState } from "react";
import type { LeadCaptureContext } from "../../../types/section";

type LeadFormWrapperProps = {
  leadCapture?: LeadCaptureContext;
  className?: string;
  children: React.ReactNode;
  onSuccess?: () => void;
};

export default function LeadFormWrapper({
  leadCapture,
  className,
  children,
  onSuccess,
}: LeadFormWrapperProps) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!leadCapture) {
    return className ? <div className={className}>{children}</div> : children;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("idle");
      return;
    }

    const formData = new FormData(form);
    const fields: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        fields[key] = value;
      }
    });

    try {
      const response = await fetch(
        `/api/published/${encodeURIComponent(leadCapture.siteSlug)}/leads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formName: leadCapture.formName,
            formSection: leadCapture.formSection,
            formPage: leadCapture.formPage,
            fields,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Unable to submit form",
        );
      }

      setStatus("success");
      form.reset();
      onSuccess?.();
      if (!onSuccess && leadCapture?.siteSlug && typeof window !== "undefined") {
        window.location.href = `/published/${encodeURIComponent(leadCapture.siteSlug)}/thank-you`;
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit form",
      );
    }
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children}
      {status === "success" && !onSuccess && (
        <p className="mt-3 text-sm font-medium text-emerald-600" role="status">
          Thank you! Your message has been sent.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
