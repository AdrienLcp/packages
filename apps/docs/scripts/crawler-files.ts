import { SitemapStream, streamToPromise } from 'sitemap'

import type { PrerenderedPage } from '../src/entry-server.tsx'

/** `sitemap.xml` listing `pages` on `origin`, each with its translations as `hreflang` alternates. */
export const sitemapXml = async ({
  origin,
  pages
}: {
  origin: string
  pages: readonly PrerenderedPage[]
}): Promise<string> => {
  const sitemap = new SitemapStream({
    hostname: origin,
    xmlns: { image: false, news: false, video: false, xhtml: true }
  })

  for (const page of pages) {
    sitemap.write({
      links: page.translations.map(({ locale, path }) => ({
        lang: locale,
        url: path
      })),
      url: page.path
    })
  }

  sitemap.end()

  return (await streamToPromise(sitemap)).toString()
}

export const robotsTxt = (origin: string): string =>
  `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
