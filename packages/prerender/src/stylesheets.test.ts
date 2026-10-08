import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { readBuildManifest } from './build-manifest.ts'
import { addFontPreloads } from './font-preloads.ts'
import { onlyElement } from './html-document.ts'
import { inlinePageStylesheets } from './inline-page-stylesheets.ts'
import { headTags, parseShell, SHELL_HTML } from './shell.fixture.ts'

let clientDir = ''

const writeClientFile = async (path: string, content: string) => {
  const file = join(clientDir, path)

  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, content, 'utf8')
}

const writeManifest = (manifest: unknown) =>
  writeClientFile('.vite/manifest.json', JSON.stringify(manifest))

beforeEach(async () => {
  clientDir = await mkdtemp(join(tmpdir(), 'prerender-'))
})

afterEach(async () => {
  await rm(clientDir, { force: true, recursive: true })
})

describe('build manifest', () => {
  it('reads every chunk, with the lists Vite leaves out as empty', async () => {
    await writeManifest({
      'index.html': { css: ['assets/index.css'], file: 'assets/index.js' },
      'src/home.tsx': { file: 'assets/home.js', imports: ['index.html'] }
    })

    expect(await readBuildManifest(clientDir)).toEqual({
      'index.html': {
        css: ['assets/index.css'],
        file: 'assets/index.js',
        imports: []
      },
      'src/home.tsx': {
        css: [],
        file: 'assets/home.js',
        imports: ['index.html']
      }
    })
  })

  it.each([
    ['a list', []],
    ['a chunk without a file', { 'src/a.ts': {} }],
    [
      'a chunk whose css is not a list',
      { 'src/a.ts': { css: 'a.css', file: 'a.js' } }
    ],
    ['a chunk that is not an object', { 'src/a.ts': 'a.js' }]
  ])('refuses %s', async (_, manifest) => {
    await writeManifest(manifest)

    await expect(readBuildManifest(clientDir)).rejects.toThrow(/prerender:/)
  })
})

const MANIFEST = {
  'index.html': {
    css: ['assets/index.css'],
    file: 'assets/index.js',
    imports: []
  },
  'src/home.tsx': {
    css: ['assets/home.css'],
    file: 'assets/home.js',
    imports: ['src/layout.tsx', 'index.html']
  },
  'src/layout.tsx': {
    css: ['assets/layout.css'],
    file: 'assets/layout.js',
    imports: ['index.html']
  }
}

describe('inline page stylesheets', () => {
  beforeEach(async () => {
    await writeClientFile('assets/index.css', '.shell{}')
    await writeClientFile('assets/layout.css', '.layout{}')
    await writeClientFile('assets/home.css', '.home{}')
  })

  it('inlines the shell and the page in cascade order, each once, and leaves a marker per sheet', async () => {
    const document = parseShell(
      SHELL_HTML.replace(
        '<script',
        '<link rel="stylesheet" href="/assets/layout.css"><script'
      )
    )
    const { css } = await inlinePageStylesheets({
      clientDir,
      document,
      manifest: MANIFEST,
      modules: ['src/home.tsx']
    })

    expect(css).toBe('.shell{}\n.layout{}\n.home{}')
    expect(onlyElement({ document, selector: 'style' }).textContent).toBe(css)
    expect(
      headTags(document).filter((tag) => tag.includes('rel=stylesheet'))
    ).toEqual([
      'link href=/assets/index.css rel=stylesheet type=text/plain',
      'link href=/assets/layout.css rel=stylesheet type=text/plain',
      'link href=/assets/home.css rel=stylesheet type=text/plain'
    ])
  })

  it('names a module the build did not emit', async () => {
    await expect(
      inlinePageStylesheets({
        clientDir,
        document: parseShell(),
        manifest: MANIFEST,
        modules: ['src/missing.tsx']
      })
    ).rejects.toThrow('src/missing.tsx is not in Vite')
  })

  it('refuses a shell that links no stylesheet', async () => {
    await expect(
      inlinePageStylesheets({
        clientDir,
        document: parseShell(
          SHELL_HTML.replace(
            '<link rel="stylesheet" href="/assets/index.css">',
            ''
          )
        ),
        manifest: MANIFEST,
        modules: []
      })
    ).rejects.toThrow('links no stylesheet')
  })

  it('refuses a sheet that would close its style tag', async () => {
    await writeClientFile('assets/index.css', '.a{content:"</style>"}')

    await expect(
      inlinePageStylesheets({
        clientDir,
        document: parseShell(),
        manifest: MANIFEST,
        modules: []
      })
    ).rejects.toThrow('would close the <style> tag')
  })
})

const FACES = [
  '@font-face{font-family:A;src:url(/fonts/a-latin.woff2) format("woff2")}',
  "@font-face{font-family:A;src:url('/fonts/a-latin-ext.woff2')}",
  '@font-face{font-family:B;src:url("/assets/b-latin-Dq3x_9aZ.woff2")}',
  '@font-face{font-family:B;src:url("/assets/b-latin-Dq3x_9aZ.woff2")}',
  '.hero{background:url(/hero-latin.woff2)}'
].join('')

const preloadsOf = (document: Document): string[] =>
  headTags(document).filter((tag) => tag.includes('rel=preload'))

describe('font preloads', () => {
  it('preloads each latin woff2 face once, at the default priority, ahead of the entry', () => {
    const document = parseShell()

    addFontPreloads({ css: FACES, document })

    expect(preloadsOf(document)).toEqual([
      'link as=font crossorigin= href=/fonts/a-latin.woff2 rel=preload type=font/woff2',
      'link as=font crossorigin= href=/assets/b-latin-Dq3x_9aZ.woff2 rel=preload type=font/woff2'
    ])
    expect(headTags(document).at(-1)).toBe(
      'script src=/assets/index.js type=module'
    )
  })

  it('preloads what include picks, typed by its extension', () => {
    const document = parseShell()

    addFontPreloads({
      css: '@font-face{src:url(/a.woff) format("woff")}@font-face{src:url(/b.ttf)}',
      document,
      include: /./
    })

    expect(preloadsOf(document)).toEqual([
      'link as=font crossorigin= href=/a.woff rel=preload type=font/woff',
      'link as=font crossorigin= href=/b.ttf rel=preload type=font/ttf'
    ])
  })

  it('refuses a face it cannot type', () => {
    expect(() =>
      addFontPreloads({
        css: '@font-face{src:url(/a.otf)}',
        document: parseShell(),
        include: /./
      })
    ).toThrow('/a.otf is not a font file')
  })
})
