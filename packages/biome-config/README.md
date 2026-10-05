# @adrienlcp/biome-config

Biome lint and format settings: single quotes, no semicolons, no trailing
commas, space indentation, sorted keys, attributes, CSS properties and imports,
`noFloatingPromises` as an error, `console.log` refused (`debug`, `info`,
`warn`, `error` stay allowed), and no cast of any kind.

```bash
pnpm add -D @biomejs/biome @adrienlcp/biome-config
```

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.14/schema.json",
  "extends": ["@adrienlcp/biome-config", "@adrienlcp/biome-config/react"]
}
```

| Entry | For |
| --- | --- |
| `@adrienlcp/biome-config` | Any project |
| `@adrienlcp/biome-config/react` | Adds Biome's `react` domain; list it after the base |

The `biome.json` that extends the package must sit next to the `node_modules`
holding it — the project or workspace root. Biome resolves the plugins below
from there, not from the package.

Imports are grouped URL → Node → packages → `@/` alias → relative paths, with a
blank line between groups.

## Overriding

A key set in the project wins. Two lists behave differently:

- **`files.includes` adds to the shared list**, which already starts with the
  catch-all `**`: a project lists only its own exclusions, and never repeats
  `**` — a second catch-all after `!**/dist` would include `dist` again.

  ```json
  {
    "extends": ["@adrienlcp/biome-config"],
    "files": { "includes": ["!**/dev-dist"] }
  }
  ```

- **The import `groups` replace the shared ones whole**: a workspace that adds
  a tier per package writes the entire list.

## No cast, ever

A cast tells the compiler to stop checking. Narrow with a type guard, parse
with a schema, or give the function a better signature instead.

| Form | Refused by |
| --- | --- |
| `value as Type`, `value as unknown as Type`, `<Type>value` | `nursery/noUnsafeTypeAssertion` |
| `value!` | `style/noNonNullAssertion` |
| `// @ts-ignore` | `suspicious/noTsIgnore` |
| `// @ts-expect-error` | `plugins/no-ts-expect-error.grit` |
| `// biome-ignore …` | `plugins/no-biome-ignore.grit` |

`as const` and `satisfies` stay allowed.

Biome's plugins cannot read comments, so the two `.grit` plugins search the
file's text instead, with two limits:

- **The diagnostic points at the file**, not at the comment's line.
- **A comment above the file's first statement escapes them**, since Biome
  leaves it out of the text a plugin sees. That is where `biome-ignore-all`
  goes.

The plugins are listed as
`./node_modules/@adrienlcp/biome-config/plugins/*.grit`, a path Biome reads
from the root configuration. A project's own `plugins` list adds to them and
cannot remove one.
