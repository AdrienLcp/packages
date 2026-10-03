import { Result } from '@adrienlcp/result'

/** What the site reads from a package's `package.json`. */
export type PackageManifest = {
  /** The names of its runtime dependencies. */
  dependencies: readonly string[]
  description: string
  /** As written: its shape is `entryPointsOf`'s to read. */
  exports: unknown
  keywords: readonly string[]
  name: string
  /** The peers `peerDependenciesMeta` marks optional. */
  optionalPeers: readonly string[]
  peers: readonly string[]
  version: string
}

type Fields = Record<string, unknown>

const isRecord = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const keysOf = (value: unknown): readonly string[] =>
  isRecord(value) ? Object.keys(value) : []

const stringsOf = (value: unknown): readonly string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []

const isOptionalPeer = (meta: unknown): boolean =>
  isRecord(meta) && meta.optional === true

const optionalPeersOf = (value: unknown): readonly string[] =>
  isRecord(value)
    ? Object.entries(value).flatMap(([name, meta]) =>
        isOptionalPeer(meta) ? [name] : []
      )
    : []

/** Reads a parsed `package.json`, failing when it lacks a name, a version or a description. */
export const parsePackageManifest = (
  manifest: unknown
): Result<PackageManifest, 'malformed'> => {
  if (
    !isRecord(manifest) ||
    typeof manifest.name !== 'string' ||
    typeof manifest.version !== 'string' ||
    typeof manifest.description !== 'string'
  ) {
    return Result.failure('malformed')
  }

  return Result.success({
    dependencies: keysOf(manifest.dependencies),
    description: manifest.description,
    exports: manifest.exports,
    keywords: stringsOf(manifest.keywords),
    name: manifest.name,
    optionalPeers: optionalPeersOf(manifest.peerDependenciesMeta),
    peers: keysOf(manifest.peerDependencies),
    version: manifest.version
  })
}
