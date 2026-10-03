import type React from 'react'
import { ViewTransition } from 'react'

import { useCurrentPath } from '@/infrastructure/router/navigation'

import './page-transition.sass'

/**
 * One view transition per page change: keyed by path, the page leaving and the
 * page arriving are two subtrees, and nothing else animates, neither the first
 * load nor an update inside a page such as a hash link.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <ViewTransition
    default='none'
    enter='page-in'
    exit='page-out'
    key={useCurrentPath()}
  >
    {children}
  </ViewTransition>
)
