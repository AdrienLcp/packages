/**
 * A class name, or a falsy value standing for none.
 *
 * A react-aria `className` function is not one: it needs the render state to
 * become a string, so it goes through `composeClassName` from
 * `@adrienlcp/react-aria`, and passing it here is a type error.
 */
export type PlainClassName = string | false | null | undefined

/**
 * Joins class names with a space, dropping the falsy ones:
 * `classNames('icon', className, isWide && 'wide')`.
 */
export const classNames = (...plainClassNames: PlainClassName[]): string =>
  plainClassNames.filter(Boolean).join(' ')
