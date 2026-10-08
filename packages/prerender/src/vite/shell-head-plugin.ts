import { normalizePath, type Plugin } from 'vite'

import { setMetaContents, setTitle } from '../head-tags.ts'
import { parseDocument, serializeDocument } from '../html-document.ts'

type ShellHeadOptions = {
  /** The absolute path of the one HTML file to write; every page Vite serves when left out. */
  filename?: string
  /** Contents keyed by the attribute naming each `<meta>`, such as `property="og:title"`. */
  metaContents?: Readonly<Record<string, string>>
  title?: string
}

export const shellHeadTransform = ({
  filename,
  metaContents = {},
  title
}: ShellHeadOptions): ((
  html: string,
  context: { filename: string }
) => string) => {
  const shell = filename === undefined ? undefined : normalizePath(filename)

  return (html, context) => {
    if (shell !== undefined && normalizePath(context.filename) !== shell) {
      return html
    }

    const document = parseDocument(html)

    if (title !== undefined) {
      setTitle({ document, title })
    }
    setMetaContents({ document, metaContents })

    return serializeDocument(document)
  }
}

/**
 * Writes one page's head into the shell, `index.html`, so the document
 * `pnpm dev` and the SPA fallback serve carries real copy rather than an empty
 * title. Read the values from where the app keeps its page heads, so the two
 * cannot drift; the prerender then rewrites the head per document.
 */
export const shellHead = (options: ShellHeadOptions): Plugin => ({
  name: '@adrienlcp/prerender:shell-head',
  transformIndexHtml: { handler: shellHeadTransform(options), order: 'pre' }
})
