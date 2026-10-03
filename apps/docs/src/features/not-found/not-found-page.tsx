import type React from 'react'

import { homePathFor, useCurrentPath } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { Link } from '@/presentation/components/ui/link'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n } from '@/presentation/i18n/i18n-provider'

/** Names the address no route owns, rather than sending home in silence. */
export const NotFoundPage: React.FC = () => {
  const { locale, translate } = useI18n()
  const path = useCurrentPath()

  return (
    <Main>
      <DocumentTitle>{`${translate('notFound.title')} — ${translate('app.name')}`}</DocumentTitle>
      <h1>{translate('notFound.title')}</h1>
      <p>{translate('notFound.address', { path })}</p>
      <Link href={homePathFor(locale)}>{translate('notFound.backHome')}</Link>
    </Main>
  )
}
