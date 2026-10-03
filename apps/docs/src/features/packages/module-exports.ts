import { firstSentenceOf, jsDocBefore } from './doc-summary.ts'
import type { ExportKind } from './export-kind.ts'
import { resolveSourcePath, sourceCandidatesFor } from './source-path.ts'

/** One name a TypeScript or Sass module exports, with what its doc says first. */
export type DeclaredExport = {
  kind: ExportKind
  name: string
  /** Markdown: the first sentence of its doc comment. */
  summary: string | null
}

/** A package's file, by its path inside the package; `null` when it is not there. */
export type ReadSource = (path: string) => string | null

const STAR_REEXPORT = /^export\s+\*\s+from\s+['"]([^'"]+)['"]/gm
const DECLARATION =
  /^export\s+(?:declare\s+)?(?:async\s+)?(const|let|function\*?|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/gm
const FUNCTION_INITIALIZER = /^(?:async\b|function\b|\(|<)/
const COMPONENT_ANNOTATION = /\bFC\s*</
const HOOK_NAME = /^use[A-Z]/
const PASCAL_CASE = /^[A-Z][a-z]/

type Declaration = {
  keyword: string
  name: string
  /** What follows the name, up to the end of its first lines. */
  rest: string
}

const isFunctionValue = (rest: string): boolean => {
  const [annotation = '', ...initializer] = rest.split(/\s=\s/)

  return (
    COMPONENT_ANNOTATION.test(annotation) ||
    FUNCTION_INITIALIZER.test(initializer.join(' = ').trimStart())
  )
}

const callableKindOf = (name: string): ExportKind => {
  if (HOOK_NAME.test(name)) {
    return 'hook'
  }

  return PASCAL_CASE.test(name) ? 'component' : 'function'
}

const kindOf = ({ keyword, name, rest }: Declaration): ExportKind => {
  switch (keyword) {
    case 'type':
    case 'interface':
      return 'type'
    case 'enum':
      return 'constant'
    case 'const':
    case 'let':
      return isFunctionValue(rest) ? callableKindOf(name) : 'constant'
    default:
      return callableKindOf(name)
  }
}

const REST_LENGTH = 240

const declaredIn = (source: string): readonly DeclaredExport[] =>
  [...source.matchAll(DECLARATION)].map((match) => {
    const [whole, keyword = '', name = ''] = match
    const end = match.index + whole.length
    const doc = jsDocBefore(source, match.index)

    return {
      kind: kindOf({
        keyword,
        name,
        rest: source.slice(end, end + REST_LENGTH)
      }),
      name,
      summary: doc === null ? null : firstSentenceOf(doc)
    }
  })

const readFirst = (
  candidates: readonly string[],
  readSource: ReadSource
): { path: string; source: string } | null => {
  for (const path of candidates) {
    const source = readSource(path)

    if (source !== null) {
      return { path, source }
    }
  }

  return null
}

/** A value outranks a type of the same name: `Result` is called before it is named. */
const mergeSameName = (
  kept: DeclaredExport,
  incoming: DeclaredExport
): DeclaredExport => ({
  kind: kept.kind === 'type' ? incoming.kind : kept.kind,
  name: kept.name,
  summary: kept.summary ?? incoming.summary
})

/**
 * Every name a TypeScript entry point exports, following its `export * from`
 * lines into the files they name, in the order the entry point lists them.
 */
export const moduleExportsOf = ({
  entryPath,
  readSource
}: {
  entryPath: string
  readSource: ReadSource
}): readonly DeclaredExport[] => {
  const byName = new Map<string, DeclaredExport>()
  const visited = new Set<string>()

  const collect = (candidates: readonly string[]): void => {
    const file = readFirst(candidates, readSource)

    if (file === null || visited.has(file.path)) {
      return
    }

    visited.add(file.path)

    for (const declared of declaredIn(file.source)) {
      const kept = byName.get(declared.name)
      byName.set(
        declared.name,
        kept === undefined ? declared : mergeSameName(kept, declared)
      )
    }

    for (const [, specifier = ''] of file.source.matchAll(STAR_REEXPORT)) {
      collect(
        sourceCandidatesFor(resolveSourcePath({ from: file.path, specifier }))
      )
    }
  }

  collect(sourceCandidatesFor(entryPath))

  return [...byName.values()]
}
