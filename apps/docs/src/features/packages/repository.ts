export const REPOSITORY_URL = 'https://github.com/AdrienLcp/packages'

const DEFAULT_BRANCH = 'main'

/** The package's folder on GitHub, where its relative links resolve. */
export const packageFolderUrlOf = (directory: string): string =>
  `${REPOSITORY_URL}/tree/${DEFAULT_BRANCH}/packages/${directory}/`

/** One file of the package on GitHub: `CHANGELOG.md`. */
export const packageFileUrlOf = ({
  directory,
  file
}: {
  directory: string
  file: string
}): string =>
  `${REPOSITORY_URL}/blob/${DEFAULT_BRANCH}/packages/${directory}/${file}`

/** A commit a release note names by its short hash. */
export const commitUrlOf = (hash: string): string =>
  `${REPOSITORY_URL}/commit/${hash}`
