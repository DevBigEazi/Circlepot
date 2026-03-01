import React from "react";
import Image from "next/image";

interface OnboardingSlideProps {
  imageSrc: string;
  imageAlt: string;
  headline: string;
  copy: string;
  isActive: boolean;
  isCustomGraphic?: boolean;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  imageSrc,
  imageAlt,
  headline,
  copy,
  isActive,
  isCustomGraphic = false,
}) => {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out px-6 md:px-12 w-full
      ${isActive ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-8 pointer-events-none"}
      `}
    >
      <div className="w-full max-w-sm flex flex-col items-center flex-1 justify-center space-y-8 mt-12 mb-24">
        {/* Visual Graphic with pop animation */}
        <div
          className={`relative flex-center w-64 h-64 md:w-80 md:h-80 transition-transform duration-700 delay-100
             ${isActive ? "scale-100 opacity-100" : "scale-90 opacity-0"}
          `}
        >
          {isCustomGraphic ? (
            // A dynamic abstract graphical placeholder if needed, otherwise uses standard Image
            <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 256px, 320px"
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 256px, 320px"
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2 max-w-sm">
          <h2
            className={`text-[32px] md:text-4xl font-schibsted-grotesk font-bold text-foreground leading-tight tracking-tight transition-all duration-500 delay-200
               ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            {headline}
          </h2>
          <p
            className={`text-base md:text-lg text-text-light font-medium transition-all duration-500 delay-300
              ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            {copy}
          </p>
        </div>
      </div>
    </div>
  );
};
