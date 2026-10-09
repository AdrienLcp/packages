import { parseDocument } from './html-document.ts'

/** A built `index.html` as Vite writes it: one linked stylesheet, the entry module in the head. */
export const SHELL_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en"><head>',
  '<meta charset="utf-8">',
  '<title>Shell</title>',
  '<meta name="description" content="">',
  '<meta property="og:locale" content="en_GB">',
  '<link rel="canonical" href="https://example.com/">',
  '<link rel="stylesheet" href="/assets/index.css">',
  '<script type="module" src="/assets/index.js"></script>',
  '</head><body><div id="root"></div></body></html>'
].join('')

export const parseShell = (html = SHELL_HTML): Document => parseDocument(html)

/** The head's elements in order, each as its tag and its attributes sorted: linkedom does not keep the order they were set in. */
export const headTags = (document: Document): string[] =>
  [...document.head.children].map((element) =>
    [
      element.tagName.toLowerCase(),
      ...[...element.attributes]
        .map(({ name, value }) => `${name}=${value}`)
        .toSorted()
    ].join(' ')
  )

/** The same shell as Vite prints it, one tag per line, indented. */
export const INDENTED_SHELL_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Shell</title>
    <meta property="og:locale" content="en_GB">
    <link rel="canonical" href="https://example.com/">
    <link rel="stylesheet" href="/assets/index.css">
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/vendor.js">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
