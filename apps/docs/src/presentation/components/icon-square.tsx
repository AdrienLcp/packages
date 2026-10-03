import type React from 'react'

import './icon-square.sass'

type IconSquareProps = {
  children: React.ReactNode
  className?: string
  /** The hue of a `mark` or `kind` square, `0`–`360`. */
  hue?: number
  /** Default: `'s'`, the size a list row leads with. */
  size?: 's' | 'm' | 'l' | 'xl'
  /**
   * - `'mark'` — a package's tint, its logo in white
   * - `'kind'` — a pale wash of the same hue, the glyph in its deep shade
   * - `'neutral'` — ink, for what belongs to no package
   * - `'hollow'` — an outline, for what is filtered out
   * - `'slot'` — nothing, for an icon that draws its own frame
   */
  tone: 'hollow' | 'kind' | 'mark' | 'neutral' | 'slot'
}

/** The rounded square every row of a settings list leads with. */
export const IconSquare: React.FC<IconSquareProps> = ({
  children,
  className,
  hue,
  size = 's',
  tone
}) => (
  <span
    aria-hidden
    className={['icon-square', size, tone, className].filter(Boolean).join(' ')}
    style={hue === undefined ? undefined : { '--hue': hue }}
  >
    {children}
  </span>
)
