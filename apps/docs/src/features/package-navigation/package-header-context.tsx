import type React from 'react'

import { PACKAGE_TITLE_ID } from '@/features/package-pages/package-title-id'
import { CATALOGUE } from '@/features/packages/catalogue-content'
import type { HousePackage } from '@/features/packages/house-package'
import { PackageMark } from '@/features/packages/package-mark'
import {
  packagePathFor,
  useCurrentPath
} from '@/infrastructure/router/navigation'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { useScrolledPast } from './use-scrolled-past'

import './package-header-context.sass'

const ScrolledPackageName: React.FC<{ housePackage: HousePackage }> = ({
  housePackage
}) => {
  const isTitleScrolledPast = useScrolledPast(PACKAGE_TITLE_ID)

  return (
    <span
      aria-hidden
      className='package-header-context'
      data-shown={isTitleScrolledPast || undefined}
    >
      <PackageMark housePackage={housePackage} />
      <span className='package-header-context-name'>{housePackage.name}</span>
    </span>
  )
}

/**
 * The package's name in the top bar once its title has scrolled away, on a
 * screen too narrow for the sidebar that would otherwise say where you are.
 * Hidden from assistive technology: it repeats the page's `<h1>`.
 */
export const PackageHeaderContext: React.FC = () => {
  const { locale } = useI18n()
  const currentPath = useCurrentPath()
  const housePackage = CATALOGUE.find(
    ({ name }) => packagePathFor({ locale, packageName: name }) === currentPath
  )

  return housePackage === undefined ? null : (
    <ScrolledPackageName housePackage={housePackage} key={currentPath} />
  )
}
