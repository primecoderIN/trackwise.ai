// Server-rendered Hero showcase entry rendering the interactive animated walkthrough video player on `/` and `/hi`.
// Part of app/_public/components/ (Phase 29).

import type { PublicSiteTexts } from "../texts"
import { WalkthroughPlayer } from "./walkthrough-player"

/** Wraps the client-side animated product walkthrough player with localized English/Hindi scene data. */
export function HeroShowcase({ texts }: { texts: PublicSiteTexts }) {
  return <WalkthroughPlayer walkthrough={texts.landing.walkthrough} />
}
