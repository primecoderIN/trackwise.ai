// Temporary legacy boot namespaces still waiting on i18next during feature migration (`auth`).
// `common` and `app` are now loaded per request by `next-intl`; this file disappears once features complete migration.

import { authTexts } from "@/features/auth"

/** Remaining boot namespace loaded by the temporary i18next bridge. */
export const BOOT_NAMESPACES = [authTexts] as const
