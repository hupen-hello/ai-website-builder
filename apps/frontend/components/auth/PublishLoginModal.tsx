"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import BrandLogo from "@/components/ui/brand-logo";
import { useUserAuth } from "./UserAuthContext";
import { getOnboardingContactPrefill } from "@/lib/syncOnboardingContactToProfile";

type PublishLoginModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
  title?: string;
  description?: string;
  initialMode?: "login" | "register";
};

const subscribeToClientMount = () => () => {};

export default function PublishLoginModal({
  open,
  onClose,
  onAuthenticated,
  title = "Login to continue",
  description = "Enter your email and we'll send a 6-digit login code.",
}: PublishLoginModalProps) {
  const { requestOtp, loginWithOtp } = useUserAuth();
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    () => true,
    () => false,
  );
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    const prefill = getOnboardingContactPrefill();
    if (prefill.email) setEmail(prefill.email);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const handleClose = () => {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    onClose();
  };

  const handleSendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await requestOtp(email.trim());
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (codeDigits = otp) => {
    const code = codeDigits.join("");
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await loginWithOtp(email.trim(), code);
      onAuthenticated?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const applyOtpValue = (next: string[]) => {
    setOtp(next);
    if (next.every(Boolean)) {
      void handleVerify(next);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-login-title"
    >
      <button
        type="button"
        aria-label="Close login dialog"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white px-6 pb-7 pt-8 text-center shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mb-5 flex justify-center">
          <BrandLogo />
        </div>

        <h2
          id="publish-login-title"
          className="text-xl font-bold text-slate-900"
        >
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
          {step === "otp"
            ? `We sent a 6-digit code to ${email.trim()}.`
            : description}
        </p>

        {step === "email" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSendCode();
            }}
            className="mt-5 space-y-3 text-left"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
            />

            {error ? (
              <p className="text-center text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold hover:bg-blue-700"
            >
              {loading ? "Sending..." : "Send login code"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleVerify();
            }}
            className="mt-5 space-y-3 text-left"
          >
            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    otpRefs.current[index] = node;
                  }}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${index + 1}`}
                  className="h-11 rounded-xl border border-slate-200 text-center text-lg font-semibold outline-none focus:border-blue-400"
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, "").slice(-1);
                    const next = [...otp];
                    next[index] = value;
                    applyOtpValue(next);
                    if (value) otpRefs.current[index + 1]?.focus();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !otp[index] && index > 0) {
                      otpRefs.current[index - 1]?.focus();
                    }
                  }}
                  onPaste={(event) => {
                    const digits = event.clipboardData
                      .getData("text")
                      .replace(/\D/g, "")
                      .slice(0, 6)
                      .split("");
                    if (!digits.length) return;
                    event.preventDefault();
                    const next = ["", "", "", "", "", ""];
                    digits.forEach((item, i) => {
                      next[i] = item;
                    });
                    applyOtpValue(next);
                    otpRefs.current[Math.min(digits.length, 5)]?.focus();
                  }}
                />
              ))}
            </div>

            {error ? (
              <p className="text-center text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={loading || otp.join("").length !== 6}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold hover:bg-blue-700"
            >
              {loading ? "Please wait..." : "Login"}
            </Button>

            <div className="flex items-center justify-between pt-1 text-sm">
              <button
                type="button"
                className="font-medium text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
              >
                Change email
              </button>
              <button
                type="button"
                disabled={loading}
                className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60"
                onClick={() => void handleSendCode()}
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
