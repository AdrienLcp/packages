import { act, createElement } from 'react'
import { Link } from 'react-aria-components'
import { createRoot, type Root } from 'react-dom/client'
import {
  createMemoryRouter,
  type NavigateOptions,
  Outlet,
  RouterProvider
} from 'react-router'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AriaRouterProvider } from './aria-router-provider.ts'
import { ignoreSupersededNavigation } from './ignore-superseded-navigation.ts'

type Mounted = {
  anchor: (label: string) => HTMLAnchorElement
  root: Root
  router: ReturnType<typeof createMemoryRouter>
}

let mounted: Mounted | null = null

beforeAll(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
})

afterEach(() => {
  act(() => mounted?.root.unmount())
  document.body.replaceChildren()
  mounted = null
})

const mount = async (
  navigateDefaults?: () => NavigateOptions
): Promise<Mounted> => {
  const router = createMemoryRouter(
    [
      {
        children: [
          {
            element: createElement(
              'nav',
              null,
              createElement(Link, { href: 'next' }, 'Relative'),
              createElement(Link, { href: '/next' }, 'Absolute'),
              createElement(
                Link,
                { href: '/next', routerOptions: { state: 'from-link' } },
                'With options'
              ),
              createElement(Link, { href: 'https://example.com/' }, 'External')
            ),
            path: 'start'
          },
          { element: 'Next page', path: 'start/next' },
          { element: 'Root next page', path: 'next' }
        ],
        element: createElement(
          AriaRouterProvider,
          { navigateDefaults },
          createElement(Outlet)
        ),
        path: '/'
      }
    ],
    { initialEntries: ['/start'] }
  )
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(createElement(RouterProvider, { router }))
  })

  const anchor = (label: string): HTMLAnchorElement => {
    const found = [...container.querySelectorAll('a')].find(
      (element) => element.textContent === label
    )

    if (found === undefined) {
      throw new Error(`No link labelled ${label}`)
    }

    return found
  }

  mounted = { anchor, root, router }

  return mounted
}

const press = async (anchor: HTMLAnchorElement): Promise<void> => {
  await act(async () => {
    anchor.click()
  })
}

describe('AriaRouterProvider', () => {
  it('[href] resolves a relative href against the current route', async () => {
    const { anchor } = await mount()

    expect(anchor('Relative').getAttribute('href')).toBe('/start/next')
  })

  it('[href] leaves an absolute URL untouched', async () => {
    const { anchor } = await mount()

    expect(anchor('External').getAttribute('href')).toBe('https://example.com/')
  })

  it('[navigate] a pressed link navigates on the client', async () => {
    const { anchor, router } = await mount()

    await press(anchor('Absolute'))

    expect(router.state.location.pathname).toBe('/next')
    expect(router.state.historyAction).toBe('PUSH')
  })

  it("[navigate] forwards the link's routerOptions to navigate", async () => {
    const { anchor, router } = await mount()

    await press(anchor('With options'))

    expect(router.state.location.pathname).toBe('/next')
    expect(router.state.location.state).toBe('from-link')
  })

  it('[navigate] starts every navigation from the defaults', async () => {
    const { anchor, router } = await mount(() => ({
      replace: true,
      state: 'from-defaults'
    }))

    await press(anchor('Absolute'))

    expect(router.state.location.state).toBe('from-defaults')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it("[navigate] a link's routerOptions override the defaults", async () => {
    const { anchor, router } = await mount(() => ({ state: 'from-defaults' }))

    await press(anchor('With options'))

    expect(router.state.location.state).toBe('from-link')
  })
})

describe('ignoreSupersededNavigation', () => {
  it('[abort] swallows the AbortError of a superseded navigation', () => {
    expect(
      ignoreSupersededNavigation(new DOMException('Aborted', 'AbortError'))
    ).toBeUndefined()
  })

  it('[abort] throws any other error again', () => {
    const failure = new Error('Loader failed')

    expect(() => ignoreSupersededNavigation(failure)).toThrow(failure)
  })

  it('[abort] throws a thrown non-error again', () => {
    expect(() => ignoreSupersededNavigation('broken')).toThrow('broken')
  })
})
