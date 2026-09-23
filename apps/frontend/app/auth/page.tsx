"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
  UserAuthProvider,
  useUserAuth,
} from "@/components/auth/UserAuthContext";
import {
  consumeAuthCancelUrl,
  consumeAuthReturnUrl,
  peekAuthReturnUrl,
  resolvePostAuthDestination,
} from "@/lib/authReturn";
import { getOnboardingContactPrefill } from "@/lib/syncOnboardingContactToProfile";

const inputClass =
  "h-full w-full rounded-xl border-0 bg-transparent px-4 pr-11 text-[14px] text-white outline-none placeholder:text-white/35 [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#121826_inset] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]";
const fieldClass =
  "relative flex h-[52px] items-center rounded-xl border border-white/10 bg-white/[0.04] transition focus-within:border-blue-400/50 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";

const buildPath = [
  {
    step: "01",
    title: "Your brief",
    desc: "Business and goals",
    tone: "text-cyan-300",
  },
  {
    step: "02",
    title: "AI composition",
    desc: "Pages and content",
    tone: "text-blue-300",
  },
  {
    step: "03",
    title: "Brand polish",
    desc: "Style and visuals",
    tone: "text-violet-300",
  },
  {
    step: "04",
    title: "Live website",
    desc: "Responsive and ready",
    tone: "text-emerald-300",
  },
] as const;

