import type React from 'react'
import { useRef } from 'react'

import { EXPORT_KINDS, type ExportKind } from '@/features/packages/export-kind'
import { ExportKindIcon } from '@/features/packages/export-kind-icon'
import { GridIcon } from '@/presentation/components/icons'
import { type Chip, ChipGroup } from '@/presentation/components/ui/chip-group'
import { SearchField } from '@/presentation/components/ui/search-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { useExportFilter } from './use-export-filter'
import { useSearchShortcut } from './use-search-shortcut'

import './export-toolbar.sass'

const ALL_KINDS = 'all'

type KindChoice = ExportKind | typeof ALL_KINDS

type ExportToolbarProps = {
  exportFilter: ReturnType<typeof useExportFilter>
  kindCounts: Readonly<Record<ExportKind, number>>
  shownCount: number
  totalCount: number
}

/** The search field, the kind filter and how many exports they leave. */
export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  exportFilter: { filter, setKind, setQuery },
  kindCounts,
  shownCount,
  totalCount
}) => {
  const translate = useTranslate()
  const inputRef = useRef<HTMLInputElement>(null)
  const shortcut = useSearchShortcut(inputRef)

  const chips: Chip<KindChoice>[] = [
    {
      count: totalCount,
      icon: <GridIcon />,
      id: ALL_KINDS,
      label: translate('kind.all')
    },
    ...EXPORT_KINDS.filter((kind) => kindCounts[kind] > 0).map((kind) => ({
      count: kindCounts[kind],
      icon: <ExportKindIcon kind={kind} />,
      id: kind,
      label: translate(`kind.${kind}`)
    }))
  ]

  return (
    <search className='export-toolbar'>
      <SearchField
        inputRef={inputRef}
        label={translate('search.label')}
        onChange={setQuery}
        placeholder={translate('search.placeholder')}
        shortcut={shortcut}
        value={filter.query}
      />
      <div className='export-toolbar-filters'>
        <ChipGroup
          aria-label={translate('search.kinds')}
          chips={chips}
          onSelect={(choice) => setKind(choice === ALL_KINDS ? null : choice)}
          selectedId={filter.kind ?? ALL_KINDS}
        />
        <p aria-live='polite' className='export-toolbar-count'>
          {shownCount === totalCount
            ? translate('search.count', { count: totalCount })
            : translate('search.countOf', {
                count: shownCount,
                total: totalCount
              })}
        </p>
      </div>
    </search>
  )
}
