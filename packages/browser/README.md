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

## Keeping the screen awake

```ts
import { keepScreenAwake } from '@adrienlcp/browser'

const kept = keepScreenAwake() // Result<() => void, 'unsupported'>

if (kept.status === 'success') {
  stopKeepingAwake = kept.data
}
```

A browser releases a wake lock whenever the tab is hidden and never takes it
back; this takes it again every time the tab returns, until the returned
function is called. `'unsupported'` is no Wake Lock API: before Safari 16.4,
or outside a secure context. A request refused later — a phone low on battery
may refuse or revoke one at any moment — is retried on the next return rather
than reported.

Playing audio does not keep a screen awake: Chromium's media wake lock needs a
video track.

## Reduced motion

```ts
import { prefersReducedMotion } from '@adrienlcp/browser'

element.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth' })
```

`false` where there is no `matchMedia`, as on a server.
`subscribeToReducedMotion(listener)` follows a change and returns the
unsubscribe function.

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

## The first landing

```ts
import { endLanding } from '@adrienlcp/browser'

router.subscribe(({ navigation }) => {
  if (navigation.state !== 'idle') endLanding()
})
```

The shell's `<html data-landing>` lets `@adrienlcp/styles/motion`'s
`arriving` play its entrance on the page the visitor lands on, and on that
page only. `endLanding()` removes the attribute: call it on the router's first
navigation, and right before a `createRoot` that replaces prerendered markup,
which would otherwise play the entrance a second time over the same page.
`LANDING_ATTRIBUTE` is the attribute's name.

## Reloading the page

```tsx
import { reloadPage } from '@adrienlcp/browser'

<Button onPress={reloadPage}>Reload</Button>
```

Does nothing where there is no `location`, as on a server.

## React

```tsx
import { usePrefersReducedMotion, useScreenAwake } from '@adrienlcp/browser/react'

const Countdown = ({ isRunning }: { isRunning: boolean }) => {
  const isStill = usePrefersReducedMotion()
  useScreenAwake(isRunning)
  // …
}
```

`usePrefersReducedMotion` re-renders when the reader changes the preference and
reads `false` in a server render. `useScreenAwake(isWanted)` holds the screen
awake while `isWanted` is true and the component is mounted, and does nothing
where the API is missing. React is an optional peer dependency, needed only for
this entry.
