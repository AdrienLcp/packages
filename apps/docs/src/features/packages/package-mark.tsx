import type React from 'react'

import { IconSquare } from '@/presentation/components/icon-square'
import { PackageIcon } from '@/presentation/components/icons'

import { CATALOGUE } from './catalogue-content.ts'
import { EcosystemLogo } from './ecosystem-logo.tsx'
import { HouseMark, hasHouseMark } from './house-mark.tsx'
import type { HousePackage } from './house-package.ts'
import { hueAmong } from './package-hue.ts'

const PACKAGE_NAMES = CATALOGUE.map((housePackage) => housePackage.name)

/** The hue that marks a package everywhere: its square, its kind squares. */
export const packageHueOf = (name: string): number =>
  hueAmong({ name, names: PACKAGE_NAMES })

type PackageMarkProps = {
  housePackage: HousePackage
  /** Default: `'s'`. */
  size?: 's' | 'm' | 'l' | 'xl'
  /** Default: `'mark'`; `'hollow'` when a filter left the package out. */
  tone?: 'hollow' | 'mark'
}

/**
 * A package's square: its hue, and its own mark or else the logo of the first
 * tool it works with.
 */
export const PackageMark: React.FC<PackageMarkProps> = ({
  housePackage,
  size = 's',
  tone = 'mark'
}) => {
  const [primaryTie] = housePackage.ecosystem

  return (
    <IconSquare hue={packageHueOf(housePackage.name)} size={size} tone={tone}>
      {hasHouseMark(housePackage.name) ? (
        <HouseMark name={housePackage.name} />
      ) : primaryTie === undefined ? (
        <PackageIcon />
      ) : (
        <EcosystemLogo tool={primaryTie.tool} />
      )}
    </IconSquare>
  )
}
