import {
  THEME_PREFERENCES,
  type ThemePreference
} from '@adrienlcp/theme-preference'
import { useThemePreference } from '@adrienlcp/theme-preference/react'
import type React from 'react'

import {
  DarkThemeIcon,
  LightThemeIcon,
  SystemThemeIcon
} from '@/presentation/components/icons'
import { ChoiceRail } from '@/presentation/components/ui/rail'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { themeStore } from './theme-store'

const THEME_ICONS = {
  dark: <DarkThemeIcon />,
  light: <LightThemeIcon />,
  system: <SystemThemeIcon />
} as const satisfies Record<ThemePreference, React.ReactNode>

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
