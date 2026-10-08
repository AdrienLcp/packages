# @adrienlcp/react-aria

What every app of mine built on
[react-aria-components](https://react-spectrum.adobe.com/react-aria/) repeats,
kept in one version across them. Depends on `@adrienlcp/react`; React 19 and
`react-aria-components` are peers, and Sass an optional one, for the focus
module.

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
