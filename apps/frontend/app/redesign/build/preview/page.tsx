"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getActiveRedesignDesignId } from "@/lib/redesign-design-id";

function LegacyPreviewRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = getActiveRedesignDesignId();
    const step = searchParams.get("step") || "0";
    router.replace(
      id
        ? `/redesign/build/${id}/preview?step=${step}`
        : "/",
    );
  }, [router, searchParams]);

  return null;
}

/** Legacy `/redesign/build/preview` → `/redesign/build/[designId]/preview`. */
export default function LegacyPreviewRedirect() {
  return (
    <Suspense fallback={null}>
      <LegacyPreviewRedirectInner />
    </Suspense>
  );
}
