"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff, Save } from "lucide-react";
import { useThemeColors } from "../../hooks/useThemeColors";

interface UpdateVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  currentVisibility: number;
  isLoading?: boolean;
  onUpdate: (visibility: 0 | 1) => Promise<void>;
}

export const UpdateVisibilityModal: React.FC<UpdateVisibilityModalProps> = ({
  isOpen,
  onClose,
  circleName,
  currentVisibility,
  isLoading = false,
  onUpdate,
}) => {
  const colors = useThemeColors();
  const [selectedVisibility, setSelectedVisibility] = useState<0 | 1>(
    currentVisibility as 0 | 1,
  );
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(selectedVisibility);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

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
              <Eye size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg sm:text-2xl font-black tracking-tight truncate"
                style={{ color: colors.text }}
              >
                Settings
              </h2>
              <p className="text-[9px] sm:text-xs font-bold opacity-40 uppercase tracking-widest truncate">
                {circleName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
          <div className="space-y-3">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
              Circle Visibility
            </h4>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setSelectedVisibility(0)}
                className={`p-4 sm:p-5 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                  selectedVisibility === 0
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-black/5 hover:bg-black/10"
                }`}
                style={{
                  borderColor:
                    selectedVisibility === 0 ? colors.primary : "transparent",
                  color: colors.text,
                }}
              >
                <EyeOff size={24} className="opacity-80" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
                  Private
                </span>
              </button>

              <button
                onClick={() => setSelectedVisibility(1)}
                className={`p-4 sm:p-5 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                  selectedVisibility === 1
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-black/5 hover:bg-black/10"
                }`}
                style={{
                  borderColor:
                    selectedVisibility === 1 ? colors.primary : "transparent",
                  color: colors.text,
                }}
              >
                <Eye size={24} className="opacity-80" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
                  Public
                </span>
              </button>
            </div>

            {selectedVisibility !== currentVisibility && (
              <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600">
                <p className="text-[10px] sm:text-xs font-bold leading-relaxed">
                  Note: Changing circle visibility requires paying a visibility
                  fee of $0.5 USDT. Ensure you have enough funds.
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className="p-5 sm:p-8 border-t flex gap-3 sm:gap-4"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] border-2 transition-all hover:bg-black/5"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={
              isUpdating ||
              isLoading ||
              selectedVisibility === currentVisibility
            }
            className="flex-3 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 sm:gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            {isUpdating || isLoading ? (
              "Updating..."
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
