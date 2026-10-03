import { CATALOGUE as BUILT_CATALOGUE } from 'virtual:catalogue'

import type { HousePackage } from './house-package.ts'

/** Every package of the repository, newest release first, read when the site is built. */
export const CATALOGUE: readonly HousePackage[] = BUILT_CATALOGUE
