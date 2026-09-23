"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, Upload } from "lucide-react";

const DEFAULT_IMAGES = [
  "/bg1.jpg",
  "/bg2.jpg",
  "/blackbay.png",
  "/prod2.jpg",
  "/55.jpg",
  "/categories/realestate/bg1.jpg",
  "/categories/realestate/bg2.jpg",
  "/categories/realestate/BG3.jpg",
  "/categories/business/bg1.jpg",
  "/categories/business/bg2.jpg",
  "/categories/business/blackbay.png",
  "/categories/school/bg11.jpg",
  "/categories/school/bg22.jpg",
  "/categories/school/bg33.png",
];

const fileNameFromSource = (source: string) => {
  if (source.startsWith("data:")) return "Uploaded image";
  return source.split(/[?#]/)[0].split("/").filter(Boolean).at(-1) || "Image";
};

type ImageLibraryPickerProps = {
  open: boolean;
  title: string;
  initialValue?: string;
  onClose: () => void;
  onSelect: (source: string, fileName: string) => void;
};

export default function ImageLibraryPicker({
  open,
  title,
  initialValue = "",
  onClose,
  onSelect,
}: ImageLibraryPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const pageImages = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-editor-media][data-editor-media-type="image"]',
      ),
    )
      .map(
        (element) =>
          element.dataset.editorMediaSrc || element.getAttribute("src") || "",
      )
      .filter(Boolean);

    setSources(Array.from(new Set([initialValue, ...pageImages, ...DEFAULT_IMAGES].filter(Boolean))));
    setSelected(initialValue);
    setSearch("");
    setError("");
  }, [initialValue, open]);

  if (!open) return null;

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = sources.filter((source) =>
    normalizedSearch
      ? source.toLowerCase().includes(normalizedSearch) ||
        fileNameFromSource(source).toLowerCase().includes(normalizedSearch)
      : true,
  );

  const addUploadedSource = (source: string, fileName: string) => {
    setSources((current) => Array.from(new Set([source, ...current])));
    setSelected(source);
    if (!source) setError(`${fileName} could not be loaded`);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/user/media", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };

      if (response.ok && data.url) {
        addUploadedSource(data.url, file.name);
        return;
      }

      if (response.status === 401 && file.size <= 2 * 1024 * 1024) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error("Unable to read this image"));
          reader.onerror = () => reject(new Error("Unable to read this image"));
          reader.readAsDataURL(file);
        });
        addUploadedSource(dataUrl, file.name);
        return;
      }

      throw new Error(data.message || "Unable to upload this image");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload this image",
      );
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${title}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
          event.target.value = "";
        }}
      />
      <div className="flex max-h-[min(88vh,720px)] w-[min(94vw,760px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.3)]">
        <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-6 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Image editor</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        <div className="px-6 sm:px-7">
          {error ? <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
          <label className="flex h-11 items-center gap-3 rounded-full border border-slate-300 bg-slate-50 px-4 text-slate-500 focus-within:border-blue-500 focus-within:bg-white">
            <Search size={17} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pre-uploaded images" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          </label>
        </div>
        <div className="mt-5 flex-1 overflow-y-auto px-6 pb-6 sm:px-7">
          {filtered.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((source, index) => {
                const isSelected = selected === source;
                return (
                  <button key={`${source.slice(0, 80)}-${index}`} type="button" onClick={() => setSelected(source)} className={`group/image relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-slate-100 text-left transition ${isSelected ? "border-blue-600 ring-2 ring-blue-100" : "border-transparent hover:border-slate-300"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={source} alt={fileNameFromSource(source)} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover/image:scale-[1.03]" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-7 text-xs font-medium text-white">{fileNameFromSource(source)}</span>
                    {isSelected ? <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"><Check size={16} /></span> : null}
                  </button>
                );
              })}
            </div>
          ) : <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">No matching images found</div>}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
          <button type="button" disabled={!selected || uploading} onClick={() => onSelect(selected, fileNameFromSource(selected))} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
