import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://test.circlepot.xyz";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/join/*"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/savings/",
          "/profile/",
          "/settings/",
          "/notifications/",
          "/transactions-history/",
          "/external-wallets/",
          "/local-methods/",
          "/browse/",
          "/create/",
          "/withdraw/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
