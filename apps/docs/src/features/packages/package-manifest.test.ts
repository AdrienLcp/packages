import { describe, expect, it } from 'vitest'

import { parsePackageManifest } from './package-manifest.ts'

const minimal = {
  description: 'Typed results.',
  name: '@adrienlcp/result',
  version: '0.2.0'
}

describe('parsePackageManifest', () => {
  it('[package-manifest] reads the fields the site shows', () => {
    const manifest = {
      ...minimal,
      dependencies: { '@adrienlcp/result': 'workspace:*' },
      exports: { '.': './dist/index.js' },
      keywords: ['result', 'typescript'],
      peerDependencies: { react: '^19', sass: '^1' },
      peerDependenciesMeta: { react: {}, sass: { optional: true } }
    }

    expect(parsePackageManifest(manifest)).toEqual({
      data: {
        dependencies: ['@adrienlcp/result'],
        description: 'Typed results.',
        exports: { '.': './dist/index.js' },
        keywords: ['result', 'typescript'],
        name: '@adrienlcp/result',
        optionalPeers: ['sass'],
        peers: ['react', 'sass'],
        version: '0.2.0'
      },
      status: 'success'
    })
  })

  it('[package-manifest] reads missing optional fields as empty', () => {
    expect(parsePackageManifest(minimal)).toEqual({
      data: {
        dependencies: [],
        description: 'Typed results.',
        exports: undefined,
        keywords: [],
        name: '@adrienlcp/result',
        optionalPeers: [],
        peers: [],
        version: '0.2.0'
      },
      status: 'success'
    })
  })

  it('[package-manifest] keeps only the string keywords', () => {
    const parsed = parsePackageManifest({
      ...minimal,
      keywords: ['a', 3, null, 'b']
    })

    expect(parsed.status === 'success' && parsed.data.keywords).toEqual([
      'a',
      'b'
    ])
  })

  it('[package-manifest] does not count a peer as optional unless its meta says optional: true', () => {
    const parsed = parsePackageManifest({
      ...minimal,
      peerDependenciesMeta: {
        a: { optional: false },
        b: { optional: 'yes' },
        c: null,
        d: { optional: true }
      }
    })

    expect(parsed.status === 'success' && parsed.data.optionalPeers).toEqual([
      'd'
    ])
  })

  it.each([
    ['a name', { description: 'd', version: '1.0.0' }],
    ['a version', { description: 'd', name: 'n' }],
    ['a description', { name: 'n', version: '1.0.0' }],
    ['a non-string name', { description: 'd', name: 3, version: '1.0.0' }]
  ])('[package-manifest] refuses a manifest with %s', (_case, manifest) => {
    expect(parsePackageManifest(manifest)).toEqual({
      error: 'malformed',
      status: 'failure'
    })
  })

  it.each([[null], ['text'], [[]], [3]])(
    '[package-manifest] refuses %j, which is no object',
    (manifest) => {
      expect(parsePackageManifest(manifest)).toEqual({
        error: 'malformed',
        status: 'failure'
      })
    }
  )
})
