// What search engines may crawl: /robots.txt, served by Next.js from this file. Part of the app composition (app/).
// Allows all public pages, static CSS/JS assets, icons, OpenGraph image, and manifest while blocking private signed-in
// workspaces, the API, and MCP endpoints (D188).

import type { MetadataRoute } from "next"

import { API_PREFIX } from "@/shared/api/contracts.gen"
import { WORKSPACE_ROUTES } from "@/shared/config/routes"

import { siteUrl } from "./_seo/seo"

/** robots.txt: index public marketing/trust pages and static assets; keep private user routes and APIs out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/_next/static/",
        "/opengraph-image",
        "/icon",
        "/apple-icon",
        "/favicon.ico",
        "/favicon.svg",
        "/manifest.webmanifest",
      ],
      disallow: [...WORKSPACE_ROUTES, `${API_PREFIX}/`, "/mcp/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  }
}
