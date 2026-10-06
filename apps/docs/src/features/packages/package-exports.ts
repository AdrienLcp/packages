import type { EntryPoint } from './entry-points.ts'
import { explainingSectionOf } from './export-sections.ts'
import type { MarkdownSection } from './markdown-sections.ts'
import {
  type DeclaredExport,
  moduleExportsOf,
  type ReadSource
} from './module-exports.ts'
import { sassExportsOf } from './sass-exports.ts'

/** A section of one of the package's documents. */
export type FiledSection = MarkdownSection & { file: string }

/** An export, with what it is imported from and the section that explains it. */
export type LocatedExport = DeclaredExport & {
  section: FiledSection | null
  specifier: string
}

const declaredBy = (
  entryPoint: EntryPoint,
  readSource: ReadSource
): readonly DeclaredExport[] => {
  switch (entryPoint.format) {
    case 'module':
      return moduleExportsOf({ entryPath: entryPoint.path, readSource })
    case 'sass':
      return sassExportsOf({
        path: entryPoint.path,
        source: readSource(entryPoint.path) ?? ''
      })
    case 'file':
      return [{ kind: 'file', name: entryPoint.specifier, summary: null }]
  }
}

const fileNameOf = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1)

/** The words a document would use to name the export. */
const searchTermsOf = (
  declared: DeclaredExport,
  entryPoint: EntryPoint
): readonly string[] =>
  declared.kind === 'file'
    ? [entryPoint.specifier, fileNameOf(entryPoint.path)]
    : [declared.name.replace(/\(\)$/, '')]

/** Every export of every entry point, each tied to the section that explains it. */
export const packageExportsOf = ({
  entryPoints,
  readSource,
  sections
}: {
  entryPoints: readonly EntryPoint[]
  readSource: ReadSource
  sections: readonly FiledSection[]
}): readonly LocatedExport[] =>
  entryPoints.flatMap((entryPoint) =>
    declaredBy(entryPoint, readSource).map((declared) => ({
      ...declared,
      section: explainingSectionOf({
        sections,
        terms: searchTermsOf(declared, entryPoint)
      }),
      specifier: entryPoint.specifier
    }))
  )
