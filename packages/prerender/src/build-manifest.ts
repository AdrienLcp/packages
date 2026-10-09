import { join } from 'node:path'

import { readInputJson } from './input-file.ts'

/** What Vite emitted for one source module: its file, its stylesheets, the chunks it imports statically. */
export type BuildChunk = {
  css: readonly string[]
  file: string
  imports: readonly string[]
}

/** Vite's build manifest, keyed by source module relative to the project root, such as `src/pages/home.tsx`. */
export type BuildManifest = Readonly<Record<string, BuildChunk>>

/** Where Vite writes the manifest under the client build when `build.manifest` is `true`. */
const MANIFEST_FILE = '.vite/manifest.json'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/** Vite leaves a list out rather than write it empty. */
const optionalStringList = (value: unknown): string[] | undefined => {
  const list = value ?? []

  return isStringList(list) ? list : undefined
}

const chunkOf = ({
  entry,
  module
}: {
  entry: unknown
  module: string
}): BuildChunk => {
  const css = isRecord(entry) ? optionalStringList(entry.css) : undefined
  const imports = isRecord(entry)
    ? optionalStringList(entry.imports)
    : undefined

  if (
    !isRecord(entry) ||
    typeof entry.file !== 'string' ||
    css === undefined ||
    imports === undefined
  ) {
    throw new Error(
      `prerender: ${module} in Vite's manifest is not a chunk with a file, and string lists for css and imports`
    )
  }

  return { css, file: entry.file, imports }
}

/** The manifest of the client build in `clientDir`, built with `build.manifest: true`. */
export const readBuildManifest = async (
  clientDir: string
): Promise<BuildManifest> => {
  const path = join(clientDir, MANIFEST_FILE)
  const manifest = await readInputJson({
    path,
    writtenBy: 'vite build with build.manifest: true'
  })

  if (!isRecord(manifest)) {
    throw new Error(`prerender: ${path} is not an object of chunks`)
  }

  return Object.fromEntries(
    Object.entries(manifest).map(([module, entry]) => [
      module,
      chunkOf({ entry, module })
    ])
  )
}
