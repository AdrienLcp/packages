# @adrienlcp/browser

Small browser calls that each hide a trap. Every call the browser can refuse
returns a [`Result`](https://github.com/AdrienLcp/packages/tree/main/packages/result)
instead of throwing.

```bash
pnpm add @adrienlcp/browser
```

## Copying to the clipboard

```ts
import { copyText, selectContents } from '@adrienlcp/browser'

const copied = await copyText(email) // Result<void, 'refused'>

if (copied.status === 'failure') {
  selectContents(emailElement) // Result<void, 'unavailable'>
}
```

`navigator.clipboard` exists only in a secure context. A page served over
plain HTTP — a LAN address, a phone pointed at a laptop — has none, so
`copyText` falls back to selecting a hidden textarea and running
`execCommand('copy')`. When both are refused, `selectContents` leaves the text
selected for the reader to copy by hand.

## Handing a link to the share sheet

```ts
import { canShareLinks, shareLink } from '@adrienlcp/browser'

if (canShareLinks()) {
  const shared = await shareLink({ title, url }) // Result<void, 'closed' | 'unavailable'>
}
```

Phones have a share sheet and most desktops do not, so draw the control only
where `canShareLinks()` says so. `navigator.share` rejects when the sheet is
put away; that comes back as `'closed'`, which means nothing was sent and is
not an error worth showing.

## Reduced motion

```ts
import { prefersReducedMotion } from '@adrienlcp/browser'

element.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth' })
```

`false` where there is no `matchMedia`, as on a server.

## Reading a duration token

```ts
import { readDurationSeconds } from '@adrienlcp/browser'

const turn = readDurationSeconds(figure, '--turn') // 0.25
figure.animate(keyframes, { duration: turn * 1000 })
```

A script that times a motion reads the token the stylesheet holds instead of
a copy of it. Register the property as a `<time>`:

```sass
@property --turn
  syntax: '<time>'
  inherits: true
  initial-value: 0s
```

Registered, the browser computes it to one duration whatever `calc()` or
`var()` wrote it, so a token `reduced-motion.css` collapses to `0ms` reaches
the script as `0`. Unregistered, `getComputedStyle` hands back the text as
written. An unset property, or one that does not read as a duration, is `0`.

## Reloading the page

```tsx
import { reloadPage } from '@adrienlcp/browser'

<Button onPress={reloadPage}>Reload</Button>
```

Does nothing where there is no `location`, as on a server.

## Keeping the screen awake

```tsx
import { useScreenAwake } from '@adrienlcp/browser/react'

const Countdown = ({ isRunning }: { isRunning: boolean }) => {
  useScreenAwake(isRunning)
  // …
}
```

`useScreenAwake(isWanted)` holds the screen awake while `isWanted` is true and
the component is mounted. A browser releases a wake lock whenever the tab is
hidden and never takes it back; this takes it again every time the tab
returns. Where there is no Wake Lock API — before Safari 16.4, or outside a
secure context — it does nothing, and a request refused later — a phone low on
battery may refuse or revoke one at any moment — is retried on the next return
rather than reported.

Playing audio does not keep a screen awake: Chromium's media wake lock needs a
video track.

## Following a media query

```tsx
import { useMediaQuery } from '@adrienlcp/browser/react'

const Menu = () => {
  const isWide = useMediaQuery('(width >= 56.25rem)')
  // …
}
```

`useMediaQuery(query)` answers whether the screen matches `query` and renders
again when that changes — a window resized, a phone turned. It is false on the
server and through hydration, whose markup must match the server's: a
component with a wide and a narrow face renders the narrow one first there.
Write the query in `rem`, as the stylesheets' breakpoint is, so a raised font
size reaches both at the same width.

React is an optional peer dependency, needed only for these hooks.
