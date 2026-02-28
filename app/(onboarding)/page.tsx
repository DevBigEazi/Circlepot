"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingSlide } from "./components/OnboardingSlide";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ChevronRight } from "lucide-react";

export default function OnboardingCarousel() {
  const router = useRouter();
  const { user } = useDynamicContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);

    // Check if already completed
    const hasCompleted = localStorage.getItem("circlepot_onboarding_completed");

    if (user) {
      localStorage.setItem("circlepot_onboarding_completed", "true");
      router.replace("/dashboard");
      return;
    }

    if (hasCompleted) {
      router.replace("/auth");
    }
  }, [router, user]);

  const slides = [
    {
      id: "welcome",
      imageSrc: "/assets/images/full-logo.png",
      imageAlt: "Welcome illustration",
      headline: "Welcome to Circlepot",
      copy: "Save together, grow together, anywhere. Automated, trustless community savings.",
    },
    {
      id: "circles",
      imageSrc: "/assets/images/collaboration.png",
      imageAlt: "Savings Circles Graphic",
      headline: "Join Savings Circles",
      copy: "Pool funds with friends or community members. Take turns receiving the total payout safely and automatically.",
      isCustomGraphic: true,
    },
    {
      id: "security",
      imageSrc: "/assets/images/stable.png",
      imageAlt: "Security shield logo",
      headline: "Secure & Stable",
      copy: "Powered by smart contracts and stable digital dollars (USDT) to protect against inflation.",
    },
  ];

  const totalSlides = slides.length;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setCurrentSlide(totalSlides - 1);
  };

  if (!isClient) return null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {currentSlide < totalSlides - 1 && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-50 text-text-light font-medium py-2 px-4 hover:text-foreground transition-colors"
        >
          Skip
        </button>
      )}

      {/* Main Slide Carousel Window */}
      <div className="relative w-full h-[75%] flex flex-col justify-center items-center">
        {slides.map((slide, index) => (
          <OnboardingSlide
            key={slide.id}
            imageSrc={slide.imageSrc}
            imageAlt={slide.imageAlt}
            headline={slide.headline}
            copy={slide.copy}
            isActive={currentSlide === index}
            isCustomGraphic={slide.isCustomGraphic}
          />
        ))}
      </div>

      {/* Navigation & Controls Section (Bottom 25%) */}
      <div className="absolute bottom-0 w-full h-[25%] px-6 pb-safe flex flex-col justify-between max-w-sm mx-auto left-0 right-0">
        {/* Progress Dots Indicator */}
        <div className="flex justify-center flex-row gap-3 py-4">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                currentSlide === idx
                  ? "w-8 bg-primary"
                  : "w-2 bg-border hover:bg-border/60"
              }`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>

        {/* CTA Button Logic */}
        <div className="mb-12 flex flex-col space-y-4">
          {currentSlide === totalSlides - 1 ? (
            <button
              onClick={() => {
                localStorage.setItem("circlepot_onboarding_completed", "true");
                router.push("/auth");
              }}
              className="btn-primary w-full h-14 text-lg shadow-lg animate-slide-up"
            >
              Get Started <ChevronRight className="w-5 h-5 ml-1 opacity-80" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn-primary w-full h-14 text-lg shadow-lg"
            >
              Next <ChevronRight className="w-5 h-5 ml-1 opacity-80" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
