"use client"
import Link from "next/link"
import { Phone, Mail, MapPin, ChevronRight } from "lucide-react"
import { SectionProps } from "../../../types/section"

export default function Footer({ data: _data }: SectionProps) {
    const data = (_data || {}) as any;

    // Arrays with fallbacks
    const socialLinks = Array.isArray(data.socialLinks) ? data.socialLinks : [];
    const usefulLinks = Array.isArray(data.usefulLinks) ? data.usefulLinks : [];
    const legalLinks = Array.isArray(data.legalLinks) ? data.legalLinks : [];
    const bottomLinks = Array.isArray(data.bottomLinks) ? data.bottomLinks : [];

    // Helper function to render social icons based on platform name
    const getSocialIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'facebook':
                return <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />;
            case 'instagram':
                return <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />;
            case 'x':
            case 'twitter':
                return <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />;
            case 'linkedin':
                return <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />;
            default:
                return null;
        }
    };

    return (
        <footer
            className="bg-[#101820] text-white pt-16 pb-8"
            data-editor-section-label="footer"
        >
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-12">

                    {/* About */}
                    <div>
                        <h3 className="text-[1.05rem] font-bold uppercase tracking-wider mb-2" data-editor-field="aboutTitle">
                            {String(data.aboutTitle ?? "About Villa Estates")}
                        </h3>
                        <div className="w-8 h-[3px] bg-[#0a8296] mb-5" />
                        <p className="text-gray-300 text-[15px] leading-relaxed mb-8" data-editor-field="aboutText">
                            {String(data.aboutText ?? "At Villa Estates, we help you find your dream home or sell your property for the best value. With expert guidance, we make real estate simple.")}
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={String(social.url ?? "#")}
                                    className="w-9 h-9 rounded border border-gray-600 flex items-center justify-center hover:bg-[#0a8296] hover:border-[#0a8296] transition-colors"
                                    aria-label={social.platform}
                                >
                                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                                        {getSocialIcon(social.platform)}
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div className="lg:mx-auto">
                        <h3 className="text-[1.05rem] font-bold uppercase tracking-wider mb-2" data-editor-field="usefulLinksTitle">
                            {String(data.usefulLinksTitle ?? "Useful Links")}
                        </h3>
                        <div className="w-8 h-[3px] bg-[#0a8296] mb-5" />
                        <ul className="space-y-3.5">
                            {usefulLinks.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <Link href={String(link.url ?? "#")} className="text-gray-300 hover:text-white flex items-center gap-2 text-[15px] transition-colors">
                                        <ChevronRight className="w-[18px] h-[18px] text-[#0a8296]" /> <span data-editor-field="usefulLinksLabel">{String(link.label ?? "")}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="lg:mx-auto">
                        <h3 className="text-[1.05rem] font-bold uppercase tracking-wider mb-2" data-editor-field="legalLinksTitle">
                            {String(data.legalLinksTitle ?? "Legal")}
                        </h3>
                        <div className="w-8 h-[3px] bg-[#0a8296] mb-5" />
                        <ul className="space-y-3.5">
                            {legalLinks.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <Link href={String(link.url ?? "#")} className="text-gray-300 hover:text-white flex items-center gap-2 text-[15px] transition-colors">
                                        <ChevronRight className="w-[18px] h-[18px] text-[#0a8296]" /> <span data-editor-field="legalLinksLabel">{String(link.label ?? "")}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div className="lg:ml-auto">
                        <h3 className="text-[1.05rem] font-bold uppercase tracking-wider mb-2" data-editor-field="contactTitle">
                            {String(data.contactTitle ?? "Contact Us")}
                        </h3>
                        <div className="w-8 h-[3px] bg-[#0a8296] mb-5" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Phone className="w-[22px] h-[22px] text-[#0a8296]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-gray-300 text-[15px]" data-editor-field="contactPhone">{String(data.contactPhone ?? "555-555-5555")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Mail className="w-[22px] h-[22px] text-[#0a8296]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-gray-300 text-[15px]" data-editor-field="contactEmail">{String(data.contactEmail ?? "info@villaestates.com")}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 pt-1">
                                <MapPin className="w-[22px] h-[22px] text-[#0a8296]" strokeWidth={1.5} />
                                <div>
                                    {/* Splitting address by \n for correct multiline formatting */}
                                    <p className="text-gray-300 text-[15px] leading-relaxed" data-editor-field="contactAddress">
                                        {String(data.contactAddress ?? "123 Luxury Lane,\nBeverly Hills, CA 90210").split('\n').map((line, i) => (
                                            <span key={i}>{line}<br /></span>
                                        ))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[14px] text-gray-400">
                    <p data-editor-field="copyrightText">{String(data.copyrightText ?? "© 2024 Villa Estates. All rights reserved.")}</p>
                    <div className="flex items-center gap-4">
                        {bottomLinks.map((link: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4">
                                <Link href={String(link.url ?? "#")} className="hover:text-white transition-colors" data-editor-field="bottomLinkLabel">
                                    {String(link.label ?? "")}
                                </Link>
                                {idx < bottomLinks.length - 1 && <span className="text-gray-600">|</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}