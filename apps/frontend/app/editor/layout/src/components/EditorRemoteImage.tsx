"use client";

import Image, { type ImageProps } from "next/image";

/** True for redesign/customer URLs that are not on next.config remotePatterns. */
export function isArbitraryRemoteSrc(src: string) {
  return /^https?:\/\//i.test(src || "") || (src || "").startsWith("data:");
}

type Props = Omit<ImageProps, "src"> & {
  src: string;
};

/**
 * next/image only allows configured hosts. Redesign logos/images come from any
 * customer domain — use native <img> for http(s)/data so the editor never crashes.
 */
export default function EditorRemoteImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  style,
  ...rest
}: Props) {
  if (isArbitraryRemoteSrc(src)) {
    const mediaAttrs = Object.fromEntries(
      Object.entries(rest).filter(([key]) => key.startsWith("data-")),
    );
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary customer domains
    return (
      <img
        src={src}
        alt={typeof alt === "string" ? alt : ""}
        className={className}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        style={
          fill
            ? {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                ...(style as React.CSSProperties),
              }
            : style
        }
        {...mediaAttrs}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      fill={fill}
      style={style}
      {...rest}
    />
  );
}
