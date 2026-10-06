import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { PrerenderedPage } from '../src/entry-server.tsx'
import {
  createLink,
  documentTitlesIn,
  isElement,
  onlyElement,
  parseHtmlDocument
} from './html-document.ts'
import { robotsTxt, sitemapXml } from './crawler-files.ts'

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

/** Every script and stylesheet the shell already asks for. */
const requestedBy = (document: Document): Set<string> =>
  new Set(
    [...document.querySelectorAll('[href], [src]')].flatMap((element) =>
      [element.getAttribute('href'), element.getAttribute('src')].flatMap(
        (url) => url ?? []
      )
    )
  )

/**
 * The page's chunks and their stylesheets, which the router only reaches
 * through dynamic imports once the entry has run: named here, they download
 * with everything else, and the markup paints styled.
 */
const pageResourcesFor = ({
  document,
  modules
}: {
  document: Document
  modules: string[]
}): HTMLLinkElement[] => {
  const seen = new Set<string>()
  const chunks = modules.flatMap((module) =>
    chunkAfterItsStaticImports({ module, seen })
  )
  const notYetRequested = (href: string) => !alreadyRequested.has(href)
  const stylesheets = [
    ...new Set(chunks.flatMap((chunk) => chunk.css.map((file) => `/${file}`)))
  ]
    .filter(notYetRequested)
    .map((href) =>
      createLink({
        attributes: { crossorigin: true, href, rel: 'stylesheet' },
        document
      })
    )
  const preloads = [...new Set(chunks.map((chunk) => `/${chunk.file}`))]
    .filter(notYetRequested)
    .map((href) =>
      createLink({
        attributes: { crossorigin: true, href, rel: 'modulepreload' },
        document
      })
    )

  return [...stylesheets, ...preloads]
}

const isBlankText = (node: Node | null): node is Text =>
  node?.nodeName === '#text' && node.textContent?.trim() === ''

/** What may open a document's head: the tags React hoists ahead of a page. */
const HOISTED_TAG_NAMES = new Set(['link', 'meta', 'title'])

/**
 * React writes the page's `<title>` and its `<link>` tags at the front of what
 * it renders: those go to the document's head, and what follows the first
 * other node is the page, the way a browser would split them.
 */
const splitRenderedPage = ({
  html,
  path
}: {
  html: string
  path: string
}): { headTags: Element[]; markup: Node[]; title: string } => {
  const nodes = [...parseHtmlDocument(html).document.childNodes]
  const pageStart = nodes.findIndex(
    (node) =>
      !isBlankText(node) &&
      !(isElement(node) && HOISTED_TAG_NAMES.has(node.localName))
  )
  const hoisted = nodes
    .slice(0, pageStart === -1 ? nodes.length : pageStart)
    .filter(isElement)
  const markup = pageStart === -1 ? [] : nodes.slice(pageStart)
  const headTitles = documentTitlesIn(hoisted)
  const titleCount = headTitles.length + documentTitlesIn(markup).length
  const [title] = headTitles

  if (titleCount !== 1) {
    throw new Error(
      `prerender: ${path} rendered ${titleCount} <title> elements, expected 1`
    )
  }

  if (title === undefined) {
    throw new Error(
      `prerender: ${path} rendered its <title> inside the page rather than ahead of it`
    )
  }

  return {
    headTags: hoisted.filter((tag) => tag !== title),
    markup,
    title: title.textContent ?? ''
  }
}

const HEAD_INDENT = '\n    '
const HEAD_CLOSE_INDENT = '\n  '

const appendToHead = (document: Document, tags: readonly Node[]): void => {
  const closingIndent = document.head.lastChild

  if (isBlankText(closingIndent)) {
    closingIndent.remove()
  }

  document.head.append(
    ...tags.flatMap((tag) => [HEAD_INDENT, tag]),
    HEAD_CLOSE_INDENT
  )
}

const setContent = ({
  document,
  selector,
  value
}: {
  document: Document
  selector: string
  value: string
}): void => {
  onlyElement({ document, selector }).setAttribute('content', value)
}

const documentFor = ({
  page,
  rendered
}: {
  page: PrerenderedPage
  rendered: string
}): string => {
  const { headTags, markup, title } = splitRenderedPage({
    html: rendered,
    path: page.path
  })
  const { document, serialize } = parseHtmlDocument(template)
  const url = `${SITE_ORIGIN}${page.path}`

  document.documentElement.lang = page.locale
  onlyElement({ document, selector: 'head > title' }).textContent = title
  onlyElement({ document, selector: 'link[rel="canonical"]' }).setAttribute(
    'href',
    url
  )
  setContent({
    document,
    selector: 'meta[name="description"]',
    value: page.description
  })
  setContent({ document, selector: 'meta[property="og:title"]', value: title })
  setContent({
    document,
    selector: 'meta[property="og:description"]',
    value: page.description
  })
  setContent({ document, selector: 'meta[property="og:url"]', value: url })
  appendToHead(document, [
    ...pageResourcesFor({ document, modules: page.modules }),
    ...headTags.map((tag) => document.importNode(tag, true))
  ])
  onlyElement({ document, selector: '#root' }).replaceChildren(
    ...markup.map((node) => document.importNode(node, true))
  )

  return serialize()
}

/**
 * What Pages answers, with a 404 status, on any path without a file. It is the
 * bare shell rather than a prerendered page: the not-found page names the path
 * that was asked for, which no build can know, so the app renders it.
 */
const noindexShellForUnknownPaths = (shell: string): string => {
  const { document, serialize } = parseHtmlDocument(shell)
  const noindex = document.createElement('meta')

  noindex.setAttribute('content', 'noindex')
  noindex.setAttribute('name', 'robots')
  appendToHead(document, [noindex])

  return serialize()
}

const template = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8')
const alreadyRequested = requestedBy(parseHtmlDocument(template).document)
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

await writeFile(
  join(CLIENT_DIR, 'sitemap.xml'),
  await sitemapXml({ origin: SITE_ORIGIN, pages: prerenderedPages }),
  'utf8'
)
await writeFile(join(CLIENT_DIR, 'robots.txt'), robotsTxt(SITE_ORIGIN), 'utf8')

console.info(
  `prerendered ${prerenderedPages.length} documents into ${CLIENT_DIR}`
)
