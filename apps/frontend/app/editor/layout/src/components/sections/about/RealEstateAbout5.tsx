"use client";

import type { SectionProps } from "../../../types/section";

const IMG = "/categories/realestate/template5";

export default function RealEstateAbout5({ data = {} }: SectionProps) {
  const storyTagline = String(
    data.storyTagline || data.tagline || "About Us Company",
  );
  const storyTitle = String(data.storyTitle || "We Are Always Think");
  const storyDesc = String(
    data.storyDescription ||
      data.description ||
      "Completely orchestrate scalable processes without extensible channels. Credibly administrate reliable web services and progressive catalysts for change.",
  );
  const experienceYears = String(data.experienceYears || "25+");
  const experienceText = String(
    data.experienceText || "Years Experiences<br />Of Construction Company",
  );
  const shapeImage = String(data.shapeImage || `${IMG}/about_1_shape1.png`);
  const image1 = String(data.image1 || `${IMG}/about_1_1.png`);
  const image2 = String(data.image2 || `${IMG}/about_1_2.png`);
  const worldwideLabel = String(
    data.worldwideServicesLabel || "WORLDWIDE SERVICES",
  );
  const worldwideDesc = String(
    data.worldwideServicesDescription ||
      "They provide clients with transparent cost estimates and adhere to the agreed-upon budgets and timelines effectively.",
  );

  return (
    <section
      className="bg-white py-[30px]"
      data-editor-section-label="aboutStory"
      data-editor-fields="storyTagline storyTitle storyDescription experienceYears experienceText shapeImage image1 image2 worldwideServicesLabel worldwideServicesDescription accentColor"
    >
      <div className="mx-auto flex max-w-[1320px] items-center gap-[60px] px-6 max-md:flex-col max-md:items-stretch max-md:gap-6 max-md:px-5">
        <div className="relative min-h-[560px] flex-1 max-md:min-h-[380px]">
          <div className="absolute bottom-[65px] left-0 z-0 max-md:top-[220px] max-md:bottom-auto max-md:left-[-10px] max-md:w-[60px]">
            <img src={shapeImage} alt="" className="block" />
          </div>
          <div className="absolute top-5 left-5 z-[1] h-[460px] w-[60%] max-md:top-0 max-md:left-0 max-md:h-[280px] max-md:w-[70%]">
            <img
              src={image1}
              alt="About"
              className="block h-full w-full object-cover [clip-path:polygon(0_0,100%_0,100%_100%,140px_100%,0_calc(100%-140px))] max-md:[clip-path:polygon(0_0,100%_0,100%_100%,60px_100%,0_calc(100%-60px))]"
            />
          </div>
          <div className="absolute top-5 right-0 z-[2] w-[190px] bg-[var(--accent)] px-[30px] py-10 text-center text-white max-md:top-0 max-md:w-[140px] max-md:px-[15px] max-md:py-5">
            <h3 className="m-0 text-[3.5rem] leading-none font-extrabold max-md:text-[2rem]">
              {experienceYears}
            </h3>
            <p
              className="mt-2.5 mb-0 text-[1.05rem] leading-normal font-semibold max-md:mt-1 max-md:text-[0.8rem]"
              dangerouslySetInnerHTML={{ __html: experienceText }}
            />
          </div>
          <div className="absolute right-0 bottom-[60px] z-[2] h-[200px] w-[320px] max-md:right-0 max-md:bottom-5 max-md:h-[140px] max-md:w-[220px]">
            <img
              src={image2}
              alt="About"
              className="block h-full w-full border-[10px] border-solid border-white object-cover max-md:border-[5px]"
            />
          </div>
        </div>

        <div className="flex-1 pl-10 max-md:pl-0">
          <div className="mb-[30px]">
            <span className="mb-4 inline-block py-1.5 text-[0.95rem] font-bold text-[var(--accent)]">
              {storyTagline}
            </span>
            <h2 className="m-0 text-[3.2rem] leading-[1.15] font-extrabold text-[#161616] max-md:text-[2.2rem]">
              {storyTitle}
            </h2>
          </div>
          <p className="mt-[-0.5rem] mb-10 text-[1.05rem] leading-[1.7] text-[#555]">
            {storyDesc}
          </p>
          <div className="mb-10 flex items-start gap-5">
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center bg-[#fff0e6]">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div>
              <h4 className="mb-2.5 text-[1.15rem] font-bold uppercase text-[#161616]">
                {worldwideLabel}
              </h4>
              <p className="m-0 text-[1.05rem] leading-relaxed text-[#555]">
                {worldwideDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
