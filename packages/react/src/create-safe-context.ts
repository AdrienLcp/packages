import { type Context, createContext, use } from 'react'

/**
 * `[Context, useSafeContext, useOptionalContext]` for one value.
 *
 * `useSafeContext` throws when no provider is mounted above, naming `name`:
 * a whole class of `undefined` bugs becomes one loud error pointing at the
 * provider that is missing. `useOptionalContext` answers `undefined` there
 * instead, for a component that also works on its own.
 *
 * ```tsx
 * const [ThemeContext, useTheme, useOptionalTheme] = createSafeContext<Theme>('ThemeContext')
 * ```
 */
export const createSafeContext = <Value>(
  name: string
): readonly [
  Context<Value | undefined>,
  () => Value,
  () => Value | undefined
] => {
  const SafeContext = createContext<Value | undefined>(undefined)

  SafeContext.displayName = name

  const useSafeContext = (): Value => {
    const value = use(SafeContext)

    if (value === undefined) {
      throw new Error(`${name} was read outside of its provider`)
    }

    return value
  }

  const useOptionalContext = (): Value | undefined => use(SafeContext)

  return [SafeContext, useSafeContext, useOptionalContext]
}
