"use client";

import {
  cookiePage4Content,
  disclaimerPage4Content,
  privacyPage4Content,
  refundPage4Content,
  termsPage4Content,
} from "../../../data/realEstatePage4Content";
import type { LegalSection4 } from "../../../types/realEstatePage4";
import { createLegalPage4 } from "./RealEstateLegalPage4";

const termsFallback: LegalSection4[] = [
  { id: "introduction", title: "Introduction", icon: "FileText", content: "Welcome to Simple Real Estate. By accessing or using our website, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services." },
  { id: "use-of-website", title: "Use of Website", icon: "Monitor", content: "You agree to use this website for lawful purposes only. You must not use our website in any way that could damage, disable, overburden, or impair the site or interfere with any other party's use." },
  { id: "property-information", title: "Property Information", icon: "Home", content: "We strive to provide accurate property information, but we do not warrant that descriptions, prices, availability, or any other content is accurate, complete, reliable, current, or error-free." },
  { id: "user-responsibilities", title: "User Responsibilities", icon: "User", content: "Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account." },
  { id: "intellectual-property", title: "Intellectual Property", icon: "ShieldCheck", content: "All content on this website, including text, graphics, logos, images, and software, is the property of Simple Real Estate and is protected by applicable copyright and trademark laws." },
  { id: "limitation-of-liability", title: "Limitation of Liability", icon: "AlertTriangle", content: "Simple Real Estate shall not be liable for any direct, indirect, incidental, consequential, or special damages arising out of or in connection with your use of our website." },
  { id: "external-links", title: "External Links", icon: "LinkIcon", content: "Our website may contain links to third-party websites. We are not responsible for the content or practices of these external sites." },
  { id: "changes-to-terms", title: "Changes to Terms", icon: "Edit", content: "We may update these Terms and Conditions from time to time. Any changes will be posted on this page with an updated effective date." },
  { id: "governing-law", title: "Governing Law", icon: "Scale", content: "These Terms and Conditions are governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions." },
];

const privacyFallback: LegalSection4[] = [
  { id: "introduction", title: "Introduction", icon: "Shield", content: "At Simple Real Estate, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website." },
  { id: "data-collection", title: "Data We Collect", icon: "Database", content: "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows: Identity Data, Contact Data, Technical Data, Usage Data, and Marketing and Communications Data." },
  { id: "how-we-use-data", title: "How We Use Your Data", icon: "Settings", content: "We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to perform the contract we are about to enter into or have entered into with you, or where it is necessary for our legitimate interests." },
  { id: "data-security", title: "Data Security", icon: "Lock", content: "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed." },
  { id: "your-rights", title: "Your Legal Rights", icon: "Eye", content: "Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data." },
];

const disclaimerFallback: LegalSection4[] = [
  { id: "general-info", title: "General Information", icon: "Info", content: "The information contained on the Simple Real Estate website is for general information purposes only. Simple Real Estate assumes no responsibility for errors or omissions in the contents of the Service." },
  { id: "no-advice", title: "No Professional Advice", icon: "HelpCircle", content: "The real estate information provided on this website is for informational purposes only and does not constitute financial, legal, or real estate advice. You should consult with a professional before making any real estate decisions." },
  { id: "accuracy", title: "Accuracy of Materials", icon: "FileX", content: "While we endeavor to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose." },
  { id: "liability", title: "Limitation of Liability", icon: "AlertCircle", content: "In no event shall Simple Real Estate be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service." },
];

const refundFallback: LegalSection4[] = [
  { id: "policy-overview", title: "Policy Overview", icon: "RefreshCcw", content: "At Simple Real Estate, we strive to ensure our clients are satisfied with our services. This Refund Policy outlines the terms and conditions under which refunds may be issued for consulting or advisory services." },
  { id: "eligibility", title: "Eligibility for Refunds", icon: "DollarSign", content: "Refunds may be issued in cases where services were not rendered as outlined in the client agreement. Application fees or administrative fees related to property processing are generally non-refundable." },
  { id: "timeframe", title: "Timeframe for Requests", icon: "Clock", content: "All refund requests must be submitted in writing within 14 days of the original transaction date. Requests made after this period will not be considered." },
  { id: "process", title: "Refund Process", icon: "HelpCircle", content: "Once a refund request is received, our team will review the claim and notify you of the approval or rejection of your refund within 7 business days. Approved refunds will be processed to the original method of payment." },
];

const cookieFallback: LegalSection4[] = [
  { id: "what-are-cookies", title: "What Are Cookies?", icon: "Cookie", content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site." },
  { id: "how-we-use", title: "How We Use Cookies", icon: "Settings", content: "Simple Real Estate uses cookies to understand how you interact with our website, to remember your preferences (such as saved properties or searches), and to improve your overall user experience." },
  { id: "types-of-cookies", title: "Types of Cookies We Use", icon: "EyeOff", content: "We use Essential Cookies (required for basic operation), Analytical Cookies (to understand interaction), Functional Cookies (to recognize you), and Targeting Cookies (to record your visit)." },
  { id: "managing-cookies", title: "Managing Your Cookies", icon: "ShieldAlert", content: "You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly." },
];

export const RealEstateTermsPage4 = createLegalPage4(
  termsPage4Content.RealEstateTermsPage4,
  "Terms & Conditions",
  termsFallback,
);

export const RealEstatePrivacyPage4 = createLegalPage4(
  privacyPage4Content.RealEstatePrivacyPage4,
  "Privacy Policy",
  privacyFallback,
);

export const RealEstateDisclaimerPage4 = createLegalPage4(
  disclaimerPage4Content.RealEstateDisclaimerPage4,
  "Disclaimer",
  disclaimerFallback,
);

export const RealEstateRefundPage4 = createLegalPage4(
  refundPage4Content.RealEstateRefundPage4,
  "Refund Policy",
  refundFallback,
);

export const RealEstateCookiePage4 = createLegalPage4(
  cookiePage4Content.RealEstateCookiePage4,
  "Cookies Policy",
  cookieFallback,
);
