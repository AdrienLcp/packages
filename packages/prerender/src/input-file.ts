import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const isMissingFileError = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT'

/**
 * The text of a file the prerender reads and another step wrote — the client
 * build, a data ingest. A missing one throws naming the file and the step
 * that writes it, rather than the parse error that follows reading nothing.
 */
export const readInputFile = async ({
  path,
  writtenBy
}: {
  path: string
  /** The step that writes the file, such as `pnpm ingest`. */
  writtenBy: string
}): Promise<string> => {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      throw new Error(
        `prerender: ${path} does not exist; ${writtenBy} writes it`
      )
    }

    throw error
  }
}

/** A JSON file `readInputFile` reads; one that does not parse throws naming the file. */
export const readInputJson = async ({
  path,
  writtenBy
}: {
  path: string
  /** The step that writes the file, such as `pnpm ingest`. */
  writtenBy: string
}): Promise<unknown> => {
  const text = await readInputFile({ path, writtenBy })

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`prerender: ${path} is not JSON; ${writtenBy} writes it`)
  }
}

/** The client build's `index.html`, the shell every page is written from. */
export const readShell = (clientDir: string): Promise<string> =>
  readInputFile({
    path: join(clientDir, 'index.html'),
    writtenBy: 'vite build'
  })
