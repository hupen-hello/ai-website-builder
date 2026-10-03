"use client";

import { createLegalPage5, type LegalTerm5 } from "./RealEstateLegalPage5";

const termsFallback: LegalTerm5[] = [
  {
    id: "1",
    title: "1. Acceptance of Terms",
    desc: "By accessing this website and/or using our services, you agree to comply with and be bound by these Terms & Conditions, our Privacy Policy, and all applicable laws and regulations.",
  },
  {
    id: "2",
    title: "2. Use of Services",
    desc: "You agree to use our services only for lawful purposes and in accordance with these terms. You are responsible for maintaining the confidentiality of your account information.",
  },
  {
    id: "3",
    title: "3. Property Information",
    desc: "We strive to provide accurate property information; however, we do not guarantee the completeness, accuracy, or reliability of any information on our website.",
  },
  {
    id: "4",
    title: "4. Payments & Pricing",
    desc: "All payments must be made in full as per the agreed terms. Prices are subject to change without prior notice. We reserve the right to modify or discontinue any service at any time.",
  },
  {
    id: "5",
    title: "5. Limitation of Liability",
    desc: "We are not liable for any indirect, incidental, or consequential damages arising from the use or inability to use our services or website.",
  },
  {
    id: "6",
    title: "6. Third-Party Links",
    desc: "Our website may contain links to third-party websites. We are not responsible for the content or practices of any third-party sites.",
  },
  {
    id: "7",
    title: "7. Changes to Terms",
    desc: "We reserve the right to update or change these Terms & Conditions at any time. Changes will be effective immediately upon posting on this page.",
  },
  {
    id: "8",
    title: "8. Governing Law",
    desc: "These Terms & Conditions shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.",
  },
];

const privacyFallback: LegalTerm5[] = [
  {
    id: "1",
    title: "1. Information We Collect",
    desc: "We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, register on the site, place an order, and in connection with other activities, services, features or resources we make available on our Site.",
  },
  {
    id: "2",
    title: "2. How We Use Collected Information",
    desc: "We may collect and use Users personal information for the following purposes: to improve customer service, to personalize user experience, and to send periodic emails.",
  },
  {
    id: "3",
    title: "3. How We Protect Your Information",
    desc: "We adopt appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information, username, password, transaction information and data stored on our Site.",
  },
];

const cookieFallback: LegalTerm5[] = [
  {
    id: "1",
    title: "1. What are Cookies?",
    desc: "Cookies are small text files that are placed on your computer by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.",
  },
  {
    id: "2",
    title: "2. How We Use Cookies",
    desc: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies.',
  },
  {
    id: "3",
    title: "3. Managing Cookies",
    desc: "You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.",
  },
];

export const RealEstateTermsPage5 = createLegalPage5(
  "Please read these terms and conditions carefully before using our website and services.",
  termsFallback,
);

export const RealEstatePrivacyPage5 = createLegalPage5(
  "Your privacy is important to us. This Privacy Policy explains how we collect, use, protect, and handle your personal information when you use our website and services.",
  privacyFallback,
);

export const RealEstateCookiePage5 = createLegalPage5(
  "This Cookie Policy explains how we use cookies and similar technologies to improve your browsing experience and understand how our website is used.",
  cookieFallback,
);
