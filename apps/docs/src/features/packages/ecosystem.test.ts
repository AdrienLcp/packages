import { describe, expect, it } from 'vitest'

import { ecosystemOf } from './ecosystem.ts'
import type { EntryPoint } from './entry-points.ts'

const moduleEntry: EntryPoint = {
  format: 'module',
  path: 'src/index.js',
  specifier: '@adrienlcp/x'
}
const cssEntry: EntryPoint = {
  format: 'file',
  path: 'src/theme.css',
  specifier: '@adrienlcp/x/theme.css'
}

const ecosystemWith = (overrides: Partial<Parameters<typeof ecosystemOf>[0]>) =>
  ecosystemOf({
    entryPoints: [],
    keywords: [],
    optionalPeers: [],
    peers: [],
    ...overrides
  })

describe('ecosystemOf', () => {
  it('[ecosystem] names a tool for each peer it knows, and ignores the others', () => {
    expect(ecosystemWith({ peers: ['react', 'lodash'] })).toEqual([
      { isOptional: false, tool: 'react' }
    ])
  })

  it.each([
    ['@biomejs/biome', 'biome'],
    ['react-aria-components', 'react-aria'],
    ['react-router', 'react-router'],
    ['sass', 'sass'],
    ['vite', 'vite']
  ])('[ecosystem] reads the peer %s as %s', (peer, tool) => {
    expect(ecosystemWith({ peers: [peer] })).toEqual([
      { isOptional: false, tool }
    ])
  })

  it('[ecosystem] marks a tool optional when its peer is optional', () => {
    expect(ecosystemWith({ optionalPeers: ['sass'], peers: ['sass'] })).toEqual(
      [{ isOptional: true, tool: 'sass' }]
    )
  })

  it('[ecosystem] names TypeScript from a module entry point', () => {
    expect(ecosystemWith({ entryPoints: [moduleEntry] })).toEqual([
      { isOptional: false, tool: 'typescript' }
    ])
  })

  it('[ecosystem] names TypeScript from the typescript keyword', () => {
    expect(ecosystemWith({ keywords: ['i18n', 'typescript'] })).toEqual([
      { isOptional: false, tool: 'typescript' }
    ])
  })

  it('[ecosystem] names CSS from a .css entry point', () => {
    expect(ecosystemWith({ entryPoints: [cssEntry] })).toEqual([
      { isOptional: false, tool: 'css' }
    ])
  })

  it('[ecosystem] lists required tools first, each group in the order of the known tools', () => {
    expect(
      ecosystemWith({
        entryPoints: [moduleEntry, cssEntry],
        optionalPeers: ['sass', 'vite'],
        peers: ['vite', 'sass', 'react-router', 'react']
      })
    ).toEqual([
      { isOptional: false, tool: 'react-router' },
      { isOptional: false, tool: 'react' },
      { isOptional: false, tool: 'typescript' },
      { isOptional: false, tool: 'css' },
      { isOptional: true, tool: 'sass' },
      { isOptional: true, tool: 'vite' }
    ])
  })

  it('[ecosystem] ties a package to nothing when it has no peer, keyword or entry point', () => {
    expect(ecosystemWith({})).toEqual([])
  })
})
