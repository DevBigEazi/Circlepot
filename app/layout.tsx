import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import InstallPrompt from "./components/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      // iPhone / iPod touch
      {
        url: "/assets/images/pwa-512x512.png",
        media: "(device-width: 320px)",
      },
      // Fallback for all other iOS devices
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistrar />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
