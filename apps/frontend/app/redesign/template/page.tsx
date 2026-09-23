"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveRedesignDesignId } from "@/lib/redesign-design-id";

/** Legacy `/redesign/template` → `/redesign/[designId]/template`. */
export default function LegacyTemplateRedirect() {
  const router = useRouter();

  useEffect(() => {
    const id = getActiveRedesignDesignId();
    router.replace(id ? `/redesign/${id}/template` : "/");
  }, [router]);

  return null;
}
