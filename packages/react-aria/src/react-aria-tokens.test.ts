import { globSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

import { REACT_ARIA_TOKENS } from './react-aria-tokens.ts'

const componentsDirectory = dirname(
  realpathSync(
    fileURLToPath(import.meta.resolve('react-aria-components/package.json'))
  )
)
const MODULES = [
  join(componentsDirectory, 'dist'),
  join(componentsDirectory, '..', 'react-aria', 'dist')
].flatMap((directory) =>
  globSync('**/*.mjs', { cwd: directory }).map((path) => join(directory, path))
)
const CUSTOM_PROPERTY_LITERAL = /['"](--[a-z][\w-]*)['"]\s*[:,)]/g

/** Reading every react-aria module takes under a second, and nine on a machine busy with another build. */
const READ_EVERY_MODULE_TIMEOUT_MS = 30_000

it('[tokens] lists every custom property react-aria sets at runtime', {
  timeout: READ_EVERY_MODULE_TIMEOUT_MS
}, () => {
  const found = new Set(
    MODULES.flatMap((path) =>
      [...readFileSync(path, 'utf8').matchAll(CUSTOM_PROPERTY_LITERAL)].map(
        ([, name]) => name
      )
    )
  )
  expect(MODULES.length).toBeGreaterThan(0)
  expect([...found].sort()).toEqual([...REACT_ARIA_TOKENS])
})
