import { normalizePath } from 'vite'

import { setMetaContents, setTitle } from '../head-tags.ts'
import { parseDocument, serializeDocument } from '../html-document.ts'

export type ShellHeadOptions = {
  /** The absolute path of the one HTML file to write; every page Vite serves when left out. */
  filename?: string
  /** Contents keyed by the attribute naming each `<meta>`, such as `property="og:title"`. */
  metaContents?: Readonly<Record<string, string>>
  title?: string
}

/** The `transformIndexHtml` handler `shellHead` registers. */
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
