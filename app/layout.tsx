import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import InstallPrompt from "./components/InstallPrompt";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";

import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ZeroDevSmartWalletConnectors } from "@dynamic-labs/ethereum-aa";
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

export const metadata: Metadata = {
  title: "Circlepot",
  description:
    "Circlepot is a community savings platform that lets users deposit and withdraw in local currency while saving in stable digital dollars through automated, trustless savings circles and personal goals.",
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
        <DynamicContextProvider
          settings={{
            environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
            walletConnectors: [
              EthereumWalletConnectors,
              ZeroDevSmartWalletConnectors,
            ],
          }}
        >
          <ClientProviders>
            <ServiceWorkerRegistrar />
            {children}
            <InstallPrompt />
          </ClientProviders>
        </DynamicContextProvider>
      </body>
    </html>
  );
}
