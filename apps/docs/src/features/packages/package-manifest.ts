import { Result } from '@adrienlcp/result'
import { z } from 'zod'

/** What the site reads from a package's `package.json`. */
export type PackageManifest = {
  /** The commands its `bin` puts on the path: a tool, run while building. */
  commands: readonly string[]
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

/** A field the site can do without: anything but the expected shape reads as absent. */
const lenient = <T extends z.ZodType>(schema: T) =>
  schema.optional().catch(undefined)

const namesSchema = lenient(z.record(z.string(), z.unknown()))

const peerMetaSchema = z
  .object({ optional: z.boolean().optional() })
  .nullable()
  .catch(null)

const binSchema = lenient(
  z.union([z.string(), z.record(z.string(), z.string())])
)

const manifestSchema = z.object({
  bin: binSchema,
  dependencies: namesSchema,
  description: z.string(),
  exports: z.unknown().optional(),
  keywords: lenient(z.array(z.unknown())),
  name: z.string(),
  peerDependencies: namesSchema,
  peerDependenciesMeta: lenient(z.record(z.string(), peerMetaSchema)),
  version: z.string()
})

const isString = (value: unknown): value is string => typeof value === 'string'

const SCOPE = /^@[^/]+\//

/** A string `bin` installs one command named after the package, without its scope. */
const commandsOf = ({
  bin,
  name
}: {
  bin: string | Record<string, string> | undefined
  name: string
}): readonly string[] => {
  if (bin === undefined) {
    return []
  }

  return typeof bin === 'string' ? [name.replace(SCOPE, '')] : Object.keys(bin)
}

/** Reads a parsed `package.json`, failing when it lacks a name, a version or a description. */
export const parsePackageManifest = (
  manifest: unknown
): Result<PackageManifest, 'malformed'> => {
  const parsed = manifestSchema.safeParse(manifest)

  if (!parsed.success) {
    return Result.failure('malformed')
  }

  const {
    bin,
    dependencies = {},
    description,
    exports,
    keywords = [],
    name,
    peerDependencies = {},
    peerDependenciesMeta = {},
    version
  } = parsed.data

  return Result.success({
    commands: commandsOf({ bin, name }),
    dependencies: Object.keys(dependencies),
    description,
    exports,
    keywords: keywords.filter(isString),
    name,
    optionalPeers: Object.entries(peerDependenciesMeta).flatMap(
      ([peer, meta]) => (meta?.optional === true ? [peer] : [])
    ),
    peers: Object.keys(peerDependencies),
    version
  })
}
