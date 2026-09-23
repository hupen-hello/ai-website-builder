export default function PreviewSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md space-y-4">
        <p className="text-center text-sm font-medium text-slate-500">
          {message || "Analyzing your existing website…"}
        </p>
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-3/5 animate-pulse rounded-full bg-slate-200" />
        <div className="grid grid-cols-3 gap-3 pt-4">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
