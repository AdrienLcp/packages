import { THEME_PREFERENCES } from '@adrienlcp/theme-preference'
import { useThemePreference } from '@adrienlcp/theme-preference/react'
import type React from 'react'

import { ChoiceRail } from '@/presentation/components/ui/rail'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { THEME_ICONS } from './theme-icons'
import { themeStore } from './theme-store'

export const ThemeSwitch: React.FC = () => {
  const translate = useTranslate()
  const { preference, setPreference } = useThemePreference(themeStore)

  return (
    <ChoiceRail
      aria-label={translate('theme.label')}
      className='theme-switch'
      items={THEME_PREFERENCES.map((themePreference) => ({
        icon: THEME_ICONS[themePreference],
        id: themePreference,
        label: translate(`theme.${themePreference}`)
      }))}
      onSelect={setPreference}
      selectedId={preference}
    />
  )
}
