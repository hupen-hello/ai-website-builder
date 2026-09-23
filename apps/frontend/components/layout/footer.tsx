import Link from "next/link";

export default function Footer() {
  const links = [
    { name: "Privacy Policy", href: "/", title: "Privacy Policy" },
    { name: "Description", href: "/", title: "Description" },
    { name: "Contact Us", href: "/", title: "Contact Us" },
  ];

  return (
    <>
      <footer className="fixed bottom-0 left-0 z-50 w-full shrink-0 bg-white">
        <div className="border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} CSS AI Builder
              </p>

              <nav>
                <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        title={link.title}
                        className="text-sm font-semibold text-gray-700 transition-colors hover:text-[var(--red)]"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
