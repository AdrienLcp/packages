import type React from 'react'

import type { DocumentSection } from '@/features/packages/house-package'
import { useCurrentFragment } from '@/infrastructure/router/navigation'
import { RenderedHtml } from '@/presentation/components/rendered-html'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './package-documentation.sass'

/** The package's documents, one plane per section, each named after the file it comes from. */
export const PackageDocumentation: React.FC<{
  documentation: readonly DocumentSection[]
}> = ({ documentation }) => {
  const translate = useTranslate()
  const fragment = useCurrentFragment()

  return (
    <div className='package-documentation'>
      {documentation.map((section) => (
        <section
          className={
            fragment === section.slug ? 'doc-section is-target' : 'doc-section'
          }
          id={section.slug}
          key={section.slug}
          tabIndex={-1}
        >
          <h3 className='doc-section-title'>
            {section.titleHtml === null ? (
              translate('docs.opening')
            ) : (
              <RenderedHtml elementType='span' html={section.titleHtml} />
            )}
            <span className='doc-section-file'>{section.file}</span>
          </h3>
          <RenderedHtml className='doc-section-body' html={section.html} />
        </section>
      ))}
    </div>
  )
}
