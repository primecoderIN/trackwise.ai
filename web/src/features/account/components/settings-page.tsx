// The Settings page (/settings): organized into four sections (Profile, Preferences, Security, Developer) with tabs on
// one page (Phase 28). Part of the account feature (components/); its route file is
// app/(client)/(app)/settings/page.tsx. Everything on it is the person's own (D190).

import { KeyRound, Shield, SlidersHorizontal, User, type LucideIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/shared/components/page-header"
import { Button } from "@/shared/ui/button"

import { useTexts } from "../i18n"
import { PreferencesCard } from "./preferences-card"
import { ProfileCard } from "./profile-card"
import { SessionsCard } from "./sessions/sessions-card"
import { TokensCard } from "./tokens/tokens-card"

type SettingsSection = "profile" | "preferences" | "security" | "developer"

const SECTIONS: { id: SettingsSection; icon: LucideIcon }[] = [
  { id: "profile", icon: User },
  { id: "preferences", icon: SlidersHorizontal },
  { id: "security", icon: Shield },
  { id: "developer", icon: KeyRound },
]

/** The Settings page: a shared header, a section tab bar, and the chosen section's card. */
export function SettingsPage() {
  const { t } = useTexts()
  const [section, setSection] = useState<SettingsSection>("profile")

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <div className="flex flex-wrap gap-1 border-b pb-2" role="tablist" aria-label={t("sections.label")}>
        {SECTIONS.map(({ id, icon: Icon }) => (
          <Button
            key={id}
            role="tab"
            id={`settings-tab-${id}`}
            aria-selected={section === id}
            aria-controls={`settings-panel-${id}`}
            variant={section === id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSection(id)}
          >
            <Icon className="size-4" />
            {t(`sections.${id}`)}
          </Button>
        ))}
      </div>
      <div role="tabpanel" id={`settings-panel-${section}`} aria-labelledby={`settings-tab-${section}`}>
        {section === "profile" && <ProfileCard />}
        {section === "preferences" && <PreferencesCard />}
        {section === "security" && <SessionsCard />}
        {section === "developer" && <TokensCard />}
      </div>
    </div>
  )
}
