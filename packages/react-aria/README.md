# @adrienlcp/react-aria

What every app of mine built on
[react-aria-components](https://react-spectrum.adobe.com/react-aria/) repeats,
kept in one version across them. Depends on `@adrienlcp/react` and `@adrienlcp/browser`; React 19 and
`react-aria-components` are peers, and Sass an optional one, for the focus
and sheet modules.

```bash
pnpm add @adrienlcp/react-aria
```

## Merging a `className`

```tsx
import { composeClassName } from '@adrienlcp/react-aria'
import { Button as AriaButton, type ButtonProps } from 'react-aria-components'

export const Button = ({ className, isWide, ...props }: ButtonProps & { isWide?: boolean }) => (
  <AriaButton {...props} className={composeClassName(className, 'button', isWide && 'wide')} />
)
```

react-aria lets `className` be a function of the component's render state, so
the merge is a function too, built on react-aria's own `composeRenderProps`: it
puts the component's own class names first, resolves the caller's against the
render state, and drops the falsy ones. It fits a react-aria component, never a
plain DOM element: there, `classNames` from `@adrienlcp/react` joins the same
class names into a string, and is what this merge runs once the state is known.

## The custom properties react-aria sets: `REACT_ARIA_TOKENS`

react-aria-components writes a few custom properties on the elements it
renders — `--trigger-width` on a popover, `--disclosure-panel-height`,
`--tab-panel-width`, `--tree-item-level`, `--visual-viewport-height` — which a
stylesheet reads but never declares. `findTokenFailures` from
`@adrienlcp/styles/audit` takes them as provided:

```ts
import { REACT_ARIA_TOKENS } from '@adrienlcp/react-aria'
import { findTokenFailures } from '@adrienlcp/styles/audit'

expect(findTokenFailures(SOURCES, { provided: REACT_ARIA_TOKENS })).toEqual([])
```

A test reads react-aria's build and fails when a release adds or drops one.

## A focus ring: `focus`

`ring` and `ring-inset` draw the outline on `[data-focus-visible]`, which
react-aria stamps on keyboard focus only, and on `:focus-visible`, for a native
element. A control built over a hidden input — a switch, a checkbox — only
rings through the attribute, since the focused element is the invisible input.

```sass
@use '@adrienlcp/react-aria/focus'

.button
  @include focus.ring

  &[data-hovered]:not([data-disabled])
    background: var(--hover)
```

`ring-inset` draws inside the box, for an element a clipping ancestor would
cut. Both take `$on`, a selector that draws the ring on a descendant of the
focused element — `focus.ring('.track')` for a `Switch`, whose root takes the
focus. `ring-within` rings a box while a field inside it has focus: a
`SearchField`'s `Group` around its input and its clear button. `ring` and
`ring-within` take `$offset` for one ring closer than the configured one.
`ring-focusables`, included once at the root of the base layer, rings every
element that takes focus at zero specificity — never `*`, since a `Group` or a
`Select` root stamps `data-focus-visible` while the control inside holds the
focus, and would ring beside it. It skips the input `VisuallyHidden` clips
under a `Switch`, a `Checkbox` or a `Radio`: the visible control rings
through `$on`. Configure the ring once, in the app's own `_focus.sass`, and have
components `@use` that file:

```sass
@forward '@adrienlcp/react-aria/focus' with ($ring-color: var(--focus), $ring-offset: 3px, $ring-width: 3px)
```

`$ring-width` (`2px`), `$ring-color` (`currentColor`) and `$ring-offset`
(`3px`) are the defaults. There is no hover mixin: react-aria's
`[data-hovered]` already ignores the hover a touch screen emulates after a tap,
so a hover style is a plain `&[data-hovered]` rule.

Resolved through the `sass` export condition, which Vite reads; with the Sass
CLI, use `pkg:@adrienlcp/react-aria/focus` and `--pkg-importer=node`.

## A popover that becomes a sheet: `PopoverSheet`

```tsx
import { PopoverSheet } from '@adrienlcp/react-aria'
import { Button, Dialog, DialogTrigger } from 'react-aria-components'

const WIDE_SCREEN_QUERY = '(width >= 56.25rem)'

export const Menu = () => (
  <DialogTrigger>
    <Button aria-label='Menu'>…</Button>
    <PopoverSheet className='menu' placement='bottom end' wideQuery={WIDE_SCREEN_QUERY}>
      <Dialog aria-label='Menu'>…</Dialog>
    </PopoverSheet>
  </DialogTrigger>
)
```

`PopoverSheet` takes the place of a `Popover` inside a `DialogTrigger`. On a
screen that answers `wideQuery` — the app's own breakpoint, in `rem` like its
stylesheets' — it is a popover beside the trigger, taking `placement` and
`maxHeight`. Below it, it is a sheet rising from the bottom edge over a scrim,
where a box hung from a corner is out of a thumb's reach: a press on the scrim
or Escape puts it away, and so does a pull on the `SheetGrabber` across its
top, past a quarter of its height or on a flick. A shorter pull settles back.
The `Dialog` inside is the caller's, the same on both faces.

The scrim reaches the screen's edge on a page that reserves its scrollbar's
room with `scrollbar-gutter: stable`: a fixed element never paints over that
gutter, so while the sheet is up the gutter becomes padding on the root, and
the page keeps its width.

The sheet is a plain `Modal` with its own rise in CSS rather than react-aria's
`Sheet`: that one enters through the browser's smooth scroll, whose length no
stylesheet sets, and at over half a second it reads as lag after the press.

The popover carries `sheet-popover` and the sheet `sheet`, inside a
`sheet-overlay`, each beside the `className` given. Before the first render on
a client the sheet is the face drawn: the media query is false on the server
and through hydration (`useMediaQuery` from `@adrienlcp/browser/react`).

`SheetGrabber` is exported for a sheet of the app's own — a modal that becomes
a centred card on a wide screen, say. It must be a direct child of the sheet: it
moves its parent through `--sheet-drag-offset`, which the sheet's rise ends
on, so a sheet let go leaves from where it was dropped. It calls `onDismiss`
and leaves the closing to the caller: `state.close` from a `Modal`'s render
props. Such a modal renders `ScrollbarGutterRelease` beside its content too,
for its scrim to cover the reserved gutter as the sheet's does:

```tsx
<Modal className='sheet-modal'>
  {({ state }) => (
    <>
      <ScrollbarGutterRelease />
      <SheetGrabber onDismiss={state.close} />
      <Dialog>{children}</Dialog>
    </>
  )}
</Modal>
```

## The sheet's styles: `sheet`

The structure ships as Sass; the look — the sheet's ground, its radius, shadow
and padding, the popover's whole surface — stays the app's, on the
`className` it passes. Include the rules once, in the components layer:

```sass
@use '@adrienlcp/react-aria/sheet'

@layer components
  @include sheet.styles

  .menu
    background: var(--ground)
    border-start-end-radius: var(--radius-sheet)
    border-start-start-radius: var(--radius-sheet)
```

`styles` writes `.sheet-overlay`, `.sheet` and `.sheet-grabber` and the
`sheet-rise` and `sheet-scrim` keyframes. The mixins under them — `overlay`,
`surface`, `grabber` and `keyframes` — style a sheet of the app's own under
its own class names. The overlay is held to the visual viewport react-aria
measures, so a field focused inside the sheet lifts it above the software
keyboard. The grabber takes the sheet's background, so content scrolls under
it out of sight.

Each default reads the token an app built on `@adrienlcp/styles` declares,
with a fallback where there is none: `$scrim` (`--scrim`), `$enter` and
`$exit` (`--transition-base`, `--transition-fast`), `$easing`
(`--ease-out`), `$top-gap`, the strip the tallest sheet leaves above it
(`--space-2xl`), `$grabber-color` (`--rule-strong`) and `$grabber-radius`
(`--radius-full`). `$z-index` is `10`. Configure them once, in the app's own
`_sheet.sass`, and `@use` that file:

```sass
@forward '@adrienlcp/react-aria/sheet' with ($z-index: 3, $grabber-radius: var(--radius-control))
```

Resolved through the `sass` export condition, like `focus`.
