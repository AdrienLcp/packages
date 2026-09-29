# @adrienlcp/biome-config

Biome lint and format settings: single quotes, no semicolons, no trailing
commas, space indentation, sorted keys, attributes, CSS properties and imports,
`noFloatingPromises` as an error, and `console.log` refused (`debug`, `info`,
`warn`, `error` stay allowed).

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
