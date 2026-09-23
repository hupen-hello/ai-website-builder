"use client";

import { useEffect, useState } from "react";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  textClassName?: string;
};

function getInitials(name?: string | null, email?: string | null) {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase() || "U";
  }
  if (parts[0] && parts[0].includes("@")) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0] || "U").slice(0, 2).toUpperCase();
}

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 40,
  className = "",
  textClassName = "",
}: UserAvatarProps) {
  const trimmedUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(trimmedUrl) && !failed;
  const initials = getInitials(name, email);
  const fontSize = Math.max(10, Math.round(size * 0.32));

  useEffect(() => {
    setFailed(false);
  }, [trimmedUrl]);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 font-semibold text-emerald-800 ${className}`}
      style={{ width: size, height: size, fontSize }}
      aria-hidden={!showImage}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmedUrl}
          alt={name || email || "Account"}
          className="h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`leading-none ${textClassName}`}>{initials}</span>
      )}
    </span>
  );
}
