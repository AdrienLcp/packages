import type { HousePackage } from './house-package.ts'

/** When it last shipped through the changelog: `null` for a package never released that way. */
export const lastReleaseDateOf = (
  housePackage: HousePackage
): string | null => {
  const [newest] = housePackage.versions

  return newest?.origin === 'changelog' ? newest.date : null
}
