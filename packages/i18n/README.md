# @adrienlcp/i18n

A translation and formatting library for TypeScript, in five files, with **no
dependencies** and no tie to any framework. Everything it does at runtime it
does through the platform's `Intl`.

What makes it worth having a package of its own is one property: **the arguments a
message takes are read off the message itself, at compile time**, with no code
generation, no extraction step and no build plugin.

```ts
const EN = defineDictionary({ greeting: 'Hello {name}' })

translate('greeting', { name: 'Ada' }) // fine
translate('greeting') //             ✗ Expected 2 arguments, but got 1
translate('greeting', { nom: 'Ada' }) // ✗ 'nom' does not exist in type '{ name: string }'
translate('greting', { name: 'Ada' }) // ✗ not assignable to '"greeting"'
```

A second language is typed against the first, down to the placeholders inside
each message: a missing key, an invented key, a wrong plural table, a `{nom}`
written where the reference says `{name}` — each is a compile error rather than a
screen showing a raw placeholder to a user.

## Using it

```bash
pnpm add @adrienlcp/i18n
```

```ts
import { createI18n, defineDictionary } from '@adrienlcp/i18n'

const EN = defineDictionary({ greeting: 'Hello {name}' })

export const i18n = createI18n({
  defaultLocale: 'en',
  dictionaries: { en: EN, fr: () => import('./dictionary-fr') }
})

const translate = await i18n.load('fr')
translate('greeting', { name: 'Ada' }) // 'Bonjour Ada'
```

[`documentation.md`](documentation.md) is the documentation — syntax, type
guarantees, adding a locale, rich text, and the known limitations. Read that
one.

## Working on it

```bash
pnpm install                              # at the repository root
pnpm validate                             # typecheck + biome ci + vitest + build
pnpm --filter @adrienlcp/i18n test:watch  # this package alone
```

The suite runs in well under a second: it is pure TypeScript, with no browser and
no network — the one module a test imports late is a dictionary, so that a lazily
loaded locale is proved across a real module boundary.
`src/translator.types.test.ts` is worth knowing about — every rule this library
enforces is a *compile* error at a call site, and a compile error cannot be
caught by a test that has to compile, so each one is written there as the type it
resolves to and checked by `tsc`.

## Where it came from

It started as Web Dev Simplified's
[`intl-crash-course`](https://github.com/WebDevSimplified/intl-crash-course)
([video](https://www.youtube.com/watch?v=VbZVx13b2oY)): the `{name:type}`
placeholder syntax, `defineTranslation` and typed dot-path keys come from there.
This package adds relative-time and display-name placeholders, cross-locale
dictionary parity checks, rich text, locale negotiation and lazy loading, and
drops the React layer and the locale fallback cascade.

It grew apart in two projects, then was reunited in a repository of its own.
What changed along the way:
a plural `zero` form that actually fires, one-pass substitution (a repeated
placeholder used to be filled once, and a substituted value could be read back
as a placeholder), cross-locale key parity, a plural or enum written without its
alternatives refusing to compile, a locale registry that binds each language to
its dictionary once, negotiation that walks both up and down the tag,
`Intl` formatters built once instead of on every substitution, dictionaries a
locale can fetch rather than ship, rich text, and tests.
