import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { exportsIndexOf } from '../src/features/packages/exports-index.ts'
import { packageSourcesIn } from '../src/features/packages/package-sources.ts'

const repositoryRoot = resolve(import.meta.dirname, '../../..')

writeFileSync(
  resolve(repositoryRoot, 'EXPORTS.md'),
  exportsIndexOf(packageSourcesIn(resolve(repositoryRoot, 'packages')))
)
