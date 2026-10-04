import type React from 'react'

import { IconSquare } from '@/presentation/components/icon-square'
import { ChevronIcon } from '@/presentation/components/icons'
import { RenderedHtml } from '@/presentation/components/rendered-html'
import { SlashBreaks } from '@/presentation/components/slash-breaks'
import { Link } from '@/presentation/components/ui/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import {
  EMPTY_FILTER,
  type ExportFilter,
  queryMatchIn
} from './export-filter.ts'
import { ExportKindIcon } from './export-kind-icon.tsx'
import type { HousePackage, PackageExport } from './house-package.ts'
import { packageHueOf } from './package-mark.tsx'

import './export-row.sass'

type ExportRowProps = {
  /** Its part of the query is marked in the name. */
  filter?: ExportFilter
  housePackage: HousePackage
  href: string
  /** The row's own fragment, so a link can land on it. */
  id?: string
  /** Lit as the place a link landed on. */
  isTarget?: boolean
  packageExport: PackageExport
  /** Shown beside the kind; left out where every row shares it. */
  showSpecifier: boolean
}

const MarkedName: React.FC<{ filter: ExportFilter; name: string }> = ({
  filter,
  name
}) => {
  const match = queryMatchIn(name, filter)

  if (match === null) {
    return <SlashBreaks text={name} />
  }

  return (
    <>
      <SlashBreaks text={match.before} />
      <mark>
        <SlashBreaks text={match.match} />
      </mark>
      <SlashBreaks text={match.after} />
    </>
  )
}

/** One export as a settings row: its kind's square, its name and summary, where it comes from. */
export const ExportRow: React.FC<ExportRowProps> = ({
  filter = EMPTY_FILTER,
  housePackage,
  href,
  id,
  isTarget = false,
  packageExport,
  showSpecifier
}) => {
  const translate = useTranslate()

  return (
    <Link
      className={isTarget ? 'export-row is-target' : 'export-row'}
      href={href}
      id={id}
    >
      <IconSquare hue={packageHueOf(housePackage.name)} tone='kind'>
        <ExportKindIcon kind={packageExport.kind} />
      </IconSquare>
      <span className='export-row-main'>
        <code className='export-row-name'>
          <MarkedName filter={filter} name={packageExport.name} />
        </code>
        {packageExport.summaryHtml !== null && (
          <RenderedHtml
            className='export-row-summary'
            elementType='span'
            html={packageExport.summaryHtml}
          />
        )}
      </span>
      <span className='export-row-aside'>
        {showSpecifier && (
          <code className='export-row-specifier'>
            <SlashBreaks text={packageExport.specifier} />
          </code>
        )}
        <span className='export-row-kind'>
          {translate(`kind.${packageExport.kind}`)}
        </span>
      </span>
      <ChevronIcon className='export-row-chevron' />
    </Link>
  )
}
