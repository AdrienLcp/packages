import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

const INDEX_HTML = readFileSync(
  fileURLToPath(new URL('../../../index.html', import.meta.url)),
  'utf8'
)

const contentOf = (attribute: string): string =>
  new RegExp(`<meta content="([^"]*)" ${attribute} />`).exec(INDEX_HTML)?.[1] ??
  ''

const SITE_ORIGIN = new URL(
  /<link href="([^"]*)" rel="canonical" \/>/.exec(INDEX_HTML)?.[1] ?? ''
).origin

const SHARE_IMAGE_URL = new URL(contentOf('property="og:image"'))

/** A PNG's IHDR chunk holds its width then its height, big-endian, from byte 16. */
const pngSizeOf = (bytes: Buffer): string =>
  `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`

it('[share-card] points at an image on the site that serves the page', () => {
  expect(SHARE_IMAGE_URL.origin).toBe(SITE_ORIGIN)
})

it('[share-card] ships its image at the size it announces', () => {
  const bytes = readFileSync(
    fileURLToPath(
      new URL(`../../../public${SHARE_IMAGE_URL.pathname}`, import.meta.url)
    )
  )

  expect(pngSizeOf(bytes)).toBe(
    `${contentOf('property="og:image:width"')}x${contentOf('property="og:image:height"')}`
  )
})

it('[share-card] asks for the large preview', () => {
  expect(contentOf('name="twitter:card"')).toBe('summary_large_image')
})
