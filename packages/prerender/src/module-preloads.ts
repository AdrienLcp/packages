import type { BuildManifest } from './build-manifest.ts'
import { chunksInImportOrder } from './chunk-imports.ts'
import { placeAfter, removeFormatted } from './formatted-insertion.ts'
import { createElement, ENTRY_SCRIPT, onlyElement } from './html-document.ts'

const MODULE_PRELOADS = 'head > link[rel="modulepreload"]'

/**
 * Rewrites the modulepreload links Vite wrote into the shell to exactly the
 * chunks of `modules` and of everything they import statically, in import
 * order, after the entry script. The entry's own file is left out: its
 * script already asks for it.
 *
 * Vite links the entry's static imports, which is what a page needs by
 * default; leave the shell alone then. Pass `[]` to drop them all, or the
 * modules the page's first render runs to choose — a shell chunk that
 * gathers what every page needs, without the route loaders a router imports
 * eagerly. A chunk asked for before the first paint is JavaScript that paint
 * waits on.
 */
export const writeModulePreloads = ({
  document,
  manifest,
  modules
}: {
  document: Document
  manifest: BuildManifest
  /** Source modules as the manifest names them, such as `index.html` for the entry. */
  modules: readonly string[]
}): void => {
  const entryScript = onlyElement({ document, selector: ENTRY_SCRIPT })
  const entryFile = entryScript.getAttribute('src')

  for (const link of document.querySelectorAll(MODULE_PRELOADS)) {
    removeFormatted(link)
  }

  placeAfter({
    nodes: chunksInImportOrder({ manifest, modules })
      .map((chunk) => `/${chunk.file}`)
      .filter((href) => href !== entryFile)
      .map((href) =>
        createElement({
          attributes: { crossorigin: true, href, rel: 'modulepreload' },
          document,
          tagName: 'link'
        })
      ),
    reference: entryScript
  })
}
