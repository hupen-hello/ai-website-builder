"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function MotionShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.88, touchMultiplier: 1.05, anchors: true });
    const syncScroll = () => ScrollTrigger.update();
    lenis.on("scroll", syncScroll);
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const context = gsap.context(() => {
      gsap.set("[data-hero-device], [data-workflow-beam], [data-workflow-stage], [data-studio-frame], [data-studio-float], [data-neon-orb], [data-launch-panel]", { force3D: true });
      gsap.from("[data-hero-line]", {
        yPercent: 115,
        duration: 1.15,
        stagger: 0.1,
        ease: "power4.out",
      });
      gsap.from("[data-hero-fade]", {
        opacity: 0,
        y: 28,
        duration: 0.9,
        stagger: 0.12,
        delay: 0.45,
        ease: "power3.out",
      });
      gsap.to("[data-orbit]", {
        rotate: 360,
        duration: 26,
        repeat: -1,
        ease: "none",
      });
      const heroScroll = root.current?.querySelector<HTMLElement>("[data-hero-scroll]");
      if (heroScroll) {
        gsap.set("[data-hero-device]", {
          y: 150,
          scale: 0.68,
          rotateX: 58,
          rotateY: -8,
          transformPerspective: 1800,
          force3D: true,
        });
        gsap.timeline({
          scrollTrigger: {
            trigger: heroScroll,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        })
          .to("[data-hero-copy]", { y: -185, opacity: 0, ease: "none", duration: 0.38 }, 0)
          .to("[data-scroll-hint]", { opacity: 0, y: 15, ease: "none", duration: 0.18 }, 0)
          .to("[data-hero-device]", {
            y: -330,
            scale: 0.94,
            rotateX: 0,
            rotateY: 0,
            ease: "none",
            force3D: true,
            duration: 0.68,
          }, 0)
          .to("[data-dashboard-status]", {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.08,
            ease: "power2.out",
            duration: 0.24,
          }, 0.48)
          .to("[data-dashboard-shine]", { xPercent: 170, ease: "none", duration: 0.6 }, 0.12)
          .to("[data-hero-glow]", { scale: 1.18, opacity: 0.9, ease: "none" }, 0);
      }
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 70,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 86%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        gsap.from(group.children, {
          opacity: 0,
          y: 45,
          stagger: 0.12,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 82%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
        gsap.to(element, {
          yPercent: -16,
          ease: "none",
          scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-intelligence-card]").forEach((card, index) => {
        gsap.from(card, {
          opacity: 0,
          y: 90,
          rotateX: 12,
          duration: 1,
          delay: index * 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-intelligence-orb]").forEach((orb, index) => {
        gsap.to(orb, {
          y: -10,
          rotate: index % 2 === 0 ? 4 : -4,
          duration: 2.4 + index * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-ribbon]").forEach((ribbon, index) => {
        gsap.to(ribbon, {
          xPercent: index === 0 ? 12 : -10,
          yPercent: index === 0 ? -8 : 8,
          ease: "none",
          scrollTrigger: { trigger: ribbon.parentElement, start: "top bottom", end: "bottom top", scrub: 1.5 },
        });
      });
      const studioFrame = root.current?.querySelector<HTMLElement>("[data-studio-frame]");
      if (studioFrame) {
        gsap.from(studioFrame, {
          scale: 0.9,
          rotateX: 8,
          transformOrigin: "center top",
          ease: "none",
          scrollTrigger: { trigger: studioFrame, start: "top bottom", end: "top 30%", scrub: 1.1 },
        });
        gsap.from("[data-studio-panel]", {
          x: (index) => index === 0 ? -55 : 55,
          opacity: 0,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: studioFrame, start: "top 72%", end: "top 38%", scrub: 0.7 },
        });
        gsap.from("[data-studio-canvas]", {
          scale: 0.94,
          opacity: 0.5,
          ease: "none",
          scrollTrigger: { trigger: studioFrame, start: "top 82%", end: "top 36%", scrub: 0.75 },
        });
        gsap.to("[data-studio-shine]", {
          xPercent: 520,
          ease: "none",
          scrollTrigger: { trigger: studioFrame, start: "top 75%", end: "bottom 35%", scrub: 0.8 },
        });
      }
      gsap.utils.toArray<HTMLElement>("[data-studio-float]").forEach((panel, index) => {
        gsap.to(panel, { y: index === 0 ? -10 : 10, duration: 2.4 + index * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
      });
      gsap.utils.toArray<HTMLElement>("[data-workflow-beam]").forEach((beam, index) => {
        gsap.to(beam, {
          xPercent: index === 1 ? 16 : -10,
          yPercent: index === 1 ? -7 : 7,
          ease: "none",
          scrollTrigger: { trigger: beam.parentElement, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });
      const workflowStage = root.current?.querySelector<HTMLElement>("[data-workflow-stage]");
      if (workflowStage) {
        gsap.from(workflowStage, {
          scale: 0.92,
          rotateX: 7,
          transformPerspective: 1600,
          transformOrigin: "center top",
          ease: "none",
          scrollTrigger: { trigger: workflowStage, start: "top bottom", end: "top 28%", scrub: 0.75 },
        });
      }
      gsap.utils.toArray<HTMLElement>("[data-neon-orb]").forEach((orb, index) => {
        gsap.to(orb, {
          xPercent: index === 0 ? 22 : index === 1 ? -15 : 12,
          yPercent: index === 2 ? -18 : 14,
          scale: index === 1 ? 1.12 : 0.94,
          ease: "none",
          scrollTrigger: { trigger: orb.parentElement, start: "top bottom", end: "bottom top", scrub: 1.25 },
        });
      });
      const launchPanel = root.current?.querySelector<HTMLElement>("[data-launch-panel]");
      if (launchPanel) {
        gsap.from(launchPanel, {
          y: 80,
          rotateY: -7,
          scale: 0.96,
          transformPerspective: 1500,
          transformOrigin: "left center",
          ease: "none",
          scrollTrigger: { trigger: launchPanel, start: "top 92%", end: "top 42%", scrub: 0.8 },
        });
        gsap.from("[data-launch-step]", {
          opacity: 0,
          y: 24,
          stagger: 0.1,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: { trigger: launchPanel, start: "top 58%", once: true },
        });
        gsap.to("[data-launch-line]", {
          width: "100%",
          stagger: 0.1,
          duration: 0.7,
          ease: "power2.inOut",
          scrollTrigger: { trigger: launchPanel, start: "top 52%", once: true },
        });
      }
      ScrollTrigger.refresh();
    }, root);

    return () => {
      context.revert();
      lenis.off("scroll", syncScroll);
      gsap.ticker.remove(update);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
