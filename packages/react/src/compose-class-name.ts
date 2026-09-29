/**
 * A react-aria `className`: a string, or a function of the component's render
 * state. Written out so this package needs no react-aria dependency; it is
 * the same type as react-aria's own `ClassNameOrFunction`.
 */
export type ClassNameOrFunction<RenderProps> =
  | string
  | ((values: RenderProps & { defaultClassName: string | undefined }) => string)

/**
 * Merges a component's own class names with the `className` its caller
 * passed. react-aria lets that `className` be a function of the render state,
 * so the merge is a function too — which is why it fits a react-aria
 * component and never a plain DOM element, where a template literal does.
 *
 * Falsy class names are dropped: `composeClassName(className, 'button', isWide && 'wide')`.
 */
export const composeClassName =
  <RenderProps>(
    incoming: ClassNameOrFunction<RenderProps> | undefined,
    ...ownClassNames: (string | false | null | undefined)[]
  ): ((
    values: RenderProps & { defaultClassName: string | undefined }
  ) => string) =>
  (values) =>
    [
      ...ownClassNames,
      typeof incoming === 'function' ? incoming(values) : incoming
    ]
      .filter(Boolean)
      .join(' ')
