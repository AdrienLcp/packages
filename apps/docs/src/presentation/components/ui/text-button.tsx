import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import { Button, type ButtonProps } from 'react-aria-components'

import './text-button.sass'

/** A quiet button in the accent's wash: an action inside a row, never the page's main act. */
export const TextButton: React.FC<ButtonProps> = ({ className, ...props }) => (
  <Button {...props} className={composeClassName(className, 'text-button')} />
)
