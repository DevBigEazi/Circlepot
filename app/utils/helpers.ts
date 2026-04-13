/**
 * Utility helper functions
 */

/**
 * Extracts initials from a full name.
 * e.g. "John Doe" -> "JD"
 */
export const getInitials = (name?: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Formats a wallet address for display.
 * e.g. "0x1234567890abcdef..." -> "0x1234...ef..."
 */
export const formatAddress = (address?: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};


