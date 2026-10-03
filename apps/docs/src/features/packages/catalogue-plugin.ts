import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import type { Plugin, ViteDevServer } from 'vite'

import {
  buildCatalogue,
  type CatalogueSources,
  type PackageDocumentSource,
  type PackageSources
} from './catalogue.ts'
import { dayVersionEnteredChangelog } from './changelog-history.ts'
import { createMarkdownRendering } from './markdown-rendering.ts'
import { parsePackageManifest } from './package-manifest.ts'
import { parsePendingChange } from './pending-change.ts'
import { packageFolderUrlOf } from './repository.ts'

/** `CATALOGUE`, every package without its documentation. */
export const CATALOGUE_MODULE = 'virtual:catalogue'
/** `PACKAGE_DOCUMENTS`, the rendered documentation, imported by the package page only. */
export const PACKAGE_DOCUMENTS_MODULE = 'virtual:package-documents'

const RESOLVED_PREFIX = '\0'
const README = 'README.md'
const CHANGELOG = 'CHANGELOG.md'
const CHANGESET_README = 'README.md'

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

const packageSourcesIn = (packagesRoot: string): readonly PackageSources[] =>
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

const pendingChangesIn = (
  changesetRoot: string
): CatalogueSources['pendingChanges'] =>
  existsSync(changesetRoot)
    ? readdirSync(changesetRoot)
        .filter((file) => file.endsWith('.md') && file !== CHANGESET_README)
        .flatMap((file) => {
          const change = parsePendingChange(
            readFileSync(join(changesetRoot, file), 'utf8')
          )
          return change.status === 'success' ? [change.data] : []
        })
    : []

type Catalogue = ReturnType<typeof buildCatalogue>

const toModule = (name: string, value: unknown): string =>
  `export const ${name} = ${JSON.stringify(value)}`

/**
 * Builds the catalogue from the repository when the site is built: manifests,
 * entry points, READMEs, changelogs and their history, pending changesets. In
 * development, a change to any of them rebuilds it and reloads the page.
 */
export const cataloguePlugin = ({
  repositoryRoot
}: {
  repositoryRoot: string
}): Plugin => {
  const packagesRoot = join(repositoryRoot, 'packages')
  const changesetRoot = join(repositoryRoot, '.changeset')
  const unknownDays: string[] = []

  const releaseDateOf: CatalogueSources['releaseDateOf'] = ({
    directory,
    version
  }) => {
    const day = dayVersionEnteredChangelog({
      changelogPath: `packages/${directory}/${CHANGELOG}`,
      repositoryRoot,
      version
    })

    if (day.status === 'failure') {
      unknownDays.push(`${directory}@${version}`)
      return null
    }

    return day.data
  }

  const buildFromRepository = async (): Promise<Catalogue> =>
    buildCatalogue({
      linkBaseOf: packageFolderUrlOf,
      packages: packageSourcesIn(packagesRoot),
      pendingChanges: pendingChangesIn(changesetRoot),
      releaseDateOf,
      render: await createMarkdownRendering()
    })

  let built: Promise<Catalogue> | null = null
  const build = (): Promise<Catalogue> => {
    built ??= buildFromRepository()
    return built
  }

  const isCatalogueSource = (file: string): boolean => {
    const path = relative(repositoryRoot, file).split(sep).join('/')
    return path.startsWith('packages/') || path.startsWith('.changeset/')
  }

  const rebuildOnChange = (server: ViteDevServer) => (file: string) => {
    if (
      !isCatalogueSource(file) ||
      file.includes('node_modules') ||
      file.includes(`${sep}dist${sep}`)
    ) {
      return
    }

    built = null

    for (const id of [CATALOGUE_MODULE, PACKAGE_DOCUMENTS_MODULE]) {
      const module = server.moduleGraph.getModuleById(RESOLVED_PREFIX + id)
      if (module !== undefined) {
        server.moduleGraph.invalidateModule(module)
      }
    }

    server.ws.send({ type: 'full-reload' })
  }

  return {
    configureServer: (server) => {
      server.watcher.add([packagesRoot, changesetRoot])
      server.watcher.on('change', rebuildOnChange(server))
      server.watcher.on('add', rebuildOnChange(server))
      server.watcher.on('unlink', rebuildOnChange(server))
    },
    async load(id) {
      if (id === RESOLVED_PREFIX + CATALOGUE_MODULE) {
        const { packages } = await build()

        if (unknownDays.length > 0) {
          this.warn(
            `No release day read from git for ${unknownDays.join(', ')}`
          )
        }

        return toModule('CATALOGUE', packages)
      }

      if (id === RESOLVED_PREFIX + PACKAGE_DOCUMENTS_MODULE) {
        return toModule('PACKAGE_DOCUMENTS', (await build()).documents)
      }

      return null
    },
    name: 'docs-catalogue',
    resolveId: (id) =>
      id === CATALOGUE_MODULE || id === PACKAGE_DOCUMENTS_MODULE
        ? RESOLVED_PREFIX + id
        : null
  }
}
