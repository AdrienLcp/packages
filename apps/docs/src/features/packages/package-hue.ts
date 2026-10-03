const FULL_TURN = 360
const FIRST_HUE = 28

/**
 * Spreads the packages evenly round the hue wheel, in alphabetical order of
 * their name, so no two share a tint and a package keeps its hue whatever the
 * site sorts by.
 */
export const hueAmong = ({
  name,
  names
}: {
  name: string
  names: readonly string[]
}): number => {
  const ordered = names.toSorted((first, second) => first.localeCompare(second))
  const step = FULL_TURN / Math.max(ordered.length, 1)

  return Math.round((FIRST_HUE + ordered.indexOf(name) * step) % FULL_TURN)
}
