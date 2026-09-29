# @adrienlcp/theme-preference

## 0.3.0

### Minor Changes

- 183c6d8: Read and write the stored preference through `@adrienlcp/safe-storage`, and type the Vite plugin with Vite's own `Plugin` (`vite` is an optional peer dependency). The hand-written `ThemePreferenceVitePlugin` type is gone.

## 0.2.0

### Minor Changes

- e92e6cc: Ship `color-scheme.css`: the system scheme by default, `data-theme` when a choice is stamped