function AuthPageContent() {
  const router = useRouter();
  const { user, loading: authLoading, requestOtp, loginWithOtp } = useUserAuth();
  const [loginStep, setLoginStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const prefill = getOnboardingContactPrefill();
    if (prefill.email) setEmail(prefill.email);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      setError(oauthError);
      params.delete("oauth_error");
      const next = params.toString();
      window.history.replaceState(
        {},
        "",
        next ? `/auth?${next}` : "/auth",
      );
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      consumeAuthCancelUrl();
      const returnUrl = consumeAuthReturnUrl();
      router.replace(resolvePostAuthDestination(returnUrl));
    }
  }, [authLoading, router, user]);

  const startOAuth = (provider: "google" | "apple") => {
    setError("");
    const returnUrl = peekAuthReturnUrl();
    const dest = resolvePostAuthDestination(returnUrl);
    const qs = new URLSearchParams({ return: dest });
    window.location.assign(`/api/user/auth/${provider}?${qs.toString()}`);
  };

  const sendCode = async () => {
    setError("");
    setSubmitting(true);
    try {
      await requestOtp(email.trim());
      setOtp(["", "", "", "", "", ""]);
      setLoginStep("otp");
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send code");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (digits = otp) => {
    const code = digits.join("");
    if (code.length !== 6) return;
    setError("");
    setSubmitting(true);
    try {
      await loginWithOtp(email.trim(), code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const applyOtpValue = (next: string[]) => {
    setOtp(next);
    if (next.every(Boolean)) void verifyCode(next);
  };

  const handleCloseWithoutAuth = () => {
    consumeAuthCancelUrl();
    consumeAuthReturnUrl();
    router.replace("/");
  };

  return (
    <main className="h-dvh overflow-hidden bg-[#070b16] text-zinc-950">
      <section
        className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]"
        aria-label="Account access"
      >
        <aside className="relative hidden h-dvh min-w-0 overflow-hidden bg-[#020711] text-white lg:flex lg:flex-col">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 z-0 h-full w-full scale-105 object-cover object-[42%_center]"
            aria-hidden="true"
          >
            <source src="/auth.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 z-10 bg-[linear-gradient(105deg,rgba(2,7,17,.92)_0%,rgba(2,7,17,.72)_38%,rgba(2,7,17,.28)_68%,rgba(2,7,17,.18)_100%),linear-gradient(180deg,rgba(2,7,17,.35)_0%,transparent_28%,rgba(2,7,17,.55)_100%)]" />

          <div className="relative z-20 flex h-full flex-col justify-between px-[clamp(40px,5vw,88px)] py-[clamp(36px,6vh,72px)]">
            <div className="max-w-[640px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200 backdrop-blur-md before:size-1.5 before:rounded-full before:bg-blue-400 before:shadow-[0_0_12px_#4695ff]">
                Lestow AI Website Builder
              </div>
              <h1 className="mt-6 max-w-[620px] text-[clamp(40px,4.2vw,68px)] font-semibold leading-[0.98] tracking-[-0.045em] text-white [text-shadow:0_8px_40px_rgba(0,0,0,.55)]">
                One idea.
                <br />
                A complete{" "}
                <em className="font-serif font-bold not-italic text-blue-100">
                  website.
                </em>
              </h1>
              <p className="mt-5 max-w-[460px] text-[15px] font-medium leading-7 text-white/78 [text-shadow:0_2px_18px_rgba(0,0,0,.65)]">
                Describe your business and watch Lestow shape the structure,
                copy, visuals, and responsive experience in real time.
              </p>
            </div>

            <div className="max-w-[680px] rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">
                <span>Lestow build path</span>
                <span className="h-px flex-1 bg-gradient-to-r from-blue-300/60 to-transparent" />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {buildPath.map((item) => (
                  <div key={item.step} className="min-w-0">
                    <small
                      className={`text-[10px] font-bold tracking-wide ${item.tone}`}
                    >
                      {item.step}
                    </small>
                    <b className="mt-1.5 block truncate text-[13px] font-semibold text-white">
                      {item.title}
                    </b>
                    <em className="mt-1 block text-[12px] not-italic leading-4 text-white/55">
                      {item.desc}
                    </em>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-[#070b16] text-white">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/40 to-transparent lg:w-32" />
            <div className="absolute -right-24 top-16 size-[28rem] rounded-full bg-blue-600/20 blur-[100px]" />
            <div className="absolute -bottom-28 left-10 size-80 rounded-full bg-indigo-500/15 blur-[90px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.16),transparent_42%)]" />
            <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]" />
          </div>

          <div className="relative z-10 flex shrink-0 items-center justify-end px-6 pt-6 sm:px-9 sm:pt-8">
            <button
              type="button"
              onClick={handleCloseWithoutAuth}
              aria-label="Close and go back"
              title="Close"
              className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/5 text-white/70 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} strokeWidth={2.25} />
            </button>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 pb-10 sm:px-9 lg:px-12">
            <div className="w-full max-w-[400px] 2xl:max-w-[430px]">
              <div className="mb-8 flex justify-center">
                <Link
                  href="/"
                  aria-label="Lestow home"
                  className="relative block h-11 w-[148px] brightness-0 invert"
                >
                  <Image
                    src="/lestow-logo.svg"
                    alt="Lestow AI Website Builder"
                    fill
                    priority
                    className="object-contain"
                  />
                </Link>
              </div>

              <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight text-white">
                Log in with email
              </h2>
              <p className="mb-7 text-center text-sm text-white/55">
                {loginStep === "otp"
                  ? `We sent a 6-digit code to ${email.trim()}.`
                  : "We'll send a 6-digit code. No password needed."}
              </p>

              {loginStep === "email" ? (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendCode();
                  }}
                >
                  <Field label="Email">
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputClass}
                      required
                    />
                    <Mail className="absolute right-4 size-4 text-white/35" />
                  </Field>

                  {error ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[12px] font-medium text-red-200"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting || authLoading}
                    className="group relative mt-1 h-[54px] overflow-hidden rounded-full bg-white text-[15px] font-semibold text-[#08101f] shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(59,130,246,0.18)_50%,transparent_80%)] opacity-0 transition group-hover:opacity-100" />
                    <span className="relative">
                      {submitting ? "Sending..." : "Send login code"}
                    </span>
                  </button>
                </form>
              ) : (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void verifyCode();
                  }}
                >
                  <fieldset>
                    <legend className="mb-2 text-[12px] font-medium tracking-wide text-white/65">
                      Verification code
                    </legend>
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
                          className="h-[52px] rounded-xl border border-white/10 bg-white/[0.04] text-center text-lg font-semibold text-white outline-none transition focus:border-blue-400/50 focus:bg-white/[0.07]"
                          onChange={(event) => {
                            const value = event.target.value
                              .replace(/\D/g, "")
                              .slice(-1);
                            const next = [...otp];
                            next[index] = value;
                            applyOtpValue(next);
                            if (value) otpRefs.current[index + 1]?.focus();
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Backspace" &&
                              !otp[index] &&
                              index > 0
                            ) {
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
                  </fieldset>

                  {error ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[12px] font-medium text-red-200"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={
                      submitting || authLoading || otp.join("").length !== 6
                    }
                    className="group relative mt-1 h-[54px] overflow-hidden rounded-full bg-white text-[15px] font-semibold text-[#08101f] shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(59,130,246,0.18)_50%,transparent_80%)] opacity-0 transition group-hover:opacity-100" />
                    <span className="relative">
                      {submitting ? "Signing in..." : "Start creating"}
                    </span>
                  </button>

                  <div className="flex items-center justify-between pt-1 text-[12px]">
                    <button
                      type="button"
                      className="font-medium text-white/50 transition hover:text-white"
                      onClick={() => {
                        setLoginStep("email");
                        setOtp(["", "", "", "", "", ""]);
                        setError("");
                      }}
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      className="font-semibold text-blue-300 transition hover:text-blue-200 disabled:opacity-60"
                      onClick={() => void sendCode()}
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}

              <div className="my-7 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
                Or
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => startOAuth("google")}
                  aria-label="Login with Google"
                  title="Login with Google"
                  className="grid size-12 place-items-center rounded-full border border-white/12 bg-white/[0.04] transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <FcGoogle className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => startOAuth("apple")}
                  aria-label="Login with Apple"
                  title="Login with Apple"
                  className="grid size-12 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <FaApple className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <label
      className={`grid ${compact ? "gap-1" : "gap-2"} text-[12px] font-medium tracking-wide text-white/65`}
    >
      <span>{label}</span>
      <span className={`${fieldClass} ${compact ? "!h-10" : ""}`}>
        {children}
      </span>
    </label>
  );
}

export default function AuthPage() {
  return (
    <UserAuthProvider>
      <AuthPageContent />
    </UserAuthProvider>
  );
}
