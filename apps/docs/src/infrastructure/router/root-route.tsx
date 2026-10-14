import { AriaRouterProvider } from '@adrienlcp/react-router'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'

import { PackageHeaderContext } from '@/features/package-navigation/package-header-context'
import { PackageSidebar } from '@/features/package-navigation/package-sidebar'
import { SiteSearch } from '@/features/site-search/site-search'
import { AppShell } from '@/presentation/app-shell'
import { focusMain } from '@/presentation/components/main'
import { PageTransition } from '@/presentation/page-transition'
import { SiteFooter } from '@/presentation/site-footer'
import { SiteHeader } from '@/presentation/site-header'

/**
 * Moves focus onto the element a fragment names, when it takes focus; `false`
 * when there is none, or it does not.
 */
const focusFragmentTarget = (hash: string): boolean => {
  const target =
    hash === ''
      ? null
      : document.getElementById(decodeURIComponent(hash.slice(1)))

  target?.focus({ preventScroll: true })

  return target !== null && document.activeElement === target
}

/**
 * A client-side navigation leaves focus on the link that started it, in a
 * header that did not change: the new page is announced by nothing, and the
 * next Tab walks the header again. Focus moves to the new page instead, or to
 * the section a fragment names, as a search result does; the first render is
 * a full load, where it starts at the top on its own.
 */
const useFocusMainOnNavigation = (): void => {
  const { hash, pathname } = useLocation()
  const previousLocation = useRef(`${pathname}${hash}`)

  useEffect(() => {
    if (previousLocation.current === `${pathname}${hash}`) {
      return
    }

    const isSamePage =
      previousLocation.current.startsWith(`${pathname}#`) ||
      previousLocation.current === pathname

    previousLocation.current = `${pathname}${hash}`

    if (!focusFragmentTarget(hash) && !isSamePage) {
      focusMain({ preventScroll: true })
    }
  }, [hash, pathname])
}

export const RootRoute: React.FC = () => {
  useFocusMainOnNavigation()

  return (
    <AriaRouterProvider>
      <AppShell
        footer={<SiteFooter />}
        header={
          <SiteHeader
            context={<PackageHeaderContext />}
            search={<SiteSearch />}
          />
        }
        sidebar={<PackageSidebar />}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </AppShell>
      <ScrollRestoration />
    </AriaRouterProvider>
  )
}
