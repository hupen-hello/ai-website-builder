"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import Image from "next/image";
import { X } from "lucide-react";

type LoginPublishModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEMO_OTP = "1234";
const OTP_LENGTH = 4;

type LoginStep = "email" | "otp";

export default function LoginPublishModal({ open, onClose, onLogin }: LoginPublishModalProps) {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setStep("email");
      setEmail("");
      setOtp(["", "", "", ""]);
      setError("");
    });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || step !== "otp") return;
    otpRefs.current[0]?.focus();
  }, [open, step]);

  if (!open) return null;

  const submitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!EMAIL_PATTERN.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setOtp(["", "", "", ""]);
    setStep("otp");
  };

  const updateOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (error) setError("");
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = ["", "", "", ""];
    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  const submitOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Enter the 4-digit login code.");
      return;
    }
    if (code !== DEMO_OTP) {
      setError("Invalid code. Use 1 2 3 4 for this demo.");
      return;
    }
    onLogin(email.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-publish-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] rounded-[28px] bg-white px-6 py-8 text-slate-900 shadow-[0_40px_120px_rgba(8,19,47,.28)] sm:px-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close login dialog"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>

        <div className="flex justify-center">
          <Image
            src="/lestow-logo.svg"
            alt="Lestow"
            width={148}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        {step === "email" ? (
          <>
            <h2
              id="login-publish-title"
              className="mt-6 text-center text-xl font-bold tracking-[-0.02em] text-[#08132f]"
            >
              Login to publish your website
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              Enter your email and we&apos;ll send a 4-digit login code.
            </p>

            <form className="mt-6" onSubmit={submitEmail}>
              <label className="sr-only" htmlFor="publish-email">
                Email
              </label>
              <input
                id="publish-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                placeholder="Email"
                autoComplete="email"
                className="h-12 w-full rounded-full border border-slate-200 px-5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {error ? <p className="mt-2 px-2 text-xs text-red-500">{error}</p> : null}

              <button
                type="submit"
                className="mt-4 h-12 w-full rounded-full bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Send login code
              </button>
            </form>
          </>
        ) : (
          <>
            <h2
              id="login-publish-title"
              className="mt-6 text-center text-xl font-bold tracking-[-0.02em] text-[#08132f]"
            >
              Enter login code
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              We sent a 4-digit code to <span className="font-medium text-slate-700">{email}</span>.
              Demo code is 1 2 3 4.
            </p>

            <form className="mt-6" onSubmit={submitOtp}>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${index + 1}`}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    className="h-14 w-12 rounded-xl border border-slate-200 text-center text-xl font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                ))}
              </div>
              {error ? <p className="mt-3 text-center text-xs text-red-500">{error}</p> : null}

              <button
                type="submit"
                className="mt-5 h-12 w-full rounded-full bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Verify code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", ""]);
                  setError("");
                }}
                className="mt-3 w-full text-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                Use a different email
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
