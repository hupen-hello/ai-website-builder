import type { ImageBlock as ImageBlockData } from "../types/section";
import EditorRemoteImage from "../../EditorRemoteImage";

type ImageBlockProps = {
  block: ImageBlockData;
  className?: string;
};

function normalizeLocalImageSrc(src: string) {
  // Next/Image localPatterns reject query strings on local uploads.
  if (src.startsWith("/uploads/") || src.startsWith("/categories/")) {
    return src.split("?")[0] || src;
  }
  return src;
}

export default function ImageBlock({ block, className }: ImageBlockProps) {
  const src = normalizeLocalImageSrc(block.src || "");
  return (
    <EditorRemoteImage
      src={src}
      alt={block.alt ?? block.title ?? ""}
      data-editor-media
      data-editor-media-type="image"
      data-editor-media-src={src}
      data-editor-media-role={block.role}
      fill={block.fill ?? true}
      sizes="100vw"
      priority={block.priority}
      className={className}
    />
  );
}
