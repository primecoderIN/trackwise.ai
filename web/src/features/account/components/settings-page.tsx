// The Settings page (/settings): organized into four sections (Profile, Preferences, Security, Developer) with a
// desktop vertical rail / mobile pill bar, WAI-ARIA arrow-key navigation, and `?section=` URL sync. Part of account.

import { KeyRound, Shield, SlidersHorizontal, User, type LucideIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRef, useState, type KeyboardEvent } from "react"

import { PageHeader } from "@/shared/components/page-header"

import { PreferencesCard } from "./preferences-card"
import { ProfileCard } from "./profile-card"
import { SessionsCard } from "./sessions/sessions-card"
import { TokensCard } from "./tokens/tokens-card"

type SettingsSection = "profile" | "preferences" | "security" | "developer"

const SECTIONS: readonly { id: SettingsSection; icon: LucideIcon }[] = [
  { id: "profile", icon: User },
  { id: "preferences", icon: SlidersHorizontal },
  { id: "security", icon: Shield },
  { id: "developer", icon: KeyRound },
]

function isSettingsSection(value: string | null): value is SettingsSection {
  return SECTIONS.some((section) => section.id === value)
}

/** The Settings page: header, accessible sidebar/pill navigation, and active section card. */
export function SettingsPage() {
  const t = useTranslations("account")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const paramSection = searchParams.get("section")
  const initialSection: SettingsSection = isSettingsSection(paramSection) ? paramSection : "profile"
  const [section, setSection] = useState<SettingsSection>(initialSection)
  const [lastParam, setLastParam] = useState(paramSection)
  const tabRefs = useRef<Record<SettingsSection, HTMLButtonElement | null>>({
    profile: null,
    preferences: null,
    security: null,
    developer: null,
  })

  if (paramSection !== lastParam) {
    setLastParam(paramSection)
    if (isSettingsSection(paramSection)) setSection(paramSection)
  }

  function selectSection(next: SettingsSection, focus = false) {
    setSection(next)
    setLastParam(next)
    router.replace(next === "profile" ? pathname : `${pathname}?section=${next}`, { scroll: false })
    if (focus) tabRefs.current[next]?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % SECTIONS.length
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + SECTIONS.length) % SECTIONS.length
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = SECTIONS.length - 1
    }
    if (nextIndex !== null) {
      event.preventDefault()
      selectSection(SECTIONS[nextIndex].id, true)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <div className="grid gap-6 lg:grid-cols-[13.5rem_1fr] lg:items-start">
        <div
          role="tablist"
          aria-label={t("sections.label")}
          className="flex gap-1 overflow-x-auto rounded-2xl border border-border/80 bg-card p-1.5 shadow-xs lg:flex-col"
        >
          {SECTIONS.map(({ id, icon: Icon }, index) => {
            const active = section === id
            return (
              <button
                key={id}
                ref={(node) => {
                  tabRefs.current[id] = node
                }}
                type="button"
                role="tab"
                id={`settings-tab-${id}`}
                aria-selected={active}
                aria-controls={`settings-panel-${id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectSection(id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-full ${
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{t(`sections.${id}`)}</span>
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`settings-panel-${section}`}
          aria-labelledby={`settings-tab-${section}`}
          className="min-w-0"
        >
          {section === "profile" && <ProfileCard />}
          {section === "preferences" && <PreferencesCard />}
          {section === "security" && <SessionsCard />}
          {section === "developer" && <TokensCard />}
        </div>
      </div>
    </div>
  )
}
