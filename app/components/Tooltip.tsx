"use client";

import React, { useState, useRef } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-surface border-x-transparent border-b-transparent border-8",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-surface border-x-transparent border-t-transparent border-8",
    left: "left-full top-1/2 -translate-y-1/2 border-l-surface border-y-transparent border-r-transparent border-8",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-surface border-y-transparent border-l-transparent border-8",
  };

  return (
    <div
      className="relative inline-block cursor-help"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-100 w-48 p-3 rounded-2xl bg-surface border border-border/50 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${positionClasses[position]}`}
          style={{ backgroundColor: "rgba(var(--surface-rgb), 0.95)" }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
            Information
          </p>
          <p className="text-[10px] font-bold leading-relaxed opacity-60">
            {content}
          </p>
          <div className={`absolute ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};
