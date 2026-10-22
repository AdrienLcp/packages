import type { ThemePreference } from '@adrienlcp/theme-preference'
import type React from 'react'

import {
  DarkThemeIcon,
  LightThemeIcon,
  SystemThemeIcon
} from '@/presentation/components/icons'

export const THEME_ICONS = {
  dark: <DarkThemeIcon />,
  light: <LightThemeIcon />,
  system: <SystemThemeIcon />
} as const satisfies Record<ThemePreference, React.ReactNode>
