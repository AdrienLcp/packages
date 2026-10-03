import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Group,
  Link as ReactAriaLink,
  type LinkProps as ReactAriaLinkProps,
  SelectionIndicator,
  SharedElementTransition,
  ToggleButton,
  ToggleButtonGroup
} from 'react-aria-components'

import {
  ariaCurrentLeftOutOfLinkProps,
  restoreHrefLangDroppedByReactAria
} from './link-quirks'
import { VisuallyHidden } from './visually-hidden'

import './rail.sass'

export type RailItem<TId extends string> = {
  /** Drawn in the slot instead of `label`, which then only names it. */
  icon?: React.ReactNode
  id: TId
  /** Printed in the slot. */
  label: string
  lang?: string
  /** The slot's accessible name, when its print only abbreviates it. */
  name?: string
}

type RailProps = {
  'aria-label': string
  className?: string
}

type RailSlotLabelProps<TId extends string> = {
  item: RailItem<TId>
}

const RailSlotLabel = <TId extends string>({
  item
}: RailSlotLabelProps<TId>) => {
  if (item.icon !== undefined) {
    return (
      <>
        <span aria-hidden className='rail-slot-icon'>
          {item.icon}
        </span>
        <VisuallyHidden elementType='span'>
          {item.name ?? item.label}
        </VisuallyHidden>
      </>
    )
  }

  return item.name === undefined ? (
    <span className='rail-slot-label'>{item.label}</span>
  ) : (
    <>
      <span aria-hidden className='rail-slot-label'>
        {item.label}
      </span>
      <VisuallyHidden elementType='span'>{item.name}</VisuallyHidden>
    </>
  )
}

type ChoiceRailProps<TId extends string> = RailProps & {
  items: RailItem<TId>[]
  onSelect: (id: TId) => void
  selectedId: TId
}

/**
 * A row of slots with one inked: the ink sits on the choice in play and slides
 * to the next one picked.
 */
export const ChoiceRail = <TId extends string>({
  className,
  items,
  onSelect,
  selectedId,
  ...props
}: ChoiceRailProps<TId>) => (
  <ToggleButtonGroup
    {...props}
    className={composeClassName(className, 'rail')}
    disallowEmptySelection
    onSelectionChange={(keys) => {
      const picked = items.find((item) => keys.has(item.id))

      if (picked !== undefined) {
        onSelect(picked.id)
      }
    }}
    selectedKeys={[selectedId]}
    selectionMode='single'
  >
    {items.map((item) => (
      <ToggleButton
        className='rail-slot'
        id={item.id}
        key={item.id}
        lang={item.lang}
      >
        <SelectionIndicator className='rail-pawn' />
        <RailSlotLabel item={item} />
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)

export type LinkRailItem<TId extends string> = RailItem<TId> & {
  href: string
  hrefLang?: string
}

type LinkRailProps<TId extends string> = RailProps &
  Pick<ReactAriaLinkProps, 'routerOptions'> & {
    currentId: TId
    items: LinkRailItem<TId>[]
  }

/**
 * The same rail with a link in each slot, for choices that are places: the ink
 * marks the one on screen and slides when another is reached.
 */
export const LinkRail = <TId extends string>({
  className,
  currentId,
  items,
  routerOptions,
  ...props
}: LinkRailProps<TId>) => (
  <Group {...props} className={composeClassName(className, 'rail')}>
    <SharedElementTransition>
      {items.map((item) => {
        const isCurrent = item.id === currentId

        return (
          <ReactAriaLink
            {...ariaCurrentLeftOutOfLinkProps(isCurrent, 'true')}
            className='rail-slot'
            href={item.href}
            key={item.id}
            lang={item.lang}
            render={restoreHrefLangDroppedByReactAria(item.hrefLang)}
            routerOptions={routerOptions}
          >
            <SelectionIndicator className='rail-pawn' isSelected={isCurrent} />
            <RailSlotLabel item={item} />
          </ReactAriaLink>
        )
      })}
    </SharedElementTransition>
  </Group>
)
