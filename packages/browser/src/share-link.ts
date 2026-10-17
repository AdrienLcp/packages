import { Result } from '@adrienlcp/result'

/** The link as the share sheet hands it on: a title, the address, and optionally the words to send it with. */
export type SharedLink = {
  text?: string
  title: string
  url: string
}

/**
 * Whether the device has a share sheet a link can be handed to — WhatsApp,
 * SMS, mail. Phones do, and some desktops; a control offering it is drawn only
 * where this says so.
 */
export const canShareLinks = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/**
 * Opens the device's share sheet on a link. Fails with `'unavailable'` where
 * there is none, and with `'closed'` when the sheet was put away or refused:
 * either way nothing was sent, so neither is worth an error on screen.
 */
export const shareLink = async (
  link: SharedLink
): Promise<Result<void, 'closed' | 'unavailable'>> => {
  if (!canShareLinks()) {
    return Result.failure('unavailable')
  }

  try {
    await navigator.share(link)

    return Result.success()
  } catch {
    return Result.failure('closed')
  }
}
