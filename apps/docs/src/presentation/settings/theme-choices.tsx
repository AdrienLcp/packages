import {
  isThemePreference,
  THEME_PREFERENCES
} from '@adrienlcp/theme-preference'
import { useThemePreference } from '@adrienlcp/theme-preference/react'
import type React from 'react'
import { Label, Radio, RadioGroup } from 'react-aria-components'

import { CheckIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { THEME_ICONS } from '@/presentation/theme/theme-icons'
import { themeStore } from '@/presentation/theme/theme-store'

/** The theme as a settings list: one row per choice, the chosen one checked. */
export const ThemeChoices: React.FC = () => {
  const translate = useTranslate()
  const { preference, setPreference } = useThemePreference(themeStore)

  return (
    <RadioGroup
      className='settings-group'
      onChange={(value) => {
        if (isThemePreference(value)) {
          setPreference(value)
        }
      }}
      value={preference}
    >
      <Label className='settings-group-label'>
        {translate('settings.appearance')}
      </Label>
      <div className='settings-rows'>
        {THEME_PREFERENCES.map((themePreference) => (
          <Radio
            className='settings-row has-square'
            key={themePreference}
            value={themePreference}
          >
            <span className='settings-row-square'>
              {THEME_ICONS[themePreference]}
            </span>
            <span className='settings-row-label'>
              {translate(`settings.${themePreference}`)}
            </span>
            <CheckIcon className='settings-row-check' />
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}
