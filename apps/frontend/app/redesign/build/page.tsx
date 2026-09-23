"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getRedesignBuildPayload,
  saveRedesignBuildPayload,
} from "@/lib/redesign-build-storage";
import {
  createRedesignDesignId,
  getActiveRedesignDesignId,
  setActiveRedesignDesignId,
} from "@/lib/redesign-design-id";

/** Legacy `/redesign/build` → `/redesign/build/[designId]`. */
export default function RedesignBuildIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    const active = getActiveRedesignDesignId();
    const payload = getRedesignBuildPayload(active || undefined);
    const designId =
      payload?.designId?.trim() || active || createRedesignDesignId();
    setActiveRedesignDesignId(designId);
    if (payload && !payload.designId) {
      saveRedesignBuildPayload({ ...payload, designId }, designId);
    }
    router.replace(`/redesign/build/${designId}`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
      Starting build…
    </div>
  );
}
