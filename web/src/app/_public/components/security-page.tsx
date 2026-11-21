// Server-rendered Security & Trust Center page (`/security` and `/hi/security`, Phase 29).
// Uses PUBLIC_CONTAINER throughout so security architecture pillars and the threat matrix fill desktop screens cleanly.

import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { PUBLIC_CONTAINER } from "./container"
import { PublicFrame } from "./public-frame"

/** Trust Center page detailing authentication, prompt-injection defense, per-user isolation, and DPDP compliance. */
export function PublicSecurityPage({ texts }: { texts: PublicSiteTexts }) {
  const { securityPage } = texts

  return (
    <PublicFrame texts={texts} currentPage="security">
      <section className="border-b bg-[radial-gradient(ellipse_at_top,oklch(0.47_0.19_262_/_0.08),transparent_65%)] pt-12 pb-14 sm:pt-16">
        <div className={PUBLIC_CONTAINER}>
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>{securityPage.heroBadge}</span>
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              {securityPage.heroTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {securityPage.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className={`${PUBLIC_CONTAINER} grid gap-6 md:grid-cols-2`}>
          {securityPage.pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-2xl border bg-card p-6 shadow-xs sm:p-7">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Lock className="size-3.5" aria-hidden="true" />
                <span>{pillar.badge}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {pillar.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30 py-16">
        <div className={PUBLIC_CONTAINER}>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{securityPage.matrixTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{securityPage.matrixSubtitle}</p>
          </div>
          <div className="mt-8 overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full min-w-[540px] border-collapse text-left text-sm">
              <tbody className="divide-y">
                {securityPage.matrixRows.map((row) => (
                  <tr key={row.threat} className="align-top">
                    <th scope="row" className="w-2/5 px-6 py-4 font-semibold">
                      {row.threat}
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">{row.defense}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className={PUBLIC_CONTAINER}>
          <div className="rounded-2xl border bg-card p-8 shadow-xs">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{securityPage.complianceTitle}</h2>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
              {securityPage.complianceBody}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href={texts.paths.privacy}>{securityPage.privacyLink}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={texts.paths.terms}>{securityPage.termsLink}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={texts.paths.contact}>{securityPage.contactLink}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary">
                <Link href={texts.paths.faq}>
                  <span>{securityPage.faqLink}</span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicFrame>
  )
}
