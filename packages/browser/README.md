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
