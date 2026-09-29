# packages

Small TypeScript packages with no runtime dependencies, each one typed as far
as the compiler lets it go.

| Package | What it is |
| --- | --- |
| [`@adrienlcp/i18n`](packages/i18n) | A typed translation library in five files, built on `Intl`: a message's arguments are read off the message at compile time |
| [`@adrienlcp/result`](packages/result) | A success-or-failure value with no exceptions and no nulls |

## Working on it

```bash
pnpm install
pnpm validate      # typecheck + biome ci + every package's tests + build
pnpm lint          # biome check --write
pnpm changeset     # describe a change; it ships with the next release
```

A merge to `main` with pending changesets opens a "Version packages" pull
request; merging that one publishes to npm from GitHub Actions, with
provenance.

## License

MIT
