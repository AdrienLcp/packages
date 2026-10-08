# @adrienlcp/theme-preference

## 0.4.0

### Minor Changes

- 22f370c: `@adrienlcp/theme-preference/scheme` ships `dark` and `light` Sass mixins for a value `light-dark()` cannot carry, under the same precedence as `color-scheme.css`: the system preference unless `data-theme` says otherwise.

## 0.3.1

### Patch Changes

- 5e76b8b: Point each package homepage to its entry on adrienlcp.com
- Updated dependencies [5e76b8b]
  - @adrienlcp/safe-storage@0.1.1

## 0.3.0

### Minor Changes

- 183c6d8: Read and write the stored preference through `@adrienlcp/safe-storage`, and type the Vite plugin with Vite's own `Plugin` (`vite` is an optional peer dependency). The hand-written `ThemePreferenceVitePlugin` type is gone.

## 0.2.0

### Minor Changes

- e92e6cc: Ship `color-scheme.css`: the system scheme by default, `data-theme` when a choice is stamped
