# @adrienlcp exports

Every name the packages export, read from their entry points. Written by `pnpm exports`; do not edit by hand.

Look here before writing a helper, a mixin or a hook: when one already does the job, import it.

## @adrienlcp/biome-config

Biome lint and format settings: single quotes, no semicolons, sorted keys and imports, no floating promises

### `@adrienlcp/biome-config`

- `@adrienlcp/biome-config` (file) [More](https://github.com/AdrienLcp/packages/blob/main/packages/biome-config/README.md#overriding)

### `@adrienlcp/biome-config/react`

- `@adrienlcp/biome-config/react` (file) [More](https://github.com/AdrienLcp/packages/blob/main/packages/biome-config/README.md#readme)

## @adrienlcp/browser

Browser calls that hide a trap: a clipboard copy that works over plain HTTP, a wake lock that survives the tab going away, the reduced-motion preference, a duration token read in seconds, a media query followed as the screen changes

### `@adrienlcp/browser`

- `copyText` (function) — Copies `text` to the clipboard. [More](https://github.com/AdrienLcp/packages/blob/main/packages/browser/README.md#copying-to-the-clipboard)
- `prefersReducedMotion` (function) — Whether the reader asked the system for less motion. [More](https://github.com/AdrienLcp/packages/blob/main/packages/browser/README.md#reduced-motion)
- `readDurationSeconds` (function) — A `<time>` custom property as `element` computes it, in seconds: what a script hands to the Web Animations API or a timer, read from the token the stylesheet already holds rather than a copy of it. [More](https://github.com/AdrienLcp/packages/blob/main/packages/browser/README.md#reading-a-duration-token)
- `reloadPage` (function) — Reloads the page, the way out a crash screen offers. [More](https://github.com/AdrienLcp/packages/blob/main/packages/browser/README.md#reloading-the-page)
- `selectContents` (function) — Selects everything inside `node`, so a reader can finish a refused copy with a keystroke. [More](https://github.com/AdrienLcp/packages/blob/main/packages/browser/README.md#copying-to-the-clipboard)

### `@adrienlcp/browser/react`

- `useMediaQuery` (hook) — Whether the screen answers `query` right now, following it as the window is resized or turned. [More](https://github.com/AdrienLcp/packages/blob/main/packages/browser/README.md#following-a-media-query)
- `useScreenAwake` (hook) — Holds the screen awake while `isWanted` is true and the component is mounted. [More](https://github.com/AdrienLcp/packages/blob/main/packages/browser/README.md#keeping-the-screen-awake)

## @adrienlcp/i18n

A typed i18n library in five files, with no dependencies, built on Intl

### `@adrienlcp/i18n`

- `DictionaryLoaderContext` (type) — What a loader is handed: a signal aborted once no caller wants the dictionary any more.
- `DictionaryLoader` (type) — A dictionary the bundler is told to split out — `() => import('./fr')`.
- `LoadOptions` (type) — What `load` takes beside the locale.
- `I18n` (type)
- `createI18n` (function) — Binds every locale to its dictionary once, so that afterwards a locale is all anyone passes. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/README.md#using-it)
- `Translator` (type)
- `FormatLocale` (type) — Where numbers and numeric dates take their shape from — the decimal separator, the hour cycle, the order of day and month.
- `PluralForms` (type) — A placeholder written `{name}` is text and takes a string.
- `RelativeTime` (type) — `Intl.RelativeTimeFormat` formats a number *of something*, and the message cannot say which — so the unit is declared here, per placeholder, and the caller passes the count alone.
- `TranslationOptions` (type)
- `OptionsFor` (type)
- `DefinedTranslation` (type)
- `defineTranslation` (function) — Pairs a message with what its placeholders need beyond the value itself. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/documentation.md#message-syntax)
- `Dictionary` (type) — A tree of messages for one locale: every leaf is a sentence, every branch a namespace. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/documentation.md#message-syntax)
- `WellFormed` (type) — A bare string is enough until a placeholder needs alternatives to choose between — and `{n:plural}` or `{n:enum}` written as one resolves to `never` here rather than putting the raw key on screen at runtime.
- `defineDictionary` (function) — The reference dictionary — the one every key and every value is typed from. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/documentation.md#type-guarantees)
- `DictionaryFor` (type) — What a second locale owes the reference one: the same tree down to the same leaves, and for a leaf whose placeholders carry alternatives, its own alternatives in the same shape. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/documentation.md#adding-a-locale)
- `MatchingDictionary` (type) — What a second locale owes the reference beyond its shape: the same placeholders, in the same message.
- `DotPath` (type) — Every leaf, as the dotted path that reaches it. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/documentation.md#known-limitations)
- `LeafAt` (type)
- `FormattableDate` (type) — What a `{x:date}` placeholder takes: a `Date`, or a `Temporal.Instant`, `Temporal.PlainDate`, `Temporal.PlainDateTime`, `Temporal.PlainTime` or `Temporal.ZonedDateTime`, handed to `Intl.DateTimeFormat` as they are. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/documentation.md#message-syntax)
- `ValuesFor` (type)
- `RichValuesFor` (type) — What a rich rendering asks for: the message's values, plus one function per marked span.
- `PlainKey` (type) — A key whose message carries no placeholder, so it renders from nothing but itself. [More](https://github.com/AdrienLcp/packages/blob/main/packages/i18n/documentation.md#type-guarantees)
- `ParameterizedKey` (type)

## @adrienlcp/measure-font

A dev-time bin that measures a self-hosted font against Arial for the fallback faces of @adrienlcp/styles — per weight and width, over the app's own text, its dictionaries or its prerendered pages, with the digits apart and the ratio range that keeps each edge line wrapped — and converts a ch to em

## @adrienlcp/prerender

Build-time helpers that turn a Vite app's shell into one prerendered document per page: the rendered head moved where it belongs, language alternates, the page's stylesheets inlined without Vite linking them again, its fonts preloaded as chosen

### `@adrienlcp/prerender`

- `BuildChunk` (type) — What Vite emitted for one source module: its file, its stylesheets, the chunks it imports statically.
- `BuildManifest` (type) — Vite's build manifest, keyed by source module relative to the project root, such as `src/pages/home.tsx`.
- `readBuildManifest` (function) — The manifest of the client build in `clientDir`, built with `build.manifest: true`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `FontPreloadSelection` (type) — Which faces to preload: a pattern of their URLs, several in the order to ask for them, or `'none'`.
- `addFontPreloads` (function) — Preloads the faces the page's inlined CSS declares whose URL `include` matches. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `setMetaContents` (function) — Every `setMeta` in one call, keyed by the attribute that names each tag. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `originOfCanonical` (function) — The canonical link is the one place a host is written down. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `parseDocument` (function) — `html` parsed into a DOM, to edit through elements rather than with patterns over its text. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `serializeDocument` (function) — The document printed back, doctype and comments included. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `htmlFileForPath` (function) — Where a static host looks for a path's document: `/en` → `en.html`, `/fr/about` → `fr/about.html`, `/` → `index.html`, `/docs/` → `docs/index.html`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `inlinePageStylesheets` (function) — Replaces the stylesheets the shell links with one `<style>` holding them and the stylesheets of `modules` and of every chunk they import statically, in cascade order. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `LanguageVersion` (type) — One language a page exists in.
- `writeLanguageVersions` (function) — Points the canonical link at `current`, and lists every language the page exists in: an `hreflang` alternate each, `current` included since search engines only trust links that are reciprocal, plus `x-default` when given. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `renderIntoShell` (function) — Writes the server-rendered `html` into the shell's `root`, and moves what React rendered ahead of the page — its `<title>`, its `<meta>` tags, the resources it asks for — into the head. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)
- `appendStructuredData` (function) — Appends `data` to the head as JSON-LD. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#one-document-per-page)

### `@adrienlcp/prerender/vite`

- `shellHead` (function) — Writes one page's head into the shell, `index.html`, so the document `pnpm dev` and the SPA fallback serve carries real copy rather than an empty title. [More](https://github.com/AdrienLcp/packages/blob/main/packages/prerender/README.md#the-shells-own-head)

## @adrienlcp/react

Generic React helpers: a context that names its missing provider and a class name join

### `@adrienlcp/react`

- `PlainClassName` (type) — A class name, or a falsy value standing for none.
- `classNames` (function) — Joins class names with a space, dropping the falsy ones: `classNames('icon', className, isWide && 'wide')`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react/README.md#joining-class-names-classnames)
- `createSafeContext` (function) — `[Context, useSafeContext, useOptionalContext]` for one value. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react/README.md#a-context-that-names-its-missing-provider)

## @adrienlcp/react-aria

What every react-aria app of mine repeats: a className merge that follows the render state, a Sass focus ring on data-focus-visible, and a popover that turns into a sheet rising from the bottom of a narrow screen, with the grabber that pulls it down

### `@adrienlcp/react-aria`

- `ClassNameRenderProps` (type) — The render state react-aria hands a `className` function.
- `composeClassName` (function) — Merges a component's own class names with the `className` its caller passed. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#merging-a-classname)
- `PopoverSheetProps` (type)
- `PopoverSheet` (component) — What a trigger opens, in the place of a `Popover` inside a `DialogTrigger`: a popover beside the trigger on a screen that answers `wideQuery`, a sheet rising from the bottom edge below it, where a box hung from a corner is out of a thumb's reach. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-popover-that-becomes-a-sheet-popoversheet)
- `REACT_ARIA_TOKENS` (constant) — The custom properties react-aria-components sets at runtime on the elements it renders, which an app's stylesheets read but never declare: a popover's `--trigger-width`, a disclosure panel's `--disclosure-panel-height`, a tree item's `--tree-item-level`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-custom-properties-react-aria-sets-react_aria_tokens)
- `SheetGrabberProps` (type)
- `SheetGrabber` (component) — The strip across the top of a sheet that a thumb pulls it down by: past a quarter of the sheet's height, or on a flick, it calls `onDismiss`; short of that, the sheet settles back. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-popover-that-becomes-a-sheet-popoversheet)

### `@adrienlcp/react-aria/focus`

- `$ring-width` (sass) — Configure once, in the app's own `_focus.sass`: `@forward '@adrienlcp/react-aria/focus' with ($ring-color: var(--focus))`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-focus-ring-focus)
- `$ring-color` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-focus-ring-focus)
- `$ring-offset` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-focus-ring-focus)
- `ring` (sass) — react-aria stamps `data-focus-visible` on keyboard focus only, and on the element it styles: a control built over a hidden input rings through it alone. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-focus-ring-focus)
- `ring-inset` (sass) — The ring drawn inside the box, for an element a clipping ancestor would cut. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-focus-ring-focus)
- `ring-within` (sass) — The ring drawn on a box while the field inside it has focus — a `SearchField`'s `Group` around its input and its clear button. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-focus-ring-focus)
- `ring-focusables` (sass) — The ring every element that takes focus draws by default, at zero specificity so a component's own ring wins. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#a-focus-ring-focus)

### `@adrienlcp/react-aria/sheet`

- `$z-index` (sass) — Configure once, in the app's own `_sheet.sass`: `@forward '@adrienlcp/react-aria/sheet' with ($z-index: 3)`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `$scrim` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `$enter` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `$exit` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `$easing` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `$top-gap` (sass) — The strip of screen the tallest sheet leaves above it, for a press that closes it. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `$grabber-color` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `$grabber-radius` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `overlay` (sass) — The scrim a sheet rises over, holding it to the bottom edge. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `surface` (sass) — The sheet itself: the screen's width, scrolling inside past the screen's height, following the thumb on its grabber and settling back from where a short pull let go. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `grabber` (sass) — The strip a thumb pulls the sheet down by, held at the top while the sheet scrolls under it, on the sheet's own background. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `keyframes` (sass) — The rise ends where the thumb left the sheet, so a sheet pulled down leaves from there. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)
- `styles` (sass) — The rules `PopoverSheet` and `SheetGrabber` need, included once in the app's components layer. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-aria/README.md#the-sheets-styles-sheet)

## @adrienlcp/react-router

react-aria links that navigate through react-router: a RouterProvider wired to useNavigate, external URLs left alone, NavigateOptions typed on every link

### `@adrienlcp/react-router`

- `AriaRouterProviderProps` (type)
- `AriaRouterProvider` (component) — react-aria's `RouterProvider` wired to react-router: an `href` on any react-aria `Link`, `MenuItem` or `ListBoxItem` below it becomes a client-side navigation instead of a page load, its `routerOptions` are forwarded to `navigate`, and an external URL is left as it is. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-router/README.md#links-that-navigate-on-the-client)
- `ignoreSupersededNavigation` (function) — A navigation superseded by the next one rejects with `AbortError`, more often with view transitions on: expected control flow, not a failure. [More](https://github.com/AdrienLcp/packages/blob/main/packages/react-router/README.md#ignoresupersedednavigation)

## @adrienlcp/result

A success-or-failure value with no exceptions and no nulls

### `@adrienlcp/result`

- `FailureResult` (type)
- `Result` (constant) [More](https://github.com/AdrienLcp/packages/blob/main/packages/result/README.md#readme)

## @adrienlcp/safe-storage

localStorage that never throws: every read, write and removal returns a Result, and typed reads check what they find

### `@adrienlcp/safe-storage`

- `readRecognizedText` (function) — The text stored under `key`, narrowed by `isRecognized` — a locale, a theme, any closed set of strings. [More](https://github.com/AdrienLcp/packages/blob/main/packages/safe-storage/README.md#reading)
- `readStoredJson` (function) — The JSON stored under `key`, parsed and narrowed by `isValue`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/safe-storage/README.md#reading)
- `readStoredText` (function) — The text stored under `key`, or `null` when nothing is: an absence, never a failure. [More](https://github.com/AdrienLcp/packages/blob/main/packages/safe-storage/README.md#reading)
- `removeStored` (function) — Removes whatever is stored under `key`; a missing key is not a failure. [More](https://github.com/AdrienLcp/packages/blob/main/packages/safe-storage/README.md#writing-and-removing)
- `StorageUnavailable` (type) — `localStorage` threw on access: a Safari private window, storage blocked by the user or a policy, or no `localStorage` at all, as on a server.
- `StoredValueUnrecognized` (type) — Something is stored under the key, but not a value the caller recognizes.
- `StorageQuotaExceeded` (type) — The browser refused the write because the origin's storage is full.
- `StorageReadError` (type)
- `StorageWriteError` (type)
- `writeStoredJson` (function) — Stores `value` as JSON under `key`, refused like `writeStoredText`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/safe-storage/README.md#writing-and-removing)
- `writeStoredText` (function) — Stores `text` under `key`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/safe-storage/README.md#writing-and-removing)

## @adrienlcp/styles

A reset, a reduced-motion switch, default tokens, Sass mixins for self-hosted fonts, container queries, a breakpoint, visually hidden text, a skip link that clears the notch, a fluid size in rem, a spin animation, a PostCSS plugin that lists Arial's metric twins in fontaine's fallback faces, and checks for WCAG contrast between colour tokens, for sizes the user's font size cannot reach, for font tokens that skip their fallback face, for fallback bands that miss a weight and for SVG text that names a family

### `@adrienlcp/styles/accessibility`

- `visually-hidden` (sass) — Hidden from sight, still read aloud: a label the layout says without words, a column header a table needs for a screen reader only. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#accessibility)
- `skip-link` (sass) — A skip link parked above the viewport that slides in on keyboard focus. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#accessibility)

### `@adrienlcp/styles/audit`

- `StyleFailure` (type) — A declaration that breaks a stylesheet rule, with the line it sits on (1-based).
- `UnitFailure` (type)
- `TypeLiteral` (type)
- `UnnamedValue` (type)
- `FallbackFailure` (type) — A font token naming a web font that fontaine's fallback face never follows.
- `UnreadFontFace` (type) — A face whose family or weight bands the audit cannot read, so no check reaches it.
- `FontAttributeFailure` (type) — A `font-family` attribute or style key in markup that names no font token.
- `FallbackBandFailure` (type) — A weight or a style the fallback faces drawn per band miss, or a band nothing sets.
- `TokenFailure` (type) — A custom property read or declared under a name that breaks the shared set.
- `TokenAuditOptions` (type) — What a project's sources rely on beyond their own declarations.
- `findUnitFailures` (function) — Lists every size in a stylesheet that the user's font size cannot reach: a `px` text size, spacing, box size, offset or translation — a `transform`'s `translate*()` included —, a `px` custom property outside the families drawn in pixels (`--stroke-*`, `--outline-*`, `--radius-*`, `--shadow-*`, `--target`), a text size driven by the viewport with no rem part (each `pixels` or `viewport-without-rem`), a size, a grid track or a custom property in `ch` (`ch`) — the width of the font's zero, which the fallback face and the web font draw differently, so the box changes when one replaces the other —, an outline width that is not a whole number of pixels (`fractional-outline`) — Chromium draws an outline in whole device pixels, so a `2.5px` ring is `2px` on a 1x screen. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `findTypeLiterals` (function) — Lists every `font-weight`, `line-height` and `letter-spacing` written as a literal. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `findUnnamedValues` (function) — Lists every radius (`radius`), every transition or animation duration and delay (`duration`) and every `font-size` (`text-size`) written as a literal instead of a `--radius-*`, `--transition-*` or `--text-*` token — a literal duration is one `reduced-motion.css` cannot reach. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `findTokenFailures` (function) — Lists the custom properties an app gets wrong across all its sources — the stylesheets and the scripts that set a property through `style`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `webFontFamilies` (function) — The families a project self-hosts, read from its stylesheets: every `fonts.font-face` include, every `fonts.fallback-faces` include, every `@font-face` with a `url()` source, and the family of every hand-written `<family> fallback` face. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `findUnreadFontFaces` (function) — Lists every face in a stylesheet whose family (`unread-family`) or `$widths` bands (`unread-weights`) the audit cannot read — a family built in an `@each` loop, a `$widths` map from another module —: no fallback check reaches it, and a font token that skips its fallback face passes unseen. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `findFallbackFailures` (function) — Lists every custom property whose font stack names a web font without `'<family> fallback'` right after it (`missing-fallback`). [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `findFallbackBandFailures` (function) — Checks the fallback faces `fonts.fallback-faces` draws per weight band against what the stylesheets set — fontaine's own faces copy every `@font-face`, and are not read. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)
- `findFontAttributeFailures` (function) — Lists every `font-family` attribute (`.svg`), `fontFamily` prop or style key (`.tsx`) and inline `font-family:` that names a family instead of a font token (`font-attribute`). [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#audit)

### `@adrienlcp/styles/breakpoints`

- `$wide-screen` (sass) — Where a screen stops being a phone's, in rem: a media query reads rem off the browser's font size, so a user who raises it gets the narrow layout sooner. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#breakpoints)
- `wide` (sass) — `wide` and `narrow` are exact complements: every width is one or the other. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#fonts)
- `narrow` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#breakpoints)

### `@adrienlcp/styles/containers`

- `container` (sass) — Makes the element a container its descendants query by inline size. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#containers)
- `container-wide` (sass) — Matches when the nearest container — or the one named — is at least `$width` wide. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#containers)
- `container-narrow` (sass) — The exact complement of `container-wide` for the same `$width` and `$name`. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#containers)

### `@adrienlcp/styles/contrast`

- `ColorScheme` (type)
- `TokenError` (type)
- `WCAG_AA` (constant) — WCAG 2.2 level AA minimum contrast ratios. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#contrast)
- `ContrastPair` (type) — Two tokens that meet on screen, named as declared: `{ foreground: '--ink', background: '--ground', minimum: WCAG_AA.text }`.
- `ContrastFailure` (type)
- `findContrastFailures` (function) — Every pair below its minimum, in either scheme, read straight from the stylesheet that declares the tokens. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#contrast)

### `@adrienlcp/styles/fonts`

- `$latin` (sass) — The two subsets Google Fonts cuts a Latin face into: a page in English or French downloads the first file only. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#fonts)
- `$latin-ext` (sass) [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#fonts)
- `font-face` (sass) — One self-hosted `woff2` file. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#fonts)
- `fallback-faces` (sass) — A fallback face per weight band of a variable web font, Arial scaled to the font's width at that band's weight, named `<family> fallback` as fontaine names its own. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#fonts)

### `@adrienlcp/styles/metric-twins`

- `MetricTwins` (type) — The fonts each one is widened to, keyed by the font a fallback face names.
- `MetricTwinsOptions` (type)
- `MetricTwinsPlugin` (type) — A PostCSS plugin, typed on the slice it reads: postcss is Vite's dependency, not the app's.
- `metricTwins` (constant) — The PostCSS plugin that widens the `src` of every `@font-face` naming one local font with metric twins to all of them. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#metric-twins)

### `@adrienlcp/styles/motion`

- `spin` (sass) — Turns the element a full circle, again and again: a spinner, a sync icon. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#motion)

### `@adrienlcp/styles/reduced-motion.css`

- `@adrienlcp/styles/reduced-motion.css` (file) [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#plain-css)

### `@adrienlcp/styles/reset.css`

- `@adrienlcp/styles/reset.css` (file) [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#plain-css)

### `@adrienlcp/styles/sizes`

- `fluid()` (sass) — A size that grows with the viewport from `$min` at `$from` to `$max` at `$to`, and holds still outside: [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#sizes)

### `@adrienlcp/styles/tokens`

- `defaults` (sass) — The tokens every app names the same way, at values that hold until the app sets its own. [More](https://github.com/AdrienLcp/packages/blob/main/packages/styles/README.md#tokens)

## @adrienlcp/theme-preference

Light, dark or system theme with no flash on load, and a browser toolbar that follows the choice, and Sass mixins for a value per theme that light-dark() cannot carry

### `@adrienlcp/theme-preference`

- `applyThemePreference` (function) — Stamps `data-theme` on `<html>` for an explicit scheme, removes it for `'system'` so the stylesheet's `prefers-color-scheme` rules answer, and points every `theme-color` tag at the same palette.
- `THEME_PREFERENCES` (constant)
- `ThemePreference` (type) — What the visitor chose.
- `isThemePreference` (function)
- `ThemePreferenceStore` (type)
- `createThemePreferenceStore` (function) — One store per page, so every switch showing the theme reads the same choice. [More](https://github.com/AdrienLcp/packages/blob/main/packages/theme-preference/README.md#the-store)

### `@adrienlcp/theme-preference/color-scheme.css`

- `@adrienlcp/theme-preference/color-scheme.css` (file) [More](https://github.com/AdrienLcp/packages/blob/main/packages/theme-preference/README.md#the-markup)

### `@adrienlcp/theme-preference/react`

- `useThemePreference` (hook) — The store's preference, re-rendering every component that shows it when it changes. [More](https://github.com/AdrienLcp/packages/blob/main/packages/theme-preference/README.md#react)

### `@adrienlcp/theme-preference/scheme`

- `dark` (sass) — A value `light-dark()` cannot carry — a percentage, a length, a shadow's geometry, an image — set per theme with the same precedence as `color-scheme.css`: the explicit choice stamped in `data-theme` beats the system preference. [More](https://github.com/AdrienLcp/packages/blob/main/packages/theme-preference/README.md#the-markup)

### `@adrienlcp/theme-preference/vite`

- `themePreferencePlugin` (function) — Appends the pre-paint script to the `<head>` of every page Vite serves or builds, after the `theme-color` tags. [More](https://github.com/AdrienLcp/packages/blob/main/packages/theme-preference/README.md#before-the-first-paint)

## @adrienlcp/tsconfig

The strictest TypeScript settings, for a type-check-only project bundled by something else

### `@adrienlcp/tsconfig/base.json`

- `@adrienlcp/tsconfig/base.json` (file) [More](https://github.com/AdrienLcp/packages/blob/main/packages/tsconfig/README.md#readme)

### `@adrienlcp/tsconfig/web-app.json`

- `@adrienlcp/tsconfig/web-app.json` (file) [More](https://github.com/AdrienLcp/packages/blob/main/packages/tsconfig/README.md#readme)
