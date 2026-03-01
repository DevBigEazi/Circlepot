"use client";

import React from "react";

interface AuthHeaderProps {
  title?: string;
  description?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  description,
}) => {
  if (!title && !description) return null;

  return (
    <div
      className="flex flex-col items-center justify-center mb-10 space-y-4"
      suppressHydrationWarning
    >
      <div className="text-center space-y-2 max-w-xs transition-all duration-500">
        {title && (
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-schibsted-grotesk animate-fade-in">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-text-light text-sm leading-relaxed animate-fade-in [animation-delay:100ms]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
