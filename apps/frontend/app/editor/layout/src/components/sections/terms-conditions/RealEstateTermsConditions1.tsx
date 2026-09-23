"use client";

import type { SectionProps } from "../../../types/section";
import { RealEstateLegalPageLayout } from "../privacy-policy/RealEstatePrivacyPolicy1";

export default function RealEstateTermsConditions1({
  data = {},
}: SectionProps) {
  return (
    <RealEstateLegalPageLayout
      data={data}
      sectionIdPrefix="terms"
      contactTitle="Need help understanding these terms?"
      contactDescription="Contact our team if you have a question about property information, enquiries, appointments, or your use of the HAUS Group website."
    />
  );
}
