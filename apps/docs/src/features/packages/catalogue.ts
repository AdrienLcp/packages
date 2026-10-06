import { ecosystemOf } from './ecosystem.ts'
import { type EntryPoint, entryPointsOf } from './entry-points.ts'
import type {
  DocumentSection,
  HousePackage,
  PackageDocuments,
  PackageVersion,
  PendingNote
} from './house-package.ts'
import { createHeadingSlugger, sectionsOf } from './markdown-sections.ts'
import type { ReadSource } from './module-exports.ts'
import { type FiledSection, packageExportsOf } from './package-exports.ts'
import type { PackageManifest } from './package-manifest.ts'
import type { PendingChange } from './pending-change.ts'
import { type ChangelogRelease, parseReleaseNotes } from './release-notes.ts'
import { largestBumpOf } from './version-bump.ts'

/** A Markdown file of the package, README first. */
export type PackageDocumentSource = {
  /** `README.md`. */
  file: string
  markdown: string
}

/** What the repository holds for one package directory. */
export type PackageSources = {
  changelog: string | null
  directory: string
  documents: readonly PackageDocumentSource[]
  manifest: PackageManifest
  readSource: ReadSource
}

/** Turns Markdown into the HTML the site shows. */
export type MarkdownRendering = {
  /** Paragraphs, lists, code; relative links resolve against `linkBase`. */
  block: (markdown: string, linkBase: string) => string
  /** One line, no paragraph around it. */
  inline: (markdown: string) => string
}

export type CatalogueSources = {
  /** Where a package directory's relative links point: its folder on GitHub. */
  linkBaseOf: (directory: string) => string
  packages: readonly PackageSources[]
  pendingChanges: readonly PendingChange[]
  /** `YYYY-MM-DD`, or `null` when the history does not say. */
  releaseDateOf: (release: {
    directory: string
    version: string
  }) => string | null
  render: MarkdownRendering
}

const HOUSE_SCOPE = '@adrienlcp/'
const FIRST_VERSION = '0.1.0'

const isConfigurationOnly = (entryPoints: readonly EntryPoint[]): boolean =>
  entryPoints.length > 0 &&
  entryPoints.every((entryPoint) => entryPoint.path.endsWith('.json'))

const installCommandOf = (
  scopedName: string,
  entryPoints: readonly EntryPoint[]
): string =>
  isConfigurationOnly(entryPoints)
    ? `pnpm add -D ${scopedName}`
    : `pnpm add ${scopedName}`

const filedSectionsOf = (
  documents: readonly PackageDocumentSource[]
): readonly FiledSection[] => {
  const slugger = createHeadingSlugger()

  return documents.flatMap(({ file, markdown }) =>
    sectionsOf({
      document: markdown,
      openingSlug: file.replace(/\.md$/i, '').toLowerCase(),
      slugger
    }).map((section) => ({ ...section, file }))
  )
}

const versionsOf = ({
  directory,
  manifest,
  releases,
  sources
}: {
  directory: string
  manifest: PackageManifest
  releases: readonly ChangelogRelease[]
  sources: CatalogueSources
}): readonly PackageVersion[] => {
  if (releases.length === 0) {
    return [{ origin: 'hand', version: manifest.version }]
  }

  return releases.map((release) => ({
    bump: largestBumpOf(release.notes.map((note) => note.bump)),
    date: sources.releaseDateOf({ directory, version: release.version }),
    notes: release.notes.map((note) => ({
      bump: note.bump,
      commit: note.commit,
      html: sources.render.block(note.text, sources.linkBaseOf(directory))
    })),
    origin: 'changelog',
    version: release.version
  }))
}

const pendingNotesOf = ({
  directory,
  scopedName,
  sources
}: {
  directory: string
  scopedName: string
  sources: CatalogueSources
}): readonly PendingNote[] =>
  sources.pendingChanges.flatMap((change) =>
    change.bumps
      .filter((bump) => bump.packageName === scopedName)
      .map((bump) => ({
        bump: bump.bump,
        html: sources.render.block(
          change.summary,
          sources.linkBaseOf(directory)
        )
      }))
  )

const documentedPackageOf = (
  { changelog, directory, documents, manifest, readSource }: PackageSources,
  sources: CatalogueSources
): {
  documentation: readonly DocumentSection[]
  housePackage: HousePackage
} => {
  const linkBase = sources.linkBaseOf(directory)
  const entryPoints = entryPointsOf({
    exports: manifest.exports,
    scopedName: manifest.name
  })
  const sections = filedSectionsOf(documents)
  const releases = changelog === null ? [] : parseReleaseNotes(changelog)
  const oldestRelease = releases.at(-1)?.version ?? null
  const titleHtmlOf = (title: string | null): string | null =>
    title === null ? null : sources.render.inline(title)

  return {
    documentation: sections.map((section) => ({
      file: section.file,
      html: sources.render.block(section.markdown, linkBase),
      slug: section.slug,
      titleHtml: titleHtmlOf(section.title)
    })),
    housePackage: {
      dependsOn: manifest.dependencies
        .filter((dependency) => dependency.startsWith(HOUSE_SCOPE))
        .map((dependency) => dependency.slice(HOUSE_SCOPE.length)),
      description: manifest.description,
      ecosystem: ecosystemOf({
        entryPoints,
        keywords: manifest.keywords,
        optionalPeers: manifest.optionalPeers,
        peers: manifest.peers
      }),
      exports: packageExportsOf({ entryPoints, readSource, sections }).map(
        (located) => ({
          kind: located.kind,
          name: located.name,
          section:
            located.section === null
              ? null
              : {
                  file: located.section.file,
                  slug: located.section.slug,
                  titleHtml: titleHtmlOf(located.section.title)
                },
          specifier: located.specifier,
          summaryHtml:
            located.summary === null
              ? null
              : sources.render.inline(located.summary)
        })
      ),
      handPublishedBefore:
        oldestRelease !== null && oldestRelease !== FIRST_VERSION
          ? oldestRelease
          : null,
      install: installCommandOf(manifest.name, entryPoints),
      name: directory,
      pending: pendingNotesOf({
        directory,
        scopedName: manifest.name,
        sources
      }),
      scopedName: manifest.name,
      version: manifest.version,
      versions: versionsOf({ directory, manifest, releases, sources })
    }
  }
}

/** When it last shipped through the changelog: `null` for a package never released that way. */
export const lastReleaseDateOf = (
  housePackage: HousePackage
): string | null => {
  const [newest] = housePackage.versions

  return newest?.origin === 'changelog' ? newest.date : null
}

/** Newest release first; a package with no dated release after every dated one, then by name. */
const byNewestRelease = (first: HousePackage, second: HousePackage): number =>
  (lastReleaseDateOf(second) ?? '').localeCompare(
    lastReleaseDateOf(first) ?? ''
  ) || first.name.localeCompare(second.name)

/** Every package, newest release first, with its documentation rendered apart. */
export const buildCatalogue = (
  sources: CatalogueSources
): { documents: PackageDocuments; packages: readonly HousePackage[] } => {
  const documented = sources.packages.map((packageSources) =>
    documentedPackageOf(packageSources, sources)
  )

  return {
    documents: Object.fromEntries(
      documented.map(({ documentation, housePackage }) => [
        housePackage.name,
        documentation
      ])
    ),
    packages: documented
      .map(({ housePackage }) => housePackage)
      .toSorted(byNewestRelease)
  }
}
