import type { ShotVariant } from './shot-variant.ts'

const HOME_SLUG = 'home'
const PNG_EXTENSION = '.png'
const SEGMENT_SEPARATOR = '.'
const SLUG_UNSAFE = /[^\w-]+/g
const SLUG_EDGES = /^_+|_+$/g
const PARSING_BASE = 'http://shots.invalid'

const slugOf = (text: string): string =>
  text.replace(SLUG_UNSAFE, '_').replace(SLUG_EDGES, '')

/**
 * A path as a file name segment: `/` is `home`, `/deputes/PA793214` is
 * `deputes_PA793214`, and a query or a hash follows the path,
 * `/?period=7d` being `home_period_7d`.
 */
export const pathSlugOf = (path: string): string => {
  const { hash, pathname, search } = new URL(path, PARSING_BASE)
  const pathSlug = slugOf(pathname) || HOME_SLUG
  return [pathSlug, slugOf(search), slugOf(hash)]
    .filter((part) => part !== '')
    .join('_')
}

/**
 * The PNG of one path in one variant, `settings.fr.dark.360.png`: path,
 * locale, theme, width, so a folder listing groups a page's shots together. A
 * locale or theme the run does not vary is left out.
 */
export const shotFileNameOf = ({
  path,
  variant
}: {
  path: string
  variant: ShotVariant
}): string =>
  [pathSlugOf(path), variant.locale, variant.theme, String(variant.width)]
    .filter((segment) => segment !== null)
    .join(SEGMENT_SEPARATOR) + PNG_EXTENSION
