import type { ShotsSettings, Theme } from './shots-settings.ts'

/** One browser set-up: a width, and the locale and theme when the run names some. */
export type ShotVariant = {
  locale: string | null
  theme: Theme | null
  width: number
}

const orNothing = <Item>(items: readonly Item[]): readonly (Item | null)[] =>
  items.length === 0 ? [null] : items

/** Every width × locale × theme the settings ask for, widths outermost. */
export const shotVariantsOf = ({
  locales,
  themes,
  widths
}: Pick<ShotsSettings, 'locales' | 'themes' | 'widths'>): ShotVariant[] =>
  widths.flatMap((width) =>
    orNothing(locales).flatMap((locale) =>
      orNothing(themes).map((theme) => ({ locale, theme, width }))
    )
  )
