import type { VideoBlock as VideoBlockData } from "../types/section";

type VideoBlockProps = {
  block: VideoBlockData;
  className?: string;
};

export default function VideoBlock({ block, className }: VideoBlockProps) {
  return (
    <video
      src={block.src}
      poster={block.poster}
      data-editor-media
      data-editor-media-type="video"
      data-editor-media-src={block.src}
      className={className}
      autoPlay
      muted
      loop
      playsInline
    />
  );
}
