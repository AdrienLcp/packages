/**
 * Every replacement must match exactly once. `index.html` stays a valid
 * standalone document with no placeholder syntax, so a tag edited out of it
 * fails the build instead of leaving every document with the wrong head.
 */
export const replaceOnce = ({
  html,
  pattern,
  replacement
}: {
  html: string
  pattern: RegExp
  replacement: string
}): string => {
  let matched = 0
  const next = html.replace(
    new RegExp(pattern.source, `${pattern.flags}g`),
    () => {
      matched += 1

      return replacement
    }
  )

  if (matched !== 1) {
    throw new Error(
      `${String(pattern)} matched ${matched} times in index.html, expected 1`
    )
  }

  return next
}

export const escapeAttribute = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')

export const escapeText = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')

export const setTitle = ({
  html,
  value
}: {
  html: string
  value: string
}): string =>
  replaceOnce({
    html,
    pattern: /<title>[^<]*<\/title>/,
    replacement: `<title>${escapeText(value)}</title>`
  })

export const setMeta = ({
  html,
  identifyingAttribute,
  value
}: {
  html: string
  /** `name="description"`, `property="og:title"`. */
  identifyingAttribute: string
  value: string
}): string =>
  replaceOnce({
    html,
    pattern: new RegExp(
      String.raw`<meta\s+content="[^"]*"\s+${identifyingAttribute}\s*/>`
    ),
    replacement: `<meta content="${escapeAttribute(value)}" ${identifyingAttribute} />`
  })
