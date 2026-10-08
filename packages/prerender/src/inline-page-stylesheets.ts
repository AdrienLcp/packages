import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { BuildChunk, BuildManifest } from './build-manifest.ts'
import { createElement } from './html-document.ts'

const LINKED_STYLESHEETS = 'head > link[rel="stylesheet"]'

/** Each chunk after the chunks it imports statically, each once. */
const chunksInImportOrder = ({
  manifest,
  module,
  seen
}: {
  manifest: BuildManifest
  module: string
  seen: Set<string>
}): BuildChunk[] => {
  if (seen.has(module)) {
    return []
  }

  seen.add(module)

  const chunk = manifest[module]

  if (chunk === undefined) {
    throw new Error(
      `prerender: ${module} is not in Vite's manifest; the build did not emit it as a chunk`
    )
  }

  return [
    ...chunk.imports.flatMap((imported) =>
      chunksInImportOrder({ manifest, module: imported, seen })
    ),
    chunk
  ]
}

const readStylesheet = async ({
  clientDir,
  href
}: {
  clientDir: string
  href: string
}): Promise<string> => {
  const css = await readFile(join(clientDir, href.slice(1)), 'utf8')

  if (css.includes('</style')) {
    throw new Error(
      `prerender: ${href} would close the <style> tag it is inlined into`
    )
  }

  return css
}

/**
 * Vite's preload helper links every stylesheet a lazily imported chunk needs,
 * unless a `<link rel="stylesheet">` with that href is already there. An
 * inlined sheet has none, so the helper fetched it again and applied it a
 * second time, later in the cascade, and the page shifted once the app ran. A
 * type that is not CSS keeps the browser from fetching the link the helper
 * finds.
 */
const markerOfInlinedStylesheet = ({
  document,
  href
}: {
  document: Document
  href: string
}): Element =>
  createElement({
    attributes: { href, rel: 'stylesheet', type: 'text/plain' },
    document,
    tagName: 'link'
  })

/**
 * Replaces the stylesheets the shell links with one `<style>` holding them and
 * the stylesheets of `modules` and of every chunk they import statically, in
 * cascade order. The document carries the whole page's markup, so inlining
 * only what the shell links would paint it half-styled until the bundle
 * arrives. Each inlined sheet leaves a marker link, which keeps Vite from
 * linking it again. Returns the CSS it inlined.
 */
export const inlinePageStylesheets = async ({
  clientDir,
  document,
  manifest,
  modules
}: {
  /** The client build's output directory, where the stylesheet URLs resolve. */
  clientDir: string
  document: Document
  manifest: BuildManifest
  /** The page's source modules as the manifest names them, such as the route's lazy page. */
  modules: readonly string[]
}): Promise<{ css: string }> => {
  const linked = [...document.querySelectorAll(LINKED_STYLESHEETS)]
  const [firstLinked] = linked

  if (firstLinked === undefined) {
    throw new Error(
      'prerender: the shell links no stylesheet, so there is nowhere to inline one'
    )
  }

  const seen = new Set<string>()
  const sheetUrls = [
    ...new Set([
      ...linked.flatMap((link) => link.getAttribute('href') ?? []),
      ...modules.flatMap((module) =>
        chunksInImportOrder({ manifest, module, seen }).flatMap((chunk) =>
          chunk.css.map((file) => `/${file}`)
        )
      )
    ])
  ]
  const css = (
    await Promise.all(
      sheetUrls.map((href) => readStylesheet({ clientDir, href }))
    )
  ).join('\n')
  const style = document.createElement('style')

  style.textContent = css
  firstLinked.replaceWith(
    style,
    ...sheetUrls.map((href) => markerOfInlinedStylesheet({ document, href }))
  )
  for (const link of linked.slice(1)) {
    link.remove()
  }

  return { css }
}
