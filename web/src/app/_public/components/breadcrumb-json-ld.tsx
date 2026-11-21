// Schema.org BreadcrumbList structured data helper rendered inside secondary public pages (/features, /security, /faq, etc.).
// Keeps breadcrumb JSON-LD localized in English and Hindi across all non-home public routes.

import { siteUrl } from "@/app/_seo/seo"

/** Renders JSON-LD `BreadcrumbList` structured data linking Home to the current public route. */
export function BreadcrumbJsonLd({
  homeName,
  homePath,
  pageName,
  pagePath,
}: {
  homeName: string
  homePath: string
  pageName: string
  pagePath: string
}) {
  const origin = siteUrl()
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeName, item: new URL(homePath, origin).toString() },
      { "@type": "ListItem", position: 2, name: pageName, item: new URL(pagePath, origin).toString() },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  )
}
