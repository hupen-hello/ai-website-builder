"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Check,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useUserAuth } from "@/components/auth/UserAuthContext";

const EXTRA_STORAGE_KEY = "css-user-profile-extras";

type LocalProfileExtras = {
  gender?: string;
  birthday?: string;
  phone?: string;
  nationality?: string;
  location?: string;
  address?: string;
};

function loadLegacyExtras(userId: string): LocalProfileExtras {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${EXTRA_STORAGE_KEY}:${userId}`);
    if (!raw) return {};
    return JSON.parse(raw) as LocalProfileExtras;
  } catch {
    return {};
  }
}

function clearLegacyExtras(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${EXTRA_STORAGE_KEY}:${userId}`);
  } catch {
    /* ignore */
  }
}

export default function ProfileTab() {
  const router = useRouter();
  const { user, loading, updateProfile, uploadAvatar, logout } = useUserAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    avatar: "",
    gender: "",
    birthday: "",
    phone: "",
    nationality: "",
    password: "",
    currentPassword: "",
    location: "",
    address: "",
  });
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAvatarFile = useRef<File | null>(null);

  useEffect(() => {
    if (!user) return;
    const legacy = loadLegacyExtras(user.id);
    setForm((current) => ({
      ...current,
      name: user.name || "",
      email: user.email,
      avatar: user.avatarUrl || "",
      gender: user.gender || legacy.gender || "",
      birthday: user.birthday || legacy.birthday || "",
      phone: user.phone || legacy.phone || "",
      nationality: user.nationality || legacy.nationality || "",
      location: user.location || legacy.location || "",
      address: user.address || legacy.address || "",
      password: "",
      currentPassword: "",
    }));
    pendingAvatarFile.current = null;
  }, [user]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 4000);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    pendingAvatarFile.current = file;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((current) => ({ ...current, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setError("");
    setSaving(true);

    try {
      if (form.password && !form.currentPassword) {
        throw new Error("Enter your current password to set a new password.");
      }

      if (pendingAvatarFile.current) {
        await uploadAvatar(pendingAvatarFile.current);
        pendingAvatarFile.current = null;
      }

      await updateProfile({
        name: form.name.trim() || undefined,
        gender: form.gender,
        birthday: form.birthday,
        phone: form.phone,
        nationality: form.nationality,
        location: form.location,
        address: form.address,
        ...(form.password
          ? {
              currentPassword: form.currentPassword,
              newPassword: form.password,
            }
          : {}),
      });

      clearLegacyExtras(user.id);

      setEditing(false);
      setShowSuccess(true);
      setForm((current) => ({
        ...current,
        password: "",
        currentPassword: "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "name", label: "Full name", type: "text" },
    { key: "email", label: "Email address", type: "email" },
    { key: "gender", label: "Gender", type: "text" },
    { key: "birthday", label: "Date of birth", type: "date" },
    { key: "phone", label: "Phone number", type: "tel" },
    { key: "nationality", label: "Nationality", type: "text" },
    ...(editing && form.password
      ? [{ key: "currentPassword", label: "Current password", type: "password" }]
      : []),
    { key: "password", label: "Change password", type: "password" },
    { key: "location", label: "Location", type: "text" },
    { key: "address", label: "Address", type: "text" },
  ] as const;

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
        <div className="h-[520px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100" />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-950">Profile</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Sign in to view and edit your profile.
          </p>
        </div>
      </section>
    );
  }

  const avatarSrc = form.avatar || user.avatarUrl || "";

  return (
    <>
      <form
        onSubmit={submit}
        className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9"
      >
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="relative h-36 overflow-hidden bg-[#d9efff] sm:h-44">
            <svg
              aria-label="Animated blue profile banner"
              viewBox="0 0 1200 300"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <linearGradient id="profileBanner" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#dff5ff" />
                  <stop offset=".48" stopColor="#9fd5ff" />
                  <stop offset="1" stopColor="#d9e4ff" />
                </linearGradient>
                <linearGradient id="profileBeam" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#ffffff" stopOpacity=".08" />
                  <stop offset=".5" stopColor="#ffffff" stopOpacity=".7" />
                  <stop offset="1" stopColor="#4b8cff" stopOpacity=".12" />
                </linearGradient>
              </defs>
              <rect width="1200" height="300" fill="url(#profileBanner)" />
              <g opacity=".48">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="-120 0;120 0;-120 0"
                  dur="9s"
                  repeatCount="indefinite"
                />
                <path d="M80 0h155L85 300H-70z" fill="url(#profileBeam)" />
                <path d="M360 0h170L380 300H210z" fill="url(#profileBeam)" />
                <path d="M690 0h190L730 300H540z" fill="url(#profileBeam)" />
                <path d="M1010 0h180l-150 300H860z" fill="url(#profileBeam)" />
              </g>
              <circle cx="1060" cy="68" r="9" fill="#fff" opacity=".65">
                <animate
                  attributeName="opacity"
                  values=".2;.9;.2"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="160" cy="55" r="6" fill="#fff" opacity=".7">
                <animate
                  attributeName="opacity"
                  values=".8;.25;.8"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-blue-200/20" />
          </div>
          <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-8">
            <div className="relative -mt-14 size-28 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative size-28 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-xl"
                aria-label="Change profile photo"
              >
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={form.name || user.email}
                    fill
                    unoptimized
                    className="object-cover object-[55%_42%] transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-blue-100 text-2xl font-semibold text-blue-700">
                    {(form.name || user.email).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-zinc-950/0 text-white transition group-hover:bg-zinc-950/35">
                  <Camera
                    className="translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
                    size={24}
                  />
                </span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile photo"
                className="absolute -bottom-1 -right-1 z-10 grid size-9 cursor-pointer place-items-center rounded-full border-[3px] border-white bg-blue-700 text-white shadow-lg transition hover:scale-110 hover:bg-blue-800"
              >
                <Camera size={16} strokeWidth={2.4} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="hidden"
            />
            <div className="min-w-0 flex-1 sm:pb-1">
              <h2 className="text-xl font-semibold">Profile</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Click your photo to choose a new image from your device.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-xl bg-zinc-900 px-5 text-xs font-medium text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:translate-y-0 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>

        <section className="mt-5 w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center">
            <div>
              <h3 className="text-sm font-semibold">Personal information</h3>
              <p className="mt-1 text-[11px] text-zinc-500">
                {editing
                  ? "You can now update your personal details."
                  : "This information is read-only until you click edit."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              aria-label={
                editing ? "Stop editing profile" : "Edit profile details"
              }
              className={`ml-auto grid size-9 cursor-pointer place-items-center rounded-xl transition ${editing ? "rotate-[-8deg] bg-blue-700 text-white shadow-lg shadow-blue-200" : "bg-blue-50 text-blue-700 hover:scale-105 hover:bg-blue-100"}`}
            >
              <Pencil size={16} />
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fields.map((field) => (
              <label
                key={field.key}
                className={`${field.key === "address" ? "md:col-span-2 xl:col-span-3" : ""} grid gap-1.5 text-[14px] font-medium text-zinc-500`}
              >
                {field.label}
                <span className="relative">
                  <input
                    disabled={!editing || field.key === "email"}
                    type={
                      field.key === "password" && showPassword
                        ? "text"
                        : field.key === "currentPassword" && showCurrentPassword
                          ? "text"
                          : field.type
                    }
                    value={form[field.key as keyof typeof form]}
                    placeholder={
                      field.key === "password"
                        ? "Enter a new password"
                        : field.key === "currentPassword"
                          ? "Enter current password"
                          : undefined
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    className={`h-11 w-full min-w-0 rounded-xl border px-3 text-xs font-medium outline-none transition ${field.key === "password" || field.key === "currentPassword" ? "pr-11" : ""} ${editing && field.key !== "email" ? "border-blue-200 bg-white text-zinc-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" : "cursor-not-allowed border-zinc-200 bg-zinc-50/70 text-zinc-500 disabled:opacity-100"}`}
                  />
                  {field.key === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-zinc-400 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                  {field.key === "currentPassword" && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword((visible) => !visible)
                      }
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                      className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-zinc-400 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  )}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={18} />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900">
                Delete account
              </h3>
              <p className="mt-1 max-w-2xl text-[13px] leading-5 text-zinc-500">
                Your account, websites, saved assets, and subscription data will
                be permanently deleted. This action is irreversible and cannot
                be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="h-9 rounded-xl bg-red-50 px-4 text-xs font-medium text-red-700 transition hover:bg-red-600 hover:text-white"
            >
              Delete account
            </button>
          </div>
        </section>
      </form>

      {deleteOpen && (
        <div className="fixed inset-0 z-[130] grid place-items-center overflow-y-auto bg-zinc-900/25 p-4 backdrop-blur-sm animate-[editorFadeIn_180ms_ease-out]">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,.28)] sm:p-8"
          >
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              aria-label="Close delete account dialog"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900"
            >
              <X size={17} />
            </button>
            <h2
              id="delete-account-title"
              className="pr-10 text-xl font-semibold"
            >
              Delete account
            </h2>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Your account and all associated websites will be permanently
              deleted. Active subscriptions will be cancelled immediately.
            </p>
            <p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[11px] leading-5 text-blue-800">
              After deletion, you can create a new account using the same email
              address after 2 days.
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertTriangle className="mt-0.5 shrink-0" size={16} />
              <span>This action cannot be undone.</span>
            </div>
            <label className="mt-5 grid gap-2 text-xs font-medium text-zinc-700">
              Enter your account name <strong>{form.name}</strong> to confirm.
              <input
                value={deleteName}
                onChange={(event) => setDeleteName(event.target.value)}
                placeholder="Account name"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-xs font-normal outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
              />
            </label>
            <label className="mt-4 grid gap-2 text-xs font-medium leading-5 text-zinc-700">
              Type <strong>DELETE MY ACCOUNT</strong> below.
              <input
                value={deletePhrase}
                onChange={(event) => setDeletePhrase(event.target.value)}
                placeholder="Verification phrase"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-xs font-normal outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
              />
            </label>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="h-10 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteName !== form.name ||
                  deletePhrase !== "DELETE MY ACCOUNT"
                }
                onClick={() => {
                  void (async () => {
                    await logout();
                    router.push("/");
                  })();
                }}
                className="h-10 rounded-xl bg-red-600 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-100 disabled:text-red-400"
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#010208] animate-[editorFadeIn_300ms_ease-out]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -inset-x-[20%] -top-[45%] h-[145%] opacity-95 [background:repeating-linear-gradient(118deg,transparent_0%,transparent_8%,rgba(0,24,115,.25)_10%,rgba(0,54,220,.85)_14%,rgba(0,113,255,.95)_17%,rgba(0,35,170,.4)_20%,transparent_23%,transparent_31%)] [filter:drop-shadow(0_0_28px_rgba(0,80,255,.55))]" />
            <div className="absolute -bottom-[62%] left-[38%] h-[95%] w-[75%] opacity-45 [background:repeating-linear-gradient(110deg,transparent_0%,transparent_9%,rgba(0,35,160,.35)_12%,rgba(0,91,255,.75)_15%,transparent_19%,transparent_25%)] blur-[2px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(5,32,155,.18),transparent_28%),linear-gradient(180deg,rgba(0,0,0,.04)_0%,rgba(0,0,0,.16)_55%,rgba(0,0,0,.78)_100%)]" />
            <div className="absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-black/70 to-transparent" />
          </div>
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            aria-label="Close profile confirmation"
            className="fixed right-4 top-4 z-20 grid size-11 cursor-pointer place-items-center rounded-full border border-white/50 bg-white/20 text-white shadow-lg backdrop-blur-xl transition hover:rotate-90 hover:scale-105 hover:bg-white hover:text-sky-700 sm:right-6 sm:top-6"
          >
            <X size={21} />
          </button>
          <span className="absolute left-[8%] top-[12%] size-24 animate-pulse rounded-full border border-blue-300/15" />
          <span className="absolute bottom-[8%] right-[8%] size-36 animate-pulse rounded-full border border-blue-400/10 [animation-delay:500ms]" />
          <span className="absolute left-[45%] top-[14%] size-3 animate-ping rounded-full bg-blue-300/80" />
          <span className="absolute bottom-[18%] left-[14%] size-2 animate-ping rounded-full bg-cyan-300 [animation-delay:350ms]" />
          <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-5 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12 md:px-10 lg:gap-20">
            <div className="animate-[editorPopIn_500ms_cubic-bezier(.2,.8,.2,1)] text-center text-white md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] backdrop-blur">
                <Sparkles size={13} /> Profile complete
              </span>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Your profile is updated
                <br className="hidden md:block" /> successfully!
              </h2>
              <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-white/80 md:mx-0 sm:text-sm">
                Your new photo and personal information are now available
                throughout your dashboard.
              </p>
            </div>

            <div className="relative mx-auto w-[min(64vw,220px)] origin-center animate-[editorPopIn_650ms_cubic-bezier(.2,.8,.2,1)] sm:w-[min(56vw,270px)] md:w-[min(40dvh,292px)]">
              <span className="absolute -inset-6 animate-pulse rounded-[70px] bg-white/25 blur-2xl" />
              <span className="absolute -left-[3px] top-[18%] h-6 w-[4px] rounded-l-md bg-zinc-700 shadow-sm" />
              <span className="absolute -left-[3px] top-[25%] h-12 w-[4px] rounded-l-md bg-zinc-700 shadow-sm" />
              <span className="absolute -left-[3px] top-[34%] h-12 w-[4px] rounded-l-md bg-zinc-700 shadow-sm" />
              <span className="absolute -right-[3px] top-[27%] h-20 w-[4px] rounded-r-md bg-zinc-700 shadow-sm" />
              <article className="relative aspect-[9/19.5] w-full rounded-[54px] bg-[linear-gradient(145deg,#77777c_0%,#17171a_18%,#050506_55%,#606065_100%)] p-[5px] shadow-[0_40px_90px_rgba(24,70,110,.42),inset_0_0_0_1px_rgba(255,255,255,.35)]">
                <div className="h-full w-full rounded-[49px] bg-black p-[5px] shadow-inner">
                  <div className="relative h-full overflow-hidden rounded-[44px] bg-[linear-gradient(165deg,#f1eaff_0%,#ffffff_45%,#e8f5ff_100%)] px-5 pb-5 pt-12">
                    <span className="absolute left-1/2 top-[10px] z-10 h-[25px] w-[86px] -translate-x-1/2 rounded-full bg-[#090a0d] shadow-sm">
                      <i className="absolute right-[7px] top-[8px] size-[8px] rounded-full bg-[#111b36] ring-1 ring-blue-900">
                        <b className="absolute left-[2px] top-[2px] size-[2px] rounded-full bg-blue-400/60" />
                      </i>
                    </span>
                    <div className="absolute left-5 right-5 top-[15px] flex items-center justify-between text-[7px] font-bold text-zinc-700">
                      <span>9:41</span>
                      <span className="flex items-end gap-[2px]">
                        <i className="h-1 w-[2px] rounded-sm bg-zinc-700" />
                        <i className="h-1.5 w-[2px] rounded-sm bg-zinc-700" />
                        <i className="h-2 w-[2px] rounded-sm bg-zinc-700" />
                        <i className="ml-1 h-[6px] w-3 rounded-[2px] border border-zinc-700 after:block after:h-full after:w-2 after:rounded-[1px] after:bg-zinc-700" />
                      </span>
                    </div>
                    <div className="relative mx-auto size-24">
                      <span className="absolute inset-0 animate-ping rounded-full bg-blue-300/25 [animation-duration:1.8s]" />
                      <span className="relative block size-24 overflow-hidden rounded-full border-4 border-white shadow-xl">
                        {avatarSrc ? (
                          <Image
                            src={avatarSrc}
                            alt={form.name || user.email}
                            fill
                            unoptimized
                            className="object-cover object-[55%_42%]"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center bg-blue-100 text-xl font-semibold text-blue-700">
                            {(form.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="absolute -bottom-1 -right-1 grid size-8 animate-bounce place-items-center rounded-full border-[3px] border-white bg-emerald-500 text-white">
                        <Check size={15} strokeWidth={3} />
                      </span>
                    </div>
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-[8px] font-bold uppercase tracking-wider text-blue-700">
                        <Sparkles size={10} /> Profile updated
                      </span>
                      <h3 className="mt-3 truncate text-xl font-semibold">
                        {form.name || user.email}
                      </h3>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Your changes are saved.
                      </p>
                    </div>
                    <div className="mt-5 grid gap-2.5 rounded-2xl border border-white bg-white/75 p-3 text-[10px] text-zinc-600 shadow-sm backdrop-blur">
                      <span className="flex min-w-0 items-center gap-2">
                        <i className="grid size-6 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                          <Mail size={12} />
                        </i>
                        <b className="truncate font-medium">{form.email}</b>
                      </span>
                      <span className="flex items-center gap-2">
                        <i className="grid size-6 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                          <Phone size={12} />
                        </i>
                        <b className="font-medium">
                          {form.phone || "Add phone number"}
                        </b>
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <i className="grid size-6 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                          <MapPin size={12} />
                        </i>
                        <b className="truncate font-medium">
                          {form.location || "Add location"}
                        </b>
                      </span>
                    </div>
                    <div className="mt-5 h-1 overflow-hidden rounded-full bg-blue-100">
                      <span className="block h-full w-full animate-pulse rounded-full bg-blue-600" />
                    </div>
                    <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-zinc-300" />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
