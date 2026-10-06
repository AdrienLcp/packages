# @adrienlcp/biome-config

## 0.2.1

### Patch Changes

- 5e76b8b: Point each package homepage to its entry on adrienlcp.com

## 0.2.0

### Minor Changes

- 4792968: Refuse every cast: `as Type`, `<Type>value`, the non-null `!`, `@ts-ignore`, and — through two GritQL plugins shipped in the package — `@ts-expect-error` and `biome-ignore` comments. `as const` and `satisfies` stay allowed. The extending `biome.json` must sit next to the `node_modules` that holds the package.

## 0.1.0

### Minor Changes

- 57f9c0d: First release: the TypeScript and Biome settings every project shares
