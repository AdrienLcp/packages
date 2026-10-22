import { PopoverSheet } from '@adrienlcp/react-aria'
import type React from 'react'
import { Button, Dialog, DialogTrigger, Heading } from 'react-aria-components'

import { SettingsIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { LocaleChoices } from './locale-choices'
import { SETTINGS_RAILS_QUERY } from './settings-rails-query'
import { ThemeChoices } from './theme-choices'

import './settings-sheet.sass'

/**
 * The theme and the language on a phone, where the header has no room for
 * their rails: a sheet rising from the bottom, pulled down by its grabber.
 * Wider, the rails stand in the header and this button is hidden.
 */
export const SettingsSheet: React.FC = () => {
  const translate = useTranslate()

  return (
    <DialogTrigger>
      <Button
        aria-label={translate('settings.open')}
        className='settings-trigger'
      >
        <SettingsIcon className='settings-trigger-icon' />
      </Button>
      <PopoverSheet
        className='settings-sheet-surface'
        placement='bottom end'
        wideQuery={SETTINGS_RAILS_QUERY}
      >
        <Dialog className='settings-sheet'>
          {({ close }) => (
            <>
              <Heading className='settings-sheet-title' slot='title'>
                {translate('settings.title')}
              </Heading>
              <ThemeChoices />
              <LocaleChoices onFollow={close} />
            </>
          )}
        </Dialog>
      </PopoverSheet>
    </DialogTrigger>
  )
}
