import { join } from 'node:path'

import { close, createIndex } from 'pagefind'

/** Where the site's search loads its index from, under the site root. */
const SEARCH_INDEX_DIRECTORY = 'pagefind'

const failOn = (step: string, errors: readonly string[]): void => {
  if (errors.length > 0) {
    throw new Error(`Pagefind could not ${step}:\n${errors.join('\n')}`)
  }
}

/**
 * Indexes the prerendered documents in `clientDir` into its `pagefind/`
 * folder. Pagefind writes one index per `<html lang>`, so a search in French
 * reads the French pages alone, even where they show an English README; and it
 * reads only what a page marks `data-pagefind-body`, never the shell around it.
 */
export const writeSearchIndex = async (clientDir: string): Promise<number> => {
  try {
    const { errors, index } = await createIndex()

    failOn('start', errors)

    if (index === undefined) {
      throw new Error('Pagefind started without an index')
    }

    const indexed = await index.addDirectory({ path: clientDir })

    failOn('read the documents', indexed.errors)
    failOn(
      'write the index',
      (
        await index.writeFiles({
          outputPath: join(clientDir, SEARCH_INDEX_DIRECTORY)
        })
      ).errors
    )

    return indexed.page_count
  } finally {
    await close()
  }
}
