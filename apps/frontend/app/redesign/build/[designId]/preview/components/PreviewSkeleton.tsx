"use client";

import LiveBuildFeed from "./LiveBuildFeed";

export default function PreviewSkeleton({
  message,
  designId,
}: {
  message?: string;
  designId?: string;
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4 overflow-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-5 sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-3 text-center">
        <p className="text-sm font-semibold text-slate-800">
          {message || "Analyzing your existing website…"}
        </p>
        <p className="text-xs leading-5 text-slate-500">
          Read the live feed below — every screenshot, Lestow pass, and section fill is logged so
          the wait never feels silent.
        </p>
      </div>
      <div className="mx-auto w-full max-w-2xl flex-1">
        <LiveBuildFeed designId={designId} />
      </div>
    </div>
  );
}
