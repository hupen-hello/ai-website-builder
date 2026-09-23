import { generalSansMedium } from "@/app/fonts";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={generalSansMedium.className}>{children}</div>;
}
