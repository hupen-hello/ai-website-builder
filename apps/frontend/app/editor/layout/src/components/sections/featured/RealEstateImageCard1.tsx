import type { ReactNode, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

type RealEstateImageCard1Props = {
  image: string;
  alt: string;
  children: ReactNode;
  href?: string;
  imageOverlay?: ReactNode;
  cardClassName?: string;
  imageClassName?: string;
  imageSizes?: string;
  contentClassName?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") || /^https?:\/\//i.test(src);

export default function RealEstateImageCard1({
  image,
  alt,
  children,
  href,
  imageOverlay,
  cardClassName = "rounded-[1.25rem]",
  imageClassName = "aspect-[4/3]",
  imageSizes = "(max-width: 768px) 100vw, 33vw",
  contentClassName = "p-6",
  onClick,
}: RealEstateImageCard1Props) {
  const content = (
    <>
      <div
        className={`relative overflow-hidden bg-[#eee9df] ${imageClassName}`}
      >
        <Image
          src={image}
          alt={alt}
          fill
          unoptimized={bypassImageOptimization(image)}
          data-editor-media
          data-editor-media-type="image"
          data-editor-media-src={image}
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
          sizes={imageSizes}
        />
        {imageOverlay}
      </div>
      <div className={contentClassName}>{children}</div>
    </>
  );

  const classes = `group flex h-full flex-col overflow-hidden border border-[#141414]/10 bg-white transition hover:border-[#141414]/20 hover:shadow-[0_20px_50px_rgba(20,20,20,0.08)] ${cardClassName}`;

  return href ? (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <article className={classes}>{content}</article>
  );
}
