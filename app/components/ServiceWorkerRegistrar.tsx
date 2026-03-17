"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(() => {
          // ("SW Registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("SW Registration failed:", error);
        });
    }
  }, []);

  return null;
}
