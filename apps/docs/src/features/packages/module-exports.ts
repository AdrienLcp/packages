import {
  type ExportedDeclarations,
  Node,
  Project,
  type SourceFile,
  ts
} from 'ts-morph'

import { firstSentenceOf } from './doc-summary.ts'
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

const PACKAGE_ROOT = '/package/'
const COMPONENT_ANNOTATION = /\bFC\s*</
const HOOK_NAME = /^use[A-Z]/
const PASCAL_CASE = /^[A-Z][a-z]/

const createPackageProject = (): Project =>
  new Project({
    compilerOptions: {
      allowImportingTsExtensions: true,
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      noEmit: true,
      target: ts.ScriptTarget.ESNext
    },
    useInMemoryFileSystem: true
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

const relativeSpecifiersOf = (file: SourceFile): readonly string[] =>
  [...file.getImportDeclarations(), ...file.getExportDeclarations()].flatMap(
    (declaration) => {
      const specifier = declaration.getModuleSpecifierValue()
      return specifier?.startsWith('.') ? [specifier] : []
    }
  )

/**
 * Loads the entry point and every package file it reaches through a relative
 * import or export, so the compiler can resolve what the entry point exports.
 */
const loadEntryPoint = ({
  entryPath,
  readSource
}: {
  entryPath: string
  readSource: ReadSource
}): SourceFile | null => {
  const project = createPackageProject()
  const loaded = new Set<string>()

  const load = (candidates: readonly string[]): SourceFile | null => {
    const file = readFirst(candidates, readSource)

    if (file === null || loaded.has(file.path)) {
      return null
    }

    loaded.add(file.path)
    const sourceFile = project.createSourceFile(
      PACKAGE_ROOT + file.path,
      file.source
    )

    for (const specifier of relativeSpecifiersOf(sourceFile)) {
      load(
        sourceCandidatesFor(resolveSourcePath({ from: file.path, specifier }))
      )
    }

    return sourceFile
  }

  return load(sourceCandidatesFor(entryPath))
}

const callableKindOf = (name: string): ExportKind => {
  if (HOOK_NAME.test(name)) {
    return 'hook'
  }

  return PASCAL_CASE.test(name) ? 'component' : 'function'
}

const isFunctionExpression = (node: Node | undefined): boolean =>
  Node.isParenthesizedExpression(node)
    ? isFunctionExpression(node.getExpression())
    : Node.isArrowFunction(node) || Node.isFunctionExpression(node)

const isCallableValue = (node: Node): boolean => {
  if (Node.isVariableDeclaration(node)) {
    const annotation = node.getTypeNode()?.getText() ?? ''

    if (
      COMPONENT_ANNOTATION.test(annotation) ||
      isFunctionExpression(node.getInitializer())
    ) {
      return true
    }
  }

  return node.getType().getCallSignatures().length > 0
}

const kindOf = (
  declaration: ExportedDeclarations,
  name: string
): ExportKind => {
  if (
    Node.isTypeAliasDeclaration(declaration) ||
    Node.isInterfaceDeclaration(declaration)
  ) {
    return 'type'
  }

  if (Node.isEnumDeclaration(declaration)) {
    return 'constant'
  }

  if (
    Node.isFunctionDeclaration(declaration) ||
    Node.isClassDeclaration(declaration)
  ) {
    return callableKindOf(name)
  }

  return isCallableValue(declaration) ? callableKindOf(name) : 'constant'
}

/** A `const` carries its doc on the statement that declares it. */
const docHostOf = (declaration: ExportedDeclarations): Node =>
  Node.isVariableDeclaration(declaration)
    ? (declaration.getVariableStatement() ?? declaration)
    : declaration

const summaryOf = (declaration: ExportedDeclarations): string | null => {
  const host = docHostOf(declaration)
  const doc = Node.isJSDocable(host) ? host.getJsDocs().at(-1) : undefined
  return doc === undefined ? null : firstSentenceOf(doc.getDescription())
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

const declaredExportOf = (
  name: string,
  declarations: readonly ExportedDeclarations[]
): readonly DeclaredExport[] => {
  const [first, ...others] = declarations.map((declaration) => ({
    kind: kindOf(declaration, name),
    name,
    summary: summaryOf(declaration)
  }))

  return first === undefined ? [] : [others.reduce(mergeSameName, first)]
}

type ExportedName = readonly [
  name: string,
  declarations: readonly ExportedDeclarations[]
]

const UNPLACED = Number.POSITIVE_INFINITY

/**
 * The compiler lists a file's function declarations before its other exports,
 * as it hoists them: back to the order they are written in, file by file.
 */
const inWritingOrder = (
  exportedNames: readonly ExportedName[]
): readonly ExportedName[] => {
  const fileRanks = new Map<string, number>()

  for (const [, [declaration]] of exportedNames) {
    const path = declaration?.getSourceFile().getFilePath()

    if (path !== undefined && !fileRanks.has(path)) {
      fileRanks.set(path, fileRanks.size)
    }
  }

  const placeOf = ([, [declaration]]: ExportedName) =>
    declaration === undefined
      ? { fileRank: UNPLACED, start: UNPLACED }
      : {
          fileRank:
            fileRanks.get(declaration.getSourceFile().getFilePath()) ??
            UNPLACED,
          start: declaration.getStart()
        }

  return exportedNames.toSorted((left, right) => {
    const leftPlace = placeOf(left)
    const rightPlace = placeOf(right)

    return (
      leftPlace.fileRank - rightPlace.fileRank ||
      leftPlace.start - rightPlace.start
    )
  })
}

/**
 * Every name a TypeScript entry point exports, as the compiler resolves it:
 * declarations, `export { … }` lists and `export * from` re-exports alike.
 */
export const moduleExportsOf = ({
  entryPath,
  readSource
}: {
  entryPath: string
  readSource: ReadSource
}): readonly DeclaredExport[] => {
  const entryPoint = loadEntryPoint({ entryPath, readSource })

  if (entryPoint === null) {
    return []
  }

  return inWritingOrder([...entryPoint.getExportedDeclarations()]).flatMap(
    ([name, declarations]) => declaredExportOf(name, declarations)
  )
}
