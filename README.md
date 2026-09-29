# packages

Small TypeScript packages with no runtime dependencies outside this repository,
each one typed as far as the compiler lets it go.

| Package | What it is |
| --- | --- |
| [`@adrienlcp/browser`](packages/browser) | Browser calls that hide a trap: a clipboard copy that works over plain HTTP, a wake lock that survives the tab going away, the reduced-motion preference |
| [`@adrienlcp/i18n`](packages/i18n) | A typed translation library in five files, built on `Intl`: a message's arguments are read off the message at compile time |
| [`@adrienlcp/result`](packages/result) | A success-or-failure value with no exceptions and no nulls |
| [`@adrienlcp/safe-storage`](packages/safe-storage) | `localStorage` that never throws: every call returns a `Result`, and typed reads check what they find |
| [`@adrienlcp/theme-preference`](packages/theme-preference) | Light, dark or system theme with no flash on load, and a browser toolbar that follows the choice |

## Working on it

```bash
pnpm install
pnpm validate      # build + typecheck + biome ci + every package's tests
pnpm lint          # biome check --write
pnpm changeset     # describe a change; it ships with the next release
```

A merge to `main` with pending changesets opens a "Version packages" pull
request; merging that one publishes to npm from GitHub Actions, with
provenance.

## License

MIT
