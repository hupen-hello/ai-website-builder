"use client";

import type { SectionProps } from "../../../types/section";
import { RealEstateLegalPageLayout } from "../privacy-policy/RealEstatePrivacyPolicy1";

export default function RealEstateCookiePolicy1({ data = {} }: SectionProps) {
  return <RealEstateLegalPageLayout data={data} sectionIdPrefix="cookie" contactTitle="Have a cookie question?" contactDescription="Contact HAUS Group if you need more information about cookies, analytics, or managing your website preferences." />;
}
