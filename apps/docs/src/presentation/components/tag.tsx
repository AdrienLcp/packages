import type React from 'react'

import { HandIcon, SparkleIcon } from './icons'

import './tag.sass'

type TagProps = {
  children: React.ReactNode
  /**
   * - `'newest'` — the newest release, marked with a sparkle
   * - `'major'`, `'minor'`, `'patch'` — a version's bump, louder as it grows
   * - `'hand'` — published by hand, outlined in dashes
   */
  variant: 'hand' | 'major' | 'minor' | 'newest' | 'patch'
}

const LEADING_ICONS: Partial<Record<TagProps['variant'], React.ReactNode>> = {
  hand: <HandIcon />,
  newest: <SparkleIcon />
}

/** A short pill beside a name or a version. */
export const Tag: React.FC<TagProps> = ({ children, variant }) => (
  <span className={`tag ${variant}`}>
    {LEADING_ICONS[variant]}
    {children}
  </span>
)
