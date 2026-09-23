import BrandLogo from "@/components/ui/brand-logo";

type EditorLoadingScreenProps = {
  message?: string;
  /** Full page boot, iframe document, card overlay, or modal center. */
  variant?: "full" | "embed" | "card" | "modal";
};

export default function EditorLoadingScreen({
  message = "Loading editor…",
  variant = "full",
}: EditorLoadingScreenProps) {
  if (variant === "modal") {
    return (
      <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-3 bg-slate-50">
        <BrandLogo />
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        {message ? (
          <p className="text-sm font-semibold text-slate-500">{message}</p>
        ) : null}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50">
        <BrandLogo />
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (variant === "embed") {
    return (
      <div className="flex h-dvh min-h-dvh w-full flex-col items-center justify-center gap-3 bg-slate-50">
        <BrandLogo />
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-6">
      <BrandLogo />
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        {message}
      </div>
    </main>
  );
}
