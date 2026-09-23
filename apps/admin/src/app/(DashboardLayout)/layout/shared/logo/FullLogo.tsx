"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <>
      <Image
        src="/images/logos/logo-white.webp"
        alt="logo"
        width={80}
        height={36}
        className="block dark:hidden rtl:scale-x-[-1]"
      />
      <Image
        src="/images/logos/css.webp"
        alt="logo"
        width={152}
        height={36}
        className="hidden dark:block rtl:scale-x-[-1]"
      />
    </>
  );
};

export default FullLogo;