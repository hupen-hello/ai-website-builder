import "./redesign.css";

export default function RedesignLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="redesign-root contents">{children}</div>;
}
