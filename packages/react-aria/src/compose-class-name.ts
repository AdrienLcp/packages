import { classNames, type PlainClassName } from '@adrienlcp/react'
import {
  type ClassNameOrFunction,
  composeRenderProps
} from 'react-aria-components'

/** The render state react-aria hands a `className` function. */
export type ClassNameRenderProps<RenderProps> = RenderProps & {
  defaultClassName: string | undefined
}

/**
 * Merges a component's own class names with the `className` its caller
 * passed. react-aria lets that `className` be a function of the render state,
 * so the merge is a function too — which is why it fits a react-aria
 * component and never a plain DOM element, where `classNames` from
 * `@adrienlcp/react` does.
 *
 * Falsy class names are dropped: `composeClassName(className, 'button', isWide && 'wide')`.
 */
export const composeClassName = <RenderProps>(
  incoming: ClassNameOrFunction<RenderProps> | undefined,
  ...ownClassNames: PlainClassName[]
): ((values: ClassNameRenderProps<RenderProps>) => string) =>
  composeRenderProps<
    string | undefined,
    ClassNameRenderProps<RenderProps>,
    string
  >(incoming, (resolved) => classNames(...ownClassNames, resolved))
