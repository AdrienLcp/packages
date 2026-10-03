import type React from 'react'

type RenderedHtmlProps = {
  className?: string
  /** Default: `'div'`; `'span'` for a line rendered inline. */
  elementType?: 'div' | 'span'
  /**
   * Built from the repository's own Markdown when the site is built, never
   * from anything a visitor sends: the one HTML the site injects.
   */
  html: string
}

/** Markdown the build rendered: a README section, a release note, a summary. */
export const RenderedHtml: React.FC<RenderedHtmlProps> = ({
  className,
  elementType: Element = 'div',
  html
}) => (
  <Element className={className} dangerouslySetInnerHTML={{ __html: html }} />
)
