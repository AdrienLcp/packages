import { Result } from '@adrienlcp/result'

import { copyThroughSelection } from './copy-through-selection.ts'

const writeThroughClipboardApi = async (text: string): Promise<boolean> => {
  if (navigator.clipboard === undefined) {
    return false
  }

  try {
    await navigator.clipboard.writeText(text)

    return true
  } catch {
    return false
  }
}

/**
 * Copies `text` to the clipboard. `navigator.clipboard` exists only in a
 * secure context, so a page served over plain HTTP — a LAN address, a phone
 * pointed at a laptop — falls back to a selection copy.
 *
 * Fails with `'refused'` when neither works; `selectContents` then leaves the
 * text selected for the reader to copy by hand.
 */
export const copyText = async (
  text: string
): Promise<Result<void, 'refused'>> =>
  (await writeThroughClipboardApi(text)) || copyThroughSelection(text)
    ? Result.success()
    : Result.failure('refused')
