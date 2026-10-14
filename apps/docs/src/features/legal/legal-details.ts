import type { Locale } from '@/presentation/i18n/locale'

/** A private individual: a name and a contact, never a postal address or a phone number. */
export const PUBLISHER = {
  contactHrefFor: (locale: Locale): string =>
    `https://adrienlcp.com/${locale}/contact`,
  name: 'Adrien Lacourpaille'
} as const

/** The site is served by Cloudflare Pages. */
export const HOST = {
  addressLines: ['101 Townsend St', 'San Francisco, CA 94107', 'USA'],
  name: 'Cloudflare, Inc.'
} as const

export const CNIL_COMPLAINT_HREF = 'https://www.cnil.fr/fr/plaintes'
