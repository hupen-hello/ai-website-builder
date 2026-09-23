"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Edit3, ExternalLink, Eye, Trash2, X } from "lucide-react";

type TemplateActionsProps = {
  name: string;
  previewHref?: string | null;
  previewImage?: string;
  onEdit: () => void;
  onDelete?: () => void;
  editing?: boolean;
  deleting?: boolean;
  /** When false, overlay is omitted (e.g. parent renders it on the image area). */
  showOverlay?: boolean;
  /** Increment to open the preview modal from a parent-rendered control. */
  openPreviewSignal?: number;
};

export default function TemplateActions({
  name,
  previewHref,
  previewImage,
  onEdit,
  onDelete,
  editing = false,
  deleting = false,
  showOverlay = true,
  openPreviewSignal = 0,
}: TemplateActionsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (openPreviewSignal > 0) {
      setPreviewOpen(true);
    }
  }, [openPreviewSignal]);

  const openWebsite = () => {
    if (!previewHref) return;
    window.open(previewHref, "_blank", "noopener,noreferrer");
  };

  const openPreview = () => {
    setPreviewOpen(true);
  };

  const previewModal =
    previewOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/70 p-3 backdrop-blur-sm sm:p-6">
            <div className="relative h-[90vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex h-14 items-center border-b border-zinc-200 px-4">
                <strong className="text-sm">{name} preview</strong>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Close preview"
                  className="ml-auto grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-zinc-100"
                >
                  <X size={19} />
                </button>
              </div>
              <div className="relative h-[calc(100%-56px)] bg-zinc-100">
                {previewHref ? (
                  <iframe
                    title={`${name} website preview`}
                    src={previewHref}
                    className="h-full w-full border-0"
                  />
                ) : previewImage ? (
                  <div className="relative h-full w-full overflow-y-auto">
                    <div className="relative mx-auto min-h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage}
                        alt={`${name} template preview`}
                        className="h-auto w-full object-top"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Preview not available
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {showOverlay ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[calc(100%-68px)] items-center justify-center gap-2 bg-zinc-950/45 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            disabled={editing || deleting}
            className="flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-xs font-medium text-zinc-900 shadow-lg transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-70"
          >
            <Edit3 size={15} /> {editing ? "Opening..." : "Edit"}
          </button>
          <button
            type="button"
            onClick={openPreview}
            disabled={!previewHref && !previewImage}
            className="flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-medium text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Eye size={15} /> Preview
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || editing}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-medium text-red-600 shadow-lg transition hover:bg-red-50 disabled:opacity-70"
            >
              <Trash2 size={15} /> {deleting ? "Deleting..." : "Delete"}
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openWebsite}
        disabled={!previewHref}
        aria-label={`Open ${name} website`}
        title={previewHref ? "Open website" : "Publish to open website"}
        className="relative z-30 grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-transparent text-zinc-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ExternalLink size={16} />
      </button>

      {previewModal}
    </>
  );
}
