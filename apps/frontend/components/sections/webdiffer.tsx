"use client";

import { Zap, Users, PenTool } from "lucide-react";
import Button from "@/components/ui/Button";
type WebdifferProps = {
  onStart: () => void;
};

export default function Webdiffer({ onStart }: WebdifferProps) {
  const cards = [
    {
      id: 1,
      title: "AI Instant",
      description: "Let AI build your website instantly in seconds.",
      buttonText: "Start with AI",
      href: "/businesstype",
      isDarkButton: false,
      icon: <Zap className="w-8 h-8 text-[var(--red)] fill-[var(--red)]" />,
      isVoid: false,
    },
    {
      id: 2,
      title: "AI + Human",
      description: "AI builds it, our experts refine it perfectly.",
      buttonText: "Get Expert Help",
      href: "/businesstype",
      isDarkButton: true,
      icon: <Users className="w-8 h-8 text-[var(--red)] fill-[var(--red)]" />,
      isVoid: true,
    },
    {
      id: 3,
      title: "Fully Custom",
      description: "Design your website your way, from scratch.",
      buttonText: "Start Customizing",
      href: "/businesstype",
      isDarkButton: false,
      icon: <PenTool className="w-8 h-8 text-[var(--red)]" />,
      isVoid: true,
    },
  ];
  const features = [
    "No coding needed",
    "Drag & drop builder",
    "Mobile responsive",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-gray-800 font-bold text-center mb-2 underline">
        What kind of website do you want?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col items-center justify-between bg-white border border-gray-300 rounded-2xl py-3 px-8 shadow-xl hover:shadow-md hover:scale-[1.01] transition-all duration-300 text-center min-h-[170px] 2xl:min-h-[240px]"
          >
            <div className="flex items-center justify-center h-13 w-13 mb-1 rounded-full bg-red-50/40">
              {card.icon}
            </div>

            <div className="flex-1 inline-flex flex-col items-center justify-start">
              <h3 className="text-xl font-bold text-gray-950 tracking-tight">
                {card.title}
              </h3>
              <p className="text-gray-800 font-normal text-sm leading-relaxed max-w-[210px]">
                {card.description}
              </p>
            </div>

            <div className="w-full mt-4">
              <Button
                type="button"
                onClick={(e) => {
                  if (card.isVoid) {
                    e.preventDefault();
                    return;
                  }
                  onStart();
                }}
                variant={card.isDarkButton ? "dark" : "danger"}
                className={`w-full rounded-lg px-6 py-2.5 font-bold text-sm tracking-wide ${card.isVoid ? "cursor-none" : "cursor-pointer"}`}
              >
                {card.buttonText}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 lg:gap-8 mt-4 mb-20 lg:mb-0">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2">
            <span className="relative h-4 w-4 rounded-full border-2 border-red-600">
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600" />
            </span>

            <span className="text-sm font-semibold text-gray-700">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
