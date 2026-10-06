import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { PrerenderedPage } from '../src/entry-server.tsx'
import { escapeAttribute, replaceOnce, setMeta, setTitle } from './head-tags.ts'

type EntryServer = typeof import('../src/entry-server.tsx')

const ROOT = resolve(import.meta.dirname, '..')
const CLIENT_DIR = join(ROOT, 'dist')
const SERVER_ENTRY = join(ROOT, 'dist-ssr', 'entry-server.js')

/** Where Pages serves the site: canonical and Open Graph URLs are absolute. */
const SITE_ORIGIN = 'https://packages.adrienlcp.com'

/** What the build emitted for each source module. */
const VITE_MANIFEST_FILE = '.vite/manifest.json'

type BuildChunk = {
  css: string[]
  file: string
  imports: string[]
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const optionalStrings = ({
  field,
  module,
  value
}: {
  field: string
  module: string
  value: unknown
}): string[] => {
  if (value === undefined) {
    return []
  }

  if (!isStringArray(value)) {
    throw new Error(
      `prerender: ${module}.${field} in Vite's manifest is not a list of strings`
    )
  }

  return value
}

const buildChunkOf = (module: string, entry: unknown): BuildChunk => {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error(`prerender: ${module} in Vite's manifest is not an object`)
  }

  const file = Reflect.get(entry, 'file')

  if (typeof file !== 'string') {
    throw new Error(`prerender: ${module} in Vite's manifest names no file`)
  }

  return {
    css: optionalStrings({
      field: 'css',
      module,
      value: Reflect.get(entry, 'css')
    }),
    file,
    imports: optionalStrings({
      field: 'imports',
      module,
      value: Reflect.get(entry, 'imports')
    })
  }
}

const readBuildManifest = async (): Promise<Map<string, BuildChunk>> => {
  const parsed: unknown = JSON.parse(
    await readFile(join(CLIENT_DIR, VITE_MANIFEST_FILE), 'utf8')
  )

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error("prerender: Vite's manifest is not an object")
  }

  return new Map(
    Object.entries(parsed).map(([module, entry]) => [
      module,
      buildChunkOf(module, entry)
    ])
  )
}

/** `/en` → `en.html`, `/fr/i18n` → `fr/i18n.html`. */
const htmlFileForPath = (path: string): string => `${path.slice(1)}.html`

const chunkAfterItsStaticImports = ({
  module,
  seen
}: {
  module: string
  seen: Set<string>
}): BuildChunk[] => {
  if (seen.has(module)) {
    return []
  }

  seen.add(module)

  const chunk = buildManifest.get(module)

  if (chunk === undefined) {
    throw new Error(
      `prerender: ${module} is not in Vite's manifest; routes.tsx names a module this build did not emit`
    )
  }

  return [
    ...chunk.imports.flatMap((imported) =>
      chunkAfterItsStaticImports({ module: imported, seen })
    ),
    chunk
  ]
}

const LINK_TARGETS = /href="([^"]*)"/g
const SOURCES = /src="([^"]*)"/g

/** Every script and stylesheet the shell already asks for. */
const requestedBy = (html: string): Set<string> =>
  new Set(
    [...html.matchAll(LINK_TARGETS), ...html.matchAll(SOURCES)].flatMap(
      ([, url]) => url ?? []
    )
  )

/**
 * The page's chunks and their stylesheets, which the router only reaches
 * through dynamic imports once the entry has run: named here, they download
 * with everything else, and the markup paints styled.
 */
const pageResourcesFor = (modules: string[]): string => {
  const seen = new Set<string>()
  const chunks = modules.flatMap((module) =>
    chunkAfterItsStaticImports({ module, seen })
  )
  const stylesheets = [
    ...new Set(chunks.flatMap((chunk) => chunk.css.map((file) => `/${file}`)))
  ]
    .filter((href) => !alreadyRequested.has(href))
    .map((href) => `\n    <link rel="stylesheet" crossorigin href="${href}">`)
  const preloads = [...new Set(chunks.map((chunk) => `/${chunk.file}`))]
    .filter((href) => !alreadyRequested.has(href))
    .map(
      (href) => `\n    <link rel="modulepreload" crossorigin href="${href}">`
    )

  return [...stylesheets, ...preloads].join('')
}

/**
 * The faces `index.html` waits for before it reveals the page: a prerendered
 * page has markup to paint, so they start downloading with the document. The
 * bare shell has none and does without.
 */
const FONT_PRELOADS = ['onest-latin', 'jetbrains-mono-latin']
  .map(
    (face) =>
      `\n    <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/${face}.woff2">`
  )
  .join('')

