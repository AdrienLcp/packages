import type React from 'react'

import './route-fallback.sass'

/**
 * Holds the page's place on the paper while the first page's chunk downloads,
 * so the footer does not jump up under the header in the meantime.
 */
export const RouteFallback: React.FC = () => (
  <div aria-busy='true' className='route-fallback' />
)
