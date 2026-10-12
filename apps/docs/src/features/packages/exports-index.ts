import { filedSectionsOf, type PackageSources } from './catalogue.ts'
import { entryPointsOf } from './entry-points.ts'
import { type LocatedExport, packageExportsOf } from './package-exports.ts'
import { packageFileUrlOf } from './repository.ts'

/** The command that writes `EXPORTS.md`, named in its opening line. */
export const EXPORTS_INDEX_COMMAND = 'pnpm exports'

const exportLineOf = (located: LocatedExport, directory: string): string => {
  const summary = located.summary === null ? '' : ` — ${located.summary}`
  const section =
    located.section === null
      ? ''
      : ` [More](${packageFileUrlOf({ directory, file: located.section.file })}#${located.section.slug})`

  return `- \`${located.name}\` (${located.kind})${summary}${section}`
}

const packageBlockOf = ({
  directory,
  documents,
  manifest,
  readSource
}: PackageSources): readonly string[] => {
  const entryPoints = entryPointsOf({
    exports: manifest.exports,
    scopedName: manifest.name
  })
  const located = packageExportsOf({
    entryPoints,
    readSource,
    sections: filedSectionsOf(documents)
  })

  return [
    `## ${manifest.name}`,
    '',
    manifest.description,
    '',
    ...entryPoints.flatMap((entryPoint) => {
      const lines = located
        .filter((each) => each.specifier === entryPoint.specifier)
        .map((each) => exportLineOf(each, directory))

      return lines.length === 0
        ? []
        : [`### \`${entryPoint.specifier}\``, '', ...lines, '']
    })
  ]
}

/**
 * `EXPORTS.md`: every name the packages export, by entry point, with the first
 * sentence of its doc comment and a link to the README section that shows it
 * in use — what an agent reads before writing a helper, a mixin or a hook.
 */
export const exportsIndexOf = (packages: readonly PackageSources[]): string =>
  [
    '# @adrienlcp exports',
    '',
    `Every name the packages export, read from their entry points. Written by \`${EXPORTS_INDEX_COMMAND}\`; do not edit by hand.`,
    '',
    'Look here before writing a helper, a mixin or a hook: when one already does the job, import it.',
    '',
    ...packages
      .toSorted((first, second) =>
        first.directory.localeCompare(second.directory)
      )
      .flatMap(packageBlockOf)
  ]
    .join('\n')
    .replace(/\n+$/, '\n')
