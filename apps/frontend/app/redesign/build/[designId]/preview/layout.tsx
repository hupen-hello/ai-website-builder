export default function BuildPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <style>{`
        html, body {
          height: 100%;
          overflow: hidden;
        }
      `}</style>
      {children}
    </>
  );
}
