"use client";

import React, { useState } from "react";
import { X, UserPlus, Trash2, Send } from "lucide-react";
import { useThemeColors, ThemeColors } from "../../hooks/useThemeColors";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  onInvite: (emails: string[]) => void;
  isLoading?: boolean;
  colors?: ThemeColors;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  circleName,
  onInvite,
  isLoading,
}) => {
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [inviteList, setInviteList] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@") && !inviteList.includes(email)) {
      setInviteList([...inviteList, email]);
      setEmail("");
    }
  };

  const handleRemoveEmail = (index: number) => {
    setInviteList(inviteList.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border-4 animate-in fade-in zoom-in duration-300"
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
              <UserPlus size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg sm:text-2xl font-black tracking-tight truncate"
                style={{ color: colors.text }}
              >
                Invite Members
              </h2>
              <p className="text-[9px] sm:text-xs font-bold opacity-40 uppercase tracking-widest truncate">
                {circleName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
          <form onSubmit={handleAddEmail} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
                Email / Wallet Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="flex-1 bg-black/5 border-2 border-transparent focus:border-primary/20 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none transition-all"
                  style={{ color: colors.text }}
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:opacity-90 active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
              Invitation List
            </h4>
            {inviteList.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {inviteList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/5 border"
                    style={{ borderColor: colors.border }}
                  >
                    <span className="text-[10px] sm:text-xs font-bold truncate pr-4">
                      {item}
                    </span>
                    <button
                      onClick={() => handleRemoveEmail(idx)}
                      className="text-rose-500 hover:bg-rose-500/10 p-1.5 sm:p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="py-6 sm:py-8 text-center bg-black/5 rounded-xl sm:rounded-2xl border-2 border-dashed"
                style={{ borderColor: colors.border }}
              >
                <p className="text-[10px] sm:text-xs font-bold opacity-30 italic">
                  No invitees added yet
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
            onClick={() => onInvite(inviteList)}
            disabled={inviteList.length === 0 || isLoading}
            className="flex-3 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 sm:gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            {isLoading ? (
              "Sending..."
            ) : (
              <>
                <Send size={14} /> Send Invites
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
