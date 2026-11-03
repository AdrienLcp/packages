import type { Locale } from '@/presentation/i18n/locale'

/** The author every page credits in its footer, linked to his site in the reader's language. */
export const AUTHOR = {
  name: 'Adrien Lacourpaille',
  siteHref: {
    en: 'https://adrienlcp.com/en',
    fr: 'https://adrienlcp.com/fr'
  }
} as const satisfies { name: string; siteHref: Record<Locale, string> }
