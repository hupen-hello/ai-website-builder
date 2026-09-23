"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getActiveRedesignDesignId,
} from "@/lib/redesign-design-id";

/** Legacy `/redesign` → last active design, else home. */
export default function RedesignIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    const id = getActiveRedesignDesignId();
    router.replace(id ? `/redesign/${id}` : "/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
      Opening your redesign…
    </div>
  );
}
