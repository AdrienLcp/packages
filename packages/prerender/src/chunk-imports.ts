import type { BuildChunk, BuildManifest } from './build-manifest.ts'

const chunksFrom = ({
  manifest,
  module,
  seen
}: {
  manifest: BuildManifest
  module: string
  seen: Set<string>
}): BuildChunk[] => {
  if (seen.has(module)) {
    return []
  }

  seen.add(module)

  const chunk = manifest[module]

  if (chunk === undefined) {
    throw new Error(
      `prerender: ${module} is not in Vite's manifest; the build did not emit it as a chunk`
    )
  }

  return [
    ...chunk.imports.flatMap((imported) =>
      chunksFrom({ manifest, module: imported, seen })
    ),
    chunk
  ]
}

/** The chunks of `modules` and of everything they import statically, each after what it imports, each once. */
export const chunksInImportOrder = ({
  manifest,
  modules
}: {
  manifest: BuildManifest
  modules: readonly string[]
}): BuildChunk[] => {
  const seen = new Set<string>()

  return modules.flatMap((module) => chunksFrom({ manifest, module, seen }))
}
