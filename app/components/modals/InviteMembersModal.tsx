/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { X, UserPlus, Trash2, Send, Loader2 } from "lucide-react";
import { useThemeColors, ThemeColors } from "../../hooks/useThemeColors";
import { useAccountAddress } from "../../hooks/useAccountAddress";
import { toast } from "sonner";
import { Profile } from "../../types/profile";

interface InviteItem {
  username: string;
  fullName: string;
  address: string;
  avatarUrl: string | null;
}

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  onInvite: (addresses: string[]) => void;
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
  const { address: currentAddress } = useAccountAddress();
  const [identifier, setIdentifier] = useState("");
  const [inviteList, setInviteList] = useState<InviteItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = identifier.trim();

    if (!query) return;

    // Block raw addresses
    if (query.toLowerCase().startsWith("0x") && query.length === 42) {
      toast.error("Please use a Username, Email, or Account ID to find users.");
      return;
    }

    // Check if already in list
    if (
      inviteList.some(
        (item) =>
          item.username.toLowerCase() === query.toLowerCase() ||
          item.address.toLowerCase() === query.toLowerCase(),
      )
    ) {
      toast.error("This user is already in your invitation list.");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/profile/search?query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("Failed to search profile");

      const profile: Profile | null = await response.json();

      if (!profile || !profile.walletAddress) {
        toast.error("User not found. Please verify the identifier.");
        return;
      }

      // Reject if user tries to invite themselves
      if (
        profile.walletAddress.toLowerCase() === currentAddress?.toLowerCase()
      ) {
        toast.error("You cannot invite yourself to this circle.");
        return;
      }

      // Final check by resolved address
      if (
        inviteList.some(
          (item) =>
            item.address.toLowerCase() === profile.walletAddress?.toLowerCase(),
        )
      ) {
        toast.error("This user is already in your invitation list.");
        return;
      }

      const newItem: InviteItem = {
        username: profile.username || "Anonymous",
        fullName:
          `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
          "Anonymous User",
        address: profile.walletAddress,
        avatarUrl: profile.profilePhoto || null,
      };

      setInviteList((prev) => [...prev, newItem]);
      setIdentifier("");
      toast.success(`Added ${newItem.username} to invites`);
    } catch (error) {
      console.error(error);
      toast.error("Resolution failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setInviteList(inviteList.filter((_, i) => i !== index));
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
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
                Username / Account ID / Email
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. alice, 12345, or alice@email.com"
                  className="flex-1 bg-black/5 border-2 border-transparent focus:border-primary/20 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none transition-all"
                  style={{ color: colors.text }}
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-black text-white px-4 sm:px-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSearching ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 px-1">
              Invitation List ({inviteList.length})
            </h4>
            {inviteList.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2 no-scrollbar">
                {inviteList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border transition-colors hover:bg-black/10"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-black/5 overflow-hidden flex items-center justify-center shrink-0 border border-black/5">
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-black opacity-30">
                            {item.username.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-[11px] font-black truncate"
                          style={{ color: colors.text }}
                        >
                          {item.fullName}
                        </div>
                        <div className="text-[9px] font-bold opacity-40 truncate">
                          @{item.username}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-xl transition-colors ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="py-10 text-center bg-black/5 rounded-3xl border-2 border-dashed"
                style={{ borderColor: colors.border }}
              >
                <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                  No invitees resolved
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
            onClick={() => onInvite(inviteList.map((i) => i.address))}
            disabled={inviteList.length === 0 || isLoading}
            className="flex-3 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 sm:gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
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
