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
cut. Configure the ring once, in the app's own `_focus.sass`, and have
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
