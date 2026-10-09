import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  addFontPreloads,
  appendStructuredData,
  htmlFileForPath,
  inlinePageStylesheets,
  noindexShell,
  originOfCanonical,
  parseDocument,
  readBuildManifest,
  renderIntoShell,
  serializeDocument,
  setMetaContents,
  writeLanguageVersions
} from '@adrienlcp/prerender'

import type { PrerenderedPage } from '../src/entry-server.tsx'
import { REGIONAL_LOCALES } from '../src/presentation/i18n/regional-locales.ts'
import { robotsTxt, sitemapXml } from './crawler-files.ts'

type EntryServer = typeof import('../src/entry-server.tsx')

const ROOT = resolve(import.meta.dirname, '..')
const CLIENT_DIR = join(ROOT, 'dist')
const SERVER_ENTRY = join(ROOT, 'dist-ssr', 'entry-server.js')

/** `fr` → `fr_FR`: Open Graph writes a locale with an underscore. */
const openGraphLocaleOf = (locale: PrerenderedPage['locale']): string =>
  REGIONAL_LOCALES[locale].replace('-', '_')

const documentFor = async ({
  page,
  rendered
}: {
  page: PrerenderedPage
  rendered: string
}): Promise<string> => {
  const document = parseDocument(shell)
  const url = `${origin}${page.path}`
  const { title } = renderIntoShell({
    document,
    html: rendered,
    path: page.path
  })

  document.documentElement.setAttribute('lang', page.locale)
  setMetaContents({
    document,
    metaContents: {
      'name="description"': page.description,
      'property="og:description"': page.description,
      'property="og:image:alt"': page.shareImageAlt,
      'property="og:title"': title,
      'property="og:url"': url
    }
  })
  writeLanguageVersions({
    current: url,
    document,
    versions: page.translations.map(({ locale, path }) => ({
      href: `${origin}${path}`,
      hreflang: locale,
      openGraphLocale: openGraphLocaleOf(locale)
    })),
    ...(page.xDefaultPath === null
      ? {}
      : { xDefault: `${origin}${page.xDefaultPath}` })
  })

  const { css } = await inlinePageStylesheets({
    clientDir: CLIENT_DIR,
    document,
    manifest,
    modules: page.modules
  })

  addFontPreloads({ css, document })
  appendStructuredData({
    data: { '@context': 'https://schema.org', ...page.structuredData, url },
    document
  })

  return serializeDocument(document)
}

const shell = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8')
const origin = originOfCanonical(parseDocument(shell))
const manifest = await readBuildManifest(CLIENT_DIR)

const { llmsTxt, prerenderedPages, renderPage }: EntryServer = await import(
  pathToFileURL(SERVER_ENTRY).href
)

for (const page of prerenderedPages) {
  const destination = join(CLIENT_DIR, htmlFileForPath(page.path))

  await mkdir(dirname(destination), { recursive: true })
  await writeFile(
    destination,
    await documentFor({ page, rendered: await renderPage(page) }),
    'utf8'
  )
}

const notFound = parseDocument(shell)

noindexShell(notFound)
await writeFile(
  join(CLIENT_DIR, '404.html'),
  serializeDocument(notFound),
  'utf8'
)

await writeFile(
  join(CLIENT_DIR, 'sitemap.xml'),
  await sitemapXml({ origin, pages: prerenderedPages }),
  'utf8'
)
await writeFile(join(CLIENT_DIR, 'robots.txt'), robotsTxt(origin), 'utf8')
await writeFile(join(CLIENT_DIR, 'llms.txt'), llmsTxt(origin), 'utf8')

console.info(
  `prerendered ${prerenderedPages.length} documents into ${CLIENT_DIR}`
)
