import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { PackageDocumentSource, PackageSources } from './catalogue.ts'
import { parsePackageManifest } from './package-manifest.ts'

const README = 'README.md'
const CHANGELOG = 'CHANGELOG.md'

const readTextOrNull = (path: string): string | null =>
  existsSync(path) ? readFileSync(path, 'utf8') : null

/** The README first, then every other Markdown file at the package's root but the changelog. */
const documentsIn = (
  packageDirectory: string
): readonly PackageDocumentSource[] => {
  const others = readdirSync(packageDirectory)
    .filter(
      (file) => file.endsWith('.md') && file !== README && file !== CHANGELOG
    )
    .toSorted()

  return [README, ...others].flatMap((file) => {
    const markdown = readTextOrNull(join(packageDirectory, file))
    return markdown === null ? [] : [{ file, markdown }]
  })
}

/** Every package directory under `packagesRoot` whose manifest reads. */
export const packageSourcesIn = (
  packagesRoot: string
): readonly PackageSources[] =>
  readdirSync(packagesRoot, { withFileTypes: true }).flatMap((entry) => {
    const packageDirectory = join(packagesRoot, entry.name)
    const manifestText = entry.isDirectory()
      ? readTextOrNull(join(packageDirectory, 'package.json'))
      : null
    const manifest =
      manifestText === null
        ? null
        : parsePackageManifest(JSON.parse(manifestText))

    if (manifest === null || manifest.status === 'failure') {
      return []
    }

    return [
      {
        changelog: readTextOrNull(join(packageDirectory, CHANGELOG)),
        directory: entry.name,
        documents: documentsIn(packageDirectory),
        manifest: manifest.data,
        readSource: (path: string) =>
          readTextOrNull(join(packageDirectory, path))
      }
    ]
  })
