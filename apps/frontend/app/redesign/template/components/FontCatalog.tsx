export default function FontCatalog({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The font catalog is intentionally scoped to the redesign preview. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lato:wght@300;400;700;900&family=Merriweather:wght@300;400;700;900&family=Montserrat:wght@300;400;500;600;700;800&family=Nunito:wght@300;400;500;600;700;800&family=Open+Sans:wght@300;400;500;600;700;800&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=Raleway:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700;900&family=Source+Sans+3:wght@300;400;500;600;700;800&display=swap"
      />
      {children}
    </>
  );
}
