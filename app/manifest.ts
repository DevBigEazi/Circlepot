import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Circlepot",
    short_name: "Circlepot",
    description:
      "Circlepot is a community savings platform that lets users deposit and withdraw in local currency while saving in stable digital dollars through automated, trustless savings circles and personal goals.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F9FA",
    theme_color: "#5C6F2B",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/assets/images/pwa-64x64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/assets/images/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/images/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/assets/images/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
