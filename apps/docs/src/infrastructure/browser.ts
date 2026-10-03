import { copyText } from '@adrienlcp/browser'
import type { Result } from '@adrienlcp/result'

export const preferredLocales = (): readonly string[] => navigator.languages

/** Read without the router, which does not exist yet when `<html lang>` is set. */
export const servedPath = (): string => location.pathname

/** Puts `text` on the clipboard; fails when the browser refuses every way to. */
export const copyToClipboard = (
  text: string
): Promise<Result<void, 'refused'>> => copyText(text)
