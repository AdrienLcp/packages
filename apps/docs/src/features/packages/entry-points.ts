/** How the site reads what an entry point offers. */
export type EntryFormat = 'file' | 'module' | 'sass'

/** One path a consumer imports, from the manifest's `exports`. */
export type EntryPoint = {
  format: EntryFormat
  /** The file behind it, inside the package: `src/index.js`, `src/_fonts.sass`. */
  path: string
  /** What the consumer writes: `@adrienlcp/browser/react`. */
  specifier: string
}

const MANIFEST_SELF = './package.json'
const COMPILED_DIRECTORY = 'dist/'
const SOURCE_DIRECTORY = 'src/'
const CONDITIONS = ['sass', 'import', 'default'] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const targetOf = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value
  }

  if (!isRecord(value)) {
    return null
  }

  for (const condition of CONDITIONS) {
    const target = value[condition]

    if (typeof target === 'string') {
      return target
    }
  }

  return null
}

const formatOf = (path: string): EntryFormat => {
  if (path.endsWith('.js')) {
    return 'module'
  }

  return path.endsWith('.sass') || path.endsWith('.scss') ? 'sass' : 'file'
}

/** A compiled `dist/x.js` is read from the `src/x.ts` it was built from. */
const sourcePathOf = (target: string): string => {
  const path = target.replace(/^\.\//, '')

  return path.startsWith(COMPILED_DIRECTORY)
    ? SOURCE_DIRECTORY + path.slice(COMPILED_DIRECTORY.length)
    : path
}

const specifierOf = ({
  key,
  scopedName
}: {
  key: string
  scopedName: string
}): string => (key === '.' ? scopedName : `${scopedName}/${key.slice(2)}`)

/** Every entry point the manifest's `exports` declares, in its order. */
export const entryPointsOf = ({
  exports,
  scopedName
}: {
  exports: unknown
  scopedName: string
}): readonly EntryPoint[] => {
  if (!isRecord(exports)) {
    return []
  }

  return Object.entries(exports).flatMap(([key, value]) => {
    const target = targetOf(value)

    if (key === MANIFEST_SELF || target === null) {
      return []
    }

    const path = sourcePathOf(target)

    return [
      {
        format: formatOf(target),
        path,
        specifier: specifierOf({ key, scopedName })
      }
    ]
  })
}