/**
 * React writes the page's `<title>` at the front of what it renders. It belongs
 * in the head, where `setTitle` puts it.
 */
const LEADING_HEAD_TAGS = /^(?:<link\s[^>]*>|<title>[^<]*<\/title>)+/

/** A drawing's `<title>` would match too: there must be exactly one. */
const DOCUMENT_TITLE = /<title>([^<]*)<\/title>/g

const REACT_TEXT_ESCAPES: Record<string, string> = {
  '&#x27;': "'",
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"'
}

/** Back to plain text, which `setTitle` escapes for its tag. */
const unescapeReactText = (text: string): string =>
  text.replaceAll(
    /&(?:#x27|amp|gt|lt|quot);/g,
    (entity) => REACT_TEXT_ESCAPES[entity] ?? entity
  )

const splitRenderedHead = ({
  html,
  path
}: {
  html: string
  path: string
}): { markup: string; resources: string; title: string } => {
  const titles = [...html.matchAll(DOCUMENT_TITLE)]
  const [onlyTitle] = titles

  if (titles.length !== 1 || onlyTitle === undefined) {
    throw new Error(
      `prerender: ${path} rendered ${titles.length} <title> elements, expected 1`
    )
  }

  const headTags = LEADING_HEAD_TAGS.exec(html)?.[0] ?? ''

  if (!headTags.includes(onlyTitle[0])) {
    throw new Error(
      `prerender: ${path} rendered its <title> inside the page rather than ahead of it`
    )
  }

  return {
    markup: html.slice(headTags.length),
    resources: headTags.replace(DOCUMENT_TITLE, ''),
    title: unescapeReactText(onlyTitle[1] ?? '')
  }
}

const documentFor = ({
  page,
  rendered
}: {
  page: PrerenderedPage
  rendered: string
}): string => {
  const { markup, resources, title } = splitRenderedHead({
    html: rendered,
    path: page.path
  })

  return [
    (html: string) =>
      replaceOnce({
        html,
        pattern: /<html lang="[^"]*">/,
        replacement: `<html lang="${page.locale}">`
      }),
    (html: string) => setTitle({ html, value: title }),
    (html: string) =>
      setMeta({
        html,
        identifyingAttribute: 'name="description"',
        value: page.description
      }),
    (html: string) =>
      replaceOnce({
        html,
        pattern: /<link\s+href="[^"]*"\s+rel="canonical"\s*\/>/,
        replacement: `<link href="${escapeAttribute(`${SITE_ORIGIN}${page.path}`)}" rel="canonical" />`
      }),
    (html: string) =>
      setMeta({
        html,
        identifyingAttribute: 'property="og:title"',
        value: title
      }),
    (html: string) =>
      setMeta({
        html,
        identifyingAttribute: 'property="og:description"',
        value: page.description
      }),
    (html: string) =>
      setMeta({
        html,
        identifyingAttribute: 'property="og:url"',
        value: `${SITE_ORIGIN}${page.path}`
      }),
    (html: string) =>
      replaceOnce({
        html,
        pattern: /<\/head>/,
        replacement: `${FONT_PRELOADS}${pageResourcesFor(page.modules)}${resources}\n  </head>`
      }),
    (html: string) =>
      replaceOnce({
        html,
        pattern: /<div id="root"><\/div>/,
        replacement: `<div id="root">${markup}</div>`
      })
  ].reduce((html, step) => step(html), template)
}

/**
 * What Pages answers, with a 404 status, on any path without a file. It is the
 * bare shell rather than a prerendered page: the not-found page names the path
 * that was asked for, which no build can know, so the app renders it.
 */
const noindexShellForUnknownPaths = (shell: string): string =>
  replaceOnce({
    html: shell,
    pattern: /<\/head>/,
    replacement: '  <meta content="noindex" name="robots" />\n  </head>'
  })

const template = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8')
const alreadyRequested = requestedBy(template)
const buildManifest = await readBuildManifest()

const { prerenderedPages, renderPage }: EntryServer = await import(
  pathToFileURL(SERVER_ENTRY).href
)

for (const page of prerenderedPages) {
  const destination = join(CLIENT_DIR, htmlFileForPath(page.path))

  await mkdir(dirname(destination), { recursive: true })
  await writeFile(
    destination,
    documentFor({ page, rendered: await renderPage(page) }),
    'utf8'
  )
}

await writeFile(
  join(CLIENT_DIR, '404.html'),
  noindexShellForUnknownPaths(template),
  'utf8'
)

console.info(
  `prerendered ${prerenderedPages.length} documents into ${CLIENT_DIR}`
)
