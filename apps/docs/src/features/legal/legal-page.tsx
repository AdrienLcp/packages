import type React from 'react'

import { LOCALE_STORAGE_KEY } from '@/infrastructure/storage/preferences-storage'
import { Main } from '@/presentation/components/main'
import { Link } from '@/presentation/components/ui/link'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'
import { themeStore } from '@/presentation/theme/theme-store'

import { CNIL_COMPLAINT_HREF, HOST, PUBLISHER } from './legal-details'

import './legal-page.sass'

const LEGAL_TITLE_ID = 'legal-title'

type LegalSectionProps = {
  children: React.ReactNode
  heading: string
  /** The heading's anchor, the same in every locale. */
  id: string
}

/** One plane per subject, its heading anchored so a search result lands on it. */
const LegalSection: React.FC<LegalSectionProps> = ({
  children,
  heading,
  id
}) => (
  <section aria-labelledby={id} className='legal-section'>
    <h2 className='legal-heading' id={id} tabIndex={-1}>
      {heading}
    </h2>
    {children}
  </section>
)

/**
 * The French LCEN's legal notice and the privacy policy, on one page every
 * footer links to: who publishes, who hosts, what is stored, and what is not.
 */
export const LegalPage: React.FC = () => {
  const { locale, translate } = useI18n()
  const contactLink = (children: string): React.ReactNode => (
    <Link href={PUBLISHER.contactHrefFor(locale)}>{children}</Link>
  )
  const complaintLink = (children: string): React.ReactNode => (
    <Link href={CNIL_COMPLAINT_HREF} hrefLang='fr'>
      {children}
    </Link>
  )

  return (
    <Main
      aria-labelledby={LEGAL_TITLE_ID}
      className='legal-page'
      data-pagefind-body=''
    >
      <DocumentTitle>{`${translate('legal.title')} — ${translate('app.name')}`}</DocumentTitle>
      <div className='legal-head'>
        <h1 className='legal-title' id={LEGAL_TITLE_ID}>
          {translate('legal.title')}
        </h1>
        <p className='legal-intro'>{translate('legal.intro')}</p>
      </div>

      <div className='legal-sections'>
        <LegalSection
          heading={translate('legal.publisher.heading')}
          id='publisher'
        >
          <p>
            <RichText
              parts={translate.rich('legal.publisher.body', {
                contact: contactLink,
                name: PUBLISHER.name
              })}
            />
          </p>
          <p>{translate('legal.publisher.address')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.host.heading')} id='host'>
          <p>{translate('legal.host.body')}</p>
          <address className='legal-address'>
            {[HOST.name, ...HOST.addressLines].map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
        </LegalSection>

        <LegalSection heading={translate('legal.storage.heading')} id='storage'>
          <p>{translate('legal.storage.device')}</p>
          <dl className='legal-keys'>
            <div>
              <dt>
                <code>{themeStore.storageKey}</code>
              </dt>
              <dd>{translate('legal.storage.theme')}</dd>
            </div>
            <div>
              <dt>
                <code>{LOCALE_STORAGE_KEY}</code>
              </dt>
              <dd>{translate('legal.storage.locale')}</dd>
            </div>
          </dl>
          <p>{translate('legal.storage.server')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.search.heading')} id='search'>
          <p>{translate('legal.search.body')}</p>
        </LegalSection>

        <LegalSection
          heading={translate('legal.measurement.heading')}
          id='measurement'
        >
          <p>{translate('legal.measurement.body')}</p>
        </LegalSection>

        <LegalSection
          heading={translate('legal.thirdParties.heading')}
          id='third-parties'
        >
          <p>{translate('legal.thirdParties.body')}</p>
          <p>{translate('legal.thirdParties.links')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.rights.heading')} id='rights'>
          <p>
            <RichText
              parts={translate.rich('legal.rights.body', {
                contact: contactLink
              })}
            />
          </p>
          <p>
            <RichText
              parts={translate.rich('legal.rights.complaint', {
                authority: complaintLink
              })}
            />
          </p>
        </LegalSection>
      </div>
    </Main>
  )
}
