"use client";

import type { SectionProps } from "../../../types/section";
import { RealEstateLegalPageLayout } from "../privacy-policy/RealEstatePrivacyPolicy1";

export default function RealEstateRefundPolicy1({ data = {} }: SectionProps) {
  return <RealEstateLegalPageLayout data={data} sectionIdPrefix="refund" contactTitle="Have a payment or refund question?" contactDescription="Contact HAUS Group with the relevant service, payment, and transaction details so our team can review your request." />;
}
