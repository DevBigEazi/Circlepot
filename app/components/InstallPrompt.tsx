"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

// Extended interface for the beforeinstallprompt event (Chrome/Android)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Detect iOS devices — including iPads running iPadOS 13+
 * which report as "Macintosh" in their user agent.
 */
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || navigator.vendor;

  // Standard iOS detection
  const isStandardIOS =
    /iPad|iPhone|iPod/.test(userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  // iPadOS 13+ detection — Safari on iPad reports as "Macintosh"
  // but supports touch, so we detect via maxTouchPoints
  const isIPadOS =
    userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1;

  return isStandardIOS || isIPadOS;
}

/**
 * Detect if running in standalone mode (installed PWA)
 */
function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari-specific standalone check
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}

/**
 * Detect Safari browser specifically
 */
function detectSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
}

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem("circlepot-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }

    // Detect platform
    const isIOSDevice = detectIOS();
    const isAndroidDevice = /android/i.test(
      navigator.userAgent || navigator.vendor,
    );
    const isSafariBrowser = detectSafari();
    const isStandaloneMode = detectStandalone();

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);
    setIsStandalone(isStandaloneMode);

    // Listen for the beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    // Listen for display mode changes (e.g., user installs mid-session)
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setShowPrompt(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayModeQuery.addEventListener("change", handleDisplayModeChange);

    // For iOS/Safari, show the prompt after a short delay
    // since beforeinstallprompt is not supported
    if (
      (isIOSDevice || (isSafariBrowser && !isAndroidDevice)) &&
      !isStandaloneMode &&
      !wasDismissed
    ) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt,
        );
        window.removeEventListener("appinstalled", handleAppInstalled);
        displayModeQuery.removeEventListener("change", handleDisplayModeChange);
      };
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowPrompt(false);
    sessionStorage.setItem("circlepot-install-dismissed", "true");
  }, []);

  // Don't show if already installed, already standalone, or dismissed
  if (isStandalone || dismissed || !showPrompt) return null;

  // Success state after installation
  if (installed) {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.successIcon}>✓</div>
          <h3 style={styles.title}>Circlepot Installed!</h3>
          <p style={styles.subtitle}>
            You can now access Circlepot from your home screen.
          </p>
          <button
            style={styles.primaryButton}
            onClick={() => setShowPrompt(false)}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Determine which instructions to show
  const showIOSInstructions = isIOS && !deferredPrompt;
  const showSafariMacInstructions =
    isSafari && !isIOS && !isAndroid && !deferredPrompt;
  const showAndroidFallback = isAndroid && !deferredPrompt;

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Close button */}
        <button
          style={styles.closeButton}
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>

        {/* App icon */}
        <div style={styles.iconWrapper}>
          <Image
            src="/assets/images/pwa-192x192.png"
            alt="Circlepot"
            width={64}
            height={64}
            style={{ borderRadius: "16px" }}
          />
        </div>

        <h3 style={styles.title}>Install Circlepot</h3>
        <p style={styles.subtitle}>
          Add Circlepot to your home screen for quick access to savings circles
          and personal goals.
        </p>

        {/* iOS-specific instructions (iPhone, iPad, iPod) */}
        {showIOSInstructions && (
          <div style={styles.instructionBox}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <p style={styles.stepText}>
                Tap the{" "}
                <span style={styles.inlineIcon}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5C6F2B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{" "}
                <strong>Share</strong> button at the bottom of Safari
              </p>
            </div>
            <div style={styles.stepDivider} />
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <p style={styles.stepText}>
                Scroll down and tap{" "}
                <strong>&quot;Add to Home Screen&quot;</strong>{" "}
                <span style={styles.inlineIcon}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5C6F2B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </p>
            </div>
            <div style={styles.stepDivider} />
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <p style={styles.stepText}>
                Tap <strong>&quot;Add&quot;</strong> in the top right corner
              </p>
            </div>
          </div>
        )}

        {/* Safari on macOS instructions */}
        {showSafariMacInstructions && (
          <div style={styles.instructionBox}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <p style={styles.stepText}>
                Click the{" "}
                <span style={styles.inlineIcon}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5C6F2B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{" "}
                <strong>Share</strong> button in the Safari toolbar
              </p>
            </div>
            <div style={styles.stepDivider} />
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <p style={styles.stepText}>
                Click <strong>&quot;Add to Dock&quot;</strong>
              </p>
            </div>
          </div>
        )}

        {/* Android fallback instructions (no beforeinstallprompt) */}
        {showAndroidFallback && (
          <div style={styles.instructionBox}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <p style={styles.stepText}>
                Tap the{" "}
                <strong>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ verticalAlign: "middle" }}
                  >
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>{" "}
                  menu
                </strong>{" "}
                in your browser
              </p>
            </div>
            <div style={styles.stepDivider} />
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <p style={styles.stepText}>
                Tap <strong>&quot;Add to Home Screen&quot;</strong> or{" "}
                <strong>&quot;Install App&quot;</strong>
              </p>
            </div>
          </div>
        )}

        {/* Chrome/Edge/Android with native prompt */}
        {deferredPrompt && (
          <button style={styles.primaryButton} onClick={handleInstallClick}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Install App
          </button>
        )}

        <button style={styles.secondaryButton} onClick={handleDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}

// ─── Inline Styles (Circlepot brand) ──────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    padding: "16px",
    // Safe area for iOS notch / home indicator
    paddingBottom: "max(16px, env(safe-area-inset-bottom))",
    animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  container: {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "28px 24px 20px",
    boxShadow:
      "0 -4px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(92, 111, 43, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    // Prevent iOS text size adjust
    WebkitTextSizeAdjust: "100%",
  },
  closeButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#F1F5F1",
    color: "#6B7280",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
    // Larger tap target for touch devices
    minWidth: "44px",
    minHeight: "44px",
    margin: "-4px -4px 0 0",
  },
  iconWrapper: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    backgroundColor: "#F1F5F1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "4px",
    boxShadow: "0 2px 8px rgba(92, 111, 43, 0.12)",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#2E3338",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#6B7280",
    textAlign: "center" as const,
    lineHeight: "1.5",
    maxWidth: "320px",
  },
  instructionBox: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    marginTop: "4px",
    padding: "16px",
    backgroundColor: "#F8F9FA",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 0",
  },
  stepDivider: {
    height: "1px",
    backgroundColor: "#E5E7EB",
    marginLeft: "40px",
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#5C6F2B",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    margin: 0,
    fontSize: "14px",
    color: "#2E3338",
    lineHeight: "1.4",
  },
  inlineIcon: {
    display: "inline-flex",
    verticalAlign: "middle",
  },
  primaryButton: {
    width: "100%",
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#5C6F2B",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "background-color 0.2s, transform 0.1s",
    marginTop: "4px",
    // iOS touch highlight
    WebkitTapHighlightColor: "transparent",
    // Minimum touch target (Apple HIG: 44pt)
    minHeight: "48px",
  },
  secondaryButton: {
    padding: "10px 24px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "transparent",
    color: "#6B7280",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "color 0.2s",
    WebkitTapHighlightColor: "transparent",
    minHeight: "44px",
  },
  successIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#5C6F2B",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "4px",
  },
};
