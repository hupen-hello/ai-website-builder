"use client";

import Footer from "./footer";
import { useFooter } from "./footercontext";

export default function FooterWrapper() {
  const { hideFooter } = useFooter();

  if (hideFooter) return null;

  return <Footer />;
}
