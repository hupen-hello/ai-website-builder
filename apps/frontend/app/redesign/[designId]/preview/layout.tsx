import RedesignPreviewRuntime from "../../components/RedesignPreviewRuntime";
import RedesignFloatingChrome from "../../components/RedesignFloatingChrome";

export default function RedesignPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <RedesignPreviewRuntime watchDom={false} />
      <RedesignFloatingChrome />
      {children}
    </>
  );
}
