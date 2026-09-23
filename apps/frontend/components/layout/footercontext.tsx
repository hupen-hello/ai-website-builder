"use client";

import { createContext, useContext, useState } from "react";

type FooterContextValue = {
  hideFooter: boolean;
  setHideFooter: React.Dispatch<React.SetStateAction<boolean>>;
};

const FooterContext = createContext<FooterContextValue | null>(null);

export function FooterProvider({ children }: { children: React.ReactNode }) {
  const [hideFooter, setHideFooter] = useState(false);

  return (
    <FooterContext.Provider value={{ hideFooter, setHideFooter }}>
      {children}
    </FooterContext.Provider>
  );
}

export function useFooter() {
  const context = useContext(FooterContext);

  if (!context) {
    throw new Error("useFooter must be used inside FooterProvider");
  }

  return context;
}
