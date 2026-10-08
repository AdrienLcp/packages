import type { HousePackage } from './house-package.ts'

/** A package's line in `llms.txt`: its page, then what it is. */
export type LlmsTxtPage = {
  description: string
  title: string
  url: string
}

/**
 * `llms.txt`: the site in one quote line, then each page as a link with one
 * line, for a model that reads the site rather than crawls it.
 */
export const llmsTxtOf = ({
  home,
  locales,
  name,
  pages,
  summary
}: {
  home: LlmsTxtPage
  locales: string
  name: string
  pages: readonly LlmsTxtPage[]
  summary: string
}): string =>
  [
    `# ${name}`,
    '',
    `> ${summary}`,
    '',
    locales,
    '',
    '## Pages',
    '',
    ...[home, ...pages].map(
      ({ description, title, url }) => `- [${title}](${url}): ${description}`
    ),
    ''
  ].join('\n')

/** One line per package, as the catalogue describes it. */
export const llmsTxtPagesOf = ({
  packages,
  urlOf
}: {
  packages: readonly HousePackage[]
  urlOf: (housePackage: HousePackage) => string
}): LlmsTxtPage[] =>
  packages.map((housePackage) => ({
    description: housePackage.description,
    title: housePackage.scopedName,
    url: urlOf(housePackage)
  }))
