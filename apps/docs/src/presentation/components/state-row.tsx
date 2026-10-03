import type React from 'react'

import { IconSquare } from './icon-square'

import './state-row.sass'

type StateRowProps = {
  /** The sentence that says what would be here, and when. */
  children: React.ReactNode
  /** An icon that draws its own frame, such as `EmptySlotIcon`, or a glyph to outline. */
  icon: React.ReactNode
  /** Default: `'slot'`. */
  iconTone?: 'hollow' | 'slot'
  title: string
}

/** A row standing in for what is not there yet: no pending change, no match. */
export const StateRow: React.FC<StateRowProps> = ({
  children,
  icon,
  iconTone = 'slot',
  title
}) => (
  <div className='state-row'>
    <IconSquare tone={iconTone}>{icon}</IconSquare>
    <div>
      <strong className='state-row-title'>{title}</strong>
      <p className='state-row-body'>{children}</p>
    </div>
  </div>
)
