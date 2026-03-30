import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import InstallPrompt from "./components/InstallPrompt";
import DynamicProvider from "./components/DynamicProvider";
import { ClientProviders } from "./components/ClientProviders";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://test.circlepot.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | Circlepot",
    default: "Circlepot — Save Together, Grow Together",
  },
  description:
    "Save together, grow together, anywhere. Circlepot lets you create savings circles with friends, set personal goals, and save in stable digital dollars — all automated and secure.",
  keywords: [
    "community savings",
    "ROSCA",
    "savings circle",
    "DeFi savings",
    "blockchain savings",
    "USDT savings",
    "smart contract savings",
    "rotating savings",
    "Avalanche DeFi",
    "decentralized finance",
    "personal savings goals",
    "group savings",
  ],
  category: "Finance",
  openGraph: {
    type: "website",
    siteName: "Circlepot",
    locale: "en_US",
    title: "Circlepot — Save Together, Grow Together",
    description:
      "Create savings circles with friends, set personal goals, and save in stable digital dollars. Automated, secure, and built for communities.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Circlepot — Save Together, Grow Together",
    description:
      "Create savings circles with friends, set personal goals, and save in stable digital dollars.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Circlepot",
    startupImage: [
      {
        url: "/assets/images/pwa-512x512.png",
        media: "(device-width: 320px)",
      },
      {
        url: "/assets/images/pwa-512x512.png",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/assets/images/favicon.ico", sizes: "any" },
      {
        url: "/assets/images/pwa-64x64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        url: "/assets/images/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/assets/images/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#5C6F2B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Circlepot",
  url: siteUrl,
  logo: `${siteUrl}/assets/images/logo.png`,
  description:
    "Community savings platform that lets you save with friends in stable digital dollars — automated, secure, and transparent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${schibstedGrotesk.className} ${schibstedGrotesk.variable} ${martianMono.className} ${martianMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <DynamicProvider>
          <ClientProviders>
            <ServiceWorkerRegistrar />
            {children}
            <InstallPrompt />
          </ClientProviders>
        </DynamicProvider>
      </body>
    </html>
  );
}
