import { ButtonHTMLAttributes } from "react";
import Link from "next/link";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "outline"
  | "ghost"
  | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  dark: "bg-black text-white hover:bg-black",
  outline: "border border-indigo-600 text-indigo-600 hover:bg-indigo-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-700 text-white hover:bg-red-700",
};

export default function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const buttonClass = `
    inline-flex items-center justify-center
    rounded-md px-6 py-3
    text-sm font-medium
    transition-colors
    cursor-pointer
    ${variants[variant]}
    ${className}
  `;

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
}
