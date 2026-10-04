import type { Tokens } from 'marked'

/** Longer than this, a chip may not fit a phone's line whole, so it is let wrap. */
export const LONGEST_UNBROKEN_CHIP = 24

const HTML_ESCAPES: Record<string, string> = {
  "'": '&#39;',
  '"': '&quot;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
}

const escapeHtml = (text: string): string =>
  text.replaceAll(/["&'<>]/g, (character) => HTML_ESCAPES[character] ?? '')

/** An inline code chip, marked `is-long` when it is too long to be kept on one line. */
export const renderCodeSpan = ({ text }: Tokens.Codespan): string => {
  const className =
    text.length > LONGEST_UNBROKEN_CHIP ? ' class="is-long"' : ''

  return `<code${className}>${escapeHtml(text)}</code>`
}
