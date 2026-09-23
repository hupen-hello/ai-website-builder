import { SelectedConfig } from "../types/section";

export const selectedConfig: SelectedConfig = {
  templateId: "template-1",

  sections: [
    {
      type: "Topbar",
      variant: "Topbar-1",
      data: {
        "Topbar-1": {
          topbarBackgroundType: "solid",
          topbarBackgroundColor: "#000f3c",
          topbarGradientColor: "#0668ff",
          topbarTextColor: "#ffffff",
          text: ["Your smile, our priority!"],
          phone: "+1 (555) 123-4567",
          email: "hello@smilecare.com",
          location: "New Delhi, India",
          socialLinks: [
            { label: "facebook", href: "#" },
            { label: "twitter", href: "#" },
            { label: "linkedin", href: "#" },
          ],
        },
        "Topbar-2": {
          topbarBackgroundType: "gradient",
          topbarBackgroundColor: "#245c6e",
          topbarGradientColor: "#0668ff",
          topbarTextColor: "#ffffff",
          text: ["Trusted Healthcare For Every Family"],
          phone: "+1 (555) 123-4567",
          email: "hello@smilecare.com",
          location: "New Delhi, India",
          socialLinks: [
            { label: "facebook", href: "#" },
            { label: "twitter", href: "#" },
            { label: "linkedin", href: "#" },
          ],
        },
        "Topbar-4": {
          topbarBackgroundType: "solid",
          topbarBackgroundColor: "#ffffff",
          topbarGradientColor: "#e2e8f0",
          topbarTextColor: "#0f172a",
          text: ["Trusted Healthcare For Every Family"],
          phone: "+1 (555) 123-4567",
          email: "hello@smilecare.com",
          location: "New Delhi, India",
          socialLinks: [
            { label: "facebook", href: "#" },
            { label: "twitter", href: "#" },
            { label: "linkedin", href: "#" },
          ],
        },
      },
    },
    {
      type: "Header",
      variant: "Header-1",
      data: {
        "Header-1": {
          logo: "Header1",
          headerBackgroundType: "solid",
          headerBackgroundColor: "#245c6e",
          headerGradientColor: "#0668ff",
          headerTextColor: "#ffffff",
          menu: [
            { label: "Home", href: "#" },
            { label: "About", href: "#" },
            { label: "Service", href: "#" },
            { label: "Gallery", href: "#" },
            { label: "Blog", href: "#" },
          ],
          buttons: [
            {
              label: "Generate Report",
              href: "#",
              variant: "primary",
            },
            {
              label: "Call Us",
              href: "#",
              variant: "secondary",
            },
          ],
        },

        "Header-2": {
          logo: "Header2",
          headerBackgroundType: "solid",
          headerBackgroundColor: "#245c6e",
          headerGradientColor: "#0668ff",
          headerTextColor: "#ffffff",
          menu: [
            { label: "Home", href: "#" },
            { label: "Services", href: "#" },
            { label: "Contact", href: "#" },
          ],
          buttons: [{ label: "Call 2", href: "#" }],
        },
      },
    },
    {
      type: "Banner",
      variant: "Banner-1",
      data: {
        "Banner-1": {
          bannerBackgroundMode: "image",
          backgroundImage: "/bg1.jpg",
          backgroundImageTitle: "BG1",
          backgroundVideo: "",
          bannerBackgroundColor: "#0f172a",
          bannerGradientColor: "#0ea5e9",
          bannerHeight: 70,
          pretitle: "Free AI tools from Google Cloud",
          title: "Watch your cart shrink.",
          desc: "Google AI Studio is the fast path for developers, students, and researchers who want to try Gemini models and start building with the Gemini Developer API. We also offer free tools for common AI use cases, including translation, image and video analysis, speech-to-text, and more.",
          buttons: [
            {
              label: "Learn more",
              href: "#",
            },
          ],
        },
        "Banner-2": {
          bannerBackgroundMode: "video",
          backgroundImage: "/bg2.jpg",
          backgroundImageTitle: "AI rays",
          backgroundVideo: "/video.mp4",
          bannerBackgroundColor: "#0f172a",
          bannerGradientColor: "#0ea5e9",
          bannerHeight: 70,
          pretitle: "Launch faster with AI",
          title: "Build smarter pages in minutes.",
          desc: "You can build AI agents with Gemini Enterprise Agent Platform. Get started by exploring Agent Garden for pre-built, customizable blueprints, complete with source code and configuration files.",
          buttons: [
            {
              label: "Start building",
              href: "#",
            },
          ],
        },
        "Banner-3": {
          bannerHeight: 70,
          bannerSlides: [
            {
              image: "/bg1.jpg",
              alt: "AI website builder dashboard",
              title: "Build Your Website Today",
              desc: "Create polished pages from reusable blocks that your backend can update with clean JSON.",
              button: {
                label: "Get Started",
                href: "#",
                variant: "primary",
              },
            },
            {
              image: "/bg2.jpg",
              alt: "AI powered banner design",
              title: "Change Every Slide",
              desc: "Each slide has its own image, title, description, and button so content stays simple to manage.",
              button: {
                label: "View Demo",
                href: "#",
                variant: "primary",
              },
            },
            {
              image: "/ai_rays.png",
              alt: "AI rays visual",
              title: "Ready For Backend Data",
              desc: "Send bannerSlides from the backend and this layout will render the slider automatically.",
              button: {
                label: "Learn More",
                href: "#",
                variant: "primary",
              },
            },
          ],
        },
      },
    },
    {
      type: "About",
      variant: "About-1",
      data: {
        "About-1": {
          pretitle: "Know more of us",
          title: "About Us",
          desc: "Google AI Studio is the fast path for developers, students, and researchers who want to try Gemini models and start building with the Gemini Developer API. We also offer free tools for common AI use cases, including translation, image and video analysis, speech-to-text, and more.",
          desc2:
            "This integration can help you spend less time on infrastructure management and more time on refining your models to solve complex business problems.",
          backgroundImage: "/bg2.jpg",
          backgroundImageTitle: "About image",
          buttons: [
            {
              label: "Contact Us",
              href: "#",
            },
          ],
        },
        "About-2": {
          pretitle: "Know More of Us",
          title: "About Us",
          subtitle: "Luxurious Interior and Industrial Design",
          desc: "Modern Elegance: Designs featuring clean lines, neutral palettes, and high-quality materials.",
          backgroundImage: "/blackbay.png",
          backgroundImageTitle: "Modern luxury living room interior",
          sideImage: "/shaye.png",
          sideImageTitle: "Luxury interior chair design",
          philosophyTitle: "Our Philosophy",
          philosophyDesc:
            "At Britto Charette, we believe in creating luxurious, personalized environments that reflect our clients' tastes and lifestyles.",
          buttons: [
            {
              label: "Contact Us",
              href: "#",
              variant: "primary",
            },
          ],
        },
      },
    },
    {
      type: "Product",
      variant: "Product-1",
      data: {
        "Product-1": {
          serviceSlides: [
             {
              image: "/prod2.jpg",
              alt: "Laptop product two",
              productTitle: "Travel Ready Build",
              productSubtitle: "Packed for the next trip",
              productInfoTitle: "Compact Power",
              productInfoDesc:
                "We also offer free tools for common AI use cases, including translation, image and video analysis, speech-to-text, and more.",
              productFeatures: [
                {
                  label: "Hard shell body",
                  price: "+$140",
                },
                {
                  label: "Matte blue finish",
                  price: "+$65",
                },
                {
                  label: "Silent spin wheels",
                  price: "+$110",
                },
                {
                  label: "Travel lock",
                  price: "+$30",
                },
              ],
              productTotalPrice: "$1385",
              productShippingText: "Express shipping available",
              button: {
                label: "View details",
                href: "#",
                variant: "primary",
              },
            },
            {
              image: "/55.jpg",
              alt: "Laptop product one",
              productTitle: "Builder Nor Showcase",
              productSubtitle: "Create the art of below",
              productInfoTitle: "Inspiration Need",
              productInfoDesc:
                "We assist travelers worldwide with every and arrivals cards. Get accurate guidance, faster processing, and reliable support before your journey begins.",
              productFeatures: [
                {
                  label: "Small suitcase",
                  price: "+$100",
                },
                {
                  label: "Cold wind color",
                  price: "+$50",
                },
                {
                  label: "360° Spin wheels",
                  price: "+$95",
                },
                {
                  label: "Fixes handle",
                  price: "0",
                },
              ],
              productTotalPrice: "$1245",
              productShippingText: "Free shipping available",
              button: {
                label: "Know more",
                href: "#",
                variant: "primary",
              },
            },
           
          ],
        },
        "Product-2": {
          productSectionTitle: "Featured Products",
          productItems: [
            {
              title: "Travel Ready Build",
              category: "Product 1",
              desc: "A compact showcase card for product-led websites with clear imagery, short details, and quick scanning.",
              image: "/bg1.jpg",
              alt: "Travel ready suitcase product",
            },
            {
              title: "Builder Nor Showcase",
              category: "Product 2",
              desc: "A flexible product card layout that can highlight collections, services, packages, or featured inventory.",
              image: "/bg2.jpg",
              alt: "Builder showcase product",
            },
            {
              title: "Black Bay Interior",
              category: "Product 3",
              desc: "Use this card to present premium visuals with a concise product story and strong browsing rhythm.",
              image: "/blackbay.png",
              alt: "Black Bay interior product",
            },
            {
              title: "Shaye Collection",
              category: "Product 4",
              desc: "A clean card for carousel browsing, useful when a site needs multiple product highlights in one section.",
              image: "/shaye.png",
              alt: "Shaye collection product",
            },
            {
              title: "Stylam Display",
              category: "Product 5",
              desc: "A simple product item designed to be controlled entirely from selectedConfig data.",
              image: "/stylam.png",
              alt: "Stylam display product",
            },
          ],
        },
        "Product-3": {
          pretitle: "How we build",
          title: "Most web builders get in your way. We don't.",
          desc: "We build sites that load fast and work harder. No bloated themes, no unnecessary code, just clean digital solutions from New Delhi.",
          buttons: [
            {
              label: "Take the virtual walkthrough",
              href: "#",
              variant: "primary",
            },
            {
              label: "Email us",
              href: "mailto:hello@example.com",
              variant: "secondary",
            },
          ],
          productItems: [
            {
              title: "Virtual walkthrough first",
              category: "Walkthrough",
              desc: "A guided tour of your site before the AI writes a single line of code.",
              image: "/bg1.jpg",
              imageTitle: "Website builder laptop",
            },
            {
              title: "AI-powered page builder",
              category: "AI Builder",
              desc: "Describe what you need. The AI generates it in seconds, not weeks.",
              image: "/bg2.jpg",
              imageTitle: "AI page builder desk setup",
            },
            {
              title: "Fast-loading pages",
              category: "Performance",
              desc: "Clean code means your site loads fast on any device, anywhere.",
              image: "/blackbay.png",
              imageTitle: "Fast loading mobile website",
            },
            {
              title: "Built for New Delhi",
              category: "Local SEO",
              desc: "Local SEO and regional optimization built in. Your site shows up where it matters.",
              image: "/shaye.png",
              imageTitle: "New Delhi street",
            },
            {
              title: "One person, full focus",
              category: "Custom Build",
              desc: "No account managers, no committees. Just Muneeb building your site from scratch.",
              image: "/stylam.png",
              imageTitle: "Developer working at desk",
            },
            {
              title: "Simple pricing, no surprises",
              category: "Pricing",
              desc: "What you see is what you pay. No hidden fees or upsells for basic features.",
              image: "/prod2.jpg",
              imageTitle: "Simple pricing card",
            },
          ],
        },
      },
    },
    {
      type: "Footer",
      variant: "Footer-1",
      data: {
        "Footer-1": {
          logo: "BlackBay",
          desc: "We create modern websites that are fast, responsive, and AI-powered to help your business grow online.",
          footerBackgroundType: "solid",
          footerBackgroundColor: "#0d1f2a",
          footerGradientColor: "#1d4ed8",
          footerTextColor: "#ffffff",
          footerMutedTextColor: "#cbd5e1",
          footerSocialLinks: [
            { label: "facebook", href: "#" },
            { label: "instagram", href: "#" },
            { label: "twitter", href: "#" },
            { label: "linkedin", href: "#" },
          ],
          footerColumns: [
            {
              title: "Quick Links",
              links: [
                { label: "Home", href: "/" },
                { label: "About", href: "/about" },
                { label: "Services", href: "/services" },
                { label: "Pricing", href: "/pricing" },
                { label: "Contact", href: "/contact" },
              ],
            },
            {
              title: "Services",
              links: [
                { label: "Website Design", href: "#" },
                { label: "Landing Pages", href: "#" },
                { label: "AI Website Builder", href: "#" },
                { label: "SEO Optimization", href: "#" },
                { label: "Website Maintenance", href: "#" },
              ],
            },
          ],
          footerContact: {
            location: "New Delhi, India",
            email: "hello@example.com",
            phone: "+91 12345 67890",
          },
          footerLegalLinks: [
            { label: "Privacy Policy", href: "#" },
            { label: "Terms & Conditions", href: "#" },
          ],
          copyrightText: "© 2026 BlackBay. All rights reserved.",
        },
      },
    },
  ],
};
