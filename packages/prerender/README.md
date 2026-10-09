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
import { mkdir, writeFile } from 'node:fs/promises'
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
  readShell,
  renderIntoShell,
  serializeDocument,
  setMetaContents,
  writeLanguageVersions
} from '@adrienlcp/prerender'

const CLIENT_DIR = 'dist'

const shell = await readShell(CLIENT_DIR)
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

The document asks for the entry and what it imports statically, as Vite
linked them, and for no chunk the router imports lazily. The page paints
without a script, and a module requested from the head downloads before that
paint; the app fetches the page's own chunks once it runs.
`writeModulePreloads` changes that list when the default is wrong — below.

## The pieces

| Export | What it does |
| --- | --- |
| `parseDocument`, `serializeDocument` | Read and print a document. Printing throws when a title or an attribute would read back as another text, such as a literal `&amp;` |
| `onlyElement` | The one element a selector matches; throws on none or several |
| `createElement`, `insertIntoHead` | Build an element from its attributes; put elements in the head ahead of the entry script |
| `readShell`, `readInputFile`, `readInputJson` | Read the built `index.html`, or a file another step wrote — a data ingest. A missing file throws naming it and the step that writes it (`writtenBy`); a JSON file that does not parse throws naming it |
| `renderIntoShell` | Writes the server-rendered HTML into the root, moves its leading head tags into the head, sets the `<title>`, returns it. A drawing's `<title>` stays in its `<svg>` |
| `setTitle`, `setMeta`, `setMetaContents` | Set the `<title>`, one `<meta>`'s content, several at once |
| `writeLanguageVersions` | Canonical link, one `hreflang` alternate per language and `x-default`; `og:locale` and its alternates when the shell has `og:locale` |
| `appendStructuredData` | JSON-LD in the head, with `<` escaped so a string cannot close the script |
| `readBuildManifest` | Vite's manifest of the client build, checked |
| `inlinePageStylesheets` | One `<style>` for the shell's sheets and the page's, in cascade order, a marker link per sheet; returns the CSS |
| `addFontPreloads` | Preloads the faces the inlined CSS declares, ahead of any other preload; the latin `.woff2` subset by default. `include` chooses: a pattern, several in the order to ask for them, or `'none'` |
| `writeModulePreloads` | Rewrites the shell's modulepreload links to the chunks of the `modules` listed and their static imports |
| `addCanonical` | The canonical link and `og:url`, for a shell written without a canonical |
| `setRootAttributes`, `insertScriptAfterRoot` | Mark the root for the app to read; set a classic script that runs as soon as the root is parsed |
| `htmlFileForPath` | `/en` → `en.html`, `/` → `index.html`, `/docs/` → `docs/index.html` |
| `originOfCanonical` | The origin the shell's canonical link names, the one place the host is written down |
| `noindexShell` | Marks the bare shell `noindex`, for the 404 a static host serves on an unknown path |

Font preloads belong on prerendered pages only: the bare shell paints nothing
before the app runs, so a face preloaded there sits unused while the browser
warns about it. A page set in system faces alone — a printable copy in Arial —
passes `include: 'none'`. The browser asks for preloads of one priority in
document order, so list the face most of the page is set in first:
`include: [/body-latin/, /display-latin/]`.

Every tag a helper adds to the head, or after the root, goes on a line of its
own, indented as the shell's own tags are, so a built page reads like the
shell it came from. Nothing is added inside the root: a text node there is
markup hydration compares.

## Choosing the modulepreload links

```ts
writeModulePreloads({ document, manifest, modules: ['src/shell.ts'] })
```

Vite links the entry's static imports, which is right for most pages: leave
the shell alone then. When the entry imports more than the first render runs
— a router that imports every route's loader eagerly, a shell chunk that
grew — list what the page needs before it can take itself over, and the links
are rewritten to those chunks and their static imports, in import order,
after the entry script. `[]` drops them all. Every chunk listed downloads
before the first paint, which waits on it.

## A shell served for every path

A host that answers a path with no file of its own with `index.html` serves
the prerendered home page there too. That document cannot carry a canonical
link — every client-rendered path would claim to be `/` — so the shell is
written without one, and each other page gains it:

```ts
if (page.path !== '/') {
  addCanonical({ document, url: `${origin}${page.path}` })
}

setRootAttributes({
  attributes: { 'data-prerendered-path': page.path },
  document
})
insertScriptAfterRoot({
  document,
  script: `(()=>{const r=document.getElementById("root");if(r!==null&&r.dataset.prerenderedPath!==location.pathname)r.replaceChildren()})()`
})
```

The script runs as soon as the root is parsed, before the first paint: it
empties a page written for another path, so the app renders the right page
from scratch instead of the home page flashing first. Root attributes stay
through hydration — React renders inside the root, never on it — so the app
reads them too, such as the date of the data a page was written from.

A file another step writes — the datasets an ingest leaves in `.data/` — is
read through `readInputJson`, so a build run before that step says which
step to run instead of failing to parse nothing:

```ts
const meta = datasetsMetaSchema.parse(
  await readInputJson({ path: '.data/meta.json', writtenBy: 'pnpm ingest' })
)
```

## JSON-LD in the shell

A JSON-LD script written in `index.html` is served on every path: each
prerendered page, the 404, every client-rendered path the SPA fallback
answers. It holds only what is true on all of them — the `WebSite`, the
publisher. A page's own node, and anything naming its URL, goes in with
`appendStructuredData`, page by page; a node both carry, the shell's and the
page's, is two descriptions of one thing that a search engine reconciles on
its own terms.

## In the browser

`@adrienlcp/prerender/client` is what the app's `main.tsx` runs over a
prerendered page. No linkedom, no Node.

```ts
import { capturePrerenderedText, startAppAfterFirstPaint } from '@adrienlcp/prerender/client'

if (container.hasChildNodes()) {
  const prerendered = capturePrerenderedText(container)

  startAppAfterFirstPaint(() => {
    hydrateRoot(container, <App onFirstRender={() => report(prerendered.findMismatch())} />)
  })
} else {
  createRoot(container).render(<App />)
}
```

- `startAppAfterFirstPaint(start)` calls `start` in the task after the next
  frame. A module script can run before the first paint, and hydrating a page
  is a long task that would hold that paint back by its own length; waiting
  lets the page the visitor came for paint first. The module still downloads
  and runs as Vite emits it — only the work it starts waits — so nothing here
  delays module loading. A hidden tab runs no frame: there, and when the tab
  goes hidden before the frame comes, `start` is called at once.
- `capturePrerenderedText(root)` reads the prerendered page's text nodes;
  `findMismatch()`, called once the app's first render has committed, returns
  the first text node that differs — its index, the prerendered text and the
  rendered one, `null` for a side that ran out — or `null` when every one is
  the same. Empty text nodes and the comment a server render writes between
  two texts are left out, so `{a}{b}` reads the same on both sides. A
  difference is text the visitor saw change as the app took over — a date in
  another zone, a value only the device knows — and under `hydrateRoot` a
  subtree React threw away to render again. Report it from a development
  build or an end-to-end test. `textNodesOf(root)` is the list it compares.

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
