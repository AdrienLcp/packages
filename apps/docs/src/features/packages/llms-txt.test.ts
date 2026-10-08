import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

import { llmsTxt } from '@/entry-server'

const PACKAGES_ROOT = fileURLToPath(
  new URL('../../../../../packages', import.meta.url)
)

const publishedPackageNames = readdirSync(PACKAGES_ROOT, {
  withFileTypes: true
})
  .filter((entry) => entry.isDirectory())
  .map((entry) =>
    JSON.parse(
      readFileSync(join(PACKAGES_ROOT, entry.name, 'package.json'), 'utf8')
    )
  )
  .filter((manifest) => manifest.private !== true)
  .map((manifest): string => manifest.name)

it.each(publishedPackageNames)('[llms-txt] links the page of %s', (name) => {
  expect(llmsTxt('https://example.com')).toContain(
    `- [${name}](https://example.com/en/`
  )
})
