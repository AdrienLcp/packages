import type React from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components'

import './chip-group.sass'

export type Chip<TId extends string> = {
  /** Shown after the label, quieter. */
  count: number
  icon: React.ReactNode
  id: TId
  label: string
}

type ChipGroupProps<TId extends string> = {
  'aria-label': string
  chips: readonly Chip<TId>[]
  onSelect: (id: TId) => void
  selectedId: TId
}

/** A row of filter pills, one raised: exactly one choice at a time. */
export const ChipGroup = <TId extends string>({
  chips,
  onSelect,
  selectedId,
  ...props
}: ChipGroupProps<TId>) => (
  <ToggleButtonGroup
    {...props}
    className='chip-group'
    disallowEmptySelection
    onSelectionChange={(keys) => {
      const picked = chips.find((chip) => keys.has(chip.id))

      if (picked !== undefined) {
        onSelect(picked.id)
      }
    }}
    selectedKeys={[selectedId]}
    selectionMode='single'
  >
    {chips.map((chip) => (
      <ToggleButton className='chip' id={chip.id} key={chip.id}>
        <span aria-hidden className='chip-icon'>
          {chip.icon}
        </span>
        {chip.label}
        <span className='chip-count'>{chip.count}</span>
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)
