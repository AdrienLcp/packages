---
'@adrienlcp/theme-preference': minor
---

Keep in the package only what projects use. Removed the `light` mixin from `@adrienlcp/theme-preference/scheme`, which no project used. No longer exported: `prePaintScriptFor` (the store's `prePaintScript` and the Vite plugin write it), `THEME_COLOR_SELECTOR`, `themeColorMediaFor`, `COLOR_SCHEMES`, `ColorScheme` and `isColorScheme`. `applyThemePreference` stays.
