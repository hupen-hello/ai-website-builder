import type { Metadata } from "next";
import { agrandirBolt, generalSansMedium } from "./fonts";
import "./globals.css";
import "./main.css";

const appUrl =
  process.env.NEXT_PUBLIC_PUBLISH_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Lestow — AI Website Builder",
    template: "%s | Lestow",
  },
  description:
    "Create a professional website in minutes with AI. Generate stunning layouts, engaging content, and customize every detail to match your brand.",
  icons: {
    icon: "/fav-icon.ico",
  },
  openGraph: {
    type: "website",
    title: "Lestow — AI Website Builder",
    description:
      "Create a professional website in minutes with AI. Generate stunning layouts, engaging content, and customize every detail to match your brand.",
    siteName: "Lestow",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full ${generalSansMedium.className} ${agrandirBolt.variable}`}
    >
      <body
        className={`min-h-dvh overflow-x-hidden overflow-y-auto ${generalSansMedium.className} `}
      >
        {children}
      </body>
    </html>
  );
}
