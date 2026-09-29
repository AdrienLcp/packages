import { useHref } from 'react-router'

const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i

/**
 * react-router's `useHref`, except for an absolute URL, which comes back
 * untouched: `useHref` resolves every href against the current route, so
 * `https://example.com` would come out as `/current/route/https:/example.com`.
 */
export const useRouterHref = (href: string): string => {
  const routeHref = useHref(href)

  return ABSOLUTE_URL.test(href) ? href : routeHref
}
