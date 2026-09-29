import { Result } from '@adrienlcp/result'

/**
 * Selects everything inside `node`, so a reader can finish a refused copy with
 * a keystroke. Fails with `'unavailable'` where the document has no selection,
 * as in a hidden frame.
 */
export const selectContents = (node: Node): Result<void, 'unavailable'> => {
  const selection = getSelection()

  if (selection === null) {
    return Result.failure('unavailable')
  }

  const range = document.createRange()

  range.selectNodeContents(node)
  selection.removeAllRanges()
  selection.addRange(range)

  return Result.success()
}
