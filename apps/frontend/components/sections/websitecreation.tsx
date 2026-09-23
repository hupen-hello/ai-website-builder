"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    PanelsTopLeft,
    PenTool,
    Plus,
    ShieldCheck,
    Sparkles,
    WandSparkles,
    Zap,
} from "lucide-react";

export type WebsiteAction = "redesign" | "create-ai" | "create-custom";

type CategoryStepProps = {
    showErrors: boolean;
    selectedAction: WebsiteAction | "";
    onActionChange: (action: WebsiteAction) => void;
};

export default function WebsiteCreation({
    showErrors,
    selectedAction,
    onActionChange,
}: CategoryStepProps) {
    const [view, setView] = useState<"root" | "create">(
        selectedAction === "create-ai" || selectedAction === "create-custom"
            ? "create"
            : "root",
    );

    const handleRootCreate = () => {
        setView("create");
    };

    const handleBackToRoot = () => {
        setView("root");
    };

    const isCreatePath =
        selectedAction === "create-ai" || selectedAction === "create-custom";

    return (
        <section className="relative mx-auto flex min-h-[560px] w-full items-center justify-center overflow-hidden rounded-[30px] border border-white/70 bg-white/90 px-5 py-8 shadow-[0_28px_90px_rgba(50,63,120,0.14)] backdrop-blur-xl sm:px-8 lg:min-h-[650px] lg:px-12">
            {/* Background glow */}
            <div className="pointer-events-none absolute -left-20 top-24 h-44 w-44 rounded-full bg-blue-200/50 blur-2xl" />
            <div className="pointer-events-none absolute -right-20 top-14 h-52 w-52 rounded-full bg-violet-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-8 h-52 w-52 rounded-full bg-orange-100/80 blur-3xl" />

            {/* Decorative shapes */}
            <div className="pointer-events-none absolute left-0 top-[28%] h-28 w-20 -translate-x-7 rounded-r-full bg-gradient-to-br from-blue-100 to-cyan-100 opacity-90" />
            <div className="pointer-events-none absolute right-8 top-[18%] h-16 w-16 rotate-12 rounded-[22px] bg-gradient-to-br from-violet-200 to-indigo-300 shadow-[0_15px_35px_rgba(119,89,255,0.18)]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-36 w-36 rounded-tl-[100px] bg-gradient-to-br from-orange-100 via-rose-100 to-pink-200/80" />

            <div className="pointer-events-none absolute right-8 top-[40%] grid grid-cols-4 gap-2 opacity-60">
                {Array.from({ length: 16 }).map((_, index) => (
                    <span
                        key={index}
                        className="h-1.5 w-1.5 rounded-full bg-violet-300"
                    />
                ))}
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
                <div className="relative mx-auto mb-6 grid size-14 place-items-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-white shadow-[0_20px_45px_rgba(78,89,255,0.32)]">
                    <WandSparkles size={22} strokeWidth={2.2} />
                    <span className="absolute -right-5 -top-3 text-blue-400">
                        <Sparkles size={20} fill="currentColor" />
                    </span>
                    <span className="absolute -left-5 bottom-2 text-violet-300">
                        <Sparkles size={14} fill="currentColor" />
                    </span>
                </div>

                <h2 className="text-balance text-4xl font-bold tracking-[-0.045em] text-[#071434] sm:text-5xl lg:text-4xl">
                    {view === "create" ? (
                        <>
                            How do you want to{" "}
                            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
                                create
                            </span>
                            ?
                        </>
                    ) : (
                        <>
                            {`Let's`} Bring Your{" "}
                            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
                                Vision to Life
                            </span>
                        </>
                    )}
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-base text-slate-500 sm:text-lg">
                    {view === "create"
                        ? "Pick AI generation or a custom design path."
                        : `Choose how ${`you'd`} like to get started.`}
                </p>

                {view === "create" && (
                    <div className="mx-auto mt-6 flex justify-center">
                        <button
                            type="button"
                            onClick={handleBackToRoot}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                        >
                            <ArrowLeft size={16} />
                            Back to options
                        </button>
                    </div>
                )}

                {view === "root" ? (
                    <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
                        <ActionCard
                            active={selectedAction === "redesign"}
                            title="Redesign existing website"
                            description="Use your live domain — we pull logo, images, content & menu, then rebuild."
                            icon={<PanelsTopLeft size={34} strokeWidth={1.9} />}
                            accent="blue"
                            onClick={() => onActionChange("redesign")}
                        />

                        <ActionCard
                            active={isCreatePath}
                            title="Create new website"
                            description="Start from scratch and build something new."
                            icon={<Plus size={38} strokeWidth={2.2} />}
                            accent="violet"
                            onClick={handleRootCreate}
                        />
                    </div>
                ) : (
                    <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
                        <ActionCard
                            active={selectedAction === "create-ai"}
                            title="Create with AI"
                            description="Describe your business and let AI generate your site."
                            icon={<Zap size={34} strokeWidth={1.9} />}
                            accent="violet"
                            onClick={() => onActionChange("create-ai")}
                        />

                        <ActionCard
                            active={selectedAction === "create-custom"}
                            title="Create with custom design"
                            description="Pick a template and customize it your way."
                            icon={<PenTool size={34} strokeWidth={1.9} />}
                            accent="blue"
                            onClick={() => onActionChange("create-custom")}
                        />
                    </div>
                )}

                {showErrors && !selectedAction && (
                    <p className="mt-4 text-sm font-medium text-rose-500">
                        {view === "create"
                            ? "Please choose Create with AI or custom design."
                            : "Please choose how you want to continue."}
                    </p>
                )}

                <div className="mt-9 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 sm:text-xs">
                    <ShieldCheck size={21} className="text-emerald-500" />
                    <span>Secure. Private. Always yours.</span>
                </div>
            </div>
        </section>
    );
}

type ActionCardProps = {
    title: string;
    description: string;
    icon: ReactNode;
    accent: "blue" | "violet";
    active: boolean;
    onClick: () => void;
};

function ActionCard({
    title,
    description,
    icon,
    accent,
    active,
    onClick,
}: ActionCardProps) {
    const isBlue = accent === "blue";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex min-h-[120px] w-full items-center gap-5 overflow-hidden rounded-[26px] border bg-white/80 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(51,65,120,0.13)] active:translate-y-0 sm:p-7 ${active
                ? isBlue
                    ? "border-blue-400 ring-4 ring-blue-100/80"
                    : "border-violet-400 ring-4 ring-violet-100/80"
                : isBlue
                    ? "border-blue-100 hover:border-blue-300"
                    : "border-violet-100 hover:border-violet-300"
                }`}
        >
            <div
                className={`grid size-20 shrink-0 place-items-center rounded-[22px] border bg-white shadow-[0_12px_30px_rgba(45,55,100,0.11)] transition-transform duration-300 group-hover:scale-105 ${isBlue
                    ? "border-blue-100 text-blue-500"
                    : "border-violet-100 text-violet-600"
                    }`}
            >
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold leading-tight tracking-[-0.03em] text-[#08132f] sm:text-xl">
                    {title}
                </h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 sm:text-sm">
                    {description}
                </p>
            </div>

            <span
                className={`grid size-12 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_25px_rgba(44,58,110,0.10)] transition-all duration-300 group-hover:translate-x-1 ${isBlue ? "text-blue-500" : "text-violet-600"
                    }`}
            >
                <ArrowRight size={24} />
            </span>

            <div
                className={`pointer-events-none absolute -bottom-14 -right-12 h-36 w-36 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${isBlue ? "bg-blue-200" : "bg-violet-200"
                    }`}
            />
        </button>
    );
}
