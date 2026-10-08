# @adrienlcp/prerender

Build-time helpers that turn a Vite app's shell, its built `index.html`, into
one prerendered document per page. The app renders each page on the server, as
usual; this package does what comes after, where the traps are:

- what React renders ahead of the page — its `<title>`, `<meta>` tags, the
  resources it preloads — moves into the head, so hydration finds under the
  root exactly the tree the prerender wrote;
- the page's stylesheets, the shell's and those of every chunk it imports
  statically, are inlined, each leaving a marker link: without it, Vite's
  preload helper links an inlined sheet again once the app runs, and the
  second copy, later in the cascade, shifts the page;
- the faces that CSS declares are preloaded at the default priority, which
  is what lets a `font-display: optional` face make the first paint;
- `hreflang` alternates are reciprocal, the page included.

Every helper edits the document through the DOM, parsed by
[linkedom](https://github.com/WebReflection/linkedom), never with patterns over
its text. Whatever the shell must hold exactly once — the canonical link, the
`<title>`, a `<meta>` being set — throws when it does not, so a tag edited out
of `index.html` fails the build instead of shipping every page with the wrong
head.

```bash
pnpm add -D @adrienlcp/prerender linkedom
```

## One document per page

The client build needs `build.manifest: true`. The server build exports
whatever renders a page; the script below is the shape, not an API.

```ts
// scripts/prerender.ts
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

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

const CLIENT_DIR = 'dist'

const shell = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8')
const origin = originOfCanonical(parseDocument(shell))
const manifest = await readBuildManifest(CLIENT_DIR)
const { pages, renderPage } = await import('../dist-ssr/entry-server.js')

for (const page of pages) {
  const document = parseDocument(shell)
  const rendered = await renderPage(page)
  const { title } = renderIntoShell({
    document,
    html: rendered.html,
    path: page.path
  })

  document.documentElement.setAttribute('lang', page.locale)
  setMetaContents({
    document,
    metaContents: {
      'name="description"': rendered.description,
      'property="og:title"': title,
      'property="og:url"': `${origin}${page.path}`
    }
  })
  writeLanguageVersions({
    current: `${origin}${page.path}`,
    document,
    versions: page.translations.map((translation) => ({
      href: `${origin}${translation.path}`,
      hreflang: translation.locale,
      openGraphLocale: translation.openGraphLocale
    })),
    xDefault: `${origin}/`
  })

  const { css } = await inlinePageStylesheets({
    clientDir: CLIENT_DIR,
    document,
    manifest,
    modules: [page.module]
  })

  addFontPreloads({ css, document })
  appendStructuredData({ data: rendered.structuredData, document })

  const file = join(CLIENT_DIR, htmlFileForPath(page.path))

  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, serializeDocument(document), 'utf8')
}

const notFound = parseDocument(shell)

noindexShell(notFound)
await writeFile(join(CLIENT_DIR, '404.html'), serializeDocument(notFound))
```

`page.module` is the page's source module as the manifest names it, such as
`src/pages/home.tsx`: the route's lazily imported component.

The document asks for the entry and what it imports statically, and for no
chunk the router imports lazily: there is no modulepreload helper here, on
purpose. The page paints without a script, and a module requested from the
head downloads before that paint; the app fetches the page's own chunks once
it runs.

## The pieces

| Export | What it does |
| --- | --- |
| `parseDocument`, `serializeDocument` | Read and print a document. Printing throws when a title or an attribute would read back as another text, such as a literal `&amp;` |
| `onlyElement` | The one element a selector matches; throws on none or several |
| `createElement`, `insertIntoHead` | Build an element from its attributes; put elements in the head ahead of the entry script |
| `renderIntoShell` | Writes the server-rendered HTML into the root, moves its leading head tags into the head, sets the `<title>`, returns it. A drawing's `<title>` stays in its `<svg>` |
| `setTitle`, `setMeta`, `setMetaContents` | Set the `<title>`, one `<meta>`'s content, several at once |
| `writeLanguageVersions` | Canonical link, one `hreflang` alternate per language and `x-default`; `og:locale` and its alternates when the shell has `og:locale` |
| `appendStructuredData` | JSON-LD in the head, with `<` escaped so a string cannot close the script |
| `readBuildManifest` | Vite's manifest of the client build, checked |
| `inlinePageStylesheets` | One `<style>` for the shell's sheets and the page's, in cascade order, a marker link per sheet; returns the CSS |
| `addFontPreloads` | Preloads the faces the inlined CSS declares; the latin `.woff2` subset by default, `include` to choose |
| `htmlFileForPath` | `/en` → `en.html`, `/` → `index.html`, `/docs/` → `docs/index.html` |
| `originOfCanonical` | The origin the shell's canonical link names, the one place the host is written down |
| `noindexShell` | Marks the bare shell `noindex`, for the 404 a static host serves on an unknown path |

Font preloads belong on prerendered pages only: the bare shell paints nothing
before the app runs, so a face preloaded there sits unused while the browser
warns about it.

## The shell's own head

`pnpm dev` and the SPA fallback serve the shell as it is. The Vite plugin
writes one page's head into it, read from where the app keeps its page heads so
the two cannot drift:

```ts
// vite.config.ts
import { shellHead } from '@adrienlcp/prerender/vite'

import { PAGE_HEADS } from './src/head/page-heads.ts'

export default defineConfig({
  plugins: [
    shellHead({
      filename: resolve(import.meta.dirname, 'index.html'),
      metaContents: {
        'name="description"': PAGE_HEADS.en.home.description,
        'property="og:title"': PAGE_HEADS.en.home.title
      },
      title: PAGE_HEADS.en.home.title
    })
  ]
})
```

It runs before Vite's own HTML transforms. Without `filename` it writes every
HTML page Vite serves.

## License

MIT
