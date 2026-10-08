/**
 * Where a static host looks for a path's document: `/en` → `en.html`,
 * `/fr/about` → `fr/about.html`, `/` → `index.html`, `/docs/` →
 * `docs/index.html`.
 */
export const htmlFileForPath = (path: string): string => {
  if (!path.startsWith('/')) {
    throw new Error(`prerender: ${path} is not a path from the site root`)
  }

  const relative = path.slice(1)

  return relative === '' || relative.endsWith('/')
    ? `${relative}index.html`
    : `${relative}.html`
}
