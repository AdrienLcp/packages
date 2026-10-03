import { AriaRouterProvider } from '@adrienlcp/react-router'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'

import { PackageHeaderContext } from '@/features/package-navigation/package-header-context'
import { PackageSidebar } from '@/features/package-navigation/package-sidebar'
import { AppShell } from '@/presentation/app-shell'
import { focusMain } from '@/presentation/components/main'
import { PageTransition } from '@/presentation/page-transition'
import { SiteFooter } from '@/presentation/site-footer'
import { SiteHeader } from '@/presentation/site-header'

/**
 * A client-side navigation leaves focus on the link that started it, in a
 * header that did not change: the new page is announced by nothing, and the
 * next Tab walks the header again. Focus moves to the new page instead; the
 * first render is a full load, where it starts at the top on its own.
 */
const useFocusMainOnNavigation = (): void => {
  const { pathname } = useLocation()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return
    }

    previousPathname.current = pathname
    focusMain({ preventScroll: true })
  }, [pathname])
}

export const RootRoute: React.FC = () => {
  useFocusMainOnNavigation()

  return (
    <AriaRouterProvider>
      <AppShell
        footer={<SiteFooter />}
        header={<SiteHeader context={<PackageHeaderContext />} />}
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
