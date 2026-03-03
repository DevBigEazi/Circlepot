/**
 * Utility functions for authentication validation and error mapping
 */

/**
 * Validates email format using a standard regex
 */
export const isValidEmail = (email: string): boolean => {
  // Robust regex that handles double dots and other common malformed patterns
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

/**
 * Validates phone format (basic check for length and digits)
 */
export const isValidPhone = (phone: string): boolean => {
  // Removes common separators to check actual digit count
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
};

/**
 * Attempts to parse a phone number into dial code and local number
 * Returns US default if it can't be parsed, but tries to be smart
 */
export const parsePhoneNumber = (phoneInput: string) => {
  const cleanPhone = phoneInput.trim();

  // If starts with +, try to extract country code
  if (cleanPhone.startsWith("+")) {
    // This is a simplification, but better than hardcoding US
    // Matches + followed by 1-3 digits
    const match = cleanPhone.match(/^\+(\d{1,3})\s?(.*)$/);
    if (match) {
      return {
        dialCode: match[1],
        phone: match[2].replace(/\D/g, ""),
        iso2: "AUTO", // Dynamic SDK can often handle AUTO or we can map common ones
      };
    }
  }

  // Default to US if no + found (assuming user might have omitted it)
  return {
    dialCode: "1",
    phone: cleanPhone.replace(/\D/g, ""),
    iso2: "US",
  };
};

/**
 * Maps Dynamic SDK errors to user-friendly messages
 */
export const mapDynamicError = (error: any): string | null => {
  if (!error) return null;

  const message = error.message?.toLowerCase() || "";

  // 1. Network / Offline Errors
  if (
    !navigator.onLine ||
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("socket")
  ) {
    return "No internet connection. Please check your network and try again.";
  }

  // 2. User Cancellation (Silent)
  if (
    message.includes("closed") ||
    message.includes("cancelled") ||
    message.includes("dismissed") ||
    message.includes("user_cancelled")
  ) {
    return null;
  }

  // 3. Configuration Errors (Dashboard)
  if (
    message.includes("not enabled") ||
    message.includes("configuration") ||
    message.includes("misconfigured")
  ) {
    return "This login method is not yet configured. Please use Email login for now.";
  }

  // 4. OTP / Verification Errors
  if (
    message.includes("invalid") &&
    (message.includes("code") || message.includes("otp"))
  ) {
    return "The code you entered is incorrect. Please check and try again.";
  }

  if (message.includes("expired")) {
    return "This code has expired. Please request a new one.";
  }

  if (
    message.includes("emailverificationerror") ||
    message.includes('format "email"')
  ) {
    return "Your email address is not correct. Please check for errors (like double dots) and try again.";
  }

  // 5. Rate Limiting
  if (
    message.includes("too many") ||
    message.includes("rate limit") ||
    message.includes("cooldown")
  ) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  // 6. Generic Fallback
  return error.message || "Authentication failed. Please try again.";
};

/**
 * Checks for common email domain typos and returns a suggestion
 */
export const getDomainSuggestion = (email: string): string | null => {
  const commonDomains: Record<string, string> = {
    "gml.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gnail.com": "gmail.com",
    "gamil.com": "gmail.com",
    "yaho.com": "yahoo.com",
    "yhoo.com": "yahoo.com",
    "hotmal.com": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "outlook.co": "outlook.com",
    "icloud.co": "icloud.com",
  };

  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && commonDomains[domain]) {
    return commonDomains[domain];
  }

  return null;
};
