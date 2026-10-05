---
"@adrienlcp/biome-config": minor
---

Refuse every cast: `as Type`, `<Type>value`, the non-null `!`, `@ts-ignore`, and — through two GritQL plugins shipped in the package — `@ts-expect-error` and `biome-ignore` comments. `as const` and `satisfies` stay allowed. The extending `biome.json` must sit next to the `node_modules` that holds the package.
