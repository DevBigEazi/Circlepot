"use client";

import { X, MessageSquare, Construction } from "lucide-react";
import { ThemeColors } from "../../hooks/useThemeColors";

interface CircleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleName: string;
  colors: ThemeColors;
}

export const CircleChatModal = ({
  isOpen,
  onClose,
  circleName,
  colors,
}: CircleChatModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-4 animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div
          className="p-5 sm:p-8 border-b relative"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 sm:right-8 top-4 sm:top-8 p-2 rounded-xl hover:bg-black/5 transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2 pr-10 sm:pr-12">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: colors.background,
                color: colors.primary,
              }}
            >
              <MessageSquare size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg sm:text-2xl font-black tracking-tight truncate"
                style={{ color: colors.text }}
              >
                Circle Chat
              </h2>
              <p className="text-[9px] sm:text-xs font-bold opacity-40 uppercase tracking-widest truncate">
                {circleName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
            <Construction className="w-8 h-8 sm:w-12 sm:h-12" />
          </div>
          <div className="space-y-2">
            <h4
              className="text-lg sm:text-xl font-black"
              style={{ color: colors.text }}
            >
              Coming Soon!
            </h4>
            <p className="text-xs sm:text-sm font-medium opacity-50 max-w-[240px]">
              We&apos;re building a secure, private chat for your circle
              members. Stay tuned!
            </p>
          </div>
        </div>

        <div
          className="p-5 sm:p-8 border-t"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs bg-black text-white hover:opacity-90 transition-opacity"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
