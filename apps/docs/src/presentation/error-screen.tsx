import type React from 'react'

import { paths, useRouteFailure } from '@/infrastructure/router/navigation'
import { AppShell } from '@/presentation/app-shell'
import { Main } from '@/presentation/components/main'
import { Link } from '@/presentation/components/ui/link'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

/**
 * Sits outside react-aria's `RouterProvider`, so its link reloads the whole
 * document — which is also what clears a half-broken state.
 */
export const ErrorScreen: React.FC = () => {
  const translate = useTranslate()
  const failure = useRouteFailure()

  return (
    <AppShell>
      <Main>
        <DocumentTitle>{`${translate('error.title')} — ${translate('app.name')}`}</DocumentTitle>
        <h1>{translate('error.title')}</h1>
        <p>{translate('error.note')}</p>
        <p>
          <code>{failure}</code>
        </p>
        <Link href={paths.root}>{translate('error.reload')}</Link>
      </Main>
    </AppShell>
  )
}
